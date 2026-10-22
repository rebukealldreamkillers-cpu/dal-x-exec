/* ─── Screen 6: Payments hub + governance timeline ───────────────────────────
 * The payments hub is the bank's downstream system. It verifies the DAL-X
 * token itself before it executes. Panel A shows what it did in the recorded
 * run and lets the visitor call it live without authority (PILOT-14).
 * Panel B is the recorded timeline of the approved payment.
 *
 * Depends on shared helpers from screen1.js and screen2to5.js.
 */

const PAYMENTS_HUB_URL = 'https://dal-x-payments-hub.vercel.app/payments/release';

/* A syntactically valid DAL-X token with a signature no key produced. */
function forgedDemoToken() {
  const claims = { act: 'treasury_payment_transfer', agt: 'treasury-payment-agent', aud: 'demo', exp: 4102444800, iat: 0,
    itg: {}, jti: 'forged-' + Date.now(), kid: APPROVED.authorization.kid, phash: 'demo', sub: 'demo', tgt: 'payments-hub', ver: 2 };
  const b64url = s => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sig = Array.from(crypto.getRandomValues(new Uint8Array(64)), b => String.fromCharCode(b)).join('');
  return b64url(JSON.stringify(claims)) + '.' + b64url(sig);
}

async function callHubLive(withForgedToken, out) {
  out.textContent = 'Calling the payments hub...';
  const instruction = APPROVED.authorization.claims.itg;
  const body = JSON.stringify({
    messageId: 'MSG-VISITOR', endToEndId: 'E2E-VISITOR', debtor: { name: 'Visitor', account: 'VISITOR' }, debtorAgentBic: 'XXXXXXXX',
    creditor: { id: instruction.recipient, name: 'Visitor test' }, creditorAccount: instruction.recipientAccountRef, creditorAgentBic: 'XXXXXXXX',
    amount: (instruction.amount / 100).toFixed(2), currency: instruction.currency, purpose: 'SUPP', remittanceInformation: 'visitor test',
    paymentType: instruction.paymentType,
  });
  const headers = { 'Content-Type': 'application/json' };
  if (withForgedToken) headers.Authorization = 'DAL-X ' + forgedDemoToken();
  const started = performance.now();
  try {
    const res = await fetch(PAYMENTS_HUB_URL, { method: 'POST', headers, body });
    const ms = Math.round(performance.now() - started);
    const text = await res.text();
    out.textContent = 'LIVE ' + new Date().toISOString().slice(11, 19) + ' UTC  ·  HTTP ' + res.status + '  ·  ' + ms + ' ms round trip from your browser\n' + text;
  } catch (err) {
    out.textContent = 'The payments hub could not be reached from this browser: ' + err.message;
  }
}

function renderScreen6() {
  const screen = document.getElementById('screen-6');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildSurfaceBadge());
  screen.appendChild(buildIllustrationNotice());
  screen.appendChild(buildStepIndicator(6, 'Enforcement'));

  const auth = APPROVED.authorization;
  const replay = (RUN.replay || 'HTTP 403 replayed');

  const win = buildWedgeWindow('timeline', main => {
    const grid = document.createElement('div');
    grid.className = 'wedge-enforcement-grid';

    /* ── Panel A: the payments hub ─────────────────────────────────── */
    const hub = buildPanel('Payments hub (the bank\'s system)');
    const endpoint = document.createElement('div');
    endpoint.className = 'wedge-endpoint';
    endpoint.textContent = 'POST /payments/release-authorized';
    hub.appendChild(endpoint);

    const reqWrap = document.createElement('div');
    reqWrap.className = 'wedge-code-wrap';
    reqWrap.appendChild(buildCode('What the hub checked, offline, before executing ' + APPROVED.number,
      'signature:   valid, key ' + auth.kid + '\n'
      + 'expiry:      within ' + (auth.claims.exp - auth.claims.iat) + ' seconds\n'
      + 'target:      ' + auth.claims.tgt + '\n'
      + 'payment:     ' + intentAmount(auth.claims.itg) + ' ' + auth.claims.itg.paymentType + ' → ' + auth.claims.itg.recipient + ' · ' + auth.claims.itg.recipientAccountRef + '\n'
      + 'revocations: signed list current, token not revoked\n'
      + 'token ID:    ' + auth.claims.jti + ' claimed once'));
    reqWrap.appendChild(annBadge(1));
    hub.appendChild(reqWrap);

    const resp = document.createElement('div');
    resp.className = 'wedge-code-wrap';
    resp.appendChild(buildCode('Recorded result',
      'executed:    yes, at ' + runTime(auth.consumedAt) + '\n'
      + 'receipt:     ' + APPROVED.receipt.id + ' (recorded by DAL-X)\n'
      + 'replay:      same token presented again → ' + replay, 'wedge-code-block--accepted'));
    resp.appendChild(annBadge(2));
    hub.appendChild(resp);

    const liveLabel = document.createElement('div');
    liveLabel.className = 'wedge-section-label';
    liveLabel.textContent = 'Try it live: call the payments hub without DAL-X authority';
    hub.appendChild(liveLabel);

    const liveOut = document.createElement('pre');
    liveOut.className = 'wedge-code-block';
    liveOut.textContent = 'Choose a call. The request goes from your browser to the real payments hub.';

    const btnRow = document.createElement('div');
    btnRow.className = 'wedge-cta-group';
    [['No token', false], ['Forged token', true]].forEach(([label, forged]) => {
      const b = document.createElement('button');
      b.className = 'btn btn--ghost';
      b.textContent = label;
      b.addEventListener('click', () => callHubLive(forged, liveOut));
      btnRow.appendChild(b);
    });
    hub.appendChild(btnRow);
    const liveWrap = document.createElement('div');
    liveWrap.className = 'wedge-code-wrap';
    liveWrap.appendChild(liveOut);
    liveWrap.appendChild(annBadge(3));
    hub.appendChild(liveWrap);

    grid.appendChild(hub);

    /* ── Panel B: governance timeline ──────────────────────────────── */
    const tl = buildPanel('Governance timeline', APPROVED.number + ' · ' + APPROVED.reference);
    const tlWrap = document.createElement('div');
    tlWrap.className = 'wedge-timeline-wrap';
    tlWrap.appendChild(buildTimelineList(timelineEntries(APPROVED)));
    tlWrap.appendChild(annBadge(4));
    tl.appendChild(tlWrap);
    grid.appendChild(tl);

    main.appendChild(grid);
  });

  screen.appendChild(win);

  screen.appendChild(buildAnnotationList([
    { num: 1, text: 'The hub does not trust the agent or the caller. It pulls the token from DAL-X with its own key and checks it against the exact payment it is about to run. A changed amount, account or target is refused.' },
    { num: 2, text: 'Executed once, confirmed to DAL-X, receipt recorded. Presenting the same token again was refused.' },
    { num: 3, text: 'These calls are live, from your browser, to the real payments hub. Without valid DAL-X authority it refuses: no token, or a token DAL-X did not sign.' },
    { num: 4, text: 'From interception to execution receipt, every step is recorded and timestamped. This is the record an auditor examines.' },
  ]));

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
  replayBtn.addEventListener('click', () => { resetSurface1(); showScreen('screen-1'); });
  ctaGroup.appendChild(replayBtn);
  const assessBtn = document.createElement('button');
  assessBtn.className = 'btn btn--primary';
  assessBtn.textContent = 'Request a Guided Assessment →';
  assessBtn.addEventListener('click', () => showScreen('screen-7'));
  ctaGroup.appendChild(assessBtn);
  nav.appendChild(ctaGroup);
  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen6);
