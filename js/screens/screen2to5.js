/* ─── Screens 2 to 5: the recorded run in the DAL-X product ──────────────────
 * Every value comes from js/recorded-run.js (PILOT-14): the real queue, the
 * real drift evidence, the real decisions and the real signed token from one
 * run of the DAL-X demo on sandbox DAL-X.
 *
 * Depends on shared helpers defined in screen1.js:
 *   buildSurfaceBadge, buildIllustrationNotice, buildStepIndicator,
 *   buildWedgeWindow, buildAnnotationList, annBadge, buildTriggerTable,
 *   RUN, DRIFTED, APPROVED, runTime, runDateTime, intentAmount, intentBlock,
 *   severityLabel, driftLabel
 */

function buildScreenNav(back, next, nextLabel) {
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';
  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen(back));
  nav.appendChild(backBtn);
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = nextLabel;
  nextBtn.addEventListener('click', () => showScreen(next));
  nav.appendChild(nextBtn);
  return nav;
}

function buildPanel(heading, subhead) {
  const panel = document.createElement('section');
  panel.className = 'wedge-panel';
  const h = document.createElement('div');
  h.className = 'wedge-panel__heading';
  h.textContent = heading;
  panel.appendChild(h);
  if (subhead) {
    const sub = document.createElement('div');
    sub.className = 'wedge-panel__subhead';
    sub.textContent = subhead;
    panel.appendChild(sub);
  }
  return panel;
}

function buildCode(label, text, extraClass) {
  const frag = document.createDocumentFragment();
  if (label) {
    const l = document.createElement('div');
    l.className = 'wedge-section-label';
    l.textContent = label;
    frag.appendChild(l);
  }
  const pre = document.createElement('pre');
  pre.className = 'wedge-code-block' + (extraClass ? ' ' + extraClass : '');
  pre.textContent = text;
  frag.appendChild(pre);
  return frag;
}

function buildGrid(rows) {
  const grid = document.createElement('div');
  grid.className = 'wedge-detail-grid';
  rows.forEach(([k, v]) => {
    const key = document.createElement('div');
    key.className = 'wedge-detail-grid__key';
    key.textContent = k;
    grid.appendChild(key);
    const val = document.createElement('div');
    val.className = 'wedge-detail-grid__val';
    val.textContent = v;
    grid.appendChild(val);
  });
  return grid;
}

function timelineEntries(item) {
  return item.timeline.map(t => ({ time: runTime(t.at), label: t.event, completed: /approved|granted|completed|released/.test(t.event) }));
}

function driftSummary(item) {
  if (!item.drift.length) return 'no drift';
  return item.drift.map(d => driftLabel(d.drift_type) + ' (' + d.severity + ')').join(', ');
}

/* ── Screen 2: Review Queue ───────────────────────────────────────────── */

