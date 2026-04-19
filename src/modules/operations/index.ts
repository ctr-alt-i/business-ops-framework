import { dirname, relative, resolve, sep } from "node:path";

import type { ActionItem, CommercialSnapshot, FutureWorkItem, MeetingAnalysisResult, WorkstreamContext, WorkspaceDefinition } from "../../core/types";

function ensureTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function toPosixPath(value: string): string {
  return value.split(sep).join("/");
}

function relativeLink(fromFile: string, toFile: string): string {
  return toPosixPath(relative(dirname(fromFile), toFile));
}

function summaryPathForSource(workspace: WorkspaceDefinition, sourceId: string): string {
  return resolve(workspace.root, "wiki", "sources", `${sourceId}.md`);
}

function rawPathForAnalysis(workspace: WorkspaceDefinition, analysis: MeetingAnalysisResult): string {
  return resolve(workspace.root, analysis.sourceSummary.rawPath);
}

function renderBulletList(items: string[], placeholder: string): string {
  if (items.length === 0) {
    return `- ${placeholder}`;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function sortAnalyses(analyses: MeetingAnalysisResult[]): MeetingAnalysisResult[] {
  return [...analyses].sort((left, right) => {
    if (left.sourceSummary.sourceDate !== right.sourceSummary.sourceDate) {
      return left.sourceSummary.sourceDate.localeCompare(right.sourceSummary.sourceDate);
    }

    return left.sourceSummary.sourceId.localeCompare(right.sourceSummary.sourceId);
  });
}

function formatStakeholderLine(stakeholder: WorkstreamContext["stakeholders"][number]): string {
  const parts = [stakeholder.name];

  if (stakeholder.organization) {
    parts.push(stakeholder.organization);
  }

  if (stakeholder.role) {
    parts.push(stakeholder.role);
  }

  if (stakeholder.decisionRole) {
    parts.push(stakeholder.decisionRole);
  }

  return parts.join(" — ");
}

function latestCommercialSnapshot(context: WorkstreamContext): CommercialSnapshot | undefined {
  return context.commercialHistory[context.commercialHistory.length - 1];
}

function buildCommercialNotes(context: WorkstreamContext): string {
  const first = context.commercialHistory[0];
  const latest = latestCommercialSnapshot(context);
  const middle = context.commercialHistory.length > 2 ? context.commercialHistory.slice(1, -1) : [];
  const parts: string[] = [];

  if (first?.buildPrice || first?.monthlyPrice) {
    parts.push(
      `Started as ${first.buildPrice ?? "an initial build estimate"}${first.monthlyPrice ? ` with ${first.monthlyPrice}/month support` : ""}`,
    );
  }

  for (const snapshot of middle) {
    if (snapshot.notes) {
      parts.push(snapshot.notes.replace(/[.]$/, ""));
      continue;
    }

    if (snapshot.buildPrice || snapshot.monthlyPrice) {
      parts.push(
        `Moved to ${snapshot.buildPrice ?? "a revised build estimate"}${snapshot.monthlyPrice ? ` with ${snapshot.monthlyPrice}/month support` : ""}`,
      );
    }
  }

  if (latest && latest !== first) {
    if (latest.notes) {
      parts.push(latest.notes.replace(/[.]$/, ""));
    } else if (latest.buildPrice || latest.monthlyPrice) {
      parts.push(
        `Current commercial state is ${latest.buildPrice ?? "the latest build estimate"}${latest.monthlyPrice ? ` with ${latest.monthlyPrice}/month support` : ""}`,
      );
    }
  }

  return parts.length > 0 ? `${parts.join("; ")}.` : "No commercial history captured yet.";
}

function buildTimelineSnapshot(context: WorkstreamContext): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const milestone of context.timeline) {
    const line = milestone.targetDate
      ? `${milestone.phase ? `${milestone.phase}: ` : ""}${milestone.summary.replace(/[.]$/, "")} — target ${milestone.targetDate}`
      : `${milestone.phase ? `${milestone.phase}: ` : ""}${milestone.summary.replace(/[.]$/, "")}`;
    const key = line.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      lines.push(line);
    }
  }

  return lines;
}

