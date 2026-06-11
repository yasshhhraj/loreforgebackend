# Loreforge v6.0 Turn Execution Lifecycle

The following describes the complete lifecycle and data flow of a single game round, from player submission through AI evaluation, database persistence, and synchronized client broadcast.

The execution model is designed to guarantee deterministic multiplayer resolution, strict rule enforcement, transactional consistency, and a single authoritative world state for all participants.

---

## 1. Simultaneous Submission

**Client → Routes → Controllers**

Players interact with the game through the Two-Box system, submitting both:

* **Public Action** — the visible action performed by the character.
* **Secret Intent** — hidden motivations, reactions, contingencies, or objectives that remain concealed from other players.

The Route Layer receives incoming requests and forwards them to the Controller Layer.

The Controller Layer collects all submissions and executes the system's **No-Timer Sync** protocol.

Rather than advancing on a fixed timer, the game waits indefinitely until 100% of active players have submitted their turns.

This guarantees simultaneous action resolution and prevents any player from gaining an advantage through submission timing.

---

## 2. Context Harvesting

**Controllers → Repositories → Database**

Once all player inputs have been secured, the Controller Layer initiates context retrieval through the Repository Layer.

The Repository Layer fetches the complete **3-Layer Memory Matrix** required for turn evaluation.

### Cold State

The authoritative structured game state.

Includes:

* Character statistics
* Health values
* Resources
* Inventories
* Equipment
* Capabilities
* Relationships
* Bond metrics
* Locations
* World entities
* Quest progress
* Faction standings

### Warm State

The compressed long-term narrative memory.

Includes:

* Major plot developments
* Character milestones
* Significant discoveries
* Political changes
* Campaign summaries
* Persistent world consequences

This layer functions as the campaign's World Bible.

### Hot Context

The immediate gameplay memory.

Includes:

* Recent turn transcripts
* Active conversations
* Current objectives
* Scene context
* Ongoing conflicts
* Immediate player interactions

This layer provides short-term situational awareness and conversational continuity.

Together, these three memory layers provide complete contextual awareness for the current round.

---

## 3. Service Evaluation

**Controllers → Services → LLM**

The Controller Layer combines:

* Player submissions
* Cold State
* Warm State
* Hot Context

into a unified evaluation payload and forwards it to the Service Layer.

The Service Layer operates as a completely stateless game engine and AI orchestration system.

Its responsibilities include:

* Prompt construction
* Context formatting
* Rule evaluation
* Capability evaluation
* LLM interaction
* Response parsing

Using the supplied context, the AI Game Master evaluates player actions against established rules, capabilities, relationships, and world conditions.

The Service Layer produces four outputs:

### State Mutations

Structured instructions describing intended world-state changes.

Examples include:

* Health modifications
* Inventory updates
* Bond changes
* Capability progression
* Location transitions
* Relationship updates

### Turn Logs

Structured records describing the outcome of the round.

### Memory Updates

Updates intended for the Warm State and other memory systems.

### Narrative Prose

The player-facing narrative describing the events of the round.

At this stage, all generated outputs remain proposals.

No database modifications occur within the Service Layer.

---

## 4. Repository Gatekeeping

**Services → Repositories → Database**

The Service Layer forwards the generated mutation package to the Repository Layer.

The Repository Layer acts as the system's exclusive gatekeeper and sole authority over persistence.

Before any state modification can occur, the Repository Layer performs strict validation against deterministic schemas and business rules.

Validation includes:

* Zod schema validation
* Type verification
* Referential integrity checks
* State-transition validation
* Business-rule enforcement
* Mutation authorization
* Data sanitization

Examples of rejected mutations include:

* References to non-existent entities
* Invalid field names
* Impossible inventory operations
* Illegal health values
* Unauthorized capability upgrades
* Contradictory world-state transitions
* Malformed structures
* Hallucinated schema fields

Only fully legal mutation packages are approved.

Once validation succeeds, the Repository Layer executes a single atomic Prisma transaction.

Within that transaction, the system updates:

* Cold State
* Character statistics
* Relationship data
* Inventory data
* World-state records
* Turn logs
* Memory records

All updates either succeed together or fail together.

Partial world updates are impossible.

This guarantees transactional consistency and prevents race conditions during concurrent gameplay.

---

## 5. Immediate Broadcast

**Database → Repositories → Controllers → Clients**

After the transaction successfully commits, the Repository Layer returns a success signal to the Controller Layer.

The Controller Layer pairs:

* Freshly committed numerical game data
* Updated character statistics
* Updated world-state information
* AI-generated narrative prose

into a final player-facing response package.

This package is immediately broadcast simultaneously to all connected players.

Every participant receives the same authoritative version of events at the same moment.

The round is then considered complete and the system returns to the submission phase for the next turn.

---

# Core Guarantees

This execution model guarantees:

* Simultaneous multiplayer resolution.
* Deterministic rule enforcement.
* AI isolation from persistent state.
* Repository-level validation of all generated mutations.
* Atomic database transactions.
* Race-condition-free gameplay.
* Long-term narrative continuity.
* A single authoritative source of truth for every participant.

The result is an AI-driven multiplayer RPG engine capable of delivering emergent storytelling, hidden intentions, persistent world simulation, and long-running narrative campaigns while maintaining the consistency and integrity expected from a traditional game system.
