# DAL-X Engineering Briefing
## Decision Authority Layer — Integration Overview

---

**POSITIONING STATEMENT**
*(Presenter reads before advancing to Slide 1)*

DAL-X is not connected to every AI agent. The enterprise registers autonomous agents whose actions create elevated regulatory exposure, financial consequence, operational risk, or board oversight requirement. Each registered agent is governed by trigger logic built around its authorized purpose, permitted actions, execution boundaries, and escalation requirements.

---

## SLIDE 1 — THE PROBLEM

**Headline:** Selected autonomous AI agents are executing consequential actions with no authority record.

**Body:**
Enterprises are deploying autonomous AI agents to initiate payments, execute transactions, modify records, and trigger downstream systems. A subset of those agents operate in areas that carry elevated regulatory, financial, operational, or board oversight exposure.

When something goes wrong — or when an auditor asks — there is one question that cannot be answered:

> *Who authorized this action, and what authority did they hold at the time?*

There is no decision record. No execution token. No proof that the action fell within the agent's registered mandate. No evidence that a human authority chain existed before execution occurred.

Regulators, risk committees, and boards are beginning to require this evidence. The answer today is silence.

---

## SLIDE 2 — WHAT DAL-X IS

**Headline:** DAL-X is an enforcement gate between what a registered autonomous agent proposes and what the downstream system executes.

**Body:**

DAL-X is not:
- An AI governance dashboard
- A universal agent wrapper
- A policy management platform
- An observability tool

DAL-X is:
- An interception layer for registered agents operating in areas of consequential exposure
- An authority checkpoint that determines whether the agent possesses delegated authority, requires human approval, or must be denied
- A token issuer that proves authority was granted within the registered mandate
- A gate that blocks execution if no valid token exists

Human review is not required for every action. Valid delegated authority may permit execution without human intervention. DAL-X evaluates the proposed action, then authorizes, routes for review, escalates, or denies based on the trigger logic established for that agent.

> No DAL-X authority. No execution.

---

## SLIDE 3 — BEFORE AND AFTER

**Headline:** One integration changes the authority model for the registered agent actions placed within DAL-X enforcement scope.

**Body:**

**Before DAL-X:**
```
Registered autonomous agent
  → proposes consequential action
  → executes directly
  → no record of mandate, authority, or approval
```

**After DAL-X:**
```
Registered autonomous agent
  → proposes consequential action
  → submits to DAL-X (intercept)
  → DAL-X evaluates against enterprise-specific trigger logic
  → DAL-X authorizes, routes for human review, escalates, or denies
  → authorized actions receive a constrained execution token
  → downstream system validates token before executing
  → execution proceeds only if token is valid
```

**What the enterprise now has:**
An immutable record of every governed agent action, the authority evaluation applied, who reviewed it where required, what was authorized within what scope, and proof that enforcement ran at the execution boundary.

---

## SLIDE 4 — INTEGRATION POINT 1: SUBMIT

**Headline:** One API call from the agent. This is the intercept.

**Body:**

Add this call wherever the registered agent generates an output that moves toward execution — before it executes.

```http
POST https://www.decisionauthoritylayer.ai/api/v1/submissions
Authorization: Bearer dalx_...

{
  "submitter": "treasury-agent-v1",
  "output_content": "Transfer $47,500 to account 8821-A",
  "execution_intent": {
    "action": "payment_transfer",
    "target": "core-banking-system",
    "amount_cents": 4750000,
    "currency": "USD"
  },
  "source_identifier": "txn-ref-20240823-001"
}
```

**What DAL-X does with this:**
Evaluates the proposed action against trigger logic built for this registered agent — its business mandate, permitted actions, risk thresholds, regulatory obligations, and required authority chain. DAL-X then authorizes the action, routes it for human review, escalates it, or denies it.

**Integration scope:**
Submission instrumentation may require approximately one engineering day after the agent scope, submission schema, and enterprise-specific trigger logic have been established.

The API call may take one day. The DAL-X integration does not.

---

## SLIDE 5 — WHAT HAPPENS INSIDE DAL-X

**Headline:** Authority evaluation, immutable decision, signed token.

**Body:**

Once a submission enters DAL-X:

**Step 1 — Authority evaluation**
Enterprise-specific trigger logic evaluates whether the proposed action falls within the agent's registered mandate and delegated authority. DAL-X authorizes the action, routes it for human review, escalates it, or denies it. Actions within delegated authority boundaries may be authorized without human intervention.

**Step 2 — Review queue (where required)**
Where trigger logic requires human authority, a reviewer sees the submission, the agent's output, the authority evaluation, and any drift evidence. They choose: approve, reject, escalate, or request revision. A reason is required. Reviewers cannot approve their own submissions. They cannot act without creating a decision record.

**Step 3 — Decision record**
The decision is written as an immutable record. It cannot be edited. It timestamps who decided, what was authorized within what scope, and what evidence was present at the time of the decision.

