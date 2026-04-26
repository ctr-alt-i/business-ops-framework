import { basename, extname, resolve } from "node:path";

import { createDefaultMeetingAnalyzerFromEnv, FixtureMeetingAnalyzer } from "../../src/adapters/analysis";
import type { MeetingAnalyzer } from "../../src/core/contracts/meeting-analyzer";
import { ingestSource } from "../../src/modules/ingest";
import { loadDotEnvIfPresent, pathExists, relativeFromRepo } from "./shared";

const DEFAULT_INPUT_RELATIVE_PATH = "evals/fixtures/raw/meetings/2026-04-10-example-client-sync.md";
const DEFAULT_WORKSPACE_RELATIVE_PATH = ".tmp/sandbox/example-engagement";

interface SandboxCliOptions {
  inputPath?: string;
  workspaceRoot?: string;
  title?: string;
  sourceDate?: string;
  ingestedAt?: string;
}

function stripExtension(filename: string): string {
  const extension = extname(filename);
  return extension ? filename.slice(0, -extension.length) : filename;
}

function parseArgs(argv: string[]): SandboxCliOptions {
  const options: SandboxCliOptions = {};
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--workspace") {
      options.workspaceRoot = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === "--title") {
      options.title = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === "--source-date") {
      options.sourceDate = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === "--ingested-at") {
      options.ingestedAt = argv[index + 1];
      index += 1;
      continue;
    }

    positionals.push(argument);
  }

  if (positionals[0]) {
    options.inputPath = positionals[0];
  }

  if (positionals[1] && !options.workspaceRoot) {
    options.workspaceRoot = positionals[1];
  }

  return options;
}

async function resolveFixtureAnalyzer(repoRoot: string, inputPath: string): Promise<MeetingAnalyzer | undefined> {
  const absoluteInputPath = resolve(inputPath);
  const defaultFixtureInputPath = resolve(repoRoot, DEFAULT_INPUT_RELATIVE_PATH);
  const candidatePaths = new Set<string>();

  if (absoluteInputPath === defaultFixtureInputPath) {
    candidatePaths.add(resolve(repoRoot, "evals/fixtures/analyses/meetings/2026-04-10-example-client-sync.json"));
  }

  const fixtureBasename = `${stripExtension(basename(absoluteInputPath))}.json`;
  candidatePaths.add(resolve(repoRoot, "evals/fixtures/analyses/meetings", fixtureBasename));

  for (const candidatePath of candidatePaths) {
    if (await pathExists(candidatePath)) {
      return new FixtureMeetingAnalyzer({
        fixturesByInputPath: {
          [absoluteInputPath]: candidatePath,
        },
        analyzerId: "sandbox-fixture-meeting-analyzer",
        promptVersion: "sandbox-fixture-v1",
        provider: "fixture",
        model: "fixture://meeting-analysis",
      });
    }
  }

  return undefined;
}

async function main(): Promise<void> {
  const repoRoot = resolve(process.cwd());
  const options = parseArgs(process.argv.slice(2));

  await loadDotEnvIfPresent(resolve(repoRoot, ".env"));

  const inputPath = resolve(repoRoot, options.inputPath ?? DEFAULT_INPUT_RELATIVE_PATH);
  const workspaceRoot = resolve(repoRoot, options.workspaceRoot ?? DEFAULT_WORKSPACE_RELATIVE_PATH);
  const envAnalyzer = createDefaultMeetingAnalyzerFromEnv();
  const fixtureAnalyzer = envAnalyzer ? undefined : await resolveFixtureAnalyzer(repoRoot, inputPath);
  const analyzer = envAnalyzer ?? fixtureAnalyzer;
  const analyzerMode = envAnalyzer ? "env" : fixtureAnalyzer ? "fixture" : "none";

  if (!analyzer) {
    throw new Error(
      "No analyzer is configured for this input. Set MEETING_ANALYZER_API_KEY and MEETING_ANALYZER_MODEL in .env or your shell to ingest custom files.",
    );
  }

  const result = await ingestSource({
    workspaceRoot,
    inputPath,
    analyzer,
    title: options.title,
    sourceDate: options.sourceDate,
    ingestedAt: options.ingestedAt,
  });

  console.log(
    JSON.stringify(
      {
        mode: analyzerMode,
        workspaceRoot: relativeFromRepo(repoRoot, workspaceRoot),
        inputPath: relativeFromRepo(repoRoot, inputPath),
        sourceId: result.source.id,
        rawPath: result.source.rawPath,
        summaryPath: result.source.summaryPath,
        analysisPath: result.source.analysisPath,
        createdFiles: result.createdFiles,
        updatedFiles: result.updatedFiles,
        nextCommand: `npm run sandbox:ask -- \"What are the next steps?\" ${relativeFromRepo(repoRoot, workspaceRoot)}`,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
