import type { ExternalSourceRef, SourceDiscoveryRequest, SourceDiscoveryResult, SourceMaterial } from "../types";

export type McpTransportKind = "stdio" | "http";

export interface McpStdioServerConfig {
  transport: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface McpHttpServerConfig {
  transport: "http";
  url: string;
  headers?: Record<string, string>;
  authentication?: "none" | "oauth" | "bearer" | "custom";
}

export type McpServerConfig = McpStdioServerConfig | McpHttpServerConfig;

export interface McpToolCallRequest<TArguments = Record<string, unknown>> {
  name: string;
  arguments?: TArguments;
}

export interface McpToolCallResult<TOutput = unknown> {
  content: TOutput;
  raw?: unknown;
}

export interface McpToolInvoker {
  callTool<TOutput = unknown, TArguments = Record<string, unknown>>(
    request: McpToolCallRequest<TArguments>,
  ): Promise<McpToolCallResult<TOutput>>;
}

export interface VendorMcpBridgeToolset {
  auth?: string[];
  discovery: string[];
  fetch: string[];
  ancillary?: string[];
}

export interface VendorMcpSourceBridge {
  readonly id: string;
  readonly name: string;
  readonly server: McpServerConfig;
  readonly tools: VendorMcpBridgeToolset;

  login?(client: McpToolInvoker): Promise<unknown>;
  logout?(client: McpToolInvoker): Promise<unknown>;
  getCurrentUser?(client: McpToolInvoker): Promise<unknown>;
  discoverChanges(client: McpToolInvoker, request: SourceDiscoveryRequest): Promise<SourceDiscoveryResult>;
  fetchSource(client: McpToolInvoker, ref: ExternalSourceRef): Promise<SourceMaterial>;
}
