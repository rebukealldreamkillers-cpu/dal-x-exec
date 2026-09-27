/* ─── Screen 18: Technical assessment result ────────────────────────────── */

/*
 * Strict evaluation order (preserved):
 *   1. Known structural failure: No/Neither in Q1-Q6
 *   2. Unknown required answer: any applicable answer is null or 'unknown'
 *   3. Implementation work: Q7-Q10 pass / no unknowns / one+ Q7-Q10 = no
 *   4. Technical answers support integration (all clear)
 *
 * null answers are treated as unknown. Q2 = 'not_applicable' is exempt.
 */

/* ── Question labels ─────────────────────────────────────────────────────── */

const S18_Q_LABELS = {
  q1:  'Q1 · Submission point',
  q2:  'Q2 · Pending execution',
  q3:  'Q3 · Decision handling',
  q4:  'Q4 · Enforcement point',
  q5:  'Q5 · Blocking behavior',
  q6:  'Q6 · Bypass prevention',
  q7:  'Q7 · Submission fields',
  q8:  'Q8 · API key storage',
  q9:  'Q9 · Data handling',
  q10: 'Q10 · Downstream result',
};

/* ── Evaluation engine (preserved) ───────────────────────────────────────── */

function evaluateTechnicalResult() {
  function q(k) { return getState('s4.' + k); }
  const isUnknown = v => (v === 'unknown' || v == null);

  const q1 = q('q1'); const q2 = q('q2'); const q3 = q('q3');
  const q4 = q('q4'); const q5 = q('q5'); const q6 = q('q6');
  const q7 = q('q7'); const q8 = q('q8');
  const q9 = q('q9'); const q10= q('q10');

  const structuralBlockers = [];
  if (q1 === 'no')      structuralBlockers.push('q1');
  if (q2 === 'no')      structuralBlockers.push('q2');
  if (q3 === 'neither') structuralBlockers.push('q3');
  if (q4 === 'no')      structuralBlockers.push('q4');
  if (q5 === 'no')      structuralBlockers.push('q5');
  if (q6 === 'no')      structuralBlockers.push('q6');

  setState('s4.structural_blockers', structuralBlockers);

  if (structuralBlockers.length > 0) {
    setState('s4.technical_result', 'structural_failure');
    return 'structural_failure';
  }

  const checkUnknown = [
    ['q1', q1], ['q3', q3], ['q4', q4], ['q5', q5], ['q6', q6],
    ['q7', q7], ['q8', q8], ['q9', q9], ['q10', q10],
    ...(q2 !== 'not_applicable' ? [['q2', q2]] : []),
  ];
  const hasUnknown = checkUnknown.some(([, v]) => isUnknown(v));

  if (hasUnknown) {
    setState('s4.technical_result', 'incomplete');
    return 'incomplete';
  }

  const implFails = [q7, q8, q9, q10].filter(v => v === 'no');
  if (implFails.length > 0) {
    setState('s4.technical_result', 'implementation_work');
    return 'implementation_work';
  }

  setState('s4.technical_result', 'supports_integration');
  return 'supports_integration';
}

/* ── Outcome visual configs ──────────────────────────────────────────────── */

const S18_VISUAL = {
  structural_failure: {
    tone:       'bad',
    heading:    'Structural failure',
    badgeText:  'Structural failure',
    note:       'A pilot cannot begin until the structural failure is corrected.',
  },
  incomplete: {
    tone:       'warn',
    heading:    'Technical answers incomplete',
    badgeText:  'Answers incomplete',
    note:       'Involve the owner of the agent service or the downstream execution service to complete the review.',
  },
  implementation_work: {
    tone:       'info',
    heading:    'Implementation work required',
    badgeText:  'Work required',
    note:       'The execution boundary supports DAL-X. Complete the listed work before the pilot begins.',
  },
  supports_integration: {
    tone:       'good',
    heading:    'Technical answers support integration',
    badgeText:  'Ready for pilot review',
    note:       'Submit these answers and the boundary map to Jochanni Labs for review.',
  },
};

/* ── Blocker + list builders ─────────────────────────────────────────────── */

function s18BuildListPanel(headingText, entries, kind) {
  if (!entries.length) return null;

  const panel = document.createElement('div');
  panel.className = 'tech-result-list tech-result-list--' + kind;

  const h = document.createElement('p');
  h.className = 'tech-result-list__heading';
  h.textContent = headingText;
  panel.appendChild(h);

  const ul = document.createElement('ul');
  ul.className = 'tech-result-list__items';
  entries.forEach(k => {
    const li = document.createElement('li');

    const marker = document.createElement('span');
    marker.className = 'tech-result-list__marker tech-result-list__marker--' + kind;
    if (kind === 'blocker') marker.textContent = 'X';
    else if (kind === 'unknown') marker.textContent = '?';
    else marker.textContent = '·';
    li.appendChild(marker);

    const label = document.createElement('span');
    label.className = 'tech-result-list__text';
    label.textContent = S18_Q_LABELS[k] || k;
    li.appendChild(label);

    ul.appendChild(li);
  });

  panel.appendChild(ul);
  return panel;
}

