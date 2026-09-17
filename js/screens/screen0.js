/* ─── Screen 0: Intro / Landing ──────────────────────────────────────────── */

function renderScreen0() {
  const screen = document.getElementById('screen-0');
  screen.innerHTML = '';

  /* ── Hero panel ───────────────────────────────────────────────────────── */
  const hero = document.createElement('div');
  hero.className = 'hero-panel';

  const heroBody = document.createElement('div');
  heroBody.className = 'hero-panel__body';

  const logoWrap = document.createElement('div');
  logoWrap.className = 'hero-logo';
  logoWrap.innerHTML = `
    <img src="images/dal-logo.jpg" alt="DAL-X logo" class="hero-logo__img">
    <div class="hero-logo__text">DAL<span class="hero-logo__x">-X</span></div>
    <div class="hero-byline">by Jochanni Labs &nbsp;·&nbsp; Decision Authority Layer · Execute</div>
  `;
  heroBody.appendChild(logoWrap);

  const h1 = document.createElement('h1');
  h1.className = 'hero-headline';
  h1.innerHTML = 'Your AI agents are executing.<br><em>Who authorized that?</em>';
  heroBody.appendChild(h1);

  const sub = document.createElement('p');
  sub.className = 'hero-subhead';
  sub.textContent =
    'Most enterprises have no required approval between what an AI agent '
    + 'proposes and what the downstream system executes. '
    + 'DAL-X enforces that approval.';
  heroBody.appendChild(sub);

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

  /* ── The problem ─────────────────────────────────────────────────────── */
  appendSectionLabel(screen, 'The problem', 'var(--space-8)');

  const problemHeadline = document.createElement('h2');
  problemHeadline.style.cssText =
    'font-size:var(--text-xl);font-weight:700;color:var(--color-text);'
    + 'margin-bottom:var(--space-2);line-height:1.3;';
  problemHeadline.textContent =
    'When an AI agent takes a high-stakes action, what stopped it from acting without approval?';
  screen.appendChild(problemHeadline);

  const problemSub = document.createElement('p');
  problemSub.style.cssText =
    'font-size:var(--text-sm);color:var(--color-text-secondary);'
    + 'margin-bottom:0;line-height:1.65;';
  problemSub.textContent =
    'None of these incidents required an agent to malfunction, hallucinate, or be compromised. '
    + 'Each agent operated exactly as designed. '
    + 'The enterprise had no required approval step before the downstream system executed.';
  screen.appendChild(problemSub);

  const incidents = [
    {
      tag:      'Execution without approval',
      headline: 'Treasury agent commits $2.3M in wire transfers. Finance learns hours after settlement.',
      detail:   'The agent executed vendor payments on its own. No approval was requested, no reviewer was notified, and no one could intervene before funds were committed.',
    },
    {
      tag:      'Execution without approval',
      headline: 'Infrastructure agent modifies the live API gateway. Error rate reaches 40%.',
      detail:   'A deployment agent applied a configuration change outside the approved release window. The change was not reviewed. It was not in scope. It executed anyway.',
    },
    {
      tag:      'Execution without approval',
      headline: 'Customer agent sends campaign to 1.4M contacts. Wrong segment. Cannot be recalled.',
      detail:   'An outreach agent triggered a bulk email to the full customer database instead of the intended trial cohort. Delivery was already underway before anyone was alerted.',
    },
  ];

  const incidentGrid = document.createElement('div');
  incidentGrid.className = 'incident-grid';

  incidents.forEach(inc => {
    const card = document.createElement('div');
    card.className = 'incident-card';

    const tag = document.createElement('div');
    tag.className = 'incident-card__tag';
    tag.textContent = inc.tag;

    const headline = document.createElement('div');
    headline.className = 'incident-card__headline';
    headline.textContent = inc.headline;

    const detail = document.createElement('div');
    detail.className = 'incident-card__detail';
    detail.textContent = inc.detail;

    card.appendChild(tag);
    card.appendChild(headline);
    card.appendChild(detail);
    incidentGrid.appendChild(card);
  });

  screen.appendChild(incidentGrid);

  /* ── The insight ─────────────────────────────────────────────────────── */
  const insight = document.createElement('div');
  insight.className = 'insight-panel';
  insight.innerHTML = `
    <div class="insight-panel__quote">
      <strong>These weren't AI failures. The agents weren't broken.</strong>
      Each agent did exactly what it was configured to do.<br><br>
      The enterprise had <em>no required approval</em> before execution.<br>
      No one could stop it. No record was required.<br>
      By the time anyone noticed, execution had already happened.
    </div>
  `;
  screen.appendChild(insight);

  /* ── How DAL-X addresses it ───────────────────────────────────────────── */
  appendSectionLabel(screen, 'How DAL-X addresses it');

  const steps = [
    {
      num:   '1',
      label: 'Submit',
      desc:  'Before acting, the agent submits its proposed execution to DAL-X. The downstream system waits. Nothing executes yet.',
    },
    {
      num:   '2',
      label: 'Evaluate',
      desc:  'DAL-X checks the submission against enterprise trigger rules. The result is automatic authorization, a route to a human reviewer, or an immediate block.',
    },
    {
      num:   '3',
      label: 'Enforce',
      desc:  'The downstream system calls the DAL-X enforcement endpoint before executing. No valid authorization means the execution is blocked, regardless of how the request arrived, who sent it, or what it claimed.',
    },
  ];

  const howItWorks = document.createElement('div');
  howItWorks.className = 'how-it-works';

  steps.forEach(s => {
    const item = document.createElement('div');
    item.className = 'step-item';

    const num = document.createElement('div');
    num.className = 'step-item__num';
    num.textContent = s.num;

    const content = document.createElement('div');

    const label = document.createElement('div');
    label.className = 'step-item__label';
    label.textContent = s.label;

    const desc = document.createElement('div');
    desc.className = 'step-item__desc';
    desc.textContent = s.desc;

    content.appendChild(label);
    content.appendChild(desc);
    item.appendChild(num);
    item.appendChild(content);
    howItWorks.appendChild(item);
  });

  screen.appendChild(howItWorks);

  /* Solution diagram */
  const diagram = document.createElement('img');
  diagram.src = 'images/dal-hero.png';
  diagram.alt = 'DAL-X: Authority before execution.';
  diagram.style.cssText =
    'width:100%;display:block;border-radius:12px;margin-top:var(--space-6);';
  screen.appendChild(diagram);

  /* ── What you are about to see ───────────────────────────────────────── */
  appendSectionLabel(screen, 'What you are about to see');

  const demoIntro = document.createElement('p');
  demoIntro.style.cssText =
    'font-size:var(--text-sm);color:var(--color-text-secondary);'
    + 'margin-bottom:var(--space-4);line-height:1.65;';
  demoIntro.textContent =
    'You will pick a real-world scenario on the next screen. '
    + 'The simulation then walks you through four situations at the gate, one after another. '
    + 'Each situation shows a specific way the gate responds to that scenario '
    + 'and what happens to the downstream system as a result.';
  screen.appendChild(demoIntro);

  const behaviors = [
    {
      state: 'rejected',
      icon:  '✕',
      label: 'No authorization presented',
      body:  'No authorization exists. The gate rejects the request. The downstream system is not called.',
    },
    {
      state: 'rejected',
      icon:  '✕',
      label: 'Wrong action submitted',
      body:  'An authorization was issued for a different action. The gate rejects the mismatch.',
    },
    {
      state: 'accepted',
      icon:  '✓',
      label: 'Valid, active authorization',
      body:  'The authorization matches the action and target and has not expired. Execution is permitted.',
    },
    {
      state: 'rejected',
      icon:  '✕',
      label: 'Authorization already consumed',
      body:  'The same authorization is presented a second time. The gate rejects the reuse. A new authorization is required for each execution.',
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
    const lbl = document.createElement('div');
    lbl.className = 'behavior-card__label';
    lbl.textContent = b.label;
    const desc = document.createElement('div');
    desc.className = 'behavior-card__body';
    desc.textContent = b.body;

    textWrap.appendChild(lbl);
    textWrap.appendChild(desc);
    card.appendChild(icon);
    card.appendChild(textWrap);
    grid.appendChild(card);
  });

  screen.appendChild(grid);

  /* Scope boundary callout */
  const scope = document.createElement('div');
  scope.className = 'callout callout--info';
  scope.style.marginTop = 'var(--space-2)';
  scope.textContent =
    'DAL-X controls execution, not model intent. '
    + 'It does not determine why an agent proposed an action. '
    + 'It only checks whether the enterprise authorized that specific execution '
    + 'before the downstream system proceeded.';
  screen.appendChild(scope);

  /* CTA into demo */
  const demoCard = document.createElement('div');
  demoCard.className = 'card';
  demoCard.style.cssText = 'margin-top:var(--space-6);text-align:center;padding:var(--space-8);';

  const demoTitle = document.createElement('div');
  demoTitle.className = 'card__title';
  demoTitle.style.marginBottom = 'var(--space-2)';
  demoTitle.textContent = 'Ready to see the gate work?';

  const demoDesc = document.createElement('p');
  demoDesc.style.cssText =
    'font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-5);';
  demoDesc.textContent =
    'Choose a real-world scenario and walk through each gate response. '
    + 'After the simulation, you can request a guided assessment with Jochanni Labs.';

  const demoBtn = document.createElement('button');
  demoBtn.className = 'btn btn--primary btn--lg';
  demoBtn.textContent = 'Start the Demonstration →';
  demoBtn.addEventListener('click', () => showScreen('screen-1'));

  demoCard.appendChild(demoTitle);
  demoCard.appendChild(demoDesc);
  demoCard.appendChild(demoBtn);
  screen.appendChild(demoCard);

  screen.appendChild(createBrandFooter());
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function appendSectionLabel(parent, text, marginTop = 'var(--space-6)') {
  const lbl = document.createElement('p');
  lbl.className = 'section-label';
  lbl.style.marginTop = marginTop;
  lbl.textContent = text;
  parent.appendChild(lbl);
}

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
