// Aether flow — ambient particle field behind every page. Vanilla canvas, no deps.
// Particles drift on a slow curl field, link to nearby neighbours, and swirl away
// from the cursor. Hue follows the chapter you're reading (see setHue).

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

const canvas = document.createElement('canvas');
canvas.id = 'aether';
canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);
const ctx = canvas.getContext('2d');

let W = 0;
let H = 0;
let particles = [];
let hue = 204;
let targetHue = 204;
const mouse = { x: -1e4, y: -1e4, active: false };

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // density scales with area, capped so phones don't burn battery on this
  const count = Math.round(Math.min(120, Math.max(40, (W * H) / 9000)));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: 0,
    vy: 0,
    // seeds keep each particle on its own path through the curl field
    sx: Math.random() * 1000,
    sy: Math.random() * 1000,
    r: 0.8 + Math.random() * 1.8,
    a: 0.4 + Math.random() * 0.5,
  }));
}

/** Point the field at a chapter's accent hue; it eases over rather than snapping. */
export function setHue(h) {
  targetHue = h;
}

function step(t) {
  hue += (targetHue - hue) * 0.02;
  const time = t * 0.00006;

  ctx.clearRect(0, 0, W, H);

  for (const p of particles) {
    // curl-ish flow: cheap sin/cos field, no noise library needed
    const ax = Math.cos(p.y * 0.0035 + p.sx + time) * 0.035;
    const ay = Math.sin(p.x * 0.0035 + p.sy + time) * 0.035;
    p.vx += ax;
    p.vy += ay;

    if (mouse.active) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 36000 && d2 > 1) {
        // perpendicular push = swirl rather than plain repulsion
        const f = (1 - d2 / 36000) * 0.5;
        const d = Math.sqrt(d2);
        p.vx += (-dy / d) * f;
        p.vy += (dx / d) * f;
      }
    }

    p.vx *= 0.94;
    p.vy *= 0.94;
    p.x += p.vx;
    p.y += p.vy;

    // wrap
    if (p.x < -20) p.x = W + 20;
    if (p.x > W + 20) p.x = -20;
    if (p.y < -20) p.y = H + 20;
    if (p.y > H + 20) p.y = -20;
  }

  // links first, so dots sit on top
  ctx.lineWidth = 1;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 26000) continue;
      const o = (1 - d2 / 26000) * 0.3;
      ctx.strokeStyle = `hsl(${hue} 80% 68% / ${o})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  for (const p of particles) {
    ctx.fillStyle = `hsl(${hue + (p.sx % 40) - 20} 85% 72% / ${p.a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

let raf = null;
function loop(t) {
  step(t);
  raf = requestAnimationFrame(loop);
}
function start() {
  if (!raf && !REDUCED.matches && !document.hidden) raf = requestAnimationFrame(loop);
}
function stop() {
  if (raf) cancelAnimationFrame(raf);
  raf = null;
}

addEventListener('resize', () => {
  resize();
  if (REDUCED.matches) step(0);
});
addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return; // let phones scroll in peace
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;
});
addEventListener('pointerleave', () => { mouse.active = false; });
document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
REDUCED.addEventListener('change', () => {
  stop();
  REDUCED.matches ? step(0) : start();
});

resize();
step(0); // paint immediately — no blank canvas before the first frame
if (!REDUCED.matches) start(); // reduced motion keeps that still frame
