/* ─── webhook.js — completion ping to Google Sheets via Apps Script ──────── */

/*
 * fireCompletionWebhook()
 * Called once when the user reaches Screen 21 with a captured lead.
 * Fire-and-forget: no UI feedback, silent on error.
 * Skipped entirely if WEBHOOK_URL is not configured.
 */
function fireCompletionWebhook() {
  if (!WEBHOOK_URL) return;

  const lead = sessionState.lead;
  if (!lead) return;

  const payload = {
    timestamp:           new Date().toISOString(),
    name:                lead.name    || '',
    email:               lead.email   || '',
    company:             lead.company || '',
    business_result:     getState('s2.business_result')          || '',
    risk_score:          getState('s2.risk_score')               || 0,
    risk_band:           getState('s2.risk_band')                || '',
    technical_result:    getState('s4.technical_result')         || 'incomplete',
    agent_type:          getState('s2.agent_type')               || '',
    proposed_execution:  getState('s2.proposed_execution')       || '',
    downstream_system:   getState('s2.downstream_system')        || '',
    enforcement_gap:     getState('s2.missing_authority_response') || '',
  };

  /* mode: 'no-cors' because Apps Script doesn't send CORS headers by default.
     The response won't be readable but the POST lands in the sheet. */
  fetch(WEBHOOK_URL, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  }).catch(() => {
    console.warn('DAL-X: completion webhook failed — check WEBHOOK_URL in config.js');
  });
}
