/* ─── Screen 15: Configured Simulation Result ───────────────────────────── */

/*
 * Compiles nine result fields from Surface 2 and Surface 3 state.
 * Evidence labels per field:
 *   business (participant-reported): Agent, Proposed execution, Downstream
 *     system, Business fit finding
 *   demonstrated (DAL-X-computed):   Controlling trigger, Required authority,
 *     Reviewer decision, Authorization status, Gate test results
 */

/* ── Display label helpers ────────────────────────────────────────────────── */

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
  /* needs_review or default */
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

  if (outcome === 'blocked')      return 'Not issued (blocked)';
  if (decision === 'denied')      return 'Not issued (denied)';
  if (decision === 'escalated')   return 'Not issued (escalated)';
  if (decision === 'revision_requested') return 'Not issued (revision required)';
  return 'Not issued';
}

const S15_BUSINESS_RESULT_LABELS = {
  potential_use_case:          'Potential DAL-X use case',
  enforcement_not_established: 'DAL-X enforcement requirement not established',
  more_info_required:          'More information required',
  not_required:                'DAL-X not required for this workflow',
};

function s15BusinessFinding() {
  const key = getState('s2.business_result');
  return S15_BUSINESS_RESULT_LABELS[key] || 'N/A';
}

/* ── Gate test mini-table ─────────────────────────────────────────────────── */

function buildGateTestsTable() {
  const tests = getState('s3.gate_tests') || [];

  const wrapper = document.createElement('div');
  wrapper.style.marginTop = 'var(--space-3)';

  if (!tests.length) {
    const empty = document.createElement('p');
    empty.style.cssText = 'font-size:var(--text-sm);color:var(--color-text-secondary);';
    empty.textContent = 'Gate tests not yet run.';
    wrapper.appendChild(empty);
    return wrapper;
  }

  const table = document.createElement('table');
  table.className = 'data-table';

  const thead = document.createElement('thead');
  const hrow  = document.createElement('tr');
  ['Scenario', 'Decision'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  tests.forEach(t => {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = t.name;
    tr.appendChild(tdName);

    const tdDecision = document.createElement('td');
    tdDecision.appendChild(createStatusChip(t.chipState, t.chipLabel));
    tr.appendChild(tdDecision);

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen15() {
  const screen = document.getElementById('screen-15');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 · Configured DAL-X Simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Configured Simulation Result';
  screen.appendChild(title);

  /* Result card */
  const card = document.createElement('div');
  card.className = 'card';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'card__title';
  cardTitle.textContent = 'Simulation result';
  card.appendChild(cardTitle);

  /* Fields 1–3: participant-reported */
  const businessFields = [
    ['Agent',              s15AgentDisplay()],
    ['Proposed execution', s15ExecutionDisplay()],
    ['Downstream system',  s15DownstreamDisplay()],
  ];
  businessFields.forEach(([key, val]) =>
    card.appendChild(createLabelledField(key, val, 'business')));

  /* Divider before DAL-X computed fields */
  const hr1 = document.createElement('hr');
  hr1.className = 'divider';
  card.appendChild(hr1);

  /* Fields 4–7: DAL-X computed */
  const computedFields = [
    ['Controlling trigger',  getState('s3.trigger_details.controlling_rule') || 'N/A'],
    ['Required authority',   s15RequiredAuthority()],
    ['Reviewer decision',    s15ReviewerDecisionDisplay()],
    ['Authorization status', s15AuthorizationStatus()],
  ];
  computedFields.forEach(([key, val]) =>
    card.appendChild(createLabelledField(key, val, 'demonstrated')));

  /* Field 8: Gate test results, sub-section with mini-table */
  const hr2 = document.createElement('hr');
  hr2.className = 'divider';
  card.appendChild(hr2);

  const gateRow = document.createElement('div');
  gateRow.className = 'field-row';
  gateRow.style.alignItems = 'flex-start';

  const gateKey = document.createElement('div');
  gateKey.className = 'field-row__key';
  gateKey.textContent = 'Gate test results';

  const gateVal = document.createElement('div');
  gateVal.className = 'field-row__value';
  gateVal.style.flexDirection = 'column';
  gateVal.appendChild(buildGateTestsTable());
  const gateEv = document.createElement('span');
  gateEv.style.marginTop = 'var(--space-2)';
  gateEv.style.display = 'inline-block';
  gateEv.appendChild(createEvidenceLabel('demonstrated'));
  gateVal.appendChild(gateEv);

  gateRow.appendChild(gateKey);
  gateRow.appendChild(gateVal);
  card.appendChild(gateRow);

  /* Divider before business fit finding */
  const hr3 = document.createElement('hr');
  hr3.className = 'divider';
  card.appendChild(hr3);

  /* Field 9: Business fit finding, participant-reported */
  card.appendChild(createLabelledField(
    'Business fit finding', s15BusinessFinding(), 'business'));

  screen.appendChild(card);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-14'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Proceed to Technical Review →';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen16 === 'function') renderScreen16();
    showScreen('screen-16');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen15);