function renderScreen2() {
  const screen = document.getElementById('screen-2');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildSurfaceBadge());
  screen.appendChild(buildIllustrationNotice());
  screen.appendChild(buildStepIndicator(2, 'Queue'));

  const items = [DRIFTED, ...RUN.split, APPROVED];

  const win = buildWedgeWindow('queue', main => {
    const panel = document.createElement('section');
    panel.className = 'wedge-panel';

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
    pending.textContent = items.length + ' payments in this run';
    badgeWrap.appendChild(pending);
    badgeWrap.appendChild(annBadge(1));
    head.appendChild(badgeWrap);
    panel.appendChild(head);

    const table = document.createElement('div');
    table.className = 'wedge-queue-table';
    const header = document.createElement('div');
    header.className = 'wedge-queue-row wedge-queue-row--header';
    ['Submission', 'Agent', 'Would authorize', 'Severity', 'Drift'].forEach(h => {
      const c = document.createElement('div');
      c.className = 'wedge-queue-cell';
      c.textContent = h;
      header.appendChild(c);
    });
    table.appendChild(header);

    items.forEach((item, i) => {
      const highDrift = item.drift.some(d => d.severity === 'high');
      table.appendChild(buildQueueRow({
        id: item.number,
        agent: item.agent,
        preview: intentAmount(item.intent) + ' ' + item.intent.paymentType + ' → ' + item.intent.recipient + ' · …' + String(item.intent.recipientAccountRef).slice(-4),
        severity: severityLabel(item.severity),
        severityClass: highDrift ? 'high' : 'needs',
        status: driftSummary(item),
        active: i === 0,
        annNum: i === 0 ? 2 : undefined,
        annOnAge: i === items.length - 1 ? 3 : undefined,
      }));
    });
    panel.appendChild(table);

    const strip = document.createElement('div');
    strip.className = 'wedge-detail-strip';
    strip.textContent = 'Every payment is held: execution blocked until a reviewer decides. Drift shown here was raised before any decision.';
    panel.appendChild(strip);

    main.appendChild(panel);
  });

  screen.appendChild(win);

  screen.appendChild(buildAnnotationList([
    { num: 1, text: 'The run produced ' + items.length + ' payments from the treasury agent. Each one stopped here before it could execute.' },
    { num: 2, text: DRIFTED.number + ' pays a counterparty into an account this agent has never used for it. DAL-X raised counterparty account drift before anyone decided.' },
    { num: 3, text: RUN.split.map(s => s.number).join(', ') + ' are four invoices to one counterparty, each just under the approval threshold. From the second one on, DAL-X raised split payment drift. ' + APPROVED.number + ' is an ordinary payment with no drift.' },
  ]));

  screen.appendChild(buildScreenNav('screen-1', 'screen-3', 'Open the Review Workbench →'));
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
  c3.dataset.label = 'Would authorize';
  c3.textContent = cfg.preview;
  row.appendChild(c3);

  const c4 = document.createElement('div');
  c4.className = 'wedge-queue-cell';
  c4.dataset.label = 'Severity';
  const chip = document.createElement('span');
  chip.className = 'wedge-sev-chip';
  chip.classList.add(cfg.severityClass === 'high' ? 'wedge-sev-chip--high' : 'wedge-sev-chip--needs');
  chip.textContent = cfg.severity;
  c4.appendChild(chip);
  if (cfg.annNum) c4.appendChild(annBadge(cfg.annNum));
  row.appendChild(c4);

  const c6 = document.createElement('div');
  c6.className = 'wedge-queue-cell wedge-queue-cell--status';
  c6.dataset.label = 'Drift';
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
  screen.appendChild(buildIllustrationNotice());
  screen.appendChild(buildStepIndicator(3, 'Workbench'));

  const win = buildWedgeWindow('workbench', main => {
    const head = document.createElement('div');
    head.className = 'wedge-workbench-head';
    const idEl = document.createElement('span');
    idEl.className = 'wedge-mono';
    idEl.textContent = DRIFTED.number + ' · ' + DRIFTED.reference;
    head.appendChild(idEl);
    const chip = document.createElement('span');
    chip.className = 'wedge-badge wedge-badge--high-risk';
    chip.textContent = 'DRIFT';
    head.appendChild(chip);
    main.appendChild(head);

    const content = buildPanel('Content');
    content.appendChild(buildCode('What the agent proposed', DRIFTED.summary));
    content.appendChild(buildCode('Execution intent', intentBlock(DRIFTED.intent)));
    content.appendChild(buildCode('Untrusted agent input (shown as plain text, never followed)', DRIFTED.untrustedInput || '(none)'));
    main.appendChild(content);

    const drift = buildPanel('Agent behavior drift', DRIFTED.drift.length + ' signal' + (DRIFTED.drift.length === 1 ? '' : 's') + ' raised before any decision');
    DRIFTED.drift.forEach((d, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'wedge-drift-result-wrap';
      const p = document.createElement('p');
      p.className = 'wedge-drift-result';
      p.textContent = driftLabel(d.drift_type).toUpperCase() + ' · ' + d.severity.toUpperCase();
      wrap.appendChild(p);
      if (i === 0) wrap.appendChild(annBadge(1));
      drift.appendChild(wrap);
      drift.appendChild(buildGrid([
        ['Baseline', d.baseline_value],
        ['Proposed', d.current_value],
        ['Evidence', d.evidence],
        ['Recommended', d.recommended_control_response],
      ]));
    });
    main.appendChild(drift);

    const triggers = buildPanel('Triggers', DRIFTED.rules.length + ' matched');
    triggers.appendChild(buildTriggerTable(DRIFTED.rules.map(r => ({
      name: r.name, severity: String(r.severity).toUpperCase(), controlling: r.controlling, detail: r.matched_value ? 'matched: ' + r.matched_value : '',
    }))));
    main.appendChild(triggers);

    const tl = buildPanel('Timeline');
    const tListWrap = document.createElement('div');
    tListWrap.className = 'wedge-timeline-wrap';
    tListWrap.appendChild(buildTimelineList(timelineEntries(DRIFTED)));
    tListWrap.appendChild(annBadge(2));
    tl.appendChild(tListWrap);
    main.appendChild(tl);
  });

  screen.appendChild(win);

  screen.appendChild(buildAnnotationList([
    { num: 1, text: 'Detected from behavior, not from words: the agent has paid this counterparty before, always into one account. This payment goes somewhere else. The request text was clean; the attacker had changed the vendor master.' },
    { num: 2, text: 'Every event is recorded as it happens, including the configuration the agent reported. The timeline cannot be edited.' },
  ]));

  screen.appendChild(buildScreenNav('screen-2', 'screen-4', 'See the Decision →'));
}

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

