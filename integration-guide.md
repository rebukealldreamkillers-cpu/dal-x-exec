> Copy of dal-x-wedge `docs/integration-guide.md`. Edit it there, not here.

# DAL-X Technical Integration Guide
## Decision Authority Layer - Engineer Implementation Reference

**Audience:** Engineers at the integrating enterprise responsible for instrumentation, enforcement integration, and acceptance testing.

**Purpose:** Step-by-step instructions for integrating an autonomous agent into DAL-X so that every consequential action the agent initiates is evaluated for authority before execution proceeds.

---

## Current Enforcement Behavior

This section is a short reference to the rules that most often affect an integration. The sections below describe each one in full.

**Human authority is required for every execution.**

- Auto-release is suspended. No submission is released without a human decision, and no execution token is returned at submission time.
- A submission the rule engine classifies `auto_approve` returns status `needs_review` and enters the Review Queue.
- A submission the rule engine classifies `blocked` does not execute. It waits in the Review Queue, where a lead reviewer or admin may approve it or reject it.
- An API key cannot approve a submission. `POST /api/v1/runtime/submissions/:id/authority-decision` returns `403 human_authority_required` for `approve`. It still records `deny` and `request_more_review`. Approval is recorded only by a reviewer in the DAL-X Review Workbench.

**A submission must carry a complete execution intent to pass the enforcement gate.**

- `POST /api/v1/enforcement/execute` rejects any submission whose stored `execution_intent` is missing one of seven fields: `action`, `target`, `amount`, `currency`, `recipient`, `recipientAccountRef`, `paymentType`.
- `amount` must be a positive integer in minor currency units (cents).
- Send all seven fields in `execution_intent` when you submit. They cannot be added later.

**`POST /api/v1/enforcement/execute` checks what the caller declares.**

- `agent_key` must equal the `submitter` of the submission or, for a submission made through runtime ingestion, the registered `agent_key` it was ingested under.
- `attempted_action` must equal the approved action. The comparison is case-sensitive.
- `execution_target` must equal the approved target and must have an active enforcement contract.
- Any of the seven intent fields present in `request_payload` must equal the approved value. Values are compared exactly, so the number `500000` does not match the string `"500000"`.
- A mismatch returns `execution_allowed: false` with a reason naming what differed, and records a drift event.

**`POST /api/v1/receipts/:id/verify` only succeeds while the execution request is awaiting confirmation.**

- After the request expires, is denied, or completes, the call returns `409 execution_request_not_awaiting`. The receipt is not consumed.
- Required response: do not execute. Submit the action again to obtain a new decision.

**`POST /api/v1/enforcement/confirm-execution` closes the loop and requires evidence.**

- After executing, report the outcome. Without a confirmation the request expires 30 minutes after the gate accepted it.
- When `outcome` is `success`, `observed_execution` is required. Send the `action`, `target`, `amount`, `currency`, `recipient`, `recipientAccountRef`, and `paymentType` that were actually applied.
- A success report without `observed_execution` returns `400 observed_execution_required`. Nothing is recorded. Resend the report with `observed_execution`.
- When the enforcement contract for the target names a reporter API key, only that key may confirm. Any other key receives `403 reporter_not_authorized`.

**API key scopes.**

- A key with only `submit` scope cannot consume or validate execution authority on any route.
- `POST /api/v1/downstream-simulator/execute` is not available in production. Present execution authority to `POST /api/v1/enforcement/execute`.

**Decision webhooks are a notice, not a guarantee.**

- Webhook deliveries are sent by a scheduled job that runs every minute. The first retry of a failed delivery comes after 1 minute, then 5, 15, 60 and 240 minutes. A v2 token expires 300 seconds after approval.
- A webhook grants no execution authority. Polling `GET /api/v1/submissions/:id` is the alternative way to learn of an approval. The downstream system obtains the token itself with `GET /api/v1/enforcement/execution-requests/:id/token` and its enforcement key.

**Controls that are not enforced today.**

- Agent binding on API keys is optional. A bound key may submit only as its bound agents (`403 agent_key_not_bound_to_key`). An unbound key can still submit as any active registered agent; each such submission is marked `identity_asserted = true`. Binding is not cryptographic identity. Mandatory binding is planned after PILOT-19.
- An agent's allowed execution targets apply only to submissions linked to a registered agent. Submissions with no linked agent have no allowed list.
- The `authorization_id` and the signed token are bearer credentials. No token is bound to the downstream service's key. Signed online calls are opt-in per enforcement contract (PILOT-05). Offline mode depends on the bank running a jti store shared by every instance; without one an approval can execute twice and DAL-X sees it only at confirmation.
- Evidence tables, including decision records, are insert-only for the application database role (PILOT-07a): it cannot update or delete them. The database owner still can; hash chains and signed chain anchors make that detectable (docs/audit-integrity.md).

---

## 1. Introduction

DAL-X (Decision Authority Layer) is an execution authority enforcement system. It intercepts proposed actions from registered autonomous agents, evaluates them against enterprise-specific trigger logic, and either authorizes execution, routes the action for human review, escalates, or denies.

**The core guarantee:** No downstream execution occurs unless a valid DAL-X authorization exists for that specific action, scope, and target.

DAL-X is not deployed inside the enterprise network. It is a hosted authority service. Integration means adding two API call sites to the enterprise application stack:

1. **Before the agent acts:** Submit the proposed action to DAL-X for evaluation.
2. **At the downstream execution boundary:** Validate the DAL-X authorization before the action is permitted to proceed.

Between those two points, DAL-X handles authority evaluation, human review routing (where required), decision recording, and authorization issuance.

---

## 2. Integration Overview

```
Enterprise Autonomous Agent
  │
  │  POST /api/v1/submissions              ← Integration Point 1: Intercept
  │  (execution_intent with all seven payment fields)
  ▼
DAL-X Authority Evaluation
  │
  ├─ needs_review / high_risk ──── enters the Review Queue
  ├─ blocked ───────────────────── does not execute; waits for a lead reviewer or admin
  │
  ▼  A reviewer approves in the DAL-X web application
Poll GET /api/v1/submissions/:id → execution_authorization.authorization_id (UUID)

Calling service holds the authorization_id (valid 5 minutes, single use)
  │
  │  POST /api/v1/enforcement/execute      ← Integration Point 2: Enforce
  ▼
  ├─ accepted → receipt_id returned; request moves to awaiting_execution_confirmation
  └─ rejected → downstream execution is blocked

Downstream system, before it acts
  │
  │  POST /api/v1/receipts/:receiptId/verify   ← Integration Point 3: Verify
  ▼
  ├─ verified: true  → execute
  └─ anything else   → do not execute

After executing
  │
  │  POST /api/v1/enforcement/confirm-execution ← Integration Point 4: Confirm
  ▼
  execution_completed, downstream_rejected, or execution_reversed
```

Every submission that reaches execution passes through a human decision. There is no automatic release.

