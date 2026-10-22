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
/*
 * Screens 1 to 6 show a recorded run of the DAL-X demo on sandbox DAL-X
 * (PILOT-14): js/recorded-run.js, exported from the sandbox records by
 * dal-x-wedge scripts/export-simulation-run.mjs. Nothing on these screens is
 * invented. RUN.drifted is the payment DAL-X flagged and the reviewer
 * rejected; RUN.split are the split payments; RUN.approved is the payment
 * the reviewer approved and the payments hub executed.
 */
const RUN = window.RECORDED_RUN;
const DRIFTED = RUN.drifted;
const APPROVED = RUN.approved;

/* "04:46:54 UTC" */
function runTime(iso) { return new Date(iso).toISOString().slice(11, 19) + ' UTC'; }
/* "22 Oct 2026, 04:46:54 UTC" */
function runDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) + ', ' + runTime(iso);
}
/* "EUR 61,480.00" from the execution intent (minor units) */
function intentAmount(intent) {
  if (!intent || intent.amount === null) return 'none';
  return intent.currency + ' ' + (intent.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function intentBlock(intent) {
  return [
    'action:              ' + intent.action,
    'target:              ' + intent.target,
    'amount:              ' + intentAmount(intent),
    'recipient:           ' + intent.recipient,
    'recipientAccountRef: ' + intent.recipientAccountRef,
    'paymentType:         ' + intent.paymentType,
  ].join(String.fromCharCode(10));
}
function severityLabel(sev) { return String(sev).toUpperCase().replace('_', ' '); }
function driftLabel(t) { return String(t).replace(/_/g, ' '); }

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
  wsName.textContent = 'Jochanni Labs · sandbox';
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
 * "Step 1 of 6 - Intercept" style label above the product window.
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

/*
 * buildIllustrationNotice()
 * Shown under the surface badge on screens 1 to 6: the values are a recorded
 * run on sandbox DAL-X, not a live session (PILOT-14).
 */
function buildIllustrationNotice() {
  const notice = document.createElement('p');
  notice.className = 'illustration-notice';
  notice.setAttribute('role', 'note');
  notice.textContent =
    'Recorded run on sandbox DAL-X, ' + runDateTime(RUN.recordedAt) + '. Every value on these screens is the real record of that run; '
    + 'all ' + RUN.stepsPassed + ' steps of the DAL-X demo passed. Screen 6 also lets you call the payments hub live.';
  return notice;
}

/* ── Screen 1 render ───────────────────────────────────────────────────── */

/*
 * buildDemoOrientation()
 * Intro block shown at the top of screen 1: what the demo is, what it covers,
 * and why DAL-X exists. Sets context before the product walkthrough begins.
 */
function buildDemoOrientation() {
  const wrap = document.createElement('div');
  wrap.className = 'demo-orientation';

  const heading = document.createElement('h2');
  heading.className = 'demo-orientation__heading';
  heading.textContent = 'What you are about to see';
  wrap.appendChild(heading);

  const desc = document.createElement('p');
  desc.className = 'demo-orientation__desc';
  desc.textContent =
    'A six-step walkthrough of a real run on sandbox DAL-X: a treasury payment agent built on the '
    + 'Claude Agent SDK, an independent payments hub, and a human reviewer. You will see a payment '
    + 'redirected by a tampered vendor master caught as behavior drift and rejected, split payments '
    + 'caught across submissions, and a clean payment approved, verified by the hub and executed.';
  wrap.appendChild(desc);

  const whyHeading = document.createElement('div');
  whyHeading.className = 'demo-orientation__why-label';
  whyHeading.textContent = 'Why DAL-X exists';
  wrap.appendChild(whyHeading);

  const why = document.createElement('p');
  why.className = 'demo-orientation__why';
  why.textContent =
    'Consequential AI agents - those registered to enterprise systems that move money, '
    + 'modify infrastructure, or commit your organization to action - are executing today. '
    + 'When an auditor, regulator, or board asks "who authorized this," there is no answer. '
    + 'DAL-X exists to make that answer verifiable: every governed execution produces '
    + 'a signed authority record tied to a specific human decision.';
  wrap.appendChild(why);

  const scope = document.createElement('p');
  scope.className = 'demo-orientation__scope';
  scope.textContent =
    'DAL-X does not govern every AI agent. It governs the ones your enterprise '
    + 'has registered - agents with the authority to act on your behalf in downstream systems.';
  wrap.appendChild(scope);

  return wrap;
}

function renderScreen1() {
  const screen = document.getElementById('screen-1');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildSurfaceBadge());
  screen.appendChild(buildIllustrationNotice());
  screen.appendChild(buildDemoOrientation());
  screen.appendChild(buildStepIndicator(1, 'Intercept'));

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
    subId.textContent = DRIFTED.number;
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
    ts.textContent = runDateTime(DRIFTED.submittedAt);
    headerRow.appendChild(ts);
    p1.appendChild(headerRow);

    const grid = document.createElement('div');
    grid.className = 'wedge-detail-grid';
    [
      ['Agent',     DRIFTED.agent],
      ['Status',    'EXECUTION BLOCKED'],
      ['Reference', DRIFTED.reference],
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

    const ocLabel = document.createElement('div');
    ocLabel.className = 'wedge-section-label';
    ocLabel.textContent = 'What the agent proposed';
    p1.appendChild(ocLabel);
    const ocWrap = document.createElement('div');
    ocWrap.className = 'wedge-code-wrap';
    const ocBlock = document.createElement('pre');
    ocBlock.className = 'wedge-code-block';
    ocBlock.textContent = DRIFTED.summary;
    ocWrap.appendChild(ocBlock);
    ocWrap.appendChild(annBadge(2));
    p1.appendChild(ocWrap);

    const eiLabel = document.createElement('div');
    eiLabel.className = 'wedge-section-label';
    eiLabel.textContent = 'Execution intent (what a token would bind)';
    p1.appendChild(eiLabel);
    const eiBlock = document.createElement('pre');
    eiBlock.className = 'wedge-code-block';
    eiBlock.textContent = intentBlock(DRIFTED.intent);
    p1.appendChild(eiBlock);

    const inLabel = document.createElement('div');
    inLabel.className = 'wedge-section-label';
    inLabel.textContent = 'Untrusted agent input (the request text the agent read)';
    p1.appendChild(inLabel);
    const inBlock = document.createElement('pre');
    inBlock.className = 'wedge-code-block';
    inBlock.textContent = DRIFTED.untrustedInput || '(none)';
    p1.appendChild(inBlock);

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
    p2Sub.textContent = DRIFTED.rules.length + ' rule' + (DRIFTED.rules.length === 1 ? '' : 's') + ' matched';
    p2.appendChild(p2Sub);
    p2.appendChild(buildTriggerTable(DRIFTED.rules.map((r, i) => ({
      name: r.name, severity: String(r.severity).toUpperCase(), controlling: r.controlling,
      detail: r.matched_value ? 'matched: ' + r.matched_value : '', annNum: i === 0 ? 3 : undefined,
    }))));
    const resultLineWrap = document.createElement('div');
    resultLineWrap.className = 'wedge-result-line-wrap';
    const resultLine = document.createElement('p');
    resultLine.className = 'wedge-result-line';
    resultLine.textContent = 'Submission entered the review queue. Execution blocked until a human decides.';
    resultLineWrap.appendChild(resultLine);
    resultLineWrap.appendChild(annBadge(4));
    p2.appendChild(resultLineWrap);
    main.appendChild(p2);
  });

  screen.appendChild(win);

  screen.appendChild(buildAnnotationList([
    { num: 1, text: 'Blocked until authorized. The agent\'s release_payment tool call was intercepted and submitted to DAL-X. Nothing reached the payments hub.' },
    { num: 2, text: 'The agent followed its rules: it paid the account its counterparty master showed. An attacker had changed that master record. The agent could not tell.' },
    { num: 3, text: 'Every payment to the payments hub requires a recorded human decision. No payment is released automatically.' },
    { num: 4, text: 'The submission is now in the queue. The next screens show what the reviewer saw.' },
  ]));

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
