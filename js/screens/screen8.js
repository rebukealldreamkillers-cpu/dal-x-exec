/* ─── Screen 8: Business result ─────────────────────────────────────────── */

/* ── Risk weight tables (unchanged) ─────────────────────────────────────── */

const S8_EXECUTION_RISK = {
  recommendations_only:        0,
  send_external_communication: 1,
  modify_records:              2,
  export_data:                 3,
  deploy_code:                 3,
  change_infrastructure:       4,
  change_system_access:        4,
  delete_data:                 4,
  commit_funds:                5,
};

const S8_SYSTEM_RISK = {
  communication_platform: 1,
  enterprise_application: 2,
  data_warehouse:         2,
  database:               3,
  deployment_pipeline:    3,
  cloud_platform:         4,
  identity_platform:      4,
  payment_system:         5,
};

const S8_CONSEQUENCE_RISK = {
  customer_effect:      1,
  access_change:        2,
  production_change:    2,
  sensitive_data:       3,
  difficult_to_reverse: 3,
  financial_effect:     4,
  regulatory_exposure:  4,
};

const S8_RISK_BAND_LABELS = {
  critical: 'Critical',
  high:     'High',
  medium:   'Medium',
  low:      'Low',
  none:     'None',
};

/* Score-to-arc mapping. Max total is 18. */
const S8_RISK_SCORE_MAX = 18;

/* ── Outcome configurations (preserved) ────────────────────────────────── */

const S8_OUTCOMES = {
  not_applicable: {
    decision: {
      title:             'Business result',
      state:             'No enforcement gap applies to this workflow',
      reason:            'The agent produces recommendations only, has no downstream system, or has no consequential effect. There is no execution gap for DAL-X to enforce.',
      required_response: 'None.',
      what_happens_next: 'No DAL-X pilot is proposed for this workflow.',
      variant:           'neutral',
    },
    evidence:    'business',
    showProceed: false,
  },

  critical_gap: {
    decision: {
      title:             'Business result',
      state:             'Critical enforcement gap',
      reason:            'A high-stakes execution reaches a downstream system with no enforcement gate. This is the highest-priority DAL-X use case.',
      required_response: 'Identify the authority owner, downstream system owner, and confirm scope for pilot planning.',
      what_happens_next: 'Jochanni Labs works with you to configure the execution simulation.',
      variant:           'accepted',
    },
    evidence:    'business',
    showProceed: true,
  },

  gap_identified: {
    decision: {
      title:             'Business result',
      state:             'Enforcement gap identified',
      reason:            'A consequential execution reaches a downstream system without a required approval gate. The risk profile of this workflow warrants DAL-X enforcement.',
      required_response: 'Identify the authority owner and downstream system owner.',
      what_happens_next: 'Jochanni Labs works with you to configure the execution simulation.',
      variant:           'accepted',
    },
    evidence:    'business',
    showProceed: true,
  },

  gap_low_priority: {
    decision: {
      title:             'Business result',
      state:             'Gap identified, lower priority',
      reason:            'An enforcement gap exists but the risk profile of this workflow is limited. DAL-X would close the gap, but higher-stakes workflows should be assessed first.',
      required_response: 'Determine whether the risk profile warrants a pilot now or later.',
      what_happens_next: 'Jochanni Labs can configure a simulation if the enterprise chooses to proceed.',
      variant:           'pending',
    },
    evidence:    'business',
    showProceed: true,
  },

  high_risk_no_requirement: {
    decision: {
      title:             'Business result',
      state:             'High-stakes workflow with no enforcement requirement',
      reason:            'The risk profile of this workflow is high, but the enterprise has stated no enforcement gate is required. This policy decision is flagged for review.',
      required_response: 'Confirm whether the absence of an enforcement requirement is an intentional policy decision or an oversight.',
      what_happens_next: 'The assessment closes. The enterprise may request reassessment if the policy changes.',
      variant:           'pending',
    },
    evidence:    'business',
    showProceed: false,
  },

  enforcement_not_established: {
    decision: {
      title:             'Business result',
      state:             'No enforcement requirement for this workflow',
      reason:            'The enterprise does not require a gate before execution. DAL-X enforces a gate. If no gate is required, there is nothing to enforce.',
      required_response: 'None.',
      what_happens_next: 'The assessment closes.',
      variant:           'neutral',
    },
    evidence:    'business',
    showProceed: false,
  },

  urgent_investigation: {
    /* Rendered by buildIncompleteScreen — not through createDecisionBlock */
    isIncomplete: true,
    urgentRisk:   true,
    evidence:     'business',
    showProceed:  false,
  },

  more_info_required: {
    /* Rendered by buildIncompleteScreen — not through createDecisionBlock */
    isIncomplete: true,
    urgentRisk:   false,
    evidence:     'business',
    showProceed:  false,
  },
};

