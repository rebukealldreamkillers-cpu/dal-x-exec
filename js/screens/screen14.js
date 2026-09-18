/* ─── Screen 14: Downstream Gate Tests ──────────────────────────────────── */

/*
 * Runs six gate enforcement scenarios against the simulated DAL-X gate and
 * stores results in s3.gate_tests[]. Results are generated once on first
 * visit; subsequent renders reuse the stored array.
 *
 * Scenarios 1, 2, 3, 5, 6 are structurally always rejected. They each
 * test a specific enforcement rule (missing auth, action mismatch, target
 * mismatch, already consumed, expired). Their reason text references the
 * actual authorized action and target from the submission where available.
 *
 * Scenario 4 ("Valid active authorization_id") is dynamic: it reflects
 * whether an authorization was actually issued in this simulation path.
 * If the trigger blocked the submission or a reviewer denied it, scenario 4
 * shows Rejected with a reason derived from the actual simulation outcome,
 * not a hardcoded Accepted regardless of what happened upstream.
 *
 * Each result record: { name, chipState, chipLabel, reason,
 *   execution_allowed, receipt_id, required_response, what_happens_next,
 *   showSeparationNote }
 */

/* ── Receipt ID helper ────────────────────────────────────────────────────── */

function generateReceiptId() {
  return 'RCP-' + Math.random().toString(16).substr(2, 8).toUpperCase();
}

/* ── Gate test builder (idempotent) ───────────────────────────────────────── */

function buildGateTests() {
  const existing = getState('s3.gate_tests');
  if (existing && existing.length > 0) return;

  /* Read actual simulation state */
  const action         = getState('s3.submission.action')  || '';
  const target         = getState('s3.submission.target')  || '';
  const triggerOutcome = getState('s3.trigger_outcome')    || '';
  const reviewDecision = getState('s3.reviewer_decision')  || '';
  const authIssued     = Boolean(getState('s3.authorization_id'));

  /* Build the reason for scenario 4 when no auth was issued */
  function noAuthReason() {
    if (triggerOutcome === 'blocked')
      return 'The trigger evaluation blocked this submission. No authorization was issued.';
    if (reviewDecision === 'denied')
      return 'The reviewer denied this submission. No authorization was issued.';
    if (reviewDecision === 'escalated')
      return 'The submission was escalated and remains unresolved. No authorization was issued in this simulation.';
    if (reviewDecision === 'revision_requested')
      return 'The reviewer requested revision. No authorization was issued.';
    return 'No authorization was issued in this simulation path.';
  }

  const actionRef = action ? `"${action}"` : 'the authorized action';
  const targetRef = target ? `"${target}"` : 'the authorized target';

  const tests = [
    {
      name:               'Missing authorization_id',
      chipState:          'rejected',
      chipLabel:          'Rejected',
      reason:             'No execution authorization was provided. DAL-X requires an authorization_id on every enforcement request.',
      execution_allowed:  'No',
      receipt_id:         generateReceiptId(),
      required_response:  'Submit the proposed execution for DAL-X evaluation.',
      what_happens_next:  'The downstream system is not called.',
      showSeparationNote: false,
    },
    {
      name:               'Wrong action',
      chipState:          'rejected',
      chipLabel:          'Rejected',
      reason:             `The attempted action does not match the authorized action. The authorization was issued for ${actionRef}.`,
      execution_allowed:  'No',
      receipt_id:         generateReceiptId(),
      required_response:  'Submit the changed action as a new proposed execution.',
      what_happens_next:  'The downstream system is not called.',
      showSeparationNote: false,
    },
    {
      name:               'Wrong target',
      chipState:          'rejected',
      chipLabel:          'Rejected',
      reason:             `The target does not match the authorized target. The authorization was issued for ${targetRef}.`,
      execution_allowed:  'No',
      receipt_id:         generateReceiptId(),
      required_response:  'Submit the changed target as a new proposed execution.',
      what_happens_next:  'The downstream system is not called.',
      showSeparationNote: false,
    },
    /* Scenario 4: outcome is driven by actual simulation state */
    authIssued ? {
      name:               'Valid active authorization_id',
      chipState:          'accepted',
      chipLabel:          'Accepted',
      reason:             'The authorization is active, the action and target match, and the authorization has not been consumed or expired.',
      execution_allowed:  'Yes',
      receipt_id:         generateReceiptId(),
      required_response:  'None.',
      what_happens_next:  'The downstream call may proceed.',
      showSeparationNote: true,
    } : {
      name:               'Valid active authorization_id',
      chipState:          'rejected',
      chipLabel:          'Rejected',
      reason:             noAuthReason(),
      execution_allowed:  'No',
      receipt_id:         generateReceiptId(),
      required_response:  'Ensure the submission is approved and an authorization_id is issued before presenting at the enforcement gate.',
      what_happens_next:  'The downstream system is not called.',
      showSeparationNote: false,
    },
    {
      name:               'Reused authorization_id',
      chipState:          'rejected',
      chipLabel:          'Rejected',
      reason:             'The authorization_id was already consumed when the gate accepted the previous request. Each authorization is single-use.',
      execution_allowed:  'No',
      receipt_id:         generateReceiptId(),
      required_response:  'Create a new submission and obtain new authority.',
      what_happens_next:  'The downstream system is not called.',
      showSeparationNote: false,
    },
    {
      name:               'Expired authorization_id',
      chipState:          'rejected',
      chipLabel:          'Rejected',
      reason:             'The authorization_id was not presented before its expiration window closed. Time-bound enforcement prevents replay attacks.',
      execution_allowed:  'No',
      receipt_id:         generateReceiptId(),
      required_response:  'Create a new submission and obtain new authority.',
      what_happens_next:  'The downstream system is not called.',
      showSeparationNote: false,
    },
  ];

  setState('s3.gate_tests', tests);
}

