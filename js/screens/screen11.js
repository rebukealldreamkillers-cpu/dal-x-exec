/* ─── Screen 11: Trigger evaluation ─────────────────────────────────────── */

/*
 * Evaluates s3.submission.action against four trigger rule lists recorded
 * on Screen 9. Priority (highest to lowest):
 *   blocked > high_risk > needs_review > auto_approve > default (needs_review)
 *
 * Navigation:
 *   needs_review | high_risk  →  Screen 12 (human review)
 *   auto_approve | blocked    →  Screen 13 (authorization display, skip review)
 */

/* ── Rule parsing (unchanged) ───────────────────────────────────────────── */

function parseRuleList(text) {
  if (!text) return [];
  return text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
}

function normalizeText(s) {
  return s.toLowerCase().replace(/[_-]/g, ' ').trim();
}

function ruleMatchesAction(action, ruleText) {
  if (!ruleText) return false;
  const na = normalizeText(action);
  const nr = normalizeText(ruleText);
  return na.includes(nr) || nr.includes(na);
}

/* ── Evaluation engine (unchanged) ──────────────────────────────────────── */

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

  return {
    outcome,
    controllingRule,
    exactMatch,
    blockedRules, leadRules, standardRules, permittedRules,
    blockedMatch, leadMatch, standardMatch, permittedMatch,
  };
}

/* ── Outcome display config ─────────────────────────────────────────────── */

const S11_OUTCOME_CONFIG = {
  auto_approve: { chipState: 'accepted', chipLabel: 'Auto approved',   badgeColor: 'green',  glyph: 'check' },
  needs_review: { chipState: 'pending',  chipLabel: 'Needs review',    badgeColor: 'amber',  glyph: 'clock' },
  high_risk:    { chipState: 'neutral',  chipLabel: 'High risk, lead review', badgeColor: 'orange', glyph: 'alert' },
  blocked:      { chipState: 'rejected', chipLabel: 'Blocked',         badgeColor: 'red',    glyph: 'x'     },
};

/* ── Rule row builder ───────────────────────────────────────────────────── */

function buildEvalRow(color, ruleName, category, matched) {
  const row = document.createElement('div');
  row.className = 'eval-row';
  if (matched) row.classList.add('eval-row--matched');

  const dot = document.createElement('span');
  dot.className = `policy-field__dot policy-field__dot--${color}`;
  row.appendChild(dot);

  const name = document.createElement('span');
  name.className = 'eval-row__name';
  name.textContent = ruleName;
  row.appendChild(name);

  const cat = document.createElement('span');
  cat.className = 'eval-row__category';
  cat.textContent = category;
  row.appendChild(cat);

  const status = document.createElement('span');
  status.className = matched ? 'eval-row__status eval-row__status--matched' : 'eval-row__status';
  status.textContent = matched ? 'Matched' : 'No match';
  row.appendChild(status);

  return row;
}

/* ── Outcome badge ──────────────────────────────────────────────────────── */

function buildOutcomeBadge(outcome, cfg) {
  const badge = document.createElement('div');
  badge.className = `outcome-badge outcome-badge--${cfg.badgeColor}`;

  const glyph = document.createElement('span');
  glyph.className = 'outcome-badge__glyph';
  glyph.setAttribute('aria-hidden', 'true');
  if (cfg.glyph === 'check') glyph.innerHTML = '&#10003;';
  else if (cfg.glyph === 'x') glyph.innerHTML = '&#10005;';
  else if (cfg.glyph === 'alert') glyph.textContent = '!';
  else glyph.textContent = '?';
  badge.appendChild(glyph);

  const label = document.createElement('span');
  label.className = 'outcome-badge__label';
  label.textContent = cfg.chipLabel;
  badge.appendChild(label);

  return badge;
}

/* ── Renderer ───────────────────────────────────────────────────────────── */