> **Recommended intake path:** `POST /api/v1/runtime/ingest-agent-output` is the recommended integration path for agents. `POST /api/v1/submissions`, used in the examples in this guide, remains supported. Both create the same review item, use the same rule engine, Review Queue, polling route, and enforcement gate. Two differences matter: runtime ingestion requires an active registered agent and carries the payment fields in a different shape (see [`api-reference.md`](api-reference.md#post-apiv1runtimeingest-agent-output)), and it does not honor shadow-mode keys, so shadow calibration uses `POST /api/v1/submissions`.

**Two modes:**

- **Shadow mode:** The submission call is made with a shadow-mode API key. DAL-X evaluates the submission and returns what it would have decided. No review item is created, nothing is queued, and nothing is blocked. If DAL-X is unavailable in shadow mode, log the error and allow existing execution to continue.
- **Enforcement mode:** The submission creates a review item and execution is blocked until a reviewer approves and the enforcement gate accepts the authorization. If DAL-X is unavailable in enforcement mode, block the governed action (fail closed).

Start in shadow mode. Do not activate enforcement until calibration is complete and the acceptance test passes.

---

## 3. Trigger Logic - What It Is, What You Provide, What Gets Built

DAL-X is not a generic AI governance platform with a default ruleset. Every rule in the system is enterprise-specific. Jochanni Labs builds trigger logic around the specific agent being registered, the specific actions it initiates, and the specific risk exposure those actions create in your environment. You cannot activate enforcement without it, and it cannot be built without your input.

### 3.1 What Trigger Logic Does

When a submission arrives at `POST /api/v1/submissions`, DAL-X runs every active trigger rule for your workspace against it. The engine evaluates the rules in parallel, collects all matches, and assigns the highest-severity match as the controlling outcome. That outcome determines what happens next:

| Severity outcome | What happens |
|-----------------|-------------|
| `auto_approve` | Submission enters the Review Queue as `needs_review`. Auto-release is suspended, so no authorization is issued without a human decision. The `auto_approve` classification is kept on the record. |
| `needs_review` | Submission enters the Review Queue |
| `high_risk` | Submission enters the Review Queue |
| `blocked` | Submission does not execute. It waits in the Review Queue for a lead reviewer or admin, who may approve it or reject it. |

If no rule matches, DAL-X applies the **conservative default: `needs_review`**. The engine never silently approves an unmatched submission.

### 3.2 The 12 Rule Categories

Every rule is tagged with one category. Categories define what kind of risk is being detected. The category is separate from severity - a rule can be `financial_impact` category with `needs_review` severity (standard review below a threshold) or `blocked` severity (lead reviewer decision above a threshold).

| Category | What it detects | Typical financial services use |
|----------|----------------|-------------------------------|
| `financial_impact` | Proposed or described monetary actions | Payment initiation, credit issuance, wire transfers, refunds |
| `legal_regulatory` | Regulated subject matter claims | FINRA/SEC/Reg E references, tax characterization, AML-relevant language |
| `execution_instruction` | Content that would directly trigger a system action if passed downstream | SQL DDL, shell commands, API execution payloads |
| `sensitive_data` | PII, credentials, card numbers, secrets | SSNs, card numbers, API keys, account numbers |
| `security_access` | Access or privilege changes | Role grants, key rotation, MFA disablement |
| `customer_facing` | Output destined for an external customer | Paired with metadata field `destination = "customer"` |
| `policy_conflict` | Content that contradicts stated organizational policy | Refund window violations, SLA over-commitments |
| `missing_source` | Citable claims without a source | Statistics without citations, regulatory references without authority |
| `unsupported_assertion` | Absolute claims rarely supportable in the domain | "guaranteed," "always," "risk-free," "compliant" |
| `operational_dependency` | Commitments to other teams without confirmation | "Engineering will deploy," "support has been notified" |
| `ambiguous_ownership` | Unowned action items | "Someone will," "you'll hear from us" |
| `policy_required` | Custom rules that don't fit the above | Enterprise-specific policy enforcement, internal approval thresholds |

### 3.3 The 8 Condition Types

Rules evaluate against submission fields using one of eight condition types. Understanding these determines how you structure your submission payload - particularly the `metadata` field.

**`keyword` - case-insensitive substring match**
```json
{
  "type": "keyword",
  "target": "output_content",
  "value": "wire transfer"
}
```
`value` is a single string. `target` is `output_content` or `input_context`. To match several terms, create one rule per term or use a `regex` condition.

**`regex` - pattern match**
```json
{
  "type": "regex",
  "target": "output_content",
  "pattern": "\\$[0-9,]+(?:\\.[0-9]{2})?"
}
```
`target` is `output_content` or `input_context`. The pattern must be a valid regular expression of at most 2,048 characters. Each pattern runs under a 100ms limit. A pattern that times out or fails to evaluate on a submission counts as matched at the rule's severity, never below `needs_review`; the other rules still run.

**`metadata_equality` - exact match on a metadata field**
```json
{
  "type": "metadata_equality",
  "target": "metadata",
  "key": "approval_tier",
  "value": "standard"
}
```
This is how you scope rules to specific agents, action types, or routing conditions. The value you put in `metadata` when submitting determines which rules fire.

**`metadata_keyword` - substring match on a metadata field**
```json
{
  "type": "metadata_keyword",
  "target": "metadata",
  "field": "authority_risk",
  "value": "lead reviewer"
}
```

**`currency_threshold` - monetary amount detection with threshold**
```json
{
  "type": "currency_threshold",
  "target": "output_content",
  "threshold": 50000,
  "currency": "USD"
}
```
Detects monetary amounts written in `output_content`. The amount must appear as readable text in `output_content` - this condition type evaluates `output_content` only. It does not evaluate `metadata` fields. `currency` is optional. For amount-based routing without text parsing, use `metadata_equality` with pre-categorized approval tiers in a metadata field.

**`payload_size` - byte threshold**
```json
{
  "type": "payload_size",
  "target": "output_content",
  "threshold": 10240
}
```
`target` is `output_content`, `input_context`, or `payload_size`. Useful for flagging anomalously large outputs as a coarse anomaly signal.

**`source_authority` - declared sources must be on an approved list**
```json
{
  "type": "source_authority",
  "declared_sources_field": "declared_sources",
  "approved_sources": ["treasury-ledger", "erp-ap"],
  "require_declaration": true
}
```
Reads a list of declared sources from the named `metadata` field and compares it to the approved list.

**`evidence_present` - required evidence references and their validation status**
```json
{
  "type": "evidence_present",
  "evidence_field": "evidence_refs",
  "required_validations": [
    { "ref_pattern": "invoice:", "allowed_statuses": ["verified"] }
  ]
}
```
Reads evidence references from the named `metadata` field and checks that each required reference is present with an allowed status.

### 3.4 What You Must Provide to Enable Trigger Logic Development

Jochanni Labs cannot build effective rules without inputs from the enterprise. The following must be defined before trigger logic development begins - not during it.

**Agent mandate document (required)**
- What is this agent authorized to do? What actions fall within its delegated authority?
- What actions require human approval before execution?
- What actions must be denied outright regardless of context?
- What thresholds separate auto-approved actions from review-required actions? (e.g., payments under $10,000 auto-approved; $10,000-$100,000 needs_review; over $100,000 high_risk)

**Submission field mapping (required)**
- Which `metadata` fields will your agent populate?
- What values will those fields contain? (Jochanni Labs uses these to write `metadata_equality` rules)
- Will `output_content` contain dollar amounts as readable text? In what format?
- Does `execution_intent.action` need multiple category values, or is it a single action type?

Without the field mapping, rules cannot target the right data. A `currency_threshold` rule requires the dollar amount to appear in `output_content` as text. A `metadata_equality` rule requires a corresponding metadata field to be populated at submission time.

**Risk policy document (required for `financial_impact` and `legal_regulatory` categories)**
- What internal approval thresholds apply to payments initiated by this agent?
- Which regulatory frameworks govern this agent's domain (Reg E, FINRA, AML, SOX)?
- Who is authorized to approve at each threshold - standard reviewer or lead reviewer?
- What is the minimum reason length required from the reviewer when approving?

**Counterparty or target allowlist (if applicable)**
- Is this agent restricted to initiating payments to approved counterparties only?
- Does a payment to a non-allowlisted target require escalation?

**Existing policy documents (if available)**
- Internal approval matrix for the agent's action domain
- Regulatory filing or compliance posture relevant to the agent
- Prior incident reports that identify specific risk patterns to detect

### 3.5 Starting Rules

A new workspace is not provisioned with rules automatically. Rules are created by a workspace admin or owner in the DAL-X web application under Settings → Rules, or loaded by Jochanni Labs during onboarding.

Until rules exist, every submission receives the conservative default, `needs_review`.

No rule should be treated as safe for enforcement activation without first mapping it to the registered agent's mandate and validating it against shadow submissions from that specific agent.

Financial services agents almost always need rules for:

| Rule area | What to define |
|-----------|----------------|
| Currency amount thresholds | Thresholds that match your internal approval matrix, with a tier per severity |
| Regulatory references | Your specific applicable regulations (Reg E, FINRA 4511, AML) |
| Execution instructions | Patterns tuned to your agent's output format |
| Sensitive data (SSN, card number, API key, bearer token) | Strong candidates for `blocked` severity. Validate against shadow submissions first to confirm they do not produce false positives. |

### 3.6 How Submission Metadata Enables Rule Precision

The `metadata` field in the submission is the primary mechanism for routing precision. If your agent submits only `output_content` as a natural-language string, rules are limited to keyword and regex matching against that string. If your agent populates structured `metadata` fields, rules can match against exact values.

Recommended metadata fields for a treasury payment agent:

```json
{
  "metadata": {
    "amount": 47500.00,               // dollars - makes approve and reject lead-only at review
    "currency": "USD",
    "counterparty_id": "CP-8821-A",   // enables allowlist matching
    "counterparty_name": "Acme Corp",
    "payment_type": "wire_transfer",   // enables metadata_equality routing
    "approval_tier": "standard",       // enables tier-based rule scoping
    "source_system": "treasury-ops",   // enables per-system rule scoping
    "destination": "external"          // enables customer_facing rules
  }
}
```

> **Important:** `currency_threshold` rules evaluate `output_content` only - they detect monetary amounts as text (e.g., "$47,500 USD"). They do not evaluate `metadata.amount`. `metadata_equality` compares string values, so it is not suited to numeric ranges. To use `currency_threshold` for amount-based approval thresholds, the amount must appear in `output_content` as readable text. For structured amount-based routing without text parsing, define `metadata.approval_tier` with values like `"standard"` / `"elevated"` / `"restricted"` and write `metadata_equality` rules against those tiers.

These fields become available to `metadata_equality` and `metadata_keyword` rule conditions. Define these fields with Jochanni Labs before any rules are authored - changing field names after rules are deployed against them requires rule version updates.

### 3.7 Severity Outcomes and What They Mean for Your Flow

Severity is set on the rule that fires. When multiple rules match a submission, the **highest severity wins**.

| Severity | Queue behavior | Authorization issued? | When to use |
|----------|----------------|---------------|-------------|
| `auto_approve` | Queue entry as `needs_review`. Auto-release is suspended. | Only after human approval | Actions within established delegated authority limits. The classification is kept on the record for the reviewer. |
| `needs_review` | Queue entry | Only after human approval | Standard review threshold. The default if no rule matches. |
| `high_risk` | Queue entry | Only after human approval | High-consequence actions |
| `blocked` | Queue entry, visible to lead reviewers and admins only | Only if a lead reviewer or admin approves | Actions the rules stop. A lead reviewer or admin may approve (override the block) or reject (confirm the block). |

Who may approve depends on the reviewer's authority profile and on the item. Approve and reject are limited to a lead reviewer or admin when the controlling rule requires lead review, when the item has open drift signals, when the submission's `metadata` carries an `amount`, when it is marked as a production deployment or a regulated domain, or when it is `blocked` or escalated. A reviewer's profile can also limit the workflows, execution targets, and amounts they may approve.

A `blocked` submission writes a decision record at intake with `reviewer_kind: 'auto'` and action `blocked`. If a lead reviewer later decides it, that decision is a second record. The first is never changed.

### 3.8 Testing Rules During Shadow Mode

Shadow mode is the calibration window for trigger logic. A submission made with a shadow-mode key:

- Runs the live rule engine against the submission
- Creates no review item, no decision record, and no authorization
- Does not appear in the Review Queue
- Is stored as a shadow evaluation, visible in the DAL-X web application on the Shadow Evaluations page
- Returns the evaluation in the response (see Step 4)

Use this period to:
1. Confirm that high-value payments are routing to the correct severity tier
2. Confirm that `blocked` rules are not triggering on legitimate agent outputs (false positives cause operational friction once enforcement is live)
3. Identify metadata fields that are missing from submissions and causing rules to miss

The dry-run tool (`POST /api/app/dry-run`, admin and owner roles only, body `{ "submissionId": "..." }`) takes an existing enforced submission by ID and re-evaluates it against the current active rule set. It returns what fired at original submission time, what would fire now, and the difference. It writes no records. It requires an existing submission in the system and does not accept arbitrary text input.

**Do not activate enforcement until trigger logic is correct.** Every submission routed to review is a reviewer queue item and a latency event in the execution path, and every submission that should have been stopped and was not is an authority failure.

---

## 4. Technical Requirements

### 4.1 API Access

| Item | Value |
|------|-------|
| Base URL | `https://www.decisionauthoritylayer.ai` |
| Protocol | HTTPS only |
| Auth scheme | `Authorization: Bearer dalx_<key>` |
| Content-Type | `application/json` |
| Key prefix | All keys begin `dalx_` |

A complete integration uses separate API keys for separate jobs:

| Key | Scopes | Used for |
|-----|--------|----------|
| Submission key, shadow | `{ "submit": true }`, `shadow_mode: true` | Submission during calibration |
| Submission key, enforced | `{ "submit": true }`, `shadow_mode: false` | `POST /api/v1/submissions` and `GET /api/v1/submissions/:id` in production |
| Enforcement key | `{ "enforcement": true }` | `POST /api/v1/enforcement/execute`, `POST /api/v1/enforcement/refresh-token`, `POST /api/v1/receipts/:id/verify`, `POST /api/v1/enforcement/confirm-execution` |

> **Scope note:** Create enforcement keys in the web application under Settings → API Keys by selecting "Enforcement key". That produces a key with `enforcement` scope, which is the only scope the enforcement routes accept. A key cannot hold `enforcement` together with `submit` or `sandbox`. Key creation refuses the combination, so the service that submits an action is never the one that presents it at the gate.

An enforcement key created this way has no `submit` scope, so it cannot submit or read submission status. A submission key cannot call the enforcement gate. Keep the two separate: the agent holds the submission key, and the service at the execution boundary holds the enforcement key.

Keys are workspace-scoped. One workspace per enterprise pilot. Bind each submission key to its agents in Settings → API Keys. A bound key may submit only as those agents (`403 agent_key_not_bound_to_key`). An unbound key can submit for any active registered agent in the workspace, and its submissions are marked `identity_asserted = true` (see [`api-keys.md`](api-keys.md)).

### 4.2 Payload Limits

| Field | Limit |
|-------|-------|
| `output_content` | 256 KB |
| `input_context` | 64 KB |
| `metadata` (serialized) | 8 KB |
| Overall request body | 400 KB |
| Requests exceeding these limits | `413 payload_too_large` |

### 4.3 Rate Limits

| Limit | Value |
|-------|-------|
| `POST /api/v1/submissions` refill rate | 100 requests / minute per API key |
| `POST /api/v1/submissions` burst allowance | 200 requests |
| `POST /api/v1/runtime/ingest-agent-output` | 10 submissions / minute per agent key (sandbox keys exempt) |
| Exceeded limit response | `429`. The submissions route includes `X-RateLimit-*` and `Retry-After` headers. |

The enforcement, receipt, and confirmation routes are not rate limited.

### 4.4 Authorization Identifiers

When a reviewer approves a submission, DAL-X creates an execution authorization record. Two identifiers are associated with it.

| Identifier | Format | Retrieved from | Used for |
|------------|--------|----------------|----------|
| `authorization_id` | UUID (e.g., `3e7f8d9a-...`) | `GET /api/v1/submissions/:id` → `execution_authorization.authorization_id` | **Standard integration path.** The `authorization_id` parameter in `enforcement/execute` calls. |
| `execution_token` | Signed string: base64url-encoded claims, a `.`, and an Ed25519 signature | Shown once to the reviewer in the DAL-X web application at approval. Also returned by `POST /api/v1/enforcement/refresh-token`. | Optional. Can be passed as `execution_token` to `enforcement/execute` when your service holds it. |

Your integration retrieves the `authorization_id` by calling `GET /api/v1/submissions/:id` with the submission key and reading `execution_authorization.authorization_id`. The `execution_authorization` object is present only while the submission's `execution_status` is `released_for_execution`.

Pass `authorization_id` in `enforcement/execute` calls unless your service holds the signed token. When both are sent, the gate uses `execution_token`.

### 4.5 Authorization Constraints

| Property | Value |
|----------|-------|
| Authorization TTL | 300 seconds for v2 tokens, issued for every approval in production since 2026-10-21; 15 minutes for v1 tokens issued earlier |
| Single-use | Yes - consumed by the first accepted `enforcement/execute` call |
| Binding | Bound to the submitting agent as declared at intake, the approved action, the approved target, the agent output content, and the execution intent (amount, currency, recipient, recipient account reference, invoice reference, payment type) |
| Bearer | The `authorization_id` and the signed token are not bound to the service that presents them. Any enforcement key in the workspace can present them. On a contract that sets a `downstream_public_key`, online calls must also carry a valid request signature. |
| Mismatch | `enforcement/execute` returns `result: "rejected"`, `execution_allowed: false`, with a `reason` naming what differed |
| Expired authorization | `result: "rejected"` with reason `Execution token expired at ...`. A new approval is required, or refresh the authorization before it expires (Step 9). |
| Rule changed after approval | Rejected. If the trigger rule that controlled the submission has a newer version, the authorization is no longer honored and a new submission is required. |
| Approver no longer authorized | Rejected. If the approving reviewer has left the workspace, or their authority profile is suspended or expired, the authorization is no longer honored. |

### 4.6 Network Requirements

- Outbound HTTPS (port 443) from the agent host or service making the submission call to `www.decisionauthoritylayer.ai`
- Outbound HTTPS from the downstream execution boundary service to `www.decisionauthoritylayer.ai` (for token validation)
- If using webhooks for authority decision notifications: inbound HTTPS to a webhook receiver endpoint in the enterprise network
- No inbound connections required from DAL-X to enterprise systems

### 4.7 Security Considerations

- API keys are hashed server-side. The cleartext key is returned once at creation and never stored or retrievable again. Store it in a secrets manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) immediately upon creation.
- Keys have explicit scopes. A submission key cannot call the enforcement gate. An enforcement key without `submit` scope cannot submit or read submission status.
- Execution tokens are Ed25519-signed, and each authorization is linked to the decision record that authorized it. Decision records are hash-chained. The private signing key is not shared with the enterprise. The public key is served at `GET /api/v1/audit/public-key`. v2 tokens are signed with a separate execution key, published at `GET /api/v1/enforcement/keys`.
- Execution tokens and `authorization_id` values are bearer credentials. Treat them as secrets in logs and queues.
- Authority is verified online by the enforcement gate, or offline by the downstream system (PILOT-05, production since 2026-10-21). Offline, the downstream verifies a v2 token against `GET /api/v1/enforcement/keys`, refuses a replayed `jti` through its own jti store, honors the signed list at `GET /api/v1/enforcement/revocations`, and confirms by `jti` afterwards. Offline mode depends on the bank running a jti store shared by every instance; without one an approval can execute twice and DAL-X sees it only at confirmation. Full contract: [`docs/contracts/execution-token-v2.md`](contracts/execution-token-v2.md).
- All API communication is TLS 1.2+. No plaintext fallback.
- Do not log full API key values. Log the key prefix only (the `keyPrefix` field on the key record).

### 4.8 Data Flow

```
Enterprise agent output content   →  DAL-X submission endpoint
DAL-X evaluation result           →  returned in submission response body
Human review (where required)     →  occurs inside the DAL-X web application
Authorization ID (UUID)           →  via GET /api/v1/submissions/:id after a reviewer approves
Enforcement result                 →  returned synchronously by the enforcement/execute endpoint
Execution outcome                  →  reported by your downstream to the confirm-execution endpoint
Audit trail                       →  stored within DAL-X; accessible via the web application timeline
```

Data submitted to DAL-X includes agent output content, execution intent fields, and optional context. DAL-X stores all submitted fields - `output_content`, `input_context`, and `metadata` - in its hosted database. Moving data to `metadata` does not redact it. For fields subject to data residency or sensitivity constraints, submit a reference ID (your internal transaction reference, a tokenized value, or a lookup key) and keep the source data within your own boundary. Review your data classification policy before submitting any PII, PCI-scoped content, or regulated data.

---

## 5. Integration Steps

This section shows the reference integration: the treasury agent and payments hub that passed the full 18-step DAL-X demo on real systems on 2026-10-22. The code is copied from dal-x-bank-agents at the commit shown, by `scripts/sync-integration-snippets.mjs`, and is the same code shown on the integrations page.

The flow, with offline verification at the downstream system (ADR-001):

1. **Intercept at the tool call.** The agent's consequential tool (`release_payment`) has a PreToolUse hook. It submits the proposed payment to `POST /api/v1/runtime/ingest-agent-output` with a submit key bound to the agent, saves it, and denies the tool call. The agent never calls the downstream system. The hook is the cooperative layer; the downstream system is the enforcement point.
2. **Decision.** A reviewer approves or rejects in the DAL-X Review Workbench. On approval DAL-X issues a signed v2 execution token (300 seconds).
3. **Resume.** DAL-X sends a signed decision webhook (`X-DAL-Signature`). The agent's service verifies it and, with plain code and no model call, hands the saved payment unchanged to the downstream system. The agent never handles the token.
4. **Verify at the downstream system.** The downstream system pulls the token with its own enforcement key (`GET /api/v1/enforcement/execution-requests/:id/token`), verifies it offline with `@jochanni/dalx-enforcement` against the payment it is about to run (all seven intent fields, the signed revocation list, single-use token ID in its own database), then executes.
5. **Confirm.** It reports the outcome to `POST /api/v1/enforcement/confirm-execution`, signing each attempt with its own key when the enforcement contract carries that key, and retries until DAL-X answers.

**Online alternative.** Instead of step 4, the downstream system can call `POST /api/v1/enforcement/execute` for each payment; DAL-X consumes the authorization and writes the receipt in one transaction. The rules in Current Enforcement Behavior apply.

<!-- dalx-snippets:start -->

### Agent: register the hook on the consequential tool

`dal-x-bank-agents/agents/treasury-payment/src/agent.ts` at `ecb8779`

```ts
for await (const message of query({
  prompt: `Process payment request ${requestId}.`,
  options: {
    model: deps.model,
    systemPrompt: prompt,
    tools: [],                                    // no built-in tools: no shell, files or web
    mcpServers: { treasury: treasuryServer(tamperedMasterFor(requestId), deps.paymentLimit) },
    allowedTools: ['mcp__treasury__get_payment_request', 'mcp__treasury__lookup_counterparty', RELEASE_TOOL, ESCALATE_TOOL],
    hooks: { PreToolUse: [{ matcher: RELEASE_TOOL, hooks: [hook] }, { matcher: ESCALATE_TOOL, hooks: [hook] }] },
    settingSources: [],                           // ignore any local Claude Code settings
    persistSession: false,
    maxTurns: 12,
    pathToClaudeCodeExecutable: claudeExecutable(),
  },
})) {
```

### Agent: the hook submits to DAL-X and denies the tool call

`dal-x-bank-agents/agents/treasury-payment/src/hooks.ts` at `ecb8779`

```ts
export function authorityHook(ctx: HookContext): HookCallback {
  return async input => {
    const pre = input as PreToolUseHookInput
    if (pre.hook_event_name !== 'PreToolUse' || (pre.tool_name !== RELEASE_TOOL && pre.tool_name !== ESCALATE_TOOL)) return {}

    let instruction: Pacs008Instruction | undefined
    let escalationReason: string | undefined
    if (pre.tool_name === RELEASE_TOOL) {
      const parsed = parseInstruction(pre.tool_input)
      if (!parsed.ok) return deny(`release_payment input is invalid: ${parsed.problem}. Correct it and call release_payment again.`)
      instruction = parsed.instruction
      if (ctx.paymentLimit && Number(instruction.amount) > ctx.paymentLimit) {
        return deny(`Refused: ${instruction.currency} ${instruction.amount} exceeds this agent's single-payment limit of ${ctx.paymentLimit.toLocaleString('en-US')}. Nothing was submitted.`)
      }
    } else {
      const args = pre.tool_input as { reason?: unknown; proposed_payment?: unknown }
      if (typeof args.reason !== 'string' || !args.reason.trim()) return deny('request_human_authority needs a reason.')
      escalationReason = args.reason.trim()
      if (args.proposed_payment !== undefined) {
        const parsed = parseInstruction(args.proposed_payment)
        if (!parsed.ok) return deny(`proposed_payment is invalid: ${parsed.problem}. Correct it or leave it out.`)
        instruction = parsed.instruction
      }
    }

    // Fail closed: if DAL-X cannot be reached, nothing is submitted and the run stops.
    let result: SubmitResult
    try {
      const status = await ctx.dalx.mayAct()
      if (!status.mayAct) return stop(`DAL-X does not allow treasury-payment-agent to act (status: ${status.status}).`)
      result = await ctx.dalx.submit({
        instruction, escalationReason, agentConfig: ctx.agentConfig, inputExcerpt: ctx.inputExcerpt,
        counterpartyName: instruction ? ctx.counterpartyName(instruction.creditor.id) : 'none',
        requestId: ctx.requestId, runId: ctx.runId, model: ctx.model,
      })
    } catch (err) {
      return stop(`DAL-X submission failed: ${(err as Error).message}`)
    }

    // Only a live submission with a payment is saved for release. A shadow
    // evaluation can never be authorized, and an escalation without a payment
    // has nothing to release.
    const id = result.kind === 'submitted' ? result.submissionId : result.evaluationId
    if (result.kind === 'submitted' && instruction) {
      await ctx.store.savePending({ submissionId: id, runId: ctx.runId, requestId: ctx.requestId, instruction })
    }
    ctx.submissions.push(id)

    // The agent sees the same result in both modes, so baseline behavior is
    // the behavior of the live agent. The run is not stopped: each call is its
    // own submission (PILOT-12 observes several).
    if (escalationReason) return deny(`Escalated to DAL-X as ${id} for a human decision. Report the submission ID and stop.`)
    return deny(`Payment submitted to DAL-X as ${id}. Nothing is released without DAL-X authority. Do not submit the same payment again.`)
  }
}
```

### Agent service: resume on the decision webhook (no model call)

`dal-x-bank-agents/agents/treasury-payment/src/resume.ts` at `ecb8779`

```ts
export async function handleDecisionWebhook(rawBody: string, signature: string | null, deps: ResumeDeps): Promise<ResumeResult> {
  if (!signatureValid(deps.webhookSecret, rawBody, signature)) return { status: 401, body: { error: 'invalid_signature' } }

  const event = JSON.parse(rawBody) as { event: string; data: { review_item_id: string } }
  const pending = await deps.store.getPending(event.data.review_item_id)
  if (!pending) return { status: 200, body: { ignored: 'not a submission from this agent' } }
  if (pending.status !== 'pending_authority') return { status: 200, body: { ignored: `already ${pending.status}` } }

  if (event.event === 'decision.approved') {
    const hub = await deps.releaseAtHub(pending.submissionId, pending.instruction)
    if (hub.status === 201) {
      await deps.store.setStatus(pending.submissionId, 'released', hub.body)
      return { status: 200, body: { released: pending.submissionId, hub: hub.body } }
    }
    // 409: the authorization is not issued yet. Non-2xx makes DAL-X retry the webhook.
    if (hub.status === 409 || hub.status >= 500) return { status: 503, body: { retry: true, hub: hub.body } }
    await deps.store.setStatus(pending.submissionId, 'release_failed', hub.body)
    return { status: 200, body: { release_failed: pending.submissionId, hub: hub.body } }
  }

  if (event.event === 'decision.rejected') {
    await deps.store.setStatus(pending.submissionId, 'denied')
    return { status: 200, body: { denied: pending.submissionId } }
  }
  return { status: 200, body: { noted: event.event } }
}
```

### Downstream system: offline verifier and token pull

`dal-x-bank-agents/apps/payments-hub/src/index.ts` at `ecb8779`

```ts
const verifier = new OfflineVerifier({
  dalxBaseUrl:     required('DALX_BASE_URL'),
  apiKey:          required('DALX_ENFORCEMENT_KEY'),
  workspaceId:     required('DALX_WORKSPACE_ID'),
  executionTarget: HUB_TARGET,
  jtiStore,
  signer: {
    privateKey: crypto.createPrivateKey({ key: Buffer.from(required('HUB_SIGNING_KEY'), 'base64'), format: 'der', type: 'pkcs8' }),
    keyId:      required('HUB_SIGNING_KEY_ID'),
  },
})

