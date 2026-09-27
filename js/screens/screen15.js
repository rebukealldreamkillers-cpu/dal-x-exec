/* ─── Screen 15: Configured simulation result ───────────────────────────── */

/*
 * Compiles nine result fields from Surface 2 and Surface 3 state.
 * Evidence labels per field:
 *   business (participant-reported)  Agent, Proposed execution, Downstream
 *     system, Business fit finding
 *   demonstrated (DAL-X-computed)    Controlling trigger, Required authority,
 *     Reviewer decision, Authorization status, Gate test results
 */

/* ── Display label helpers (unchanged) ──────────────────────────────────── */

function s15LookupLabel(value, options) {
  if (!value) return 'N/A';
  const found = (options || []).find(o => o.value === value);
  return found ? found.label : value;
}

function s15AgentDisplay() {
  const v = getState('s2.agent_type') || '';
  if (v === 'custom') return getState('s2.agent_type_custom') || 'N/A';
  if (v === 'not_sure') return 'Not sure';
  return s15LookupLabel(v, typeof S7_AGENT_OPTIONS !== 'undefined' ? S7_AGENT_OPTIONS : []);
}

function s15ExecutionDisplay() {
  const v = getState('s2.proposed_execution') || '';
  if (v === 'custom') return getState('s2.proposed_execution_custom') || 'N/A';
  if (v === 'not_sure') return 'Not sure';
  return s15LookupLabel(v, typeof S7_EXECUTION_OPTIONS !== 'undefined' ? S7_EXECUTION_OPTIONS : []);
}

function s15DownstreamDisplay() {
  const v = getState('s2.downstream_system') || '';
  if (v === 'none')   return 'No downstream system';
  if (v === 'custom') return getState('s2.downstream_system_custom') || 'N/A';
  if (v === 'not_sure') return 'Not sure';
  return s15LookupLabel(v, typeof S7_DOWNSTREAM_OPTIONS !== 'undefined' ? S7_DOWNSTREAM_OPTIONS : []);
}

function s15RequiredAuthority() {
  const outcome = getState('s3.trigger_outcome') || '';
  if (outcome === 'auto_approve') return 'None (auto-approved)';
  if (outcome === 'blocked')      return 'None (blocked at trigger)';
  if (outcome === 'high_risk') {
    return getState('s3.trigger_rules.lead_reviewer_role') || 'Lead reviewer';
  }
  return getState('s3.trigger_rules.standard_reviewer_role') || 'Standard reviewer';
}

function s15ReviewerDecisionDisplay() {
  const decision = getState('s3.reviewer_decision') || '';
  const outcome  = getState('s3.trigger_outcome')   || '';
  if (!decision) {
    if (outcome === 'auto_approve') return 'None (auto-approved)';
    if (outcome === 'blocked')      return 'None (blocked at trigger)';
    return 'N/A';
  }
  const labels = {
    approved:           'Approved',
    denied:             'Execution denied',
    escalated:          'Escalated',
    revision_requested: 'Revision required',
  };
  return labels[decision] || decision;
}

function s15AuthorizationStatus() {
  const authId   = getState('s3.authorization_id');
  const decision = getState('s3.reviewer_decision') || '';
  const outcome  = getState('s3.trigger_outcome')   || '';

  if (authId) return 'Issued';

  if (outcome === 'blocked')             return 'Not issued (blocked)';
  if (decision === 'denied')             return 'Not issued (denied)';
  if (decision === 'escalated')          return 'Not issued (escalated)';
  if (decision === 'revision_requested') return 'Not issued (revision required)';
  return 'Not issued';
}

const S15_BUSINESS_RESULT_LABELS = {
  critical_gap:                'Critical enforcement gap',
  gap_identified:              'Enforcement gap identified',
  gap_low_priority:            'Gap identified, lower priority',
  not_applicable:              'DAL-X not required for this workflow',
  potential_use_case:          'Potential DAL-X use case',
  enforcement_not_established: 'DAL-X enforcement requirement not established',
  high_risk_no_requirement:    'High-stakes workflow with no enforcement requirement',
  urgent_investigation:        'Urgent, high-risk workflow with unresolved gaps',
  more_info_required:          'More information required',
  not_required:                'DAL-X not required for this workflow',
};

function s15BusinessFinding() {
  const key = getState('s2.business_result');
  return S15_BUSINESS_RESULT_LABELS[key] || 'N/A';
}

/* ── Panel builders ─────────────────────────────────────────────────────── */

function buildS15Panel(headerText) {
  const panel = document.createElement('section');
  panel.className = 'result-panel';

  const head = document.createElement('div');
  head.className = 'result-panel__header';
  head.textContent = headerText;
  panel.appendChild(head);

  const body = document.createElement('div');
  body.className = 'result-panel__body';
  panel.appendChild(body);

  return { panel, body };
}

