import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve, sep } from "node:path";

import {
  buildWorkstreamContexts,
  formatParticipantDisplay,
  normalizeMeetingAnalysisResult,
  type MeetingAnalysisResultInput,
} from "../../core/domain/meeting-analysis";
import type { MeetingAnalysisResult, SourceRecord, WorkstreamContext, WorkspaceDefinition } from "../../core/types";
import { renderActionTrackerPage, renderDecisionLogPage, renderFutureWorkPage, renderWorkstreamPage } from "../operations";
import { WORKSPACE_MARKERS } from "../workspace";

export interface WikiMutationResult {
  createdFiles: string[];
  updatedFiles: string[];
  analyses: MeetingAnalysisResult[];
  workstreams: WorkstreamContext[];
}

function ensureTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function toPosixPath(value: string): string {
  return value.split(sep).join("/");
}

function toRelativePosix(from: string, to: string): string {
  return toPosixPath(relative(from, to));
}

function renderBulletList(items: string[], placeholder: string): string {
  if (items.length === 0) {
    return `- ${placeholder}`;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

async function writeManagedTextFile(path: string, content: string): Promise<"created" | "updated" | "unchanged"> {
  const normalizedContent = ensureTrailingNewline(content);

  try {
    const currentContent = await readFile(path, "utf8");

    if (currentContent === normalizedContent) {
      return "unchanged";
    }

    await writeFile(path, normalizedContent, "utf8");
    return "updated";
  } catch {
    await writeFile(path, normalizedContent, "utf8");
    return "created";
  }
}

function summaryPathForSource(sourceId: string): string {
  return `wiki/sources/${sourceId}.md`;
}

function analysisPathForSource(sourceId: string): string {
  return `wiki/sources/${sourceId}.analysis.md`;
}

function sourceRecordFromAnalysis(analysis: MeetingAnalysisResult): SourceRecord {
  const summary = analysis.sourceSummary;

  return {
    id: summary.sourceId,
    title: summary.title,
    slug: summary.sourceId.replace(/^(20\d{2}-\d{2}-\d{2})-/, ""),
    kind: summary.kind,
    sourceDate: summary.sourceDate,
    ingestedAt: summary.ingestedAt,
    rawPath: summary.rawPath,
    summaryPath: summaryPathForSource(summary.sourceId),
    analysisPath: analysisPathForSource(summary.sourceId),
  };
}

function renderParticipants(analysis: MeetingAnalysisResult): string {
  return renderBulletList(
    analysis.sourceSummary.participants.map((participant) => formatParticipantDisplay(participant)),
    "No participants captured.",
  );
}

function renderKeyFacts(analysis: MeetingAnalysisResult): string {
  return renderBulletList(
    analysis.sourceSummary.keyFacts.map((fact) => `${fact.label}: ${fact.value}`),
    "No key facts captured.",
  );
}

function renderRelatedPages(
  workspace: WorkspaceDefinition,
  analysis: MeetingAnalysisResult,
  summaryAbsolutePath: string,
): string {
  const links = analysis.rollupHints.map((rollup) => {
    const folder = rollup.kind === "topic" ? workspace.paths.wikiTopics : workspace.paths.wikiProjects;
    const pagePath = resolve(folder, `${rollup.id}.md`);
    return `[${rollup.name}](${toRelativePosix(dirname(summaryAbsolutePath), pagePath)})`;
  });

  return renderBulletList(links, "No related project or topic pages yet.");
}

export function buildStructuredSourceSummaryPage(workspace: WorkspaceDefinition, analysis: MeetingAnalysisResult): string {
  const summary = analysis.sourceSummary;
  const summaryAbsolutePath = resolve(workspace.root, summaryPathForSource(summary.sourceId));
  const rawAbsolutePath = resolve(workspace.root, summary.rawPath);
  const rawLinkFromSummary = toRelativePosix(dirname(summaryAbsolutePath), rawAbsolutePath);

  return ensureTrailingNewline(`# ${summary.title}

- Source ID: \`${summary.sourceId}\`
- Kind: \`${summary.kind}\`
- Source date: \`${summary.sourceDate}\`
- Raw file: [${basename(summary.rawPath)}](${rawLinkFromSummary})
- Ingested at: \`${summary.ingestedAt}\`
- Status: \`summarized\`

## Participants
<!-- participants:auto -->
${renderParticipants(analysis)}

## Executive Summary
<!-- executive-summary:auto -->
${summary.summary}

## Key Facts
<!-- key-facts:auto -->
${renderKeyFacts(analysis)}

## Scope
### In scope
<!-- scope-in:auto -->
${renderBulletList(summary.scopeIn, "No in-scope items captured.")}

### Deferred / out of scope
<!-- scope-out:auto -->
${renderBulletList(summary.scopeOut, "No deferred or out-of-scope items captured.")}

## Commercials
<!-- commercials:auto -->
${renderBulletList(summary.commercialNotes, "No commercial notes captured.")}

## Timeline
<!-- timeline:auto -->
${renderBulletList(summary.timelineNotes, "No timeline notes captured.")}

## Decisions and Signals
<!-- decisions-signals:auto -->
${renderBulletList(summary.decisionsAndSignals, "No decisions or approval signals captured.")}

## Open Questions and Risks
<!-- open-questions-risks:auto -->
${renderBulletList(summary.openQuestions, "No open questions or risks captured.")}

## Next Steps
<!-- next-steps:auto -->
${renderBulletList(summary.nextSteps, "No next steps captured.")}

## Related Pages
${renderRelatedPages(workspace, analysis, summaryAbsolutePath)}`);
}

export function buildMeetingAnalysisArtifactPage(workspace: WorkspaceDefinition, analysis: MeetingAnalysisResult): string {
  const summary = analysis.sourceSummary;
  const artifactAbsolutePath = resolve(workspace.root, analysisPathForSource(summary.sourceId));
  const rawAbsolutePath = resolve(workspace.root, summary.rawPath);
  const summaryAbsolutePath = resolve(workspace.root, summaryPathForSource(summary.sourceId));
  const rawLink = toRelativePosix(dirname(artifactAbsolutePath), rawAbsolutePath);
  const summaryLink = toRelativePosix(dirname(artifactAbsolutePath), summaryAbsolutePath);
  const validationNotes = analysis.meta.warnings.length > 0 ? analysis.meta.warnings.map((warning) => `- ${warning}`).join("\n") : "- none";

  return ensureTrailingNewline(`# Analysis Artifact — ${summary.title}

- Source ID: \`${summary.sourceId}\`
- Raw file: [${basename(summary.rawPath)}](${rawLink})
- Summary page: [${basename(summaryPathForSource(summary.sourceId))}](${summaryLink})
- Analyzer: \`${analysis.meta.analyzerId}\`
- Prompt version: \`${analysis.meta.promptVersion}\`
- Provider: \`${analysis.meta.provider ?? "unknown"}\`
- Model: \`${analysis.meta.model}\`
- Analyzed at: \`${analysis.meta.analyzedAt}\`
- Status: \`complete\`

## Validation Notes
${validationNotes}

## Normalized Output
\`\`\`json
${JSON.stringify(analysis, null, 2)}
\`\`\``);
}

export function buildIndexEntry(source: SourceRecord, summaryLinkFromWikiRoot: string, rawLinkFromWikiRoot: string): string {
  return `- [${source.title}](${summaryLinkFromWikiRoot}) — \`${source.kind}\` from [${source.rawPath}](${rawLinkFromWikiRoot})`;
}

export function buildLogEntry(source: SourceRecord, summaryLinkFromWikiRoot: string, rawLinkFromWikiRoot: string): string {
  return `## [${source.sourceDate}] ingest | ${source.title}\n- Source ID: \`${source.id}\`\n- Kind: \`${source.kind}\`\n- Raw file: [${source.rawPath}](${rawLinkFromWikiRoot})\n- Summary page: [${summaryLinkFromWikiRoot}](${summaryLinkFromWikiRoot})\n- Analysis artifact: [sources/${source.id}.analysis.md](sources/${source.id}.analysis.md)\n- Result: source analyzed, summary rendered, rollups refreshed`;
}

function sortAnalysesDescending(analyses: MeetingAnalysisResult[]): MeetingAnalysisResult[] {
  return [...analyses].sort((left, right) => {
    if (left.sourceSummary.sourceDate !== right.sourceSummary.sourceDate) {
      return right.sourceSummary.sourceDate.localeCompare(left.sourceSummary.sourceDate);
    }

    return right.sourceSummary.sourceId.localeCompare(left.sourceSummary.sourceId);
  });
}

function buildIndexPage(workspace: WorkspaceDefinition, analyses: MeetingAnalysisResult[], workstreams: WorkstreamContext[]): string {
  const sortedAnalyses = sortAnalysesDescending(analyses);
  const sourceEntries = sortedAnalyses.map((analysis) => {
    const source = sourceRecordFromAnalysis(analysis);
    const summaryPath = resolve(workspace.root, source.summaryPath);
    const rawPath = resolve(workspace.root, source.rawPath);

    return buildIndexEntry(
      source,
      toRelativePosix(workspace.paths.wiki, summaryPath),
      toRelativePosix(workspace.paths.wiki, rawPath),
    );
  });
  const projects = workstreams.filter((workstream) => workstream.kind === "project");
  const topics = workstreams.filter((workstream) => workstream.kind === "topic");
  const projectSection =
    projects.length > 0
      ? projects.map((project) => `- [${project.name}](projects/${project.id}.md)`).join("\n")
      : "_No project pages yet._";
  const topicSection =
    topics.length > 0 ? topics.map((topic) => `- [${topic.name}](topics/${topic.id}.md)`).join("\n") : "_No topic pages yet._";

  return ensureTrailingNewline(`# Index

## Workspace
- [Overview](overview.md)
- [Log](log.md)

## Sources
${WORKSPACE_MARKERS.sources}
${sourceEntries.join("\n")}

## Projects
${projectSection}

## Entities
_No entity pages yet._

## Topics
${topicSection}

## Ops
- [Decision Log](ops/decision-log.md)
- [Action Tracker](ops/action-tracker.md)
- [Future Work](ops/future-work.md)`);
}

function buildLogPage(workspace: WorkspaceDefinition, analyses: MeetingAnalysisResult[]): string {
  const sortedAnalyses = sortAnalysesDescending(analyses);
  const entries = sortedAnalyses.map((analysis) => {
    const source = sourceRecordFromAnalysis(analysis);
    const summaryPath = resolve(workspace.root, source.summaryPath);
    const rawPath = resolve(workspace.root, source.rawPath);

    return buildLogEntry(
      source,
      toRelativePosix(workspace.paths.wiki, summaryPath),
      toRelativePosix(workspace.paths.wiki, rawPath),
    );
  });

  return ensureTrailingNewline(`# Log

Append-only workspace activity log.

${WORKSPACE_MARKERS.log}
${entries.join("\n")}`);
}

function parseArtifactJson(markdown: string): MeetingAnalysisResultInput {
  const match = markdown.match(/```json\n([\s\S]*?)\n```/);

  if (!match) {
    throw new Error("Analysis artifact did not contain a ```json fenced block.");
  }

  return JSON.parse(match[1]) as MeetingAnalysisResultInput;
}

export async function loadPersistedMeetingAnalyses(workspace: WorkspaceDefinition): Promise<MeetingAnalysisResult[]> {
  const files = (await readdir(workspace.paths.wikiSources))
    .filter((file) => file.endsWith(".analysis.md"))
    .sort();
  const analyses: MeetingAnalysisResult[] = [];

  for (const file of files) {
    const absolutePath = resolve(workspace.paths.wikiSources, file);
    const markdown = await readFile(absolutePath, "utf8");
    const parsed = parseArtifactJson(markdown);
    const sourceId = file.replace(/\.analysis\.md$/, "");
    const summary = parsed.sourceSummary;

    if (!summary) {
      throw new Error(`Analysis artifact ${file} did not contain sourceSummary.`);
    }

    const source: SourceRecord = {
      id: sourceId,
      title: summary.title ?? sourceId,
      slug: sourceId.replace(/^(20\d{2}-\d{2}-\d{2})-/, ""),
      kind: summary.kind ?? "meeting-transcript",
      sourceDate: summary.sourceDate ?? "1970-01-01",
      ingestedAt: summary.ingestedAt ?? new Date(0).toISOString(),
      rawPath: summary.rawPath ?? `raw/meetings/${sourceId}.md`,
      summaryPath: summaryPathForSource(sourceId),
      analysisPath: analysisPathForSource(sourceId),
    };
    const normalized = normalizeMeetingAnalysisResult(source, parsed);
    analyses.push(normalized.result);
  }

  return analyses;
}

export async function persistMeetingAnalysisArtifact(
  workspace: WorkspaceDefinition,
  analysis: MeetingAnalysisResult,
): Promise<"created" | "updated" | "unchanged"> {
  const absolutePath = resolve(workspace.root, analysisPathForSource(analysis.sourceSummary.sourceId));
  return writeManagedTextFile(absolutePath, buildMeetingAnalysisArtifactPage(workspace, analysis));
}

export async function rebuildWorkspaceWiki(workspace: WorkspaceDefinition): Promise<WikiMutationResult> {
  const analyses = await loadPersistedMeetingAnalyses(workspace);
  return refreshWorkspaceWikiFromAnalyses(workspace, analyses);
}

export async function refreshWorkspaceWikiFromAnalyses(
  workspace: WorkspaceDefinition,
  analyses: MeetingAnalysisResult[],
): Promise<WikiMutationResult> {
  const createdFiles: string[] = [];
  const updatedFiles: string[] = [];

  for (const analysis of analyses) {
    const summaryPath = summaryPathForSource(analysis.sourceSummary.sourceId);
    const summaryResult = await writeManagedTextFile(
      resolve(workspace.root, summaryPath),
      buildStructuredSourceSummaryPage(workspace, analysis),
    );

    if (summaryResult === "created") {
      createdFiles.push(summaryPath);
    }

    if (summaryResult === "updated") {
      updatedFiles.push(summaryPath);
    }
  }

  const workstreams = buildWorkstreamContexts(analyses);

  for (const workstream of workstreams) {
    const folder = workstream.kind === "topic" ? workspace.paths.wikiTopics : workspace.paths.wikiProjects;
    const absolutePath = resolve(folder, `${workstream.id}.md`);
    const relativePath = toPosixPath(relative(workspace.root, absolutePath));
    const result = await writeManagedTextFile(absolutePath, renderWorkstreamPage(workspace, workstream, analyses));

    if (result === "created") {
      createdFiles.push(relativePath);
    }

    if (result === "updated") {
      updatedFiles.push(relativePath);
    }
  }

  const indexResult = await writeManagedTextFile(workspace.paths.wikiIndexFile, buildIndexPage(workspace, analyses, workstreams));

  if (indexResult === "updated") {
    updatedFiles.push("wiki/index.md");
  }

  if (indexResult === "created") {
    createdFiles.push("wiki/index.md");
  }

  const logResult = await writeManagedTextFile(workspace.paths.wikiLogFile, buildLogPage(workspace, analyses));

  if (logResult === "updated") {
    updatedFiles.push("wiki/log.md");
  }

  if (logResult === "created") {
    createdFiles.push("wiki/log.md");
  }

  const decisionResult = await writeManagedTextFile(workspace.paths.wikiDecisionLogFile, renderDecisionLogPage(workspace, analyses));

  if (decisionResult === "updated") {
    updatedFiles.push("wiki/ops/decision-log.md");
  }

  if (decisionResult === "created") {
    createdFiles.push("wiki/ops/decision-log.md");
  }

  const actionResult = await writeManagedTextFile(workspace.paths.wikiActionTrackerFile, renderActionTrackerPage(workspace, analyses));

  if (actionResult === "updated") {
    updatedFiles.push("wiki/ops/action-tracker.md");
  }

  if (actionResult === "created") {
    createdFiles.push("wiki/ops/action-tracker.md");
  }

  const futureWorkResult = await writeManagedTextFile(workspace.paths.wikiFutureWorkFile, renderFutureWorkPage(workspace, analyses));

  if (futureWorkResult === "updated") {
    updatedFiles.push("wiki/ops/future-work.md");
  }

  if (futureWorkResult === "created") {
    createdFiles.push("wiki/ops/future-work.md");
  }

  return {
    createdFiles,
    updatedFiles,
    analyses,
    workstreams,
  };
}