const dalxBase = required('DALX_BASE_URL').replace(/\/$/, '')
const enforcementKey = required('DALX_ENFORCEMENT_KEY')

async function fetchToken(executionRequestId: string): Promise<string | null> {
  const res = await fetch(`${dalxBase}/api/v1/enforcement/execution-requests/${encodeURIComponent(executionRequestId)}/token`, {
    headers: { Authorization: `Bearer ${enforcementKey}` }, cache: 'no-store',
  })
  if (!res.ok) return null
  return ((await res.json()) as { token: string }).token
}
```

### Downstream system: verify, execute, confirm

`dal-x-bank-agents/apps/payments-hub/src/hub.ts` at `ecb8779`

```ts
// The one execution path. Every payment passes offline verification here.
async function release(token: string, body: unknown) {
  const parsed = parseInstruction(body)
  if (!parsed.ok) return { status: 400 as const, body: { error: 'invalid_instruction', problem: parsed.problem } }
  let intent: PaymentIntent
  try { intent = toIntent(parsed.instruction) } catch (err) {
    return { status: 400 as const, body: { error: 'invalid_instruction', problem: (err as Error).message } }
  }

  const result = await verifier.verify(token, intent)
  if (!result.allowed) return { status: 403 as const, body: { error: 'dalx_authority_refused', reason: result.reason } }

  const id = `pay_${crypto.randomUUID()}`
  await ledger.insert({ id, jti: result.claims.jti, instruction: parsed.instruction, intent })
  const confirmation = await confirm(id, result.claims.jti, intent, 3)
  return { status: 201 as const, body: { payment_id: id, jti: result.claims.jti, confirmation } }
}

