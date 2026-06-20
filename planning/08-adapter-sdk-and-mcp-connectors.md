# Adapter SDK and MCP Connector Plan

## Goal

Make the framework extensible enough that third parties can provide connectors for external source systems — starting with automatic meeting transcript ingest from Plaud.ai via MCP — without needing to modify core wiki, ingest, or rollup logic.

## Why this matters

The current framework is already organized in a ports-and-adapters direction:

- `src/core/` owns types, contracts, and domain logic
- `src/modules/` owns use-cases like ingest and wiki rebuild
- `src/adapters/` owns provider-specific integrations

However, only the meeting analyzer boundary is formalized today. Source import is still effectively local-file based (`inputPath`). To support external connectors cleanly, the framework needs a formal source adapter contract and a language-agnostic connector path.

## Planning outcome for this phase

This phase should produce:

1. a stable public adapter contract for source ingestion
2. a stable public extractor contract for turning external files into raw text
3. an MCP bridge model so third parties can expose connectors without publishing TypeScript packages
4. a workspace convention for connector state and sync checkpoints
5. an ingest path that accepts normalized source material, not only local file paths

## Scope

### In scope

- source adapter contract
- document text extractor contract
- MCP connector profile for external sources
- connector state layout in the workspace
- idempotent auto-ingest flow
- Plaud.ai transcript connector planning

### Out of scope for this phase

- full implementation of the Plaud.ai connector
- full implementation of an MCP client runtime
- webhook infrastructure
- multi-tenant auth and permissions
- marketplace / plugin distribution mechanics

## Design principles

1. **Framework owns business memory**
   - raw staging
   - structured analysis
   - wiki updates
   - rollups
   - decision/action extraction

2. **Connector owns external system access**
   - authentication
   - listing changed documents
   - fetching source content and metadata
   - vendor-specific pagination/cursors

3. **Extractors own format decoding**
   - PDF to text
   - DOCX to text
   - HTML to text
   - transcript JSON to normalized text

4. **Everything stays inspectable**
   - connector sync state should live in workspace files
   - ingestion provenance should be recorded in durable files

5. **MCP should be a first-class integration path**
   - third parties should be able to expose a connector as an MCP server
   - the framework should not require every connector to be a local npm package

## Recommended extension model

Support two extension paths.

### 1. Native adapter SDK

For first-party or advanced integrators who want direct Node/TypeScript integration.

Example:
- `@business-ops/ms-graph-adapter`
- `@business-ops/google-drive-adapter`
- `@business-ops/plaud-adapter`

### 2. MCP connector bridge

For third parties who want language-agnostic connectors.

Example:
- a Plaud.ai MCP server written outside this repo
- a SharePoint MCP server owned by a partner
- a transcript import MCP server that surfaces normalized source records

The framework would include an MCP bridge adapter that converts MCP connector responses into the framework's `SourceAdapter` contract.

## Proposed public contracts

These should live under `src/core/contracts/`.

## 1. Source adapter contract

```ts
export interface ExternalSourceRef {
  adapterId: string;
  externalId: string;
  uri: string;
  title?: string;
  kind?: RawSourceKind;
  sourceDate?: string;
  updatedAt?: string;
  mimeType?: string;
  checksum?: string;
  metadata?: Record<string, string>;
}

export interface SourceMaterial {
  ref: ExternalSourceRef;
  fileName: string;
  mimeType?: string;
  text?: string;
  bytes?: Uint8Array;
  metadata?: Record<string, string>;
}

export interface SourceDiscoveryRequest {
  cursor?: string;
  limit?: number;
}

export interface SourceDiscoveryResult {
  items: ExternalSourceRef[];
  nextCursor?: string;
}

export interface SourceAdapter {
  readonly id: string;
  discoverChanges(request: SourceDiscoveryRequest): Promise<SourceDiscoveryResult>;
  fetchSource(ref: ExternalSourceRef): Promise<SourceMaterial>;
}
```

### Notes

- `discoverChanges()` is the key contract for auto-ingest
- `cursor` allows polling/delta sync
- `checksum` or `updatedAt` supports idempotency
- `metadata` preserves vendor-specific details without polluting core types

