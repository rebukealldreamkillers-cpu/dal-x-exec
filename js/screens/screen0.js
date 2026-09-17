/* ─── Screen 0: Intro / Landing ──────────────────────────────────────────── */

function renderScreen0() {
  const screen = document.getElementById('screen-0');
  screen.innerHTML = '';

  /* ── Hero panel ───────────────────────────────────────────────────────── */
  const hero = document.createElement('div');
  hero.className = 'hero-panel';

  /* Hero meme image — full width at top of panel */
  const heroImg = document.createElement('img');
  heroImg.src = 'images/dal-hero.png';
  heroImg.alt = 'DAL-X: Consequential AI actions. Authority before execution.';
  heroImg.className = 'hero-panel__image';
  hero.appendChild(heroImg);

  /* Dark body below the hero image */
  const heroBody = document.createElement('div');
  heroBody.className = 'hero-panel__body';

  /* Logo + wordmark */
  const logoWrap = document.createElement('div');
  logoWrap.className = 'hero-logo';
  logoWrap.innerHTML = `
    <img src="images/dal-logo.jpg" alt="DAL-X logo" class="hero-logo__img">
    <div>
      <div class="hero-logo__text">DAL<span class="hero-logo__x">-X</span></div>
      <div class="hero-byline">by Jochanni Labs &nbsp;·&nbsp; Decision Authority Layer — Execute</div>
    </div>
  `;
  heroBody.appendChild(logoWrap);

  /* Headline */
  const h1 = document.createElement('h1');
  h1.className = 'hero-headline';
  h1.innerHTML = 'AI agents are taking consequential actions.<br>Is each one <em>authorized</em>?';
  heroBody.appendChild(h1);

  /* Subheadline */
  const sub = document.createElement('p');
  sub.className = 'hero-subhead';
  sub.textContent =
    'DAL-X is the authorization gate between an AI agent\'s proposed execution '
    + 'and the downstream system that carries it out. This simulation shows '
    + 'how the gate works — and what it blocks.';
  heroBody.appendChild(sub);

  /* CTA */
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'btn btn--accent btn--lg';
  ctaBtn.textContent = 'See the Demo →';
  ctaBtn.addEventListener('click', () => showScreen('screen-1'));
  heroBody.appendChild(ctaBtn);

  const disclaimer = document.createElement('p');
  disclaimer.className = 'hero-disclaimer';
  disclaimer.textContent = 'No enterprise system is connected. This is a simulation only.';
  heroBody.appendChild(disclaimer);

  hero.appendChild(heroBody);
  screen.appendChild(hero);

  /* ── "What this demonstrates" ─────────────────────────────────────────── */
  const sectionLbl = document.createElement('p');
  sectionLbl.className = 'section-label';
  sectionLbl.style.marginTop = 'var(--space-6)';
  sectionLbl.textContent = 'What the public demonstration shows';
  screen.appendChild(sectionLbl);

  const behaviors = [
    {
      state: 'rejected',
      icon: '✕',
      label: 'No authorization',
      body: 'The gate rejects execution when no authorization has been obtained from DAL-X.',
    },
    {
      state: 'rejected',
      icon: '✕',
      label: 'Wrong action or target',
      body: 'An authorization for one action cannot be used to execute a different one.',
    },
    {
      state: 'accepted',
      icon: '✓',
      label: 'Valid, active authorization',
      body: 'When the matching authorization is live, the governed execution may proceed.',
    },
    {
      state: 'rejected',
      icon: '✕',
      label: 'Consumed authorization',
      body: 'A used authorization cannot be reused. Every execution requires new authority.',
    },
  ];

  const grid = document.createElement('div');
  grid.className = 'behavior-grid';

  behaviors.forEach(b => {
    const card = document.createElement('div');
    card.className = `behavior-card behavior-card--${b.state}`;

    const icon = document.createElement('div');
    icon.className = `behavior-card__icon behavior-card__icon--${b.state}`;
    icon.textContent = b.icon;

    const textWrap = document.createElement('div');
    const label = document.createElement('div');
    label.className = 'behavior-card__label';
    label.textContent = b.label;
    const desc = document.createElement('div');
    desc.className = 'behavior-card__body';
    desc.textContent = b.body;

    textWrap.appendChild(label);
    textWrap.appendChild(desc);
    card.appendChild(icon);
    card.appendChild(textWrap);
    grid.appendChild(card);
  });

  screen.appendChild(grid);

  /* ── Scope callout ───────────────────────────────────────────────────── */
  const callout = document.createElement('div');
  callout.className = 'callout callout--info';
  callout.style.marginTop = 'var(--space-2)';
  callout.textContent =
    'DAL-X controls execution, not model intent. It does not determine why an '
    + 'AI agent proposed an action. It checks whether the enterprise authorized '
    + 'that specific execution before the downstream system proceeds.';
  screen.appendChild(callout);

  /* ── Assessment card ─────────────────────────────────────────────────── */
  const assessCard = document.createElement('div');
  assessCard.className = 'card';
  assessCard.style.marginTop = 'var(--space-6)';
  assessCard.style.textAlign = 'center';
  assessCard.style.padding = 'var(--space-8)';

  const assessTitle = document.createElement('div');
  assessTitle.className = 'card__title';
  assessTitle.style.marginBottom = 'var(--space-2)';
  assessTitle.textContent = 'Does your enterprise have a consequential AI execution?';

  const assessDesc = document.createElement('p');
  assessDesc.style.fontSize = 'var(--text-sm)';
  assessDesc.style.color = 'var(--color-text-secondary)';
  assessDesc.style.marginBottom = 'var(--space-5)';
  assessDesc.textContent =
    'After the public demo, continue to a guided business assessment '
    + 'to determine whether your use case is a fit for DAL-X.';

  const assessBtn = document.createElement('button');
  assessBtn.className = 'btn btn--primary';
  assessBtn.textContent = 'Start with the Demo →';
  assessBtn.addEventListener('click', () => showScreen('screen-1'));

  assessCard.appendChild(assessTitle);
  assessCard.appendChild(assessDesc);
  assessCard.appendChild(assessBtn);
  screen.appendChild(assessCard);

  /* Brand footer */
  screen.appendChild(createBrandFooter());
}

/* Reusable brand footer — used on result screens too */
function createBrandFooter() {
  const footer = document.createElement('div');
  footer.className = 'brand-footer';

  const img = document.createElement('img');
  img.src = 'images/dal-logo.jpg';
  img.alt = 'DAL-X';
  img.className = 'brand-footer__img';

  const text = document.createElement('span');
  text.className = 'brand-footer__text';
  text.textContent = 'DAL-X by Jochanni Labs';

  footer.appendChild(img);
  footer.appendChild(text);
  return footer;
}

document.addEventListener('DOMContentLoaded', renderScreen0);
