// 19 drunk-driving — "술시계". A 24-hour clock on midnight navy. Outer dial: when drunk-driving crashes happened
// (2019, 2-hour slots) glowing amber, the night slots brightest. Inner rings: enforcement split by how many times the
// driver had been caught; every ring starts level with the dashed 2010 line (its 2010 count). Sweep 2010 → 2025:
// first-timer rings fall back to a third of that, the 7+ ring runs on to nearly double.
(() => {
  const BG = "#0b1422";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const TXT = "#f1e6d2", MUTE = "rgba(241,230,210,.56)", DIM = "rgba(241,230,210,.12)";
  const RING = ["#7086a6", "#9b9d95", "#c9ab6c", "#eba24a", "#f8863a", "#ff6630", "#ff3b30"];
  const DOWN = "#8fa6c8";
  const MODE = {
    acc: { rgb: [255, 179, 71], unit: "건", name: "사고" },
    dead: { rgb: [255, 104, 64], unit: "명", name: "사망" },
    enf: { rgb: [128, 178, 255], unit: "건", name: "단속" },
  };
  const TAU = Math.PI * 2, TOP = -Math.PI / 2;
  const ang = (hour) => TOP + (hour / 24) * TAU;

  function geo(w, h, mode) {
    if (mode === "full") { const R = Math.min(h * 0.42, w * 0.25); return { cx: w * 0.29, cy: h * 0.5, R }; }
    if (mode === "phone") { const R = Math.min(w * 0.4, h * 0.33); return { cx: w / 2, cy: R + 30, R }; }
    const R = h * 0.41; return { cx: 34 + R, cy: h * 0.53, R };
  }
  const rings = (G) => { const a = G.R * 0.17, b = G.R * 0.6; return Array.from({ length: 7 }, (_, k) => a + ((b - a) * k) / 6); };

  function wedge(ctx, cx, cy, r0, r1, a0, a1) {
    ctx.beginPath(); ctx.arc(cx, cy, r1, a0, a1); ctx.arc(cx, cy, r0, a1, a0, true); ctx.closePath();
  }

  // outer 24h dial: one glowing wedge per 2-hour slot
  function dial(ctx, G, d, key, grow, full, hot) {
    const vals = d[key], max = Math.max(...vals), [r, g, b] = MODE[key].rgb;
    const r0 = G.R * 0.7, span = G.R - r0;
    for (let i = 0; i < 12; i++) {
      const a0 = ang(d.start[i]) + 0.018, a1 = ang(d.start[i] + 2) - 0.018;
      ctx.fillStyle = "rgba(160,190,230,.05)"; wedge(ctx, G.cx, G.cy, r0, G.R, a0, a1); ctx.fill();
      const k = vals[i] / max, len = span * k * grow;
      for (const [pad, al] of [[7, 0.07], [3, 0.14]]) { // halo
        ctx.fillStyle = `rgba(${r},${g},${b},${al * (0.4 + k)})`;
        wedge(ctx, G.cx, G.cy, r0 - pad * 0.3, r0 + len + pad, a0 - pad / G.R, a1 + pad / G.R); ctx.fill();
      }
      const gr = ctx.createRadialGradient(G.cx, G.cy, r0, G.cx, G.cy, r0 + Math.max(1, len));
      gr.addColorStop(0, `rgba(${r},${g},${b},${0.25 + 0.35 * k})`);
      gr.addColorStop(1, `rgba(${Math.min(255, r + 30)},${Math.min(255, g + 40)},${Math.min(255, b + 40)},${0.35 + 0.65 * k})`);
      ctx.fillStyle = gr; wedge(ctx, G.cx, G.cy, r0, r0 + len, a0, a1); ctx.fill();
      if (hot === i) { ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.2; wedge(ctx, G.cx, G.cy, r0, G.R, a0, a1); ctx.stroke(); }
    }
    // hour ticks + labels
    ctx.strokeStyle = "rgba(241,230,210,.35)"; ctx.lineWidth = 1;
    for (let hr = 0; hr < 24; hr++) {
      const a = ang(hr), t = hr % 6 ? 3 : 7;
      ctx.beginPath(); ctx.moveTo(G.cx + Math.cos(a) * (G.R + 2), G.cy + Math.sin(a) * (G.R + 2));
      ctx.lineTo(G.cx + Math.cos(a) * (G.R + 2 + t), G.cy + Math.sin(a) * (G.R + 2 + t)); ctx.stroke();
    }
    if (full !== "thumb") {
      ctx.fillStyle = MUTE; ctx.textAlign = "center";
      for (let hr = 0; hr < 24; hr += full === "full" ? 2 : 6) {
        const a = ang(hr), big = hr % 6 === 0, rr = G.R + (big ? 20 : 17);
        ctx.font = big ? `600 11px ${MONO}` : `500 9.5px ${MONO}`;
        ctx.fillStyle = big ? "rgba(241,230,210,.8)" : MUTE;
        ctx.fillText(big ? `${hr}시` : String(hr), G.cx + Math.cos(a) * rr, G.cy + Math.sin(a) * rr + 4);
      }
    }
  }

  // inner habit rings: angle = count / (2010 count x SCALE); the dashed spoke marks the 2010 level
  const scaleOf = (d) => d._scale || (d._scale = Math.ceil(Math.max(...d.cnt.flatMap((c) => c.map((v, k) => v / d.cnt[0][k]))) * 1.05));
  function habit(ctx, G, d, yr, full, hotRing) {
    const rs = rings(G), lw = (rs[1] - rs[0]) * 0.56, SC = scaleOf(d);
    const i = KF.clamp(yr - d.years[0], 0, d.years.length - 1), i0 = Math.floor(i), f = i - i0;
    const c0 = d.cnt[0], cy = d.cnt[i0], cn = d.cnt[Math.min(d.cnt.length - 1, i0 + 1)];
    ctx.lineCap = "round";
    rs.forEach((r, k) => {
      const v = KF.lerp(cy[k], cn[k], f), frac = v / c0[k] / SC;
      ctx.strokeStyle = DIM; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(G.cx, G.cy, r, 0, TAU); ctx.stroke();
      const col = RING[k], a1 = TOP + TAU * Math.min(1, frac), on = hotRing === null || hotRing === k;
      ctx.strokeStyle = col; ctx.globalAlpha = on ? 0.22 : 0.08; ctx.lineWidth = lw * 2.1;
      ctx.beginPath(); ctx.arc(G.cx, G.cy, r, TOP, a1); ctx.stroke();
      ctx.globalAlpha = on ? 1 : 0.35; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.arc(G.cx, G.cy, r, TOP, a1); ctx.stroke();
      ctx.fillStyle = "#fff4e2"; ctx.beginPath(); ctx.arc(G.cx + Math.cos(a1) * r, G.cy + Math.sin(a1) * r, lw * 0.36, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    });
    ctx.lineCap = "butt";
    // 2010 level: dashed spoke across all rings
    const a10 = TOP + TAU / SC, rA = rs[0] - lw * 0.5, rB = rs[6] + lw * 1.3;
    ctx.strokeStyle = "rgba(241,230,210,.75)"; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(G.cx + Math.cos(a10) * rA, G.cy + Math.sin(a10) * rA); ctx.lineTo(G.cx + Math.cos(a10) * rB, G.cy + Math.sin(a10) * rB); ctx.stroke();
    ctx.setLineDash([]);
    if (full !== "thumb") {
      ctx.fillStyle = TXT; ctx.font = `600 ${full === "full" ? 10.5 : 9.5}px ${MONO}`; ctx.textAlign = "left";
      const rt = rB + 4;
      ctx.fillText(`${d.years[0]}`, G.cx + Math.cos(a10) * rt, G.cy + Math.sin(a10) * rt + 4);
    }
    if (full !== "thumb") { // ring numbers at 12 o'clock, just left of the start
      ctx.textAlign = "right"; ctx.font = `600 ${full === "full" ? 9.5 : 8}px ${MONO}`;
      rs.forEach((r, k) => { ctx.fillStyle = RING[k]; ctx.fillText(k === 6 ? "7+" : String(k + 1), G.cx - 7, G.cy - r + 3.5); });
    }
    return rs;
  }

  function values(d, yr) {
    const i = KF.clamp(Math.round(yr) - d.years[0], 0, d.years.length - 1);
    const c = d.cnt[i], c0 = d.cnt[0], tot = c.reduce((a, b) => a + b, 0), tot0 = c0.reduce((a, b) => a + b, 0);
    return { i, c, c0, tot, tot0, y: d.years[i] };
  }
  const chg = (a, b, dg = 1) => `${b >= a ? "+" : "−"}${Math.abs((b / a - 1) * 100).toFixed(dg)}%`;
  const slotLab = (s) => `${String(s).padStart(2, "0")}–${String(s + 2).padStart(2, "0")}시`;

  function panel(ctx, w, h, d, yr, key, x0) {
    const V = values(d, yr), X1 = w - 26, pw = X1 - x0;
    let age = h >= 470, pitch = (h - 70 - 30 - 104 - (age ? 84 : 0) - 24) / 8.6;
    if (pitch < 19 && age) { age = false; pitch = (h - 70 - 30 - 104 - 24) / 8.6; }
    pitch = KF.clamp(pitch, 15, 27);
    const fs = pitch < 21 ? 11.5 : 13, cN = X1 - Math.min(92, pw * 0.3);
    ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 19px ${SANS}`;
    ctx.fillText("몇 번째 걸렸나", x0, 44);
    ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`;
    ctx.fillText(`안쪽 고리 · 재범 횟수별 단속 · 점선 = ${d.years[0]}년`, x0, 65);
    let y = 70 + pitch;
    ctx.textAlign = "right"; ctx.fillStyle = TXT; ctx.font = `600 ${fs}px ${MONO}`; ctx.fillText(`${V.y}`, cN, y);
    ctx.fillStyle = MUTE; ctx.fillText(`${d.years[0]} 대비`, X1, y);
    d.k.forEach((lab, k) => {
      y += pitch;
      ctx.fillStyle = RING[k]; ctx.fillRect(x0, y - 8, 16, 6);
      ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `500 ${fs}px ${SANS}`; ctx.fillText(lab, x0 + 26, y);
      ctx.textAlign = "right"; ctx.font = `500 ${fs}px ${MONO}`; ctx.fillText(KF.fmt(V.c[k]), cN, y);
      ctx.fillStyle = V.c[k] >= V.c0[k] ? RING[6] : DOWN; ctx.font = `600 ${fs}px ${MONO}`; ctx.fillText(chg(V.c0[k], V.c[k]), X1, y);
    });
    ctx.strokeStyle = "rgba(241,230,210,.18)"; ctx.beginPath(); ctx.moveTo(x0, y + pitch * 0.4); ctx.lineTo(X1, y + pitch * 0.4); ctx.stroke();
    y += pitch;
    ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 ${fs}px ${SANS}`; ctx.fillText("합계", x0 + 26, y);
    ctx.textAlign = "right"; ctx.font = `600 ${fs}px ${MONO}`; ctx.fillText(KF.fmt(V.tot), cN, y);
    ctx.fillStyle = DOWN; ctx.fillText(chg(V.tot0, V.tot), X1, y);
    const rep = ((V.tot - V.c[0]) / V.tot) * 100, rep0 = ((V.tot0 - V.c0[0]) / V.tot0) * 100;
    y += 24;
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 11px ${MONO}`;
    ctx.fillText(`2회 이상 재범의 비중 ${rep0.toFixed(1)}% → ${rep.toFixed(1)}%`, x0, y);
    if (age) { // who repeats: men by age, latest year only
      y += 30;
      ctx.fillText(`${d.ageYear}년 남성 · 나이별 2회 이상 재범의 비중`, x0, y);
      const A = d.ageMen, bw = pw / A.length, mx = Math.max(...A.map((a) => a.rep)), bh = 34, base = y + 12 + bh;
      A.forEach((a, j) => {
        const x = x0 + j * bw, hh = (a.rep / mx) * bh;
        ctx.fillStyle = a.rep >= 50 ? RING[5] : a.rep >= 30 ? RING[3] : RING[0];
        ctx.fillRect(x + bw * 0.22, base - hh, bw * 0.56, hh);
        ctx.textAlign = "center"; ctx.fillStyle = TXT; ctx.font = `600 10px ${MONO}`; ctx.fillText(`${Math.round(a.rep)}%`, x + bw / 2, base - hh - 4);
        ctx.fillStyle = MUTE; ctx.font = `500 10px ${SANS}`; ctx.fillText(a.a.replace(" 이상", "+"), x + bw / 2, base + 13);
      });
      ctx.textAlign = "left";
    }
    // outer dial summary
    const M = MODE[key], vals = d[key], tot = vals.reduce((a, b) => a + b, 0), pk = vals.indexOf(Math.max(...vals));
    const yb = h - 100;
    ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`;
    ctx.fillText(key === "enf" ? `바깥 고리 · 시간대별 단속 (${d.enfSpan})` : `바깥 고리 · ${d.accYear}년 음주운전 ${M.name}${key === "dead" ? "자" : ""}가 나온 시각`, x0, yb);
    ctx.fillStyle = `rgb(${M.rgb.join(",")})`; ctx.font = `800 38px ${SANS}`;
    const share = d.night[key].toFixed(1) + "%";
    ctx.fillText(share, x0, yb + 44);
    const sw = ctx.measureText(share).width;
    ctx.fillStyle = TXT; ctx.font = `500 14px ${SANS}`;
    ctx.fillText("밤 8시 – 새벽 4시", x0 + sw + 12, yb + 26);
    ctx.fillStyle = MUTE; ctx.font = `500 11px ${MONO}`;
    ctx.fillText(`${KF.fmt(tot)}${M.unit} 중`, x0 + sw + 12, yb + 44);
    ctx.fillText(`가장 많은 때 ${slotLab(d.start[pk])} ${KF.fmt(vals[pk])}${M.unit}`, x0, yb + 68);
  }

  function center(ctx, G, yr, size) {
    ctx.textAlign = "center"; ctx.fillStyle = TXT; ctx.font = `600 ${size}px ${MONO}`;
    ctx.fillText(String(Math.round(yr)), G.cx, G.cy + size * 0.36);
  }

  function hitTest(G, d, hover) {
    if (!hover) return null;
    const dx = hover[0] - G.cx, dy = hover[1] - G.cy, r = Math.hypot(dx, dy);
    let a = Math.atan2(dy, dx) - TOP; a = ((a % TAU) + TAU) % TAU;
    if (r >= G.R * 0.68 && r <= G.R + 10) return { slot: Math.floor((a / TAU) * 12) };
    const rs = rings(G), half = (rs[1] - rs[0]) / 2;
    const k = rs.findIndex((x) => Math.abs(r - x) <= half);
    return k >= 0 ? { ring: k } : null;
  }

  function tip(ctx, w, h, d, yr, hit, hover, key) {
    const lines = [];
    if (hit.slot !== undefined) {
      const i = hit.slot;
      lines.push([`${slotLab(d.start[i])}`, 1], [`${d.accYear} 사고 ${KF.fmt(d.acc[i])}건`, 0],
        [`사망 ${KF.fmt(d.dead[i])}명 · 부상 ${KF.fmt(d.inj[i])}명`, 0], [`단속 ${KF.fmt(d.enf[i])}건 (${d.enfSpan})`, 0]);
    } else {
      const V = values(d, yr), k = hit.ring;
      lines.push([`${d.k[k]} 적발 · ${V.y}`, 1], [`${KF.fmt(V.c[k])}건 (단속의 ${((V.c[k] / V.tot) * 100).toFixed(1)}%)`, 0],
        [`${d.years[0]}년 ${KF.fmt(V.c0[k])}건 → ${chg(V.c0[k], V.c[k])}`, 0], [`점선 = ${d.years[0]}년 건수`, 2]);
    }
    const fontOf = (k) => (k === 1 ? `600 13px ${SANS}` : k === 2 ? `500 10.5px ${SANS}` : `500 11.5px ${MONO}`);
    const bw = Math.min(w - 16, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 14 + lines.length * 19;
    const bx = KF.clamp(hover[0] + 14, 8, w - bw - 8), by = KF.clamp(hover[1] - bh - 10, 8, h - bh - 8);
    ctx.fillStyle = "rgba(9,15,26,.94)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = hit.slot !== undefined ? `rgb(${MODE[key].rgb.join(",")})` : RING[hit.ring]; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? MUTE : TXT; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 22 + j * 19); });
  }

  function frame(ctx, w, h, d, yr, key, grow, mode, hover) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const G = geo(w, h, mode);
    const glow = ctx.createRadialGradient(G.cx, G.cy, G.R * 0.2, G.cx, G.cy, G.R * 1.6); // faint street-light haze
    glow.addColorStop(0, "rgba(255,170,80,.07)"); glow.addColorStop(1, "rgba(255,170,80,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    const hit = mode === "thumb" ? null : hitTest(G, d, hover);
    dial(ctx, G, d, key, grow, mode, hit && hit.slot !== undefined ? hit.slot : null);
    habit(ctx, G, d, yr, mode, hit && hit.ring !== undefined ? hit.ring : null);
    return { G, hit };
  }

  function thumb(ctx, w, h, t, d) {
    const c = t % 10, y0 = d.years[0], y1 = d.years[d.years.length - 1];
    const grow = KF.ease(KF.clamp(c / 0.8, 0, 1));
    const yr = c < 0.6 ? y0 : c < 3.2 ? y0 + KF.ease((c - 0.6) / 2.6) * (y1 - y0) : y1;
    const { G } = frame(ctx, w, h, d, yr, "acc", grow, "thumb", null);
    center(ctx, G, yr, Math.round(G.R * 0.13));
    const V = values(d, yr), X = w - 14;
    ctx.textAlign = "right"; ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`;
    ctx.fillText("7회 이상 걸린 재범", X, h * 0.3);
    ctx.fillStyle = RING[6]; ctx.font = `800 ${Math.round(h * 0.19)}px ${SANS}`;
    ctx.fillText(chg(V.c0[6], V.c[6], 0), X, h * 0.3 + h * 0.19);
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`; ctx.fillText("전체 단속", X, h * 0.68);
    ctx.fillStyle = DOWN; ctx.font = `800 ${Math.round(h * 0.11)}px ${SANS}`;
    ctx.fillText(chg(V.tot0, V.tot, 0), X, h * 0.68 + h * 0.115);
    ctx.fillStyle = MUTE; ctx.font = `500 ${Math.round(h * 0.045)}px ${MONO}`; ctx.fillText(`${y0}→${Math.round(yr)}`, X, h * 0.93);
    if (c > 9.4) { ctx.fillStyle = `rgba(11,20,34,${(c - 9.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const y0 = d.years[0], y1 = d.years[d.years.length - 1];
    let key = "acc", yr = y1, t0 = performance.now(), intro = true, hover = null;
    KF.segment(controls, [{ id: "acc", label: "사고 (2019)" }, { id: "dead", label: "사망자 (2019)" }, { id: "enf", label: "단속 (2020)" }],
      "acc", (id) => { key = id; });
    const range = document.createElement("input");
    range.type = "range"; range.min = y0; range.max = y1; range.step = 1; range.value = y1;
    const lab = document.createElement("label"); lab.append("연도", range);
    const out = document.createElement("span"); out.className = "readout";
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 보기";
    replay.onclick = () => { t0 = performance.now(); intro = true; };
    controls.append(lab, out, replay);
    range.oninput = () => { intro = false; yr = +range.value; };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, mode = w > 520 ? "full" : "phone";
      const el = (performance.now() - t0) / 1000;
      const grow = KF.ease(KF.clamp(el / 0.9, 0, 1));
      if (intro) {
        yr = y0 + KF.ease(KF.clamp((el - 0.5) / 3.8, 0, 1)) * (y1 - y0);
        if (el > 4.4) intro = false;
        range.value = Math.round(yr);
      }
      out.textContent = `${Math.round(yr)}년 · 점선 = ${y0}년 수준`;
      const { G, hit } = frame(ctx, w, h, d, yr, key, grow, mode, hover);
      center(ctx, G, yr, mode === "full" ? 22 : 17);
      const V = values(d, yr);
      if (mode === "full") panel(ctx, w, h, d, yr, key, w * 0.595);
      else { // phone: three big lines under the clock
        const M = MODE[key], X = 16, yb = G.cy + G.R + 44;
        ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `600 13px ${SANS}`;
        ctx.fillText(`단속 ${KF.fmt(V.tot)}건`, X, yb);
        ctx.fillStyle = DOWN; ctx.font = `700 13px ${MONO}`; ctx.textAlign = "right";
        ctx.fillText(`${y0}년보다 ${chg(V.tot0, V.tot)}`, w - X, yb);
        ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `600 13px ${SANS}`; ctx.fillText("7회 이상 재범", X, yb + 26);
        ctx.textAlign = "right"; ctx.fillStyle = RING[6]; ctx.font = `800 17px ${MONO}`; ctx.fillText(chg(V.c0[6], V.c[6]), w - X, yb + 26);
        ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `600 13px ${SANS}`;
        ctx.fillText(key === "enf" ? "단속 중 밤 8시–새벽 4시" : `${M.name}${key === "dead" ? "자" : ""} 중 밤 8시–새벽 4시`, X, yb + 52);
        ctx.textAlign = "right"; ctx.fillStyle = `rgb(${M.rgb.join(",")})`; ctx.font = `800 17px ${MONO}`;
        ctx.fillText(`${d.night[key].toFixed(1)}%`, w - X, yb + 52);
      }
      if (hit && hover) tip(ctx, w, h, d, yr, hit, hover, key);
    });
  }

  VIZ["drunk-driving"] = { thumb, mount, bg: BG };
})();
