import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

import {
  compareFiles,
  parseQuestionBank,
  readAnalysisArtifact,
  readNormalizedText,
  relativeFromRepo,
  resolveActualWikiPathFromExpected,
  runSeriesIngest,
  toPosixPath,
  validateAnalysisArtifact,
  type AnswerBank,
  type EvalAssertion,
  type MeetingSeriesSuiteManifest,
  writeJsonReport,
} from "./shared";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function linkFromReport(reportPath: string, targetPath: string): string {
  return toPosixPath(relative(dirname(reportPath), targetPath));
}

async function main(): Promise<void> {
  const repoRoot = resolve(process.cwd());
  const suiteArgument = process.argv[2] ?? "evals/suites/workflows/pinnacle-logistics-review.json";
  const suitePath = resolve(repoRoot, suiteArgument);
  const suite = JSON.parse(await readFile(suitePath, "utf8")) as MeetingSeriesSuiteManifest;
  const runRoot = resolve(repoRoot, ".tmp", "reviews", suite.name);
  const { runWorkspaceRoot, ingestResults } = await runSeriesIngest(repoRoot, suite, runRoot);

  if (!suite.report?.outputRelativePath) {
    throw new Error("Review suites require report.outputRelativePath.");
  }

  const artifactAssertions: EvalAssertion[] = [];

  for (const [sourceId, expectedPath] of Object.entries(suite.expected?.summaries ?? {})) {
    artifactAssertions.push(
      await compareFiles(
        `source summary ${sourceId}`,
        resolveActualWikiPathFromExpected(runWorkspaceRoot, expectedPath),
        resolve(repoRoot, expectedPath),
      ),
    );
  }

  for (const [sourceId, expectedPath] of Object.entries(suite.expected?.analyses ?? {})) {
    const actualPath = resolveActualWikiPathFromExpected(runWorkspaceRoot, expectedPath);

    artifactAssertions.push(
      await compareFiles(`analysis artifact ${sourceId}`, actualPath, resolve(repoRoot, expectedPath)),
    );

    const issues = validateAnalysisArtifact(await readAnalysisArtifact(actualPath));
    artifactAssertions.push({
      name: `analysis artifact schema ${sourceId}`,
      pass: issues.length === 0,
      actualPath: relativeFromRepo(repoRoot, actualPath),
      message: issues.length === 0 ? undefined : issues.join("; "),
    });
  }

  if (suite.expected?.project) {
    artifactAssertions.push(
      await compareFiles(
        "project rollup",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.project),
        resolve(repoRoot, suite.expected.project),
      ),
    );
  }

  if (suite.expected?.decisionLog) {
    artifactAssertions.push(
      await compareFiles(
        "decision log",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.decisionLog),
        resolve(repoRoot, suite.expected.decisionLog),
      ),
    );
  }

  if (suite.expected?.actionTracker) {
    artifactAssertions.push(
      await compareFiles(
        "action tracker",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.actionTracker),
        resolve(repoRoot, suite.expected.actionTracker),
      ),
    );
  }

  if (suite.expected?.futureWork) {
    artifactAssertions.push(
      await compareFiles(
        "future work",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.futureWork),
        resolve(repoRoot, suite.expected.futureWork),
      ),
    );
  }

  if (suite.expected?.index) {
    artifactAssertions.push(
      await compareFiles(
        "wiki index",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.index),
        resolve(repoRoot, suite.expected.index),
      ),
    );
  }

  if (suite.expected?.log) {
    artifactAssertions.push(
      await compareFiles(
        "wiki log",
        resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.log),
        resolve(repoRoot, suite.expected.log),
      ),
    );
  }

  const questionResults: Array<{
    id: string;
    tier?: string;
    prompt: string;
    answer: string;
    pass: boolean;
    searchPaths: string[];
    requiredSnippets: string[];
    missingSnippets: string[];
  }> = [];

  if (suite.questions && suite.answers) {
    const questions = parseQuestionBank(await readFile(resolve(repoRoot, suite.questions), "utf8"));
    const answerBank = JSON.parse(await readFile(resolve(repoRoot, suite.answers), "utf8")) as AnswerBank;
    const answersById = new Map(answerBank.answers.map((answer) => [answer.id, answer]));

    for (const question of questions) {
      const answer = answersById.get(question.id);

      if (!answer) {
        questionResults.push({
          id: question.id,
          tier: question.tier,
          prompt: question.prompt,
          answer: "Missing expected answer.",
          pass: false,
          searchPaths: [],
          requiredSnippets: [],
          missingSnippets: ["Missing expected answer."],
        });
        continue;
      }

      const generatedTexts = await Promise.all(
        answer.searchPaths.map((searchPath) => readNormalizedText(resolve(runWorkspaceRoot, searchPath))),
      );
      const combinedText = generatedTexts.join("\n\n");
      const missingSnippets = answer.requiredSnippets.filter((snippet) => !combinedText.includes(snippet));

      questionResults.push({
        id: question.id,
        tier: question.tier,
        prompt: question.prompt,
        answer: answer.answer,
        pass: missingSnippets.length === 0,
        searchPaths: answer.searchPaths,
        requiredSnippets: answer.requiredSnippets,
        missingSnippets,
      });
    }
  }

  const artifactPassCount = artifactAssertions.filter((assertion) => assertion.pass).length;
  const questionPassCount = questionResults.filter((question) => question.pass).length;
  const overallPass = artifactAssertions.every((assertion) => assertion.pass) && questionResults.every((question) => question.pass);
  const reportJson = {
    suite: suite.name,
    description: suite.description,
    pass: overallPass,
    runRoot: relativeFromRepo(repoRoot, runRoot),
    workspaceRoot: relativeFromRepo(repoRoot, runWorkspaceRoot),
    sources: ingestResults.map((result) => result.source.id),
    artifactAssertions,
    questionResults,
  };

  await writeJsonReport(resolve(runRoot, "report.json"), reportJson);

  const reportPath = resolve(runWorkspaceRoot, suite.report.outputRelativePath);
  await mkdir(dirname(reportPath), { recursive: true });

  const sourceSections = await Promise.all(
    ingestResults.map(async (result) => {
      const absolutePath = resolve(runWorkspaceRoot, result.source.summaryPath);
      const content = await readNormalizedText(absolutePath);
      return `
        <section class="panel">
          <h2>${escapeHtml(result.source.title)}</h2>
          <p class="muted"><a href="${escapeHtml(linkFromReport(reportPath, absolutePath))}">${escapeHtml(result.source.summaryPath)}</a></p>
          <pre>${escapeHtml(content)}</pre>
        </section>`;
    }),
  );

  const analysisSections = await Promise.all(
    ingestResults.map(async (result) => {
      const absolutePath = resolve(runWorkspaceRoot, result.source.analysisPath);
      const content = await readNormalizedText(absolutePath);
      return `
        <section class="panel">
          <h2>Analysis Artifact — ${escapeHtml(result.source.title)}</h2>
          <p class="muted"><a href="${escapeHtml(linkFromReport(reportPath, absolutePath))}">${escapeHtml(result.source.analysisPath)}</a></p>
          <pre>${escapeHtml(content)}</pre>
        </section>`;
    }),
  );

  const projectSection = suite.expected?.project
    ? `<section class="panel">
        <h2>Project Rollup</h2>
        <p class="muted"><a href="${escapeHtml(linkFromReport(reportPath, resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.project)))}">wiki/projects</a></p>
        <pre>${escapeHtml(await readNormalizedText(resolveActualWikiPathFromExpected(runWorkspaceRoot, suite.expected.project)))}</pre>
      </section>`
    : "";

  const opsSections = [suite.expected?.decisionLog, suite.expected?.actionTracker, suite.expected?.futureWork]
    .filter((path): path is string => Boolean(path))
    .map(async (expectedPath) => {
      const actualPath = resolveActualWikiPathFromExpected(runWorkspaceRoot, expectedPath);
      const content = await readNormalizedText(actualPath);
      return `
        <section class="panel">
          <h2>${escapeHtml(toPosixPath(relative(runWorkspaceRoot, actualPath)))}</h2>
          <p class="muted"><a href="${escapeHtml(linkFromReport(reportPath, actualPath))}">${escapeHtml(toPosixPath(relative(runWorkspaceRoot, actualPath)))}</a></p>
          <pre>${escapeHtml(content)}</pre>
        </section>`;
    });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(suite.report.title ?? suite.name)}</title>
  <style>
    :root {
      --bg: #0b1020;
      --panel: #121933;
      --panel2: #182347;
      --border: #2d3d66;
      --text: #e8efff;
      --muted: #a0b2da;
      --good: #8defab;
      --bad: #ff9e9e;
      --warn: #ffd57a;
      --accent: #7dc7ff;
      --code: #0d1530;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px 18px 60px;
      background: linear-gradient(180deg, #070d18 0%, #0b1020 100%);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.55;
    }
    .wrap { max-width: 1280px; margin: 0 auto; }
    .panel {
      background: rgba(18, 25, 51, 0.92);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 22px;
      margin-bottom: 18px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-top: 14px;
    }
    .card {
      background: rgba(24, 35, 71, 0.86);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px 16px;
    }
    .metric {
      font-size: 1.9rem;
      font-weight: 700;
      margin: 6px 0;
    }
    .good { color: var(--good); }
    .bad { color: var(--bad); }
    .warn { color: var(--warn); }
    .muted { color: var(--muted); }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 10px 12px;
      vertical-align: top;
      text-align: left;
    }
    th { background: rgba(125, 199, 255, 0.08); color: var(--accent); }
    a { color: #9bd2ff; }
    pre {
      white-space: pre-wrap;
      background: var(--code);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      overflow-x: auto;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      background: var(--code);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 1px 6px;
      color: #dce8ff;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="panel">
      <h1>${escapeHtml(suite.report.title ?? suite.name)}</h1>
      <p class="muted">${escapeHtml(suite.description ?? "Deterministic review report for generated wiki artifacts.")}</p>
      <div class="grid">
        <div class="card">
          <div class="muted">Artifact checks</div>
          <div class="metric ${artifactPassCount === artifactAssertions.length ? "good" : "bad"}">${artifactPassCount} / ${artifactAssertions.length}</div>
          <div>exact-match and schema checks across summaries, analysis artifacts, rollups, and ops pages</div>
        </div>
        <div class="card">
          <div class="muted">Wiki answerability</div>
          <div class="metric ${questionPassCount === questionResults.length ? "good" : "bad"}">${questionPassCount} / ${questionResults.length}</div>
          <div>questions validated against generated wiki artifacts only</div>
        </div>
        <div class="card">
          <div class="muted">Sources ingested</div>
          <div class="metric good">${ingestResults.length}</div>
          <div>${escapeHtml(ingestResults.map((result) => result.source.id).join(", "))}</div>
        </div>
        <div class="card">
          <div class="muted">Overall status</div>
          <div class="metric ${overallPass ? "good" : "bad"}">${overallPass ? "PASS" : "FAIL"}</div>
          <div>run root: <code>${escapeHtml(relativeFromRepo(repoRoot, runRoot))}</code></div>
        </div>
      </div>
    </section>

    <section class="panel">
      <h2>Artifact checks</h2>
      <table>
        <thead>
          <tr><th>Check</th><th>Status</th><th>Message</th></tr>
        </thead>
        <tbody>
          ${artifactAssertions
            .map(
              (assertion) => `<tr>
                <td>${escapeHtml(assertion.name)}</td>
                <td class="${assertion.pass ? "good" : "bad"}"><strong>${assertion.pass ? "Pass" : "Fail"}</strong></td>
                <td>${escapeHtml(assertion.message ?? "")}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </section>

    <section class="panel">
      <h2>Question bank review</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Tier</th><th>Question</th><th>Expected answer</th><th>Status</th><th>Missing snippets</th></tr>
        </thead>
        <tbody>
          ${questionResults
            .map(
              (question) => `<tr>
                <td>${escapeHtml(question.id)}</td>
                <td>${escapeHtml(question.tier ?? "")}</td>
                <td>${escapeHtml(question.prompt)}</td>
                <td>${escapeHtml(question.answer)}</td>
                <td class="${question.pass ? "good" : "bad"}"><strong>${question.pass ? "Pass" : "Fail"}</strong></td>
                <td>${escapeHtml(question.missingSnippets.join(" | "))}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </section>

    ${sourceSections.join("")}
    ${analysisSections.join("")}
    ${projectSection}
    ${(await Promise.all(opsSections)).join("")}
  </div>
</body>
</html>`;

  await writeFile(reportPath, html, "utf8");
  console.log(
    JSON.stringify(
      {
        suite: suite.name,
        pass: overallPass,
        reportPath: relativeFromRepo(repoRoot, reportPath),
        runRoot: relativeFromRepo(repoRoot, runRoot),
      },
      null,
      2,
    ),
  );

  if (!overallPass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
