/* ─── email.js - send assessment results to the user via EmailJS ─────────── */

/* Human-readable labels for result keys */
const EMAIL_BUSINESS_LABELS = {
  not_applicable:              'Not applicable - DAL-X does not apply to this workflow',
  critical_gap:                'Critical enforcement gap',
  gap_identified:              'Enforcement gap identified',
  gap_low_priority:            'Gap identified, lower priority',
  high_risk_no_requirement:    'High-stakes workflow with no enforcement requirement',
  enforcement_not_established: 'No enforcement requirement for this workflow',
  urgent_investigation:        'Urgent: high-risk workflow with incomplete answers',
  more_info_required:          'More information required',
};

const EMAIL_TECHNICAL_LABELS = {
  structural_failure:   'Structural requirements not met',
  incomplete:           'Technical answers incomplete',
  implementation_work:  'Implementation work required',
  supports_integration: 'Technical answers support integration',
};

/*
 * sendResultsByEmail(btn)
 * Called by the "Email me my results" button on Screen 21.
 * Uses EmailJS if configured; falls back to mailto: link.
 *
 * @param {HTMLButtonElement} btn - the button element (for loading state)
 */
function sendResultsByEmail(btn) {
  const lead = sessionState.lead;
  if (!lead) return;

  const businessKey  = getState('s2.business_result') || '';
  const riskScore    = getState('s2.risk_score')       || 0;
  const riskBand     = getState('s2.risk_band')        || '';
  const techKey      = getState('s4.technical_result') || '';

  const businessLabel  = EMAIL_BUSINESS_LABELS[businessKey]  || businessKey || 'Not completed';
  const technicalLabel = EMAIL_TECHNICAL_LABELS[techKey]     || techKey     || 'Not completed';
  const riskLabel      = riskScore ? `${riskScore} (${riskBand})` : 'Not scored';
  const today          = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  /* ── Fallback: mailto link (used when EmailJS is not configured) ──────── */
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    const subject = encodeURIComponent('Your DAL-X Assessment Result');
    const body    = encodeURIComponent(
      `Hi ${lead.name},\n\n`
      + `Here is a summary of your DAL-X assessment completed on ${today}.\n\n`
      + `Business result: ${businessLabel}\n`
      + `Risk score: ${riskLabel}\n`
      + `Technical result: ${technicalLabel}\n\n`
      + `Ready to go further? Schedule a conversation with Jochanni Labs:\n`
      + `${JL_BOOKING_URL}\n\n`
      + `- Jochanni Labs`
    );
    window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
    btn.textContent = 'Opening email client…';
    btn.disabled = true;
    return;
  }

  /* ── EmailJS send ────────────────────────────────────────────────────── */
  btn.textContent = 'Sending…';
  btn.disabled = true;

  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_name:          lead.name,
    to_email:         lead.email,
    company:          lead.company,
    business_result:  businessLabel,
    risk_score:       riskLabel,
    technical_result: technicalLabel,
    booking_url:      JL_BOOKING_URL,
    assessment_date:  today,
  }).then(() => {
    btn.textContent = 'Sent - check your inbox ✓';
  }).catch(() => {
    btn.textContent = 'Send failed';
    btn.disabled = false;

    /* Surface a direct contact fallback */
    const errEl = document.getElementById('email-send-error');
    if (errEl) {
      errEl.style.display = 'block';
    }
  });
}