function buildChangeNotes(context: WorkstreamContext): string[] {
  const notes = context.scopeChanges.map((change) => change.summary.replace(/[.]$/, ""));
  const firstCommercial = context.commercialHistory[0];
  const latestCommercial = latestCommercialSnapshot(context);
  const hasSixWeekEstimate = context.timeline.some((milestone) => /six-week|six weeks/i.test(milestone.summary));
  const hasPhasedPlan = context.timeline.some((milestone) => /eight-week|eight weeks|phase 1|phase 2|phase 3/i.test(milestone.summary));

  if (firstCommercial && latestCommercial && firstCommercial.id !== latestCommercial.id) {
    notes.push(
      `Commercials progressed from ${firstCommercial.buildPrice ?? "an earlier build estimate"}${firstCommercial.monthlyPrice ? ` plus ${firstCommercial.monthlyPrice}/month` : ""} to ${latestCommercial.buildPrice ?? "the latest proposal"}${latestCommercial.monthlyPrice ? ` plus ${latestCommercial.monthlyPrice}/month` : ""}`,
    );
  }

  if (hasSixWeekEstimate && hasPhasedPlan) {
    notes.push("Timeline evolved from a six-week estimate to an eight-week phased delivery plan");
  }

  const deduped = new Set<string>();
  const result: string[] = [];

  for (const note of notes) {
    const key = note.toLowerCase();

    if (!deduped.has(key)) {
      deduped.add(key);
      result.push(note);
    }
  }

  return result;
}

