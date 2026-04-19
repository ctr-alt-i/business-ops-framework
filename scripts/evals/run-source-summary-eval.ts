import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  compareFiles,
  readAnalysisArtifact,
  relativeFromRepo,
  resolveActualWikiPathFromExpected,
  runSeriesIngest,
  validateAnalysisArtifact,
  type EvalAssertion,
  type MeetingSeriesSuiteManifest,
  writeJsonReport,
} from "./shared";

async function main(): Promise<void> {
  const repoRoot = resolve(process.cwd());
  const suiteArgument = process.argv[2] ?? "evals/suites/wiki/pinnacle-logistics-source-summaries.json";
  const suitePath = resolve(repoRoot, suiteArgument);
  const suite = JSON.parse(await readFile(suitePath, "utf8")) as MeetingSeriesSuiteManifest;
  const runRoot = resolve(repoRoot, ".tmp", "evals", suite.name);
  const { runWorkspaceRoot, ingestResults } = await runSeriesIngest(repoRoot, suite, runRoot);
  const assertions: EvalAssertion[] = [];

  for (const [sourceId, expectedPath] of Object.entries(suite.expected?.summaries ?? {})) {
    assertions.push(
      await compareFiles(
        `source summary ${sourceId}`,
        resolveActualWikiPathFromExpected(runWorkspaceRoot, expectedPath),
        resolve(repoRoot, expectedPath),
      ),
    );
  }

  for (const [sourceId, expectedPath] of Object.entries(suite.expected?.analyses ?? {})) {
    const actualPath = resolveActualWikiPathFromExpected(runWorkspaceRoot, expectedPath);

    assertions.push(await compareFiles(`analysis artifact ${sourceId}`, actualPath, resolve(repoRoot, expectedPath)));

    const issues = validateAnalysisArtifact(await readAnalysisArtifact(actualPath));
    assertions.push({
      name: `analysis artifact schema ${sourceId}`,
      pass: issues.length === 0,
      actualPath: relativeFromRepo(repoRoot, actualPath),
      message: issues.length === 0 ? undefined : issues.join("; "),
    });
  }

  if (suite.expected?.index) {
    assertions.push(
      await compareFiles(
        "wiki index",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.index),
        resolve(repoRoot, suite.expected.index),
      ),
    );
  }

  if (suite.expected?.log) {
    assertions.push(
      await compareFiles(
        "wiki log",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.log),
        resolve(repoRoot, suite.expected.log),
      ),
    );
  }

  const pass = assertions.every((assertion) => assertion.pass);
  const report = {
    suite: suite.name,
    description: suite.description,
    pass,
    runRoot: relativeFromRepo(repoRoot, runRoot),
    workspaceRoot: relativeFromRepo(repoRoot, runWorkspaceRoot),
    sources: ingestResults.map((result) => result.source.id),
    assertions,
  };

  await writeJsonReport(resolve(runRoot, "report.json"), report);
  console.log(JSON.stringify(report, null, 2));

  if (!pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
