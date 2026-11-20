/* build.js: "site sendo montado em tempo real". Sem dependências.
   Estrutura do HTML:
   <div data-build="loop" data-tpl="#site-tpl"> <div class="mock"><div class="mock-bar">…</div><div class="mock-body"></div></div> <div class="build-log"><span></span></div> </div>
   <div data-build="scroll" data-tpl="#site-tpl" class="scroll-build"><div class="stage"> …mesmo mock… <div class="build-log"><span></span></div><div class="build-bar"><i></i></div></div></div>
   O <template id="site-tpl"> tem blocos .mb com data-id (loop) e data-at / data-out / data-label (scroll). */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  const mount = host => {
    const body = host.querySelector(".mock-body");
    body.appendChild(document.querySelector(host.dataset.tpl).content.cloneNode(true));
    return body;
  };
  const say = (host, text) => {
    const log = host.querySelector(".build-log"); if (!log) return;
    const s = log.querySelector("span"); if (s.textContent === text) return;
    s.textContent = text; log.classList.remove("flash"); void log.offsetWidth; log.classList.add("flash");
  };

  /* ---------- JEITO 1: roteiro automático em loop ---------- */
  $$('[data-build="loop"]').forEach(host => {
    const body = mount(host);
    const q = id => body.querySelector(`[data-id="${id}"]`);
    if (reduce) { body.querySelectorAll(".mb").forEach(b => b.classList.add("in")); q("c2b")?.classList.remove("in"); return; }

    const cur = document.createElement("div");
    cur.className = "cur";
    cur.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 2l7 19 2.6-7.4L20 11z" fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/></svg><em>Designer</em>';
    body.appendChild(cur);

    let visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.25 }).observe(host);
    const wait = async ms => { await sleep(ms); while (!visible) await sleep(250); };

    const show = id => { const e = q(id); e.classList.remove("out"); e.classList.add("in"); };
    const hide = id => { const e = q(id); e.classList.remove("in"); e.classList.add("out"); };
    const moveTo = (id, label) => {
      const b = body.getBoundingClientRect(), r = q(id).getBoundingClientRect();
      cur.querySelector("em").textContent = label || "Designer";
      cur.classList.add("on");
      cur.style.transform = `translate(${r.left - b.left + r.width * 0.55}px, ${r.top - b.top + r.height * 0.55}px)`;
    };
    const click = () => { cur.classList.remove("click"); void cur.offsetWidth; cur.classList.add("click"); };
    const type = (id, ms) => new Promise(done => {
      const e = q(id), full = e.dataset.text || e.textContent; e.dataset.text = full;
      e.textContent = ""; e.classList.add("in", "caret"); let i = 0;
      const t = setInterval(() => { e.textContent = full.slice(0, ++i); if (i >= full.length) { clearInterval(t); setTimeout(() => e.classList.remove("caret"), 700); done(); } }, ms / full.length);
    });
    const cartEl = body.querySelector("[data-cart-count]");
    const reset = () => { if (cartEl) cartEl.textContent = "0"; body.querySelectorAll(".mb").forEach(b => b.classList.remove("in", "out", "caret")); const t = q("title"); if (t) t.textContent = t.dataset.text || t.textContent; cur.classList.remove("on"); };

    (async () => {
      for (;;) {
        reset(); await wait(900);
        say(host, "+ header");            show("nav");   await wait(900);
        say(host, "+ título da oferta");   await type("title", 1400); await wait(400);
        say(host, "+ texto de apoio");    show("sub");   await wait(800);
        say(host, "+ botão comprar");     show("btn");   await wait(900);
        moveTo("btn", "Designer");        await wait(1100);
        say(host, "botão de compra em roxo"); click(); q("btn").classList.add("pulse"); await wait(900);
        say(host, "+ vitrine de produtos"); show("c1"); await wait(350); show("c2"); await wait(350); show("c3"); await wait(900);
        moveTo("c2", "Designer");         await wait(1100);
        say(host, "− produto removido");   click(); hide("c2"); await wait(900);
        say(host, "+ produto novo no lugar"); show("c2b"); await wait(1100);
        cur.classList.remove("on");
        say(host, "+ faixa de frete grátis"); show("metric"); await wait(1000);
        say(host, "+ rodapé");            show("foot");  await wait(800);
        say(host, "loja no ar ✓");         await wait(1300);
        say(host, "um cliente chega…");  moveTo("c3", "Cliente"); await wait(1400);
        click(); if (cartEl) { cartEl.textContent = "1"; cartEl.parentElement.classList.add("bump"); }
        say(host, "+ 1 pedido · venda feita ✓"); await wait(1200); cur.classList.remove("on"); await wait(2200);
        say(host, "desmontando…");
        if (cartEl) cartEl.parentElement.classList.remove("bump");
        for (const id of ["foot", "metric", "c3", "c2b", "c1", "btn", "sub", "title", "nav"]) { hide(id); await wait(170); }
        await wait(900);
      }
    })();
  });

  /* ---------- JEITO 2: preso ao scroll ---------- */
  $$('[data-build="scroll"]').forEach(host => {
    const body = mount(host);
    const blocks = $$("[data-at]", body);
    const bar = host.querySelector(".build-bar i");
    const events = [];
    blocks.forEach(b => {
      if (b.dataset.label) events.push({ p: +b.dataset.at, l: b.dataset.label });
      if (b.dataset.out && b.dataset.labelOut) events.push({ p: +b.dataset.out, l: b.dataset.labelOut });
    });
    events.sort((a, b) => a.p - b.p);
    $$("[data-type]", body).forEach(t => { t.dataset.text = t.textContent; });

    if (reduce) { blocks.forEach(b => b.classList.add("in")); return; }
    let tick = false;
    const update = () => {
      const r = host.getBoundingClientRect();
      const total = host.offsetHeight - innerHeight;
      const p = total > 0 ? clamp(-r.top / total) : 0;
      blocks.forEach(b => {
        const at = +b.dataset.at, out = b.dataset.out ? +b.dataset.out : 99;
        b.classList.toggle("in", p >= at && p < out);
        b.classList.toggle("out", p >= out);
        if (b.dataset.type) { // digita conforme o scroll
          const n = Math.floor(b.dataset.text.length * clamp((p - at) / 0.1));
          b.textContent = b.dataset.text.slice(0, n);
          b.classList.toggle("caret", n > 0 && n < b.dataset.text.length);
        }
      });
      const last = events.filter(e => e.p <= p).pop();
      say(host, last ? last.l : "role para montar o site");
      if (bar) bar.style.transform = `scaleX(${p})`;
      tick = false;
    };
    addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update); update();
  });
  /* ---------- VITRINE: vários tipos de site, um após o outro (data-build="showcase") ----------
     Dentro do host: .chips (abas geradas), .scene-desc, .mock, .build-log e vários
     <template data-scene data-title data-url data-desc data-done data-bg data-vars> com blocos .mb ordenados por data-at.
     data-bg / data-vars: fundo e variáveis CSS do exemplo (cada cena tem a sua identidade visual).
     Atributos dos blocos:
       data-type        digita o texto
       data-click       cursor vai até o bloco e clica
       data-click-on    seletor de um elemento JÁ visível que o cursor clica ANTES de este bloco aparecer (resultado do clique)
       data-who         nome no cursor (padrão: data-cursor do host)
       data-out         será removido quando entrar um bloco com data-at maior (troca); data-quiet = sem cursor
       data-ttl         some sozinho após N ms (avisos/toasts)
       data-gap         pausa (ms) depois de entrar (padrão 650)
       data-cart        ao entrar, o carrinho [data-cart-count] vai para 1 */
  $$('[data-build="showcase"]').forEach(host => {
    const CANCEL = Symbol("cancel");
    const body = host.querySelector(".mock-body");
    const urlEl = host.querySelector(".mock-bar span");
    const chipsBox = host.querySelector(".chips");
    const descEl = host.querySelector(".scene-desc");
    const scenes = $$("template[data-scene]", host);
    const builder = host.dataset.cursor || "Prisma";
    const stage = document.createElement("div"); stage.className = "scene-stage"; body.appendChild(stage);
    const cur = document.createElement("div"); cur.className = "cur";
    cur.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 2l7 19 2.6-7.4L20 11z" fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/></svg><em></em>';
    body.appendChild(cur);
    let token = 0, idx = 0, visible = false;

    const chips = scenes.map((t, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.setAttribute("role", "tab"); b.textContent = t.dataset.title;
      b.addEventListener("click", () => go(i)); chipsBox.appendChild(b); return b;
    });
    const setScene = i => {
      const t = scenes[i];
      chips.forEach((c, k) => { c.classList.toggle("on", k === i); c.setAttribute("aria-selected", k === i); });
      descEl.textContent = t.dataset.desc; urlEl.textContent = t.dataset.url;
      body.style.cssText = (t.dataset.vars || "") + ";background:" + (t.dataset.bg || "");
      stage.replaceChildren(t.content.cloneNode(true)); cur.classList.remove("on");
    };

    if (reduce) { // sem animação: mostra a cena pronta
      const showStatic = i => { setScene(i); stage.querySelectorAll(".mb").forEach(b => b.classList.add(b.dataset.out || b.dataset.ttl ? "out" : "in")); say(host, scenes[i].dataset.done); };
      chips.forEach((c, k) => c.addEventListener("click", () => showStatic(k)));
      showStatic(0); return;
    }

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.25 }).observe(host);
    const wait = async (ms, my) => { await sleep(ms); while (!visible) await sleep(250); if (my !== token) throw CANCEL; };
    const moveTo = (el, name) => {
      const b = body.getBoundingClientRect(), r = el.getBoundingClientRect();
      cur.querySelector("em").textContent = name || builder; cur.classList.add("on");
      cur.style.transform = `translate(${r.left - b.left + r.width * 0.55}px, ${r.top - b.top + r.height * 0.55}px)`;
    };
    const click = () => { cur.classList.remove("click"); void cur.offsetWidth; cur.classList.add("click"); };
    const show = el => { el.classList.remove("out"); el.classList.add("in"); };
    const hide = el => { el.classList.remove("in"); el.classList.add("out"); };
    const typeIn = (el, ms) => new Promise(done => {
      const full = el.textContent; el.textContent = ""; el.classList.add("in", "caret"); let n = 0;
      const t = setInterval(() => { el.textContent = full.slice(0, ++n); if (n >= full.length) { clearInterval(t); setTimeout(() => el.classList.remove("caret"), 600); done(); } }, ms / full.length);
    });

    const play = async (i, my) => {
      setScene(i); const t = scenes[i];
      const blocks = $$(".mb", stage).sort((a, b) => a.dataset.at - b.dataset.at);
      const cart = stage.querySelector("[data-cart-count]");
      say(host, "montando: " + t.dataset.title.toLowerCase() + "…"); await wait(1000, my);
      const shown = [];
      for (const b of blocks) {
        if (b.dataset.clickOn) { // alguém usa o site; o resultado aparece em seguida
          const target = stage.querySelector(b.dataset.clickOn);
          if (target) { say(host, "alguém usa o site…"); moveTo(target, b.dataset.who); await wait(1200, my); click(); target.classList.add("pulse"); await wait(650, my); }
        }
        for (const s of shown) if (s.dataset.out && !s.classList.contains("out") && +s.dataset.out <= +b.dataset.at) {
          if (s.hasAttribute("data-quiet")) { hide(s); continue; }
          moveTo(s); await wait(1100, my); click(); hide(s); say(host, s.dataset.labelOut || "− removido"); await wait(900, my);
        }
        if (b.dataset.label) say(host, b.dataset.label);
        if (b.hasAttribute("data-type")) { await typeIn(b, 1300); await wait(450, my); }
        else {
          show(b);
          if (b.hasAttribute("data-cart") && cart) { cart.textContent = "1"; cart.parentElement.classList.add("bump"); }
          if (b.dataset.ttl) { const ms = +b.dataset.ttl; setTimeout(() => { if (my === token) hide(b); }, ms); }
          await wait(+(b.dataset.gap || 650), my);
        }
        if (b.hasAttribute("data-click")) { moveTo(b, b.dataset.who); await wait(1100, my); click(); b.classList.add("pulse"); await wait(800, my); }
        shown.push(b);
      }
      cur.classList.remove("on");
      say(host, t.dataset.done || "pronto ✓"); await wait(3600, my);
      say(host, "desmontando…");
      for (const b of blocks.reverse()) { hide(b); await wait(70, my); }
      await wait(700, my);
    };

    const start = () => {
      const my = ++token;
      (async () => {
        try { while (my === token) { await play(idx, my); idx = (idx + 1) % scenes.length; } }
        catch (e) { if (e !== CANCEL) throw e; }
      })();
    };
    const go = i => { idx = i; start(); };
    start();
  });
})();