## 2. Document text extractor contract

```ts
export interface DocumentTextExtractor {
  readonly id: string;
  supports(input: { fileName: string; mimeType?: string }): boolean;
  extractText(material: SourceMaterial): Promise<{ text: string }>;
}
```

### Why this matters

Connectors should not have to own every file-format parser.

A Plaud transcript connector may return:
- plain text
- markdown
- JSON transcript export
- PDF summary

The framework should be able to route those through extractors instead of forcing every connector to duplicate parsing logic.

## 3. Ingest-material contract

Current ingest expects a local file path. That should remain for local/manual workflows, but the framework should add a higher-level ingest path.

```ts
export interface IngestMaterialRequest {
  workspaceRoot: string;
  fileName: string;
  rawText: string;
  kind?: RawSourceKind;
  title?: string;
  sourceDate?: string;
  ingestedAt?: string;
  originalUri?: string;
  externalId?: string;
  adapterId?: string;
  checksum?: string;
  metadata?: Record<string, string>;
}
```

This allows connectors to pass normalized content directly into the framework.

## 4. Connector registry

```ts
export interface ConnectorRegistry {
  sourceAdapters: SourceAdapter[];
  textExtractors: DocumentTextExtractor[];
}
```

A thin runtime can resolve:
- which source adapter to run
- which extractor to use
- whether raw text is already available

## Workspace conventions for connector state

Connector state should be explicit and durable.

## Proposed workspace paths

- `admin/integrations/<adapter-id>/config.json`
- `admin/integrations/<adapter-id>/state.json`
- `admin/integrations/<adapter-id>/runs/`

### `config.json`
Connector-specific non-secret configuration that is safe to persist in the workspace.

Example:
- site ID
- drive ID
- transcript collection ID
- polling limits

### `state.json`
Durable sync state.

Example:
- last cursor / delta token
- last successful sync time
- last run summary
- recent errors

### `runs/`
Optional append-only run logs or snapshots for debugging connector behavior.

## Ingestion provenance

Each ingested source should preserve provenance fields such as:

- `adapterId`
- `externalId`
- `originalUri`
- `checksum`
- `externalUpdatedAt`

These can initially live in the analysis artifact metadata or a sidecar source manifest.

## MCP connector profile

To support third-party connectors via MCP, define a narrow connector profile that an MCP server can expose.

## Recommended MCP operations

### `connector.info`
Returns identity and capabilities.

Example output:

```json
{
  "id": "plaud-mcp",
  "name": "Plaud Transcript Connector",
  "version": "0.1.0",
  "capabilities": {
    "discoverChanges": true,
    "fetchSource": true
  }
}
```

### `connector.discover_changes`
Returns changed or new source refs since the provided cursor.

Example output:

```json
{
  "items": [
    {
      "adapterId": "plaud-mcp",
      "externalId": "tr_123",
      "uri": "plaud://transcripts/tr_123",
      "title": "Weekly client sync",
      "kind": "meeting-transcript",
      "sourceDate": "2026-06-18",
      "updatedAt": "2026-06-18T15:33:12Z",
      "mimeType": "text/markdown",
      "checksum": "sha256:...",
      "metadata": {
        "speakerCount": "3",
        "workspace": "default"
      }
    }
  ],
  "nextCursor": "cursor_abc"
}
```

### `connector.fetch_source`
Fetches one source's content and metadata.

Example output:

```json
{
  "ref": {
    "adapterId": "plaud-mcp",
    "externalId": "tr_123",
    "uri": "plaud://transcripts/tr_123"
  },
  "fileName": "2026-06-18-weekly-client-sync.md",
  "mimeType": "text/markdown",
  "text": "Speaker 1: ...",
  "metadata": {
    "recordingId": "rec_456",
    "speakerCount": "3"
  }
}
```

## Why MCP is a good fit here

- third parties can implement connectors in any language
- secrets stay inside the connector runtime
- the framework stays focused on ingest and memory maintenance
- the same MCP bridge could later support SharePoint, Google Drive, CRM exports, or custom transcript stores
- when a vendor already ships its own MCP server, the framework can bridge vendor tools into the `SourceAdapter` contract instead of requiring the vendor to implement this framework's custom connector profile

