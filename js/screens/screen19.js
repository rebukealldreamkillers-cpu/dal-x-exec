/* ─── Screen 19: Review the Reported Integration ────────────────────────── */

/*
 * Jochanni Labs reviews ten integration items and assigns one of four
 * decisions to each. All ten decisions are written to jl.review.*.
 *
 * Decision options (display label → stored value):
 *   Confirmed for pilot planning → 'confirmed'
 *   More information required    → 'more_info'
 *   Correction required          → 'correction_required'
 *   Not applicable               → 'not_applicable'
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
  { value: 'confirmed',           label: 'Confirmed for pilot planning' },
  { value: 'more_info',           label: 'More information required'    },
  { value: 'correction_required', label: 'Correction required'          },
  { value: 'not_applicable',      label: 'Not applicable'               },
];

/* ── Review item builder ──────────────────────────────────────────────────── */

function buildReviewItem(cfg) {
  const group = document.createElement('div');
  group.className = 'form-group';

  const labelEl = document.createElement('div');
  labelEl.className = 'form-label';
  labelEl.textContent = cfg.label;
  group.appendChild(labelEl);

  const radioWrap = document.createElement('div');
  radioWrap.style.cssText =
    'display:flex;flex-wrap:wrap;gap:var(--space-3);margin-top:var(--space-2);';

  const saved = getState(cfg.stateKey);

  S19_OPTIONS.forEach(opt => {
    const lbl = document.createElement('label');
    lbl.style.cssText =
      'display:inline-flex;align-items:center;gap:var(--space-2);'
      + 'cursor:pointer;font-size:var(--text-sm);';

    const radio = document.createElement('input');
    radio.type    = 'radio';
    radio.name    = cfg.id;
    radio.value   = opt.value;
    radio.checked = (saved === opt.value);
    radio.addEventListener('change', () => setState(cfg.stateKey, opt.value));

    lbl.appendChild(radio);
    lbl.appendChild(document.createTextNode(opt.label));
    radioWrap.appendChild(lbl);
  });

  group.appendChild(radioWrap);
  return group;
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */

function renderScreen19() {
  const screen = document.getElementById('screen-19');
  screen.innerHTML = '';

  /* Surface badge */
  const badge = document.createElement('div');
  badge.className = 'surface-badge';
  badge.textContent = 'Jochanni Labs Review';
  screen.appendChild(badge);

  /* Title */
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Review the Reported Integration';
  screen.appendChild(title);

  /* Operator notice */
  const notice = document.createElement('div');
  notice.className = 'callout callout--info';
  notice.style.marginBottom = 'var(--space-6)';
  notice.textContent =
    'This screen is operated by Jochanni Labs. '
    + 'Jochanni Labs reviews each integration item and assigns a decision for pilot planning.';
  screen.appendChild(notice);

  /* Review items card */
  const card = document.createElement('div');
  card.className = 'card';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'card__title';
  cardTitle.textContent = 'Jochanni Labs reviews:';
  card.appendChild(cardTitle);

  S19_ITEMS.forEach((cfg, i) => {
    if (i > 0) {
      const hr = document.createElement('hr');
      hr.className = 'divider';
      card.appendChild(hr);
    }
    card.appendChild(buildReviewItem(cfg));
  });

  screen.appendChild(card);

  /* Nav */
  const nav = document.createElement('nav');
  nav.className = 'screen-nav';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn--ghost';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => showScreen('screen-18'));
  nav.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = 'Next →';
  nextBtn.addEventListener('click', () => {
    if (typeof renderScreen20 === 'function') renderScreen20();
    showScreen('screen-20');
  });
  nav.appendChild(nextBtn);

  screen.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', renderScreen19);
