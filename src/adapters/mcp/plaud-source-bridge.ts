import type { McpServerConfig, McpToolInvoker, VendorMcpSourceBridge } from "../../core/contracts/mcp-bridge";
import type { SourceAdapter } from "../../core/contracts/source-adapter";
import type {
  ExternalSourceRef,
  RawSourceKind,
  SourceDiscoveryRequest,
  SourceDiscoveryResult,
  SourceMaterial,
} from "../../core/types";

export const PLAUD_MCP_BRIDGE_ID = "plaud-mcp";
export const PLAUD_MCP_BRIDGE_NAME = "Plaud MCP Source Bridge";
export const PLAUD_MCP_HTTP_ENDPOINT = "https://mcp.plaud.ai/mcp";

export const PLAUD_MCP_STDIO_SERVER = {
  transport: "stdio",
  command: "npx",
  args: ["-y", "@plaud-ai/mcp@latest"],
} as const satisfies McpServerConfig;

export const PLAUD_MCP_HTTP_SERVER = {
  transport: "http",
  url: PLAUD_MCP_HTTP_ENDPOINT,
  authentication: "oauth",
} as const satisfies McpServerConfig;

type PlaudFileRecord = Record<string, unknown>;

type PlaudFileIdArgumentName = "file_id" | "id" | string;

export interface PlaudMcpSourceBridgeOptions {
  server: McpServerConfig;
  id?: string;
  name?: string;
  defaultKind?: RawSourceKind;
  fileIdArgumentName?: PlaudFileIdArgumentName;
}

export interface PlaudFileMappingOptions {
  adapterId?: string;
  defaultKind?: RawSourceKind;
}

export interface CoercedPlaudListFilesResponse {
  files: PlaudFileRecord[];
  nextCursor?: string;
}

