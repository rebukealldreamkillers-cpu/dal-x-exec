/* ─── Screens 2 to 5: Gate Demonstrations ────────────────────────────────
 * Each screen shows one enforcement outcome using an animated gate
 * pipeline. Reads s1.* fields written by screen1.js. Preserves navigation
 * to screen-1, screen-3, screen-4, screen-5, and screen-6.
 */

function getExampleData() {
  const key = getState('s1.example') || 'infrastructure';
  return EXAMPLES[key] || EXAMPLES.infrastructure;
}

/* ── Reusable animated pipeline ────────────────────────────────────────── */

/**
 * buildGatePipeline(config)
 * Renders the animated agent → gate → downstream pipeline.
 *
 * @param {object} config
 * @param {string} config.agentLabel
 * @param {string} config.actionLabel
 * @param {string} config.targetLabel
 * @param {boolean} config.hasToken
 * @param {boolean} config.tokenValid
 * @param {boolean} [config.tokenConsumed]
 * @param {boolean} [config.tokenExpired]
 * @param {'accepted'|'rejected'} config.outcome
 * @param {string} config.rejectionReason
 * @param {string} config.executionNote
 * @returns {HTMLDivElement}
 */
function buildGatePipeline(config) {
  const wrap = document.createElement('div');
  wrap.className = `gate-pipeline gate-pipeline--${config.outcome}`;
  if (config.hasToken)      wrap.classList.add('gate-pipeline--has-token');
  if (config.tokenConsumed) wrap.classList.add('gate-pipeline--token-consumed');
  if (config.tokenExpired)  wrap.classList.add('gate-pipeline--token-expired');

  /* Agent node */
  const agent = document.createElement('div');
  agent.className = 'gate-pipeline__node gate-pipeline__node--agent';
  agent.innerHTML = `
    <div class="gate-pipeline__node-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8"/>
        <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="gate-pipeline__node-title">Agent</div>
    <div class="gate-pipeline__node-sub">${config.agentLabel}</div>
  `;
  wrap.appendChild(agent);

  /* Connector: agent to gate */
  const conn1 = document.createElement('div');
  conn1.className = 'gate-pipeline__connector gate-pipeline__connector--in';

  const packet = document.createElement('div');
  packet.className = 'gate-pipeline__packet';
  packet.setAttribute('aria-hidden', 'true');
  conn1.appendChild(packet);

  if (config.hasToken) {
    const token = document.createElement('div');
    token.className = 'gate-pipeline__token';
    if (!config.tokenValid) token.classList.add('gate-pipeline__token--invalid');
    token.textContent = config.tokenConsumed
      ? 'authorization_id (used)'
      : 'authorization_id';
    conn1.appendChild(token);
  }

  const actionTag = document.createElement('div');
  actionTag.className = 'gate-pipeline__action-tag';
  actionTag.textContent = config.actionLabel;
  conn1.appendChild(actionTag);

  wrap.appendChild(conn1);

  /* Gate node */
  const gate = document.createElement('div');
  gate.className = 'gate-pipeline__node gate-pipeline__node--gate';
  gate.innerHTML = `
    <div class="gate-pipeline__node-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-3z"
              stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="gate-pipeline__node-title">DAL-X gate</div>
    <div class="gate-pipeline__node-sub">${config.outcome === 'accepted' ? 'Accepted' : 'Rejected'}</div>
  `;
  wrap.appendChild(gate);

  /* Connector: gate to downstream */
  const conn2 = document.createElement('div');
  conn2.className = 'gate-pipeline__connector gate-pipeline__connector--out';

  if (config.outcome === 'accepted') {
    const packet2 = document.createElement('div');
    packet2.className = 'gate-pipeline__packet gate-pipeline__packet--out';
    packet2.setAttribute('aria-hidden', 'true');
    conn2.appendChild(packet2);
  }

  wrap.appendChild(conn2);

  /* Downstream node */
  const down = document.createElement('div');
  down.className = 'gate-pipeline__node gate-pipeline__node--downstream';
  down.innerHTML = `
    <div class="gate-pipeline__node-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/>
        <path d="M7 9h10M7 13h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="gate-pipeline__node-title">Downstream</div>
    <div class="gate-pipeline__node-sub">${config.targetLabel}</div>
  `;
  wrap.appendChild(down);

  return wrap;
}

