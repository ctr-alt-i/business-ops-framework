import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

import { FixtureMeetingAnalyzer } from "../../src/adapters/analysis";
import type { RawSourceKind } from "../../src/core/types";
import { ingestSource } from "../../src/modules/ingest";
import { loadWorkspace } from "../../src/modules/workspace";
import {
  compareFiles,
  readAnalysisArtifact,
  relativeFromRepo,
  validateAnalysisArtifact,
  type EvalAssertion,
} from "./shared";

interface IngestSuiteManifest {
  name: string;
  description?: string;
  fixture: {
    workspace: string;
    source: string;
    analysisFixture: string;
    kind?: string;
    title?: string;
    sourceDate?: string;
    ingestedAt?: string;
  };
  expected: {
    summary: string;
    analysis: string;
    index: string;
    log: string;
  };
}

function toPosixPath(value: string): string {
  return value.split(sep).join("/");
}

async function main(): Promise<void> {
  const repoRoot = resolve(process.cwd());
  const suiteArgument = process.argv[2] ?? "evals/suites/ingest/session-1-example-client-sync.json";
  const suitePath = resolve(repoRoot, suiteArgument);
  const suite = JSON.parse(await readFile(suitePath, "utf8")) as IngestSuiteManifest;

  const workspaceFixtureRoot = resolve(repoRoot, suite.fixture.workspace);
  const sourceFixturePath = resolve(repoRoot, suite.fixture.source);
  const analysisFixturePath = resolve(repoRoot, suite.fixture.analysisFixture);
  const runRoot = resolve(repoRoot, ".tmp", "evals", suite.name);
  const runWorkspaceRoot = resolve(runRoot, "workspace");

  await rm(runRoot, { recursive: true, force: true });
  await mkdir(dirname(runWorkspaceRoot), { recursive: true });
  await cp(workspaceFixtureRoot, runWorkspaceRoot, { recursive: true });

  const beforeLoad = await loadWorkspace(runWorkspaceRoot);

  if (!beforeLoad.validation.valid) {
    throw new Error(
      `Workspace fixture is invalid: ${beforeLoad.validation.issues
        .filter((issue) => issue.severity === "error")
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  const analyzer = new FixtureMeetingAnalyzer({
    fixturesByInputPath: {
      [sourceFixturePath]: analysisFixturePath,
    },
    analyzerId: "eval-fixture-meeting-analyzer",
    promptVersion: "eval-fixture-v1",
    provider: "eval-fixture",
    model: "eval-fixture/meeting-analysis",
  });

  const ingestResult = await ingestSource({
    workspaceRoot: runWorkspaceRoot,
    inputPath: sourceFixturePath,
    analyzer,
    kind: suite.fixture.kind as RawSourceKind | undefined,
    title: suite.fixture.title,
    sourceDate: suite.fixture.sourceDate,
    ingestedAt: suite.fixture.ingestedAt,
  });

  const actualSummaryPath = resolve(runWorkspaceRoot, ingestResult.source.summaryPath);
  const actualAnalysisPath = resolve(runWorkspaceRoot, ingestResult.source.analysisPath);
  const actualIndexPath = resolve(runWorkspaceRoot, "wiki", "index.md");
  const actualLogPath = resolve(runWorkspaceRoot, "wiki", "log.md");
  const actualRawPath = resolve(runWorkspaceRoot, ingestResult.source.rawPath);
  const expectedSummaryRelativePath = `wiki/sources/${ingestResult.source.id}.md`;
  const expectedAnalysisRelativePath = `wiki/sources/${ingestResult.source.id}.analysis.md`;
  const expectedRawRelativePath = `raw/meetings/${ingestResult.source.id}.md`;
  const assertions: EvalAssertion[] = [];

  assertions.push({
    name: "summary page path",
    pass: ingestResult.source.summaryPath === expectedSummaryRelativePath,
    actualPath: ingestResult.source.summaryPath,
    expectedPath: expectedSummaryRelativePath,
    message:
      ingestResult.source.summaryPath === expectedSummaryRelativePath
        ? undefined
        : "Summary file path did not match expected deterministic location.",
  });

  assertions.push({
    name: "analysis artifact path",
    pass: ingestResult.source.analysisPath === expectedAnalysisRelativePath,
    actualPath: ingestResult.source.analysisPath,
    expectedPath: expectedAnalysisRelativePath,
    message:
      ingestResult.source.analysisPath === expectedAnalysisRelativePath
        ? undefined
        : "Analysis artifact path did not match expected deterministic location.",
  });

  assertions.push({
    name: "raw meeting path",
    pass: ingestResult.source.rawPath === expectedRawRelativePath,
    actualPath: ingestResult.source.rawPath,
    expectedPath: expectedRawRelativePath,
    message:
      ingestResult.source.rawPath === expectedRawRelativePath
        ? undefined
        : "Raw source file path did not match expected deterministic location.",
  });

  assertions.push(await compareFiles("raw meeting content", actualRawPath, sourceFixturePath));
  assertions.push(await compareFiles("source summary", actualSummaryPath, resolve(repoRoot, suite.expected.summary)));
  assertions.push(await compareFiles("analysis artifact", actualAnalysisPath, resolve(repoRoot, suite.expected.analysis)));
  assertions.push(await compareFiles("wiki index", actualIndexPath, resolve(repoRoot, suite.expected.index)));
  assertions.push(await compareFiles("wiki log", actualLogPath, resolve(repoRoot, suite.expected.log)));

  const artifactIssues = validateAnalysisArtifact(await readAnalysisArtifact(actualAnalysisPath));
  assertions.push({
    name: "analysis artifact schema",
    pass: artifactIssues.length === 0,
    actualPath: relativeFromRepo(repoRoot, actualAnalysisPath),
    message: artifactIssues.length === 0 ? undefined : artifactIssues.join("; "),
  });

  const pass = assertions.every((assertion) => assertion.pass);
  const report = {
    suite: suite.name,
    description: suite.description,
    pass,
    runRoot: toPosixPath(relative(repoRoot, runRoot)),
    workspaceRoot: toPosixPath(relative(repoRoot, runWorkspaceRoot)),
    sourceId: ingestResult.source.id,
    createdDirectories: ingestResult.createdDirectories,
    createdFiles: ingestResult.createdFiles,
    updatedFiles: ingestResult.updatedFiles,
    warnings: ingestResult.warnings,
    assertions,
  };

  await writeFile(resolve(runRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));

  if (!pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
