/* ─── Screen 10: Build the Proposed Submission ──────────────────────────── */

/*
 * Eight DAL-X submission fields (spec order):
 *   submitter, output_content, input_context (optional),
 *   execution_intent.action → s3.submission.action,
 *   execution_intent.target → s3.submission.target,
 *   source_identifier, idempotency_key, metadata
 *
 * action and target are pre-populated on first visit from Surface 2 answers
 * (s2.proposed_execution, s2.downstream_system) or Surface 1 (s1.action,
 * s1.target) when the Surface 2 values are absent. User may override freely.
 *
 * All eight fields write to s3.submission.*.
 */

const S10_FIELDS = [
  /* ── Submitter ─────────────────────────────────────────────────────────── */
  {
    id:          's10-submitter',
    label:       'Submitter',
    stateKey:    's3.submission.submitter',
    type:        'text',
    placeholder: 'e.g. infra-agent-v2 or pipeline-job-4892',
    optional:    false,
  },

  /* ── Payload ───────────────────────────────────────────────────────────── */
  {
    id:          's10-output',
    label:       'Output content',
    stateKey:    's3.submission.output_content',
    type:        'textarea',
    placeholder: 'e.g. Increase API timeout to 30s on gateway-prod to reduce timeout errors',
    optional:    false,
  },
  {
    id:          's10-context',
    label:       'Input context',
    stateKey:    's3.submission.input_context',
    type:        'textarea',
    placeholder: 'e.g. Timeout error rate exceeded 5% threshold over the past 15 minutes',
    optional:    true,
  },

  /* ── Execution intent ──────────────────────────────────────────────────── */
  {
    id:          's10-action',
    label:       'Execution intent: action',
    stateKey:    's3.submission.action',
    type:        'text',
    placeholder: 'e.g. infrastructure_change',
    optional:    false,
  },
  {
    id:          's10-target',
    label:       'Execution intent: target',
    stateKey:    's3.submission.target',
    type:        'text',
    placeholder: 'e.g. cloud_infrastructure_api',
    optional:    false,
  },

  /* ── Tracking ──────────────────────────────────────────────────────────── */
  {
    id:          's10-source',
    label:       'Source identifier',
    stateKey:    's3.submission.source_identifier',
    type:        'text',
    placeholder: 'e.g. workflow-deploy-20241015 or task-id-8823',
    optional:    false,
  },
  {
    id:          's10-idempotency',
    label:       'Request ID',
    stateKey:    's3.submission.idempotency_key',
    type:        'text',
    placeholder: 'e.g. req-20241015-deploy-001 (a unique ID per submission, prevents duplicate processing)',
    optional:    false,
  },
  {
    id:          's10-metadata',
    label:       'Metadata',
    stateKey:    's3.submission.metadata',
    type:        'textarea',
    placeholder: 'e.g. environment: production\nteam: platform-ops\nticket: OPS-442',
    optional:    false,
  },
];

/* ── Pre-population helpers ─────────────────────────────────────────────── */

/*
 * Derive a default action value from Surface 2 (proposed_execution) or
 * Surface 1 (action). Returns empty string when nothing is available.
 */
function deriveActionDefault() {
  const execution = getState('s2.proposed_execution') || '';
  if (execution && execution !== 'not_sure') {
    return execution === 'custom'
      ? (getState('s2.proposed_execution_custom') || '')
      : execution;
  }
  return getState('s1.action') || '';
}

/*
 * Derive a default target value from Surface 2 (downstream_system) or
 * Surface 1 (target). Skips 'none' (no downstream system).
 */
function deriveTargetDefault() {
  const downstream = getState('s2.downstream_system') || '';
  if (downstream && downstream !== 'not_sure' && downstream !== 'none') {
    return downstream === 'custom'
      ? (getState('s2.downstream_system_custom') || '')
      : downstream;
  }
  return getState('s1.target') || '';
}

/* ── Field builder ────────────────────────────────────────────────────────── */

function buildSubmissionField(cfg) {
  const group = document.createElement('div');
  group.className = 'form-group';

  const labelEl = document.createElement('label');
  labelEl.className = 'form-label';
  labelEl.setAttribute('for', cfg.id);
  labelEl.textContent = cfg.optional ? cfg.label + ' (optional)' : cfg.label;
  group.appendChild(labelEl);

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

  const saved = getState(cfg.stateKey);
  if (saved) input.value = saved;

  input.addEventListener('input', () => setState(cfg.stateKey, input.value));

  group.appendChild(input);
  return group;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen10() {
  /* Pre-populate action and target on first visit (empty = not yet set) */
  if (!getState('s3.submission.action')) {
    const derived = deriveActionDefault();
    if (derived) setState('s3.submission.action', derived);
  }
  if (!getState('s3.submission.target')) {
    const derived = deriveTargetDefault();
    if (derived) setState('s3.submission.target', derived);
  }

  const screen = document.getElementById('screen-10');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 · Configured DAL-X Simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Build the Proposed Submission';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent =
    'Enter the DAL-X submission fields for the proposed execution. '
    + 'These fields represent the payload the agent submits to the DAL-X gate.';
  screen.appendChild(subtitle);

  /* Warning notice (spec-required) */
  const notice = document.createElement('div');
  notice.className = 'callout callout--warning';
  notice.style.marginBottom = 'var(--space-6)';
  notice.textContent =
    'No reviewer reason is included in the agent submission. '
    + 'No production secrets or regulated customer information should be entered.';
  screen.appendChild(notice);

  /* Form card */
  const card = document.createElement('div');
  card.className = 'card';

  /* Section indices: 0=Submitter, 1-2=Payload, 3-4=Execution intent, 5-7=Tracking */
  const SECTION_BREAKS = {
    0: null,          /* first field: no divider, just a section label */
    1: 'Payload',
    3: 'Execution intent',
    5: 'Tracking',
  };

  S10_FIELDS.forEach((cfg, i) => {
    if (i === 0) {
      const sectionLbl = document.createElement('p');
      sectionLbl.className = 'section-label';
      sectionLbl.style.marginBottom = 'var(--space-3)';
      sectionLbl.textContent = 'Submitter';
      card.appendChild(sectionLbl);
    } else if (SECTION_BREAKS[i]) {
      const hr = document.createElement('hr');
      hr.className = 'divider';
      card.appendChild(hr);
      const sectionLbl = document.createElement('p');
      sectionLbl.className = 'section-label';
      sectionLbl.textContent = SECTION_BREAKS[i];
      card.appendChild(sectionLbl);
    }
    card.appendChild(buildSubmissionField(cfg));
  });

  screen.appendChild(card);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-9'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen11 === 'function') renderScreen11();
    showScreen('screen-11');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen10);
