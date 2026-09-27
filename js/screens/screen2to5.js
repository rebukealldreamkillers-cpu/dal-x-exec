/* ─── Screens 2 to 5: DAL-X-Wedge product mockups ─────────────────────────
 * Fixed scenario: $650,000 wire transfer submitted by treasury-agent-v1,
 * reviewed by S. Chen, approved with an authorization token issued.
 * Each screen shows a different view of the same product handling this
 * one submission, annotated with numbered callouts.
 *
 * Depends on shared helpers defined in screen1.js:
 *   buildSurfaceBadge, buildStepIndicator, buildWedgeWindow,
 *   buildAnnotationList, annBadge, buildTriggerTable, WEDGE_SCENARIO
 */

/* ── Screen 2: Review Queue ───────────────────────────────────────────── */

function renderScreen2() {
  const screen = document.getElementById('screen-2');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildSurfaceBadge());
  screen.appendChild(buildStepIndicator(2, 'Queue'));

  const win = buildWedgeWindow('queue', main => {
    const panel = document.createElement('section');
    panel.className = 'wedge-panel';

    /* Queue header */
    const head = document.createElement('div');
    head.className = 'wedge-queue-header';

    const title = document.createElement('div');
    title.className = 'wedge-panel__heading';
    title.textContent = 'Review Queue';
    head.appendChild(title);

    const badgeWrap = document.createElement('span');
    badgeWrap.className = 'wedge-header-badge-wrap';
    const pending = document.createElement('span');
    pending.className = 'wedge-badge wedge-badge--pending';
    pending.textContent = '3 pending';
    badgeWrap.appendChild(pending);
    badgeWrap.appendChild(annBadge(1));
    head.appendChild(badgeWrap);

    panel.appendChild(head);

    /* Queue table */
    const table = document.createElement('div');
    table.className = 'wedge-queue-table';

    const header = document.createElement('div');
    header.className = 'wedge-queue-row wedge-queue-row--header';
    ['Submission', 'Agent', 'Content preview', 'Severity', 'Status'].forEach(h => {
      const c = document.createElement('div');
      c.className = 'wedge-queue-cell';
      c.textContent = h;
      header.appendChild(c);
    });
    table.appendChild(header);

    /* Row 1: highlighted */
    const row1 = buildQueueRow({
      id:      WEDGE_SCENARIO.submission_id,
      agent:   WEDGE_SCENARIO.agent,
      preview: 'Transfer $650,000.00 USD...',
      severity: 'HIGH RISK',
      severityClass: 'high',
      age:      '0:02',
      status:   'AWAITING LEAD AUTHORITY',
      active:   true,
      annNum:   2,
    });
    table.appendChild(row1);

    const row2 = buildQueueRow({
      id:      'sub_01JJ4R...',
      agent:   'data-agent-v2',
      preview: 'Export customer payment records...',
      severity: 'NEEDS REVIEW',
      severityClass: 'needs',
      age:      '0:47',
      status:   'AWAITING REVIEW',
      active:   false,
    });
    table.appendChild(row2);

    const row3 = buildQueueRow({
      id:      'sub_01JH2P...',
      agent:   'infra-agent-v3',
      preview: 'Modify production database schema: users',
      severity: 'NEEDS REVIEW',
      severityClass: 'needs',
      age:      '1:23',
      status:   'AWAITING REVIEW',
      active:   false,
      annOnAge: 3,
    });
    table.appendChild(row3);

    panel.appendChild(table);

    /* Detail strip */
    const strip = document.createElement('div');
    strip.className = 'wedge-detail-strip';
    strip.textContent =
      'HIGH RISK. Lead reviewer required. Standard reviewers cannot approve this item.';
    panel.appendChild(strip);

    main.appendChild(panel);
  });

  screen.appendChild(win);

  screen.appendChild(buildAnnotationList([
    { num: 1, text: 'Every registered agent\'s output lands here before it can execute.' },
    { num: 2, text: 'The $500K+ trigger rule requires a lead reviewer. Standard reviewers cannot approve this item.' },
    { num: 3, text: 'How long each submission sits in the queue is timestamped and part of the permanent record. Submissions cannot be silently removed.' },
  ]));

  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-1'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Open the Review Workbench →';
  nextBtn.addEventListener('click', () => showScreen('screen-3'));
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

