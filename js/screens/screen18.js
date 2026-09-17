/* ─── Screen 18: Self-Reported Technical Result ──────────────────────────── */

/*
 * Strict evaluation order (spec-required):
 *   1. Known structural failure  — No/Neither in Q1–Q6
 *   2. Unknown required answer   — any applicable answer is null or 'unknown'
 *   3. Implementation work       — Q7–Q10 pass / no unknowns / one+ Q7–Q10 = no
 *   4. Technical answers support integration (all clear)
 *
 * null answers are treated as unknown (unanswered = incomplete).
 * Q2 = 'not_applicable' is exempt from the unknown check.
 *
 * Result 1 also renders: structural blocker list, additional info required
 * section (unknowns), and implementation work identified section.
 *
 * Notice (spec-required, all outcomes): "This result is not called a pilot candidate."
 */

/* ── Question labels (used in blocker/unknown lists) ─────────────────────── */

const S18_Q_LABELS = {
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

/* ── Outcome configurations ───────────────────────────────────────────────── */

const S18_OUTCOMES = {
  structural_failure: {
    decision: {
      title:             'Self-Reported Technical Result',
      state:             'Structural requirements not met',
      reason:            'The reported execution path cannot currently place DAL-X before every governed downstream execution.',
      required_response: 'Correct the identified structural requirement.',
      what_happens_next: 'Jochanni Labs does not recommend a pilot until the structural requirement is corrected.',
      variant:           'rejected',
    },
  },
  incomplete: {
    decision: {
      title:             'Self-Reported Technical Result',
      state:             'Technical answers incomplete',
      reason:            'Required integration information remains unknown.',
      required_response: 'Involve the owner of the agent service or downstream execution service.',
      what_happens_next: 'Complete the unanswered questions.',
      variant:           'pending',
    },
  },
  implementation_work: {
    decision: {
      title:             'Self-Reported Technical Result',
      state:             'Implementation work required',
      reason:            'The execution path can support DAL-X, but required integration work remains incomplete.',
      required_response: 'Complete the listed field mapping, API key storage, data handling, or downstream result task.',
      what_happens_next: 'Repeat the technical review after the work is complete.',
      variant:           'pending',
    },
  },
  supports_integration: {
    decision: {
      title:             'Self-Reported Technical Result',
      state:             'Technical answers support integration',
      reason:            'The technical participant reported that the two required DAL-X integration points can be added and enforced.',
      required_response: 'Submit the answers and boundary map to Jochanni Labs.',
      what_happens_next: 'Jochanni Labs reviews the reported integration path.',
      variant:           'accepted',
    },
  },
};

/* ── Evaluation engine ────────────────────────────────────────────────────── */

function evaluateTechnicalResult() {
  function q(k) { return getState('s4.' + k); }
  const isUnknown = v => (v === 'unknown' || v == null);

  const q1 = q('q1'); const q2 = q('q2'); const q3 = q('q3');
  const q4 = q('q4'); const q5 = q('q5'); const q6 = q('q6');
  const q7 = q('q7'); const q8 = q('q8');
  const q9 = q('q9'); const q10= q('q10');

  /* ── 1. Known structural failure ────────────────────────────────────── */
  const structuralBlockers = [];
  if (q1 === 'no')      structuralBlockers.push('q1');
  if (q2 === 'no')      structuralBlockers.push('q2');   /* not_applicable exempt */
  if (q3 === 'neither') structuralBlockers.push('q3');
  if (q4 === 'no')      structuralBlockers.push('q4');
  if (q5 === 'no')      structuralBlockers.push('q5');
  if (q6 === 'no')      structuralBlockers.push('q6');

  setState('s4.structural_blockers', structuralBlockers);

  if (structuralBlockers.length > 0) {
    setState('s4.technical_result', 'structural_failure');
    return 'structural_failure';
  }

  /* ── 2. Unknown required answer ─────────────────────────────────────── */
  /* Q2 not_applicable is exempt from the unknown check */
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

  /* ── 3. Implementation work required ────────────────────────────────── */
  const implFails = [q7, q8, q9, q10].filter(v => v === 'no');
  if (implFails.length > 0) {
    setState('s4.technical_result', 'implementation_work');
    return 'implementation_work';
  }

  /* ── 4. Technical answers support integration ───────────────────────── */
  setState('s4.technical_result', 'supports_integration');
  return 'supports_integration';
}

/* ── Sub-section builder (Result 1 additional panels) ───────────────────── */

function buildBulletSection(headingText, qKeys) {
  const section = document.createElement('div');
  section.style.marginTop = 'var(--space-5)';

  const heading = document.createElement('p');
  heading.className = 'section-label';
  heading.textContent = headingText;
  section.appendChild(heading);

  const list = document.createElement('ul');
  list.style.cssText =
    'margin:var(--space-2) 0 0 var(--space-5);'
    + 'font-size:var(--text-sm);color:var(--color-text-secondary);';
  qKeys.forEach(k => {
    const li = document.createElement('li');
    li.textContent = S18_Q_LABELS[k] || k;
    list.appendChild(li);
  });
  section.appendChild(list);
  return section;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen18() {
  const resultKey = evaluateTechnicalResult();
  const cfg       = S18_OUTCOMES[resultKey];

  const screen = document.getElementById('screen-18');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 4 — Technical Review';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Self-Reported Technical Result';
  screen.appendChild(title);

  /* Decision block */
  screen.appendChild(createDecisionBlock(cfg.decision));

  /* ── Result 1 additional sections ─────────────────────────────────── */
  if (resultKey === 'structural_failure') {
    const blockers = getState('s4.structural_blockers') || [];
    if (blockers.length > 0) {
      screen.appendChild(buildBulletSection('Structural requirements not met', blockers));
    }

    /* Unknown answers in any applicable question */
    function q(k) { return getState('s4.' + k); }
    const isUnknown = v => (v === 'unknown' || v == null);
    const q2val = q('q2');

    const unknownKeys = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10']
      .filter(k => {
        if (k === 'q2' && q2val === 'not_applicable') return false;
        return isUnknown(q(k));
      });
    if (unknownKeys.length > 0) {
      screen.appendChild(buildBulletSection('Additional information required', unknownKeys));
    }

    /* Implementation fails (Q7–Q10 = No) */
    const implFailKeys = ['q7','q8','q9','q10'].filter(k => q(k) === 'no');
    if (implFailKeys.length > 0) {
      screen.appendChild(buildBulletSection('Implementation work identified', implFailKeys));
    }
  }

  /* Evidence label */
  const evidenceLine = document.createElement('p');
  evidenceLine.style.cssText =
    'margin-top:var(--space-5);font-size:var(--text-sm);'
    + 'color:var(--color-text-secondary);';
  evidenceLine.appendChild(document.createTextNode('Evidence: '));
  evidenceLine.appendChild(createEvidenceLabel('technical'));
  screen.appendChild(evidenceLine);

  /* Spec-required notice */
  const notice = document.createElement('div');
  notice.className = 'callout callout--info';
  notice.style.marginTop = 'var(--space-5)';
  notice.textContent = 'This result is not called a pilot candidate.';
  screen.appendChild(notice);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-17'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Submit to Jochanni Labs →';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen19 === 'function') renderScreen19();
    showScreen('screen-19');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen18);
