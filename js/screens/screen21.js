/* ─── Screen 21: DAL-X Simulation Result ─────────────────────────────────── */
/* JL_BOOKING_URL, JL_CONTACT_EMAIL defined in config.js (loaded first)      */

/* ── Scope lists ─────────────────────────────────────────────────────────── */

const S21_SCOPE_IN = [
  'Authority evaluation',
  'Human review',
  'Action and target matching',
  'Single-use authorization',
  'Downstream gate rejection',
];

const S21_SCOPE_OUT = [
  'Model alignment',
  'Chain of thought analysis',
  'Detecting deceptive reasoning',
  'Determining agent intent',
  'Preventing every path not integrated with DAL-X',
];

/* ── Display label maps ───────────────────────────────────────────────────── */

const S21_BUSINESS_RESULT_LABELS = {
  critical_gap:                'Critical enforcement gap',
  gap_identified:              'Enforcement gap identified',
  gap_low_priority:            'Gap identified, lower priority',
  high_risk_no_requirement:    'High-stakes workflow with no enforcement requirement',
  enforcement_not_established: 'No enforcement requirement for this workflow',
  urgent_investigation:        'Urgent high-risk workflow with incomplete answers',
  more_info_required:          'More information required',
  not_applicable:              'No enforcement gap applies',
  potential_use_case:          'Potential DAL-X use case',
  not_required:                'DAL-X not required for this workflow',
};

const S21_TECHNICAL_RESULT_LABELS = {
  structural_failure:   'Structural failure',
  incomplete:           'Technical answers incomplete',
  implementation_work:  'Implementation work required',
  supports_integration: 'Technical answers support integration',
};

