/* ─── Screen 13: Authorization available ────────────────────────────────── */

/*
 * Shown after Screen 11 (auto_approve / blocked) or Screen 12 (any reviewer
 * decision). When authorization is issued, generates and stores a simulated
 * UUID, issued timestamp, and expiry (issued + 15 min).
 */

/* ── UUID helpers ───────────────────────────────────────────────────────── */

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function maskUUID(uuid) {
  const parts = uuid.split('-');
  return parts[0] + '-****-****-****-' + parts[4];
}

function formatTimestamp(isoString) {
  return new Date(isoString).toISOString()
    .replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

/* ── Authorization generation ───────────────────────────────────────────── */

function isAuthorizationIssued() {
  const outcome  = getState('s3.trigger_outcome')   || '';
  const decision = getState('s3.reviewer_decision') || '';
  return outcome === 'auto_approve' || decision === 'approved';
}

function ensureAuthorization() {
  if (!isAuthorizationIssued()) return;
  if (getState('s3.authorization_id')) return;

  const now     = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000);

  setState('s3.authorization_id',      generateUUID());
  setState('s3.authorization_issued',  now.toISOString());
  setState('s3.authorization_expires', expires.toISOString());
  sessionState.s3._submission_id = generateUUID();
}

/* ── Token card builder ─────────────────────────────────────────────────── */

function buildTokenCard(fields) {
  const card = document.createElement('div');
  card.className = 'token-card';

  const header = document.createElement('div');
  header.className = 'token-card__header';
  header.textContent = 'DAL-X execution authorization';
  card.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'token-card__grid';

  fields.forEach(([key, val, opts]) => {
    const row = document.createElement('div');
    row.className = 'token-card__row';

    const keyEl = document.createElement('div');
    keyEl.className = 'token-card__key';
    keyEl.textContent = key;
    row.appendChild(keyEl);

    const valEl = document.createElement('div');
    valEl.className = 'token-card__val';
    if (opts && opts.emphasis) valEl.classList.add('token-card__val--emphasis');
    if (opts && opts.badge) {
      const badge = document.createElement('span');
      badge.className = `token-card__badge token-card__badge--${opts.badge}`;
      badge.id = opts.badgeId || '';
      badge.textContent = val;
      valEl.appendChild(badge);
    } else if (opts && opts.id) {
      valEl.id = opts.id;
      valEl.textContent = val;
    } else {
      valEl.textContent = val;
    }
    row.appendChild(valEl);

    grid.appendChild(row);
  });

  card.appendChild(grid);
  return card;
}

/* ── Countdown timer ────────────────────────────────────────────────────── */

let s13CountdownHandle = null;

function startCountdown(totalSeconds) {
  if (s13CountdownHandle) {
    clearInterval(s13CountdownHandle);
    s13CountdownHandle = null;
  }

  const timerEl = document.getElementById('token-countdown');
  const barEl   = document.getElementById('token-countdown-bar');
  const statusEl = document.getElementById('token-status-badge');
  if (!timerEl || !barEl) return;

  const startTime = Date.now();
  const durationMs = totalSeconds * 1000;

  function tick() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, durationMs - elapsed);
    const seconds = Math.ceil(remaining / 1000);
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    timerEl.textContent = `${mm}:${ss}`;

    const pct = Math.max(0, (remaining / durationMs) * 100);
    barEl.style.width = pct + '%';

    if (remaining <= 0) {
      clearInterval(s13CountdownHandle);
      s13CountdownHandle = null;
      timerEl.textContent = '00:00';
      barEl.classList.add('token-countdown__bar--expired');
      if (statusEl) {
        statusEl.textContent = 'Expired';
        statusEl.classList.remove('token-card__badge--green');
        statusEl.classList.add('token-card__badge--red');
      }
    }
  }

  tick();
  s13CountdownHandle = setInterval(tick, 1000);
}

/* ── Renderer ───────────────────────────────────────────────────────────── */

