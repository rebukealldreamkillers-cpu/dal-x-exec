/* ─── components.js ─────────────────────────────────────────────────────────
   Reusable UI components for all 21 screens.
   All functions return DOM nodes. None write to the DOM directly.
   Requires app.js (setState / getState) to be loaded first.
────────────────────────────────────────────────────────────────────────── */

/* ════════════════════════════════════════════════════════════════════════════
   EVIDENCE LABELS
   Spec: every result field carries exactly one of these five labels.
════════════════════════════════════════════════════════════════════════════ */

const EVIDENCE_META = {
  demonstrated:  { cls: 'evidence-label--demonstrated', text: 'Demonstrated in simulation'     },
  business:      { cls: 'evidence-label--business',     text: 'Business participant reported'  },
  technical:     { cls: 'evidence-label--technical',    text: 'Technical participant reported' },
  'jl-reviewed': { cls: 'evidence-label--jl-reviewed',  text: 'Jochanni Labs reviewed'         },
  proven:        { cls: 'evidence-label--proven',       text: 'Proven during pilot'            },
};

/**
 * createEvidenceLabel(type)
 * Returns a <span> badge for the given evidence type.
 *
 * @param {'demonstrated'|'business'|'technical'|'jl-reviewed'|'proven'} type
 * @returns {HTMLSpanElement}
 */
function createEvidenceLabel(type) {
  const meta = EVIDENCE_META[type];
  if (!meta) {
    console.warn(`createEvidenceLabel: unknown type "${type}"`);
    return document.createTextNode('');
  }
  const span = document.createElement('span');
  span.className = `evidence-label ${meta.cls}`;
  span.textContent = meta.text;
  return span;
}

/* ════════════════════════════════════════════════════════════════════════════
   DECISION STATE BLOCK
   Spec: every outcome shows Decision state / Exact reason /
   Required user response / What happens next. All four fields required.
════════════════════════════════════════════════════════════════════════════ */

/**
 * createDecisionBlock(config)
 * Returns the complete four-row decision state card.
 *
 * @param {object} config
 * @param {string} config.state              - Decision state text
 * @param {string} config.reason             - Exact reason
 * @param {string} config.required_response  - Required user response
 * @param {string} config.what_happens_next  - What happens next
 * @param {'accepted'|'rejected'|'pending'|'neutral'} [config.variant='neutral']
 * @param {string} [config.title='Decision State']
 * @returns {HTMLDivElement}
 */
function createDecisionBlock({
  state,
  reason,
  required_response,
  what_happens_next,
  variant = 'neutral',
  title   = 'Decision State',
}) {
  const block = document.createElement('div');
  block.className = `decision-block decision-block--${variant}`;

  const header = document.createElement('div');
  header.className = 'decision-block__header';
  header.textContent = title;
  block.appendChild(header);

  const body = document.createElement('div');
  body.className = 'decision-block__body';

  [
    ['Decision state',         state             ],
    ['Exact reason',           reason            ],
    ['Required user response', required_response ],
    ['What happens next',      what_happens_next ],
  ].forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'decision-block__row';

    const lbl = document.createElement('div');
    lbl.className = 'decision-block__label';
    lbl.textContent = label;

    const val = document.createElement('div');
    val.className = 'decision-block__value';
    val.textContent = value || 'N/A';

    row.appendChild(lbl);
    row.appendChild(val);
    body.appendChild(row);
  });

  block.appendChild(body);
  return block;
}

/* ════════════════════════════════════════════════════════════════════════════
   DROPDOWN (single-select)
   Spec: every dropdown includes standard options + "Not sure" + "Enter my
   own". Selecting "Enter my own" opens a text field. Standard selection and
   custom text are stored separately in sessionState.
════════════════════════════════════════════════════════════════════════════ */

