/* ─── Screen 16: Technical Questions ────────────────────────────────────── */

/*
 * Ten questions across two sections:
 *   Structural (Q1–Q6): confirmed 'no'/'neither' = DAL-X cannot control path
 *   Implementation (Q7–Q10): confirmed 'no' = work required, not disqualifying
 *
 * Q2 is conditional:
 *   needs_review | high_risk → Q2 shown, required
 *   auto_approve | blocked   → Q2 hidden, s4.q2 set to 'not_applicable'
 *
 * All answers written to s4.q1–s4.q10.
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
    stateKey: 's4.q1',
    label:    'Q1 — Submission point',
    text:     'Can the agent or calling service submit the proposed execution to DAL-X before execution begins?',
    options:  YES_NO_UNKNOWN,
  },
  /* Q2 rendered separately — conditional on trigger_outcome */
  {
    id:       's16-q3',
    stateKey: 's4.q3',
    label:    'Q3 — Decision handling',
    text:     'Can the enterprise receive the DAL-X decision through a webhook or retrieve it by polling?',
    options:  Q3_OPTIONS,
  },
  {
    id:       's16-q4',
    stateKey: 's4.q4',
    label:    'Q4 — Enforcement point',
    text:     'Can the downstream execution service call the DAL-X enforcement endpoint before execution?',
    options:  YES_NO_UNKNOWN,
  },
  {
    id:       's16-q5',
    stateKey: 's4.q5',
    label:    'Q5 — Blocking behavior',
    text:     'Can the downstream service block execution whenever DAL-X rejects the request, returns an error, or is unavailable?',
    options:  YES_NO_UNKNOWN,
  },
  {
    id:       's16-q6',
    stateKey: 's4.q6',
    label:    'Q6 — Bypass prevention',
    text:     'Can every governed execution be required to pass through the DAL-X enforcement check?',
    options:  YES_NO_UNKNOWN,
  },
];

const S16_IMPLEMENTATION = [
  {
    id:       's16-q7',
    stateKey: 's4.q7',
    label:    'Q7 — Submission fields',
    text:     'Can the enterprise provide the documented submission fields and required metadata?',
    options:  YES_NO_UNKNOWN,
  },
  {
    id:       's16-q8',
    stateKey: 's4.q8',
    label:    'Q8 — API key storage',
    text:     'Can the enterprise store DAL-X API keys in a secrets manager or equivalent protected configuration?',
    options:  YES_NO_UNKNOWN,
  },
  {
    id:       's16-q9',
    stateKey: 's4.q9',
    label:    'Q9 — Data handling',
    text:     'Can sensitive information remain inside the enterprise while DAL-X receives reference identifiers and required metadata?',
    options:  YES_NO_UNKNOWN,
  },
  {
    id:       's16-q10',
    stateKey: 's4.q10',
    label:    'Q10 — Downstream result',
    text:     'Can the enterprise record the downstream system result separately from the DAL-X gate receipt?',
    options:  YES_NO_UNKNOWN,
  },
];

/* ── Radio group builder ──────────────────────────────────────────────────── */

function buildRadioGroup(cfg) {
  const group = document.createElement('div');
  group.className = 'form-group';

  const labelEl = document.createElement('div');
  labelEl.className = 'form-label';
  labelEl.textContent = cfg.label;
  group.appendChild(labelEl);

  const questionEl = document.createElement('p');
  questionEl.style.cssText =
    'font-size:var(--text-sm);color:var(--color-text-secondary);'
    + 'margin:var(--space-1) 0 var(--space-3);line-height:1.6;';
  questionEl.textContent = cfg.text;
  group.appendChild(questionEl);

  const radioWrap = document.createElement('div');
  radioWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:var(--space-3);';

  const saved = getState(cfg.stateKey);

  cfg.options.forEach(opt => {
    const lbl = document.createElement('label');
    lbl.style.cssText =
      'display:inline-flex;align-items:center;gap:var(--space-2);'
      + 'cursor:pointer;font-size:var(--text-sm);';

    const radio = document.createElement('input');
    radio.type    = 'radio';
    radio.name    = cfg.id;
    radio.value   = opt.value;
    radio.checked = (saved === opt.value);
    radio.addEventListener('change', () => setState(cfg.stateKey, opt.value));

    lbl.appendChild(radio);
    lbl.appendChild(document.createTextNode(opt.label));
    radioWrap.appendChild(lbl);
  });

  group.appendChild(radioWrap);
  return group;
}

/* ── Q2 conditional block ─────────────────────────────────────────────────── */