function buildQueueRow(cfg) {
  const row = document.createElement('div');
  row.className = 'wedge-queue-row';
  if (cfg.active) row.classList.add('wedge-queue-row--active');
  else row.classList.add('wedge-queue-row--dim');

  const c1 = document.createElement('div');
  c1.className = 'wedge-queue-cell wedge-queue-cell--mono';
  c1.dataset.label = 'Submission';
  c1.textContent = cfg.id;
  row.appendChild(c1);

  const c2 = document.createElement('div');
  c2.className = 'wedge-queue-cell';
  c2.dataset.label = 'Agent';
  c2.textContent = cfg.agent;
  row.appendChild(c2);

  const c3 = document.createElement('div');
  c3.className = 'wedge-queue-cell wedge-queue-cell--preview';
  c3.dataset.label = 'Content';
  c3.textContent = cfg.preview;
  row.appendChild(c3);

  const c4 = document.createElement('div');
  c4.className = 'wedge-queue-cell';
  c4.dataset.label = 'Severity';
  const chip = document.createElement('span');
  chip.className = 'wedge-sev-chip';
  if (cfg.severityClass === 'high') {
    chip.classList.add('wedge-sev-chip--high');
  } else {
    chip.classList.add('wedge-sev-chip--needs');
  }
  chip.textContent = cfg.severity;
  c4.appendChild(chip);
  if (cfg.annNum) c4.appendChild(annBadge(cfg.annNum));
  row.appendChild(c4);

  const c6 = document.createElement('div');
  c6.className = 'wedge-queue-cell wedge-queue-cell--status';
  c6.dataset.label = 'Status';
  c6.textContent = cfg.status;
  if (cfg.annOnAge) c6.appendChild(annBadge(cfg.annOnAge));
  row.appendChild(c6);

  return row;
}

/* ── Screen 3: Review Workbench ───────────────────────────────────────── */

