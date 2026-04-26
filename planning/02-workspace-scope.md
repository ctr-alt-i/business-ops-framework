# Workspace Scope

## Decision

A workspace represents **one engagement**.

## Why engagement is the right boundary for v1

An engagement boundary keeps together the things that need to move through the same operational loop:

- raw source evidence
- derived wiki memory
- client-facing outputs
- admin records tied to the work
- archived material

This is a better v1 default than:

- **one workspace per client** — too broad when a client has multiple independent workstreams
- **one workspace per project** — too narrow when meetings, reporting, billing context, and shared decisions span multiple project files

## What belongs in an engagement workspace

- meeting transcripts and meeting notes
- requirements and technical reference docs
- client-specific working artifacts
- weekly reports and recaps
- decision, action, and future work tracking pages
- legal and finance records relevant to the engagement

## What does not belong in a v1 workspace

- global multi-client operating data
- centralized billing systems of record
- fully automated scheduling state
- durable external integration state

## Naming conventions

- Workspace folder name: lowercase kebab-case
  - example: `example-engagement`
- Human-readable name can live in `README.md`, `overview.md`, and `AGENTS.md`
- Source-derived files should use a date prefix when known
  - example: `2026-04-10-example-client-sync.md`

## Required top-level structure

```text
workspaces/<engagement>/
├─ AGENTS.md
├─ README.md
├─ raw/
├─ wiki/
├─ outputs/
├─ admin/
└─ archive/
```

## Required wiki structure for v1

```text
wiki/
├─ index.md
├─ log.md
├─ overview.md
├─ sources/
├─ entities/
├─ projects/
├─ topics/
└─ ops/
   ├─ decision-log.md
   ├─ action-tracker.md
   └─ future-work.md
```

## Session 1 consequence

The starter implementation should only support:

- engagement-scoped workspace validation
- file-based scaffold creation
- one-source-at-a-time ingest into the right `raw/` subfolder
- summary, index, and log updates inside `wiki/`
