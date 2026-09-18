/* ─── Screen 8: Business Result ─────────────────────────────────────────── */

/* ── Risk weight tables ──────────────────────────────────────────────────── */

/*
 * Each answer contributes an independent risk score.
 * The enforcement gap is a modifier applied against the combined score,
 * not the sole determinant of the outcome.
 *
 * Execution risk  : 0–5  (how consequential is the action itself?)
 * System risk     : 1–5  (how sensitive is the downstream system?)
 * Consequence risk: capped at 8 across all selected consequences
 * Total max       : ~18  (5 + 5 + 8)
 *
 * Score bands:
 *   Critical  ≥ 12   (e.g. commit_funds + payment_system + financial + regulatory)
 *   High       8–11   (e.g. delete_data + database + sensitive_data + regulatory)
 *   Medium     4–7    (e.g. deploy_code + deployment_pipeline + production_change)
 *   Low        1–3    (e.g. modify_records + enterprise_application)
 *   None        0     (recommendations only or no downstream)
 */

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

/* ── Outcome configurations ──────────────────────────────────────────────── */

const S8_OUTCOMES = {
  not_applicable: {
    decision: {
      title:             'Business Result',
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
      title:             'Business Result',
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
      title:             'Business Result',
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
      title:             'Business Result',
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
      title:             'Business Result',
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
      title:             'Business Result',
      state:             'No enforcement requirement for this workflow',
      reason:            'The enterprise does not require a gate before execution. DAL-X enforces a gate — if no gate is required, there is nothing to enforce.',
      required_response: 'None.',
      what_happens_next: 'The assessment closes.',
      variant:           'neutral',
    },
    evidence:    'business',
    showProceed: false,
  },

  urgent_investigation: {
    decision: {
      title:             'Business Result',
      state:             'Urgent: high-risk workflow with incomplete answers',
      reason:            'The risk profile is high but required answers are missing. The enforcement status of this workflow cannot be confirmed.',
      required_response: 'Urgently confirm the missing information with the agent service owner and downstream system owner.',
      what_happens_next: 'The assessment closes. Request reassessment when the information is confirmed.',
      variant:           'pending',
    },
    evidence:    'business',
    showProceed: false,
  },

  more_info_required: {
    decision: {
      title:             'Business Result',
      state:             'More information required',
      reason:            'Required answers about the agent, execution type, downstream system, consequence, or enforcement gap are missing or unknown.',
      required_response: 'Confirm the missing information.',
      what_happens_next: 'The assessment closes. Request reassessment when the information is available.',
      variant:           'pending',
    },
    evidence:    'business',
    showProceed: false,
  },
};

/* ── Evaluation logic ────────────────────────────────────────────────────── */

function evaluateBusinessResult() {
  const agentType    = getState('s2.agent_type')                 || '';
  const execution    = getState('s2.proposed_execution')         || '';
  const downstream   = getState('s2.downstream_system')          || '';
  const consequences = getState('s2.consequences')               || [];
  const authResponse = getState('s2.missing_authority_response') || '';

  const isKnown = v => Boolean(v) && v !== 'not_sure';
  const hasKnownConsequence =
    consequences.length > 0 && !consequences.every(v => v === 'not_sure');

  /* ── 1. Not applicable ──────────────────────────────────────────────── */
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
    return 'not_applicable';
  }

  /* ── 2. Compute risk score from all available answers ───────────────── */
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

  /* ── 3. Missing required information ────────────────────────────────── */
  if (
    !isKnown(agentType)    ||
    !isKnown(execution)    ||
    !isKnown(downstream)   ||
    !hasKnownConsequence   ||
    !authResponse || authResponse === 'unknown'
  ) {
    return riskScore >= 8 ? 'urgent_investigation' : 'more_info_required';
  }

  /* ── 4. Enforcement gap present (no gate exists) ────────────────────── */
  if (authResponse === 'must_stop') {
    if (riskScore >= 12) return 'critical_gap';
    if (riskScore >= 4)  return 'gap_identified';
    return 'gap_low_priority';
  }

  /* ── 5. No enforcement requirement ──────────────────────────────────── */
  if (authResponse === 'may_continue') {
    return riskScore >= 8 ? 'high_risk_no_requirement' : 'enforcement_not_established';
  }

  return 'more_info_required';
}

/* ── Verdict banner builder ──────────────────────────────────────────────── */

