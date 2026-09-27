/* ─── Screen 1: Submission received ───────────────────────────────────────
 * Annotated high-fidelity mockup of the DAL-X-Wedge product UI showing a
 * treasury wire submission ($650,000 to Acme Corp) landing in the review
 * queue with EXECUTION BLOCKED status. Fixed scenario, no selection logic.
 */

/* ── Shared helpers used by all six wedge mockup screens ──────────────── */

const WEDGE_SIDEBAR_ITEMS = [
  { key: 'submissions',  label: 'Submissions'      },
  { key: 'queue',        label: 'Review Queue'     },
  { key: 'workbench',    label: 'Review Workbench' },
  { key: 'tokens',       label: 'Token Registry'   },
  { key: 'timeline',     label: 'Timeline'         },
  { key: 'settings',     label: 'Settings'         },
];

/* Fixed scenario data, referenced by screens 1 through 6 */
const WEDGE_SCENARIO = {
  agent:           'treasury-agent-v1',
  output_content:  'Transfer $650,000.00 USD to account 8821-A (Acme Corp). Wire reference: INV-2026-0892. Payment type: wire_transfer.',
  action:          'payment_transfer',
  target:          'core-banking-system',
  source_ref:      'txn-ref-20260927-089',
  submission_id:   'sub_01JK8M...',
  auth_id:         '3e7f8d9a-...ef01',
  receipt_id:      'rcpt_01JK8P4WXYZ',
  reviewer_email:  's.chen@meridian.com',
  reviewer_name:   'S. Chen',
  reviewer_role:   'Lead Treasury Authority',
  approve_reason:  'Wire transfer verified against Acme Corp contract INV-2026-0892. Amount within Q3 authorized limit. Approver: S. Chen, Lead Treasury Authority.',
  submitted_at:    '2026-09-27 14:23:41 UTC',
  opened_at:       '2026-09-27 14:25:33 UTC',
  approved_at:     '2026-09-27 14:25:51 UTC',
  auth_issued:     '2026-09-27 14:25:51 UTC',
  auth_expires:    '2026-09-27 14:40:51 UTC',
  decision_record: 'dr_01JK8N7ABCD',
};

/*
 * buildWedgeWindow(activeKey, mainBuilder)
 * Assembles the product window shell: topbar, sidebar, main content area.
 * mainBuilder is a function that receives the main element and appends to it.
 */
function buildWedgeWindow(activeKey, mainBuilder) {
  const win = document.createElement('div');
  win.className = 'wedge-window';

  /* Topbar */
  const topbar = document.createElement('div');
  topbar.className = 'wedge-window__topbar';

  const brand = document.createElement('div');
  brand.className = 'wedge-window__brand';
  brand.textContent = 'DAL-X';
  topbar.appendChild(brand);

  const workspace = document.createElement('div');
  workspace.className = 'wedge-window__workspace';

  const wsName = document.createElement('span');
  wsName.className = 'wedge-window__workspace-name';
  wsName.textContent = 'Meridian Treasury';
  workspace.appendChild(wsName);

  const avatar = document.createElement('span');
  avatar.className = 'wedge-window__avatar';
  workspace.appendChild(avatar);

  topbar.appendChild(workspace);
  win.appendChild(topbar);

  /* Body: sidebar + main */
  const body = document.createElement('div');
  body.className = 'wedge-window__body';

  const sidebar = document.createElement('div');
  sidebar.className = 'wedge-sidebar';
  WEDGE_SIDEBAR_ITEMS.forEach(item => {
    const el = document.createElement('div');
    el.className = 'wedge-sidebar__item';
    if (item.key === activeKey) {
      el.classList.add('wedge-sidebar__item--active');
    }
    el.textContent = item.label;
    sidebar.appendChild(el);
  });
  body.appendChild(sidebar);

  const main = document.createElement('div');
  main.className = 'wedge-main';
  mainBuilder(main);
  body.appendChild(main);

  win.appendChild(body);
  return win;
}

/*
 * buildStepIndicator(num, label)
 * "Step 1 of 6 — Intercept" style label above the product window.
 */
function buildStepIndicator(num, label) {
  const wrap = document.createElement('div');
  wrap.className = 'wedge-step';

  const numEl = document.createElement('span');
  numEl.className = 'wedge-step__num';
  numEl.textContent = `Step ${num} of 6`;
  wrap.appendChild(numEl);

  const sep = document.createElement('span');
  sep.className = 'wedge-step__sep';
  sep.textContent = ' · ';
  wrap.appendChild(sep);

  const labelEl = document.createElement('span');
  labelEl.className = 'wedge-step__label';
  labelEl.textContent = label;
  wrap.appendChild(labelEl);

  return wrap;
}