function buildS15Row(key, value, evidenceType) {
  const row = document.createElement('div');
  row.className = 'result-panel__row';

  const keyEl = document.createElement('div');
  keyEl.className = 'result-panel__key';
  keyEl.textContent = key;
  row.appendChild(keyEl);

  const valWrap = document.createElement('div');
  valWrap.className = 'result-panel__val';

  const valEl = document.createElement('span');
  valEl.className = 'result-panel__val-text';
  valEl.textContent = value || 'N/A';
  valWrap.appendChild(valEl);

  if (evidenceType) {
    valWrap.appendChild(document.createTextNode(' '));
    valWrap.appendChild(createEvidenceLabel(evidenceType));
  }

  row.appendChild(valWrap);
  return row;
}

/* ── Gate tests mini table ──────────────────────────────────────────────── */

function buildGateTestsCompact() {
  const tests = getState('s3.gate_tests') || [];

  const wrapper = document.createElement('div');
  wrapper.className = 'gate-compact';

  if (!tests.length) {
    const empty = document.createElement('p');
    empty.className = 'gate-compact__empty';
    empty.textContent = 'Gate tests not yet run.';
    wrapper.appendChild(empty);
    return wrapper;
  }

  tests.forEach(t => {
    const row = document.createElement('div');
    row.className = 'gate-compact__row';

    const name = document.createElement('span');
    name.className = 'gate-compact__name';
    name.textContent = t.name;
    row.appendChild(name);

    row.appendChild(createStatusChip(t.chipState, t.chipLabel));
    wrapper.appendChild(row);
  });

  return wrapper;
}

/* ── Renderer ───────────────────────────────────────────────────────────── */

function renderScreen15() {
  const screen = document.getElementById('screen-15');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 · Configured DAL-X simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Simulation complete';
  screen.appendChild(title);

  /* Completion checkmark */
  const check = document.createElement('div');
  check.className = 'completion-check';
  check.innerHTML =
    '<svg viewBox="0 0 64 64" aria-hidden="true">'
    + '<circle cx="32" cy="32" r="28" class="completion-check__ring"/>'
    + '<path d="M20 33 L28 41 L44 24" class="completion-check__tick" fill="none"/>'
    + '</svg>';
  screen.appendChild(check);

  /* Panel 1, use case */
  const p1 = buildS15Panel('Use case');
  p1.body.appendChild(buildS15Row('Agent',              s15AgentDisplay(),        'business'));
  p1.body.appendChild(buildS15Row('Proposed execution', s15ExecutionDisplay(),    'business'));
  p1.body.appendChild(buildS15Row('Downstream system',  s15DownstreamDisplay(),   'business'));
  p1.body.appendChild(buildS15Row('Business fit finding', s15BusinessFinding(),   'business'));
  screen.appendChild(p1.panel);

  /* Panel 2, trigger result */
  const p2 = buildS15Panel('Trigger result');
  p2.body.appendChild(buildS15Row(
    'Controlling trigger',
    getState('s3.trigger_details.controlling_rule') || 'N/A',
    'demonstrated'
  ));
  p2.body.appendChild(buildS15Row('Required authority',   s15RequiredAuthority(),         'demonstrated'));
  p2.body.appendChild(buildS15Row('Reviewer decision',    s15ReviewerDecisionDisplay(),   'demonstrated'));
  p2.body.appendChild(buildS15Row('Authorization status', s15AuthorizationStatus(),       'demonstrated'));
  screen.appendChild(p2.panel);

  /* Panel 3, gate tests */
  const p3 = buildS15Panel('Gate tests');
  p3.body.appendChild(buildGateTestsCompact());
  const evLine = document.createElement('p');
  evLine.className = 'result-panel__evidence-line';
  evLine.appendChild(document.createTextNode('Evidence '));
  evLine.appendChild(createEvidenceLabel('demonstrated'));
  p3.body.appendChild(evLine);
  screen.appendChild(p3.panel);

  /* What this proved */
  const proved = document.createElement('section');
  proved.className = 'proved-section';
  const provedHead = document.createElement('div');
  provedHead.className = 'proved-section__header';
  provedHead.textContent = 'What this proved';
  proved.appendChild(provedHead);
  const provedBody = document.createElement('p');
  provedBody.className = 'proved-section__body';
  provedBody.textContent =
    "The simulation ran your agent's proposed execution through DAL-X trigger evaluation, "
    + 'a simulated reviewer decision, authorization issuance, and six downstream gate tests. '
    + "Every test result is labeled 'Demonstrated in simulation' and is not proven against your production systems.";
  proved.appendChild(provedBody);
  screen.appendChild(proved);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-14'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Continue to technical review';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen16 === 'function') renderScreen16();
    showScreen('screen-16');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen15);
