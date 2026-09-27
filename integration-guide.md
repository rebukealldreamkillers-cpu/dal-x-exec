# DAL-X Technical Integration Guide
## Decision Authority Layer — Engineer Implementation Reference

**Audience:** Engineers at the integrating enterprise responsible for instrumentation, enforcement integration, and acceptance testing.

**Purpose:** Step-by-step instructions for integrating an autonomous agent into DAL-X so that every consequential action the agent initiates is evaluated for authority before execution proceeds.

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
  │  POST /api/v1/submissions          ← Integration Point 1: Intercept
  ▼
DAL-X Authority Evaluation
  │
  ├─ auto_released  ─────────────────── authorization_id returned in submission response
  ├─ needs_review   ─────────────────── enters human review queue
  │       │
  │       ▼  Reviewer approves in DAL-X web app
  │   Webhook fires → GET /api/v1/submissions/:id → authorization_id (UUID)
  │
  └─ auto_blocked / rejected ─────────── no authorization issued, action denied

Agent (or calling service) holds the authorization_id
  │
  │  POST /api/v1/enforcement/execute      ← Integration Point 2: Enforce
  │  (authorization_id = UUID from GET /submissions/:id)
  ▼
  ├─ ACCEPTED → downstream execution proceeds
  └─ REJECTED → downstream execution is blocked
