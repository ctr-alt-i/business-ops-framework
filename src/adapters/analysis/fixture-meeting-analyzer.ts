import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { MeetingAnalyzer, MeetingAnalyzerRequest } from "../../core/contracts/meeting-analyzer";
import type { MeetingAnalysisResult } from "../../core/types";
import type { MeetingAnalysisResultInput } from "../../core/domain/meeting-analysis";

export interface FixtureMeetingAnalyzerOptions {
  fixturesBySourceId?: Record<string, string>;
  fixturesByInputPath?: Record<string, string>;
  analyzerId?: string;
  promptVersion?: string;
  provider?: string;
  model?: string;
}

export class FixtureMeetingAnalyzer implements MeetingAnalyzer {
  readonly id: string;
  readonly promptVersion: string;

  private readonly fixturesBySourceId: Record<string, string>;
  private readonly fixturesByInputPath: Record<string, string>;
  private readonly provider: string;
  private readonly model: string;

  constructor(options: FixtureMeetingAnalyzerOptions = {}) {
    this.id = options.analyzerId ?? "fixture-meeting-analyzer";
    this.promptVersion = options.promptVersion ?? "fixture-v1";
    this.fixturesBySourceId = options.fixturesBySourceId ?? {};
    this.fixturesByInputPath = options.fixturesByInputPath ?? {};
    this.provider = options.provider ?? "fixture";
    this.model = options.model ?? "fixture://meeting-analysis";
  }

  async analyze(request: MeetingAnalyzerRequest): Promise<MeetingAnalysisResult> {
    const fixturePath = this.resolveFixturePath(request);
    const fixture = JSON.parse(await readFile(fixturePath, "utf8")) as MeetingAnalysisResultInput;

    return {
      meta: {
        sourceId: request.source.id,
        analyzerId: fixture.meta?.analyzerId ?? this.id,
        promptVersion: fixture.meta?.promptVersion ?? this.promptVersion,
        provider: fixture.meta?.provider ?? this.provider,
        model: fixture.meta?.model ?? this.model,
        analyzedAt: fixture.meta?.analyzedAt ?? request.source.ingestedAt,
        warnings: fixture.meta?.warnings ?? [],
      },
      sourceSummary: {
        sourceId: request.source.id,
        title: request.source.title,
        kind: request.source.kind,
        sourceDate: request.source.sourceDate,
        ingestedAt: request.source.ingestedAt,
        rawPath: request.source.rawPath,
        summary: fixture.sourceSummary?.summary ?? "",
        participants: fixture.sourceSummary?.participants ?? [],
        keyFacts: fixture.sourceSummary?.keyFacts ?? [],
        scopeIn: fixture.sourceSummary?.scopeIn ?? [],
        scopeOut: fixture.sourceSummary?.scopeOut ?? [],
        commercialNotes: fixture.sourceSummary?.commercialNotes ?? [],
        timelineNotes: fixture.sourceSummary?.timelineNotes ?? [],
        decisionsAndSignals: fixture.sourceSummary?.decisionsAndSignals ?? [],
        openQuestions: fixture.sourceSummary?.openQuestions ?? [],
        nextSteps: fixture.sourceSummary?.nextSteps ?? [],
      },
      decisions: fixture.decisions ?? [],
      actionItems: fixture.actionItems ?? [],
      futureWorkItems: fixture.futureWorkItems ?? [],
      approvalSignals: fixture.approvalSignals ?? [],
      risks: fixture.risks ?? [],
      stakeholders: fixture.stakeholders ?? [],
      scopeChanges: fixture.scopeChanges ?? [],
      commercialSnapshots: fixture.commercialSnapshots ?? [],
      timelineMilestones: fixture.timelineMilestones ?? [],
      rollupHints: fixture.rollupHints ?? [],
    } as unknown as MeetingAnalysisResult;
  }

  private resolveFixturePath(request: MeetingAnalyzerRequest): string {
    const explicitBySourceId = this.fixturesBySourceId[request.source.id];

    if (explicitBySourceId) {
      return resolve(explicitBySourceId);
    }

    const originalPath = request.source.originalPath ? resolve(request.source.originalPath) : undefined;

    if (originalPath && this.fixturesByInputPath[originalPath]) {
      return resolve(this.fixturesByInputPath[originalPath]);
    }

    throw new Error(`No analysis fixture was configured for source ${request.source.id}.`);
  }
}
