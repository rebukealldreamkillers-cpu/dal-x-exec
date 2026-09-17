/* ─── Screen 20: Jochanni Labs Decision ─────────────────────────────────── */

/*
 * Evaluation order (spec-required):
 *   1. remediation_required: structural failure, enterprise not yet decided
 *   2. not_recommended: enterprise cannot or will not correct
 *   3. pilot_prerequisites: structural failure, enterprise will correct
 *   4. setup_tasks: Q1-Q6 pass, Q7-Q10 incomplete
 *   5. pilot_candidate: all confirmed and complete
 *
 * Decision 1 shows the enterprise remediation response form. Selecting an
 * option re-evaluates and re-renders the full screen, which may transition
 * to Decisions 2, 3, or 5.
 *
 * Decision 4 is the only outcome that carries an evidence label (jl-reviewed).
 */

/* ── Outcome configurations ───────────────────────────────────────────────── */

const S20_OUTCOMES = {
  remediation_required: {
    decision: {
      title:             'Jochanni Labs Decision',
      state:             'Remediation decision required',
      reason:            'A structural enforcement failure exists, but the enterprise has not decided whether it will change the execution path.',
      required_response: 'Confirm whether the enterprise can and will correct the identified failure.',
      what_happens_next: 'The assessment closes. The enterprise may request reassessment after making the decision.',
      variant:           'neutral',
    },
  },
  not_recommended: {
    decision: {
      title:             'Jochanni Labs Decision',
      state:             'Pilot not recommended',
      reason:            'The enterprise cannot or will not create the mandatory execution boundary required by DAL-X.',
      required_response: 'None.',
      what_happens_next: 'No DAL-X pilot is proposed for this workflow.',
      variant:           'rejected',
    },
  },
  pilot_prerequisites: {
    decision: {
      title:             'Jochanni Labs Decision',
      state:             'Pilot prerequisites required',
      reason:            'The current execution path cannot enforce DAL-X, but the enterprise states that it can correct the identified failure.',
      required_response: 'Correct the failure and provide the required evidence.',
      what_happens_next: 'The assessment closes. The enterprise may request reassessment after completing the correction.',
      variant:           'pending',
    },
  },
  setup_tasks: {
    decision: {
      title:             'Jochanni Labs Decision',
      state:             'Pilot setup tasks required',
      reason:            'The execution boundary supports DAL-X, but required setup work remains incomplete.',
      required_response: 'Complete the listed setup work and provide the required evidence.',
      what_happens_next: 'The assessment closes. The enterprise may request reassessment when the work is complete.',
      variant:           'pending',
    },
  },
  pilot_candidate: {
    decision: {
      title:             'Jochanni Labs Decision',
      state:             'Pilot integration candidate',
      reason:            'Jochanni Labs reviewed a consequential execution and a complete path for the two required DAL-X integration points.',
      required_response: 'Assign the pilot business owner, authority owner, and technical owner.',
      what_happens_next: 'Jochanni Labs prepares the shadow mode plan and acceptance tests.',
      variant:           'accepted',
    },
    evidenceLabel: 'jl-reviewed',
  },
};

/* ── Remediation response options ─────────────────────────────────────────── */

const S20_REMEDIATION_OPTIONS = [
  { value: 'will_correct',      label: 'We can and will correct it.'     },
  { value: 'cannot_correct',    label: 'We cannot correct it.'           },
  { value: 'will_not_correct',  label: 'We will not correct it.'         },
  { value: 'more_investigation',label: 'More investigation is required.' },
];

/* ── Evaluation engine ────────────────────────────────────────────────────── */

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
    /* null or 'more_investigation' → stay at Decision 1 */
    return 'remediation_required';
  }

  if (techResult === 'implementation_work') return 'setup_tasks';
  if (techResult === 'supports_integration') return 'pilot_candidate';

  /* Catch-all: incomplete, null, or unknown technical result */
  return 'remediation_required';
}

/* ── Form field builders ──────────────────────────────────────────────────── */

function buildTextFormField(id, labelText, stateKey, type) {
  const group = document.createElement('div');
  group.className = 'form-group';

  const lbl = document.createElement('label');
  lbl.className = 'form-label';
  lbl.setAttribute('for', id);
  lbl.textContent = labelText;
  group.appendChild(lbl);

  let input;
  if (type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 3;
  } else {
    input = document.createElement('input');
    input.type = 'text';
  }
  input.className   = 'form-control';
  input.id          = id;

  const saved = getState(stateKey);
  if (saved) input.value = saved;
  input.addEventListener('input', () => setState(stateKey, input.value));

  group.appendChild(input);
  return group;
}

/* ── Additional content per decision ─────────────────────────────────────── */

function buildRemediationForm() {
  const section = document.createElement('div');
  section.style.marginTop = 'var(--space-6)';

  const sectionLbl = document.createElement('p');
  sectionLbl.className = 'section-label';
  sectionLbl.style.marginBottom = 'var(--space-3)';
  sectionLbl.textContent = 'Enterprise remediation response';
  section.appendChild(sectionLbl);

  const radioWrap = document.createElement('div');
  radioWrap.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-3);';

  const saved = getState('jl.enterprise_remediation_response');

  S20_REMEDIATION_OPTIONS.forEach(opt => {
    const lbl = document.createElement('label');
    lbl.style.cssText =
      'display:inline-flex;align-items:center;gap:var(--space-2);'
      + 'cursor:pointer;font-size:var(--text-sm);';

    const radio = document.createElement('input');
    radio.type    = 'radio';
    radio.name    = 's20-remediation';
    radio.value   = opt.value;
    radio.checked = (saved === opt.value);
    radio.addEventListener('change', () => {
      setState('jl.enterprise_remediation_response', opt.value);
      renderScreen20();
    });

    lbl.appendChild(radio);
    lbl.appendChild(document.createTextNode(opt.label));
    radioWrap.appendChild(lbl);
  });
  section.appendChild(radioWrap);

  /* Spec-required notice */
  const note = document.createElement('div');
  note.className = 'callout callout--info';
  note.style.marginTop = 'var(--space-4)';
  note.textContent =
    'Jochanni Labs does not track the investigation or pursue the enterprise for an answer.';
  section.appendChild(note);

  return section;
}