/**
 * createDropdown(config)
 * Returns a <div class="form-group"> with label, <select>, and a
 * conditionally visible custom text input.
 *
 * Stored values:
 *   stateKey      ← selected option value, 'not_sure', 'none', or 'custom'
 *   customStateKey← free text (only populated when stateKey === 'custom')
 *
 * @param {object}   config
 * @param {string}   config.id                 - Element id prefix (must be unique per page)
 * @param {string}   config.label              - Visible label text
 * @param {Array}    config.options             - [{value, label}, ...]
 * @param {string}   [config.stateKey]          - sessionState dot-path for selected value
 * @param {string}   [config.customStateKey]    - sessionState dot-path for custom text
 * @param {boolean}  [config.allowCustom=true]  - Append "Enter my own"
 * @param {boolean}  [config.allowNotSure=true] - Append "Not sure"
 * @param {string}   [config.noSelectionLabel]  - Optional "No X" option (e.g. "No downstream system")
 * @param {string}   [config.initialValue]      - Pre-select this value on render
 * @param {string}   [config.initialCustom]     - Pre-fill custom input on render
 * @param {Function} [config.onChange]          - Callback: (value, customText) => void
 * @returns {HTMLDivElement}
 */
function createDropdown({
  id,
  label,
  description      = null,
  options          = [],
  stateKey,
  customStateKey,
  allowCustom      = true,
  allowNotSure     = true,
  noSelectionLabel = null,
  initialValue     = '',
  initialCustom    = '',
  onChange         = null,
}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-group';

  /* Label */
  const lbl = document.createElement('label');
  lbl.className = 'form-label';
  lbl.setAttribute('for', `${id}-select`);
  lbl.textContent = label;
  wrapper.appendChild(lbl);

  /* Description hint */
  if (description) {
    const desc = document.createElement('p');
    desc.className = 'field-description';
    desc.textContent = description;
    wrapper.appendChild(desc);
  }

  /* Select */
  const select = document.createElement('select');
  select.className = 'form-control';
  select.id = `${id}-select`;

  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = 'Select…';
  select.appendChild(blank);

  options.forEach(({ value, label: optLabel }) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = optLabel;
    select.appendChild(o);
  });

  if (allowNotSure) {
    const o = document.createElement('option');
    o.value = 'not_sure';
    o.textContent = 'Not sure';
    select.appendChild(o);
  }

  if (noSelectionLabel) {
    const o = document.createElement('option');
    o.value = 'none';
    o.textContent = noSelectionLabel;
    select.appendChild(o);
  }

  if (allowCustom) {
    const o = document.createElement('option');
    o.value = 'custom';
    o.textContent = 'Enter my own';
    select.appendChild(o);
  }

  wrapper.appendChild(select);

  /* Custom text input (hidden until "Enter my own" selected) */
  const customWrapper = document.createElement('div');
  customWrapper.className = 'custom-input-wrapper';

  const customInput = document.createElement('input');
  customInput.type = 'text';
  customInput.className = 'form-control';
  customInput.id = `${id}-custom`;
  customInput.placeholder = 'Describe your own…';
  customWrapper.appendChild(customInput);
  wrapper.appendChild(customWrapper);

  /* Restore initial state */
  if (initialValue) {
    select.value = initialValue;
    if (initialValue === 'custom') {
      customWrapper.classList.add('visible');
      customInput.value = initialCustom || '';
    }
  }

  /* Internal sync */
  function sync(val, customText) {
    if (stateKey)       setState(stateKey, val);
    if (customStateKey) setState(customStateKey, customText);
    if (onChange)       onChange(val, customText);
  }

  select.addEventListener('change', () => {
    const val = select.value;
    const isCustom = val === 'custom';
    customWrapper.classList.toggle('visible', isCustom);
    if (!isCustom) {
      customInput.value = '';
      sync(val, '');
    } else {
      sync('custom', customInput.value);
    }
  });

  customInput.addEventListener('input', () => {
    sync('custom', customInput.value);
  });

  return wrapper;
}

/* ════════════════════════════════════════════════════════════════════════════
   MULTI-SELECT (checkboxes)
   Used for Consequence on Screen 7. Stores a values array in sessionState.
   "Not sure", "No X", and any caller-supplied exclusive values deselect
   all other checkboxes when checked.
════════════════════════════════════════════════════════════════════════════ */

