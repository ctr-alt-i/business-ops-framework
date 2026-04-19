# Analysis Artifact — Pinnacle Logistics Proposal Walkthrough

- Source ID: `2026-03-24-pinnacle-logistics-proposal-walkthrough`
- Raw file: [2026-03-24-pinnacle-logistics-proposal-walkthrough.md](../../raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md)
- Summary page: [2026-03-24-pinnacle-logistics-proposal-walkthrough.md](2026-03-24-pinnacle-logistics-proposal-walkthrough.md)
- Analyzer: `eval-fixture-meeting-analyzer`
- Prompt version: `eval-fixture-v1`
- Provider: `eval-fixture`
- Model: `eval-fixture/meeting-analysis`
- Analyzed at: `2026-03-24T16:00:00.000Z`
- Status: `complete`

## Validation Notes
- none

## Normalized Output
```json
{
  "meta": {
    "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
    "analyzerId": "eval-fixture-meeting-analyzer",
    "promptVersion": "eval-fixture-v1",
    "provider": "eval-fixture",
    "model": "eval-fixture/meeting-analysis",
    "analyzedAt": "2026-03-24T16:00:00.000Z",
    "warnings": []
  },
  "sourceSummary": {
    "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
    "title": "Pinnacle Logistics Proposal Walkthrough",
    "kind": "meeting-transcript",
    "sourceDate": "2026-03-24",
    "ingestedAt": "2026-03-24T16:00:00.000Z",
    "rawPath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md",
    "summary": "The meeting focused on Pinnacle Logistics AP Automation: Invoice ingestion from the AP inbox; LLM extraction with confidence scoring; Vendor matching against the QuickBooks vendor list; GL account mapping via a maintained lookup table. Monthly retainer: $1,800. Committed delivery plan: eight weeks total, phased. Deferred or out-of-scope items included Expense report automation add-on (parked until after AP go-live / July review). Key decision: Finalize scope with invoice ingestion, extraction, approvals, QuickBooks integration, and an admin dashboard. Immediate next step: Provide sandbox QuickBooks access.",
    "participants": [
      {
        "id": "bryan-mendez",
        "name": "Bryan Mendez",
        "organization": "CTRL.ALT.I",
        "role": "Solution Lead",
        "evidence": [
          {
            "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
            "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
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
            "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
            "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
          }
        ]
      },
      {
        "id": "patricia-walsh",
        "name": "Patricia Walsh",
        "organization": "Pinnacle Logistics",
        "role": "CFO",
        "evidence": [
          {
            "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
            "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
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
            "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
            "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
          }
        ]
      }
    ],
    "keyFacts": [
      {
        "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-fact-accounting-system",
        "label": "Accounting system",
        "value": "QuickBooks Online",
        "category": "system",
        "evidence": [
          {
            "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
            "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
          }
        ]
      },
      {
        "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-fact-integration-api",
        "label": "Integration API",
        "value": "QuickBooks Online Bills API",
        "category": "system",
        "evidence": [
          {
            "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
            "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
          }
        ]
      },
      {
        "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-fact-orchestration-layer",
        "label": "Orchestration layer",
        "value": "N8N",
        "category": "system",
        "evidence": [
          {
            "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
            "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
          }
        ]
      },
      {
        "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-fact-kickoff-target",
        "label": "Kickoff target",
        "value": "April 1",
        "category": "timeline",
        "evidence": [
          {
            "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
            "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
          }
        ]
      },
      {
        "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-fact-go-live-target",
        "label": "Go-live target",
        "value": "May 26",
        "category": "timeline",
        "evidence": [
          {
            "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
            "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
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
      "Exception handling and human review queue",
      "Slack approval workflow for invoice approvals",
      "Basic admin dashboard for workflow visibility"
    ],
    "scopeOut": [
      "Expense report automation add-on (parked until after AP go-live / July review)"
    ],
    "commercialNotes": [
      "Monthly retainer: $1,800",
      "Build price: $24,500",
      "Payment terms: Net 30 on the build invoice, billed 50% at kickoff and 50% at production cutover; monthly retainer starts when production goes live"
    ],
    "timelineNotes": [
      "Committed delivery plan: eight weeks total, phased",
      "Phase 1 (weeks 1-3): ingestion and extraction in a test environment",
      "Phase 2 (weeks 4-6): Slack approvals and QuickBooks integration",
      "Phase 3 (weeks 7-8): production cutover, monitoring, and training",
      "Go-live target: May 26 if kickoff starts April 1",
      "Sandbox QuickBooks access needed by March 28",
      "Vendor / GL mapping list due by Friday",
      "Sandbox access follow-up scheduled for Monday"
    ],
    "decisionsAndSignals": [
      "Finalize scope with invoice ingestion, extraction, approvals, QuickBooks integration, and an admin dashboard.",
      "Park expense report automation until the AP workflow is live and revisit it in July.",
      "Proceed with the AP automation engagement and move to signature.",
      "Patricia Walsh and Sarah Chen approved moving forward with the proposal."
    ],
    "openQuestions": [
      "Client kickoff dependencies remain: sandbox QuickBooks access, the top 40 vendor / GL mapping list, and guest Slack access.",
      "Risk: Timeline commitments depend on timely sandbox QuickBooks access."
    ],
    "nextSteps": [
      "Provide sandbox QuickBooks access.",
      "Provide guest Slack workspace access for the approval workflow build.",
      "Provide the top 40 vendor list with preferred GL accounts.",
      "Send the SOW for signature."
    ]
  },
  "decisions": [
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-decision-1",
      "summary": "Finalize scope with invoice ingestion, extraction, approvals, QuickBooks integration, and an admin dashboard.",
      "status": "confirmed",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    },
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-decision-2",
      "summary": "Park expense report automation until the AP workflow is live and revisit it in July.",
      "status": "confirmed",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    },
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-decision-3",
      "summary": "Proceed with the AP automation engagement and move to signature.",
      "status": "confirmed",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    }
  ],
  "actionItems": [
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-action-1",
      "summary": "Provide sandbox QuickBooks access.",
      "owner": "David Kim",
      "dueDate": "March 28",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    },
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-action-2",
      "summary": "Provide guest Slack workspace access for the approval workflow build.",
      "owner": "Pinnacle Logistics",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    },
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-action-3",
      "summary": "Provide the top 40 vendor list with preferred GL accounts.",
      "owner": "David Kim",
      "dueDate": "Friday",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    },
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-action-4",
      "summary": "Send the SOW for signature.",
      "owner": "Bryan Mendez",
      "dueDate": "This afternoon",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    }
  ],
  "futureWorkItems": [
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-future-work-1",
      "summary": "Revisit expense report automation after the AP workflow reaches production.",
      "category": "expansion",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    }
  ],
  "approvalSignals": [
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-approval-1",
      "summary": "Patricia Walsh and Sarah Chen approved moving forward with the proposal.",
      "status": "approved",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    }
  ],
  "risks": [
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-risk-1",
      "summary": "Timeline commitments depend on timely sandbox QuickBooks access.",
      "severity": "medium",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
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
        "2026-03-24-pinnacle-logistics-proposal-walkthrough"
      ]
    },
    {
      "id": "sarah-chen",
      "name": "Sarah Chen",
      "organization": "Pinnacle Logistics",
      "role": "Director of Operations",
      "decisionRole": "driver",
      "relatedSourceIds": [
        "2026-03-24-pinnacle-logistics-proposal-walkthrough"
      ]
    },
    {
      "id": "patricia-walsh",
      "name": "Patricia Walsh",
      "organization": "Pinnacle Logistics",
      "role": "CFO",
      "decisionRole": "approver",
      "relatedSourceIds": [
        "2026-03-24-pinnacle-logistics-proposal-walkthrough"
      ]
    },
    {
      "id": "david-kim",
      "name": "David Kim",
      "organization": "Pinnacle Logistics",
      "role": "IT Manager",
      "decisionRole": "reviewer",
      "relatedSourceIds": [
        "2026-03-24-pinnacle-logistics-proposal-walkthrough"
      ]
    }
  ],
  "scopeChanges": [
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-scope-change-1",
      "summary": "An admin dashboard was added so Sarah Chen can monitor workflow activity without relying on David Kim.",
      "type": "added",
      "affectedArea": "dashboard",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    },
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-scope-change-2",
      "summary": "Expense report automation was parked until after the AP workflow reaches production.",
      "type": "deferred",
      "affectedArea": "expense automation",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    }
  ],
  "commercialSnapshots": [
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-commercial-1",
      "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
      "buildPrice": "$24,500",
      "monthlyPrice": "$1,800",
      "paymentTerms": "Net 30 on the build invoice; 50% billed at kickoff and 50% at production cutover; monthly retainer starts when production goes live.",
      "notes": "Final proposal includes the admin dashboard requested before the proposal walkthrough.",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    }
  ],
  "timelineMilestones": [
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-timeline-1",
      "summary": "Phase 1 covers ingestion and extraction in the first three weeks",
      "phase": "Phase 1",
      "status": "committed",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    },
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-timeline-2",
      "summary": "Phase 2 covers Slack approvals and QuickBooks integration",
      "phase": "Phase 2",
      "status": "committed",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    },
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-timeline-3",
      "summary": "Phase 3 covers production cutover, monitoring, and training",
      "phase": "Phase 3",
      "status": "committed",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    },
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-timeline-4",
      "summary": "Target go-live by May 26 if kickoff starts April 1",
      "targetDate": "May 26",
      "status": "committed",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
        }
      ]
    },
    {
      "id": "2026-03-24-pinnacle-logistics-proposal-walkthrough-timeline-5",
      "summary": "Sandbox QuickBooks access is needed by March 28",
      "targetDate": "March 28",
      "status": "committed",
      "evidence": [
        {
          "sourceId": "2026-03-24-pinnacle-logistics-proposal-walkthrough",
          "sourcePath": "raw/meetings/2026-03-24-pinnacle-logistics-proposal-walkthrough.md"
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
