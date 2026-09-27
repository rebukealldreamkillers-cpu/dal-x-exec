# DAL-X Architecture

DAL-X sits between AI-generated output and downstream execution. Nothing executes without passing through it.

---

## The Authority Chain

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AI AGENT                                   │
│                  (treasury-agent-v1, etc.)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │  POST /v1/submissions
                             │  POST /v1/runtime/ingest-agent-output
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
│     └── Minimum dwell time enforced                                 │
│     └── Drift acknowledgement required before approve              │
│     └── Actions: approve / reject / escalate / request_revision    │
│                                                                     │
│  6. Decision Record (immutable)                                     │
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
│         Presents token to downstream system with request            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │  Request + dalx_token + dalx_submission_id
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DOWNSTREAM SYSTEM                                │
│                  (payments-api, ERP, etc.)                          │
│                                                                     │
│  Before executing: POST /v1/enforcement/execute                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              DAL-X ENFORCEMENT GATEWAY                       │  │
│  │                                                              │  │
│  │  Validates:                                                  │  │
│  │  ✓ Token exists and is active                                │  │
│  │  ✓ Token matches agent, submission, target, action           │  │
│  │  ✓ Payload hash matches (if payload binding enforced)        │  │
│  │  ✓ Nonce is fresh (if nonce enforcement required)            │  │
│  │  ✓ Token has not been consumed (single-use)                  │  │
│  │  ✓ Freshness: rule version, reviewer membership, profile     │  │
│  │                                                              │  │
│  │  execution_allowed: true  → handler runs                     │  │
│  │  execution_allowed: false → handler blocked, 403 returned    │  │
│  │  Gateway unreachable      → handler blocked (fail closed)    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │  Execution receipt → DAL-X timeline
                             │  Item → awaiting_execution_confirmation
                             │
                             ▼
                    EXECUTION PROCEEDS
                  (or is permanently denied)
                             │
                             │  After execution completes:
                             │  POST /v1/enforcement/confirm-execution
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              DAL-X CONFIRMATION ENDPOINT                            │
│                                                                     │
│  ✓ success + snapshot match   → execution_completed                 │
│  ✓ success + snapshot diff    → execution_reversed + drift event    │
│  ✓ failure reported           → downstream_rejected                 │
│  ✗ no callback within 30 min  → execution_expired (cron)            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Map

| Component | Role |
|-----------|------|
| **Submission Ingest Gate** | First enforcement boundary. Validates agent registration, payload contract, and idempotency before anything enters the system. |
| **Trigger Rule Engine** | Evaluates 12 governance categories against submission content. Assigns risk classification. Highest-severity rule wins. |
| **Drift Detector** | Compares submission against agent behavioral baseline. Produces drift events that escalate authority requirements and block auto-release. |
| **Review Queue** | Holds all submissions requiring human action. Auto-approved and finalized items are removed automatically. |
| **Review Workbench** | Human reviewer interface. Enforces dwell time, drift acknowledgement, segregation of duties, and mandatory reason. |
| **Decision Record Store** | Immutable. Every reviewer action is written here. Cannot be modified or deleted. |
| **Execution Token Service** | Issues single-use tokens after approval. Tokens are bound to agent, submission, target, action, and payload. 15-minute TTL. |
| **Enforcement Gateway** | Downstream enforcement boundary. Validates token, binding constraints, nonce, consumption state, and ES-2 freshness (rule version, reviewer membership, authority profile). Fail-closed. |
| **Freshness Gate** | Runs atomically inside the CAS token-consume transaction. Checks that the governing rule version, reviewer membership, and reviewer authority profile are still valid at execution time. Rolls back consume on any failure. |
| **Confirmation Endpoint** | `POST /api/v1/enforcement/confirm-execution`. Receives downstream callback after execution. Compares 7-field observed snapshot against the authorized snapshot. Mismatch creates `confirmation_snapshot_mismatch` drift event and transitions item to `execution_reversed`. |
| **Confirmation Expiry Cron** | Runs every 10 minutes. Transitions items in `awaiting_execution_confirmation` that have not received a callback within 30 minutes to `execution_expired`. |
| **Governance Timeline** | Append-only event log. Every state change, rule match, drift event, reviewer action, and execution outcome is recorded here. |
| **Agent Registry** | Controls which agents DAL-X will accept output from. Unregistered and inactive agents are rejected at the ingest gate. |
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
     │  auto_blocked       │◄── Rule match at blocked severity, no human review
     └─────────────────────┘

     ┌─────────────────────┐
     │  auto_released      │◄── Auto-release rule matched
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
| `expired_waiting_period` | Anti-fatigue timer has not yet elapsed |
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

The enforcement gateway (`POST /v1/enforcement/execute`) is in production. Every call to that endpoint is enforced — token signature, payload hash, downstream contract, replay state. Acceptance requires all checks to pass. Rejection is immediate and produces an immutable receipt. This is proven against real database state.

### What the diagram requires your integration to close

The box labeled **DOWNSTREAM SYSTEM** contains:

> Before executing: `POST /v1/enforcement/execute`

This is a requirement on the enterprise, not a capability DAL-X enables automatically. DAL-X cannot intercept traffic that does not arrive at its enforcement gateway. Three conditions must be true for the diagram to reflect production reality:

**1. The downstream system calls the enforcement gateway before executing.**
The downstream system — the payment API, the ERP write path, the database handler — must call `POST /v1/enforcement/execute` before acting. If the downstream system executes without this call, DAL-X has no visibility and cannot block. This modification must be made by the enterprise engineering team.

**2. Agents do not hold direct downstream credentials.**
If an agent holds credentials to call the downstream system directly, it can bypass the enforcement gate. The credential architecture must ensure agents hold DAL-X submission credentials only. Downstream system credentials must be held at the execution layer — not by the agent.

**3. All execution paths are covered.**
Every path through which the downstream system can execute the governed action — happy path, retry, batch, admin override — must call the enforcement gateway. Partial coverage creates unmonitored bypass paths.

### During the pilot

Shadow mode (weeks 1–3) does not require the downstream system to call the enforcement gateway. The acceptance test (day 30) runs through the DAL-X enforcement simulator to prove the governance loop is correct. Production activation requires the downstream integration described above.

### The enforcement simulator

`POST /api/v1/downstream-simulator/execute` is a DAL-X-hosted endpoint that simulates a downstream system with enforcement correctly implemented. It is used for acceptance testing and demonstration. It is not a substitute for modifying your actual downstream system.
