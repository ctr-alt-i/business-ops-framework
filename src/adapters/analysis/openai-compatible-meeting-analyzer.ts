import type { MeetingAnalyzer, MeetingAnalyzerRequest } from "../../core/contracts/meeting-analyzer";
import type { MeetingAnalysisResult } from "../../core/types";
import type { MeetingAnalysisResultInput } from "../../core/domain/meeting-analysis";

export interface OpenAICompatibleMeetingAnalyzerOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  provider?: string;
  analyzerId?: string;
  promptVersion?: string;
  timeoutMs?: number;
  temperature?: number;
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

function objectSchema(properties: Record<string, unknown>, required: string[]): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required,
  };
}

function arraySchema(items: Record<string, unknown>): Record<string, unknown> {
  return {
    type: "array",
    items,
  };
}

const evidenceSchema = objectSchema(
  {
    sourceId: { type: "string" },
    sourcePath: { type: "string" },
    quote: { type: "string" },
    lines: { type: "string" },
  },
  ["sourceId", "sourcePath"],
);

const participantSchema = objectSchema(
  {
    id: { type: "string" },
    name: { type: "string" },
    organization: { type: "string" },
    role: { type: "string" },
    evidence: arraySchema(evidenceSchema),
  },
  ["name", "evidence"],
);

const keyFactSchema = objectSchema(
  {
    id: { type: "string" },
    label: { type: "string" },
    value: { type: "string" },
    category: {
      type: "string",
      enum: ["participant", "system", "volume", "timeline", "commercial", "scope", "stakeholder", "other"],
    },
    evidence: arraySchema(evidenceSchema),
  },
  ["label", "value", "category", "evidence"],
);

const decisionSchema = objectSchema(
  {
    id: { type: "string" },
    summary: { type: "string" },
    status: { type: "string", enum: ["proposed", "confirmed", "superseded"] },
    rationale: { type: "string" },
    evidence: arraySchema(evidenceSchema),
  },
  ["summary", "status", "evidence"],
);

const actionItemSchema = objectSchema(
  {
    id: { type: "string" },
    summary: { type: "string" },
    owner: { type: "string" },
    dueDate: { type: "string" },
    status: { type: "string", enum: ["open", "in-progress", "done", "blocked"] },
    evidence: arraySchema(evidenceSchema),
  },
  ["summary", "status", "evidence"],
);

const futureWorkItemSchema = objectSchema(
  {
    id: { type: "string" },
    summary: { type: "string" },
    category: { type: "string", enum: ["idea", "request", "change", "expansion", "follow-on"] },
    status: { type: "string", enum: ["open", "qualified", "archived"] },
    evidence: arraySchema(evidenceSchema),
  },
  ["summary", "category", "status", "evidence"],
);

const approvalSignalSchema = objectSchema(
  {
    id: { type: "string" },
    summary: { type: "string" },
    status: { type: "string", enum: ["approved", "pending", "rejected", "unclear"] },
    evidence: arraySchema(evidenceSchema),
  },
  ["summary", "status", "evidence"],
);

const riskSchema = objectSchema(
  {
    id: { type: "string" },
    summary: { type: "string" },
    severity: { type: "string", enum: ["low", "medium", "high"] },
    evidence: arraySchema(evidenceSchema),
  },
  ["summary", "severity", "evidence"],
);

const stakeholderSchema = objectSchema(
  {
    id: { type: "string" },
    name: { type: "string" },
    organization: { type: "string" },
    role: { type: "string" },
    decisionRole: { type: "string", enum: ["driver", "approver", "reviewer", "observer"] },
    relatedSourceIds: arraySchema({ type: "string" }),
  },
  ["name", "relatedSourceIds"],
);

const scopeChangeSchema = objectSchema(
  {
    id: { type: "string" },
    summary: { type: "string" },
    type: { type: "string", enum: ["added", "removed", "deferred", "clarified"] },
    affectedArea: { type: "string" },
    evidence: arraySchema(evidenceSchema),
  },
  ["summary", "type", "affectedArea", "evidence"],
);

const commercialSnapshotSchema = objectSchema(
  {
    id: { type: "string" },
    sourceId: { type: "string" },
    buildPrice: { type: "string" },
    monthlyPrice: { type: "string" },
    paymentTerms: { type: "string" },
    notes: { type: "string" },
    evidence: arraySchema(evidenceSchema),
  },
  ["sourceId", "evidence"],
);

const timelineMilestoneSchema = objectSchema(
  {
    id: { type: "string" },
    summary: { type: "string" },
    targetDate: { type: "string" },
    phase: { type: "string" },
    status: { type: "string", enum: ["proposed", "committed", "completed", "parked"] },
    evidence: arraySchema(evidenceSchema),
  },
  ["summary", "status", "evidence"],
);

const rollupHintSchema = objectSchema(
  {
    kind: { type: "string", enum: ["project", "topic"] },
    id: { type: "string" },
    name: { type: "string" },
  },
  ["kind", "id", "name"],
);

