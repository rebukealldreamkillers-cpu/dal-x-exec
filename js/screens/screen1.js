/* ─── Screen 1: Choose a Scenario ─────────────────────────────────────────
 * Six scenario cards. Selecting one populates sessionState.s1 with the
 * fields consumed by screen2to5.js. Primary CTA advances to the demo.
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
    consequence:        'Live API gateway config affected',
    required_authority: 'Infrastructure lead',
  },
  bulk_data_export: {
    label:              'Bulk data export',
    icon:               '⬆',
    agent:              'Data pipeline agent',
    action:             'bulk_export',
    wrong_action:       'data_delete',
    target:             'data_warehouse_api',
    scope:              'Customer records, all regions',
    consequence:        'Sensitive records moved outside the perimeter',
    required_authority: 'Data owner',
  },
  access_change: {
    label:              'Privileged access change',
    icon:               '🔑',
    agent:              'Identity management agent',
    action:             'access_modification',
    wrong_action:       'access_revoke',
    target:             'identity_platform_api',
    scope:              'Administrator role assignment',
    consequence:        'System access modified without review',
    required_authority: 'Security lead',
  },
  code_deployment: {
    label:              'Code deployment',
    icon:               '▶',
    agent:              'CI/CD orchestration agent',
    action:             'code_deployment',
    wrong_action:       'rollback_deployment',
    target:             'deployment_pipeline_api',
    scope:              'Production release branch',
    consequence:        'Production services affected',
    required_authority: 'Release manager',
  },
  customer_communication: {
    label:              'Customer communication',
    icon:               '✉',
    agent:              'Customer operations agent',
    action:             'external_communication',
    wrong_action:       'bulk_unsubscribe',
    target:             'communication_platform_api',
    scope:              'Bulk email, all active customers',
    consequence:        "External message sent on the company's behalf",
    required_authority: 'Communications lead',
  },
  financial_transaction: {
    label:              'Financial transaction',
    icon:               '$',
    agent:              'Treasury agent',
    action:             'payment_transfer',
    wrong_action:       'release_hold',
    target:             'payment_system_api',
    scope:              'Wire transfer, vendor settlement',
    consequence:        'Funds committed without authority record',
    required_authority: 'Finance approver',
  },
};

function renderScreen1() {
  const screen = document.getElementById('screen-1');
  if (!screen) return;
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 1 · Public Demonstration';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Choose a scenario';
  screen.appendChild(title);

  /* Subtext */
  const subtext = document.createElement('p');
  subtext.className = 'screen-subtitle';
  subtext.textContent =
    'Each example runs the same enforcement logic. '
    + 'Pick the one closest to how your agents operate.';
  screen.appendChild(subtext);

  /* Scenario grid */
  const grid = document.createElement('div');
  grid.className = 'scenario-grid';
  grid.id = 'scenario-grid';

  Object.entries(EXAMPLES).forEach(([key, ex]) => {
    grid.appendChild(buildScenarioCard(key, ex));
  });

  screen.appendChild(grid);

  /* Simulation notice */
  const notice = document.createElement('p');
  notice.className = 'sim-notice';
  notice.textContent =
    'This is a DAL-X simulation. No enterprise system is connected.';
  screen.appendChild(notice);

  /* Screen nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav screen-nav--end';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary btn--lg';
  nextBtn.id = 'scenario-next-btn';
  nextBtn.textContent = 'Run this scenario';
  nextBtn.disabled = true;
  nextBtn.addEventListener('click', () => {
    if (!nextBtn.disabled) showScreen('screen-2');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);

  /* Restore prior selection if one exists */
  const priorKey = getState('s1.example');
  if (priorKey && EXAMPLES[priorKey]) {
    selectExample(priorKey);
  }
}

function buildScenarioCard(key, ex) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'scenario-card';
  card.dataset.exampleKey = key;
  card.setAttribute('aria-pressed', 'false');

  const check = document.createElement('span');
  check.className = 'scenario-card__check';
  check.setAttribute('aria-hidden', 'true');
  check.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  card.appendChild(check);

  const iconWrap = document.createElement('div');
  iconWrap.className = 'scenario-card__icon';
  iconWrap.textContent = ex.icon;
  card.appendChild(iconWrap);

  const nameEl = document.createElement('div');
  nameEl.className = 'scenario-card__name';
  nameEl.textContent = ex.label;
  card.appendChild(nameEl);

  const meta = document.createElement('div');
  meta.className = 'scenario-card__meta';

  const agentLine = document.createElement('div');
  agentLine.className = 'scenario-card__line';
  agentLine.innerHTML =
    `<span class="scenario-card__line-key">Agent</span>`
    + `<span class="scenario-card__line-val">${ex.agent}</span>`;
  meta.appendChild(agentLine);

  const actionLine = document.createElement('div');
  actionLine.className = 'scenario-card__line';
  actionLine.innerHTML =
    `<span class="scenario-card__line-key">Action</span>`
    + `<span class="scenario-card__line-val scenario-card__line-val--mono">${ex.action}</span>`;
  meta.appendChild(actionLine);

  card.appendChild(meta);

  const conseq = document.createElement('div');
  conseq.className = 'scenario-card__consequence';
  conseq.textContent = ex.consequence;
  card.appendChild(conseq);

  card.addEventListener('click', () => selectExample(key));

  return card;
}

/*
 * selectExample(key)
 * Marks the chosen card, writes the s1.* fields consumed by screens 2 to 5,
 * and enables the primary CTA.
 */
function selectExample(key) {
  const ex = EXAMPLES[key];
  if (!ex) return;

  document.querySelectorAll('.scenario-card').forEach(btn => {
    const isSelected = btn.dataset.exampleKey === key;
    btn.classList.toggle('is-selected', isSelected);
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });

  const nextBtn = document.getElementById('scenario-next-btn');
  if (nextBtn) nextBtn.disabled = false;

  /* Persist to session state so screen2to5 reads the same fields */
  setState('s1.example',            key);
  setState('s1.agent',              ex.agent);
  setState('s1.action',             ex.action);
  setState('s1.target',             ex.target);
  setState('s1.scope',              ex.scope);
  setState('s1.consequence',        ex.consequence);
  setState('s1.required_authority', ex.required_authority);
}

document.addEventListener('DOMContentLoaded', renderScreen1);
