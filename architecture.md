# DAL-X Architecture

DAL-X sits between AI-generated output and downstream execution. A governed action executes only when the downstream system has confirmed DAL-X authority first (see Enforcement Boundary below).

---

## The Authority Chain

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AI AGENT                                   │
│                  (treasury-agent-v1, etc.)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │  POST /api/v1/runtime/ingest-agent-output
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DAL-X WEDGE                                   │
│                                                                     │
│  1. Submission Ingest Gate                                          │
│     └── Agent registry check (runtime path)                        │
│     └── Payload contract validation                                 │
│     └── Idempotency check                                           │
│                                                                     │
│  2. Trigger Rule Evaluation                                         │
│     └── 12 governance categories                                    │
│     └── Risk classification: auto_approve / needs_review /          │
│         high_risk / blocked                                         │
│                                                                     │
│  3. Drift Detection                                                 │
│     └── Compare against agent behavioral baseline                   │
│     └── 14 drift categories                                         │
│     └── Drift escalates authority requirement                       │
│                                                                     │
│  4. Execution Block (default)                                       │
│     └── execution_status = EXECUTION_BLOCKED                        │
│     └── Submission enters Review Queue                              │
│                                                                     │
│  5. Human Review                                                    │
│     └── Reviewer sees: content, triggers, drift, timeline          │
│     └── 5-second review timer on high_risk (browser only)           │
│     └── Drift acknowledgement required before approve              │
│     └── Actions: approve / reject / escalate / request_revision    │
│                                                                     │
│  6. Decision Record (append-only by convention)                     │
│     └── Who decided, when, why                                      │
│     └── Drift acknowledgements recorded                             │
│     └── Timeline event written                                      │
│                                                                     │
│  7. Execution Token Issuance (on approval)                          │
│     └── Single-use, 15-minute TTL                                   │
│     └── Bound to: agent, submission, target, action, payload        │
│     └── Authorized execution snapshot written to DB                 │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │  Execution token delivered to agent
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          AI AGENT                                   │
│  Reads the authorization_id and hands off. Holds no gate key.       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │  Request + authorization_id + submission ID
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DOWNSTREAM SYSTEM                                │
│                  (payments-api, ERP, etc.)                          │
│                                                                     │
│  Before executing: POST /api/v1/enforcement/execute                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              DAL-X ENFORCEMENT GATEWAY                       │  │
│  │                                                              │  │
│  │  Validates:                                                  │  │
│  │  ✓ Authorization exists, is active and has not expired       │  │
│  │  ✓ Agent, submission, target and action match the approval   │  │
│  │  ✓ Payload hash and declared payment values match            │  │
│  │  ✓ Active contract for the target; nonce fresh if required   │  │
│  │  ✓ Authorization has not been consumed (single-use)          │  │
│  │  ✓ Freshness: rule version, reviewer membership, profile     │  │
│  │                                                              │  │
│  │  execution_allowed: true  → receipt issued, nothing executed │  │
│  │  execution_allowed: false → handler blocked                  │  │
│  │  Gateway unreachable      → handler blocked (fail closed)    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │  Execution receipt → DAL-X timeline
                             │  Item → awaiting_execution_confirmation
                             │
                             │  The system that acts verifies the receipt first:
                             │  POST /api/v1/receipts/{receiptId}/verify  (single use)
                             │
                             ▼
                    EXECUTION PROCEEDS
                  (or is permanently denied)
                             │
                             │  After execution completes:
                             │  POST /api/v1/enforcement/confirm-execution
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              DAL-X CONFIRMATION ENDPOINT                            │
│                                                                     │
│  ✓ success + snapshot match   → execution_completed                 │
│  ✓ success + snapshot diff    → execution_reversed + drift event    │
│  ✓ failure reported           → downstream_rejected                 │
│  ✗ none in 30 min, receipt verified → execution_unconfirmed (cron)  │
│  ✗ none in 30 min, not verified     → execution_expired (cron)      │
│  ↻ same confirmation resent         → 200, already_recorded         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Map

