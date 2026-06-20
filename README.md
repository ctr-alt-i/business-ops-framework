# business-ops-framework

LLM-native business operations workflow framework with a persistent wiki memory layer.

## Status

Session 1 scaffold with deterministic workspace init, structured meeting ingest, wiki refresh, and exact-match evals.

## Quick start

### 1) Install

```bash
npm ci
```

### 2) Run the bundled sandbox example

This works out of the box on the included sanitized sample and writes a generated workspace to `.tmp/sandbox/example-engagement`.

```bash
npm run sandbox:sample
npm run sandbox:sample:ask -- "What are the next steps?"
```

## Local transcript sandbox

Use the existing ingest/wiki pipeline with a local manual workflow under `test/`.

`test/` and `tests/transcripts/` are local-only and ignored by git so private conversations do not get committed.

```bash
export MEETING_ANALYZER_API_KEY=...
export MEETING_ANALYZER_MODEL=...
# optional: MEETING_ANALYZER_BASE_URL, MEETING_ANALYZER_PROVIDER,
#           MEETING_ANALYZER_ID, MEETING_ANALYZER_PROMPT_VERSION

npm run sandbox:init
# optional: preload your own local private fixtures from tests/transcripts/
npm run sandbox:init -- --seed-samples
npm run sandbox
npm run sandbox:ask -- "What changed?"
```

Paths:
- drop text transcripts/notes into `test/transcripts/`
- optional private seed fixtures can live in `tests/transcripts/`
- generated workspace lives in `test/workspace/`
- HTML review report is written to `test/workspace/outputs/reports/local-sandbox-report.html`

Behavior:
- ingest keeps the current single-call `MeetingAnalyzer` flow
- source analyses persist to `wiki/sources/*.analysis.md`
- source pages, ops pages, and project/topic rollups rebuild from persisted analyses
- `sandbox:ask` answers from generated wiki artifacts first and does not read raw transcripts

## Minimum model setup

Evals and the bundled sandbox sample do **not** require API keys.

The local transcript sandbox and custom file ingest require:

- `MEETING_ANALYZER_API_KEY`
- `MEETING_ANALYZER_MODEL`

Optional overrides:

- `MEETING_ANALYZER_BASE_URL`
- `MEETING_ANALYZER_PROVIDER`
- `MEETING_ANALYZER_ID`
- `MEETING_ANALYZER_PROMPT_VERSION`

Compatibility fallbacks:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Custom file ingest

If you want to ingest your own meeting notes or transcript instead of the bundled sample, set the analyzer config first, then run:

```bash
npm run sandbox:sample -- ./sandbox-input/meetings/my-client-call.md ./.tmp/sandbox/my-engagement
npm run sandbox:sample:ask -- "What changed in scope?" ./.tmp/sandbox/my-engagement
```

## Recommended local testing folders

```text
sandbox-input/
└── meetings/
    └── my-client-call.md
```

## Commands

- `npm run build` — compile TypeScript into `dist/`
- `npm run sandbox:init` — initialize the local `test/` sandbox workspace
- `npm run sandbox` — ingest files from `test/transcripts/` into `test/workspace/`
- `npm run sandbox:ask` — query the generated `test/workspace/` wiki
- `npm run sandbox:sample` — ingest the bundled sample or a provided file into a sandbox workspace
- `npm run sandbox:sample:ask` — query a bundled/custom sample workspace wiki by keyword and snippet match
- `npm run eval:ingest` — deterministic single-source ingest eval
- `npm run eval:source-summaries` — deterministic multi-source summary eval
- `npm run eval:rollups` — deterministic project + ops rollup eval
- `npm run eval:wiki-answerability` — wiki-only answerability checks
- `npm run eval:all` — run the main eval suite
- `npm run review:pinnacle` — generate the HTML review report

## Repo layout

- `src/` — framework code
- `scripts/evals/` — eval runners and report generation
- `scripts/sandbox/` — bundled sample sandbox helpers
- `scripts/local/` — local transcript sandbox helpers
- `evals/` — fixtures, suites, and goldens
- `workspaces/example-engagement/` — sanitized example workspace scaffold
- `planning/` — sanitized design/reference material

## Repo file structure schema

```text
business-ops-framework/
├── src/
│   ├── adapters/
│   ├── core/
│   └── modules/
├── scripts/
│   ├── evals/
│   ├── local/
│   └── sandbox/
├── evals/
│   ├── fixtures/
│   ├── goldens/
│   └── suites/
├── workspaces/
│   └── example-engagement/
├── planning/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Validation

```bash
npm run eval:all
npm run review:pinnacle
```

## Public-share notes

- tracked planning docs have been sanitized for public sharing
- local-only research exports and scratch artifacts are ignored via `.gitignore`
- `.env*`, `.tmp/`, `dist/`, and other local build/runtime artifacts are excluded from git
