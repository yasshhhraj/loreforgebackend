# [SYSTEM COMPONENT: Agent -> Main Server Resolution Payload]
**Last Updated:** May 2026 | **Architecture Version:** v5.0
**Status:** APPROVED

## 1. Context & Scope
This document defines the exact JSON payload structure sent from the Agent back to the Main Server during Step 5 of the Turn Execution Loop. This payload is transmitted *only* after the Agent receives a success signal from the DBlayer, guaranteeing that the database has been safely updated before the Main Server broadcasts the story and stat changes to the players.

## 2. Core Functional Specification
*   **Safe Broadcast Guarantee:** By requiring the Agent to wait for the DBlayer's success signal before sending this payload, the system completely eliminates race conditions. A player will never read a story event before their character's UI reflects the mechanical consequences.
*   **UI-Ready Data:** This payload contains exactly what the Next.js client needs to render the new state: the cinematic prose string and the absolute, updated numerical values for health, bonds, and inventory.

## 3. Data Schema & Payload Structures

```json
{
  "gameSessionId": "sess_8f92a1",
  "turnNumber": 12,
  "narratorProse": "Sparks shower from the overhead vents as Kael sprints down the corridor, searing his shoulder. Elara slips silently in his wake, her hand hovering over her sidearm...",
  "updatedColdState": {
    "players": [
      {
        "playerId": "usr_99",
        "playerName": "Kael",
        "health": 85,
        "bondScore": 40,
        "inventory": ["Blaster", "Syndicate Keycard"],
        "narrativeAmmo": ["Knows Elara is hiding a tracker"]
      },
      {
        "playerId": "usr_102",
        "playerName": "Elara",
        "health": 85,
        "bondScore": 30,
        "inventory": ["Medkit", "Tracking Beacon"],
        "narrativeAmmo": ["Trust Issues"]
      }
    ]
  }
}