/* ── Build scenario configs ────────────────────────────────────────────── */

function buildConfigs(ex) {
  const a  = ex.action;
  const wa = ex.wrong_action;
  const t  = ex.target;
  const ag = ex.agent;
  const au = ex.required_authority;

  return {
    'screen-2': {
      heading: 'No authorization presented',
      subtext:
        'The downstream gate received a request with no authorization. '
        + 'DAL-X blocked it before the system acted.',
      pipeline: {
        agentLabel:      ag,
        actionLabel:     a,
        targetLabel:     t,
        hasToken:        false,
        tokenValid:      false,
        tokenConsumed:   false,
        tokenExpired:    false,
        outcome:         'rejected',
        rejectionReason: 'No execution authorization was provided.',
        executionNote:   'Downstream system not reached.',
      },
      decision: {
        state:             'Rejected',
        reason:            'No execution authorization was provided.',
        required_response: 'Submit the proposed execution to DAL-X for evaluation.',
        what_happens_next: 'The downstream system was not called.',
        variant:           'rejected',
      },
      afterNote:
        'The agent must submit the proposed execution to DAL-X before attempting to proceed.',
      prev: 'screen-1',
      next: 'screen-3',
      onBeforeNext: () => renderGateScreen('screen-3'),
    },

    'screen-3': {
      heading: 'Authorization scope mismatch',
      subtext:
        `The token was issued for ${a}. `
        + 'The attempted action was different. DAL-X rejected it.',
      pipeline: {
        agentLabel:      ag,
        actionLabel:     wa,
        targetLabel:     t,
        hasToken:        true,
        tokenValid:      false,
        tokenConsumed:   false,
        tokenExpired:    false,
        outcome:         'rejected',
        rejectionReason: 'The attempted action does not match the authorized action.',
        executionNote:   'Downstream system not reached.',
      },
      decision: {
        state:             'Rejected',
        reason:            'The attempted action does not match the authorized action.',
        required_response: 'Submit the changed action as a new proposed execution.',
        what_happens_next: 'The downstream system was not called.',
        variant:           'rejected',
      },
      afterNote:
        'A changed action requires a new submission and a new authorization.',
      prev: 'screen-2',
      next: 'screen-4',
    },

    'screen-4': {
      heading: 'Authorization accepted',
      subtext:
        'Correct authorization, matching action and target, submitted before expiration. '
        + 'DAL-X accepted it.',
      pipeline: {
        agentLabel:      ag,
        actionLabel:     a,
        targetLabel:     t,
        hasToken:        true,
        tokenValid:      true,
        tokenConsumed:   false,
        tokenExpired:    false,
        outcome:         'accepted',
        rejectionReason: '',
        executionNote:   'Downstream execution completed.',
      },
      decision: {
        state:             'Accepted',
        reason:            'The authorization is active and the action and target match.',
        required_response: 'None.',
        what_happens_next: 'The downstream call proceeded.',
        variant:           'accepted',
      },
      separationTable: {
        rows: [
          { record: 'DAL-X gate',                  result: 'Accepted',  chipState: 'accepted' },
          { record: 'Simulated downstream system', result: 'Completed', chipState: 'neutral'  },
        ],
        note: 'DAL-X gate acceptance does not prove that a real downstream system completed execution.',
      },
      afterNote: null,
      prev: 'screen-3',
      next: 'screen-5',
    },

    'screen-5': {
      heading: 'Authorization already consumed',
      subtext:
        'The same authorization was used twice. '
        + 'Single-use tokens cannot be replayed.',
      pipeline: {
        agentLabel:      ag,
        actionLabel:     a,
        targetLabel:     t,
        hasToken:        true,
        tokenValid:      false,
        tokenConsumed:   true,
        tokenExpired:    false,
        outcome:         'rejected',
        rejectionReason: 'The execution authorization has already been consumed.',
        executionNote:   'Downstream system not reached.',
      },
      decision: {
        state:             'Rejected',
        reason:            'The execution authorization has already been consumed.',
        required_response: 'Create a new submission and obtain new authority.',
        what_happens_next: 'The downstream system was not called.',
        variant:           'rejected',
      },
      afterNote:
        'Each governed execution requires its own authorization. Reuse is blocked by design.',
      prev: 'screen-4',
      next: 'screen-6',
    },
  };
}

