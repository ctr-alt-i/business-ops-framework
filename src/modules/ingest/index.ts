import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve, sep } from "node:path";

import { createDefaultMeetingAnalyzerFromEnv } from "../../adapters/analysis";
import type { MeetingAnalyzer } from "../../core/contracts/meeting-analyzer";
import { normalizeMeetingAnalysisResult } from "../../core/domain/meeting-analysis";
import type { IngestRequest, IngestResult, RawSourceKind, SourceRecord } from "../../core/types";
import { loadPersistedMeetingAnalyses, persistMeetingAnalysisArtifact, refreshWorkspaceWikiFromAnalyses } from "../wiki";
import { getRawCollectionPath, initWorkspace } from "../workspace";

export interface IngestSourceOptions extends IngestRequest {
  analyzer?: MeetingAnalyzer;
}

function stripExtension(filename: string): string {
  const extension = extname(filename);
  return extension ? filename.slice(0, -extension.length) : filename;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeSlug(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toPosixPath(value: string): string {
  return value.split(sep).join("/");
}

async function stageTextSource(inputPath: string, destinationPath: string): Promise<"created" | "updated" | "unchanged"> {
  const sourceContent = await readFile(inputPath, "utf8");

  try {
    const destinationContent = await readFile(destinationPath, "utf8");

    if (destinationContent === sourceContent) {
      return "unchanged";
    }

    await writeFile(destinationPath, sourceContent, "utf8");
    return "updated";
  } catch {
    await writeFile(destinationPath, sourceContent, "utf8");
    return "created";
  }
}

function inferSourceKind(inputPath: string): RawSourceKind {
  const normalized = toPosixPath(inputPath).toLowerCase();

  if (normalized.includes("meeting-notes") || normalized.includes("/notes/") || normalized.includes("notes")) {
    return "meeting-notes";
  }

  if (normalized.includes("/meetings/") || normalized.includes("transcript")) {
    return "meeting-transcript";
  }

  if (normalized.includes("requirements")) {
    return "requirements-doc";
  }

  if (normalized.includes("backlog")) {
    return "backlog-doc";
  }

  if (normalized.includes("email")) {
    return "email-thread";
  }

  if (normalized.includes("chat")) {
    return "chat-export";
  }

  if (normalized.includes("technical")) {
    return "technical-doc";
  }

  return "client-artifact";
}

function inferSourceDate(inputPath: string): string | undefined {
  return inputPath.match(/(20\d{2}-\d{2}-\d{2})/)?.[1];
}

function normalizeBaseName(inputPath: string): string {
  return stripExtension(basename(inputPath)).replace(/^(20\d{2}-\d{2}-\d{2})[-_]?/, "");
}

function resolveMeetingAnalyzer(analyzer?: MeetingAnalyzer): MeetingAnalyzer {
  return analyzer ?? createDefaultMeetingAnalyzerFromEnv() ?? (() => {
    throw new Error(
      "No meeting analyzer was configured. Pass ingestSource({ analyzer }) or set MEETING_ANALYZER_API_KEY and MEETING_ANALYZER_MODEL.",
    );
  })();
}

export async function ingestSource(request: IngestSourceOptions): Promise<IngestResult> {
  const bootstrap = await initWorkspace(request.workspaceRoot);

  if (!bootstrap.validation.valid) {
    const errors = bootstrap.validation.issues
      .filter((issue) => issue.severity === "error")
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");

    throw new Error(`Workspace validation failed: ${errors}`);
  }

  const workspace = bootstrap.workspace;
  const absoluteInputPath = resolve(request.inputPath);
  const analyzer = resolveMeetingAnalyzer(request.analyzer);
  const warnings: string[] = [];
  const kind = request.kind ?? inferSourceKind(absoluteInputPath);
  const inferredSourceDate = inferSourceDate(absoluteInputPath);
  const sourceDate = request.sourceDate ?? inferredSourceDate ?? new Date().toISOString().slice(0, 10);
  const ingestedAt = request.ingestedAt ?? new Date().toISOString();

  if (!request.sourceDate && !inferredSourceDate) {
    warnings.push(`No source date found in path; defaulted to ${sourceDate}.`);
  }

  const normalizedBaseName = normalizeBaseName(absoluteInputPath);
  const title = request.title ?? humanizeSlug(normalizedBaseName || "source");
  const slug = slugify(title || normalizedBaseName || "source");
  const sourceId = `${sourceDate}-${slug}`;
  const extension = extname(absoluteInputPath) || ".md";
  const rawDirectory = getRawCollectionPath(workspace, kind);
  const destinationPath = resolve(join(rawDirectory, `${sourceId}${extension}`));
  const rawRelativePath = toPosixPath(relative(workspace.root, destinationPath));
  const createdFiles = [...bootstrap.createdFiles];
  const updatedFiles: string[] = [];

  await readFile(absoluteInputPath, "utf8");

  const stagedRawFile = await stageTextSource(absoluteInputPath, destinationPath);

  if (stagedRawFile === "created") {
    createdFiles.push(rawRelativePath);
  }

  if (stagedRawFile === "updated") {
    updatedFiles.push(rawRelativePath);
  }

  const source: SourceRecord = {
    id: sourceId,
    title,
    slug,
    kind,
    sourceDate,
    ingestedAt,
    rawPath: rawRelativePath,
    summaryPath: `wiki/sources/${sourceId}.md`,
    analysisPath: `wiki/sources/${sourceId}.analysis.md`,
    originalPath: absoluteInputPath,
  };

  const rawText = await readFile(destinationPath, "utf8");
  const rawAnalysis = await analyzer.analyze({
    source,
    rawText,
  });
  const normalizedAnalysis = normalizeMeetingAnalysisResult(source, rawAnalysis);
  warnings.push(...normalizedAnalysis.warnings);

  const artifactResult = await persistMeetingAnalysisArtifact(workspace, normalizedAnalysis.result);

  if (artifactResult === "created") {
    createdFiles.push(source.analysisPath);
  }

  if (artifactResult === "updated") {
    updatedFiles.push(source.analysisPath);
  }

  const allAnalyses = await loadPersistedMeetingAnalyses(workspace);
  const wikiMutation = await refreshWorkspaceWikiFromAnalyses(workspace, allAnalyses);

  createdFiles.push(...wikiMutation.createdFiles.filter((file) => !createdFiles.includes(file)));
  updatedFiles.push(...wikiMutation.updatedFiles.filter((file) => !updatedFiles.includes(file)));

  return {
    workspace,
    source,
    createdDirectories: bootstrap.createdDirectories,
    createdFiles,
    updatedFiles,
    warnings,
    sourceSummary: normalizedAnalysis.result.sourceSummary,
    analysis: normalizedAnalysis.result,
    workstreams: wikiMutation.workstreams,
  };
}
