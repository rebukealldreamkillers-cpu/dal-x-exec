/* ─── Screen 17: Reported integration boundary ──────────────────────────── */

/*
 * Derives map statements from Q1 through Q6 plus Q10 and renders an SVG
 * diagram of the enterprise's reported integration path.
 *
 * Every statement carries the evidence label: technical participant reported.
 * The map reflects participant answers; it does not verify the architecture.
 */

/* ── Map statement derivation (preserved) ────────────────────────────────── */

function computeMapStatements() {
  function q(k) { return getState('s4.' + k) || null; }

  const statements = [];

  const q1 = q('q1');
  if (q1 === 'yes')     statements.push({ point: 'Submission point',  text: 'Agent submission path',              style: 'normal'  });
  else if (q1 === 'no') statements.push({ point: 'Submission point',  text: 'Submission point missing',           style: 'missing' });
  else if (q1)          statements.push({ point: 'Submission point',  text: 'Submission point unknown',           style: 'unknown' });

  const q2 = q('q2');
  if      (q2 === 'yes')     statements.push({ point: 'Pending execution', text: 'Stored pending execution',          style: 'normal'  });
  else if (q2 === 'no')      statements.push({ point: 'Pending execution', text: 'Pending execution not available',   style: 'missing' });
  else if (q2 === 'unknown') statements.push({ point: 'Pending execution', text: 'Pending execution unknown',         style: 'unknown' });

  const q3 = q('q3');
  if      (q3 === 'webhook')  statements.push({ point: 'Decision handling', text: 'Webhook decision path',             style: 'normal'  });
  else if (q3 === 'polling')  statements.push({ point: 'Decision handling', text: 'Polling path',                      style: 'normal'  });
  else if (q3 === 'either')   statements.push({ point: 'Decision handling', text: 'Webhook and polling both available', style: 'normal'  });
  else if (q3 === 'neither')  statements.push({ point: 'Decision handling', text: 'Neither webhook nor polling available', style: 'missing' });
  else if (q3 === 'unknown')  statements.push({ point: 'Decision handling', text: 'Decision handling unknown',          style: 'unknown' });

  const q4 = q('q4');
  if      (q4 === 'yes') statements.push({ point: 'Enforcement point',  text: 'Enforcement check before downstream system', style: 'normal'  });
  else if (q4 === 'no')  statements.push({ point: 'Enforcement point',  text: 'Enforcement point missing',                  style: 'missing' });
  else if (q4)           statements.push({ point: 'Enforcement point',  text: 'Enforcement point unknown',                  style: 'unknown' });

  const q5 = q('q5');
  if      (q5 === 'yes') statements.push({ point: 'Blocking behavior',  text: 'Fail closed',                                style: 'normal'  });
  else if (q5 === 'no')  statements.push({ point: 'Blocking behavior',  text: 'Execution may continue after rejection or error', style: 'missing' });
  else if (q5)           statements.push({ point: 'Blocking behavior',  text: 'Blocking behavior unknown',                  style: 'unknown' });

  const q6 = q('q6');
  if      (q6 === 'yes')     statements.push({ point: 'Bypass prevention', text: 'No alternate path',          style: 'normal'           });
  else if (q6 === 'no')      statements.push({ point: 'Bypass prevention', text: 'Reported bypass',            style: 'bypass-confirmed' });
  else if (q6 === 'unknown') statements.push({ point: 'Bypass prevention', text: 'Unconfirmed bypass',         style: 'bypass-unconfirmed' });

  const q10 = q('q10');
  if      (q10 === 'yes') statements.push({ point: 'Downstream result', text: 'Downstream result connected to enterprise record', style: 'normal'  });
  else if (q10 === 'no')  statements.push({ point: 'Downstream result', text: 'Downstream result recording missing',               style: 'missing' });
  else if (q10)           statements.push({ point: 'Downstream result', text: 'Downstream result recording unknown',               style: 'unknown' });

  return statements;
}

/* ── Row style helpers (evidence table below diagram) ───────────────────── */

function applyStatementRowStyle(tr, style) {
  switch (style) {
    case 'missing':
      tr.style.color = 'var(--text-secondary)';
      break;
    case 'unknown':
      tr.style.color = 'var(--text-secondary)';
      tr.style.fontStyle = 'italic';
      break;
    case 'bypass-confirmed':
      tr.style.color  = 'var(--reject-red)';
      tr.style.fontWeight = '500';
      break;
    case 'bypass-unconfirmed':
      tr.style.color      = 'var(--agent-amber)';
      tr.style.borderBottom = '1px dashed var(--glass-border)';
      break;
    default:
      break;
  }
}