export interface PlaudListFilesArguments extends Record<string, unknown> {
  query?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

const PLAUD_ID_KEYS = ["id", "file_id", "fileId", "uuid"];
const PLAUD_TITLE_KEYS = ["name", "title", "file_name", "fileName"];
const PLAUD_CREATED_AT_KEYS = ["created_at", "createdAt"];
const PLAUD_UPDATED_AT_KEYS = ["updated_at", "updatedAt"];
const PLAUD_START_AT_KEYS = ["start_at", "startAt", "started_at", "startedAt"];
const PLAUD_DURATION_KEYS = ["duration", "duration_seconds", "durationSeconds"];
const PLAUD_SERIAL_KEYS = ["serial_number", "serialNumber"];
const PLAUD_SOURCE_LIST_KEYS = ["source_list", "sourceList", "segments", "transcript_segments", "transcriptSegments"];
const PLAUD_NOTE_LIST_KEYS = ["note_list", "noteList", "notes"];

const RAW_SOURCE_KINDS = new Set<RawSourceKind>([
  "meeting-transcript",
  "meeting-notes",
  "technical-doc",
  "requirements-doc",
  "backlog-doc",
  "email-thread",
  "chat-export",
  "client-artifact",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  return undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return undefined;
}

function firstValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return undefined;
}

function firstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = stringValue(record[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function firstArray(record: Record<string, unknown>, keys: string[]): unknown[] | undefined {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return undefined;
}

function parseJsonString(value: string): unknown {
  const trimmed = value.trim();

  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return value;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function isMcpTextContentArray(value: unknown): value is Array<{ type: "text"; text: string }> {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => isRecord(item) && item.type === "text" && typeof item.text === "string")
  );
}

function unwrapPlaudPayload(value: unknown, depth = 0): unknown {
  if (depth > 6) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseJsonString(value);
    return parsed === value ? value : unwrapPlaudPayload(parsed, depth + 1);
  }

  if (isMcpTextContentArray(value)) {
    return unwrapPlaudPayload(
      value
        .map((part) => part.text)
        .join("\n")
        .trim(),
      depth + 1,
    );
  }

  if (isRecord(value)) {
    if (value.structuredContent !== undefined) {
      return unwrapPlaudPayload(value.structuredContent, depth + 1);
    }

    if (isMcpTextContentArray(value.content)) {
      return unwrapPlaudPayload(value.content, depth + 1);
    }
  }

  return value;
}

function dateOnly(value: unknown): string | undefined {
  const text = stringValue(value);

  if (text) {
    const match = text.match(/(20\d{2}-\d{2}-\d{2})/);

    if (match) {
      return match[1];
    }
  }

  const numeric = numberValue(value);

  if (numeric === undefined) {
    return undefined;
  }

  const milliseconds = numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  const date = new Date(milliseconds);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}

function dateTimeString(value: unknown): string | undefined {
  const text = stringValue(value);

  if (text) {
    return text;
  }

  const numeric = numberValue(value);

  if (numeric === undefined) {
    return undefined;
  }

  const milliseconds = numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  const date = new Date(milliseconds);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalPlaudUri(externalId: string): string {
  return `plaud://files/${encodeURIComponent(externalId)}`;
}

function rawSourceKind(value: unknown, fallback: RawSourceKind): RawSourceKind {
  const candidate = stringValue(value);
  return candidate && RAW_SOURCE_KINDS.has(candidate as RawSourceKind) ? (candidate as RawSourceKind) : fallback;
}

function metadataFromPlaudFile(file: PlaudFileRecord): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  const createdAt = firstValue(file, PLAUD_CREATED_AT_KEYS);
  const updatedAt = firstValue(file, PLAUD_UPDATED_AT_KEYS);
  const startAt = firstValue(file, PLAUD_START_AT_KEYS);
  const duration = firstValue(file, PLAUD_DURATION_KEYS);
  const serialNumber = firstValue(file, PLAUD_SERIAL_KEYS);
  const sourceList = firstValue(file, PLAUD_SOURCE_LIST_KEYS);
  const noteList = firstValue(file, PLAUD_NOTE_LIST_KEYS);
  const presignedUrl = firstValue(file, ["presigned_url", "presignedUrl"]);

  if (createdAt !== undefined) {
    metadata.created_at = createdAt;
  }

  if (updatedAt !== undefined) {
    metadata.updated_at = updatedAt;
  }

  if (startAt !== undefined) {
    metadata.start_at = startAt;
  }

  if (duration !== undefined) {
    metadata.duration = duration;
  }

  if (serialNumber !== undefined) {
    metadata.serial_number = serialNumber;
  }

  if (presignedUrl !== undefined) {
    metadata.presigned_url = presignedUrl;
  }

  if (Array.isArray(sourceList)) {
    metadata.source_list_count = sourceList.length;
  }

  if (Array.isArray(noteList)) {
    metadata.note_list_count = noteList.length;
  }

  return metadata;
}

function coerceRecords(value: unknown): PlaudFileRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is PlaudFileRecord => isRecord(item));
}

function coercePlaudFileRecord(value: unknown): PlaudFileRecord | undefined {
  const unwrapped = unwrapPlaudPayload(value);

  if (!isRecord(unwrapped)) {
    return undefined;
  }

  for (const key of ["file", "data", "result"]) {
    const nested = unwrapped[key];

    if (isRecord(nested) && firstString(nested, PLAUD_ID_KEYS)) {
      return nested;
    }
  }

  return unwrapped;
}

function mergeMetadata(...metadataEntries: Array<Record<string, unknown> | undefined>): Record<string, unknown> | undefined {
  const merged: Record<string, unknown> = {};

  for (const metadata of metadataEntries) {
    if (!metadata) {
      continue;
    }

    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined) {
        merged[key] = value;
      }
    }
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

