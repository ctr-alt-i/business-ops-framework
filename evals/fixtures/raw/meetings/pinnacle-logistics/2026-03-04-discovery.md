# Pinnacle Logistics Discovery

Date: 2026-03-04
Channel: Zoom (recorded via Plaud)
Client: Pinnacle Logistics
Project: Pinnacle Logistics AP Automation
Participants:
- Bryan Mendez (CTRL.ALT.I, Solution Lead)
- Marcus Reyes (MCR Consulting, Partner)
- Sarah Chen (Pinnacle Logistics, Director of Operations)
- David Kim (Pinnacle Logistics, IT Manager)

Sarah Chen: Thanks for making time, Bryan. Marcus speaks highly of your team. Let me give you the quick version of where we are. We're processing somewhere around 800 vendor invoices a month, all flowing through QuickBooks Online, and right now it's two people doing manual entry. It's slow, error-prone, and we're missing early-payment discounts because invoices sit in someone's inbox for a week.

Bryan Mendez: Got it. Are these mostly PDF invoices coming in via email, or do you have vendors using a portal?

Sarah Chen: About 90% email. PDF attachments. A handful of vendors send paper, but those go to one of our warehouses and get scanned in.

Bryan Mendez: Okay. And the QuickBooks setup - is that vanilla QBO or do you have any custom apps wired in?

David Kim: Vanilla. We've got the standard chart of accounts, about 40 active vendors, maybe 12 GL accounts that the AP team uses regularly. No custom integrations right now.

Marcus Reyes: Sarah, before we go deeper - what does success look like for you? Is this primarily a cost-reduction play, or is it more about cycle time?

Sarah Chen: Honestly both, but cycle time is the bigger pain. If we can get invoices from receipt to QuickBooks in under 24 hours instead of five to seven days, the discount capture alone pays for the project.

Bryan Mendez: That's very doable. Here's roughly how I'd architect this. We'd set up an inbox monitor that grabs PDFs as they come in. Run them through an LLM extraction layer to pull vendor name, line items, totals, dates. Then a vendor matching step against your QBO vendor list - we've solved this one a few times now, the LIKE query in the QBO API has some quirks but we've got a workaround. Then we map line items to GL accounts using a lookup table you maintain, and push it into QuickBooks via the Bills API.

David Kim: What about exceptions? Stuff the LLM can't parse confidently?

Bryan Mendez: Good question. Anything below a confidence threshold gets routed back to a human review queue. We can build that in N8N or use a lightweight UI - we'd want to talk through your preference there.

Sarah Chen: And what are we looking at on cost?

Bryan Mendez: For a build like this - invoice ingestion, extraction, vendor matching, GL mapping, QBO push, basic exception handling - you're looking at $18,000 to $22,000 for the build, with about a $1,500 monthly retainer for hosting, monitoring, and tweaks. That's a ballpark, not a quote.

Sarah Chen: That's in the range I expected. What about timeline?

Bryan Mendez: Six weeks from kickoff to production, assuming we get sandbox QBO access in week one.

Marcus Reyes: One thing worth flagging - you mentioned GoHighLevel earlier in our intro call. Is that still in scope for this conversation or separate?

Sarah Chen: Let's keep that separate for now. Different budget, different stakeholder.

Bryan Mendez: Works for me. Want to set up a follow-up next week? I can put together a more detailed scope doc and we can pressure-test the numbers.

Sarah Chen: Let's do Tuesday. I'll loop in Patricia, our CFO. She'll need to bless anything north of $15K.