/* ── Screen 4: Decisions ──────────────────────────────────────────────── */

function renderScreen4() {
  const screen = document.getElementById('screen-4');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildSurfaceBadge());
  screen.appendChild(buildIllustrationNotice());
  screen.appendChild(buildStepIndicator(4, 'Decision'));

  const lastSplit = RUN.split[RUN.split.length - 1];
  const splitDrift = lastSplit.drift.find(d => d.drift_type === 'split_payment_drift');

  const win = buildWedgeWindow('workbench', main => {
    const panel = document.createElement('section');
    panel.className = 'wedge-panel';

    const head = document.createElement('div');
    head.className = 'wedge-workbench-head';
    const title = document.createElement('span');
    title.className = 'wedge-panel__heading wedge-panel__heading--inline';
    title.textContent = 'Decision recorded';
    head.appendChild(title);
    const idEl = document.createElement('span');
    idEl.className = 'wedge-mono';
    idEl.textContent = DRIFTED.number;
    head.appendChild(idEl);
    panel.appendChild(head);

    const reasonWrap = document.createElement('div');
    reasonWrap.className = 'wedge-reason-wrap';
    const reasonLabel = document.createElement('div');
    reasonLabel.className = 'wedge-section-label';
    reasonLabel.textContent = 'Reason (required, written verbatim into the decision record)';
    reasonWrap.appendChild(reasonLabel);
    const reasonBox = document.createElement('div');
    reasonBox.className = 'wedge-reason-box';
    reasonBox.textContent = DRIFTED.decision.reason;
    reasonWrap.appendChild(reasonBox);
    reasonWrap.appendChild(annBadge(1));
    panel.appendChild(reasonWrap);

    const segWrap = document.createElement('div');
    segWrap.className = 'wedge-seg-wrap';
    const seg = document.createElement('div');
    seg.className = 'wedge-seg-row';
    [['Submitter', DRIFTED.agent], ['Reviewer', DRIFTED.decision.reviewer || 'reviewer']].forEach(([k, v]) => {
      const item = document.createElement('div');
      item.className = 'wedge-seg-item';
      const key = document.createElement('span');
      key.className = 'wedge-seg-key';
      key.textContent = k;
      item.appendChild(key);
      const val = document.createElement('span');
      val.className = 'wedge-seg-val wedge-mono';
      val.textContent = v;
      item.appendChild(val);
      seg.appendChild(item);
    });
    const segCheck = document.createElement('div');
    segCheck.className = 'wedge-seg-check';
    segCheck.textContent = '✓ Decided at ' + runTime(DRIFTED.decision.decidedAt);
    seg.appendChild(segCheck);
    segWrap.appendChild(seg);
    panel.appendChild(segWrap);

    const decWrap = document.createElement('div');
    decWrap.className = 'wedge-decision-buttons';
    ['APPROVE', 'REJECT', 'ESCALATE', 'REQUEST REVISION'].forEach(label => {
      const btn = document.createElement('div');
      btn.className = 'wedge-decision-btn';
      if (label === DRIFTED.decision.action.toUpperCase()) btn.classList.add('wedge-decision-btn--primary');
      btn.textContent = label;
      decWrap.appendChild(btn);
    });
    panel.appendChild(decWrap);
    panel.appendChild(buildGrid([['Outcome', 'Rejected. Execution denied. No token issued.']]));
    main.appendChild(panel);

    const split = buildPanel('Split payments', RUN.split.length + ' payments to one counterparty, all rejected');
    split.appendChild(buildGrid(RUN.split.map(s => [s.number, intentAmount(s.intent) + ' → ' + s.intent.recipient + ' · ' + (s.decision ? ({ reject: 'rejected', approve: 'approved' }[s.decision.action] || s.decision.action) : 'pending')])));
    if (splitDrift) {
      const wrap = document.createElement('div');
      wrap.className = 'wedge-code-wrap';
      wrap.appendChild(buildCode(null, 'split payment drift (' + splitDrift.severity + '): ' + splitDrift.evidence));
      wrap.appendChild(annBadge(2));
      split.appendChild(wrap);
    }
    main.appendChild(split);
  });

  screen.appendChild(win);

  screen.appendChild(buildAnnotationList([
    { num: 1, text: 'A human decided, with a reason. Approving would also have required acknowledging the drift. The decision record is hash-chained and cannot be edited.' },
    { num: 2, text: 'Each split payment looked normal on its own. DAL-X compared them across submissions and named every related payment in the evidence.' },
  ]));

  screen.appendChild(buildScreenNav('screen-3', 'screen-5', 'See an Approved Payment →'));
}

