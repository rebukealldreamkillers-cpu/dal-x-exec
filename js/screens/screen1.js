/* ─── Screen 1: Choose an Example ───────────────────────────────────────── */

/*
 * Six built-in examples. Only the infrastructure change values are defined
 * explicitly in the spec; the other five are filled with representative
 * values consistent with the spec's Screen 7 downstream-system options.
 */
const EXAMPLES = {
  infrastructure: {
    label:              'Production infrastructure change',
    icon:               '⚙',
    agent:              'Infrastructure deployment agent',
    action:             'infrastructure_change',
    wrong_action:       'database_migration',
    target:             'cloud_infrastructure_api',
    scope:              'API gateway configuration',
    consequence:        'Production traffic may be affected',
    required_authority: 'Infrastructure lead',
  },
  bulk_data_export: {
    label:              'Bulk data export',
    icon:               '⬆',
    agent:              'Data pipeline agent',
    action:             'data_export',
    wrong_action:       'data_delete',
    target:             'data_warehouse_api',
    scope:              'Customer records — all regions',
    consequence:        'Sensitive data may leave the enterprise perimeter',
    required_authority: 'Data owner',
  },
  access_change: {
    label:              'Privileged access change',
    icon:               '🔑',
    agent:              'Identity management agent',
    action:             'access_change',
    wrong_action:       'access_revoke',
    target:             'identity_platform_api',
    scope:              'Administrator role assignment',
    consequence:        'Elevated permissions may be granted to an account',
    required_authority: 'Security lead',
  },
  code_deployment: {
    label:              'Code deployment',
    icon:               '▶',
    agent:              'CI/CD agent',
    action:             'code_deployment',
    wrong_action:       'rollback_deployment',
    target:             'deployment_pipeline_api',
    scope:              'Production release branch',
    consequence:        'Running application may be interrupted or changed',
    required_authority: 'Release manager',
  },
  customer_communication: {
    label:              'Customer communication',
    icon:               '✉',
    agent:              'Customer outreach agent',
    action:             'send_communication',
    wrong_action:       'bulk_unsubscribe',
    target:             'communication_platform_api',
    scope:              'Bulk email — all active customers',
    consequence:        'Customer-facing message sent at scale',
    required_authority: 'Communications lead',
  },
  financial_transaction: {
    label:              'Financial transaction',
    icon:               '$',
    agent:              'Treasury agent',
    action:             'commit_funds',
    wrong_action:       'release_hold',
    target:             'payment_system_api',
    scope:              'Wire transfer — vendor settlement',
    consequence:        'Funds committed and transferred',
    required_authority: 'Finance approver',
  },
};

function renderScreen1() {
  const screen = document.getElementById('screen-1');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 1 — Public Demonstration';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Choose a Scenario';
  screen.appendChild(title);

  /* Stakes framing */
  const framing = document.createElement('p');
  framing.className = 'screen-subtitle';
  framing.textContent =
    'Each scenario below is a consequential AI execution — an action with real downstream effects. '
    + 'In every case, an AI agent has proposed the execution. '
    + 'DAL-X is the only thing standing between that proposal and the downstream system.';
  screen.appendChild(framing);

  /* Section label */
  const sectionLbl = document.createElement('p');
  sectionLbl.className = 'section-label';
  sectionLbl.textContent = 'Select a use case';
  screen.appendChild(sectionLbl);

  /* Example selector grid */
  const grid = document.createElement('div');
  grid.className = 'example-grid';
  grid.id = 'example-grid';

  Object.entries(EXAMPLES).forEach(([key, ex]) => {
    const btn = document.createElement('button');
    btn.className = 'example-card';
    btn.dataset.exampleKey = key;
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = `<span class="example-card__icon">${ex.icon}</span><span>${ex.label}</span>`;
    btn.addEventListener('click', () => selectExample(key));
    grid.appendChild(btn);
  });

  screen.appendChild(grid);

  /* Example details card */
  const card = document.createElement('div');
  card.className = 'card';
  card.id = 'example-fields-card';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'card__title';
  cardTitle.textContent = 'Example details';
  card.appendChild(cardTitle);

  const fieldsBody = document.createElement('div');
  fieldsBody.id = 'example-fields-body';
  card.appendChild(fieldsBody);

  screen.appendChild(card);

  /* Disclaimer */
  const disclaimer = document.createElement('div');
  disclaimer.className = 'callout callout--neutral';
  disclaimer.style.marginTop = 'var(--space-6)';
  disclaimer.textContent =
    'This is a DAL-X simulation. No enterprise system is connected.';
  screen.appendChild(disclaimer);

  /* Screen nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav screen-nav--end';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => showScreen('screen-2'));
  nav.appendChild(nextBtn);

  screen.appendChild(nav);

  /* Initialize — restore prior selection or default to infrastructure */
  selectExample(getState('s1.example') || 'infrastructure');
}

/*
 * selectExample(key)
 * Updates the selected card, re-renders the fields display, and writes
 * all six field values to sessionState.s1.
 */
function selectExample(key) {
  const ex = EXAMPLES[key];
  if (!ex) return;

  /* Highlight selected card */
  document.querySelectorAll('.example-card').forEach(btn => {
    const isSelected = btn.dataset.exampleKey === key;
    btn.classList.toggle('selected', isSelected);
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });

  /* Rebuild fields display */
  const fieldsBody = document.getElementById('example-fields-body');
  if (fieldsBody) {
    fieldsBody.innerHTML = '';

    [
      ['Agent',              ex.agent],
      ['Action',             ex.action],
      ['Target',             ex.target],
      ['Scope',              ex.scope],
      ['Consequence',        ex.consequence],
      ['Required authority', ex.required_authority],
    ].forEach(([label, value]) => {
      fieldsBody.appendChild(createLabelledField(label, value));
    });
  }

  /* Persist to session state */
  setState('s1.example',            key);
  setState('s1.agent',              ex.agent);
  setState('s1.action',             ex.action);
  setState('s1.target',             ex.target);
  setState('s1.scope',              ex.scope);
  setState('s1.consequence',        ex.consequence);
  setState('s1.required_authority', ex.required_authority);
}

document.addEventListener('DOMContentLoaded', renderScreen1);
