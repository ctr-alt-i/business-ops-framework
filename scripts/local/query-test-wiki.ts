import { access, readdir, readFile } from "node:fs/promises";
import { basename, extname, relative, resolve, sep } from "node:path";

import { loadWorkspace } from "../../src/modules/workspace";

import { loadOptionalLocalEnv } from "./env";

const DEFAULT_WORKSPACE_DIR = "test/workspace";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_PROVIDER = "openai-compatible";
const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "from",
  "into",
  "what",
  "when",
  "where",
  "which",
  "were",
  "have",
  "has",
  "had",
  "about",
  "after",
  "before",
  "against",
  "their",
  "there",
  "them",
  "then",
  "than",
  "just",
  "into",
  "onto",
  "your",
  "ours",
  "also",
  "only",
  "does",
  "did",
  "been",
  "being",
  "would",
  "could",
  "should",
  "they",
  "them",
  "will",
  "shall",
  "about",
  "asked",
  "tell",
  "show",
]);

interface WikiDocument {
  path: string;
  relativePath: string;
  content: string;
  score: number;
  excerpt: string;
}

interface QueryModelConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  provider: string;
}

interface QueryResponse {
  answer: string;
  citations: string[];
  gaps: string[];
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

function toPosixPath(value: string): string {
  return value.split(sep).join("/");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function listMarkdownFiles(root: string): Promise<string[]> {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absolutePath = resolve(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(absolutePath)));
      continue;
    }

    if (extname(entry.name).toLowerCase() === ".md") {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

function scoreDocument(questionTokens: string[], relativePath: string, content: string): number {
  if (questionTokens.length === 0) {
    return 0;
  }

  const headings = content
    .split("\n")
    .filter((line) => line.startsWith("#"))
    .join(" ");
  const pathText = `${relativePath} ${basename(relativePath, extname(relativePath))}`.toLowerCase();
  let score = 0;

  for (const token of questionTokens) {
    const pattern = new RegExp(`\\b${escapeRegExp(token)}\\b`, "gi");
    const pathMatches = pathText.match(pattern)?.length ?? 0;
    const headingMatches = headings.match(pattern)?.length ?? 0;
    const contentMatches = content.match(pattern)?.length ?? 0;

    score += pathMatches * 8;
    score += headingMatches * 5;
    score += Math.min(contentMatches, 10);
  }

  if (relativePath === "wiki/index.md") {
    score += 2;
  }

  if (relativePath === "wiki/log.md") {
    score += 1;
  }

  return score;
}

function buildExcerpt(content: string, questionTokens: string[]): string {
  const lines = content.split("\n");

  if (questionTokens.length === 0) {
    return lines.slice(0, 40).join("\n");
  }

  const matchedLineIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => questionTokens.some((token) => new RegExp(`\\b${escapeRegExp(token)}\\b`, "i").test(line)))
    .map(({ index }) => index);

  if (matchedLineIndexes.length === 0) {
    return lines.slice(0, 40).join("\n");
  }

  const windows: Array<{ start: number; end: number }> = [];

  for (const index of matchedLineIndexes.slice(0, 6)) {
    const start = Math.max(0, index - 2);
    const end = Math.min(lines.length, index + 3);
    const last = windows[windows.length - 1];

    if (last && start <= last.end) {
      last.end = Math.max(last.end, end);
      continue;
    }

    windows.push({ start, end });
  }

  return windows.map((window) => lines.slice(window.start, window.end).join("\n")).join("\n...\n");
}

async function collectWikiDocuments(workspaceRoot: string, question: string): Promise<WikiDocument[]> {
  const wikiRoot = resolve(workspaceRoot, "wiki");
  const files = await listMarkdownFiles(wikiRoot);
  const questionTokens = unique(tokenize(question));
  const documents = await Promise.all(
    files.map(async (path) => {
      const content = await readFile(path, "utf8");
      const relativePath = toPosixPath(relative(workspaceRoot, path));
      const score = scoreDocument(questionTokens, relativePath, content);

      return {
        path,
        relativePath,
        content,
        score,
        excerpt: buildExcerpt(content, questionTokens),
      } satisfies WikiDocument;
    }),
  );

  return documents.sort((left, right) => {
    if (left.score !== right.score) {
      return right.score - left.score;
    }

    return left.relativePath.localeCompare(right.relativePath);
  });
}

function selectTopDocuments(documents: WikiDocument[]): WikiDocument[] {
  const scored = documents.filter((document) => document.score > 0).slice(0, 8);

  if (scored.length > 0) {
    return scored;
  }

  const preferredFallbacks = ["wiki/index.md", "wiki/log.md", "wiki/ops/action-tracker.md", "wiki/ops/decision-log.md"];
  const selected = preferredFallbacks
    .map((relativePath) => documents.find((document) => document.relativePath === relativePath))
    .filter((document): document is WikiDocument => Boolean(document));
  const extras = documents
    .filter((document) => !selected.some((selectedDocument) => selectedDocument.relativePath === document.relativePath))
    .slice(0, Math.max(0, 6 - selected.length));

  return [...selected, ...extras];
}

function expandReviewPaths(selectedDocuments: WikiDocument[], allDocuments: WikiDocument[]): string[] {
  const allPaths = new Set(allDocuments.map((document) => document.relativePath));
  const reviewPaths = new Set<string>();

  for (const document of selectedDocuments) {
    reviewPaths.add(document.relativePath);

    if (/^wiki\/sources\/.+\.md$/.test(document.relativePath) && !document.relativePath.endsWith(".analysis.md")) {
      const analysisPath = document.relativePath.replace(/\.md$/, ".analysis.md");

      if (allPaths.has(analysisPath)) {
        reviewPaths.add(analysisPath);
      }
    }
  }

  return [...reviewPaths].sort();
}

function buildArtifactContext(selectedDocuments: WikiDocument[]): string {
  const maxCharacters = 30_000;
  let currentLength = 0;
  const blocks: string[] = [];

  for (const document of selectedDocuments) {
    const block = [`FILE: ${document.relativePath}`, document.excerpt.trim() || document.content.slice(0, 1500)].join("\n\n");

    if (currentLength + block.length > maxCharacters && blocks.length > 0) {
      break;
    }

    blocks.push(block);
    currentLength += block.length;
  }

  return blocks.join("\n\n---\n\n");
}

function extractMessageContent(response: OpenAIChatCompletionResponse): string {
  const content = response.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  }

