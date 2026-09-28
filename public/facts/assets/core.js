// Shared runtime: canvas sizing, offscreen-paused loops, data loading, theme, Esc-to-close.
window.VIZ = window.VIZ || {};
const KF = (window.KF = {});

KF.base = document.documentElement.dataset.base || ".";
KF.cache = {};
KF.data = async (name) => {
  if (!KF.cache[name]) KF.cache[name] = fetch(`${KF.base}/data/${name}.json`).then((r) => r.json());
  return KF.cache[name];
};

KF.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Canvas that tracks its box size and device pixel ratio.
KF.canvas = (host) => {
  const c = document.createElement("canvas");
  host.appendChild(c);
  const ctx = c.getContext("2d");
  const s = { c, ctx, w: 0, h: 0, dpr: 1 };
  const fit = () => {
    const r = host.getBoundingClientRect();
    s.dpr = Math.min(devicePixelRatio || 1, 2);
    s.w = r.width; s.h = r.height;
    c.width = Math.round(r.width * s.dpr); c.height = Math.round(r.height * s.dpr);
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    s.onresize && s.onresize();
    host._kfStill && host._kfStill(); // resizing clears the canvas; repaint if the loop is paused
  };
  new ResizeObserver(fit).observe(host);
  fit();
  return s;
};

// Run draw(t) every frame only while the host is on screen.
KF.loop = (host, draw) => {
  let on = false, raf = 0, t0 = performance.now();
  const tick = (now) => { draw((now - t0) / 1000); if (on) raf = requestAnimationFrame(tick); };
  host._kfStill = () => { if (!on) draw(KF.reduced ? 60 : 3.5); };
  new IntersectionObserver(([e]) => {
    on = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (on) raf = requestAnimationFrame(tick);
  }).observe(host);
  // paint one still frame right away so offscreen cards are never blank
  requestAnimationFrame(() => draw(3.5));
};

KF.fmt = (n, d = 0) => Number(n).toLocaleString("ko-KR", { maximumFractionDigits: d, minimumFractionDigits: d });
KF.ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
KF.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
KF.lerp = (a, b, t) => a + (b - a) * t;

// Mount thumbnails on the index/"more" grid.
KF.thumbs = async () => {
  for (const el of document.querySelectorAll("[data-thumb]")) {
    const v = VIZ[el.dataset.thumb];
    if (!v) continue;
    try { // one broken card must not stop the rest
      const data = await KF.data(el.dataset.thumb);
      const s = KF.canvas(el);
      const paint = (t) => { try { v.thumb(s.ctx, s.w, s.h, t, data); } catch (e) { console.warn(el.dataset.thumb, e); } };
      if (KF.reduced) { el._kfStill = () => paint(3.5); paint(3.5); } // reduced motion: one still frame, no loop
      else KF.loop(el, paint);
    } catch (e) { console.warn("thumb", el.dataset.thumb, e); }
  }
};

// Theme toggle (stored per viewer only).
KF.theme = () => {
  const btn = document.querySelector("[data-theme-toggle]");
  try { const t = localStorage.getItem("kf-theme"); if (t) document.documentElement.dataset.theme = t; } catch {}
  btn && btn.addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("kf-theme", document.documentElement.dataset.theme); } catch {}
  });
};

// Quiz: click an option, reveal the answer.
KF.quiz = () => {
  for (const q of document.querySelectorAll(".quiz")) {
    q.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || q.classList.contains("done")) return;
      q.classList.add("done");
      for (const x of q.querySelectorAll("button")) x.classList.add(x.dataset.right ? "right" : "wrong");
    });
  }
};

// Build segmented buttons: [{id,label}] -> calls onpick(id)
KF.segment = (host, items, pick, onpick) => {
  const btns = items.map(({ id, label }) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = label; b.setAttribute("aria-pressed", String(id === pick));
    b.onclick = () => { btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b))); onpick(id); };
    host.appendChild(b);
    return b;
  });
  return btns;
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.dataset.page === "detail") location.href = `${KF.base}/`;
});
document.addEventListener("DOMContentLoaded", () => { KF.theme(); KF.thumbs(); KF.quiz(); });