/*
 * buildAnnotationList(entries)
 * Renders a numbered list of annotation callouts below the product window.
 * entries: [{ num, text }]
 */
function buildAnnotationList(entries) {
  const list = document.createElement('ol');
  list.className = 'wedge-annotations-list';

  entries.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'wedge-annotation';

    const numEl = document.createElement('span');
    numEl.className = 'wedge-annotation__num';
    numEl.textContent = entry.num;
    li.appendChild(numEl);

    const textEl = document.createElement('span');
    textEl.className = 'wedge-annotation__text';
    textEl.textContent = entry.text;
    li.appendChild(textEl);

    list.appendChild(li);
  });

  return list;
}

/*
 * annBadge(num)
 * Superscript-style numbered badge attached to a UI element in the window.
 * The number visually matches an entry in the annotations list below.
 */
function annBadge(num) {
  const b = document.createElement('span');
  b.className = 'wedge-ann-badge';
  b.textContent = num;
  return b;
}

/*
 * buildSurfaceBadge()
 */
function buildSurfaceBadge() {
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 1 · Public Demonstration';
  return badge;
}

/* ── Screen 1 render ───────────────────────────────────────────────────── */

function renderScreen1() {
  const screen = document.getElementById('screen-1');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildSurfaceBadge());
  screen.appendChild(buildStepIndicator(1, 'Intercept'));

  /* Product window */
  const win = buildWedgeWindow('submissions', main => {
    /* Panel 1: Submission received */
    const p1 = document.createElement('section');
    p1.className = 'wedge-panel';

    const p1Head = document.createElement('div');
    p1Head.className = 'wedge-panel__heading';
    p1Head.textContent = 'Submission received';
    p1.appendChild(p1Head);

    const headerRow = document.createElement('div');
    headerRow.className = 'wedge-submission-header';

    const subId = document.createElement('span');
    subId.className = 'wedge-mono';
    subId.textContent = WEDGE_SCENARIO.submission_id;
    headerRow.appendChild(subId);

    const blockWrap = document.createElement('span');
    blockWrap.className = 'wedge-header-badge-wrap';
    const blockedBadge = document.createElement('span');
    blockedBadge.className = 'wedge-badge wedge-badge--blocked';
    blockedBadge.textContent = 'EXECUTION BLOCKED';
    blockWrap.appendChild(blockedBadge);
    blockWrap.appendChild(annBadge(1));
    headerRow.appendChild(blockWrap);

    const ts = document.createElement('span');
    ts.className = 'wedge-timestamp';
    ts.textContent = WEDGE_SCENARIO.submitted_at;
    headerRow.appendChild(ts);

    p1.appendChild(headerRow);

    /* Detail grid */
    const grid = document.createElement('div');
    grid.className = 'wedge-detail-grid';
    [
      ['Submitter',  WEDGE_SCENARIO.agent],
      ['Status',     'EXECUTION BLOCKED'],
      ['Source ref', WEDGE_SCENARIO.source_ref],
    ].forEach(([k, v]) => {
      const key = document.createElement('div');
      key.className = 'wedge-detail-grid__key';
      key.textContent = k;
      grid.appendChild(key);

      const val = document.createElement('div');
      val.className = 'wedge-detail-grid__val';
      val.textContent = v;
      grid.appendChild(val);
    });
    p1.appendChild(grid);

    /* Output content */
    const ocLabel = document.createElement('div');
    ocLabel.className = 'wedge-section-label';
    ocLabel.textContent = 'Output content';
    p1.appendChild(ocLabel);

    const ocWrap = document.createElement('div');
    ocWrap.className = 'wedge-code-wrap';
    const ocBlock = document.createElement('pre');
    ocBlock.className = 'wedge-code-block';
    ocBlock.textContent = WEDGE_SCENARIO.output_content;
    ocWrap.appendChild(ocBlock);
    ocWrap.appendChild(annBadge(2));
    p1.appendChild(ocWrap);

    /* Execution intent */
    const eiLabel = document.createElement('div');
    eiLabel.className = 'wedge-section-label';
    eiLabel.textContent = 'Execution intent';
    p1.appendChild(eiLabel);

    const eiBlock = document.createElement('pre');
    eiBlock.className = 'wedge-code-block';
    eiBlock.textContent =
      `action: ${WEDGE_SCENARIO.action}\n`
      + `target: ${WEDGE_SCENARIO.target}`;
    p1.appendChild(eiBlock);

    main.appendChild(p1);

    /* Panel 2: Trigger evaluation */
    const p2 = document.createElement('section');
    p2.className = 'wedge-panel';

    const p2Head = document.createElement('div');
    p2Head.className = 'wedge-panel__heading';
    p2Head.textContent = 'Trigger evaluation';
    p2.appendChild(p2Head);

    const p2Sub = document.createElement('div');
    p2Sub.className = 'wedge-panel__subhead';
    p2Sub.textContent = '3 rules matched of 18 evaluated';
    p2.appendChild(p2Sub);

    const table = buildTriggerTable([
      {
        name:        'Wire Transfer: $500K+',
        severity:    'HIGH_RISK',
        controlling: true,
        detail:      'currency_threshold ≥ $500,000 USD',
        annNum:      3,
      },
      {
        name:        'Wire Transfer: $10K+',
        severity:    'NEEDS_REVIEW',
        controlling: false,
        detail:      'currency_threshold ≥ $10,000 USD',
      },
      {
        name:        'Payment Execution Keyword',
        severity:    'NEEDS_REVIEW',
        controlling: false,
        detail:      'keyword: "wire transfer"',
      },
    ]);
    p2.appendChild(table);

    const resultLineWrap = document.createElement('div');
    resultLineWrap.className = 'wedge-result-line-wrap';
    const resultLine = document.createElement('p');
    resultLine.className = 'wedge-result-line';
    resultLine.textContent =
      'Submission entered the review queue. Lead reviewer required.';
    resultLineWrap.appendChild(resultLine);
    resultLineWrap.appendChild(annBadge(4));
    p2.appendChild(resultLineWrap);

    main.appendChild(p2);
  });

  screen.appendChild(win);

  /* Annotations list */
  const annotations = buildAnnotationList([
    { num: 1, text: 'Blocked until authorized. Every DAL-X submission is held from execution until a valid authorization exists. The agent cannot proceed.' },
    { num: 2, text: 'The reviewer sees exactly what the agent said. No summaries, no paraphrasing.' },
    { num: 3, text: 'Three rules matched. The highest severity controls. This submission requires a lead reviewer.' },
    { num: 4, text: 'The submission is now in the queue. Execution is blocked until a reviewer acts and an authorization is issued.' },
  ]);
  screen.appendChild(annotations);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-0'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'See the Review Queue →';
  nextBtn.addEventListener('click', () => showScreen('screen-2'));
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

