/* ═══════════════════════════════════════════════════════════════════════════
   canvas-engine.js - Animated background visualization for DAL-X-EXEC.

   Renders a fixed full-viewport canvas beneath the UI whose particles
   and imagery change per scene. Scenes are switched via
   CanvasEngine.setScene(name) as the user progresses through screens.

   Exposed API:
     CanvasEngine.init()               - attach canvas and start RAF loop
     CanvasEngine.setScene(name)       - instantly transition to a scene
     CanvasEngine.transitionScene(a,b,ms) - crossfade between scenes

   Scenes:
     'chaos'      - screen 0: unauthorized executions flood past
     'demo'       - screens 1-6: DAL-X wedge blocks unauthorized packets
     'assessment' - screens 7-8: analytical hex grid, calmer motion
     'simulation' - screens 9-15: teal authority-chain streams
     'technical'  - screens 16-18: subtle matrix columns
     'review'     - screens 19-21: gold particles rising, chain glow
════════════════════════════════════════════════════════════════════════════ */

const CanvasEngine = (() => {
  'use strict';

  /* ── Internal state ───────────────────────────────────────────────────── */
  let canvas = null;
  let ctx    = null;
  let width  = 0;
  let height = 0;
  let dpr    = 1;

  let currentScene = 'chaos';
  let nextScene    = null;
  let transitionT  = 1;           // 0..1  (1 = fully in currentScene)
  let transitionDurationMs = 800;
  let transitionStart = 0;

  let unauthorizedCount = 0;
  let unauthorizedDisplay = 0;

  let lastFrameTime = 0;
  const FRAME_INTERVAL = 1000 / 60;

  let running = false;

  /* ── Scene backgrounds ────────────────────────────────────────────────── */
  const SCENE_BG = {
    chaos:      ['#070b14', '#0d0818'],
    demo:       ['#070b14', '#0d1018'],
    assessment: ['#07100b', '#0a141a'],
    simulation: ['#070b14', '#071418'],
    technical:  ['#07090e', '#0a0b14'],
    review:     ['#0d0b07', '#14100a'],
  };

  /* ── Object pools ─────────────────────────────────────────────────────── */

  const packetPool = [];
  const activePackets = [];
  const MAX_PACKETS = 200;

  function acquirePacket() {
    const p = packetPool.pop() || {
      x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0,
      color: '#F97316', size: 2, kind: 'default', alpha: 1, blocked: false,
    };
    activePackets.push(p);
    return p;
  }
  function releasePacket(idx) {
    const p = activePackets[idx];
    activePackets.splice(idx, 1);
    if (packetPool.length < MAX_PACKETS) packetPool.push(p);
  }

  /* ── Nodes for the primary scenes ─────────────────────────────────────── */

  const agentNodes      = [];
  const downstreamNodes = [];
  const chainNodes      = [];
  const matrixColumns   = [];

  function seedAgentNodes(count) {
    agentNodes.length = 0;
    for (let i = 0; i < count; i++) {
      agentNodes.push({
        baseX: width * (0.05 + Math.random() * 0.32),
        baseY: height * (0.1 + Math.random() * 0.8),
        x: 0, y: 0,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.0004 + Math.random() * 0.0006,
        radius: 5 + Math.random() * 4,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.001 + Math.random() * 0.002,
        emitCooldown: Math.random() * 2500,
        emitRate:  600 + Math.random() * 1400,
      });
    }
  }

  function seedDownstreamNodes(count) {
    downstreamNodes.length = 0;
    for (let i = 0; i < count; i++) {
      downstreamNodes.push({
        x: width * (0.75 + Math.random() * 0.15),
        y: height * ((i + 0.5) / count),
        w: 40, h: 24,
      });
    }
  }

  function seedChainNodes() {
    chainNodes.length = 0;
    const labels = ['Submit', 'Evaluate', 'Review', 'Token', 'Gate', 'Receipt'];
    const spacing = width / (labels.length + 1);
    labels.forEach((lbl, i) => {
      chainNodes.push({
        x: spacing * (i + 1),
        y: height * 0.5,
        r: 6,
        label: lbl,
        appearAt: i * 400,   // ms after scene enter
        pulsePhase: Math.random() * Math.PI * 2,
      });
    });
  }

  function seedMatrix() {
    matrixColumns.length = 0;
    const colWidth = 24;
    const cols = Math.floor(width / colWidth);
    for (let i = 0; i < cols; i++) {
      matrixColumns.push({
        x: i * colWidth + colWidth / 2,
        y: -Math.random() * height,
        speed: 30 + Math.random() * 70,
        chars: 8 + Math.floor(Math.random() * 8),
      });
    }
  }

  /* ── Canvas sizing ────────────────────────────────────────────────────── */

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width  = window.innerWidth;
    height = window.innerHeight;
    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    canvas.style.width  = width  + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Re-seed layout-dependent scenes
    seedAgentNodes(currentScene === 'chaos' ? 18 : 10);
    seedDownstreamNodes(6);
    seedChainNodes();
    seedMatrix();
  }

  /* ── Background gradient ──────────────────────────────────────────────── */

  function drawBackground(sceneKey, alpha = 1) {
    const [c1, c2] = SCENE_BG[sceneKey] || SCENE_BG.chaos;
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }

  /* ── Scene drawing routines ───────────────────────────────────────────── */

  function drawChaosScene(dt) {
    // Agent nodes
    agentNodes.forEach(a => {
      a.drift += a.driftSpeed * dt;
      a.x = a.baseX + Math.sin(a.drift) * 8;
      a.y = a.baseY + Math.cos(a.drift * 0.7) * 6;
      a.pulsePhase += a.pulseSpeed * dt;
      const pulse = 0.7 + 0.3 * Math.sin(a.pulsePhase);

      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.radius * 4 * pulse);
      grad.addColorStop(0, 'rgba(249,115,22,0.9)');
      grad.addColorStop(0.4, 'rgba(249,115,22,0.35)');
      grad.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius * 4 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Emit packets toward random downstream
      a.emitCooldown -= dt;
      if (a.emitCooldown <= 0 && activePackets.length < MAX_PACKETS) {
        a.emitCooldown = a.emitRate;
        const target = downstreamNodes[Math.floor(Math.random() * downstreamNodes.length)];
        if (target) {
          const dx = target.x - a.x;
          const dy = target.y - a.y;
          const dist = Math.hypot(dx, dy);
          const speed = 0.15 + Math.random() * 0.1;
          const p = acquirePacket();
          p.x = a.x; p.y = a.y;
          p.vx = (dx / dist) * speed;
          p.vy = (dy / dist) * speed;
          p.life = 0;
          p.maxLife = dist / speed;
          p.size = 2 + Math.random() * 1.5;
          p.alpha = 1;
          p.blocked = false;
          // 70% unauthorized (red on arrival), 30% orange
          p.kind = Math.random() < 0.7 ? 'unauthorized' : 'authorized';
          p.color = p.kind === 'unauthorized' ? '#EF4444' : '#F97316';
        }
      }
    });

    // Downstream nodes
    downstreamNodes.forEach(d => {
      ctx.fillStyle = 'rgba(15,20,32,0.85)';
      ctx.strokeStyle = 'rgba(148,163,184,0.25)';
      ctx.lineWidth = 1;
      ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
      ctx.strokeRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
    });

    // Update and draw packets
    for (let i = activePackets.length - 1; i >= 0; i--) {
      const p = activePackets[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (p.life >= p.maxLife) {
        if (p.kind === 'unauthorized') {
          unauthorizedCount++;
          // Red arrival pulse
          drawArrivalPulse(p.x, p.y, '#EF4444');
        } else {
          drawArrivalPulse(p.x, p.y, '#F97316');
        }
        releasePacket(i);
      }
    }

    drawUnauthorizedCounter();
  }

  const arrivalPulses = [];
  function drawArrivalPulse(x, y, color) {
    arrivalPulses.push({ x, y, r: 4, alpha: 1, color });
  }
  function updateArrivalPulses(dt) {
    for (let i = arrivalPulses.length - 1; i >= 0; i--) {
      const p = arrivalPulses[i];
      p.r += dt * 0.06;
      p.alpha -= dt * 0.002;
      if (p.alpha <= 0) { arrivalPulses.splice(i, 1); continue; }
      ctx.strokeStyle = hexToRgba(p.color, p.alpha);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawUnauthorizedCounter() {
    // Smoothly interpolate for a ticking feel
    unauthorizedDisplay += (unauthorizedCount - unauthorizedDisplay) * 0.08;
    const count = Math.floor(unauthorizedDisplay);
    ctx.save();
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(239,68,68,0.6)';
    ctx.fillText('UNAUTHORIZED EXECUTIONS', width - 20, 60);
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#EF4444';
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(239,68,68,0.6)';
    ctx.fillText(String(count).padStart(6, '0'), width - 20, 88);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawDemoScene(dt) {
    // Wedge barrier line
    const wedgeX = width * 0.55;
    const wedgeGrad = ctx.createLinearGradient(wedgeX - 8, 0, wedgeX + 8, 0);
    wedgeGrad.addColorStop(0,   'rgba(249,115,22,0)');
    wedgeGrad.addColorStop(0.5, 'rgba(249,115,22,0.35)');
    wedgeGrad.addColorStop(1,   'rgba(249,115,22,0)');
    ctx.fillStyle = wedgeGrad;
    ctx.fillRect(wedgeX - 8, 0, 16, height);

    // Agents
    agentNodes.forEach(a => {
      a.drift += a.driftSpeed * dt;
      a.x = a.baseX + Math.sin(a.drift) * 6;
      a.y = a.baseY + Math.cos(a.drift * 0.6) * 5;
      a.pulsePhase += a.pulseSpeed * dt;
      const pulse = 0.7 + 0.3 * Math.sin(a.pulsePhase);

      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.radius * 3.5 * pulse);
      grad.addColorStop(0, 'rgba(249,115,22,0.9)');
      grad.addColorStop(0.4, 'rgba(249,115,22,0.3)');
      grad.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius * 3.5 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius * 0.85 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Emit packets, slower cadence
      a.emitCooldown -= dt;
      if (a.emitCooldown <= 0 && activePackets.length < MAX_PACKETS) {
        a.emitCooldown = a.emitRate * 1.5;
        const target = downstreamNodes[Math.floor(Math.random() * downstreamNodes.length)];
        if (target) {
          const dx = target.x - a.x;
          const dy = target.y - a.y;
          const dist = Math.hypot(dx, dy);
          const speed = 0.12;
          const p = acquirePacket();
          p.x = a.x; p.y = a.y;
          p.vx = (dx / dist) * speed;
          p.vy = (dy / dist) * speed;
          p.life = 0;
          p.maxLife = dist / speed;
          p.size = 2;
          p.alpha = 1;
          p.blocked = Math.random() < 0.75;
          p.wedgeX = wedgeX;
          p.color = p.blocked ? '#F97316' : '#10B981';
          p.kind = p.blocked ? 'blocked' : 'authorized';
        }
      }
    });

    // Downstream nodes
    downstreamNodes.forEach(d => {
      ctx.fillStyle = 'rgba(15,20,32,0.85)';
      ctx.strokeStyle = 'rgba(148,163,184,0.25)';
      ctx.lineWidth = 1;
      ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
      ctx.strokeRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
    });

    // Packets
    for (let i = activePackets.length - 1; i >= 0; i--) {
      const p = activePackets[i];
      const prevX = p.x;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      if (p.blocked && prevX < p.wedgeX && p.x >= p.wedgeX) {
        // Stopped at wedge
        drawArrivalPulse(p.wedgeX, p.y, '#F97316');
        releasePacket(i);
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (p.life >= p.maxLife) {
        drawArrivalPulse(p.x, p.y, '#10B981');
        releasePacket(i);
      }
    }
  }

  function drawAssessmentScene(dt) {
    // Soft hexagonal grid
    const size = 40;
    const w = size * Math.sqrt(3);
    const h = size * 1.5;
    ctx.strokeStyle = 'rgba(96,165,250,0.06)';
    ctx.lineWidth = 1;
    for (let y = -h; y < height + h; y += h) {
      for (let x = -w; x < width + w; x += w) {
        const offset = (Math.floor(y / h) % 2 === 0) ? 0 : w / 2;
        drawHexagon(x + offset, y, size * 0.5);
      }
    }
    // Slowly clustering particles
    if (activePackets.length < 40 && Math.random() < 0.04) {
      const p = acquirePacket();
      p.x = Math.random() * width;
      p.y = Math.random() * height;
      p.vx = (Math.random() - 0.5) * 0.03;
      p.vy = (Math.random() - 0.5) * 0.03;
      p.life = 0;
      p.maxLife = 8000 + Math.random() * 4000;
      p.color = '#60A5FA';
      p.size = 1.5;
      p.kind = 'assess';
    }
    for (let i = activePackets.length - 1; i >= 0; i--) {
      const p = activePackets[i];
      if (p.kind !== 'assess') { releasePacket(i); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      const a = Math.min(1, p.life / 1000) * Math.max(0, 1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3));
      ctx.fillStyle = hexToRgba(p.color, 0.6 * a);
      ctx.shadowBlur = 4;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (p.life >= p.maxLife) releasePacket(i);
    }
  }

  function drawHexagon(cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  let simTimeElapsed = 0;
  function drawSimulationScene(dt) {
    simTimeElapsed += dt;

    // Data streams flowing left-to-right
    if (Math.random() < 0.15 && activePackets.length < 80) {
      const p = acquirePacket();
      p.x = -20;
      p.y = Math.random() * height;
      p.vx = 0.1 + Math.random() * 0.15;
      p.vy = 0;
      p.life = 0;
      p.maxLife = (width + 40) / p.vx;
      p.color = '#14B8A6';
      p.size = 1 + Math.random() * 1.5;
      p.kind = 'stream';
    }

    for (let i = activePackets.length - 1; i >= 0; i--) {
      const p = activePackets[i];
      if (p.kind !== 'stream') { releasePacket(i); continue; }
      p.x += p.vx * dt;
      p.life += dt;
      ctx.fillStyle = hexToRgba(p.color, 0.55);
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      // Trail
      ctx.strokeStyle = hexToRgba(p.color, 0.25);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 30, p.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (p.life >= p.maxLife) releasePacket(i);
    }

    // Chain nodes appearing progressively
    chainNodes.forEach((n, i) => {
      if (simTimeElapsed < n.appearAt) return;
      n.pulsePhase += 0.002 * dt;
      const pulse = 0.75 + 0.25 * Math.sin(n.pulsePhase);
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 30 * pulse);
      grad.addColorStop(0, 'rgba(20,184,166,0.5)');
      grad.addColorStop(1, 'rgba(20,184,166,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 30 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#14B8A6';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();

      // Connect to previous
      if (i > 0 && simTimeElapsed > chainNodes[i].appearAt) {
        const prev = chainNodes[i - 1];
        ctx.strokeStyle = 'rgba(20,184,166,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }
    });
  }

  const matrixChars = '01<>{}[]/#*=$@%&';
  function drawTechnicalScene(dt) {
    ctx.font = '13px "JetBrains Mono", monospace';
    matrixColumns.forEach(col => {
      col.y += (col.speed * dt) / 1000;
      if (col.y > height + col.chars * 16) {
        col.y = -col.chars * 16 - Math.random() * height * 0.5;
      }
      for (let j = 0; j < col.chars; j++) {
        const ch = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const y = col.y - j * 16;
        const alpha = ((col.chars - j) / col.chars) * 0.22;
        ctx.fillStyle = hexToRgba('#8B5CF6', alpha);
        ctx.fillText(ch, col.x, y);
      }
    });
  }

  let reviewTimeElapsed = 0;
  const goldParticles = [];
  function drawReviewScene(dt) {
    reviewTimeElapsed += dt;

    // Spawn gold particles rising
    if (goldParticles.length < 80 && Math.random() < 0.2) {
      goldParticles.push({
        x: Math.random() * width,
        y: height + 10,
        vy: -0.02 - Math.random() * 0.03,
        vx: (Math.random() - 0.5) * 0.01,
        size: 1 + Math.random() * 2,
        life: 0,
        maxLife: 12000 + Math.random() * 6000,
        drift: Math.random() * Math.PI * 2,
      });
    }

    for (let i = goldParticles.length - 1; i >= 0; i--) {
      const p = goldParticles[i];
      p.drift += 0.001 * dt;
      p.x += p.vx * dt + Math.sin(p.drift) * 0.05;
      p.y += p.vy * dt;
      p.life += dt;
      const fadeIn  = Math.min(1, p.life / 1500);
      const fadeOut = Math.max(0, 1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3));
      const a = fadeIn * fadeOut * 0.75;
      ctx.fillStyle = hexToRgba('#F59E0B', a);
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#F59E0B';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (p.life >= p.maxLife || p.y < -10) goldParticles.splice(i, 1);
    }

    // Background chain glow
    const spacing = width / 7;
    for (let i = 1; i <= 6; i++) {
      const x = spacing * i;
      const y = height * 0.6;
      const phase = reviewTimeElapsed * 0.001 + i * 0.5;
      const glow = 0.15 + 0.1 * Math.sin(phase);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 60);
      grad.addColorStop(0, hexToRgba('#F59E0B', glow));
      grad.addColorStop(1, 'rgba(245,158,11,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 60, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ── Scene dispatch ───────────────────────────────────────────────────── */

  const SCENE_DRAWERS = {
    chaos:      drawChaosScene,
    demo:       drawDemoScene,
    assessment: drawAssessmentScene,
    simulation: drawSimulationScene,
    technical:  drawTechnicalScene,
    review:     drawReviewScene,
  };

  function drawScene(scene, dt, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const drawer = SCENE_DRAWERS[scene] || drawChaosScene;
    drawer(dt);
    updateArrivalPulses(dt);
    ctx.restore();
  }

  /* ── Main loop ────────────────────────────────────────────────────────── */

  function frame(now) {
    if (!running) return;
    const raw = now - lastFrameTime;
    if (raw < FRAME_INTERVAL - 1) {
      requestAnimationFrame(frame);
      return;
    }
    const dt = Math.min(raw, 40);   // clamp to avoid huge jumps
    lastFrameTime = now;

    // Transition progress
    if (nextScene && transitionT < 1) {
      transitionT = Math.min(1, (now - transitionStart) / transitionDurationMs);
    }

    // Draw base gradient (crossfade if transitioning)
    if (nextScene) {
      drawBackground(currentScene, 1);
      drawBackground(nextScene, transitionT);
    } else {
      drawBackground(currentScene, 1);
    }

    // Draw scene(s)
    if (nextScene) {
      drawScene(currentScene, dt, 1 - transitionT);
      drawScene(nextScene, dt, transitionT);
      if (transitionT >= 1) {
        currentScene = nextScene;
        nextScene = null;
        // Reseed for the freshly-committed scene
        onSceneEnter(currentScene);
      }
    } else {
      drawScene(currentScene, dt, 1);
    }

    requestAnimationFrame(frame);
  }

  function onSceneEnter(scene) {
    // Clear packets between scenes to avoid visual bleed
    while (activePackets.length) releasePacket(0);
    arrivalPulses.length = 0;
    goldParticles.length = 0;
    simTimeElapsed = 0;
    reviewTimeElapsed = 0;
    unauthorizedCount = 0;
    unauthorizedDisplay = 0;

    if (scene === 'chaos') seedAgentNodes(18);
    else if (scene === 'demo') seedAgentNodes(10);
    else { agentNodes.length = 0; }

    if (scene === 'simulation') seedChainNodes();
    if (scene === 'technical') seedMatrix();
    if (scene === 'chaos' || scene === 'demo') seedDownstreamNodes(6);
  }

  /* ── Utils ────────────────────────────────────────────────────────────── */

  function hexToRgba(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ── Public API ───────────────────────────────────────────────────────── */

  function init() {
    if (canvas) return;                             // already initialized
    canvas = document.getElementById('bg-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'bg-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(canvas, document.body.firstChild);
    }
    ctx = canvas.getContext('2d');
    resize();
    onSceneEnter(currentScene);
    window.addEventListener('resize', resize);
    running = true;
    lastFrameTime = performance.now();
    requestAnimationFrame(frame);
  }

  function setScene(name) {
    if (!SCENE_DRAWERS[name] || name === currentScene) return;
    transitionScene(currentScene, name, 800);
  }

  function transitionScene(from, to, durationMs) {
    if (!SCENE_DRAWERS[to]) return;
    if (from && from !== currentScene) currentScene = from;
    nextScene = to;
    transitionT = 0;
    transitionDurationMs = durationMs || 800;
    transitionStart = performance.now();
  }

  return { init, setScene, transitionScene };
})();
