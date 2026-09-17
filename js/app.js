/* ─── Screen router ──────────────────────────────────────────────────────── */

const screenHistory = [];

function showScreen(id, addToHistory = true) {
  const current = document.querySelector('.screen.active');
  if (addToHistory && current) {
    screenHistory.push(current.id);
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
}

function goBack() {
  if (screenHistory.length > 0) {
    const prev = screenHistory.pop();
    showScreen(prev, false);
  }
}

/* ─── Session state ──────────────────────────────────────────────────────── */
/*
 * Single in-memory object for all 21 screens. Field names match spec
 * terminology exactly. Custom dropdown text is always stored separately
 * from the standard selection (stateKey vs. customStateKey convention).
 *
 * Key cross-screen dependency:
 *   s3.trigger_outcome → read by Screen 16 Q2 to determine not_applicable
 */

const sessionState = {

  /* ── Surface 1: Public Demonstration ──────────────────────────────────── */
  s1: {
    example:            'infrastructure',  // chosen example key (default)
    agent:              '',
    action:             '',
    target:             '',
    scope:              '',
    consequence:        '',
    required_authority: '',
  },

  /* ── Surface 2: Guided Business Assessment ─────────────────────────────── */
  s2: {
    // Dropdown: AI agent
    agent_type:                    '',  // standard value or 'not_sure' | 'custom'
    agent_type_custom:             '',  // free text when agent_type === 'custom'

    // Dropdown: Proposed execution
    proposed_execution:            '',
    proposed_execution_custom:     '',

    // Dropdown: Downstream system
    downstream_system:             '',  // may be 'none' = No downstream system
    downstream_system_custom:      '',

    // Multi-select: Consequence (stores array; 'none' = No consequential effect)
    consequences:                  [],
    consequences_custom:           '',

    // Dropdown: Missing authority response (no custom / not-sure; 3 fixed options)
    // 'must_stop' | 'may_continue' | 'unknown'
    missing_authority_response:    '',

    // Screen 8 outcome
    // 'potential_use_case' | 'enforcement_not_established' |
    // 'more_info_required' | 'not_required'
    business_result:               null,
  },

  /* ── Surface 3: Configured DAL-X Simulation ───────────────────────────── */
  s3: {
    // Screen 9: enterprise policy → mapped to DAL-X rule types by Jochanni Labs
    trigger_rules: {
      actions_permitted:        '',
      actions_standard_review:  '',
      actions_lead_review:      '',
      actions_blocked:          '',
      standard_reviewer_role:   '',
      lead_reviewer_role:       '',
      policy_reference:         '',
      required_metadata:        '',
    },

    // Screen 10: DAL-X submission fields (spec field names preserved)
    submission: {
      submitter:         '',
      output_content:    '',
      input_context:     '',  // optional
      action:            '',  // execution_intent.action
      target:            '',  // execution_intent.target
      source_identifier: '',
      idempotency_key:   '',
      metadata:          '',
    },

    // Screen 11: trigger evaluation result
    // 'auto_approve' | 'needs_review' | 'high_risk' | 'blocked'
    // null = not yet evaluated
    trigger_outcome: null,

    trigger_details: {
      rules_evaluated:        0,
      rules_matched:          0,
      controlling_rule:       '',
      exact_match:            '',
      policy_reference:       '',
      required_reviewer_level:'',
    },

    // Screen 12: reviewer decision
    // 'approved' | 'denied' | 'escalated' | 'revision_requested'
    reviewer_decision: null,

    // Screen 13: authorization record
    authorization_id:      null,   // masked UUID displayed; full value used in gate tests
    authorization_issued:  null,   // ISO timestamp
    authorization_expires: null,   // ISO timestamp (issued + 15 min)

    // Screen 14: gate test results
    // Array of 6 objects, one per scenario, populated when Screen 14 renders:
    // { scenario, decision, reason, execution_allowed, receipt_id,
    //   required_response, what_happens_next }
    gate_tests: [],
  },

  /* ── Surface 4: Technical Review ──────────────────────────────────────── */
  s4: {
    // Structural questions (confirmed 'no'/'neither' = hard blocker)
    q1:  null,  // yes | no | unknown
    q2:  null,  // yes | no | unknown | not_applicable  (conditional on trigger_outcome)
    q3:  null,  // webhook | polling | either | neither | unknown
    q4:  null,  // yes | no | unknown
    q5:  null,  // yes | no | unknown
    q6:  null,  // yes | no | unknown

    // Implementation questions ('no' = work required, not disqualifying)
    q7:  null,  // yes | no | unknown
    q8:  null,  // yes | no | unknown
    q9:  null,  // yes | no | unknown
    q10: null,  // yes | no | unknown

    // Screen 18 outcome
    // 'structural_failure' | 'incomplete' | 'implementation_work' |
    // 'supports_integration'
    technical_result: null,

    // Which structural question(s) returned a blocking answer (e.g. ['q4'])
    structural_blockers: [],
  },

  /* ── Jochanni Labs Review ──────────────────────────────────────────────── */
  jl: {
    // Screen 19: review of 10 integration items
    // Each: 'confirmed' | 'more_info' | 'correction_required' | 'not_applicable'
    review: {
      submission_point:   null,
      pending_execution:  null,
      webhook_polling:    null,
      enforcement_point:  null,
      blocking_behavior:  null,
      bypass_paths:       null,
      field_mapping:      null,
      api_key_storage:    null,
      data_handling:      null,
      downstream_result:  null,
    },

    // Screen 20: pilot decision
    // 'remediation_required' | 'pilot_prerequisites' | 'setup_tasks' |
    // 'pilot_candidate' | 'not_recommended'
    decision: null,

    // Screen 20 Decision 1: enterprise response to structural failure
    // 'will_correct' | 'cannot_correct' | 'will_not_correct' | 'more_investigation'
    enterprise_remediation_response: null,

    // Screen 20 Decision 2: prerequisite record (structural failure that enterprise will fix)
    // Spec: contains only these 3 fields — no target dates, no follow-up assignments
    prerequisite_record: {
      required_correction: '',
      responsible_role:    '',
      evidence_required:   '',
    },

    // Screen 20 Decision 3: setup record (boundary confirmed but implementation incomplete)
    // Spec: contains only these 3 fields — Jochanni Labs does not track before paid pilot
    setup_record: {
      required_work:    '',
      responsible_role: '',
      evidence_required:'',
    },

    // Screen 20 Decision 4: pilot owner assignments
    pilot_business_owner:   '',
    pilot_authority_owner:  '',
    pilot_technical_owner:  '',
  },
};

/* ─── State helpers ──────────────────────────────────────────────────────── */

/*
 * setState('s3.trigger_outcome', 'needs_review')
 * Supports arbitrary dot-path depth.
 */
function setState(path, value) {
  const keys = path.split('.');
  let obj = sessionState;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
}

/*
 * getState('s3.trigger_outcome')  →  'needs_review'
 * Returns undefined for unknown paths rather than throwing.
 */
function getState(path) {
  const keys = path.split('.');
  let obj = sessionState;
  for (const key of keys) {
    if (obj == null) return undefined;
    obj = obj[key];
  }
  return obj;
}

/* ─── Reset helpers ──────────────────────────────────────────────────────── */

/*
 * resetSurface1()
 * Called by Screen 6 "Replay demonstration" — clears s1 back to defaults
 * and resets the screen history so Back does not re-enter the demo mid-flow.
 */
function resetSurface1() {
  sessionState.s1 = {
    example:            'infrastructure',
    agent:              '',
    action:             '',
    target:             '',
    scope:              '',
    consequence:        '',
    required_authority: '',
  };
  screenHistory.length = 0;
}

/*
 * resetAll()
 * Full reset used if a new assessment is started from scratch.
 * Preserves the object reference so any cached handles stay valid.
 */
function resetAll() {
  /* Surface 1 */
  Object.assign(sessionState.s1, {
    example: 'infrastructure', agent: '', action: '',
    target: '', scope: '', consequence: '', required_authority: '',
  });

  /* Surface 2 */
  Object.assign(sessionState.s2, {
    agent_type: '', agent_type_custom: '',
    proposed_execution: '', proposed_execution_custom: '',
    downstream_system: '', downstream_system_custom: '',
    consequences: [], consequences_custom: '',
    missing_authority_response: '',
    business_result: null,
  });

  /* Surface 3 */
  Object.assign(sessionState.s3.trigger_rules, {
    actions_permitted: '', actions_standard_review: '',
    actions_lead_review: '', actions_blocked: '',
    standard_reviewer_role: '', lead_reviewer_role: '',
    policy_reference: '', required_metadata: '',
  });
  Object.assign(sessionState.s3.submission, {
    submitter: '', output_content: '', input_context: '',
    action: '', target: '', source_identifier: '',
    idempotency_key: '', metadata: '',
  });
  Object.assign(sessionState.s3.trigger_details, {
    rules_evaluated: 0, rules_matched: 0, controlling_rule: '',
    exact_match: '', policy_reference: '', required_reviewer_level: '',
  });
  Object.assign(sessionState.s3, {
    trigger_outcome: null, reviewer_decision: null,
    authorization_id: null, authorization_issued: null,
    authorization_expires: null, gate_tests: [],
  });

  /* Surface 4 */
  Object.assign(sessionState.s4, {
    q1: null, q2: null, q3: null, q4: null, q5: null,
    q6: null, q7: null, q8: null, q9: null, q10: null,
    technical_result: null, structural_blockers: [],
  });

  /* Jochanni Labs */
  Object.assign(sessionState.jl.review, {
    submission_point: null, pending_execution: null,
    webhook_polling: null, enforcement_point: null,
    blocking_behavior: null, bypass_paths: null,
    field_mapping: null, api_key_storage: null,
    data_handling: null, downstream_result: null,
  });
  Object.assign(sessionState.jl.prerequisite_record, {
    required_correction: '', responsible_role: '', evidence_required: '',
  });
  Object.assign(sessionState.jl.setup_record, {
    required_work: '', responsible_role: '', evidence_required: '',
  });
  Object.assign(sessionState.jl, {
    decision: null,
    enterprise_remediation_response: null,
    pilot_business_owner: '',
    pilot_authority_owner: '',
    pilot_technical_owner: '',
  });

  screenHistory.length = 0;
}

/* ─── Init ───────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  showScreen('screen-1', false);
});
