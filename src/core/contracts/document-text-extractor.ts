import type { SourceMaterial } from "../types";

export interface DocumentTextExtractorSupportInput {
  fileName: string;
  mimeType?: string;
}

export interface DocumentTextExtractionResult {
  text: string;
}

export interface DocumentTextExtractor {
  readonly id: string;
  readonly name?: string;

  supports(input: DocumentTextExtractorSupportInput): boolean;
  extractText(material: SourceMaterial): Promise<DocumentTextExtractionResult>;
}
