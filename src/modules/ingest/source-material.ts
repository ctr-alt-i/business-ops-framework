import { createDefaultDocumentTextExtractors } from "../../adapters/docs";
import type { DocumentTextExtractor } from "../../core/contracts/document-text-extractor";
import type { IngestMaterialRequest, RawSourceKind, SourceMaterial } from "../../core/types";

export interface SourceMaterialTextResolutionOptions {
  extractors?: readonly DocumentTextExtractor[];
}

export interface SourceMaterialToIngestMaterialRequestOptions extends SourceMaterialTextResolutionOptions {
  workspaceRoot: string;
  kind?: RawSourceKind;
  title?: string;
  sourceDate?: string;
  ingestedAt?: string;
  checksum?: string;
  metadata?: Record<string, unknown>;
}

function materialMimeType(material: SourceMaterial): string | undefined {
  return material.mimeType ?? material.ref.mimeType;
}

function describeMaterial(material: SourceMaterial): string {
  const mimeType = materialMimeType(material);
  return mimeType ? `${material.fileName} (${mimeType})` : material.fileName;
}

function mergeMetadata(...entries: Array<Record<string, unknown> | undefined>): Record<string, unknown> | undefined {
  const merged: Record<string, unknown> = {};

  for (const entry of entries) {
    if (!entry) {
      continue;
    }

    for (const [key, value] of Object.entries(entry)) {
      if (value !== undefined) {
        merged[key] = value;
      }
    }
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

export async function resolveSourceMaterialText(
  material: SourceMaterial,
  options: SourceMaterialTextResolutionOptions = {},
): Promise<string> {
  if (typeof material.text === "string") {
    return material.text;
  }

  const extractors = options.extractors ?? createDefaultDocumentTextExtractors();
  const extractor = extractors.find((candidate) =>
    candidate.supports({
      fileName: material.fileName,
      mimeType: materialMimeType(material),
    }),
  );

  if (!extractor) {
    throw new Error(`No document text extractor supports source material ${describeMaterial(material)}.`);
  }

  const result = await extractor.extractText(material);
  return result.text;
}

export async function sourceMaterialToIngestMaterialRequest(
  material: SourceMaterial,
  options: SourceMaterialToIngestMaterialRequestOptions,
): Promise<IngestMaterialRequest> {
  const rawText = await resolveSourceMaterialText(material, options);
  const metadata = mergeMetadata(material.ref.metadata, material.metadata, options.metadata);

  return {
    workspaceRoot: options.workspaceRoot,
    fileName: material.fileName,
    rawText,
    kind: options.kind ?? material.ref.kind,
    title: options.title ?? material.ref.title,
    sourceDate: options.sourceDate ?? material.ref.sourceDate,
    ingestedAt: options.ingestedAt,
    originalUri: material.ref.uri,
    externalId: material.ref.externalId,
    adapterId: material.ref.adapterId,
    checksum: options.checksum ?? material.ref.checksum,
    metadata,
  };
}
