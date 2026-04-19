# Pinnacle Logistics Proposal Walkthrough

- Source ID: `2026-03-24-pinnacle-logistics-proposal-walkthrough`
- Kind: `meeting-transcript`
- Source date: `2026-03-24`
- Raw file: [2026-03-24-pinnacle-logistics-proposal-walkthrough.md](../../raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md)
- Ingested at: `2026-03-24T16:00:00.000Z`
- Status: `summarized`

## Participants
<!-- participants:auto -->
- Bryan Mendez — CTRL.ALT.I — Solution Lead
- Sarah Chen — Pinnacle Logistics — Director of Operations
- Patricia Walsh — Pinnacle Logistics — CFO
- David Kim — Pinnacle Logistics — IT Manager

## Executive Summary
<!-- executive-summary:auto -->
The meeting focused on Pinnacle Logistics AP Automation: Invoice ingestion from the AP inbox; LLM extraction with confidence scoring; Vendor matching against the QuickBooks vendor list; GL account mapping via a maintained lookup table. Monthly retainer: $1,800. Committed delivery plan: eight weeks total, phased. Deferred or out-of-scope items included Expense report automation add-on (parked until after AP go-live / July review). Key decision: Finalize scope with invoice ingestion, extraction, approvals, QuickBooks integration, and an admin dashboard. Immediate next step: Provide sandbox QuickBooks access.

## Key Facts
<!-- key-facts:auto -->
- Accounting system: QuickBooks Online
- Integration API: QuickBooks Online Bills API
- Orchestration layer: N8N
- Kickoff target: April 1
- Go-live target: May 26

## Scope
### In scope
<!-- scope-in:auto -->
- Invoice ingestion from the AP inbox
- LLM extraction with confidence scoring
- Vendor matching against the QuickBooks vendor list
- GL account mapping via a maintained lookup table
- QuickBooks Online Bills API push
- Exception handling and human review queue
- Slack approval workflow for invoice approvals
- Basic admin dashboard for workflow visibility

### Deferred / out of scope
<!-- scope-out:auto -->
- Expense report automation add-on (parked until after AP go-live / July review)

## Commercials
<!-- commercials:auto -->
- Monthly retainer: $1,800
- Build price: $24,500
- Payment terms: Net 30 on the build invoice, billed 50% at kickoff and 50% at production cutover; monthly retainer starts when production goes live

## Timeline
<!-- timeline:auto -->
- Committed delivery plan: eight weeks total, phased
- Phase 1 (weeks 1-3): ingestion and extraction in a test environment
- Phase 2 (weeks 4-6): Slack approvals and QuickBooks integration
- Phase 3 (weeks 7-8): production cutover, monitoring, and training
- Go-live target: May 26 if kickoff starts April 1
- Sandbox QuickBooks access needed by March 28
- Vendor / GL mapping list due by Friday
- Sandbox access follow-up scheduled for Monday

## Decisions and Signals
<!-- decisions-signals:auto -->
- Finalize scope with invoice ingestion, extraction, approvals, QuickBooks integration, and an admin dashboard.
- Park expense report automation until the AP workflow is live and revisit it in July.
- Proceed with the AP automation engagement and move to signature.
- Patricia Walsh and Sarah Chen approved moving forward with the proposal.

## Open Questions and Risks
<!-- open-questions-risks:auto -->
- Client kickoff dependencies remain: sandbox QuickBooks access, the top 40 vendor / GL mapping list, and guest Slack access.
- Risk: Timeline commitments depend on timely sandbox QuickBooks access.

## Next Steps
<!-- next-steps:auto -->
- Provide sandbox QuickBooks access.
- Provide guest Slack workspace access for the approval workflow build.
- Provide the top 40 vendor list with preferred GL accounts.
- Send the SOW for signature.

## Related Pages
- [Pinnacle Logistics AP Automation](../projects/pinnacle-logistics-ap-automation.md)
