# V1 Workflows

## Workflow priority order

1. **Post-call processing**
2. **Weekly reporting**
3. **Morning briefing**

The repo should be scaffolded in a way that makes workflow #1 easy to implement first.

---

## Workflow #1 — Post-call processing

### Why it comes first

This workflow best proves the core loop:

```text
new meeting source -> ingest -> wiki update -> operational extraction -> recap output
```

### Inputs

- one new meeting transcript or meeting note
- existing engagement wiki context

### Core steps

1. classify and file the source under `raw/`
2. create or update a structured source summary page under `wiki/sources/`
3. update `wiki/index.md`
4. append `wiki/log.md`
5. extract key facts, decisions, action items, future work, and lightweight approval signals
6. update relevant entity / project / topic rollup pages when the source belongs to an ongoing workstream
7. update ops pages
8. draft a meeting recap

### Outputs

- source summary page
- updated index
- updated log
- updated project / topic / entity rollup page when applicable
- updated decision log
- updated action tracker
- updated future work page
- meeting recap draft

### Session 1 implementation boundary

Session 1 only needs the **stub** portion of this workflow:

- source filing
- source summary creation
- index update
- log update

Extraction and recap generation are deferred to the next session.

### Immediate next gate after Session 1

To make transcript QA possible, the next implementation pass should add:

1. source summarization that replaces the stub with structured sections for participants, key facts, scope, commercials, timeline, open questions, and next steps
2. one schema-constrained LLM analysis call per source that returns decisions, action items, future work, approval signals, key facts, and other structured meeting fields in a single result
3. persisted on-disk analysis artifacts for each source, including analyzer id, prompt version, model metadata, normalized output, and validation warnings when present
4. multi-meeting reasoning via project/topic rollup pages that preserve chronology and latest state by aggregating structured source analysis results
5. non-leaky eval fixtures where meeting sources are separated from the Q&A bank / expected answers
6. a repeatable HTML review report script for human inspection of ingest + wiki results

---

## Workflow #2 — Weekly reporting

### Goal

Use the wiki as a compounding memory base to generate a useful weekly report.

### Inputs

- recent source summaries
- current project and topic pages
- open actions and recent decisions

### Outputs

- weekly report draft
- optional stakeholder summary

### Dependency on workflow #1

Weekly reporting should not be implemented before the ingest + wiki update loop is working.

---

## Workflow #3 — Morning briefing

### Goal

Assemble the operator’s current-day context into a short briefing.

### Inputs

- open actions
- recent decisions
- recent source activity
- scheduling context when available later

### Outputs

- daily recap
- meeting prep notes
- overdue follow-up list

### Status

Important, but not part of Session 1.

---

## File-based workflow rule for v1

Before adding automation, every workflow should be understandable as visible file mutations:

- what raw files were read
- what wiki files were created or updated
- what output files were generated
- what analysis artifact was produced for each source
- what eval fixture and structural assertions represent the expected result

For multi-meeting evals, prefer one real meeting per raw source file. Do not bundle source evidence and the answer key into the same raw fixture.

For v1, semantic extraction may be model-assisted, but it should happen through one structured analysis call per source rather than many narrow calls. The resulting structured analysis must be persisted on disk and remain inspectable without rerunning the model.
