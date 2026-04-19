import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  parseQuestionBank,
  readNormalizedText,
  relativeFromRepo,
  runSeriesIngest,
  toPosixPath,
  type AnswerBank,
  type EvalAssertion,
  type MeetingSeriesSuiteManifest,
  writeJsonReport,
} from "./shared";

async function main(): Promise<void> {
  const repoRoot = resolve(process.cwd());
  const suiteArgument = process.argv[2] ?? "evals/suites/wiki/pinnacle-logistics-answerability.json";
  const suitePath = resolve(repoRoot, suiteArgument);
  const suite = JSON.parse(await readFile(suitePath, "utf8")) as MeetingSeriesSuiteManifest;
  const runRoot = resolve(repoRoot, ".tmp", "evals", suite.name);
  const { runWorkspaceRoot, ingestResults } = await runSeriesIngest(repoRoot, suite, runRoot);

  if (!suite.questions || !suite.answers) {
    throw new Error("Answerability suites require both a questions path and an answers path.");
  }

  const questions = parseQuestionBank(await readFile(resolve(repoRoot, suite.questions), "utf8"));
  const answerBank = JSON.parse(await readFile(resolve(repoRoot, suite.answers), "utf8")) as AnswerBank;
  const answersById = new Map(answerBank.answers.map((answer) => [answer.id, answer]));
  const assertions: EvalAssertion[] = [];
  const questionResults = [] as Array<{
    id: string;
    tier?: string;
    prompt: string;
    answer: string;
    pass: boolean;
    searchPaths: string[];
    requiredSnippets: string[];
    missingSnippets: string[];
  }>;

  for (const question of questions) {
    const answer = answersById.get(question.id);

    if (!answer) {
      assertions.push({
        name: `answer bank coverage ${question.id}`,
        pass: false,
        message: `No expected answer was provided for ${question.id}.`,
      });
      continue;
    }

    const generatedTexts = await Promise.all(
      answer.searchPaths.map((searchPath) => readNormalizedText(resolve(runWorkspaceRoot, searchPath))),
    );
    const combinedText = generatedTexts.join("\n\n");
    const missingSnippets = answer.requiredSnippets.filter((snippet) => !combinedText.includes(snippet));
    const pass = missingSnippets.length === 0;

    assertions.push({
      name: `wiki answerability ${question.id}`,
      pass,
      message: pass ? undefined : `Missing snippets: ${missingSnippets.join(" | ")}`,
    });

    questionResults.push({
      id: question.id,
      tier: question.tier,
      prompt: question.prompt,
      answer: answer.answer,
      pass,
      searchPaths: answer.searchPaths.map((searchPath) => toPosixPath(searchPath)),
      requiredSnippets: answer.requiredSnippets,
      missingSnippets,
    });
  }

  const pass = assertions.every((assertion) => assertion.pass);
  const report = {
    suite: suite.name,
    description: suite.description,
    pass,
    runRoot: relativeFromRepo(repoRoot, runRoot),
    workspaceRoot: relativeFromRepo(repoRoot, runWorkspaceRoot),
    sources: ingestResults.map((result) => result.source.id),
    questions: questionResults,
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