```

**Two modes:**

- **Shadow mode:** Submission call added. Enforcement gate not yet enforced. Agent behavior flows into DAL-X for calibration. If DAL-X is unavailable in shadow mode, log the error and allow existing execution to continue — shadow mode observes; it does not block.
- **Enforcement mode:** Token validation is live at the downstream boundary. Execution is blocked unless a valid authorization exists. If DAL-X is unavailable in enforcement mode, block the governed action (fail closed).

Start in shadow mode. Do not activate enforcement until calibration is complete and the acceptance test passes.

---

## 3. Trigger Logic — What It Is, What You Provide, What Gets Built

DAL-X is not a generic AI governance platform with a default ruleset. Every rule in the system is enterprise-specific. Jochanni Labs builds trigger logic around the specific agent being registered, the specific actions it initiates, and the specific risk exposure those actions create in your environment. You cannot activate enforcement without it, and it cannot be built without your input.

### 3.1 What Trigger Logic Does

When a submission arrives at `POST /api/v1/submissions`, DAL-X runs every active trigger rule for your workspace against it. The engine evaluates the rules in parallel, collects all matches, and assigns the highest-severity match as the controlling outcome. That outcome determines what happens next:

| Severity outcome | What happens |
|-----------------|-------------|
| `auto_approve` | Authorization issued immediately — no reviewer queue |
| `needs_review` | Submission enters reviewer queue |
| `high_risk` | Submission enters reviewer queue with lead-review flag |
| `blocked` | Submission rejected at intake — no authorization ever issued |

If no rule matches, DAL-X applies the **conservative default: `needs_review`**. The engine never silently approves an unmatched submission. An `auto_approve` outcome requires a rule that explicitly authorizes it.

### 3.2 The 12 Rule Categories

Every rule is tagged with one category. Categories define what kind of risk is being detected. The category is separate from severity — a rule can be `financial_impact` category with `auto_approve` severity (delegated authority below a threshold) or `blocked` severity (hard denial above a threshold).

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

### 3.3 The 5 Condition Types

Rules evaluate against submission fields using one of five condition types. Understanding these determines how you structure your submission payload — particularly the `metadata` field.

**`keyword` — case-insensitive substring match**
```json
{
  "type": "keyword",
  "target": "output_content",
  "value": ["wire transfer", "initiate payment", "transfer funds"],
  "match_mode": "any"
}
```
Matches if any (or all, with `match_mode: "all"`) of the listed terms appear in the target field. The `target` can be `output_content`, `input_context`, or `metadata.<key>`.

**`regex` — pattern match**
```json
{
  "type": "regex",
  "target": "output_content",
  "pattern": "\\$[0-9,]+(?:\\.[0-9]{2})?",
  "flags": "i"
}
```
Regex patterns have a hard 100ms evaluation timeout per rule. Catastrophic-backtracking patterns are rejected at rule creation.

**`metadata_equality` — exact match on a metadata field**
```json
{
  "type": "metadata_equality",
  "target": "metadata.approval_tier",
  "value": "standard"
}
```
This is how you scope rules to specific agents, action types, or routing conditions. The value you put in `metadata` when submitting determines which rules fire.

**`currency_threshold` — monetary amount detection with threshold**
```json
{
  "type": "currency_threshold",
  "target": "output_content",
  "currency": "USD",
  "threshold_amount": 50000,
  "operator": "gte"
}
```
Detects dollar amounts (including "$50K", "$1.2M" notation) in `output_content`. The amount must appear as readable text in `output_content` — this condition type evaluates `output_content` only. It does not evaluate `metadata` fields. For amount-based routing without text parsing, use `metadata_equality` with pre-categorized approval tiers in a metadata field.

**`payload_size` — byte threshold on a target field**
```json
{
  "type": "payload_size",
  "target": "output_content",
  "operator": "gt",
  "threshold_bytes": 10240
}
```
Useful for flagging anomalously large outputs as a coarse anomaly signal.

### 3.4 What You Must Provide to Enable Trigger Logic Development

Jochanni Labs cannot build effective rules without inputs from the enterprise. The following must be defined before trigger logic development begins — not during it.

**Agent mandate document (required)**
- What is this agent authorized to do? What actions fall within its delegated authority?
- What actions require human approval before execution?
- What actions must be denied outright regardless of context?
- What thresholds separate auto-approved actions from review-required actions? (e.g., payments under $10,000 auto-approved; $10,000–$100,000 needs_review; over $100,000 high_risk)

**Submission field mapping (required)**
- Which `metadata` fields will your agent populate?
- What values will those fields contain? (Jochanni Labs uses these to write `metadata_equality` rules)
- Will `output_content` contain dollar amounts as readable text? In what format?
- Does `execution_intent.action` need multiple category values, or is it a single action type?

Without the field mapping, rules cannot target the right data. A `currency_threshold` rule requires the dollar amount to appear in `output_content` as text. A `metadata_equality` rule requires a corresponding metadata field to be populated at submission time.

**Risk policy document (required for `financial_impact` and `legal_regulatory` categories)**
- What internal approval thresholds apply to payments initiated by this agent?
- Which regulatory frameworks govern this agent's domain (Reg E, FINRA, AML, SOX)?
- Who is authorized to approve at each threshold — standard reviewer or lead reviewer?
- What is the minimum reason length required from the reviewer when approving?

**Counterparty or target allowlist (if applicable)**
- Is this agent restricted to initiating payments to approved counterparties only?
- Does a payment to a non-allowlisted target require escalation?

**Existing policy documents (if available)**
- Internal approval matrix for the agent's action domain
- Regulatory filing or compliance posture relevant to the agent
- Prior incident reports that identify specific risk patterns to detect

### 3.5 The Starter Rule Pack

DAL-X provisions 25 starter rules to every new workspace at onboarding. These are detection patterns for calibration — not enterprise authority logic. No starter rule should be treated as safe for immediate enforcement activation without first mapping it to the registered agent's mandate and validating it against shadow submissions from that specific agent.

Financial services agents almost always require customization of:

| Starter rule | What to customize |
|-------------|------------------|
| Currency Amount — $500 Threshold (`needs_review`) | Raise threshold to match your internal approval matrix |
| Currency Amount — $5,000 Threshold (`high_risk`) | Adjust to your actual high-risk threshold; add a third tier if needed |
| Regulatory References | Add your specific applicable regulations (Reg E, FINRA 4511, AML) |
| Execution Instruction | Tune regex for your agent's output format — if your agent produces JSON payloads, the default shell-command pattern doesn't cover them |

The `sensitive_data` category starter rules (SSN, card number, API key, bearer token) are strong candidates for `blocked` severity — but validate them against shadow submissions from your specific agent to confirm they do not produce false positives before activating enforcement.

### 3.6 How Submission Metadata Enables Rule Precision

The `metadata` field in the submission is the primary mechanism for routing precision. If your agent submits only `output_content` as a natural-language string, rules are limited to keyword and regex matching against that string. If your agent populates structured `metadata` fields, rules can match against exact values.

Recommended metadata fields for a treasury payment agent:

```json
{
  "metadata": {
    "amount": 47500.00,               // numeric — enables metadata_equality routing rules
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

> **Important:** `currency_threshold` rules evaluate `output_content` only — they detect monetary amounts as text (e.g., "$47,500 USD"). They do not evaluate `metadata.amount`. The `metadata.amount` numeric field enables `metadata_equality` routing rules. To use `currency_threshold` for amount-based approval thresholds, the amount must appear in `output_content` as readable text. For structured amount-based routing without text parsing, define `metadata.approval_tier` with values like `"standard"` / `"elevated"` / `"restricted"` and write `metadata_equality` rules against those tiers.

These fields become available to `metadata_equality` and `metadata.<key>` targets in rule conditions. Define these fields with Jochanni Labs before any rules are authored — changing field names after rules are deployed against them requires rule version updates.

### 3.7 Severity Outcomes and What They Mean for Your Flow

Severity is set on the rule that fires. When multiple rules match a submission, the **highest severity wins**.

| Severity | Queue behavior | Authorization issued? | When to use |
|----------|----------------|---------------|-------------|
| `auto_approve` | No queue entry — immediate | Yes, immediately | Actions within established delegated authority limits. Requires explicit rule. |
| `needs_review` | Queue entry — any active reviewer can act | Only after human approval | Standard review threshold. The default if no rule matches. |
| `high_risk` | Queue entry — 15-second minimum time on screen, confirmation modal required | Only after lead reviewer approves | High-consequence actions requiring elevated authority |
| `blocked` | No queue entry — rejected at intake | Never | Hard denials. No override path. |

The `auto_approve` outcome does not skip the audit trail. A decision record is still written with `reviewer_kind: 'auto'`. The governance timeline still records the full chain. The difference is that no human is in the review path.

### 3.8 Testing Rules During Shadow Mode

Shadow mode is the calibration window for trigger logic. During shadow mode:

- Submissions flow into DAL-X and rules evaluate against them
- The review queue shows what would have been routed for review
- The `shadow_mode` flag on the key means no execution is blocked — calibration only
- System events record rule matches, controlling rules, and severity assignments

Use this period to:
1. Confirm that high-value payments are routing to the correct severity tier
2. Confirm that `auto_approve` rules are not matching submissions that should require review
3. Confirm that `blocked` rules are not triggering on legitimate agent outputs (false positives cause operational friction once enforcement is live)
4. Identify metadata fields that are missing from submissions and causing rules to miss

The dry-run tool (`POST /api/app/dry-run`, admin and owner roles only) takes an existing submission by ID and re-evaluates it against the current active rule set. It returns a comparison of what fired at original submission time versus what would fire now — useful for validating rule changes before deploying them against live submissions. It requires an existing submission in the system and does not accept arbitrary text input.

**Enforcement activation is blocked until trigger logic is correct.** Do not activate enforcement with rules that produce false positives on legitimate agent outputs. Every `needs_review` result on a production submission that should have been `auto_approve` is a reviewer queue interruption and a latency event in the execution path.

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

Two API key types are required for a complete integration:

| Key type | Scope field | Used for |
|----------|-------------|----------|
| Shadow key | `{ "submit": true }`, `shadow_mode: true` | Submission during calibration |
| Enforcement key | `{ "submit": true, "enforcement": true }`, `shadow_mode: false` | Production enforcement |

Keys are workspace-scoped. One workspace per enterprise pilot.

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
| Refill rate | 100 requests / minute per API key |
| Burst allowance | 200 requests |
| Exceeded limit response | `429` with `X-RateLimit-*` headers |

### 4.4 Authorization Identifiers

Two distinct identifiers are created when a submission is authorized. Understanding the difference is required for correct integration.

| Identifier | Format | Retrieved from | Used for |
|------------|--------|----------------|----------|
| `authorization_id` | UUID (e.g., `3e7f8d9a-...`) | Submission response (auto-released) or `GET /api/v1/submissions/:id` (after human review) | The `authorization_id` parameter in the `enforcement/execute` call |
| `execution_token` | Signed string (`dalx_exec_eyJ...`) | Returned to the DAL-X web app UI on human approval — not transmitted to the integration | The `execution_token` parameter in the refresh-token call only |

**In the auto-released path:** The `authorization_id` is available immediately via `GET /api/v1/submissions/:id` under `execution_authorization.authorization_id`.

**In the human review path:** The `execution_token` signed string is returned to the DAL-X web application when the reviewer approves. It is **not** transmitted in the webhook payload and is **not** accessible to the integration. Your integration retrieves only the `authorization_id` UUID by calling `GET /api/v1/submissions/:id` after receiving the webhook.

### 4.5 Token Constraints

| Property | Value |
|----------|-------|
| Authorization TTL | 15 minutes from issuance |
| Single-use | Yes — consumed after one successful validation |
| Scope binding | Authorization is bound to a specific `action`, `target`, and payload hash |
| Scope mismatch | Returns `REJECTED` with `scope_mismatch` reason |
| Expired authorization | Returns `REJECTED` with `Token has expired` — a new approval decision is required |

### 4.6 Network Requirements

- Outbound HTTPS (port 443) from the agent host or service making the submission call to `www.decisionauthoritylayer.ai`
- Outbound HTTPS from the downstream execution boundary service to `www.decisionauthoritylayer.ai` (for token validation)
- If using webhooks for authority decision notifications: inbound HTTPS to a webhook receiver endpoint in the enterprise network
- No inbound connections required from DAL-X to enterprise systems

### 4.7 Security Considerations

- API keys are hashed server-side. The cleartext key is returned once at creation and never stored or retrievable again. Store it in a secrets manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) immediately upon creation.
- Keys have explicit scopes. A shadow key cannot activate enforcement. An enforcement key without `submit` scope cannot submit.
- Execution authorizations are Ed25519-signed and hash-chained to the decision record that authorized them. The signing key is not shared with the enterprise — authorization integrity is verified by the DAL-X validation endpoint, not by the enterprise.
- All API communication is TLS 1.2+. No plaintext fallback.
- Do not log full API key values. Log the key prefix only (the `keyPrefix` field on the key record).

### 4.8 Data Flow

```
Enterprise agent output content   →  DAL-X submission endpoint
DAL-X evaluation result           →  returned in submission response body
Human review (where required)     →  occurs inside the DAL-X web application
Authorization ID (UUID)           →  returned in submission response (auto-released)
                                      or via GET /api/v1/submissions/:id (after human review)
Enforcement result                 →  returned synchronously by the enforcement/execute endpoint
Audit trail                       →  stored within DAL-X; accessible via the web application timeline
```

Data submitted to DAL-X includes agent output content, execution intent fields, and optional context. DAL-X stores all submitted fields — `output_content`, `input_context`, and `metadata` — in its hosted database. Moving data to `metadata` does not redact it. For fields subject to data residency or sensitivity constraints, submit a reference ID (your internal transaction reference, a tokenized value, or a lookup key) and keep the source data within your own boundary. Review your data classification policy before submitting any PII, PCI-scoped content, or regulated data.

---

## 5. Integration Steps

### Phase 1 — Workspace Setup

**Step 1: Obtain workspace credentials from Jochanni Labs**

You will receive:
- DAL-X workspace URL (e.g., `https://www.decisionauthoritylayer.ai`)
- Workspace invitation to onboard the review team

Complete workspace setup before creating API keys. The review team (whoever will be in the human review queue) must be provisioned first so the queue has active reviewers when submissions arrive.

---

**Step 2: Create a shadow API key**

Via the DAL-X web application (Settings → API Keys → Create Key), or via the management API if your workspace admin flow is automated:

```http
POST https://www.decisionauthoritylayer.ai/api/app/api-keys
Authorization: Bearer <admin-session-token>
Content-Type: application/json

{
  "name": "treasury-agent-shadow",
  "scopes": { "submit": true },
  "shadow_mode": true
}
```

**Response:**
```json
{
  "key": {
    "id": "uuid",
    "name": "treasury-agent-shadow",
    "keyPrefix": "dalx_abc123",
    "scopes": { "submit": true },
    "shadowMode": true,
    "createdAt": "2026-08-23T00:00:00.000Z"
  },
  "cleartext": "dalx_abc123_<full-secret>"
}
```

> **Critical:** The cleartext key is returned once. Store it in your secrets manager immediately. It cannot be retrieved again.

Store it as `DALX_SHADOW_KEY` in your secrets manager. Inject it as an environment variable into the agent service — do not hardcode it.

---

**Step 3: Register the agent with Jochanni Labs**

Provide the following for each agent being registered:

- Agent identifier string (this is your `submitter` field — must be stable and unique per agent)
- Agent's authorized actions (what action categories it is permitted to initiate)
- Execution targets (which downstream systems it can trigger)
- Authority requirement per action category (auto-approve thresholds, review requirements, escalation conditions)
- Regulatory or internal policy requirements applicable to this agent

Jochanni Labs uses this to build the trigger logic. You will review and validate the trigger logic before enforcement activates.

---

### Phase 2 — Agent Instrumentation (Shadow Mode)

**Step 4: Add the submission call**

Find the point in the agent's execution path where it produces output that moves toward a consequential action. Add the submission call at that point, before the action executes.

```typescript
// Example: TypeScript agent instrumentation

const DALX_API_URL = 'https://www.decisionauthoritylayer.ai'
const DALX_KEY = process.env.DALX_SHADOW_KEY  // injected from secrets manager

interface SubmissionResult {
  id: string          // DAL-X submission ID — store this, you'll need it
  status: string      // see status values below
  created_at: string
}

async function submitToDalx(
  agentOutput: string,
  action: string,
  target: string,
  sourceRef: string,
  contextNote?: string,
): Promise<SubmissionResult> {
  const response = await fetch(`${DALX_API_URL}/api/v1/submissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DALX_KEY}`,
      'Content-Type': 'application/json',
      'X-Request-Id': crypto.randomUUID(),  // optional but aids log correlation
    },
    body: JSON.stringify({
      submitter:         'treasury-agent-v1',      // stable agent identifier
      output_content:    agentOutput,              // what the agent proposed
      input_context:     contextNote ?? null,      // optional: upstream context
      execution_intent: {
        action: action,   // e.g. 'payment_transfer'
        target: target,   // e.g. 'core-banking-system'
      },
      source_identifier: sourceRef,               // your internal transaction/job ID
      idempotency_key:   sourceRef,               // prevents duplicate submissions on retry
      metadata: {
        // add structured fields here for trigger rule matching
        // e.g., amount: 47500.00 (numeric — enables metadata_equality routing rules)
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`DAL-X submission failed: ${err.error} — ${err.message}`)
  }

  return response.json()
}
```

