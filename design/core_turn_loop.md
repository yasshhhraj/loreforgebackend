Here is the exact lifecycle and data flow of a single turn in the system, moving from the client to the database and back.

### 1. Simultaneous Submission (Client -> Server)

* Players submit both their **Public Action** (what others see) and **Secret Intent** (hidden motives or reactions) to the Controller Layer.
* The system utilizes a "No-Timer Sync," meaning the server collects these inputs and waits indefinitely until 100% of active players have submitted their moves before advancing.

### 2. Context Harvesting (Server -> Database)

* Once all player inputs are secured, the Controller Layer fetches the 3-Layer Memory Matrix via the Repository Layer.
* This data pull includes the **Cold State** (hard numerical stats), the **Warm State** (compressed world bible), and the **Hot Context** (recent raw prose) to establish complete situational awareness for the current round.

### 3. Service Evaluation (Server -> Agent)

* The Controller Layer bundles the freshly pulled database context with the players' new inputs and passes the payload to the Service Layer.
* Acting as a completely stateless logic engine, the AI evaluates the actions against the hardcoded rules and capabilities.
* The AI generates a strict, three-part JSON payload containing explicit structural commands (field mutations, turn logs, and world bible updates) alongside the creative narrative prose.

### 4. Repository Gatekeeping (Agent -> Database)

* The Service Layer passes the structured JSON payload down to the Repository Layer.
* This layer acts as the exclusive gatekeeper, running the AI's structural commands through strict Zod validation to ensure they are mathematically and logically legal.
* If the validation passes, the Repository Layer executes a single, atomic Prisma transaction to safely overwrite the database, ensuring no race conditions occur.

### 5. Immediate Broadcast (Database -> Server -> Client)

* Once the database successfully commits the transaction, the Repository Layer fires a "Tick" or success signal back to the Controller Layer.
* The Controller Layer pairs the freshly updated numerical stats with the AI's waiting narrative prose.
* This final, UI-ready package is immediately broadcasted simultaneously to all players' screens to conclude the round.