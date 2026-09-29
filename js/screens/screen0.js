/* ─── Screen 0: Immersive Landing ─────────────────────────────────────────
 * Cinematic entry point for DAL-X-EXEC. Composed of six vertical acts:
 *   1. Hero (viewport-height statement)
 *   2. The Problem (three glass alert cards, live pulse indicators)
 *   3. The Solution (Agent → DAL-X Wedge → Downstream chain)
 *   4. How It Works (three-step glassmorphic cards)
 *   5. The Proof (verifiable authority record statement + evidence badges)
 *   6. Final CTA
 *
 * Preserves all downstream routing: primary CTAs → screen-1 (demo)
 * and screen-7 (assessment). Business logic in the rest of the app is
 * unchanged.
 */

function renderScreen0() {
  const screen = document.getElementById('screen-0');
  if (!screen) return;
  screen.innerHTML = '';

  screen.appendChild(buildHero());
  screen.appendChild(buildProblemSection());
  screen.appendChild(buildSolutionSection());
  screen.appendChild(buildHowItWorksSection());
  screen.appendChild(buildProofSection());
  screen.appendChild(buildPositioningNote());
  screen.appendChild(buildFinalCTA());

  observeAnimations(screen);
}

/* ─── Hero ────────────────────────────────────────────────────────────── */

function buildHero() {
  const hero = document.createElement('section');
  hero.className = 'immersive-hero';

  /* Shield / logo mark */
  const shield = document.createElement('div');
  shield.className = 'immersive-hero__shield';
  shield.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-3z"
            stroke="#F97316" stroke-width="1.8" stroke-linejoin="round"
            fill="rgba(249,115,22,0.12)"/>
      <path d="M8 12l3 3 5-6"
            stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  hero.appendChild(shield);

  const eyebrow = document.createElement('div');
  eyebrow.className = 'immersive-hero__eyebrow animate-in';
  eyebrow.textContent = 'DAL-X · Decision Authority Layer';
  hero.appendChild(eyebrow);

  const title = document.createElement('h1');
  title.className = 'immersive-hero__title animate-in';
  title.innerHTML = `
    Your AI agents are executing.
    <span class="immersive-hero__title-line-2">Who authorized them?</span>
  `;
  hero.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'immersive-hero__subtitle animate-in';
  subtitle.style.setProperty('--delay', '0.2s');
  subtitle.textContent =
    'DAL-X is the enforcement gate between what consequential AI agents propose '
    + 'and what downstream systems execute. Not for every agent. '
    + 'For agents that move money, modify infrastructure, or commit your enterprise to action. '
    + 'No authority, no execution.';
  hero.appendChild(subtitle);

  const ctas = document.createElement('div');
  ctas.className = 'immersive-hero__ctas animate-in';
  ctas.style.setProperty('--delay', '0.4s');

  const primary = document.createElement('button');
  primary.className = 'btn btn--primary btn--lg';
  primary.textContent = 'See the Demo';
  primary.addEventListener('click', () => showScreen('screen-1'));
  ctas.appendChild(primary);

  const secondary = document.createElement('button');
  secondary.className = 'btn btn--hero-ghost btn--lg';
  secondary.textContent = 'Request Assessment';
  secondary.addEventListener('click', () => showScreen('screen-7'));
  ctas.appendChild(secondary);

  hero.appendChild(ctas);

  const scrollIndicator = document.createElement('div');
  scrollIndicator.className = 'scroll-indicator';
  scrollIndicator.innerHTML = `
    <span>Scroll</span>
    <span class="scroll-indicator__arrow"></span>
  `;
  hero.appendChild(scrollIndicator);

  return hero;
}

/* ─── The Problem ─────────────────────────────────────────────────────── */

