// 27 deaths — "모래시계". Each glass holds one year: the top bulb is that year's births, the bottom bulb that
// year's deaths, on one scale per glass. The national glass runs 1983→2025 like a real hourglass; 17 시도 glasses
// tip over in different years; 229 시군구 mini glasses spread along births per death (log scale).
(() => {
  const BG = "#18221f";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#efe9dc", DIM = "rgba(239,233,220,.64)", FAINT = "rgba(239,233,220,.14)";
  const SAND_T = "#f1d493", SAND_B = "#cf8a4c", GLASS = "rgba(210,235,226,.5)", CORAL = "#f08a60", GOLD = "#f1d493";
  const WOOD = "#6f5234", BRASS = "#b9925a";
  const TYPE_C = { 구: "#9fb8c8", 시: "#c9a45f", 군: "#c46f4e" };

  // ---------------------------------------------------------------- glass geometry (shared, normalised)
  const NW = 0.07;                                          // neck half-width / bulb half-width
  const prof = (t) => NW + (1 - NW) * Math.pow(Math.max(0, 1 - t * t), 0.9) * (0.85 + 0.6 * t * (1 - t)); // t: plate 0 → neck 1
  const NS = 240, AB = new Float32Array(NS + 1);           // normalised area from the plate to t
  (() => { let a = 0; for (let i = 1; i <= NS; i++) { a += (prof((i - 1) / NS) + prof(i / NS)) / 2 / NS; AB[i] = a; } for (let i = 1; i <= NS; i++) AB[i] /= a; })();
  function inv(a) { // t with AB(t) = a
    a = KF.clamp(a, 0, 1);
    let lo = 0, hi = NS;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (AB[m] < a) lo = m; else hi = m; }
    const k = AB[hi] === AB[lo] ? 0 : (a - AB[lo]) / (AB[hi] - AB[lo]);
    return (lo + k) / NS;
  }
  function geom(cx, y0, W, H) {
    const pt = Math.max(1.6, H * 0.055), bh = (H - 2 * pt) / 2;
    return { cx, y0, W, H, pt, bh, wb: W * 0.4, yg0: y0 + pt, ymid: y0 + pt + bh, yg1: y0 + H - pt };
  }
  const yAt = (g, which, t) => (which ? g.yg1 - t * g.bh : g.yg0 + t * g.bh);
  function bulb(ctx, g, which, grow = 0) {
    const N = 26;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const t = i / N, x = g.cx - g.wb * prof(t) - grow; i ? ctx.lineTo(x, yAt(g, which, t)) : ctx.moveTo(x, yAt(g, which, t)); }
    for (let i = N; i >= 0; i--) { const t = i / N; ctx.lineTo(g.cx + g.wb * prof(t) + grow, yAt(g, which, t)); }
    ctx.closePath();
  }
  function outline(ctx, g) { // left edge top→bottom, right edge back up
    const N = 26;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const t = i / N; const x = g.cx - g.wb * prof(t); i ? ctx.lineTo(x, yAt(g, 0, t)) : ctx.moveTo(x, yAt(g, 0, t)); }
    for (let i = N; i >= 0; i--) { const t = i / N; ctx.lineTo(g.cx - g.wb * prof(t), yAt(g, 1, t)); }
    ctx.moveTo(g.cx + g.wb * prof(0), yAt(g, 0, 0));
    for (let i = 0; i <= N; i++) { const t = i / N; ctx.lineTo(g.cx + g.wb * prof(t), yAt(g, 0, t)); }
    for (let i = N; i >= 0; i--) { const t = i / N; ctx.lineTo(g.cx + g.wb * prof(t), yAt(g, 1, t)); }
  }

  // sand: top pile sits on the neck with a small crater; bottom pile is a mound under the stream
  function sandTop(ctx, g, f, fine) {
    if (f <= 0.002) return null;
    const ts = inv(1 - f), ys = yAt(g, 0, ts), hw = g.wb * prof(ts), c = Math.min(g.bh * 0.1, (1 - ts) * g.bh * 0.5);
    ctx.save(); bulb(ctx, g, 0); ctx.clip();
    ctx.beginPath(); ctx.moveTo(g.cx - g.wb - 2, ys - 0.45 * c);
    const N = fine ? 22 : 8;
    for (let i = 0; i <= N; i++) {
      const x = -hw + (2 * hw * i) / N, u = x / (hw * 0.85), k = Math.abs(u) < 1 ? (1 - u * u) ** 2 : 0;
      ctx.lineTo(g.cx + x, ys - 0.45 * c + c * k);
    }
    ctx.lineTo(g.cx + g.wb + 2, ys - 0.45 * c); ctx.lineTo(g.cx + g.wb + 2, g.ymid + 2); ctx.lineTo(g.cx - g.wb - 2, g.ymid + 2); ctx.closePath();
    ctx.fillStyle = SAND_T; ctx.fill();
    if (fine) grains(ctx, g, 0, ys);
    ctx.restore();
    return ys;
  }
  function sandBot(ctx, g, f, fine) {
    if (f <= 0.002) return g.yg1;
    const ts = inv(f), ys = yAt(g, 1, ts), hw = g.wb * prof(ts), m = Math.min(g.bh * 0.13, ts * g.bh * 0.6);
    ctx.save(); bulb(ctx, g, 1); ctx.clip();
    ctx.beginPath(); ctx.moveTo(g.cx - g.wb - 2, ys + (2 / 3) * m);
    const N = fine ? 22 : 8;
    for (let i = 0; i <= N; i++) { const x = -hw + (2 * hw * i) / N, u = x / hw; ctx.lineTo(g.cx + x, ys + (2 / 3) * m - m * (1 - u * u)); }
    ctx.lineTo(g.cx + g.wb + 2, ys + (2 / 3) * m); ctx.lineTo(g.cx + g.wb + 2, g.yg1 + 2); ctx.lineTo(g.cx - g.wb - 2, g.yg1 + 2); ctx.closePath();
    ctx.fillStyle = SAND_B; ctx.fill();
    if (fine) grains(ctx, g, 1, ys);
    ctx.restore();
    return ys - m / 3;
  }
  const GR = Array.from({ length: 90 }, (_, i) => [((i * 7919) % 997) / 997, ((i * 104729) % 991) / 991, (i % 3)]);
  function grains(ctx, g, which, ys) {
    const y0 = which ? ys - g.bh * 0.15 : ys - g.bh * 0.12, y1 = which ? g.yg1 : g.ymid;
    for (const [a, b, k] of GR) {
      const x = g.cx + (a - 0.5) * 2 * g.wb, y = y0 + b * (y1 - y0);
      ctx.fillStyle = k === 0 ? "rgba(255,255,255,.28)" : k === 1 ? "rgba(90,50,20,.22)" : "rgba(120,80,30,.16)";
      ctx.fillRect(x, y, 1.2, 1.2);
    }
  }
  function stream(ctx, g, yEnd, phase, strong) {
    if (yEnd <= g.ymid + 1) return;
    const lw = Math.max(0.8, g.W * 0.018);
    ctx.strokeStyle = strong ? "rgba(241,212,147,.85)" : "rgba(241,212,147,.55)"; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(g.cx, g.ymid - 1); ctx.lineTo(g.cx, yEnd); ctx.stroke();
    if (g.H > 80) {
      ctx.fillStyle = "rgba(255,240,205,.9)";
      for (let i = 0; i < 6; i++) {
        const k = (phase * 0.9 + i / 6) % 1, y = g.ymid + k * (yEnd - g.ymid);
        ctx.fillRect(g.cx - lw * 0.9 + ((i * 37) % 3) * 0.5, y, lw * 0.9, lw * 1.2);
      }
    }
  }
  function frame(ctx, g, cap, fine) {
    const pw = Math.max(1.2, g.W * 0.035);
    if (fine) for (const sx of [-1, 1]) {
      ctx.fillStyle = WOOD; ctx.fillRect(g.cx + sx * g.W * 0.45 - pw / 2, g.yg0, pw, g.yg1 - g.yg0);
      ctx.fillStyle = "rgba(255,230,190,.12)"; ctx.fillRect(g.cx + sx * g.W * 0.45 - pw / 2, g.yg0, pw * 0.35, g.yg1 - g.yg0);
    }
    for (const y of [g.y0, g.y0 + g.H - g.pt]) {
      ctx.fillStyle = cap; ctx.fillRect(g.cx - g.W / 2, y, g.W, g.pt);
      if (fine) {
        ctx.fillStyle = "rgba(255,240,210,.22)"; ctx.fillRect(g.cx - g.W / 2, y, g.W, Math.max(1, g.pt * 0.28));
        ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fillRect(g.cx - g.W / 2, y + g.pt * 0.75, g.W, g.pt * 0.25);
      }
    }
  }
  // one full glass: returns the sand surfaces for hit tests
  function glass(ctx, g, fT, fB, o = {}) {
    const fine = g.H > 70;
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.fillStyle = "rgba(210,235,226,.05)"; bulb(ctx, g, 0); ctx.fill(); bulb(ctx, g, 1); ctx.fill();
    const yT = sandTop(ctx, g, fT, fine), yB = sandBot(ctx, g, fB, fine);
    if (o.phase !== undefined && fT > 0.002) stream(ctx, g, yB, o.phase, fine);
    ctx.strokeStyle = o.hi ? "rgba(235,250,244,.95)" : GLASS; ctx.lineWidth = o.hi ? 1.6 : fine ? 1.2 : 0.8;
    outline(ctx, g); ctx.stroke();
    if (fine) { // glass highlights
      ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = Math.max(1, g.W * 0.02);
      for (const which of [0, 1]) {
        ctx.beginPath();
        for (let i = 3; i <= 14; i++) { const t = i / 20, x = g.cx - g.wb * prof(t) * 0.78, y = yAt(g, which, t); i > 3 ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      }
    }
    frame(ctx, g, o.cap || BRASS, fine);
    ctx.restore();
    return { yT, yB };
  }

  // ---------------------------------------------------------------- data helpers
  const CACHE = new WeakMap();
  function prep(d) {
    if (CACHE.has(d)) return CACHE.get(d);
    const Y = d.years, n = Y.length;
    const natS = Math.max(...d.nb, ...d.nd) / 0.9;
    const sido = d.sido.map((r) => {
      const i0 = Y.indexOf(r.y0);
      let mx = 0; for (let i = i0; i < n; i++) mx = Math.max(mx, r.b[i], r.d[i]);
      return { ...r, i0, S: mx / 0.9 };
    });
    const sgg = d.sgg.map((r) => ({ ...r, t: r.n.slice(-1), r: [r.b[0] / r.d[0], r.b[1] / r.d[1]] }));
    const X = { Y, n, natS, sido, sgg };
    CACHE.set(d, X);
    return X;
  }
  const lerpArr = (A, f) => { const i = Math.floor(f), j = Math.min(A.length - 1, i + 1); return KF.lerp(A[i], A[j], f - i); };
  const fmtK = (v) => KF.fmt(Math.round(v));

  // ---------------------------------------------------------------- national view
  function chart(ctx, X, d, x, y, w, h, f, full, hoverYear) {
    const Y = X.Y, n = X.n, top = 800000;
    const px = (i) => x + (i / (n - 1)) * w, py = (v) => y + h - (v / top) * h;
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1;
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10 : 9}px ${MONO}`; ctx.textAlign = "right";
    for (const v of [200000, 400000, 600000, 800000]) {
      ctx.beginPath(); ctx.moveTo(x, py(v)); ctx.lineTo(x + w, py(v)); ctx.stroke();
      if (full || v % 400000 === 0) ctx.fillText(`${v / 10000}만`, x - 5, py(v) + 3);
    }
    ctx.textAlign = "center";
    for (const yy of full ? [1983, 1990, 2000, 2010, 2020, 2025] : [1983, 2000, 2025]) ctx.fillText(String(yy), px(Y.indexOf(yy)), y + h + 14);
    const upto = Math.min(n - 1, f);
    const line = (A, c, lw) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
      for (let i = 0; i <= Math.floor(upto); i++) (i ? ctx.lineTo(px(i), py(A[i])) : ctx.moveTo(px(i), py(A[i])));
      ctx.lineTo(px(upto), py(lerpArr(A, upto))); ctx.stroke();
    };
    // the gap after the crossing
    const ci = Y.indexOf(d.cross);
    if (upto > ci - 1) {
      const g0 = d.nb[ci - 1] - d.nd[ci - 1], g1 = d.nb[ci] - d.nd[ci], i0 = ci - 1 + g0 / (g0 - g1), e = Math.max(upto, i0);
      ctx.fillStyle = "rgba(240,138,96,.16)"; ctx.beginPath();
      ctx.moveTo(px(i0), py(lerpArr(d.nb, i0)));
      for (let i = ci; i <= Math.floor(e); i++) ctx.lineTo(px(i), py(d.nd[i]));
      ctx.lineTo(px(e), py(lerpArr(d.nd, e))); ctx.lineTo(px(e), py(lerpArr(d.nb, e)));
      for (let i = Math.floor(e); i >= ci; i--) ctx.lineTo(px(i), py(d.nb[i]));
      ctx.closePath(); ctx.fill();
    }
    line(d.nb, SAND_T, 2.2); line(d.nd, CORAL, 2.2);
    // line labels in the open middle of the chart, crossing tag under the lines
    const li = Y.indexOf(1995);
    ctx.font = `600 ${full ? 11.5 : 10}px ${SANS}`; ctx.textAlign = "center";
    if (upto > li + 1) {
      ctx.fillStyle = SAND_T; ctx.fillText("출생", px(li), py(d.nb[li]) - 9);
      ctx.fillStyle = CORAL; ctx.fillText("사망", px(li), py(d.nd[li]) + 17);
    }
    if (upto >= ci) {
      const cxp = px(ci), cyp = py(d.nd[ci]), ty = py(80000), t = `${d.cross} 사망 > 출생`;
      const tw = ctx.measureText(t).width, tx = Math.min(cxp, x + w - tw / 2);
      ctx.strokeStyle = "rgba(239,233,220,.45)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cxp, cyp + 5); ctx.lineTo(cxp, ty - 13); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cxp, cyp, 3.2, 0, 7); ctx.fill();
      ctx.fillText(t, tx, ty);
    }
    // current year marker
    const cx = px(upto);
    ctx.strokeStyle = "rgba(239,233,220,.5)"; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y + h); ctx.stroke(); ctx.setLineDash([]);
    if (hoverYear !== null) {
      const hx = px(hoverYear);
      ctx.strokeStyle = "rgba(239,233,220,.8)"; ctx.beginPath(); ctx.moveTo(hx, y); ctx.lineTo(hx, y + h); ctx.stroke();
    }
    return { x, y, w, h, px };
  }

  function natView(ctx, w, h, d, X, f, phase, full, hover) {
    const i = Math.round(f), yr = X.Y[KF.clamp(i, 0, X.n - 1)];
    const b = lerpArr(d.nb, f), dd = lerpArr(d.nd, f);
    let g, cb;
    if (full) {
      const H = h * 0.86, W = H * 0.5;
      g = geom(w * 0.19, h * 0.07, W, H);
    } else {
      const H = h * 0.5, W = H * 0.52;
      g = geom(w * 0.26, 18, W, H);
    }
    glass(ctx, g, b / X.natS, dd / X.natS, { phase, cap: BRASS });
    const out = { g, hit: null, chart: null };
    if (hover && Math.abs(hover[0] - g.cx) < g.W / 2 && hover[1] > g.y0 && hover[1] < g.y0 + g.H) out.hit = { kind: "glass", top: hover[1] < g.ymid };
    const nbx = (v) => KF.fmt(Math.round(v));
    if (full) {
      const x0 = w * 0.4, pw = w - x0 - 34;
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 21px ${SERIF}`;
      ctx.fillText(`모래시계 · 전국 ${X.Y[0]}–${X.Y[X.n - 1]}`, x0, 46);
      ctx.font = `500 12.5px ${SANS}`;
      [[SAND_T, "위 모래 = 그해 태어난 아기"], [SAND_B, "아래 모래 = 그해 숨진 사람"]].forEach(([c, t], j) => {
        ctx.fillStyle = c; ctx.fillRect(x0 + j * 190, 64, 12, 10);
        ctx.fillStyle = DIM; ctx.fillText(t, x0 + j * 190 + 18, 73);
      });
      ctx.fillStyle = INK; ctx.font = `600 50px ${MONO}`; ctx.fillText(String(yr), x0, 140);
      ctx.font = `500 12.5px ${SANS}`; ctx.fillStyle = DIM;
      ctx.fillText("출생", x0 + 170, 106); ctx.fillText("사망", x0 + 340, 106);
      ctx.font = `700 28px ${SANS}`;
      ctx.fillStyle = SAND_T; ctx.fillText(nbx(b), x0 + 170, 138);
      ctx.fillStyle = CORAL; ctx.fillText(nbx(dd), x0 + 340, 138);
      const gap = dd - b;
      ctx.font = `600 14px ${SANS}`; ctx.fillStyle = gap > 0 ? CORAL : SAND_T;
      ctx.fillText(gap > 0 ? `숨진 사람이 ${nbx(gap)}명 더 많다` : `태어난 아기가 ${nbx(-gap)}명 더 많다 (출생이 사망의 ${(b / dd).toFixed(1)}배)`, x0, 172);
      out.chart = chart(ctx, X, d, x0 + 34, 222, pw - 34, h - 222 - 96, f, true, null);
      const s = d.sum;
      ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(`${X.Y[X.n - 1]}년 숨진 사람의 절반은 ${s.age_med}세 이상, ${s.s80}%는 80세 이상`, x0, h - 44);
      ctx.fillText(`같은 해 시군구 ${s.units}곳 중 ${s.more[1]}곳은 출생이 사망보다 많았다 → '시군구' 보기`, x0, h - 24);
    } else {
      const x0 = g.cx + g.W / 2 + 22;
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 34px ${MONO}`; ctx.fillText(String(yr), x0, 58);
      ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText("출생 (위 모래)", x0, 88); ctx.fillText("사망 (아래 모래)", x0, 142);
      ctx.font = `700 21px ${SANS}`; ctx.fillStyle = SAND_T; ctx.fillText(nbx(b), x0, 113);
      ctx.fillStyle = CORAL; ctx.fillText(nbx(dd), x0, 167);
      const gap = dd - b;
      ctx.font = `600 11.5px ${SANS}`; ctx.fillStyle = gap > 0 ? CORAL : SAND_T;
      ctx.fillText(gap > 0 ? `사망이 ${nbx(gap)}명 많다` : `출생이 ${nbx(-gap)}명 많다`, x0, 196);
      out.chart = chart(ctx, X, d, 44, h * 0.66, w - 60, h * 0.34 - 40, f, false, null);
    }
    return out;
  }

  // ---------------------------------------------------------------- 시도 view
  function sidoLayout(w, h, full) {
    const cols = full ? 9 : 6, rows = full ? 2 : 3;
    const top = full ? 64 : 44, bottom = full ? 118 : 100, gx = full ? 26 : 10;
    const cw = (w - 2 * gx) / cols, rh = (h - top - bottom) / rows;
    const H = Math.min(rh - (full ? 44 : 32), cw * 1.7), W = H * 0.5;
    return { cols, rows, top, cw, rh, H, W, gx, bottom };
  }
  function sidoView(ctx, w, h, d, X, f, phase, full, hover) {
    const L = sidoLayout(w, h, full), i = KF.clamp(Math.round(f), 0, X.n - 1), yr = X.Y[i];
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 14}px ${SERIF}`;
    ctx.fillText(full ? `시도 17곳의 모래시계 · ${yr}년` : `시도 17곳 · ${yr}년`, full ? 26 : 12, full ? 38 : 26);
    if (full) {
      ctx.font = `500 12px ${SANS}`; ctx.fillStyle = DIM; ctx.textAlign = "right";
      ctx.fillText("이름 옆 숫자 = 그해 사망 1명당 출생 · 아래 = 사망 > 출생이 굳어진 해", w - 26, 30);
      ctx.fillStyle = "rgba(239,233,220,.45)"; ctx.fillText("유리마다 그 시도의 가장 큰 해(출생 또는 사망)에 맞춘 눈금", w - 26, 48);
    } else {
      ctx.font = `500 10px ${SANS}`; ctx.fillStyle = DIM; ctx.textAlign = "right";
      ctx.fillText("숫자 = 사망 1명당 출생", w - 12, 26);
    }
    let hit = null;
    X.sido.forEach((r, k) => {
      const c = k % L.cols, rr = Math.floor(k / L.cols), cx = L.gx + (c + 0.5) * L.cw, y0 = L.top + rr * L.rh + 4;
      const g = geom(cx, y0, L.W, L.H), exists = i >= r.i0;
      const b = exists ? lerpArr(r.b, Math.max(f, r.i0)) : 0, dd = exists ? lerpArr(r.d, Math.max(f, r.i0)) : 0;
      const crossed = exists && dd > b, isHover = hover && Math.abs(hover[0] - cx) < L.cw / 2 && hover[1] > y0 - 4 && hover[1] < y0 + L.rh - 4;
      glass(ctx, g, b / r.S, dd / r.S, { phase: phase + k * 0.13, cap: crossed ? "#9a5b3f" : BRASS, alpha: exists ? 1 : 0.3, hi: isHover });
      if (isHover) hit = { r, i: Math.max(i, r.i0), exists, cx, y: y0 };
      const rt = exists ? b / dd : null, ly = y0 + L.H + (full ? 18 : 14);
      ctx.font = `700 ${full ? 13.5 : 11}px ${SANS}`;
      const nw = ctx.measureText(r.n).width;
      ctx.font = `600 ${full ? 12 : 10}px ${MONO}`;
      const rs = rt === null ? "" : rt.toFixed(2), rw = rs ? ctx.measureText(rs).width + (full ? 6 : 4) : 0, lx = cx - (nw + rw) / 2;
      ctx.textAlign = "left"; ctx.fillStyle = exists ? INK : DIM; ctx.font = `700 ${full ? 13.5 : 11}px ${SANS}`; ctx.fillText(r.n, lx, ly);
      if (rs) { ctx.fillStyle = rt >= 1 ? GOLD : CORAL; ctx.font = `600 ${full ? 12 : 10}px ${MONO}`; ctx.fillText(rs, lx + nw + (full ? 6 : 4), ly); }
      ctx.textAlign = "center"; ctx.font = `500 ${full ? 10.5 : 9}px ${MONO}`;
      ctx.fillStyle = r.cross ? (yr >= r.cross ? "rgba(240,138,96,.85)" : DIM) : GOLD;
      ctx.fillText(r.cross ? `${r.cross}~` : "아직", cx, ly + (full ? 15 : 12));
    });
    // timeline of crossings
    const tx0 = full ? 70 : 30, tx1 = w - (full ? 40 : 16), ty = h - (full ? 40 : 30), Y0 = 2004, Y1 = 2026;
    const tx = (y) => tx0 + ((y - Y0) / (Y1 - Y0)) * (tx1 - tx0);
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx0, ty); ctx.lineTo(tx1, ty); ctx.stroke();
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10 : 8.5}px ${MONO}`; ctx.textAlign = "center";
    for (let y = 2005; y <= 2025; y += full ? 5 : 10) { ctx.fillText(String(y), tx(y), ty + 13); ctx.fillRect(tx(y) - 0.5, ty - 3, 1, 6); }
    if (full) { ctx.textAlign = "left"; ctx.fillText("사망 > 출생이 굳어진 해", 26, ty - 58); }
    const stack = {};
    X.sido.forEach((r) => {
      const yy = r.cross || 2025.9, k = (stack[yy] = (stack[yy] || 0) + 1) - 1, x = tx(yy);
      const col = r.cross ? (yr >= r.cross ? CORAL : "rgba(240,138,96,.45)") : GOLD;
      if (full) {
        ctx.fillStyle = col; ctx.font = `600 10.5px ${SANS}`; ctx.textAlign = "center";
        ctx.fillText(r.cross ? r.n : `${r.n} 아직`, x, ty - 8 - k * 13);
      } else {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, ty - 7 - k * 8, 3, 0, 7); ctx.fill();
      }
    });
    if (!full) {
      const first = X.sido.find((r) => r.cross), lastR = [...X.sido].filter((r) => r.cross).pop(), sj = X.sido.find((r) => !r.cross);
      ctx.font = `600 9.5px ${SANS}`; ctx.textAlign = "center"; ctx.fillStyle = CORAL;
      ctx.fillText(`${first.n} ${first.cross}`, tx(first.cross), ty - 20);
      const nl = X.sido.filter((r) => r.cross === lastR.cross).length;
      ctx.fillText(`${lastR.cross}`, tx(lastR.cross), ty - 12 - nl * 8);
      ctx.fillStyle = GOLD; ctx.textAlign = "right"; ctx.fillText(`${sj.n} 아직`, w - 10, ty - 20);
      ctx.fillStyle = DIM; ctx.textAlign = "left"; ctx.font = `500 9.5px ${SANS}`; ctx.fillText("점 하나 = 시도 하나 · 사망 > 출생이 굳어진 해", tx0 - 16, ty - 48);
    }
    const jn = X.sido.find((r) => r.first && r.first < r.cross);
    if (jn && full) {
      ctx.fillStyle = "rgba(240,138,96,.6)"; ctx.font = `500 10px ${SANS}`; ctx.textAlign = "center";
      ctx.fillText(`${jn.n} 첫 교차 ${jn.first}`, tx(jn.first), ty - 8);
    }
    const cx = tx(KF.clamp(X.Y[0] + f, Y0, Y1));
    if (X.Y[0] + f >= Y0) { ctx.strokeStyle = "rgba(239,233,220,.55)"; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(cx, ty - (full ? 50 : 38)); ctx.lineTo(cx, ty + 4); ctx.stroke(); ctx.setLineDash([]); }
    return hit;
  }

  // ---------------------------------------------------------------- 시군구 view
  const L0 = Math.log10(0.06), L1 = Math.log10(2.6);
  const SLAY = new Map();
  function sggLayout(X, w, h, full) {
    const key = `${Math.round(w)}|${Math.round(h)}`;
    if (SLAY.has(key)) return SLAY.get(key);
    const x0 = full ? 70 : 16, x1 = full ? w * 0.7 : w - 16, base = full ? h - 64 : h - 58;
    const gw = full ? 9 : 5.6, gh = gw * 1.9, bw = gw + (full ? 2 : 1.2), vg = full ? 2.2 : 1.4;
    const nb = Math.floor((x1 - x0) / bw);
    const pos = [0, 1].map((yi) => {
      const bins = new Map(), P = new Array(X.sgg.length);
      X.sgg.map((r, k) => [k, r.r[yi]]).sort((a, b) => a[1] - b[1]).forEach(([k, v]) => {
        const bi = KF.clamp(Math.floor(((Math.log10(v) - L0) / (L1 - L0)) * nb), 0, nb - 1), c = bins.get(bi) || 0;
        bins.set(bi, c + 1);
        P[k] = [x0 + bi * bw + bw / 2, base - (c + 1) * (gh + vg)];
      });
      return P;
    });
    const L = { x0, x1, base, gw, gh, nb, bw, pos, xv: (v) => x0 + ((Math.log10(v) - L0) / (L1 - L0)) * nb * bw };
    SLAY.set(key, L); if (SLAY.size > 8) SLAY.clear();
    return L;
  }
  function sggView(ctx, w, h, d, X, m, full, hover, typ, phase) {
    const L = sggLayout(X, w, h, full), yi = m > 0.5 ? 1 : 0, s = d.sum;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 14}px ${SERIF}`;
    ctx.fillText(full ? `시군구 229곳의 모래시계 · ${yi ? 2025 : 2023}년` : `시군구 229곳 · ${yi ? 2025 : 2023}년`, full ? 26 : 12, full ? 38 : 26);
    ctx.font = `500 ${full ? 12 : 10.5}px ${SANS}`; ctx.fillStyle = DIM;
    ctx.fillText(full ? "작은 유리 하나 = 시군구 하나 · 가로 = 사망 1명당 출생 (로그 눈금) · 주민등록 신고 기준" : "유리 하나 = 시군구 하나 · 가로 = 사망 1명당 출생", full ? 26 : 12, full ? 58 : 44);
    // axis
    const one = L.xv(1);
    ctx.fillStyle = "rgba(241,212,147,.06)"; ctx.fillRect(one, full ? 76 : 56, L.x0 + L.nb * L.bw - one, L.base - (full ? 76 : 56));
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L.x0, L.base + 2); ctx.lineTo(L.x0 + L.nb * L.bw, L.base + 2); ctx.stroke();
    ctx.strokeStyle = "rgba(241,212,147,.7)"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(one, full ? 76 : 56); ctx.lineTo(one, L.base + 6); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10.5 : 9}px ${MONO}`; ctx.textAlign = "center";
    for (const v of full ? [0.1, 0.2, 0.5, 1, 2] : [0.1, 0.25, 0.5, 1, 2]) ctx.fillText(String(v), L.xv(v), L.base + 17);
    ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`;
    ctx.textAlign = "left"; ctx.fillText(full ? "← 사망이 더 많다" : "← 사망이 많다", L.x0, L.base + 34);
    ctx.textAlign = "right"; ctx.fillStyle = GOLD; ctx.fillText(full ? "출생이 더 많다 →" : "출생이 많다 →", L.x0 + L.nb * L.bw, L.base + 34);
    ctx.fillStyle = GOLD; ctx.textAlign = "left"; ctx.font = `600 ${full ? 11 : 9.5}px ${SANS}`; ctx.fillText("출생 = 사망", one + 5, full ? 90 : 68);
    // glasses
    let hit = null;
    const k = KF.ease(KF.clamp(m, 0, 1));
    X.sgg.forEach((r, j) => {
      const a = L.pos[0][j], b = L.pos[1][j], x = KF.lerp(a[0], b[0], k), y = KF.lerp(a[1], b[1], k);
      const rv = KF.lerp(r.r[0], r.r[1], k), fT = rv >= 1 ? 0.92 : 0.92 * rv, fB = rv >= 1 ? 0.92 / rv : 0.92;
      const g = geom(x, y, L.gw, L.gh), on = !typ || typ === r.t;
      const isHover = hover && Math.abs(hover[0] - x) <= L.bw / 2 && hover[1] >= y - 1 && hover[1] <= y + L.gh + 1;
      if (isHover) hit = { r, x, y, yi };
      glass(ctx, g, fT, fB, { cap: TYPE_C[r.t] || BRASS, alpha: on ? 1 : 0.16, hi: isHover });
    });
    // name the two ends, above whatever is stacked under the label
    if (m > 0.98 || m < 0.02) {
      const ord = X.sgg.map((r, j) => [r.r[yi], j]).sort((a, b) => a[0] - b[0]);
      for (const [v, j] of [ord[0], ord[ord.length - 1]]) {
        const r = X.sgg[j], [x, y] = L.pos[yi][j];
        ctx.font = `600 ${full ? 11 : 9.5}px ${SANS}`;
        const t = full ? `${r.s} ${r.n} ${v.toFixed(2)}` : `${r.n} ${v.toFixed(2)}`, tw = ctx.measureText(t).width;
        const xa = v >= 1 ? x + L.gw - tw : x - L.gw, xb = xa + tw;
        let top = y;
        for (const [px, py] of L.pos[yi]) if (px >= xa - L.bw && px <= xb + L.bw) top = Math.min(top, py);
        const ly = top - (full ? 12 : 9);
        ctx.strokeStyle = v >= 1 ? "rgba(241,212,147,.6)" : "rgba(240,138,96,.6)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, ly + 3); ctx.lineTo(x, y - 1); ctx.stroke();
        ctx.fillStyle = v >= 1 ? GOLD : CORAL; ctx.textAlign = "left"; ctx.fillText(t, xa, ly);
      }
    }
    // counts
    if (full) {
      const px = w * 0.745;
      ctx.textAlign = "left";
      ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText(`출생이 사망보다 많은 곳`, px, 118);
      ctx.fillStyle = GOLD; ctx.font = `800 44px ${SANS}`; ctx.fillText(`${s.more[yi]}곳`, px, 164);
      ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText(`${yi ? 2023 : 2025}년 ${s.more[1 - yi]}곳`, px + 110, 164);
      ctx.fillText(`사망이 출생의 4배를 넘는 곳`, px, 210);
      ctx.fillStyle = CORAL; ctx.font = `800 44px ${SANS}`; ctx.fillText(`${s.four[yi]}곳`, px, 256);
      ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
      ctx.fillText(`70세 이상 주민 비율 (2025.12)`, px, 302);
      ctx.fillStyle = INK; ctx.font = `600 13px ${SANS}`;
      ctx.fillText(`출생 > 사망 ${s.more[1]}곳 ${s.o70[0]}% · 4배 넘는 곳 ${s.o70[1]}%`, px, 324);
      ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("뚜껑 색 = 시군구 종류", px, 370);
      [["구", "자치구"], ["시", "시"], ["군", "군"]].forEach(([t, lab], q) => {
        const yy = 392 + q * 22;
        ctx.fillStyle = TYPE_C[t]; ctx.fillRect(px, yy - 9, 18, 6); ctx.fillRect(px, yy + 1, 18, 3);
        ctx.fillStyle = INK; ctx.font = `500 12.5px ${SANS}`; ctx.fillText(lab, px + 26, yy + 3);
      });
    } else {
      ctx.textAlign = "right"; ctx.fillStyle = GOLD; ctx.font = `800 24px ${SANS}`;
      ctx.fillText(`${s.more[yi]}곳`, w - 14, 92);
      ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`; ctx.fillText("출생 > 사망", w - 14, 106);
      ctx.textAlign = "left"; ctx.fillStyle = CORAL; ctx.font = `800 24px ${SANS}`;
      ctx.fillText(`${s.four[yi]}곳`, 14, 92);
      ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`; ctx.fillText("사망 > 출생×4", 14, 106);
    }
    return hit;
  }

  // ---------------------------------------------------------------- tooltip
  function tip(ctx, w, h, lines, p) {
    const fs = 12;
    ctx.font = `600 ${fs}px ${SANS}`;
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = `${k === 1 ? 700 : 500} ${k === 1 ? 13 : fs}px ${SANS}`; return ctx.measureText(t).width; })) + 22);
    const bh = 12 + lines.length * 19;
    const bx = KF.clamp(p[0] + 16 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 16, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(14,22,20,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(241,212,147,.55)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => {
      ctx.fillStyle = k === 1 ? INK : k === 2 ? SAND_T : k === 3 ? CORAL : DIM;
      ctx.font = `${k === 1 ? 700 : 500} ${k === 1 ? 13 : fs}px ${SANS}`;
      ctx.fillText(t, bx + 11, by + 22 + j * 19);
    });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const X = prep(d), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const f = c < 3 ? KF.ease(c / 3) * (X.n - 1) : X.n - 1;
    const b = lerpArr(d.nb, f), dd = lerpArr(d.nd, f);
    const H = h * 0.84, W = H * 0.5, g = geom(Math.max(64 + W / 2, w * 0.22), h * 0.08, W, H);
    glass(ctx, g, b / X.natS, dd / X.natS, { phase: t * 1.4, cap: BRASS });
    const x = g.cx + W / 2 + w * 0.07, yr = X.Y[Math.round(f)];
    ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.13)}px ${MONO}`; ctx.fillText(String(yr), x, h * 0.25);
    ctx.font = `600 ${Math.round(h * 0.058)}px ${SANS}`;
    ctx.fillStyle = SAND_T; ctx.fillText(`출생 ${fmtK(b)}`, x, h * 0.37);
    ctx.fillStyle = CORAL; ctx.fillText(`사망 ${fmtK(dd)}`, x, h * 0.45);
    const a = KF.clamp((c - 2.6) / 0.6, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.058)}px ${SANS}`;
    ctx.fillText(`그래도 시군구 ${d.sum.units}곳 중`, x, h * 0.64);
    ctx.fillStyle = GOLD; ctx.font = `800 ${Math.round(h * 0.15)}px ${SANS}`; ctx.fillText(`${d.sum.more[1]}곳`, x, h * 0.64 + h * 0.155);
    ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.058)}px ${SANS}`; ctx.fillText("출생 > 사망", x, h * 0.64 + h * 0.235);
    ctx.globalAlpha = 1;
    if (c > 9.4) { ctx.fillStyle = `rgba(24,34,31,${(c - 9.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = prep(d), s = KF.canvas(stage), last = X.n - 1;
    let view = "nat", f = 0, target = last, playing = true, t0 = performance.now(), hover = null, typ = null, m = 1, mTarget = 1;
    if (KF.reduced) { f = last; playing = false; }
    KF.segment(controls, [{ id: "nat", label: "전국 1983–2025" }, { id: "sido", label: "시도 17곳" }, { id: "sgg", label: "시군구 229곳" }], "nat", (id) => {
      view = id; sync();
      if (id === "sido" && !KF.reduced) { f = X.Y.indexOf(2003); playing = true; }
    });
    const lab = document.createElement("label"), range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = last; range.step = 1; range.value = last; lab.append("해", range);
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "▶ 다시 흘리기";
    replay.onclick = () => { f = view === "sido" ? X.Y.indexOf(2003) : 0; playing = true; };
    const out = document.createElement("span"); out.className = "readout";
    controls.append(lab, replay);
    const yrWrap = document.createElement("span"); yrWrap.style.display = "contents";
    const yrBtns = KF.segment(yrWrap, [{ id: 0, label: "2023" }, { id: 1, label: "2025" }], 1, (id) => { mTarget = id; });
    const tyWrap = document.createElement("span"); tyWrap.style.display = "contents";
    const tyBtns = KF.segment(tyWrap, [{ id: "", label: "전체" }, { id: "구", label: "자치구" }, { id: "시", label: "시" }, { id: "군", label: "군" }], "", (id) => { typ = id || null; });
    controls.append(yrWrap, tyWrap, out);
    range.oninput = () => { playing = false; f = +range.value; };
    function sync() {
      const yearish = view !== "sgg";
      lab.style.display = yearish ? "" : "none"; replay.style.display = yearish ? "" : "none";
      [...yrBtns, ...tyBtns].forEach((b) => { b.style.display = yearish ? "none" : ""; });
      setOut();
    }
    let shown = -1;
    function setOut() {
      if (view === "sgg") { out.textContent = `사망 1명당 출생 가운데값 ${d.sum.med}명 (2025)`; return; }
      const i = KF.clamp(Math.round(f), 0, last);
      out.textContent = `${X.Y[i]}년 · 출생 ${KF.fmt(d.nb[i])} · 사망 ${KF.fmt(d.nd[i])}`;
    }
    sync();
    const at = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    let chartBox = null;
    const pick = (e, commit) => {
      hover = at(e);
      if (commit && view === "nat" && chartBox) {
        const c = chartBox;
        if (hover[0] >= c.x - 6 && hover[0] <= c.x + c.w + 6 && hover[1] >= c.y - 6 && hover[1] <= c.y + c.h + 20) {
          playing = false; f = KF.clamp(Math.round(((hover[0] - c.x) / c.w) * last), 0, last); range.value = f;
        }
      }
    };
    stage.addEventListener("pointermove", (e) => pick(e, e.buttons === 1));
    stage.addEventListener("pointerdown", (e) => pick(e, true));
    stage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hover = null; });
    let prev = performance.now();

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), dt = Math.min(0.1, (now - prev) / 1000); prev = now;
      const phase = (now - t0) / 1000;
      if (playing) { f += dt * (view === "sido" ? 6 : 9.5); if (f >= target) { f = target; playing = false; } }
      m += (mTarget - m) * (1 - Math.exp(-dt * 5));
      if (Math.round(f) !== shown) { shown = Math.round(f); range.value = shown; setOut(); }
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      // faint velvet texture
      const vg = ctx.createRadialGradient(w * 0.3, h * 0.35, 10, w * 0.3, h * 0.35, Math.max(w, h) * 0.8);
      vg.addColorStop(0, "rgba(70,110,95,.18)"); vg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
      if (view === "nat") {
        const r = natView(ctx, w, h, d, X, f, phase, full, hover);
        chartBox = r.chart;
        if (hover && r.hit) {
          const i = KF.clamp(Math.round(f), 0, last);
          tip(ctx, w, h, r.hit.top
            ? [[`${X.Y[i]}년 위 모래`, 1], [`태어난 아기 ${KF.fmt(d.nb[i])}명`, 2], [`유리 가득 = ${KF.fmt(Math.round(X.natS))}명`, 0]]
            : [[`${X.Y[i]}년 아래 모래`, 1], [`숨진 사람 ${KF.fmt(d.nd[i])}명`, 3], [`출생 − 사망 = ${KF.fmt(d.nb[i] - d.nd[i])}명`, 0]], hover);
        } else if (hover && chartBox && hover[0] >= chartBox.x && hover[0] <= chartBox.x + chartBox.w && hover[1] >= chartBox.y && hover[1] <= chartBox.y + chartBox.h + 16) {
          const i = KF.clamp(Math.round(((hover[0] - chartBox.x) / chartBox.w) * last), 0, last), x = chartBox.px(i);
          ctx.strokeStyle = "rgba(239,233,220,.8)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, chartBox.y); ctx.lineTo(x, chartBox.y + chartBox.h); ctx.stroke();
          tip(ctx, w, h, [[`${X.Y[i]}년`, 1], [`출생 ${KF.fmt(d.nb[i])}명`, 2], [`사망 ${KF.fmt(d.nd[i])}명`, 3],
            [d.nb[i] >= d.nd[i] ? `출생이 사망의 ${(d.nb[i] / d.nd[i]).toFixed(2)}배` : `사망 1명당 출생 ${(d.nb[i] / d.nd[i]).toFixed(2)}명`, 0]], hover);
        }
      } else if (view === "sido") {
        chartBox = null;
        const hit = sidoView(ctx, w, h, d, X, f, phase, full, hover);
        if (hit && hover) {
          const r = hit.r, i = hit.i, lines = [[`${r.n} · ${X.Y[i]}년${hit.exists ? "" : " (따로 집계 전)"}`, 1]];
          if (hit.exists) lines.push([`출생 ${KF.fmt(r.b[i])}명`, 2], [`사망 ${KF.fmt(r.d[i])}명`, 3],
            [r.b[i] >= r.d[i] ? `출생이 사망의 ${(r.b[i] / r.d[i]).toFixed(2)}배` : `사망 1명당 출생 ${(r.b[i] / r.d[i]).toFixed(2)}명`, 0]);
          lines.push([r.cross ? `사망 > 출생: ${r.cross}년부터${r.first < r.cross ? ` (처음 ${r.first}년)` : ""}` : `${X.Y[last]}년까지 출생 > 사망`, 0]);
          tip(ctx, w, h, lines, hover);
        }
      } else {
        chartBox = null;
        const hit = sggView(ctx, w, h, d, X, m, full, hover, typ, phase);
        if (hit && hover) {
          const r = hit.r, yi = hit.yi, yr = yi ? 2025 : 2023, v = r.b[yi] / r.d[yi];
          tip(ctx, w, h, [[`${r.s === "세종" ? r.n : `${r.s} ${r.n}`} · ${yr}년`, 1], [`출생 ${KF.fmt(r.b[yi])}명`, 2], [`사망 ${KF.fmt(r.d[yi])}명`, 3],
            [v >= 1 ? `출생이 사망의 ${v.toFixed(2)}배` : `사망 1명당 출생 ${v.toFixed(2)}명 (아기 1명당 사망 ${(1 / v).toFixed(1)}명)`, 0],
            [`70세 이상 ${r.o70}% · 주민 ${KF.fmt(r.p)}명 (2025.12)`, 0]], hover);
        }
      }
    });
  }

  VIZ.deaths = { thumb, mount, bg: BG };
})();
