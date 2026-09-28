// 18 food — "위에서 본 밥상". A wooden table seen from above. One vessel per grain; the heap of grain in
// each vessel covers an area equal to that year's self-sufficiency (domestic production ÷ domestic use,
// feed excluded). Slide 1957 → 2023 and every vessel but the rice bowl empties. Second view: milk vs cheese.
(() => {
  const BG = "#d9c3a0";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const SERIF = "'Nanum Myeongjo', serif", HAND = "'Nanum Pen Script', cursive";
  const INK = "#3a2716", MUTE = "rgba(58,39,22,.66)", BLUE = "#3f5f95", RED = "#a8402a", PAPER = "#f7f1e4";

  // vessel materials: rim/well gradients (light, dark)
  const LOOK = {
    rice: { rim: ["#fdfbf6", "#ddd6c8"], well: ["#f5f1e8", "#d6cebd"], band: BLUE, k: 0.8 },     // white porcelain, blue band
    barley: { rim: ["#e2bf66", "#8a6420"], well: ["#d0a955", "#7a5719"], k: 0.8 },               // brass 유기
    wheat: { rim: ["#f6f1e6", "#d4cab6"], well: ["#eee7d9", "#cdc1aa"], k: 0.72, band: "#9a7b4f" }, // flat plate
    corn: { rim: ["#cbd8c1", "#8ea386"], well: ["#bccdb2", "#839879"], k: 0.8 },                 // celadon
    soy: { rim: ["#7a5236", "#3b2415"], well: ["#644029", "#321e11"], k: 0.8 },                  // lacquer
    tuber: { rim: ["#c9a063", "#86602f"], well: ["#b68d55", "#7a562b"], k: 0.8, weave: true },   // basket
    milk: { rim: ["#f4f8fa", "#bfcbd1"], well: ["#e9eff2", "#b6c3ca"], k: 0.9, glass: true },
    yog: { rim: ["#fdfdfb", "#d9d4ca"], well: ["#f4f1ea", "#d3cdc0"], k: 0.84 },
    cheese: { rim: ["#cfa56d", "#8a6232"], well: ["#c39a63", "#855f30"], k: 0.88 },
    butter: { rim: ["#f4f8fa", "#bfcbd1"], well: ["#e9eff2", "#b6c3ca"], k: 0.84, glass: true },
  };
  const BASE = { rice: "#e7e0cf", barley: "#b99a5e", wheat: "#9e6b35", corn: "#cf9818", soy: "#c7ae71", tuber: "#c09a58" };
  const SIZE = { rice: 0.15, barley: 0.15, wheat: 0.14, corn: 0.15, soy: 0.17, tuber: 0.3 };
  const DENS = { rice: 10, barley: 8.5, wheat: 8.5, corn: 5.2, soy: 4.6, tuber: 2.4 };

  const rng = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const rrect = (g, x, y, w, h, r) => {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  };

  // one grain, centred at the origin, long axis = L
  function grain(g, kind, L, rnd) {
    const lw = Math.max(0.35, L * 0.05);
    g.lineWidth = lw;
    if (kind === "rice") {
      g.fillStyle = rnd() < 0.15 ? "#f3eee2" : "#fcfaf3"; g.strokeStyle = "rgba(140,125,100,.55)";
      g.beginPath(); g.ellipse(0, 0, L / 2, L * 0.21, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.ellipse(-L * 0.08, -L * 0.06, L * 0.2, L * 0.06, 0, 0, 7); g.fill();
    } else if (kind === "barley" || kind === "wheat") {
      const w = kind === "barley" ? 0.27 : 0.25;
      g.fillStyle = kind === "barley" ? (rnd() < 0.3 ? "#cfb173" : "#dcc28a") : (rnd() < 0.3 ? "#b27a3c" : "#c69047");
      g.strokeStyle = kind === "barley" ? "rgba(110,80,35,.55)" : "rgba(95,55,20,.6)";
      g.beginPath(); g.ellipse(0, 0, L / 2, L * w, 0, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-L * 0.36, 0); g.lineTo(L * 0.36, 0); g.stroke();
    } else if (kind === "corn") {
      g.fillStyle = rnd() < 0.25 ? "#e9b21f" : "#f3c431"; g.strokeStyle = "rgba(150,95,10,.55)";
      rrect(g, -L * 0.36, -L * 0.3, L * 0.72, L * 0.6, L * 0.16); g.fill(); g.stroke();
      g.fillStyle = "rgba(255,236,150,.8)"; rrect(g, -L * 0.24, -L * 0.2, L * 0.3, L * 0.24, L * 0.08); g.fill();
    } else if (kind === "soy") {
      g.fillStyle = rnd() < 0.3 ? "#dcc27f" : "#e9d49a"; g.strokeStyle = "rgba(130,100,45,.5)";
      g.beginPath(); g.ellipse(0, 0, L * 0.46, L * 0.4, 0, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = "rgba(110,80,40,.7)"; g.lineWidth = lw * 1.4;
      g.beginPath(); g.moveTo(L * 0.3, -L * 0.1); g.lineTo(L * 0.36, L * 0.08); g.stroke();
      g.fillStyle = "rgba(255,250,225,.7)"; g.beginPath(); g.ellipse(-L * 0.12, -L * 0.14, L * 0.14, L * 0.08, -0.5, 0, 7); g.fill();
    } else if (kind === "tuber") {
      const sweet = rnd() < 0.6, s = L * (0.7 + rnd() * 0.3);
      g.fillStyle = sweet ? "#f0cf7c" : "#f2e3b8"; g.strokeStyle = sweet ? "#86314b" : "#b08448"; g.lineWidth = L * 0.1;
      rrect(g, -s / 2, -s / 2, s, s * (0.8 + rnd() * 0.3), s * 0.3); g.fill(); g.stroke();
    }
  }

  // Pre-rendered heap texture (full vessel) per kind and pixel size.
  const TEX = new Map();
  function texture(kind, R, dpr) {
    const key = `${kind}|${Math.round(R * dpr)}`;
    let c = TEX.get(key);
    if (c) return c;
    if (TEX.size > 80) TEX.clear();
    c = document.createElement("canvas");
    const S = Math.max(4, Math.ceil(2 * R * dpr));
    c.width = c.height = S;
    const g = c.getContext("2d");
    g.scale(S / (2 * R), S / (2 * R)); g.translate(R, R);
    const rnd = rng(1009 + kind.charCodeAt(0) * 31 + kind.length * 7);
    if (SIZE[kind]) {
      g.fillStyle = BASE[kind]; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
      const L = Math.max(2, R * SIZE[kind]);
      const n = Math.round(((R * R) / (L * L)) * DENS[kind]);
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.2832, rr = Math.sqrt(rnd()) * (R + L * 0.3);
        g.save(); g.translate(Math.cos(a) * rr, Math.sin(a) * rr); g.rotate(rnd() * 6.2832);
        grain(g, kind, L * (0.85 + rnd() * 0.3), rnd); g.restore();
      }
    } else dairyTex(g, kind, R, rnd);
    TEX.set(key, c);
    return c;
  }

  function dairyTex(g, kind, R, rnd) {
    if (kind === "milk" || kind === "yog") {
      const gr = g.createRadialGradient(-R * 0.25, -R * 0.3, R * 0.05, 0, 0, R);
      gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, kind === "milk" ? "#eceae2" : "#eadfc6");
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
      g.strokeStyle = kind === "milk" ? "rgba(205,200,185,.35)" : "rgba(205,180,130,.5)"; g.lineWidth = Math.max(0.6, R * 0.025);
      if (kind === "milk") for (let k = 1; k <= 5; k++) { g.beginPath(); g.arc(R * 0.06, R * 0.04, (R * k) / 5.6, 0, 7); g.stroke(); }
      else { g.beginPath(); for (let t = 0; t < 31; t += 0.08) { const r = (R * t) / 31; g.lineTo(Math.cos(t) * r, Math.sin(t) * r); } g.stroke(); }
    } else if (kind === "cheese") {
      g.fillStyle = "#f0c65c"; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
      for (let i = 0; i < 16; i++) {
        const a = rnd() * 6.2832, rr = Math.sqrt(rnd()) * R * 0.9, s = R * (0.04 + rnd() * 0.08);
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        g.fillStyle = "#d9a53e"; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
        g.fillStyle = "rgba(255,240,180,.7)"; g.beginPath(); g.arc(x + s * 0.2, y + s * 0.25, s * 0.6, 0.2, 2.8); g.fill();
      }
      g.strokeStyle = "rgba(190,140,40,.45)"; g.lineWidth = Math.max(0.6, R * 0.015);
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(-R, k * R * 0.36); g.lineTo(R, k * R * 0.36 + R * 0.1); g.stroke(); }
    } else if (kind === "butter") {
      g.fillStyle = "#f5df8e"; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
      g.strokeStyle = "rgba(222,186,86,.8)"; g.lineWidth = Math.max(0.7, R * 0.03);
      for (let i = 0; i < 26; i++) {
        const a = rnd() * 6.2832, rr = Math.sqrt(rnd()) * R, s = R * (0.08 + rnd() * 0.14);
        g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, s, rnd() * 3, rnd() * 3 + 2.4); g.stroke();
      }
    }
  }

  // Wood table, cached per size.
  const WOOD = new Map();
  function wood(w, h, dpr) {
    const key = `${Math.round(w)}x${Math.round(h)}@${dpr}`;
    let c = WOOD.get(key);
    if (c) return c;
    if (WOOD.size > 12) WOOD.clear();
    c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    g.fillStyle = BG; g.fillRect(0, 0, w, h);
    const rnd = rng(4242);
    const n = Math.max(3, Math.round(h / 115)), ph = h / n;
    for (let i = 0; i < n; i++) {
      const top = i * ph;
      g.fillStyle = i % 2 ? "rgba(255,246,225,.07)" : "rgba(110,72,34,.05)"; g.fillRect(0, top, w, ph);
      for (let y = top + 3; y < top + ph - 2; y += 3.2 + rnd() * 3) {
        g.strokeStyle = `rgba(118,80,40,${0.05 + rnd() * 0.1})`; g.lineWidth = 0.5 + rnd() * 0.9;
        const amp = 1 + rnd() * 3, f = 0.004 + rnd() * 0.006, ph0 = rnd() * 6;
        g.beginPath();
        for (let x = 0; x <= w; x += 14) g.lineTo(x, y + Math.sin(x * f + ph0) * amp);
        g.stroke();
      }
      const kx = rnd() * w, ky = top + ph * (0.3 + rnd() * 0.4);
      for (let k = 1; k <= 5; k++) {
        g.strokeStyle = `rgba(110,72,34,${0.16 - k * 0.022})`; g.lineWidth = 1;
        g.beginPath(); g.ellipse(kx, ky, 5 + k * 7, 2 + k * 2.2, 0, 0, 7); g.stroke();
      }
      g.fillStyle = "rgba(95,62,28,.32)"; g.fillRect(0, top + ph - 1, w, 1);
      g.fillStyle = "rgba(255,240,212,.22)"; g.fillRect(0, top + ph, w, 1);
    }
    WOOD.set(key, c);
    return c;
  }

  function blob(ctx, x, y, R, seed) {
    ctx.beginPath();
    for (let i = 0; i <= 56; i++) {
      const a = (i / 56) * 6.2832;
      const k = 1 + 0.035 * Math.sin(a * 5 + seed) + 0.022 * Math.sin(a * 11 + seed * 2.3);
      const px = x + Math.cos(a) * R * k, py = y + Math.sin(a) * R * k;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  // Empty vessel (shadow, rim, band, well), cached per size: shadowBlur is too slow to repeat every frame.
  const BODY = new Map();
  function body(id, r, dpr) {
    const key = `${id}|${Math.round(r * dpr)}`;
    let c = BODY.get(key);
    if (c) return c;
    if (BODY.size > 60) BODY.clear();
    const L = LOOK[id], pad = r * 0.45, S = 2 * (r + pad);
    c = document.createElement("canvas");
    c.width = c.height = Math.max(4, Math.ceil(S * dpr));
    const g = c.getContext("2d");
    g.scale(c.width / S, c.width / S); g.translate(r + pad, r + pad);
    g.save();
    g.shadowColor = "rgba(70,42,15,.38)"; g.shadowBlur = r * 0.22 * dpr; g.shadowOffsetX = r * 0.05 * dpr; g.shadowOffsetY = r * 0.09 * dpr;
    g.fillStyle = L.rim[1]; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.restore();
    const gr = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    gr.addColorStop(0, L.rim[0]); gr.addColorStop(1, L.rim[1]);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    if (L.weave) { // basket weave on the rim
      g.strokeStyle = "rgba(90,60,25,.45)"; g.lineWidth = Math.max(0.6, r * 0.018);
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * 6.2832;
        g.beginPath(); g.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); g.lineTo(Math.cos(a + 0.06) * r * 0.99, Math.sin(a + 0.06) * r * 0.99); g.stroke();
      }
    }
    if (L.band) { // painted band on the rim (blue on the rice bowl)
      g.strokeStyle = L.band; g.globalAlpha = 0.75; g.lineWidth = Math.max(0.8, r * 0.022);
      g.beginPath(); g.arc(0, 0, r * (L.k + (1 - L.k) * 0.45), 0, 7); g.stroke();
      g.lineWidth = Math.max(0.5, r * 0.01);
      g.beginPath(); g.arc(0, 0, r * (L.k + (1 - L.k) * 0.7), 0, 7); g.stroke();
      g.globalAlpha = 1;
    }
    const ri = r * L.k;
    const gw = g.createRadialGradient(ri * 0.18, ri * 0.22, ri * 0.05, 0, 0, ri);
    gw.addColorStop(0, L.well[0]); gw.addColorStop(1, L.well[1]);
    g.fillStyle = gw; g.beginPath(); g.arc(0, 0, ri, 0, 7); g.fill();
    c.pad = pad;
    BODY.set(key, c);
    return c;
  }

  // A vessel seen from above, with a heap covering fraction p of its well.
  function vessel(ctx, v, p, dpr, seed) {
    const { x, y, r, id } = v, L = LOOK[id];
    const b = body(id, r, dpr), bs = 2 * (r + b.pad);
    ctx.drawImage(b, x - r - b.pad, y - r - b.pad, bs, bs);
    const ri = r * L.k;
    const Rw = ri * 0.97, R = Rw * Math.sqrt(KF.clamp(p, 0, 1));
    if (R > 0.4) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, Rw, 0, 7); ctx.clip();
      // soft shadow of the heap on the vessel floor
      ctx.fillStyle = "rgba(60,35,12,.22)"; blob(ctx, x + R * 0.05, y + R * 0.08, R * 1.04 + 0.8, seed); ctx.fill();
      blob(ctx, x, y, R, seed); ctx.clip();
      ctx.drawImage(texture(id, Rw, dpr), x - Rw, y - Rw, 2 * Rw, 2 * Rw);
      const hs = ctx.createRadialGradient(x - R * 0.3, y - R * 0.35, R * 0.05, x, y, R * 1.02);
      hs.addColorStop(0, "rgba(255,255,255,.2)"); hs.addColorStop(0.62, "rgba(255,255,255,0)"); hs.addColorStop(1, "rgba(60,35,10,.3)");
      ctx.fillStyle = hs; ctx.fillRect(x - R * 1.1, y - R * 1.1, R * 2.2, R * 2.2);
      ctx.restore();
    }
    // inner wall shade + rim highlight
    ctx.strokeStyle = "rgba(40,25,10,.18)"; ctx.lineWidth = Math.max(1, r * 0.03);
    ctx.beginPath(); ctx.arc(x, y, ri, 0, 7); ctx.stroke();
    ctx.strokeStyle = L.glass ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.55)"; ctx.lineWidth = Math.max(1, r * 0.035);
    ctx.beginPath(); ctx.arc(x, y, r * 0.93, 3.6, 4.7); ctx.stroke();
    if (p > 1.001 && SIZE[id]) { // more than 100%: a few grains spill onto the table
      const rnd = rng(77 + seed * 100), n = Math.min(16, Math.round((p - 1) * 120)), Lg = Math.max(2, Rw * SIZE[id] * (id === "tuber" ? 0.6 : 1));
      for (let i = 0; i < n; i++) { // spill to the right, away from the labels below
        const a = -0.95 + rnd() * 1.05, rr = r * (1.03 + rnd() * 0.13);
        ctx.save(); ctx.translate(x + Math.cos(a) * rr, y + Math.sin(a) * rr); ctx.rotate(rnd() * 6.3);
        grain(ctx, id, Lg, rnd); ctx.restore();
      }
    }
  }

  // ---------------------------------------------------------------- data access
  function at(arr, i0, k) { return KF.lerp(arr[i0], arr[Math.min(arr.length - 1, i0 + 1)], k); }
  function values(d, view, yr) {
    if (view === "grain") {
      const i = KF.clamp(yr - d.years[0], 0, d.years.length - 1), i0 = Math.floor(i), k = i - i0;
      return { items: d.grains.map((g) => ({ id: g.id, label: g.label, v: at(g.v, i0, k) })), total: at(d.total, i0, k) };
    }
    const D = d.dairy, i = KF.clamp(yr - D.years[0], 0, D.years.length - 1), i0 = Math.floor(i), k = i - i0;
    return { items: D.items.map((g) => ({ id: g.id, label: g.label, v: (at(g.prod, i0, k) / at(g.cons, i0, k)) * 100 })) };
  }
  const pct = (v) => (v > 0 && v < 0.1 ? v.toFixed(2) : v.toFixed(1)) + "%";

  // ---------------------------------------------------------------- layout
  function layout(w, h, view, mode) {
    const n = view === "grain" ? 6 : 4, out = [];
    if (mode === "thumb") { // 3 x 2 setting on the left, readout on the right (badge top-left, glyph bottom-left stay clear)
      const ax = 30, aw = w * 0.64 - 22, top = Math.max(32, h * 0.13), ah = h - top - 4, cols = 3, rh = ah / 2, lab = Math.max(22, h * 0.1);
      const cw = aw / cols, r = Math.min(cw * 0.4, (rh - lab) / 2);
      for (let i = 0; i < n; i++) {
        const c = i % cols, rw = Math.floor(i / cols);
        out.push({ x: ax + cw * (c + 0.5), y: top + rh * rw + (rh - lab) / 2, r });
      }
      return { ves: out };
    }
    if (mode === "full") {
      const ax = 18, aw = w * 0.69 - ax, top = 16, ah = h - 26, cols = n === 6 ? 3 : 2, rows = 2;
      const cw = aw / cols, rh = ah / rows, r = n === 6 ? Math.min(cw * 0.4, (rh - 58) / 2) : Math.min(cw * 0.3, ((rh - 70) / 2) * 0.86);
      for (let i = 0; i < n; i++) {
        const c = i % cols, rw = Math.floor(i / cols);
        out.push({ x: ax + cw * (c + 0.5) + (rw ? cw * 0.04 : -cw * 0.03), y: top + rh * rw + (rh - 44) / 2, r });
      }
      return { ves: out, card: { x: w * 0.705, y: 26, w: w * 0.27, h: h - 52 } };
    }
    // phone: header strip, then a 2-column grid
    const head = 66, cols = 2, rows = n / cols, cw = (w - 12) / cols, rh = (h - head - 6) / rows;
    const r = Math.min(cw * 0.4, (rh - 30) / 2);
    for (let i = 0; i < n; i++) {
      const c = i % cols, rw = Math.floor(i / cols);
      out.push({ x: 6 + cw * (c + 0.5), y: head + rh * rw + (rh - 26) / 2, r });
    }
    return { ves: out, head };
  }

  // ---------------------------------------------------------------- note card (desktop)
  const SHEET = new Map();
  function sheet(cw, ch, dpr) { // ruled note paper with its shadow, cached per size
    const key = `${Math.round(cw)}x${Math.round(ch)}@${dpr}`;
    let c = SHEET.get(key);
    if (c) return c;
    if (SHEET.size > 8) SHEET.clear();
    const pad = 30;
    c = document.createElement("canvas");
    c.width = Math.ceil((cw + 2 * pad) * dpr); c.height = Math.ceil((ch + 2 * pad) * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr); g.translate(pad, pad);
    g.shadowColor = "rgba(60,38,15,.32)"; g.shadowBlur = 16 * dpr; g.shadowOffsetY = 5 * dpr;
    g.fillStyle = PAPER; g.fillRect(0, 0, cw, ch);
    g.shadowColor = "transparent";
    g.strokeStyle = "rgba(63,95,149,.12)"; g.lineWidth = 1;
    for (let y = 132; y < ch - 8; y += 26) { g.beginPath(); g.moveTo(10, y + 0.5); g.lineTo(cw - 10, y + 0.5); g.stroke(); }
    g.strokeStyle = "rgba(168,64,42,.25)"; g.beginPath(); g.moveTo(34.5, 0); g.lineTo(34.5, ch); g.stroke();
    c.pad = pad;
    SHEET.set(key, c);
    return c;
  }

  function card(ctx, C, d, view, yr, vals, dpr) {
    ctx.save();
    ctx.translate(C.x + C.w / 2, C.y + C.h / 2); ctx.rotate(-0.016); ctx.translate(-C.w / 2, -C.h / 2);
    const sh = sheet(C.w, C.h, dpr);
    ctx.drawImage(sh, -sh.pad, -sh.pad, C.w + 2 * sh.pad, C.h + 2 * sh.pad);
    const px = 46, pw = C.w - px - 18, Y = Math.round(yr);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 14px ${SANS}`;
    ctx.fillText(view === "grain" ? "밥상 전체" : "치즈 · 국내생산 ÷ 국내소비", px, 32);
    ctx.textAlign = "right"; ctx.font = `600 15px ${MONO}`; ctx.fillText(String(Y), C.w - 18, 32);
    const big = view === "grain" ? vals.total : vals.items.find((x) => x.id === "cheese").v;
    ctx.textAlign = "left"; ctx.font = `700 ${Math.min(56, C.w * 0.2)}px ${SERIF}`; ctx.fillStyle = INK;
    ctx.fillText(pct(big), px - 2, 96);
    ctx.font = `500 10.5px ${MONO}`; ctx.fillStyle = MUTE;
    ctx.fillText(view === "grain" ? "식량자급률 · 사료용 제외" : "원유 생산은 줄고 치즈 소비는 늘었다", px, 118);
    // mini chart (on a clean patch of the ruled paper)
    const cx0 = px, cx1 = px + pw, cy0 = 150, cy1 = Math.min(C.h - 150, 318);
    ctx.fillStyle = PAPER; ctx.fillRect(cx0 - 30, cy0 - 12, cx1 - cx0 + 38, cy1 - cy0 + 34);
    if (view === "grain") {
      const X = (y) => cx0 + ((y - d.years[0]) / (d.years.length - 1)) * (cx1 - cx0), V = (v) => cy1 - (Math.min(v, 140) / 140) * (cy1 - cy0);
      ctx.font = `500 9.5px ${MONO}`; ctx.fillStyle = MUTE; ctx.textAlign = "right";
      for (const g of [0, 50, 100]) {
        ctx.strokeStyle = g === 100 ? "rgba(58,39,22,.35)" : "rgba(58,39,22,.12)"; ctx.setLineDash(g === 100 ? [3, 3] : []);
        ctx.beginPath(); ctx.moveTo(cx0, V(g) + 0.5); ctx.lineTo(cx1, V(g) + 0.5); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillText(String(g), cx0 - 4, V(g) + 3);
      }
      const rice = d.grains.find((x) => x.id === "rice").v;
      for (const [arr, col, lw] of [[rice, BLUE, 1.6], [d.total, INK, 2.2]]) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = "round"; ctx.beginPath();
        arr.forEach((v, i) => (i ? ctx.lineTo(X(d.years[i]), V(v)) : ctx.moveTo(X(d.years[i]), V(v))));
        ctx.stroke();
      }
      ctx.textAlign = "right"; ctx.font = `600 11px ${SANS}`;
      ctx.fillStyle = BLUE; ctx.fillText("쌀", cx1 - 14, Math.min(...rice.slice(-8).map(V)) - 7);
      ctx.fillStyle = INK; ctx.fillText("전체", cx1 - 14, Math.max(...d.total.slice(-8).map(V)) + 16);
      const mx = X(KF.clamp(yr, d.years[0], d.years[d.years.length - 1]));
      ctx.strokeStyle = RED; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx, cy0 - 6); ctx.lineTo(mx, cy1 + 4); ctx.stroke();
      const rv = vals.items.find((x) => x.id === "rice").v;
      for (const [v, col] of [[rv, BLUE], [vals.total, INK]]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(mx, V(v), 3.2, 0, 7); ctx.fill(); }
      ctx.fillStyle = MUTE; ctx.font = `500 9.5px ${MONO}`;
      ctx.textAlign = "left"; ctx.fillText(String(d.years[0]), cx0, cy1 + 16);
      ctx.textAlign = "right"; ctx.fillText(String(d.years[d.years.length - 1]), cx1, cy1 + 16);
      const it = Object.fromEntries(vals.items.map((x) => [x.id, x.v]));
      ctx.textAlign = "left"; ctx.fillStyle = RED; ctx.font = `${Math.min(27, C.w * 0.095)}px ${HAND}`;
      ctx.fillText(`쌀 ${pct(it.rice)} · 밥상 ${pct(vals.total)}`, px, cy1 + 52);
      ctx.fillStyle = INK; ctx.font = `${Math.min(22, C.w * 0.078)}px ${HAND}`;
      ctx.fillText(`밀 ${pct(it.wheat)} · 옥수수 ${pct(it.corn)} · 콩 ${pct(it.soy)}`, px, cy1 + 80);
      legend(ctx, px, C.h - 22);
    } else {
      const D = d.dairy, ch = D.items.find((x) => x.id === "cheese"), max = Math.max(...ch.cons) * 1.1;
      const X = (y) => cx0 + ((y - D.years[0]) / (D.years.length - 1)) * (cx1 - cx0), V = (v) => cy1 - (v / max) * (cy1 - cy0);
      ctx.font = `500 9.5px ${MONO}`; ctx.fillStyle = MUTE; ctx.textAlign = "right";
      for (const g of [0, 100000, 200000]) {
        if (g > max) continue;
        ctx.strokeStyle = "rgba(58,39,22,.12)"; ctx.beginPath(); ctx.moveTo(cx0, V(g) + 0.5); ctx.lineTo(cx1, V(g) + 0.5); ctx.stroke();
        ctx.fillText(g ? `${g / 10000}만` : "0", cx0 - 4, V(g) + 3);
      }
      for (const [arr, col, lw] of [[ch.cons, INK, 2.2], [ch.prod, "#c98a1a", 2]]) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
        arr.forEach((v, i) => (i ? ctx.lineTo(X(D.years[i]), V(v)) : ctx.moveTo(X(D.years[i]), V(v))));
        ctx.stroke();
      }
      ctx.font = `600 11px ${SANS}`; ctx.textAlign = "right";
      ctx.fillStyle = INK; ctx.fillText("치즈 소비", cx1, V(ch.cons[ch.cons.length - 1]) - 8);
      ctx.fillStyle = "#b07410"; ctx.fillText("치즈 생산", cx1 - 8, Math.max(...ch.prod.slice(-6).map(V)) + 16);
      const mx = X(KF.clamp(yr, D.years[0], D.years[D.years.length - 1]));
      ctx.strokeStyle = RED; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx, cy0 - 6); ctx.lineTo(mx, cy1 + 4); ctx.stroke();
      ctx.fillStyle = MUTE; ctx.font = `500 9.5px ${MONO}`;
      ctx.textAlign = "left"; ctx.fillText(String(D.years[0]), cx0, cy1 + 16);
      ctx.textAlign = "right"; ctx.fillText(String(D.years[D.years.length - 1]) + " · 톤", cx1, cy1 + 16);
      const it = Object.fromEntries(vals.items.map((x) => [x.id, x.v]));
      ctx.textAlign = "left"; ctx.fillStyle = RED; ctx.font = `${Math.min(27, C.w * 0.095)}px ${HAND}`;
      ctx.fillText(`흰 우유 ${pct(it.milk)} · 치즈 ${pct(it.cheese)}`, px, cy1 + 52);
      ctx.fillStyle = INK; ctx.font = `${Math.min(22, C.w * 0.078)}px ${HAND}`;
      ctx.fillText(`발효유 ${pct(it.yog)} · 버터 ${pct(it.butter)}`, px, cy1 + 80);
      legend(ctx, px, C.h - 22);
    }
    ctx.restore();
  }

  function legend(ctx, x, y) { // how to read a vessel: a small full-vs-part pair
    ctx.save();
    for (const [dx, k] of [[7, 1], [31, 0.35]]) {
      ctx.fillStyle = "#d6cebd"; ctx.beginPath(); ctx.arc(x + dx, y - 4, 8, 0, 7); ctx.fill();
      ctx.fillStyle = "#b99a5e"; ctx.beginPath(); ctx.arc(x + dx, y - 4, 8 * Math.sqrt(k), 0, 7); ctx.fill();
    }
    ctx.fillStyle = MUTE; ctx.font = `500 10px ${MONO}`; ctx.textAlign = "left";
    ctx.fillText("가득 = 100% · 덮은 넓이 = 자급률", x + 46, y);
    ctx.restore();
  }

  // ---------------------------------------------------------------- one frame
  function draw(ctx, w, h, d, view, yr, shown, mode, hover) {
    const dpr = ctx.getTransform().a || 1;
    ctx.drawImage(wood(w, h, dpr), 0, 0, w, h);
    const vals = values(d, view, yr), Lay = layout(w, h, view, mode);
    let hit = null;
    vals.items.forEach((it, i) => {
      const v = { ...Lay.ves[i], id: it.id }, p = (shown ? shown[it.id] : it.v) / 100;
      vessel(ctx, v, p, dpr, i * 1.7 + 0.5);
      // labels
      const nameF = mode === "thumb" ? KF.clamp(v.r * 0.3, 8.5, 11) : mode === "full" ? 14 : 12, valF = mode === "thumb" ? KF.clamp(v.r * 0.34, 9.5, 12.5) : mode === "full" ? 21 : 13;
      ctx.textAlign = "center";
      if (mode === "phone") {
        ctx.font = `600 ${nameF}px ${SANS}`; const nw = ctx.measureText(it.label).width;
        ctx.font = `600 ${valF}px ${MONO}`; const vw = ctx.measureText(pct(it.v)).width;
        const x0 = v.x - (nw + 6 + vw) / 2, ly = v.y + v.r + 19;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${nameF}px ${SANS}`; ctx.fillText(it.label, x0, ly);
        ctx.font = `600 ${valF}px ${MONO}`; ctx.fillText(pct(it.v), x0 + nw + 6, ly);
      } else {
        const gap = mode === "thumb" ? nameF + 1 : 22;
        ctx.fillStyle = INK; ctx.font = `600 ${nameF}px ${SANS}`; ctx.fillText(it.label, v.x, v.y + v.r + gap);
        ctx.font = `600 ${valF}px ${MONO}`; ctx.fillText(pct(it.v), v.x, v.y + v.r + gap + valF + (mode === "thumb" ? 1 : 6));
      }
      if (hover && Math.hypot(hover[0] - v.x, hover[1] - v.y) < v.r) hit = { v, it };
    });
    if (mode === "full" && Lay.card) card(ctx, Lay.card, d, view, yr, vals, dpr);
    if (mode === "phone") {
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 22px ${MONO}`; ctx.fillText(String(Math.round(yr)), 14, 36);
      ctx.fillStyle = MUTE; ctx.font = `500 10px ${MONO}`; ctx.fillText("그릇 가득 = 100%", 14, 54);
      ctx.textAlign = "right"; ctx.font = `600 12px ${SANS}`; ctx.fillStyle = MUTE;
      ctx.fillText(view === "grain" ? "밥상 전체 (식량자급률)" : "치즈 · 국내생산 ÷ 소비", w - 14, 22);
      ctx.fillStyle = INK; ctx.font = `700 28px ${SERIF}`;
      ctx.fillText(pct(view === "grain" ? vals.total : vals.items.find((x) => x.id === "cheese").v), w - 14, 54);
    }
    if (hit && mode !== "thumb") tip(ctx, w, h, d, view, yr, hit, hover);
  }

  function tip(ctx, w, h, d, view, yr, hit, hover) {
    const Y = Math.round(yr), lines = [];
    if (view === "grain") {
      const g = d.grains.find((x) => x.id === hit.it.id), i = Y - d.years[0];
      const pk = g.v.indexOf(Math.max(...g.v));
      lines.push([`${g.label} · ${Y}`, 1], [`자급률 ${pct(g.v[i])}`, 0],
        [`${d.years[0]}년 ${pct(g.v[0])} · 최고 ${d.years[pk]}년 ${pct(g.v[pk])}`, 0], ["국내 생산 ÷ 국내 소비(사료용 제외)", 2]);
    } else {
      const D = d.dairy, g = D.items.find((x) => x.id === hit.it.id), i = Y - D.years[0];
      lines.push([`${g.label} · ${Y}`, 1], [`국내생산 ${KF.fmt(g.prod[i])}톤`, 0], [`국내소비 ${KF.fmt(g.cons[i])}톤`, 0],
        [`→ ${pct((g.prod[i] / g.cons[i]) * 100)}`, 0]);
    }
    ctx.font = `500 11.5px ${MONO}`;
    const bw = Math.min(w - 16, Math.max(...lines.map(([t, k]) => { ctx.font = k === 1 ? `600 13px ${SANS}` : k === 2 ? `500 10.5px ${SANS}` : `500 11.5px ${MONO}`; return ctx.measureText(t).width; })) + 22);
    const bh = 14 + lines.length * 19;
    const bx = KF.clamp(hover[0] + 14, 8, w - bw - 8), by = KF.clamp(hover[1] - bh - 10, 8, h - bh - 8);
    ctx.fillStyle = "rgba(251,247,236,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(58,39,22,.45)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => {
      ctx.fillStyle = k === 2 ? MUTE : INK;
      ctx.font = k === 1 ? `600 13px ${SANS}` : k === 2 ? `500 10.5px ${SANS}` : `500 11.5px ${MONO}`;
      ctx.fillText(t, bx + 11, by + 22 + j * 19);
    });
  }

  // ---------------------------------------------------------------- thumb + mount
  function thumb(ctx, w, h, t, d) {
    const c = t % 10, y0 = d.years[0], y1 = d.years[d.years.length - 1];
    const yr = c < 0.3 ? y0 : c < 3.3 ? y0 + KF.ease((c - 0.3) / 3) * (y1 - y0) : y1;
    draw(ctx, w, h, d, "grain", yr, null, "thumb", null);
    const v = values(d, "grain", yr), rice = v.items.find((x) => x.id === "rice").v, X = w - 14;
    ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.065)}px ${MONO}`;
    ctx.fillText(String(Math.round(yr)), X, h * 0.2);
    ctx.fillStyle = BLUE; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText("쌀", X, h * 0.33);
    ctx.font = `700 ${Math.round(h * 0.1)}px ${SERIF}`; ctx.fillText(pct(rice), X, h * 0.33 + h * 0.105);
    ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText("밥상 전체", X, h * 0.6);
    ctx.fillStyle = RED; ctx.font = `700 ${Math.round(h * 0.15)}px ${SERIF}`; ctx.fillText(pct(v.total), X, h * 0.6 + h * 0.155);
    if (c > 9.4) { ctx.fillStyle = `rgba(217,195,160,${(c - 9.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let view = "grain", yr = d.years[d.years.length - 1], t0 = performance.now(), intro = true, hover = null;
    const shown = {};
    const span = () => (view === "grain" ? [d.years[0], d.years[d.years.length - 1]] : [d.dairy.years[0], d.dairy.years[d.dairy.years.length - 1]]);
    KF.segment(controls, [{ id: "grain", label: "곡물" }, { id: "dairy", label: "우유·치즈" }], "grain", (id) => {
      view = id; for (const k in shown) delete shown[k];
      const [a, b] = span(); range.min = a; range.max = b; range.value = b; start();
    });
    const range = document.createElement("input");
    range.type = "range"; range.step = 1; range.min = d.years[0]; range.max = d.years[d.years.length - 1]; range.value = range.max;
    const lab = document.createElement("label"); lab.append("연도", range);
    const out = document.createElement("span"); out.className = "readout";
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 보기";
    controls.append(lab, out, replay);
    const start = () => { t0 = performance.now(); intro = true; };
    replay.onclick = start;
    range.oninput = () => { intro = false; yr = +range.value; };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const [a, b] = span();
      if (intro) {
        const el = (performance.now() - t0) / 1000, dur = view === "grain" ? 4 : 3;
        yr = a + KF.ease(KF.clamp((el - 0.4) / dur, 0, 1)) * (b - a);
        if (el > dur + 0.4) intro = false;
        range.value = Math.round(yr);
      }
      out.textContent = view === "grain" ? `${Math.round(yr)}년 · 사료용 제외` : `${Math.round(yr)}년 · 국내생산 ÷ 국내소비`;
      const vals = values(d, view, yr);
      for (const it of vals.items) { // ease each heap toward its value
        const cur = shown[it.id] === undefined ? it.v : shown[it.id];
        shown[it.id] = Math.abs(cur - it.v) < 0.05 ? it.v : cur + (it.v - cur) * (intro ? 1 : 0.2);
      }
      draw(s.ctx, s.w, s.h, d, view, yr, shown, s.w > 520 ? "full" : "phone", hover);
    });
  }

  VIZ.food = { thumb, mount, bg: BG };
})();