## Plaud.ai connector planning

## Plaud MCP findings from the vendor docs

The Plaud docs materially narrow the design space:

1. Plaud already ships an MCP package: `@plaud-ai/mcp@latest`
2. For local MCP clients, Plaud can be configured over stdio with:
   - `command: "npx"`
   - `args: ["-y", "@plaud-ai/mcp@latest"]`
3. Plaud also exposes a hosted remote MCP endpoint for HTTP-style clients:
   - `https://mcp.plaud.ai/mcp`
4. Authentication is user-scoped OAuth against a Plaud account, not a framework-owned service credential
5. The documented MCP tools are:
   - `login`
   - `logout`
   - `get_current_user`
   - `list_files`
   - `get_file`
   - `get_note`
   - `get_transcript`
6. `list_files` supports these filters:
   - `query`
   - `date_from`
   - `date_to`
   - `page`
   - `page_size`
7. `list_files` / `get_file` expose at least these metadata fields:
   - `id`
   - `name`
   - `created_at`
   - `start_at`
   - `duration`
   - `serial_number`
8. `get_file` additionally exposes:
   - `presigned_url`
   - `source_list`
   - `note_list`
9. `get_transcript` returns the full transcript with timestamps and speaker labels
10. `get_note` returns AI-generated notes, action items, and key topics

## Implication for framework design

Plaud is not the same as a custom third-party connector that implements our proposed `connector.discover_changes` / `connector.fetch_source` profile.

Instead, Plaud should be treated as a **vendor MCP bridge adapter**:

- the framework implements the `SourceAdapter` contract
- that adapter calls Plaud's existing MCP tools
- the adapter maps Plaud tool responses into `ExternalSourceRef` and `SourceMaterial`

This means the framework should support both:

1. **custom MCP connectors** that implement our generic connector profile
2. **vendor MCP bridges** that map an existing toolset into framework contracts

## Assumptions

Given the current Plaud docs, plan around these assumptions:

1. the first Plaud integration should consume Plaud's existing MCP toolset rather than requiring a custom Plaud-side connector implementation
2. transcript content can be obtained directly through `get_transcript`, so a separate file-format extractor may not be required for the first Plaud path
3. Plaud notes from `get_note` are useful optional side data, but the transcript should remain the primary source for ingest
4. audio ingestion is out of scope for the first connector phase even though `get_file` can expose a temporary audio URL
5. auto-ingest will likely be implemented as polling because the documented MCP surface does not expose a delta-token or webhook-style change feed

## Plaud source mapping

A Plaud transcript should likely map to:

- `kind: meeting-transcript`
- `title`: transcript title or meeting title
- `sourceDate`: transcript meeting date if known
- `rawText`: normalized speaker-turn transcript text

Possible retained metadata:

- Plaud recording ID
- recording name
- canonical item URI
- meeting duration
- speaker count
- `created_at`
- `start_at`
- `serial_number`
- transcript segment count from `source_list`
- note count from `note_list`

## Plaud normalization rules

The connector should normalize exported transcript content into a plain text or markdown transcript with stable speaker labels.

Preferred output shape:

```text
Speaker 1: ...
Speaker 2: ...
Speaker 1: ...
```

If timestamps exist, preserve them inline or in a consistent format.

## Plaud auto-ingest flow

1. scheduler or manual trigger starts connector sync
2. framework loads connector state from `admin/integrations/plaud-mcp/state.json`
3. Plaud MCP bridge calls `list_files` using a rolling date window and/or pagination
4. framework maps each Plaud recording into an `ExternalSourceRef`
5. framework compares discovered items against local provenance and previously stored transcript hashes
6. for new or candidate-changed items, the adapter calls:
   - `get_transcript` for primary transcript content
   - optionally `get_file` for richer metadata
   - optionally `get_note` for AI-generated notes