**Submission status values returned:**

| Status | Meaning | What to do |
|--------|---------|------------|
| `auto_released` | Auto-approved by rule — authorization available immediately | Call GET /api/v1/submissions/:id to retrieve authorization_id |
| `auto_blocked` | Blocked by rule — no authorization will be issued | Halt execution, log reason |
| `needs_review` | In human review queue | Await decision (poll or webhook) |
| `high_risk` | High-risk, in review queue | Await decision |
| `escalated` | Escalated — requires elevated reviewer | Await decision |

> **During shadow mode:** All statuses are returned but no execution is blocked. Calibration data accumulates in the DAL-X workspace. The review queue is visible in the DAL-X web application but no downstream effect occurs. If the submission call itself fails (network error, DAL-X 5xx) in shadow mode, log the error and allow existing execution to continue.

---

**Step 5: Handle idempotency on retries**

If your agent retries on transient failures, use `idempotency_key` to prevent duplicate submissions. DAL-X deduplicates on this key within a 24-hour window per API key.

- Same `idempotency_key` + same payload → returns the original submission record (HTTP 200)
- Same `idempotency_key` + different payload → returns HTTP 409 `idempotency_key_collision`

Use a stable, unique value per logical action attempt (your internal transaction or job reference ID works well).

---

**Step 6: Handle rate limiting**