function buildProblemSection() {
  const section = document.createElement('section');
  section.className = 'immersive-section';

  const headline = document.createElement('h2');
  headline.className = 'immersive-section__headline animate-in';
  headline.innerHTML =
    `When an auditor asks <em>"who authorized this"</em>, there is no answer.`;
  section.appendChild(headline);

  const incidents = [
    {
      agent: 'Treasury Agent',
      body:  '$2.4M wire initiated. No authority record exists.',
    },
    {
      agent: 'Infrastructure Agent',
      body:  'Production database schema modified. No approval chain.',
    },
    {
      agent: 'Procurement Agent',
      body:  'Vendor contract committed. No review completed.',
    },
  ];

  const grid = document.createElement('div');
  grid.className = 'alert-grid';

  incidents.forEach((inc, i) => {
    const card = document.createElement('div');
    card.className = 'alert-card animate-in animate-stagger';
    card.style.setProperty('--delay', `${0.1 + i * 0.15}s`);

    const pulse = document.createElement('span');
    pulse.className = 'alert-card__pulse';
    card.appendChild(pulse);

    const label = document.createElement('div');
    label.className = 'alert-card__label';
    label.textContent = inc.agent;
    card.appendChild(label);

    const body = document.createElement('div');
    body.className = 'alert-card__body';
    body.textContent = inc.body;
    card.appendChild(body);

    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

/* ─── The Solution ────────────────────────────────────────────────────── */

function buildSolutionSection() {
  const section = document.createElement('section');
  section.className = 'immersive-section';

  const headline = document.createElement('h2');
  headline.className = 'immersive-section__headline animate-in';
  headline.innerHTML =
    `DAL-X sits between what agents <em>propose</em> and what systems <em>execute</em>.`;
  section.appendChild(headline);

  const chain = document.createElement('div');
  chain.className = 'authority-chain animate-in';
  chain.style.setProperty('--delay', '0.2s');

  chain.appendChild(buildChainNode('Agent',           'Proposes action',    false));
  chain.appendChild(buildChainConnector());
  chain.appendChild(buildChainNode('DAL-X Wedge',     'Enforces authority', true));
  chain.appendChild(buildChainConnector(true));
  chain.appendChild(buildChainNode('Downstream',      'Executes on token',  false));

  section.appendChild(chain);
  return section;
}

function buildChainNode(title, sub, isWedge) {
  const node = document.createElement('div');
  node.className = 'chain-node' + (isWedge ? ' chain-node--wedge' : '');
  const t = document.createElement('div');
  t.className = 'chain-node__title';
  t.textContent = title;
  const s = document.createElement('div');
  s.className = 'chain-node__sub';
  s.textContent = sub;
  node.appendChild(t);
  node.appendChild(s);
  return node;
}
function buildChainConnector(after) {
  const c = document.createElement('div');
  c.className = 'chain-connector' + (after ? ' chain-connector--after' : '');
  return c;
}

/* ─── How It Works ─────────────────────────────────────────────────────── */

function buildHowItWorksSection() {
  const section = document.createElement('section');
  section.className = 'immersive-section';

  const headline = document.createElement('h2');
  headline.className = 'immersive-section__headline animate-in';
  headline.textContent = 'How it works';
  section.appendChild(headline);

  const steps = [
    {
      num:   '1',
      label: 'Intercept',
      desc:  'The agent submits its proposed execution to DAL-X before acting. '
           + 'DAL-X evaluates it against enterprise-specific trigger rules.',
    },
    {
      num:   '2',
      label: 'Authorize',
      desc:  'DAL-X evaluates the action, routes for human review when required, '
           + 'and issues a signed single-use execution token on approval.',
    },
    {
      num:   '3',
      label: 'Enforce',
      desc:  'The downstream system validates the token before executing. '
           + 'No valid token, no execution. Every outcome is recorded.',
    },
  ];

  const grid = document.createElement('div');
  grid.className = 'steps-3col';

  steps.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'step-glass animate-in animate-stagger';
    card.style.setProperty('--delay', `${0.15 + i * 0.15}s`);

    const num = document.createElement('div');
    num.className = 'step-glass__num';
    num.textContent = s.num;
    card.appendChild(num);

    const label = document.createElement('div');
    label.className = 'step-glass__label';
    label.textContent = s.label;
    card.appendChild(label);

    const desc = document.createElement('div');
    desc.className = 'step-glass__desc';
    desc.textContent = s.desc;
    card.appendChild(desc);

    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

/* ─── The Proof ───────────────────────────────────────────────────────── */

function buildProofSection() {
  const section = document.createElement('section');
  section.className = 'proof-statement animate-in';

  const text = document.createElement('div');
  text.className = 'proof-statement__text';
  text.innerHTML =
    `Every governed execution produces a <em>verifiable authority record</em>.`;
  section.appendChild(text);

  const badges = document.createElement('div');
  badges.className = 'proof-badges';

  ['demonstrated', 'business', 'technical', 'jl-reviewed', 'proven']
    .forEach((type, i) => {
      const label = createEvidenceLabel(type);
      label.classList.add('animate-in', 'animate-stagger');
      label.style.setProperty('--delay', `${0.1 + i * 0.12}s`);
      badges.appendChild(label);
    });

  section.appendChild(badges);
  return section;
}

/* ─── Positioning note ────────────────────────────────────────────────── */

function buildPositioningNote() {
  const section = document.createElement('section');
  section.className = 'immersive-section';
  section.style.paddingTop = '0';

  const note = document.createElement('div');
  note.className = 'positioning-note animate-in';
  note.innerHTML =
    `<strong>DAL-X is not for all AI agents.</strong> `
    + `It governs consequential AI agents: those registered to enterprise systems that move money, `
    + `modify infrastructure, execute contracts, or take other actions your organization is held accountable for. `
    + `DAL-X checks whether the enterprise authorized that execution before the downstream system proceeds. `
    + `It does not evaluate model reasoning or intent.`;
  section.appendChild(note);

  return section;
}

/* ─── Final CTA ───────────────────────────────────────────────────────── */

function buildFinalCTA() {
  const section = document.createElement('section');
  section.className = 'final-cta animate-in';

  const title = document.createElement('div');
  title.className = 'final-cta__title';
  title.textContent = 'Ready to see DAL-X in action?';
  section.appendChild(title);

  const actions = document.createElement('div');
  actions.className = 'final-cta__actions';

  const primary = document.createElement('button');
  primary.className = 'btn btn--primary btn--lg';
  primary.textContent = 'Start the Demonstration';
  primary.addEventListener('click', () => showScreen('screen-1'));
  actions.appendChild(primary);

  const secondary = document.createElement('button');
  secondary.className = 'final-cta__secondary';
  secondary.textContent = 'Request a Guided Assessment →';
  secondary.addEventListener('click', () => showScreen('screen-7'));
  actions.appendChild(secondary);

  section.appendChild(actions);
  return section;
}

/* ─── Reveal-on-scroll wiring ─────────────────────────────────────────── */

function observeAnimations(root) {
  const targets = root.querySelectorAll('.animate-in');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(t => io.observe(t));
}

document.addEventListener('DOMContentLoaded', renderScreen0);
