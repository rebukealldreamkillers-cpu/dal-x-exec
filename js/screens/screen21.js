/* ─── Screen 21: DAL-X Simulation Result ─────────────────────────────────── */

/* ── Pilot path phase definitions ────────────────────────────────────────── */

const S21_PHASES = [
  {
    title: 'Phase 1: Setup',
    bullets: [
      'Create workspace.',
      'Add reviewers.',
      'Create shadow key.',
      'Register one agent.',
      'Define one action and target.',
      'Configure enterprise trigger rules.',
    ],
  },
  {
    title: 'Phase 2: Shadow mode',
    bullets: [
      'Add the submission call.',
      'Send proposed executions.',
      'Observe rule matches.',
      'Correct missing metadata.',
      'Adjust trigger logic.',
      'Confirm expected routing.',
      'Shadow mode does not block execution.',
    ],
  },
  {
    title: 'Phase 3: Decision handling',
    bullets: [
      'Reviewer decides inside DAL-X.',
      'Enterprise receives a webhook or polls.',
      'Enterprise calls GET /api/v1/submissions/:id.',
      'Enterprise retrieves the authorization_id.',
      'Pending execution resumes.',
    ],
  },
  {
    title: 'Phase 4: Enforcement mode',
    bullets: [
      'Create the enforcement key.',
      'Add POST /api/v1/enforcement/execute at the downstream boundary.',
      'Send the authorization_id, action, and target.',
      'Block every rejection and DAL-X error.',
      'Permit execution only after DAL-X accepts.',
      'Record the downstream result separately.',
    ],
  },
];

const S21_ACCEPTANCE_TESTS = [
  { test: 'Valid active authorization',   result: 'Accepted'                                    },
  { test: 'Wrong action',                 result: 'Rejected'                                    },
  { test: 'Wrong target',                 result: 'Rejected'                                    },
  { test: 'Missing authorization',        result: 'Rejected'                                    },
  { test: 'Consumed authorization',       result: 'Rejected'                                    },
  { test: 'Expired authorization',        result: 'Rejected'                                    },
  { test: 'DAL-X unavailable',            result: 'Enterprise blocks execution'                 },
  { test: 'Valid accepted execution',     result: 'Downstream result recorded separately'       },
  { test: 'Direct call avoiding DAL-X',   result: 'Enterprise prevents the governed execution'  },
];

/* ── Scope and removed items ─────────────────────────────────────────────── */

const S21_SCOPE_IN = [
  'Authority evaluation',
  'Human review',
  'Action and target matching',
  'Single use authorization',
  'Downstream gate rejection',
];

const S21_SCOPE_OUT = [
  'Model alignment',
  'Chain of thought analysis',
  'Detecting deceptive reasoning',
  'Determining agent intent',
  'Preventing every path not integrated with DAL-X',
];

const S21_REMOVED_ITEMS = [
  'Full audit trail',
  'Compliance certification',
  'Risk score',
  'SLA commitments',
  'Agent capability assessment',
  'Downstream system verification',
  'Enterprise change management',
  'Pilot success guarantee',
  'Monitoring and alerting',
  'Production readiness determination',
];

/* ── Display label maps ───────────────────────────────────────────────────── */

const S21_BUSINESS_RESULT_LABELS = {
  potential_use_case:          'Potential DAL-X use case',
  enforcement_not_established: 'DAL-X enforcement requirement not established',
  more_info_required:          'More information required',
  not_required:                'DAL-X not required for this workflow',
};

const S21_TRIGGER_OUTCOME_LABELS = {
  auto_approve: 'Auto-approved',
  needs_review: 'Needs review',
  high_risk:    'High risk — escalated review',
  blocked:      'Blocked',
};

const S21_REVIEWER_DECISION_LABELS = {
  approved:           'Approved',
  denied:             'Execution denied',
  escalated:          'Escalated',
  revision_requested: 'Revision required',
};

const S21_PILOT_DECISION_LABELS = {
  remediation_required: 'Remediation decision required',
  not_recommended:      'Pilot not recommended',
  pilot_prerequisites:  'Pilot prerequisites required',
  setup_tasks:          'Pilot setup tasks required',
  pilot_candidate:      'Pilot integration candidate',
};

const S21_Q_LABELS = {
  q1:  'Q1 — Submission point',
  q2:  'Q2 — Pending execution',
  q3:  'Q3 — Decision handling',
  q4:  'Q4 — Enforcement point',
  q5:  'Q5 — Blocking behavior',
  q6:  'Q6 — Bypass prevention',
  q7:  'Q7 — Submission fields',
  q8:  'Q8 — API key storage',
  q9:  'Q9 — Data handling',
  q10: 'Q10 — Downstream result',
};

