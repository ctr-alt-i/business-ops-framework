import type {
  ActionItem,
  ApprovalSignal,
  CommercialSnapshot,
  Decision,
  EvidenceReference,
  FutureWorkItem,
  KeyFact,
  MeetingAnalysisMeta,
  MeetingAnalysisResult,
  Participant,
  Risk,
  RollupHint,
  ScopeChange,
  SourceRecord,
  SourceSummary,
  Stakeholder,
  TimelineMilestone,
  WorkstreamContext,
} from "../types";

interface PartialParticipant extends Partial<Omit<Participant, "evidence">> {
  evidence?: Partial<EvidenceReference>[];
}

interface PartialKeyFact extends Partial<Omit<KeyFact, "evidence">> {
  evidence?: Partial<EvidenceReference>[];
}

interface PartialDecision extends Partial<Omit<Decision, "evidence">> {
  evidence?: Partial<EvidenceReference>[];
}

interface PartialActionItem extends Partial<Omit<ActionItem, "evidence">> {
  evidence?: Partial<EvidenceReference>[];
}

interface PartialFutureWorkItem extends Partial<Omit<FutureWorkItem, "evidence">> {
  evidence?: Partial<EvidenceReference>[];
}

interface PartialApprovalSignal extends Partial<Omit<ApprovalSignal, "evidence">> {
  evidence?: Partial<EvidenceReference>[];
}

interface PartialRisk extends Partial<Omit<Risk, "evidence">> {
  evidence?: Partial<EvidenceReference>[];
}

interface PartialStakeholder extends Partial<Stakeholder> {}

interface PartialScopeChange extends Partial<Omit<ScopeChange, "evidence">> {
  evidence?: Partial<EvidenceReference>[];
}

interface PartialCommercialSnapshot extends Partial<Omit<CommercialSnapshot, "evidence">> {
  evidence?: Partial<EvidenceReference>[];
}

interface PartialTimelineMilestone extends Partial<Omit<TimelineMilestone, "evidence">> {
  evidence?: Partial<EvidenceReference>[];
}

interface PartialRollupHint extends Partial<RollupHint> {}

interface PartialSourceSummary {
  sourceId?: string;
  title?: string;
  kind?: SourceSummary["kind"];
  sourceDate?: string;
  ingestedAt?: string;
  rawPath?: string;
  summary?: string;
  participants?: PartialParticipant[];
  keyFacts?: PartialKeyFact[];
  scopeIn?: string[];
  scopeOut?: string[];
  commercialNotes?: string[];
  timelineNotes?: string[];
  decisionsAndSignals?: string[];
  openQuestions?: string[];
  nextSteps?: string[];
}

export interface MeetingAnalysisResultInput {
  meta?: Partial<MeetingAnalysisMeta>;
  sourceSummary?: PartialSourceSummary;
  decisions?: PartialDecision[];
  actionItems?: PartialActionItem[];
  futureWorkItems?: PartialFutureWorkItem[];
  approvalSignals?: PartialApprovalSignal[];
  risks?: PartialRisk[];
  stakeholders?: PartialStakeholder[];
  scopeChanges?: PartialScopeChange[];
  commercialSnapshots?: PartialCommercialSnapshot[];
  timelineMilestones?: PartialTimelineMilestone[];
  rollupHints?: PartialRollupHint[];
}

export interface MeetingAnalysisNormalizationResult {
  result: MeetingAnalysisResult;
  warnings: string[];
}

const DECISION_STATUSES = new Set<string>(["proposed", "confirmed", "superseded"]);
const ACTION_STATUSES = new Set<string>(["open", "in-progress", "done", "blocked"]);
const FUTURE_WORK_CATEGORIES = new Set<string>(["idea", "request", "change", "expansion", "follow-on"]);
const FUTURE_WORK_STATUSES = new Set<string>(["open", "qualified", "archived"]);
const APPROVAL_STATUSES = new Set<string>(["approved", "pending", "rejected", "unclear"]);
const RISK_SEVERITIES = new Set<string>(["low", "medium", "high"]);
const SCOPE_CHANGE_TYPES = new Set<string>(["added", "removed", "deferred", "clarified"]);
const TIMELINE_STATUSES = new Set<string>(["proposed", "committed", "completed", "parked"]);
const ROLLUP_KINDS = new Set<string>(["project", "topic"]);
const KEY_FACT_CATEGORIES = new Set<string>([
  "participant",
  "system",
  "volume",
  "timeline",
  "commercial",
  "scope",
  "stakeholder",
  "other",
]);
const DECISION_ROLES = new Set<string>(["driver", "approver", "reviewer", "observer"]);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const key = value.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }

  return result;
}