DAL-X returns `429` when the rate limit is exceeded. The response includes `Retry-After` and `X-RateLimit-*` headers.

```typescript
async function submitWithRetry(/* same params */): Promise<SubmissionResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(...)
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') ?? '5')
      await sleep(retryAfter * 1000)
      continue
    }
    
    if (!response.ok) throw new Error(...)
    return response.json()
  }
  throw new Error('DAL-X rate limit: max retries exceeded')
}
```

---

### Phase 3 — Authority Decision Handling

**Step 7: Retrieve the authorization_id after approval**

When a submission is authorized, DAL-X issues an `authorization_id` (UUID). This is the value your integration passes as `authorization_id` in the `enforcement/execute` call. There is no step where your integration calls a "fetch decision" or "approve" endpoint — the reviewer acts in the DAL-X web application and the authorization is issued there. Your integration retrieves the result.

**Path A — Submission auto-released (no human review required)**

Call `GET /api/v1/submissions/:id` to retrieve the authorization:

```http
GET https://www.decisionauthoritylayer.ai/api/v1/submissions/:id
Authorization: Bearer dalx_<key>
```

**Response when released:**
```json
{
  "id": "submission-uuid",
  "status": "approved",
  "execution_status": "released_for_execution",
  "execution_authorization": {
    "authorization_id": "3e7f8d9a-1234-5678-abcd-ef0123456789",
    "status": "active",
    "expires_at": "2026-08-23T01:15:00.000Z",
    "consumed_at": null
  }
}
```

Store `execution_authorization.authorization_id`. This is your `authorization_id` for the `enforcement/execute` call.

**Path B — Submission requires human review**

The reviewer acts in the DAL-X web application. Your integration is notified via webhook or polling when the decision is made.

---

**Webhook option (recommended for production)**

Register a webhook endpoint in the DAL-X workspace (Settings → Webhooks). DAL-X POSTs a decision event to your endpoint when the reviewer acts.

**Verified event types:**

| Event type | Meaning |
|------------|---------|
| `decision.approved` | Submission approved — authorization issued |
| `decision.rejected` | Submission rejected — no authorization |
| `decision.escalated` | Submission escalated to elevated reviewer |
| `decision.revision_requested` | Reviewer requested revision |
| `decision.auto_approved` | Auto-approved by rule |
| `decision.auto_blocked` | Blocked by rule at intake |

**Verified webhook payload structure:**

```typescript
interface DecisionWebhookPayload {
  event:           string   // one of the event types above
  organization_id: string
  data: {
    review_item_id:     string   // use this to call GET /submissions/:id
    decision_record_id: string
    source_identifier:  string   // your original source_identifier from the submission
    submitter_identity: string
    severity:           string
    decided_at:         string   // ISO 8601
    output_content:     string   // the original agent output
    reviewer: {
      kind:    string            // 'human' | 'auto'
      user_id: string | null
    }
  }
  // NOT included: execution_token, authorization_id, reason
}
```

**Webhook signature verification (required before acting on any event):**

Every delivery includes the header `X-DAL-Signature: sha256=<hex>`. The value is an HMAC-SHA256 of the raw request body, keyed with the webhook signing secret configured in your DAL-X workspace.