// Token presented by the caller.
app.post('/payments/release', async c => {
  const header = c.req.header('authorization') ?? ''
  if (!header.startsWith('DAL-X ')) return c.json({ error: 'missing_dalx_token' }, 401)
  const r = await release(header.slice('DAL-X '.length).trim(), await c.req.json().catch(() => null))
  return c.json(r.body, r.status)
})

// Token pulled by the hub. The caller names the approved submission and the
// payment; the hub asks DAL-X for the authority and verifies it the same way.
// The caller never handles a token.
app.post('/payments/release-authorized', async c => {
  const body = await c.req.json().catch(() => null) as { execution_request_id?: unknown; instruction?: unknown } | null
  if (typeof body?.execution_request_id !== 'string') return c.json({ error: 'invalid_request', problem: 'execution_request_id is required' }, 400)
  const token = await fetchToken(body.execution_request_id)
  if (!token) return c.json({ error: 'no_active_authorization' }, 409)
  const r = await release(token, body.instruction)
  return c.json(r.body, r.status)
})
```

<!-- dalx-snippets:end -->

## 6. Cloud Implications

### 6.1 DAL-X is a hosted service

DAL-X runs on cloud infrastructure managed by Jochanni Labs. As the integrating enterprise, your cloud responsibility is limited to:

- Secrets management for API keys (use your existing secrets manager)
- Networking outbound to `www.decisionauthoritylayer.ai` (HTTPS/443)
- If using webhooks for record keeping: inbound webhook receiver endpoint within your cloud environment
- Durable storage of pending action state while awaiting authority decisions (your existing database)

### 6.2 Async flow state management

If your execution flow requires async redesign (see Step 7), the pending action state must survive process restarts. Use durable storage - a database table or a managed queue (SQS, Azure Service Bus, Google Pub/Sub) - not in-memory state.

Recommended table structure for pending actions awaiting authority:

```sql
CREATE TABLE dalx_pending_actions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dalx_submission_id    TEXT NOT NULL UNIQUE,  -- DAL-X submission ID
  source_ref            TEXT NOT NULL,          -- your internal reference
  action                TEXT NOT NULL,
  target                TEXT NOT NULL,
  scope                 TEXT NOT NULL,
  execution_payload     JSONB NOT NULL,         -- the full action payload to execute on approval
  dalx_status           TEXT NOT NULL DEFAULT 'pending',
  dalx_authorization_id TEXT,                   -- authorization_id UUID from GET /submissions/:id;
                                                -- use as authorization_id for enforcement/execute call
  token_expires_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 6.3 Webhook receiver

