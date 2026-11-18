/* ═══════════════════════════════════════════════════════
   PRIYANSHU YADUVANSHI — PORTFOLIO MAIN JS
   Photorealistic Deep Space Starfield & Interactivity
   ═══════════════════════════════════════════════════════ */

'use strict';

// ─── PHOTOREALISTIC DEEP SPACE CANVAS ───────────
(function initRealisticSpace() {
  const canvas = document.getElementById('galaxy-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Offscreen buffer for dense static starfield + Milky Way dust (high FPS)
  const bgCanvas = document.createElement('canvas');
  const bgCtx = bgCanvas.getContext('2d');
  const PAD = 60; // extra padding for smooth mouse/scroll parallax

  let W = 0;
  let H = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  let twinkleStars = [];
  let brightStars = [];
  let shooters = [];
  let stardust = [];
  let frame = 0;

  // Mouse & scroll parallax state
  let targetMX = 0, targetMY = 0;
  let curMX = 0, curMY = 0;
  let cursorX = -999, cursorY = -999;
  let smoothCursorX = -999, smoothCursorY = -999;
  let cursorActive = false;
  let scrollOffset = 0;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Box-Muller normal distribution for realistic star cluster / Milky Way density
  function gaussian(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // Authentic astronomical spectral star colors (O, B, A, F, G, K, M)
  function getSpectralColor() {
    const r = Math.random();
    if (r < 0.45) return { r: 255, g: 255, b: 255 }; // Class A: Pure optical white
    if (r < 0.68) return { r: 210, g: 228, b: 255 }; // Class B: Icy blue-white
    if (r < 0.78) return { r: 155, g: 200, b: 255 }; // Class O: Electric sapphire blue
    if (r < 0.88) return { r: 255, g: 244, b: 222 }; // Class F/G: Warm solar white
    if (r < 0.95) return { r: 255, g: 205, b: 140 }; // Class K: Golden amber
    return { r: 255, g: 140, b: 110 };               // Class M: Soft crimson/peach
  }

  function rgba(c, a) {
    return `rgba(${c.r},${c.g},${c.b},${a.toFixed(3)})`;
  }

  // Build offscreen Milky Way band, cosmic dust lanes, and 2,500+ pinpoint stars
  function buildStaticSky() {
    const bw = W + PAD * 2;
    const bh = H + PAD * 2;
    bgCanvas.width = bw * dpr;
    bgCanvas.height = bh * dpr;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Deep void space background (true cosmic black)
    const spaceGrad = bgCtx.createRadialGradient(
      bw * 0.5, bh * 0.4, 0,
      bw * 0.5, bh * 0.4, Math.max(bw, bh) * 0.85
    );
    spaceGrad.addColorStop(0, '#04060d');
    spaceGrad.addColorStop(0.5, '#020307');
    spaceGrad.addColorStop(1, '#000002');
    bgCtx.fillStyle = spaceGrad;
    bgCtx.fillRect(0, 0, bw, bh);

    // 2. Subtle Milky Way star-light mist (like wide-field astrophotography)
    bgCtx.save();
    bgCtx.translate(bw * 0.5, bh * 0.5);
    bgCtx.rotate(-26 * Math.PI / 180);

    const bandWidth = Math.max(bw, bh) * 0.45;
    const bandLen = Math.max(bw, bh) * 1.6;
    const mwGrad = bgCtx.createLinearGradient(-bandWidth, 0, bandWidth, 0);
    mwGrad.addColorStop(0, 'rgba(30, 38, 65, 0)');
    mwGrad.addColorStop(0.3, 'rgba(35, 42, 72, 0.09)');
    mwGrad.addColorStop(0.5, 'rgba(55, 62, 100, 0.14)');
    mwGrad.addColorStop(0.7, 'rgba(35, 42, 72, 0.09)');
    mwGrad.addColorStop(1, 'rgba(30, 38, 65, 0)');
    bgCtx.fillStyle = mwGrad;
    bgCtx.fillRect(-bandWidth, -bandLen / 2, bandWidth * 2, bandLen);

    // Subtle dark dust rift inside Milky Way
    const dustGrad = bgCtx.createLinearGradient(-bandWidth * 0.16, 0, bandWidth * 0.16, 0);
    dustGrad.addColorStop(0, 'rgba(0, 0, 2, 0)');
    dustGrad.addColorStop(0.5, 'rgba(0, 0, 2, 0.35)');
    dustGrad.addColorStop(1, 'rgba(0, 0, 2, 0)');
    bgCtx.fillStyle = dustGrad;
    bgCtx.fillRect(-bandWidth * 0.16, -bandLen / 2, bandWidth * 0.32, bandLen);
    bgCtx.restore();

    // 3. Faint Orion/Hubble-style interstellar nebula wisps (ultra-subtle, natural)
    const nebulae = [
      { x: bw * 0.25, y: bh * 0.30, r: Math.min(bw, bh) * 0.32, col: '48, 60, 115', a: 0.07 },
      { x: bw * 0.65, y: bh * 0.58, r: Math.min(bw, bh) * 0.26, col: '90, 40, 85', a: 0.05 },
      { x: bw * 0.52, y: bh * 0.42, r: Math.min(bw, bh) * 0.22, col: '40, 80, 120', a: 0.06 },
    ];
    nebulae.forEach(n => {
      const g = bgCtx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      g.addColorStop(0, `rgba(${n.col}, ${n.a})`);
      g.addColorStop(0.5, `rgba(${n.col}, ${n.a * 0.35})`);
      g.addColorStop(1, `rgba(${n.col}, 0)`);
      bgCtx.fillStyle = g;
      bgCtx.beginPath();
      bgCtx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      bgCtx.fill();
    });

    // 4. Dense Star Dust Field (2,400 - 3,800 pinpoint stars depending on viewport)
    const areaCount = Math.min(4200, Math.max(1800, Math.round((bw * bh) / 650)));
    const angle = -26 * Math.PI / 180;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    for (let i = 0; i < areaCount; i++) {
      let sx, sy;
      const mode = Math.random();

      if (mode < 0.42) {
        // Concentrated along the Milky Way diagonal band
        const along = rand(-bw * 0.85, bw * 0.85);
        const across = gaussian(0, Math.min(bw, bh) * 0.16);
        sx = bw * 0.5 + along * cosA - across * sinA;
        sy = bh * 0.5 + along * sinA + across * cosA;
      } else if (mode < 0.58) {
        // Globular star cluster density focus (subtle stellar cluster like Hubble ref #1)
        sx = gaussian(bw * 0.68, Math.min(bw, bh) * 0.18);
        sy = gaussian(bh * 0.42, Math.min(bw, bh) * 0.18);
      } else {
        // Uniform cosmic background stars
        sx = rand(0, bw);
        sy = rand(0, bh);
      }

      if (sx < 0 || sx > bw || sy < 0 || sy > bh) continue;

      const col = getSpectralColor();
      const mag = Math.random();
      const radius = mag < 0.78 ? rand(0.25, 0.65) : rand(0.65, 1.15);
      const alpha = mag < 0.65 ? rand(0.22, 0.55) : rand(0.55, 0.92);

      // Faint soft bloom on slightly larger static stars
      if (radius > 0.85) {
        const sg = bgCtx.createRadialGradient(sx, sy, 0, sx, sy, radius * 3.5);
        sg.addColorStop(0, rgba(col, alpha));
        sg.addColorStop(0.35, rgba(col, alpha * 0.25));
        sg.addColorStop(1, rgba(col, 0));
        bgCtx.fillStyle = sg;
        bgCtx.beginPath();
        bgCtx.arc(sx, sy, radius * 3.5, 0, Math.PI * 2);
        bgCtx.fill();
      }

      bgCtx.fillStyle = rgba(col, alpha);
      bgCtx.beginPath();
      bgCtx.arc(sx, sy, radius, 0, Math.PI * 2);
      bgCtx.fill();
    }
  }

  // Build live twinkling field stars (layer 2) and focal bright stars with diffraction spikes (layer 3)
  function buildLiveStars() {
    twinkleStars = [];
    brightStars = [];

    const twinkCount = Math.min(350, Math.max(160, Math.round((W * H) / 6500)));
    for (let i = 0; i < twinkCount; i++) {
      const col = getSpectralColor();
      const isMedium = Math.random() < 0.22;
      twinkleStars.push({
        x: rand(0, W),
        y: rand(0, H),
        r: isMedium ? rand(0.95, 1.55) : rand(0.5, 0.95),
        col,
        baseAlpha: isMedium ? rand(0.6, 0.95) : rand(0.45, 0.85),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.015, 0.055),
        amp: isMedium ? rand(0.22, 0.38) : rand(0.15, 0.3),
        depth: rand(0.25, 0.65),
        isMedium
      });
    }

    // Focal bright stars inspired directly by user reference images:
    // Includes 1 signature brilliant blue supergiant (Hubble style) + warm giant + Orion-style jewels
    const presets = [
      // Signature Hubble-style brilliant blue supergiant in upper-left / upper-right
      { x: 0.16, y: 0.20, r: 2.9, col: { r: 150, g: 215, b: 255 }, spike: 88, prismatic: true },
      // Warm orange/gold giant (like Betelgeuse in ref #3)
      { x: 0.28, y: 0.34, r: 2.3, col: { r: 255, g: 175, b: 95 }, spike: 42, prismatic: false },
      // Bright icy blue jewel (like Rigel in ref #3)
      { x: 0.78, y: 0.76, r: 2.5, col: { r: 175, g: 220, b: 255 }, spike: 56, prismatic: true },
      // Crimson-rose giant
      { x: 0.56, y: 0.68, r: 2.0, col: { r: 255, g: 130, b: 120 }, spike: 32, prismatic: false },
      // Crisp white-blue belt/cluster stars
      { x: 0.53, y: 0.49, r: 2.1, col: { r: 225, g: 240, b: 255 }, spike: 44, prismatic: false },
      { x: 0.57, y: 0.46, r: 1.9, col: { r: 235, g: 245, b: 255 }, spike: 34, prismatic: false },
      { x: 0.61, y: 0.43, r: 2.0, col: { r: 210, g: 235, b: 255 }, spike: 38, prismatic: false },
      { x: 0.84, y: 0.22, r: 2.2, col: { r: 240, g: 246, b: 255 }, spike: 46, prismatic: false },
      { x: 0.12, y: 0.78, r: 1.8, col: { r: 255, g: 220, b: 165 }, spike: 28, prismatic: false },
      { x: 0.90, y: 0.54, r: 1.8, col: { r: 195, g: 225, b: 255 }, spike: 30, prismatic: false },
    ];

    presets.forEach(p => {
      brightStars.push({
        x: p.x * W,
        y: p.y * H,
        r: p.r,
        col: p.col,
        spikeLen: p.spike,
        prismatic: p.prismatic,
        phase: rand(0, Math.PI * 2),
        speed: rand(0.015, 0.032),
        depth: rand(0.75, 1.0)
      });
    });
  }

  function drawBrightStar(s, px, py) {
    const sc = 0.88 + 0.12 * Math.sin(s.phase);
    const sx = s.x + px * s.depth;
    const sy = s.y + py * s.depth;

    // 1. Wide atmospheric optical halo
    const haloR = s.r * 16;
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
    halo.addColorStop(0, rgba(s.col, 0.55 * sc));
    halo.addColorStop(0.15, rgba(s.col, 0.22 * sc));
    halo.addColorStop(0.45, rgba(s.col, 0.05 * sc));
    halo.addColorStop(1, rgba(s.col, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
    ctx.fill();

    // 2. Razor-sharp diffraction spikes (Hubble / telescope optics)
    const len = s.spikeLen * sc;
    const primaryAngles = [0.45, 0.45 + Math.PI / 2, 0.45 + Math.PI, 0.45 + Math.PI * 1.5];

    primaryAngles.forEach((ang, idx) => {
      const ex = sx + Math.cos(ang) * len;
      const ey = sy + Math.sin(ang) * len;
      const grad = ctx.createLinearGradient(sx, sy, ex, ey);

      if (s.prismatic && idx % 2 === 0) {
        // Subtle green/cyan optical fringe seen in Hubble bright stars
        grad.addColorStop(0, `rgba(255,255,255,${0.95 * sc})`);
        grad.addColorStop(0.25, `rgba(140,220,255,${0.55 * sc})`);
        grad.addColorStop(0.55, `rgba(110,255,190,${0.20 * sc})`);
        grad.addColorStop(1, 'rgba(110,255,190,0)');
      } else {
        grad.addColorStop(0, `rgba(255,255,255,${0.9 * sc})`);
        grad.addColorStop(0.22, rgba(s.col, 0.48 * sc));
        grad.addColorStop(0.6, rgba(s.col, 0.12 * sc));
        grad.addColorStop(1, rgba(s.col, 0));
      }

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    });

    // Secondary 45-deg offset finer spikes
    const secLen = len * 0.55;
    for (let k = 0; k < 4; k++) {
      const ang = 0.45 + Math.PI * 0.25 + (k * Math.PI) / 2;
      const ex = sx + Math.cos(ang) * secLen;
      const ey = sy + Math.sin(ang) * secLen;
      const grad = ctx.createLinearGradient(sx, sy, ex, ey);
      grad.addColorStop(0, rgba(s.col, 0.5 * sc));
      grad.addColorStop(0.5, rgba(s.col, 0.1 * sc));
      grad.addColorStop(1, rgba(s.col, 0));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    // 3. Hot overexposed white core
    const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 2.4);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.45, rgba(s.col, 0.95));
    core.addColorStop(1, rgba(s.col, 0));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(sx, sy, s.r * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function spawnShooter() {
    const angle = rand(18, 48) * Math.PI / 180;
    shooters.push({
      x: rand(W * 0.05, W * 0.85),
      y: rand(-10, H * 0.45),
      angle,
      speed: rand(18, 30),
      len: rand(90, 200),
      alpha: 1,
      decay: rand(0.015, 0.028),
    });
  }

  function drawShooters() {
    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.alpha -= s.decay;

      if (s.alpha <= 0 || s.x > W + 120 || s.y > H + 120) {
        shooters.splice(i, 1);
        continue;
      }

      const tx = s.x - Math.cos(s.angle) * s.len;
      const ty = s.y - Math.sin(s.angle) * s.len;
      const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.7, `rgba(210,230,255,${(s.alpha * 0.45).toFixed(3)})`);
      grad.addColorStop(1, `rgba(255,255,255,${s.alpha.toFixed(3)})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      ctx.fillStyle = `rgba(255,255,255,${s.alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function spawnStardust(x, y, vx, vy) {
    const col = getSpectralColor();
    stardust.push({
      x: x + rand(-8, 8),
      y: y + rand(-8, 8),
      vx: vx * 0.12 + rand(-0.4, 0.4),
      vy: vy * 0.12 + rand(-0.4, 0.4),
      r: rand(0.6, 1.9),
      col,
      alpha: rand(0.65, 1.0),
      decay: rand(0.018, 0.036),
      twinkle: rand(0, Math.PI * 2)
    });
  }

  function drawStardust() {
    for (let i = stardust.length - 1; i >= 0; i--) {
      const p = stardust[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.twinkle += 0.25;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        stardust.splice(i, 1);
        continue;
      }

      const flicker = 0.7 + 0.3 * Math.sin(p.twinkle);
      const a = Math.max(0, p.alpha * flicker);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      g.addColorStop(0, rgba(p.col, a));
      g.addColorStop(0.35, rgba(p.col, a * 0.4));
      g.addColorStop(1, rgba(p.col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function animate() {
    frame++;

    // Smooth parallax interpolation
    curMX += (targetMX - curMX) * 0.04;
    curMY += (targetMY - curMY) * 0.04;
    if (cursorActive) {
      smoothCursorX += (cursorX - smoothCursorX) * 0.15;
      smoothCursorY += (cursorY - smoothCursorY) * 0.15;
    }

    const px = curMX;
    const py = curMY - scrollOffset * 0.03;
    const clampedPy = Math.max(-PAD + 5, Math.min(PAD - 5, py));

    ctx.clearRect(0, 0, W, H);

    // Draw pre-rendered deep sky + 2,500+ pinpoint stars at 60 FPS
    ctx.drawImage(
      bgCanvas,
      0, 0, bgCanvas.width, bgCanvas.height,
      -PAD + px * 0.25, -PAD + clampedPy * 0.25, W + PAD * 2, H + PAD * 2
    );

    // Compact bright starlight spotlight in deep space around cursor
    if (cursorActive) {
      const spaceGlow = ctx.createRadialGradient(
        smoothCursorX, smoothCursorY, 0,
        smoothCursorX, smoothCursorY, 85
      );
      spaceGlow.addColorStop(0, 'rgba(255, 242, 200, 0.22)');
      spaceGlow.addColorStop(0.35, 'rgba(255, 215, 130, 0.10)');
      spaceGlow.addColorStop(0.7, 'rgba(180, 215, 255, 0.03)');
      spaceGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spaceGlow;
      ctx.beginPath();
      ctx.arc(smoothCursorX, smoothCursorY, 85, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw live twinkling field stars (illuminated brightly near cursor)
    for (let i = 0; i < twinkleStars.length; i++) {
      const s = twinkleStars[i];
      s.phase += s.speed;
      let alpha = Math.max(0.1, Math.min(1, s.baseAlpha + Math.sin(s.phase) * s.amp));
      const sx = s.x + px * s.depth;
      const sy = s.y + clampedPy * s.depth;

      let proximity = 0;
      if (cursorActive) {
        const dx = sx - smoothCursorX;
        const dy = sy - smoothCursorY;
        const distSq = dx * dx + dy * dy;
        if (distSq < 9025) { // within 95px
          proximity = 1 - Math.sqrt(distSq) / 95;
          alpha = Math.min(1, alpha + proximity * 0.65);
        }
      }

      if (s.isMedium || proximity > 0.15) {
        const glowRadius = s.r * (5 + proximity * 5);
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowRadius);
        g.addColorStop(0, rgba(s.col, alpha));
        g.addColorStop(0.25, rgba(s.col, alpha * (0.35 + proximity * 0.25)));
        g.addColorStop(1, rgba(s.col, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = rgba(s.col, alpha);
      ctx.beginPath();
      ctx.arc(sx, sy, s.r * (1 + proximity * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw bright focal stars with realistic optics & spikes
    for (let i = 0; i < brightStars.length; i++) {
      brightStars[i].phase += brightStars[i].speed;
      drawBrightStar(brightStars[i], px, clampedPy);
    }

    // Interactive stardust trail & occasional meteors
    drawStardust();
    drawShooters();
    if (frame % 380 === 120 && Math.random() < 0.75) {
      spawnShooter();
    }

    requestAnimationFrame(animate);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStaticSky();
    buildLiveStars();
  }

  let prevX = null, prevY = null;
  window.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    if (!cursorActive) {
      smoothCursorX = cursorX;
      smoothCursorY = cursorY;
      cursorActive = true;
    }

    if (prevX !== null) {
      const vx = cursorX - prevX;
      const vy = cursorY - prevY;
      const speed = Math.hypot(vx, vy);
      if (speed > 2) {
        const count = Math.min(3, Math.floor(speed / 12) + 1);
        for (let i = 0; i < count; i++) {
          spawnStardust(cursorX, cursorY, vx, vy);
        }
      }
    }
    prevX = cursorX;
    prevY = cursorY;

    targetMX = ((e.clientX / W) - 0.5) * -28;
    targetMY = ((e.clientY / H) - 0.5) * -28;
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    cursorActive = false;
    prevX = null;
    prevY = null;
  });

  window.addEventListener('scroll', () => {
    scrollOffset = window.scrollY;
  }, { passive: true });

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(animate);
})();


// ─── COSMIC CURSOR AURA & GLASS SPOTLIGHT ───────
(function initCursorAura() {
  const aura = document.getElementById('cursor-aura');
  const core = document.getElementById('cursor-aura-core');
  if (!aura || !core) return;

  // Skip on touch devices
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  let mouseX = -500, mouseY = -500;
  let auraX = -500, auraY = -500;
  let coreX = -500, coreY = -500;
  let visible = false;
  let hoverBoost = 1;

  const glassCards = document.querySelectorAll('.glass-card');

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!visible) {
      auraX = mouseX;
      auraY = mouseY;
      coreX = mouseX;
      coreY = mouseY;
      aura.style.opacity = '1';
      core.style.opacity = '1';
      visible = true;
    }

    // Update glass card radial spotlight coordinates
    for (let i = 0; i < glassCards.length; i++) {
      const card = glassCards[i];
      const rect = card.getBoundingClientRect();
      const pad = 90;
      if (
        mouseX >= rect.left - pad &&
        mouseX <= rect.right + pad &&
        mouseY >= rect.top - pad &&
        mouseY <= rect.bottom + pad
      ) {
        card.style.setProperty('--mouse-x', `${mouseX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${mouseY - rect.top}px`);
        card.classList.add('aura-active');
      } else {
        card.classList.remove('aura-active');
      }
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    aura.style.opacity = '0';
    core.style.opacity = '0';
    visible = false;
    glassCards.forEach(c => c.classList.remove('aura-active'));
  });

  // Boost star brightness slightly when hovering interactive items
  const interactiveSelector = 'a, button, .btn, .badge, .social-pill, .glass-card';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSelector)) {
      hoverBoost = 1.22;
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactiveSelector)) {
      hoverBoost = 1;
    }
  });

  let currentScale = 1;
  let pulsePhase = 0;
  function tick() {
    pulsePhase += 0.06;
    const twinkle = 0.96 + 0.06 * Math.sin(pulsePhase);

    auraX += (mouseX - auraX) * 0.28;
    auraY += (mouseY - auraY) * 0.28;
    coreX += (mouseX - coreX) * 0.45;
    coreY += (mouseY - coreY) * 0.45;
    currentScale += (hoverBoost - currentScale) * 0.14;

    const finalScale = currentScale * twinkle;
    aura.style.transform = `translate3d(${auraX}px, ${auraY}px, 0) translate(-50%, -50%) scale(${finalScale.toFixed(3)})`;
    core.style.transform = `translate3d(${coreX}px, ${coreY}px, 0) translate(-50%, -50%) scale(${(finalScale * 1.05).toFixed(3)})`;

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();


// ─── NAVBAR SCROLL EFFECT ──────────────────────
const navbar = document.getElementById('navbar');

function handleNavbarScroll() {
  if (!navbar) return;
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', handleNavbarScroll, { passive: true });
handleNavbarScroll();


// ─── HAMBURGER MENU TOGGLE ─────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}


// ─── SMOOTH SCROLL FOR ANCHOR LINKS ───────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


// ─── TYPEWRITER EFFECT ──────────────────────────
(function typewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const words = [
    'Software Developer',
    'AI Enthusiast',
    'Cybersecurity Curious',
    'Creative Freelancer',
    'Event Anchor'
  ];

  let wordIdx = 0;
  let charIdx = 0;
  let deleting = false;
  const typingSpeed = 80;
  const deletingSpeed = 45;
  const pauseAfterWord = 1800;
  const pauseBeforeType = 400;

  function tick() {
    const currentWord = words[wordIdx];

    if (!deleting) {
      el.textContent = currentWord.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === currentWord.length) {
        setTimeout(() => {
          deleting = true;
          tick();
        }, pauseAfterWord);
        return;
      }
      setTimeout(tick, typingSpeed);
    } else {
      el.textContent = currentWord.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        wordIdx = (wordIdx + 1) % words.length;
        setTimeout(tick, pauseBeforeType);
        return;
      }
      setTimeout(tick, deletingSpeed);
    }
  }

  setTimeout(tick, pauseBeforeType);
})();


// ─── SCROLL REVEAL ──────────────────────────────
(function scrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  // Stagger cards/grid items
  document.querySelectorAll(
    '.skills-grid, .projects-grid, .blog-grid, .contact-links, .about-stats, .explore-grid'
  ).forEach(grid => {
    grid.querySelectorAll('.reveal').forEach((child, idx) => {
      child.dataset.delay = (idx * 0.08).toFixed(2);
    });
  });

  if (!('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay
            ? parseFloat(entry.target.dataset.delay)
            : 0;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay * 1000);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    }
  );

  revealEls.forEach(el => observer.observe(el));
})();


// ─── ACTIVE NAV LINK (MULTI-PAGE + SCROLL FALLBACK) ──
(function activeNavHighlight() {
  const navItems = document.querySelectorAll('.nav-link');
  if (!navItems.length) return;

  const normalizePage = (pathStr) => {
    const cleaned = (pathStr || '').split('#')[0].split('?')[0].replace(/\/+$/, '');
    const segment = cleaned.split('/').pop() || 'index.html';
    if (!segment || segment === 'index' || segment === 'index.html') return 'index';
    return segment.replace(/\.html$/i, '').toLowerCase();
  };

  const currentPage = normalizePage(window.location.pathname);

  navItems.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) return;
    const linkPage = normalizePage(href);
    link.classList.toggle('active', linkPage === currentPage);
  });
})();


// ─── BLOG ARTICLE READER MODAL ─────────────────
(function initBlogModal() {
  const modal = document.getElementById('articleModal');
  if (!modal) return;

  const closeBtn = document.getElementById('articleModalClose');
  const tagEl    = document.getElementById('articleModalTag');
  const dateEl   = document.getElementById('articleModalDate');
  const titleEl  = document.getElementById('articleModalTitle');
  const bodyEl   = document.getElementById('articleModalBody');

  const articles = {
    'python-data-analysis': {
      tag: 'Python',
      date: 'Data Analysis',
      title: 'Getting Started with Python for Data Analysis',
      body: `
        <p>Python has become the go-to language for data analysis thanks to its readable syntax and an ecosystem of specialized libraries that turn raw spreadsheets and databases into clear insights.</p>
        <h4>Core Libraries to Learn First</h4>
        <ul>
          <li><strong>NumPy</strong> — Fast multi-dimensional arrays and vectorized mathematical operations.</li>
          <li><strong>Pandas</strong> — DataFrames for loading CSV/SQL data, filtering rows, handling missing values, and grouping summaries.</li>
          <li><strong>Matplotlib &amp; Seaborn</strong> — Turning numerical trends into readable line charts, bar graphs, and heatmaps.</li>
        </ul>
        <h4>A Practical Workflow</h4>
        <p>Start by inspecting your dataset with <code>df.info()</code> and <code>df.describe()</code>, clean duplicate or null entries, engineer meaningful columns, and visualize distributions before drawing conclusions. Practicing on real-world CSV datasets is the fastest way to build intuition.</p>
      `
    },
    'android-journey': {
      tag: 'Android',
      date: 'Mobile Dev',
      title: 'My Journey into Android Development',
      body: `
        <p>Stepping into mobile development with Android Studio was a completely different experience compared to writing console programs — suddenly, layout hierarchy, user touch flows, and device lifecycles all mattered at once.</p>
        <h4>Key Lessons Along the Way</h4>
        <ul>
          <li><strong>Understand the Activity Lifecycle</strong> — Knowing when <code>onCreate</code>, <code>onResume</code>, and <code>onPause</code> run prevents subtle state bugs.</li>
          <li><strong>Keep UI Responsive</strong> — Moving heavy tasks off the main thread makes apps feel smooth and polished.</li>
          <li><strong>Build Small, Complete Apps</strong> — Shipping a simple utility from wireframe to APK teaches far more than passively watching tutorials.</li>
        </ul>
        <p>Seeing your own code come alive on a physical phone is one of the most rewarding feelings in computer science — and it keeps pushing me to explore more mobile and AI-powered ideas.</p>
      `
    },
    'cybersecurity-basics': {
      tag: 'Cybersecurity',
      date: 'Security',
      title: 'Cybersecurity Basics Every Developer Should Know',
      body: `
        <p>Good software isn't just fast and functional — it protects the people who use it. Building security awareness early saves countless headaches later in production.</p>
        <h4>Foundational Practices</h4>
        <ul>
          <li><strong>Prevent SQL Injection</strong> — Always use parameterized queries or prepared statements instead of concatenating user input into SQL strings.</li>
          <li><strong>Guard Against XSS</strong> — Escape and sanitize untrusted content before rendering it in the DOM.</li>
          <li><strong>Secure Authentication</strong> — Never store plaintext passwords; use strong salted hashing (like bcrypt or Argon2) and enforce HTTPS everywhere.</li>
          <li><strong>Principle of Least Privilege</strong> — Give accounts, API keys, and database users only the minimum permissions they genuinely need.</li>
        </ul>
        <p>Thinking like both a builder and a defender makes you a stronger engineer across web, mobile, and backend systems.</p>
      `
    }
  };

  function openModal(id) {
    const article = articles[id];
    if (!article) return;
    tagEl.textContent = article.tag;
    dateEl.textContent = article.date;
    titleEl.textContent = article.title;
    bodyEl.innerHTML = article.body;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.blog-read-more[data-article]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn.dataset.article);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();


// ─── CONTACT FORM → MAILTO ─────────────────────
(function contactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = document.getElementById('contactName').value.trim();
    const email   = document.getElementById('contactEmail').value.trim();
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
      showFormFeedback(form, 'Please fill in your name, email, and message.', 'error');
      return;
    }

    const toEmail = 'priyanshuyaduvanshi0017@gmail.com';
    const mailSubject = encodeURIComponent(
      subject || `Portfolio Contact from ${name}`
    );
    const mailBody = encodeURIComponent(
      `Hi Priyanshu,\n\nMy name is ${name} (${email}).\n\n${message}\n\nBest,\n${name}`
    );

    window.location.href = `mailto:${toEmail}?subject=${mailSubject}&body=${mailBody}`;

    showFormFeedback(form, '✅ Opening your email client… Talk soon!', 'success');
    setTimeout(() => form.reset(), 1500);
  });

  function showFormFeedback(formEl, msg, type) {
    let feedback = formEl.querySelector('.form-feedback');
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.className = 'form-feedback';
      feedback.style.cssText = `
        margin-top: 1rem;
        font-size: 0.88rem;
        font-weight: 600;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        transition: opacity 0.3s ease;
      `;
      formEl.appendChild(feedback);
    }

    feedback.textContent = msg;
    feedback.style.background = type === 'success'
      ? 'rgba(16, 185, 129, 0.15)'
      : 'rgba(239, 68, 68, 0.15)';
    feedback.style.color = type === 'success' ? '#34d399' : '#f87171';
    feedback.style.border = `1px solid ${type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`;
    feedback.style.opacity = '1';

    setTimeout(() => { feedback.style.opacity = '0'; }, 5000);
  }
})();
