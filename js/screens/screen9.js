/* ─── Screen 9: Record enterprise policy ────────────────────────────────── */

/*
 * Jochanni Labs records eight policy fields, later mapped to DAL-X trigger
 * rule types. All values persist to sessionState.s3.trigger_rules.
 */

const S9_FIELDS = [
  /* ── Action rules ──────────────────────────────────────────────────── */
  {
    id:          's9-permitted',
    label:       'Actions the agent may initiate',
    stateKey:    's3.trigger_rules.actions_permitted',
    type:        'textarea',
    category:    'auto_approve',
    placeholder: 'e.g. read_logs, generate_report, send_internal_alert',
  },
  {
    id:          's9-standard-review',
    label:       'Actions requiring standard review',
    stateKey:    's3.trigger_rules.actions_standard_review',
    type:        'textarea',
    category:    'needs_review',
    placeholder: 'e.g. deploy_to_staging, export_records, modify_config',
  },
  {
    id:          's9-lead-review',
    label:       'Actions requiring lead review',
    stateKey:    's3.trigger_rules.actions_lead_review',
    type:        'textarea',
    category:    'high_risk',
    placeholder: 'e.g. deploy_to_production, export_all_customer_records, bulk_delete',
  },
  {
    id:          's9-blocked',
    label:       'Actions that must be blocked',
    stateKey:    's3.trigger_rules.actions_blocked',
    type:        'textarea',
    category:    'blocked',
    placeholder: 'e.g. drop_database, revoke_all_access, purge_audit_logs',
  },
  /* ── Reviewer roles ─────────────────────────────────────────────────── */
  {
    id:          's9-standard-role',
    label:       'Standard reviewer role',
    stateKey:    's3.trigger_rules.standard_reviewer_role',
    type:        'text',
    category:    'reviewer',
    placeholder: 'e.g. Operations lead, Platform engineering manager',
  },
  {
    id:          's9-lead-role',
    label:       'Lead reviewer role',
    stateKey:    's3.trigger_rules.lead_reviewer_role',
    type:        'text',
    category:    'reviewer',
    placeholder: 'e.g. CISO, VP Engineering, CTO',
  },
  /* ── Policy context ─────────────────────────────────────────────────── */
  {
    id:          's9-policy-ref',
    label:       'Applicable policy reference',
    stateKey:    's3.trigger_rules.policy_reference',
    type:        'text',
    category:    'context',
    placeholder: 'e.g. SEC-POL-042, IT-CHANGE-CTRL-v3, SOC2-CTRL-18',
  },
  {
    id:          's9-metadata',
    label:       'Required submission metadata',
    stateKey:    's3.trigger_rules.required_metadata',
    type:        'textarea',
    category:    'context',
    placeholder: 'e.g. environment, team, ticket_number, cost_center',
  },
];

const S9_CATEGORY_META = {
  auto_approve: { color: 'green',  hint: 'auto_approve' },
  needs_review: { color: 'amber',  hint: 'needs_review' },
  high_risk:    { color: 'orange', hint: 'high_risk'    },
  blocked:      { color: 'red',    hint: 'blocked'      },
  reviewer:     { color: 'slate',  hint: 'reviewer'     },
  context:      { color: 'slate',  hint: 'context'      },
};

/* ── Field builder ──────────────────────────────────────────────────────── */

function buildPolicyField(cfg) {
  const group = document.createElement('div');
  group.className = 'policy-field';

  const meta = S9_CATEGORY_META[cfg.category] || S9_CATEGORY_META.context;
  const header = document.createElement('div');
  header.className = 'policy-field__header';

  const dot = document.createElement('span');
  dot.className = `policy-field__dot policy-field__dot--${meta.color}`;
  header.appendChild(dot);

  const label = document.createElement('label');
  label.className = 'policy-field__label';
  label.setAttribute('for', cfg.id);
  label.textContent = cfg.label;
  header.appendChild(label);

  const tag = document.createElement('span');
  tag.className = 'policy-field__tag';
  tag.textContent = meta.hint;
  header.appendChild(tag);

  group.appendChild(header);

  let input;
  if (cfg.type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 3;
  } else {
    input = document.createElement('input');
    input.type = 'text';
  }

  input.className = 'form-control policy-field__input';
  input.id        = cfg.id;
  input.placeholder = cfg.placeholder;

  const saved = getState(cfg.stateKey);
  if (saved) input.value = saved;

  input.addEventListener('input', () => {
    setState(cfg.stateKey, input.value);
    refreshPolicySummary();
  });

  group.appendChild(input);
  return group;
}

/* ── Policy summary panel (cosmetic, reads from state each refresh) ─────── */

function buildPolicySummaryPanel() {
  const panel = document.createElement('div');
  panel.className = 'policy-summary';
  panel.id = 'policy-summary';

  const heading = document.createElement('div');
  heading.className = 'policy-summary__heading';
  heading.textContent = 'Policy summary';
  panel.appendChild(heading);

  const body = document.createElement('div');
  body.className = 'policy-summary__body';
  body.id = 'policy-summary-body';
  panel.appendChild(body);

  const note = document.createElement('p');
  note.className = 'policy-summary__note';
  note.textContent = 'Preview of the trigger logic your policy will produce.';
  panel.appendChild(note);

  return panel;
}