If using webhooks, your receiver must:
- Accept inbound POST requests from DAL-X IP ranges (obtain current ranges from Jochanni Labs)
- Respond with HTTP 2xx within 10 seconds, without redirecting
- Verify the `X-DAL-Signature: sha256=<hex>` header before acting on the payload (see Step 7 for implementation)
- Process events idempotently using `X-DAL-Delivery-ID` (DAL-X retries failed deliveries per the schedule in Step 7)
- Not depend on delivery inside the authorization window. Keep polling as the fallback.

### 6.4 Scalability

Submission calls add one outbound HTTPS round-trip per governed agent action. The enforcement gate, receipt verification, and confirmation each add one outbound HTTPS round-trip at the execution boundary. Every governed action also waits for a human decision. For agents initiating hundreds of actions per minute, account for this latency in SLA calculations.

DAL-X rate limit on `POST /api/v1/submissions`: 100 requests/minute (refill rate) per API key. If your agent generates more than this, contact Jochanni Labs before pilot to discuss key-level rate allocation.

### 6.5 Data residency

Submission payloads including `output_content`, `input_context`, and `metadata` are stored within DAL-X's hosted database. Confirm whether this is compatible with your data residency requirements before submitting data with PII, PCI scope content, or regulated data. Use data references (IDs) in submission fields and keep sensitive content in systems within your data boundary where data residency is a constraint.

