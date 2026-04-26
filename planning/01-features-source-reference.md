# Features Source Reference

## Canonical planning inputs

These files are the source packet for the starter implementation:

- `planning/sources/business-ops-framework-features.html`
  - full feature ambition
  - artifact-first and admin-first framing
  - broader future roadmap
- `planning/sources/llm-wiki.md`
  - persistent wiki pattern
  - raw / wiki / schema operating model
  - index, log, and lint concepts
- `planning/sources/accountilytics-llm-wiki-structure-suggestion.html`
  - simplified folder model
  - rationale for organizing by workflow role instead of file type
- `planning/starter-architecture-final-workflow-memory-evals-v2.html`
  - starter repo structure
  - workspace structure
  - first-class evals guidance
- `planning/v1-feature-scope.md`
  - distilled implementation scope for the first build

## How to use the packet

- Treat `business-ops-framework-features.html` as the **full requirements source**, not the direct coding backlog.
- Treat `v1-feature-scope.md` as the **implementation filter** for v1.
- Treat the numbered markdown files in `planning/` as the **build packet** for scaffolding and eval design.

## Resolved defaults for the starter scaffold

Unless a later planning revision changes them, this repo should assume:

- one workspace per **engagement**
- **meeting transcripts / meeting notes** as the first source type
- **post-call processing** as workflow #1
- **meeting recap** and **weekly report** as the first required outputs
- **TypeScript/Node** for the initial code scaffold

## Session 1 interpretation

For Session 1, the planning packet should drive a very small implementation surface:

- finalize the docs
- draft `workspaces/example-engagement/AGENTS.md`
- add one sanitized ingest fixture and goldens
- define core types
- implement workspace and ingest stubs