/* ── Evaluation logic (unchanged) ───────────────────────────────────────── */

function evaluateBusinessResult() {
  const agentType    = getState('s2.agent_type')                 || '';
  const execution    = getState('s2.proposed_execution')         || '';
  const downstream   = getState('s2.downstream_system')          || '';
  const consequences = getState('s2.consequences')               || [];
  const authResponse = getState('s2.missing_authority_response') || '';

  if (
    execution  === 'recommendations_only' ||
    downstream === 'none'                 ||
    consequences.includes('none')
  ) {
    setState('s2.risk_score',       0);
    setState('s2.risk_band',        'none');
    setState('s2.risk_execution',   0);
    setState('s2.risk_system',      0);
    setState('s2.risk_consequence', 0);
    setState('s2.missing_fields',   []);
    return 'not_applicable';
  }

  const executionRisk   = S8_EXECUTION_RISK[execution]  || 0;
  const systemRisk      = S8_SYSTEM_RISK[downstream]    || 0;
  const consequenceRisk = Math.min(
    consequences.reduce((sum, c) => sum + (S8_CONSEQUENCE_RISK[c] || 0), 0),
    8
  );
  const riskScore = executionRisk + systemRisk + consequenceRisk;
  const riskBand  =
    riskScore >= 12 ? 'critical' :
    riskScore >= 8  ? 'high'     :
    riskScore >= 4  ? 'medium'   :
    riskScore >= 1  ? 'low'      : 'none';

  setState('s2.risk_score',       riskScore);
  setState('s2.risk_band',        riskBand);
  setState('s2.risk_execution',   executionRisk);
  setState('s2.risk_system',      systemRisk);
  setState('s2.risk_consequence', consequenceRisk);

  const unansweredFields = [];
  const unknownFields    = [];

  if (!agentType)                      unansweredFields.push('AI agent');
  else if (agentType === 'not_sure')   unknownFields.push('AI agent');

  if (!execution)                      unansweredFields.push('Proposed execution');
  else if (execution === 'not_sure')   unknownFields.push('Proposed execution');

  if (!downstream)                     unansweredFields.push('Downstream system');
  else if (downstream === 'not_sure')  unknownFields.push('Downstream system');

  if (!consequences.length)                            unansweredFields.push('Consequence');
  else if (consequences.every(v => v === 'not_sure'))  unknownFields.push('Consequence');

  if (!authResponse)                   unansweredFields.push('Current enforcement gap');
  else if (authResponse === 'unknown') unknownFields.push('Current enforcement gap');

  setState('s2.unanswered_fields', unansweredFields);
  setState('s2.unknown_fields',    unknownFields);
  setState('s2.missing_fields', [...unansweredFields, ...unknownFields]);

  if (unansweredFields.length > 0 || unknownFields.length > 0) {
    return riskScore >= 8 ? 'urgent_investigation' : 'more_info_required';
  }

  if (authResponse === 'must_stop') {
    if (riskScore >= 12) return 'critical_gap';
    if (riskScore >= 4)  return 'gap_identified';
    return 'gap_low_priority';
  }

  if (authResponse === 'may_continue') {
    return riskScore >= 8 ? 'high_risk_no_requirement' : 'enforcement_not_established';
  }

  return 'more_info_required';
}

/* ── Risk gauge (SVG animated arc) ──────────────────────────────────────── */

