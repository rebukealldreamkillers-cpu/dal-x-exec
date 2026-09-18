/* ─── Screens 2–5: Gate Scenarios ───────────────────────────────────────── */

/* ── Scenario-specific text generators ───────────────────────────────────── */

function getExampleData() {
  const key = getState('s1.example') || 'infrastructure';
  return EXAMPLES[key] || EXAMPLES.infrastructure;
}

function buildConfigs(ex) {
  const a  = ex.action;
  const wa = ex.wrong_action;
  const t  = ex.target;
  const ag = ex.agent;
  const au = ex.required_authority;
  const c  = ex.consequence.toLowerCase();

  return {
    'screen-2': {
      title: 'Missing Authorization',
      setup:
        `The ${ag} attempts to execute ${a} on ${t}. `
        + `The downstream system calls the DAL-X enforcement endpoint, `
        + `but no authorization_id was obtained first.`,
      decision: {
        state:             'Rejected',
        reason:            'No execution authorization was provided.',
        required_response: 'Submit the proposed execution to DAL-X for evaluation.',
        what_happens_next: 'The downstream system is not called.',
        variant:           'rejected',
      },
      withoutDalX:
        `Without this gate, ${c}. `
        + `This would have proceeded with no record that authorization was ever requested, `
        + `reviewed, or granted. There was no way to stop it.`,
      separationTable: null,
      flowchart: [
        { state: 'done',    icon: '1', label: 'AI agent proposes action',
          detail: `${ag} wants to execute ${a} on ${t}` },
        { state: 'skip',    icon: '–', label: 'Submit to DAL-X for evaluation',
          detail: 'Skipped - no submission was made before execution',           dalx: true },
        { state: 'skip',    icon: '–', label: 'Review and authorization',
          detail: 'None obtained' },
        { state: 'error',   icon: '✕', label: 'DAL-X enforcement gate',
          detail: 'No authorization_id provided - required field missing',        dalx: true },
        { state: 'block',   icon: '✕', label: 'Execution blocked',
          detail: 'Downstream system not called' },
      ],
      prev:         'screen-1',
      next:         'screen-3',
      onBeforeNext: () => renderGateScreen('screen-3'),
    },

    'screen-3': {
      title: 'Wrong Action',
      setup:
        `Authorization was issued for ${a}. `
        + `The agent now presents that authorization while attempting ${wa}: `
        + `a different action on the same target.`,
      decision: {
        state:             'Rejected',
        reason:            'The attempted action does not match the authorized action.',
        required_response: 'Submit the changed action as a new proposed execution.',
        what_happens_next: 'The downstream system is not called.',
        variant:           'rejected',
      },
      withoutDalX:
        `Without action matching, an authorization for ${a} could be reused to execute `
        + `${wa} instead. The ${au} approved one specific action, `
        + `not every action the agent might attempt on ${t}.`,
      separationTable: null,
      flowchart: [
        { state: 'done',    icon: '1', label: 'AI agent proposes action',
          detail: `${ag} attempts ${wa} on ${t}` },
        { state: 'done',    icon: '2', label: 'Submit to DAL-X for evaluation',
          detail: `Submission made for ${a}`,                                     dalx: true },
        { state: 'done',    icon: '3', label: 'Review and authorization',
          detail: `${au} approved - authorization issued for ${a} only` },
        { state: 'error',   icon: '✕', label: 'DAL-X enforcement gate',
          detail: `Action mismatch - authorized: ${a}, attempted: ${wa}`,         dalx: true },
        { state: 'block',   icon: '✕', label: 'Execution blocked',
          detail: 'Downstream system not called' },
      ],
      prev: 'screen-2',
      next: 'screen-4',
    },

    'screen-4': {
      title: 'Valid Authorization',
      setup:
        `The ${au} reviewed the submission and approved it. `
        + `The correct authorization_id, action (${a}), and target (${t}) `
        + `are presented to the enforcement endpoint before expiration.`,
      decision: {
        state:             'Accepted',
        reason:            'The authorization is active and the action and target match.',
        required_response: 'None.',
        what_happens_next: 'The downstream call may proceed.',
        variant:           'accepted',
      },
      withoutDalX: null,
      separationTable: {
        rows: [
          { record: 'DAL-X gate',                 result: 'Accepted',  chipState: 'accepted' },
          { record: 'Simulated downstream system', result: 'Completed', chipState: 'neutral'  },
        ],
        note: 'DAL-X gate acceptance does not prove that a real downstream system completed execution.',
      },
      flowchart: [
        { state: 'done',    icon: '1', label: 'AI agent proposes action',
          detail: `${ag} proposes ${a} on ${t}` },
        { state: 'done',    icon: '2', label: 'Submit to DAL-X for evaluation',
          detail: 'Submission accepted and routed for review',                    dalx: true },
        { state: 'done',    icon: '3', label: 'Review and authorization',
          detail: `${au} approved - active authorization issued` },
        { state: 'success', icon: '✓', label: 'DAL-X enforcement gate',
          detail: 'Authorization active, action and target match, not expired',   dalx: true },
        { state: 'execute', icon: '✓', label: 'Execution permitted',
          detail: 'Downstream system may proceed' },
      ],
      prev: 'screen-3',
      next: 'screen-5',
    },

    'screen-5': {
      title: 'Reused Authorization',
      setup:
        `The authorization for ${a} was consumed when the gate accepted the first request. `
        + `The same authorization_id is now submitted again for a second attempt on ${t}.`,
      decision: {
        state:             'Rejected',
        reason:            'The execution authorization has already been consumed.',
        required_response: 'Create a new submission and obtain new authority.',
        what_happens_next: 'The downstream system is not called.',
        variant:           'rejected',
      },
      withoutDalX:
        `Without consumption tracking, the same authorization could trigger `
        + `additional ${a} executions on ${t}, `
        + `each one beyond what the ${au} ever intended to approve.`,
      separationTable: null,
      flowchart: [
        { state: 'done',    icon: '1', label: 'AI agent proposes action',
          detail: `${ag} attempts ${a} on ${t} again` },
        { state: 'done',    icon: '2', label: 'Submit to DAL-X for evaluation',
          detail: 'Same authorization_id reused from first request',              dalx: true },
        { state: 'done',    icon: '3', label: 'Review and authorization',
          detail: 'Authorization already consumed on first accepted use' },
        { state: 'error',   icon: '✕', label: 'DAL-X enforcement gate',
          detail: 'Single-use token already consumed - cannot reuse',             dalx: true },
        { state: 'block',   icon: '✕', label: 'Execution blocked',
          detail: 'Downstream system not called' },
      ],
      prev: 'screen-4',
      next: 'screen-6',
    },
  };
}

