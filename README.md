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
npm run sandbox
```

### 3) Ask the generated wiki a question

`sandbox:ask` is a lightweight local wiki query helper that surfaces the most relevant markdown pages and snippets.

```bash
npm run sandbox:ask -- "What are the next steps?"
```

### 4) Ingest your own test file

If you want to ingest your own meeting notes or transcript instead of the bundled sample, set the minimum analyzer config first:

```bash
cp .env.example .env
# required for custom file ingest
# MEETING_ANALYZER_API_KEY=...
# MEETING_ANALYZER_MODEL=...
```

Then run:

```bash
npm run sandbox -- ./sandbox-input/meetings/my-client-call.md ./.tmp/sandbox/my-engagement
npm run sandbox:ask -- "What changed in scope?" ./.tmp/sandbox/my-engagement
```

## Minimum model setup

Evals and the bundled sandbox sample do **not** require API keys.

To ingest your own files, the minimum required variables are:

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

## Where to put test files

### Fastest path for ad-hoc testing

Put local test files anywhere you want and pass the path into `npm run sandbox`:

```bash
npm run sandbox -- ./sandbox-input/meetings/my-client-call.md
```

During ingest, the file is copied into the target workspace under the correct `raw/` folder and the wiki is refreshed.

### Recommended local testing folders

```text
sandbox-input/
└── meetings/
    └── my-client-call.md
```

### If you want a persistent workspace in the repo

Use an engagement workspace shape like this:

```text
workspaces/<engagement>/
├── AGENTS.md
├── README.md
├── raw/
│   ├── meetings/
│   ├── technical/
│   ├── communications/
│   └── clients/
├── wiki/
│   ├── index.md
│   ├── log.md
│   ├── overview.md
│   ├── sources/
│   ├── projects/
│   ├── topics/
│   ├── entities/
│   └── ops/
│       ├── decision-log.md
│       ├── action-tracker.md
│       └── future-work.md
├── outputs/
│   ├── reports/
│   ├── recaps/
│   └── decks/
├── admin/
│   ├── legal/
│   └── finance/
└── archive/
```

For most transcript or notes-based testing, place source files in:

- `raw/meetings/`

Other supported raw buckets:

- `raw/technical/`
- `raw/communications/`
- `raw/clients/`

## Commands

- `npm run build` — compile TypeScript into `dist/`
- `npm run sandbox` — ingest the bundled sample or a provided file into a sandbox workspace
- `npm run sandbox:ask` — query a generated workspace wiki by keyword and snippet match
- `npm run eval:ingest` — deterministic single-source ingest eval
- `npm run eval:source-summaries` — deterministic multi-source summary eval
- `npm run eval:rollups` — deterministic project + ops rollup eval
- `npm run eval:wiki-answerability` — wiki-only answerability checks
- `npm run eval:all` — run the main eval suite
- `npm run review:pinnacle` — generate the HTML review report

## Repo layout

- `src/` — framework code
- `scripts/evals/` — eval runners and report generation
- `scripts/sandbox/` — quick-start sandbox helpers
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
