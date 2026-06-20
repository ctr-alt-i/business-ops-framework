import type { MeetingAnalyzer } from "../../core/contracts/meeting-analyzer";

import { FixtureMeetingAnalyzer } from "./fixture-meeting-analyzer";
import { OpenAICompatibleMeetingAnalyzer } from "./openai-compatible-meeting-analyzer";

export { FixtureMeetingAnalyzer, OpenAICompatibleMeetingAnalyzer };

export function createDefaultMeetingAnalyzerFromEnv(): MeetingAnalyzer | undefined {
  const apiKey = process.env.MEETING_ANALYZER_API_KEY ?? process.env.OPENAI_API_KEY;
  const model = process.env.MEETING_ANALYZER_MODEL ?? process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    return undefined;
  }

  const timeoutMs = process.env.MEETING_ANALYZER_TIMEOUT_MS
    ? Number.parseInt(process.env.MEETING_ANALYZER_TIMEOUT_MS, 10)
    : undefined;

  return new OpenAICompatibleMeetingAnalyzer({
    apiKey,
    model,
    baseUrl: process.env.MEETING_ANALYZER_BASE_URL,
    provider: process.env.MEETING_ANALYZER_PROVIDER,
    analyzerId: process.env.MEETING_ANALYZER_ID,
    promptVersion: process.env.MEETING_ANALYZER_PROMPT_VERSION,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : undefined,
  });
}