```typescript
import crypto from 'crypto'

function verifyWebhookSignature(
  rawBody:   string,  // raw string body before JSON.parse
  header:    string,  // full value of X-DAL-Signature header, e.g. "sha256=abc123..."
  secret:    string,  // webhook signing secret from DAL-X workspace settings
): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(header),
    Buffer.from(expected),
  )
}

// In your webhook handler:
app.post('/webhooks/dalx', express.raw({ type: 'application/json' }), (req, res) => {
  const valid = verifyWebhookSignature(
    req.body.toString(),
    req.headers['x-dal-signature'] as string,
    process.env.DALX_WEBHOOK_SECRET!,
  )
  if (!valid) {
    return res.status(401).send('Invalid signature')
  }
  const payload: DecisionWebhookPayload = JSON.parse(req.body.toString())
  // process asynchronously, respond immediately
  res.status(200).send('OK')
  processDecisionEvent(payload).catch(console.error)
})
```

Reject any delivery where the signature does not verify. Do not act on the payload.

**Webhook retry schedule:**

DAL-X retries failed deliveries (non-2xx response or no response within 30 seconds) on this schedule:

| Attempt | Delay after previous failure |
|---------|------------------------------|
| 1 | Immediate (on decision) |
| 2 | 5 minutes |
| 3 | 15 minutes |
| 4 | 60 minutes |
| 5 | 240 minutes → `dead_letter` if fails |

After 5 total attempts the event is marked `dead_letter`. Manual re-delivery is not available. Monitor the DAL-X system events log for `webhook.delivery_failed` and `webhook.dead_lettered` entries.

Each delivery includes these additional headers:

| Header | Value |
|--------|-------|
| `X-DAL-Delivery-ID` | Unique delivery ID — use to deduplicate retries |
| `X-DAL-Event` | Event type (e.g., `decision.approved`) |
| `X-DAL-Attempt-Number` | Attempt number (1–5) |

Process events idempotently using `X-DAL-Delivery-ID` — the same delivery ID will be reused on retries.

**On `decision.approved`: retrieve the authorization_id**

The webhook payload does not include the `authorization_id`. After receiving a `decision.approved` event, call GET /submissions/:id using the `review_item_id` from the payload:

```typescript
async function onDecisionApproved(payload: DecisionWebhookPayload) {
  const submissionId = payload.data.review_item_id

  const response = await fetch(
    `${DALX_API_URL}/api/v1/submissions/${submissionId}`,
    { headers: { 'Authorization': `Bearer ${DALX_KEY}` } },
  )
  const submission = await response.json()

  if (submission.execution_authorization?.status === 'active') {
    const authorizationId = submission.execution_authorization.authorization_id
    // Store authorizationId with the pending action record
    await db.pendingActions.update(
      { dalxSubmissionId: submissionId },
      {
        dalxAuthorizationId: authorizationId,
        tokenExpiresAt:      submission.execution_authorization.expires_at,
        dalxStatus:          'authorized',
      },
    )
  }
}
```

---

**Polling option (lower-throughput flows)**

Poll `GET /api/v1/submissions/:id` on an interval. When `execution_authorization` appears with `status: "active"`, extract the `authorization_id`.

```typescript
async function pollForAuthorization(submissionId: string): Promise<string> {
  const terminalStatuses = ['auto_blocked', 'rejected', 'escalated_pending']

  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(10_000)  // poll every 10 seconds

    const response = await fetch(
      `${DALX_API_URL}/api/v1/submissions/${submissionId}`,
      { headers: { 'Authorization': `Bearer ${DALX_KEY}` } },
    )
    const submission = await response.json()

    if (submission.execution_authorization?.status === 'active') {
      return submission.execution_authorization.authorization_id
    }

    if (terminalStatuses.includes(submission.execution_status)) {
      throw new Error(`DAL-X submission ${submissionId} denied: ${submission.execution_status}`)
    }
  }
  throw new Error(`DAL-X authorization timeout for submission ${submissionId}`)
}
```

---

**Application design requirement for enforcement mode:**

If your agent-to-execution flow is currently synchronous (the agent calls, waits, and executes in one thread), you must redesign this for enforcement:

1. Agent submits to DAL-X — receives submission ID.
2. Agent (or calling service) releases the synchronous request. Store submission ID + pending action in durable state (database, queue).
3. On webhook notification or polling confirmation that the decision is `approved`, retrieve the `authorization_id` from `GET /submissions/:id`.
4. Resume the execution path with the `authorization_id`. Validate at the downstream boundary.

This redesign is scoped during the shadow mode period. Do not assume it is a one-day task if your existing flow is synchronous.

---

### Phase 4 — Enforcement Gate Integration

**Step 8: Add the enforcement gate at the downstream execution boundary**

This is the gate. It must run before the downstream system executes. Use `POST /api/v1/enforcement/execute` — this is DAL-X's mandatory enforcement gateway. It validates authority, creates an execution receipt, detects drift, and transitions execution state. Every attempt produces a full audit trail regardless of outcome.

```typescript
const DALX_ENFORCEMENT_KEY = process.env.DALX_ENFORCEMENT_KEY

interface EnforcementResult {
  result:              'accepted' | 'rejected'
  execution_allowed:   boolean
  reason:              string
  drift_event_created: boolean
  receipt_id:          string | null
  downstream_event_id: string | null
  correlation_id:      string
}

async function enforceWithDalx(
  submissionId:    string,   // execution_request_id — the DAL-X submission UUID
  agentKey:        string,
  executionTarget: string,
  attemptedAction: string,
  authorizationId: string,   // authorization_id UUID from GET /submissions/:id
): Promise<EnforcementResult> {
  const response = await fetch(`${DALX_API_URL}/api/v1/enforcement/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DALX_ENFORCEMENT_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_key:            agentKey,
      execution_request_id: submissionId,    // the DAL-X submission UUID
      execution_target:     executionTarget,
      attempted_action:     attemptedAction,
      request_origin:       'dalx-enforcement-gateway',
      authorization_id:     authorizationId, // UUID — alternative to execution_token
    }),
  })

  if (!response.ok) {
    // Treat any non-200 as enforcement failure — block execution
    throw new Error(`DAL-X enforcement error: ${response.status}`)
  }

  return response.json()
}