/* ── Screen 5: Authorization ──────────────────────────────────────────── */

function renderScreen5() {
  const screen = document.getElementById('screen-5');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildSurfaceBadge());
  screen.appendChild(buildIllustrationNotice());
  screen.appendChild(buildStepIndicator(5, 'Authorization'));

  const auth = APPROVED.authorization;
  const ttl = auth.claims.exp - auth.claims.iat;

  const win = buildWedgeWindow('tokens', main => {
    const head = document.createElement('div');
    head.className = 'wedge-auth-head';
    const title = document.createElement('span');
    title.className = 'wedge-panel__heading wedge-panel__heading--inline';
    title.textContent = 'Authorization issued for ' + APPROVED.number;
    head.appendChild(title);
    const check = document.createElement('span');
    check.className = 'wedge-auth-check';
    check.textContent = '✓';
    head.appendChild(check);
    main.appendChild(head);

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
    idVal.textContent = auth.id;
    idValWrap.appendChild(idVal);
    idValWrap.appendChild(annBadge(1));
    idRow.appendChild(idValWrap);
    card.appendChild(idRow);

    const authGrid = document.createElement('div');
    authGrid.className = 'wedge-auth-grid';
    authGrid.appendChild(buildAuthKV('Token', 'v' + auth.version + ', Ed25519, key ' + auth.kid));
    authGrid.appendChild(buildAuthKV('Issued', runDateTime(auth.issuedAt)));
    authGrid.appendChild(buildAuthKV('Expires', null, () => {
      const wrap = document.createElement('div');
      wrap.className = 'wedge-auth-single-use';
      const t = document.createElement('span');
      t.textContent = runDateTime(auth.expiresAt) + ' (' + ttl + ' seconds)';
      wrap.appendChild(t);
      wrap.appendChild(annBadge(2));
      return wrap;
    }));
    authGrid.appendChild(buildAuthKV('Single use', null, () => {
      const wrap = document.createElement('div');
      wrap.className = 'wedge-auth-single-use';
      const t = document.createElement('span');
      t.textContent = 'Consumed by the payments hub at ' + runTime(auth.consumedAt) + '.';
      wrap.appendChild(t);
      wrap.appendChild(annBadge(3));
      return wrap;
    }));
    card.appendChild(authGrid);
    main.appendChild(card);

    const claims = buildPanel('Signed claims (decoded)', 'Signature ' + auth.signaturePrefix + '… over exactly these bytes');
    claims.appendChild(buildCode(null, JSON.stringify({ agt: auth.claims.agt, tgt: auth.claims.tgt, jti: auth.claims.jti, itg: auth.claims.itg }, null, 2)));
    main.appendChild(claims);

    const chain = buildPanel('Authority chain');
    const inner = document.createElement('div');
    inner.className = 'wedge-chain-inner';
    inner.appendChild(buildGrid([
      ['Submitted by',       APPROVED.agent],
      ['Approved by',        APPROVED.decision.reviewer || 'reviewer'],
      ['Reason',             APPROVED.decision.reason],
      ['Approved at',        runDateTime(APPROVED.decision.decidedAt)],
      ['Decision record ID', APPROVED.decision.id],
    ]));
    inner.appendChild(annBadge(4));
    chain.appendChild(inner);
    main.appendChild(chain);
  });

  screen.appendChild(win);

  screen.appendChild(buildAnnotationList([
    { num: 1, text: 'The authority. DAL-X signs it with a key only DAL-X holds; the payments hub verifies the signature itself.' },
    { num: 2, text: 'Short-lived: ' + ttl + ' seconds. A token presented later is refused and the payment needs a new approval.' },
    { num: 3, text: 'Single use. The hub records the token ID before executing; a second use is refused.' },
    { num: 4, text: 'Every authorization links to the human who approved it, the reason given, and the time. This is what answers an auditor.' },
  ]));

  screen.appendChild(buildScreenNav('screen-4', 'screen-6', 'See the Payments Hub →'));
}

function buildAuthKV(key, value, valueBuilder) {
  const row = document.createElement('div');
  row.className = 'wedge-auth-kv';
  const k = document.createElement('div');
  k.className = 'wedge-auth-kv__key';
  k.textContent = key;
  row.appendChild(k);
  const v = document.createElement('div');
  v.className = 'wedge-auth-kv__val';
  if (valueBuilder) v.appendChild(valueBuilder());
  else v.textContent = value;
  row.appendChild(v);
  return row;
}

document.addEventListener('DOMContentLoaded', () => {
  renderScreen2();
  renderScreen3();
  renderScreen4();
  renderScreen5();
});
