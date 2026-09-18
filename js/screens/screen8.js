/* ─── Screen 8: Business Result ─────────────────────────────────────────── */

/*
 * Evaluation order (spec-required):
 *   1. DAL-X not required: agent only recommends, or no downstream, or no consequence
 *   2. Enforcement not established: missing_authority_response === 'may_continue'
 *   3. More information required: any required field is empty or 'not_sure' / 'unknown'
 *   4. Potential DAL-X use case: all four requirements confirmed
 *
 * The spec ordering places enforcement not established BEFORE more info
 * required: a known blocking answer surfaces before incomplete answers.
 */

/* ── Outcome configurations ───────────────────────────────────────────── */

const S8_OUTCOMES = {
  potential_use_case: {
    decision: {
      state:             'Potential DAL-X use case',
      reason:            'The reported agent can initiate a consequential execution that must stop when authority is missing.',
      required_response: 'Identify the authority owner and downstream system owner.',
      what_happens_next: 'Jochanni Labs works with you to configure the execution simulation.',
      variant:           'accepted',
      title:             'Business Result',
    },
    evidence:   'business',
    showProceed: true,
  },

  enforcement_not_established: {
    decision: {
      state:             'DAL-X enforcement requirement not established',
      reason:            'The enterprise currently allows execution to continue without authority.',
      required_response: 'Decide whether missing authority must stop execution.',
      what_happens_next: 'The assessment closes. The enterprise may request a new assessment if the requirement changes.',
      variant:           'rejected',
      title:             'Business Result',
    },
    evidence:    'business',
    showProceed: false,
  },

  more_info_required: {
    decision: {
      state:             'More information required',
      reason:            'The agent, execution, downstream system, consequence, or required response remains unknown.',
      required_response: 'Confirm the missing information.',
      what_happens_next: 'The assessment closes. The enterprise may request reassessment when the information is available.',
      variant:           'pending',
      title:             'Business Result',
    },
    evidence:    'business',
    showProceed: false,
  },

  not_required: {
    decision: {
      state:             'DAL-X not required for this workflow',
      reason:            'The agent does not initiate a consequential downstream execution.',
      required_response: 'None.',
      what_happens_next: 'No DAL-X pilot is proposed.',
      variant:           'neutral',
      title:             'Business Result',
    },
    evidence:    'business',
    showProceed: false,
  },
};

/* ── Evaluation logic ─────────────────────────────────────────────────── */

function evaluateBusinessResult() {
  const agentType    = getState('s2.agent_type')                 || '';
  const execution    = getState('s2.proposed_execution')         || '';
  const downstream   = getState('s2.downstream_system')          || '';
  const consequences = getState('s2.consequences')               || [];
  const authResponse = getState('s2.missing_authority_response') || '';

  /* A value is "known" when it is non-empty and not the not-sure sentinel */
  const isKnown = v => Boolean(v) && v !== 'not_sure';

  /* Consequences are "known" when the array is non-empty and not only not_sure */
  const hasKnownConsequence =
    consequences.length > 0 && !consequences.every(v => v === 'not_sure');

  /* ── 1. DAL-X not required ─────────────────────────────────────────── */
  if (
    execution   === 'recommendations_only' ||
    downstream  === 'none'                 ||
    consequences.includes('none')
  ) {
    return 'not_required';
  }

  /* ── 2. Enforcement requirement not established ─────────────────────── */
  if (authResponse === 'may_continue') {
    return 'enforcement_not_established';
  }

  /* ── 3. More information required ──────────────────────────────────── */
  if (
    !isKnown(agentType)                              ||
    !isKnown(execution)                              ||
    !isKnown(downstream)                             ||
    !hasKnownConsequence                             ||
    !authResponse || authResponse === 'unknown'
  ) {
    return 'more_info_required';
  }

  /* ── 4. Potential DAL-X use case ────────────────────────────────────── */
  return 'potential_use_case';
}

/* ── Verdict banner builder ───────────────────────────────────────────── */

function buildBusinessVerdictBanner(resultKey) {
  const configs = {
    potential_use_case: {
      variant: 'yes',
      verdict: 'YES',
      label:   'This workflow has an enforcement gap DAL-X can close',
      sub:     'A consequential execution reaches a downstream system with no gate stopping it when approval is missing. That gap is exactly what DAL-X enforces.',
    },
    not_required: {
      variant: 'no',
      verdict: 'NO',
      label:   'DAL-X is not needed for this workflow',
      sub:     'The agent produces recommendations, has no downstream system, or has no consequential effect. There is no execution gap for DAL-X to enforce.',
    },
    enforcement_not_established: {
      variant: 'no',
      verdict: 'NO',
      label:   'No enforcement gap identified',
      sub:     'The enterprise does not require a gate before execution for this workflow. DAL-X enforces a gate — if no gate is required, there is nothing to enforce.',
    },
    more_info_required: {
      variant: 'inconclusive',
      verdict: 'INCONCLUSIVE',
      label:   'Cannot determine whether a gap exists',
      sub:     'One or more required answers — agent, execution type, downstream system, consequence, or current enforcement status — are missing or unknown.',
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

/* ── Renderer ─────────────────────────────────────────────────────────── */

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

  /* Evidence label */
  const evidenceLine = document.createElement('p');
  evidenceLine.style.cssText =
    'margin-top:var(--space-5);font-size:var(--text-sm);'
    + 'color:var(--color-text-secondary);';
  evidenceLine.appendChild(document.createTextNode('Evidence: '));
  evidenceLine.appendChild(createEvidenceLabel(cfg.evidence));
  screen.appendChild(evidenceLine);

  /* Proceed callout: potential use case only */
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
}

document.addEventListener('DOMContentLoaded', renderScreen8);