function renderScreen3() {
  const screen = document.getElementById('screen-3');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildSurfaceBadge());
  screen.appendChild(buildStepIndicator(3, 'Workbench'));

  const win = buildWedgeWindow('workbench', main => {
    /* Workbench header */
    const head = document.createElement('div');
    head.className = 'wedge-workbench-head';

    const idEl = document.createElement('span');
    idEl.className = 'wedge-mono';
    idEl.textContent = WEDGE_SCENARIO.submission_id;
    head.appendChild(idEl);

    const chip = document.createElement('span');
    chip.className = 'wedge-badge wedge-badge--high-risk';
    chip.textContent = 'HIGH RISK';
    head.appendChild(chip);

    main.appendChild(head);

    /* Tab bar */
    const tabWrap = document.createElement('div');
    tabWrap.className = 'wedge-tab-wrap';

    const tabs = document.createElement('div');
    tabs.className = 'wedge-tab-bar';
    [
      { label: 'CONTENT',    active: true  },
      { label: 'TRIGGERS',   count: '3',   active: false },
      { label: 'DRIFT',      active: false },
      { label: 'TIMELINE',   active: false },
    ].forEach(t => {
      const tab = document.createElement('div');
      tab.className = 'wedge-tab';
      if (t.active) tab.classList.add('wedge-tab--active');
      tab.textContent = t.label;
      if (t.count) {
        const dot = document.createElement('span');
        dot.className = 'wedge-tab__count';
        dot.textContent = '● ' + t.count;
        tab.appendChild(dot);
      }
      tabs.appendChild(tab);
    });
    tabWrap.appendChild(tabs);
    tabWrap.appendChild(annBadge(1));
    main.appendChild(tabWrap);

    /* CONTENT panel */
    const contentPanel = document.createElement('section');
    contentPanel.className = 'wedge-panel';

    const cHead = document.createElement('div');
    cHead.className = 'wedge-panel__heading';
    cHead.textContent = 'Content';
    contentPanel.appendChild(cHead);

    const ocLabel = document.createElement('div');
    ocLabel.className = 'wedge-section-label';
    ocLabel.textContent = 'Output content';
    contentPanel.appendChild(ocLabel);

    const oc = document.createElement('pre');
    oc.className = 'wedge-code-block';
    oc.textContent = WEDGE_SCENARIO.output_content;
    contentPanel.appendChild(oc);

    const eiLabel = document.createElement('div');
    eiLabel.className = 'wedge-section-label';
    eiLabel.textContent = 'Execution intent';
    contentPanel.appendChild(eiLabel);

    const ei = document.createElement('pre');
    ei.className = 'wedge-code-block';
    ei.textContent =
      `action:            ${WEDGE_SCENARIO.action}\n`
      + `target:            ${WEDGE_SCENARIO.target}\n`
      + `source_identifier: ${WEDGE_SCENARIO.source_ref}`;
    contentPanel.appendChild(ei);

    main.appendChild(contentPanel);

    /* TRIGGERS panel */
    const trPanel = document.createElement('section');
    trPanel.className = 'wedge-panel';

    const trHead = document.createElement('div');
    trHead.className = 'wedge-panel__heading';
    trHead.textContent = 'Triggers';
    trPanel.appendChild(trHead);

    const trSub = document.createElement('div');
    trSub.className = 'wedge-panel__subhead';
    trSub.textContent = '18 rules evaluated. 3 matched.';
    trPanel.appendChild(trSub);

    trPanel.appendChild(buildTriggerTable([
      {
        name:        'Wire Transfer: $500K+',
        severity:    'HIGH_RISK',
        controlling: true,
        detail:      'currency_threshold ≥ $500,000 USD',
        annNum:      2,
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
    ]));

    main.appendChild(trPanel);

    /* DRIFT panel */
    const driftPanel = document.createElement('section');
    driftPanel.className = 'wedge-panel';

    const dHead = document.createElement('div');
    dHead.className = 'wedge-panel__heading';
    dHead.textContent = 'Drift';
    driftPanel.appendChild(dHead);

    const dRow = document.createElement('div');
    dRow.className = 'wedge-drift-row';

    const dInfo = document.createElement('div');
    dInfo.className = 'wedge-drift-info';
    dInfo.innerHTML =
      '<span class="wedge-drift-key">Agent</span>'
      + `<span class="wedge-drift-val wedge-mono">${WEDGE_SCENARIO.agent}</span>`
      + '<span class="wedge-drift-key">Baseline</span>'
      + '<span class="wedge-drift-val"><span class="wedge-badge wedge-badge--active">ACTIVE</span></span>';
    dRow.appendChild(dInfo);
    driftPanel.appendChild(dRow);

    const dResultWrap = document.createElement('div');
    dResultWrap.className = 'wedge-drift-result-wrap';
    const dResult = document.createElement('p');
    dResult.className = 'wedge-drift-result';
    dResult.textContent =
      'No drift detected. This submission matches the agent\'s baseline. Approval can proceed.';
    dResultWrap.appendChild(dResult);
    dResultWrap.appendChild(annBadge(3));
    driftPanel.appendChild(dResultWrap);

    main.appendChild(driftPanel);

    /* TIMELINE strip */
    const tPanel = document.createElement('section');
    tPanel.className = 'wedge-panel';

    const tHead = document.createElement('div');
    tHead.className = 'wedge-panel__heading';
    tHead.textContent = 'Timeline';
    tPanel.appendChild(tHead);

    const tListWrap = document.createElement('div');
    tListWrap.className = 'wedge-timeline-wrap';

    const tList = buildTimelineList([
      { time: '14:23:41', label: 'submission_created' },
      { time: '14:23:41', label: 'trigger_evaluation_completed', detail: '(18 evaluated, 3 matched, controlling: HIGH_RISK)' },
      { time: '14:23:42', label: 'review_queue_entered' },
      { time: '14:25:33', label: 'review_opened', detail: '(s.chen@meridian.com)' },
    ]);
    tListWrap.appendChild(tList);
    tListWrap.appendChild(annBadge(4));
    tPanel.appendChild(tListWrap);

    main.appendChild(tPanel);
  });

  screen.appendChild(win);

  screen.appendChild(buildAnnotationList([
    { num: 1, text: 'Agent output, trigger logic, drift signals, and timeline. All in one view.' },
    { num: 2, text: 'The controlling rule sets the review tier. The reviewer cannot lower it, only approve, reject, escalate, or request revision.' },
    { num: 3, text: 'DAL-X compares each submission against the agent\'s baseline. No drift here means the reviewer can act immediately. Drift would escalate the authority tier.' },
    { num: 4, text: 'Every event is timestamped as it happens. The timeline cannot be edited.' },
  ]));

  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-2'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Make the Decision →';
  nextBtn.addEventListener('click', () => showScreen('screen-4'));
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

/*
 * buildTimelineList(entries)
 * entries: [{ time, label, detail?, completed? }]
 */
function buildTimelineList(entries) {
  const list = document.createElement('ol');
  list.className = 'wedge-timeline-list';

  entries.forEach(e => {
    const li = document.createElement('li');
    li.className = 'wedge-timeline-entry';
    if (e.completed) li.classList.add('wedge-timeline-entry--completed');

    const time = document.createElement('span');
    time.className = 'wedge-timeline-time';
    time.textContent = e.time;
    li.appendChild(time);

    const dot = document.createElement('span');
    dot.className = 'wedge-timeline-dot';
    li.appendChild(dot);

    const label = document.createElement('span');
    label.className = 'wedge-timeline-label';
    label.textContent = e.label;
    li.appendChild(label);

    if (e.detail) {
      const detail = document.createElement('span');
      detail.className = 'wedge-timeline-detail';
      detail.textContent = e.detail;
      li.appendChild(detail);
    }

    list.appendChild(li);
  });

  return list;
}

/* ── Screen 4: Decision Interface ─────────────────────────────────────── */

function renderScreen4() {
  const screen = document.getElementById('screen-4');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildSurfaceBadge());
  screen.appendChild(buildStepIndicator(4, 'Decision'));

  const win = buildWedgeWindow('workbench', main => {
    const panel = document.createElement('section');
    panel.className = 'wedge-panel';

    /* Header */
    const head = document.createElement('div');
    head.className = 'wedge-workbench-head';

    const title = document.createElement('span');
    title.className = 'wedge-panel__heading wedge-panel__heading--inline';
    title.textContent = 'Approve decision';
    head.appendChild(title);

    const idEl = document.createElement('span');
    idEl.className = 'wedge-mono';
    idEl.textContent = WEDGE_SCENARIO.submission_id;
    head.appendChild(idEl);

    const chip = document.createElement('span');
    chip.className = 'wedge-badge wedge-badge--high-risk';
    chip.textContent = 'HIGH RISK';
    head.appendChild(chip);

    panel.appendChild(head);

    /* Dwell timer */
    const dwellWrap = document.createElement('div');
    dwellWrap.className = 'wedge-dwell-wrap';

    const dwell = document.createElement('div');
    dwell.className = 'wedge-dwell-timer';

    const dwellRow = document.createElement('div');
    dwellRow.className = 'wedge-dwell-row';

    const dwellLabel = document.createElement('span');
    dwellLabel.className = 'wedge-dwell-label';
    dwellLabel.textContent = 'Minimum review time: 15 seconds';
    dwellRow.appendChild(dwellLabel);

    const dwellElapsed = document.createElement('span');
    dwellElapsed.className = 'wedge-dwell-elapsed';
    dwellElapsed.textContent = 'elapsed: 0:18';
    dwellRow.appendChild(dwellElapsed);

    const dwellCheck = document.createElement('span');
    dwellCheck.className = 'wedge-dwell-check';
    dwellCheck.textContent = '✓ Elapsed';
    dwellRow.appendChild(dwellCheck);

    dwell.appendChild(dwellRow);

    const dwellNote = document.createElement('p');
    dwellNote.className = 'wedge-dwell-note';
    dwellNote.textContent =
      'Required for HIGH RISK submissions. Prevents rubber-stamp approvals.';
    dwell.appendChild(dwellNote);

    dwellWrap.appendChild(dwell);
    dwellWrap.appendChild(annBadge(1));

    panel.appendChild(dwellWrap);

    /* Reason field */
    const reasonWrap = document.createElement('div');
    reasonWrap.className = 'wedge-reason-wrap';

    const reasonLabel = document.createElement('div');
    reasonLabel.className = 'wedge-section-label';
    reasonLabel.textContent = 'Reason (required. Minimum 20 characters)';
    reasonWrap.appendChild(reasonLabel);

    const reasonBox = document.createElement('div');
    reasonBox.className = 'wedge-reason-box';
    reasonBox.textContent = WEDGE_SCENARIO.approve_reason;
    reasonWrap.appendChild(reasonBox);

    const charCount = document.createElement('div');
    charCount.className = 'wedge-reason-count';
    charCount.textContent = `${WEDGE_SCENARIO.approve_reason.length} characters`;
    reasonWrap.appendChild(charCount);

    reasonWrap.appendChild(annBadge(2));
    panel.appendChild(reasonWrap);

    /* Segregation of duties */
    const segWrap = document.createElement('div');
    segWrap.className = 'wedge-seg-wrap';

    const seg = document.createElement('div');
    seg.className = 'wedge-seg-row';

    const segItem1 = document.createElement('div');
    segItem1.className = 'wedge-seg-item';
    segItem1.innerHTML =
      '<span class="wedge-seg-key">Submitter</span>'
      + `<span class="wedge-seg-val wedge-mono">${WEDGE_SCENARIO.agent}</span>`;
    seg.appendChild(segItem1);

    const segItem2 = document.createElement('div');
    segItem2.className = 'wedge-seg-item';
    segItem2.innerHTML =
      '<span class="wedge-seg-key">Reviewer</span>'
      + `<span class="wedge-seg-val wedge-mono">${WEDGE_SCENARIO.reviewer_email}</span>`;
    seg.appendChild(segItem2);

    const segCheck = document.createElement('div');
    segCheck.className = 'wedge-seg-check';
    segCheck.textContent = '✓ Segregation confirmed';
    seg.appendChild(segCheck);

    segWrap.appendChild(seg);
    segWrap.appendChild(annBadge(3));
    panel.appendChild(segWrap);

    /* Decision buttons */
    const decWrap = document.createElement('div');
    decWrap.className = 'wedge-decision-buttons';

    [
      { label: 'APPROVE',          primary: true  },
      { label: 'REJECT',           primary: false },
      { label: 'ESCALATE',         primary: false },
      { label: 'REQUEST REVISION', primary: false },
    ].forEach(b => {
      const btn = document.createElement('div');
      btn.className = 'wedge-decision-btn';
      if (b.primary) btn.classList.add('wedge-decision-btn--primary');
      btn.textContent = b.label;
      decWrap.appendChild(btn);
    });

    panel.appendChild(decWrap);
    main.appendChild(panel);
  });

  screen.appendChild(win);

  screen.appendChild(buildAnnotationList([
    { num: 1, text: 'DAL-X blocks approval until the reviewer has spent a minimum time on the workbench. Elapsed time is recorded.' },
    { num: 2, text: 'A reason is required. It is written verbatim into the decision record and permanently linked to the authorization.' },
    { num: 3, text: 'A reviewer cannot approve their own submission. DAL-X enforces this in code, not policy.' },
  ]));

  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-3'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Issue the Authorization →';
  nextBtn.addEventListener('click', () => showScreen('screen-5'));
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

/* ── Screen 5: Token Issuance ─────────────────────────────────────────── */

function renderScreen5() {
  const screen = document.getElementById('screen-5');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildSurfaceBadge());
  screen.appendChild(buildStepIndicator(5, 'Authorization'));

  const win = buildWedgeWindow('tokens', main => {
    /* Header */
    const head = document.createElement('div');
    head.className = 'wedge-auth-head';

    const title = document.createElement('span');
    title.className = 'wedge-panel__heading wedge-panel__heading--inline';
    title.textContent = 'Authorization issued';
    head.appendChild(title);

    const check = document.createElement('span');
    check.className = 'wedge-auth-check';
    check.textContent = '✓';
    head.appendChild(check);

    main.appendChild(head);

    /* Auth card */
    const card = document.createElement('div');
    card.className = 'wedge-auth-card';

    const idRow = document.createElement('div');
    idRow.className = 'wedge-auth-id-row';

    const idLabel = document.createElement('div');
    idLabel.className = 'wedge-auth-id-label';
    idLabel.textContent = 'Authorization ID';
    idRow.appendChild(idLabel);

    const idValWrap = document.createElement('div');
    idValWrap.className = 'wedge-auth-id-wrap';
    const idVal = document.createElement('div');
    idVal.className = 'wedge-auth-id-val';
    idVal.textContent = WEDGE_SCENARIO.auth_id;
    idValWrap.appendChild(idVal);
    idValWrap.appendChild(annBadge(1));
    idRow.appendChild(idValWrap);

    card.appendChild(idRow);

    /* Auth details grid */
    const authGrid = document.createElement('div');
    authGrid.className = 'wedge-auth-grid';

    authGrid.appendChild(buildAuthKV('Status', null, () => {
      const chip = document.createElement('span');
      chip.className = 'wedge-badge wedge-badge--active';
      chip.textContent = 'ACTIVE';
      return chip;
    }));

    authGrid.appendChild(buildAuthKV('Issued', WEDGE_SCENARIO.auth_issued));

    authGrid.appendChild(buildAuthKV('Expires', null, () => {
      const wrap = document.createElement('div');
      wrap.className = 'wedge-auth-expires';

      const exp = document.createElement('div');
      exp.textContent = `${WEDGE_SCENARIO.auth_expires} (15 minutes)`;
      wrap.appendChild(exp);

      const countdownRow = document.createElement('div');
      countdownRow.className = 'wedge-countdown-row';
      const countdown = document.createElement('span');
      countdown.className = 'wedge-countdown';
      countdown.textContent = '14m 32s remaining';
      countdownRow.appendChild(countdown);
      countdownRow.appendChild(annBadge(2));
      wrap.appendChild(countdownRow);

      return wrap;
    }));

    authGrid.appendChild(buildAuthKV('Scope',
      `${WEDGE_SCENARIO.action} / ${WEDGE_SCENARIO.target}`));

    authGrid.appendChild(buildAuthKV('Single use', null, () => {
      const wrap = document.createElement('div');
      wrap.className = 'wedge-auth-single-use';
      const text = document.createElement('span');
      text.textContent = 'Yes. Consumed on first valid enforcement call.';
      wrap.appendChild(text);
      wrap.appendChild(annBadge(3));
      return wrap;
    }));

    card.appendChild(authGrid);
    main.appendChild(card);

    /* Authority chain */
    const chainWrap = document.createElement('section');
    chainWrap.className = 'wedge-panel';

    const chainHead = document.createElement('div');
    chainHead.className = 'wedge-panel__heading';
    chainHead.textContent = 'Authority chain';
    chainWrap.appendChild(chainHead);

    const chainInner = document.createElement('div');
    chainInner.className = 'wedge-chain-inner';

    const chainGrid = document.createElement('div');
    chainGrid.className = 'wedge-detail-grid';

    const truncatedReason = WEDGE_SCENARIO.approve_reason.slice(0, 80) + '...';

    [
      ['Submitted by',        WEDGE_SCENARIO.agent],
      ['Approved by',         `${WEDGE_SCENARIO.reviewer_email}. ${WEDGE_SCENARIO.reviewer_role}`],
      ['Reason',              truncatedReason],
      ['Approved at',         WEDGE_SCENARIO.approved_at],
      ['Decision record ID',  WEDGE_SCENARIO.decision_record],
    ].forEach(([k, v]) => {
      const key = document.createElement('div');
      key.className = 'wedge-detail-grid__key';
      key.textContent = k;
      chainGrid.appendChild(key);

      const val = document.createElement('div');
      val.className = 'wedge-detail-grid__val';
      val.textContent = v;
      chainGrid.appendChild(val);
    });

    chainInner.appendChild(chainGrid);
    chainInner.appendChild(annBadge(4));
    chainWrap.appendChild(chainInner);

    main.appendChild(chainWrap);
  });

  screen.appendChild(win);

  screen.appendChild(buildAnnotationList([
    { num: 1, text: 'The authorization. This UUID is what the downstream banking system must present to the enforcement gateway before the wire executes. Without it, the gate rejects.' },
    { num: 2, text: 'Time-bound. The authorization expires 15 minutes after issuance. If the downstream system does not call the enforcement gate in time, a new review is required.' },
    { num: 3, text: 'Single-use. Once the enforcement gate accepts this authorization, it is consumed. A second attempt with the same ID is rejected and evidenced.' },
    { num: 4, text: 'Provable chain. Every authorization carries a permanent, verified link to the human who approved it, the reason they gave, and the exact timestamp. This is the artifact that answers the auditor.' },
  ]));

  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-4'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Test the Enforcement Gate →';
  nextBtn.addEventListener('click', () => showScreen('screen-6'));
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

/*
 * buildAuthKV(key, value?, valueBuilder?)
 * Renders a single key/value row inside the auth card. If valueBuilder is
 * provided, it is called to construct the value element.
 */
function buildAuthKV(key, value, valueBuilder) {
  const row = document.createElement('div');
  row.className = 'wedge-auth-kv';

  const k = document.createElement('div');
  k.className = 'wedge-auth-kv__key';
  k.textContent = key;
  row.appendChild(k);

  const v = document.createElement('div');
  v.className = 'wedge-auth-kv__val';
  if (valueBuilder) {
    v.appendChild(valueBuilder());
  } else {
    v.textContent = value;
  }
  row.appendChild(v);

  return row;
}

document.addEventListener('DOMContentLoaded', () => {
  renderScreen2();
  renderScreen3();
  renderScreen4();
  renderScreen5();
});