function normalizeEvidence(source: SourceRecord, evidence: Partial<EvidenceReference>[] | undefined): EvidenceReference[] {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return [
      {
        sourceId: source.id,
        sourcePath: source.rawPath,
      },
    ];
  }

  return evidence.map((entry) => ({
    sourceId: entry.sourceId?.trim() || source.id,
    sourcePath: entry.sourcePath?.trim() || source.rawPath,
    quote: entry.quote?.trim() || undefined,
    lines: entry.lines?.trim() || undefined,
  }));
}

function normalizeStringArray(values: string[] | undefined): string[] {
  return uniqueStrings(Array.isArray(values) ? values : []);
}

function normalizeParticipant(source: SourceRecord, participant: PartialParticipant | undefined, index: number): Participant {
  const name = participant?.name?.trim() || `Participant ${index + 1}`;

  return {
    id: participant?.id?.trim() || slugify(name) || `${source.id}-participant-${index + 1}`,
    name,
    organization: participant?.organization?.trim() || undefined,
    role: participant?.role?.trim() || undefined,
    evidence: normalizeEvidence(source, participant?.evidence),
  };
}

function normalizeKeyFact(source: SourceRecord, fact: PartialKeyFact | undefined, index: number): KeyFact {
  const label = fact?.label?.trim() || `Fact ${index + 1}`;
  const value = fact?.value?.trim() || "Unspecified";
  const factCategory = fact?.category;
  const category: KeyFact["category"] = factCategory && KEY_FACT_CATEGORIES.has(factCategory) ? factCategory : "other";

  return {
    id: fact?.id?.trim() || `${source.id}-fact-${slugify(label) || index + 1}`,
    label,
    value,
    category,
    evidence: normalizeEvidence(source, fact?.evidence),
  };
}

function normalizeDecision(source: SourceRecord, decision: PartialDecision | undefined, index: number): Decision {
  const summary = decision?.summary?.trim() || `Decision ${index + 1}`;
  const decisionStatus = decision?.status;
  const status: Decision["status"] = decisionStatus && DECISION_STATUSES.has(decisionStatus) ? decisionStatus : "confirmed";

  return {
    id: decision?.id?.trim() || `${source.id}-decision-${index + 1}`,
    summary,
    status,
    rationale: decision?.rationale?.trim() || undefined,
    evidence: normalizeEvidence(source, decision?.evidence),
  };
}

function normalizeActionItem(source: SourceRecord, action: PartialActionItem | undefined, index: number): ActionItem {
  const summary = action?.summary?.trim() || `Action item ${index + 1}`;
  const actionStatus = action?.status;
  const status: ActionItem["status"] = actionStatus && ACTION_STATUSES.has(actionStatus) ? actionStatus : "open";

  return {
    id: action?.id?.trim() || `${source.id}-action-${index + 1}`,
    summary,
    owner: action?.owner?.trim() || undefined,
    dueDate: action?.dueDate?.trim() || undefined,
    status,
    evidence: normalizeEvidence(source, action?.evidence),
  };
}

function normalizeFutureWorkItem(
  source: SourceRecord,
  item: PartialFutureWorkItem | undefined,
  index: number,
): FutureWorkItem {
  const summary = item?.summary?.trim() || `Future work ${index + 1}`;
  const itemCategory = item?.category;
  const itemStatus = item?.status;
  const category: FutureWorkItem["category"] =
    itemCategory && FUTURE_WORK_CATEGORIES.has(itemCategory) ? itemCategory : "follow-on";
  const status: FutureWorkItem["status"] = itemStatus && FUTURE_WORK_STATUSES.has(itemStatus) ? itemStatus : "open";

  return {
    id: item?.id?.trim() || `${source.id}-future-work-${index + 1}`,
    summary,
    category,
    status,
    evidence: normalizeEvidence(source, item?.evidence),
  };
}

