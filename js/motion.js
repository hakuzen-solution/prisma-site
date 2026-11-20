/* motion.js: sem dependências */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // reveal no scroll
  const targets = $$(".reveal, .rule");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(el => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(el => io.observe(el));
  }

  // barra de progresso + header
  const bar = $(".progress i"), nav = $(".nav");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      if (nav) nav.classList.toggle("is-scrolled", scrollY > 24);
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // método sticky: o número do painel acompanha o passo ativo
  const steps = $$(".step"), num = $(".steps .display .num"), cap = $(".steps .display small");
  if (steps.length && num) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        steps.forEach(s => s.classList.toggle("is-active", s === e.target));
        const n = e.target.dataset.n, label = e.target.dataset.label || "";
        if (num.textContent !== n) {
          num.classList.add("swap");
          setTimeout(() => { num.textContent = n; if (cap) cap.textContent = label; num.classList.remove("swap"); }, reduce ? 0 : 250);
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(s => so.observe(s));
    steps[0].classList.add("is-active");
  }

  // FAQ: só um aberto por vez
  const items = $$(".faq details");
  items.forEach(d => d.addEventListener("toggle", () => { if (d.open) items.forEach(o => o !== d && (o.open = false)); }));
})();
