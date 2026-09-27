/* ─── Screen 7: Define the use case ─────────────────────────────────────── */

/*
 * Five fields drive the risk profile of the enterprise AI agent use case.
 * All selections persist to sessionState.s2 via component stateKey /
 * customStateKey bindings. Screen 8 reads s2 to produce its result.
 */

const S7_AGENT_OPTIONS = [
  { value: 'infrastructure_agent',    label: 'Infrastructure agent'    },
  { value: 'cybersecurity_agent',     label: 'Cybersecurity agent'     },
  { value: 'data_agent',              label: 'Data agent'              },
  { value: 'customer_service_agent',  label: 'Customer service agent'  },
  { value: 'procurement_agent',       label: 'Procurement agent'       },
  { value: 'treasury_agent',          label: 'Treasury agent'          },
  { value: 'compliance_agent',        label: 'Compliance agent'        },
];

const S7_EXECUTION_OPTIONS = [
  { value: 'change_infrastructure',       label: 'Change production infrastructure' },
  { value: 'export_data',                 label: 'Export data'                      },
  { value: 'change_system_access',        label: 'Change system access'             },
  { value: 'deploy_code',                 label: 'Deploy code'                      },
  { value: 'modify_records',              label: 'Modify records'                   },
  { value: 'send_external_communication', label: 'Send external communication'      },
  { value: 'commit_funds',                label: 'Commit funds'                     },
  { value: 'delete_data',                 label: 'Delete data'                      },
  { value: 'recommendations_only',        label: 'Provide recommendations only'     },
];

const S7_DOWNSTREAM_OPTIONS = [
  { value: 'cloud_platform',         label: 'Cloud platform'         },
  { value: 'database',               label: 'Database'               },
  { value: 'identity_platform',      label: 'Identity platform'      },
  { value: 'deployment_pipeline',    label: 'Deployment pipeline'    },
  { value: 'communication_platform', label: 'Communication platform' },
  { value: 'enterprise_application', label: 'Enterprise application' },
  { value: 'payment_system',         label: 'Payment system'         },
  { value: 'data_warehouse',         label: 'Data warehouse'         },
];

const S7_CONSEQUENCE_OPTIONS = [
  { value: 'financial_effect',    label: 'Financial effect'     },
  { value: 'sensitive_data',      label: 'Sensitive data'       },
  { value: 'production_change',   label: 'Production change'    },
  { value: 'access_change',       label: 'Access change'        },
  { value: 'customer_effect',     label: 'Customer effect'      },
  { value: 'regulatory_exposure', label: 'Regulatory exposure'  },
  { value: 'difficult_to_reverse',label: 'Difficult to reverse' },
];

/* Three fixed options only. Spec does not include Not sure or Enter my own. */
const S7_AUTHORITY_OPTIONS = [
  {
    value: 'must_stop',
    title: 'No gate exists today',
    detail: 'The agent action reaches the downstream system with no required approval in between.',
  },
  {
    value: 'may_continue',
    title: 'No gate is required',
    detail: 'Execution without explicit approval is acceptable for this workflow.',
  },
  {
    value: 'unknown',
    title: 'Unknown',
    detail: 'We have no visibility into what happens between the agent and the downstream system.',
  },
];

/* ── Pill-style multi-select for the consequence field ──────────────────── */

function buildConsequencePillGroup(initialValues, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'pill-group';

  const state = new Set(initialValues || []);
  const exclusiveVals = new Set(['not_sure', 'none']);

  function isExclusive(v) { return exclusiveVals.has(v); }

  const buttons = [];

  function render() {
    buttons.forEach(({ btn, value }) => {
      if (state.has(value)) btn.classList.add('is-selected');
      else btn.classList.remove('is-selected');
    });
  }

  const allOptions = [
    ...S7_CONSEQUENCE_OPTIONS,
    { value: 'not_sure', label: 'Not sure' },
    { value: 'none',     label: 'No consequential effect' },
    { value: 'custom',   label: 'Enter my own' },
  ];

  allOptions.forEach(({ value, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pill';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      const wasSelected = state.has(value);
      if (isExclusive(value)) {
        state.clear();
        if (!wasSelected) state.add(value);
      } else {
        exclusiveVals.forEach(ev => state.delete(ev));
        if (wasSelected) state.delete(value);
        else state.add(value);
      }
      render();
      onChange(Array.from(state));
    });
    buttons.push({ btn, value });
    wrap.appendChild(btn);
  });

  render();
  return { wrap, getSelected: () => Array.from(state) };
}