function buildQ2Block(triggerOutcome) {
  const isNA = (triggerOutcome === 'auto_approve' || triggerOutcome === 'blocked');

  /* Set or reset q2 based on current trigger outcome */
  if (isNA) {
    setState('s4.q2', 'not_applicable');
  } else if (getState('s4.q2') === 'not_applicable') {
    setState('s4.q2', null);
  }

  const group = document.createElement('div');
  group.className = 'form-group';

  const labelEl = document.createElement('div');
  labelEl.className = 'form-label';
  labelEl.textContent = 'Q2 — Pending execution';
  group.appendChild(labelEl);

  const questionEl = document.createElement('p');
  questionEl.style.cssText =
    'font-size:var(--text-sm);color:var(--color-text-secondary);'
    + 'margin:var(--space-1) 0 var(--space-3);line-height:1.6;';
  questionEl.textContent =
    'Can the proposed execution wait while a reviewer decides and resume from stored pending state?';
  group.appendChild(questionEl);

  /* Stored Screen 11 result */
  if (triggerOutcome) {
    const outcomeEl = document.createElement('p');
    outcomeEl.style.cssText =
      'font-size:var(--text-sm);color:var(--color-text-secondary);'
      + 'margin-bottom:var(--space-3);';
    outcomeEl.textContent = 'Configured simulation outcome: ' + triggerOutcome;
    group.appendChild(outcomeEl);
  }

  if (isNA) {
    /* Not applicable — read-only callout */
    const naNote = document.createElement('div');
    naNote.className = 'callout callout--info';
    naNote.textContent =
      'Pending execution storage is not required because every execution inside '
      + 'this pilot scope is immediately authorized or blocked.';
    group.appendChild(naNote);
  } else {
    /* Required — info message + radio buttons */
    const infoMsg = document.createElement('div');
    infoMsg.className = 'callout callout--info';
    infoMsg.style.marginBottom = 'var(--space-3)';
    infoMsg.textContent =
      'This pilot scope includes executions that may require human review.';
    group.appendChild(infoMsg);

    const radioWrap = document.createElement('div');
    radioWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:var(--space-3);';

    const saved = getState('s4.q2');
    YES_NO_UNKNOWN.forEach(opt => {
      const lbl = document.createElement('label');
      lbl.style.cssText =
        'display:inline-flex;align-items:center;gap:var(--space-2);'
        + 'cursor:pointer;font-size:var(--text-sm);';

      const radio = document.createElement('input');
      radio.type    = 'radio';
      radio.name    = 's16-q2';
      radio.value   = opt.value;
      radio.checked = (saved === opt.value);
      radio.addEventListener('change', () => setState('s4.q2', opt.value));

      lbl.appendChild(radio);
      lbl.appendChild(document.createTextNode(opt.label));
      radioWrap.appendChild(lbl);
    });

    group.appendChild(radioWrap);
  }

  return group;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen16() {
  const triggerOutcome = getState('s3.trigger_outcome') || null;

  const screen = document.getElementById('screen-16');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 4 — Technical Review';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Technical Questions';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent = 'The questions cover the current integration guide.';
  screen.appendChild(subtitle);

  /* ── Structural questions card ───────────────────────────────────────── */
  const structCard = document.createElement('div');
  structCard.className = 'card';

  const structLabel = document.createElement('p');
  structLabel.className = 'section-label';
  structLabel.style.marginBottom = 'var(--space-2)';
  structLabel.textContent = 'Structural questions';
  structCard.appendChild(structLabel);

  const structNote = document.createElement('p');
  structNote.style.cssText =
    'font-size:var(--text-sm);color:var(--color-text-secondary);'
    + 'margin-bottom:var(--space-5);line-height:1.6;';
  structNote.textContent =
    'A confirmed failure means DAL-X cannot currently control the complete execution path.';
  structCard.appendChild(structNote);

  /* Q1 */
  structCard.appendChild(buildRadioGroup(S16_STRUCTURAL[0]));

  /* Q2 — conditional */
  const q2Divider = document.createElement('hr');
  q2Divider.className = 'divider';
  structCard.appendChild(q2Divider);
  structCard.appendChild(buildQ2Block(triggerOutcome));

  /* Q3–Q6 */
  S16_STRUCTURAL.slice(1).forEach(cfg => {
    const hr = document.createElement('hr');
    hr.className = 'divider';
    structCard.appendChild(hr);
    structCard.appendChild(buildRadioGroup(cfg));
  });

  screen.appendChild(structCard);

  /* ── Implementation questions card ──────────────────────────────────── */
  const implCard = document.createElement('div');
  implCard.className = 'card';
  implCard.style.marginTop = 'var(--space-6)';

  const implLabel = document.createElement('p');
  implLabel.className = 'section-label';
  implLabel.style.marginBottom = 'var(--space-2)';
  implLabel.textContent = 'Implementation questions';
  implCard.appendChild(implLabel);

  const implNote = document.createElement('p');
  implNote.style.cssText =
    'font-size:var(--text-sm);color:var(--color-text-secondary);'
    + 'margin-bottom:var(--space-5);line-height:1.6;';
  implNote.textContent =
    'A confirmed failure identifies work required before the pilot. '
    + 'It does not mean the architecture is unusable.';
  implCard.appendChild(implNote);

  S16_IMPLEMENTATION.forEach((cfg, i) => {
    if (i > 0) {
      const hr = document.createElement('hr');
      hr.className = 'divider';
      implCard.appendChild(hr);
    }
    implCard.appendChild(buildRadioGroup(cfg));
  });

  screen.appendChild(implCard);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-15'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen17 === 'function') renderScreen17();
    showScreen('screen-17');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen16);