function renderScreen13() {
  ensureAuthorization();

  const issued    = isAuthorizationIssued();
  const authId    = getState('s3.authorization_id');
  const issuedAt  = getState('s3.authorization_issued');
  const action    = getState('s3.submission.action') || 'N/A';
  const target    = getState('s3.submission.target') || 'N/A';
  const outcome   = getState('s3.trigger_outcome')   || '';
  const decision  = getState('s3.reviewer_decision') || '';

  const screen = document.getElementById('screen-13');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 · Configured DAL-X simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = issued ? 'Authorization issued' : 'No authorization issued';
  screen.appendChild(title);

  if (issued) {
    /* Simulation notices */
    const noticeBox = document.createElement('div');
    noticeBox.className = 'callout callout--info';
    noticeBox.style.marginBottom = 'var(--space-6)';

    const line1 = document.createElement('p');
    line1.style.margin = '0 0 var(--space-2)';
    line1.textContent =
      'The simulation shows the authorization_id retrieved by the enterprise integration.';
    const line2 = document.createElement('p');
    line2.style.margin = '0';
    line2.textContent =
      'The simulation does not show the enterprise receiving the signed execution_token.';
    noticeBox.appendChild(line1);
    noticeBox.appendChild(line2);
    screen.appendChild(noticeBox);

    const subId = sessionState.s3._submission_id || authId;

    /* Token card */
    const card = buildTokenCard([
      ['Submission ID',     maskUUID(subId)],
      ['Authorization ID',  maskUUID(authId), { emphasis: true }],
      ['Status',            'Active', { badge: 'green', badgeId: 'token-status-badge' }],
      ['Action',            action],
      ['Target',            target],
      ['Issued',            formatTimestamp(issuedAt)],
      ['Time remaining',    '15:00', { id: 'token-countdown', emphasis: true }],
      ['Use limit',         'Single use'],
    ]);

    /* Countdown progress bar */
    const barWrap = document.createElement('div');
    barWrap.className = 'token-countdown';
    const bar = document.createElement('div');
    bar.className = 'token-countdown__bar';
    bar.id = 'token-countdown-bar';
    bar.style.width = '100%';
    barWrap.appendChild(bar);
    card.appendChild(barWrap);

    screen.appendChild(card);

    /* Start the countdown */
    startCountdown(15 * 60);

    /* Ttl note */
    const ttlNote = document.createElement('p');
    ttlNote.className = 'token-ttl-note';
    ttlNote.textContent =
      'Authorizations are time-bound and single-use. The countdown is cosmetic and illustrates the TTL concept.';
    screen.appendChild(ttlNote);

    /* Evidence label */
    const evidenceLine = document.createElement('p');
    evidenceLine.style.cssText =
      'margin-top:var(--space-5);font-size:var(--text-sm);color:var(--color-text-secondary);';
    evidenceLine.appendChild(document.createTextNode('Evidence '));
    evidenceLine.appendChild(createEvidenceLabel('demonstrated'));
    screen.appendChild(evidenceLine);

  } else {
    /* Not issued path */
    const noAuthNote = document.createElement('div');
    noAuthNote.className = 'callout callout--warning';
    noAuthNote.style.marginBottom = 'var(--space-6)';
    noAuthNote.textContent = 'No authorization was issued for this submission.';
    screen.appendChild(noAuthNote);

    const card = document.createElement('div');
    card.className = 'card';

    const cardTitle = document.createElement('div');
    cardTitle.className = 'card__title';
    cardTitle.textContent = 'Authorization record';
    card.appendChild(cardTitle);

    const statusFields = [
      ['Status',            'Not issued'],
      ['Trigger outcome',   outcome   || 'N/A'],
      ...(decision ? [['Reviewer decision', decision]] : []),
      ['Action',            action],
      ['Target',            target],
    ];
    statusFields.forEach(([key, val]) => card.appendChild(createLabelledField(key, val)));

    screen.appendChild(card);
  }

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', goBack);
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Continue';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen14 === 'function') renderScreen14();
    showScreen('screen-14');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen13);