/*
 * buildTriggerTable(rows)
 * rows: [{ name, severity, controlling, detail, annNum? }]
 */
function buildTriggerTable(rows) {
  const table = document.createElement('div');
  table.className = 'wedge-trigger-table';

  const header = document.createElement('div');
  header.className = 'wedge-trigger-row wedge-trigger-row--header';
  ['Rule', 'Severity', '', 'Match detail'].forEach(h => {
    const c = document.createElement('div');
    c.className = 'wedge-trigger-cell';
    c.textContent = h;
    header.appendChild(c);
  });
  table.appendChild(header);

  rows.forEach(row => {
    const rEl = document.createElement('div');
    rEl.className = 'wedge-trigger-row';
    if (row.controlling) rEl.classList.add('wedge-trigger-row--controlling');

    const c1 = document.createElement('div');
    c1.className = 'wedge-trigger-cell wedge-trigger-cell--name';
    c1.dataset.label = 'Rule';
    c1.textContent = row.name;
    rEl.appendChild(c1);

    const c2 = document.createElement('div');
    c2.className = 'wedge-trigger-cell';
    c2.dataset.label = 'Severity';
    const sevChip = document.createElement('span');
    sevChip.className = 'wedge-sev-chip';
    if (row.severity === 'HIGH_RISK') {
      sevChip.classList.add('wedge-sev-chip--high');
    } else {
      sevChip.classList.add('wedge-sev-chip--needs');
    }
    sevChip.textContent = row.severity;
    c2.appendChild(sevChip);
    rEl.appendChild(c2);

    const c3 = document.createElement('div');
    c3.className = 'wedge-trigger-cell wedge-trigger-cell--flag';
    c3.dataset.label = 'Status';
    if (row.controlling) {
      const flag = document.createElement('span');
      flag.className = 'wedge-controlling-flag';
      flag.textContent = 'CONTROLLING';
      c3.appendChild(flag);
      if (row.annNum) c3.appendChild(annBadge(row.annNum));
    } else {
      c3.textContent = '';
    }
    rEl.appendChild(c3);

    const c4 = document.createElement('div');
    c4.className = 'wedge-trigger-cell wedge-trigger-cell--mono';
    c4.dataset.label = 'Match condition';
    c4.textContent = row.detail;
    rEl.appendChild(c4);

    table.appendChild(rEl);
  });

  return table;
}

document.addEventListener('DOMContentLoaded', renderScreen1);