### 6.6 Disaster recovery

DAL-X availability is the responsibility of Jochanni Labs. If DAL-X is unavailable, submission calls and token validation calls will fail with network errors or 5xx responses.

Your application must handle DAL-X unavailability differently depending on mode:

**Shadow mode** (enforcement gate not yet live):
- Log the outage with a `DALX_UNAVAILABLE` error code
- Allow existing execution to continue - shadow mode observes only; it does not block
- Alert operations that shadow calibration is interrupted

**Enforcement mode** (enforcement gate live at the downstream boundary):
- Log the outage with a `DALX_UNAVAILABLE` error code
- Block the governed action (fail closed)
- Alert operations immediately
- Resume only when DAL-X is reachable and validation succeeds

Do not implement a bypass path in enforcement mode that allows execution to proceed when DAL-X is unreachable. This defeats the enforcement guarantee. The continue-on-failure behavior is correct only in shadow mode, where execution has never been gated by DAL-X authority.

---

## 7. Testing and Validation

### 7.1 Unit tests for the submission call

- Verify the submission payload includes all required fields, including all seven `execution_intent` payment fields
- Verify `idempotency_key` is populated
- Verify retries on `429` respect `Retry-After`
- Verify that a failed submission call in shadow mode (network error, 5xx) logs and continues - does not block
- Verify that a failed submission call in enforcement mode (network error, 5xx) blocks the governed action

