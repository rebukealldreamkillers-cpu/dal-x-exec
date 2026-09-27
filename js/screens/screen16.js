/* ─── Screen 16: Technical review ────────────────────────────────────────── */

/*
 * Ten questions across two sections.
 *   Structural (Q1 to Q6). Confirmed 'no'/'neither' = DAL-X cannot control path
 *   Implementation (Q7 to Q10). Confirmed 'no' = work required, not disqualifying
 *
 * Q2 is conditional:
 *   needs_review | high_risk → Q2 shown, required
 *   auto_approve | blocked   → Q2 hidden, s4.q2 set to 'not_applicable'
 *
 * All answers written to s4.q1 through s4.q10.
 */

/* ── Option sets ──────────────────────────────────────────────────────────── */

const YES_NO_UNKNOWN = [
  { value: 'yes',     label: 'Yes'     },
  { value: 'no',      label: 'No'      },
  { value: 'unknown', label: 'Unknown' },
];

const Q3_OPTIONS = [
  { value: 'webhook', label: 'Webhook' },
  { value: 'polling', label: 'Polling' },
  { value: 'either',  label: 'Either'  },
  { value: 'neither', label: 'Neither' },
  { value: 'unknown', label: 'Unknown' },
];

/* ── Question definitions ─────────────────────────────────────────────────── */

const S16_STRUCTURAL = [
  {
    id:       's16-q1',
    qNum:     'Q1',
    stateKey: 's4.q1',
    label:    'Submission point',
    text:     'Can the agent or calling service submit the proposed execution to DAL-X before execution begins?',
    options:  YES_NO_UNKNOWN,
    kind:     'structural',
  },
  /* Q2 rendered separately, conditional on trigger_outcome */
  {
    id:       's16-q3',
    qNum:     'Q3',
    stateKey: 's4.q3',
    label:    'Decision handling',
    text:     'Can the enterprise receive the DAL-X decision through a webhook or retrieve it by polling?',
    options:  Q3_OPTIONS,
    kind:     'structural',
  },
  {
    id:       's16-q4',
    qNum:     'Q4',
    stateKey: 's4.q4',
    label:    'Enforcement point',
    text:     'Can the downstream execution service call the DAL-X enforcement endpoint before execution?',
    options:  YES_NO_UNKNOWN,
    kind:     'structural',
  },
  {
    id:       's16-q5',
    qNum:     'Q5',
    stateKey: 's4.q5',
    label:    'Blocking behavior',
    text:     'Can the downstream service block execution whenever DAL-X rejects the request, returns an error, or is unavailable?',
    options:  YES_NO_UNKNOWN,
    kind:     'structural',
  },
  {
    id:       's16-q6',
    qNum:     'Q6',
    stateKey: 's4.q6',
    label:    'Bypass prevention',
    text:     'Can every governed execution be required to pass through the DAL-X enforcement check?',
    options:  YES_NO_UNKNOWN,
    kind:     'structural',
  },
];

const S16_IMPLEMENTATION = [
  {
    id:       's16-q7',
    qNum:     'Q7',
    stateKey: 's4.q7',
    label:    'Submission fields',
    text:     'Can the enterprise provide the documented submission fields and required metadata?',
    options:  YES_NO_UNKNOWN,
    kind:     'implementation',
  },
  {
    id:       's16-q8',
    qNum:     'Q8',
    stateKey: 's4.q8',
    label:    'API key storage',
    text:     'Can the enterprise store DAL-X API keys in a secrets manager or equivalent protected configuration?',
    options:  YES_NO_UNKNOWN,
    kind:     'implementation',
  },
  {
    id:       's16-q9',
    qNum:     'Q9',
    stateKey: 's4.q9',
    label:    'Data handling',
    text:     'Can sensitive information remain inside the enterprise while DAL-X receives reference identifiers and required metadata?',
    options:  YES_NO_UNKNOWN,
    kind:     'implementation',
  },
  {
    id:       's16-q10',
    qNum:     'Q10',
    stateKey: 's4.q10',
    label:    'Downstream result',
    text:     'Can the enterprise record the downstream system result separately from the DAL-X gate receipt?',
    options:  YES_NO_UNKNOWN,
    kind:     'implementation',
  },
];