function normalizeApprovalSignal(
  source: SourceRecord,
  signal: PartialApprovalSignal | undefined,
  index: number,
): ApprovalSignal {
  const summary = signal?.summary?.trim() || `Approval signal ${index + 1}`;
  const signalStatus = signal?.status;
  const status: ApprovalSignal["status"] = signalStatus && APPROVAL_STATUSES.has(signalStatus) ? signalStatus : "unclear";

  return {
    id: signal?.id?.trim() || `${source.id}-approval-${index + 1}`,
    summary,
    status,
    evidence: normalizeEvidence(source, signal?.evidence),
  };
}

function normalizeRisk(source: SourceRecord, risk: PartialRisk | undefined, index: number): Risk {
  const summary = risk?.summary?.trim() || `Risk ${index + 1}`;
  const riskSeverity = risk?.severity;
  const severity: Risk["severity"] = riskSeverity && RISK_SEVERITIES.has(riskSeverity) ? riskSeverity : "medium";

  return {
    id: risk?.id?.trim() || `${source.id}-risk-${index + 1}`,
    summary,
    severity,
    evidence: normalizeEvidence(source, risk?.evidence),
  };
}

function normalizeStakeholder(source: SourceRecord, stakeholder: PartialStakeholder | undefined, index: number): Stakeholder {
  const name = stakeholder?.name?.trim() || `Stakeholder ${index + 1}`;
  const stakeholderDecisionRole = stakeholder?.decisionRole;
  const decisionRole =
    stakeholderDecisionRole && DECISION_ROLES.has(stakeholderDecisionRole) ? stakeholderDecisionRole : undefined;

  return {
    id: stakeholder?.id?.trim() || slugify(name) || `${source.id}-stakeholder-${index + 1}`,
    name,
    organization: stakeholder?.organization?.trim() || undefined,
    role: stakeholder?.role?.trim() || undefined,
    decisionRole,
    relatedSourceIds: uniqueStrings([...(stakeholder?.relatedSourceIds ?? []), source.id]),
  };
}

function normalizeScopeChange(source: SourceRecord, change: PartialScopeChange | undefined, index: number): ScopeChange {
  const summary = change?.summary?.trim() || `Scope change ${index + 1}`;
  const changeType = change?.type;
  const type: ScopeChange["type"] = changeType && SCOPE_CHANGE_TYPES.has(changeType) ? changeType : "clarified";

  return {
    id: change?.id?.trim() || `${source.id}-scope-change-${index + 1}`,
    summary,
    type,
    affectedArea: change?.affectedArea?.trim() || "unspecified",
    evidence: normalizeEvidence(source, change?.evidence),
  };
}

function normalizeCommercialSnapshot(
  source: SourceRecord,
  snapshot: PartialCommercialSnapshot | undefined,
  index: number,
): CommercialSnapshot {
  return {
    id: snapshot?.id?.trim() || `${source.id}-commercial-${index + 1}`,
    sourceId: snapshot?.sourceId?.trim() || source.id,
    buildPrice: snapshot?.buildPrice?.trim() || undefined,
    monthlyPrice: snapshot?.monthlyPrice?.trim() || undefined,
    paymentTerms: snapshot?.paymentTerms?.trim() || undefined,
    notes: snapshot?.notes?.trim() || undefined,
    evidence: normalizeEvidence(source, snapshot?.evidence),
  };
}

function normalizeTimelineMilestone(
  source: SourceRecord,
  milestone: PartialTimelineMilestone | undefined,
  index: number,
): TimelineMilestone {
  const summary = milestone?.summary?.trim() || `Timeline milestone ${index + 1}`;
  const milestoneStatus = milestone?.status;
  const status: TimelineMilestone["status"] =
    milestoneStatus && TIMELINE_STATUSES.has(milestoneStatus) ? milestoneStatus : "proposed";

  return {
    id: milestone?.id?.trim() || `${source.id}-timeline-${index + 1}`,
    summary,
    targetDate: milestone?.targetDate?.trim() || undefined,
    phase: milestone?.phase?.trim() || undefined,
    status,
    evidence: normalizeEvidence(source, milestone?.evidence),
  };
}