function renderScreen11() {
  const evalResult = evaluateTrigger();
  const outcome    = evalResult.outcome;
  const cfg        = S11_OUTCOME_CONFIG[outcome] || S11_OUTCOME_CONFIG.needs_review;

  const screen = document.getElementById('screen-11');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 · Configured DAL-X simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Trigger evaluation';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent =
    'DAL-X evaluates the simulated submission against the recorded trigger rules.';
  screen.appendChild(subtitle);

  /* Evaluating indicator */
  const evaluating = document.createElement('div');
  evaluating.className = 'evaluating-indicator';
  evaluating.innerHTML =
    '<span class="evaluating-indicator__label">Evaluating submission</span>'
    + '<span class="evaluating-indicator__dots"><span></span><span></span><span></span></span>';
  screen.appendChild(evaluating);

  /* Rule list container */
  const rulesWrap = document.createElement('div');
  rulesWrap.className = 'eval-rules';
  screen.appendChild(rulesWrap);

  /* Outcome slot */
  const outcomeSlot = document.createElement('div');
  outcomeSlot.className = 'outcome-slot';
  screen.appendChild(outcomeSlot);

  /* Assemble rules to display. Add one row per rule text. */
  const displayRows = [];

  evalResult.blockedRules.forEach(rule => {
    const matched = rule === evalResult.blockedMatch;
    displayRows.push({ color: 'red',    rule, category: 'blocked',      matched });
  });
  evalResult.leadRules.forEach(rule => {
    const matched = rule === evalResult.leadMatch;
    displayRows.push({ color: 'orange', rule, category: 'high_risk',    matched });
  });
  evalResult.standardRules.forEach(rule => {
    const matched = rule === evalResult.standardMatch;
    displayRows.push({ color: 'amber',  rule, category: 'needs_review', matched });
  });
  evalResult.permittedRules.forEach(rule => {
    const matched = rule === evalResult.permittedMatch;
    displayRows.push({ color: 'green',  rule, category: 'auto_approve', matched });
  });

  if (displayRows.length === 0) {
    displayRows.push({ color: 'slate', rule: 'No trigger rules recorded', category: 'default', matched: false });
  }

  /* Stagger the row reveal after 1.2 seconds of "evaluating" */
  const startDelay = 1200;
  const stagger = 200;

  setTimeout(() => {
    evaluating.classList.add('is-done');
    displayRows.forEach((row, i) => {
      setTimeout(() => {
        const el = buildEvalRow(row.color, row.rule, row.category, row.matched);
        el.style.animationDelay = '0ms';
        rulesWrap.appendChild(el);
      }, i * stagger);
    });

    /* Show controlling rule and outcome badge after all rows appear */
    const finalDelay = displayRows.length * stagger + 200;
    setTimeout(() => {
      /* Controlling rule callout */
      const controlling = document.createElement('div');
      controlling.className = 'controlling-rule';
      const cLabel = document.createElement('div');
      cLabel.className = 'controlling-rule__label';
      cLabel.textContent = 'Controlling rule';
      const cVal = document.createElement('div');
      cVal.className = 'controlling-rule__value';
      cVal.textContent = evalResult.controllingRule;
      controlling.appendChild(cLabel);
      controlling.appendChild(cVal);
      outcomeSlot.appendChild(controlling);

      outcomeSlot.appendChild(buildOutcomeBadge(outcome, cfg));

      /* Detail summary rows */
      const details = document.createElement('div');
      details.className = 'eval-detail-grid';

      [
        ['Rules evaluated',         String(getState('s3.trigger_details.rules_evaluated') ?? 0)],
        ['Rules matched',           String(getState('s3.trigger_details.rules_matched') ?? 0)],
        ['Exact match',             getState('s3.trigger_details.exact_match')      || 'None'],
        ['Policy reference',        getState('s3.trigger_details.policy_reference') || 'None'],
        ['Required reviewer level', getState('s3.trigger_details.required_reviewer_level') || 'None'],
      ].forEach(([k, v]) => {
        const cell = document.createElement('div');
        cell.className = 'eval-detail-grid__cell';
        cell.innerHTML =
          `<div class="eval-detail-grid__key">${k}</div>`
          + `<div class="eval-detail-grid__val">${v.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</div>`;
        details.appendChild(cell);
      });
      outcomeSlot.appendChild(details);
    }, finalDelay);
  }, startDelay);

  /* Carry-forward notice */
  const infoNote = document.createElement('p');
  infoNote.className = 'eval-carry-note';
  infoNote.textContent =
    'This result determines whether a reviewer decision is required before an authorization can be issued.';
  screen.appendChild(infoNote);

  /* Evidence label */
  const evidenceLine = document.createElement('p');
  evidenceLine.style.cssText =
    'margin-top:var(--space-5);font-size:var(--text-sm);color:var(--color-text-secondary);';
  evidenceLine.appendChild(document.createTextNode('Evidence '));
  evidenceLine.appendChild(createEvidenceLabel('demonstrated'));
  screen.appendChild(evidenceLine);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-10'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Continue';
  nextBtn.addEventListener('click', () => {
    if (outcome === 'needs_review' || outcome === 'high_risk') {
      if (typeof renderScreen12 === 'function') renderScreen12();
      showScreen('screen-12');
    } else {
      if (typeof renderScreen13 === 'function') renderScreen13();
      showScreen('screen-13');
    }
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen11);
