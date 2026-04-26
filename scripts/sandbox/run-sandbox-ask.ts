import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { loadDotEnvIfPresent, pathExists, relativeFromRepo, walkMarkdownFiles } from "./shared";

const DEFAULT_WORKSPACE_RELATIVE_PATH = ".tmp/sandbox/example-engagement";
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "did",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "there",
  "they",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "you",
  "your",
]);

interface AskCliOptions {
  question?: string;
  workspaceRoot?: string;
}

interface RankedMatch {
  path: string;
  score: number;
  snippets: string[];
}

function parseArgs(argv: string[]): AskCliOptions {
  const options: AskCliOptions = {};
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--workspace") {
      options.workspaceRoot = argv[index + 1];
      index += 1;
      continue;
    }

    positionals.push(argument);
  }

  if (positionals[0]) {
    options.question = positionals[0];
  }

  if (positionals[1] && !options.workspaceRoot) {
    options.workspaceRoot = positionals[1];
  }

  return options;
}

function tokenize(question: string): string[] {
  return Array.from(
    new Set(
      question
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2)
        .filter((token) => !STOP_WORDS.has(token)),
    ),
  );
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) {
    return 0;
  }

  let count = 0;
  let fromIndex = 0;

  while (fromIndex >= 0) {
    const index = haystack.indexOf(needle, fromIndex);

    if (index < 0) {
      break;
    }

    count += 1;
    fromIndex = index + needle.length;
  }

  return count;
}

function scoreLine(line: string, tokens: string[]): number {
  const normalized = line.toLowerCase();

  return tokens.reduce((score, token) => score + countOccurrences(normalized, token), 0);
}

function buildSnippets(markdown: string, tokens: string[]): string[] {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("<!--"))
    .filter((line) => !line.startsWith("```"));
  const ranked = lines
    .map((line) => ({ line, score: scoreLine(line, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.line.length - right.line.length);
  const snippets: string[] = [];
  const seen = new Set<string>();

  for (const entry of ranked) {
    const snippet = entry.line.length > 160 ? `${entry.line.slice(0, 157)}...` : entry.line;
    const key = snippet.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      snippets.push(snippet);
    }

    if (snippets.length >= 3) {
      break;
    }
  }

  return snippets;
}

async function rankWikiFiles(workspaceRoot: string, question: string): Promise<RankedMatch[]> {
  const wikiRoot = resolve(workspaceRoot, "wiki");
  const tokens = tokenize(question);

  if (tokens.length === 0) {
    return [];
  }

  const files = (await walkMarkdownFiles(wikiRoot)).filter((path) => !path.endsWith(".analysis.md"));
  const results: RankedMatch[] = [];

  for (const path of files) {
    const markdown = await readFile(path, "utf8");
    const normalized = markdown.toLowerCase();
    const tokenScore = tokens.reduce((score, token) => score + countOccurrences(normalized, token), 0);
    const exactQuestionBoost = normalized.includes(question.toLowerCase()) ? 10 : 0;
    const snippets = buildSnippets(markdown, tokens);
    const score = tokenScore + exactQuestionBoost + snippets.length;

    if (score > 0 && snippets.length > 0) {
      results.push({ path, score, snippets });
    }
  }

  return results.sort((left, right) => right.score - left.score || left.path.localeCompare(right.path)).slice(0, 5);
}

async function main(): Promise<void> {
  const repoRoot = resolve(process.cwd());
  const options = parseArgs(process.argv.slice(2));

  await loadDotEnvIfPresent(resolve(repoRoot, ".env"));

  if (!options.question) {
    throw new Error('Usage: npm run sandbox:ask -- "<question>" [workspace-root]');
  }

  const workspaceRoot = resolve(repoRoot, options.workspaceRoot ?? DEFAULT_WORKSPACE_RELATIVE_PATH);

  if (!(await pathExists(resolve(workspaceRoot, "wiki")))) {
    throw new Error(
      `Workspace wiki not found at ${relativeFromRepo(repoRoot, workspaceRoot)}. Run npm run sandbox first or pass a workspace path.`,
    );
  }

  const matches = await rankWikiFiles(workspaceRoot, options.question);

  console.log(`Question: ${options.question}`);
  console.log(`Workspace: ${relativeFromRepo(repoRoot, workspaceRoot)}`);

  if (matches.length === 0) {
    console.log("\nNo keyword matches were found in wiki markdown files.");
    return;
  }

  console.log("\nTop wiki matches:");

  for (const match of matches) {
    console.log(`\n- ${relativeFromRepo(workspaceRoot, match.path)} (score: ${match.score})`);

    for (const snippet of match.snippets) {
      console.log(`  • ${snippet}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
