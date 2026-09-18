/* ─── Screen 6: Demonstration Result ────────────────────────────────────── */

/*
 * Summarises the four gate outcomes from Screens 2–5 and offers two CTAs:
 *   1. Replay demonstration → resets Surface 1 and returns to Screen 1
 *   2. Request a guided DAL-X assessment → advances to Surface 2 (Screen 7)
 */

const DEMO_OUTCOMES = [
  { scenario: 'Missing authorization',  result: 'Rejected', chipState: 'rejected' },
  { scenario: 'Changed action',         result: 'Rejected', chipState: 'rejected' },
  { scenario: 'Approved execution',     result: 'Accepted', chipState: 'accepted' },
  { scenario: 'Reused authorization',   result: 'Rejected', chipState: 'rejected' },
];

function renderScreen6() {
  const screen = document.getElementById('screen-6');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 1 · Public Demonstration';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Demonstration Result';
  screen.appendChild(title);

  /* Summary sentence, verbatim from spec */
  const summary = document.createElement('p');
  summary.style.cssText =
    'font-size:var(--text-base);color:var(--color-text-secondary);'
    + 'margin-bottom:var(--space-6);line-height:1.7;';
  summary.textContent =
    'DAL-X rejected missing authority, rejected a changed action, accepted the '
    + 'approved execution, and rejected reuse.';
  screen.appendChild(summary);

  /* Outcome summary card */
  const card = document.createElement('div');
  card.className = 'card';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'card__title';
  cardTitle.textContent = 'Gate results';
  card.appendChild(cardTitle);

  const table = document.createElement('table');
  table.className = 'data-table';

  const thead = document.createElement('thead');
  const hrow  = document.createElement('tr');
  ['Scenario', 'DAL-X decision'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  DEMO_OUTCOMES.forEach(({ scenario, result, chipState }) => {
    const tr = document.createElement('tr');

    const tdScenario = document.createElement('td');
    tdScenario.textContent = scenario;
    tr.appendChild(tdScenario);

    const tdResult = document.createElement('td');
    tdResult.appendChild(createStatusChip(chipState, result));
    tr.appendChild(tdResult);

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.appendChild(table);

  screen.appendChild(card);

  /* Evidence label */
  const evidenceLine = document.createElement('p');
  evidenceLine.style.cssText =
    'margin-top:var(--space-5);font-size:var(--text-sm);'
    + 'color:var(--color-text-secondary);';
  evidenceLine.appendChild(document.createTextNode('Evidence: '));
  evidenceLine.appendChild(createEvidenceLabel('demonstrated'));
  screen.appendChild(evidenceLine);

  /* CTA group */
  const ctaGroup = document.createElement('div');
  ctaGroup.className = 'cta-group';
  ctaGroup.style.marginTop = 'var(--space-8)';

  /* Positioning note above CTAs */
  const assessNote = document.createElement('p');
  assessNote.style.cssText =
    'font-size:var(--text-sm);color:var(--color-text-secondary);'
    + 'line-height:1.65;margin-bottom:var(--space-5);';
  assessNote.textContent =
    'The next section is the discovery assessment. '
    + 'Walk through it for your specific workflow — the tool scores your risk profile automatically. '
    + 'Results are self-reported; Jochanni Labs reviews and validates them with you as part of a paid engagement.';
  ctaGroup.appendChild(assessNote);

  /* Primary CTA: Continue to discovery assessment */
  const assessBtn = document.createElement('button');
  assessBtn.className = 'btn btn--primary btn--lg btn--full';
  assessBtn.textContent = 'Continue to the discovery assessment →';
  assessBtn.addEventListener('click', () => showScreen('screen-7'));
  ctaGroup.appendChild(assessBtn);

  /* Secondary CTA: Replay demonstration */
  const replayBtn = document.createElement('button');
  replayBtn.className = 'btn btn--secondary btn--full';
  replayBtn.textContent = 'Replay demonstration';
  replayBtn.addEventListener('click', () => {
    resetSurface1();
    renderScreen1();
    showScreen('screen-1', false);
  });
  ctaGroup.appendChild(replayBtn);

  screen.appendChild(ctaGroup);
  screen.appendChild(createBrandFooter());
}

document.addEventListener('DOMContentLoaded', renderScreen6);
