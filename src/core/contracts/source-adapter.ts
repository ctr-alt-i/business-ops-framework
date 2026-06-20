import type { ExternalSourceRef, SourceDiscoveryRequest, SourceDiscoveryResult, SourceMaterial } from "../types";

export interface SourceAdapter {
  readonly id: string;
  readonly name?: string;

  discoverChanges(request: SourceDiscoveryRequest): Promise<SourceDiscoveryResult>;
  fetchSource(ref: ExternalSourceRef): Promise<SourceMaterial>;
}
