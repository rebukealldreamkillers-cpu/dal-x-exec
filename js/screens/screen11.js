/* ─── Screen 11: Trigger Evaluation ─────────────────────────────────────── */

/*
 * Evaluates s3.submission.action against the four trigger rule lists
 * recorded on Screen 9. Priority (highest to lowest):
 *   blocked > high_risk > needs_review > auto_approve > default (needs_review)
 *
 * Results written to s3.trigger_outcome and s3.trigger_details.*.
 * trigger_outcome is later read by Screen 16 Q2.
 *
 * Navigation:
 *   needs_review | high_risk  →  Screen 12 (human review)
 *   auto_approve | blocked    →  Screen 13 (authorization display, skip review)
 */

/* ── Rule parsing ─────────────────────────────────────────────────────────── */

function parseRuleList(text) {
  if (!text) return [];
  return text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
}

function normalizeText(s) {
  return s.toLowerCase().replace(/[_-]/g, ' ').trim();
}

/* A rule matches the action if either string is a substring of the other
   (after normalization). Handles 'deploy_code' ↔ 'Deploy code', etc. */
function ruleMatchesAction(action, ruleText) {
  if (!ruleText) return false;
  const na = normalizeText(action);
  const nr = normalizeText(ruleText);
  return na.includes(nr) || nr.includes(na);
}

/* ── Evaluation engine ────────────────────────────────────────────────────── */

function evaluateTrigger() {
  const action         = getState('s3.submission.action') || '';
  const blockedRules   = parseRuleList(getState('s3.trigger_rules.actions_blocked')         || '');
  const leadRules      = parseRuleList(getState('s3.trigger_rules.actions_lead_review')     || '');
  const standardRules  = parseRuleList(getState('s3.trigger_rules.actions_standard_review') || '');
  const permittedRules = parseRuleList(getState('s3.trigger_rules.actions_permitted')       || '');

  const totalRules = blockedRules.length + leadRules.length
                   + standardRules.length + permittedRules.length;

  const blockedMatch   = blockedRules.find(r   => ruleMatchesAction(action, r));
  const leadMatch      = leadRules.find(r       => ruleMatchesAction(action, r));
  const standardMatch  = standardRules.find(r   => ruleMatchesAction(action, r));
  const permittedMatch = permittedRules.find(r  => ruleMatchesAction(action, r));

  const matchCount = [blockedMatch, leadMatch, standardMatch, permittedMatch]
    .filter(Boolean).length;

  let outcome, controllingRule, exactMatch, requiredLevel;

  if (blockedMatch) {
    outcome         = 'blocked';
    controllingRule = 'Actions blocked';
    exactMatch      = blockedMatch;
    requiredLevel   = 'None';
  } else if (leadMatch) {
    outcome         = 'high_risk';
    controllingRule = 'Actions requiring lead review';
    exactMatch      = leadMatch;
    requiredLevel   = 'Lead';
  } else if (standardMatch) {
    outcome         = 'needs_review';
    controllingRule = 'Actions requiring standard review';
    exactMatch      = standardMatch;
    requiredLevel   = 'Standard';
  } else if (permittedMatch) {
    outcome         = 'auto_approve';
    controllingRule = 'Actions permitted';
    exactMatch      = permittedMatch;
    requiredLevel   = 'None';
  } else {
    outcome         = 'needs_review';
    controllingRule = 'Default (no matching rule)';
    exactMatch      = '';
    requiredLevel   = 'Standard';
  }

  setState('s3.trigger_outcome', outcome);
  setState('s3.trigger_details.rules_evaluated', totalRules);
  setState('s3.trigger_details.rules_matched', matchCount);
  setState('s3.trigger_details.controlling_rule', controllingRule);
  setState('s3.trigger_details.exact_match', exactMatch);
  setState('s3.trigger_details.policy_reference',
    getState('s3.trigger_rules.policy_reference') || '');
  setState('s3.trigger_details.required_reviewer_level', requiredLevel);

  return outcome;
}

/* ── Outcome display config ───────────────────────────────────────────────── */

const S11_OUTCOME_CONFIG = {
  auto_approve: { chipState: 'accepted', chipLabel: 'Auto-approved'           },
  needs_review: { chipState: 'pending',  chipLabel: 'Needs review'            },
  high_risk:    { chipState: 'neutral',  chipLabel: 'High risk: lead review' },
  blocked:      { chipState: 'rejected', chipLabel: 'Blocked'                 },
};

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen11() {
  const outcome = evaluateTrigger();
  const cfg     = S11_OUTCOME_CONFIG[outcome] || S11_OUTCOME_CONFIG.needs_review;

  const screen = document.getElementById('screen-11');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 · Configured DAL-X Simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Trigger Evaluation';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent =
    'DAL-X evaluates the simulated submission using the current outcomes.';
  screen.appendChild(subtitle);

  /* Result card */
  const card = document.createElement('div');
  card.className = 'card';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'card__title';
  cardTitle.textContent = 'Trigger evaluation result';
  card.appendChild(cardTitle);

  /* Detail rows 1–6 */
  const details = [
    ['Rules evaluated',         String(getState('s3.trigger_details.rules_evaluated') ?? 0)],
    ['Rules matched',           String(getState('s3.trigger_details.rules_matched') ?? 0)],
    ['Controlling rule',        getState('s3.trigger_details.controlling_rule') || 'N/A'],
    ['Exact match',             getState('s3.trigger_details.exact_match')      || 'N/A'],
    ['Policy reference',        getState('s3.trigger_details.policy_reference') || 'N/A'],
    ['Required reviewer level', getState('s3.trigger_details.required_reviewer_level') || 'N/A'],
  ];
  details.forEach(([key, val]) => card.appendChild(createLabelledField(key, val)));

  /* Result row: chip instead of text */
  const resultRow = document.createElement('div');
  resultRow.className = 'field-row';
  const resultKey = document.createElement('div');
  resultKey.className = 'field-row__key';
  resultKey.textContent = 'Result';
  const resultVal = document.createElement('div');
  resultVal.className = 'field-row__value';
  resultVal.appendChild(createStatusChip(cfg.chipState, cfg.chipLabel));
  resultRow.appendChild(resultKey);
  resultRow.appendChild(resultVal);
  card.appendChild(resultRow);

  screen.appendChild(card);

  /* Carry-forward notice */
  const infoNote = document.createElement('div');
  infoNote.className = 'callout callout--info';
  infoNote.style.marginTop = 'var(--space-5)';
  infoNote.textContent =
    'The trigger evaluation result is stored and carried into the technical review.';
  screen.appendChild(infoNote);

  /* Evidence label */
  const evidenceLine = document.createElement('p');
  evidenceLine.style.cssText =
    'margin-top:var(--space-5);font-size:var(--text-sm);'
    + 'color:var(--color-text-secondary);';
  evidenceLine.appendChild(document.createTextNode('Evidence: '));
  evidenceLine.appendChild(createEvidenceLabel('demonstrated'));
  screen.appendChild(evidenceLine);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-10'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    if (outcome === 'needs_review' || outcome === 'high_risk') {
      if (typeof renderScreen12 === 'function') renderScreen12();
      showScreen('screen-12');
    } else {
      /* auto_approve or blocked, human review not required */
      if (typeof renderScreen13 === 'function') renderScreen13();
      showScreen('screen-13');
    }
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen11);
