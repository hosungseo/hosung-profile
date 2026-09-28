// 14 wildfire — "숯과 불씨". A charcoal sheet; every wildfire of 2022.1–2025.9 is a burn mark whose area is the
// burned area, rimmed with glowing embers. The same marks regroup by year, month or cause; two fires outweigh the rest.
(() => {
  const BG = "#16110e", MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  const IVORY = "rgba(255,234,214,.92)", MUTED = "rgba(255,214,182,.58)", EMBER = "#ff8a3d";
  const T0 = Date.UTC(2022, 0, 1), SWEEP = 4.2;
  const p2 = (n) => String(n).padStart(2, "0");
  const stamp = (m) => { const d = new Date(T0 + m * 60000); return `${d.getUTCFullYear()}.${p2(d.getUTCMonth() + 1)}.${p2(d.getUTCDate())}`; };
  const clock = (m) => { const d = new Date(T0 + m * 60000); return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`; };
  const ha = (v) => (v >= 10 ? KF.fmt(v) : v >= 1 ? KF.fmt(v, 1) : KF.fmt(v, 2));
  const dur = (m) => (m < 0 ? "기록 오류" : m < 60 ? `${m}분` : m < 2880 ? `${KF.fmt(m / 60, 1)}시간` : `${KF.fmt(m / 1440, 1)}일`);
  // text width estimate, so layout does not depend on font loading
  const tw = (s, fs) => { let w = 0; for (const ch of s) { const c = ch.charCodeAt(0); w += c >= 0xac00 && c <= 0xd7a3 ? fs * 0.96 : c === 32 ? fs * 0.32 : fs * 0.62; } return w; };
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // ---------------------------------------------------------------- data
  let cache = null;
  function prep(d) {
    if (cache && cache.d === d) return cache;
    const fires = d.fires.map((f, i) => {
      const dt = new Date(T0 + f[0] * 60000);
      return { i, t: f[0], year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, where: d.places[f[1]], dong: f[2], c: f[3],
        text: d.texts[f[4]], area: f[5], dur: f[6], ph: (i * 2.399) % 6.283 };
    });
    const years = [...new Set(fires.map((f) => f.year))].sort();
    const causeOrder = d.causes.map((_, i) => i).sort((a, b) => d.causes[b].n - d.causes[a].n);
    const views = {
      year: years.map((y) => ({ name: String(y), test: (f) => f.year === y })),
      month: Array.from({ length: 12 }, (_, m) => ({ name: `${m + 1}월`, test: (f) => f.month === m + 1 })),
      cause: causeOrder.map((ci) => ({ name: d.causes[ci].label, test: (f) => f.c === ci })),
    };
    for (const v of Object.values(views)) for (const g of v) {
      g.items = fires.filter(g.test); g.n = g.items.length; g.area = g.items.reduce((a, f) => a + f.area, 0);
    }
    const total = fires.reduce((a, f) => a + f.area, 0);
    const bySize = [...fires].sort((a, b) => b.area - a.area);
    bySize.forEach((f, k) => { f.rank = k / fires.length; f.grow = 0.22 + 0.95 * KF.clamp(Math.log10(1 + f.area) / 4.8, 0, 1); });
    const tFirst = fires[0].t, tLast = fires[fires.length - 1].t;
    fires.forEach((f) => { f.ig = ((f.t - tFirst) / (tLast - tFirst)); });
    const hiker = d.causes[causeOrder[0]], mar = views.month[2];
    const head = {
      year: { big: (bySize[0].area + bySize[1].area) / total * 100, cap: "가장 큰 2건이 태운 몫",
        sub: `${stamp(bySize[0].t).slice(0, 7)} ${bySize[0].where} 두 산불` },
      month: { big: mar.area / total * 100, cap: "3월에 탄 넓이의 몫", sub: `3월 산불은 건수의 ${KF.fmt(mar.n / fires.length * 100)}%` },
      cause: { big: hiker.area / total * 100, cap: `건수 1위 ${hiker.label}가 태운 몫`, sub: `건수로는 ${KF.fmt(hiker.n / fires.length * 100, 1)}%` },
    };
    return (cache = { d, fires, bySize, views, total, head, tFirst, tLast, years });
  }

  // ---------------------------------------------------------------- front-chain circle packing (after d3.packSiblings)
  function place(b, a, c) {
    const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
    if (d2) {
      let a2 = a.r + c.r, b2 = b.r + c.r; a2 *= a2; b2 *= b2;
      if (a2 > b2) {
        const x = (d2 + b2 - a2) / (2 * d2), y = Math.sqrt(Math.max(0, b2 / d2 - x * x));
        c.x = b.x - x * dx - y * dy; c.y = b.y - x * dy + y * dx;
      } else {
        const x = (d2 + a2 - b2) / (2 * d2), y = Math.sqrt(Math.max(0, a2 / d2 - x * x));
        c.x = a.x + x * dx - y * dy; c.y = a.y + x * dy + y * dx;
      }
    } else { c.x = a.x + c.r; c.y = a.y; }
  }
  const hits = (a, b) => { const dr = a.r + b.r - 1e-6, dx = b.x - a.x, dy = b.y - a.y; return dr > 0 && dr * dr > dx * dx + dy * dy; };
  const score = (n) => { const a = n._, b = n.next._, ab = a.r + b.r, dx = (a.x * b.r + b.x * a.r) / ab, dy = (a.y * b.r + b.y * a.r) / ab; return dx * dx + dy * dy; };
  function pack(cs) { // cs sorted by r desc -> sets x,y around (0,0), returns enclosing radius
    const n = cs.length;
    if (!n) return [0, 0];
    let a = cs[0], b, c;
    a.x = 0; a.y = 0;
    if (n > 1) { b = cs[1]; a.x = -b.r; b.x = a.r; b.y = 0; }
    if (n > 2) {
      place(b, a, (c = cs[2]));
      a = { _: a }; b = { _: b }; c = { _: c };
      a.next = c.previous = b; b.next = a.previous = c; c.next = b.previous = a;
      pack: for (let i = 3; i < n; ++i) {
        place(a._, b._, (c = cs[i])); c = { _: c };
        let j = b.next, k = a.previous, sj = b._.r, sk = a._.r;
        do {
          if (sj <= sk) {
            if (hits(j._, c._)) { b = j; a.next = b; b.previous = a; --i; continue pack; }
            sj += j._.r; j = j.next;
          } else {
            if (hits(k._, c._)) { a = k; a.next = b; b.previous = a; --i; continue pack; }
            sk += k._.r; k = k.previous;
          }
        } while (j !== k.next);
        c.previous = a; c.next = b; a.next = b.previous = b = c;
        let aa = score(a);
        while ((c = c.next) !== b) { const ca = score(c); if (ca < aa) { a = c; aa = ca; } }
        b = a.next;
      }
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const q of cs) { x0 = Math.min(x0, q.x - q.r); x1 = Math.max(x1, q.x + q.r); y0 = Math.min(y0, q.y - q.r); y1 = Math.max(y1, q.y + q.r); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    for (const q of cs) { q.x -= cx; q.y -= cy; }
    return [(x1 - x0) / 2, (y1 - y0) / 2];
  }

  // ---------------------------------------------------------------- layout: pack each group, flow groups into rows
  function arrange(groups, box, k, st) {
    const cl = groups.map((g) => {
      const cs = g.items.map((f) => ({ f, r: Math.sqrt(st.minR * st.minR + k * k * f.area) + st.gap })).sort((a, b) => b.r - a.r);
      const [hw, hh] = pack(cs);
      const lw = st.nameOnly ? tw(g.name, st.fsName) : Math.max(tw(g.name, st.fsName), tw(`${KF.fmt(g.n)}건`, st.fsNum), tw(`${ha(g.area)}ha`, st.fsNum));
      return { g, cs, hw, hh, slot: Math.max(2 * hw, lw) + st.hgap };
    });
    const rows = [];
    let row = [], rw = 0;
    for (const c of cl) {
      if (row.length && rw + c.slot > box.w) { rows.push(row); row = []; rw = 0; }
      row.push(c); rw += c.slot;
    }
    rows.push(row);
    let y = box.y, fits = true;
    for (const r of rows) {
      const maxH = Math.max(...r.map((c) => c.hh)), rowW = r.reduce((a, c) => a + c.slot, 0);
      let x = box.x + (box.w - rowW) / 2;
      for (const c of r) { c.cx = x + c.slot / 2; c.cy = y + maxH; x += c.slot; }
      y += 2 * maxH + st.labelH + st.vgap;
      if (rowW > box.w + 0.5) fits = false;
    }
    const height = y - st.vgap - box.y;
    if (height > box.h) fits = false;
    return { fits, clusters: cl, height };
  }

  function fit(groups, box, st, n) {
    let lo = 0.005, hi = 6, best = null;
    for (let it = 0; it < 20; it++) {
      const k = Math.sqrt(lo * hi), L = arrange(groups, box, k, st);
      if (L.fits) { lo = k; best = L; } else hi = k;
    }
    best = best || arrange(groups, box, lo, st);
    best.k = lo;
    const dy = Math.max(0, (box.h - best.height) / 2);
    const pos = new Array(n);
    for (const c of best.clusters) {
      c.cy += dy;
      for (const q of c.cs) pos[q.f.i] = [c.cx + q.x, c.cy + q.y, Math.max(0.5, q.r - st.gap)];
    }
    best.pos = pos;
    return best;
  }

  function style(full, thumbH) {
    if (thumbH) return { minR: 0.42, gap: 0.16, fsName: Math.max(9, Math.round(thumbH * 0.045)), fsNum: 9, labelH: Math.max(9, Math.round(thumbH * 0.045)) + 8, hgap: 10, vgap: 4, nameOnly: true };
    return full ? { minR: 0.85, gap: 0.36, fsName: 13, fsNum: 11, labelH: 54, hgap: 26, vgap: 10 }
      : { minR: 0.62, gap: 0.26, fsName: 11, fsNum: 9.5, labelH: 45, hgap: 12, vgap: 8 };
  }

  // ---------------------------------------------------------------- charcoal paper
  const texCache = new Map();
  function texture(w, h, dpr) {
    const key = `${Math.round(w)}x${Math.round(h)}@${dpr}`;
    if (texCache.has(key)) return texCache.get(key);
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
    const x = c.getContext("2d"); x.scale(dpr, dpr);
    x.fillStyle = BG; x.fillRect(0, 0, w, h);
    const g = x.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, Math.max(w, h) * 0.75);
    g.addColorStop(0, "rgba(60,40,28,.22)"); g.addColorStop(1, "rgba(0,0,0,.35)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 60; i++) { // long charcoal grain
      const y = r() * h, len = w * (0.2 + r() * 0.6), x0 = r() * w - len * 0.3;
      x.strokeStyle = `rgba(${r() < 0.5 ? "255,225,200" : "0,0,0"},${0.012 + r() * 0.03})`; x.lineWidth = 0.6 + r() * 1.6;
      x.beginPath(); x.moveTo(x0, y); x.quadraticCurveTo(x0 + len / 2, y + (r() - 0.5) * 18, x0 + len, y + (r() - 0.5) * 30); x.stroke();
    }
    for (let i = 0, n = (w * h) / 55; i < n; i++) {
      x.fillStyle = r() < 0.55 ? `rgba(255,228,205,${0.02 + r() * 0.05})` : `rgba(0,0,0,${0.05 + r() * 0.12})`;
      x.fillRect(r() * w, r() * h, r() < 0.9 ? 1 : 2, 1);
    }
    if (texCache.size > 8) texCache.clear();
    texCache.set(key, c);
    return c;
  }

  // ---------------------------------------------------------------- marks
  const edge = (r, a, ph) => r * (0.972 + 0.014 * Math.sin(3 * a + ph) + 0.009 * Math.sin(7 * a + ph * 2) + 0.005 * Math.sin(17 * a + ph * 3));
  function outline(ctx, x, y, r, ph, a0 = 0, a1 = Math.PI * 2) {
    ctx.beginPath();
    if (r < 9) { ctx.arc(x, y, r, a0, a1); return; }
    const N = Math.max(6, Math.ceil(((a1 - a0) / (Math.PI * 2)) * (r > 60 ? 90 : 48)));
    for (let k = 0; k <= N; k++) {
      const a = a0 + (k / N) * (a1 - a0), rr = edge(r, a, ph);
      k ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    if (a1 - a0 >= Math.PI * 2 - 1e-6) ctx.closePath();
  }

  function mark(ctx, x, y, r, f, heat, dim, time) {
    const fl = 0.78 + 0.22 * Math.sin(time * 2.1 + f.ph) * Math.sin(time * 1.3 + f.ph * 1.7);
    if (r < 2.6) { // a speck of ember
      ctx.globalAlpha = dim ? 0.14 : heat > 0.35 ? 1 : 0.42 + 0.4 * fl;
      ctx.fillStyle = dim ? "#6d5d52" : heat > 0.35 ? "#ffe7b0" : r > 1.6 ? "#ff9447" : "#e8703a";
      ctx.beginPath(); ctx.arc(x, y, Math.max(0.55, r * 0.92), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }
    // ash disc
    outline(ctx, x, y, r, f.ph);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, dim ? "#211a16" : "#3d342e"); g.addColorStop(0.72, dim ? "#1c1613" : "#2e2621"); g.addColorStop(0.93, dim ? "#18120f" : "#1d1612");
    g.addColorStop(1, dim ? "#140f0c" : "#0f0b09");
    ctx.fillStyle = g; ctx.fill();
    if (dim) { ctx.strokeStyle = "rgba(120,100,88,.25)"; ctx.lineWidth = 1; ctx.stroke(); return; }
    if (r > 14) { // faint ash rings
      ctx.save(); ctx.clip();
      ctx.strokeStyle = "rgba(255,235,220,.035)"; ctx.lineWidth = 1;
      for (let q = r * 0.3; q < r; q += Math.max(5, r * 0.09)) { ctx.beginPath(); ctx.arc(x + Math.sin(f.ph) * r * 0.08, y, q, 0, 7); ctx.stroke(); }
      ctx.restore(); outline(ctx, x, y, r, f.ph);
    }
    // ember rim: hot while spreading, glowing red-orange once burnt out
    const lw = KF.clamp(r * 0.05, 1.1, 5.5);
    ctx.save();
    ctx.shadowColor = heat > 0.3 ? "rgba(255,200,120,.95)" : "rgba(255,96,24,.9)";
    ctx.shadowBlur = KF.clamp(3 + r * 0.16, 3, 26) * (0.7 + 0.3 * fl + heat);
    ctx.strokeStyle = heat > 0.3 ? `rgba(255,${Math.round(170 + 70 * heat)},${Math.round(90 + 100 * heat)},1)` : `rgba(255,${Math.round(92 + 40 * fl)},${Math.round(34 + 20 * fl)},${0.75 + 0.25 * fl})`;
    ctx.lineWidth = lw; ctx.stroke();
    ctx.restore();
    if (r > 22) { // hot spots travelling along the rim
      for (let k = 0; k < 7; k++) {
        const a0 = f.ph * 3 + k * 0.9 + Math.sin(time * 0.35 + k + f.ph) * 0.5, span = 0.18 + 0.12 * Math.sin(time * 0.9 + k * 2);
        ctx.strokeStyle = `rgba(255,214,140,${0.25 + 0.35 * Math.max(0, Math.sin(time * 1.6 + k * 1.3 + f.ph))})`;
        ctx.lineWidth = lw * 0.55;
        outline(ctx, x, y, r, f.ph, a0, a0 + span); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = `rgba(255,220,160,${0.25 + 0.3 * fl})`; ctx.lineWidth = lw * 0.4; ctx.stroke();
    }
  }

  // Draw every fire at its (possibly moving) place. Returns hover hit.
  function scene(ctx, P, A, B, tr, el, time, filt, hover, named = 0) {
    let hit = null, hd = 1e9;
    for (let n = 0; n < P.bySize.length; n++) {
      const f = P.bySize[n];
      const age = el - f.ig * SWEEP;
      if (age < 0) continue;
      const a = A.pos[f.i], b = B.pos[f.i];
      const e = KF.ease(KF.clamp(tr * 1.35 - f.rank * 0.35, 0, 1));
      const x = KF.lerp(a[0], b[0], e), y = KF.lerp(a[1], b[1], e), R = KF.lerp(a[2], b[2], e);
      const g = KF.clamp(age / f.grow, 0, 1), r = R * (1 - Math.pow(1 - g, 3));
      const heat = 1 - KF.clamp(age / (f.grow + 0.7), 0, 1);
      const dim = filt >= 0 && f.c !== filt;
      mark(ctx, x, y, Math.max(0.5, r), f, heat, dim, time);
      if (named && r > named && g >= 1) { // name the few giant burns inside their ash
        const fs = KF.clamp(r * 0.13, 10, 14);
        ctx.save(); ctx.globalAlpha = dim ? 0.3 : 0.82; ctx.textAlign = "center";
        ctx.fillStyle = IVORY; ctx.font = `600 ${fs}px ${SANS}`; ctx.fillText(f.where, x, y - fs * 0.35);
        ctx.fillStyle = "#ffb27a"; ctx.font = `600 ${fs * 0.92}px ${MONO}`; ctx.fillText(`${ha(f.area)}ha`, x, y + fs * 0.95);
        ctx.fillStyle = MUTED; ctx.font = `500 ${fs * 0.8}px ${MONO}`; ctx.fillText(stamp(f.t), x, y + fs * 2.1);
        ctx.restore();
      }
      if (hover) {
        const dd = Math.hypot(hover[0] - x, hover[1] - y) - r;
        if (dd < Math.max(3, 6 - r) && dd < hd) { hd = dd; hit = { f, x, y, r }; }
      }
    }
    return hit;
  }

  function labels(ctx, L, st, alpha, full) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.textAlign = "center";
    for (const c of L.clusters) {
      const y = c.cy + c.hh + st.fsName + 5;
      ctx.fillStyle = IVORY; ctx.font = `600 ${st.fsName}px ${SANS}`; ctx.fillText(c.g.name, c.cx, y);
      ctx.fillStyle = MUTED; ctx.font = `500 ${st.fsNum}px ${MONO}`;
      if (st.nameOnly) continue;
      if (full) {
        ctx.fillText(`${KF.fmt(c.g.n)}건`, c.cx, y + st.fsNum + 5);
        ctx.fillStyle = "rgba(255,160,100,.85)"; ctx.fillText(`${ha(c.g.area)}ha`, c.cx, y + 2 * st.fsNum + 10);
      } else {
        ctx.fillText(`${KF.fmt(c.g.n)}건`, c.cx, y + st.fsNum + 3);
        ctx.fillStyle = "rgba(255,160,100,.85)"; ctx.fillText(`${ha(c.g.area)}ha`, c.cx, y + 2 * st.fsNum + 6);
      }
    }
    ctx.restore();
  }

  function tip(ctx, w, h, hit, P, full) {
    const f = hit.f, cause = P.d.causes[f.c].label;
    const lines = [[`${stamp(f.t)} ${clock(f.t)}`, `600 12px ${MONO}`, IVORY], [`${f.where} ${f.dong}`.trim(), `600 13px ${SANS}`, IVORY],
      [`원인  ${f.text} (${cause})`, `500 11.5px ${SANS}`, MUTED],
      [`피해 ${ha(f.area)}ha · 진화 종료까지 ${dur(f.dur)}`, `600 12px ${MONO}`, "#ffb27a"]];
    ctx.save();
    let bw = 0;
    for (const [t, font] of lines) { ctx.font = font; bw = Math.max(bw, ctx.measureText(t).width); }
    bw = Math.min(bw + 22, w - 16);
    const bh = 14 + lines.length * 19;
    let bx = hit.x + hit.r + 12, by = hit.y - bh / 2;
    if (bx + bw > w - 8) bx = hit.x - hit.r - 12 - bw;
    if (bx < 8) bx = KF.clamp(hit.x - bw / 2, 8, w - bw - 8);
    by = KF.clamp(by, 8, h - bh - 8);
    ctx.strokeStyle = "#fff4e6"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(hit.x, hit.y, Math.max(hit.r + 3, 5), 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(14,10,8,.94)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(255,140,70,.6)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, font, col], k) => { ctx.font = font; ctx.fillStyle = col; ctx.fillText(t, bx + 11, by + 22 + k * 19, bw - 20); });
    ctx.restore();
  }

  // ---------------------------------------------------------------- thumbnail
  const thumbCache = new Map();
  function thumb(ctx, w, h, t, d) {
    const P = prep(d);
    const key = `${Math.round(w)}x${Math.round(h)}`;
    let L = thumbCache.get(key);
    const st = style(false, h);
    if (!L) {
      L = fit(P.views.year, { x: 10, y: 8, w: w - 20, h: h * 0.74 - 8 }, st, P.fires.length);
      thumbCache.set(key, L);
    }
    ctx.drawImage(texture(w, h, Math.min(devicePixelRatio || 1, 2)), 0, 0, w, h);
    const c = t % 10, el = KF.clamp(c / 3.1, 0, 1) * SWEEP + Math.max(0, c - 3.1);
    scene(ctx, P, L, L, 1, el, t, -1, null);
    labels(ctx, L, st, 1, false);
    const tx = w - 12, by = h - 12, fs = Math.round(h * 0.15);
    ctx.textAlign = "right";
    if (el < SWEEP) {
      const now = P.tFirst + (el / SWEEP) * (P.tLast - P.tFirst);
      ctx.fillStyle = IVORY; ctx.font = `600 ${Math.round(h * 0.075)}px ${MONO}`; ctx.fillText(stamp(now), tx, by);
    } else {
      ctx.fillStyle = EMBER; ctx.font = `700 ${fs}px ${SANS}`;
      const big = `${KF.fmt(P.head.year.big, 1)}%`;
      ctx.fillText(big, tx, by);
      const bw = ctx.measureText(big).width, cs = Math.max(10, Math.round(h * 0.05));
      ctx.fillStyle = IVORY; ctx.font = `500 ${cs}px ${SANS}`;
      ctx.fillText(`산불 ${KF.fmt(P.fires.length)}건 중`, tx - bw - 10, by - cs * 1.25);
      ctx.fillText("가장 큰 2건이 태운 몫", tx - bw - 10, by);
    }
    if (c > 9) { ctx.fillStyle = `rgba(22,17,14,${c - 9})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- detail stage
  function mount(stage, controls, d) {
    const P = prep(d), s = KF.canvas(stage);
    const V0 = "year";
    let view = V0, prev = V0, tSw = -1e9, t0 = performance.now(), filt = -1, hover = null, LY = null, full = true, st = null;
    if (KF.reduced) t0 -= 1e5;
    const relayout = () => {
      full = s.w > 520; st = style(full);
      const top = full ? 84 : 72, box = { x: full ? 22 : 10, y: top, w: s.w - (full ? 44 : 20), h: s.h - top - (full ? 8 : 6) };
      LY = {};
      for (const v of ["year", "month", "cause"]) LY[v] = fit(P.views[v], box, st, P.fires.length);
    };
    s.onresize = relayout; relayout();

    KF.segment(controls, [{ id: "year", label: "연도별" }, { id: "month", label: "달별" }, { id: "cause", label: "원인별" }], V0,
      (id) => { if (id !== view) { prev = view; view = id; tSw = performance.now(); } });
    const again = document.createElement("button");
    again.type = "button"; again.textContent = "다시 태우기"; again.onclick = () => { t0 = performance.now(); };
    controls.appendChild(again);
    const lab = document.createElement("span"); lab.className = "readout"; lab.textContent = "원인 강조"; controls.appendChild(lab);
    const top4 = [...P.d.causes.keys()].filter((i) => ["hiker", "burn", "cig", "grave"].includes(P.d.causes[i].id));
    const out = document.createElement("span"); out.className = "readout";
    const setOut = () => {
      if (filt < 0) { out.textContent = `전체 ${KF.fmt(P.fires.length)}건 · ${KF.fmt(P.total)}ha`; return; }
      const c = P.d.causes[filt];
      out.textContent = `${c.label} ${KF.fmt(c.n)}건(${KF.fmt(c.n / P.fires.length * 100, 1)}%) · ${ha(c.area)}ha(${KF.fmt(c.area / P.total * 100, 1)}%)`;
    };
    KF.segment(controls, [{ id: -1, label: "전체" }, ...top4.map((i) => ({ id: i, label: P.d.causes[i].label }))], -1, (id) => { filt = id; setOut(); });
    controls.appendChild(out); setOut();

    const at = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = at(e); });
    stage.addEventListener("pointerdown", (e) => { hover = at(e); });
    stage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, now = performance.now(), time = now / 1000;
      const el = (now - t0) / 1000, tr = KF.clamp((now - tSw) / 1000 / 1.3, 0, 1);
      ctx.drawImage(texture(w, h, s.dpr), 0, 0, w, h);
      const A = LY[prev], B = LY[view];
      const hit = scene(ctx, P, A, B, tr, el, time, filt, el > SWEEP ? hover : null, full ? 52 : 44);
      // group labels cross-fade while marks travel
      if (tr < 1) { labels(ctx, A, st, 1 - KF.clamp(tr * 2, 0, 1), full); labels(ctx, B, st, KF.clamp(tr * 2 - 1, 0, 1), full); }
      else labels(ctx, B, st, KF.clamp((el - 0.3) / 1, 0, 1), full);

      // header
      ctx.textAlign = "left";
      const lit = P.fires.filter((f) => f.ig * SWEEP <= el);
      if (full) {
        ctx.fillStyle = IVORY; ctx.font = `600 12px ${MONO}`;
        ctx.fillText(`산림청 산불통계 ${KF.fmt(P.fires.length)}건 · ${stamp(P.tFirst).slice(0, 7)}–${stamp(P.tLast).slice(0, 7)}`, 22, 30);
        ctx.fillStyle = MUTED; ctx.font = `500 11px ${MONO}`;
        const k = LY[view].k, refA = k * Math.sqrt(1000) <= 24 ? 1000 : 100, ref = k * Math.sqrt(refA);
        const note = "원 넓이 = 피해 면적 · 원 하나 = 산불 한 건 ·";
        ctx.fillText(note, 22, 52);
        const cx = 22 + ctx.measureText(note).width + 8 + ref;
        ctx.strokeStyle = "rgba(255,214,182,.7)"; ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, 48, ref, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillText(`${KF.fmt(refA)}ha`, cx + ref + 6, 52);
      } else {
        ctx.fillStyle = IVORY; ctx.font = `600 11px ${MONO}`;
        ctx.fillText(`산불 ${KF.fmt(P.fires.length)}건 · ${stamp(P.tFirst).slice(0, 4)}–${stamp(P.tLast).slice(0, 7)}`, 10, 22);
        ctx.fillStyle = MUTED; ctx.font = `500 10px ${MONO}`; ctx.fillText("원 넓이 = 피해 면적", 10, 38);
      }
      ctx.textAlign = "right";
      const rx = w - (full ? 22 : 10);
      if (el < SWEEP + 0.4) {
        const tNow = P.tFirst + KF.clamp(el / SWEEP, 0, 1) * (P.tLast - P.tFirst);
        const area = lit.reduce((a, f) => a + f.area, 0);
        ctx.fillStyle = IVORY; ctx.font = `600 ${full ? 22 : 16}px ${MONO}`; ctx.fillText(stamp(tNow), rx, full ? 38 : 30);
        ctx.fillStyle = "#ffb27a"; ctx.font = `500 ${full ? 12 : 10}px ${MONO}`;
        ctx.fillText(`${KF.fmt(lit.length)}건 · ${KF.fmt(area)}ha`, rx, full ? 58 : 48);
      } else {
        const H = P.head[view], a = KF.clamp((el - SWEEP - 0.4) / 0.6, 0, 1);
        ctx.globalAlpha = a;
        const big = `${KF.fmt(H.big, 1)}%`;
        ctx.fillStyle = EMBER; ctx.font = `700 ${full ? 40 : 26}px ${SANS}`; ctx.fillText(big, rx, full ? 56 : 40);
        const bw = ctx.measureText(big).width;
        if (full) {
          ctx.fillStyle = IVORY; ctx.font = `600 13px ${SANS}`; ctx.fillText(H.cap, rx - bw - 14, 36);
          ctx.fillStyle = MUTED; ctx.font = `500 11px ${MONO}`; ctx.fillText(H.sub, rx - bw - 14, 54);
        } else {
          ctx.fillStyle = IVORY; ctx.font = `600 10.5px ${SANS}`; ctx.fillText(H.cap, rx, 58);
        }
        ctx.globalAlpha = 1;
      }
      if (hit) tip(ctx, w, h, hit, P, full);
    });
  }

  VIZ.wildfire = { thumb, mount, bg: BG };
})();
