# V1 Feature Scope

Distilled primarily from `business-ops-framework-features.html`, with architectural alignment from the wiki/workspace planning documents.

## Product framing

This project should be built as an **LLM-native business operations workflow framework** with a **persistent wiki memory layer**.

- The **memory layer** keeps durable, maintained context.
- The **workflow layer** turns that context into useful actions and outputs.
- The **workflow layer is the product surface**.
- The **wiki is the enabling substrate**, not the whole product.

## What v1 must prove

V1 does not need to solve all business operations.
It needs to prove five things:

1. A workspace can hold **raw sources**, a maintained **wiki**, **outputs**, **admin** records, and **archive** content cleanly.
2. The system can ingest a new source and **reliably update the wiki**.
3. The system can extract useful operational facts from a source:
   - decisions
   - action items
   - future work
   - lightweight approval signals
4. The system can run at least one high-value workflow end to end.
5. The system can be developed with **evals from day one**.

## V1 source types

### Must support first
- meeting transcripts
- meeting notes / recap source material

### Good early additions
- technical docs
- requirements docs
- backlog / scope docs

### Later
- email threads
- chat exports
- call recordings as richer media inputs
- billing spreadsheets / invoice support files

## V1 workflows

### Workflow #1 — Post-call processing
This should be the first workflow because it best connects raw sources, memory updates, and operational outputs.

**Inputs**
- a new transcript or meeting note
- related workspace/wiki context

**Core steps**
- classify the source
- create or update a source summary page
- update relevant entity/project/topic pages
- extract decisions
- extract action items
- extract future work
- detect lightweight approval signals
- update wiki ops pages
- draft a meeting recap

**Outputs**
- meeting recap
- updated decision log
- updated action tracker
- updated future work page
- updated wiki index/log

### Workflow #2 — Weekly reporting
This should be the second workflow because it proves the wiki can serve as a compounding memory base.

**Inputs**
- recent source summaries
- project/entity/topic pages
- ops pages

**Core steps**
- assemble relevant weekly context
- summarize progress, risks, open items, and next steps
- reference decisions and important actions
- generate a draft weekly report

**Outputs**
- weekly report
- optional stakeholder summary

### Workflow #3 — Morning briefing
This is a good early follow-on workflow, but it should come after post-call processing and weekly reporting are working.

**Inputs**
- open actions
- recent decisions
- recent source activity
- upcoming calendar context if available

**Outputs**
- daily briefing
- meeting prep context
- overdue follow-up list

## V1 memory / wiki requirements

The workspace wiki should support the minimum durable structure needed to make workflows useful.

### Required wiki files
- `wiki/index.md`
- `wiki/log.md`
- `wiki/overview.md`
- `wiki/ops/decision-log.md`
- `wiki/ops/action-tracker.md`
- `wiki/ops/future-work.md`

### Required wiki page groups
- `wiki/sources/`
- `wiki/entities/`
- `wiki/projects/`
- `wiki/topics/`

### Required behaviors
- source summaries get created on ingest
- index and log get updated on ingest
- wiki pages maintain links back to source evidence
- useful query answers can be filed back into the wiki when appropriate
- linting can identify stale, missing, contradictory, or weakly linked pages

## V1 operational extraction schema

V1 should reliably extract these operational objects:

### Must have now
- `Decision`
- `ActionItem`
- `FutureWorkItem`
- `SourceSummary`
- `ProjectContext`

### Lightweight in v1
- `ApprovalSignal`
- `Stakeholder`
- `Risk`

### Later refinement
- billing evidence
- commercial change requests
- amendment candidates
- scheduling prompts
- unresolved approval queues

## V1 outputs

### Must have now
- meeting recap
- weekly report

### Good early additions
- follow-up email draft
- status summary / snapshot

### Later
- morning briefing packet
- daily closeout summary
- billing support packet
- deck generation

## Must-have implementation scope

These are the capabilities I would treat as **true v1 scope**:

1. workspace init + validation
2. `AGENTS.md` workspace schema support
3. one-source-at-a-time ingest
4. wiki update engine
5. decisions / actions / future work extraction
6. post-call workflow
7. weekly report workflow
8. meeting recap output
9. weekly report output
10. eval harness with fixtures, goldens, and rubrics

## Next scope after v1

These are important, but should come after the core loop works:

- morning briefing workflow
- approval reconciliation workflow
- email ingestion
- calendar context
- more sophisticated linting
- Pi workflow UX polish

## Later scope

These belong later so v1 stays focused:

- billing support workflow
- daily closeout workflow
- scheduling automation
- broader external integrations
- advanced search / retrieval infrastructure
- web dashboard
- multi-user / multi-tenant controls

## Explicit non-goals for the first build

Do **not** treat these as blocking requirements for the first implementation:

- microservices
- advanced vector search from day one
- a web UI before the core loop works
- a full workflow DSL before 2–3 workflows are proven
- a rich plugin marketplace
- a complete enterprise governance model

## V1 success criteria

V1 is successful if:

1. a new meeting transcript can be ingested into a workspace cleanly
2. the wiki gets updated in a durable, inspectable way
3. decisions, action items, and future work are extracted with acceptable quality
4. a useful meeting recap can be generated
5. a useful weekly report can be generated
6. evals can detect regressions in ingest, extraction, wiki updates, and outputs

## How this should shape the next session

At the start of the next development session, the repo scaffold should be built around this order:

1. workspace
2. ingest
3. wiki
4. operations extraction
5. workflows
6. outputs
7. evals
8. Pi integration
9. external adapters

## Related planning artifacts

This file should sit alongside:

- `00-product-framing.md`
- `01-workspace-scope.md`
- `02-v1-workflows.md`
- `03-workspace-schema-draft.md`
- `04-wiki-page-templates.md`
- `05-extraction-schema.md`
- `06-evals-plan.md`

If you want to keep a simpler packet, this file can serve as the bridge between the high-level features document and the concrete scaffold/evals plan.
