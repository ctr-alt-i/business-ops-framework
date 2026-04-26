# Example Engagement Workspace Schema

This is a sanitized **engagement-scoped** workspace used for the v1 starter scaffold.
Keep the workspace simple, file-based, and easy to inspect.

## Workspace purpose

Use this workspace to demonstrate the core loop:

```text
raw source -> ingest -> wiki update -> later workflow output
```

## Boundary

One workspace represents **one engagement**.
Do not use this workspace as a multi-client or global catch-all.

## Directory rules

### `raw/`

Immutable source evidence.
Do not rewrite raw files during normal maintenance.

- `raw/meetings/` — meeting transcripts and meeting notes
- `raw/technical/` — requirements and technical reference docs
- `raw/communications/` — emails, chat exports, and similar communication artifacts
- `raw/clients/` — client-provided working materials

### `wiki/`

LLM-maintained memory layer.
All durable summaries, rollups, and derived context belong here.

Required files:

- `wiki/index.md`
- `wiki/log.md`
- `wiki/overview.md`
- `wiki/ops/decision-log.md`
- `wiki/ops/action-tracker.md`
- `wiki/ops/future-work.md`

Required page groups:

- `wiki/sources/`
- `wiki/entities/`
- `wiki/projects/`
- `wiki/topics/`

### `outputs/`

Human-facing artifacts only.
Use subfolders by output role:

- `outputs/recaps/`
- `outputs/reports/`
- `outputs/decks/`

### `admin/`

Business records that should stay separate from derived wiki knowledge.

- `admin/legal/`
- `admin/finance/`

### `archive/`

Retired or superseded material only.

## Naming rules

- use lowercase kebab-case for filenames
- prefix source-derived files with `YYYY-MM-DD-` when a date is known
- keep one source summary page per ingested source
- prefer relative markdown links

## Ingest rules for the starter build

When a new source is ingested:

1. validate the workspace scaffold
2. place or copy the source into the correct `raw/` subfolder
3. analyze the source once through the configured meeting analyzer
4. persist `wiki/sources/<source-id>.analysis.md`
5. render `wiki/sources/<source-id>.md` from the normalized structured result
6. update `wiki/index.md` and `wiki/log.md`
7. refresh ops pages and project/topic rollups from persisted source analyses

## File update conventions

- `wiki/index.md` uses `<!-- sources:auto -->` as the Session 1 insertion marker
- `wiki/log.md` uses `<!-- log:auto -->` as the Session 1 insertion marker
- ops pages may be initialized but left unpopulated until extraction exists

## Evidence rule

Every durable summary or operational claim should be traceable back to a raw source file.
When possible, link directly to the raw file that supports the claim.

## Session 1 constraints

- markdown-first
- file-based only
- no database
- no vector search requirement
- no hidden state outside the workspace files
