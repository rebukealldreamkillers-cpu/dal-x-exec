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
