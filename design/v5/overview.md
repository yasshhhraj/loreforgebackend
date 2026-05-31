Here is the comprehensive, conceptual blueprint of the Loreforge system. This documentation outlines the exact data flows, memory management, and execution loops of the game engine, entirely stripped of underlying tech stacks or code.

## 1. System Overview

Loreforge is a genre-agnostic, multiplayer, text-driven RPG orchestrated by a live, autonomous AI Game Master. Players interact through a "Two-Box" system, submitting both public actions and secret intents simultaneously. The backend is designed to guarantee zero AI hallucinations, strict rule enforcement, and a real-time multiplayer experience without the use of countdown timers.

---

## 2. The 3-Pillar Architecture

To ensure strict adherence to game rules and prevent the AI from arbitrarily changing reality, the system is divided into three isolated zones of responsibility.

### Pillar 1: The Host (Client Interface & Coordination)

The Host is the gateway for players and the conductor of the game loop. It holds no AI logic and makes no gameplay decisions.

* **The Lobby & Sync:** It manages player connections, handles matchmaking, and waits for all active players to submit their moves (The "No-Timer Sync").
* **The Broadcaster:** It holds narrative responses in memory until the database is fully updated, ensuring players never read a story event before their character's actual status changes.

### Pillar 2: The Brain (The AI Engine)

This is a stateless logic environment that evaluates the game world. It performs three distinct roles in a single fluid sequence:

* **The Referee:** Cross-references player actions against their hardcoded abilities to determine success or failure (e.g., *Can this character actually pick a lock?*). It resolves conflicting secret intents between players.
* **The Mutator:** Translates the Referee's physical outcomes into strict structural commands to update player stats, inventories, or allegiances.
* **The Narrator:** Weaves the Referee's logical outcomes into creative, genre-appropriate storytelling.

### Pillar 3: The Pacemaker (The Data Gatekeeper)

This server acts as the absolute bridge to the database. The AI Brain is forbidden from touching the database directly.

* **Validation:** It receives the Mutator's commands and verifies they are legal (e.g., ensuring health doesn't drop below 0).
* **The Sync Tick:** Once the database is successfully updated, the Pacemaker fires a "Tick" back to The Host, signaling that it is safe to broadcast the new story and stats to the players.

---

## 3. The 3-Layer Memory Matrix

To keep the AI's memory sharp without forgetting the past, all data is permanently stored in the database across three distinct tiers.

| Memory Layer | Format | Purpose & Behavior |
| --- | --- | --- |
| **Cold State** | **Structured Data** | The absolute "Ground Truth." Tracks current health, inventory, capabilities, and the dynamic Bond Track (party loyalty). The AI can read this, but only the Pacemaker can alter it. |
| **Warm State** | **Compressed Text** | The "World Bible." Every 10 rounds, a background process reads recent history and compresses major plot points into permanent bullet points (e.g., *"Ignis is secretly infected"*). |
| **Hot Context** | **Raw Prose** | The exact, unedited transcript of the last 5 to 10 rounds. This is fed to the AI on every turn so it understands the immediate physical room, pacing, and current conversation. |

---

## 4. The Execution Loop (Data Flow)

Here is the exact lifecycle of a single round of Loreforge.

1. **Simultaneous Submission:** The No-Timer Sync.
Players submit their **Public Action** (what others see) and **Secret Intent** (hidden motives, traps, or reactions). The Host collects these and waits indefinitely until 100% of active players have submitted.


2. **Context Harvesting:**
The Host pulls the current Cold State, the Warm State bible, and the Hot Context from the database. It bundles this with the players' new inputs and sends it to the AI Brain.


3. **Evaluation & Split:**
The AI Brain evaluates the turn. It generates the creative story prose (which is sent back to The Host to hold in memory) and generates structural data commands (which are sent to the Pacemaker).


4. **Database Mutation & The Tick:**
The Pacemaker validates the commands, safely overwrites the Cold State in the database (e.g., deducting ammo, taking damage), and immediately sends the **Sync Tick** signal back to The Host.


5. **Broadcast & Async Ledger:**
Upon receiving the Tick, The Host pairs the fresh database stats with the waiting story prose and broadcasts it to the players' screens. In the background, it permanently saves the raw turn data into the database's Hot Context ledger so the story is never lost.


---

## 5. Fault Tolerance: The Ghosting Protocol

If a player disconnects, the game must not freeze for the rest of the lobby.

1. **The 5-Minute Fuse:** The Host detects the drop, pauses the UI, and starts a 5-minute timer.
2. **Sync Recalculation:** If the timer expires, the Host drops the missing player from the "No-Timer Sync" requirement, allowing the remaining players to submit and advance the game.
3. **Follow & Defend Mode:** The missing player is flagged in the Cold State as "Ghosted." The AI is strictly instructed to play them as a passive companion who will follow the party and defend themselves mechanically, but will make no independent choices or dialogue until the player reconnects.

---

## 6. Self-Contained Game Session Example

**Setting:** A Sci-Fi Thriller. The party is trapped in a venting airlock.
**Players:** Kael (Brawler, Secret: Smuggler) and Elara (Medic, Secret: Trust Issues).

**Round 1:**

* **Kael's Public Action:** "I pry open the jammed inner door with my crowbar."
* **Kael's Secret Intent:** "If the door opens, I slip through first and ready my weapon just in case something is waiting."
* **Elara's Public Action:** "I try to bypass the venting sequence on the wall terminal."
* **Elara's Secret Intent:** "If Kael gets the door open, I drop a tracking beacon in his bag as I run past him."

**Behind the Scenes (The Loop):**

1. **The Referee** checks the Cold State. It confirms Kael has the "Brute Strength" capability (door opens). It checks Elara's "Cyber-Slicing" capability (fails, the vent continues). It registers Elara's tracking beacon succeeds because Kael's secret intent was focused forward, not backward.
2. **The Mutator** sends commands to the Pacemaker: Add "Tracking Beacon" to Kael's inventory (hidden status). Deduct 1 "Tracking Beacon" from Elara's inventory.
3. **The Narrator** writes the scene.

**Broadcast to Players:**

> **The Narrator:** The terminal sparks violently, rejecting Elara's bypass attempt as the air thins. With a guttural shout, Kael forces the crowbar into the seam. Metal shrieks, and the inner door gives way. Kael surges through the gap instantly, raising his weapon into the dark corridor beyond. Elara dives through right behind him as the airlock finally seals shut behind them.

*(On Elara's screen only, a UI notification confirms: "Tracking beacon successfully planted.")*