/* ── Blocker check ───────────────────────────────────────────────────────── */

function s16IsBlocker(stateKey) {
  const v = getState(stateKey);
  if (stateKey === 's4.q3') return v === 'neither';
  return v === 'no';
}

/* ── Question card builder ───────────────────────────────────────────────── */

function s16BuildQuestionCard(cfg, onChange) {
  const card = document.createElement('div');
  card.className = 'tech-q-card';
  card.dataset.qkind = cfg.kind;
  card.dataset.qkey  = cfg.stateKey;

  if (cfg.kind === 'structural' && s16IsBlocker(cfg.stateKey)) {
    card.classList.add('tech-q-card--blocker');
  }

  const head = document.createElement('div');
  head.className = 'tech-q-card__head';

  const badge = document.createElement('span');
  badge.className = 'tech-q-card__badge';
  badge.textContent = cfg.qNum;
  head.appendChild(badge);

  const labelEl = document.createElement('span');
  labelEl.className = 'tech-q-card__label';
  labelEl.textContent = cfg.label;
  head.appendChild(labelEl);

  card.appendChild(head);

  const questionEl = document.createElement('p');
  questionEl.className = 'tech-q-card__question';
  questionEl.textContent = cfg.text;
  card.appendChild(questionEl);

  const pillRow = document.createElement('div');
  pillRow.className = 'tech-q-pills';
  pillRow.setAttribute('role', 'radiogroup');
  pillRow.setAttribute('aria-label', cfg.label);

  const saved = getState(cfg.stateKey);

  cfg.options.forEach(opt => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'tech-q-pill';
    pill.dataset.value = opt.value;
    pill.setAttribute('role', 'radio');
    pill.setAttribute('aria-checked', String(saved === opt.value));
    if (saved === opt.value) pill.classList.add('is-selected');
    pill.textContent = opt.label;

    pill.addEventListener('click', () => {
      setState(cfg.stateKey, opt.value);
      Array.from(pillRow.children).forEach(child => {
        const on = child === pill;
        child.classList.toggle('is-selected', on);
        child.setAttribute('aria-checked', String(on));
      });
      const blocking = cfg.kind === 'structural' && s16IsBlocker(cfg.stateKey);
      card.classList.toggle('tech-q-card--blocker', blocking);
      if (typeof onChange === 'function') onChange();
    });

    pillRow.appendChild(pill);
  });

  card.appendChild(pillRow);
  return card;
}

/* ── Q2 conditional block ─────────────────────────────────────────────────── */

function s16BuildQ2Card(triggerOutcome, onChange) {
  const isNA = (triggerOutcome === 'auto_approve' || triggerOutcome === 'blocked');

  /* Set or reset q2 based on current trigger outcome */
  if (isNA) {
    setState('s4.q2', 'not_applicable');
  } else if (getState('s4.q2') === 'not_applicable') {
    setState('s4.q2', null);
  }

  if (isNA) {
    const card = document.createElement('div');
    card.className = 'tech-q-card tech-q-card--na';
    card.dataset.qkind = 'structural';
    card.dataset.qkey  = 's4.q2';

    const head = document.createElement('div');
    head.className = 'tech-q-card__head';

    const badge = document.createElement('span');
    badge.className = 'tech-q-card__badge';
    badge.textContent = 'Q2';
    head.appendChild(badge);

    const labelEl = document.createElement('span');
    labelEl.className = 'tech-q-card__label';
    labelEl.textContent = 'Pending execution';
    head.appendChild(labelEl);

    const naTag = document.createElement('span');
    naTag.className = 'tech-q-card__na-tag';
    naTag.textContent = 'Not applicable';
    head.appendChild(naTag);

    card.appendChild(head);

    const naNote = document.createElement('p');
    naNote.className = 'tech-q-card__question';
    naNote.textContent =
      'Pending execution storage is not required. Every execution in this pilot scope is immediately authorized or blocked.';
    card.appendChild(naNote);

    return card;
  }

  const q2cfg = {
    id:       's16-q2',
    qNum:     'Q2',
    stateKey: 's4.q2',
    label:    'Pending execution',
    text:     'Can the proposed execution wait while a reviewer decides and resume from stored pending state?',
    options:  YES_NO_UNKNOWN,
    kind:     'structural',
  };
  return s16BuildQuestionCard(q2cfg, onChange);
}