/* ── Scenario context strip ───────────────────────────────────────────────── */

function createScenarioStrip(ex) {
  const strip = document.createElement('div');
  strip.className = 'scenario-strip';

  const icon = document.createElement('span');
  icon.className = 'scenario-strip__icon';
  icon.textContent = ex.icon;

  const info = document.createElement('div');
  info.className = 'scenario-strip__info';

  const label = document.createElement('div');
  label.className = 'scenario-strip__label';
  label.textContent = ex.label;

  const meta = document.createElement('div');
  meta.className = 'scenario-strip__meta';
  meta.textContent =
    `${ex.agent}  ·  ${ex.action}  →  ${ex.target}  ·  At risk: ${ex.consequence}`;

  info.appendChild(label);
  info.appendChild(meta);
  strip.appendChild(icon);
  strip.appendChild(info);
  return strip;
}

/* ── Generic renderer ─────────────────────────────────────────────────────── */

function renderGateScreen(screenId) {
  const ex  = getExampleData();
  const cfg = buildConfigs(ex)[screenId];
  if (!cfg) return;

  const screen = document.getElementById(screenId);
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 1 · Public Demonstration';
  screen.appendChild(badge);

  /* Scenario context strip: always visible */
  screen.appendChild(createScenarioStrip(ex));

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = cfg.title;
  screen.appendChild(title);

  /* Setup description */
  const setup = document.createElement('div');
  setup.className = 'callout callout--neutral';
  setup.textContent = cfg.setup;
  screen.appendChild(setup);

  /* Process flowchart */
  if (cfg.flowchart) {
    screen.appendChild(buildGateFlowchart(cfg.flowchart));
  }

  /* Decision state block */
  screen.appendChild(createDecisionBlock(cfg.decision));

  /* Separation table: Screen 4 only */
  if (cfg.separationTable) {
    const tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.style.marginTop = 'var(--space-4)';

    const tableTitle = document.createElement('div');
    tableTitle.className = 'card__title';
    tableTitle.textContent = 'Gate and downstream result';
    tableCard.appendChild(tableTitle);

    const table = document.createElement('table');
    table.className = 'data-table';

    const thead = document.createElement('thead');
    const hrow  = document.createElement('tr');
    ['Record', 'Result'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    cfg.separationTable.rows.forEach(({ record, result, chipState }) => {
      const tr = document.createElement('tr');
      const tdRecord = document.createElement('td');
      tdRecord.textContent = record;
      tr.appendChild(tdRecord);
      const tdResult = document.createElement('td');
      tdResult.appendChild(createStatusChip(chipState, result));
      tr.appendChild(tdResult);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableCard.appendChild(table);

    const tableNote = document.createElement('p');
    tableNote.style.cssText =
      'margin-top:var(--space-4);font-size:var(--text-sm);color:var(--color-text-secondary);';
    tableNote.textContent = cfg.separationTable.note;
    tableCard.appendChild(tableNote);

    screen.appendChild(tableCard);
  }

  /* Without DAL-X context: rejection screens only */
  if (cfg.withoutDalX) {
    const withoutNote = document.createElement('div');
    withoutNote.className = 'callout callout--without';
    withoutNote.style.marginTop = 'var(--space-4)';
    withoutNote.innerHTML = '<strong>Without this gate:</strong> ' + cfg.withoutDalX;
    screen.appendChild(withoutNote);
  }

  /* Evidence label */
  const evidenceLine = document.createElement('p');
  evidenceLine.style.cssText =
    'margin-top:var(--space-5);font-size:var(--text-sm);color:var(--color-text-secondary);';
  evidenceLine.appendChild(document.createTextNode('Evidence: '));
  evidenceLine.appendChild(createEvidenceLabel('demonstrated'));
  screen.appendChild(evidenceLine);

  /* Back / Next nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen(cfg.prev));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    if (cfg.onBeforeNext) cfg.onBeforeNext();
    showScreen(cfg.next);
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

/* ── Per-screen render functions ──────────────────────────────────────────── */

function renderScreen2() { renderGateScreen('screen-2'); }
function renderScreen3() { renderGateScreen('screen-3'); }
function renderScreen4() { renderGateScreen('screen-4'); }
function renderScreen5() { renderGateScreen('screen-5'); }

/* ── Init ─────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  renderScreen2();
  renderScreen3();
  renderScreen4();
  renderScreen5();
});