| Component | Role |
|-----------|------|
| **Submission Ingest Gate** | First enforcement boundary. Validates agent registration, payload contract, and idempotency before anything enters the system. |
| **Trigger Rule Engine** | Evaluates 12 governance categories against submission content. Assigns risk classification. Highest-severity rule wins. |
| **Drift Detector** | Compares each submission against the agent behavioral baseline. Produces drift events that escalate authority requirements. Drift is evaluated one submission at a time; a payment split into several below a threshold is not detected (planned, PILOT-12). |
| **Review Queue** | Holds all submissions requiring human action. Finalized items are removed automatically. Submissions classified `auto_approve` enter the queue as `needs_review`; blocked submissions enter it for lead reviewers and admins. |
| **Review Workbench** | Human reviewer interface. Enforces drift acknowledgement, segregation of duties, and mandatory reason. Shows a 5-second minimum review timer on `high_risk` items; the timer runs in the browser and is not enforced server-side. |
| **Decision Record Store** | Every reviewer action is written here. Append-only by convention: no database trigger prevents UPDATE or DELETE. The audit hash chain detects tampering, but its head is not anchored outside the database (planned, PILOT-07). |
| **Execution Token Service** | Issues single-use tokens after approval. Tokens are bound to agent, submission, target, action, and payload. 15-minute TTL. Tokens are bearer tokens: they are not bound to the downstream service that presents them (planned, PILOT-03 and PILOT-05). |
| **Enforcement Gateway** | Downstream enforcement boundary. Validates token, binding constraints, nonce, consumption state, and ES-2 freshness (rule version, reviewer membership, authority profile). Fail-closed. |
| **Freshness Gate** | Runs atomically inside the CAS token-consume transaction. Checks that the governing rule version, reviewer membership, and reviewer authority profile are still valid at execution time. Rolls back consume on any failure. |
| **Confirmation Endpoint** | `POST /api/v1/enforcement/confirm-execution`. Receives the downstream report after execution. Compares the 7-field observed snapshot against the authorized snapshot. A mismatch creates a `confirmation_snapshot_mismatch` drift event and records `execution_reversed`. A resend of the same confirmation is answered as already recorded; a different one is refused as a conflict. |
| **Receipt Verification** | `POST /api/v1/receipts/{receiptId}/verify`. Called by the system that performs the action, with its own key, before it acts. Single use. |
| **Confirmation Expiry Cron** | Runs every 10 minutes. Closes items in `awaiting_execution_confirmation` with no confirmation after 30 minutes: `execution_unconfirmed` if the receipt was verified, otherwise `execution_expired`. |
| **Authorization Expiry Cron** | Runs every minute. Records an authorization unused past its 15-minute window as `expired` and moves the submission from `released_for_execution` to `execution_denied`. |
| **Governance Timeline** | Append-only event log, by convention (see Decision Record Store). Every state change, rule match, drift event, reviewer action, and execution outcome is recorded here. |
| **Agent Registry** | Controls which agents DAL-X will accept output from. Unregistered and inactive agents are rejected at the ingest gate. Limits today: `agent_key` is asserted in the request body and is not bound to the API key, and `allowed_execution_targets` is stored but not enforced (planned, PILOT-02). No code path sets an agent to suspended, and the enforcement gate does not check agent status (planned, PILOT-04). |
| **Baseline Engine** | Computes behavioral baselines from historical agent events. Drift detection requires an active baseline. |

---

## Execution Status State Machine

The DB-stored `execution_status` values returned by the API (11 values):

```
                    ┌──────────────────┐
                    │  SUBMISSION      │
                    │  CREATED         │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  execution_      │◄── Default for all submissions
                    │  blocked         │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────────┐
              │              │                  │
     ┌────────▼──────────┐  ┌────▼──────────┐  ┌───────▼──────────┐
     │  escalated_pending │  │ revision_     │  │  pending_        │
     └────────────────────┘  │ required      │  │  authority       │
                             └───────────────┘  └───────┬──────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │  released_for_      │◄── Enforcement gate accepts
                                    │  execution          │    (token consumed; ES-2
                                    └──────────┬──────────┘    freshness gate passes)
                                               │
                                    ┌──────────▼──────────────────┐
                                    │  awaiting_execution_        │◄── ES-3: downstream
                                    │  confirmation               │    must confirm within
                                    └──────────┬──────────────────┘    30 minutes
                                               │
                    ┌──────────────────────────┼─────────────────────────────┐
                    │                          │                             │
         ┌──────────▼──────────┐  ┌───────────▼────────────┐  ┌────────────▼──────────┐
         │  executed           │  │  released_for_execution │  │  execution_reversed   │
         │  (success)          │  │  (downstream_rejected   │  │  (snapshot mismatch)  │
         └─────────────────────┘  │   machine state)        │  └───────────────────────┘
                                  └─────────────────────────┘

     ┌───────────────────────────────────────────────────────────────────────┐
     │  execution_denied  ◄── execution_expired machine state maps here too  │
     └───────────────────────────────────────────────────────────────────────┘

     ┌─────────────────────┐
     │  auto_blocked       │◄── Rule match at blocked severity; a lead reviewer or admin may approve or reject
     └─────────────────────┘

     ┌─────────────────────┐
     │  auto_released      │◄── Not produced: auto-release is suspended
     └─────────────────────┘
```

> The machine states `downstream_rejected` and `execution_expired` are internal — they do not appear as `execution_status` API values. `downstream_rejected` projects to `released_for_execution` (item stays live, downstream may retry). `execution_expired` projects to `execution_denied`.

### Execution Suspense Status

A separate `executionSuspenseStatus` field explains *why* a submission is in its current state. It is shown in the queue and workbench alongside the execution status.