function buildBusinessVerdictBanner(resultKey) {
  const configs = {
    not_applicable: {
      variant: 'no',
      verdict: 'NOT APPLICABLE',
      label:   'DAL-X does not apply to this workflow',
      sub:     'The agent produces recommendations only, has no downstream system, or has no consequential effect.',
    },
    critical_gap: {
      variant: 'critical',
      verdict: 'CRITICAL GAP',
      label:   'High-stakes execution with no enforcement gate',
      sub:     'The combination of execution type, downstream system, and consequences places this in the highest-priority enforcement gap category.',
    },
    gap_identified: {
      variant: 'yes',
      verdict: 'GAP IDENTIFIED',
      label:   'Consequential execution with no enforcement gate',
      sub:     'The risk profile of this workflow warrants a DAL-X enforcement gate before the downstream system executes.',
    },
    gap_low_priority: {
      variant: 'inconclusive',
      verdict: 'LOWER PRIORITY',
      label:   'A gap exists but the risk profile is limited',
      sub:     'DAL-X would close this gap. Based on the execution type, system, and consequences reported, higher-stakes workflows should be assessed first.',
    },
    high_risk_no_requirement: {
      variant: 'inconclusive',
      verdict: 'POLICY FLAGGED',
      label:   'High-stakes workflow with no enforcement requirement',
      sub:     'The risk profile is high, but no enforcement gate has been established as a requirement. This is unusual for this combination of execution type and downstream system.',
    },
    enforcement_not_established: {
      variant: 'no',
      verdict: 'NOT NEEDED',
      label:   'No enforcement requirement for this workflow',
      sub:     'The enterprise does not require a gate before execution. DAL-X enforces a gate — if none is required, there is nothing to enforce.',
    },
    urgent_investigation: {
      variant: 'inconclusive',
      verdict: 'URGENT',
      label:   'High-stakes workflow with unknown enforcement status',
      sub:     'The risk profile is high but required answers are missing. The enforcement gap cannot be confirmed without them.',
    },
    more_info_required: {
      variant: 'inconclusive',
      verdict: 'INCONCLUSIVE',
      label:   'Required information is missing',
      sub:     'One or more required answers are unknown. The assessment cannot determine whether an enforcement gap exists.',
    },
  };
  const cfg    = configs[resultKey] || configs.more_info_required;
  const banner = document.createElement('div');
  banner.className = `verdict-banner verdict-banner--${cfg.variant}`;

  const verdict = document.createElement('div');
  verdict.className = 'verdict-banner__verdict';
  verdict.textContent = cfg.verdict;

  const label = document.createElement('div');
  label.className = 'verdict-banner__label';
  label.textContent = cfg.label;

  const sub = document.createElement('div');
  sub.className = 'verdict-banner__sub';
  sub.textContent = cfg.sub;

  banner.appendChild(verdict);
  banner.appendChild(label);
  banner.appendChild(sub);
  return banner;
}

/* ── Risk profile panel ──────────────────────────────────────────────────── */

function s8LookupLabel(value, optionsArray) {
  if (!value || !optionsArray) return value || 'Not specified';
  const found = optionsArray.find(o => o.value === value);
  return found ? found.label : value;
}

function s8ConsequenceSummary(values) {
  if (!values || !values.length) return 'None';
  const opts = typeof S7_CONSEQUENCE_OPTIONS !== 'undefined' ? S7_CONSEQUENCE_OPTIONS : [];
  const labels = values
    .filter(v => v !== 'not_sure' && v !== 'none')
    .map(v => s8LookupLabel(v, opts));
  if (!labels.length) return 'None';
  if (labels.length <= 2) return labels.join(', ');
  return `${labels.slice(0, 2).join(', ')} + ${labels.length - 2} more`;
}

