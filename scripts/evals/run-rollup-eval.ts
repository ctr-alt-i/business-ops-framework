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
  const suiteArgument = process.argv[2] ?? "evals/suites/extraction/pinnacle-logistics-rollup.json";
  const suitePath = resolve(repoRoot, suiteArgument);
  const suite = JSON.parse(await readFile(suitePath, "utf8")) as MeetingSeriesSuiteManifest;
  const runRoot = resolve(repoRoot, ".tmp", "evals", suite.name);
  const { runWorkspaceRoot, ingestResults } = await runSeriesIngest(repoRoot, suite, runRoot);
  const assertions: EvalAssertion[] = [];

  for (const [sourceId, expectedPath] of Object.entries(suite.expected?.analyses ?? {})) {
    const actualPath = resolveActualWikiPathFromExpected(runWorkspaceRoot, expectedPath);
    const issues = validateAnalysisArtifact(await readAnalysisArtifact(actualPath));

    assertions.push({
      name: `analysis artifact schema ${sourceId}`,
      pass: issues.length === 0,
      actualPath: relativeFromRepo(repoRoot, actualPath),
      message: issues.length === 0 ? undefined : issues.join("; "),
    });
  }

  if (suite.expected?.project) {
    assertions.push(
      await compareFiles(
        "project rollup",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.project),
        resolve(repoRoot, suite.expected.project),
      ),
    );
  }

  for (const [topicId, expectedPath] of Object.entries(suite.expected?.topics ?? {})) {
    assertions.push(
      await compareFiles(
        `topic rollup ${topicId}`,
        resolveActualWikiPathFromExpected(runWorkspaceRoot, expectedPath),
        resolve(repoRoot, expectedPath),
      ),
    );
  }

  if (suite.expected?.decisionLog) {
    assertions.push(
      await compareFiles(
        "decision log",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.decisionLog),
        resolve(repoRoot, suite.expected.decisionLog),
      ),
    );
  }

  if (suite.expected?.actionTracker) {
    assertions.push(
      await compareFiles(
        "action tracker",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.actionTracker),
        resolve(repoRoot, suite.expected.actionTracker),
      ),
    );
  }

  if (suite.expected?.futureWork) {
    assertions.push(
      await compareFiles(
        "future work",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.futureWork),
        resolve(repoRoot, suite.expected.futureWork),
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
