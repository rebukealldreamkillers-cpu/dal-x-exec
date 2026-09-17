/* ─── Screen 13: Authorization Available ────────────────────────────────── */

/*
 * Shown after Screen 11 (auto_approve / blocked) or Screen 12 (any reviewer
 * decision). When authorization is issued, generates and stores a simulated
 * UUID, issued timestamp, and expiry (issued + 15 min).
 *
 * Authorization is issued when:
 *   s3.trigger_outcome === 'auto_approve'   OR
 *   s3.reviewer_decision === 'approved'
 *
 * All other outcomes (blocked, denied, escalated, revision_requested) show
 * a "not issued" state and still advance to Screen 14.
 *
 * s3.authorization_id stores the full UUID; gate tests read it directly.
 * The display uses a masked version of the same UUID.
 */

/* ── UUID helpers ─────────────────────────────────────────────────────────── */

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/* Shows first and last segment; masks the middle three. */
function maskUUID(uuid) {
  const parts = uuid.split('-');
  return parts[0] + '-****-****-****-' + parts[4];
}

function formatTimestamp(isoString) {
  return new Date(isoString).toISOString()
    .replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

/* ── Authorization generation ─────────────────────────────────────────────── */

function isAuthorizationIssued() {
  const outcome  = getState('s3.trigger_outcome')   || '';
  const decision = getState('s3.reviewer_decision') || '';
  return outcome === 'auto_approve' || decision === 'approved';
}

/*
 * Generates the authorization record once per session path.
 * Subsequent calls are no-ops when s3.authorization_id is already set.
 */
function ensureAuthorization() {
  if (!isAuthorizationIssued()) return;
  if (getState('s3.authorization_id')) return;

  const now     = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000);

  setState('s3.authorization_id',      generateUUID());
  setState('s3.authorization_issued',  now.toISOString());
  setState('s3.authorization_expires', expires.toISOString());
  /* Submission ID: separate simulated UUID, display-only */
  sessionState.s3._submission_id = generateUUID();
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen13() {
  ensureAuthorization();

  const issued    = isAuthorizationIssued();
  const authId    = getState('s3.authorization_id');
  const issuedAt  = getState('s3.authorization_issued');
  const action    = getState('s3.submission.action') || '—';
  const target    = getState('s3.submission.target') || '—';
  const outcome   = getState('s3.trigger_outcome')   || '';
  const decision  = getState('s3.reviewer_decision') || '';

  const screen = document.getElementById('screen-13');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 3 — Configured DAL-X Simulation';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Authorization Available';
  screen.appendChild(title);

  if (issued) {
    /* ── Issued path ──────────────────────────────────────────────────── */

    /* Spec-required simulation notices */
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

    /* Authorization record card */
    const card = document.createElement('div');
    card.className = 'card';

    const cardTitle = document.createElement('div');
    cardTitle.className = 'card__title';
    cardTitle.textContent = 'Authorization record';
    card.appendChild(cardTitle);

    const subId = sessionState.s3._submission_id || authId;

    const fields = [
      ['Submission ID',    maskUUID(subId)],
      ['Authorization ID', maskUUID(authId)],
      ['Status',           'Active'],
      ['Action',           action],
      ['Target',           target],
      ['Issued time',      formatTimestamp(issuedAt)],
      ['Expiration',       '15 minutes'],
      ['Use limit',        'One'],
    ];
    fields.forEach(([key, val]) => card.appendChild(createLabelledField(key, val)));

    screen.appendChild(card);

    /* Evidence label */
    const evidenceLine = document.createElement('p');
    evidenceLine.style.cssText =
      'margin-top:var(--space-5);font-size:var(--text-sm);'
      + 'color:var(--color-text-secondary);';
    evidenceLine.appendChild(document.createTextNode('Evidence: '));
    evidenceLine.appendChild(createEvidenceLabel('demonstrated'));
    screen.appendChild(evidenceLine);

  } else {
    /* ── Not issued path ──────────────────────────────────────────────── */

    const noAuthNote = document.createElement('div');
    noAuthNote.className = 'callout callout--warning';
    noAuthNote.style.marginBottom = 'var(--space-6)';
    noAuthNote.textContent = 'No authorization was issued for this submission.';
    screen.appendChild(noAuthNote);

    /* Summary card showing why */
    const card = document.createElement('div');
    card.className = 'card';

    const cardTitle = document.createElement('div');
    cardTitle.className = 'card__title';
    cardTitle.textContent = 'Authorization record';
    card.appendChild(cardTitle);

    const statusFields = [
      ['Status',            'Not issued'],
      ['Trigger outcome',   outcome   || '—'],
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
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', goBack);
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen14 === 'function') renderScreen14();
    showScreen('screen-14');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen13);
