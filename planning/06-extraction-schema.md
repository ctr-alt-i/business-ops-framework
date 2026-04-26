# Extraction Schema

The extraction schema should stay small, source-linked, and easy to persist on disk.
Session 1 only needed core types for workspace + ingest.
The next gate should shift from many hand-authored heuristics toward **one schema-constrained meeting analysis call per source**, followed by deterministic validation, normalization, and wiki rendering.

## Design rules

- every extracted object links back to source evidence
- one meeting source should produce one structured analysis result
- model-assisted extraction should be persisted on disk so it remains inspectable
- keep ids stable and markdown-friendly
- prefer simple strings and lists over deeply nested output where possible
- deterministic rendering and file mutations still matter even if semantic extraction is model-assisted
- the wiki should answer curated questions from generated memory pages, not by rereading a raw fixture that contains its own answer key

## Analysis artifact metadata

Persist metadata for every analysis run so the result is reviewable and reproducible enough for debugging.

```ts
interface MeetingAnalysisMeta {
  sourceId: string;
  analyzerId: string;
  promptVersion: string;
  model: string;
  analyzedAt: string;
  warnings?: string[];
}
```

## Shared evidence shape

```ts
interface EvidenceReference {
  sourceId: string;
  sourcePath: string;
  quote?: string;
  lines?: string;
}
```

## Participant

```ts
interface Participant {
  id: string;
  name: string;
  organization?: string;
  role?: string;
  evidence: EvidenceReference[];
}
```

## Key fact

Use a small, explicit fact object for single-source recall.

```ts
interface KeyFact {
  id: string;
  label: string;
  value: string;
  category:
    | "participant"
    | "system"
    | "volume"
    | "timeline"
    | "commercial"
    | "scope"
    | "stakeholder"
    | "other";
  evidence: EvidenceReference[];
}
```

## Source summary

The source summary should be the concise, human-readable output rendered into the wiki.

```ts
interface SourceSummary {
  sourceId: string;
  title: string;
  kind: RawSourceKind;
  sourceDate: string;
  ingestedAt: string;
  rawPath: string;
  summary: string;
  participants: Participant[];
  keyFacts: KeyFact[];
  scopeIn: string[];
  scopeOut: string[];
  commercialNotes: string[];
  timelineNotes: string[];
  decisionsAndSignals: string[];
  openQuestions: string[];
  nextSteps: string[];
}
```

## Stakeholder

```ts
interface Stakeholder {
  id: string;
  name: string;
  organization?: string;
  role?: string;
  decisionRole?: "driver" | "approver" | "reviewer" | "observer";
  relatedSourceIds: string[];
}
```

## Scope change

```ts
interface ScopeChange {
  id: string;
  summary: string;
  type: "added" | "removed" | "deferred" | "clarified";
  affectedArea: string;
  evidence: EvidenceReference[];
}
```

## Commercial snapshot

```ts
interface CommercialSnapshot {
  id: string;
  sourceId: string;
  buildPrice?: string;
  monthlyPrice?: string;
  paymentTerms?: string;
  notes?: string;
  evidence: EvidenceReference[];
}
```

## Timeline milestone

```ts
interface TimelineMilestone {
  id: string;
  summary: string;
  targetDate?: string;
  phase?: string;
  status: "proposed" | "committed" | "completed" | "parked";
  evidence: EvidenceReference[];
}
```

## Decision

```ts
interface Decision {
  id: string;
  summary: string;
  status: "proposed" | "confirmed" | "superseded";
  rationale?: string;
  evidence: EvidenceReference[];
}
```

## Action item

```ts
interface ActionItem {
  id: string;
  summary: string;
  owner?: string;
  dueDate?: string;
  status: "open" | "in-progress" | "done" | "blocked";
  evidence: EvidenceReference[];
}
```

## Future work item

```ts
interface FutureWorkItem {
  id: string;
  summary: string;
  category: "idea" | "request" | "change" | "expansion" | "follow-on";
  status: "open" | "qualified" | "archived";
  evidence: EvidenceReference[];
}
```

## Approval signal

```ts
interface ApprovalSignal {
  id: string;
  summary: string;
  status: "approved" | "pending" | "rejected" | "unclear";
  evidence: EvidenceReference[];
}
```

## Risk

```ts
interface Risk {
  id: string;
  summary: string;
  severity: "low" | "medium" | "high";
  evidence: EvidenceReference[];
}
```

## Rollup hint

The analyzer may suggest likely rollup targets, but final rollup mutation can still be deterministic.

```ts
interface RollupHint {
  kind: "project" | "topic";
  id: string;
  name: string;
}
```

## Meeting analysis result

This is the canonical single-source output of the analysis pass.

```ts
interface MeetingAnalysisResult {
  meta: MeetingAnalysisMeta;
  sourceSummary: SourceSummary;
  decisions: Decision[];
  actionItems: ActionItem[];
  futureWorkItems: FutureWorkItem[];
  approvalSignals: ApprovalSignal[];
  risks: Risk[];
  stakeholders: Stakeholder[];
  scopeChanges: ScopeChange[];
  commercialSnapshots: CommercialSnapshot[];
  timelineMilestones: TimelineMilestone[];
  rollupHints: RollupHint[];
}
```

## Project context / multi-meeting rollup

This is the minimal cross-source object needed for temporal reasoning and change tracking.
It can be built deterministically from structured source analyses rather than from rereading raw transcripts.

```ts
interface ProjectContext {
  id: string;
  name: string;
  summary: string;
  relatedSourceIds: string[];
  stakeholderIds: string[];
  currentScope: string[];
  deferredScope: string[];
  scopeChanges: ScopeChange[];
  commercialHistory: CommercialSnapshot[];
  timeline: TimelineMilestone[];
  openQuestions: string[];
}
```

## Next implementation target

The next implementation session should add:

- one structured meeting analysis call per ingested meeting source
- persisted analysis artifacts with prompt/model metadata and normalized output
- structured source summaries rendered from that normalized output
- participant and stakeholder extraction flexible enough for multiple transcript formats
- scope/commercial/timeline change extraction from the structured analysis result
- project/topic rollups across multiple meetings built from source-level analysis results
- schema validation and reviewability before broader semantic scoring
