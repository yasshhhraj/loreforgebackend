# [SYSTEM COMPONENT: Main Server -> Agent Context Payload]
**Last Updated:** May 2026 | **Architecture Version:** v5.0
**Status:** APPROVED

## 1. Context & Scope
This document defines the exact JSON payload structure sent from the Main Server to the Agent during Step 2 of the Turn Execution Loop. It bundles the newly submitted player actions with the 3-Layer Memory Matrix (Cold State, Warm State/World Bible, Hot Context) fetched from the database, giving the stateless Agent complete situational awareness.

## 2. Core Functional Specification
*   **Single Request Guarantee:** The Agent will never query the database. The Main Server must provide 100% of the required context in this single payload.
*   **Data Completeness:** The payload must include environmental data, hardcoded character capabilities (for the Referee logic), the World Bible (for genre/narrative consistency), and the immediate history (Hot Context).
*   **Stateless Processing:** The Agent uses this payload strictly as read-only memory to generate its outputs and DBlayer tool calls.

## 3. Data Schema & Payload Structures

```json
{
  "session": {
    "gameSessionId": "sess_8f92a1",
    "turnNumber": 12,
    "genre": "Sci-Fi Thriller",
    "currentLocation": "Airlock Bay 4"
  },
  "memoryMatrix": {
    "worldBible": "- Turn 4: The Syndicate locked down the sector.\n- Turn 10: Kael forced the airlock open.",
    "hotContext": [
      {
        "turnNumber": 11,
        "playerInputs": [
          {
            "playerName": "Kael",
            "publicAction": "I pry open the jammed inner door with my crowbar.",
            "secretIntent": "If the door opens, I slip through first and ready my weapon."
          }
        ],
        "narratorProse": "With a guttural shout, Kael forces the crowbar into the seam..."
      }
    ]
  },
  "coldState": {
    "players": [
      {
        "playerId": "usr_99",
        "playerName": "Kael",
        "health": 100,
        "bondScore": 45,
        "capabilities": ["Brute Strength", "Smuggler"],
        "narrativeAmmo": ["Knows Elara is hiding a tracker"],
        "inventory": ["Crowbar", "Blaster"]
      },
      {
        "playerId": "usr_102",
        "playerName": "Elara",
        "health": 85,
        "bondScore": 30,
        "capabilities": ["Cyber-Slicing", "Medic"],
        "narrativeAmmo": ["Trust Issues"],
        "inventory": ["Medkit", "Tracking Beacon"]
      }
    ]
  },
  "currentTurnInputs": [
    {
      "playerId": "usr_99",
      "playerName": "Kael",
      "publicAction": "I sprint down the hallway.",
      "secretIntent": "I keep an eye on the vents above me."
    },
    {
      "playerId": "usr_102",
      "playerName": "Elara",
      "publicAction": "I follow Kael closely.",
      "secretIntent": "If Kael stops, I draw my sidearm."
    }
  ]
}