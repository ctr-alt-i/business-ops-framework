# Pinnacle Logistics Discovery

- Source ID: `2026-03-04-pinnacle-logistics-discovery`
- Kind: `meeting-transcript`
- Source date: `2026-03-04`
- Raw file: [2026-03-04-pinnacle-logistics-discovery.md](../../raw/meetings/2026-03-04-pinnacle-logistics-discovery.md)
- Ingested at: `2026-03-04T16:00:00.000Z`
- Status: `summarized`

## Participants
<!-- participants:auto -->
- Bryan Mendez — CTRL.ALT.I — Solution Lead
- Marcus Reyes — MCR Consulting — Partner
- Sarah Chen — Pinnacle Logistics — Director of Operations
- David Kim — Pinnacle Logistics — IT Manager

## Executive Summary
<!-- executive-summary:auto -->
The meeting focused on Pinnacle Logistics AP Automation: Invoice ingestion from the AP inbox; LLM extraction with confidence scoring; Vendor matching against the QuickBooks vendor list; GL account mapping via a maintained lookup table. Build price: $18,000 to $22,000 (ballpark). Initial delivery estimate: six weeks from kickoff to production, assuming sandbox QuickBooks access in week one. Deferred or out-of-scope items included GoHighLevel work for this engagement (deferred to a separate Q3 conversation). Key decision: Keep GoHighLevel out of the current engagement and defer it to a separate Q3 track. Immediate next step: Put together a more detailed scope document and pressure-test the numbers.

## Key Facts
<!-- key-facts:auto -->
- Monthly invoice volume: 800 vendor invoices per month
- Accounting system: QuickBooks Online
- Integration API: QuickBooks Online Bills API
- Orchestration layer: N8N
- Active vendors: 40 vendors
- Frequent GL accounts: 12 regularly used accounts

## Scope
### In scope
<!-- scope-in:auto -->
- Invoice ingestion from the AP inbox
- LLM extraction with confidence scoring
- Vendor matching against the QuickBooks vendor list
- GL account mapping via a maintained lookup table
- QuickBooks Online Bills API push
- Exception handling and human review queue

### Deferred / out of scope
<!-- scope-out:auto -->
- GoHighLevel work for this engagement (deferred to a separate Q3 conversation)

## Commercials
<!-- commercials:auto -->
- Build price: $18,000 to $22,000 (ballpark)
- Monthly retainer: $1,500

## Timeline
<!-- timeline:auto -->
- Initial delivery estimate: six weeks from kickoff to production, assuming sandbox QuickBooks access in week one

## Decisions and Signals
<!-- decisions-signals:auto -->
- Keep GoHighLevel out of the current engagement and defer it to a separate Q3 track.
- Set a follow-up meeting and bring Patricia Walsh into approval discussions.

## Open Questions and Risks
<!-- open-questions-risks:auto -->
- Choose whether low-confidence exceptions should route through N8N or a lightweight review UI.
- Risk: Timeline commitments depend on timely sandbox QuickBooks access.

## Next Steps
<!-- next-steps:auto -->
- Put together a more detailed scope document and pressure-test the numbers.
- Loop Patricia Walsh into the next meeting.

## Related Pages
- [Pinnacle Logistics AP Automation](../projects/pinnacle-logistics-ap-automation.md)