/* ── Section divider ─────────────────────────────────────────────────────── */

function s16BuildSectionDivider(text) {
  const wrap = document.createElement('div');
  wrap.className = 'tech-section-divider';

  const pill = document.createElement('span');
  pill.className = 'tech-section-divider__pill';
  pill.textContent = text;
  wrap.appendChild(pill);

  return wrap;
}

/* ── Progress counter ────────────────────────────────────────────────────── */

function s16CountAnswered() {
  const isAnswered = v => v != null && v !== '';
  const structKeys = ['s4.q1','s4.q2','s4.q3','s4.q4','s4.q5','s4.q6'];
  const implKeys   = ['s4.q7','s4.q8','s4.q9','s4.q10'];

  let struct = 0, impl = 0;
  structKeys.forEach(k => { if (isAnswered(getState(k))) struct++; });
  implKeys.forEach(k => { if (isAnswered(getState(k))) impl++; });
  return { struct, impl, total: struct + impl, all: struct === 6 && impl === 4 };
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen16() {
  const triggerOutcome = getState('s3.trigger_outcome') || null;

  const screen = document.getElementById('screen-16');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 4 · Technical review';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Technical review';
  screen.appendChild(title);

  /* Opening note (muted) */
  const note = document.createElement('p');
  note.className = 'tech-open-note';
  note.textContent =
    'These questions establish whether the current architecture can support a DAL-X integration. '
    + 'Structural failures block the pilot path. Implementation gaps identify work required before activation.';
  screen.appendChild(note);

  /* Update-progress + submit refs */
  let submitBtn = null;
  let counterEl = null;

  function refreshCounter() {
    if (!counterEl || !submitBtn) return;
    const c = s16CountAnswered();
    counterEl.textContent = `${c.struct} structural, ${c.impl} implementation questions answered.`;
    submitBtn.disabled = !c.all;
    submitBtn.classList.toggle('is-ready', c.all);
  }

  /* Section 1 divider */
  screen.appendChild(s16BuildSectionDivider('Structural requirements'));

  /* Q1 */
  screen.appendChild(s16BuildQuestionCard(S16_STRUCTURAL[0], refreshCounter));

  /* Q2 conditional */
  screen.appendChild(s16BuildQ2Card(triggerOutcome, refreshCounter));

  /* Q3-Q6 */
  S16_STRUCTURAL.slice(1).forEach(cfg => {
    screen.appendChild(s16BuildQuestionCard(cfg, refreshCounter));
  });

  /* Section 2 divider */
  screen.appendChild(s16BuildSectionDivider('Implementation readiness'));

  /* Q7-Q10 */
  S16_IMPLEMENTATION.forEach(cfg => {
    screen.appendChild(s16BuildQuestionCard(cfg, refreshCounter));
  });

  /* Progress + submit row */
  const submitRow = document.createElement('div');
  submitRow.className = 'tech-submit-row';

  counterEl = document.createElement('span');
  counterEl.className = 'tech-submit-row__counter';
  submitRow.appendChild(counterEl);

  submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn--primary tech-submit-row__btn';
  submitBtn.textContent = 'Submit technical review';
  submitBtn.addEventListener('click', () => {
    if (typeof renderScreen17 === 'function') renderScreen17();
    showScreen('screen-17');
  });
  submitRow.appendChild(submitBtn);

  screen.appendChild(submitRow);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-15'));
  nav.appendChild(backBtn);

  screen.appendChild(nav);

  refreshCounter();
}

document.addEventListener('DOMContentLoaded', renderScreen16);