/* ── Large card group for the current enforcement gap field ─────────────── */

function buildAuthorityCardGroup(initialValue, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'authority-card-group';

  let selected = initialValue || '';
  const cards = [];

  function render() {
    cards.forEach(({ card, value }) => {
      if (value === selected) card.classList.add('is-selected');
      else card.classList.remove('is-selected');
    });
  }

  S7_AUTHORITY_OPTIONS.forEach(({ value, title, detail }) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'authority-card';

    const titleEl = document.createElement('div');
    titleEl.className = 'authority-card__title';
    titleEl.textContent = title;

    const detailEl = document.createElement('div');
    detailEl.className = 'authority-card__detail';
    detailEl.textContent = detail;

    card.appendChild(titleEl);
    card.appendChild(detailEl);

    card.addEventListener('click', () => {
      selected = value;
      render();
      onChange(value);
    });

    cards.push({ card, value });
    wrap.appendChild(card);
  });

  render();
  return wrap;
}

/* ── Field group scaffold used around each input ────────────────────────── */

function buildFieldPanel(labelText, description) {
  const panel = document.createElement('div');
  panel.className = 'field-panel';

  const label = document.createElement('div');
  label.className = 'field-panel__label';
  label.textContent = labelText;
  panel.appendChild(label);

  if (description) {
    const desc = document.createElement('p');
    desc.className = 'field-panel__description';
    desc.textContent = description;
    panel.appendChild(desc);
  }

  return panel;
}

/* ── Live summary panel shown in the aside column ───────────────────────── */