const S21_Q_VALUE_LABELS = {
  yes:            'Yes',
  no:             'No',
  unknown:        'Unknown',
  not_applicable: 'Not applicable',
  webhook:        'Webhook',
  polling:        'Polling',
  either:         'Either',
  neither:        'Neither',
};

const S21_NEXT_STEPS = {
  remediation_required: 'Decide whether the enterprise can and will correct the structural failure, then request reassessment.',
  not_recommended:      'No next step. A DAL-X pilot is not proposed for this workflow.',
  pilot_prerequisites:  'Correct the identified structural failure, provide the required evidence, and request reassessment.',
  setup_tasks:          'Complete the required setup work, provide the required evidence, and request reassessment.',
  pilot_candidate:      'Assign pilot owners and proceed to the paid pilot agreement with Jochanni Labs.',
};

/* ── Display helpers ─────────────────────────────────────────────────────── */

function s21LookupLabel(value, options) {
  if (!value) return '—';
  const found = (options || []).find(o => o.value === value);
  return found ? found.label : value;
}

function s21AgentDisplay() {
  const v = getState('s2.agent_type') || '';
  if (v === 'custom')   return getState('s2.agent_type_custom') || '—';
  if (v === 'not_sure') return 'Not sure';
  return s21LookupLabel(v, typeof S7_AGENT_OPTIONS !== 'undefined' ? S7_AGENT_OPTIONS : []);
}

function s21ExecutionDisplay() {
  const v = getState('s2.proposed_execution') || '';
  if (v === 'custom')   return getState('s2.proposed_execution_custom') || '—';
  if (v === 'not_sure') return 'Not sure';
  return s21LookupLabel(v, typeof S7_EXECUTION_OPTIONS !== 'undefined' ? S7_EXECUTION_OPTIONS : []);
}

function s21DownstreamDisplay() {
  const v = getState('s2.downstream_system') || '';
  if (v === 'none')     return 'No downstream system';
  if (v === 'custom')   return getState('s2.downstream_system_custom') || '—';
  if (v === 'not_sure') return 'Not sure';
  return s21LookupLabel(v, typeof S7_DOWNSTREAM_OPTIONS !== 'undefined' ? S7_DOWNSTREAM_OPTIONS : []);
}

/* ── Table builders ──────────────────────────────────────────────────────── */