/**
 * createMultiSelect(config)
 * Returns a <div class="form-group"> with a checkbox list.
 *
 * Stored values:
 *   stateKey      ← string[] of selected values (may include 'not_sure', 'none', 'custom')
 *   customStateKey← free text (only populated when 'custom' is checked)
 *
 * @param {object}   config
 * @param {string}   config.id
 * @param {string}   config.label
 * @param {Array}    config.options             - [{value, label}, ...]
 * @param {string}   [config.stateKey]
 * @param {string}   [config.customStateKey]
 * @param {boolean}  [config.allowCustom=true]
 * @param {boolean}  [config.allowNotSure=true]
 * @param {string}   [config.noSelectionLabel]  - e.g. "No consequential effect"
 * @param {string[]} [config.exclusive]         - Values that deselect all others when checked
 * @param {string[]} [config.initialValues]     - Pre-checked values
 * @param {string}   [config.initialCustom]
 * @param {Function} [config.onChange]          - Callback: (valuesArray, customText) => void
 * @returns {HTMLDivElement}
 */
function createMultiSelect({
  id,
  label,
  description      = null,
  options          = [],
  stateKey,
  customStateKey,
  allowCustom      = true,
  allowNotSure     = true,
  noSelectionLabel = null,
  exclusive        = [],
  initialValues    = [],
  initialCustom    = '',
  onChange         = null,
}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-group';

  const lbl = document.createElement('label');
  lbl.className = 'form-label';
  lbl.textContent = label;
  wrapper.appendChild(lbl);

  /* Description hint */
  if (description) {
    const desc = document.createElement('p');
    desc.className = 'field-description';
    desc.textContent = description;
    wrapper.appendChild(desc);
  }

  const group = document.createElement('div');
  group.className = 'check-group';
  group.id = `${id}-group`;
  wrapper.appendChild(group);

  /* Custom text input */
  const customWrapper = document.createElement('div');
  customWrapper.className = 'custom-input-wrapper';

  const customInput = document.createElement('input');
  customInput.type = 'text';
  customInput.className = 'form-control';
  customInput.id = `${id}-custom`;
  customInput.placeholder = 'Describe your own…';
  customWrapper.appendChild(customInput);
  wrapper.appendChild(customWrapper);

  /* Build the full option list in spec order */
  const allOptions = [
    ...options,
    ...(allowNotSure     ? [{ value: 'not_sure', label: 'Not sure'         }] : []),
    ...(noSelectionLabel ? [{ value: 'none',     label: noSelectionLabel   }] : []),
    ...(allowCustom      ? [{ value: 'custom',   label: 'Enter my own'     }] : []),
  ];

  /* Values that clear all others when selected */
  const exclusiveSet = new Set([
    ...exclusive,
    ...(allowNotSure     ? ['not_sure'] : []),
    ...(noSelectionLabel ? ['none']     : []),
  ]);

  function getChecked() {
    return allOptions
      .map(o => o.value)
      .filter(v => {
        const cb = document.getElementById(`${id}-cb-${v}`);
        return cb && cb.checked;
      });
  }

  function syncState() {
    const vals = getChecked();
    const customText = customInput.value;
    if (stateKey)       setState(stateKey, vals);
    if (customStateKey) setState(customStateKey, customText);
    if (onChange)       onChange(vals, customText);
  }

  allOptions.forEach(({ value, label: optLabel }) => {
    const item = document.createElement('label');
    item.className = 'check-item';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = `${id}-cb-${value}`;
    cb.value = value;
    cb.checked = initialValues.includes(value);

    item.appendChild(cb);
    item.appendChild(document.createTextNode(optLabel));
    group.appendChild(item);

    cb.addEventListener('change', () => {
      if (cb.checked && exclusiveSet.has(value)) {
        /* Clear all other checkboxes */
        allOptions.forEach(o => {
          if (o.value !== value) {
            const other = document.getElementById(`${id}-cb-${o.value}`);
            if (other) other.checked = false;
          }
        });
        customWrapper.classList.remove('visible');
        customInput.value = '';
      } else if (cb.checked) {
        /* Clear any exclusive options */
        exclusiveSet.forEach(excVal => {
          const excCb = document.getElementById(`${id}-cb-${excVal}`);
          if (excCb) excCb.checked = false;
        });
      }

      /* Show / hide custom input */
      const customCb = document.getElementById(`${id}-cb-custom`);
      if (customCb) {
        const showCustom = customCb.checked;
        customWrapper.classList.toggle('visible', showCustom);
        if (!showCustom) customInput.value = '';
      }

      syncState();
    });
  });

  /* Restore initial state */
  if (initialValues.includes('custom')) {
    customWrapper.classList.add('visible');
    customInput.value = initialCustom || '';
  }

  customInput.addEventListener('input', syncState);

  return wrapper;
}

