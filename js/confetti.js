// confetti.js — a self-contained canvas confetti burst for celebrations.

const BASE_COLORS = ['#f7c948', '#ff7a59', '#4c9aff', '#37b26b', '#ef5da8', '#8b5cf6'];

/** Tints/shades around a grade's hue (+ a warm neutral) so the burst matches the
 *  color world of the level just finished. */
function paletteFromHue(h) {
  return [
    `hsl(${h} 85% 62%)`,
    `hsl(${h} 90% 72%)`,
    `hsl(${(h + 28) % 360} 82% 60%)`,
    `hsl(${(h + 332) % 360} 84% 64%)`,
    `hsl(${h} 70% 50%)`,
    '#fff6cf',
  ];
}

export function confetti({ count = 130, duration = 2800, hue = null } = {}) {
  const COLORS = hue == null ? BASE_COLORS : paletteFromHue(hue);
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H;

  const resize = () => {
    W = canvas.width = window.innerWidth * dpr;
    H = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  };
  resize();
  window.addEventListener('resize', resize);

  const parts = Array.from({ length: count }, (_, i) => ({
    x: Math.random() * W,
    y: -Math.random() * H * 0.4 - 20 * dpr,
    vx: (Math.random() - 0.5) * 2.2 * dpr,
    vy: (2 + Math.random() * 3.5) * dpr,
    r: (4 + Math.random() * 6) * dpr,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.35,
    color: COLORS[i % COLORS.length],
    rect: Math.random() < 0.55,
  }));

  const start = performance.now();
  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03 * dpr;         // gravity
      p.vx += Math.sin(now / 300 + p.y) * 0.02 * dpr; // wobble
      p.rot += p.vr;
      const fade = t > duration - 600 ? Math.max(0, (duration - t) / 600) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.rect) ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
      else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (t < duration) requestAnimationFrame(frame);
    else { window.removeEventListener('resize', resize); canvas.remove(); }
  }
  requestAnimationFrame(frame);
}