function buildS21Table(headers, rows) {
  const table = document.createElement('table');
  table.className = 'data-table';
  table.style.marginTop = 'var(--space-3)';

  const thead = document.createElement('thead');
  const hrow  = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach(cells => {
    const tr = document.createElement('tr');
    cells.forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

/* Field row that holds a table as its value + an evidence label below it */
function buildTableField(keyText, tableEl, evidenceType) {
  const row = document.createElement('div');
  row.className = 'field-row';
  row.style.alignItems = 'flex-start';

  const keyEl = document.createElement('div');
  keyEl.className = 'field-row__key';
  keyEl.textContent = keyText;

  const valEl = document.createElement('div');
  valEl.className = 'field-row__value';
  valEl.style.flexDirection = 'column';
  valEl.appendChild(tableEl);

  const evSpan = document.createElement('span');
  evSpan.style.cssText = 'margin-top:var(--space-2);display:inline-block;';
  evSpan.appendChild(createEvidenceLabel(evidenceType));
  valEl.appendChild(evSpan);

  row.appendChild(keyEl);
  row.appendChild(valEl);
  return row;
}

function buildTechnicalAnswersTable() {
  const rows = Object.keys(S21_Q_LABELS).map(k => {
    const v       = getState('s4.' + k);
    const display = S21_Q_VALUE_LABELS[v] || (v == null ? '—' : v);
    return [S21_Q_LABELS[k], display];
  });
  return buildS21Table(['Question', 'Answer'], rows);
}

function buildBoundaryMapTable() {
  function q(k) { return getState('s4.' + k) || null; }
  const rows = [];

  const q1 = q('q1');
  if      (q1 === 'yes') rows.push(['Submission point',  'Agent submission path']);
  else if (q1 === 'no')  rows.push(['Submission point',  'Submission point missing']);
  else if (q1)           rows.push(['Submission point',  'Submission point unknown']);

  const q2 = q('q2');
  if      (q2 === 'yes')     rows.push(['Pending execution', 'Stored pending execution']);
  else if (q2 === 'no')      rows.push(['Pending execution', 'Pending execution not available']);
  else if (q2 === 'unknown') rows.push(['Pending execution', 'Pending execution unknown']);

  const q3 = q('q3');
  if      (q3 === 'webhook')  rows.push(['Decision handling', 'Webhook decision path']);
  else if (q3 === 'polling')  rows.push(['Decision handling', 'Polling path']);
  else if (q3 === 'either')   rows.push(['Decision handling', 'Webhook and polling both available']);
  else if (q3 === 'neither')  rows.push(['Decision handling', 'Neither webhook nor polling available']);
  else if (q3 === 'unknown')  rows.push(['Decision handling', 'Decision handling unknown']);

  const q4 = q('q4');
  if      (q4 === 'yes') rows.push(['Enforcement point',  'Enforcement check before downstream system']);
  else if (q4 === 'no')  rows.push(['Enforcement point',  'Enforcement point missing']);
  else if (q4)           rows.push(['Enforcement point',  'Enforcement point unknown']);

  const q5 = q('q5');
  if      (q5 === 'yes') rows.push(['Blocking behavior',  'Fail closed']);
  else if (q5 === 'no')  rows.push(['Blocking behavior',  'Execution may continue after rejection or error']);
  else if (q5)           rows.push(['Blocking behavior',  'Blocking behavior unknown']);

  const q6 = q('q6');
  if      (q6 === 'yes')     rows.push(['Bypass prevention', 'No alternate path']);
  else if (q6 === 'no')      rows.push(['Bypass prevention', 'Reported bypass']);
  else if (q6 === 'unknown') rows.push(['Bypass prevention', 'Unconfirmed bypass']);

  const q10 = q('q10');
  if      (q10 === 'yes') rows.push(['Downstream result', 'Connected to enterprise record']);
  else if (q10 === 'no')  rows.push(['Downstream result', 'Downstream result recording missing']);
  else if (q10)           rows.push(['Downstream result', 'Downstream result recording unknown']);

  if (!rows.length) {
    const empty = document.createElement('p');
    empty.style.cssText =
      'font-size:var(--text-sm);color:var(--color-text-secondary);margin-top:var(--space-3);';
    empty.textContent = 'No technical answers recorded.';
    return empty;
  }
  return buildS21Table(['Integration path', 'Map statement'], rows);
}

function buildJLReviewSummaryTable() {
  const keys = [
    'jl.review.submission_point',  'jl.review.pending_execution',
    'jl.review.webhook_polling',   'jl.review.enforcement_point',
    'jl.review.blocking_behavior', 'jl.review.bypass_paths',
    'jl.review.field_mapping',     'jl.review.api_key_storage',
    'jl.review.data_handling',     'jl.review.downstream_result',
  ];
  const counts = { confirmed: 0, more_info: 0, correction_required: 0, not_applicable: 0, not_reviewed: 0 };
  keys.forEach(k => {
    const v = getState(k);
    if (v && counts[v] !== undefined) counts[v]++;
    else counts.not_reviewed++;
  });
  const rows = [
    ['Confirmed for pilot planning', String(counts.confirmed)],
    ['More information required',    String(counts.more_info)],
    ['Correction required',          String(counts.correction_required)],
    ['Not applicable',               String(counts.not_applicable)],
  ];
  if (counts.not_reviewed > 0) rows.push(['Not reviewed', String(counts.not_reviewed)]);
  return buildS21Table(['Decision', 'Items'], rows);
}

function buildS21GateTestsTable() {
  const tests = getState('s3.gate_tests') || [];
  if (!tests.length) {
    const empty = document.createElement('p');
    empty.style.cssText =
      'font-size:var(--text-sm);color:var(--color-text-secondary);margin-top:var(--space-3);';
    empty.textContent = 'Gate tests not yet run.';
    return empty;
  }
  const rows = tests.map(t => [t.name, t.chipLabel || '—']);
  return buildS21Table(['Scenario', 'Decision'], rows);
}

/* ── Phase / acceptance test card builders ───────────────────────────────── */

function buildPhaseCard(phase) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginTop = 'var(--space-4)';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'card__title';
  cardTitle.textContent = phase.title;
  card.appendChild(cardTitle);

  const list = document.createElement('ul');
  list.style.cssText =
    'margin:var(--space-3) 0 0 var(--space-5);'
    + 'font-size:var(--text-sm);color:var(--color-text-secondary);'
    + 'display:flex;flex-direction:column;gap:var(--space-2);';
  phase.bullets.forEach(b => {
    const li = document.createElement('li');
    li.textContent = b;
    list.appendChild(li);
  });
  card.appendChild(list);
  return card;
}

function buildAcceptanceTestCard() {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginTop = 'var(--space-4)';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'card__title';
  cardTitle.textContent = 'Phase 5: Acceptance tests';
  card.appendChild(cardTitle);

  const rows = S21_ACCEPTANCE_TESTS.map(t => [t.test, t.result]);
  card.appendChild(buildS21Table(['Test', 'Required result'], rows));
  return card;
}

/* ── Scope table builder ─────────────────────────────────────────────────── */

function buildScopeTable() {
  const rows = S21_SCOPE_IN.map((item, i) => [item, S21_SCOPE_OUT[i] || '']);
  return buildS21Table(['In scope', 'Outside scope'], rows);
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen21() {
  const screen = document.getElementById('screen-21');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Jochanni Labs Review';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'DAL-X Simulation Result';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent = 'The DAL-X Simulation Result contains:';
  screen.appendChild(subtitle);

  /* ── Result card ──────────────────────────────────────────────────────── */
  const card = document.createElement('div');
  card.className = 'card';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'card__title';
  cardTitle.textContent = 'Simulation result';
  card.appendChild(cardTitle);

  /* Fields 1–4: business evidence */
  card.appendChild(createLabelledField('Agent', s21AgentDisplay(), 'business'));

  const hr1 = document.createElement('hr'); hr1.className = 'divider'; card.appendChild(hr1);
  card.appendChild(createLabelledField('Proposed execution', s21ExecutionDisplay(), 'business'));

  const hr2 = document.createElement('hr'); hr2.className = 'divider'; card.appendChild(hr2);
  card.appendChild(createLabelledField('Downstream system', s21DownstreamDisplay(), 'business'));

  const hr3 = document.createElement('hr'); hr3.className = 'divider'; card.appendChild(hr3);
  card.appendChild(createLabelledField(
    'Business fit',
    S21_BUSINESS_RESULT_LABELS[getState('s2.business_result')] || '—',
    'business'));

  /* Fields 5–8: demonstrated evidence */
  const hr4 = document.createElement('hr'); hr4.className = 'divider'; card.appendChild(hr4);
  card.appendChild(createLabelledField(
    'Simulated trigger result',
    S21_TRIGGER_OUTCOME_LABELS[getState('s3.trigger_outcome')] || '—',
    'demonstrated'));

  const hr5 = document.createElement('hr'); hr5.className = 'divider'; card.appendChild(hr5);

  const triggerOutcome   = getState('s3.trigger_outcome')   || '';
  const reviewerDecision = getState('s3.reviewer_decision') || '';
  let reviewerDecisionText;
  if (!reviewerDecision) {
    if      (triggerOutcome === 'auto_approve') reviewerDecisionText = 'None — auto-approved';
    else if (triggerOutcome === 'blocked')      reviewerDecisionText = 'None — blocked at trigger';
    else                                        reviewerDecisionText = '—';
  } else {
    reviewerDecisionText = S21_REVIEWER_DECISION_LABELS[reviewerDecision] || reviewerDecision;
  }
  card.appendChild(createLabelledField('Simulated reviewer decision', reviewerDecisionText, 'demonstrated'));

  const hr6 = document.createElement('hr'); hr6.className = 'divider'; card.appendChild(hr6);
  card.appendChild(createLabelledField(
    'Simulated authorization',
    getState('s3.authorization_id') ? 'Issued' : 'Not issued',
    'demonstrated'));

  const hr7 = document.createElement('hr'); hr7.className = 'divider'; card.appendChild(hr7);
  card.appendChild(buildTableField('Simulated gate tests', buildS21GateTestsTable(), 'demonstrated'));

  /* Fields 9–12: technical evidence */
  const hr8 = document.createElement('hr'); hr8.className = 'divider'; card.appendChild(hr8);
  card.appendChild(buildTableField('Technical answers', buildTechnicalAnswersTable(), 'technical'));

  const hr9 = document.createElement('hr'); hr9.className = 'divider'; card.appendChild(hr9);
  card.appendChild(buildTableField('Reported boundary map', buildBoundaryMapTable(), 'technical'));

  const hr10 = document.createElement('hr'); hr10.className = 'divider'; card.appendChild(hr10);

  const blockers = getState('s4.structural_blockers') || [];
  card.appendChild(createLabelledField(
    'Structural blockers',
    blockers.length ? blockers.map(k => S21_Q_LABELS[k] || k).join('; ') : 'None',
    'technical'));

  const hr11 = document.createElement('hr'); hr11.className = 'divider'; card.appendChild(hr11);

  const implTasks = ['q7','q8','q9','q10'].filter(k => getState('s4.' + k) === 'no');
  card.appendChild(createLabelledField(
    'Implementation tasks',
    implTasks.length ? implTasks.map(k => S21_Q_LABELS[k] || k).join('; ') : 'None',
    'technical'));

  /* Fields 13–15: jl-reviewed evidence */
  const hr12 = document.createElement('hr'); hr12.className = 'divider'; card.appendChild(hr12);
  card.appendChild(buildTableField('Jochanni Labs review', buildJLReviewSummaryTable(), 'jl-reviewed'));

  const hr13 = document.createElement('hr'); hr13.className = 'divider'; card.appendChild(hr13);
  const pilotDecisionKey = getState('jl.decision') || '';
  card.appendChild(createLabelledField(
    'Pilot decision',
    S21_PILOT_DECISION_LABELS[pilotDecisionKey] || '—',
    'jl-reviewed'));

  const hr14 = document.createElement('hr'); hr14.className = 'divider'; card.appendChild(hr14);
  card.appendChild(createLabelledField(
    'Required next step',
    S21_NEXT_STEPS[pilotDecisionKey] || '—',
    'jl-reviewed'));

  screen.appendChild(card);

  /* ── Spec-required notices ────────────────────────────────────────────── */

  const notice1 = document.createElement('div');
  notice1.className = 'callout callout--info';
  notice1.style.marginTop = 'var(--space-6)';
  notice1.textContent =
    'The result is not called an audit, certification, compliance report, or production proof.';
  screen.appendChild(notice1);

  const notice2 = document.createElement('div');
  notice2.className = 'callout callout--info';
  notice2.style.marginTop = 'var(--space-4)';
  notice2.textContent =
    'Task ownership, dates, status tracking, and delivery management begin only after a paid pilot agreement exists.';
  screen.appendChild(notice2);

  const notice3 = document.createElement('div');
  notice3.className = 'callout callout--info';
  notice3.style.marginTop = 'var(--space-4)';
  notice3.textContent =
    'The simulation addresses the near term enterprise problem behind many “rogue agent” incidents. '
    + 'It should not be presented as a solution to the full threat of misaligned artificial intelligence.';
  screen.appendChild(notice3);

  /* ── Simulation scope ─────────────────────────────────────────────────── */

  const scopeSection = document.createElement('div');
  scopeSection.style.marginTop = 'var(--space-6)';

  const scopeHeading = document.createElement('p');
  scopeHeading.className = 'section-label';
  scopeHeading.textContent = 'Simulation scope';
  scopeSection.appendChild(scopeHeading);
  scopeSection.appendChild(buildScopeTable());
  screen.appendChild(scopeSection);

  /* ── Permanently removed items ────────────────────────────────────────── */

  const removedSection = document.createElement('div');
  removedSection.style.marginTop = 'var(--space-6)';

  const removedHeading = document.createElement('p');
  removedHeading.className = 'section-label';
  removedHeading.textContent = 'Permanently removed from this simulation';
  removedSection.appendChild(removedHeading);

  const removedList = document.createElement('ul');
  removedList.style.cssText =
    'margin:var(--space-2) 0 0 var(--space-5);'
    + 'font-size:var(--text-sm);color:var(--color-text-secondary);'
    + 'display:flex;flex-direction:column;gap:var(--space-1);';
  S21_REMOVED_ITEMS.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    removedList.appendChild(li);
  });
  removedSection.appendChild(removedList);
  screen.appendChild(removedSection);

  /* ── Pilot path ───────────────────────────────────────────────────────── */

  const pilotSection = document.createElement('div');
  pilotSection.style.marginTop = 'var(--space-6)';

  const pilotHeading = document.createElement('p');
  pilotHeading.className = 'section-label';
  pilotHeading.style.marginBottom = 'var(--space-2)';
  pilotHeading.textContent = 'Pilot path';
  pilotSection.appendChild(pilotHeading);

  S21_PHASES.forEach(phase => pilotSection.appendChild(buildPhaseCard(phase)));
  pilotSection.appendChild(buildAcceptanceTestCard());
  screen.appendChild(pilotSection);

  /* Nav — Back only (final screen) */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav screen-nav--start';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', goBack);
  nav.appendChild(backBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen21);
