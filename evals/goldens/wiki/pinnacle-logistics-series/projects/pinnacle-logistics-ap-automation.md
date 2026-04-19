# Pinnacle Logistics AP Automation

## Current State
<!-- current-state:auto -->
Pinnacle Logistics AP Automation currently includes Invoice ingestion from the AP inbox; LLM extraction with confidence scoring; Vendor matching against the QuickBooks vendor list; GL account mapping via a maintained lookup table; QuickBooks Online Bills API push; Exception handling and human review queue; Slack approval workflow for invoice approvals; Basic admin dashboard for workflow visibility. Latest commercial snapshot: build $24,500, monthly $1,800. Latest timeline milestone: Sandbox QuickBooks access is needed by March 28. Target date: March 28. Deferred or removed work includes GoHighLevel work for this engagement (deferred to a separate Q3 conversation); Expense report automation add-on (parked until after AP go-live / July review).

## Stakeholders
<!-- stakeholders:auto -->
- Bryan Mendez — CTRL.ALT.I — Solution Lead — driver
- David Kim — Pinnacle Logistics — IT Manager — reviewer
- Marcus Reyes — MCR Consulting — Partner — observer
- Patricia Walsh — Pinnacle Logistics — CFO — approver
- Sarah Chen — Pinnacle Logistics — Director of Operations — driver

## Scope Snapshot
### Current in scope
<!-- current-scope:auto -->
- Invoice ingestion from the AP inbox
- LLM extraction with confidence scoring
- Vendor matching against the QuickBooks vendor list
- GL account mapping via a maintained lookup table
- QuickBooks Online Bills API push
- Exception handling and human review queue
- Slack approval workflow for invoice approvals
- Basic admin dashboard for workflow visibility

### Deferred / removed
<!-- deferred-scope:auto -->
- GoHighLevel work for this engagement (deferred to a separate Q3 conversation)
- Expense report automation add-on (parked until after AP go-live / July review)

## Commercial Snapshot
<!-- commercial-snapshot:auto -->
- Current build price: $24,500
- Current monthly retainer: $1,800
- Notes: Started as $18,000 to $22,000 with $1,500/month support; Slack approval workflow increases the build and monthly support price; Final proposal includes the admin dashboard requested before the proposal walkthrough.

## Timeline Snapshot
<!-- timeline-snapshot:auto -->
- Initial estimate: six weeks from kickoff to production if sandbox access lands in week one
- The workflow needs to be live before fiscal year close — target June 30
- Kick off by April 1 to maintain a comfortable buffer before fiscal close — target April 1
- Phase 1: Phase 1 covers ingestion and extraction in the first three weeks
- Phase 2: Phase 2 covers Slack approvals and QuickBooks integration
- Phase 3: Phase 3 covers production cutover, monitoring, and training
- Target go-live by May 26 if kickoff starts April 1 — target May 26
- Sandbox QuickBooks access is needed by March 28 — target March 28

## Scope and Timeline Changes
<!-- changes:auto -->
- GoHighLevel was deferred out of the AP automation engagement and moved to a later Q3 track
- Slack approvals were added after Bryan Mendez identified manual approvals as the remaining bottleneck
- An admin dashboard was added so Sarah Chen can monitor workflow activity without relying on David Kim
- Expense report automation was parked until after the AP workflow reaches production
- Commercials progressed from $18,000 to $22,000 plus $1,500/month to $24,500 plus $1,800/month
- Timeline evolved from a six-week estimate to an eight-week phased delivery plan

## Open Questions
<!-- open-questions:auto -->
- Choose whether low-confidence exceptions should route through N8N or a lightweight review UI.
- Risk: Timeline commitments depend on timely sandbox QuickBooks access.
- Risk: Extraction errors could send incorrect invoice data into QuickBooks.
- Risk: Manual approvals can remain a bottleneck even if invoice ingestion is automated.
- Client kickoff dependencies remain: sandbox QuickBooks access, the top 40 vendor / GL mapping list, and guest Slack access.

## Source History
<!-- source-history:auto -->
- [2026-03-04 Pinnacle Logistics Discovery](../sources/2026-03-04-pinnacle-logistics-discovery.md)
- [2026-03-11 Pinnacle Logistics Follow-up](../sources/2026-03-11-pinnacle-logistics-follow-up.md)
- [2026-03-24 Pinnacle Logistics Proposal Walkthrough](../sources/2026-03-24-pinnacle-logistics-proposal-walkthrough.md)
