# Analysis Artifact — Pinnacle Logistics Discovery

- Source ID: `2026-03-04-pinnacle-logistics-discovery`
- Raw file: [2026-03-04-pinnacle-logistics-discovery.md](../../raw/meetings/2026-03-04-pinnacle-logistics-discovery.md)
- Summary page: [2026-03-04-pinnacle-logistics-discovery.md](2026-03-04-pinnacle-logistics-discovery.md)
- Analyzer: `eval-fixture-meeting-analyzer`
- Prompt version: `eval-fixture-v1`
- Provider: `eval-fixture`
- Model: `eval-fixture/meeting-analysis`
- Analyzed at: `2026-03-04T16:00:00.000Z`
- Status: `complete`

## Validation Notes
- none

## Normalized Output
```json
{
  "meta": {
    "sourceId": "2026-03-04-pinnacle-logistics-discovery",
    "analyzerId": "eval-fixture-meeting-analyzer",
    "promptVersion": "eval-fixture-v1",
    "provider": "eval-fixture",
    "model": "eval-fixture/meeting-analysis",
    "analyzedAt": "2026-03-04T16:00:00.000Z",
    "warnings": []
  },
  "sourceSummary": {
    "sourceId": "2026-03-04-pinnacle-logistics-discovery",
    "title": "Pinnacle Logistics Discovery",
    "kind": "meeting-transcript",
    "sourceDate": "2026-03-04",
    "ingestedAt": "2026-03-04T16:00:00.000Z",
    "rawPath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md",
    "summary": "The meeting focused on Pinnacle Logistics AP Automation: Invoice ingestion from the AP inbox; LLM extraction with confidence scoring; Vendor matching against the QuickBooks vendor list; GL account mapping via a maintained lookup table. Build price: $18,000 to $22,000 (ballpark). Initial delivery estimate: six weeks from kickoff to production, assuming sandbox QuickBooks access in week one. Deferred or out-of-scope items included GoHighLevel work for this engagement (deferred to a separate Q3 conversation). Key decision: Keep GoHighLevel out of the current engagement and defer it to a separate Q3 track. Immediate next step: Put together a more detailed scope document and pressure-test the numbers.",
    "participants": [
      {
        "id": "bryan-mendez",
        "name": "Bryan Mendez",
        "organization": "CTRL.ALT.I",
        "role": "Solution Lead",
        "evidence": [
          {
            "sourceId": "2026-03-04-pinnacle-logistics-discovery",
            "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
          }
        ]
      },
      {
        "id": "marcus-reyes",
        "name": "Marcus Reyes",
        "organization": "MCR Consulting",
        "role": "Partner",
        "evidence": [
          {
            "sourceId": "2026-03-04-pinnacle-logistics-discovery",
            "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
          }
        ]
      },
      {
        "id": "sarah-chen",
        "name": "Sarah Chen",
        "organization": "Pinnacle Logistics",
        "role": "Director of Operations",
        "evidence": [
          {
            "sourceId": "2026-03-04-pinnacle-logistics-discovery",
            "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
          }
        ]
      },
      {
        "id": "david-kim",
        "name": "David Kim",
        "organization": "Pinnacle Logistics",
        "role": "IT Manager",
        "evidence": [
          {
            "sourceId": "2026-03-04-pinnacle-logistics-discovery",
            "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
          }
        ]
      }
    ],
    "keyFacts": [
      {
        "id": "2026-03-04-pinnacle-logistics-discovery-fact-monthly-invoice-volume",
        "label": "Monthly invoice volume",
        "value": "800 vendor invoices per month",
        "category": "volume",
        "evidence": [
          {
            "sourceId": "2026-03-04-pinnacle-logistics-discovery",
            "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
          }
        ]
      },
      {
        "id": "2026-03-04-pinnacle-logistics-discovery-fact-accounting-system",
        "label": "Accounting system",
        "value": "QuickBooks Online",
        "category": "system",
        "evidence": [
          {
            "sourceId": "2026-03-04-pinnacle-logistics-discovery",
            "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
          }
        ]
      },
      {
        "id": "2026-03-04-pinnacle-logistics-discovery-fact-integration-api",
        "label": "Integration API",
        "value": "QuickBooks Online Bills API",
        "category": "system",
        "evidence": [
          {
            "sourceId": "2026-03-04-pinnacle-logistics-discovery",
            "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
          }
        ]
      },
      {
        "id": "2026-03-04-pinnacle-logistics-discovery-fact-orchestration-layer",
        "label": "Orchestration layer",
        "value": "N8N",
        "category": "system",
        "evidence": [
          {
            "sourceId": "2026-03-04-pinnacle-logistics-discovery",
            "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
          }
        ]
      },
      {
        "id": "2026-03-04-pinnacle-logistics-discovery-fact-active-vendors",
        "label": "Active vendors",
        "value": "40 vendors",
        "category": "other",
        "evidence": [
          {
            "sourceId": "2026-03-04-pinnacle-logistics-discovery",
            "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
          }
        ]
      },
      {
        "id": "2026-03-04-pinnacle-logistics-discovery-fact-frequent-gl-accounts",
        "label": "Frequent GL accounts",
        "value": "12 regularly used accounts",
        "category": "other",
        "evidence": [
          {
            "sourceId": "2026-03-04-pinnacle-logistics-discovery",
            "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
          }
        ]
      }
    ],
    "scopeIn": [
      "Invoice ingestion from the AP inbox",
      "LLM extraction with confidence scoring",
      "Vendor matching against the QuickBooks vendor list",
      "GL account mapping via a maintained lookup table",
      "QuickBooks Online Bills API push",
      "Exception handling and human review queue"
    ],
    "scopeOut": [
      "GoHighLevel work for this engagement (deferred to a separate Q3 conversation)"
    ],
    "commercialNotes": [
      "Build price: $18,000 to $22,000 (ballpark)",
      "Monthly retainer: $1,500"
    ],
    "timelineNotes": [
      "Initial delivery estimate: six weeks from kickoff to production, assuming sandbox QuickBooks access in week one"
    ],
    "decisionsAndSignals": [
      "Keep GoHighLevel out of the current engagement and defer it to a separate Q3 track.",
      "Set a follow-up meeting and bring Patricia Walsh into approval discussions."
    ],
    "openQuestions": [
      "Choose whether low-confidence exceptions should route through N8N or a lightweight review UI.",
      "Risk: Timeline commitments depend on timely sandbox QuickBooks access."
    ],
    "nextSteps": [
      "Put together a more detailed scope document and pressure-test the numbers.",
      "Loop Patricia Walsh into the next meeting."
    ]
  },
  "decisions": [
    {
      "id": "2026-03-04-pinnacle-logistics-discovery-decision-1",
      "summary": "Keep GoHighLevel out of the current engagement and defer it to a separate Q3 track.",
      "status": "confirmed",
      "evidence": [
        {
          "sourceId": "2026-03-04-pinnacle-logistics-discovery",
          "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
        }
      ]
    },
    {
      "id": "2026-03-04-pinnacle-logistics-discovery-decision-2",
      "summary": "Set a follow-up meeting and bring Patricia Walsh into approval discussions.",
      "status": "confirmed",
      "evidence": [
        {
          "sourceId": "2026-03-04-pinnacle-logistics-discovery",
          "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
        }
      ]
    }
  ],
  "actionItems": [
    {
      "id": "2026-03-04-pinnacle-logistics-discovery-action-1",
      "summary": "Put together a more detailed scope document and pressure-test the numbers.",
      "owner": "Bryan Mendez",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-03-04-pinnacle-logistics-discovery",
          "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
        }
      ]
    },
    {
      "id": "2026-03-04-pinnacle-logistics-discovery-action-2",
      "summary": "Loop Patricia Walsh into the next meeting.",
      "owner": "Sarah Chen",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-03-04-pinnacle-logistics-discovery",
          "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
        }
      ]
    }
  ],
  "futureWorkItems": [
    {
      "id": "2026-03-04-pinnacle-logistics-discovery-future-work-1",
      "summary": "Consider GoHighLevel work later under a separate budget and Q3 conversation.",
      "category": "expansion",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-03-04-pinnacle-logistics-discovery",
          "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
        }
      ]
    }
  ],
  "approvalSignals": [],
  "risks": [
    {
      "id": "2026-03-04-pinnacle-logistics-discovery-risk-1",
      "summary": "Timeline commitments depend on timely sandbox QuickBooks access.",
      "severity": "medium",
      "evidence": [
        {
          "sourceId": "2026-03-04-pinnacle-logistics-discovery",
          "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
        }
      ]
    }
  ],
  "stakeholders": [
    {
      "id": "bryan-mendez",
      "name": "Bryan Mendez",
      "organization": "CTRL.ALT.I",
      "role": "Solution Lead",
      "decisionRole": "driver",
      "relatedSourceIds": [
        "2026-03-04-pinnacle-logistics-discovery"
      ]
    },
    {
      "id": "marcus-reyes",
      "name": "Marcus Reyes",
      "organization": "MCR Consulting",
      "role": "Partner",
      "decisionRole": "observer",
      "relatedSourceIds": [
        "2026-03-04-pinnacle-logistics-discovery"
      ]
    },
    {
      "id": "sarah-chen",
      "name": "Sarah Chen",
      "organization": "Pinnacle Logistics",
      "role": "Director of Operations",
      "decisionRole": "driver",
      "relatedSourceIds": [
        "2026-03-04-pinnacle-logistics-discovery"
      ]
    },
    {
      "id": "david-kim",
      "name": "David Kim",
      "organization": "Pinnacle Logistics",
      "role": "IT Manager",
      "decisionRole": "reviewer",
      "relatedSourceIds": [
        "2026-03-04-pinnacle-logistics-discovery"
      ]
    }
  ],
  "scopeChanges": [
    {
      "id": "2026-03-04-pinnacle-logistics-discovery-scope-change-1",
      "summary": "GoHighLevel was deferred out of the AP automation engagement and moved to a later Q3 track.",
      "type": "deferred",
      "affectedArea": "GoHighLevel",
      "evidence": [
        {
          "sourceId": "2026-03-04-pinnacle-logistics-discovery",
          "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
        }
      ]
    }
  ],
  "commercialSnapshots": [
    {
      "id": "2026-03-04-pinnacle-logistics-discovery-commercial-1",
      "sourceId": "2026-03-04-pinnacle-logistics-discovery",
      "buildPrice": "$18,000 to $22,000",
      "monthlyPrice": "$1,500",
      "notes": "Initial AP automation ballpark for core ingestion, extraction, vendor matching, GL mapping, exception handling, and QuickBooks push.",
      "evidence": [
        {
          "sourceId": "2026-03-04-pinnacle-logistics-discovery",
          "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
        }
      ]
    }
  ],
  "timelineMilestones": [
    {
      "id": "2026-03-04-pinnacle-logistics-discovery-timeline-1",
      "summary": "Initial estimate: six weeks from kickoff to production if sandbox access lands in week one",
      "status": "proposed",
      "evidence": [
        {
          "sourceId": "2026-03-04-pinnacle-logistics-discovery",
          "sourcePath": "raw/meetings/2026-03-04-pinnacle-logistics-discovery.md"
        }
      ]
    }
  ],
  "rollupHints": [
    {
      "kind": "project",
      "id": "pinnacle-logistics-ap-automation",
      "name": "Pinnacle Logistics AP Automation"
    }
  ]
}
```
