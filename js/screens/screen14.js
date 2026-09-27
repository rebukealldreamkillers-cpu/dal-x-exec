/* ─── Screen 14: Downstream gate tests ──────────────────────────────────── */

/*
 * Runs six gate enforcement scenarios against the simulated DAL-X gate and
 * stores results in s3.gate_tests[]. Results are generated once on first
 * visit; subsequent renders reuse the stored array.
 *
 * Scenarios 1, 2, 3, 5, 6 are structurally always rejected.
 * Scenario 4 reflects whether an authorization was issued in this simulation.
 */

/* ── Receipt ID helper ──────────────────────────────────────────────────── */

function generateReceiptId() {
  return 'RCP-' + Math.random().toString(16).substr(2, 8).toUpperCase();
}

/* ── Gate test builder (idempotent) ─────────────────────────────────────── */

function buildGateTests() {
  const existing = getState('s3.gate_tests');
  if (existing && existing.length > 0) return;

  const action         = getState('s3.submission.action')  || '';
  const target         = getState('s3.submission.target')  || '';
  const triggerOutcome = getState('s3.trigger_outcome')    || '';
  const reviewDecision = getState('s3.reviewer_decision')  || '';
  const authIssued     = Boolean(getState('s3.authorization_id'));

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

/* ── Result row card ────────────────────────────────────────────────────── */

function buildResultRow(test) {
  const row = document.createElement('div');
  row.className = 'gate-test-row';
  row.classList.add(`gate-test-row--${test.chipState}`);

  const head = document.createElement('div');
  head.className = 'gate-test-row__head';

  const name = document.createElement('div');
  name.className = 'gate-test-row__name';
  name.textContent = test.name;
  head.appendChild(name);

  head.appendChild(createStatusChip(test.chipState, test.chipLabel));

  row.appendChild(head);

  const body = document.createElement('div');
  body.className = 'gate-test-row__body';

  const reason = document.createElement('div');
  reason.className = 'gate-test-row__reason';
  reason.textContent = test.reason;
  body.appendChild(reason);

  const receipt = document.createElement('div');
  receipt.className = 'gate-test-row__receipt';
  receipt.textContent = `Receipt ${test.receipt_id}`;
  body.appendChild(receipt);

  row.appendChild(body);
  return row;
}

/* ── Mini pipeline animation ────────────────────────────────────────────── */

function buildMiniPipeline(test) {
  const outcome = test.chipState === 'accepted' ? 'accepted' : 'rejected';
  const wrap = document.createElement('div');
  wrap.className = `mini-pipeline mini-pipeline--${outcome}`;

  const agent = document.createElement('div');
  agent.className = 'mini-pipeline__node mini-pipeline__node--agent';
  agent.textContent = 'Agent';

  const conn1 = document.createElement('div');
  conn1.className = 'mini-pipeline__conn mini-pipeline__conn--in';
  const packet = document.createElement('div');
  packet.className = 'mini-pipeline__packet';
  conn1.appendChild(packet);

  const gate = document.createElement('div');
  gate.className = 'mini-pipeline__node mini-pipeline__node--gate';
  gate.textContent = 'Gate';

  const conn2 = document.createElement('div');
  conn2.className = 'mini-pipeline__conn mini-pipeline__conn--out';
  if (outcome === 'accepted') {
    const packet2 = document.createElement('div');
    packet2.className = 'mini-pipeline__packet mini-pipeline__packet--out';
    conn2.appendChild(packet2);
  }

  const down = document.createElement('div');
  down.className = 'mini-pipeline__node mini-pipeline__node--downstream';
  down.textContent = 'System';

  wrap.appendChild(agent);
  wrap.appendChild(conn1);
  wrap.appendChild(gate);
  wrap.appendChild(conn2);
  wrap.appendChild(down);

  return wrap;
}

/* ── Sequential runner ──────────────────────────────────────────────────── */

function runGateTestSequence(tests, pipelineHost, resultsHost, summaryHost, onDone) {
  let index = 0;
  const totalDelay = 1500;

  function step() {
    if (index >= tests.length) {
      if (typeof onDone === 'function') onDone();
      return;
    }
    const test = tests[index];

    /* Show the pipeline for this test */
    pipelineHost.innerHTML = '';

    const label = document.createElement('div');
    label.className = 'mini-pipeline__label';
    label.textContent = `Test ${index + 1} of ${tests.length}. ${test.name}`;
    pipelineHost.appendChild(label);

    pipelineHost.appendChild(buildMiniPipeline(test));

    /* Append the result row after a short delay */
    setTimeout(() => {
      const row = buildResultRow(test);
      row.classList.add('gate-test-row--enter');
      resultsHost.appendChild(row);
      index += 1;
      step();
    }, totalDelay);
  }

  step();

  /* When done, render summary */
  function finalize() {
    const accepted = tests.filter(t => t.chipState === 'accepted').length;
    const rejected = tests.filter(t => t.chipState !== 'accepted').length;

    summaryHost.innerHTML = '';
    const s = document.createElement('div');
    s.className = 'gate-test-summary';
    s.innerHTML =
      `<span class="gate-test-summary__num gate-test-summary__num--green">${accepted}</span> accepted `
      + `<span class="gate-test-summary__sep"></span> `
      + `<span class="gate-test-summary__num gate-test-summary__num--red">${rejected}</span> rejected`;
    summaryHost.appendChild(s);
  }

  /* Wrap onDone to include finalize */
  const origOnDone = onDone;
  onDone = () => { finalize(); if (typeof origOnDone === 'function') origOnDone(); };
}

/* ── Renderer ───────────────────────────────────────────────────────────── */

function renderScreen14() {
  buildGateTests();

  const authIssued = Boolean(getState('s3.authorization_id'));
  const tests      = getState('s3.gate_tests') || [];

  const screen = document.getElementById('screen-14');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 · Configured DAL-X simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Downstream gate tests';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent =
    'Six enforcement scenarios run against the simulated DAL-X gate.';
  screen.appendChild(subtitle);

  /* Simulation mode notice when no authorization was issued */
  if (!authIssued) {
    const demoNote = document.createElement('div');
    demoNote.className = 'callout callout--warning';
    demoNote.style.marginBottom = 'var(--space-5)';
    demoNote.textContent =
      'No authorization was issued in this simulation path. '
      + 'Gate tests run in demonstration mode using a simulated authorization.';
    screen.appendChild(demoNote);
  }

  /* Scope limitation notice */
  const scopeNote = document.createElement('div');
  scopeNote.className = 'callout callout--info';
  scopeNote.style.marginBottom = 'var(--space-6)';
  scopeNote.textContent =
    'The simulation does not test changed amount, recipient, or complete payload. '
    + 'The current enforcement request does not document how the attempted payload '
    + 'is supplied for comparison.';
  screen.appendChild(scopeNote);

  /* Run controls */
  const runControls = document.createElement('div');
  runControls.className = 'gate-run-controls';

  const runBtn = document.createElement('button');
  runBtn.className = 'btn btn--primary';
  runBtn.textContent = 'Run gate tests';
  runControls.appendChild(runBtn);

  screen.appendChild(runControls);

  /* Pipeline host */
  const pipelineHost = document.createElement('div');
  pipelineHost.className = 'gate-pipeline-host';
  screen.appendChild(pipelineHost);

  /* Results host */
  const resultsHost = document.createElement('div');
  resultsHost.className = 'gate-results-host';
  screen.appendChild(resultsHost);

  /* Summary host */
  const summaryHost = document.createElement('div');
  summaryHost.className = 'gate-summary-host';
  screen.appendChild(summaryHost);

  runBtn.addEventListener('click', () => {
    runBtn.disabled = true;
    runBtn.textContent = 'Running';
    resultsHost.innerHTML = '';
    summaryHost.innerHTML = '';

    let index = 0;
    const stepDelay = 1500;

    function runNext() {
      if (index >= tests.length) {
        pipelineHost.innerHTML = '';
        const accepted = tests.filter(t => t.chipState === 'accepted').length;
        const rejected = tests.filter(t => t.chipState !== 'accepted').length;
        const s = document.createElement('div');
        s.className = 'gate-test-summary';
        s.innerHTML =
          `<span class="gate-test-summary__num gate-test-summary__num--green">${accepted}</span>`
          + '<span class="gate-test-summary__word"> accepted</span>'
          + '<span class="gate-test-summary__sep"></span>'
          + `<span class="gate-test-summary__num gate-test-summary__num--red">${rejected}</span>`
          + '<span class="gate-test-summary__word"> rejected</span>';
        summaryHost.appendChild(s);
        runBtn.textContent = 'Rerun gate tests';
        runBtn.disabled = false;
        return;
      }
      const test = tests[index];
      pipelineHost.innerHTML = '';
      const label = document.createElement('div');
      label.className = 'mini-pipeline__label';
      label.textContent = `Test ${index + 1} of ${tests.length}. ${test.name}`;
      pipelineHost.appendChild(label);
      pipelineHost.appendChild(buildMiniPipeline(test));

      setTimeout(() => {
        const row = buildResultRow(test);
        row.classList.add('gate-test-row--enter');
        resultsHost.appendChild(row);
        index += 1;
        runNext();
      }, stepDelay);
    }

    runNext();
  });

  /* Evidence label */
  const evidenceLine = document.createElement('p');
  evidenceLine.style.cssText =
    'margin-top:var(--space-5);font-size:var(--text-sm);color:var(--color-text-secondary);';
  evidenceLine.appendChild(document.createTextNode('Evidence '));
  evidenceLine.appendChild(createEvidenceLabel('demonstrated'));
  screen.appendChild(evidenceLine);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-13'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Continue';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen15 === 'function') renderScreen15();
    showScreen('screen-15');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen14);