/* ════════════════════════════════════════════════════════════════════════════
   LABELLED FIELD ROW
   Key / value pair with an optional evidence label appended to the value.
   Used in all result and summary screens.
════════════════════════════════════════════════════════════════════════════ */

/**
 * createLabelledField(key, value, evidenceType)
 * Returns a <div class="field-row">.
 *
 * @param {string} key            - Display key (shown in small caps)
 * @param {string} value          - Display value (monospace)
 * @param {string} [evidenceType] - Evidence label type; omit to skip the badge
 * @returns {HTMLDivElement}
 */
function createLabelledField(key, value, evidenceType) {
  const row = document.createElement('div');
  row.className = 'field-row';

  const keyEl = document.createElement('div');
  keyEl.className = 'field-row__key';
  keyEl.textContent = key;

  const valEl = document.createElement('div');
  valEl.className = 'field-row__value';
  valEl.textContent = value || 'N/A';

  if (evidenceType) {
    valEl.appendChild(document.createTextNode(' '));
    valEl.appendChild(createEvidenceLabel(evidenceType));
  }

  row.appendChild(keyEl);
  row.appendChild(valEl);
  return row;
}

/* ════════════════════════════════════════════════════════════════════════════
   STATUS CHIP
   Small pill badge used in gate test results and trigger outcome displays.
════════════════════════════════════════════════════════════════════════════ */

/**
 * createStatusChip(state, label)
 * Returns a <span class="status-chip status-chip--{state}">.
 *
 * @param {'accepted'|'rejected'|'pending'|'neutral'} state
 * @param {string} [label] - Defaults to capitalised state name
 * @returns {HTMLSpanElement}
 */
function createStatusChip(state, label) {
  const span = document.createElement('span');
  span.className = `status-chip status-chip--${state}`;
  span.textContent = label || (state.charAt(0).toUpperCase() + state.slice(1));
  return span;
}

/* ════════════════════════════════════════════════════════════════════════════
   GATE PROCESS FLOWCHART  (Screens 2–5)
   Vertical stepper showing the end-to-end DAL-X process with each step
   carrying a state: 'done' | 'skip' | 'error' | 'success' | 'block' | 'execute'
   DAL-X integration points are flagged with dalx: true.
════════════════════════════════════════════════════════════════════════════ */

/**
 * buildGateFlowchart(steps)
 * Returns a .gate-flow section showing the end-to-end process.
 *
 * @param {Array<{state: string, icon: string, label: string, detail?: string, dalx?: boolean}>} steps
 * @returns {HTMLDivElement}
 */
function buildGateFlowchart(steps) {
  const wrapper = document.createElement('div');
  wrapper.style.marginTop = 'var(--space-6)';

  const heading = document.createElement('p');
  heading.className = 'section-label';
  heading.textContent = 'Where DAL-X operates in this process';
  heading.style.marginBottom = 'var(--space-3)';
  wrapper.appendChild(heading);

  const flow = document.createElement('div');
  flow.className = 'gate-flow';

  steps.forEach((step, i) => {
    const stepEl = document.createElement('div');
    stepEl.className = `gate-flow__step gate-flow__step--${step.state}`;

    /* Marker column: circle + vertical connector (except on last step) */
    const markerCol = document.createElement('div');
    markerCol.className = 'gate-flow__marker-col';

    const marker = document.createElement('div');
    marker.className = 'gate-flow__marker';
    marker.textContent = step.icon;
    markerCol.appendChild(marker);

    if (i < steps.length - 1) {
      const connector = document.createElement('div');
      connector.className = 'gate-flow__connector';
      markerCol.appendChild(connector);
    }

    stepEl.appendChild(markerCol);

    /* Content column: label + optional detail */
    const content = document.createElement('div');
    content.className = 'gate-flow__content';

    const labelEl = document.createElement('div');
    labelEl.className = 'gate-flow__label';
    labelEl.textContent = step.label;

    if (step.dalx) {
      const badge = document.createElement('span');
      badge.className = 'gate-flow__dalx-badge';
      badge.textContent = 'DAL-X';
      labelEl.appendChild(badge);
    }
    content.appendChild(labelEl);

    if (step.detail) {
      const detailEl = document.createElement('div');
      detailEl.className = 'gate-flow__detail';
      detailEl.textContent = step.detail;
      content.appendChild(detailEl);
    }

    stepEl.appendChild(content);
    flow.appendChild(stepEl);
  });

  wrapper.appendChild(flow);
  return wrapper;
}