| Suspense Status | Meaning |
|-----------------|---------|
| `awaiting_review` | In queue, no reviewer has acted yet |
| `awaiting_lead_authority` | Requires Lead Reviewer action |
| `awaiting_admin_authority` | Requires Admin action |
| `awaiting_drift_acknowledgement` | Agent drift must be acknowledged before approval |
| `awaiting_downstream_drift_acknowledgement` | Downstream drift must be acknowledged before approval |
| `awaiting_more_review` | Escalated, awaiting senior reviewer |
| `expired_waiting_period` | The authorization expired unused. A new submission and approval are required. |
| `denied_locked` | Permanently denied |
| `replay_blocked` | Token replay detected |
| `contract_validation_failed` | Downstream enforcement contract validation failed |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Backend | Next.js API routes (Node.js, Fluid Compute) |
| Database | Neon Postgres |
| Authentication | Clerk |
| Hosting | Vercel |

---

## Where DAL-X Sits in Your Stack

```
Your AI Agent
      │
      │  Submits output to DAL-X
      ▼
   DAL-X  ◄──── Human reviewer operates here
      │
      │  Issues execution token after approval
      ▼
Your Downstream System
      │
      │  Calls DAL-X enforcement gate before executing
      ▼
   Execution (authorized) or Block (denied)
```

DAL-X does not replace your AI agent. It does not replace your downstream system. It is the authority control boundary between them. The agent operates normally — DAL-X intercepts the execution path, not the generation path.

---

## Enforcement Boundary

The architecture diagram above shows the correct target state. This section describes what is enforced today and what requires the enterprise's integration to close.

### What DAL-X enforces today

The enforcement gateway (`POST /api/v1/enforcement/execute`) is in production. Every call to that endpoint is enforced: token signature, payload hash, downstream contract, replay state. Acceptance requires all checks to pass. Rejection is immediate and produces an append-only receipt. This is proven against real database state.

### What the diagram requires your integration to close

The box labeled **DOWNSTREAM SYSTEM** contains:

> Before executing: `POST /api/v1/enforcement/execute`

This is a requirement on the enterprise, not a capability DAL-X enables automatically. DAL-X cannot intercept traffic that does not arrive at its enforcement gateway. Three conditions must be true for the diagram to reflect production reality:

**1. The downstream system calls the enforcement gateway before executing.**
The downstream system (the payment API, the ERP write path, the database handler) must call `POST /api/v1/enforcement/execute` before acting. If the downstream system executes without this call, DAL-X has no visibility and cannot block. This modification must be made by the enterprise engineering team.

**2. Agents do not hold direct downstream credentials.**
If an agent holds credentials to call the downstream system directly, it can bypass the enforcement gate. The credential architecture must ensure agents hold DAL-X submission credentials only. Downstream system credentials must be held at the execution layer — not by the agent.

**3. All execution paths are covered.**
Every path through which the downstream system can execute the governed action — happy path, retry, batch, admin override — must call the enforcement gateway. Partial coverage creates unmonitored bypass paths.

### During the pilot

Shadow mode (weeks 1 to 3) does not require the downstream system to call the enforcement gateway. The acceptance test (day 30) runs through `POST /api/v1/enforcement/execute`, receipt verification, and execution confirmation. Production activation requires the downstream integration described above.

### The enforcement simulator

`POST /api/v1/downstream-simulator/execute` is a legacy DAL-X-hosted endpoint with its own inline gate. It does not run the contract, nonce, payload hash, or freshness checks of the enforcement gateway. It requires an enforcement key and returns 404 in production. It is available for local and preview testing only and is not a substitute for integrating with `POST /api/v1/enforcement/execute`.

### Verification modes

Online mode is built and live: the downstream system calls `POST /api/v1/enforcement/execute`, and DAL-X consumes the authorization and writes the receipt in one transaction. Offline mode, where the downstream system verifies the signed token locally, is not built. Its contract is planned in PILOT-03 and its implementation in PILOT-05.

### Controls not enforced today

These controls are implied by the data model but are not enforced in code as of 2026-10-21:

- Agent identity is self-asserted: `agent_key` is not bound to the API key (PILOT-02).
- Agent execution target limits are stored but not enforced (PILOT-02).
- No code path sets an agent to suspended, and the enforcement gate does not check agent status (PILOT-04).
- Audit tables are append-only by convention only, and the hash chain head has no external anchor (PILOT-07).
- Execution tokens are bearer tokens, not bound to the downstream service (PILOT-03, PILOT-05).
- Drift is evaluated per submission only. A payment split into several below a threshold is not detected (PILOT-12).

### simulation.dal-x.com

The simulation site computes gate outcomes in the browser and makes no DAL-X calls. It is an illustration, not a live gate. Labeling it as an illustration is planned in PILOT-00. Wiring screens 1 to 6 to a DAL-X sandbox is planned in PILOT-14.
