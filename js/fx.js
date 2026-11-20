/* fx.js: efeitos de dinamismo (estilo tech). Sem dependências.
   - <canvas class="dots" data-dots>   campo de pontos que reage ao mouse e ao scroll
   - <div class="scene" data-scene>     cena de scroll: define --p (0 a 1) no elemento
   - .spot                              brilho que segue o mouse (define --mx/--my)
   - <video muted loop playsinline data-hoverplay>   toca ao passar o mouse
   Tudo desliga com prefers-reduced-motion. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mouse = { x: -9999, y: -9999 };
  addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  // ---------- campo de pontos ----------
  $$("canvas[data-dots]").forEach(cv => {
    const ctx = cv.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue("--accent").trim() || "#fff";
    const base = css.getPropertyValue("--text").trim() || "#fff";
    const rainbow = "rainbow" in cv.dataset;
    const gap = +cv.dataset.gap || 28, reach = +cv.dataset.reach || 170;
    let w = 0, h = 0, dpr = 1, visible = false, raf = 0;

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(0);
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      const r = cv.getBoundingClientRect();
      const mx = mouse.x - r.left, my = mouse.y - r.top;
      const sy = scrollY * 0.08;                 // scroll desloca a "onda"
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          const wave = reduce ? 0 : Math.sin(t * 0.0012 + x * 0.012 + (y + sy) * 0.014);
          const d = Math.hypot(x - mx, y - my);
          const k = d < reach ? 1 - d / reach : 0;
          const a = 0.16 + 0.08 * wave + k * 0.85;
          const rad = 1.1 + 0.3 * wave + k * 2.2;
          ctx.globalAlpha = Math.max(0, Math.min(1, a));
          ctx.fillStyle = k > 0.05 ? (rainbow ? `hsl(${190 + 150 * (x / w)},90%,65%)` : accent) : base;
          ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill();
        }
      }
    };
    const loop = (t) => { draw(t); raf = visible ? requestAnimationFrame(loop) : 0; };

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf && !reduce) raf = requestAnimationFrame(loop);
    }).observe(cv);
    new ResizeObserver(resize).observe(cv);
    resize();
  });

  // ---------- cena de scroll (--p de 0 a 1) ----------
  const scenes = $$("[data-scene]");
  if (scenes.length && !reduce) {
    let tick = false;
    const update = () => {
      scenes.forEach(s => {
        const r = s.getBoundingClientRect();
        const total = r.height - innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
        s.style.setProperty("--p", p.toFixed(4));
      });
      tick = false;
    };
    addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update); update();
  }

  // ---------- brilho que segue o mouse ----------
  $$(".spot").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  });

  // ---------- vídeo toca no hover ----------
  $$("video[data-hoverplay]").forEach(v => {
    const host = v.closest(".case") || v;
    host.addEventListener("pointerenter", () => v.play().catch(() => {}));
    host.addEventListener("pointerleave", () => v.pause());
  });
})();
