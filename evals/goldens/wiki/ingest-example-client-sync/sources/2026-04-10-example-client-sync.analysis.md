# Analysis Artifact — Example Client Sync

- Source ID: `2026-04-10-example-client-sync`
- Raw file: [2026-04-10-example-client-sync.md](../../raw/meetings/2026-04-10-example-client-sync.md)
- Summary page: [2026-04-10-example-client-sync.md](2026-04-10-example-client-sync.md)
- Analyzer: `eval-fixture-meeting-analyzer`
- Prompt version: `eval-fixture-v1`
- Provider: `eval-fixture`
- Model: `eval-fixture/meeting-analysis`
- Analyzed at: `2026-04-10T17:30:00.000Z`
- Status: `complete`

## Validation Notes
- none

## Normalized Output
```json
{
  "meta": {
    "sourceId": "2026-04-10-example-client-sync",
    "analyzerId": "eval-fixture-meeting-analyzer",
    "promptVersion": "eval-fixture-v1",
    "provider": "eval-fixture",
    "model": "eval-fixture/meeting-analysis",
    "analyzedAt": "2026-04-10T17:30:00.000Z",
    "warnings": []
  },
  "sourceSummary": {
    "sourceId": "2026-04-10-example-client-sync",
    "title": "Example Client Sync",
    "kind": "meeting-transcript",
    "sourceDate": "2026-04-10",
    "ingestedAt": "2026-04-10T17:30:00.000Z",
    "rawPath": "raw/meetings/2026-04-10-example-client-sync.md",
    "summary": "The meeting focused on Example Client Sync: Weekly report draft as the primary v1 deliverable; Meeting recap draft after each call; Running action-item tracker in the workspace; Transcript process notes upload. Immediate follow-up due by Tuesday. Deferred or out-of-scope items included Dashboard work in v1 and Invoice support until the recap workflow is stable. Key decision: Prioritize the weekly report pilot as the primary v1 deliverable. Immediate next step: Maintain a running list of action items in the workspace.",
    "participants": [
      {
        "id": "ava",
        "name": "Ava",
        "role": "Consultant",
        "evidence": [
          {
            "sourceId": "2026-04-10-example-client-sync",
            "sourcePath": "raw/meetings/2026-04-10-example-client-sync.md"
          }
        ]
      },
      {
        "id": "riley",
        "name": "Riley",
        "role": "Client Ops",
        "evidence": [
          {
            "sourceId": "2026-04-10-example-client-sync",
            "sourcePath": "raw/meetings/2026-04-10-example-client-sync.md"
          }
        ]
      },
      {
        "id": "jordan",
        "name": "Jordan",
        "role": "Client PM",
        "evidence": [
          {
            "sourceId": "2026-04-10-example-client-sync",
            "sourcePath": "raw/meetings/2026-04-10-example-client-sync.md"
          }
        ]
      }
    ],
    "keyFacts": [
      {
        "id": "2026-04-10-example-client-sync-fact-primary-v1-deliverable",
        "label": "Primary v1 deliverable",
        "value": "Weekly report",
        "category": "scope",
        "evidence": [
          {
            "sourceId": "2026-04-10-example-client-sync",
            "sourcePath": "raw/meetings/2026-04-10-example-client-sync.md"
          }
        ]
      }
    ],
    "scopeIn": [
      "Weekly report draft as the primary v1 deliverable",
      "Meeting recap draft after each call",
      "Running action-item tracker in the workspace",
      "Transcript process notes upload",
      "Sample recap artifact"
    ],
    "scopeOut": [
      "Dashboard work in v1",
      "Invoice support until the recap workflow is stable"
    ],
    "commercialNotes": [],
    "timelineNotes": [
      "Immediate follow-up due by Tuesday"
    ],
    "decisionsAndSignals": [
      "Prioritize the weekly report pilot as the primary v1 deliverable.",
      "Keep dashboard work out of v1."
    ],
    "openQuestions": [],
    "nextSteps": [
      "Maintain a running list of action items in the workspace.",
      "Upload the current transcript process notes and a sample recap."
    ]
  },
  "decisions": [
    {
      "id": "2026-04-10-example-client-sync-decision-1",
      "summary": "Prioritize the weekly report pilot as the primary v1 deliverable.",
      "status": "confirmed",
      "evidence": [
        {
          "sourceId": "2026-04-10-example-client-sync",
          "sourcePath": "raw/meetings/2026-04-10-example-client-sync.md"
        }
      ]
    },
    {
      "id": "2026-04-10-example-client-sync-decision-2",
      "summary": "Keep dashboard work out of v1.",
      "status": "confirmed",
      "evidence": [
        {
          "sourceId": "2026-04-10-example-client-sync",
          "sourcePath": "raw/meetings/2026-04-10-example-client-sync.md"
        }
      ]
    }
  ],
  "actionItems": [
    {
      "id": "2026-04-10-example-client-sync-action-1",
      "summary": "Maintain a running list of action items in the workspace.",
      "owner": "Jordan / workspace team",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-04-10-example-client-sync",
          "sourcePath": "raw/meetings/2026-04-10-example-client-sync.md"
        }
      ]
    },
    {
      "id": "2026-04-10-example-client-sync-action-2",
      "summary": "Upload the current transcript process notes and a sample recap.",
      "owner": "Ava",
      "dueDate": "Tuesday",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-04-10-example-client-sync",
          "sourcePath": "raw/meetings/2026-04-10-example-client-sync.md"
        }
      ]
    }
  ],
  "futureWorkItems": [
    {
      "id": "2026-04-10-example-client-sync-future-work-1",
      "summary": "Capture invoice support as future work once the recap workflow is stable.",
      "category": "follow-on",
      "status": "open",
      "evidence": [
        {
          "sourceId": "2026-04-10-example-client-sync",
          "sourcePath": "raw/meetings/2026-04-10-example-client-sync.md"
        }
      ]
    }
  ],
  "approvalSignals": [],
  "risks": [],
  "stakeholders": [
    {
      "id": "ava",
      "name": "Ava",
      "role": "Consultant",
      "relatedSourceIds": [
        "2026-04-10-example-client-sync"
      ]
    },
    {
      "id": "riley",
      "name": "Riley",
      "role": "Client Ops",
      "relatedSourceIds": [
        "2026-04-10-example-client-sync"
      ]
    },
    {
      "id": "jordan",
      "name": "Jordan",
      "role": "Client PM",
      "relatedSourceIds": [
        "2026-04-10-example-client-sync"
      ]
    }
  ],
  "scopeChanges": [],
  "commercialSnapshots": [],
  "timelineMilestones": [],
  "rollupHints": []
}
```