// Usage at the downstream execution boundary:
async function executePendingAction(pendingAction: PendingAction) {
  const enforcement = await enforceWithDalx(
    pendingAction.dalxSubmissionId,
    pendingAction.agentKey,
    pendingAction.target,
    pendingAction.action,
    pendingAction.dalxAuthorizationId,
  )

  if (!enforcement.execution_allowed) {
    throw new Error(`DAL-X execution blocked: ${enforcement.reason}`)
    // Log receipt_id and drift_event_created. Do not proceed.
  }

  // Proceed with downstream execution
  await downstreamSystem.execute(pendingAction)
  // DAL-X proves: enforcement gateway accepted the authorization for this request.
  // Your downstream system's response is the proof that execution occurred.
}
```

**What `enforcement/execute` proves:**

DAL-X records that its enforcement gateway accepted the authorization — authority was valid, scope matched, the token was not consumed or expired, and drift checks passed. This creates an execution receipt (`receipt_id`) and transitions the submission state to `execution_completed`.

DAL-X does not record what your downstream system did after you called it. The receipt proves the enforcement gate ran and accepted the request. Your downstream system's response proves execution completed.

**Rejection reasons from the enforcement gateway:**

| Reason in response | Cause |
|--------------------|-------|
| `No execution token provided...` | Neither `execution_token` nor `authorization_id` supplied |
| `Authorization ID not found...` | UUID doesn't exist or wrong workspace |
| `Execution authorization was revoked` | Admin revoked the authorization |
| `Execution token expired at...` | 15-minute TTL exceeded |
| `Token has already been consumed` | Single-use authorization already used |
| `Requested action...does not match authorized action` | Scope mismatch — action |
| `Requested target...does not match authorized target` | Scope mismatch — target |
| `Execution request is not released for execution` | Authorization exists but submission not yet approved |
| `No active enforcement contract found for target` | Downstream enforcement contract missing or inactive |

**On any rejection: execution must be blocked. No exceptions. Log `receipt_id`, `reason`, and `drift_event_created`.**

---

**Step 9: Handle token expiry for long-running workflows**

If more than 15 minutes may elapse between authorization issuance and gate enforcement (e.g., batch jobs, scheduled workflows), refresh the authorization before it expires. The refresh endpoint now accepts either `execution_token` (signed string) or `authorization_id` (UUID).

Use `authorization_id` in the human review path — this is now supported:

```http
POST https://www.decisionauthoritylayer.ai/api/v1/enforcement/refresh-token
Authorization: Bearer dalx_<enforcement-key>
Content-Type: application/json

{
  "authorization_id": "3e7f8d9a-...",
  "reason": "Batch processing window exceeds standard TTL"
}
```

Or using the signed token (auto-released path):

```http
POST https://www.decisionauthoritylayer.ai/api/v1/enforcement/refresh-token
Authorization: Bearer dalx_<enforcement-key>
Content-Type: application/json

{
  "execution_token": "dalx_exec_eyJ...",
  "reason": "Batch processing window exceeds standard TTL"
}
```

**Response:**
```json
{
  "success": true,
  "authorization_id": "new-uuid",
  "prior_authorization_id": "old-uuid",
  "execution_token": "dalx_exec_eyJ...new...",
  "token_expires_at": "2026-08-23T01:15:00.000Z",
  "token_expires_in_seconds": 900
}
```

Constraints:
- Cannot refresh a consumed, revoked, or already-expired authorization
- If new drift signals have been detected since the original approval, the refresh is blocked until a reviewer re-approves
- The prior authorization is atomically invalidated when the new one is issued
- The response returns both the new `authorization_id` and the new `execution_token` signed string — use the `authorization_id` for subsequent `enforcement/execute` calls

---

### Phase 5 — Acceptance Testing

**Step 10: Complete shadow calibration**

Before acceptance testing begins, confirm all of the following with the Jochanni Labs team:

- Trigger logic has been reviewed and approved by the enterprise risk/compliance function responsible for this agent
- Shadow submissions have accumulated sufficient volume to confirm the trigger logic behaves as intended
- Review team has observed the queue and understands the review workflow
- Enforcement integration (async redesign) is complete and deployed to a test environment

---

**Step 11: Create the enforcement API key**

Do not reuse the shadow key. Create a separate enforcement key with `enforcement` scope and `shadow_mode: false`:

```http
POST https://www.decisionauthoritylayer.ai/api/app/api-keys
Authorization: Bearer <admin-session-token>
Content-Type: application/json

{
  "name": "treasury-agent-enforcement",
  "scopes": { "submit": true, "enforcement": true },
  "shadow_mode": false,
  "enforcement_categories": ["payment_transfer"]
}
```

The `enforcement_categories` array scopes which `execution_intent.action` values this key governs. Set this to exactly the action categories approved for enforcement during calibration.

Store the cleartext key as `DALX_ENFORCEMENT_KEY` in your secrets manager. Configure it in the test environment only at this stage — do not deploy to production systems yet.

---

**Step 12: Run the end-to-end acceptance test**

The acceptance test must prove the complete authority chain. All tests must pass before proceeding to production deployment.

1. Agent generates a test payment output within the pilot scope
2. Submit to DAL-X via `POST /api/v1/submissions` — confirm receipt with a submission ID
3. Submission appears in the DAL-X review queue — confirm in the web application
4. Reviewer approves the submission in the DAL-X web application with a reason
5. Webhook fires (or poll confirms) — call `GET /api/v1/submissions/:id` — confirm `execution_authorization.status: "active"` and store the `authorization_id`
6. Call `POST /api/v1/enforcement/execute` with the `authorization_id` — confirm `execution_allowed: true` and record the `receipt_id`
7. Downstream execution proceeds in the test environment
8. Confirm an execution receipt is recorded in DAL-X (`receipt_id` visible on the execution detail page)
9. Confirm the governance timeline shows the complete chain: submission → evaluation → review opened → decision approved → authorization issued → enforcement accepted → execution receipt

**Rejection test (required):**

1. Attempt enforcement with an `authorization_id` from a submission whose `attempted_action` does not match the approved action
2. Confirm `execution_allowed: false` with a scope mismatch reason
3. Confirm a rejection receipt is recorded in DAL-X

**No-authorization test (required):**

1. Call `POST /api/v1/enforcement/execute` with neither `execution_token` nor `authorization_id`
2. Confirm `execution_allowed: false` with `missing_token_attempt` reason
3. Confirm your enforcement gate code blocks downstream execution before reaching the system

**Gate: all three tests must pass before proceeding to Step 13.**

---

### Phase 6 — Production Enforcement Deployment

**Step 13: Activate enforcement on the key**

After all acceptance tests pass, activate the enforcement key. This transition is irreversible — downgrade to shadow is not permitted once enforcement is active.

```http
POST https://www.decisionauthoritylayer.ai/api/app/api-keys/:keyId/activate-enforcement
Authorization: Bearer <admin-session-token>
Content-Type: application/json

