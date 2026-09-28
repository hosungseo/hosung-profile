// 11 missing — "Homecoming constellation". A night sky: every star is 10 missing-person reports that leave the
// warm home light and curve back to it; the few people not yet found stay out at the edge as hollow rings.
(() => {
  const BG = "#0b1026";
  const WARM = [255, 182, 92], STAR = [255, 244, 222], COOL = [196, 214, 255];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif";
  const PER = 10, GA = 2.399963229728653, TAU = Math.PI * 2;
  const clamp = KF.clamp, ease = KF.ease;
  const NMAX = 8000;
  // per-star constants (deterministic)
  const hash = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const H1 = new Float32Array(NMAX), H2 = new Float32Array(NMAX), H3 = new Float32Array(NMAX), LA = new Float32Array(NMAX), LQ = new Float32Array(NMAX), CU = new Float32Array(NMAX);
  for (let i = 0; i < NMAX; i++) {
    H1[i] = hash(i, 1); H2[i] = hash(i, 2); H3[i] = hash(i, 3);
    LA[i] = hash(i, 4) * TAU; LQ[i] = 0.3 + 0.52 * Math.sqrt(hash(i, 5)); CU[i] = (hash(i, 6) - 0.5) * 1.3;
  }
  const SKY = Array.from({ length: 220 }, (_, i) => [hash(i, 11), hash(i, 12), hash(i, 13), hash(i, 14)]);

  function background(ctx, w, h, t) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(40,52,110,.28)"); g.addColorStop(1, "rgba(4,6,18,.5)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (const [a, b, c, d] of SKY) {
      const tw = 0.35 + 0.35 * Math.sin(t * (0.6 + d) + c * 9);
      ctx.fillStyle = rgba(COOL, (0.12 + 0.3 * c) * tw);
      const s = c > 0.93 ? 1.6 : 1;
      ctx.fillRect(a * w, b * h, s, s);
    }
  }

  // layout: sky box, home point, ring band ellipse, star spacing
  function layout(w, h, lay, nmax) {
    let sky;
    if (lay === "full") sky = { x: 0, y: 0, w: w * 0.64, h };
    else if (lay === "thumb") sky = { x: 0, y: 0, w, h: h - 34 };
    else sky = { x: 0, y: 84, w, h: h - 84 - 30 };
    const cx = sky.x + sky.w / 2, cy = sky.y + sky.h / 2;
    const ex = sky.w / 2 - (lay === "thumb" ? 12 : 22), ey = sky.h / 2 - (lay === "thumb" ? 10 : 18);
    const R = Math.min(ex, ey) * (lay === "thumb" ? 0.6 : 0.56);
    return { sky, cx, cy, ex, ey, R, band: 0.72, sp: R / Math.sqrt(nmax), dot: lay === "full" ? 1.5 : lay === "thumb" ? 1.3 : 1.1, ring: lay === "full" ? 2.7 : 2 };
  }

  // position of star i at time tau (s) of the choreography; returns [x, y, phase] phase: 0 out, 1 away, 2 back, 3 home
  function starAt(i, tau, L, rot, P) {
    const dep = P.dep0 + H1[i] * P.depSpread, outD = P.outD * (0.8 + 0.4 * H2[i]);
    const ret = P.ret0 + H3[i] * P.retSpread, retD = P.retD;
    const sa = i * GA + rot, sr = L.sp * Math.sqrt(i + 0.5);
    const sx = L.cx + sr * Math.cos(sa), sy = L.cy + sr * Math.sin(sa);
    if (tau >= ret + retD) return [sx, sy, 3];
    const lx = L.cx + L.ex * LQ[i] * Math.cos(LA[i]), ly = L.cy + L.ey * LQ[i] * Math.sin(LA[i]);
    if (tau < dep) return [L.cx, L.cy, -1];
    const quad = (ax, ay, bx, by, k, cu) => {
      const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay;
      const qx = mx - dy * cu, qy = my + dx * cu, u = 1 - k;
      return [u * u * ax + 2 * u * k * qx + k * k * bx, u * u * ay + 2 * u * k * qy + k * k * by];
    };
    if (tau < dep + outD) { const [x, y] = quad(L.cx, L.cy, lx, ly, ease((tau - dep) / outD), CU[i]); return [x, y, 0]; }
    if (tau < ret) { const dr = Math.sin(tau * 0.8 + i) * 2; return [lx + dr, ly - dr, 1]; }
    const [x, y] = quad(lx, ly, sx, sy, ease((tau - ret) / retD), -CU[i] * 0.8);
    return [x, y, 2];
  }

  function ringPos(k, L) {
    const a = (0.5 + k * 0.7548776662) % 1, b = (0.5 + k * 0.5698402910) % 1, r0 = L.band;
    const th = a * TAU + (hash(k, 23) - 0.5) * 0.05, rho = Math.min(1, Math.sqrt(r0 * r0 + (1 - r0 * r0) * b) + (hash(k, 24) - 0.5) * 0.035);
    return [L.cx + L.ex * rho * Math.cos(th), L.cy + L.ey * rho * Math.sin(th)];
  }

  function home(ctx, L, glow, lay) {
    const r = (lay === "full" ? 34 : 24) + (lay === "full" ? 60 : 38) * glow;
    const g = ctx.createRadialGradient(L.cx, L.cy, 0, L.cx, L.cy, r);
    g.addColorStop(0, rgba(WARM, 0.5 + 0.35 * glow)); g.addColorStop(0.35, rgba(WARM, 0.16 + 0.2 * glow)); g.addColorStop(1, rgba(WARM, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.cx, L.cy, r, 0, TAU); ctx.fill();
    const s = lay === "full" ? 9 : 7; // a small house
    ctx.fillStyle = "rgba(20,22,40,.95)"; ctx.strokeStyle = rgba(WARM, 0.95); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(L.cx - s, L.cy - s * 0.1); ctx.lineTo(L.cx, L.cy - s); ctx.lineTo(L.cx + s, L.cy - s * 0.1);
    ctx.lineTo(L.cx + s * 0.78, L.cy - s * 0.1); ctx.lineTo(L.cx + s * 0.78, L.cy + s * 0.8); ctx.lineTo(L.cx - s * 0.78, L.cy + s * 0.8); ctx.lineTo(L.cx - s * 0.78, L.cy - s * 0.1); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgba(WARM, 1); ctx.fillRect(L.cx - s * 0.28, L.cy + s * 0.12, s * 0.56, s * 0.5);
  }

  // draw the sky for one group-year: n stars (reports / 10), u rings (unresolved people)
  function sky(ctx, L, n, u, tau, t, P, lay, hover) {
    const rot = t * 0.015;
    let back = 0, hit = null;
    const nn = Math.min(NMAX, Math.ceil(n));
    ctx.lineCap = "round";
    for (let i = 0; i < nn; i++) {
      const a = i < Math.floor(n) ? 1 : n - Math.floor(n);
      const [x, y, ph] = starAt(i, tau, L, rot, P);
      if (ph < 0) continue;
      if (ph === 3) back++;
      const tw = ph === 3 ? 0.6 + 0.4 * Math.sin(t * (0.7 + H2[i]) + H1[i] * 20) : 1;
      if (ph === 0 || ph === 2) { // short trail
        const [px, py] = starAt(i, tau - 0.07, L, rot, P);
        ctx.strokeStyle = rgba(ph === 2 ? WARM : COOL, 0.28 * a); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      }
      ctx.fillStyle = rgba(ph === 3 ? STAR : ph === 2 ? WARM : COOL, (ph === 1 ? 0.75 : 0.9) * tw * a);
      ctx.fillRect(x - L.dot / 2, y - L.dot / 2, L.dot, L.dot);
    }
    // rings: people not found by the data date — they leave with the others and never come back
    const rs = L.ring;
    ctx.lineWidth = lay === "full" ? 1.2 : 1;
    const uu = Math.ceil(u);
    for (let k = 0; k < uu; k++) {
      const a = k < Math.floor(u) ? 1 : u - Math.floor(u);
      const dep = P.dep0 + hash(k, 21) * P.depSpread, outD = P.outD * 1.3;
      const [ex, ey] = ringPos(k, L);
      if (tau < dep) continue;
      const kk = ease(clamp((tau - dep) / outD, 0, 1));
      const cu = (hash(k, 22) - 0.5) * 1.1, mx = (L.cx + ex) / 2 - (ey - L.cy) * cu, my = (L.cy + ey) / 2 + (ex - L.cx) * cu, v = 1 - kk;
      const x = v * v * L.cx + 2 * v * kk * mx + kk * kk * ex, y = v * v * L.cy + 2 * v * kk * my + kk * kk * ey;
      const pulse = 0.65 + 0.35 * Math.sin(t * 1.1 + k * 1.7);
      ctx.strokeStyle = `rgba(226,234,255,${(kk < 1 ? 0.8 : 0.55 + 0.4 * pulse) * a})`;
      ctx.beginPath(); ctx.arc(x, y, rs, 0, TAU); ctx.stroke();
      if (hover && kk >= 1 && Math.hypot(hover[0] - x, hover[1] - y) < rs + 3) hit = { ring: k, x, y };
    }
    return { back: nn ? back / nn : 0, hit };
  }

  const pct = (u, r, d = 2) => { const x = 100 - (u / r) * 100; while (d < 4 && u > 0 && x.toFixed(d) === (100).toFixed(d)) d++; return `${x.toFixed(d)}%`; };
  function txt(ctx, s, x, y, font, color, align = "left") { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); }
  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `600 12px ${SANS}`; let tw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${MONO}`; for (const l of lines.slice(1)) tw = Math.max(tw, ctx.measureText(l).width);
    const bw = tw + 22, bh = 14 + lines.length * 17;
    let bx = x + 14; if (bx + bw > w - 6) bx = x - bw - 14; bx = clamp(bx, 6, w - bw - 6);
    let by = clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(10,13,34,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = rgba(WARM, 0.7); ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    lines.forEach((l, i) => txt(ctx, l, bx + 11, by + 20 + i * 17, i ? `500 11px ${MONO}` : `600 12px ${SANS}`, i ? "rgba(214,222,255,.8)" : "#f4f0ff"));
  }

  const INTRO = { dep0: 0.15, depSpread: 0.9, outD: 1.0, ret0: 1.7, retSpread: 2.5, retD: 1.05 }; // all home by ~5.3 s

  function panel(ctx, w, h, d, gi, yi, hov, rows) {
    const x0 = Math.round(w * 0.665), pw = w - 28 - x0, g = d.groups[gi], yr = d.years[yi];
    const r = g.rec[yi], u = g.unres[yi];
    ctx.strokeStyle = "rgba(190,205,255,.12)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 - 20.5, 24); ctx.lineTo(x0 - 20.5, h - 24); ctx.stroke();
    txt(ctx, g.label, x0, 48, `700 20px ${SERIF}`, "#f4ead6");
    txt(ctx, `${yr}년 신고`, x0, 70, `500 12px ${SANS}`, "rgba(214,222,255,.62)");
    txt(ctx, pct(u, r), x0, 122, `500 44px ${MONO}`, rgba(WARM, 1));
    txt(ctx, "그해 신고 가운데 기준일까지 해제", x0, 144, `500 12px ${SANS}`, "rgba(214,222,255,.7)");
    txt(ctx, `접수 ${KF.fmt(r)}건 · 미해제 ${KF.fmt(u)}명`, x0, 170, `500 12px ${MONO}`, "#e9ecff");
    // all four groups for the year (click to switch)
    const top = 206, rh = 30;
    txt(ctx, "대상", x0, top, `500 10.5px ${MONO}`, "rgba(214,222,255,.5)");
    txt(ctx, "접수", x0 + pw * 0.62, top, `500 10.5px ${MONO}`, "rgba(214,222,255,.5)", "right");
    txt(ctx, "미해제", x0 + pw, top, `500 10.5px ${MONO}`, "rgba(214,222,255,.5)", "right");
    d.groups.forEach((q, i) => {
      const y = top + 26 + i * rh, on = i === gi;
      if (on) { ctx.fillStyle = "rgba(255,182,92,.1)"; ctx.fillRect(x0 - 8, y - 18, pw + 16, rh - 4); }
      else if (hov === i) { ctx.fillStyle = "rgba(214,222,255,.06)"; ctx.fillRect(x0 - 8, y - 18, pw + 16, rh - 4); }
      txt(ctx, q.short, x0, y, `${on ? 600 : 500} 13px ${SANS}`, on ? rgba(WARM, 1) : "#e3e7ff");
      txt(ctx, KF.fmt(q.rec[yi]), x0 + pw * 0.62, y, `500 12px ${MONO}`, "#e3e7ff", "right");
      txt(ctx, KF.fmt(q.unres[yi]), x0 + pw, y, `500 12px ${MONO}`, on ? rgba(WARM, 1) : "#e3e7ff", "right");
      rows.push({ x: x0 - 8, y: y - 18, w: pw + 16, h: rh - 4, group: i });
    });
    // five years of reports for this group; the numbers under the bars are the unresolved
    const by = top + 26 + 4 * rh + 18, bh = 46, n = d.years.length, bw = pw / n, max = Math.max(...g.rec);
    txt(ctx, "연도별 접수 (막대) · 미해제 (숫자)", x0, by, `500 10.5px ${SANS}`, "rgba(214,222,255,.55)");
    d.years.forEach((y, i) => {
      const hh = (g.rec[i] / max) * bh, xx = x0 + i * bw + bw * 0.22, ww = bw * 0.56, yy = by + 12 + bh - hh, on = i === yi;
      ctx.fillStyle = on ? rgba(WARM, 0.85) : "rgba(214,222,255,.18)"; ctx.fillRect(xx, yy, ww, hh);
      txt(ctx, String(y), xx + ww / 2, by + bh + 26, `500 10px ${MONO}`, on ? rgba(WARM, 1) : "rgba(214,222,255,.55)", "center");
      txt(ctx, `○ ${KF.fmt(g.unres[i])}`, xx + ww / 2, by + bh + 41, `500 10px ${MONO}`, "rgba(226,234,255,.75)", "center");
      rows.push({ x: x0 + i * bw, y: by, w: bw, h: bh + 46, year: i });
    });
    let ny = by + bh + 66;
    if (g.id === "dementia") {
      const p = d.dementia.per1000;
      txt(ctx, `65세 이상 추정 치매환자 1,000명당 신고`, x0, ny, `500 11px ${SANS}`, "rgba(214,222,255,.7)");
      txt(ctx, `${p[0].toFixed(1)} (${d.years[0]}) → ${p[yi].toFixed(1)} (${yr})`, x0, ny + 18, `500 12px ${MONO}`, rgba(WARM, 1));
    }
    // legend
    ctx.fillStyle = rgba(WARM, 1); ctx.beginPath(); ctx.arc(x0 + 1, h - 51, 3, 0, TAU); ctx.fill();
    txt(ctx, "가운데 불빛 = 집, 해제된 신고가 모인다", x0 + 10, h - 47, `500 11px ${SANS}`, "rgba(214,222,255,.75)");
    ctx.fillStyle = rgba(STAR, 0.95); ctx.fillRect(x0, h - 36, 2, 2);
    txt(ctx, `별 1개 = 신고 ${PER}건`, x0 + 10, h - 32, `500 11px ${SANS}`, "rgba(214,222,255,.75)");
    ctx.strokeStyle = "rgba(226,234,255,.9)"; ctx.beginPath(); ctx.arc(x0 + 1, h - 17, 2.7, 0, TAU); ctx.stroke();
    txt(ctx, "빈 고리 1개 = 아직 못 찾은 1명", x0 + 10, h - 13, `500 11px ${SANS}`, "rgba(214,222,255,.75)");
  }

  function thumb(ctx, w, h, t, d) {
    const c = t % 9, g = d.groups[0], yi = d.years.length - 1;
    background(ctx, w, h, t);
    const L = layout(w, h, "thumb", g.rec[yi] / PER);
    const res = sky(ctx, L, g.rec[yi] / PER, g.unres[yi], c, t, INTRO, "thumb", null);
    home(ctx, L, res.back, "thumb");
    const a = clamp((c - 1.2) / 0.8, 0, 1);
    ctx.globalAlpha = a;
    txt(ctx, pct(g.unres[yi], g.rec[yi], 1), 48, h - 34, `600 22px ${MONO}`, rgba(WARM, 1));
    txt(ctx, `아동 실종 신고 ${KF.fmt(g.rec[yi])}건 중 귀가`, 48, h - 15, `500 11px ${SANS}`, "rgba(226,232,255,.85)");
    txt(ctx, `못 찾은 ${g.unres[yi]}명 ○`, w - 16, h - 15, `500 11px ${SANS}`, "rgba(226,232,255,.85)", "right");
    ctx.globalAlpha = 1;
    if (c > 8.3) { ctx.fillStyle = `rgba(11,16,38,${(c - 8.3) / 0.7})`; ctx.fillRect(0, 0, w, h); }
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let gi = 0, yi = d.years.length - 1, t0 = performance.now(), hover = null, rows = [], hovRow = null;
    const nmax = Math.max(...d.groups.flatMap((g) => g.rec)) / PER;
    let n = d.groups[gi].rec[yi] / PER, u = d.groups[gi].unres[yi];
    const seg = KF.segment(controls, d.groups.map((g, i) => ({ id: i, label: g.short })), 0, (id) => { gi = id; t0 = performance.now(); n = d.groups[gi].rec[yi] / PER; u = d.groups[gi].unres[yi]; });
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = d.years.length - 1; range.value = yi;
    const lab = document.createElement("label"); lab.append("연도", range);
    const out = document.createElement("span"); out.className = "readout";
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 보기";
    replay.onclick = () => { t0 = performance.now(); };
    controls.append(lab, out, replay);
    const setOut = () => { out.textContent = `${d.years[yi]}년`; };
    range.oninput = () => { yi = +range.value; setOut(); };
    setOut();
    const pick = (i) => { gi = i; t0 = performance.now(); n = d.groups[gi].rec[yi] / PER; u = d.groups[gi].unres[yi]; seg.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i))); };
    const pos = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = pos(e); });
    stage.addEventListener("pointerleave", () => { hover = null; });
    stage.addEventListener("click", (e) => {
      const [x, y] = pos(e), r = rows.find((q) => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
      if (r && r.group != null) pick(r.group);
      if (r && r.year != null) { yi = r.year; range.value = yi; setOut(); }
    });
    KF.loop(stage, (t) => {
      const { ctx, w, h } = s, lay = w > 520 ? "full" : "narrow";
      const tau = (performance.now() - t0) / 1000, g = d.groups[gi];
      n += (g.rec[yi] / PER - n) * 0.12; u += (g.unres[yi] - u) * 0.12;
      if (Math.abs(n - g.rec[yi] / PER) < 0.02) n = g.rec[yi] / PER;
      if (Math.abs(u - g.unres[yi]) < 0.02) u = g.unres[yi];
      background(ctx, w, h, t);
      const L = layout(w, h, lay, nmax);
      const res = sky(ctx, L, n, u, tau, t, INTRO, lay, hover);
      home(ctx, L, res.back, lay);
      const prev = rows; rows = [];
      const labA = clamp((tau - 0.6) / 0.8, 0, 1);
      ctx.globalAlpha = labA;
      if (lay === "full") {
        hovRow = null;
        if (hover) { const r = prev.find((q) => q.group != null && hover[0] >= q.x && hover[0] <= q.x + q.w && hover[1] >= q.y && hover[1] <= q.y + q.h); if (r) hovRow = r.group; }
        panel(ctx, w, h, d, gi, yi, hovRow, rows);
      } else {
        txt(ctx, `${g.label} · ${d.years[yi]}`, 14, 26, `700 15px ${SERIF}`, "#f4ead6");
        txt(ctx, pct(g.unres[yi], g.rec[yi]), 14, 64, `500 30px ${MONO}`, rgba(WARM, 1));
        txt(ctx, `접수 ${KF.fmt(g.rec[yi])}건`, w - 14, 46, `500 11.5px ${MONO}`, "#e9ecff", "right");
        txt(ctx, `미해제 ${KF.fmt(g.unres[yi])}명 ○`, w - 14, 64, `500 11.5px ${MONO}`, "#e9ecff", "right");
        txt(ctx, `별 1개 = 신고 ${PER}건 · 빈 고리 1개 = 못 찾은 1명`, w / 2, h - 12, `500 10.5px ${SANS}`, "rgba(214,222,255,.7)", "center");
      }
      ctx.globalAlpha = 1;
      if (hover) {
        const yr = d.years[yi];
        if (res.hit) tip(ctx, w, h, hover[0], hover[1], ["아직 못 찾은 1명", `${yr}년 ${g.short} 신고분 미해제 ${KF.fmt(g.unres[yi])}명 중`]);
        else if (Math.hypot(hover[0] - L.cx, hover[1] - L.cy) < L.sp * Math.sqrt(n) + 10)
          tip(ctx, w, h, hover[0], hover[1], [`${g.label} · ${yr}`, `접수 ${KF.fmt(g.rec[yi])}건`, `해제 ${KF.fmt(g.res[yi])}건 (이월 포함)`, `미해제 ${KF.fmt(g.unres[yi])}명 (${((g.unres[yi] / g.rec[yi]) * 100).toFixed(3)}%)`]);
      }
    });
  }

  VIZ.missing = { thumb, mount, bg: BG };
})();
