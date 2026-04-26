# Product Framing

## Thesis

This repo is an **LLM-native business operations workflow framework**.
The persistent wiki is the **memory layer**, not the end product.
The user-facing value comes from a small set of workflows that turn raw engagement artifacts into durable memory and useful outputs.

## What v1 must prove

V1 should prove one clean loop:

1. a workspace can hold raw evidence, wiki memory, outputs, admin records, and archive material
2. one source can be ingested in a deterministic, inspectable, file-based way
3. the wiki can be updated without hidden state
4. extracted operational facts can be attached back to source evidence
5. workflows can eventually build on top of that memory layer

## Default product decisions for the starter build

- **Workspace boundary:** one workspace per engagement
- **First source types:** meeting transcripts and meeting notes
- **First workflow:** post-call processing
- **First durable outputs:** meeting recap and weekly report
- **Implementation style:** minimal, file-based, markdown-first, no database required for v1
- **Starter stack:** TypeScript/Node with Pi as a thin operator shell later

## Product shape

Think in layers:

- **raw/** = immutable source evidence
- **wiki/** = maintained memory and derived context
- **outputs/** = human-facing artifacts
- **admin/** = legal and finance records
- **archive/** = retired material

The core loop is:

```text
raw source -> ingest -> wiki update -> workflow output
```

## Explicit non-goals for Session 1

Session 1 should **not** try to finish the whole framework.
It should only lock the planning packet and create the first usable scaffold:

- finalized planning docs
- one engagement-scoped example workspace
- one sanitized eval fixture and goldens
- core TypeScript types
- workspace initialization stub
- one-source ingest stub

## Guardrails

- Keep everything inspectable on disk.
- Prefer markdown artifacts over hidden runtime state.
- Do not introduce a database, vector store, or scheduler yet.
- Do not build a workflow DSL yet.
- Do not overfit to one client’s folder sprawl.

## Success signal for this session

This session is successful if a future implementation session can start from a clear packet and a minimal scaffold, then immediately extend:

1. workspace init and validation
2. one-source ingest
3. wiki maintenance
4. extraction
5. workflows
6. evals
