// 34 emergency — "골든타임 동심원". A night in-car navigation screen: every emergency facility of the chosen level
// glows with 10/20/30 km rings (union of circles, so the coverage reads as one field). Every 행정동 is a dot sized
// by its population; dots outside the rings flicker. HUD: population by distance band, and what one 119
// ambulance has to cover (people vs land).
(() => {
  const BG = "#161e24";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#e6f1f5", MUTE = "rgba(230,241,245,.62)", FAINT = "rgba(230,241,245,.14)";
  const LAND = "#222e36", COAST = "#40576a";
  const LVC = ["#ff5d73", "#ffb547", "#3fd5c0"];                       // 권역 · 지역센터 · 지역기관
  const BANDC = ["#5fe0b5", "#9fe07a", "#e8d45a", "#ffb547", "#ff7a59", "#ff3b5c"];
  const BANDS = [0, 5, 10, 20, 30, 50, 1e9], BANDL = ["5km 안", "5–10", "10–20", "20–30", "30–50", "50km 넘게"];
  const BOX = { lon0: 124.55, lon1: 131.0, lat0: 33.08, lat1: 38.66 }, K = Math.cos((36 * Math.PI) / 180);

  const man = (v) => `${KF.fmt(v / 1e4, v < 1e5 ? 1 : 0)}만`;
  const hav = (a, b, c, d) => {
    const R = Math.PI / 180, p1 = b * R, p2 = d * R, dp = p2 - p1, dl = (c - a) * R;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 6371.0088 * 2 * Math.asin(Math.sqrt(h));
  };
  let DEC = null;
  function decode(d) {
    if (DEC && DEC.d === d) return DEC;
    const fac = d.fac.map(([name, lv, lon, lat]) => ({ name, lv, lon, lat }));
    const dong = d.dong.map(([si, name, pop, x, y], i) => ({ i, sgg: d.sgg[si], name, pop, lon: 124 + x / 1000, lat: 33 + y / 1000, ph: (i * 0.618) % 1 }));
    for (const q of dong) {                                          // nearest facility at each level
      q.d = [1e9, 1e9, 1e9]; q.n = [-1, -1, -1];
      fac.forEach((f, j) => {
        const dd = hav(q.lon, q.lat, f.lon, f.lat);
        for (let k = f.lv; k < 3; k++) if (dd < q.d[k]) { q.d[k] = dd; q.n[k] = j; }
      });
    }
    const outline = d.outline.map((s) => {
      const a = s.split(",").map(Number), pts = [[a[0], a[1]]];
      for (let k = 2; k < a.length; k += 2) { const p = pts[pts.length - 1]; pts.push([p[0] + a[k], p[1] + a[k + 1]]); }
      return pts.map(([x, y]) => [x / 100, y / 100]);
    });
    const band = (v) => BANDS.findIndex((b, i) => v >= b && v < BANDS[i + 1]);
    return (DEC = { d, fac, dong, outline, band });
  }

  function proj(w, h, mode) {
    const ux = (BOX.lon1 - BOX.lon0) * K, uy = BOX.lat1 - BOX.lat0;
    let area;
    if (mode === "full") { const H = h - 16, W = H * (ux / uy); area = [10, 8, 10 + W, 8 + H]; }
    else if (mode === "thumb") { const H = h - 8, W = H * (ux / uy); area = [w * 0.04, 4, w * 0.04 + W, 4 + H]; }
    else { const W = w - 8, H = Math.min(W * (uy / ux), h * 0.5); const W2 = H * (ux / uy); area = [(w - W2) / 2, 4, (w + W2) / 2, 4 + H]; }
    const s = (area[2] - area[0]) / ux;
    return { area, s, kmpx: s / 110.57, px: (lon, lat) => [area[0] + (lon - BOX.lon0) * K * s, area[1] + (BOX.lat1 - lat) * s] };
  }

  // static layers per size+level: land, coverage bands (union of circles), ring outlines
  const CACHE = new Map();
  function layer(X, P, w, h, lvl, key) {
    if (CACHE.has(key)) return CACHE.get(key);
    if (CACHE.size > 8) CACHE.clear();
    const dpr = Math.min(devicePixelRatio || 1, 2), mk = () => { const c = document.createElement("canvas"); c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr); const g = c.getContext("2d"); g.scale(dpr, dpr); return [c, g]; };
    const [c, g] = mk();
    const land = new Path2D();
    for (const ring of X.outline) { ring.forEach(([lo, la], i) => { const [x, y] = P.px(lo, la); i ? land.lineTo(x, y) : land.moveTo(x, y); }); land.closePath(); }
    g.fillStyle = LAND; g.fill(land);
    g.strokeStyle = COAST; g.lineWidth = 0.8; g.stroke(land);
    // grid like a nav screen
    g.save(); g.clip(land); g.strokeStyle = "rgba(120,160,180,.05)"; g.lineWidth = 1;
    for (let x = 0; x < w; x += 18) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 18) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.restore();
    const facs = X.fac.filter((f) => f.lv <= lvl);
    const [cc, gg] = mk();                                           // bands: 30 km, then 20, then 10 on top, each opaque
    for (const [r, col] of [[30, "#4d4226"], [20, "#394a2c"], [10, "#1d4b47"]]) {
      gg.fillStyle = col;
      for (const f of facs) { const [x, y] = P.px(f.lon, f.lat); gg.beginPath(); gg.arc(x, y, r * P.kmpx, 0, 7); gg.fill(); }
    }
    gg.globalCompositeOperation = "destination-in"; gg.fill(land);
    g.globalAlpha = 0.85; g.drawImage(cc, 0, 0, w, h); g.globalAlpha = 1;
    if (facs.length <= 60) {                                          // few centres: draw the rings themselves
      g.lineWidth = 0.8;
      for (const f of facs) {
        const [x, y] = P.px(f.lon, f.lat);
        [[10, 0.5], [20, 0.35], [30, 0.25]].forEach(([r, a]) => { g.strokeStyle = `rgba(255,93,115,${a})`; g.setLineDash(r === 30 ? [3, 3] : []); g.beginPath(); g.arc(x, y, r * P.kmpx, 0, 7); g.stroke(); });
      }
      g.setLineDash([]);
    }
    CACHE.set(key, c);
    return c;
  }

  function mapDraw(ctx, X, P, lvl, t, el, hover, small) {
    // dots: 행정동, radius by population, colour by distance band; outside 30 km they flicker
    let hit = null, hd = 64;
    const grow = KF.clamp(el / 1.2, 0, 1);
    for (const q of X.dong) {
      const [x, y] = P.px(q.lon, q.lat), dd = q.d[lvl], b = X.band(dd);
      let r = Math.max(small ? 0.55 : 0.7, Math.sqrt(q.pop) * 0.011 * (P.s / 100)) * (b >= 4 ? 1.25 : 1);
      r *= grow;
      const a = b >= 4 ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 3.2 + q.ph * 6.283)) : b === 3 ? 0.85 : b === 2 ? 0.6 : 0.4;
      ctx.globalAlpha = a; ctx.fillStyle = BANDC[b]; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      if (hover) { const e = (hover[0] - x) ** 2 + (hover[1] - y) ** 2; if (e < hd) { hd = e; hit = { q, x, y }; } }
    }
    ctx.globalAlpha = 1;
    // facilities
    for (const f of X.fac) {
      if (f.lv > lvl) continue;
      const [x, y] = P.px(f.lon, f.lat), r = f.lv === 0 ? (small ? 2.6 : 4) : small ? 1.4 : 2.2;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
      g.addColorStop(0, LVC[f.lv]); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, 7); ctx.fill();
      if (f.lv === 0 && !small) { ctx.strokeStyle = LVC[0]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - r * 1.6, y); ctx.lineTo(x + r * 1.6, y); ctx.moveTo(x, y - r * 1.6); ctx.lineTo(x, y + r * 1.6); ctx.stroke(); }
      if (hover && !small) { const e = (hover[0] - x) ** 2 + (hover[1] - y) ** 2; if (e < hd && e < 40) { hd = e; hit = { f, x, y }; } }
    }
    return hit;
  }

  function stats(X, lvl) {
    const pop = X.d.pop, bands = new Array(6).fill(0);
    let s = 0;
    for (const q of X.dong) { bands[X.band(q.d[lvl])] += q.pop; s += q.pop * q.d[lvl]; }
    return { mean: s / pop, bands, pop };
  }

  function hud(ctx, x0, y0, w, h, X, lvl, el, full) {
    const d = X.d, st = d.st[lvl], S = { bands: d.bands[lvl] }, a = KF.clamp((el - 0.6) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 11 : 10}px ${MONO}`; ctx.fillText("NEAREST ER · 직선거리 · 인구 가중", x0, y0);
    ctx.fillStyle = INK; ctx.font = `700 ${full ? 17 : 13}px ${SANS}`; ctx.fillText(`가장 가까운 ${d.levels[lvl]}까지`, x0, y0 + (full ? 24 : 18));
    const by = y0 + (full ? 80 : 62);
    ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 11.5 : 10}px ${SANS}`; ctx.fillText("평균", x0, by - (full ? 34 : 28)); ctx.fillText("30km 밖에 사는 사람", x0 + w * 0.42, by - (full ? 34 : 28));
    ctx.fillStyle = INK; ctx.font = `700 ${full ? 34 : 24}px ${SANS}`; ctx.fillText(`${st.mean.toFixed(1)}km`, x0, by);
    ctx.fillStyle = BANDC[5]; ctx.fillText(man(st.over["30"]), x0 + w * 0.42, by);
    ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11 : 10}px ${SANS}`;
    ctx.fillText(`중앙값 ${st.med.toFixed(1)}km`, x0, by + 18); ctx.fillText(`인구의 ${(st.over["30"] / d.pop * 100).toFixed(1)}% · 90% 지점 ${st.p90.toFixed(0)}km`, x0 + w * 0.42, by + 18);
    // bands
    const hy = by + (full ? 40 : 30), bh = full ? 17 : 11, gap = full ? 5 : 3, mx = Math.max(...S.bands);
    S.bands.forEach((v, b) => {
      const y = hy + b * (bh + gap), bw = (v / mx) * (w - 175) * a;
      ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`; ctx.textAlign = "right"; ctx.fillText(BANDL[b], x0 + 62, y + bh - 4);
      ctx.fillStyle = BANDC[b]; ctx.globalAlpha = a * (b >= 4 ? 1 : 0.8); ctx.fillRect(x0 + 70, y, bw, bh); ctx.globalAlpha = a;
      ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.font = `600 ${full ? 11 : 9.5}px ${MONO}`;
      ctx.fillText(`${man(v)} · ${(v / d.pop * 100).toFixed(1)}%`, x0 + 76 + bw, y + bh - 4);
    });
    ctx.globalAlpha = 1;
    return hy + 6 * (bh + gap);
  }

  function ambChart(ctx, x0, y0, w, h, X, el) {
    const d = X.d, rows = d.amb.map(([s, n119, all, pop, area]) => ({ s, ppl: pop / n119, km2: area / n119 }));
    const a = KF.clamp((el - 1.2) / 0.8, 0, 1), cw = w / rows.length, hh = h - 16, mid = y0 + hh * 0.5;
    const mp = Math.max(...rows.map((r) => r.ppl)), mk = Math.max(...rows.map((r) => r.km2));
    const hiP = rows.reduce((p, r) => (r.ppl > p.ppl ? r : p)), hiK = rows.reduce((p, r) => (r.km2 > p.km2 ? r : p));
    ctx.globalAlpha = a; ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 11px ${SANS}`;
    ctx.fillText(`119 구급차 한 대가 맡는 사람(위)과 땅(아래) · ${d.ay}`, x0, y0 - 24);
    ctx.font = `500 10.5px ${MONO}`; ctx.fillStyle = "#9fc6d6"; ctx.fillText(`${hiP.s} ${KF.fmt(hiP.ppl / 1e4, 1)}만 명/대`, x0, y0 - 8);
    ctx.fillStyle = "#ffb547"; ctx.fillText(`${hiK.s} ${KF.fmt(hiK.km2, 0)}㎢/대`, x0 + 150, y0 - 8);
    ctx.strokeStyle = FAINT; ctx.beginPath(); ctx.moveTo(x0, mid + 0.5); ctx.lineTo(x0 + w, mid + 0.5); ctx.stroke();
    rows.forEach((r, i) => {
      const x = x0 + i * cw + cw * 0.18, bw = cw * 0.64, up = (r.ppl / mp) * (hh * 0.5 - 2), dn = (r.km2 / mk) * (hh * 0.5 - 2);
      ctx.fillStyle = "#9fc6d6"; ctx.fillRect(x, mid - up, bw, up);
      ctx.fillStyle = "#ffb547"; ctx.fillRect(x, mid + 1, bw, dn);
      ctx.fillStyle = MUTE; ctx.font = `500 9.5px ${SANS}`; ctx.textAlign = "center";
      ctx.fillText(r.s, x + bw / 2, y0 + hh + 13);
    });
    ctx.globalAlpha = 1;
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : k === 2 ? `500 10.5px ${SANS}` : `500 11.5px ${SANS}`);
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22), bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(10,16,20,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#3fd5c0"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? MUTE : k === 1 ? "#3fd5c0" : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + j * 18); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const X = decode(d), P = proj(w, h, "thumb"), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(layer(X, P, w, h, 0, `t${w}x${h}`), 0, 0, w, h);
    mapDraw(ctx, X, P, 0, t, 2 + c, null, true);
    const x = P.area[2] + w * 0.03, st = d.st[0], a = KF.clamp((c - 0.6) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText("권역응급의료센터까지", x, h * 0.2);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.12)}px ${SANS}`; ctx.fillText(`평균 ${st.mean.toFixed(0)}km`, x, h * 0.36);
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText("30km 밖에 사는 사람", x, h * 0.58);
    ctx.fillStyle = BANDC[5]; ctx.font = `700 ${Math.round(h * 0.15)}px ${SANS}`; ctx.fillText(`${man(st.over["30"])} 명`, x, h * 0.76);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage);
    let lvl = 0, t0 = performance.now(), hover = null;
    KF.segment(controls, d.levels.map((l, i) => ({ id: i, label: `${l} ${KF.fmt(X.fac.filter((f) => f.lv <= i).length)}곳` })), 0, (id) => { lvl = id; t0 = performance.now() - 1500; });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    KF.loop(stage, (tt) => {
      const { ctx, w, h } = s, full = w > 520, P = proj(w, h, full ? "full" : "phone"), el = (performance.now() - t0) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(layer(X, P, w, h, lvl, `${w}x${h}|${lvl}`), 0, 0, w, h);
      const hit = mapDraw(ctx, X, P, lvl, performance.now() / 1000, el, hover, !full);
      if (full) {
        const x0 = P.area[2] + 26, wd = w - x0 - 22;
        const yb = hud(ctx, x0, 30, wd, h, X, lvl, el, true);
        ambChart(ctx, x0, yb + 62, wd, h - yb - 84, X, el);
        // legend line at the bottom of the map
        ctx.textAlign = "left"; ctx.font = `500 10.5px ${SANS}`; ctx.fillStyle = MUTE;
        ctx.fillText("고리 = 10·20·30km · 점 = 행정동(크기 = 인구) · 깜빡임 = 30km 밖", P.area[0] + 4, h - 10);
      } else {
        hud(ctx, 12, P.area[3] + 16, w - 24, h, X, lvl, el, false);
      }
      if (hit && hover) {
        if (hit.f) tip(ctx, w, h, [[hit.f.name, 1], [d.lvn[hit.f.lv], 2]], hover);
        else {
          const q = hit.q, lines = [[`${q.sgg} ${q.name}`, 1], [`인구 ${KF.fmt(q.pop)}명`, 0]];
          for (let k = 0; k < 3; k++) lines.push([`${["권역센터", "지역센터 이상", "응급의료기관"][k]} ${q.d[k].toFixed(1)}km · ${X.fac[q.n[k]].name}`, k === lvl ? 0 : 2]);
          tip(ctx, w, h, lines, hover);
        }
      }
    });
  }

  VIZ.emergency = { thumb, mount, bg: BG };
})();