/* ── Generic renderer ─────────────────────────────────────────────────── */

function renderGateScreen(screenId) {
  const ex  = getExampleData();
  const cfg = buildConfigs(ex)[screenId];
  if (!cfg) return;

  const screen = document.getElementById(screenId);
  if (!screen) return;
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Surface 1 · Public Demonstration';
  screen.appendChild(badge);

  /* Heading */
  const heading = document.createElement('h1');
  heading.className = 'screen-title';
  heading.textContent = cfg.heading;
  screen.appendChild(heading);

  /* Subtext */
  const subtext = document.createElement('p');
  subtext.className = 'screen-subtitle';
  subtext.textContent = cfg.subtext;
  screen.appendChild(subtext);

  /* Pipeline */
  screen.appendChild(buildGatePipeline(cfg.pipeline));

  /* Result panel (fades in after animation) */
  const result = document.createElement('div');
  result.className = 'gate-pipeline__result';

  /* Result summary rows */
  const summary = document.createElement('div');
  summary.className = 'gate-pipeline__result-summary';

  if (cfg.pipeline.outcome === 'accepted') {
    summary.appendChild(makeResultRow('DAL-X gate', 'Accepted', 'accepted'));
    summary.appendChild(makeResultRow('Simulated downstream system', 'Completed', 'neutral'));
  } else {
    summary.appendChild(makeResultRow('DAL-X gate', 'Rejected', 'rejected'));
    summary.appendChild(makeResultRow('Downstream system', 'Not reached', 'neutral'));
  }
  result.appendChild(summary);

  /* Decision block */
  result.appendChild(createDecisionBlock(cfg.decision));

  /* Separation table for screen 4 */
  if (cfg.separationTable) {
    const infoPanel = document.createElement('div');
    infoPanel.className = 'gate-info-panel';
    infoPanel.textContent = cfg.separationTable.note;
    result.appendChild(infoPanel);
  }

  /* After note */
  if (cfg.afterNote) {
    const note = document.createElement('p');
    note.className = 'gate-after-note';
    note.textContent = cfg.afterNote;
    result.appendChild(note);
  }

  /* Evidence badge */
  const evidence = document.createElement('div');
  evidence.className = 'gate-evidence-line';
  evidence.appendChild(createEvidenceLabel('demonstrated'));
  result.appendChild(evidence);

  screen.appendChild(result);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen(cfg.prev));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Continue';
  nextBtn.addEventListener('click', () => {
    if (cfg.onBeforeNext) cfg.onBeforeNext();
    showScreen(cfg.next);
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

function makeResultRow(label, value, chipState) {
  const row = document.createElement('div');
  row.className = 'gate-result-row';

  const key = document.createElement('div');
  key.className = 'gate-result-row__key';
  key.textContent = label;
  row.appendChild(key);

  const val = document.createElement('div');
  val.className = 'gate-result-row__val';
  val.appendChild(createStatusChip(chipState, value));
  row.appendChild(val);

  return row;
}

/* ── Per-screen render functions ──────────────────────────────────────── */

function renderScreen2() { renderGateScreen('screen-2'); }
function renderScreen3() { renderGateScreen('screen-3'); }
function renderScreen4() { renderGateScreen('screen-4'); }
function renderScreen5() { renderGateScreen('screen-5'); }

document.addEventListener('DOMContentLoaded', () => {
  renderScreen2();
  renderScreen3();
  renderScreen4();
  renderScreen5();
});
