/* ─── Screen 20: Jochanni Labs pilot decision ───────────────────────────── */

/*
 * Evaluation order (preserved):
 *   1. remediation_required: structural failure, enterprise not yet decided
 *   2. not_recommended: enterprise cannot or will not correct
 *   3. pilot_prerequisites: structural failure, enterprise will correct
 *   4. setup_tasks: Q1-Q6 pass, Q7-Q10 incomplete
 *   5. pilot_candidate: all confirmed and complete
 */

/* ── Outcome visual configs ──────────────────────────────────────────────── */

const S20_VISUAL = {
  remediation_required: {
    tone:      'slate',
    heading:   'Remediation decision required',
    subtext:   'A structural failure exists. Jochanni Labs cannot proceed until the enterprise commits to a response.',
  },
  not_recommended: {
    tone:      'red',
    heading:   'Pilot not recommended',
    subtext:   'The enterprise cannot or will not create the mandatory execution boundary. No DAL-X pilot is proposed.',
  },
  pilot_prerequisites: {
    tone:      'amber',
    heading:   'Pilot prerequisites required',
    subtext:   'The current execution path cannot enforce DAL-X. Structural work must complete before a pilot can begin.',
  },
  setup_tasks: {
    tone:      'blue',
    heading:   'Pilot setup tasks required',
    subtext:   'The execution boundary supports DAL-X. Implementation work remains before the pilot can begin.',
  },
  pilot_candidate: {
    tone:      'green',
    heading:   'Pilot integration candidate',
    subtext:   'Jochanni Labs reviewed a consequential execution and a complete integration path.',
  },
};

/* ── Remediation response options ─────────────────────────────────────────── */

const S20_REMEDIATION_OPTIONS = [
  { value: 'will_correct',       label: 'We can and will correct it.'     },
  { value: 'cannot_correct',     label: 'We cannot correct it.'           },
  { value: 'will_not_correct',   label: 'We will not correct it.'         },
  { value: 'more_investigation', label: 'More investigation is required.' },
];

/* ── Evaluation engine (preserved) ───────────────────────────────────────── */

function evaluatePilotDecision() {
  const techResult  = getState('s4.technical_result')              || '';
  const remediation = getState('jl.enterprise_remediation_response') || '';

  if (techResult === 'structural_failure') {
    if (remediation === 'cannot_correct' || remediation === 'will_not_correct') {
      return 'not_recommended';
    }
    if (remediation === 'will_correct') {
      return 'pilot_prerequisites';
    }
    return 'remediation_required';
  }

  if (techResult === 'implementation_work') return 'setup_tasks';
  if (techResult === 'supports_integration') return 'pilot_candidate';

  return 'remediation_required';
}

/* ── Outcome panel builder ───────────────────────────────────────────────── */

function s20BuildOutcomePanel(decisionKey) {
  const cfg = S20_VISUAL[decisionKey];

  const panel = document.createElement('div');
  panel.className = 'pilot-decision-panel pilot-decision-panel--' + cfg.tone;

  const heading = document.createElement('h2');
  heading.className = 'pilot-decision-panel__heading';
  heading.textContent = cfg.heading;
  panel.appendChild(heading);

  const sub = document.createElement('p');
  sub.className = 'pilot-decision-panel__sub';
  sub.textContent = cfg.subtext;
  panel.appendChild(sub);

  /* Evidence label on pilot_candidate only */
  if (decisionKey === 'pilot_candidate') {
    const evLine = document.createElement('div');
    evLine.className = 'pilot-decision-panel__evidence';
    evLine.appendChild(document.createTextNode('Evidence '));
    evLine.appendChild(createEvidenceLabel('jl-reviewed'));
    panel.appendChild(evLine);
  }

  return panel;
}

/* ── Remediation response form ───────────────────────────────────────────── */

function s20BuildRemediationForm() {
  const section = document.createElement('div');
  section.className = 'pilot-remediation';

  const heading = document.createElement('p');
  heading.className = 'pilot-remediation__heading';
  heading.textContent = 'Enterprise remediation response';
  section.appendChild(heading);

  const list = document.createElement('div');
  list.className = 'pilot-remediation__options';

  const saved = getState('jl.enterprise_remediation_response');

  S20_REMEDIATION_OPTIONS.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pilot-remediation__option';
    if (saved === opt.value) btn.classList.add('is-selected');
    btn.textContent = opt.label;

    btn.addEventListener('click', () => {
      setState('jl.enterprise_remediation_response', opt.value);
      renderScreen20();
    });
    list.appendChild(btn);
  });

  section.appendChild(list);

  const note = document.createElement('p');
  note.className = 'pilot-remediation__note';
  note.textContent = 'Jochanni Labs does not track the investigation or pursue the enterprise for an answer.';
  section.appendChild(note);

  return section;
}

/* ── Record builder (prerequisite / setup) ───────────────────────────────── */