/* ════════════════════════════════════════════════════════════════════════════
   LEAD CAPTURE MODAL
   Shown on Screen 8 when a gap outcome is detected and no lead is captured yet.
   Blocks the result view until name / work email / company are submitted.
════════════════════════════════════════════════════════════════════════════ */

/**
 * buildLeadCaptureModal(resultKey, onSubmit)
 * Returns a full-screen overlay modal appended to document.body by the caller.
 * On submit it stores the lead in sessionState.lead and calls onSubmit().
 *
 * @param {string}   resultKey  - The Screen 8 outcome key (e.g. 'critical_gap')
 * @param {Function} onSubmit   - Called after successful form submission
 * @returns {HTMLDivElement}    - The .modal-overlay element
 */
function buildLeadCaptureModal(resultKey, onSubmit) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'lead-capture-modal';

  const box = document.createElement('div');
  box.className = 'modal-box';

  const eyebrow = document.createElement('div');
  eyebrow.className = 'modal-box__eyebrow';
  eyebrow.textContent = 'Your result is ready';
  box.appendChild(eyebrow);

  const title = document.createElement('p');
  title.className = 'modal-box__title';
  title.textContent = 'See your full assessment result';
  box.appendChild(title);

  const body = document.createElement('p');
  body.className = 'modal-box__body';
  body.textContent =
    'Enter your details to unlock the complete result and receive a copy by email.';
  box.appendChild(body);

  function makeField(labelText, inputType, placeholder, autocomplete) {
    const wrapper = document.createElement('div');
    const lbl = document.createElement('label');
    lbl.className = 'form-label';
    lbl.textContent = labelText;
    const inp = document.createElement('input');
    inp.type = inputType;
    inp.className = 'form-input';
    inp.placeholder = placeholder;
    inp.autocomplete = autocomplete;
    wrapper.appendChild(lbl);
    wrapper.appendChild(inp);
    return { wrapper, inp };
  }

  const { wrapper: nameWrap,    inp: nameInput    } = makeField('Full name',   'text',  'Jane Smith',        'name');
  const { wrapper: emailWrap,   inp: emailInput   } = makeField('Work email',  'email', 'jane@company.com',  'email');
  const { wrapper: companyWrap, inp: companyInput } = makeField('Company',     'text',  'Acme Corp',         'organization');

  box.appendChild(nameWrap);
  box.appendChild(emailWrap);
  box.appendChild(companyWrap);

  const errorEl = document.createElement('p');
  errorEl.className = 'modal-box__error';
  errorEl.id = 'modal-error';
  box.appendChild(errorEl);

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn--primary btn--full';
  submitBtn.textContent = 'See my full result →';

  submitBtn.addEventListener('click', () => {
    const name    = nameInput.value.trim();
    const email   = emailInput.value.trim();
    const company = companyInput.value.trim();

    if (!name || !email || !company) {
      errorEl.textContent = 'All three fields are required.';
      errorEl.style.display = 'block';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = 'Please enter a valid work email address.';
      errorEl.style.display = 'block';
      return;
    }

    sessionState.lead = {
      name,
      email,
      company,
      timestamp:  new Date().toISOString(),
      result_key: resultKey,
      risk_score: getState('s2.risk_score') || 0,
    };

    overlay.remove();
    if (typeof onSubmit === 'function') onSubmit();
  });

  box.appendChild(submitBtn);
  overlay.appendChild(box);
  return overlay;
}
