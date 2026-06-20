import { extname } from "node:path";
import { TextDecoder } from "node:util";

import type { DocumentTextExtractor } from "../../core/contracts/document-text-extractor";
import type { SourceMaterial } from "../../core/types";

const TEXT_EXTENSIONS = new Set([".txt", ".text", ".md", ".markdown", ".json"]);
const TEXT_MIME_TYPES = new Set(["text/plain", "text/markdown", "application/json"]);

function normalizeMimeType(mimeType: string | undefined): string | undefined {
  return mimeType?.split(";")[0]?.trim().toLowerCase() || undefined;
}

function isTextualMimeType(mimeType: string | undefined): boolean {
  const normalized = normalizeMimeType(mimeType);

  if (!normalized) {
    return false;
  }

  return normalized.startsWith("text/") || TEXT_MIME_TYPES.has(normalized) || normalized.endsWith("+json");
}

function isTextualFileName(fileName: string): boolean {
  return TEXT_EXTENSIONS.has(extname(fileName).toLowerCase());
}

export class PlainTextDocumentExtractor implements DocumentTextExtractor {
  readonly id = "plain-text-document-extractor";
  readonly name = "Plain text / Markdown / JSON extractor";

  supports(input: { fileName: string; mimeType?: string }): boolean {
    return isTextualMimeType(input.mimeType) || isTextualFileName(input.fileName);
  }

  async extractText(material: SourceMaterial): Promise<{ text: string }> {
    if (typeof material.text === "string") {
      return { text: material.text };
    }

    if (material.bytes) {
      return { text: new TextDecoder("utf-8").decode(material.bytes) };
    }

    throw new Error(`Material ${material.fileName} did not include text or bytes to decode.`);
  }
}

export function createPlainTextDocumentExtractor(): PlainTextDocumentExtractor {
  return new PlainTextDocumentExtractor();
}

export function createDefaultDocumentTextExtractors(): DocumentTextExtractor[] {
  return [createPlainTextDocumentExtractor()];
}

export const defaultDocumentTextExtractors: readonly DocumentTextExtractor[] = createDefaultDocumentTextExtractors();
