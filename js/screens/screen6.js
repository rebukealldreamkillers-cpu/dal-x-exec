/* ─── Screen 6: Enforcement Gateway + Governance Timeline ─────────────────
 * Final view of the DAL-X-Wedge product handling the $650K wire. Shows the
 * enforcement gateway call from the downstream banking system alongside the
 * complete governance timeline for the submission.
 *
 * Depends on shared helpers from screen1.js and screen2to5.js.
 */

function renderScreen6() {
  const screen = document.getElementById('screen-6');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildSurfaceBadge());
  screen.appendChild(buildStepIndicator(6, 'Enforcement'));

  const win = buildWedgeWindow('timeline', main => {
    const grid = document.createElement('div');
    grid.className = 'wedge-enforcement-grid';

    /* ── Panel A: Enforcement gateway call ───────────────────────── */
    const gatePanel = document.createElement('section');
    gatePanel.className = 'wedge-panel';

    const gHead = document.createElement('div');
    gHead.className = 'wedge-panel__heading';
    gHead.textContent = 'Enforcement gateway';
    gatePanel.appendChild(gHead);

    const endpoint = document.createElement('div');
    endpoint.className = 'wedge-endpoint';
    endpoint.textContent = 'POST /v1/enforcement/execute';
    gatePanel.appendChild(endpoint);

    /* Request block */
    const reqLabel = document.createElement('div');
    reqLabel.className = 'wedge-section-label';
    reqLabel.textContent = 'Request';
    gatePanel.appendChild(reqLabel);

    const reqWrap = document.createElement('div');
    reqWrap.className = 'wedge-code-wrap';
    const reqBlock = document.createElement('pre');
    reqBlock.className = 'wedge-code-block';
    reqBlock.textContent =
      `agent_key:            ${WEDGE_SCENARIO.agent}\n`
      + `execution_request_id: ${WEDGE_SCENARIO.submission_id}\n`
      + `execution_target:     ${WEDGE_SCENARIO.target}\n`
      + `attempted_action:     ${WEDGE_SCENARIO.action}\n`
      + `authorization_id:     ${WEDGE_SCENARIO.auth_id}`;
    reqWrap.appendChild(reqBlock);
    reqWrap.appendChild(annBadge(1));
    gatePanel.appendChild(reqWrap);

    /* Response block */
    const respLabel = document.createElement('div');
    respLabel.className = 'wedge-section-label';
    respLabel.textContent = 'Response';
    gatePanel.appendChild(respLabel);

    const respBlock = document.createElement('pre');
    respBlock.className = 'wedge-code-block wedge-code-block--accepted';
    respBlock.appendChild(makeResponseSpan('result:              ', 'ACCEPTED\n'));
    respBlock.appendChild(makeResponseKV('execution_allowed:   ', 'true', 2));
    respBlock.appendChild(document.createTextNode('reason:              DAL-X authority validated. Downstream execution accepted.\n'));
    respBlock.appendChild(makeResponseKV('receipt_id:          ', WEDGE_SCENARIO.receipt_id, 3));
    respBlock.appendChild(document.createTextNode('drift_event_created: false'));
    gatePanel.appendChild(respBlock);

    /* Status banner */
    const banner = document.createElement('div');
    banner.className = 'wedge-status-banner wedge-status-banner--accepted';
    const bCheck = document.createElement('span');
    bCheck.className = 'wedge-banner-check';
    bCheck.textContent = '✓';
    banner.appendChild(bCheck);
    const bText = document.createElement('span');
    bText.textContent = 'EXECUTION PROCEEDS';
    banner.appendChild(bText);
    gatePanel.appendChild(banner);

    grid.appendChild(gatePanel);

    /* ── Panel B: Governance timeline ────────────────────────────── */
    const tlPanel = document.createElement('section');
    tlPanel.className = 'wedge-panel';

    const tlHead = document.createElement('div');
    tlHead.className = 'wedge-panel__heading';
    tlHead.textContent = 'Governance timeline';
    tlPanel.appendChild(tlHead);

    const tlSub = document.createElement('div');
    tlSub.className = 'wedge-panel__subhead wedge-mono';
    tlSub.textContent = WEDGE_SCENARIO.submission_id;
    tlPanel.appendChild(tlSub);

    const tlWrap = document.createElement('div');
    tlWrap.className = 'wedge-timeline-wrap';

    const list = buildTimelineList([
      { time: '14:23:41', label: 'submission_created' },
      { time: '14:23:41', label: 'trigger_evaluation_completed', detail: '18 rules evaluated, 3 matched, controlling: HIGH_RISK' },
      { time: '14:23:42', label: 'review_queue_entered' },
      { time: '14:25:33', label: 'review_opened', detail: 's.chen@meridian.com' },
      { time: '14:25:51', label: 'decision_approved',        detail: 'Wire transfer verified against Acme Corp...', completed: true },
      { time: '14:25:51', label: 'authorization_issued',     detail: `${WEDGE_SCENARIO.auth_id}, expires 14:40:51`, completed: true },
      { time: '14:26:03', label: 'enforcement_gateway_accepted', detail: WEDGE_SCENARIO.receipt_id, completed: true },
      { time: '14:26:04', label: 'execution_completed', completed: true },
    ]);
    tlWrap.appendChild(list);
    tlWrap.appendChild(annBadge(4));
    tlPanel.appendChild(tlWrap);

    grid.appendChild(tlPanel);

    main.appendChild(grid);
  });

  screen.appendChild(win);

  screen.appendChild(buildAnnotationList([
    { num: 1, text: 'The downstream banking system called DAL-X before processing the wire. The agent cannot bypass this -- if the call is absent, execution is blocked.' },
    { num: 2, text: 'This is the only condition that matters. False means the wire is blocked, regardless of what the agent, the reviewer, or anyone else wants.' },
    { num: 3, text: 'DAL-X writes a receipt for every enforcement call, accepted or rejected.' },
    { num: 4, text: 'From agent output to execution receipt, every step is timestamped and permanent. This is the complete record an auditor would examine.' },
  ]));

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-5'));
  nav.appendChild(backBtn);

  const ctaGroup = document.createElement('div');
  ctaGroup.className = 'wedge-cta-group';

  const replayBtn = document.createElement('button');
  replayBtn.className = 'btn btn--ghost';
  replayBtn.textContent = 'Replay the demonstration →';
  replayBtn.addEventListener('click', () => {
    resetSurface1();
    showScreen('screen-1');
  });
  ctaGroup.appendChild(replayBtn);

  const assessBtn = document.createElement('button');
  assessBtn.className = 'btn btn--primary';
  assessBtn.textContent = 'Request a Guided Assessment →';
  assessBtn.addEventListener('click', () => showScreen('screen-7'));
  ctaGroup.appendChild(assessBtn);

  nav.appendChild(ctaGroup);
  screen.appendChild(nav);
}

/*
 * makeResponseSpan(prefix, text)
 * Plain response line with no annotation badge.
 */
function makeResponseSpan(prefix, text) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createTextNode(prefix + text));
  return frag;
}

/*
 * makeResponseKV(prefix, value, annNum)
 * Response line with an annotation badge attached to the value.
 */
function makeResponseKV(prefix, value, annNum) {
  const line = document.createElement('span');
  line.className = 'wedge-response-line';
  line.appendChild(document.createTextNode(prefix));

  const valEl = document.createElement('span');
  valEl.className = 'wedge-response-val';
  valEl.textContent = value;
  line.appendChild(valEl);

  line.appendChild(annBadge(annNum));
  line.appendChild(document.createTextNode('\n'));
  return line;
}

document.addEventListener('DOMContentLoaded', renderScreen6);