function buildRiskGauge(score, band) {
  const wrap = document.createElement('div');
  wrap.className = 'risk-gauge';

  const clamped = Math.max(0, Math.min(score, S8_RISK_SCORE_MAX));
  const ratio = clamped / S8_RISK_SCORE_MAX;

  /* Arc geometry. Full sweep spans 220 degrees, from 160deg to 380deg. */
  const startAngle = 160;
  const endAngle   = 380;
  const totalSweep = endAngle - startAngle;
  const targetSweep = totalSweep * ratio;

  const cx = 100, cy = 105, r = 82;

  function polar(angle) {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(fromAngle, toAngle) {
    const start = polar(fromAngle);
    const end   = polar(toAngle);
    const largeArc = (toAngle - fromAngle) <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const trackPath  = arcPath(startAngle, endAngle);
  const filledPath = targetSweep > 0
    ? arcPath(startAngle, startAngle + Math.max(targetSweep, 0.1))
    : '';

  /* Approximate arc length for stroke-dasharray animation */
  const arcLen = (2 * Math.PI * r) * (totalSweep / 360);
  const filledLen = (2 * Math.PI * r) * (Math.max(targetSweep, 0.1) / 360);

  wrap.innerHTML = `
    <svg viewBox="0 0 200 160" class="risk-gauge__svg">
      <defs>
        <linearGradient id="riskGaugeGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"   stop-color="#10B981"/>
          <stop offset="50%"  stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#EF4444"/>
        </linearGradient>
      </defs>
      <path d="${trackPath}" class="risk-gauge__track" />
      ${filledPath ? `<path d="${filledPath}" class="risk-gauge__fill risk-gauge__fill--${band}"
                          stroke-dasharray="${filledLen} ${arcLen}"
                          style="stroke-dashoffset:${filledLen};" />` : ''}
      <text x="100" y="100" text-anchor="middle" class="risk-gauge__value" data-target="${clamped}">0</text>
      <text x="100" y="126" text-anchor="middle" class="risk-gauge__max">out of ${S8_RISK_SCORE_MAX}</text>
    </svg>
    <div class="risk-gauge__band risk-gauge__band--${band}">${S8_RISK_BAND_LABELS[band] || band}</div>
  `;

  /* Animate the arc reveal and the counter after mount. */
  requestAnimationFrame(() => {
    const fillEl = wrap.querySelector('.risk-gauge__fill');
    if (fillEl) {
      fillEl.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)';
      fillEl.style.strokeDashoffset = '0';
    }
    const valEl = wrap.querySelector('.risk-gauge__value');
    if (valEl) {
      const target = parseInt(valEl.getAttribute('data-target'), 10) || 0;
      const duration = 800;
      const startTime = performance.now();
      function step(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        valEl.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  });

  return wrap;
}

/* ── Compliance exposure panel ──────────────────────────────────────────── */

const S8_COMPLIANCE_MAP = {
  financial_effect:    ['SOX', 'Reg E'],
  regulatory_exposure: ['FINRA', 'AML', 'SOX'],
  sensitive_data:      ['GDPR', 'CCPA'],
  access_change:       ['SOC 2'],
  customer_effect:     ['CFPB', 'Reg E'],
};

function buildCompliancePanel() {
  const consequences = getState('s2.consequences') || [];
  const frameworks = new Set();
  consequences.forEach(c => {
    const list = S8_COMPLIANCE_MAP[c];
    if (list) list.forEach(f => frameworks.add(f));
  });

  if (frameworks.size === 0) return null;

  const panel = document.createElement('div');
  panel.className = 'compliance-panel';

  const heading = document.createElement('div');
  heading.className = 'compliance-panel__heading';
  heading.textContent = 'Regulatory exposure areas';
  panel.appendChild(heading);

  const chips = document.createElement('div');
  chips.className = 'compliance-panel__chips';
  Array.from(frameworks).forEach(f => {
    const chip = document.createElement('span');
    chip.className = 'compliance-chip';
    chip.textContent = f;
    chips.appendChild(chip);
  });
  panel.appendChild(chips);

  const note = document.createElement('p');
  note.className = 'compliance-panel__note';
  note.textContent =
    'Based on reported consequences. Verify against your compliance program.';
  panel.appendChild(note);

  return panel;
}

/* ── Personalized gap statement ─────────────────────────────────────────── */

function buildPersonalizedGapCallout() {
  const agentRaw      = getState('s2.agent_type')                || '';
  const executionRaw  = getState('s2.proposed_execution')        || '';
  const downstreamRaw = getState('s2.downstream_system')         || '';
  const agentCustom   = getState('s2.agent_type_custom')         || '';
  const execCustom    = getState('s2.proposed_execution_custom') || '';
  const dsCustom      = getState('s2.downstream_system_custom')  || '';

  const AGENT_LABELS = {
    infrastructure_agent:   'infrastructure agent',
    cybersecurity_agent:    'cybersecurity agent',
    data_agent:             'data agent',
    customer_service_agent: 'customer service agent',
    procurement_agent:      'procurement agent',
    treasury_agent:         'treasury agent',
    compliance_agent:       'compliance agent',
  };
  const EXECUTION_LABELS = {
    change_infrastructure:       'change production infrastructure',
    export_data:                 'export data',
    change_system_access:        'change system access',
    deploy_code:                 'deploy code',
    modify_records:              'modify records',
    send_external_communication: 'send external communication',
    commit_funds:                'commit funds',
    delete_data:                 'delete data',
  };
  const DOWNSTREAM_LABELS = {
    cloud_platform:         'cloud platform',
    database:               'database',
    identity_platform:      'identity platform',
    deployment_pipeline:    'deployment pipeline',
    communication_platform: 'communication platform',
    enterprise_application: 'enterprise application',
    payment_system:         'payment system',
    data_warehouse:         'data warehouse',
  };

  const agent      = agentCustom || AGENT_LABELS[agentRaw]      || agentRaw      || 'your AI agent';
  const execution  = execCustom  || EXECUTION_LABELS[executionRaw]  || executionRaw  || 'take this action';
  const downstream = dsCustom    || DOWNSTREAM_LABELS[downstreamRaw] || downstreamRaw || 'the downstream system';

  const gap = document.createElement('div');
  gap.className = 'gap-statement';

  const strong = document.createElement('strong');
  strong.textContent = 'This is your current exposure. ';
  gap.appendChild(strong);
  gap.appendChild(document.createTextNode(
    `You described a ${agent} that can ${execution} on your ${downstream}. `
    + 'Right now, without DAL-X, nothing in that path requires authorization before execution proceeds. '
    + 'This is happening in your environment today.'
  ));

  return gap;
}

/* ── Renderer ───────────────────────────────────────────────────────────── */

const S8_GAP_OUTCOMES = new Set([
  'critical_gap', 'gap_identified', 'gap_low_priority', 'urgent_investigation',
]);

const S8_HIGH_URGENCY = new Set(['critical_gap', 'gap_identified']);
const S8_MODERATE     = new Set(['gap_low_priority']);
const S8_BLOCKED_PATH = new Set(['high_risk_no_requirement', 'enforcement_not_established']);
const S8_RESOLVED     = new Set(['not_applicable']);

function s8HeadingClass(resultKey) {
  if (S8_HIGH_URGENCY.has(resultKey)) return 'screen-title screen-title--urgent';
  if (S8_MODERATE.has(resultKey))     return 'screen-title screen-title--moderate';
  if (S8_BLOCKED_PATH.has(resultKey)) return 'screen-title screen-title--blocked';
  if (S8_RESOLVED.has(resultKey))     return 'screen-title screen-title--resolved';
  return 'screen-title';
}

/* ── Incomplete assessment renderer ─────────────────────────────────────── */
/*
 * Used for urgent_investigation and more_info_required outcomes.
 * These are not final decisions — they mean the visitor left questions
 * blank or marked them Unknown. Show exactly what is missing and what
 * to do about each type, then let the visitor go back and fix it.
 */
function buildIncompleteScreen(screen, resultKey, cfg) {
  const unanswered = getState('s2.unanswered_fields') || [];
  const unknown    = getState('s2.unknown_fields')    || [];
  const riskScore  = getState('s2.risk_score') || 0;
  const riskBand   = getState('s2.risk_band')  || 'none';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 2 · Guided business assessment';
  screen.appendChild(badge);

  /* Heading */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Assessment incomplete';
  screen.appendChild(title);

  /* Context paragraph — different for urgent vs. standard */
  const context = document.createElement('p');
  context.className = 'incomplete-context';
  if (cfg.urgentRisk) {
    context.textContent =
      'The answers you provided score as high risk — but the assessment cannot reach a final result '
      + 'until every question has a confirmed answer. Go back and complete the fields shown below.';
  } else {
    context.textContent =
      'One or more questions were left blank or marked as Unknown. '
      + 'The assessment cannot determine whether an enforcement gap exists until those are resolved.';
  }
  screen.appendChild(context);

  /* Show risk band if high urgency, so the visitor understands the stakes */
  if (cfg.urgentRisk && riskScore > 0) {
    const riskNote = document.createElement('div');
    riskNote.className = `s8-risk-note s8-risk-note--${riskBand}`;
    riskNote.innerHTML =
      `<span class="s8-risk-note__score">${riskScore}</span>`
      + `<span class="s8-risk-note__label">Partial risk score — ${S8_RISK_BAND_LABELS[riskBand] || riskBand} based on answers given so far</span>`;
    screen.appendChild(riskNote);
  }

  /* Unanswered fields */
  if (unanswered.length > 0) {
    const section = document.createElement('div');
    section.className = 's8-gap-section';

    const heading = document.createElement('div');
    heading.className = 's8-gap-section__heading';
    heading.textContent = unanswered.length === 1
      ? '1 question was not answered'
      : `${unanswered.length} questions were not answered`;
    section.appendChild(heading);

    const list = document.createElement('ul');
    list.className = 's8-gap-list';
    unanswered.forEach(field => {
      const li = document.createElement('li');
      li.className = 's8-gap-list__item';
      li.textContent = field;
      list.appendChild(li);
    });
    section.appendChild(list);

    const action = document.createElement('p');
    action.className = 's8-gap-section__action';
    action.textContent = 'Use the Back button to return and select an answer for each.';
    section.appendChild(action);

    screen.appendChild(section);
  }

  /* Unknown fields */
  if (unknown.length > 0) {
    const section = document.createElement('div');
    section.className = 's8-gap-section s8-gap-section--unknown';

    const heading = document.createElement('div');
    heading.className = 's8-gap-section__heading';
    heading.textContent = unknown.length === 1
      ? '1 field was answered as Unknown'
      : `${unknown.length} fields were answered as Unknown`;
    section.appendChild(heading);

    const list = document.createElement('ul');
    list.className = 's8-gap-list';
    unknown.forEach(field => {
      const li = document.createElement('li');
      li.className = 's8-gap-list__item';
      li.textContent = field;
      list.appendChild(li);
    });
    section.appendChild(list);

    const action = document.createElement('p');
    action.className = 's8-gap-section__action';
    action.textContent =
      'Unknown is the right answer when your organization does not yet have this information. '
      + 'To complete the assessment, involve the agent service owner, the downstream system owner, '
      + 'or your security team. Return once each field has a confirmed answer.';
    section.appendChild(action);

    screen.appendChild(section);
  }

  /* Nav — back only */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav screen-nav--start';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-7'));
  nav.appendChild(backBtn);

  screen.appendChild(nav);
}

function renderScreen8() {
  const resultKey = evaluateBusinessResult();
  setState('s2.business_result', resultKey);

  const cfg    = S8_OUTCOMES[resultKey];
  const screen = document.getElementById('screen-8');
  screen.innerHTML = '';

  /* Incomplete outcomes get their own renderer — no decision block */
  if (cfg.isIncomplete) {
    buildIncompleteScreen(screen, resultKey, cfg);
    return;
  }

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 2 · Guided business assessment';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = s8HeadingClass(resultKey);
  title.textContent = cfg.decision.state;
  screen.appendChild(title);

  const riskScore = getState('s2.risk_score') || 0;
  const riskBand  = getState('s2.risk_band')  || 'none';

  /* Gauge for high-urgency and moderate outcomes only */
  if (S8_HIGH_URGENCY.has(resultKey) || S8_MODERATE.has(resultKey)) {
    screen.appendChild(buildRiskGauge(riskScore, riskBand));
  }

  /* Personalized gap statement in glass card with red left border for high urgency */
  if (S8_HIGH_URGENCY.has(resultKey)) {
    screen.appendChild(buildPersonalizedGapCallout());
  }

  /* Compliance panel for critical_gap and gap_identified */
  if (S8_HIGH_URGENCY.has(resultKey)) {
    const compliance = buildCompliancePanel();
    if (compliance) screen.appendChild(compliance);
  }

  /* Blocked-path state panel */
  if (S8_BLOCKED_PATH.has(resultKey)) {
    const blockedPanel = document.createElement('div');
    blockedPanel.className = 'blocked-state-panel';
    const blockedHeading = document.createElement('div');
    blockedHeading.className = 'blocked-state-panel__heading';
    blockedHeading.textContent = 'Enforcement requirement not established';
    blockedPanel.appendChild(blockedHeading);
    const blockedBody = document.createElement('p');
    blockedBody.className = 'blocked-state-panel__body';
    blockedBody.textContent = cfg.decision.reason;
    blockedPanel.appendChild(blockedBody);
    screen.appendChild(blockedPanel);
  }

  /* Resolved-state confirmation for not_applicable */
  if (S8_RESOLVED.has(resultKey)) {
    const resolvedPanel = document.createElement('div');
    resolvedPanel.className = 'resolved-state-panel';
    const resolvedBody = document.createElement('p');
    resolvedBody.className = 'resolved-state-panel__body';
    resolvedBody.textContent = cfg.decision.reason;
    resolvedPanel.appendChild(resolvedBody);
    screen.appendChild(resolvedPanel);
  }

  /* "What this means" paragraph, plain text */
  if (S8_HIGH_URGENCY.has(resultKey) || S8_MODERATE.has(resultKey)) {
    const meansHeading = document.createElement('p');
    meansHeading.className = 'section-label';
    meansHeading.style.marginTop = 'var(--space-6)';
    meansHeading.textContent = 'What this means';
    screen.appendChild(meansHeading);

    const meansPara = document.createElement('p');
    meansPara.className = 'what-this-means';
    meansPara.textContent = cfg.decision.reason;
    screen.appendChild(meansPara);
  }

  /* Decision block preserved for outcome detail */
  screen.appendChild(createDecisionBlock(cfg.decision));

  /* Evidence label */
  const evidenceLine = document.createElement('p');
  evidenceLine.style.cssText =
    'margin-top:var(--space-5);font-size:var(--text-sm);color:var(--color-text-secondary);';
  evidenceLine.appendChild(document.createTextNode('Evidence '));
  evidenceLine.appendChild(createEvidenceLabel(cfg.evidence));
  screen.appendChild(evidenceLine);

  /* Proceed callout */
  if (cfg.showProceed) {
    const proceedNote = document.createElement('div');
    proceedNote.className = 'callout callout--info';
    proceedNote.style.marginTop = 'var(--space-6)';
    proceedNote.textContent =
      'Next step. You and Jochanni Labs will configure the execution simulation together, '
      + 'using your enterprise policy and submission fields.';
    screen.appendChild(proceedNote);
  }

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = cfg.showProceed ? 'screen-nav' : 'screen-nav screen-nav--start';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-7'));
  nav.appendChild(backBtn);

  if (cfg.showProceed) {
    const proceedBtn = document.createElement('button');
    proceedBtn.className = 'btn btn--primary';
    proceedBtn.textContent = 'Proceed to simulation';
    proceedBtn.addEventListener('click', () => {
      if (typeof renderScreen9 === 'function') renderScreen9();
      showScreen('screen-9');
    });
    nav.appendChild(proceedBtn);
  }

  screen.appendChild(nav);

  /* Lead capture modal, preserved trigger and gating */
  if (S8_GAP_OUTCOMES.has(resultKey) && !sessionState.lead) {
    document.getElementById('lead-capture-modal')?.remove();
    document.body.appendChild(buildLeadCaptureModal(resultKey, () => {
      /* Modal dismissed, result is already rendered beneath it */
    }));
  }
}

document.addEventListener('DOMContentLoaded', renderScreen8);
