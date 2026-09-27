/* ─── Screen 19: Jochanni Labs review ───────────────────────────────────── */

/*
 * Jochanni Labs reviews ten integration items and assigns one of four
 * dispositions to each. All ten dispositions are written to jl.review.*.
 */

/* ── Review item definitions ──────────────────────────────────────────────── */

const S19_ITEMS = [
  { id: 's19-1',  stateKey: 'jl.review.submission_point',  label: 'Submission point'             },
  { id: 's19-2',  stateKey: 'jl.review.pending_execution', label: 'Pending execution handling'   },
  { id: 's19-3',  stateKey: 'jl.review.webhook_polling',   label: 'Webhook or polling method'    },
  { id: 's19-4',  stateKey: 'jl.review.enforcement_point', label: 'Downstream enforcement point' },
  { id: 's19-5',  stateKey: 'jl.review.blocking_behavior', label: 'Blocking behavior'            },
  { id: 's19-6',  stateKey: 'jl.review.bypass_paths',      label: 'Reported bypass paths'        },
  { id: 's19-7',  stateKey: 'jl.review.field_mapping',     label: 'Submission field mapping'     },
  { id: 's19-8',  stateKey: 'jl.review.api_key_storage',   label: 'API key storage'              },
  { id: 's19-9',  stateKey: 'jl.review.data_handling',     label: 'Data handling'                },
  { id: 's19-10', stateKey: 'jl.review.downstream_result', label: 'Downstream result recording'  },
];

const S19_OPTIONS = [
  { value: 'confirmed',           label: 'Confirmed for pilot planning', tone: 'green' },
  { value: 'more_info',           label: 'More information required',    tone: 'amber' },
  { value: 'correction_required', label: 'Correction required',          tone: 'red'   },
  { value: 'not_applicable',      label: 'Not applicable',               tone: 'slate' },
];

/* ── Review item card builder ────────────────────────────────────────────── */

function s19BuildReviewItem(cfg, index, onChange) {
  const card = document.createElement('div');
  card.className = 'jl-review-card';

  const head = document.createElement('div');
  head.className = 'jl-review-card__head';

  const numBadge = document.createElement('span');
  numBadge.className = 'jl-review-card__num';
  numBadge.textContent = String(index + 1);
  head.appendChild(numBadge);

  const labelEl = document.createElement('span');
  labelEl.className = 'jl-review-card__label';
  labelEl.textContent = cfg.label;
  head.appendChild(labelEl);

  card.appendChild(head);

  const options = document.createElement('div');
  options.className = 'jl-disp-options';
  options.setAttribute('role', 'radiogroup');
  options.setAttribute('aria-label', cfg.label);

  const saved = getState(cfg.stateKey);
  const buttons = [];

  S19_OPTIONS.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'jl-disp-option jl-disp-option--' + opt.tone;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(saved === opt.value));
    if (saved === opt.value) btn.classList.add('is-selected');
    btn.textContent = opt.label;

    btn.addEventListener('click', () => {
      setState(cfg.stateKey, opt.value);
      buttons.forEach(other => {
        const on = other === btn;
        other.classList.toggle('is-selected', on);
        other.classList.toggle('is-dimmed', !on);
        other.setAttribute('aria-checked', String(on));
      });
      if (typeof onChange === 'function') onChange();
    });

    buttons.push(btn);
    options.appendChild(btn);
  });

  /* Apply dim state if a selection already exists */
  if (saved) {
    buttons.forEach(btn => {
      if (!btn.classList.contains('is-selected')) btn.classList.add('is-dimmed');
    });
  }

  card.appendChild(options);
  return card;
}

/* ── Progress helpers ────────────────────────────────────────────────────── */

function s19CountReviewed() {
  let n = 0;
  S19_ITEMS.forEach(item => {
    if (getState(item.stateKey)) n++;
  });
  return n;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen19() {
  const screen = document.getElementById('screen-19');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Jochanni Labs review';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Jochanni Labs review';
  screen.appendChild(title);

  /* Notice */
  const notice = document.createElement('div');
  notice.className = 'callout callout--info';
  notice.style.marginBottom = 'var(--space-6)';
  notice.textContent =
    'Jochanni Labs reviews the reported answers alongside your technical team, '
    + 'confirms what is ready, and identifies gaps before pilot planning.';
  screen.appendChild(notice);

  /* Progress row */
  const progWrap = document.createElement('div');
  progWrap.className = 'jl-review-progress';

  const progBar = document.createElement('div');
  progBar.className = 'jl-review-progress__bar';
  const progFill = document.createElement('div');
  progFill.className = 'jl-review-progress__fill';
  progBar.appendChild(progFill);
  progWrap.appendChild(progBar);

  const progLabel = document.createElement('span');
  progLabel.className = 'jl-review-progress__label';
  progWrap.appendChild(progLabel);

  screen.appendChild(progWrap);

  /* Review items */
  const stack = document.createElement('div');
  stack.className = 'jl-review-stack';
  screen.appendChild(stack);

  /* Submit row (appears when 10/10) */
  const submitRow = document.createElement('div');
  submitRow.className = 'jl-review-submit';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn--primary';
  submitBtn.textContent = 'Record Jochanni Labs decision';
  submitBtn.addEventListener('click', () => {
    if (typeof renderScreen20 === 'function') renderScreen20();
    showScreen('screen-20');
  });
  submitRow.appendChild(submitBtn);
  screen.appendChild(submitRow);

  function refreshProgress() {
    const n = s19CountReviewed();
    const pct = Math.round((n / 10) * 100);
    progFill.style.width = pct + '%';
    progLabel.textContent = `${n} of 10 items reviewed`;
    submitRow.classList.toggle('is-ready', n === 10);
  }

  S19_ITEMS.forEach((cfg, i) => {
    stack.appendChild(s19BuildReviewItem(cfg, i, refreshProgress));
  });

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = 'Back';
  backBtn.addEventListener('click', () => showScreen('screen-18'));
  nav.appendChild(backBtn);

  screen.appendChild(nav);

  refreshProgress();
}

document.addEventListener('DOMContentLoaded', renderScreen19);
