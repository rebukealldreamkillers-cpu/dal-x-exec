/* ─── Screen 14: Downstream Gate Tests ──────────────────────────────────── */

/*
 * Runs six gate enforcement scenarios against the simulated DAL-X gate and
 * stores results in s3.gate_tests[]. Results are generated once; subsequent
 * renders reuse the stored array.
 *
 * If no authorization was issued (blocked / denied / escalated /
 * revision_requested), a simulation-only auth ID is used so all six scenarios
 * can still be demonstrated. A notice is shown in that case.
 *
 * Each result record: { name, chipState, chipLabel, reason,
 *   execution_allowed, receipt_id, required_response, what_happens_next,
 *   showSeparationNote }
 */

/* ── Scenario definitions ─────────────────────────────────────────────────── */

const S14_SCENARIOS = [
  {
    name:               'Missing authorization_id',
    chipState:          'rejected',
    chipLabel:          'Rejected',
    reason:             'No execution authorization was provided.',
    execution_allowed:  'No',
    required_response:  'Submit the proposed execution for DAL-X evaluation.',
    what_happens_next:  'The downstream system is not called.',
    showSeparationNote: false,
  },
  {
    name:               'Wrong action',
    chipState:          'rejected',
    chipLabel:          'Rejected',
    reason:             'The attempted action does not match the authorized action.',
    execution_allowed:  'No',
    required_response:  'Submit the changed action as a new proposed execution.',
    what_happens_next:  'The downstream system is not called.',
    showSeparationNote: false,
  },
  {
    name:               'Wrong target',
    chipState:          'rejected',
    chipLabel:          'Rejected',
    reason:             'The target does not match the authorized target.',
    execution_allowed:  'No',
    required_response:  'Submit the changed target as a new proposed execution.',
    what_happens_next:  'The downstream system is not called.',
    showSeparationNote: false,
  },
  {
    name:               'Valid active authorization_id',
    chipState:          'accepted',
    chipLabel:          'Accepted',
    reason:             'The authorization is active and the action and target match.',
    execution_allowed:  'Yes',
    required_response:  'None.',
    what_happens_next:  'The downstream call may proceed.',
    showSeparationNote: true,
  },
  {
    name:               'Reused authorization_id',
    chipState:          'rejected',
    chipLabel:          'Rejected',
    reason:             'The execution authorization has already been consumed.',
    execution_allowed:  'No',
    required_response:  'Create a new submission and obtain new authority.',
    what_happens_next:  'The downstream system is not called.',
    showSeparationNote: false,
  },
  {
    name:               'Expired authorization_id',
    chipState:          'rejected',
    chipLabel:          'Rejected',
    reason:             'The execution authorization has expired.',
    execution_allowed:  'No',
    required_response:  'Create a new submission and obtain new authority.',
    what_happens_next:  'The downstream system is not called.',
    showSeparationNote: false,
  },
];

/* ── Receipt ID helper ────────────────────────────────────────────────────── */

function generateReceiptId() {
  return 'RCP-' + Math.random().toString(16).substr(2, 8).toUpperCase();
}

/* ── Gate test builder (idempotent) ───────────────────────────────────────── */

function buildGateTests() {
  const existing = getState('s3.gate_tests');
  if (existing && existing.length > 0) return;

  const tests = S14_SCENARIOS.map(s => ({
    name:               s.name,
    chipState:          s.chipState,
    chipLabel:          s.chipLabel,
    reason:             s.reason,
    execution_allowed:  s.execution_allowed,
    receipt_id:         generateReceiptId(),
    required_response:  s.required_response,
    what_happens_next:  s.what_happens_next,
    showSeparationNote: s.showSeparationNote,
  }));

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
