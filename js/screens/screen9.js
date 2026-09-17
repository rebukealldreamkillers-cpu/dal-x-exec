/* ─── Screen 9: Record Enterprise Policy ────────────────────────────────── */

/*
 * Jochanni Labs records eight policy fields that are later mapped to
 * DAL-X trigger rule types. The customer does not author DAL-X rules.
 * All values persist in sessionState.s3.trigger_rules.
 */

/* Field definitions in spec order */
const S9_FIELDS = [
  /* ── Action rules ──────────────────────────────────────────────────── */
  {
    id:          's9-permitted',
    label:       'Actions the agent may initiate',
    stateKey:    's3.trigger_rules.actions_permitted',
    type:        'textarea',
    placeholder: 'e.g. read_logs, generate_report, send_internal_alert',
    hint:        null,
  },
  {
    id:          's9-standard-review',
    label:       'Actions requiring standard review',
    stateKey:    's3.trigger_rules.actions_standard_review',
    type:        'textarea',
    placeholder: 'e.g. deploy_to_staging, export_records, modify_config',
    hint:        null,
  },
  {
    id:          's9-lead-review',
    label:       'Actions requiring lead review',
    stateKey:    's3.trigger_rules.actions_lead_review',
    type:        'textarea',
    placeholder: 'e.g. deploy_to_production, export_all_customer_records, bulk_delete',
    hint:        null,
  },
  {
    id:          's9-blocked',
    label:       'Actions that must be blocked',
    stateKey:    's3.trigger_rules.actions_blocked',
    type:        'textarea',
    placeholder: 'e.g. drop_database, revoke_all_access, purge_audit_logs',
    hint:        null,
  },
  /* ── Reviewer roles ─────────────────────────────────────────────────── */
  {
    id:          's9-standard-role',
    label:       'Standard reviewer role',
    stateKey:    's3.trigger_rules.standard_reviewer_role',
    type:        'text',
    placeholder: 'e.g. Operations lead, Platform engineering manager',
    hint:        null,
  },
  {
    id:          's9-lead-role',
    label:       'Lead reviewer role',
    stateKey:    's3.trigger_rules.lead_reviewer_role',
    type:        'text',
    placeholder: 'e.g. CISO, VP Engineering, CTO',
    hint:        null,
  },
  /* ── Policy context ─────────────────────────────────────────────────── */
  {
    id:          's9-policy-ref',
    label:       'Applicable policy reference',
    stateKey:    's3.trigger_rules.policy_reference',
    type:        'text',
    placeholder: 'e.g. SEC-POL-042, IT-CHANGE-CTRL-v3, SOC2-CTRL-18',
    hint:        null,
  },
  {
    id:          's9-metadata',
    label:       'Required submission metadata',
    stateKey:    's3.trigger_rules.required_metadata',
    type:        'textarea',
    placeholder: 'e.g. environment, team, ticket_number, cost_center',
    hint:        null,
  },
];

/* ── Field builder ────────────────────────────────────────────────────── */

function buildPolicyField(cfg) {
  const group = document.createElement('div');
  group.className = 'form-group';

  const label = document.createElement('label');
  label.className = 'form-label';
  label.setAttribute('for', cfg.id);
  label.textContent = cfg.label;
  group.appendChild(label);

  let input;
  if (cfg.type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 3;
  } else {
    input = document.createElement('input');
    input.type = 'text';
  }

  input.className = 'form-control';
  input.id        = cfg.id;
  input.placeholder = cfg.placeholder;

  /* Restore saved value */
  const saved = getState(cfg.stateKey);
  if (saved) input.value = saved;

  /* Write to state on every change */
  input.addEventListener('input', () => setState(cfg.stateKey, input.value));

  group.appendChild(input);
  return group;
}

/* ── Renderer ─────────────────────────────────────────────────────────── */

function renderScreen9() {
  const screen = document.getElementById('screen-9');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 · Configured DAL-X Simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Record Enterprise Policy';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent =
    'Jochanni Labs records the enterprise policy that governs this execution. '
    + 'These inputs are mapped to DAL-X trigger rules. The customer does not '
    + 'author rules directly.';
  screen.appendChild(subtitle);

  /* Operator notice */
  const notice = document.createElement('div');
  notice.className = 'callout callout--info';
  notice.style.marginBottom = 'var(--space-6)';
  notice.textContent =
    'This screen is operated by Jochanni Labs. '
    + 'Jochanni Labs maps these inputs to the current DAL-X rule types and severity outcomes. '
    + 'The customer does not author DAL-X rules.';
  screen.appendChild(notice);

  /* Form card */
  const card = document.createElement('div');
  card.className = 'card';

  S9_FIELDS.forEach((cfg, i) => {
    /* Section dividers between logical groups */
    if (i === 4) {
      const hr = document.createElement('hr');
      hr.className = 'divider';
      card.appendChild(hr);
      const sectionLbl = document.createElement('p');
      sectionLbl.className = 'section-label';
      sectionLbl.textContent = 'Reviewer roles';
      card.appendChild(sectionLbl);
    } else if (i === 6) {
      const hr = document.createElement('hr');
      hr.className = 'divider';
      card.appendChild(hr);
      const sectionLbl = document.createElement('p');
      sectionLbl.className = 'section-label';
      sectionLbl.textContent = 'Policy context';
      card.appendChild(sectionLbl);
    } else if (i === 0) {
      const sectionLbl = document.createElement('p');
      sectionLbl.className = 'section-label';
      sectionLbl.style.marginBottom = 'var(--space-3)';
      sectionLbl.textContent = 'Trigger rules';
      card.appendChild(sectionLbl);
    }

    card.appendChild(buildPolicyField(cfg));
  });

  screen.appendChild(card);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-8'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen10 === 'function') renderScreen10();
    showScreen('screen-10');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen9);