function mergeExternalSourceRef(base: ExternalSourceRef, overlay: ExternalSourceRef): ExternalSourceRef {
  return {
    ...base,
    ...overlay,
    adapterId: base.adapterId || overlay.adapterId,
    externalId: base.externalId || overlay.externalId,
    uri: base.uri || overlay.uri,
    title: overlay.title ?? base.title,
    kind: overlay.kind ?? base.kind,
    sourceDate: overlay.sourceDate ?? base.sourceDate,
    createdAt: overlay.createdAt ?? base.createdAt,
    updatedAt: overlay.updatedAt ?? base.updatedAt,
    mimeType: overlay.mimeType ?? base.mimeType,
    checksum: overlay.checksum ?? base.checksum,
    metadata: mergeMetadata(base.metadata, overlay.metadata),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function buildFileToolArguments(ref: ExternalSourceRef, argumentName: PlaudFileIdArgumentName): Record<string, string> {
  return {
    [argumentName]: ref.externalId,
  };
}

function transcriptTextFromWords(value: unknown): string | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const words = value
    .map((word) => {
      if (typeof word === "string") {
        return word;
      }

      if (isRecord(word)) {
        return firstString(word, ["word", "text", "content"]);
      }

      return undefined;
    })
    .filter((word): word is string => Boolean(word));

  return words.length > 0 ? words.join(" ").replace(/\s+/g, " ").trim() : undefined;
}

function secondsToTimestamp(totalSeconds: number): string {
  const rounded = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function formatTimestamp(value: unknown): string | undefined {
  const numeric = numberValue(value);

  if (numeric !== undefined) {
    const seconds = numeric > 36_000 ? numeric / 1000 : numeric;
    return secondsToTimestamp(seconds);
  }

  const text = stringValue(value);

  if (!text) {
    return undefined;
  }

  const numericText = numberValue(text);

  if (numericText !== undefined) {
    const seconds = numericText > 36_000 ? numericText / 1000 : numericText;
    return secondsToTimestamp(seconds);
  }

  const timestampMatch = text.match(/(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.\d+)?/);

  if (!timestampMatch) {
    return text;
  }

  const hours = timestampMatch[1] ? Number(timestampMatch[1]) : 0;
  const minutes = Number(timestampMatch[2]);
  const seconds = Number(timestampMatch[3]);

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function segmentSpeaker(record: PlaudFileRecord): string | undefined {
  const direct = firstString(record, [
    "speaker",
    "speaker_name",
    "speakerName",
    "speaker_label",
    "speakerLabel",
    "label",
    "name",
  ]);

  if (direct) {
    return direct;
  }

  const nested = firstValue(record, ["speaker", "user", "participant"]);

  if (isRecord(nested)) {
    return firstString(nested, ["name", "label", "display_name", "displayName", "id"]);
  }

  return undefined;
}

function segmentText(record: PlaudFileRecord): string | undefined {
  return (
    firstString(record, ["text", "content", "transcript", "sentence", "utterance", "paragraph", "message"]) ??
    transcriptTextFromWords(record.words)
  );
}

function segmentTimestamp(record: PlaudFileRecord): string | undefined {
  return formatTimestamp(
    firstValue(record, [
      "start_time",
      "startTime",
      "start",
      "timestamp",
      "time",
      "offset",
      "offset_seconds",
      "offsetSeconds",
      "begin",
      "start_at",
      "startAt",
    ]),
  );
}

function normalizeTranscriptSegment(value: unknown, depth: number): string[] {
  const unwrapped = unwrapPlaudPayload(value);

  if (typeof unwrapped === "string") {
    const trimmed = unwrapped.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(unwrapped)) {
    return normalizeTranscriptValue(unwrapped, depth + 1);
  }

  if (!isRecord(unwrapped)) {
    return [];
  }

  const text = segmentText(unwrapped);

  if (text) {
    const speaker = segmentSpeaker(unwrapped);
    const timestamp = segmentTimestamp(unwrapped);
    const normalizedText = text.replace(/\s+/g, " ").trim();
    const speakerPrefix = speaker ? `${speaker}: ` : "";
    const timestampPrefix = timestamp ? `[${timestamp}] ` : "";

    return normalizedText ? [`${timestampPrefix}${speakerPrefix}${normalizedText}`] : [];
  }

  const nestedArray = firstArray(unwrapped, PLAUD_SOURCE_LIST_KEYS);

  if (nestedArray) {
    return normalizeTranscriptValue(nestedArray, depth + 1);
  }

  return [];
}

function normalizeTranscriptValue(value: unknown, depth = 0): string[] {
  if (depth > 8) {
    return [];
  }

  const unwrapped = unwrapPlaudPayload(value);

  if (typeof unwrapped === "string") {
    const trimmed = unwrapped.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(unwrapped)) {
    return unwrapped.flatMap((entry) => normalizeTranscriptSegment(entry, depth + 1));
  }

  if (!isRecord(unwrapped)) {
    return [];
  }

  const arrayPayload = firstArray(unwrapped, [
    "transcript",
    "segments",
    "items",
    "data",
    "results",
    "paragraphs",
    "utterances",
    ...PLAUD_SOURCE_LIST_KEYS,
  ]);

  if (arrayPayload) {
    return normalizeTranscriptValue(arrayPayload, depth + 1);
  }

  const segmentLine = normalizeTranscriptSegment(unwrapped, depth + 1);

  if (segmentLine.length > 0) {
    return segmentLine;
  }

  const nestedValue = firstValue(unwrapped, ["transcript", "text", "markdown", "content", "data", "result"]);

  return nestedValue === undefined ? [] : normalizeTranscriptValue(nestedValue, depth + 1);
}

export function buildPlaudListFilesArguments(request: SourceDiscoveryRequest): PlaudListFilesArguments {
  const metadata = request.metadata ?? {};
  const args: PlaudListFilesArguments = {};
  const query = stringValue(metadata.query);
  const dateFrom = stringValue(metadata.date_from) ?? stringValue(metadata.dateFrom) ?? request.since;
  const dateTo = stringValue(metadata.date_to) ?? stringValue(metadata.dateTo) ?? request.until;
  const page = numberValue(metadata.page) ?? numberValue(request.cursor);
  const pageSize = numberValue(metadata.page_size) ?? numberValue(metadata.pageSize) ?? request.limit;

  if (query) {
    args.query = query;
  }

  if (dateFrom) {
    args.date_from = dateFrom;
  }

  if (dateTo) {
    args.date_to = dateTo;
  }

  if (page !== undefined) {
    args.page = page;
  }

  if (pageSize !== undefined) {
    args.page_size = pageSize;
  }

  return args;
}

export function coercePlaudListFilesResponse(response: unknown): CoercedPlaudListFilesResponse {
  const payload = unwrapPlaudPayload(response);
  let files: PlaudFileRecord[] = [];
  let nextCursor: string | undefined;

  if (Array.isArray(payload)) {
    files = coerceRecords(payload);
  } else if (isRecord(payload)) {
    const fileArray = firstArray(payload, ["files", "items", "data", "results", "list"]);

    if (fileArray) {
      files = coerceRecords(fileArray);
    }

    nextCursor =
      stringValue(firstValue(payload, ["nextCursor", "next_cursor", "cursor"])) ??
      (booleanValue(firstValue(payload, ["hasMore", "has_more"])) && numberValue(payload.page) !== undefined
        ? String((numberValue(payload.page) ?? 0) + 1)
        : undefined);
  }

  return {
    files: files.filter((file) => Boolean(firstString(file, PLAUD_ID_KEYS))),
    nextCursor,
  };
}

export function coercePlaudTranscriptResponse(response: unknown): unknown {
  const payload = unwrapPlaudPayload(response);

  if (!isRecord(payload)) {
    return payload;
  }

  const transcriptValue = firstValue(payload, [
    "transcript",
    "segments",
    "items",
    "data",
    "results",
    "text",
    "markdown",
    "content",
    "result",
    ...PLAUD_SOURCE_LIST_KEYS,
  ]);

  return transcriptValue === undefined ? payload : unwrapPlaudPayload(transcriptValue);
}

export function normalizePlaudTranscriptText(response: unknown): string {
  return normalizeTranscriptValue(coercePlaudTranscriptResponse(response))
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

export function mapPlaudFileToExternalSourceRef(
  file: PlaudFileRecord,
  options: PlaudFileMappingOptions = {},
): ExternalSourceRef {
  const externalId = firstString(file, PLAUD_ID_KEYS);

  if (!externalId) {
    throw new Error("Plaud file metadata did not include an id.");
  }

  const defaultKind = options.defaultKind ?? "meeting-transcript";
  const title = firstString(file, PLAUD_TITLE_KEYS) ?? `Plaud recording ${externalId}`;
  const sourceDate = dateOnly(firstValue(file, [...PLAUD_START_AT_KEYS, ...PLAUD_CREATED_AT_KEYS]));
  const metadata = metadataFromPlaudFile(file);

  return {
    adapterId: options.adapterId ?? PLAUD_MCP_BRIDGE_ID,
    externalId,
    uri: stringValue(file.uri) ?? canonicalPlaudUri(externalId),
    title,
    kind: rawSourceKind(file.kind, defaultKind),
    sourceDate,
    createdAt: dateTimeString(firstValue(file, PLAUD_CREATED_AT_KEYS)),
    updatedAt: dateTimeString(firstValue(file, PLAUD_UPDATED_AT_KEYS)),
    mimeType: "text/markdown",
    checksum: firstString(file, ["checksum", "hash", "sha256"]),
    metadata,
  };
}

export function buildPlaudFileName(input: ExternalSourceRef | PlaudFileRecord): string {
  const refLike = input as Partial<ExternalSourceRef>;
  const recordLike = input as PlaudFileRecord;
  const externalId = refLike.externalId ?? firstString(recordLike, PLAUD_ID_KEYS) ?? "plaud-transcript";
  const title = refLike.title ?? firstString(recordLike, PLAUD_TITLE_KEYS) ?? externalId;
  const sourceDate =
    refLike.sourceDate ?? dateOnly(firstValue(recordLike, [...PLAUD_START_AT_KEYS, ...PLAUD_CREATED_AT_KEYS])) ?? "undated";
  const slug = slugify(title) || slugify(externalId) || "plaud-transcript";

  return `${sourceDate}-${slug}.md`;
}

async function callOptionalPlaudTool(
  client: McpToolInvoker,
  name: "get_file" | "get_note",
  ref: ExternalSourceRef,
  argumentName: PlaudFileIdArgumentName,
): Promise<{ content?: unknown; error?: string }> {
  try {
    const result = await client.callTool<unknown, Record<string, string>>({
      name,
      arguments: buildFileToolArguments(ref, argumentName),
    });

    return { content: result.content };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export class PlaudMcpSourceBridge implements VendorMcpSourceBridge {
  readonly id: string;
  readonly name: string;
  readonly server: McpServerConfig;
  readonly tools = {
    auth: ["login", "logout", "get_current_user"],
    discovery: ["list_files"],
    fetch: ["get_transcript", "get_file"],
    ancillary: ["get_note"],
  };

  private readonly defaultKind: RawSourceKind;
  private readonly fileIdArgumentName: PlaudFileIdArgumentName;

  constructor(options: PlaudMcpSourceBridgeOptions) {
    this.id = options.id ?? PLAUD_MCP_BRIDGE_ID;
    this.name = options.name ?? PLAUD_MCP_BRIDGE_NAME;
    this.server = options.server;
    this.defaultKind = options.defaultKind ?? "meeting-transcript";
    this.fileIdArgumentName = options.fileIdArgumentName ?? "file_id";
  }

  async login(client: McpToolInvoker): Promise<unknown> {
    const result = await client.callTool({ name: "login" });
    return result.content;
  }

  async logout(client: McpToolInvoker): Promise<unknown> {
    const result = await client.callTool({ name: "logout" });
    return result.content;
  }

  async getCurrentUser(client: McpToolInvoker): Promise<unknown> {
    const result = await client.callTool({ name: "get_current_user" });
    return result.content;
  }

  async discoverChanges(client: McpToolInvoker, request: SourceDiscoveryRequest): Promise<SourceDiscoveryResult> {
    const result = await client.callTool<unknown, PlaudListFilesArguments>({
      name: "list_files",
      arguments: buildPlaudListFilesArguments(request),
    });
    const response = coercePlaudListFilesResponse(result.content);

    return {
      items: response.files.map((file) =>
        mapPlaudFileToExternalSourceRef(file, {
          adapterId: this.id,
          defaultKind: this.defaultKind,
        }),
      ),
      nextCursor: response.nextCursor,
    };
  }

  async fetchSource(client: McpToolInvoker, ref: ExternalSourceRef): Promise<SourceMaterial> {
    const transcriptResult = await client.callTool<unknown, Record<string, string>>({
      name: "get_transcript",
      arguments: buildFileToolArguments(ref, this.fileIdArgumentName),
    });
    const transcriptPayload = coercePlaudTranscriptResponse(transcriptResult.content);
    const fileResult = await callOptionalPlaudTool(client, "get_file", ref, this.fileIdArgumentName);
    const noteResult = await callOptionalPlaudTool(client, "get_note", ref, this.fileIdArgumentName);
    const fileRecord = coercePlaudFileRecord(fileResult.content);
    const fileSourceList = fileRecord ? firstValue(fileRecord, PLAUD_SOURCE_LIST_KEYS) : undefined;
    let text = normalizePlaudTranscriptText(transcriptPayload);

    if (!text && fileSourceList) {
      text = normalizePlaudTranscriptText(fileSourceList);
    }

    if (!text) {
      throw new Error(`Plaud transcript ${ref.externalId} did not contain normalizable text.`);
    }

    const fileRef = fileRecord && firstString(fileRecord, PLAUD_ID_KEYS)
      ? mapPlaudFileToExternalSourceRef(fileRecord, {
          adapterId: this.id,
          defaultKind: this.defaultKind,
        })
      : undefined;
    const materialRef = fileRef ? mergeExternalSourceRef(ref, fileRef) : ref;
    const noteContent = noteResult.content === undefined ? undefined : unwrapPlaudPayload(noteResult.content);
    const materialMetadata = mergeMetadata(materialRef.metadata, {
      plaud_file: fileRecord,
      plaud_note: noteContent,
      plaud_get_file_error: fileResult.error,
      plaud_get_note_error: noteResult.error,
    });

    return {
      ref: materialRef,
      fileName: buildPlaudFileName(materialRef),
      mimeType: "text/markdown",
      text,
      metadata: materialMetadata,
    };
  }
}

export function createPlaudStdioBridge(options: Omit<PlaudMcpSourceBridgeOptions, "server"> = {}): PlaudMcpSourceBridge {
  return new PlaudMcpSourceBridge({
    ...options,
    server: PLAUD_MCP_STDIO_SERVER,
  });
}

export function createPlaudHttpBridge(options: Omit<PlaudMcpSourceBridgeOptions, "server"> = {}): PlaudMcpSourceBridge {
  return new PlaudMcpSourceBridge({
    ...options,
    server: PLAUD_MCP_HTTP_SERVER,
  });
}

export function createPlaudSourceAdapter(
  client: McpToolInvoker,
  bridge: VendorMcpSourceBridge = createPlaudStdioBridge(),
): SourceAdapter {
  return {
    id: bridge.id,
    name: bridge.name,
    discoverChanges: (request) => bridge.discoverChanges(client, request),
    fetchSource: (ref) => bridge.fetchSource(client, ref),
  };
}
