// 06 marriage — "Above and below the water". A lake at dusk: each year's marriages stand above the
// waterline as lit columns, the same year's divorces hang beneath it as a rippling reflection.
(() => {
  const BG = "#10202a";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  const GOLD = "#f6d196", ROSE = "#f09a9a", TXT = "#efe7d9", DIM = "rgba(239,231,217,.58)", HALO = "rgba(12,24,31,.92)";
  const MODES = {
    n: { up: "m", dn: "dv", umax: 452000, dmax: 172000 },
    per: { up: "cm", dn: "cd", umax: 7.3, dmax: 3.55 },
    ratio: { up: null, dn: "r", umax: 104, dmax: 58 },
  };
  const OFF = new WeakMap();

  // ---------------------------------------------------------------- data helpers
  function targets(d, mode) {
    const M = MODES[mode], tot = M.umax + M.dmax;
    const u = d.years.map((_, i) => (M.up ? (d[M.up][i] == null ? 0 : d[M.up][i]) : 100) / tot);
    const dn = d.years.map((_, i) => (d[M.dn][i] == null ? 0 : d[M.dn][i]) / tot);
    const miss = d.years.map((_, i) => d[M.dn][i] == null);
    return { u, dn, hf: M.umax / tot, miss, tot };
  }
  const argBy = (arr, better, from = 0, to = arr.length - 1) => {
    let k = -1;
    for (let i = from; i <= to; i++) if (arr[i] != null && (k < 0 || better(arr[i], arr[k]))) k = i;
    return k;
  };
  function stats(d) {
    const n = d.years.length, last = n - 1;
    const mPeak = argBy(d.m, (a, b) => a > b), dvPeak = argBy(d.dv, (a, b) => a > b);
    const mLow = argBy(d.m, (a, b) => a < b, mPeak + 1);
    const cmFirst = d.cm.findIndex((v) => v != null);
    const cmLow = argBy(d.cm, (a, b) => a < b, cmFirst);
    const cdPeak = argBy(d.cd, (a, b) => a > b);
    const e0 = d.years.indexOf(d.ep[0]), e1 = d.years.indexOf(d.ep[1]);
    return { n, last, mPeak, dvPeak, mLow, cmFirst, cmLow, cdPeak, e0, e1 };
  }
  const man = (v) => `${KF.fmt(v / 10000, 1)}만`;
  const pct = (a, b) => { const p = Math.round((a / b - 1) * 100); return `${p > 0 ? "+" : "−"}${Math.abs(p)}%`; };

  function fitFont(ctx, text, maxW, size, weight, fam) {
    let s = size;
    ctx.font = `${weight} ${s}px ${fam}`;
    while (s > 8 && ctx.measureText(text).width > maxW) { s -= 0.5; ctx.font = `${weight} ${s}px ${fam}`; }
    return s;
  }
  function haloText(ctx, t, x, y, color) {
    ctx.lineJoin = "round"; ctx.strokeStyle = HALO; ctx.lineWidth = 3.5; ctx.strokeText(t, x, y);
    ctx.fillStyle = color; ctx.fillText(t, x, y);
  }

  // ---------------------------------------------------------------- painting
  function sky(ctx, w, h, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, BG); g.addColorStop(0.5, "#1a2a3a"); g.addColorStop(0.86, "#3b3447"); g.addColorStop(1, "#6b4b4d");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, H + 1);
    const wg = ctx.createLinearGradient(0, H, 0, h);
    wg.addColorStop(0, "#243842"); wg.addColorStop(0.22, "#142731"); wg.addColorStop(1, "#08131a");
    ctx.fillStyle = wg; ctx.fillRect(0, H, w, h - H);
    const rg = ctx.createRadialGradient(w * 0.82, H, 0, w * 0.82, H, w * 0.42);
    rg.addColorStop(0, "rgba(255,190,140,.20)"); rg.addColorStop(1, "rgba(255,190,140,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
  }

  // o: {pad, full, rise(i), hover, t, ticks}
  function lake(ctx, w, h, d, S, o) {
    const { pad, full, t } = o;
    const avail = h - pad.t - pad.b, H = pad.t + S.hf * avail, bottom = h - pad.b;
    const n = d.years.length, slot = (w - pad.l - pad.r) / n, bw = Math.max(1.4, slot * 0.64);
    const X = (i) => pad.l + i * slot + (slot - bw) / 2;
    sky(ctx, w, h, H);

    // above-water gridlines + tick labels
    if (o.ticks) {
      ctx.font = `500 10px ${MONO}`; ctx.textAlign = "right";
      for (const [v, lab] of o.ticks.up) {
        const y = H - (v / S.tot) * avail;
        if (y < pad.t - 4) continue;
        ctx.strokeStyle = `rgba(246,209,150,${0.1 * o.tickA})`; ctx.setLineDash([2, 5]);
        ctx.beginPath(); ctx.moveTo(pad.l, Math.round(y) + 0.5); ctx.lineTo(w - pad.r, Math.round(y) + 0.5); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(246,209,150,${0.6 * o.tickA})`; ctx.fillText(lab, pad.l - 8, y + 3);
      }
    }

    // columns (marriages)
    const g = ctx.createLinearGradient(0, pad.t, 0, H);
    g.addColorStop(0, "#fff0c8"); g.addColorStop(0.55, "#f3c47e"); g.addColorStop(1, "#c9783f");
    for (let i = 0; i < n; i++) {
      const hh = S.u[i] * avail * o.rise(i);
      if (hh < 0.3) continue;
      ctx.globalAlpha = (o.hover == null || o.hover === i ? 0.96 : 0.42) * (o.colA ?? 1);
      ctx.fillStyle = g; ctx.fillRect(X(i), H - hh, bw, hh);
      ctx.fillStyle = "rgba(255,248,225,.9)"; ctx.fillRect(X(i), H - hh, bw, Math.min(1.5, hh));
    }
    ctx.globalAlpha = 1;

    // reflection (divorces) drawn crisp offscreen, then copied back strip by strip with a ripple
    const dpr = ctx.getTransform().a || 1, depth = Math.max(1, h - H);
    let off = OFF.get(ctx.canvas);
    if (!off) { off = document.createElement("canvas"); OFF.set(ctx.canvas, off); }
    const W = Math.max(1, Math.ceil(w * dpr)), D = Math.max(1, Math.ceil(depth * dpr));
    if (off.width !== W || off.height !== D) { off.width = W; off.height = D; }
    const oc = off.getContext("2d");
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, W, D); oc.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (o.ticks) {
      for (const [v] of o.ticks.dn) {
        const y = (v / S.tot) * avail;
        oc.strokeStyle = `rgba(240,154,154,${0.13 * o.tickA})`; oc.setLineDash([2, 5]);
        oc.beginPath(); oc.moveTo(pad.l, Math.round(y) + 0.5); oc.lineTo(w - pad.r, Math.round(y) + 0.5); oc.stroke();
      }
      oc.setLineDash([]);
    }
    const rg = oc.createLinearGradient(0, 0, 0, bottom - H);
    rg.addColorStop(0, "#ffb3a6"); rg.addColorStop(0.5, "#e07f8c"); rg.addColorStop(1, "#8d4267");
    for (let i = 0; i < n; i++) {
      const hh = S.dn[i] * avail * o.rise(i);
      if (hh < 0.3) continue;
      oc.globalAlpha = o.hover == null || o.hover === i ? 0.95 : 0.4;
      oc.fillStyle = rg; oc.fillRect(X(i), 0, bw, hh);
    }
    oc.globalAlpha = 1;
    const step = 2;
    for (let y = 0; y < depth; y += step) {
      const k = y / depth, sh = Math.min(step, depth - y);
      const dx = Math.sin(y * 0.19 - t * 1.9) * (0.25 + k * 1.5) + Math.sin(y * 0.05 + t * 0.7) * k * 0.9;
      ctx.globalAlpha = 0.95 - k * 0.4;
      ctx.drawImage(off, 0, Math.round(y * dpr), W, Math.max(1, Math.round(sh * dpr)), dx, H + y, w, sh);
    }
    ctx.globalAlpha = 1;
    // glints drifting on the surface
    ctx.strokeStyle = "rgba(255,228,196,.10)"; ctx.lineWidth = 1;
    for (let k = 0; k < 16; k++) {
      const len = 8 + (k * 13) % 26, gy = H + 5 + ((k * 37) % Math.max(8, depth * 0.7));
      const gx = ((k * 211 + t * (6 + (k % 4) * 3)) % (w + 60)) - 30;
      ctx.beginPath(); ctx.moveTo(gx, gy + 0.5); ctx.lineTo(gx + len, gy + 0.5); ctx.stroke();
    }
    // the waterline
    ctx.save(); ctx.shadowColor = "rgba(255,222,180,.8)"; ctx.shadowBlur = 8;
    ctx.fillStyle = "rgba(255,232,200,.85)"; ctx.fillRect(pad.l - (full ? 6 : 0), H - 0.75, w - pad.l - pad.r + (full ? 12 : 0), 1.5);
    ctx.restore();

    if (o.ticks) {
      ctx.font = `500 10px ${MONO}`; ctx.textAlign = "right";
      for (const [v, lab] of o.ticks.dn) {
        const y = H + (v / S.tot) * avail;
        if (y > bottom + 2) continue;
        ctx.fillStyle = `rgba(240,154,154,${0.66 * o.tickA})`; ctx.fillText(lab, pad.l - 8, y + 3);
      }
    }
    return { H, avail, slot, bw, X, bottom };
  }

  const TICKS = {
    n: { up: [[100000, "10만"], [200000, "20만"], [300000, "30만"], [400000, "40만"]], dn: [[50000, "5만"], [100000, "10만"], [150000, "15만"]] },
    per: { up: [[2, "2"], [4, "4"], [6, "6"]], dn: [[1, "1"], [2, "2"], [3, "3"]] },
    ratio: { up: [[100, "100"]], dn: [[20, "20"], [40, "40"]] },
  };

  // key points per mode: [index, "up"|"dn"]
  function keys(st, mode, full) {
    if (!full) {
      if (mode === "n") return [[st.mLow, "up"], [st.last, "up"], [st.dvPeak, "dn"], [st.last, "dn"]];
      if (mode === "per") return [[st.cmLow, "up"], [st.last, "up"], [st.cdPeak, "dn"], [st.last, "dn"]];
      return [[st.e0, "dn"], [st.e1, "dn"]];
    }
    if (mode === "n") return [[st.mPeak, "up"], [st.mLow, "up"], [st.last, "up"], [st.dvPeak, "dn"], [st.last, "dn"]];
    if (mode === "per") return [[st.cmFirst, "up"], [st.cmLow, "up"], [st.last, "up"], [st.cdPeak, "dn"], [st.last, "dn"]];
    return [[st.dvPeak, "dn"], [st.e0, "dn"], [st.e1, "dn"], [st.last, "dn"]];
  }

  function markers(ctx, d, S, L, st, mode, a, full) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `600 10.5px ${MONO}`;
    for (const [i, side] of keys(st, mode, full)) {
      if (i < 0) continue;
      const cx = L.X(i) + L.bw / 2;
      const y = side === "up" ? L.H - S.u[i] * L.avail : L.H + S.dn[i] * L.avail;
      ctx.strokeStyle = side === "up" ? "#fff3d6" : "#ffd0cc"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, y, 4.5, 0, 7); ctx.stroke();
      const lab = String(d.years[i]);
      if (side === "up") {
        const right = mode === "n" && i === st.mPeak;
        ctx.textAlign = right ? "left" : "center";
        haloText(ctx, lab, right ? cx + 8 : cx, right ? y + 4 : y - 9, GOLD);
      } else {
        ctx.textAlign = "center";
        haloText(ctx, lab, cx, Math.min(y + 17, L.bottom + 14), ROSE);
      }
    }
    ctx.restore();
  }

  function headerLines(d, st, mode) {
    const Y = d.years, L = st.last, f = KF.fmt;
    if (mode === "n") return [
      [GOLD, `혼인 ↑  ${Y[st.mPeak]}년 ${f(d.m[st.mPeak])} → ${Y[st.mLow]}년 ${f(d.m[st.mLow])} → ${Y[L]}년 ${f(d.m[L])}건`],
      [ROSE, `이혼 ↓  ${Y[st.dvPeak]}년 ${f(d.dv[st.dvPeak])} → ${Y[L]}년 ${f(d.dv[L])}건 (정점 대비 ${pct(d.dv[L], d.dv[st.dvPeak])})`],
      [DIM, "기둥 = 한 해 신고 건수 · 물 위와 아래는 같은 눈금"]];
    if (mode === "per") return [
      [GOLD, `혼인 ↑  ${Y[st.cmFirst]}년 ${d.cm[st.cmFirst].toFixed(1)} → ${Y[st.cmLow]}년 ${d.cm[st.cmLow].toFixed(1)} → ${Y[L]}년 ${d.cm[L].toFixed(1)}건`],
      [ROSE, `이혼 ↓  ${Y[st.cdPeak]}년 ${d.cd[st.cdPeak].toFixed(1)} → ${Y[L]}년 ${d.cd[L].toFixed(1)}건`],
      [DIM, `인구 1천 명당 (조혼인율 · 조이혼율) · 이 표에는 ${Y[st.cmFirst]}년부터`]];
    return [
      [GOLD, "혼인 ↑  100건마다 기둥 하나 · 모두 같은 높이"],
      [ROSE, `이혼 ↓  ${Y[st.dvPeak]}년 ${d.r[st.dvPeak].toFixed(1)} → ${Y[st.e0]}년 ${d.r[st.e0].toFixed(1)} → ${Y[st.e1]}년 ${d.r[st.e1].toFixed(1)} → ${Y[L]}년 ${d.r[L].toFixed(1)}건`],
      [DIM, `${Y[st.e0]}→${Y[st.e1]}년 이혼 건수는 ${pct(d.dv[st.e1], d.dv[st.e0])}인데 비율은 올랐다 · 분모인 혼인이 ${pct(d.m[st.e1], d.m[st.e0])}`]];
  }

  function header(ctx, w, d, st, mode, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `500 11px ${MONO}`;
    ctx.fillText(`수면 위와 아래 · 전국 ${d.years[0]}–${d.years[st.last]}`, 62, 26);
    headerLines(d, st, mode).forEach(([c, t], k) => {
      ctx.fillStyle = c;
      if (k < 2) fitFont(ctx, t, w - 84, 15, 600, SANS); else fitFont(ctx, t, w - 84, 12, 500, SANS);
      ctx.fillText(t, 62, 52 + k * 23);
    });
    ctx.restore();
  }

  function phoneHeader(ctx, w, d, st, mode, a, hover) {
    if (a <= 0) return;
    const Y = d.years, L = st.last, f = KF.fmt, x = 14, mw = w - 28;
    let A, B, C;
    if (mode === "n") {
      A = `이혼 · ${Y[st.dvPeak]}년 정점 → ${Y[L]}년`; B = `${man(d.dv[st.dvPeak])} → ${man(d.dv[L])}건`;
      C = `혼인 · ${Y[st.mLow]}년 ${man(d.m[st.mLow])} → ${Y[L]}년 ${man(d.m[L])}건`;
    } else if (mode === "per") {
      A = `인구 1천 명당 이혼 · ${Y[st.cdPeak]}년 → ${Y[L]}년`; B = `${d.cd[st.cdPeak].toFixed(1)} → ${d.cd[L].toFixed(1)}건`;
      C = `혼인 · ${Y[st.cmLow]}년 ${d.cm[st.cmLow].toFixed(1)} → ${Y[L]}년 ${d.cm[L].toFixed(1)}건`;
    } else {
      A = `혼인 100건당 이혼 · ${Y[st.e0]}년 → ${Y[st.e1]}년`; B = `${d.r[st.e0].toFixed(1)} → ${d.r[st.e1].toFixed(1)}건`;
      C = `그사이 이혼 건수는 ${pct(d.dv[st.e1], d.dv[st.e0])}, 혼인은 ${pct(d.m[st.e1], d.m[st.e0])}`;
    }
    if (hover != null) C = `${Y[hover]} · 혼인 ${f(d.m[hover])} · 이혼 ${f(d.dv[hover])}건`;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `500 10.5px ${MONO}`; ctx.fillText(`수면 위와 아래 · ${Y[0]}–${Y[L]}`, x, 24);
    ctx.fillStyle = ROSE; fitFont(ctx, A, mw, 13, 600, SANS); ctx.fillText(A, x, 50);
    const bs = fitFont(ctx, B, mw, 30, 700, SANS); ctx.fillText(B, x, 50 + bs + 6);
    ctx.fillStyle = hover != null ? TXT : GOLD; fitFont(ctx, C, mw, 12.5, 500, SANS); ctx.fillText(C, x, 50 + bs + 32);
    ctx.restore();
  }

  function tooltip(ctx, w, h, d, i, px, py) {
    const f = KF.fmt, rows = [
      ["혼인", `${f(d.m[i])}건`, GOLD], ["이혼", `${f(d.dv[i])}건`, ROSE],
      ["인구 1천 명당", d.cm[i] == null ? "자료 없음" : `${d.cm[i].toFixed(1)} · ${d.cd[i].toFixed(1)}`, TXT],
      ["혼인 100건당 이혼", d.r[i].toFixed(1), TXT]];
    const bw = 214, bh = 30 + rows.length * 18;
    const bx = px + 16 + bw > w - 8 ? px - bw - 16 : px + 16, by = KF.clamp(py - bh / 2, 8, h - bh - 8);
    ctx.fillStyle = "rgba(12,24,31,.93)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(246,209,150,.45)"; ctx.lineWidth = 1; ctx.strokeRect(bx + .5, by + .5, bw, bh);
    ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `600 12px ${MONO}`; ctx.fillText(`${d.years[i]}년`, bx + 10, by + 18);
    rows.forEach(([k, v, c], r) => {
      const y = by + 38 + r * 18;
      ctx.textAlign = "left"; ctx.fillStyle = c; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(k, bx + 10, y);
      ctx.textAlign = "right"; ctx.fillStyle = TXT; ctx.font = `500 11px ${MONO}`; ctx.fillText(v, bx + bw - 10, y);
    });
  }

  function yearAxis(ctx, w, h, d, L, full) {
    ctx.font = `500 10px ${MONO}`; ctx.fillStyle = "rgba(239,231,217,.42)"; ctx.textAlign = "center";
    const list = full ? d.years.filter((y) => y % 5 === 0 || y === d.years[0]) : [d.years[0], d.years[d.years.length - 1]];
    for (const y of list) {
      const i = d.years.indexOf(y), x = L.X(i) + L.bw / 2;
      ctx.textAlign = full ? "center" : i === 0 ? "left" : "right";
      ctx.fillText(String(y), full ? x : i === 0 ? L.X(i) : L.X(i) + L.bw, h - 9);
    }
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const S = targets(d, "n"), st = stats(d), c = t % 10;
    const rise = (i) => (c < 8.6 ? KF.ease(KF.clamp((c - 0.2 - i * 0.045) / 0.9, 0, 1)) : 1 - KF.ease((c - 8.6) / 1.2));
    const pad = { l: 10, r: 10, t: h * 0.3, b: h * 0.05 };
    lake(ctx, w, h, d, S, { pad, full: false, rise, t, hover: null });
    const a = KF.clamp((c - 2.0) / 0.8, 0, 1) * (c > 8.6 ? 1 - (c - 8.6) / 1.2 : 1);
    if (a > 0) { // the answer, in the sky band above the columns
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "right";
      const big = Math.round(h * 0.16), base = h * 0.23, pc = pct(d.dv[st.last], d.dv[st.dvPeak]);
      ctx.font = `700 ${big}px ${SANS}`; ctx.fillStyle = ROSE; ctx.fillText(pc, w - 12, base);
      const bwid = ctx.measureText(pc).width;
      ctx.font = `600 ${Math.max(9, Math.round(h * 0.06))}px ${SANS}`; ctx.fillStyle = TXT;
      ctx.fillText(`이혼 ${d.years[st.dvPeak]} → ${d.years[st.last]}`, w - 22 - bwid, base);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage), st = stats(d), n = d.years.length;
    let mode = "n", t0 = performance.now(), tMode = -10, hover = null, pointer = null, last = performance.now();
    let tgt = targets(d, mode), colA = 1;
    const cur = { u: tgt.u.slice(), dn: tgt.dn.slice(), hf: tgt.hf, tot: tgt.tot };
    KF.segment(controls, [{ id: "n", label: "건수" }, { id: "per", label: "인구 1천 명당" }, { id: "ratio", label: "혼인 100건당 이혼" }],
      mode, (id) => { mode = id; tgt = targets(d, mode); tMode = (performance.now() - t0) / 1000; });
    const replay = document.createElement("button");
    replay.type = "button"; replay.textContent = "다시 보기"; replay.onclick = () => { t0 = performance.now(); tMode = -10; };
    controls.appendChild(replay);
    const note = document.createElement("span"); note.className = "readout";
    note.textContent = "막대에 마우스를 올리면 그해 값"; controls.appendChild(note);

    let geo = null;
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect(); pointer = [e.clientX - r.left, e.clientY - r.top];
      if (!geo) return;
      const i = Math.floor((pointer[0] - geo.pad.l) / geo.slot);
      hover = i >= 0 && i < n ? i : null;
    });
    stage.addEventListener("pointerleave", () => { hover = null; pointer = null; });

    KF.loop(stage, (tt) => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now();
      const el = (now - t0) / 1000, dt = Math.min(0.1, (now - last) / 1000); last = now;
      const k = 1 - Math.exp(-dt * 5.5);
      for (let i = 0; i < n; i++) { cur.u[i] += (tgt.u[i] - cur.u[i]) * k; cur.dn[i] += (tgt.dn[i] - cur.dn[i]) * k; }
      cur.hf += (tgt.hf - cur.hf) * k; cur.tot = tgt.tot;
      colA += ((mode === "ratio" ? 0.5 : 1) - colA) * k;
      const rise = (i) => KF.ease(KF.clamp((el - 0.3 - i * 0.055) / 1.1, 0, 1));
      const pad = full ? { l: 62, r: 22, t: 116, b: 30 } : { l: 12, r: 12, t: Math.round(h * 0.34), b: 26 };
      const tickA = KF.clamp((el - tMode - 0.3) / 0.6, 0, 1) * KF.clamp((el - 3) / 0.8, 0, 1);
      const hv = el > 3.9 ? hover : null;
      const L = lake(ctx, w, h, d, cur, { pad, full, rise, t: tt, hover: hv, ticks: full ? TICKS[mode] : null, tickA, colA });
      geo = { pad, slot: L.slot };
      const a = KF.clamp((el - 3.5) / 0.8, 0, 1);
      const settled = KF.clamp((el - tMode - 0.9) / 0.5, 0, 1);
      if (mode === "per" && a > 0) { // explain the empty years
        const i1 = d.cm.findIndex((v) => v != null) - 1;
        if (i1 > 0) {
          const x0 = L.X(0), x1 = L.X(i1) + L.bw, msg = full ? `${d.years[0]}–${d.years[i1]}년은 이 표에 인구 1천 명당 값이 없다` : `${d.years[i1]}년까지 자료 없음`;
          ctx.save(); ctx.globalAlpha = a * settled; ctx.textAlign = "center"; ctx.fillStyle = DIM;
          fitFont(ctx, msg, x1 - x0, full ? 12 : 10, 500, SANS); ctx.fillText(msg, (x0 + x1) / 2, L.H - 12); ctx.restore();
        }
      }
      markers(ctx, d, cur, L, st, mode, a * settled, full);
      yearAxis(ctx, w, h, d, L, full);
      if (full) {
        header(ctx, w, d, st, mode, a);
        if (hv != null && pointer) tooltip(ctx, w, h, d, hv, pointer[0], pointer[1]);
      } else {
        phoneHeader(ctx, w, d, st, mode, a, hv);
      }
    });
  }

  VIZ.marriage = { thumb, mount, bg: BG };
})();