/* ── SVG boundary map ────────────────────────────────────────────────────── */

/*
 * buildBoundaryMapSVG(answers)
 * Builds an SVG diagram with seven main nodes and an optional pending
 * state branch. Uses viewBox for responsive scaling.
 */
function buildBoundaryMapSVG(answers) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');

  /* viewBox chosen to fit nodes with generous padding */
  const W = 1100, H = 360;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('boundary-map-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Reported integration boundary diagram');

  /* Arrowhead marker */
  const defs = document.createElementNS(SVG_NS, 'defs');
  defs.innerHTML =
      '<marker id="bm-arrow" viewBox="0 0 10 10" refX="9" refY="5" '
    + 'markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
    + '<path d="M0,0 L10,5 L0,10 z" fill="currentColor"/>'
    + '</marker>'
    + '<marker id="bm-arrow-red" viewBox="0 0 10 10" refX="9" refY="5" '
    + 'markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
    + '<path d="M0,0 L10,5 L0,10 z" fill="#EF4444"/>'
    + '</marker>'
    + '<marker id="bm-arrow-amber" viewBox="0 0 10 10" refX="9" refY="5" '
    + 'markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
    + '<path d="M0,0 L10,5 L0,10 z" fill="#F59E0B"/>'
    + '</marker>'
    + '<marker id="bm-arrow-green" viewBox="0 0 10 10" refX="9" refY="5" '
    + 'markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
    + '<path d="M0,0 L10,5 L0,10 z" fill="#10B981"/>'
    + '</marker>';
  svg.appendChild(defs);

  /* Node geometry */
  const nodeW = 140;
  const nodeH = 56;
  const rowY  = 140;
  const gap   = 20;
  const startX = 20;

  const nodes = [
    { id: 'agent',        label: 'AI Agent',           x: startX + 0 * (nodeW + gap) },
    { id: 'submission',   label: 'Submission Point',   x: startX + 1 * (nodeW + gap) },
    { id: 'dalx',         label: 'DAL-X',              x: startX + 2 * (nodeW + gap) },
    { id: 'decision',     label: 'Decision Handler',   x: startX + 3 * (nodeW + gap) },
    { id: 'enforcement',  label: 'Enforcement Gate',   x: startX + 4 * (nodeW + gap) },
    { id: 'downstream',   label: 'Downstream System',  x: startX + 5 * (nodeW + gap) },
    { id: 'record',       label: 'Enterprise Record',  x: startX + 6 * (nodeW + gap) },
  ];

  /* Helpers */
  function drawRect(x, y, w, h, cls, extraCls) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', w); rect.setAttribute('height', h);
    rect.setAttribute('rx', 10); rect.setAttribute('ry', 10);
    rect.setAttribute('class', 'boundary-map__node ' + cls + (extraCls ? ' ' + extraCls : ''));
    return rect;
  }
  function drawText(x, y, text, cls) {
    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('class', cls || 'boundary-map__node-label');
    t.textContent = text;
    return t;
  }
  function drawLine(x1, y1, x2, y2, cls, arrow, dashed) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('class', 'boundary-map__link ' + (cls || ''));
    if (arrow) line.setAttribute('marker-end', `url(#${arrow})`);
    if (dashed) line.setAttribute('stroke-dasharray', '6 5');
    return line;
  }
  function drawPath(d, cls, arrow, dashed) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', 'boundary-map__link ' + (cls || ''));
    p.setAttribute('fill', 'none');
    if (arrow) p.setAttribute('marker-end', `url(#${arrow})`);
    if (dashed) p.setAttribute('stroke-dasharray', '6 5');
    return p;
  }
  function drawXMark(cx, cy, cls) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'boundary-map__x ' + (cls || ''));
    const r = 12;
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', '#EF4444');
    g.appendChild(circle);
    const cross = document.createElementNS(SVG_NS, 'path');
    cross.setAttribute('d', `M${cx - 5},${cy - 5} L${cx + 5},${cy + 5} M${cx + 5},${cy - 5} L${cx - 5},${cy + 5}`);
    cross.setAttribute('stroke', '#fff');
    cross.setAttribute('stroke-width', '2.5');
    cross.setAttribute('stroke-linecap', 'round');
    g.appendChild(cross);
    return g;
  }
  function drawWarn(cx, cy) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'boundary-map__warn');
    const tri = document.createElementNS(SVG_NS, 'path');
    tri.setAttribute('d', `M${cx},${cy - 12} L${cx + 12},${cy + 8} L${cx - 12},${cy + 8} z`);
    tri.setAttribute('fill', '#F59E0B');
    tri.setAttribute('stroke', 'rgba(0,0,0,0.35)');
    tri.setAttribute('stroke-width', '0.6');
    g.appendChild(tri);
    const ex = document.createElementNS(SVG_NS, 'text');
    ex.setAttribute('x', cx); ex.setAttribute('y', cy + 3);
    ex.setAttribute('text-anchor', 'middle');
    ex.setAttribute('font-size', '13');
    ex.setAttribute('font-weight', '700');
    ex.setAttribute('fill', '#3a2b06');
    ex.textContent = '!';
    g.appendChild(ex);
    return g;
  }
  function nodeCenterX(node) { return node.x + nodeW / 2; }
  function nodeRight(node)   { return node.x + nodeW; }

  /* Read answers */
  const q1 = answers.q1, q2 = answers.q2, q3 = answers.q3;
  const q4 = answers.q4, q5 = answers.q5, q6 = answers.q6, q10 = answers.q10;

  /* Draw nodes */
  const nodeById = {};
  nodes.forEach(node => {
    let cls = 'boundary-map__node--neutral';

    if (node.id === 'submission') {
      if (q1 === 'yes')     cls = 'boundary-map__node--good';
      else if (q1 === 'no') cls = 'boundary-map__node--bad';
      else if (q1)          cls = 'boundary-map__node--unknown';
    }
    if (node.id === 'decision') {
      if (q3 === 'neither')      cls = 'boundary-map__node--bad';
      else if (q3 === 'unknown') cls = 'boundary-map__node--unknown';
      else if (q3)               cls = 'boundary-map__node--good';
    }
    if (node.id === 'enforcement') {
      if (q4 === 'yes')     cls = 'boundary-map__node--good';
      else if (q4 === 'no') cls = 'boundary-map__node--bad';
      else if (q4)          cls = 'boundary-map__node--unknown';
    }
    if (node.id === 'record') {
      if (q10 === 'no') cls = 'boundary-map__node--warn';
    }
    if (node.id === 'dalx') {
      cls = 'boundary-map__node--dalx';
    }

    const rect = drawRect(node.x, rowY, nodeW, nodeH, cls);
    svg.appendChild(rect);

    const t = drawText(node.x + nodeW / 2, rowY + nodeH / 2, node.label);
    svg.appendChild(t);

    nodeById[node.id] = { ...node, cy: rowY + nodeH / 2 };
  });

  /* Draw connectors */
  const links = [
    { from: 'agent',       to: 'submission',  keyFor: 'q1' },
    { from: 'submission',  to: 'dalx',        keyFor: 'q1' },
    { from: 'dalx',        to: 'decision',    keyFor: 'q3' },
    { from: 'decision',    to: 'enforcement', keyFor: 'q4' },
    { from: 'enforcement', to: 'downstream',  keyFor: 'q4' },
    { from: 'downstream',  to: 'record',      keyFor: 'q10' },
  ];

  links.forEach(link => {
    const a = nodeById[link.from];
    const b = nodeById[link.to];
    let cls = 'boundary-map__link--neutral';
    let arrow = 'bm-arrow';

    if (link.keyFor === 'q1') {
      if (q1 === 'yes')     { cls = 'boundary-map__link--good'; arrow = 'bm-arrow-green'; }
      else if (q1 === 'no') { cls = 'boundary-map__link--bad';  arrow = 'bm-arrow-red'; }
    }
    if (link.keyFor === 'q3') {
      if (q3 === 'neither')      { cls = 'boundary-map__link--bad';  arrow = 'bm-arrow-red'; }
      else if (q3 === 'unknown') { cls = 'boundary-map__link--unknown'; }
      else if (q3)               { cls = 'boundary-map__link--good'; arrow = 'bm-arrow-green'; }
    }
    if (link.keyFor === 'q4') {
      if (q4 === 'yes')     { cls = 'boundary-map__link--good'; arrow = 'bm-arrow-green'; }
      else if (q4 === 'no') { cls = 'boundary-map__link--bad';  arrow = 'bm-arrow-red'; }
    }
    if (link.keyFor === 'q10') {
      if (q10 === 'yes')     { cls = 'boundary-map__link--good'; arrow = 'bm-arrow-green'; }
      else if (q10 === 'no') { cls = 'boundary-map__link--warn'; arrow = 'bm-arrow-amber'; }
    }

    svg.appendChild(drawLine(nodeRight(a), a.cy, b.x, b.cy, cls, arrow));
  });

  /* Q1 = no → red X on submission link and node */
  if (q1 === 'no') {
    const submission = nodeById.submission;
    svg.appendChild(drawXMark(submission.x + nodeW / 2, rowY + nodeH / 2 - 30));
    const missing = drawText(submission.x + nodeW / 2, rowY + nodeH + 22, 'Missing', 'boundary-map__caption boundary-map__caption--bad');
    svg.appendChild(missing);
  }

  /* Q3 icons on decision handler */
  const decision = nodeById.decision;
  if (q3 === 'webhook' || q3 === 'either') {
    const t = drawText(decision.x + nodeW / 2 - (q3 === 'either' ? 24 : 0), rowY + nodeH + 22, 'Webhook', 'boundary-map__caption boundary-map__caption--good');
    svg.appendChild(t);
  }
  if (q3 === 'polling' || q3 === 'either') {
    const t = drawText(decision.x + nodeW / 2 + (q3 === 'either' ? 30 : 0), rowY + nodeH + 22, 'Polling', 'boundary-map__caption boundary-map__caption--good');
    svg.appendChild(t);
  }
  if (q3 === 'neither') {
    svg.appendChild(drawXMark(decision.x + nodeW / 2, rowY + nodeH / 2 - 30));
    svg.appendChild(drawText(decision.x + nodeW / 2, rowY + nodeH + 22, 'No decision channel', 'boundary-map__caption boundary-map__caption--bad'));
  }

  /* Q2 pending state branch */
  if (q2 && q2 !== 'not_applicable') {
    const dalx     = nodeById.dalx;
    const decisionN = nodeById.decision;
    const midX = (nodeRight(dalx) + decisionN.x) / 2;
    const branchY = rowY + nodeH + 60;
    const branchW = 150;
    const branchH = 44;
    const branchX = midX - branchW / 2;

    let cls = 'boundary-map__node--neutral';
    if (q2 === 'yes')     cls = 'boundary-map__node--good';
    else if (q2 === 'no') cls = 'boundary-map__node--bad';
    else if (q2 === 'unknown') cls = 'boundary-map__node--unknown';

    svg.appendChild(drawRect(branchX, branchY, branchW, branchH, cls));
    svg.appendChild(drawText(midX, branchY + branchH / 2, 'Pending state store'));

    let branchLinkCls = 'boundary-map__link--neutral';
    let branchArrow   = 'bm-arrow';
    if (q2 === 'yes')     { branchLinkCls = 'boundary-map__link--good'; branchArrow = 'bm-arrow-green'; }
    else if (q2 === 'no') { branchLinkCls = 'boundary-map__link--bad';  branchArrow = 'bm-arrow-red'; }

    svg.appendChild(drawPath(
      `M${midX},${rowY + nodeH} Q${midX},${branchY - 10} ${midX},${branchY}`,
      branchLinkCls, branchArrow
    ));
  }

  /* Q4 = no → red X on enforcement gate */
  if (q4 === 'no') {
    const enforcement = nodeById.enforcement;
    svg.appendChild(drawXMark(enforcement.x + nodeW / 2, rowY + nodeH / 2 - 30));
  }

  /* Q5 caption on enforcement */
  if (q4 === 'yes' && q5) {
    const enforcement = nodeById.enforcement;
    if (q5 === 'yes') {
      svg.appendChild(drawText(enforcement.x + nodeW / 2, rowY + nodeH + 22, 'Fail closed', 'boundary-map__caption boundary-map__caption--good'));
    } else if (q5 === 'no') {
      svg.appendChild(drawText(enforcement.x + nodeW / 2, rowY + nodeH + 22, 'May continue', 'boundary-map__caption boundary-map__caption--warn'));
    }
  }

  /* Q6 bypass line around enforcement */
  if (q6 === 'no' || q6 === 'unknown') {
    const decisionN   = nodeById.decision;
    const downstream  = nodeById.downstream;
    const bypassCls   = q6 === 'no' ? 'boundary-map__link--bad' : 'boundary-map__link--warn';
    const bypassArrow = q6 === 'no' ? 'bm-arrow-red' : 'bm-arrow-amber';
    const startBX = nodeRight(decisionN);
    const endBX   = downstream.x;
    const startY  = decisionN.cy;
    const arcTop  = rowY - 55;

    const bypass = drawPath(
      `M${startBX},${startY} Q${(startBX + endBX) / 2},${arcTop} ${endBX},${startY}`,
      bypassCls, bypassArrow, true
    );
    svg.appendChild(bypass);

    const captionCls = q6 === 'no' ? 'boundary-map__caption--bad' : 'boundary-map__caption--warn';
    svg.appendChild(drawText((startBX + endBX) / 2, arcTop - 8, q6 === 'no' ? 'Reported bypass' : 'Unconfirmed bypass',
      'boundary-map__caption ' + captionCls));
  }

  /* Q10 = no → warning on record */
  if (q10 === 'no') {
    const record = nodeById.record;
    svg.appendChild(drawWarn(record.x + nodeW / 2, rowY - 12));
    svg.appendChild(drawText(record.x + nodeW / 2, rowY + nodeH + 22, 'Not recorded', 'boundary-map__caption boundary-map__caption--warn'));
  }

  return svg;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen17() {
  const statements = computeMapStatements();

  const screen = document.getElementById('screen-17');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 4 · Technical review';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Reported integration boundary';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent = 'The diagram uses the answers you gave on the previous screen.';
  screen.appendChild(subtitle);

  /* SVG diagram card */
  const diagramCard = document.createElement('div');
  diagramCard.className = 'card boundary-map-card';

  const answers = {
    q1:  getState('s4.q1'),
    q2:  getState('s4.q2'),
    q3:  getState('s4.q3'),
    q4:  getState('s4.q4'),
    q5:  getState('s4.q5'),
    q6:  getState('s4.q6'),
    q10: getState('s4.q10'),
  };

  const hasAny = Object.values(answers).some(v => v != null && v !== '');

  if (!hasAny) {
    const empty = document.createElement('p');
    empty.className = 'boundary-map-empty';
    empty.textContent = 'No technical answers recorded. Return to Screen 16 to answer the questions.';
    diagramCard.appendChild(empty);
  } else {
    const svgWrap = document.createElement('div');
    svgWrap.className = 'boundary-map-svg-wrap';
    svgWrap.appendChild(buildBoundaryMapSVG(answers));
    diagramCard.appendChild(svgWrap);
  }

  screen.appendChild(diagramCard);

  /* Muted note below diagram */
  const note = document.createElement('p');
  note.className = 'boundary-map-note';
  note.textContent = 'This diagram reflects the answers you provided. It does not verify the actual architecture.';
  screen.appendChild(note);

  /* Evidence table */
  if (statements.length > 0) {
    const evCard = document.createElement('div');
    evCard.className = 'card';

    const evTitle = document.createElement('div');
    evTitle.className = 'card__title';
    evTitle.textContent = 'Reported statements';
    evCard.appendChild(evTitle);

    const table = document.createElement('table');
    table.className = 'data-table';

    const thead = document.createElement('thead');
    const hrow  = document.createElement('tr');
    ['Integration path', 'Map statement', 'Evidence'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    statements.forEach(stmt => {
      const tr = document.createElement('tr');
      applyStatementRowStyle(tr, stmt.style);

      const tdPoint = document.createElement('td');
      tdPoint.textContent = stmt.point;
      tr.appendChild(tdPoint);

      const tdText = document.createElement('td');
      tdText.textContent = stmt.text;
      tr.appendChild(tdText);

      const tdEv = document.createElement('td');
      tdEv.appendChild(createEvidenceLabel('technical'));
      tr.appendChild(tdEv);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    evCard.appendChild(table);
    screen.appendChild(evCard);
  }

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-16'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Continue to technical result';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen18 === 'function') renderScreen18();
    showScreen('screen-18');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen17);
