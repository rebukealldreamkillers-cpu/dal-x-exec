/* ─── Screen 17: Reported Boundary Map ──────────────────────────────────── */

/*
 * Derives map statements from Q1–Q6 and Q10 answers.
 * Q7, Q8, Q9 have no map rules and are not shown.
 * Q2 = 'not_applicable' → pending state row suppressed.
 * Q6 = 'no'      → "Reported bypass" row styled red (--color-rejected).
 * Q6 = 'unknown' → "Unconfirmed bypass" row styled with dashed border.
 *
 * Every statement carries the evidence label: technical participant reported.
 * The map visualizes participant answers; it does not verify the architecture.
 */

/* ── Map statement derivation ─────────────────────────────────────────────── */

function computeMapStatements() {
  function q(k) { return getState('s4.' + k) || null; }

  const statements = [];

  /* Q1: Submission point */
  const q1 = q('q1');
  if (q1 === 'yes')     statements.push({ point: 'Submission point',  text: 'Agent submission path',              style: 'normal'  });
  else if (q1 === 'no') statements.push({ point: 'Submission point',  text: 'Submission point missing',           style: 'missing' });
  else if (q1)          statements.push({ point: 'Submission point',  text: 'Submission point unknown',           style: 'unknown' });

  /* Q2: Pending execution (not_applicable suppressed) */
  const q2 = q('q2');
  if      (q2 === 'yes')     statements.push({ point: 'Pending execution', text: 'Stored pending execution',          style: 'normal'  });
  else if (q2 === 'no')      statements.push({ point: 'Pending execution', text: 'Pending execution not available',   style: 'missing' });
  else if (q2 === 'unknown') statements.push({ point: 'Pending execution', text: 'Pending execution unknown',         style: 'unknown' });
  /* q2 === 'not_applicable' → do not show pending state */

  /* Q3: Decision handling */
  const q3 = q('q3');
  if      (q3 === 'webhook')  statements.push({ point: 'Decision handling', text: 'Webhook decision path',             style: 'normal'  });
  else if (q3 === 'polling')  statements.push({ point: 'Decision handling', text: 'Polling path',                      style: 'normal'  });
  else if (q3 === 'either')   statements.push({ point: 'Decision handling', text: 'Webhook and polling both available', style: 'normal'  });
  else if (q3 === 'neither')  statements.push({ point: 'Decision handling', text: 'Neither webhook nor polling available', style: 'missing' });
  else if (q3 === 'unknown')  statements.push({ point: 'Decision handling', text: 'Decision handling unknown',          style: 'unknown' });

  /* Q4: Enforcement point */
  const q4 = q('q4');
  if      (q4 === 'yes') statements.push({ point: 'Enforcement point',  text: 'Enforcement check before downstream system', style: 'normal'  });
  else if (q4 === 'no')  statements.push({ point: 'Enforcement point',  text: 'Enforcement point missing',                  style: 'missing' });
  else if (q4)           statements.push({ point: 'Enforcement point',  text: 'Enforcement point unknown',                  style: 'unknown' });

  /* Q5: Blocking behavior */
  const q5 = q('q5');
  if      (q5 === 'yes') statements.push({ point: 'Blocking behavior',  text: 'Fail closed',                                style: 'normal'  });
  else if (q5 === 'no')  statements.push({ point: 'Blocking behavior',  text: 'Execution may continue after rejection or error', style: 'missing' });
  else if (q5)           statements.push({ point: 'Blocking behavior',  text: 'Blocking behavior unknown',                  style: 'unknown' });

  /* Q6: Bypass prevention */
  const q6 = q('q6');
  if      (q6 === 'yes')     statements.push({ point: 'Bypass prevention', text: 'No alternate path',          style: 'normal'           });
  else if (q6 === 'no')      statements.push({ point: 'Bypass prevention', text: 'Reported bypass',            style: 'bypass-confirmed' });
  else if (q6 === 'unknown') statements.push({ point: 'Bypass prevention', text: 'Unconfirmed bypass',         style: 'bypass-unconfirmed' });

  /* Q10: Downstream result */
  const q10 = q('q10');
  if      (q10 === 'yes') statements.push({ point: 'Downstream result', text: 'Downstream result connected to enterprise record', style: 'normal'  });
  else if (q10 === 'no')  statements.push({ point: 'Downstream result', text: 'Downstream result recording missing',               style: 'missing' });
  else if (q10)           statements.push({ point: 'Downstream result', text: 'Downstream result recording unknown',               style: 'unknown' });

  return statements;
}

/* ── Row style helpers ────────────────────────────────────────────────────── */

function applyStatementRowStyle(tr, style) {
  switch (style) {
    case 'missing':
      tr.style.color = 'var(--color-text-secondary)';
      break;
    case 'unknown':
      tr.style.color = 'var(--color-text-secondary)';
      tr.style.fontStyle = 'italic';
      break;
    case 'bypass-confirmed':
      tr.style.color  = 'var(--color-rejected)';
      tr.style.fontWeight = '500';
      break;
    case 'bypass-unconfirmed':
      tr.style.color      = 'var(--color-warning, #b45309)';
      tr.style.borderBottom = '1px dashed var(--color-border)';
      break;
    default:
      break;
  }
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen17() {
  const statements = computeMapStatements();

  const screen = document.getElementById('screen-17');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 4 · Technical Review';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Reported Boundary Map';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent = 'The map uses only the two documented DAL-X call sites.';
  screen.appendChild(subtitle);

  /* Map card */
  const card = document.createElement('div');
  card.className = 'card';

  if (!statements.length) {
    /* No answers recorded yet */
    const empty = document.createElement('p');
    empty.style.cssText =
      'font-size:var(--text-sm);color:var(--color-text-secondary);';
    empty.textContent =
      'No technical answers recorded. Answer the questions on Screen 16 to generate the boundary map.';
    card.appendChild(empty);
  } else {
    const table = document.createElement('table');
    table.className = 'data-table';

    /* Header */
    const thead = document.createElement('thead');
    const hrow  = document.createElement('tr');
    ['Integration path', 'Map statement', 'Evidence'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    /* Body */
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
    card.appendChild(table);
  }

  screen.appendChild(card);

  /* Disclaimer callout */
  const disclaimer = document.createElement('div');
  disclaimer.className = 'callout callout--info';
  disclaimer.style.marginTop = 'var(--space-5)';
  disclaimer.textContent =
    'The map visualizes the participant\'s answers. It does not verify the architecture.';
  screen.appendChild(disclaimer);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-16'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen18 === 'function') renderScreen18();
    showScreen('screen-18');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen17);
