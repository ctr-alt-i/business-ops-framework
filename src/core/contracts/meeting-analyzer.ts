import type { MeetingAnalysisResult, SourceRecord } from "../types";

export interface MeetingAnalyzerRequest {
  source: SourceRecord;
  rawText: string;
}

export interface MeetingAnalyzer {
  readonly id: string;
  readonly promptVersion: string;
  analyze(request: MeetingAnalyzerRequest): Promise<MeetingAnalysisResult>;
}