function buildRiskProfilePanel() {
  const execution    = getState('s2.proposed_execution') || '';
  const downstream   = getState('s2.downstream_system')  || '';
  const consequences = getState('s2.consequences')        || [];
  const riskScore    = getState('s2.risk_score')          || 0;
  const riskBand     = getState('s2.risk_band')           || 'none';
  const execRisk     = getState('s2.risk_execution')      || 0;
  const sysRisk      = getState('s2.risk_system')         || 0;
  const consRisk     = getState('s2.risk_consequence')    || 0;

  const execOpts = typeof S7_EXECUTION_OPTIONS   !== 'undefined' ? S7_EXECUTION_OPTIONS   : [];
  const sysOpts  = typeof S7_DOWNSTREAM_OPTIONS  !== 'undefined' ? S7_DOWNSTREAM_OPTIONS  : [];

  const panel = document.createElement('div');
  panel.style.marginTop = 'var(--space-6)';

  const heading = document.createElement('p');
  heading.className = 'section-label';
  heading.textContent = 'Risk profile (self-reported)';
  panel.appendChild(heading);

  const note = document.createElement('p');
  note.style.cssText =
    'font-size:var(--text-xs);color:var(--color-text-muted);'
    + 'margin-bottom:var(--space-3);line-height:1.5;';
  note.textContent =
    'Scores are derived from your reported answers. '
    + 'Jochanni Labs reviews these figures with you before any recommendation is finalized.';
  panel.appendChild(note);

  const table = document.createElement('div');
  table.style.cssText =
    'border:1px solid var(--color-border);border-radius:8px;overflow:hidden;';

  const rows = [
    {
      label: 'Execution type',
      value: s8LookupLabel(execution, execOpts) || 'Not specified',
      score: execRisk,
      max:   5,
    },
    {
      label: 'Downstream system',
      value: s8LookupLabel(downstream, sysOpts) || 'Not specified',
      score: sysRisk,
      max:   5,
    },
    {
      label: 'Consequences',
      value: s8ConsequenceSummary(consequences),
      score: consRisk,
      max:   8,
    },
  ];

  rows.forEach((row, i) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'risk-profile-row';
    if (i < rows.length - 1) rowEl.style.borderBottom = '1px solid var(--color-border)';

    const keyEl = document.createElement('div');
    keyEl.className = 'risk-profile-row__label';
    keyEl.textContent = row.label;

    const valEl = document.createElement('div');
    valEl.className = 'risk-profile-row__value';
    valEl.textContent = row.value;

    const scoreEl = document.createElement('div');
    scoreEl.className = 'risk-profile-row__score';
    scoreEl.textContent = `${row.score} / ${row.max}`;

    rowEl.appendChild(keyEl);
    rowEl.appendChild(valEl);
    rowEl.appendChild(scoreEl);
    table.appendChild(rowEl);
  });

  /* Total row */
  const totalRow = document.createElement('div');
  totalRow.className = 'risk-profile-row risk-profile-row--total';

  const totalKey = document.createElement('div');
  totalKey.className = 'risk-profile-row__label';
  totalKey.textContent = 'Total risk score';

  const bandEl = document.createElement('div');
  bandEl.className = 'risk-profile-row__value';
  bandEl.textContent = S8_RISK_BAND_LABELS[riskBand] || riskBand;

  const totalScore = document.createElement('div');
  totalScore.className = 'risk-profile-row__score';
  totalScore.textContent = String(riskScore);

  totalRow.appendChild(totalKey);
  totalRow.appendChild(bandEl);
  totalRow.appendChild(totalScore);
  table.appendChild(totalRow);

  panel.appendChild(table);
  return panel;
}

/* ── Renderer ────────────────────────────────────────────────────────────── */

/* Gap outcomes that trigger lead capture */
const S8_GAP_OUTCOMES = new Set([
  'critical_gap', 'gap_identified', 'gap_low_priority', 'urgent_investigation',
]);

function renderScreen8() {
  const resultKey = evaluateBusinessResult();
  setState('s2.business_result', resultKey);

  const cfg    = S8_OUTCOMES[resultKey];
  const screen = document.getElementById('screen-8');
  screen.innerHTML = '';

  /* Verdict banner */
  screen.appendChild(buildBusinessVerdictBanner(resultKey));

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 2 · Guided Business Assessment';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Business Result';
  screen.appendChild(title);

  /* Decision state block */
  screen.appendChild(createDecisionBlock(cfg.decision));

  /* Risk profile panel (not shown for not_applicable with score 0) */
  const riskScore = getState('s2.risk_score') || 0;
  if (riskScore > 0 || resultKey !== 'not_applicable') {
    screen.appendChild(buildRiskProfilePanel());
  }

  /* Evidence label */
  const evidenceLine = document.createElement('p');
  evidenceLine.style.cssText =
    'margin-top:var(--space-5);font-size:var(--text-sm);'
    + 'color:var(--color-text-secondary);';
  evidenceLine.appendChild(document.createTextNode('Evidence: '));
  evidenceLine.appendChild(createEvidenceLabel(cfg.evidence));
  screen.appendChild(evidenceLine);

  /* Proceed callout */
  if (cfg.showProceed) {
    const proceedNote = document.createElement('div');
    proceedNote.className = 'callout callout--info';
    proceedNote.style.marginTop = 'var(--space-6)';
    proceedNote.textContent =
      'Next step: You and Jochanni Labs will configure the execution simulation together, '
      + 'using your enterprise policy and submission fields.';
    screen.appendChild(proceedNote);
  }

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = cfg.showProceed ? 'screen-nav' : 'screen-nav screen-nav--start';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-7'));
  nav.appendChild(backBtn);

  if (cfg.showProceed) {
    const proceedBtn = document.createElement('button');
    proceedBtn.className = 'btn btn--primary';
    proceedBtn.textContent = 'Proceed to Simulation →';
    proceedBtn.addEventListener('click', () => {
      if (typeof renderScreen9 === 'function') renderScreen9();
      showScreen('screen-9');
    });
    nav.appendChild(proceedBtn);
  }

  screen.appendChild(nav);

  /* ── Lead capture modal ─────────────────────────────────────────────── */
  /* Show for gap outcomes only; skip if lead already captured            */
  if (S8_GAP_OUTCOMES.has(resultKey) && !sessionState.lead) {
    document.getElementById('lead-capture-modal')?.remove();
    document.body.appendChild(buildLeadCaptureModal(resultKey, () => {
      /* Modal dismissed — result is already rendered beneath it */
    }));
  }
}

document.addEventListener('DOMContentLoaded', renderScreen8);
