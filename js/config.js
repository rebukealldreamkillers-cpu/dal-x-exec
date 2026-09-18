/* ─── config.js - runtime constants and third-party credentials ─────────── */

/* Calendly booking link - update if URL changes */
const JL_BOOKING_URL = 'https://calendly.com/kevin-jochannilabs';

/* Fallback contact email shown if email send fails */
const JL_CONTACT_EMAIL = 'kmoore1962@yahoo.com';

/*
 * EmailJS credentials - create a free account at https://www.emailjs.com/
 * 1. Create a service (Gmail, Outlook, etc.) → copy the Service ID
 * 2. Create an email template → copy the Template ID
 * 3. Copy your Public Key from Account → API Keys
 *
 * Template variables your template must include:
 *   {{to_name}}, {{to_email}}, {{company}},
 *   {{business_result}}, {{risk_score}},
 *   {{technical_result}}, {{booking_url}}, {{assessment_date}}
 */
const EMAILJS_PUBLIC_KEY  = '';   /* paste your EmailJS public key here */
const EMAILJS_SERVICE_ID  = '';   /* paste your EmailJS service ID here */
const EMAILJS_TEMPLATE_ID = '';   /* paste your EmailJS template ID here */

/*
 * Completion webhook - Google Apps Script Web App URL
 * 1. Create a Google Sheet with columns:
 *    timestamp | name | email | company | business_result | risk_score |
 *    risk_band | technical_result | agent_type | proposed_execution |
 *    downstream_system | enforcement_gap
 * 2. In Extensions → Apps Script, paste a doPost(e) function that
 *    parses e.postData.contents as JSON and appends a row.
 * 3. Deploy as Web App (Anyone, execute as Me) → copy the /exec URL.
 */
const WEBHOOK_URL = '';   /* paste your Apps Script /exec URL here */