/* ── Scenario card builder ────────────────────────────────────────────────── */

function buildScenarioCard(test) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginBottom = 'var(--space-5)';

  /* Title row: name + status chip */
  const titleRow = document.createElement('div');
  titleRow.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;'
    + 'margin-bottom:var(--space-4);gap:var(--space-3);';

  const nameEl = document.createElement('div');
  nameEl.className = 'card__title';
  nameEl.style.margin = '0';
  nameEl.textContent = test.name;
  titleRow.appendChild(nameEl);
  titleRow.appendChild(createStatusChip(test.chipState, test.chipLabel));
  card.appendChild(titleRow);

  /* Six result fields */
  const fields = [
    ['Reason',             test.reason],
    ['Execution allowed',  test.execution_allowed],
    ['Receipt identifier', test.receipt_id],
    ['Required response',  test.required_response],
    ['What happens next',  test.what_happens_next],
  ];
  fields.forEach(([key, val]) => card.appendChild(createLabelledField(key, val)));

  /* Separation note for valid scenario */
  if (test.showSeparationNote) {
    const note = document.createElement('p');
    note.style.cssText =
      'margin-top:var(--space-4);font-size:var(--text-sm);'
      + 'color:var(--color-text-secondary);';
    note.textContent =
      'DAL-X gate acceptance does not prove that a real downstream system '
      + 'completed execution.';
    card.appendChild(note);
  }

  return card;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen14() {
  buildGateTests();

  const authIssued = Boolean(getState('s3.authorization_id'));
  const tests      = getState('s3.gate_tests') || [];

  const screen = document.getElementById('screen-14');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 · Configured DAL-X Simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Downstream Gate Tests';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent = 'The simulation runs:';
  screen.appendChild(subtitle);

  /* Simulation mode notice when no authorization was issued */
  if (!authIssued) {
    const demoNote = document.createElement('div');
    demoNote.className = 'callout callout--warning';
    demoNote.style.marginBottom = 'var(--space-5)';
    demoNote.textContent =
      'No authorization was issued in this simulation path. '
      + 'Gate tests are shown in demonstration mode using a simulated authorization.';
    screen.appendChild(demoNote);
  }

  /* Scope limitation notice (spec-required) */
  const scopeNote = document.createElement('div');
  scopeNote.className = 'callout callout--info';
  scopeNote.style.marginBottom = 'var(--space-6)';
  scopeNote.textContent =
    'The simulation does not test changed amount, recipient, or complete payload. '
    + 'The current enforcement request does not document how the attempted payload '
    + 'is supplied for comparison.';
  screen.appendChild(scopeNote);

  /* Scenario cards */
  tests.forEach(test => screen.appendChild(buildScenarioCard(test)));

  /* Evidence label */
  const evidenceLine = document.createElement('p');
  evidenceLine.style.cssText =
    'margin-top:var(--space-5);font-size:var(--text-sm);'
    + 'color:var(--color-text-secondary);';
  evidenceLine.appendChild(document.createTextNode('Evidence: '));
  evidenceLine.appendChild(createEvidenceLabel('demonstrated'));
  screen.appendChild(evidenceLine);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-13'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen15 === 'function') renderScreen15();
    showScreen('screen-15');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen14);