**Step 4 — Execution token**
On authorization, DAL-X issues a signed, single-use, time-bound execution token constrained to this specific action, scope, and target. The token is returned to the caller.

The enterprise owns the authority requirements and decision records. Jochanni Labs translates those requirements into agent-specific trigger logic. The enterprise validates and approves that logic before enforcement activates.

---

## SLIDE 6 — INTEGRATION POINT 2: ENFORCE

**Headline:** Token validation at the downstream execution boundary. This is the gate.

**Body:**

The downstream system — the payment processor, the API, the database write — must call the DAL-X enforcement gateway before executing.

```http
POST https://www.decisionauthoritylayer.ai/api/v1/enforcement/execute
Authorization: Bearer dalx_enforcement_...

{
  "agent_key":            "treasury-agent-v1",
  "execution_request_id": "sub_01J...",
  "execution_target":     "core-banking-system",
  "attempted_action":     "payment_transfer",
  "execution_token":      "dalx_exec_eyJ..."
}
```

**Response — authorized:**
```json
{
  "result":            "accepted",
  "execution_allowed": true,
  "reason":            "DAL-X authority validated. Downstream execution accepted.",
  "receipt_id":        "rcpt_01J..."
}
```

**Response — rejected:**
```json
{
  "result":            "rejected",
  "execution_allowed": false,
  "reason":            "Execution token Ed25519 signature verification failed.",
  "receipt_id":        "rcpt_01J..."
}
```

If `execution_allowed` is not `true` — execution must be blocked. No exceptions.

An execution receipt is written on every attempt — authorized or rejected. Proof of enforcement is recorded whether execution succeeded or failed.

---

## SLIDE 7 — SHADOW MODE: HOW THE PILOT STARTS

**Headline:** Start with zero execution risk. Observe agent behavior before enforcing authority.

**Body:**

Shadow mode lets you add the submission call without activating the enforcement gate.

**What shadow mode does:**
- The registered agent's proposed actions flow into DAL-X and are evaluated
- No execution is blocked
- DAL-X records what would have been authorized, routed for human review, escalated, or denied
- Calibration evidence accumulates against real agent behavior in the enterprise environment

**Why this matters for the pilot:**
- No disruption to live operations during calibration
- The review team observes the queue before it carries authority consequences
- Trigger logic is tuned against real submissions from this specific agent
- Drift detection baselines are established from actual behavior

**How shadow mode transitions to enforcement:**
After calibration, the enterprise creates an enforcement key used by the integration governing the approved action category and replaces the shadow key during a controlled deployment. Shadow and enforcement keys are separate. The transition is deliberate, scoped, and documented.

**Integration effort in shadow mode:** One API call from the registered agent. No downstream enforcement gate required at this stage.

---

## SLIDE 8 — INTEGRATION SCOPE (HONEST)

**Headline:** The API call is one day. The integration is not.

**Body:**

**Shadow mode instrumentation**
- Add `POST /v1/submissions` from the registered agent before execution
- Register the agent in the DAL-X workspace with its identifier and mandate
- Estimated instrumentation effort: approximately 1 engineering day

**Trigger logic development** *(separate work item)*
Enterprise and Jochanni Labs define:
- Which actions the registered agent is permitted to initiate
- Which action categories require human authority
- Which action categories fall within delegated authority boundaries
- Escalation conditions and thresholds
- Token scope constraints and execution target boundaries
- Regulatory or internal authority chain requirements

This cannot be hidden inside workspace configuration. Trigger logic is enterprise-specific and requires direct input from the risk, compliance, or operations function responsible for the agent's domain.

**Enforcement integration**
Enforcement requires token validation at the point where execution is triggered. If the agent-to-execution flow is currently synchronous, enforcement requires async redesign.

| Flow type | Enforcement path |
|-----------|-----------------|
| Synchronous (agent executes inline) | Agent submits and receives a pending decision state when human authority is required. The application preserves the proposed action, releases the synchronous request, and resumes through webhook notification or polling after authorization is granted. |
| Already async or event-driven | Integrates cleanly: submit, receive token on authorization, validate at execution boundary. |
| Batch or scheduled execution | Typically straightforward: submit batch, review window, execute on authority. |

Initial enforcement integration scoping begins during shadow mode and is finalized against the accumulated submission evidence before activation.

---

## SLIDE 8A — ENFORCEMENT BOUNDARY

**Headline:** What DAL-X enforces today. What requires your integration to close.

**Body:**

This slide is required. Enterprise pilots must understand the distinction before production activation.

---

**What DAL-X enforces on its own infrastructure today:**

The enforcement gateway (`POST /v1/enforcement/execute`) is in production and correctly enforces:

