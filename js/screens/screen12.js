/* ─── Screen 12: Human Review ────────────────────────────────────────────── */

/*
 * Appears only when s3.trigger_outcome is 'needs_review' or 'high_risk'.
 * The reviewer selects one of four decisions; the choice is written to
 * s3.reviewer_decision and the corresponding decision block is shown inline.
 * All four decisions navigate to Screen 13.
 */

const S12_DECISIONS = {
  approved: {
    label: 'Approve',
    decision: {
      title:             'Human Review',
      state:             'Approved',
      reason:            'An authorized reviewer approved the proposed execution.',
      required_response: 'Retrieve the authorization_id.',
      what_happens_next: 'The execution may be presented to the downstream gate.',
      variant:           'accepted',
    },
  },
  denied: {
    label: 'Reject',
    decision: {
      title:             'Human Review',
      state:             'Execution denied',
      reason:            'The reviewer rejected the proposed execution.',
      required_response: 'None for the current submission.',
      what_happens_next: 'No authorization is issued.',
      variant:           'rejected',
    },
  },
  escalated: {
    label: 'Escalate',
    decision: {
      title:             'Human Review',
      state:             'Escalated',
      reason:            'The decision requires a higher reviewer level.',
      required_response: 'The lead reviewer must decide.',
      what_happens_next: 'Execution remains blocked.',
      variant:           'neutral',
    },
  },
  revision_requested: {
    label: 'Request revision',
    decision: {
      title:             'Human Review',
      state:             'Revision required',
      reason:            'The proposed execution requires corrected information.',
      required_response: 'Correct the request and create a new submission.',
      what_happens_next: 'No authorization is issued for the current submission.',
      variant:           'pending',
    },
  },
};

/* ── Decision area builder (re-rendered on each selection) ──────────────── */

function buildS12DecisionArea(selectedKey) {
  const area = document.createElement('div');
  area.id = 's12-decision-area';

  /* Decision buttons */
  const btnGroup = document.createElement('div');
  btnGroup.style.cssText =
    'display:flex;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-5);';

  Object.entries(S12_DECISIONS).forEach(([key, cfg]) => {
    const btn = document.createElement('button');
    btn.className = selectedKey === key ? 'btn btn--primary' : 'btn btn--ghost';
    btn.textContent = cfg.label;
    btn.addEventListener('click', () => {
      setState('s3.reviewer_decision', key);
      const existing    = document.getElementById('s12-decision-area');
      const replacement = buildS12DecisionArea(key);
      existing.parentNode.replaceChild(replacement, existing);
    });
    btnGroup.appendChild(btn);
  });
  area.appendChild(btnGroup);

  /* Decision block: only once a selection is made */
  if (selectedKey && S12_DECISIONS[selectedKey]) {
    area.appendChild(createDecisionBlock(S12_DECISIONS[selectedKey].decision));
  }

  return area;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen12() {
  const triggerOutcome = getState('s3.trigger_outcome') || 'needs_review';
  const isLeadReview   = triggerOutcome === 'high_risk';
  const reviewerRole   = isLeadReview
    ? (getState('s3.trigger_rules.lead_reviewer_role')     || 'Lead reviewer')
    : (getState('s3.trigger_rules.standard_reviewer_role') || 'Standard reviewer');
  const savedDecision  = getState('s3.reviewer_decision');

  const screen = document.getElementById('screen-12');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 · Configured DAL-X Simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Human Review';
  screen.appendChild(title);

  /* Subtitle / condition */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent = 'This screen appears for needs_review or high_risk.';
  screen.appendChild(subtitle);

  /* Review context callout */
  const contextNote = document.createElement('div');
  contextNote.className = 'callout callout--info';
  contextNote.style.marginBottom = 'var(--space-6)';

  const reviewType = isLeadReview ? 'Lead review required' : 'Standard review required';
  contextNote.textContent =
    reviewType + '. Reviewer: ' + reviewerRole
    + '. Jochanni Labs is simulating the reviewer decision.';
  screen.appendChild(contextNote);

  /* Decision area (buttons + optional decision block) */
  screen.appendChild(buildS12DecisionArea(savedDecision));

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-11'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen13 === 'function') renderScreen13();
    showScreen('screen-13');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen12);
