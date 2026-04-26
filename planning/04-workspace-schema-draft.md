# Workspace Schema Draft

This draft is the planning counterpart to `workspaces/example-engagement/AGENTS.md`.
It defines the minimal file-based rules the starter implementation should honor.

## Workspace boundary

- one workspace = one engagement
- raw sources are immutable evidence
- wiki pages are maintained derivative memory
- outputs are human-facing artifacts
- admin holds finance/legal records
- archive is for retired material only

## Starter tree

```text
workspaces/example-engagement/
├─ AGENTS.md
├─ README.md
├─ raw/
│  ├─ meetings/
│  ├─ technical/
│  ├─ communications/
│  └─ clients/
├─ wiki/
│  ├─ index.md
│  ├─ log.md
│  ├─ overview.md
│  ├─ sources/
│  ├─ entities/
│  ├─ projects/
│  ├─ topics/
│  └─ ops/
│     ├─ decision-log.md
│     ├─ action-tracker.md
│     └─ future-work.md
├─ outputs/
│  ├─ reports/
│  ├─ recaps/
│  └─ decks/
├─ admin/
│  ├─ legal/
│  └─ finance/
└─ archive/
```

## Directory rules

### `raw/`

- source-of-truth input material
- read-only except for intentional staging/copying during ingest
- first supported source class is meetings
- for evals, prefer one actual meeting per raw file when possible
- do not bundle raw source evidence and expected Q&A answers in the same raw fixture

### `wiki/`

- LLM-maintained memory layer
- markdown only in v1
- every durable claim should be traceable back to a source file
- each ingested meeting may also persist an inspectable analysis artifact alongside its source page

### `outputs/`

- recaps, reports, decks, and other shareable artifacts
- do not store source evidence here

### `admin/`

- legal and finance records only
- keep separate from derived wiki knowledge

### `archive/`

- retired or superseded material
- not part of active workflow state

## Required file conventions

### `wiki/index.md`

- content-oriented map of workspace pages
- source summaries listed under a dedicated section
- should include links to overview, log, and ops pages
- Session 1 uses the marker `<!-- sources:auto -->` for deterministic stub updates

### `wiki/log.md`

- append-only chronological activity log
- Session 1 uses the marker `<!-- log:auto -->`
- each ingest entry should include source id, kind, raw path, and summary page link

### `wiki/sources/<source-id>.md`

- one page per ingested source
- contains source metadata, raw file link, structured summary sections, and related-page links
- should be rendered from the normalized output of one structured meeting analysis pass
- should stay concise and human-readable even when the underlying analysis is model-assisted

### `wiki/sources/<source-id>.analysis.md`

- persisted analysis artifact for the same source
- contains analyzer id, prompt version, model metadata, run timestamp, validation notes, and normalized structured output
- exists so model-assisted extraction remains inspectable on disk
- should link back to both the raw source and the rendered source summary page

### `wiki/projects/<project-id>.md` or `wiki/topics/<topic-id>.md`

- canonical cross-source rollup page for an ongoing workstream
- should preserve chronology while also exposing the latest known state
- should make scope changes, pricing changes, timeline changes, and stakeholder roles easy to inspect

### `wiki/ops/*.md`

- durable rollups for decisions, actions, and future work
- Session 1 initializes the files but does not yet populate them automatically

## Naming rules

- use lowercase kebab-case for filenames
- prefix with `YYYY-MM-DD-` when a source date is known
- keep one summary file per source
- keep markdown links relative and human-inspectable

## Ingest behavior for the starter build

1. validate or create the workspace scaffold
2. place the source into the correct `raw/` subfolder
3. create the source summary page
4. persist the source analysis artifact
5. update `wiki/index.md`
6. append `wiki/log.md`
7. leave recap generation for later sessions if not yet implemented

## Next gate after starter ingest

1. replace stub source pages with structured source summaries
2. persist one structured meeting analysis artifact per source
3. populate ops pages from normalized analysis output
4. update project/topic rollup pages for related meetings
5. keep file mutations inspectable and stable enough for structural goldens where practical

## Anti-goals

- no database-backed workspace state
- no hidden metadata store
- no vector search requirement
- no heavy schema parser for `AGENTS.md` yet
