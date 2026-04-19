export type WorkspaceKind = "engagement";

export type RawSourceKind =
  | "meeting-transcript"
  | "meeting-notes"
  | "technical-doc"
  | "requirements-doc"
  | "backlog-doc"
  | "email-thread"
  | "chat-export"
  | "client-artifact";

export type DecisionStatus = "proposed" | "confirmed" | "superseded";
export type ActionStatus = "open" | "in-progress" | "done" | "blocked";
export type FutureWorkCategory = "idea" | "request" | "change" | "expansion" | "follow-on";
export type FutureWorkStatus = "open" | "qualified" | "archived";
export type ApprovalStatus = "approved" | "pending" | "rejected" | "unclear";
export type RiskSeverity = "low" | "medium" | "high";
export type RollupKind = "project" | "topic";
export type DecisionRole = "driver" | "approver" | "reviewer" | "observer";
export type ScopeChangeType = "added" | "removed" | "deferred" | "clarified";
export type TimelineStatus = "proposed" | "committed" | "completed" | "parked";

export interface WorkspacePaths {
  root: string;
  agentsFile: string;
  readmeFile: string;
  raw: string;
  rawMeetings: string;
  rawTechnical: string;
  rawCommunications: string;
  rawClients: string;
  wiki: string;
  wikiIndexFile: string;
  wikiLogFile: string;
  wikiOverviewFile: string;
  wikiSources: string;
  wikiEntities: string;
  wikiProjects: string;
  wikiTopics: string;
  wikiOps: string;
  wikiDecisionLogFile: string;
  wikiActionTrackerFile: string;
  wikiFutureWorkFile: string;
  outputs: string;
  outputsReports: string;
  outputsRecaps: string;
  outputsDecks: string;
  admin: string;
  adminLegal: string;
  adminFinance: string;
  archive: string;
}

export interface WorkspaceDefinition {
  kind: WorkspaceKind;
  name: string;
  slug: string;
  root: string;
  description?: string;
  paths: WorkspacePaths;
}

export interface WorkspaceValidationIssue {
  severity: "error" | "warning";
  path: string;
  message: string;
}

export interface WorkspaceValidationResult {
  valid: boolean;
  workspace: WorkspaceDefinition;
  issues: WorkspaceValidationIssue[];
}

export interface WorkspaceBootstrapResult {
  workspace: WorkspaceDefinition;
  createdDirectories: string[];
  createdFiles: string[];
  validation: WorkspaceValidationResult;
}

export interface WorkspaceLoadedFiles {
  agents?: string;
  readme?: string;
}

export interface WorkspaceLoadResult {
  workspace: WorkspaceDefinition;
  validation: WorkspaceValidationResult;
  files: WorkspaceLoadedFiles;
}

export interface EvidenceReference {
  sourceId: string;
  sourcePath: string;
  quote?: string;
  lines?: string;
}

export interface Participant {
  id: string;
  name: string;
  organization?: string;
  role?: string;
  evidence: EvidenceReference[];
}

export interface KeyFact {
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

export interface RollupHint {
  kind: RollupKind;
  id: string;
  name: string;
}

export interface SourceRecord {
  id: string;
  title: string;
  slug: string;
  kind: RawSourceKind;
  sourceDate: string;
  ingestedAt: string;
  rawPath: string;
  summaryPath: string;
  analysisPath: string;
  originalPath?: string;
}

export interface SourceSummary {
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

export interface Stakeholder {
  id: string;
  name: string;
  organization?: string;
  role?: string;
  decisionRole?: DecisionRole;
  relatedSourceIds: string[];
}

export interface ScopeChange {
  id: string;
  summary: string;
  type: ScopeChangeType;
  affectedArea: string;
  evidence: EvidenceReference[];
}

export interface CommercialSnapshot {
  id: string;
  sourceId: string;
  buildPrice?: string;
  monthlyPrice?: string;
  paymentTerms?: string;
  notes?: string;
  evidence: EvidenceReference[];
}

export interface TimelineMilestone {
  id: string;
  summary: string;
  targetDate?: string;
  phase?: string;
  status: TimelineStatus;
  evidence: EvidenceReference[];
}

export interface Decision {
  id: string;
  summary: string;
  status: DecisionStatus;
  rationale?: string;
  evidence: EvidenceReference[];
}

export interface ActionItem {
  id: string;
  summary: string;
  owner?: string;
  dueDate?: string;
  status: ActionStatus;
  evidence: EvidenceReference[];
}

export interface FutureWorkItem {
  id: string;
  summary: string;
  category: FutureWorkCategory;
  status: FutureWorkStatus;
  evidence: EvidenceReference[];
}

export interface ApprovalSignal {
  id: string;
  summary: string;
  status: ApprovalStatus;
  evidence: EvidenceReference[];
}

export interface Risk {
  id: string;
  summary: string;
  severity: RiskSeverity;
  evidence: EvidenceReference[];
}

export interface MeetingAnalysisMeta {
  sourceId: string;
  analyzerId: string;
  promptVersion: string;
  provider?: string;
  model: string;
  analyzedAt: string;
  warnings: string[];
}

export interface MeetingAnalysisResult {
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

export interface WorkstreamContext {
  kind: RollupKind;
  id: string;
  name: string;
  currentState: string;
  summary: string;
  relatedSourceIds: string[];
  stakeholderIds: string[];
  stakeholders: Stakeholder[];
  currentScope: string[];
  deferredScope: string[];
  scopeChanges: ScopeChange[];
  commercialHistory: CommercialSnapshot[];
  timeline: TimelineMilestone[];
  openQuestions: string[];
}

export interface ProjectContext extends WorkstreamContext {}

export interface IngestRequest {
  workspaceRoot: string;
  inputPath: string;
  kind?: RawSourceKind;
  title?: string;
  sourceDate?: string;
  ingestedAt?: string;
}

export interface IngestResult {
  workspace: WorkspaceDefinition;
  source: SourceRecord;
  createdDirectories: string[];
  createdFiles: string[];
  updatedFiles: string[];
  warnings: string[];
  sourceSummary?: SourceSummary;
  analysis?: MeetingAnalysisResult;
  workstreams?: WorkstreamContext[];
}
