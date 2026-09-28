// 12 tb — "X-ray lightbox". Each year is a chest film on a lightbox: every rib is an age band and glows brighter
// with more notified TB patients. Scrubbing the years moves the bright bone from the young ribs to the oldest.
(() => {
  const BG = "#05080c";
  const BONE = [232, 241, 248], PEN = "#ff5a3c";
  const bone = (a) => `rgba(${BONE[0]},${BONE[1]},${BONE[2]},${a})`;
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif", HAND = "'Nanum Pen Script', cursive";
  const clamp = KF.clamp, lerp = KF.lerp;
  const grainCache = new WeakMap();

  function grain(ctx) {
    if (grainCache.has(ctx)) return grainCache.get(ctx);
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"), img = g.createImageData(128, 128);
    for (let i = 0; i < 128 * 128; i++) {
      const x = Math.sin(i * 12.9898) * 43758.5453, v = (x - Math.floor(x)) * 255;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const p = ctx.createPattern(c, "repeat");
    grainCache.set(ctx, p);
    return p;
  }
  function txt(ctx, s, x, y, font, color, align = "left") { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); }

  // values for a year (fractional years interpolate), current type/metric
  function series(d, st) { return st.type === "pul" ? d.pul : st.type === "ext" ? d.ext : d.all; }
  function popAt(d, yi) { const k = d.pop.years.indexOf(d.years[yi]); return k < 0 ? null : d.pop.data[k]; }
  function valuesAt(d, st, yf) {
    const S = series(d, st), i0 = Math.floor(clamp(yf, 0, d.years.length - 1)), i1 = Math.min(i0 + 1, d.years.length - 1), k = yf - i0;
    if (st.metric === "count") return S[i0].map((v, j) => lerp(v, S[i1][j], k));
    const p0 = popAt(d, i0), p1 = popAt(d, i1);
    if (!p0) return null;
    const r0 = S[i0].map((v, j) => (v / p0[j]) * 1e5);
    if (!p1 || k === 0) return r0;
    return r0.map((v, j) => lerp(v, (S[i1][j] / p1[j]) * 1e5, k));
  }
  function vmaxOf(d, st) {
    let m = 0;
    d.years.forEach((y, yi) => { const v = valuesAt(d, st, yi); if (v) m = Math.max(m, ...v); });
    return m;
  }
  const bright = (v, vmax) => Math.pow(clamp(v / vmax, 0, 1), 0.8);

  // ---------------------------------------------------------------- the lightbox panel behind a film
  function lightbox(ctx, x, y, w, h, on) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(226,236,246,${0.85 * on})`); g.addColorStop(1, `rgba(200,216,232,${0.8 * on})`);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.save(); ctx.shadowColor = `rgba(190,215,240,${0.55 * on})`; ctx.shadowBlur = 26;
    ctx.strokeStyle = `rgba(210,228,245,${0.4 * on})`; ctx.strokeRect(x, y, w, h); ctx.restore();
  }

  // ---------------------------------------------------------------- one chest film
  // F: film rect, vals: 17 values or null, vmax, dev: 0..1 developing, opts: {labels, marker, year, hoverBand}
  function film(ctx, F, d, vals, vmax, dev, o) {
    const n = d.ages.length, cx = F.x + F.w / 2;
    // film base
    const g = ctx.createRadialGradient(cx, F.y + F.h * 0.45, F.w * 0.05, cx, F.y + F.h * 0.5, Math.max(F.w, F.h) * 0.7);
    g.addColorStop(0, "#1b2733"); g.addColorStop(1, "#070b10");
    ctx.fillStyle = g; ctx.fillRect(F.x, F.y, F.w, F.h);
    ctx.save(); ctx.globalAlpha = 0.05; ctx.fillStyle = grain(ctx); ctx.fillRect(F.x, F.y, F.w, F.h); ctx.restore();
    const top = F.y + F.h * (o.small ? 0.1 : 0.09), bot = F.y + F.h * (o.small ? 0.92 : 0.93), gap = (bot - top) / n;
    const sw = o.small ? Math.max(2, F.w * 0.08) : clamp(F.w * 0.075, 34, 46);
    // lung fields (darker), shoulders
    if (!o.small) {
      for (const s of [-1, 1]) {
        const lx = cx + s * F.w * 0.23, ly = F.y + F.h * 0.52;
        const lg = ctx.createRadialGradient(lx, ly, 4, lx, ly, F.h * 0.42);
        lg.addColorStop(0, "rgba(0,0,0,.34)"); lg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(lx, ly, F.w * 0.2, F.h * 0.42, 0, 0, 7); ctx.fill();
      }
    }
    // spine
    for (let i = 0; i < n; i++) {
      const y = top + i * gap;
      ctx.fillStyle = o.small ? "rgba(200,215,230,.18)" : `rgba(205,220,234,${0.2 + 0.25 * dev})`;
      if (o.small) ctx.fillRect(cx - sw / 2, y + gap * 0.12, sw, gap * 0.76);
      else { ctx.beginPath(); ctx.roundRect(cx - sw / 2, y + gap * 0.1, sw, gap * 0.8, 4); ctx.fill(); }
    }
    // ribs: one per age band, brightness = value
    const Lmax = F.w / 2 - sw / 2 - (o.small ? 2 : o.labels ? 64 : 14);
    const ribs = [];
    for (let i = 0; i < n; i++) {
      const y = top + (i + 0.5) * gap, L = Lmax * (0.7 + 0.3 * Math.sin((Math.PI * (i + 1.2)) / (n + 1.4)));
      const b = vals ? bright(vals[i], vmax) * dev : 0;
      const hov = o.hoverBand === i;
      for (const s of [-1, 1]) {
        const x0 = cx + (s * sw) / 2;
        ctx.beginPath();
        if (o.small) { ctx.moveTo(x0, y); ctx.lineTo(x0 + s * L, y + gap * 0.3); }
        else { ctx.moveTo(x0, y); ctx.bezierCurveTo(x0 + s * L * 0.35, y - gap * 0.9, x0 + s * L * 0.85, y - gap * 0.35, x0 + s * L, y + gap * 1.15); }
        ctx.lineCap = "round";
        if (!o.small) { ctx.strokeStyle = bone(0.2 * b); ctx.lineWidth = gap * 1.05; ctx.stroke(); }
        ctx.strokeStyle = bone(0.05 + 0.92 * b); ctx.lineWidth = o.small ? Math.max(1, gap * 0.55) : gap * 0.46; ctx.stroke();
        if (hov) { ctx.strokeStyle = "rgba(255,90,60,.9)"; ctx.lineWidth = 1.2; ctx.stroke(); }
      }
      ribs.push({ i, y, L, tipX: cx + sw / 2 + L, tipY: y + gap * 1.15 });
    }
    if (o.small) return { ribs, gap, top, sw, cx };
    // vertebra labels (the age axis)
    ctx.textAlign = "center";
    for (let i = 0; i < n; i++) {
      ctx.font = `600 ${gap > 22 ? 10 : 9}px ${MONO}`; ctx.fillStyle = "rgba(6,10,14,.85)";
      ctx.fillText(d.ages[i], cx, top + (i + 0.5) * gap + 3.5);
    }
    // film markers
    ctx.fillStyle = bone(0.85); ctx.fillRect(F.x + 12, F.y + 12, 18, 18);
    txt(ctx, "R", F.x + 21, F.y + 26, `700 13px ${MONO}`, "#0b1118", "center");
    txt(ctx, o.marker, F.x + F.w - 12, F.y + 24, `500 10.5px ${MONO}`, bone(0.75), "right");
    // values at the right rib tips
    if (o.labels && vals && dev > 0.3) {
      ctx.globalAlpha = clamp((dev - 0.3) / 0.5, 0, 1);
      for (const r of ribs) {
        const v = vals[r.i], b = bright(v, vmax);
        txt(ctx, o.fmt(v), r.tipX + 8, r.tipY + 3, `500 10px ${MONO}`, bone(0.35 + 0.6 * b));
      }
      ctx.globalAlpha = 1;
    }
    return { ribs, gap, top, sw, cx };
  }

  // grease-pencil circle around a rib + note
  function mark(ctx, F, geo, i, text, k, full) {
    if (k <= 0) return;
    const r = geo.ribs[i], x = geo.cx + (r.tipX - geo.cx) * 0.55, y = r.y - geo.gap * 0.2;
    const rx = (r.tipX - geo.cx) * 0.62, ry = geo.gap * 1.25;
    ctx.save(); ctx.strokeStyle = PEN; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, -0.04, -0.3, -0.3 + Math.PI * 2.08 * k); ctx.stroke();
    if (k >= 1) {
      ctx.font = `${full ? 24 : 19}px ${HAND}`; ctx.fillStyle = PEN; ctx.textAlign = "left";
      const ty = y - ry - 8 < F.y + 34 ? y + ry + 22 : y - ry - 8;
      const tx = Math.max(F.x + 40, x - rx * 0.4);
      ctx.strokeStyle = "rgba(6,10,14,.85)"; ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.strokeText(text, tx, ty);
      ctx.fillText(text, tx, ty);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- contact strip of all years
  function strip(ctx, R, d, st, vmax, yf, rows, hits) {
    const n = d.years.length, per = Math.ceil(n / rows), gx = rows > 1 ? 3 : 4;
    const fw = (R.w - gx * (per - 1)) / per, fh = (R.h - (rows > 1 ? 16 : 14) * rows) / rows;
    d.years.forEach((yr, i) => {
      const row = Math.floor(i / per), col = i % per;
      const F = { x: R.x + col * (fw + gx), y: R.y + row * (fh + (rows > 1 ? 16 : 14)), w: fw, h: fh };
      const vals = valuesAt(d, st, i), sel = Math.round(yf) === i;
      film(ctx, F, d, vals, vmax, 1, { small: true });
      if (!vals) { ctx.fillStyle = "rgba(5,8,12,.6)"; ctx.fillRect(F.x, F.y, F.w, F.h); }
      ctx.strokeStyle = sel ? PEN : "rgba(200,215,230,.18)"; ctx.lineWidth = sel ? 1.6 : 1; ctx.strokeRect(F.x + 0.5, F.y + 0.5, F.w - 1, F.h - 1);
      const lab = rows > 1 ? (i % 4 === 0 || i === n - 1 || sel) : (i % 4 === 0 || i === n - 1 || sel);
      if (lab) txt(ctx, rows > 1 && !sel ? `'${String(yr).slice(2)}` : String(yr), F.x + F.w / 2, F.y + F.h + 11, `${sel ? 600 : 500} 9.5px ${MONO}`, sel ? PEN : "rgba(200,215,230,.55)", "center");
      hits.push({ x: F.x, y: F.y, w: F.w, h: F.h + 12, year: i });
    });
  }

  // ---------------------------------------------------------------- report panel (full layout)
  function report(ctx, x0, pw, top, bottom, d, st, yf, vals) {
    const yi = Math.round(yf), yr = d.years[yi], all = d.all[yi], tot = all.reduce((a, b) => a + b, 0);
    const TYPE = { all: "전체", pul: "폐결핵", ext: "폐외결핵" }[st.type];
    txt(ctx, `판독 · 신고 결핵환자 (${TYPE})`, x0, top, `500 12px ${SANS}`, "rgba(210,222,235,.65)");
    txt(ctx, String(yr), x0, top + 48, `500 46px ${MONO}`, bone(0.95));
    const S = series(d, st)[yi], stot = S.reduce((a, b) => a + b, 0), pop = popAt(d, yi);
    if (st.metric === "count") txt(ctx, `신고 ${KF.fmt(stot)}명 · 하루 ${Math.round(stot / 365)}명`, x0, top + 74, `500 13px ${MONO}`, bone(0.85));
    else txt(ctx, pop ? `인구 10만 명당 ${(stot / pop.reduce((a, b) => a + b, 0) * 1e5).toFixed(1)}명` : "이 해는 인구 자료 없음", x0, top + 74, `500 13px ${MONO}`, bone(0.85));
    // young vs old
    const grp = (arr, lo, hi) => arr.filter((_, j) => { const a = parseInt(d.ages[j]); return a >= lo && a <= hi; }).reduce((a, b) => a + b, 0);
    const rowsDef = [["20–34세", 20, 34], ["65세 이상", 65, 200]];
    let y = top + 108;
    const vals2 = rowsDef.map(([, lo, hi]) => {
      if (st.metric === "count") return grp(S, lo, hi) / stot;
      return pop ? (grp(S, lo, hi) / grp(pop, lo, hi)) * 1e5 : null;
    });
    const scale = st.metric === "count" ? 1 : Math.max(...vals2.filter((v) => v != null), 1);
    rowsDef.forEach(([lab], k) => {
      const v = vals2[k];
      txt(ctx, lab, x0, y, `600 13px ${SANS}`, k ? "#fff" : "rgba(220,230,240,.8)");
      const vs = v == null ? "–" : st.metric === "count" ? `${(v * 100).toFixed(1)}%` : `${v.toFixed(1)}명`;
      txt(ctx, vs, x0 + pw, y, `600 13px ${MONO}`, k ? "#fff" : "rgba(220,230,240,.8)", "right");
      const L = v == null ? 0 : (pw * v) / scale;
      ctx.lineCap = "round"; ctx.strokeStyle = bone(0.18); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x0 + 4, y + 13); ctx.lineTo(x0 + Math.max(4, L), y + 13); ctx.stroke();
      ctx.strokeStyle = bone(k ? 0.95 : 0.55); ctx.lineWidth = 4; ctx.stroke();
      y += 40;
    });
    if (st.metric === "rate") {
      const [a, b] = vals2;
      txt(ctx, a && b ? `65세 이상 ÷ 20–34세 = ${(b / a).toFixed(1)}배` : "10만 명당 값은 2017–2023년만", x0, y + 2, `600 13px ${SANS}`, PEN);
      txt(ctx, "분모: 건강보험 적용인구 (연말)", x0, y + 20, `500 11px ${SANS}`, "rgba(210,222,235,.55)");
      y += 34;
    } else {
      txt(ctx, "전체 환자 가운데 몫", x0, y + 2, `500 11px ${SANS}`, "rgba(210,222,235,.55)");
      y += 14;
    }
    // the crossing: share of 20–34 vs 65+ among all patients, 2001–2025
    const ch = { x: x0, y: y + 14, w: pw, h: Math.max(60, bottom - y - 30) };
    if (ch.h < 60 || bottom - y < 90) return;
    const n = d.years.length, X = (i) => ch.x + (i / (n - 1)) * ch.w, Y = (v) => ch.y + ch.h - v * ch.h / 0.7;
    const sh = d.all.map((a) => { const t = a.reduce((p, q) => p + q, 0); return [grp(a, 20, 34) / t, grp(a, 65, 200) / t]; });
    ctx.strokeStyle = "rgba(210,222,235,.12)"; ctx.lineWidth = 1;
    for (const v of [0, 0.2, 0.4, 0.6]) { ctx.beginPath(); ctx.moveTo(ch.x, Y(v)); ctx.lineTo(ch.x + ch.w, Y(v)); ctx.stroke(); txt(ctx, `${v * 100}%`, ch.x, Y(v) - 3, `500 9px ${MONO}`, "rgba(210,222,235,.4)"); }
    for (const [k, a] of [[0, 0.55], [1, 0.95]]) {
      ctx.strokeStyle = bone(a); ctx.lineWidth = k ? 2.2 : 1.6; ctx.beginPath();
      sh.forEach((s, i) => (i ? ctx.lineTo(X(i), Y(s[k])) : ctx.moveTo(X(i), Y(s[k])))); ctx.stroke();
    }
    const cross = sh.findIndex((s) => s[1] > s[0]);
    if (cross > 0) {
      ctx.strokeStyle = PEN; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(X(cross - 0.5), Y(sh[cross][1]), 12, 9, 0, 0, 7); ctx.stroke();
      ctx.font = `20px ${HAND}`; ctx.fillStyle = PEN; ctx.textAlign = "left"; ctx.fillText(`${d.years[cross]}년 역전`, X(cross - 0.5) + 14, Y(sh[cross][1]) + 22);
    }
    txt(ctx, "65세 이상", X(n - 1) - 2, Y(sh[n - 1][1]) - 7, `600 10.5px ${SANS}`, "#fff", "right");
    txt(ctx, "20–34세", X(n - 1) - 2, Y(sh[n - 1][0]) - 7, `500 10.5px ${SANS}`, "rgba(220,230,240,.7)", "right");
    ctx.strokeStyle = PEN; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(yf), ch.y); ctx.lineTo(X(yf), ch.y + ch.h); ctx.stroke();
    txt(ctx, String(d.years[0]), ch.x, ch.y + ch.h + 13, `500 9.5px ${MONO}`, "rgba(210,222,235,.45)");
    txt(ctx, String(d.years[n - 1]), ch.x + ch.w, ch.y + ch.h + 13, `500 9.5px ${MONO}`, "rgba(210,222,235,.45)", "right");
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `600 12px ${SANS}`; let tw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${MONO}`; for (const l of lines.slice(1)) tw = Math.max(tw, ctx.measureText(l).width);
    const bw = tw + 22, bh = 14 + lines.length * 17;
    let bx = x + 14; if (bx + bw > w - 6) bx = x - bw - 14; bx = clamp(bx, 6, w - bw - 6);
    const by = clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(6,10,14,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = PEN; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    lines.forEach((l, i) => txt(ctx, l, bx + 11, by + 20 + i * 17, i ? `500 11px ${MONO}` : `600 12px ${SANS}`, i ? "rgba(220,230,240,.8)" : "#fff"));
  }

  const fmtCount = (v) => KF.fmt(Math.round(v)), fmtRate = (v) => v.toFixed(v >= 100 ? 0 : 1);

  function thumb(ctx, w, h, t, d) {
    const c = t % 9, st = { type: "all", metric: "count" };
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const vmax = vmaxOf(d, st), on = c < 0.5 ? (Math.sin(c * 60) > 0 ? 0.6 : 0.2) : 1;
    const fw = (w - 44) / 2, fh = h - 50;
    [0, d.years.length - 1].forEach((yi, k) => {
      const F = { x: 16 + k * (fw + 12), y: 14, w: fw, h: fh };
      lightbox(ctx, F.x - 4, F.y - 4, F.w + 8, F.h + 8, on);
      const dev = clamp((c - 0.6 - k * 0.5) / 1.4, 0, 1);
      film(ctx, F, d, d.all[yi], vmax, dev, { small: false, labels: false, marker: "", fmt: fmtCount });
      if (c > 2.4) {
        ctx.globalAlpha = clamp((c - 2.4) / 0.6, 0, 1);
        const a = d.all[yi], tot = a.reduce((p, q) => p + q, 0), old = a.slice(13).reduce((p, q) => p + q, 0);
        txt(ctx, `${d.years[yi]} · ${(tot / 10000).toFixed(1)}만 명`, Math.max(F.x, 46), h - 12, `600 10.5px ${MONO}`, "rgba(225,235,245,.9)");
        ctx.font = `18px ${HAND}`; ctx.fillStyle = PEN; ctx.textAlign = "right";
        ctx.fillText(`65세+ ${Math.round((old / tot) * 100)}%`, F.x + F.w, h - 10);
        ctx.globalAlpha = 1;
      }
    });
    if (c > 8.3) { ctx.fillStyle = `rgba(5,8,12,${(c - 8.3) / 0.7})`; ctx.fillRect(0, 0, w, h); }
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const st = { type: "all", metric: "count" };
    const last = d.years.length - 1;
    let yf = 0, target = last, t0 = performance.now(), intro = true, hover = null, hits = [], vmax = vmaxOf(d, st);
    KF.segment(controls, [{ id: "all", label: "전체" }, { id: "pul", label: "폐결핵" }, { id: "ext", label: "폐외결핵" }], "all", (id) => { st.type = id; vmax = vmaxOf(d, st); });
    KF.segment(controls, [{ id: "count", label: "환자 수" }, { id: "rate", label: "10만 명당 (2017–23)" }], "count", (id) => {
      st.metric = id; vmax = vmaxOf(d, st);
      if (id === "rate") { const lo = d.years.indexOf(d.pop.years[0]), hi = d.years.indexOf(d.pop.years[d.pop.years.length - 1]); target = clamp(Math.round(target), lo, hi); setYear(target); }
    });
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = last; range.value = last;
    const lab = document.createElement("label"); lab.append("연도", range);
    const out = document.createElement("span"); out.className = "readout";
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 보기";
    controls.append(lab, out, replay);
    const setYear = (i) => { target = i; range.value = i; out.textContent = `${d.years[i]}년`; intro = false; };
    range.oninput = () => setYear(+range.value);
    replay.onclick = () => { t0 = performance.now(); intro = true; yf = 0; target = last; range.value = last; out.textContent = `${d.years[last]}년`; };
    out.textContent = `${d.years[last]}년`;
    const pos = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = pos(e); });
    stage.addEventListener("pointerleave", () => { hover = null; });
    stage.addEventListener("click", (e) => {
      const [x, y] = pos(e), h = hits.find((q) => q.year != null && x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
      if (h) setYear(h.year);
    });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, el = (performance.now() - t0) / 1000;
      // intro: lightbox flickers on, 2001 film develops, then the years run to the latest
      let dev = 1, on = 1;
      if (intro) {
        on = el < 0.55 ? (Math.sin(el * 70) > 0.2 ? 0.7 : 0.15) : 1;
        dev = clamp((el - 0.6) / 1.2, 0, 1);
        yf = el < 2.2 ? 0 : KF.ease(clamp((el - 2.2) / 3.2, 0, 1)) * last;
        if (el > 5.4) { intro = false; yf = last; }
      } else yf += (target - yf) * 0.14;
      if (Math.abs(target - yf) < 0.004) yf = target;
      const markK = intro ? clamp((el - 5.0) / 0.9, 0, 1) : clamp(Math.abs(target - yf) < 0.05 ? 1 : 0, 0, 1);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      hits = [];
      let F, SR, rows;
      if (full) {
        F = { x: 30, y: 26, w: Math.round(w * 0.58), h: h - 26 - 108 };
        SR = { x: 30, y: h - 76, w: w - 60, h: 64 }; rows = 1;
      } else {
        F = { x: 14, y: 44, w: w - 28, h: h - 44 - 100 };
        SR = { x: 14, y: h - 90, w: w - 28, h: 84 }; rows = 2;
      }
      lightbox(ctx, F.x - 6, F.y - 6, F.w + 12, F.h + 12, on);
      lightbox(ctx, SR.x - 5, SR.y - 5, SR.w + 10, SR.h - (rows > 1 ? 18 : 10), on * 0.8);
      const vals = valuesAt(d, st, yf), yi = Math.round(yf);
      const hb = hover && hover[0] > F.x && hover[0] < F.x + F.w && hover[1] > F.y && hover[1] < F.y + F.h ? "pending" : null;
      const geo = film(ctx, F, d, vals, vmax, dev, { labels: full, marker: `KDCA  ${d.years[yi]}  ${st.metric === "rate" ? "10만 명당" : "신고 환자"}`, fmt: st.metric === "rate" ? fmtRate : fmtCount });
      let band = null;
      if (hb) { band = clamp(Math.floor((hover[1] - geo.top) / geo.gap), 0, d.ages.length - 1); }
      if (!vals) {
        txt(ctx, "이 해는 인구 자료가 없다", F.x + F.w / 2, F.y + F.h / 2 - 6, `600 ${full ? 16 : 13}px ${SANS}`, "rgba(235,242,248,.85)", "center");
        txt(ctx, "10만 명당 값은 2017–2023년만", F.x + F.w / 2, F.y + F.h / 2 + 16, `500 ${full ? 12 : 11}px ${SANS}`, "rgba(235,242,248,.6)", "center");
      } else if (dev >= 1) {
        const top = vals.indexOf(Math.max(...vals));
        mark(ctx, F, geo, top, `가장 많은 나이 ${d.ages[top]}`, markK, full);
      }
      if (band != null && vals) { // highlight the hovered rib
        const r = geo.ribs[band];
        ctx.strokeStyle = "rgba(255,90,60,.55)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(F.x + 8, r.y); ctx.lineTo(F.x + F.w - 8, r.y); ctx.stroke(); ctx.setLineDash([]);
      }
      strip(ctx, SR, d, st, vmax, yf, rows, hits);
      if (full) report(ctx, Math.round(w * 0.58) + 70, w - 30 - (Math.round(w * 0.58) + 70), 44, h - 112, d, st, yf, vals);
      else {
        const a = series(d, st)[yi], tot = a.reduce((p, q) => p + q, 0), old = a.slice(13).reduce((p, q) => p + q, 0);
        txt(ctx, String(d.years[yi]), 14, 28, `600 20px ${MONO}`, bone(0.95));
        const pop = popAt(d, yi);
        const gsum = (arr, lo, hi) => arr.filter((_, j) => { const q = parseInt(d.ages[j]); return q >= lo && q <= hi; }).reduce((p, q) => p + q, 0);
        const left = st.metric === "rate" ? (pop ? `10만 명당 ${(tot / pop.reduce((p, q) => p + q, 0) * 1e5).toFixed(1)}명` : "인구 자료 없음") : `${KF.fmt(tot)}명`;
        txt(ctx, left, 72, 28, `500 13px ${MONO}`, bone(0.8));
        ctx.font = `21px ${HAND}`; ctx.fillStyle = PEN; ctx.textAlign = "right";
        if (st.metric === "rate") { if (pop) ctx.fillText(`노인은 청년의 ${((gsum(a, 65, 200) / gsum(pop, 65, 200)) / (gsum(a, 20, 34) / gsum(pop, 20, 34))).toFixed(1)}배`, w - 14, 30); }
        else ctx.fillText(`65세 이상 ${((old / tot) * 100).toFixed(0)}%`, w - 14, 30);
      }
      // hover tooltips
      if (hover) {
        const hit = hits.find((q) => hover[0] >= q.x && hover[0] <= q.x + q.w && hover[1] >= q.y && hover[1] <= q.y + q.h);
        if (hit) {
          const a = d.all[hit.year], tot = a.reduce((p, q) => p + q, 0), old = a.slice(13).reduce((p, q) => p + q, 0);
          tip(ctx, w, h, hover[0], hover[1], [`${d.years[hit.year]}년 신고 결핵환자`, `${KF.fmt(tot)}명`, `65세 이상 ${((old / tot) * 100).toFixed(1)}%`]);
        } else if (band != null && vals) {
          const S = series(d, st)[yi], stot = S.reduce((p, q) => p + q, 0), pop = popAt(d, yi);
          const lines = [`${d.ages[band] === "80+" ? "80세 이상" : d.ages[band] + "세"} · ${d.years[yi]}`, `${KF.fmt(S[band])}명 (이 해의 ${((S[band] / stot) * 100).toFixed(1)}%)`];
          if (pop) lines.push(`10만 명당 ${((S[band] / pop[band]) * 1e5).toFixed(1)}명`);
          tip(ctx, w, h, hover[0], hover[1], lines);
        }
      }
    });
  }

  VIZ.tb = { thumb, mount, bg: BG };
})();