  throw new Error("Model response did not include message content.");
}

function getQueryModelConfig(): QueryModelConfig | undefined {
  const apiKey = process.env.MEETING_ANALYZER_API_KEY ?? process.env.OPENAI_API_KEY;
  const model = process.env.MEETING_ANALYZER_MODEL ?? process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    return undefined;
  }

  return {
    apiKey,
    model,
    baseUrl: (process.env.MEETING_ANALYZER_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, ""),
    provider: process.env.MEETING_ANALYZER_PROVIDER ?? DEFAULT_PROVIDER,
  };
}

async function answerWithModel(question: string, selectedDocuments: WikiDocument[]): Promise<QueryResponse> {
  const config = getQueryModelConfig();

  if (!config) {
    throw new Error("No query model configuration was found.");
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You answer questions using only generated wiki artifacts from a business ops workspace. Never use raw transcripts, outside knowledge, or unstated assumptions. If the provided wiki artifacts are insufficient, say so explicitly. Cite only file paths that appear in the provided artifacts.",
        },
        {
          role: "user",
          content: [
            `Question: ${question}`,
            "",
            "Use the generated wiki artifacts below. Answer concisely and include the most relevant review paths.",
            "",
            buildArtifactContext(selectedDocuments),
          ].join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "wiki_query_answer",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              answer: { type: "string" },
              citations: {
                type: "array",
                items: { type: "string" },
              },
              gaps: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["answer", "citations", "gaps"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Wiki query request failed with ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as OpenAIChatCompletionResponse;
  const parsed = JSON.parse(extractMessageContent(body)) as QueryResponse;

  return {
    answer: parsed.answer,
    citations: unique(parsed.citations ?? []),
    gaps: unique(parsed.gaps ?? []),
  };
}

function printFallbackAnswer(question: string, selectedDocuments: WikiDocument[], reviewPaths: string[]): void {
  console.log(`Question: ${question}`);
  console.log("");
  console.log("No query model is configured, so here are the most relevant generated wiki artifacts to review first:");
  console.log("");

  for (const document of selectedDocuments) {
    console.log(`- ${document.relativePath}`);
    console.log(document.excerpt.trim() || document.content.slice(0, 600));
    console.log("");
  }

  console.log("Review paths:");

  for (const path of reviewPaths) {
    console.log(`- ${path}`);
  }
}

async function main(): Promise<void> {
  const repoRoot = resolve(process.cwd());
  await loadOptionalLocalEnv(repoRoot);
  const question = process.argv.slice(2).join(" ").trim();

  if (!question) {
    throw new Error('Usage: npm run sandbox:ask -- "What changed?"');
  }

  const workspaceRoot = resolve(repoRoot, DEFAULT_WORKSPACE_DIR);
  const workspace = await loadWorkspace(workspaceRoot);

  if (!workspace.validation.valid) {
    throw new Error(
      `Workspace is invalid: ${workspace.validation.issues
        .filter((issue) => issue.severity === "error")
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  const documents = await collectWikiDocuments(workspaceRoot, question);

  if (documents.length === 0) {
    throw new Error("No wiki artifacts were found under test/workspace/wiki. Run npm run sandbox first.");
  }

  const selectedDocuments = selectTopDocuments(documents);
  const reviewPaths = expandReviewPaths(selectedDocuments, documents);
  const queryModelConfig = getQueryModelConfig();

  if (!queryModelConfig) {
    printFallbackAnswer(question, selectedDocuments, reviewPaths);
    return;
  }

  const answer = await answerWithModel(question, selectedDocuments);
  const citedPaths = unique(
    [...answer.citations.filter((citation) => reviewPaths.includes(citation)), ...reviewPaths.slice(0, 2)].filter(Boolean),
  );

  console.log(`Question: ${question}`);
  console.log("");
  console.log(answer.answer.trim());
  console.log("");
  console.log("Review paths:");

  for (const path of unique([...citedPaths, ...reviewPaths]).slice(0, 10)) {
    console.log(`- ${path}`);
  }

  if (answer.gaps.length > 0) {
    console.log("");
    console.log("Evidence gaps:");

    for (const gap of answer.gaps) {
      console.log(`- ${gap}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
