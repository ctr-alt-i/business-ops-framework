# Analysis Artifact — Pinnacle Logistics Follow-up

- Source ID: `2026-03-11-pinnacle-logistics-follow-up`
- Raw file: [2026-03-11-pinnacle-logistics-follow-up.md](../../raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md)
- Summary page: [2026-03-11-pinnacle-logistics-follow-up.md](2026-03-11-pinnacle-logistics-follow-up.md)
- Analyzer: `eval-fixture-meeting-analyzer`
- Prompt version: `eval-fixture-v1`
- Provider: `eval-fixture`
- Model: `eval-fixture/meeting-analysis`
- Analyzed at: `2026-03-11T16:00:00.000Z`
- Status: `complete`

## Validation Notes
- none

## Normalized Output
```json
{
  "meta": {
    "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
    "analyzerId": "eval-fixture-meeting-analyzer",
    "promptVersion": "eval-fixture-v1",
    "provider": "eval-fixture",
    "model": "eval-fixture/meeting-analysis",
    "analyzedAt": "2026-03-11T16:00:00.000Z",
    "warnings": []
  },
  "sourceSummary": {
    "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
    "title": "Pinnacle Logistics Follow-up",
    "kind": "meeting-transcript",
    "sourceDate": "2026-03-11",
    "ingestedAt": "2026-03-11T16:00:00.000Z",
    "rawPath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md",
    "summary": "The meeting focused on Pinnacle Logistics AP Automation: Exception handling and human review queue; Slack approval workflow for invoice approvals. Slack approval workflow increment: $3,000 build and $300 monthly. Timeline changed from six weeks to eight weeks after adding Slack approvals. Deferred or out-of-scope items included GoHighLevel work for this engagement (deferred to a separate Q3 conversation). Key decision: Add a Slack approval workflow to remove the post-ingestion approval bottleneck. Immediate next step: Send the proposal to Sarah Chen and Patricia Walsh.",
    "participants": [
      {
        "id": "bryan-mendez",
        "name": "Bryan Mendez",
        "organization": "CTRL.ALT.I",
        "role": "Solution Lead",
        "evidence": [
          {
            "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
            "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
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
            "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
            "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
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
            "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
            "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
          }
        ]
      }
    ],
    "keyFacts": [
      {
        "id": "2026-03-11-pinnacle-logistics-follow-up-fact-orchestration-layer",
        "label": "Orchestration layer",
        "value": "N8N",
        "category": "system",
        "evidence": [
          {
            "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
            "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
          }
        ]
      },
      {
        "id": "2026-03-11-pinnacle-logistics-follow-up-fact-fiscal-year-close",
        "label": "Fiscal year close",
        "value": "June 30",
        "category": "timeline",
        "evidence": [
          {
            "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
            "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
          }
        ]
      },
      {
        "id": "2026-03-11-pinnacle-logistics-follow-up-fact-kickoff-target",
        "label": "Kickoff target",
        "value": "April 1",
        "category": "timeline",
        "evidence": [
          {
            "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
            "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
          }
        ]
      }
    ],
    "scopeIn": [
      "Exception handling and human review queue",
      "Slack approval workflow for invoice approvals"
    ],
    "scopeOut": [
      "GoHighLevel work for this engagement (deferred to a separate Q3 conversation)"
    ],
    "commercialNotes": [
      "Slack approval workflow increment: $3,000 build and $300 monthly",
      "Revised price: $24,000 build and $1,800 monthly"
    ],
    "timelineNotes": [
      "Timeline changed from six weeks to eight weeks after adding Slack approvals",
      "Target deployment before the June 30 fiscal year close",
      "Kickoff target: April 1",
      "Planned phased delivery: Phase 1 ingestion, Phase 2 approvals, Phase 3 production cutover"
    ],
    "decisionsAndSignals": [
      "Add a Slack approval workflow to remove the post-ingestion approval bottleneck.",
      "Keep GoHighLevel out of the current engagement and defer it to a separate Q3 track.",
      "Proceed with N8N as the orchestration layer as long as the client retains ownership and avoids lock-in.",
      "Structure delivery in three phases so the client sees ingestion working in the first three weeks.",
      "Patricia Walsh reacted positively to the Slack approval workflow addition."
    ],
    "openQuestions": [
      "Risk: Extraction errors could send incorrect invoice data into QuickBooks.",
      "Risk: Manual approvals can remain a bottleneck even if invoice ingestion is automated."
    ],
    "nextSteps": [
      "Send the proposal to Sarah Chen and Patricia Walsh.",
      "Structure the proposal as a phased delivery plan with working ingestion in the first three weeks."
    ]
  },
  "decisions": [
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-decision-1",
      "summary": "Add a Slack approval workflow to remove the post-ingestion approval bottleneck.",
      "status": "confirmed",
      "rationale": "Manual approvals remained the gating step even if invoice ingestion was automated.",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    },
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-decision-2",
      "summary": "Keep GoHighLevel out of the current engagement and defer it to a separate Q3 track.",
      "status": "confirmed",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    },
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-decision-3",
      "summary": "Proceed with N8N as the orchestration layer as long as the client retains ownership and avoids lock-in.",
      "status": "confirmed",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    },
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-decision-4",
      "summary": "Structure delivery in three phases so the client sees ingestion working in the first three weeks.",
      "status": "confirmed",
      "rationale": "Patricia Walsh asked for an early working milestone to reduce risk.",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    }
  ],
  "actionItems": [
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-action-1",
      "summary": "Send the proposal to Sarah Chen and Patricia Walsh.",
      "owner": "Bryan Mendez",
      "dueDate": "End of next week",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    },
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-action-2",
      "summary": "Structure the proposal as a phased delivery plan with working ingestion in the first three weeks.",
      "owner": "Bryan Mendez",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    }
  ],
  "futureWorkItems": [
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-future-work-1",
      "summary": "Consider GoHighLevel work later under a separate budget and Q3 conversation.",
      "category": "expansion",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    }
  ],
  "approvalSignals": [
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-approval-1",
      "summary": "Patricia Walsh reacted positively to the Slack approval workflow addition.",
      "status": "approved",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    }
  ],
  "risks": [
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-risk-1",
      "summary": "Extraction errors could send incorrect invoice data into QuickBooks.",
      "severity": "high",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    },
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-risk-2",
      "summary": "Manual approvals can remain a bottleneck even if invoice ingestion is automated.",
      "severity": "medium",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
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
        "2026-03-11-pinnacle-logistics-follow-up"
      ]
    },
    {
      "id": "sarah-chen",
      "name": "Sarah Chen",
      "organization": "Pinnacle Logistics",
      "role": "Director of Operations",
      "decisionRole": "driver",
      "relatedSourceIds": [
        "2026-03-11-pinnacle-logistics-follow-up"
      ]
    },
    {
      "id": "patricia-walsh",
      "name": "Patricia Walsh",
      "organization": "Pinnacle Logistics",
      "role": "CFO",
      "decisionRole": "approver",
      "relatedSourceIds": [
        "2026-03-11-pinnacle-logistics-follow-up"
      ]
    }
  ],
  "scopeChanges": [
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-scope-change-1",
      "summary": "GoHighLevel was deferred out of the AP automation engagement and moved to a later Q3 track.",
      "type": "deferred",
      "affectedArea": "GoHighLevel",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    },
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-scope-change-2",
      "summary": "Slack approvals were added after Bryan Mendez identified manual approvals as the remaining bottleneck.",
      "type": "added",
      "affectedArea": "approvals",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    }
  ],
  "commercialSnapshots": [
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-commercial-1",
      "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
      "buildPrice": "$24,000",
      "monthlyPrice": "$1,800",
      "notes": "Slack approval workflow increases the build and monthly support price.",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    }
  ],
  "timelineMilestones": [
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-timeline-1",
      "summary": "The workflow needs to be live before fiscal year close",
      "targetDate": "June 30",
      "status": "committed",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
        }
      ]
    },
    {
      "id": "2026-03-11-pinnacle-logistics-follow-up-timeline-2",
      "summary": "Kick off by April 1 to maintain a comfortable buffer before fiscal close",
      "targetDate": "April 1",
      "status": "committed",
      "evidence": [
        {
          "sourceId": "2026-03-11-pinnacle-logistics-follow-up",
          "sourcePath": "raw/meetings/2026-03-11-pinnacle-logistics-follow-up.md"
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