function s20BuildRecordBuilder(kind) {
  const cfg = kind === 'prerequisite'
    ? {
        title:       'Prerequisite record',
        workLabel:   'Required correction',
        workKey:     'jl.prerequisite_record.required_correction',
        roleKey:     'jl.prerequisite_record.responsible_role',
        evidenceKey: 'jl.prerequisite_record.evidence_required',
        tone:        'amber',
        scopeText:   'The prerequisite record excludes target dates, ongoing status, follow-up assignments for Jochanni Labs, and remediation project management.',
      }
    : {
        title:       'Setup record',
        workLabel:   'Required setup work',
        workKey:     'jl.setup_record.required_work',
        roleKey:     'jl.setup_record.responsible_role',
        evidenceKey: 'jl.setup_record.evidence_required',
        tone:        'blue',
        scopeText:   'Jochanni Labs does not track the work before a paid pilot begins.',
      };

  const card = document.createElement('div');
  card.className = 'pilot-record-card pilot-record-card--' + cfg.tone;

  const cardTitle = document.createElement('div');
  cardTitle.className = 'pilot-record-card__title';
  cardTitle.textContent = cfg.title;
  card.appendChild(cardTitle);

  function buildField(labelText, stateKey, type) {
    const wrap = document.createElement('div');
    wrap.className = 'pilot-record-card__field';

    const lbl = document.createElement('label');
    lbl.className = 'pilot-record-card__field-label';
    lbl.textContent = labelText;
    wrap.appendChild(lbl);

    let input;
    if (type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
    } else {
      input = document.createElement('input');
      input.type = 'text';
    }
    input.className = 'form-control pilot-record-card__input';

    const saved = getState(stateKey);
    if (saved) input.value = saved;
    input.addEventListener('input', () => setState(stateKey, input.value));

    lbl.setAttribute('for', input.id = 'pr-' + Math.random().toString(36).slice(2, 8));
    wrap.appendChild(input);
    return wrap;
  }

  card.appendChild(buildField(cfg.workLabel,                             cfg.workKey,     'textarea'));
  card.appendChild(buildField('Responsible enterprise role',             cfg.roleKey,     'text'));
  card.appendChild(buildField('Evidence required for reassessment',      cfg.evidenceKey, 'textarea'));

  const scope = document.createElement('p');
  scope.className = 'pilot-record-card__scope';
  scope.textContent = cfg.scopeText;
  card.appendChild(scope);

  return card;
}

/* ── Owner assignment cards ──────────────────────────────────────────────── */

function s20BuildOwnerAssignment() {
  const wrap = document.createElement('div');
  wrap.className = 'pilot-owner-wrap';

  const heading = document.createElement('p');
  heading.className = 'pilot-owner-heading';
  heading.textContent = 'Pilot owner assignments';
  wrap.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'pilot-owner-grid';

  const roles = [
    { role: 'Business owner',   stateKey: 'jl.pilot_business_owner',  placeholder: 'Name of the pilot business owner'  },
    { role: 'Authority owner',  stateKey: 'jl.pilot_authority_owner', placeholder: 'Name of the authority owner'       },
    { role: 'Technical owner',  stateKey: 'jl.pilot_technical_owner', placeholder: 'Name of the technical owner'       },
  ];

  roles.forEach(r => {
    const card = document.createElement('div');
    card.className = 'pilot-owner-card';

    const roleLabel = document.createElement('div');
    roleLabel.className = 'pilot-owner-card__role';
    roleLabel.textContent = r.role;
    card.appendChild(roleLabel);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control pilot-owner-card__input';
    input.placeholder = r.placeholder;
    const saved = getState(r.stateKey);
    if (saved) input.value = saved;
    input.addEventListener('input', () => setState(r.stateKey, input.value));
    card.appendChild(input);

    grid.appendChild(card);
  });

  wrap.appendChild(grid);
  return wrap;
}

/* ── Closed path note (not recommended) ──────────────────────────────────── */

function s20BuildClosedNote() {
  const wrap = document.createElement('div');
  wrap.className = 'pilot-closed-note';
  wrap.textContent = 'No further action required. The record closes here.';
  return wrap;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen20() {
  const decisionKey = evaluatePilotDecision();
  setState('jl.decision', decisionKey);

  const screen = document.getElementById('screen-20');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Jochanni Labs review';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Pilot decision';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent = 'Jochanni Labs sets the pilot path based on the complete assessment.';
  screen.appendChild(subtitle);

  /* Outcome panel */
  screen.appendChild(s20BuildOutcomePanel(decisionKey));

  /* Additional content per decision */
  if (decisionKey === 'remediation_required') {
    screen.appendChild(s20BuildRemediationForm());
  } else if (decisionKey === 'pilot_prerequisites') {
    screen.appendChild(s20BuildRecordBuilder('prerequisite'));
  } else if (decisionKey === 'setup_tasks') {
    screen.appendChild(s20BuildRecordBuilder('setup'));
  } else if (decisionKey === 'pilot_candidate') {
    screen.appendChild(s20BuildOwnerAssignment());
  } else if (decisionKey === 'not_recommended') {
    screen.appendChild(s20BuildClosedNote());
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
  nextBtn.textContent = 'View full result';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen21 === 'function') renderScreen21();
    showScreen('screen-21');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen20);