function refreshPolicySummary() {
  const body = document.getElementById('policy-summary-body');
  if (!body) return;
  body.innerHTML = '';

  const sections = [
    { label: 'permitted',       key: 's3.trigger_rules.actions_permitted',       color: 'green'  },
    { label: 'needs_review',    key: 's3.trigger_rules.actions_standard_review', color: 'amber'  },
    { label: 'high_risk',       key: 's3.trigger_rules.actions_lead_review',     color: 'orange' },
    { label: 'blocked',         key: 's3.trigger_rules.actions_blocked',         color: 'red'    },
  ];

  let hasAny = false;
  sections.forEach(({ label, key, color }) => {
    const raw = getState(key) || '';
    const items = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (items.length === 0) return;
    hasAny = true;

    const row = document.createElement('div');
    row.className = 'policy-summary__row';

    const dot = document.createElement('span');
    dot.className = `policy-field__dot policy-field__dot--${color}`;
    row.appendChild(dot);

    const key2 = document.createElement('span');
    key2.className = 'policy-summary__key';
    key2.textContent = label;
    row.appendChild(key2);

    const val = document.createElement('span');
    val.className = 'policy-summary__val';
    val.textContent = items.join(', ');
    row.appendChild(val);

    body.appendChild(row);
  });

  const stdRole  = getState('s3.trigger_rules.standard_reviewer_role') || '';
  const leadRole = getState('s3.trigger_rules.lead_reviewer_role')     || '';
  if (stdRole || leadRole) {
    hasAny = true;
    if (stdRole) {
      const r = document.createElement('div');
      r.className = 'policy-summary__row';
      r.innerHTML =
        '<span class="policy-field__dot policy-field__dot--slate"></span>'
        + '<span class="policy-summary__key">standard_reviewer</span>'
        + `<span class="policy-summary__val">${escapeHtml(stdRole)}</span>`;
      body.appendChild(r);
    }
    if (leadRole) {
      const r = document.createElement('div');
      r.className = 'policy-summary__row';
      r.innerHTML =
        '<span class="policy-field__dot policy-field__dot--slate"></span>'
        + '<span class="policy-summary__key">lead_reviewer</span>'
        + `<span class="policy-summary__val">${escapeHtml(leadRole)}</span>`;
      body.appendChild(r);
    }
  }

  if (!hasAny) {
    const empty = document.createElement('p');
    empty.className = 'policy-summary__empty';
    empty.textContent = 'Fill any field above to preview the trigger logic here.';
    body.appendChild(empty);
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ── Renderer ───────────────────────────────────────────────────────────── */

function renderScreen9() {
  const screen = document.getElementById('screen-9');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 · Configured DAL-X simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Record enterprise policy';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent =
    'You define the policy. Jochanni Labs works with your team to build the '
    + 'trigger logic that enforces it inside DAL-X.';
  screen.appendChild(subtitle);

  /* Operator notice */
  const notice = document.createElement('div');
  notice.className = 'callout callout--info';
  notice.style.marginBottom = 'var(--space-6)';
  notice.textContent =
    'In a real engagement, you complete this with Jochanni Labs. '
    + 'You bring your policy knowledge. What the agent may do, what needs review, and what must be blocked. '
    + 'Jochanni Labs translates that into working DAL-X trigger rules.';
  screen.appendChild(notice);

  /* Grouped fields */
  const actionSection = document.createElement('div');
  actionSection.className = 'policy-section';
  const actionHead = document.createElement('div');
  actionHead.className = 'policy-section__heading';
  actionHead.textContent = 'Trigger rules';
  actionSection.appendChild(actionHead);
  S9_FIELDS.slice(0, 4).forEach(cfg => actionSection.appendChild(buildPolicyField(cfg)));
  screen.appendChild(actionSection);

  const divider1 = document.createElement('div');
  divider1.className = 'policy-divider';
  screen.appendChild(divider1);

  const roleSection = document.createElement('div');
  roleSection.className = 'policy-section';
  const roleHead = document.createElement('div');
  roleHead.className = 'policy-section__heading';
  roleHead.textContent = 'Reviewer roles';
  roleSection.appendChild(roleHead);
  S9_FIELDS.slice(4, 6).forEach(cfg => roleSection.appendChild(buildPolicyField(cfg)));
  screen.appendChild(roleSection);

  const divider2 = document.createElement('div');
  divider2.className = 'policy-divider';
  screen.appendChild(divider2);

  const contextSection = document.createElement('div');
  contextSection.className = 'policy-section';
  const contextHead = document.createElement('div');
  contextHead.className = 'policy-section__heading';
  contextHead.textContent = 'Policy context';
  contextSection.appendChild(contextHead);
  S9_FIELDS.slice(6).forEach(cfg => contextSection.appendChild(buildPolicyField(cfg)));
  screen.appendChild(contextSection);

  /* Policy summary preview */
  screen.appendChild(buildPolicySummaryPanel());
  refreshPolicySummary();

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-8'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Continue';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen10 === 'function') renderScreen10();
    showScreen('screen-10');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen9);
