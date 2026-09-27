/* ─── Screen 12: Reviewer decision ──────────────────────────────────────── */

/*
 * Appears only when s3.trigger_outcome is 'needs_review' or 'high_risk'.
 * The reviewer selects one of four decisions. The choice is written to
 * s3.reviewer_decision. All four decisions navigate to Screen 13.
 */

const S12_DECISIONS = {
  approved: {
    label:      'Approve',
    color:      'green',
    summary:    'Authorize the proposed execution to proceed.',
    consequence:'An authorization_id is issued and can be presented at the gate.',
    decision: {
      title:             'Reviewer decision',
      state:             'Approved',
      reason:            'An authorized reviewer approved the proposed execution.',
      required_response: 'Retrieve the authorization_id.',
      what_happens_next: 'The execution may be presented to the downstream gate.',
      variant:           'accepted',
    },
  },
  denied: {
    label:      'Reject',
    color:      'red',
    summary:    'Deny the proposed execution.',
    consequence:'No authorization is issued. The downstream system is not called.',
    decision: {
      title:             'Reviewer decision',
      state:             'Execution denied',
      reason:            'The reviewer rejected the proposed execution.',
      required_response: 'None for the current submission.',
      what_happens_next: 'No authorization is issued.',
      variant:           'rejected',
    },
  },
  escalated: {
    label:      'Escalate',
    color:      'violet',
    summary:    'Send the decision to a higher reviewer level.',
    consequence:'Execution stays blocked until the lead reviewer decides.',
    decision: {
      title:             'Reviewer decision',
      state:             'Escalated',
      reason:            'The decision requires a higher reviewer level.',
      required_response: 'The lead reviewer must decide.',
      what_happens_next: 'Execution remains blocked.',
      variant:           'neutral',
    },
  },
  revision_requested: {
    label:      'Request revision',
    color:      'amber',
    summary:    'Return the request for corrections.',
    consequence:'No authorization is issued. A new submission is required.',
    decision: {
      title:             'Reviewer decision',
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

  /* Awaiting indicator, hides once a selection is made */
  if (!selectedKey) {
    const awaiting = document.createElement('div');
    awaiting.className = 'reviewer-awaiting';
    awaiting.innerHTML =
      '<span class="reviewer-awaiting__dot"></span>'
      + '<span class="reviewer-awaiting__label">Awaiting reviewer decision</span>';
    area.appendChild(awaiting);
  }

  /* Decision cards, stacked full-width */
  const cardStack = document.createElement('div');
  cardStack.className = 'reviewer-card-stack';
  if (selectedKey) cardStack.classList.add('reviewer-card-stack--has-selection');

  Object.entries(S12_DECISIONS).forEach(([key, cfg]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `reviewer-card reviewer-card--${cfg.color}`;
    if (selectedKey === key) card.classList.add('is-selected');
    if (selectedKey && selectedKey !== key) card.classList.add('is-dimmed');

    const label = document.createElement('div');
    label.className = 'reviewer-card__label';
    label.textContent = cfg.label;
    card.appendChild(label);

    const summary = document.createElement('div');
    summary.className = 'reviewer-card__summary';
    summary.textContent = cfg.summary;
    card.appendChild(summary);

    const consequence = document.createElement('div');
    consequence.className = 'reviewer-card__consequence';
    consequence.textContent = cfg.consequence;
    card.appendChild(consequence);

    card.addEventListener('click', () => {
      setState('s3.reviewer_decision', key);
      const existing = document.getElementById('s12-decision-area');
      const replacement = buildS12DecisionArea(key);
      existing.parentNode.replaceChild(replacement, existing);
    });

    cardStack.appendChild(card);
  });

  area.appendChild(cardStack);

  /* Decision block once a selection is made */
  if (selectedKey && S12_DECISIONS[selectedKey]) {
    area.appendChild(createDecisionBlock(S12_DECISIONS[selectedKey].decision));
  }

  return area;
}

/* ── Renderer ───────────────────────────────────────────────────────────── */

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
  badge.textContent = 'Surface 3 · Configured DAL-X simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Reviewer decision';
  screen.appendChild(title);

  /* Review context */
  const contextNote = document.createElement('div');
  contextNote.className = 'callout callout--info';
  contextNote.style.marginBottom = 'var(--space-6)';
  const reviewType = isLeadReview ? 'Lead review required' : 'Standard review required';
  contextNote.textContent =
    reviewType + '. Reviewer role, ' + reviewerRole
    + '. Jochanni Labs is simulating the reviewer decision.';
  screen.appendChild(contextNote);

  /* Separation-of-duties note */
  const dutyNote = document.createElement('p');
  dutyNote.className = 'reviewer-duty-note';
  dutyNote.textContent =
    'A reviewer cannot approve their own submission and cannot act without creating a decision record.';
  screen.appendChild(dutyNote);

  /* Decision area, buttons plus optional decision block */
  screen.appendChild(buildS12DecisionArea(savedDecision));

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-11'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Continue';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen13 === 'function') renderScreen13();
    showScreen('screen-13');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen12);
