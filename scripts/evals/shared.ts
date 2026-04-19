import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

import { FixtureMeetingAnalyzer } from "../../src/adapters/analysis";
import type { MeetingAnalysisResult, RawSourceKind } from "../../src/core/types";
import { ingestSource } from "../../src/modules/ingest";
import { loadWorkspace } from "../../src/modules/workspace";

export interface EvalAssertion {
  name: string;
  pass: boolean;
  actualPath?: string;
  expectedPath?: string;
  message?: string;
}

export interface SeriesSourceFixture {
  path: string;
  analysisFixture?: string;
  kind?: string;
  title?: string;
  sourceDate?: string;
  ingestedAt?: string;
}

export interface MeetingSeriesSuiteManifest {
  name: string;
  description?: string;
  fixture: {
    workspace: string;
    sources: SeriesSourceFixture[];
  };
  expected?: {
    summaries?: Record<string, string>;
    analyses?: Record<string, string>;
    project?: string;
    topics?: Record<string, string>;
    decisionLog?: string;
    actionTracker?: string;
    futureWork?: string;
    index?: string;
    log?: string;
  };
  questions?: string;
  answers?: string;
  report?: {
    outputRelativePath: string;
    title?: string;
  };
}

export interface QuestionBankItem {
  id: string;
  prompt: string;
  tier?: string;
}

export interface AnswerExpectation {
  id: string;
  answer: string;
  searchPaths: string[];
  requiredSnippets: string[];
}

export interface AnswerBank {
  answers: AnswerExpectation[];
}

export function toPosixPath(value: string): string {
  return value.split(sep).join("/");
}

