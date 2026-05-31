Here is the comprehensive blueprint for the Loreforge v6.0 architecture. This document outlines the evolution of the game engine, detailing the previous v5.0 microservice model, the architectural bottlenecks that necessitated a change, and the new highly-optimized v6.0 paradigm.

---

## **1. System Overview**

Loreforge is a multiplayer, text-driven RPG framework orchestrated by an autonomous AI Game Master. Players interact through a "Two-Box" system, submitting both public actions and secret intents simultaneously. The core engineering philosophy prioritizes strict rule enforcement, zero AI hallucinations, and race-condition-free broadcasting by rigorously isolating the AI from direct database access.

---

## **2. The Legacy of v5.0 (The 3-Tier Microservice)**

To ensure strict adherence to game rules, the v5.0 architecture divided the system into three physically isolated servers (microservices).

* 
**The Main Server (The Orchestrator):** This was the network orchestrator and client gateway. It handled the "No-Timer Sync," waiting indefinitely for all active players to submit their moves before advancing the game.


* 
**The Agent (The Brain):** This was the completely stateless AI logic engine. It acted as a Referee (evaluating hardcoded skills against actions), a Mutator (calculating state changes), and a Narrator (writing the story prose).


* 
**The MCP Server (The Pacemaker):** This was the exclusive gatekeeper to the database. It received structured mutation commands from the Agent, validated them against strict schemas, committed them to the database, and sent a success signal back.



### **Why We Shifted to v6.0 (The Catalyst for Change)**

While v5.0 was a masterclass in defensive design, it suffered from a fatal flaw for an early-stage application: it confused *logical* isolation with *physical* isolation. We shifted to v6.0 because:

1. 
**Microservice Overhead:** Separating a system into three distinct microservices simply so one can handle WebSockets, one can make an external LLM API call, and one can run a database query is a massive architectural anti-pattern for a project of this scale.


2. 
**Network Latency:** Wrapping simple database queries in their own dedicated microservice only introduces unnecessary network latency, deployment headaches, and distributed points of failure.


3. 
**Synchronous Bottlenecks:** Having the Agent server sit open and "hanging" while a secondary service executes database transactions is an architectural anti-pattern that increases latency, compute costs, and the risk of network timeouts.



---

## **3. The v6.0 Architecture (The Modular Monolith)**

Version 6.0 abandons the physical 3-server split in favor of a **Single-Server Modular Monolith**. You get the exact same security and strict rule enforcement as the 3-server model, but with zero internal network latency and only one deployment pipeline.

Instead of physical servers, v6.0 enforces the "Separation of Powers" using strict TypeScript code layers:

* 
**The Controller Layer (Formerly Main Server):** Handles WebSocket connections, the "No-Timer Sync," and the Ghosting Protocol. It manages the stateful connections with the clients, collects inputs, and passes them down.


* 
**The Service Layer (Formerly Agent):** Formats the prompt, makes the HTTP call to the LLM SDK, and receives the JSON response. It acts as the stateless logic engine.


* 
**The Repository Layer (Formerly MCP/DBLayer):** This is your "bouncer". It takes the JSON from the Service Layer, runs it through strict Zod schemas to catch hallucinations, and executes the Prisma `$transaction`. Because TypeScript enforces these boundaries, the AI still has zero direct access to your database.



(Note for Scale: If the game explodes in popularity, v6.0 scales by splitting workloads, not by database vs. AI. Server 1 becomes a stateful WebSocket Gateway, and Server 2 becomes a fleet of stateless Game Engine/Worker servers to crunch the LLM/Database tasks ).

---

## **4. The 3-Layer Memory Matrix (Preserved)**

The crowning achievement of Loreforge's data design remains untouched in v6.0. Memory is permanently stored across three distinct tiers to solve the LLM context-window limitation:

1. 
**Cold State (Structured Data):** The absolute "Ground Truth". Tracks exact numerical values for health, inventory, capabilities, and the Bond Track.


2. 
**Warm State (Compressed Text):** The "World Bible". Permanently stores major plot points to keep the AI aligned with the overarching narrative.


3. 
**Hot Context (Raw Prose):** The raw, unedited prose transcript of the last 5 to 10 rounds. This gives the AI immediate situational awareness and conversation pacing.



---

## **5. The v6.0 Execution Loop (Data Flow)**

By collapsing the network hops, the turn loop executes identically to v5.0 but with significantly reduced latency.

1. **Simultaneous Submission:** Players submit their Public Action and Secret Intent to the Controller Layer. The "No-Timer Sync" waits for all active players.
2. **Context Harvesting:** The Controller Layer fetches the 3-Layer Memory Matrix (Cold State, Warm State, Hot Context) via the Repository Layer.
3. **Service Evaluation (The AI):** The Controller passes the bundled context to the Service Layer. The LLM evaluates the turn and generates a strict, three-part JSON payload (Mutations, Turn Log, World Bible Update) alongside the narrative prose.
4. **Repository Gatekeeping:** The Service Layer passes the JSON to the Repository Layer. The Repository runs strict Zod validation. If legal, it fires the Prisma `$transaction` to update the database.
5. **Immediate Broadcast:** Once the Repository Layer's transaction succeeds, the Controller Layer immediately pushes the newly updated stats and story text to the players' screens simultaneously.