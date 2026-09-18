/* ─── Screen 7: Define the Use Case ─────────────────────────────────────── */

/*
 * Five fields:
 *   1. AI agent: single-select dropdown (7 options + Not sure + Enter my own)
 *   2. Proposed execution: single-select dropdown (9 options + Not sure + Enter my own)
 *   3. Downstream system: single-select dropdown (8 options + Not sure + Enter my own
 *                           + "No downstream system")
 *   4. Consequence: multi-select checkboxes (7 options + Not sure + Enter my own
 *                           + "No consequential effect"); exclusive: not_sure, none
 *   5. Missing authority response: single-select, 3 fixed options only (no custom/not-sure)
 *
 * All selections are written to sessionState.s2 via the component stateKey
 * / customStateKey bindings. Screen 8 reads from s2 to produce its result.
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

/* Three fixed options only, spec does not include Not sure or Enter my own */
const S7_AUTHORITY_OPTIONS = [
  { value: 'must_stop',    label: 'No — there is no gate. The agent\'s action reaches the downstream system directly.'              },
  { value: 'may_continue', label: 'We don\'t require a gate — execution without explicit approval is acceptable for this workflow.' },
  { value: 'unknown',      label: 'Unknown — we have no visibility into what happens between the agent and the downstream system.'  },
];

function renderScreen7() {
  const screen = document.getElementById('screen-7');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 2 · Guided Business Assessment';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Define the Use Case';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent =
    'Describe the AI agent, the proposed execution, and the enterprise\'s '
    + 'required response when authority is missing.';
  screen.appendChild(subtitle);

  /* Form card */
  const card = document.createElement('div');
  card.className = 'card';

  /* 1. AI agent */
  card.appendChild(createDropdown({
    id:              's7-agent',
    label:           'AI agent',
    description:     'Which AI system is taking this action in your environment? e.g. an infrastructure agent that manages cloud resources',
    options:         S7_AGENT_OPTIONS,
    stateKey:        's2.agent_type',
    customStateKey:  's2.agent_type_custom',
    initialValue:    getState('s2.agent_type')       || '',
    initialCustom:   getState('s2.agent_type_custom') || '',
  }));

  /* 2. Proposed execution */
  card.appendChild(createDropdown({
    id:              's7-execution',
    label:           'Proposed execution',
    description:     'What type of action does the agent want to take? e.g. deploy code to production, commit funds, export customer data',
    options:         S7_EXECUTION_OPTIONS,
    stateKey:        's2.proposed_execution',
    customStateKey:  's2.proposed_execution_custom',
    initialValue:    getState('s2.proposed_execution')       || '',
    initialCustom:   getState('s2.proposed_execution_custom') || '',
  }));

  /* 3. Downstream system, includes "No downstream system" */
  card.appendChild(createDropdown({
    id:               's7-downstream',
    label:            'Downstream system',
    description:      'Which system will the agent act on? e.g. your payment platform, cloud environment, or deployment pipeline',
    options:          S7_DOWNSTREAM_OPTIONS,
    stateKey:         's2.downstream_system',
    customStateKey:   's2.downstream_system_custom',
    noSelectionLabel: 'No downstream system',
    initialValue:     getState('s2.downstream_system')       || '',
    initialCustom:    getState('s2.downstream_system_custom') || '',
  }));

  /* 4. Consequence: multi-select; "Not sure" and "No consequential effect"
     are exclusive (deselect all others when chosen) */
  card.appendChild(createMultiSelect({
    id:               's7-consequence',
    label:            'Consequence',
    description:      'If this executes without approval, what could change or go wrong? Select all that apply. e.g. funds move, data leaves the building, a system goes down',
    options:          S7_CONSEQUENCE_OPTIONS,
    stateKey:         's2.consequences',
    customStateKey:   's2.consequences_custom',
    noSelectionLabel: 'No consequential effect',
    initialValues:    getState('s2.consequences')       || [],
    initialCustom:    getState('s2.consequences_custom') || '',
  }));

  /* 5. Current enforcement gap: 3 fixed options, no custom or not-sure */
  card.appendChild(createDropdown({
    id:           's7-authority',
    label:        'Current enforcement gap',
    description:  'Between what your agent proposes and what the downstream system executes, is there currently a required approval gate that stops execution when approval is missing?',
    options:      S7_AUTHORITY_OPTIONS,
    stateKey:     's2.missing_authority_response',
    allowCustom:  false,
    allowNotSure: false,
    initialValue: getState('s2.missing_authority_response') || '',
  }));

  screen.appendChild(card);

  /* Back / Next nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-6'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    /* Re-render Screen 8 with current answers before navigating */
    if (typeof renderScreen8 === 'function') renderScreen8();
    showScreen('screen-8');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen7);