const meetingAnalysisPayloadSchema = objectSchema(
  {
    sourceSummary: objectSchema(
      {
        summary: { type: "string" },
        participants: arraySchema(participantSchema),
        keyFacts: arraySchema(keyFactSchema),
        scopeIn: arraySchema({ type: "string" }),
        scopeOut: arraySchema({ type: "string" }),
        commercialNotes: arraySchema({ type: "string" }),
        timelineNotes: arraySchema({ type: "string" }),
        decisionsAndSignals: arraySchema({ type: "string" }),
        openQuestions: arraySchema({ type: "string" }),
        nextSteps: arraySchema({ type: "string" }),
      },
      [
        "summary",
        "participants",
        "keyFacts",
        "scopeIn",
        "scopeOut",
        "commercialNotes",
        "timelineNotes",
        "decisionsAndSignals",
        "openQuestions",
        "nextSteps",
      ],
    ),
    decisions: arraySchema(decisionSchema),
    actionItems: arraySchema(actionItemSchema),
    futureWorkItems: arraySchema(futureWorkItemSchema),
    approvalSignals: arraySchema(approvalSignalSchema),
    risks: arraySchema(riskSchema),
    stakeholders: arraySchema(stakeholderSchema),
    scopeChanges: arraySchema(scopeChangeSchema),
    commercialSnapshots: arraySchema(commercialSnapshotSchema),
    timelineMilestones: arraySchema(timelineMilestoneSchema),
    rollupHints: arraySchema(rollupHintSchema),
  },
  [
    "sourceSummary",
    "decisions",
    "actionItems",
    "futureWorkItems",
    "approvalSignals",
    "risks",
    "stakeholders",
    "scopeChanges",
    "commercialSnapshots",
    "timelineMilestones",
    "rollupHints",
  ],
);

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_PROMPT_VERSION = "meeting-analysis-v1";

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

function buildSystemPrompt(): string {
  return [
    "You are extracting one structured meeting analysis result from a single business meeting source.",
    "Return JSON only.",
    "Do not invent facts that are not supported by the source.",
    "Handle varied source formats including transcript-like speaker turns, notes, recap docs, Zoom, Teams, and Fathom exports.",
    "Keep summaries concise and operationally useful.",
    "Every extracted object should include at least one evidence reference back to this source.",
    "Use rollupHints only when the source clearly belongs to an ongoing project or topic.",
  ].join(" ");
}

function buildUserPrompt(request: MeetingAnalyzerRequest): string {
  return [
    `Source ID: ${request.source.id}`,
    `Title: ${request.source.title}`,
    `Kind: ${request.source.kind}`,
    `Source date: ${request.source.sourceDate}`,
    `Raw path: ${request.source.rawPath}`,
    "",
    "Return a structured meeting analysis payload matching the provided JSON schema.",
    "",
    "Source text:",
    request.rawText,
  ].join("\n");
}

export class OpenAICompatibleMeetingAnalyzer implements MeetingAnalyzer {
  readonly id: string;
  readonly promptVersion: string;

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly provider: string;
  private readonly timeoutMs: number;
  private readonly temperature: number;

  constructor(options: OpenAICompatibleMeetingAnalyzerOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.provider = options.provider ?? "openai-compatible";
    this.id = options.analyzerId ?? `${this.provider}-meeting-analyzer`;
    this.promptVersion = options.promptVersion ?? DEFAULT_PROMPT_VERSION;
    this.timeoutMs = options.timeoutMs ?? 60_000;
    this.temperature = options.temperature ?? 0;
  }

  async analyze(request: MeetingAnalyzerRequest): Promise<MeetingAnalysisResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: this.temperature,
          messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: buildUserPrompt(request) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "meeting_analysis_payload",
              strict: true,
              schema: meetingAnalysisPayloadSchema,
            },
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Model request failed with ${response.status}: ${await response.text()}`);
      }

      const body = (await response.json()) as OpenAIChatCompletionResponse;
      const content = extractMessageContent(body);
      const payload = JSON.parse(content) as MeetingAnalysisResultInput;

      return {
        meta: {
          sourceId: request.source.id,
          analyzerId: this.id,
          promptVersion: this.promptVersion,
          provider: this.provider,
          model: this.model,
          analyzedAt: new Date().toISOString(),
          warnings: [],
        },
        sourceSummary: {
          sourceId: request.source.id,
          title: request.source.title,
          kind: request.source.kind,
          sourceDate: request.source.sourceDate,
          ingestedAt: request.source.ingestedAt,
          rawPath: request.source.rawPath,
          summary: payload.sourceSummary?.summary ?? "",
          participants: payload.sourceSummary?.participants ?? [],
          keyFacts: payload.sourceSummary?.keyFacts ?? [],
          scopeIn: payload.sourceSummary?.scopeIn ?? [],
          scopeOut: payload.sourceSummary?.scopeOut ?? [],
          commercialNotes: payload.sourceSummary?.commercialNotes ?? [],
          timelineNotes: payload.sourceSummary?.timelineNotes ?? [],
          decisionsAndSignals: payload.sourceSummary?.decisionsAndSignals ?? [],
          openQuestions: payload.sourceSummary?.openQuestions ?? [],
          nextSteps: payload.sourceSummary?.nextSteps ?? [],
        },
        decisions: payload.decisions ?? [],
        actionItems: payload.actionItems ?? [],
        futureWorkItems: payload.futureWorkItems ?? [],
        approvalSignals: payload.approvalSignals ?? [],
        risks: payload.risks ?? [],
        stakeholders: payload.stakeholders ?? [],
        scopeChanges: payload.scopeChanges ?? [],
        commercialSnapshots: payload.commercialSnapshots ?? [],
        timelineMilestones: payload.timelineMilestones ?? [],
        rollupHints: payload.rollupHints ?? [],
      } as unknown as MeetingAnalysisResult;
    } finally {
      clearTimeout(timeout);
    }
  }
}