function buildLiveSummaryPanel() {
  const panel = document.createElement('div');
  panel.className = 's7-summary-panel';
  panel.id = 's7-summary-panel';

  const heading = document.createElement('div');
  heading.className = 's7-summary-panel__heading';
  heading.textContent = 'What you are describing';
  panel.appendChild(heading);

  const AGENT_LABELS = {
    infrastructure_agent:   'Infrastructure agent',
    cybersecurity_agent:    'Cybersecurity agent',
    data_agent:             'Data agent',
    customer_service_agent: 'Customer service agent',
    procurement_agent:      'Procurement agent',
    treasury_agent:         'Treasury agent',
    compliance_agent:       'Compliance agent',
  };
  const EXECUTION_LABELS = {
    change_infrastructure:       'Change production infrastructure',
    export_data:                 'Export data',
    change_system_access:        'Change system access',
    deploy_code:                 'Deploy code',
    modify_records:              'Modify records',
    send_external_communication: 'Send external communication',
    commit_funds:                'Commit funds',
    delete_data:                 'Delete data',
    recommendations_only:        'Recommendations only',
  };
  const DOWNSTREAM_LABELS = {
    cloud_platform:         'Cloud platform',
    database:               'Database',
    identity_platform:      'Identity platform',
    deployment_pipeline:    'Deployment pipeline',
    communication_platform: 'Communication platform',
    enterprise_application: 'Enterprise application',
    payment_system:         'Payment system',
    data_warehouse:         'Data warehouse',
    none:                   'None',
  };
  const AUTHORITY_LABELS = {
    must_stop:  'No gate exists today',
    may_continue: 'No gate is required',
    unknown:    'Unknown',
  };

  const rows = [
    { key: 'agent',      label: 'AI agent',          map: AGENT_LABELS,      stateKey: 's2.agent_type',                customKey: 's2.agent_type_custom' },
    { key: 'execution',  label: 'Execution',          map: EXECUTION_LABELS,  stateKey: 's2.proposed_execution',        customKey: 's2.proposed_execution_custom' },
    { key: 'downstream', label: 'Downstream system',  map: DOWNSTREAM_LABELS, stateKey: 's2.downstream_system',         customKey: 's2.downstream_system_custom' },
    { key: 'authority',  label: 'Enforcement gap',    map: AUTHORITY_LABELS,  stateKey: 's2.missing_authority_response', customKey: null },
  ];

  const rowEls = {};

  rows.forEach(({ key, label, map, stateKey, customKey }) => {
    const row = document.createElement('div');
    row.className = 's7-summary-row';

    const rowLabel = document.createElement('div');
    rowLabel.className = 's7-summary-row__label';
    rowLabel.textContent = label;

    const rowValue = document.createElement('div');
    rowValue.className = 's7-summary-row__value';
    rowValue.id = `s7-summary-${key}`;

    function refresh() {
      const raw    = getState(stateKey)  || '';
      const custom = customKey ? (getState(customKey) || '') : '';
      const resolved = custom || map[raw] || '';
      rowValue.textContent = resolved || 'Not selected';
      rowValue.classList.toggle('s7-summary-row__value--empty', !resolved);
    }

    refresh();
    rowEls[key] = refresh;

    row.appendChild(rowLabel);
    row.appendChild(rowValue);
    panel.appendChild(row);
  });

  /* Consequence count row */
  const consRow = document.createElement('div');
  consRow.className = 's7-summary-row';
  const consLabel = document.createElement('div');
  consLabel.className = 's7-summary-row__label';
  consLabel.textContent = 'Consequences';
  const consValue = document.createElement('div');
  consValue.className = 's7-summary-row__value';
  consValue.id = 's7-summary-consequences';

  function refreshCons() {
    const vals = getState('s2.consequences') || [];
    const real = vals.filter(v => v !== 'not_sure' && v !== 'none' && v !== 'custom');
    if (vals.includes('none'))     { consValue.textContent = 'No consequential effect'; consValue.classList.remove('s7-summary-row__value--empty'); }
    else if (real.length === 0)    { consValue.textContent = 'None selected'; consValue.classList.add('s7-summary-row__value--empty'); }
    else                           { consValue.textContent = real.length === 1 ? '1 selected' : `${real.length} selected`; consValue.classList.remove('s7-summary-row__value--empty'); }
  }
  refreshCons();
  rowEls['consequences'] = refreshCons;

  consRow.appendChild(consLabel);
  consRow.appendChild(consValue);
  panel.appendChild(consRow);

  /* Expose refresh so form fields can call it */
  panel._refresh = function(field) {
    if (rowEls[field]) rowEls[field]();
    if (field === 'consequences') refreshCons();
  };
  panel._refreshAll = function() {
    Object.values(rowEls).forEach(fn => fn());
    refreshCons();
  };

  const note = document.createElement('p');
  note.className = 's7-summary-panel__note';
  note.textContent = 'Screen 8 scores these answers and determines whether an enforcement gap exists.';
  panel.appendChild(note);

  return panel;
}

/* ── Renderer ───────────────────────────────────────────────────────────── */

