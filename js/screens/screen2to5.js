/* ─── Screens 2–5: Gate Scenarios ───────────────────────────────────────── */

/*
 * Each screen follows the same structure:
 *   1. Surface badge + title
 *   2. Setup description callout (explains the scenario)
 *   3. Decision state block (from createDecisionBlock)
 *   4. [Screen 4 only] Separation table + downstream note
 *   5. Evidence label (Demonstrated in simulation — all four screens)
 *   6. Back / Next nav
 *
 * Screen 3's setup description is dynamic: it references the action from
 * the example the user selected on Screen 1.
 */

/* ── Per-screen configuration ─────────────────────────────────────────── */

function gateScreenConfigs() {
  /* Read action now (not at module load time) so Screen 3 reflects the
     example selected before navigating to the demo. */
  const action = getState('s1.action') || 'infrastructure_change';

  return {
    'screen-2': {
      title:    'Missing Authorization',
      setup:    'The downstream gate calls DAL-X without an authorization_id.',
      decision: {
        state:             'Rejected',
        reason:            'No execution authorization was provided.',
        required_response: 'Submit the proposed execution for DAL-X evaluation.',
        what_happens_next: 'The downstream system is not called.',
        variant:           'rejected',
      },
      withoutDalX:
        'Without this gate, the downstream system would execute immediately — with no record '
        + 'that authorization was ever sought, reviewed, or granted. The action would be done '
        + 'before anyone knew it was proposed.',
      separationTable: null,
      prev:         'screen-1',
      next:         'screen-3',
      onBeforeNext: () => renderGateScreen('screen-3'),
    },

    'screen-3': {
      title: 'Wrong Action',
      setup: `The approved action is ${action}. The attempted action is different.`,
      decision: {
        state:             'Rejected',
        reason:            'The attempted action does not match the authorized action.',
        required_response: 'Submit the changed action as a new proposed execution.',
        what_happens_next: 'The downstream system is not called.',
        variant:           'rejected',
      },
      withoutDalX:
        'Without action matching, any valid authorization could be reused for a different '
        + 'execution than the one it was issued for. A prompt-injected or misconfigured agent '
        + 'could present a real authorization to execute something the enterprise never approved.',
      separationTable: null,
      prev: 'screen-2',
      next: 'screen-4',
    },

    'screen-4': {
      title: 'Valid Authorization',
      setup: 'The correct authorization_id, action, and target are submitted before expiration.',
      decision: {
        state:             'Accepted',
        reason:            'The authorization is active and the action and target match.',
        required_response: 'None.',
        what_happens_next: 'The downstream call may proceed.',
        variant:           'accepted',
      },
      withoutDalX: null,
      separationTable: {
        rows: [
          { record: 'DAL-X gate',                 result: 'Accepted',  chipState: 'accepted' },
          { record: 'Simulated downstream system', result: 'Completed', chipState: 'neutral'  },
        ],
        note: 'DAL-X gate acceptance does not prove that a real downstream system completed execution.',
      },
      prev: 'screen-3',
      next: 'screen-5',
    },

    'screen-5': {
      title: 'Reused Authorization',
      setup: 'The same authorization_id is submitted again.',
      decision: {
        state:             'Rejected',
        reason:            'The execution authorization has already been consumed.',
        required_response: 'Create a new submission and obtain new authority.',
        what_happens_next: 'The downstream system is not called.',
        variant:           'rejected',
      },
      withoutDalX:
        'Without consumption tracking, the same authorization could be replayed indefinitely — '
        + 'or captured by a separate process and reused to trigger additional executions '
        + 'the enterprise never intended to authorize.',
      separationTable: null,
      prev: 'screen-4',
      next: 'screen-6',
    },
  };
}

/* ── Generic renderer ─────────────────────────────────────────────────── */

function renderGateScreen(screenId) {
  const configs = gateScreenConfigs();
  const cfg     = configs[screenId];
  if (!cfg) return;

  const screen = document.getElementById(screenId);
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 1 — Public Demonstration';
  screen.appendChild(badge);

  /* Screen number + title */
  const screenNum = screenId.replace('screen-', '');
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = `Screen ${screenNum}: ${cfg.title}`;
  screen.appendChild(title);

  /* Setup description */
  const setup = document.createElement('div');
  setup.className = 'callout callout--neutral';
  setup.textContent = cfg.setup;
  screen.appendChild(setup);

  /* Decision state block */
  const block = createDecisionBlock(cfg.decision);
  screen.appendChild(block);

  /* Separation table — Screen 4 only */
  if (cfg.separationTable) {
    const tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.style.marginTop = 'var(--space-4)';

    const tableTitle = document.createElement('div');
    tableTitle.className = 'card__title';
    tableTitle.textContent = 'Gate and downstream result';
    tableCard.appendChild(tableTitle);

    const table = document.createElement('table');
    table.className = 'data-table';

    const thead = document.createElement('thead');
    const hrow  = document.createElement('tr');
    ['Record', 'Result'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    cfg.separationTable.rows.forEach(({ record, result, chipState }) => {
      const tr = document.createElement('tr');

      const tdRecord = document.createElement('td');
      tdRecord.textContent = record;
      tr.appendChild(tdRecord);

      const tdResult = document.createElement('td');
      tdResult.appendChild(createStatusChip(chipState, result));
      tr.appendChild(tdResult);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableCard.appendChild(table);

    /* Note below table */
    const tableNote = document.createElement('p');
    tableNote.style.cssText =
      'margin-top:var(--space-4);font-size:var(--text-sm);'
      + 'color:var(--color-text-secondary);';
    tableNote.textContent = cfg.separationTable.note;
    tableCard.appendChild(tableNote);

    screen.appendChild(tableCard);
  }

  /* Without DAL-X context — shown on rejection screens */
  if (cfg.withoutDalX) {
    const withoutNote = document.createElement('div');
    withoutNote.className = 'callout callout--without';
    withoutNote.style.marginTop = 'var(--space-4)';
    withoutNote.innerHTML = '<strong>Without this gate:</strong> ' + cfg.withoutDalX;
    screen.appendChild(withoutNote);
  }

  /* Evidence label */
  const evidenceLine = document.createElement('p');
  evidenceLine.style.cssText =
    'margin-top:var(--space-5);font-size:var(--text-sm);'
    + 'color:var(--color-text-secondary);';
  evidenceLine.appendChild(document.createTextNode('Evidence: '));
  evidenceLine.appendChild(createEvidenceLabel('demonstrated'));
  screen.appendChild(evidenceLine);

  /* Back / Next nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen(cfg.prev));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    if (cfg.onBeforeNext) cfg.onBeforeNext();
    showScreen(cfg.next);
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

/* ── Per-screen render functions ──────────────────────────────────────── */

function renderScreen2() { renderGateScreen('screen-2'); }
function renderScreen3() { renderGateScreen('screen-3'); }
function renderScreen4() { renderGateScreen('screen-4'); }
function renderScreen5() { renderGateScreen('screen-5'); }

/* ── Init ─────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  renderScreen2();
  renderScreen3();
  renderScreen4();
  renderScreen5();
});