{
  "confirmation": true
}
```

This requires Admin or Owner role. The activation event records:
- Who activated it
- When it was activated
- Which trigger rule versions were active at activation time (governance snapshot)

---

**Step 14: Deploy enforcement to production**

1. Update `DALX_SHADOW_KEY` references in production configuration to use `DALX_ENFORCEMENT_KEY`
2. Confirm the enforcement gate (Step 8) is deployed to the production downstream execution boundary
3. Deploy in a controlled window — avoid peak trading hours or high-throughput windows
4. Monitor the DAL-X workspace system events and review queue immediately after deployment

---

## 6. Cloud Implications

### 6.1 DAL-X is a hosted service

DAL-X runs on cloud infrastructure managed by Jochanni Labs. As the integrating enterprise, your cloud responsibility is limited to:

- Secrets management for API keys (use your existing secrets manager)
- Networking outbound to `www.decisionauthoritylayer.ai` (HTTPS/443)
- If using webhooks: inbound webhook receiver endpoint within your cloud environment
- Durable storage of pending action state while awaiting authority decisions (your existing database)

### 6.2 Async flow state management

If your execution flow requires async redesign (see Step 7), the pending action state must survive process restarts. Use durable storage — a database table or a managed queue (SQS, Azure Service Bus, Google Pub/Sub) — not in-memory state.

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
- Respond with HTTP 200 within 30 seconds
- Verify the `X-DAL-Signature: sha256=<hex>` header before acting on the payload (see Step 7 for implementation)
- Process events idempotently using `X-DAL-Delivery-ID` (DAL-X retries failed deliveries per the schedule in Step 7)

### 6.4 Scalability

Submission calls add one outbound HTTPS round-trip per governed agent action. Token validation calls add one outbound HTTPS round-trip at the execution boundary. For agents initiating hundreds of actions per minute, account for this latency in SLA calculations.

DAL-X rate limit: 100 requests/minute (refill rate) per API key. If your agent generates more than this, contact Jochanni Labs before pilot to discuss key-level rate allocation.

### 6.5 Data residency

Submission payloads including `output_content`, `input_context`, and `metadata` are stored within DAL-X's hosted database. Confirm whether this is compatible with your data residency requirements before submitting data with PII, PCI scope content, or regulated data. Use data references (IDs) in submission fields and keep sensitive content in systems within your data boundary where data residency is a constraint.

### 6.6 Disaster recovery

DAL-X availability is the responsibility of Jochanni Labs. If DAL-X is unavailable, submission calls and token validation calls will fail with network errors or 5xx responses.

Your application must handle DAL-X unavailability differently depending on mode:

**Shadow mode** (enforcement gate not yet live):
- Log the outage with a `DALX_UNAVAILABLE` error code
- Allow existing execution to continue — shadow mode observes only; it does not block
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

- Verify the submission payload includes all required fields
- Verify `idempotency_key` is populated
- Verify retries on `429` respect `Retry-After`
- Verify that a failed submission call in shadow mode (network error, 5xx) logs and continues — does not block
- Verify that a failed submission call in enforcement mode (network error, 5xx) blocks the governed action

### 7.2 Unit tests for the enforcement gate

- Verify that `ACCEPTED` response permits execution to proceed
- Verify that `REJECTED` response blocks execution and logs the rejection reason
- Verify that a DAL-X API error (non-200 response) is treated as a rejection (fail closed)
- Verify that a missing `authorization_id` (empty or null) produces a controlled rejection, not an unhandled exception

### 7.3 Unit tests for webhook handling

- Verify that a delivery with a valid `X-DAL-Signature` is processed
- Verify that a delivery with an invalid or missing signature is rejected with 401 — no downstream action taken
- Verify that `decision.approved` events trigger a `GET /submissions/:id` call to retrieve the `authorization_id`
- Verify that the same event delivered twice (retry scenario) is processed idempotently

### 7.4 Integration tests (requires DAL-X test workspace)

| Test | Expected result |
|------|----------------|
| Submit a governed action | Returns submission ID and status |
| Submit same action twice with same `idempotency_key` | Returns original submission (HTTP 200) |
| Submit same `idempotency_key` with different payload | Returns `409 idempotency_key_collision` |
| GET /submissions/:id after auto-release | Returns `execution_authorization.authorization_id` |
| Validate a valid active authorization_id | Returns `ACCEPTED` |
| Validate an authorization_id with wrong action | Returns `REJECTED` with scope mismatch |
| Validate an authorization_id with wrong target | Returns `REJECTED` with scope mismatch |
| Validate a consumed authorization_id | Returns `REJECTED` — already used |
| Validate an authorization_id after 15-minute TTL | Returns `REJECTED` — expired |
| Attempt enforcement gate call with null authorization_id | Gate blocks execution |

### 7.5 Acceptance test (required before production enforcement activation)

Run the full end-to-end loop described in Step 14. All nine steps must produce the expected result before enforcement is activated in production.

The governance timeline visible in the DAL-X web application is the proof artifact. Export it for the pilot evidence report.

---

## 8. Troubleshooting Guide

### Submission returns `401 unauthenticated`

**Cause:** Missing, malformed, or revoked API key.

Check:
- Authorization header format: must be `Bearer dalx_<key>` — no extra spaces
- Key has not been revoked (visible in DAL-X workspace under Settings → API Keys)
- Key prefix in the request matches the key stored in your secrets manager
- If recently rotated: confirm the new key is deployed to the correct service instance

### Submission returns `403 forbidden` with `missing_submit_scope`

**Cause:** The API key does not have `submit` scope.

Fix: Create a new key with `"scopes": { "submit": true }` or use the correct key.

### Submission returns `413 payload_too_large`

**Cause:** `output_content` > 256 KB, `input_context` > 64 KB, or `metadata` > 8 KB serialized.

Fix: Truncate or summarize the agent's output content. Store the full output in your own system and submit a reference ID.

### Enforcement gate returns `rejected` with scope mismatch

**Cause:** The `attempted_action` or `execution_target` in the `enforcement/execute` call does not match the values bound to the authorization at issuance.

Check:
- The `attempted_action` value must match the `execution_intent.action` submitted when the review was approved (case-sensitive)
- The `execution_target` value must match the `execution_intent.target` submitted (case-sensitive)
- Confirm the pending action table is storing and retrieving the correct `authorization_id` UUID for this specific action

### Enforcement gate returns `rejected` with token already consumed

**Cause:** The authorization was consumed by a prior `enforcement/execute` call. Authorizations are single-use. The response `reason` field confirms `consumed` status.

Check:
- Is the enforcement call being retried without checking whether the first call succeeded?
- Is the same `authorization_id` being shared across parallel execution paths?

Fix: Each governed action instance requires its own authorization. Do not reuse `authorization_id` values across retries if the first call may have succeeded.

### Enforcement gate returns `not_found` for authorization

**Cause:** The `authorization_id` passed to `enforcement/execute` does not match any authorization record in this workspace.

Check:
- Confirm you are passing the `authorization_id` UUID (e.g., `3e7f8d9a-1234-5678-abcd-ef0123456789`) — not the `execution_token` signed string (`dalx_exec_eyJ...`)
- Confirm the `authorization_id` was retrieved from `GET /api/v1/submissions/:id` under `execution_authorization.authorization_id`

### Authority decision endpoint returns `drift_acknowledgement_required`

**Cause:** Drift signals were detected against this agent's behavioral baseline. The approval requires explicit acknowledgement.

Fix: Include `"drift_acknowledgement": true` in the authority-decision request body after the reviewer has examined the drift evidence in the DAL-X review workbench.

### Webhook not received after reviewer approves

**Cause:** Webhook destination is misconfigured, unreachable, or the event type is not subscribed.

Check:
- Webhook destination URL is accessible from DAL-X (test with a tool like webhook.site during setup)
- The `decision.approved` event type is included in the webhook destination's subscribed events
- Firewall rules permit inbound traffic from DAL-X delivery IPs on port 443
- Check DAL-X system events log for `webhook.delivery_failed` entries
- Confirm the receiver is responding with HTTP 200 within 10 seconds

### Where to find logs and diagnostic information

| Information | Location |
|-------------|----------|
| Submission status and evaluation | DAL-X review queue and workbench |
| Decision records | DAL-X review workbench → Decision tab |
| Execution authorizations | DAL-X → `/token/:id` |
| Governance timeline | DAL-X review workbench → Timeline tab |
| System events (auth failures, rate limits, webhook failures) | DAL-X → Admin → System Events |
| Drift signals | DAL-X review workbench → Drift tab |
| API-side logs | Your service logs — log the `X-Request-Id` header you send with each request |

---

## 9. Maintenance and Monitoring

### 9.1 Key rotation

Rotate API keys on your standard credential rotation schedule (recommended: 90 days or on personnel change).

Rotation procedure:
1. Create a new key with the same scopes
2. Update `DALX_ENFORCEMENT_KEY` in your secrets manager
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
| Token validation rejections — scope mismatch | Any | Action or target mismatch; may indicate agent behavioral drift |
| Token validation rejections — expired | Any | Workflow exceeds 15-minute TTL; consider token refresh |
| Pending action age | > 60 minutes | Submission awaiting review without progress; check reviewer queue |
| Webhook delivery failures | Any | Connectivity or configuration issue |
| DAL-X drift events (open, unreviewed) | Any | Agent behavioral deviation requiring reviewer attention |

### 9.3 Review queue health

The human review queue must have active, available reviewers. If the queue accumulates items without decisions:

- Submissions remain in `needs_review` status
- Governed agent actions remain pending (for flows designed to await authority)
- No execution authorizations are issued for queued items

Monitor queue depth in the DAL-X workspace. Alert your operations team if items age beyond your defined SLA for authority decisions.

### 9.4 Trigger rule version changes

Trigger logic is versioned. Any change to trigger rules is recorded in DAL-X with a new version. Before trigger rule changes are applied to the production workspace:

- Review the proposed change with the Jochanni Labs team
- Use the dry-run tool (`POST /api/app/dry-run`, admin/owner only) to re-evaluate existing submissions against the proposed rule change — it returns a diff of what fired originally versus what would fire now, without modifying any records
- Confirm that the change does not reclassify actions that should remain auto-released as `needs_review`, or vice versa
- Record the approval of the trigger rule version change in the DAL-X governance timeline

### 9.5 Periodic evidence review

The DAL-X pilot evidence report is generated at the end of the acceptance test period. For ongoing operations:

- Export the governance timeline for any regulatory inquiry that requires authority chain evidence
- Decision records are append-only and immutable — they cannot be edited or deleted
- The audit export is available via Settings → Audit Export in the DAL-X workspace, or via `GET /api/app/audit/export?format=csv|json|signed`

---

*DAL-X — No authority. No execution.*
