# Wiki Page Templates

These templates are still optimized for inspectable file mutations, not polished prose.
Session 1 used the minimal ingest stub. The next gate should upgrade source pages and rollup pages so the wiki can support factual recall and multi-meeting reasoning.

## `wiki/index.md`

```md
# Index

## Workspace
- [Overview](overview.md)
- [Log](log.md)

## Sources
<!-- sources:auto -->

## Projects
_No project pages yet._

## Entities
_No entity pages yet._

## Topics
_No topic pages yet._

## Ops
- [Decision Log](ops/decision-log.md)
- [Action Tracker](ops/action-tracker.md)
- [Future Work](ops/future-work.md)
```

## `wiki/log.md`

```md
# Log

Append-only workspace activity log.

<!-- log:auto -->
```

## `wiki/overview.md`

```md
# Overview

Short description of the engagement workspace.

## Current focus
- current delivery scope
- current reporting cadence
- current open operational concerns
```

## Session 1 starter `wiki/sources/<source-id>.md`

```md
# <Source Title>

- Source ID: `<source-id>`
- Kind: `<source-kind>`
- Source date: `<YYYY-MM-DD>`
- Raw file: [<filename>](../../raw/meetings/<filename>)
- Ingested at: `<ISO timestamp>`
- Status: `stub`

## Summary
Stub ingest completed. Replace this section with a model-authored source summary in the next session.

## Follow-on
- extract decisions
- extract action items
- extract future work
- draft meeting recap
```

## Session 2+ upgraded `wiki/sources/<source-id>.md`

Use this structure once source summarization is implemented.
The page should be answerable on its own for single-source questions and should expose structured sections that can roll up into project/topic pages.
The page should be rendered from one persisted meeting analysis artifact rather than from many narrow extraction passes.

```md
# <Source Title>

- Source ID: `<source-id>`
- Kind: `<source-kind>`
- Source date: `<YYYY-MM-DD>`
- Raw file: [<filename>](../../raw/meetings/<filename>)
- Ingested at: `<ISO timestamp>`
- Status: `summarized`

## Participants
<!-- participants:auto -->
- <name> — <role>

## Executive Summary
<!-- executive-summary:auto -->
Short narrative summary of the meeting or note.

## Key Facts
<!-- key-facts:auto -->
- <fact>

## Scope
### In scope
<!-- scope-in:auto -->
- <item>

### Deferred / out of scope
<!-- scope-out:auto -->
- <item>

## Commercials
<!-- commercials:auto -->
- Build price: <value>
- Monthly retainer: <value>
- Payment terms: <value>

## Timeline
<!-- timeline:auto -->
- <milestone or commitment>

## Decisions and Signals
<!-- decisions-signals:auto -->
- <decision or approval signal>

## Open Questions and Risks
<!-- open-questions-risks:auto -->
- <question or risk>

## Next Steps
<!-- next-steps:auto -->
- <next step>

## Related Pages
- [Project / Topic rollup](../projects/<project-id>.md)
```

## `wiki/sources/<source-id>.analysis.md`

Persist this artifact when the source is analyzed through a schema-constrained LLM call.
Keep it inspectable, markdown-first, and easy to diff.

```md
# Analysis Artifact — <Source Title>

- Source ID: `<source-id>`
- Raw file: [<filename>](../../raw/meetings/<filename>)
- Summary page: [<source-id>.md](./<source-id>.md)
- Analyzer: `<meeting-analyzer-id>`
- Prompt version: `<prompt-version>`
- Model: `<provider/model>`
- Analyzed at: `<ISO timestamp>`
- Status: `complete`

## Validation Notes
- none

## Normalized Output
~~~json
{
  "sourceSummary": {
    "summary": "..."
  },
  "decisions": [],
  "actionItems": [],
  "futureWork": []
}
~~~
```

## `wiki/projects/<project-id>.md`

Use a project rollup page when multiple meetings belong to the same workstream and the wiki needs to answer cross-meeting questions.

```md
# <Project Name>

## Current State
<!-- current-state:auto -->
One short paragraph on the latest state of the work.

## Stakeholders
<!-- stakeholders:auto -->
- <name> — <role> — <decision role>

## Scope Snapshot
### Current in scope
<!-- current-scope:auto -->
- <item>

### Deferred / removed
<!-- deferred-scope:auto -->
- <item>

## Commercial Snapshot
<!-- commercial-snapshot:auto -->
- Current build price: <value>
- Current monthly retainer: <value>
- Notes: <note>

## Timeline Snapshot
<!-- timeline-snapshot:auto -->
- <current timeline>

## Scope and Timeline Changes
<!-- changes:auto -->
- <what changed and why>

## Open Questions
<!-- open-questions:auto -->
- <question>

## Source History
<!-- source-history:auto -->
- [<YYYY-MM-DD Source Title>](../sources/<source-id>.md)
```

## `wiki/ops/decision-log.md`

```md
# Decision Log

<!-- decisions:auto -->
- No decisions recorded yet.
```

## `wiki/ops/action-tracker.md`

```md
# Action Tracker

<!-- actions:auto -->
- No action items recorded yet.
```

## `wiki/ops/future-work.md`

```md
# Future Work

<!-- future-work:auto -->
- No future work items recorded yet.
```

## Planning note

- Session 1 code only creates or updates `wiki/sources/<source-id>.md`, `wiki/index.md`, and `wiki/log.md`.
- The next gate should replace stub summaries with the upgraded source template, persist `wiki/sources/<source-id>.analysis.md`, and begin maintaining project rollup pages for multi-meeting reasoning.
- Prefer deterministic section markers and exact-match goldens for structural fields, but treat semantic extraction as model-assisted and reviewable rather than fully deterministic.