### 7.2 Unit tests for the enforcement gate

- Verify that `execution_allowed: true` permits execution to proceed
- Verify that `execution_allowed: false` blocks execution and logs the rejection reason
- Verify that an accepted call is not retried when its response is lost
- Verify that a DAL-X API error (non-200 response) is treated as a rejection (fail closed)
- Verify that a missing `authorization_id` (empty or null) produces a controlled rejection, not an unhandled exception

### 7.3 Unit tests for webhook handling

- Verify that a delivery with a valid `X-DAL-Signature` is processed
- Verify that a delivery with an invalid or missing signature is rejected with 401 - no downstream action taken
- Verify that no execution path depends on a webhook arriving
- Verify that the same event delivered twice (retry scenario) is processed idempotently

### 7.4 Integration tests (requires DAL-X test workspace)

| Test | Expected result |
|------|----------------|
| Submit a governed action | `201` with submission ID and status `needs_review`, `high_risk`, or `blocked` |
| Submit same action twice with same `idempotency_key` | Returns original submission (HTTP 200) |
| Submit same `idempotency_key` with different payload | Returns `409 idempotency_key_collision` |
| GET /submissions/:id before approval | `execution_authorization` is `null` |
| GET /submissions/:id after a reviewer approves | Returns `execution_authorization.authorization_id` with `status: "active"` |
| `enforcement/execute` with a valid active `authorization_id` | `result: "accepted"`, `execution_allowed: true`, `receipt_id` present |
| `enforcement/execute` with wrong `attempted_action` | `rejected`, reason begins `Attempted action` |
| `enforcement/execute` with wrong `execution_target` | `rejected`, reason begins `Execution target mismatch` |
| `enforcement/execute` with wrong `agent_key` | `rejected`, reason begins `Execution was authorized for agent` |
| `enforcement/execute` with a consumed `authorization_id` | `rejected` |
| `enforcement/execute` after the 5-minute TTL | `rejected`, reason begins `Execution token expired at` |
| `enforcement/execute` with no `authorization_id` | `rejected`, reason begins `No execution token provided` |
| `enforcement/execute` with a submission-only key | `403` |
| `receipts/:id/verify` twice | First `200 verified: true`; second `409 receipt_already_consumed` |
| `confirm-execution` success with matching `observed_execution` | `200`, `outcome: "execution_completed"` |
| `confirm-execution` success with no `observed_execution` | `400 observed_execution_required` |
| `confirm-execution` a second time, same `outcome` and `execution_reference` | `200` with `already_recorded: true` |
| `confirm-execution` a second time, different `outcome` or `execution_reference` | `409 confirmation_conflict` |

### 7.5 Acceptance test (required before production enforcement activation)

Run the full end-to-end loop described in Step 12. All twelve steps must produce the expected result before enforcement is activated in production.

The governance timeline visible in the DAL-X web application is the proof artifact. Export it for the pilot evidence report.

---

## 8. Troubleshooting Guide

### Submission returns `401 unauthenticated`

**Cause:** Missing, malformed, or revoked API key.

Check:
- Authorization header format: must be `Bearer dalx_<key>` - no extra spaces
- Key has not been revoked (visible in DAL-X workspace under Settings → API Keys)
- Key prefix in the request matches the key stored in your secrets manager
- If recently rotated: confirm the new key is deployed to the correct service instance

### Submission returns `403 forbidden`

**Cause:** The API key does not have `submit` scope. The response message is `API key does not have submit scope.` An enforcement key cannot submit.

Fix: Use the submission key for `POST /api/v1/submissions` and `GET /api/v1/submissions/:id`.

### Submission returns `400 validation_failed`

**Cause:** A required field is missing or empty. `output_content`, `input_context`, `source_identifier`, and `submitter` are all required non-empty strings. The response lists each failing field in `issues`.

Fix: Send every required field. `input_context` cannot be `null`.

### Submission returns `413 payload_too_large`

**Cause:** `output_content` > 256 KB, `input_context` > 64 KB, or `metadata` > 8 KB serialized.

Fix: Truncate or summarize the agent's output content. Store the full output in your own system and submit a reference ID.

### Enforcement gate returns `rejected` with a mismatch reason

**Cause:** The `agent_key`, `attempted_action`, `execution_target`, or a `request_payload` field in the `enforcement/execute` call does not match what was approved.

Check:
- `agent_key` must equal the `submitter` sent at submission or, for runtime ingestion, the registered `agent_key`
- `attempted_action` must equal the `execution_intent.action` submitted (case-sensitive)
- `execution_target` must equal the `metadata.execution_target` submitted, or the `execution_intent.target` when no `metadata.execution_target` was sent (case-sensitive)
- Any intent field in `request_payload` must equal the submitted value exactly, including its type
- Confirm the pending action table is storing and retrieving the correct `authorization_id` UUID for this specific action

### Enforcement gate returns `rejected` with `Execution intent is missing`

**Cause:** The submission was created without all seven payment fields in `execution_intent`, or with an `amount` that is not a positive integer.

Fix: The stored intent cannot be changed. Submit the action again with a complete `execution_intent` and obtain a new approval.

### Enforcement gate returns `rejected` with `No active enforcement contract found for target`

**Cause:** No enforcement contract is registered for the `execution_target` in the call.

