/* ─── Screen 10: Build the proposed submission ──────────────────────────── */

/*
 * Eight DAL-X submission fields (spec order).
 *   submitter, output_content, input_context (optional),
 *   execution_intent.action → s3.submission.action,
 *   execution_intent.target → s3.submission.target,
 *   source_identifier, idempotency_key, metadata
 *
 * action and target are pre-populated on first visit from Surface 2 or 1.
 * All eight fields write to s3.submission.*.
 */

const S10_FIELDS = [
  /* ── Submitter ─────────────────────────────────────────────────────────── */
  {
    id:          's10-submitter',
    label:       'Submitter',
    stateKey:    's3.submission.submitter',
    apiField:    'submitter',
    apiHint:     'submitter field in POST /api/v1/submissions',
    type:        'text',
    placeholder: 'e.g. infra-agent-v2 or pipeline-job-4892',
    optional:    false,
  },

  /* ── Payload ───────────────────────────────────────────────────────────── */
  {
    id:          's10-output',
    label:       'Output content',
    stateKey:    's3.submission.output_content',
    apiField:    'output_content',
    apiHint:     'output_content field in POST /api/v1/submissions',
    type:        'textarea',
    placeholder: 'e.g. Increase API timeout to 30s on gateway-prod to reduce timeout errors',
    optional:    false,
  },
  {
    id:          's10-context',
    label:       'Input context',
    stateKey:    's3.submission.input_context',
    apiField:    'input_context',
    apiHint:     'input_context field in POST /api/v1/submissions',
    type:        'textarea',
    placeholder: 'e.g. Timeout error rate exceeded 5% threshold over the past 15 minutes',
    optional:    true,
  },

  /* ── Execution intent ──────────────────────────────────────────────────── */
  {
    id:          's10-action',
    label:       'Execution intent, action',
    stateKey:    's3.submission.action',
    apiField:    'execution_intent.action',
    apiHint:     'execution_intent.action in POST /api/v1/submissions',
    type:        'text',
    placeholder: 'e.g. infrastructure_change',
    optional:    false,
  },
  {
    id:          's10-target',
    label:       'Execution intent, target',
    stateKey:    's3.submission.target',
    apiField:    'execution_intent.target',
    apiHint:     'execution_intent.target in POST /api/v1/submissions',
    type:        'text',
    placeholder: 'e.g. cloud_infrastructure_api',
    optional:    false,
  },

  /* ── Tracking ──────────────────────────────────────────────────────────── */
  {
    id:          's10-source',
    label:       'Source identifier',
    stateKey:    's3.submission.source_identifier',
    apiField:    'source_identifier',
    apiHint:     'source_identifier field in POST /api/v1/submissions',
    type:        'text',
    placeholder: 'e.g. workflow-deploy-20241015 or task-id-8823',
    optional:    false,
  },
  {
    id:          's10-idempotency',
    label:       'Request ID',
    stateKey:    's3.submission.idempotency_key',
    apiField:    'idempotency_key',
    apiHint:     'idempotency_key field in POST /api/v1/submissions',
    type:        'text',
    placeholder: 'e.g. req-20241015-deploy-001 (a unique ID per submission, prevents duplicate processing)',
    optional:    false,
  },
  {
    id:          's10-metadata',
    label:       'Metadata',
    stateKey:    's3.submission.metadata',
    apiField:    'metadata',
    apiHint:     'metadata field in POST /api/v1/submissions',
    type:        'textarea',
    placeholder: 'e.g. environment: production\nteam: platform-ops\nticket: OPS-442',
    optional:    false,
  },
];

/* ── Pre-population helpers (unchanged) ─────────────────────────────────── */

function deriveActionDefault() {
  const execution = getState('s2.proposed_execution') || '';
  if (execution && execution !== 'not_sure') {
    return execution === 'custom'
      ? (getState('s2.proposed_execution_custom') || '')
      : execution;
  }
  return getState('s1.action') || '';
}

function deriveTargetDefault() {
  const downstream = getState('s2.downstream_system') || '';
  if (downstream && downstream !== 'not_sure' && downstream !== 'none') {
    return downstream === 'custom'
      ? (getState('s2.downstream_system_custom') || '')
      : downstream;
  }
  return getState('s1.target') || '';
}

/* ── Field builder ──────────────────────────────────────────────────────── */

function buildSubmissionField(cfg) {
  const group = document.createElement('div');
  group.className = 'submission-field';

  const labelEl = document.createElement('label');
  labelEl.className = 'submission-field__label';
  labelEl.setAttribute('for', cfg.id);
  labelEl.textContent = cfg.optional ? `${cfg.label} (optional)` : cfg.label;
  group.appendChild(labelEl);

  let input;
  if (cfg.type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 3;
  } else {
    input = document.createElement('input');
    input.type = 'text';
  }

  input.className = 'form-control submission-field__input';
  input.id        = cfg.id;
  input.placeholder = cfg.placeholder;

  const saved = getState(cfg.stateKey);
  if (saved) input.value = saved;

  input.addEventListener('input', () => {
    setState(cfg.stateKey, input.value);
    refreshJsonPreview();
  });

  group.appendChild(input);

  const hint = document.createElement('div');
  hint.className = 'submission-field__hint';
  hint.textContent = cfg.apiHint;
  group.appendChild(hint);

  return group;
}

/* ── Live JSON preview ──────────────────────────────────────────────────── */

