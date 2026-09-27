/* ─── Screen 6: What the demonstration showed ─────────────────────────────
 * Summarises the four gate outcomes from Screens 2 to 5 and offers two
 * CTAs: replay the demonstration, or move to the guided assessment.
 */

const DEMO_OUTCOMES = [
  { scenario: 'No authorization presented',    result: 'Rejected', chipState: 'rejected' },
  { scenario: 'Wrong action attempted',        result: 'Rejected', chipState: 'rejected' },
  { scenario: 'Valid authorization presented', result: 'Accepted', chipState: 'accepted' },
  { scenario: 'Authorization reused',          result: 'Rejected', chipState: 'rejected' },
];

function renderScreen6() {
  const screen = document.getElementById('screen-6');
  if (!screen) return;
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 1 · Public Demonstration';
  screen.appendChild(badge);

  /* Heading */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'What the demonstration showed';
  screen.appendChild(title);

  /* Four outcome cards */
  const grid = document.createElement('div');
  grid.className = 'demo-outcome-grid';

  DEMO_OUTCOMES.forEach(o => {
    const card = document.createElement('div');
    card.className = `demo-outcome-card demo-outcome-card--${o.chipState}`;

    const name = document.createElement('div');
    name.className = 'demo-outcome-card__name';
    name.textContent = o.scenario;
    card.appendChild(name);

    const outcome = document.createElement('div');
    outcome.className = 'demo-outcome-card__outcome';
    outcome.appendChild(createStatusChip(o.chipState, o.result));
    card.appendChild(outcome);

    grid.appendChild(card);
  });

  screen.appendChild(grid);

  /* Centered summary statement */
  const summary = document.createElement('p');
  summary.className = 'demo-summary-line';
  summary.textContent =
    'DAL-X rejected three of the four attempts. '
    + 'The one that succeeded had a valid, unused authorization that matched '
    + 'the approved action and target.';
  screen.appendChild(summary);

  /* Evidence badge */
  const evidence = document.createElement('div');
  evidence.className = 'gate-evidence-line';
  evidence.appendChild(createEvidenceLabel('demonstrated'));
  screen.appendChild(evidence);

  /* Self-reflection prompt */
  const reflectSection = document.createElement('div');
  reflectSection.className = 'demo-reflect';

  const reflectHeading = document.createElement('p');
  reflectHeading.className = 'section-label';
  reflectHeading.textContent = 'Before you continue';
  reflectSection.appendChild(reflectHeading);

  const reflectQ = document.createElement('p');
  reflectQ.className = 'demo-reflect__question';
  reflectQ.textContent =
    'Does the AI workflow you are most concerned about currently have any of these gates in place?';
  reflectSection.appendChild(reflectQ);

  const gateOpts = [
    {
      value:    'no',
      label:    'No, there is nothing stopping execution if authorization is missing.',
      cls:      'callout--warning',
      response: 'That is the gap. The assessment will score how critical it is for your specific workflow.',
    },
    {
      value:    'unknown',
      label:    'We are not sure what happens between our agent and the downstream system.',
      cls:      'callout--warning',
      response: 'If you cannot confirm a gate exists, it likely does not. The assessment will identify the risk.',
    },
    {
      value:    'yes',
      label:    'We believe controls exist.',
      cls:      'callout--info',
      response: 'The assessment will verify whether those controls enforce at the right boundary. Many controls exist but do not stop execution when authorization is absent.',
    },
  ];

  const responseArea = document.createElement('div');
  responseArea.className = 'demo-reflect__response';

  const gateOptBtns = document.createElement('div');
  gateOptBtns.className = 'demo-reflect__options';

  gateOpts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'btn btn--ghost demo-reflect__option-btn';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      gateOptBtns.querySelectorAll('button').forEach(b => {
        b.classList.remove('is-selected');
      });
      btn.classList.add('is-selected');

      responseArea.innerHTML = '';
      const callout = document.createElement('div');
      callout.className = `callout ${opt.cls}`;
      callout.textContent = opt.response;
      responseArea.appendChild(callout);
    });
    gateOptBtns.appendChild(btn);
  });

  reflectSection.appendChild(gateOptBtns);
  reflectSection.appendChild(responseArea);
  screen.appendChild(reflectSection);

  /* CTA group */
  const ctaGroup = document.createElement('div');
  ctaGroup.className = 'demo-cta-group';

  const replayBtn = document.createElement('button');
  replayBtn.className = 'btn btn--ghost btn--lg';
  replayBtn.textContent = 'Replay demonstration';
  replayBtn.addEventListener('click', () => {
    resetSurface1();
    renderScreen1();
    showScreen('screen-1', false);
  });
  ctaGroup.appendChild(replayBtn);

  const assessBtn = document.createElement('button');
  assessBtn.className = 'btn btn--primary btn--lg';
  assessBtn.textContent = 'Request a guided assessment';
  assessBtn.addEventListener('click', () => showScreen('screen-7'));
  ctaGroup.appendChild(assessBtn);

  screen.appendChild(ctaGroup);

  if (typeof createBrandFooter === 'function') {
    screen.appendChild(createBrandFooter());
  }
}

document.addEventListener('DOMContentLoaded', renderScreen6);
