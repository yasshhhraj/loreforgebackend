# [SYSTEM COMPONENT: Core Turn Execution Loop]
**Last Updated:** May 2026 | **Architecture Version:** v5.0
**Status:** APPROVED

## 1. Context & Scope
This document defines the primary data flow and execution loop for a single round of gameplay, utilizing the new service nomenclature: Main Server, Agent, and DBLayer. It establishes how state is fetched, evaluated, mutated, and broadcasted.

## 2. Core Functional Specification
*   **Main Server Role:** Acts as the network orchestrator. It collects player submissions, reads the current game state from the database, and routes a single, comprehensive payload to the Agent. It waits for the Agent's final response to broadcast to clients.
*   **Agent Role:** The AI logic and storytelling engine. It determines action success/failure based on the Cold State, generates the narrative, and packages all database updates (Mutations, Turn Logs, and World Bible summaries) to send to the DBLayer.
*   **DBLayer Role:** The exclusive database writer. It receives structured update packages from the Agent, commits them to the database, and returns a success status back to the Agent.

## 3. Sequential Execution Step
1. **Submission:** Players submit [Public Action] + [Secret Intent] to the Main Server.
2. **Context Bundle:** Main Server fetches [Cold State], [World Bible], and [Hot Context] from the database and routes them alongside player inputs to the Agent.
3. **Agent Evaluation:** Agent processes the rules, generates prose, and constructs an DBLayer payload.
4. **Database Commit:** Agent sends the payload to DBLayer. DBLayer writes:
    * `a)` Field mutations (Health, Inventory, Bonds).
    * `b)` Action objects (Turn Log).
    * `c)` Compressed summary (If entries > 10).
5. **Agent Handoff:** DBLayer returns 'Success' to Agent. Agent returns [Narrator Prose] + [New Cold State] to the Main Server.
6. **Client Broadcast:** Main Server pushes the response to the Clients.