const S21_TRIGGER_OUTCOME_LABELS = {
  auto_approve: 'Auto-approved',
  needs_review: 'Needs review',
  high_risk:    'High risk, escalated review',
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
  q1:  'Q1 Submission point',
  q2:  'Q2 Pending execution',
  q3:  'Q3 Decision handling',
  q4:  'Q4 Enforcement point',
  q5:  'Q5 Blocking behavior',
  q6:  'Q6 Bypass prevention',
  q7:  'Q7 Submission fields',
  q8:  'Q8 API key storage',
  q9:  'Q9 Data handling',
  q10: 'Q10 Downstream result',
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

/* ── Verdict tone mapping ────────────────────────────────────────────────── */

const S21_BUSINESS_TONE = {
  critical_gap:                'red',
  gap_identified:              'amber',
  gap_low_priority:            'amber',
  high_risk_no_requirement:    'amber',
  enforcement_not_established: 'slate',
  urgent_investigation:        'red',
  more_info_required:          'amber',
  not_applicable:              'slate',
  potential_use_case:          'green',
  not_required:                'slate',
};

const S21_TECHNICAL_TONE = {
  structural_failure:   'red',
  incomplete:           'amber',
  implementation_work:  'amber',
  supports_integration: 'green',
};

const S21_PILOT_TONE = {
  pilot_candidate:      'green',
  setup_tasks:          'amber',
  pilot_prerequisites:  'amber',
  remediation_required: 'slate',
  not_recommended:      'red',
};

/* ── Display helpers ─────────────────────────────────────────────────────── */

function s21LookupLabel(value, options) {
  if (!value) return 'Not provided';
  const found = (options || []).find(o => o.value === value);
  return found ? found.label : value;
}

function s21AgentDisplay() {
  const v = getState('s2.agent_type') || '';
  if (v === 'custom')   return getState('s2.agent_type_custom') || 'Not provided';
  if (v === 'not_sure') return 'Not sure';
  return s21LookupLabel(v, typeof S7_AGENT_OPTIONS !== 'undefined' ? S7_AGENT_OPTIONS : []);
}

function s21ExecutionDisplay() {
  const v = getState('s2.proposed_execution') || '';
  if (v === 'custom')   return getState('s2.proposed_execution_custom') || 'Not provided';
  if (v === 'not_sure') return 'Not sure';
  return s21LookupLabel(v, typeof S7_EXECUTION_OPTIONS !== 'undefined' ? S7_EXECUTION_OPTIONS : []);
}

function s21DownstreamDisplay() {
  const v = getState('s2.downstream_system') || '';
  if (v === 'none')     return 'No downstream system';
  if (v === 'custom')   return getState('s2.downstream_system_custom') || 'Not provided';
  if (v === 'not_sure') return 'Not sure';
  return s21LookupLabel(v, typeof S7_DOWNSTREAM_OPTIONS !== 'undefined' ? S7_DOWNSTREAM_OPTIONS : []);
}

/* ── Verdict panel (three outcomes) ──────────────────────────────────────── */

function s21BuildVerdictPanel() {
  const panel = document.createElement('div');
  panel.className = 'verdict-panel';

  const heading = document.createElement('div');
  heading.className = 'verdict-panel__heading';
  heading.textContent = 'Verdicts at a glance';
  panel.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'verdict-panel__grid';

  const businessKey  = getState('s2.business_result') || '';
  const technicalKey = getState('s4.technical_result') || '';
  const pilotKey     = getState('jl.decision') || '';

  const cards = [
    {
      label: 'Business result',
      value: S21_BUSINESS_RESULT_LABELS[businessKey] || 'Not completed',
      tone:  S21_BUSINESS_TONE[businessKey] || 'slate',
      evidence: 'business',
    },
    {
      label: 'Technical result',
      value: S21_TECHNICAL_RESULT_LABELS[technicalKey] || 'Not completed',
      tone:  S21_TECHNICAL_TONE[technicalKey] || 'slate',
      evidence: 'technical',
    },
    {
      label: 'Pilot decision',
      value: S21_PILOT_DECISION_LABELS[pilotKey] || 'Not completed',
      tone:  S21_PILOT_TONE[pilotKey] || 'slate',
      evidence: pilotKey === 'pilot_candidate' ? 'jl-reviewed' : null,
    },
  ];

  cards.forEach(c => {
    const card = document.createElement('div');
    card.className = 'verdict-card verdict-card--' + c.tone;

    const lbl = document.createElement('div');
    lbl.className = 'verdict-card__label';
    lbl.textContent = c.label;
    card.appendChild(lbl);

    const val = document.createElement('div');
    val.className = 'verdict-card__value';
    val.textContent = c.value;
    card.appendChild(val);

    if (c.evidence) {
      const ev = document.createElement('div');
      ev.className = 'verdict-card__evidence';
      ev.appendChild(createEvidenceLabel(c.evidence));
      card.appendChild(ev);
    }

    grid.appendChild(card);
  });

  panel.appendChild(grid);
  return panel;
}

/* ── Collapsible section ─────────────────────────────────────────────────── */

function s21BuildCollapsible(title, buildBody) {
  const section = document.createElement('section');
  section.className = 'result-section is-expanded';

  const header = document.createElement('button');
  header.type = 'button';
  header.className = 'result-section__header';
  header.setAttribute('aria-expanded', 'true');

  const titleEl = document.createElement('span');
  titleEl.className = 'result-section__title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  const caret = document.createElement('span');
  caret.className = 'result-section__caret';
  caret.setAttribute('aria-hidden', 'true');
  caret.textContent = '▾';
  header.appendChild(caret);

  const body = document.createElement('div');
  body.className = 'result-section__body';
  buildBody(body);

  header.addEventListener('click', () => {
    const expanded = section.classList.toggle('is-expanded');
    header.setAttribute('aria-expanded', String(expanded));
  });

  section.appendChild(header);
  section.appendChild(body);
  return section;
}

/* ── Body builders for each section ──────────────────────────────────────── */

function s21FillUseCase(body) {
  body.appendChild(createLabelledField('Agent',              s21AgentDisplay(),        'business'));
  body.appendChild(createLabelledField('Proposed execution', s21ExecutionDisplay(),    'business'));
  body.appendChild(createLabelledField('Downstream system',  s21DownstreamDisplay(),   'business'));
  body.appendChild(createLabelledField(
    'Business fit',
    S21_BUSINESS_RESULT_LABELS[getState('s2.business_result')] || 'Not completed',
    'business'
  ));

  const riskBand  = getState('s2.risk_band')  || '';
  const riskScore = getState('s2.risk_score');
  const riskLabel = riskScore != null
    ? `${(typeof S8_RISK_BAND_LABELS !== 'undefined' && S8_RISK_BAND_LABELS[riskBand]) || riskBand} (${riskScore})`
    : 'Not scored';
  body.appendChild(createLabelledField('Risk score', riskLabel, 'business'));
}

function s21FillTriggerEvaluation(body) {
  const triggerOutcome   = getState('s3.trigger_outcome')   || '';
  const reviewerDecision = getState('s3.reviewer_decision') || '';
  const controllingRule  = getState('s3.trigger_details.controlling_rule') || 'Not applicable';

  let reviewerText;
  if (!reviewerDecision) {
    if      (triggerOutcome === 'auto_approve') reviewerText = 'None (auto-approved)';
    else if (triggerOutcome === 'blocked')      reviewerText = 'None (blocked at trigger)';
    else                                        reviewerText = 'Not recorded';
  } else {
    reviewerText = S21_REVIEWER_DECISION_LABELS[reviewerDecision] || reviewerDecision;
  }

  body.appendChild(createLabelledField('Controlling rule', controllingRule,                                 'demonstrated'));
  body.appendChild(createLabelledField('Trigger outcome',  S21_TRIGGER_OUTCOME_LABELS[triggerOutcome] || 'Not recorded', 'demonstrated'));
  body.appendChild(createLabelledField('Reviewer decision', reviewerText,                                    'demonstrated'));
  body.appendChild(createLabelledField(
    'Authorization',
    getState('s3.authorization_id') ? 'Issued' : 'Not issued',
    'demonstrated'
  ));
}

function s21FillGateTests(body) {
  const tests = getState('s3.gate_tests') || [];
  if (!tests.length) {
    const empty = document.createElement('p');
    empty.className = 'result-section__empty';
    empty.textContent = 'Gate tests were not run in this session.';
    body.appendChild(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'gate-compact';

  tests.forEach(t => {
    const row = document.createElement('div');
    row.className = 'gate-compact__row';

    const name = document.createElement('span');
    name.className = 'gate-compact__name';
    name.textContent = t.name;
    row.appendChild(name);

    row.appendChild(createStatusChip(t.chipState, t.chipLabel));
    list.appendChild(row);
  });

  body.appendChild(list);

  const evLine = document.createElement('p');
  evLine.className = 'result-section__evidence-line';
  evLine.appendChild(document.createTextNode('Evidence '));
  evLine.appendChild(createEvidenceLabel('demonstrated'));
  body.appendChild(evLine);
}

function s21FillTechnicalReview(body) {
  const wrap = document.createElement('div');
  wrap.className = 'tech-summary-grid';

  Object.keys(S21_Q_LABELS).forEach(k => {
    const v = getState('s4.' + k);
    const display = S21_Q_VALUE_LABELS[v] || (v == null ? 'Not answered' : v);

    const row = document.createElement('div');
    row.className = 'tech-summary-row';

    const lbl = document.createElement('span');
    lbl.className = 'tech-summary-row__label';
    lbl.textContent = S21_Q_LABELS[k];
    row.appendChild(lbl);

    const val = document.createElement('span');
    val.className = 'tech-summary-row__value';
    val.textContent = display;
    row.appendChild(val);

    wrap.appendChild(row);
  });

  body.appendChild(wrap);

  const techResult = getState('s4.technical_result') || '';
  body.appendChild(createLabelledField(
    'Technical result',
    S21_TECHNICAL_RESULT_LABELS[techResult] || 'Not completed',
    'technical'
  ));

  const blockers = getState('s4.structural_blockers') || [];
  if (blockers.length) {
    body.appendChild(createLabelledField(
      'Structural blockers',
      blockers.map(k => S21_Q_LABELS[k] || k).join(', '),
      'technical'
    ));
  }

  const implTasks = ['q7','q8','q9','q10'].filter(k => getState('s4.' + k) === 'no');
  if (implTasks.length) {
    body.appendChild(createLabelledField(
      'Implementation tasks',
      implTasks.map(k => S21_Q_LABELS[k] || k).join(', '),
      'technical'
    ));
  }
}

const S21_JL_ITEMS = [
  { key: 'submission_point',  label: 'Submission point'             },
  { key: 'pending_execution', label: 'Pending execution handling'   },
  { key: 'webhook_polling',   label: 'Webhook or polling method'    },
  { key: 'enforcement_point', label: 'Downstream enforcement point' },
  { key: 'blocking_behavior', label: 'Blocking behavior'            },
  { key: 'bypass_paths',      label: 'Reported bypass paths'        },
  { key: 'field_mapping',     label: 'Submission field mapping'     },
  { key: 'api_key_storage',   label: 'API key storage'              },
  { key: 'data_handling',     label: 'Data handling'                },
  { key: 'downstream_result', label: 'Downstream result recording'  },
];

const S21_JL_DISP_LABELS = {
  confirmed:           'Confirmed for pilot planning',
  more_info:           'More information required',
  correction_required: 'Correction required',
  not_applicable:      'Not applicable',
};

function s21FillJLReview(body) {
  const list = document.createElement('div');
  list.className = 'jl-review-summary';

  S21_JL_ITEMS.forEach(item => {
    const v = getState('jl.review.' + item.key);
    const row = document.createElement('div');
    row.className = 'jl-review-summary__row';

    const lbl = document.createElement('span');
    lbl.className = 'jl-review-summary__label';
    lbl.textContent = item.label;
    row.appendChild(lbl);

    const val = document.createElement('span');
    val.className = 'jl-review-summary__value jl-review-summary__value--' + (v || 'none');
    val.textContent = S21_JL_DISP_LABELS[v] || 'Not reviewed';
    row.appendChild(val);

    list.appendChild(row);
  });

  body.appendChild(list);
}

function s21FillPilotDecision(body) {
  const decisionKey = getState('jl.decision') || '';
  body.appendChild(createLabelledField(
    'Pilot decision',
    S21_PILOT_DECISION_LABELS[decisionKey] || 'Not completed',
    decisionKey === 'pilot_candidate' ? 'jl-reviewed' : null
  ));

  if (decisionKey === 'pilot_prerequisites') {
    const rec = getState('jl.prerequisite_record') || {};
    if (rec.required_correction) body.appendChild(createLabelledField('Required correction', rec.required_correction, 'jl-reviewed'));
    if (rec.responsible_role)    body.appendChild(createLabelledField('Responsible role',    rec.responsible_role,    'jl-reviewed'));
    if (rec.evidence_required)   body.appendChild(createLabelledField('Evidence required',   rec.evidence_required,   'jl-reviewed'));
  } else if (decisionKey === 'setup_tasks') {
    const rec = getState('jl.setup_record') || {};
    if (rec.required_work)     body.appendChild(createLabelledField('Required setup work', rec.required_work,     'jl-reviewed'));
    if (rec.responsible_role)  body.appendChild(createLabelledField('Responsible role',    rec.responsible_role,  'jl-reviewed'));
    if (rec.evidence_required) body.appendChild(createLabelledField('Evidence required',   rec.evidence_required, 'jl-reviewed'));
  } else if (decisionKey === 'pilot_candidate') {
    const b = getState('jl.pilot_business_owner')  || 'Not assigned';
    const a = getState('jl.pilot_authority_owner') || 'Not assigned';
    const t = getState('jl.pilot_technical_owner') || 'Not assigned';
    body.appendChild(createLabelledField('Business owner',   b, 'jl-reviewed'));
    body.appendChild(createLabelledField('Authority owner',  a, 'jl-reviewed'));
    body.appendChild(createLabelledField('Technical owner',  t, 'jl-reviewed'));
  }
}

function s21FillScope(body) {
  const table = document.createElement('div');
  table.className = 'scope-table';

  const inCol = document.createElement('div');
  inCol.className = 'scope-table__col scope-table__col--in';
  const inHead = document.createElement('div');
  inHead.className = 'scope-table__head scope-table__head--in';
  inHead.textContent = 'In scope';
  inCol.appendChild(inHead);
  S21_SCOPE_IN.forEach(item => {
    const li = document.createElement('div');
    li.className = 'scope-table__item';
    li.textContent = item;
    inCol.appendChild(li);
  });

  const outCol = document.createElement('div');
  outCol.className = 'scope-table__col scope-table__col--out';
  const outHead = document.createElement('div');
  outHead.className = 'scope-table__head scope-table__head--out';
  outHead.textContent = 'Out of scope';
  outCol.appendChild(outHead);
  S21_SCOPE_OUT.forEach(item => {
    const li = document.createElement('div');
    li.className = 'scope-table__item';
    li.textContent = item;
    outCol.appendChild(li);
  });

  table.appendChild(inCol);
  table.appendChild(outCol);
  body.appendChild(table);
}

/* ── CTA cards ───────────────────────────────────────────────────────────── */

function s21BuildCTASection() {
  const wrap = document.createElement('div');
  wrap.className = 'cta-section';

  const heading = document.createElement('p');
  heading.className = 'cta-section__heading';
  heading.textContent = 'Take this further';
  wrap.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'cta-grid';

  /* Email CTA */
  const emailCard = document.createElement('div');
  emailCard.className = 'cta-card cta-card--email';

  const emailIcon = document.createElement('div');
  emailIcon.className = 'cta-card__icon';
  emailIcon.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';
  emailCard.appendChild(emailIcon);

  const emailTitle = document.createElement('div');
  emailTitle.className = 'cta-card__title';
  emailTitle.textContent = 'Receive your result by email';
  emailCard.appendChild(emailTitle);

  const emailBody = document.createElement('p');
  emailBody.className = 'cta-card__body';
  emailBody.textContent = 'We send a summary of your business result, risk score, and technical review.';
  emailCard.appendChild(emailBody);

  const lead = sessionState.lead;

  if (lead) {
    const emailRow = document.createElement('div');
    emailRow.className = 'cta-card__email-row';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.className = 'form-control cta-card__email-input';
    emailInput.value = lead.email || '';
    emailInput.setAttribute('aria-label', 'Email address for delivery');
    emailInput.addEventListener('input', () => {
      sessionState.lead.email = emailInput.value.trim();
    });
    emailRow.appendChild(emailInput);

    const emailBtn = document.createElement('button');
    emailBtn.className = 'btn btn--primary cta-card__action';
    emailBtn.textContent = 'Send';
    emailBtn.addEventListener('click', () => {
      if (typeof sendResultsByEmail === 'function') sendResultsByEmail(emailBtn);
    });
    emailRow.appendChild(emailBtn);

    emailCard.appendChild(emailRow);

    const emailErr = document.createElement('p');
    emailErr.id = 'email-send-error';
    emailErr.className = 'cta-card__error';
    emailErr.style.display = 'none';
    emailErr.innerHTML =
        `Automatic send failed. Contact <a href="mailto:${JL_CONTACT_EMAIL}" `
      + `style="color:var(--agent-orange)">${JL_CONTACT_EMAIL}</a> directly.`;
    emailCard.appendChild(emailErr);
  } else {
    const softNote = document.createElement('p');
    softNote.className = 'cta-card__body';
    softNote.textContent = 'Complete the business assessment first to enable email delivery.';
    emailCard.appendChild(softNote);
  }

  grid.appendChild(emailCard);

  /* Booking CTA */
  const bookCard = document.createElement('div');
  bookCard.className = 'cta-card cta-card--book';

  const bookIcon = document.createElement('div');
  bookIcon.className = 'cta-card__icon';
  bookIcon.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>';
  bookCard.appendChild(bookIcon);

  const bookTitle = document.createElement('div');
  bookTitle.className = 'cta-card__title';
  bookTitle.textContent = 'Schedule a pilot conversation';
  bookCard.appendChild(bookTitle);

  const bookBody = document.createElement('p');
  bookBody.className = 'cta-card__body';
  bookBody.textContent = 'Jochanni Labs reviews your result, validates the integration path, and scopes the pilot.';
  bookCard.appendChild(bookBody);

  const bookLink = document.createElement('a');
  bookLink.href = JL_BOOKING_URL;
  bookLink.target = '_blank';
  bookLink.rel = 'noopener';
  bookLink.className = 'btn btn--primary cta-card__action';
  bookLink.textContent = 'Book time with Jochanni Labs';
  bookCard.appendChild(bookLink);

  grid.appendChild(bookCard);

  wrap.appendChild(grid);
  return wrap;
}

/* ── Pricing panel (pilot_candidate only) ────────────────────────────────── */

function s21BuildPricingPanel() {
  const panel = document.createElement('div');
  panel.className = 'pilot-pricing';

  const heading = document.createElement('div');
  heading.className = 'pilot-pricing__heading';
  heading.textContent = 'Pilot engagement';
  panel.appendChild(heading);

  const price = document.createElement('div');
  price.className = 'pilot-pricing__price';
  price.textContent = '$15,000 total';
  panel.appendChild(price);

  const timeline = document.createElement('div');
  timeline.className = 'pilot-pricing__timeline';

  const milestones = [
    '$7,500 at commencement',
    '$5,000 after shadow calibration',
    '$2,500 after acceptance testing',
  ];

  milestones.forEach((text, i) => {
    const step = document.createElement('div');
    step.className = 'pilot-pricing__milestone';

    const dot = document.createElement('span');
    dot.className = 'pilot-pricing__dot';
    dot.textContent = String(i + 1);
    step.appendChild(dot);

    const lbl = document.createElement('span');
    lbl.className = 'pilot-pricing__milestone-label';
    lbl.textContent = text;
    step.appendChild(lbl);

    timeline.appendChild(step);
  });

  panel.appendChild(timeline);

  const scope = document.createElement('p');
  scope.className = 'pilot-pricing__scope';
  scope.textContent = 'Covers one agent, one action category, and one downstream system through shadow calibration, trigger logic development, and acceptance testing.';
  panel.appendChild(scope);

  return panel;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen21() {
  const screen = document.getElementById('screen-21');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Assessment result';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'DAL-X Simulation Result';
  screen.appendChild(title);

  /* Preliminary findings notice */
  const prelim = document.createElement('div');
  prelim.className = 'callout callout--info';
  prelim.style.marginBottom = 'var(--space-4)';
  prelim.textContent =
    'These findings are preliminary and based on self-reported answers. '
    + 'In a live engagement, Jochanni Labs validates the reported integration path with your team '
    + 'and confirms the risk profile before any recommendation is finalized.';
  screen.appendChild(prelim);

  /* Verdict panel */
  screen.appendChild(s21BuildVerdictPanel());

  /* CTA section (above the evidence sections) */
  screen.appendChild(s21BuildCTASection());

  /* Pricing panel if pilot_candidate */
  if (getState('jl.decision') === 'pilot_candidate') {
    screen.appendChild(s21BuildPricingPanel());
  }

  /* Collapsible evidence sections */
  screen.appendChild(s21BuildCollapsible('Use case',           s21FillUseCase));
  screen.appendChild(s21BuildCollapsible('Trigger evaluation', s21FillTriggerEvaluation));
  screen.appendChild(s21BuildCollapsible('Gate tests',         s21FillGateTests));
  screen.appendChild(s21BuildCollapsible('Technical review',   s21FillTechnicalReview));
  screen.appendChild(s21BuildCollapsible('Jochanni Labs review', s21FillJLReview));
  screen.appendChild(s21BuildCollapsible('Pilot decision',     s21FillPilotDecision));
  screen.appendChild(s21BuildCollapsible('Scope',              s21FillScope));

  /* Disclaimer */
  const disclaimer = document.createElement('p');
  disclaimer.className = 'result-disclaimer';
  disclaimer.textContent = 'This result is not an audit, certification, compliance report, or production proof.';
  screen.appendChild(disclaimer);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav screen-nav--start';
  nav.style.marginTop = 'var(--space-6)';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', goBack);
  nav.appendChild(backBtn);

  screen.appendChild(nav);
  if (typeof createBrandFooter === 'function') {
    screen.appendChild(createBrandFooter());
  }

  /* Completion webhook (fire once per session) */
  if (sessionState.lead && !sessionState.webhookFired) {
    sessionState.webhookFired = true;
    if (typeof fireCompletionWebhook === 'function') fireCompletionWebhook();
  }
}

document.addEventListener('DOMContentLoaded', renderScreen21);
