/* Botão flutuante de WhatsApp: fica no canto inferior esquerdo e, se estiver
   cobrindo conteúdo, desliza com animação para o canto oposto. */
(function () {
  var fab = document.querySelector(".fab");
  if (!fab) return;
  var side = "left", ticking = false;
  var SEL = "p,h1,h2,h3,h4,li,summary,a,button,img,svg,input,.mock,.dif-card,.col,.case,.eyebrow,.lead,.tag,.btn";

  function blocked(s) {
    var SIZE = fab.offsetWidth, EDGE = parseFloat(getComputedStyle(fab).bottom) || 20;
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var x0 = s === "left" ? EDGE : vw - EDGE - SIZE, y0 = vh - EDGE - SIZE;
    var pts = [[0, 0], [1, 0], [0, 1], [1, 1], [.5, .5]];
    for (var i = 0; i < pts.length; i++) {
      var els = document.elementsFromPoint(x0 + pts[i][0] * SIZE, y0 + pts[i][1] * SIZE);
      for (var j = 0; j < els.length; j++) {
        var el = els[j];
        if (el === fab || fab.contains(el)) continue;
        if (el.closest(".nav, .progress")) continue;
        if (el.matches(SEL) || el.closest(SEL)) return true;
        break;
      }
    }
    return false;
  }
  function update() {
    ticking = false;
    var other = side === "left" ? "right" : "left";
    if (blocked(side) && !blocked(other)) {
      side = other;
      fab.classList.toggle("is-right", side === "right");
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", req);
  setTimeout(req, 600);
})();