Fix: Confirm the target string matches the registered contract exactly. A workspace admin or owner registers or reactivates the contract under Settings, Contracts.

### Enforcement gate returns `rejected` with token already consumed

**Cause:** The authorization was consumed by a prior `enforcement/execute` call. Authorizations are single-use. The response `reason` begins `Execution token was previously consumed`. Presenting a consumed authorization again also invalidates it and opens a high-severity drift signal.

Check:
- Is the enforcement call being retried without checking whether the first call succeeded?
- Is the same `authorization_id` being shared across parallel execution paths?

Fix: Each governed action instance requires its own authorization. Do not reuse `authorization_id` values across retries if the first call may have succeeded. Check `GET /api/v1/submissions/:id`: `awaiting_execution_confirmation` means the first call was accepted.

### Enforcement gate returns `rejected` with `Authorization ID not found`

**Cause:** The `authorization_id` passed to `enforcement/execute` does not match any authorization record in this workspace.

Check:
- Confirm `authorization_id` is the UUID value from `GET /api/v1/submissions/:id` under `execution_authorization.authorization_id` (e.g., `3e7f8d9a-1234-5678-abcd-ef0123456789`)
- Confirm `execution_authorization.status` was `"active"` when you retrieved the value. A consumed, expired, or revoked authorization is found and returns its own rejection reason.
- Confirm the API key used for the enforcement call belongs to the same workspace as the submission

### Authority decision endpoint returns `human_authority_required`

**Cause:** The request sent `"action": "approve"` to `POST /api/v1/runtime/submissions/:id/authority-decision`. An API key cannot approve a submission.

Fix: A reviewer with an authority profile approves the submission in the DAL-X Review Workbench. When the submission has open drift signals, the reviewer acknowledges them there before approving. No change to the API request will make this call succeed.

### Webhook not received after reviewer approves

**Cause:** No destination is registered or active for the workspace, the event type is not subscribed, or the destination is unreachable, slow (over 10 seconds), or answering with a redirect or a non-2xx status. A failed delivery is retried after 5, 15, 60, then 240 minutes.

Check:
- Settings, Webhooks: the destination is Active and subscribed to the event
- The audit log, for a `webhook.dead_lettered` event against the decision
- Firewall rules permit inbound traffic on port 443
- The receiver responds with HTTP 2xx within 10 seconds, without redirecting

Do not wait on a webhook to execute. Poll `GET /api/v1/submissions/:id`.

### Receipt verification returns `409 execution_request_not_awaiting`

**Cause:** The execution request is no longer awaiting confirmation. It expired 30 minutes after the gate accepted it, was denied, or already completed.

Fix: Do not execute. Submit the action again and obtain a new approval.

### Confirmation returns `400 observed_execution_required`

**Cause:** `outcome` was `success` and `observed_execution` was missing.

Fix: Resend with `observed_execution` containing the action, target, amount, currency, recipient, recipient account reference, and payment type actually executed.

### Where to find logs and diagnostic information

| Information | Location |
|-------------|----------|
| Submission status and evaluation | DAL-X review queue and workbench |
| Decision records | DAL-X review workbench → Decision tab |
| Execution authorizations | DAL-X → `/token/:id`, where `:id` is the `authorization_id` |
| Governance timeline | DAL-X review workbench → Timeline tab |
| System events (auth failures, rate limits, webhook failures) | Not shown in a web application page. Available to admins and owners at `GET /api/app/admin/system-events`; ask Jochanni Labs for an extract. |
| Drift signals | DAL-X review workbench → Drift tab |
| API-side logs | Your service logs - log the `X-Request-Id` header you send with each request |

---

## 9. Maintenance and Monitoring

### 9.1 Key rotation

Rotate API keys on your standard credential rotation schedule (recommended: 90 days or on personnel change).

Rotation procedure:
1. Create a new key with the same scopes
2. Update the key's value in your secrets manager (`DALX_SUBMIT_KEY` or `DALX_ENFORCEMENT_KEY`)
3. Deploy the new value to all service instances
4. Revoke the old key via Settings → API Keys in the DAL-X workspace
5. Confirm the old key prefix no longer appears in submission requests via system events

Never revoke the old key before the new key is deployed and confirmed active.

### 9.2 Metrics to monitor

| Metric | Alert threshold | Meaning |
|--------|----------------|---------|
| DAL-X submission HTTP errors (5xx) | Any | DAL-X infrastructure issue |
| DAL-X submission `401` rate | > 1% of requests | Key rotation issue or misconfigured key |
| DAL-X rate limit (`429`) frequency | Sustained | Submission rate exceeds limit |
| Enforcement gate rejections - agent, action, target, or payload mismatch | Any | The call does not match what was approved; may indicate agent behavioral drift |
| Enforcement gate rejections - expired | Any | Workflow exceeds 5-minute TTL; consider token refresh |
| Submissions in `execution_unconfirmed` or expired after gate acceptance | Any | A confirmation was not sent within 30 minutes |
| Confirmations recorded as `execution_reversed` | Any | The downstream executed something other than what was authorized |
| Pending action age | > 60 minutes | Submission awaiting review without progress; check reviewer queue |
| DAL-X drift events (open, unreviewed) | Any | Agent behavioral deviation requiring reviewer attention |

### 9.3 Review queue health

The human review queue must have active, available reviewers. If the queue accumulates items without decisions:

- Submissions remain in `needs_review`, `high_risk`, or `blocked` status
- Governed agent actions remain pending (for flows designed to await authority)
- No execution authorizations are issued for queued items

Monitor queue depth in the DAL-X workspace. Alert your operations team if items age beyond your defined SLA for authority decisions.

### 9.4 Trigger rule version changes

Trigger logic is versioned. Any change to trigger rules is recorded in DAL-X with a new version. Before trigger rule changes are applied to the production workspace:

- Review the proposed change with the Jochanni Labs team
- Use the dry-run tool (`POST /api/app/dry-run`, admin/owner only) to re-evaluate existing submissions against the proposed rule change - it returns a diff of what fired originally versus what would fire now, without modifying any records
- Confirm that the change does not reclassify actions into or out of `blocked` or `high_risk` unintentionally
- Expect in-flight authorizations to be refused: when the rule that controlled an approved submission gets a newer version, the enforcement gate stops honoring that authorization and the action must be submitted again
- Record the approval of the trigger rule version change in the DAL-X governance timeline

### 9.5 Periodic evidence review

The DAL-X pilot evidence report is generated at the end of the acceptance test period. For ongoing operations:

- Export the governance timeline for any regulatory inquiry that requires authority chain evidence
- Decision records are append-only by application convention. No route edits a decision, its actor, or its reason; the daily retention job clears only the output and input content snapshots after the workspace retention period. No database trigger prevents an update or delete. The hash chain detects tampering; its head is not yet anchored outside the database (PILOT-07)
- The audit export is available on the Audit page in the DAL-X web application, which calls `GET /api/app/audit/export?format=csv|json|signed` with your signed-in session

---

*DAL-X - No authority. No execution.*