function s10EscapeJsonString(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function s10HtmlEscape(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function buildJsonPreview() {
  const wrap = document.createElement('div');
  wrap.className = 'json-preview';

  const header = document.createElement('div');
  header.className = 'json-preview__header';

  const dot1 = document.createElement('span'); dot1.className = 'json-preview__dot json-preview__dot--r';
  const dot2 = document.createElement('span'); dot2.className = 'json-preview__dot json-preview__dot--y';
  const dot3 = document.createElement('span'); dot3.className = 'json-preview__dot json-preview__dot--g';
  header.appendChild(dot1); header.appendChild(dot2); header.appendChild(dot3);

  const headerLabel = document.createElement('span');
  headerLabel.className = 'json-preview__title';
  headerLabel.textContent = 'POST /api/v1/submissions';
  header.appendChild(headerLabel);

  wrap.appendChild(header);

  const pre = document.createElement('pre');
  pre.className = 'json-preview__body';
  pre.id = 'json-preview-body';
  wrap.appendChild(pre);

  return wrap;
}

function refreshJsonPreview() {
  const pre = document.getElementById('json-preview-body');
  if (!pre) return;

  const submitter = getState('s3.submission.submitter')         || '';
  const output    = getState('s3.submission.output_content')    || '';
  const context   = getState('s3.submission.input_context')     || '';
  const action    = getState('s3.submission.action')            || '';
  const target    = getState('s3.submission.target')            || '';
  const source    = getState('s3.submission.source_identifier') || '';
  const idem      = getState('s3.submission.idempotency_key')   || '';
  const metadata  = getState('s3.submission.metadata')          || '';

  const lines = [];
  lines.push('{');

  function line(key, val, isLast, multiline) {
    if (!val && val !== 0) return;
    const suffix = isLast ? '' : ',';
    const safeKey = `<span class="jkey">"${s10HtmlEscape(key)}"</span>`;
    if (multiline && val.indexOf('\n') !== -1) {
      const escaped = s10HtmlEscape(s10EscapeJsonString(val));
      lines.push(`  ${safeKey}: <span class="jstr">"${escaped}"</span>${suffix}`);
    } else {
      const escaped = s10HtmlEscape(s10EscapeJsonString(val));
      lines.push(`  ${safeKey}: <span class="jstr">"${escaped}"</span>${suffix}`);
    }
  }

  const emitted = [];
  if (submitter) emitted.push(['submitter',         submitter,  false]);
  if (output)    emitted.push(['output_content',    output,     true]);
  if (context)   emitted.push(['input_context',     context,    true]);
  if (action || target) {
    emitted.push(['__execution_intent__', { action, target }, false]);
  }
  if (source)    emitted.push(['source_identifier', source,    false]);
  if (idem)      emitted.push(['idempotency_key',   idem,      false]);
  if (metadata)  emitted.push(['metadata',          metadata,  true]);

  emitted.forEach((entry, i) => {
    const isLast = i === emitted.length - 1;
    const [key, val, multiline] = entry;
    if (key === '__execution_intent__') {
      const suffix = isLast ? '' : ',';
      lines.push(`  <span class="jkey">"execution_intent"</span>: {`);
      const inner = [];
      if (val.action) inner.push(`    <span class="jkey">"action"</span>: <span class="jstr">"${s10HtmlEscape(s10EscapeJsonString(val.action))}"</span>`);
      if (val.target) inner.push(`    <span class="jkey">"target"</span>: <span class="jstr">"${s10HtmlEscape(s10EscapeJsonString(val.target))}"</span>`);
      lines.push(inner.join(',\n'));
      lines.push(`  }${suffix}`);
    } else {
      line(key, val, isLast, multiline);
    }
  });

  if (emitted.length === 0) {
    lines.push('  <span class="jmuted">// Fill any field to preview the request body</span>');
  }

  lines.push('}');
  pre.innerHTML = lines.join('\n');
}

/* ── Renderer ───────────────────────────────────────────────────────────── */

function renderScreen10() {
  /* Pre-populate action and target on first visit */
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
  badge.textContent = 'Surface 3 · Configured DAL-X simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Build the proposed submission';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent =
    'Enter the DAL-X submission fields for the proposed execution. '
    + 'These fields represent the payload the agent submits to the DAL-X gate.';
  screen.appendChild(subtitle);

  /* Warning notice */
  const notice = document.createElement('div');
  notice.className = 'callout callout--warning';
  notice.style.marginBottom = 'var(--space-6)';
  notice.textContent =
    'No reviewer reason is included in the agent submission. '
    + 'No production secrets or regulated customer information should be entered.';
  screen.appendChild(notice);

  /* Two-column layout: form on the left, JSON preview on the right */
  const layout = document.createElement('div');
  layout.className = 'submission-layout';

  const formCol = document.createElement('div');
  formCol.className = 'submission-layout__form';

  /* Section labels between logical groups */
  const SECTION_BREAKS = { 1: 'Payload', 3: 'Execution intent', 5: 'Tracking' };

  S10_FIELDS.forEach((cfg, i) => {
    if (i === 0) {
      const hd = document.createElement('div');
      hd.className = 'submission-section-heading';
      hd.textContent = 'Submitter';
      formCol.appendChild(hd);
    } else if (SECTION_BREAKS[i]) {
      const hd = document.createElement('div');
      hd.className = 'submission-section-heading';
      hd.textContent = SECTION_BREAKS[i];
      formCol.appendChild(hd);
    }
    formCol.appendChild(buildSubmissionField(cfg));
  });

  const previewCol = document.createElement('div');
  previewCol.className = 'submission-layout__preview';
  previewCol.appendChild(buildJsonPreview());

  layout.appendChild(formCol);
  layout.appendChild(previewCol);
  screen.appendChild(layout);

  refreshJsonPreview();

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-9'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Continue';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen11 === 'function') renderScreen11();
    showScreen('screen-11');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen10);