function s18BuildConfirmedList() {
  const rows = [];
  const q2 = getState('s4.q2');
  ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'].forEach(k => {
    const v = getState('s4.' + k);
    if (v && v !== 'unknown') {
      if (k === 'q2' && q2 === 'not_applicable') {
        rows.push({ k, text: 'Not applicable for this pilot scope' });
      } else {
        rows.push({ k, text: 'Answered ' + v });
      }
    }
  });
  if (!rows.length) return null;

  const panel = document.createElement('div');
  panel.className = 'tech-result-list tech-result-list--confirmed';

  const h = document.createElement('p');
  h.className = 'tech-result-list__heading';
  h.textContent = 'Confirmed answers';
  panel.appendChild(h);

  const ul = document.createElement('ul');
  ul.className = 'tech-result-list__items';
  rows.forEach(r => {
    const li = document.createElement('li');
    const marker = document.createElement('span');
    marker.className = 'tech-result-list__marker tech-result-list__marker--confirmed';
    marker.textContent = 'ok';
    li.appendChild(marker);

    const label = document.createElement('span');
    label.className = 'tech-result-list__text';
    label.textContent = (S18_Q_LABELS[r.k] || r.k) + ' (' + r.text + ')';
    li.appendChild(label);
    ul.appendChild(li);
  });
  panel.appendChild(ul);
  return panel;
}

/* ── Result hero ─────────────────────────────────────────────────────────── */

function s18BuildResultHero(resultKey) {
  const cfg = S18_VISUAL[resultKey];

  const hero = document.createElement('div');
  hero.className = 'tech-result-hero tech-result-hero--' + cfg.tone;

  const badge = document.createElement('span');
  badge.className = 'tech-result-hero__badge tech-result-hero__badge--' + cfg.tone;
  badge.textContent = cfg.badgeText;
  hero.appendChild(badge);

  const heading = document.createElement('h2');
  heading.className = 'tech-result-hero__heading tech-result-hero__heading--' + cfg.tone;
  heading.textContent = cfg.heading;
  hero.appendChild(heading);

  const note = document.createElement('p');
  note.className = 'tech-result-hero__note';
  note.textContent = cfg.note;
  hero.appendChild(note);

  return hero;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen18() {
  const resultKey = evaluateTechnicalResult();

  const screen = document.getElementById('screen-18');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 4 · Technical review';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Technical assessment result';
  screen.appendChild(title);

  /* Result hero */
  screen.appendChild(s18BuildResultHero(resultKey));

  /* Detail lists */
  function qval(k) { return getState('s4.' + k); }
  const isUnknown = v => (v === 'unknown' || v == null);

  const q2val = qval('q2');
  const unknownKeys = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10']
    .filter(k => {
      if (k === 'q2' && q2val === 'not_applicable') return false;
      return isUnknown(qval(k));
    });

  const implTasks = ['q7','q8','q9','q10'].filter(k => qval(k) === 'no');

  if (resultKey === 'structural_failure') {
    const blockers = getState('s4.structural_blockers') || [];
    const p1 = s18BuildListPanel('Blocking questions', blockers, 'blocker');
    if (p1) screen.appendChild(p1);

    const p2 = s18BuildListPanel('Additional information required', unknownKeys, 'unknown');
    if (p2) screen.appendChild(p2);

    const p3 = s18BuildListPanel('Implementation work identified', implTasks, 'work');
    if (p3) screen.appendChild(p3);
  } else if (resultKey === 'incomplete') {
    const p = s18BuildListPanel('Unanswered questions', unknownKeys, 'unknown');
    if (p) screen.appendChild(p);
  } else if (resultKey === 'implementation_work') {
    const p = s18BuildListPanel('Implementation tasks', implTasks, 'work');
    if (p) screen.appendChild(p);
  } else if (resultKey === 'supports_integration') {
    const p = s18BuildConfirmedList();
    if (p) screen.appendChild(p);
  }

  /* Evidence line */
  const evidenceLine = document.createElement('p');
  evidenceLine.className = 'tech-result-evidence';
  evidenceLine.appendChild(document.createTextNode('Evidence '));
  evidenceLine.appendChild(createEvidenceLabel('technical'));
  screen.appendChild(evidenceLine);

  /* Spec notice */
  const notice = document.createElement('div');
  notice.className = 'callout callout--info';
  notice.style.marginTop = 'var(--space-5)';
  notice.textContent =
    'These answers are self-reported. Jochanni Labs validates the reported integration path with your technical team '
    + 'as part of a paid engagement before any recommendation is finalized. This result is not called a pilot candidate.';
  screen.appendChild(notice);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-17'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Submit to Jochanni Labs';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen19 === 'function') renderScreen19();
    showScreen('screen-19');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen18);