function normalizeRollupHint(hint: PartialRollupHint | undefined, index: number): RollupHint | undefined {
  if (!hint?.name?.trim()) {
    return undefined;
  }

  const hintKind = hint.kind;
  const kind: RollupHint["kind"] = hintKind && ROLLUP_KINDS.has(hintKind) ? hintKind : "project";
  const name = hint.name.trim();
  const id = hint.id?.trim() || slugify(name) || `rollup-${index + 1}`;

  return {
    kind,
    id,
    name,
  };
}

function buildMeta(source: SourceRecord, input: MeetingAnalysisResultInput, warnings: string[]): MeetingAnalysisMeta {
  const analyzedAt = input.meta?.analyzedAt?.trim() || source.ingestedAt;
  const analyzerId = input.meta?.analyzerId?.trim() || "unknown-analyzer";
  const promptVersion = input.meta?.promptVersion?.trim() || "unknown-prompt";
  const model = input.meta?.model?.trim() || "unknown-model";

  if (analyzerId === "unknown-analyzer") {
    warnings.push("Analyzer id was missing; defaulted to unknown-analyzer.");
  }

  if (promptVersion === "unknown-prompt") {
    warnings.push("Prompt version was missing; defaulted to unknown-prompt.");
  }

  if (model === "unknown-model") {
    warnings.push("Model name was missing; defaulted to unknown-model.");
  }

  return {
    sourceId: source.id,
    analyzerId,
    promptVersion,
    provider: input.meta?.provider?.trim() || undefined,
    model,
    analyzedAt,
    warnings: uniqueStrings([...(input.meta?.warnings ?? []), ...warnings]),
  };
}

export function normalizeMeetingAnalysisResult(
  source: SourceRecord,
  input: MeetingAnalysisResultInput,
): MeetingAnalysisNormalizationResult {
  const warnings: string[] = [];
  const sourceSummaryInput = input.sourceSummary ?? {};
  const participants = (sourceSummaryInput.participants ?? []).map((participant, index) =>
    normalizeParticipant(source, participant, index),
  );
  const keyFacts = (sourceSummaryInput.keyFacts ?? []).map((fact, index) => normalizeKeyFact(source, fact, index));
  const decisions = (input.decisions ?? []).map((decision, index) => normalizeDecision(source, decision, index));
  const approvalSignals = (input.approvalSignals ?? []).map((signal, index) =>
    normalizeApprovalSignal(source, signal, index),
  );
  const actionItems = (input.actionItems ?? []).map((action, index) => normalizeActionItem(source, action, index));
  const futureWorkItems = (input.futureWorkItems ?? []).map((item, index) =>
    normalizeFutureWorkItem(source, item, index),
  );
  const risks = (input.risks ?? []).map((risk, index) => normalizeRisk(source, risk, index));
  const stakeholders = (input.stakeholders ?? []).map((stakeholder, index) =>
    normalizeStakeholder(source, stakeholder, index),
  );
  const scopeChanges = (input.scopeChanges ?? []).map((change, index) => normalizeScopeChange(source, change, index));
  const commercialSnapshots = (input.commercialSnapshots ?? []).map((snapshot, index) =>
    normalizeCommercialSnapshot(source, snapshot, index),
  );
  const timelineMilestones = (input.timelineMilestones ?? []).map((milestone, index) =>
    normalizeTimelineMilestone(source, milestone, index),
  );
  const rollupHints = (input.rollupHints ?? [])
    .map((hint, index) => normalizeRollupHint(hint, index))
    .filter((hint): hint is RollupHint => Boolean(hint));

  const decisionsAndSignals = normalizeStringArray([
    ...(sourceSummaryInput.decisionsAndSignals ?? []),
    ...decisions.map((decision) => decision.summary),
    ...approvalSignals.map((signal) => signal.summary),
  ]);
  const openQuestions = normalizeStringArray([
    ...(sourceSummaryInput.openQuestions ?? []),
    ...risks.map((risk) => `Risk: ${risk.summary}`),
  ]);
  const nextSteps = normalizeStringArray([
    ...(sourceSummaryInput.nextSteps ?? []),
    ...actionItems.map((action) => action.summary),
  ]);
  const summaryText = sourceSummaryInput.summary?.trim() || "No summary provided.";

  if (summaryText === "No summary provided.") {
    warnings.push("Source summary text was missing; defaulted to a placeholder.");
  }

  const sourceSummary: SourceSummary = {
    sourceId: source.id,
    title: sourceSummaryInput.title?.trim() || source.title,
    kind: sourceSummaryInput.kind ?? source.kind,
    sourceDate: sourceSummaryInput.sourceDate?.trim() || source.sourceDate,
    ingestedAt: sourceSummaryInput.ingestedAt?.trim() || source.ingestedAt,
    rawPath: sourceSummaryInput.rawPath?.trim() || source.rawPath,
    summary: summaryText,
    participants,
    keyFacts,
    scopeIn: normalizeStringArray(sourceSummaryInput.scopeIn),
    scopeOut: normalizeStringArray(sourceSummaryInput.scopeOut),
    commercialNotes: normalizeStringArray(sourceSummaryInput.commercialNotes),
    timelineNotes: normalizeStringArray(sourceSummaryInput.timelineNotes),
    decisionsAndSignals,
    openQuestions,
    nextSteps,
  };

  const result: MeetingAnalysisResult = {
    meta: buildMeta(source, input, warnings),
    sourceSummary,
    decisions,
    actionItems,
    futureWorkItems,
    approvalSignals,
    risks,
    stakeholders,
    scopeChanges,
    commercialSnapshots,
    timelineMilestones,
    rollupHints,
  };

  return {
    result,
    warnings: result.meta.warnings,
  };
}

