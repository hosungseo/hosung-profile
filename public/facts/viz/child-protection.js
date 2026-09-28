// 17 child-protection — "손전등". A dark field and a flashlight: the beam is only as wide as what was found that year
// (1 dot = 10 judged cases), split into bands by type. What lies outside the beam is unknown, not empty.
(() => {
  const BG = "#0e0c0a", INK = "#efe7da", MUTED = "rgba(239,231,218,.56)", WARM = "rgba(255,244,222,";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  const PAL = {
    types: ["#d8b47a", "#d9896a", "#a79be0", "#c7839c", "#78b3aa"],
    police: ["#e0a458", "#cfc3a4", "#8c97a6", "#78b3aa"],
    services: ["#a79be0", "#d9896a", "#78b3aa"],
  };
  const TITLE = { types: "아동학대 판정 사례", police: "경찰 아동학대 검거", services: "아동학대 관련 서비스 제공" };
  const NOUN = { types: "판정", police: "검거", services: "서비스" };
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // ---------------------------------------------------------------- data -> per view per year: totals, band counts
  let cache = null;
  function prep(d) {
    if (cache && cache.d === d) return cache;
    const V = {};
    V.types = { labels: d.types.labels, years: d.types.years, unit: 10,
      totals: d.types.rows.map((r) => r.reduce((a, b) => a + b, 0)), bands: d.types.rows };
    V.police = { labels: d.police.labels, years: d.police.years, unit: 10, totals: d.police.cases, bands: d.police.rows };
    V.services = { labels: d.services.labels, years: d.services.years, unit: 1000,
      totals: d.services.rows.map((r) => r.reduce((a, b) => a + b, 0)), bands: d.services.rows };
    const M = Math.max(...Object.values(V).map((v) => Math.max(...v.totals.map((t) => Math.round(t / v.unit)))));
    // points spread evenly over the widest possible beam, ordered by distance from the beam's axis
    const r = rng(20241), pts = [];
    for (let i = 0; i < M; i++) {
      const a = (i + 0.5) / M * 2 - 1 + (r() - 0.5) / M; // stratified signed angle in [-1, 1]
      pts.push({ a, rr: Math.sqrt(0.02 + r() * 0.98) });
    }
    pts.sort((p, q) => Math.abs(p.a) - Math.abs(q.a));
    // band assignment per view/year: lit points sorted by angle, cut in proportion to band counts
    for (const v of Object.values(V)) {
      v.assign = v.years.map((_, yi) => {
        const n = Math.round(v.totals[yi] / v.unit), band = new Int8Array(M).fill(-1);
        const idx = Array.from({ length: n }, (_, i) => i).sort((i, j) => pts[i].a - pts[j].a);
        const b = v.bands[yi], s = b.reduce((x, y) => x + y, 0);
        let k = 0, acc = 0;
        idx.forEach((pi, j) => {
          while (k < b.length - 1 && j >= Math.round(((acc + b[k]) / s) * n)) { acc += b[k]; k++; }
          band[pi] = k;
        });
        return { n, band };
      });
    }
    return (cache = { d, V, pts, M });
  }

  // ---------------------------------------------------------------- geometry
  function geom(w, h, mode) {
    if (mode === "thumb") return { x0: w * 0.1, y0: h * 0.52, R: w * 0.56, tmax: 0.36, dot: Math.max(0.7, w / 520) };
    if (mode === "full") return { x0: 96, y0: h * 0.5 + 6, R: Math.min(620, w * 0.62), tmax: 0.34, dot: 1.7 };
    return { x0: 30, y0: h * 0.42, R: w - 46, tmax: 0.36, dot: 1.05 };
  }

  function flashlight(ctx, g, on) {
    const { x0, y0 } = g, L = Math.max(28, g.R * 0.09), H = Math.max(9, g.R * 0.03);
    ctx.save();
    const body = ctx.createLinearGradient(0, y0 - H, 0, y0 + H);
    body.addColorStop(0, "#4a4540"); body.addColorStop(0.5, "#2b2825"); body.addColorStop(1, "#1a1816");
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.roundRect(x0 - L - 6, y0 - H * 0.7, L, H * 1.4, 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x0 - 8, y0 - H * 0.72); ctx.lineTo(x0, y0 - H * 1.05); ctx.lineTo(x0, y0 + H * 1.05); ctx.lineTo(x0 - 8, y0 + H * 0.72); ctx.closePath(); ctx.fill();
    ctx.fillStyle = on > 0 ? `rgba(255,246,226,${0.5 + 0.5 * on})` : "#3a3632";
    ctx.beginPath(); ctx.ellipse(x0, y0, 2.5, H * 1.02, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(x0 - L - 2, y0 - H * 0.55, L - 12, 2);
    ctx.restore();
  }

  function beam(ctx, g, th, on) {
    if (th <= 0 || on <= 0) return;
    const { x0, y0, R } = g;
    for (const [k, a] of [[1.08, 0.03], [1.0, 0.07]]) {
      const grd = ctx.createRadialGradient(x0, y0, 0, x0, y0, R * 1.02);
      grd.addColorStop(0, `${WARM}${(0.2 * on * a) / 0.07})`); grd.addColorStop(0.6, `${WARM}${(0.08 * on * a) / 0.07})`); grd.addColorStop(1, `${WARM}0)`);
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.arc(x0, y0, R * 1.02, -th * k, th * k); ctx.closePath(); ctx.fill();
    }
  }

  // Draw lit dots of view v at fractional year position yf (index), returns hover hit
  function dots(ctx, g, P, v, yf, on, hover) {
    const V = P.V[v], i0 = Math.floor(yf), i1 = Math.min(V.years.length - 1, i0 + 1), f = yf - i0;
    const A = V.assign[i0], B = V.assign[i1];
    const n = KF.lerp(A.n, B.n, KF.ease(f)), band = f < 0.5 ? A.band : B.band, other = f < 0.5 ? B.band : A.band;
    const cols = PAL[v], paths = cols.map(() => new Path2D());
    let hit = null, hd = 7;
    const nn = Math.ceil(n);
    for (let i = 0; i < nn; i++) {
      const p = P.pts[i], k = band[i] >= 0 ? band[i] : other[i];
      if (k < 0) continue;
      const ang = p.a * g.tmax, r = g.R * p.rr;
      const x = g.x0 + Math.cos(ang) * r, y = g.y0 + Math.sin(ang) * r;
      paths[k].moveTo(x + g.dot, y); paths[k].arc(x, y, g.dot, 0, Math.PI * 2);
      if (hover) { const dd = Math.hypot(hover[0] - x, hover[1] - y); if (dd < hd) { hd = dd; hit = { k, x, y }; } }
    }
    ctx.globalAlpha = 0.9 * on;
    paths.forEach((pa, k) => { ctx.fillStyle = cols[k]; ctx.fill(pa); });
    ctx.globalAlpha = 1;
    return { hit, th: (n / P.M) * g.tmax };
  }

  function texture(ctx, w, h) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const vg = ctx.createRadialGradient(w * 0.4, h * 0.5, 0, w * 0.4, h * 0.5, Math.max(w, h) * 0.75);
    vg.addColorStop(0, "rgba(40,32,26,.35)"); vg.addColorStop(1, "rgba(0,0,0,.4)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  // ---------------------------------------------------------------- thumbnail
  function thumb(ctx, w, h, t, d) {
    const P = prep(d), V = P.V.types, n = V.years.length, iPeak = V.totals.indexOf(Math.max(...V.totals));
    texture(ctx, w, h);
    const c = t % 10, g = geom(w, h, "thumb");
    const on = KF.clamp((c - 0.2) / 0.4, 0, 1) * (c > 9.4 ? 1 - (c - 9.4) / 0.6 : 1);
    const yf = c < 3 ? (KF.ease(c / 3) * iPeak) : c < 6 ? iPeak : c < 8 ? iPeak + KF.ease((c - 6) / 2) * (n - 1 - iPeak) : n - 1;
    const i = Math.round(yf);
    const j0 = Math.floor(yf), j1 = Math.min(n - 1, j0 + 1);
    beam(ctx, g, (KF.lerp(V.assign[j0].n, V.assign[j1].n, KF.ease(yf - j0)) / P.M) * g.tmax, on);
    dots(ctx, g, P, "types", yf, on, null);
    flashlight(ctx, g, on);
    const fs = Math.round(h * 0.15), rx = w - 14;
    ctx.textAlign = "right";
    ctx.fillStyle = MUTED; ctx.font = `600 ${Math.round(h * 0.06)}px ${MONO}`; ctx.fillText(String(V.years[i]), rx, h * 0.2);
    ctx.fillStyle = INK; ctx.font = `700 ${fs}px ${SANS}`; ctx.fillText(KF.fmt(V.totals[i]), rx, h * 0.2 + fs * 1.05);
    const cs = Math.max(10, Math.round(h * 0.05));
    ctx.fillStyle = INK; ctx.font = `600 ${cs}px ${SANS}`; ctx.fillText("아동학대 판정 사례", rx, h * 0.2 + fs * 1.05 + h * 0.1);
    ctx.fillStyle = MUTED; ctx.font = `500 ${cs}px ${SANS}`; ctx.fillText("찾아낸 만큼만 보인다", rx, h * 0.2 + fs * 1.05 + h * 0.1 + cs * 1.45);
  }

  // ---------------------------------------------------------------- detail stage
  function mount(stage, controls, d) {
    const P = prep(d), s = KF.canvas(stage);
    let view = "types", yf = 0, target = 0, t0 = performance.now(), auto = true, hover = null;
    if (KF.reduced) { auto = false; yf = target = P.V.types.years.length - 1; t0 -= 1e5; }
    const range = document.createElement("input"), lab = document.createElement("label"), out = document.createElement("span");
    range.type = "range"; lab.append("해", range); out.className = "readout";
    KF.segment(controls, [{ id: "types", label: "유형 (판정 사례)" }, { id: "police", label: "검거 (경찰)" }, { id: "services", label: "서비스" }], view, (id) => {
      const y = P.V[view].years[Math.round(target)];
      view = id; const Y = P.V[view].years;
      target = yf = Math.max(0, Y.indexOf(KF.clamp(y, Y[0], Y[Y.length - 1])));
      auto = false; sync();
    });
    const again = document.createElement("button"); again.type = "button"; again.textContent = "다시 비추기";
    again.onclick = () => { t0 = performance.now(); auto = true; yf = target = 0; };
    controls.append(lab, again, out);
    function sync() {
      const Y = P.V[view].years; range.min = 0; range.max = Y.length - 1; range.value = Math.round(target);
      const i = Math.round(target), V = P.V[view];
      out.textContent = `${Y[i]} · ${NOUN[view]} ${KF.fmt(V.totals[i])}건`;
    }
    range.oninput = () => { auto = false; target = +range.value; sync(); };
    sync();
    const at = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = at(e); });
    stage.addEventListener("pointerdown", (e) => {
      hover = at(e);
      if (TL && hover[1] > TL.top && hover[1] < TL.bottom && hover[0] > TL.tx0 && hover[0] < TL.tx1) { // click a year on the strip
        target = KF.clamp(Math.floor((hover[0] - TL.tx0) / TL.sw), 0, TL.n - 1); auto = false; sync();
      }
    });
    stage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hover = null; });

    let lastI = -1, TL = null;
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, V = P.V[view], n = V.years.length;
      const el = (performance.now() - t0) / 1000;
      if (auto) { target = KF.clamp((el - 0.6) / 4.2, 0, 1) * (n - 1); yf = target; if (el > 4.8) auto = false; }
      else yf += (target - yf) * 0.12;
      if (Math.abs(target - yf) < 0.002) yf = target;
      const i = Math.round(yf);
      if (i !== lastI) { lastI = i; if (auto) { range.value = i; out.textContent = `${V.years[i]} · ${NOUN[view]} ${KF.fmt(V.totals[i])}건`; } }
      const on = KF.clamp((el - 0.15) / 0.35, 0, 1) * (el < 0.5 ? 0.6 + 0.4 * Math.abs(Math.sin(el * 40)) : 1);
      texture(ctx, w, h);
      const g = geom(w, h, full ? "full" : "m");
      // beam first (dots drawn on top of the light)
      const th = (KF.lerp(V.assign[Math.floor(yf)].n, V.assign[Math.min(n - 1, Math.floor(yf) + 1)].n, KF.ease(yf - Math.floor(yf))) / P.M) * g.tmax;
      beam(ctx, g, th, on);
      const { hit } = dots(ctx, g, P, view, yf, on, hover);
      flashlight(ctx, g, on);

      // header
      const cols = PAL[view], tot = V.totals[i], bands = V.bands[i];
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 12 : 11}px ${MONO}`;
      ctx.fillText(`${TITLE[view]} · 1점 = ${KF.fmt(V.unit)}건`, full ? 28 : 12, full ? 30 : 22);
      ctx.fillStyle = MUTED; ctx.font = `500 ${full ? 11.5 : 10}px ${SANS}`;
      ctx.fillText(full ? "빛은 그해 찾아낸 만큼만 넓어진다 · 빛 밖은 비어 있는 곳이 아니라 모르는 곳" : "빛 밖은 비어 있는 곳이 아니라 모르는 곳", full ? 28 : 12, full ? 50 : 38);
      ctx.textAlign = "right";
      ctx.fillStyle = MUTED; ctx.font = `600 ${full ? 14 : 11}px ${MONO}`; ctx.fillText(String(V.years[i]), w - (full ? 28 : 12), full ? 28 : 20);
      ctx.fillStyle = INK; ctx.font = `700 ${full ? 34 : 22}px ${SANS}`; ctx.fillText(`${KF.fmt(tot)}건`, w - (full ? 28 : 12), full ? 64 : 46);

      // legend: band counts for the year
      const sBand = bands.reduce((a, b) => a + b, 0);
      if (full) {
        const lx = w - 250, ly = 116;
        ctx.textAlign = "left"; ctx.fillStyle = MUTED; ctx.font = `500 11px ${SANS}`;
        ctx.fillText(view === "police" ? "처리 (사람 기준)" : view === "services" ? "받은 사람" : "유형", lx, ly - 10);
        V.labels.forEach((lb, k) => {
          const y = ly + 12 + k * 30, on2 = hit && hit.k === k;
          ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.arc(lx + 5, y - 4, on2 ? 6 : 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = on2 ? "#fff" : INK; ctx.font = `${on2 ? 700 : 600} 13px ${SANS}`; ctx.fillText(lb, lx + 18, y);
          ctx.textAlign = "right"; ctx.font = `500 12px ${MONO}`; ctx.fillStyle = on2 ? "#fff" : INK;
          ctx.fillText(KF.fmt(bands[k]), w - 90, y);
          ctx.fillStyle = MUTED; ctx.fillText(`${KF.fmt((bands[k] / sBand) * 100, 1)}%`, w - 28, y);
          ctx.textAlign = "left";
        });
        if (view === "police") { ctx.fillStyle = MUTED; ctx.font = `500 10.5px ${SANS}`; ctx.fillText("검거는 사건, 처리는 사람 기준", lx, ly + 12 + V.labels.length * 30); }
      } else {
        const ly = g.y0 + g.R * Math.sin(g.tmax) + 26;
        V.labels.forEach((lb, k) => {
          const cx = 12 + (k % 2) * ((w - 24) / 2), y = ly + Math.floor(k / 2) * 18, on2 = hit && hit.k === k;
          ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.arc(cx + 4, y - 4, 3.5, 0, Math.PI * 2); ctx.fill();
          ctx.textAlign = "left"; ctx.fillStyle = on2 ? "#fff" : INK; ctx.font = `${on2 ? 700 : 600} 11px ${SANS}`; ctx.fillText(lb, cx + 12, y);
          ctx.textAlign = "right"; ctx.fillStyle = MUTED; ctx.font = `500 10px ${MONO}`;
          ctx.fillText(`${KF.fmt((bands[k] / sBand) * 100)}%`, cx + (w - 24) / 2 - 10, y);
        });
      }

      // timeline strip: every year's total, so one year is never read alone
      const tx0 = full ? 60 : 16, tx1 = full ? w - 290 : w - 16, tb = h - (full ? 22 : 18), tH = full ? 40 : 30;
      const mx = Math.max(...V.totals), sw = (tx1 - tx0) / n;
      TL = { tx0, tx1, sw, top: tb - 12 - tH - 4, bottom: tb + 6, n };
      V.years.forEach((y, k) => {
        const bh = (V.totals[k] / mx) * tH, x = tx0 + k * sw;
        ctx.fillStyle = k === i ? "rgba(255,244,222,.85)" : "rgba(255,244,222,.22)";
        ctx.fillRect(x + sw * 0.2, tb - 12 - bh, sw * 0.6, bh);
        ctx.fillStyle = k === i ? INK : MUTED; ctx.textAlign = "center"; ctx.font = `${k === i ? 600 : 500} ${full ? 10 : 8.5}px ${MONO}`;
        ctx.fillText(full ? String(y) : `'${String(y).slice(2)}`, x + sw / 2, tb);
      });
      if (hover && hover[1] > tb - 12 - tH - 4 && hover[1] < tb + 6 && hover[0] > tx0 && hover[0] < tx1) {
        const k = Math.floor((hover[0] - tx0) / sw);
        if (k >= 0 && k < n) {
          ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `600 11px ${MONO}`;
          ctx.fillText(`${KF.fmt(V.totals[k])}`, tx0 + k * sw + sw / 2, tb - 16 - (V.totals[k] / mx) * tH);
        }
      }
      // tooltip for a dot
      if (hit && !auto) {
        const lb = V.labels[hit.k], v = bands[hit.k];
        const t1 = `${V.years[i]} · ${lb}`, t2 = `${KF.fmt(v)}${view === "police" ? "명" : "건"} · ${KF.fmt((v / sBand) * 100, 1)}%`;
        ctx.font = `600 12px ${SANS}`; const bw = Math.max(ctx.measureText(t1).width, ctx.measureText(t2).width + 10) + 22;
        const bx = KF.clamp(hit.x + 12, 8, w - bw - 8), by = KF.clamp(hit.y - 52, 8, h - 50);
        ctx.fillStyle = "rgba(14,12,10,.92)"; ctx.fillRect(bx, by, bw, 42);
        ctx.strokeStyle = PAL[view][hit.k]; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 41);
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.fillText(t1, bx + 11, by + 17);
        ctx.font = `500 11.5px ${MONO}`; ctx.fillStyle = PAL[view][hit.k]; ctx.fillText(t2, bx + 11, by + 34);
        ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.arc(hit.x, hit.y, g.dot + 3, 0, Math.PI * 2); ctx.stroke();
      }
    });
  }

  VIZ["child-protection"] = { thumb, mount, bg: BG };
})();