export function normalizeText(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

export async function readNormalizedText(path: string): Promise<string> {
  return normalizeText(await readFile(path, "utf8"));
}

export async function compareFiles(name: string, actualPath: string, expectedPath: string): Promise<EvalAssertion> {
  try {
    const [actual, expected] = await Promise.all([readNormalizedText(actualPath), readNormalizedText(expectedPath)]);

    return {
      name,
      pass: actual === expected,
      actualPath,
      expectedPath,
      message: actual === expected ? undefined : "File content did not match golden.",
    };
  } catch (error) {
    return {
      name,
      pass: false,
      actualPath,
      expectedPath,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function setupRunWorkspace(
  repoRoot: string,
  workspaceFixture: string,
  runRoot: string,
): Promise<{ runRoot: string; runWorkspaceRoot: string }> {
  const workspaceFixtureRoot = resolve(repoRoot, workspaceFixture);
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

  return {
    runRoot,
    runWorkspaceRoot,
  };
}

function createFixtureAnalyzer(repoRoot: string, suite: MeetingSeriesSuiteManifest): FixtureMeetingAnalyzer | undefined {
  const fixturesByInputPath = Object.fromEntries(
    suite.fixture.sources
      .filter((source): source is SeriesSourceFixture & { analysisFixture: string } => Boolean(source.analysisFixture))
      .map((source) => [resolve(repoRoot, source.path), resolve(repoRoot, source.analysisFixture)]),
  );

  if (Object.keys(fixturesByInputPath).length === 0) {
    return undefined;
  }

  return new FixtureMeetingAnalyzer({
    fixturesByInputPath,
    analyzerId: "eval-fixture-meeting-analyzer",
    promptVersion: "eval-fixture-v1",
    provider: "eval-fixture",
    model: "eval-fixture/meeting-analysis",
  });
}

export async function runSeriesIngest(
  repoRoot: string,
  suite: MeetingSeriesSuiteManifest,
  runRoot: string,
): Promise<{
  runRoot: string;
  runWorkspaceRoot: string;
  ingestResults: Awaited<ReturnType<typeof ingestSource>>[];
}> {
  const { runWorkspaceRoot } = await setupRunWorkspace(repoRoot, suite.fixture.workspace, runRoot);
  const ingestResults: Awaited<ReturnType<typeof ingestSource>>[] = [];
  const analyzer = createFixtureAnalyzer(repoRoot, suite);

  for (const source of suite.fixture.sources) {
    ingestResults.push(
      await ingestSource({
        workspaceRoot: runWorkspaceRoot,
        inputPath: resolve(repoRoot, source.path),
        analyzer,
        kind: source.kind as RawSourceKind | undefined,
        title: source.title,
        sourceDate: source.sourceDate,
        ingestedAt: source.ingestedAt,
      }),
    );
  }

  return {
    runRoot,
    runWorkspaceRoot,
    ingestResults,
  };
}

export function parseQuestionBank(markdown: string): QuestionBankItem[] {
  const normalized = normalizeText(markdown);
  const lines = normalized.split("\n");
  const items: QuestionBankItem[] = [];
  let currentTier: string | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (line.startsWith("## ")) {
      currentTier = line.replace(/^##\s+/, "").trim();
      continue;
    }

    const idMatch = line.match(/^###\s+(.+)$/);

    if (!idMatch) {
      continue;
    }

    const id = idMatch[1].trim();
    const promptLines: string[] = [];

    for (let inner = index + 1; inner < lines.length; inner += 1) {
      const promptLine = lines[inner].trim();

      if (!promptLine) {
        continue;
      }

      if (promptLine.startsWith("### ") || promptLine.startsWith("## ")) {
        break;
      }

      promptLines.push(promptLine);
      index = inner;
    }

    items.push({
      id,
      prompt: promptLines.join(" "),
      tier: currentTier,
    });
  }

  return items;
}

export async function writeJsonReport(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function relativeFromRepo(repoRoot: string, path: string): string {
  return toPosixPath(relative(repoRoot, path));
}

export function resolveActualWikiPathFromExpected(runWorkspaceRoot: string, expectedPath: string): string {
  const normalized = toPosixPath(expectedPath);
  const wikiSegments = ["/sources/", "/projects/", "/topics/", "/ops/"];

  for (const segment of wikiSegments) {
    const index = normalized.indexOf(segment);

    if (index >= 0) {
      return resolve(runWorkspaceRoot, "wiki", normalized.slice(index + 1));
    }
  }

  if (normalized.endsWith("/index.md")) {
    return resolve(runWorkspaceRoot, "wiki", "index.md");
  }

  if (normalized.endsWith("/log.md")) {
    return resolve(runWorkspaceRoot, "wiki", "log.md");
  }

  throw new Error(`Could not infer actual wiki path from expected path: ${expectedPath}`);
}

export function parseAnalysisArtifactMarkdown(markdown: string): MeetingAnalysisResult {
  const normalized = normalizeText(markdown);
  const match = normalized.match(/```json\n([\s\S]*?)\n```/);

  if (!match) {
    throw new Error("Analysis artifact did not contain a JSON fenced block.");
  }

  return JSON.parse(match[1]) as MeetingAnalysisResult;
}

export async function readAnalysisArtifact(path: string): Promise<MeetingAnalysisResult> {
  return parseAnalysisArtifactMarkdown(await readNormalizedText(path));
}

export function validateAnalysisArtifact(result: MeetingAnalysisResult): string[] {
  const issues: string[] = [];

  if (!result.meta?.sourceId) {
    issues.push("meta.sourceId is missing");
  }

  if (!result.meta?.analyzerId) {
    issues.push("meta.analyzerId is missing");
  }

  if (!result.meta?.promptVersion) {
    issues.push("meta.promptVersion is missing");
  }

  if (!result.meta?.model) {
    issues.push("meta.model is missing");
  }

  if (!result.meta?.analyzedAt) {
    issues.push("meta.analyzedAt is missing");
  }

  if (!result.sourceSummary?.sourceId) {
    issues.push("sourceSummary.sourceId is missing");
  }

  if (!result.sourceSummary?.title) {
    issues.push("sourceSummary.title is missing");
  }

  if (!Array.isArray(result.decisions)) {
    issues.push("decisions must be an array");
  }

  if (!Array.isArray(result.actionItems)) {
    issues.push("actionItems must be an array");
  }

  if (!Array.isArray(result.futureWorkItems)) {
    issues.push("futureWorkItems must be an array");
  }

  if (!Array.isArray(result.rollupHints)) {
    issues.push("rollupHints must be an array");
  }

  return issues;
}