function dateSort(
  left: { sourceDate?: string; id: string },
  right: { sourceDate?: string; id: string },
): number {
  const leftDate = left.sourceDate ?? "";
  const rightDate = right.sourceDate ?? "";

  if (leftDate !== rightDate) {
    return leftDate.localeCompare(rightDate);
  }

  return left.id.localeCompare(right.id);
}

function mergeStakeholders(analyses: MeetingAnalysisResult[]): Stakeholder[] {
  const map = new Map<string, Stakeholder>();

  for (const analysis of analyses) {
    for (const stakeholder of analysis.stakeholders) {
      const existing = map.get(stakeholder.id);

      if (!existing) {
        map.set(stakeholder.id, { ...stakeholder, relatedSourceIds: [...stakeholder.relatedSourceIds] });
        continue;
      }

      existing.organization ??= stakeholder.organization;
      existing.role ??= stakeholder.role;
      existing.decisionRole ??= stakeholder.decisionRole;
      existing.relatedSourceIds = uniqueStrings([...existing.relatedSourceIds, ...stakeholder.relatedSourceIds]);
    }
  }

  return [...map.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function latestMeaningfulScope(analyses: MeetingAnalysisResult[]): string[] {
  const descending = [...analyses].sort((left, right) =>
    right.sourceSummary.sourceDate.localeCompare(left.sourceSummary.sourceDate),
  );

  for (const analysis of descending) {
    if (analysis.sourceSummary.scopeIn.length > 0) {
      return analysis.sourceSummary.scopeIn;
    }
  }

  return [];
}

function latestCommercialSnapshot(context: Pick<WorkstreamContext, "commercialHistory">): CommercialSnapshot | undefined {
  return context.commercialHistory[context.commercialHistory.length - 1];
}

function buildCurrentState(name: string, analyses: MeetingAnalysisResult[]): string {
  const ordered = [...analyses].sort((left, right) =>
    dateSort(
      { id: left.sourceSummary.sourceId, sourceDate: left.sourceSummary.sourceDate },
      { id: right.sourceSummary.sourceId, sourceDate: right.sourceSummary.sourceDate },
    ),
  );
  const latest = ordered[ordered.length - 1];
  const currentScope = latestMeaningfulScope(ordered);
  const deferredScope = uniqueStrings(ordered.flatMap((analysis) => analysis.sourceSummary.scopeOut));
  const commercialHistory = ordered.flatMap((analysis) => analysis.commercialSnapshots);
  const timelineHistory = ordered.flatMap((analysis) => analysis.timelineMilestones);
  const latestCommercial = commercialHistory[commercialHistory.length - 1];
  const latestTimeline = timelineHistory[timelineHistory.length - 1];
  const sentences: string[] = [];

  if (currentScope.length > 0) {
    sentences.push(`${name} currently includes ${currentScope.join("; ")}.`);
  }

  if (latestCommercial?.buildPrice || latestCommercial?.monthlyPrice) {
    const parts = [
      latestCommercial.buildPrice ? `build ${latestCommercial.buildPrice}` : undefined,
      latestCommercial.monthlyPrice ? `monthly ${latestCommercial.monthlyPrice}` : undefined,
    ].filter((part): part is string => Boolean(part));

    sentences.push(`Latest commercial snapshot: ${parts.join(", ")}.`);
  }

  if (latestTimeline?.summary) {
    const target = latestTimeline.targetDate ? ` Target date: ${latestTimeline.targetDate}.` : "";
    sentences.push(`Latest timeline milestone: ${latestTimeline.summary}.${target}`.replace(/\.\s*\./g, "."));
  } else if (latest?.sourceSummary.timelineNotes[0]) {
    sentences.push(`Latest timeline note: ${latest.sourceSummary.timelineNotes[0]}.`.replace(/\.\s*\./g, "."));
  }

  if (deferredScope.length > 0) {
    sentences.push(`Deferred or removed work includes ${deferredScope.join("; ")}.`);
  }

  return uniqueStrings(sentences.map((sentence) => sentence.replace(/\s+/g, " ").trim())).join(" ");
}

export function buildWorkstreamContexts(analyses: MeetingAnalysisResult[]): WorkstreamContext[] {
  const grouped = new Map<string, { rollup: RollupHint; analyses: MeetingAnalysisResult[] }>();

  for (const analysis of analyses) {
    for (const rollup of analysis.rollupHints) {
      const key = `${rollup.kind}:${rollup.id}`;
      const current = grouped.get(key);

      if (!current) {
        grouped.set(key, { rollup, analyses: [analysis] });
        continue;
      }

      current.analyses.push(analysis);
    }
  }

  return [...grouped.values()]
    .map(({ rollup, analyses: rollupAnalyses }) => {
      const orderedAnalyses = [...rollupAnalyses].sort((left, right) =>
        dateSort(
          { id: left.sourceSummary.sourceId, sourceDate: left.sourceSummary.sourceDate },
          { id: right.sourceSummary.sourceId, sourceDate: right.sourceSummary.sourceDate },
        ),
      );
      const stakeholders = mergeStakeholders(orderedAnalyses);
      const currentScope = latestMeaningfulScope(orderedAnalyses);
      const deferredScope = uniqueStrings(orderedAnalyses.flatMap((analysis) => analysis.sourceSummary.scopeOut));
      const scopeChanges = orderedAnalyses.flatMap((analysis) => analysis.scopeChanges);
      const commercialHistory = orderedAnalyses.flatMap((analysis) => analysis.commercialSnapshots);
      const timeline = orderedAnalyses.flatMap((analysis) => analysis.timelineMilestones);
      const openQuestions = uniqueStrings(orderedAnalyses.flatMap((analysis) => analysis.sourceSummary.openQuestions));
      const currentState = buildCurrentState(rollup.name, orderedAnalyses);

      return {
        kind: rollup.kind,
        id: rollup.id,
        name: rollup.name,
        currentState,
        summary: currentState,
        relatedSourceIds: orderedAnalyses.map((analysis) => analysis.sourceSummary.sourceId),
        stakeholderIds: stakeholders.map((stakeholder) => stakeholder.id),
        stakeholders,
        currentScope,
        deferredScope,
        scopeChanges,
        commercialHistory,
        timeline,
        openQuestions,
      } satisfies WorkstreamContext;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function formatParticipantDisplay(participant: Participant): string {
  const parts = [participant.name];

  if (participant.organization) {
    parts.push(participant.organization);
  }

  if (participant.role) {
    parts.push(participant.role);
  }

  return parts.join(" — ");
}

export function sortMeetingAnalyses(analyses: MeetingAnalysisResult[]): MeetingAnalysisResult[] {
  return [...analyses].sort((left, right) =>
    dateSort(
      { id: left.sourceSummary.sourceId, sourceDate: left.sourceSummary.sourceDate },
      { id: right.sourceSummary.sourceId, sourceDate: right.sourceSummary.sourceDate },
    ),
  );
}

export function latestWorkstreamCommercialSnapshot(context: WorkstreamContext): CommercialSnapshot | undefined {
  return latestCommercialSnapshot(context);
}