- Ed25519 token signature verification — unsigned or tampered tokens are rejected
- Token binding — token must match the specific agent, submission, target, and approved payload hash
- Downstream enforcement contract — no active contract for the target system blocks all execution
- Single-use consumption — replayed tokens are rejected and evidenced
- Payload hash binding — altered payloads are rejected even with a valid token

Every outcome — accepted or rejected — produces an immutable execution receipt, a downstream event record, drift events where applicable, and a governance timeline entry. This enforcement posture is proven against real database state.

---

**What requires your integration to close:**

**1. The downstream system must call the enforcement gateway before executing.**

DAL-X cannot intercept a call that goes directly to your downstream system. If your agent holds credentials to call your payment processor, ERP system, or database write path directly — and uses them — DAL-X has no visibility and no ability to block. Your downstream system must be modified to call `POST /v1/enforcement/execute` before every governed action executes, and must refuse to proceed if `execution_allowed` is not `true`.

This is not a DAL-X feature. It is an architectural requirement your engineering team must implement and own.

**2. Agents must not hold direct credentials for governed downstream systems.**

If an agent is issued both a DAL-X submission key and direct API credentials to the governed downstream system, it can reach the downstream system without passing through the enforcement gate. The credential architecture must ensure that the agent holds submission credentials only. Downstream credentials must be held by the execution layer — not by the agent.

**3. The enforcement call must cover every execution path.**

If the downstream system has multiple paths to execution — happy path, retry path, batch processor, admin override, internal service call — every path must call the enforcement gateway. Partial coverage leaves bypass vectors open. DAL-X cannot audit paths it does not see.

---

**What the acceptance test proves:**

The day-30 acceptance test demonstrates the complete governance loop through the DAL-X enforcement simulator: agent output, authority evaluation, decision record, token issuance, enforcement gateway validation, execution receipt, and governance timeline. This proves DAL-X's enforcement posture is correct.

It does not prove that your production downstream system calls the enforcement gateway. That is the production activation work that follows the pilot.

---

## SLIDE 9 — WHAT THE ENTERPRISE OWNS

**Headline:** Every execution governed by DAL-X is backed by a durable evidence trail.

**Body:**

DAL-X does not govern every AI-generated action in the enterprise. It governs the registered agents operating in areas of consequential exposure. For those agents, every governed execution produces:

**What the evidence package contains**
- Complete governance timeline proving authority existed before execution
- Decision records linking each action to the human who authorized it
- Drift detection log showing behavioral deviation identified before authority was granted
- Execution receipts confirming downstream enforcement
- Authority chain from submission through token to receipt — exportable for audit

**What this replaces**
Without DAL-X, this evidence must be assembled manually from agent logs, approval email threads, and execution records across separate systems — if it exists at all. For a single regulatory inquiry, that reconstruction costs multiples of the pilot fee. For a pattern of inquiries, it becomes a recurring operational liability.

This evidence answers the question regulators, auditors, and boards are asking: *who authorized this action, under what authority, and how do we know it was enforced before execution occurred?*

---

## SLIDE 10 — PILOT STRUCTURE

**Headline:** One selected agent. One consequential action category. Enterprise-specific trigger logic. Thirty days of shadow evidence.

**Body:**

**Agent selection criteria**
The pilot agent must meet at least one of the following:
- It can initiate or materially influence a consequential financial, legal, or operational action
- Its actions create elevated regulatory exposure
- Its actions affect money, legal commitments, protected data, customer rights, or critical records
- Its operation requires risk committee or board-level oversight
- Unauthorized execution would create material enterprise harm

**What the pilot delivers**
- Selection and registration of one autonomous agent
- Definition of one consequential action category
- Authority requirement discovery
- Enterprise-specific trigger logic development
- Shadow mode instrumentation support
- Calibration against production submissions
- Enforcement integration design
- Controlled acceptance testing
- Pilot evidence report
- Production activation recommendation

**Phase 1 — Instrumentation and trigger logic (week 1)**
One agent registered. Trigger logic defined. Submission call instrumented. Shadow key issued, review queue visible, enforcement off.

**Phase 2 — Shadow calibration (weeks 2–4)**
Real agent submissions flow into DAL-X. Trigger logic tuned against actual behavior. Review team observes the queue. Initial enforcement integration scoping begins and is finalized against the accumulated submission evidence before activation.

**Phase 3 — Acceptance test (day 30)**
A restricted acceptance test key activates enforcement for the selected agent and action category within a controlled test scope. The DAL-X governance loop runs end-to-end — agent output, authority evaluation, decision record, token issuance, downstream validation, execution receipt, and governance timeline. Upon successful completion, the enterprise receives the pilot evidence report and a production activation recommendation.

**Pilot fee: $15,000**

Payment structure:
- $7,500 at commencement
- $5,000 after shadow calibration complete
- $2,500 after acceptance testing complete

The enterprise pays for the pilot work and evidence. Production activation is a separate decision made after testing.