function buildPrerequisiteRecordForm() {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginTop = 'var(--space-6)';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'card__title';
  cardTitle.textContent = 'Prerequisite record';
  card.appendChild(cardTitle);

  card.appendChild(buildTextFormField(
    's20-req-correction', 'Required correction',
    'jl.prerequisite_record.required_correction', 'textarea'));

  const hr1 = document.createElement('hr'); hr1.className = 'divider';
  card.appendChild(hr1);
  card.appendChild(buildTextFormField(
    's20-resp-role', 'Responsible enterprise role',
    'jl.prerequisite_record.responsible_role', 'text'));

  const hr2 = document.createElement('hr'); hr2.className = 'divider';
  card.appendChild(hr2);
  card.appendChild(buildTextFormField(
    's20-evidence-prereq', 'Evidence required for reassessment',
    'jl.prerequisite_record.evidence_required', 'textarea'));

  /* Spec-required scope notice */
  const scopeNote = document.createElement('div');
  scopeNote.className = 'callout callout--info';
  scopeNote.style.marginTop = 'var(--space-4)';
  const scopeLines = [
    'The prerequisite record does not include:',
    'A target completion date',
    'Ongoing status',
    'Follow-up assignments for Jochanni Labs',
    'Remediation project management',
  ];
  scopeNote.textContent = scopeLines.join('\n');
  card.appendChild(scopeNote);

  return card;
}

function buildSetupRecordForm() {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginTop = 'var(--space-6)';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'card__title';
  cardTitle.textContent = 'Setup record';
  card.appendChild(cardTitle);

  card.appendChild(buildTextFormField(
    's20-setup-work', 'Required setup work',
    'jl.setup_record.required_work', 'textarea'));

  const hr1 = document.createElement('hr'); hr1.className = 'divider';
  card.appendChild(hr1);
  card.appendChild(buildTextFormField(
    's20-setup-role', 'Responsible enterprise role',
    'jl.setup_record.responsible_role', 'text'));

  const hr2 = document.createElement('hr'); hr2.className = 'divider';
  card.appendChild(hr2);
  card.appendChild(buildTextFormField(
    's20-evidence-setup', 'Evidence required for reassessment',
    'jl.setup_record.evidence_required', 'textarea'));

  /* Spec-required scope notice */
  const scopeNote = document.createElement('div');
  scopeNote.className = 'callout callout--info';
  scopeNote.style.marginTop = 'var(--space-4)';
  scopeNote.textContent =
    'Jochanni Labs does not track the work before a paid pilot begins.';
  card.appendChild(scopeNote);

  return card;
}

function buildPilotOwnerForm() {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginTop = 'var(--space-6)';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'card__title';
  cardTitle.textContent = 'Pilot owner assignments';
  card.appendChild(cardTitle);

  card.appendChild(buildTextFormField(
    's20-biz-owner', 'Pilot business owner',
    'jl.pilot_business_owner', 'text'));

  const hr1 = document.createElement('hr'); hr1.className = 'divider';
  card.appendChild(hr1);
  card.appendChild(buildTextFormField(
    's20-auth-owner', 'Pilot authority owner',
    'jl.pilot_authority_owner', 'text'));

  const hr2 = document.createElement('hr'); hr2.className = 'divider';
  card.appendChild(hr2);
  card.appendChild(buildTextFormField(
    's20-tech-owner', 'Pilot technical owner',
    'jl.pilot_technical_owner', 'text'));

  return card;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen20() {
  const decisionKey = evaluatePilotDecision();
  setState('jl.decision', decisionKey);

  const cfg    = S20_OUTCOMES[decisionKey];
  const screen = document.getElementById('screen-20');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Jochanni Labs Review';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Jochanni Labs Decision';
  screen.appendChild(title);

  /* Subtitle */
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent = 'Pilot candidacy decision based on the complete assessment.';
  screen.appendChild(subtitle);

  /* Decision block */
  screen.appendChild(createDecisionBlock(cfg.decision));

  /* Additional content per decision */
  if (decisionKey === 'remediation_required') {
    screen.appendChild(buildRemediationForm());
  } else if (decisionKey === 'pilot_prerequisites') {
    screen.appendChild(buildPrerequisiteRecordForm());
  } else if (decisionKey === 'setup_tasks') {
    screen.appendChild(buildSetupRecordForm());
  } else if (decisionKey === 'pilot_candidate') {
    screen.appendChild(buildPilotOwnerForm());
  }

  /* Evidence label: Decision 4 only */
  if (cfg.evidenceLabel) {
    const evidenceLine = document.createElement('p');
    evidenceLine.style.cssText =
      'margin-top:var(--space-5);font-size:var(--text-sm);'
      + 'color:var(--color-text-secondary);';
    evidenceLine.appendChild(document.createTextNode('Evidence: '));
    evidenceLine.appendChild(createEvidenceLabel(cfg.evidenceLabel));
    screen.appendChild(evidenceLine);
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
    if (typeof renderScreen21 === 'function') renderScreen21();
    showScreen('screen-21');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen20);