export function renderDecisionLogPage(workspace: WorkspaceDefinition, analyses: MeetingAnalysisResult[]): string {
  const entries = sortAnalyses(analyses).flatMap((analysis) =>
    analysis.decisions.map((decision) => {
      const decisionLogPath = workspace.paths.wikiDecisionLogFile;
      const summaryPath = summaryPathForSource(workspace, analysis.sourceSummary.sourceId);
      const rawPath = rawPathForAnalysis(workspace, analysis);

      return {
        sourceDate: analysis.sourceSummary.sourceDate,
        sourceTitle: analysis.sourceSummary.title,
        line: `- [${decision.status}] ${decision.summary.replace(/[.]$/, "")}. ([summary](${relativeLink(decisionLogPath, summaryPath)}); [raw](${relativeLink(decisionLogPath, rawPath)}))`,
      };
    }),
  );

  return ensureTrailingNewline(
    `# Decision Log\n\n<!-- decisions:auto -->\n${
      entries.length > 0
        ? entries
            .map((entry) => `## ${entry.sourceDate} — ${entry.sourceTitle}\n${entry.line}`)
            .join("\n")
        : "- No decisions recorded yet."
    }`,
  );
}

function formatActionLine(workspace: WorkspaceDefinition, analysis: MeetingAnalysisResult, action: ActionItem): string {
  const actionTrackerPath = workspace.paths.wikiActionTrackerFile;
  const summaryPath = summaryPathForSource(workspace, analysis.sourceSummary.sourceId);
  const rawPath = rawPathForAnalysis(workspace, analysis);
  const owner = action.owner ? `${action.owner} — ` : "";
  const due = action.dueDate ? ` — due ${action.dueDate}` : "";

  return `- [${action.status}] ${owner}${action.summary.replace(/[.]$/, "")}${due} ([summary](${relativeLink(actionTrackerPath, summaryPath)}); [raw](${relativeLink(actionTrackerPath, rawPath)}))`;
}

export function renderActionTrackerPage(workspace: WorkspaceDefinition, analyses: MeetingAnalysisResult[]): string {
  const entries = sortAnalyses(analyses).flatMap((analysis) =>
    analysis.actionItems.map((action) => ({
      sourceDate: analysis.sourceSummary.sourceDate,
      sourceTitle: analysis.sourceSummary.title,
      line: formatActionLine(workspace, analysis, action),
    })),
  );

  return ensureTrailingNewline(
    `# Action Tracker\n\n<!-- actions:auto -->\n${
      entries.length > 0
        ? entries.map((entry) => `## ${entry.sourceDate} — ${entry.sourceTitle}\n${entry.line}`).join("\n")
        : "- No action items recorded yet."
    }`,
  );
}

function formatFutureWorkLine(workspace: WorkspaceDefinition, analysis: MeetingAnalysisResult, item: FutureWorkItem): string {
  const futureWorkPath = workspace.paths.wikiFutureWorkFile;
  const summaryPath = summaryPathForSource(workspace, analysis.sourceSummary.sourceId);
  const rawPath = rawPathForAnalysis(workspace, analysis);

  return `- [${item.category}/${item.status}] ${item.summary.replace(/[.]$/, "")} ([summary](${relativeLink(futureWorkPath, summaryPath)}); [raw](${relativeLink(futureWorkPath, rawPath)}))`;
}

export function renderFutureWorkPage(workspace: WorkspaceDefinition, analyses: MeetingAnalysisResult[]): string {
  const entries = sortAnalyses(analyses).flatMap((analysis) =>
    analysis.futureWorkItems.map((item) => ({
      sourceDate: analysis.sourceSummary.sourceDate,
      sourceTitle: analysis.sourceSummary.title,
      line: formatFutureWorkLine(workspace, analysis, item),
    })),
  );

  return ensureTrailingNewline(
    `# Future Work\n\n<!-- future-work:auto -->\n${
      entries.length > 0
        ? entries.map((entry) => `## ${entry.sourceDate} — ${entry.sourceTitle}\n${entry.line}`).join("\n")
        : "- No future work items recorded yet."
    }`,
  );
}

export function renderWorkstreamPage(
  workspace: WorkspaceDefinition,
  context: WorkstreamContext,
  analyses: MeetingAnalysisResult[],
): string {
  const workstreamFolder = context.kind === "topic" ? workspace.paths.wikiTopics : workspace.paths.wikiProjects;
  const workstreamPath = resolve(workstreamFolder, `${context.id}.md`);
  const sourceLookup = new Map(analyses.map((analysis) => [analysis.sourceSummary.sourceId, analysis]));
  const relatedAnalyses = context.relatedSourceIds
    .map((sourceId) => sourceLookup.get(sourceId))
    .filter((analysis): analysis is MeetingAnalysisResult => Boolean(analysis));
  const currentCommercial = latestCommercialSnapshot(context);
  const commercialSnapshot = [
    currentCommercial?.buildPrice ? `Current build price: ${currentCommercial.buildPrice}` : undefined,
    currentCommercial?.monthlyPrice ? `Current monthly retainer: ${currentCommercial.monthlyPrice}` : undefined,
    `Notes: ${buildCommercialNotes(context)}`,
  ].filter((line): line is string => Boolean(line));
  const timelineSnapshot = buildTimelineSnapshot(context);
  const changeNotes = buildChangeNotes(context);
  const sourceHistory = relatedAnalyses.map((analysis) => {
    const summaryPath = summaryPathForSource(workspace, analysis.sourceSummary.sourceId);
    return `[${analysis.sourceSummary.sourceDate} ${analysis.sourceSummary.title}](${relativeLink(workstreamPath, summaryPath)})`;
  });

  return ensureTrailingNewline(`# ${context.name}

## Current State
<!-- current-state:auto -->
${context.currentState || "Current rollup state has not been summarized yet."}

## Stakeholders
<!-- stakeholders:auto -->
${renderBulletList(context.stakeholders.map(formatStakeholderLine), "No stakeholders captured yet.")}

## Scope Snapshot
### Current in scope
<!-- current-scope:auto -->
${renderBulletList(context.currentScope, "No current scope captured yet.")}

### Deferred / removed
<!-- deferred-scope:auto -->
${renderBulletList(context.deferredScope, "No deferred scope captured yet.")}

## Commercial Snapshot
<!-- commercial-snapshot:auto -->
${renderBulletList(commercialSnapshot, "No commercial snapshot captured yet.")}

## Timeline Snapshot
<!-- timeline-snapshot:auto -->
${renderBulletList(timelineSnapshot, "No timeline snapshot captured yet.")}

## Scope and Timeline Changes
<!-- changes:auto -->
${renderBulletList(changeNotes, "No scope or timeline changes captured yet.")}

## Open Questions
<!-- open-questions:auto -->
${renderBulletList(context.openQuestions, "No open questions captured yet.")}

## Source History
<!-- source-history:auto -->
${renderBulletList(sourceHistory, "No related source history captured yet.")}`);
}
