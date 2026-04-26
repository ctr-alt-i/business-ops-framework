# Evals Plan

## Philosophy

Evals should exist from the first scaffold, even before the full workflows exist.
Session 1 established the deterministic file-based ingest check.
The next gate should keep **structural evals and inspectable artifacts** strong while de-emphasizing fully deterministic semantic scoring for model-assisted extraction.

In practice, that means:

- keep exact checks for stable file paths, structural sections, and other deterministic mutations
- validate that persisted analysis artifacts exist and conform to the expected schema
- prefer generated-wiki answerability checks over raw-source retrieval
- generate human-reviewable reports for semantic inspection
- treat model-assisted extraction as reviewable and testable, but not fully exact-match deterministic

## What Session 1 proved

Given one sanitized source fixture:

- the source is staged into the correct `raw/` subfolder
- a source summary page is created in `wiki/sources/`
- `wiki/index.md` gets the expected source entry
- `wiki/log.md` gets the expected ingest entry

## Immediate planning additions after the first ingest gate

Do not forget to try these next:

1. add a repeatable HTML review report script so a run can generate a human-reviewable report artifact automatically
2. create a non-leaky transcript eval set that separates raw meeting sources from the Q&A bank / expected answers
3. persist one structured analysis artifact per source and validate that it matches the canonical schema

## What to evaluate next

### Source analysis checks

Given one meeting transcript fixture:

- the source summary page contains the expected structural sections
- a persisted analysis artifact exists for the source
- the artifact includes analyzer id, prompt version, model metadata, and normalized output
- required schema fields are present and parseable
- participants, key facts, next steps, and open questions are present when the source supports them

### Operational extraction checks

Given one meeting transcript fixture:

- decisions are added to the decision log
- actions are added to the action tracker
- future work is added to the future work page
- extracted objects remain linked back to source evidence
- status fields and enum-like values are normalized into the allowed shapes

### Multi-meeting reasoning checks

Given a small meeting series for one engagement:

- related meetings update a shared project/topic rollup page
- current scope reflects the latest state
- deferred or removed scope is preserved explicitly
- pricing and timeline changes are represented chronologically
- stakeholder roles remain legible across meetings
- the generated wiki can answer curated factual and cross-meeting questions from wiki artifacts alone
- the run can emit a human-reviewable HTML report for inspection

### Deferred checks

These still belong later:

- exact semantic goldens beyond stable structural fields
- meeting recap rubric scoring
- weekly report rubric scoring
- linting and contradiction checks beyond controlled fixtures

## Folder shape

```text
evals/
├─ fixtures/
│  ├─ raw/
│  ├─ questions/
│  └─ workspaces/
├─ goldens/
│  ├─ wiki/
│  ├─ outputs/
│  └─ answers/
├─ suites/
│  ├─ ingest/
│  ├─ extraction/
│  ├─ wiki/
│  ├─ workflows/
│  └─ lint/
└─ rubrics/
```

## Session 1 artifact set

### Fixture

- `evals/fixtures/raw/meetings/2026-04-10-example-client-sync.md`

### Goldens

- `evals/goldens/wiki/ingest-example-client-sync/index.md`
- `evals/goldens/wiki/ingest-example-client-sync/log.md`
- `evals/goldens/wiki/ingest-example-client-sync/sources/2026-04-10-example-client-sync.md`

### Suite manifest

- `evals/suites/ingest/session-1-example-client-sync.json`

## Next artifact set for wiki testing

### Non-leaky meeting series fixture

Use separate raw meeting files, not one bundle that also contains the answers.

- `evals/fixtures/raw/meetings/pinnacle-logistics/2026-03-04-discovery.md`
- `evals/fixtures/raw/meetings/pinnacle-logistics/2026-03-11-follow-up.md`
- `evals/fixtures/raw/meetings/pinnacle-logistics/2026-03-24-proposal.md`

### Question bank

- `evals/fixtures/questions/pinnacle-logistics-sales-cycle.md`

### Goldens

- structural source summary goldens for each meeting where the formatting is stable enough to compare exactly
- project/topic rollup structural goldens for shared workstreams where the formatting is stable enough to compare exactly
- ops page goldens when page rendering remains deterministic enough to compare
- answer files or targeted snippet checks for wiki-answerability checks

### Suite manifests

- one source-analysis suite
- one extraction / rollup suite
- one wiki-answerability suite using generated wiki artifacts only
- one HTML review-report runner for manual inspection

## Pass criteria for the first ingest suite

A run passes if the workspace contains files that match the goldens for:

1. summary page path and contents
2. index mutation
3. log mutation

## Pass criteria for the next wiki-answerability gate

A run passes if:

1. each meeting source produces a structured summary page
2. each meeting source also produces a persisted analysis artifact that validates against the expected schema
3. the shared rollup page matches the expected latest-state structure
4. curated questions are answerable from generated wiki artifacts without consulting raw files that contain the answer key
5. the run can emit a human-reviewable HTML report for inspection

## Eval rules for transcript QA

- keep the fixture sanitized
- keep each raw meeting as its own file when possible
- keep Q&A banks separate from raw evidence
- score against generated wiki artifacts first, not the raw source copy
- keep structural goldens hand-authored and human-readable
- prefer exact file comparison for deterministic structure, pathing, and formatting
- validate model-assisted analysis artifacts for schema shape and required fields
- use targeted snippet checks and review reports for semantic behavior before broader rubric scoring
- keep prompt version and model metadata persisted with the analysis artifact

## Next eval additions after Session 1

1. source-summary structural suite
2. analysis-artifact schema validation suite
3. decisions/actions/future work extraction suite
4. multi-meeting reasoning suite using separated raw files + question bank
5. repeatable HTML review report generation
6. weekly report fixture and expected output
7. workspace validation suite