function renderScreen7() {
  const screen = document.getElementById('screen-7');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 2 · Guided business assessment';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Define the use case';
  screen.appendChild(title);

  /* Context note (muted, not a card) */
  const note = document.createElement('p');
  note.className = 'screen-context-note';
  note.textContent =
    'Describe the agent, what it does, and what happens when authority is missing.';
  screen.appendChild(note);

  /* Two-column layout wrapper */
  const layout = document.createElement('div');
  layout.className = 'assessment-layout';

  const formCol = document.createElement('div');
  formCol.className = 'assessment-layout__form';

  const summaryPanel = buildLiveSummaryPanel();
  const asideCol = document.createElement('aside');
  asideCol.className = 'assessment-layout__aside';
  asideCol.appendChild(summaryPanel);

  /* 1. AI agent */
  const agentPanel = buildFieldPanel(
    'AI agent',
    'Which AI system is taking this action in your environment. Example, an infrastructure agent that manages cloud resources.'
  );
  agentPanel.appendChild(createDropdown({
    id:              's7-agent',
    label:           '',
    options:         S7_AGENT_OPTIONS,
    stateKey:        's2.agent_type',
    customStateKey:  's2.agent_type_custom',
    initialValue:    getState('s2.agent_type')        || '',
    initialCustom:   getState('s2.agent_type_custom') || '',
    onChange:        () => summaryPanel._refresh('agent'),
  }));
  formCol.appendChild(agentPanel);

  /* 2. Proposed execution */
  const execPanel = buildFieldPanel(
    'Proposed execution',
    'What action does the agent want to take. Example, deploy code to production, commit funds, or export customer data.'
  );
  execPanel.appendChild(createDropdown({
    id:              's7-execution',
    label:           '',
    options:         S7_EXECUTION_OPTIONS,
    stateKey:        's2.proposed_execution',
    customStateKey:  's2.proposed_execution_custom',
    initialValue:    getState('s2.proposed_execution')        || '',
    initialCustom:   getState('s2.proposed_execution_custom') || '',
    onChange:        () => summaryPanel._refresh('execution'),
  }));
  formCol.appendChild(execPanel);

  /* 3. Downstream system */
  const dsPanel = buildFieldPanel(
    'Downstream system',
    'Which system the agent acts on. Example, your payment platform, cloud environment, or deployment pipeline.'
  );
  dsPanel.appendChild(createDropdown({
    id:               's7-downstream',
    label:            '',
    options:          S7_DOWNSTREAM_OPTIONS,
    stateKey:         's2.downstream_system',
    customStateKey:   's2.downstream_system_custom',
    noSelectionLabel: 'No downstream system',
    initialValue:     getState('s2.downstream_system')        || '',
    initialCustom:    getState('s2.downstream_system_custom') || '',
    onChange:         () => summaryPanel._refresh('downstream'),
  }));
  formCol.appendChild(dsPanel);

  /* 4. Consequence (pill-style multi-select) */
  const consPanel = buildFieldPanel(
    'Consequence',
    'If this executes without approval, what could change or go wrong. Select all that apply.'
  );
  const initialCons = getState('s2.consequences') || [];
  const pillGroup = buildConsequencePillGroup(initialCons, (values) => {
    setState('s2.consequences', values);
    summaryPanel._refresh('consequences');
  });
  consPanel.appendChild(pillGroup.wrap);
  setState('s2.consequences', pillGroup.getSelected());
  formCol.appendChild(consPanel);

  /* 5. Current enforcement gap (large card group) */
  const authPanel = buildFieldPanel(
    'Current enforcement gap',
    'Between what your agent proposes and what the downstream system executes, is there currently a required approval gate that stops execution when approval is missing.'
  );
  authPanel.appendChild(
    buildAuthorityCardGroup(
      getState('s2.missing_authority_response') || '',
      (value) => {
        setState('s2.missing_authority_response', value);
        summaryPanel._refresh('authority');
      }
    )
  );
  formCol.appendChild(authPanel);

  layout.appendChild(formCol);
  layout.appendChild(asideCol);
  screen.appendChild(layout);

  /* Methodology notice, kept for spec fidelity but restyled */
  const methodNote = document.createElement('p');
  methodNote.className = 'assessment-method-note';
  methodNote.textContent =
    'Answers are self-reported. Jochanni Labs reviews and validates them with your team '
    + 'as part of a paid engagement before any recommendation is finalized.';
  screen.appendChild(methodNote);

  /* Back / Next nav (preserves existing navigation exactly) */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-6'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Continue';
  nextBtn.addEventListener('click', () => {
    /* Re-render Screen 8 with current answers before navigating */
    if (typeof renderScreen8 === 'function') renderScreen8();
    showScreen('screen-8');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen7);