7. transcript text is normalized into the framework's raw source format
8. normalized text is passed to `ingestMaterial()`
9. ingest persists raw source, analysis artifact, source page, and rollups
10. connector polling state is updated only after successful ingest
11. run summary is written back to connector state or run logs

## Idempotency and duplicate handling

Auto-ingest must be safe to re-run.

Use these checks in order:

1. `adapterId + externalId` as the primary external identity
2. transcript hash derived from normalized `get_transcript` output
3. `start_at` / `created_at` metadata when available
4. raw text equality as a final fallback

Because the current Plaud MCP docs do not describe a native checksum or change cursor, the Plaud bridge should assume polling + dedupe rather than delta-sync.
A connector sync should not create duplicate sources when a transcript is rediscovered unchanged.

## Error handling expectations

### Connector-level failures

Examples:
- MCP server unavailable
- expired auth inside the connector
- malformed tool response

Expected behavior:
- record failure in connector state/run log
- do not advance cursor
- allow retry

### Item-level failures

Examples:
- one transcript cannot be fetched
- one transcript cannot be decoded to text
- one transcript fails analyzer validation

Expected behavior:
- continue the run when safe
- log the failed item with its external ID
- only mark individual items as failed

## Security boundary

The framework should avoid owning third-party connector secrets when possible.

Preferred model:
- the MCP connector owns vendor auth
- the framework only knows how to call the connector
- workspace files store sync state and non-secret config only
- for Plaud's hosted HTTP MCP path, note that the docs say recording data passes through Plaud's MCP server hosted in the US
## Serverless implications

This plan fits a serverless runtime well if the workspace can be materialized into temp storage and synced back to durable storage.

A serverless sync loop would be:

1. load workspace snapshot
2. load connector state
3. call MCP connector
4. ingest changed sources
5. persist updated workspace + connector state

The main requirement is serialized ingest per workspace to avoid concurrent rebuild races.

## Proposed implementation phases

## Phase 1 — contract and planning

- define public `SourceAdapter` contract
- define public `DocumentTextExtractor` contract
- define `IngestMaterialRequest`
- define workspace connector state conventions
- define MCP connector profile

## Phase 2 — framework runtime seams

- add `ingestMaterial()` alongside existing file-path ingest
- add provenance persistence for external source identity
- add connector state read/write helpers
- add adapter registry/bootstrap helpers

## Phase 3 — MCP bridge

- implement an MCP-backed `SourceAdapter`
- map MCP operations to `discoverChanges()` and `fetchSource()`
- add integration tests with a fixture MCP connector

## Phase 4 — Plaud.ai bridge adapter

- build a Plaud MCP bridge adapter over `list_files`, `get_file`, `get_note`, and `get_transcript`
- support both stdio MCP (`npx -y @plaud-ai/mcp@latest`) and remote HTTP MCP (`https://mcp.plaud.ai/mcp`)
- normalize transcript exports into stable raw text
- test repeated polling runs for idempotency
- validate resulting wiki quality on real Plaud samples
## Open questions

1. Should the first Plaud bridge use stdio MCP, remote HTTP MCP, or support both from day one?
2. What exact shape does `get_transcript` return in practice, and how much normalization is needed to produce stable ingest text?
3. Should `get_note` be staged as a separate raw companion artifact, or only preserved as provenance metadata?
4. Should connector state live only in workspace files, or can hosted deployments also keep mirrored operational state elsewhere?
5. Where should external provenance be rendered visibly: only in analysis artifacts, or also in source summary pages?
6. Do we want the framework to support connector push events later, or only polling in the first implementation?
7. Should vendor MCP bridges and custom MCP connector profiles share one runtime interface, or be modeled as separate adapter subtypes?

## Recommended next step

Implement the contract layer first, not the Plaud connector first.

The next coding session should focus on:

1. `src/core/contracts/source-adapter.ts`
2. `src/core/contracts/document-text-extractor.ts`
3. `src/core/types` additions for external provenance
4. `src/modules/ingest` support for `ingestMaterial()`
5. `src/modules/connectors` or `src/infra/connectors` state helpers

That will make both MCP-based Plaud ingestion and later SharePoint / Graph adapters fit the same framework shape.
