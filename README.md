# business-ops-framework

LLM-native business operations workflow framework with a persistent wiki memory layer.

## Status

Session 1 scaffold with deterministic workspace init, structured meeting ingest, wiki refresh, and exact-match evals.

## What this repo includes

- file-based engagement workspace scaffolding
- meeting-source ingest and normalization
- wiki source pages plus persisted analysis artifacts
- rollup generation for ops pages and project/topic pages
- deterministic eval fixtures and goldens
- sanitized planning notes kept in-repo for reference

## Prerequisites

- Node.js 18+
- npm

## Quickstart

```bash
npm ci
npm run build
npm run eval:all
```

If you also want the HTML review artifact:

```bash
npm run review:pinnacle
```

## Commands

- `npm run build` — compile TypeScript into `dist/`
- `npm run eval:ingest` — deterministic single-source ingest eval
- `npm run eval:source-summaries` — deterministic multi-source summary eval
- `npm run eval:rollups` — deterministic project + ops rollup eval
- `npm run eval:wiki-answerability` — wiki-only answerability checks
- `npm run eval:all` — run the main eval suite
- `npm run review:pinnacle` — generate the HTML review report

## Environment variables

Evals use fixture analyzers, so they do **not** require API keys.

Live analyzer runs use the variables below. Start from `.env.example` and export the values into your shell with your preferred env loader.

### Required for live model-backed ingest

- `MEETING_ANALYZER_API_KEY`
- `MEETING_ANALYZER_MODEL`

### Optional

- `MEETING_ANALYZER_BASE_URL`
- `MEETING_ANALYZER_PROVIDER`
- `MEETING_ANALYZER_ID`
- `MEETING_ANALYZER_PROMPT_VERSION`

### Compatibility fallbacks

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Sandbox commands

### 1. Deterministic local sandbox run with the fixture analyzer

This avoids live model calls and produces stable output in `.tmp/sandbox/example-engagement`.

```bash
npm run build

node - <<'NODE'
const path = require("node:path");
const { ingestSource, FixtureMeetingAnalyzer } = require("./dist/src/index.js");

(async () => {
  const sourcePath = path.resolve("evals/fixtures/raw/meetings/2026-04-10-example-client-sync.md");
  const analyzer = new FixtureMeetingAnalyzer({
    fixturesByInputPath: {
      [sourcePath]: path.resolve("evals/fixtures/analyses/meetings/2026-04-10-example-client-sync.json"),
    },
    analyzerId: "readme-fixture-analyzer",
    promptVersion: "readme-fixture-v1",
    provider: "fixture",
    model: "fixture://meeting-analysis",
  });

  const result = await ingestSource({
    workspaceRoot: ".tmp/sandbox/example-engagement",
    inputPath: sourcePath,
    analyzer,
    title: "Example Client Sync",
    sourceDate: "2026-04-10",
    ingestedAt: "2026-04-10T17:30:00.000Z",
  });

  console.log({
    sourceId: result.source.id,
    createdFiles: result.createdFiles,
    updatedFiles: result.updatedFiles,
  });
})();
NODE
```

### 2. Live ingest with environment-configured analyzer

```bash
cp .env.example .env
# fill in MEETING_ANALYZER_API_KEY and MEETING_ANALYZER_MODEL first
# bash/zsh example: load .env into the current shell
set -a
source .env
set +a

npm run build

node - <<'NODE'
const { ingestSource } = require("./dist/src/index.js");

(async () => {
  const result = await ingestSource({
    workspaceRoot: ".tmp/sandbox/live-engagement",
    inputPath: "evals/fixtures/raw/meetings/2026-04-10-example-client-sync.md",
  });

  console.log({
    sourceId: result.source.id,
    summaryPath: result.source.summaryPath,
    analysisPath: result.source.analysisPath,
  });
})();
NODE
```

## Agent prompt examples

Use prompts like these with Pi or any repo-aware coding agent.

- `Initialize a new engagement workspace at workspaces/acme-ap-automation and explain the scaffold it created.`
- `Ingest evals/fixtures/raw/meetings/2026-04-10-example-client-sync.md into workspaces/acme-ap-automation using the configured meeting analyzer, then summarize which wiki files changed.`
- `Using only the workspace wiki, answer: what changed in scope between the first meeting and the latest meeting? Cite the specific wiki pages you used.`
- `Review wiki/ops/action-tracker.md and wiki/ops/decision-log.md, then summarize the highest-priority next steps and open risks.`

## Repo layout

- `src/` — framework code
- `scripts/evals/` — eval runners and report generation
- `evals/` — fixtures, suites, and goldens
- `workspaces/example-engagement/` — sanitized example workspace scaffold
- `planning/` — sanitized design/reference material

## Public-share notes

- tracked planning docs have been sanitized for public sharing
- local-only research exports and scratch artifacts are ignored via `.gitignore`
- `.env*`, `.tmp/`, `dist/`, and other local build/runtime artifacts are excluded from git
