// 80 escooter-safety — "야간 브레이크등 궤적". 밤길 위, 해마다 하나씩 서는 빛기둥: 전동킥보드(PM) 사고를
// 장노출 사진의 브레이크등처럼 그린다. 2021년 5월(면허·헬멧 의무화) 자리에 표지판을 세운다. 두 번째 보기는
// 가장 최근 집계연도(d.ageYear)의 가해자 연령대 — 사고를 가장 많이 내는 나이와, 사고가 나면 가장 많이 숨지는 나이를 나란히 켠다.
(() => {
  const BG = "#120a0c";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#f6ece4", MUTE = "rgba(246,236,228,.6)", FAINT = "rgba(246,236,228,.14)";
  const ROAD = "#1c1416", LANE = "rgba(246,236,228,.22)";
  const MET = {
    acc: { label: "사고건수", unit: "건", color: "#ff5a36" },
    death: { label: "사망자수", unit: "명", color: "#ffffff" },
    injury: { label: "부상자수", unit: "명", color: "#ff9a4a" },
  };
  const AGE_HI = "19세이하", AGE_LO = "65세이상";

  let DEC = null;
  function decode(d) {
    if (DEC && DEC.d === d) return DEC;
    const all = { years: d.years, acc: d.acc, death: d.death, injury: d.injury };
    const maxOf = (k) => Math.max(...all[k]);
    const ageMax = { acc: Math.max(...d.ageAcc), death: Math.max(...d.ageDeath), injury: Math.max(...d.ageInj) };
    return (DEC = { d, all, max: { acc: maxOf("acc"), death: maxOf("death"), injury: maxOf("injury") }, ageMax });
  }

  function glowBar(ctx, x, baseY, w, h, color, full) {
    if (h < 0.5) return;
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = full ? 16 : 10;
    const g = ctx.createLinearGradient(0, baseY - h, 0, baseY);
    g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(x, baseY - h, w, h);
    ctx.restore();
    ctx.fillStyle = "#fffaf2"; ctx.fillRect(x, baseY - h - 1, w, 2);
    ctx.save();
    ctx.globalAlpha = 0.2;
    const g2 = ctx.createLinearGradient(0, baseY, 0, baseY + h * 0.42);
    g2.addColorStop(0, color); g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2; ctx.fillRect(x, baseY, w, h * 0.42);
    ctx.restore();
  }

  function road(ctx, x0, x1, y) {
    ctx.strokeStyle = ROAD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - 6, y); ctx.lineTo(x1 + 6, y); ctx.stroke();
    ctx.strokeStyle = LANE; ctx.lineWidth = 1.4; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(x0 - 6, y + 4); ctx.lineTo(x1 + 6, y + 4); ctx.stroke(); ctx.setLineDash([]);
  }

  // pole + flag only (kept clear of the bars); the label sits low, in the gap under the x-axis years
  // so a tall neighbouring bar never covers it.
  function lawSign(ctx, x, y0, y1, full) {
    ctx.strokeStyle = "rgba(255,178,60,.7)"; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#ffb23c";
    ctx.beginPath(); ctx.moveTo(x, y0 - 2); ctx.lineTo(x + (full ? 9 : 7), y0 + (full ? 5 : 4)); ctx.lineTo(x, y0 + (full ? 10 : 8)); ctx.closePath(); ctx.fill();
  }
  function lawLabel(ctx, x, y, full) {
    ctx.textAlign = "center"; ctx.fillStyle = "#ffb23c"; ctx.font = `600 ${full ? 10 : 8.5}px ${SANS}`;
    ctx.fillText(full ? "2021.5 면허·헬멧 의무화" : "'21.5 의무화", x, y);
  }

  function yearView(ctx, X, box, metric, hover, elGrow, caption = true) {
    const [x0, y0, w, h] = box, full = w > 420;
    const M = MET[metric], yrs = X.all.years, n = yrs.length, bw = (w - 20) / n;
    const baseY = y0 + h - (full ? 48 : 40), top = y0 + (full ? 30 : 22);
    road(ctx, x0, x0 + w - 20, baseY + 2);
    const mx = X.max[metric];
    let hit = null, lawX = null;
    yrs.forEach((yr, i) => {
      const v = X.all[metric][i], x = x0 + i * bw + bw * 0.22, bwid = bw * 0.56;
      const grow = KF.clamp((elGrow - i * 0.07) / 0.5, 0, 1);
      const hh = ((v / mx) * (baseY - top)) * grow;
      const hi = hover && hover[0] >= x - bw * 0.22 && hover[0] < x - bw * 0.22 + bw && hover[1] >= top && hover[1] <= baseY + 10;
      glowBar(ctx, x, baseY, bwid, hh, hi ? "#fff" : M.color, full);
      ctx.textAlign = "center"; ctx.fillStyle = yr === X.d.peak ? "#ffb23c" : MUTE; ctx.font = `600 ${full ? 11 : 9}px ${MONO}`;
      ctx.fillText(`'${String(yr).slice(2)}`, x + bwid / 2, baseY + (full ? 20 : 16));
      if (full || v === mx || i === n - 1 || i === 0) {
        ctx.fillStyle = INK; ctx.font = `700 ${full ? 11 : 9.5}px ${SANS}`;
        ctx.fillText(KF.fmt(v), x + bwid / 2, baseY - hh - 8);
      }
      if (hi) hit = { yr, v };
      if (yr === 2021) lawX = x + bwid + (bw - bwid) * 0.5;
    });
    if (lawX != null) { lawSign(ctx, lawX, top - 4, baseY); lawLabel(ctx, lawX, baseY + (full ? 36 : 30), full); }
    if (caption) {
      ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`;
      ctx.fillText(`연도별 ${M.label}`, x0, top - 12);
    }
    return hit;
  }

  function ageView(ctx, X, box, metric, hover) {
    const [x0, y0, w, h] = box, full = w > 420;
    const d = X.d, M = MET[metric], key = metric === "acc" ? "ageAcc" : metric === "death" ? "ageDeath" : "ageInj";
    const vals = d[key], mx = Math.max(...vals), rh = (h - 20) / d.ages.length;
    const trackW = w - 150 - (full ? 92 : 72);   // leave room on the right for the value label
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`;
    ctx.fillText(`${d.ageYear}년 가해자 연령대별 ${M.label}`, x0, y0 - 8);
    let hit = null;
    d.ages.forEach((a, i) => {
      const y = y0 + 14 + i * rh, v = vals[i], bw = (v / mx) * trackW;
      const hi = a === AGE_HI ? "#ffb23c" : a === AGE_LO ? "#ff3b3b" : M.color;
      const hovered = hover && hover[1] >= y && hover[1] < y + rh * 0.72 && hover[0] < x0 + 150 + bw + 10;
      glowBar2(ctx, x0 + 150, y + rh * 0.36, bw, rh * 0.5, hovered ? "#fff" : hi, full);
      ctx.textAlign = "right"; ctx.fillStyle = (a === AGE_HI || a === AGE_LO) ? INK : MUTE; ctx.font = `${a === AGE_HI || a === AGE_LO ? 700 : 500} ${full ? 11.5 : 10}px ${SANS}`;
      ctx.fillText(a, x0 + 144, y + rh * 0.36 + 4);
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 11 : 9.5}px ${MONO}`;
      ctx.fillText(`${KF.fmt(v)}${M.unit}`, x0 + 150 + bw + 8, y + rh * 0.36 + 4);
      if (hovered) hit = { a, v };
    });
    return hit;
  }
  function glowBar2(ctx, x, y, w, h, color, full) {
    if (w < 0.5) return;
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = full ? 10 : 6;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, color);
    ctx.fillStyle = g; ctx.fillRect(x, y - h / 2, w, h);
    ctx.restore();
    ctx.fillStyle = "#fffaf2"; ctx.fillRect(x + w - 2, y - h / 2, 2, h);
  }

  function headline(ctx, x, y, X, full) {
    const d = X.d;
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 11 : 9.5}px ${MONO}`;
    ctx.fillText("NIGHT BRAKE-LIGHT TRAIL", x, y);
    ctx.fillStyle = INK; ctx.font = `700 ${full ? 18 : 14}px ${SANS}`;
    ctx.fillText("전동킥보드 사고, 계속 늘고 있을까", x, y + (full ? 25 : 18));
    const by = y + (full ? 56 : 38);
    ctx.font = `600 ${full ? 10.5 : 9.5}px ${SANS}`; ctx.fillStyle = MUTE;
    const lastYr = d.years.at(-1);
    ctx.fillText("2017→2022", x, by); ctx.fillText(`${d.peak}년 정점 → ${lastYr}`, x + (full ? 140 : 100), by);
    ctx.font = `800 ${full ? 22 : 16}px ${SANS}`;
    const grow = (d.acc[d.years.indexOf(2022)] / d.acc[0]).toFixed(0);
    const decl = ((1 - d.acc.at(-1) / d.acc[d.years.indexOf(d.peak)]) * 100).toFixed(0);
    ctx.fillStyle = "#ff5a36"; ctx.fillText(`${grow}배 늘어`, x, by + (full ? 26 : 19));
    ctx.fillStyle = "#ffb23c"; ctx.fillText(`${decl}% 줄어`, x + (full ? 140 : 100), by + (full ? 26 : 19));
    return by + (full ? 42 : 30);
  }

  function tip(ctx, w, h, lines, hover) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : `500 11px ${MONO}`);
    const bw = Math.min(w - 16, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 14 + lines.length * 18;
    const bx = KF.clamp(hover[0] + 14, 8, w - bw - 8), by = KF.clamp(hover[1] - bh - 10, 8, h - bh - 8);
    ctx.fillStyle = "rgba(10,6,6,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(246,236,228,.3)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 1 ? "#ffb23c" : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + j * 18); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d0) {
    const X = decode(d0), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const grow = KF.ease(KF.clamp((c - 0.3) / 2, 0, 1));
    yearView(ctx, X, [w * 0.05, h * 0.1, w * 0.6, h * 0.88], "acc", null, grow * 5, false);
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText("PM 사고", w * 0.68, h * 0.22);
    ctx.fillStyle = "#ff5a36"; ctx.font = `800 ${Math.round(h * 0.1)}px ${SANS}`;
    ctx.fillText(`${X.d.peak}년 정점`, w * 0.68, h * 0.36);
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText(`${X.d.years.at(-1)}년엔`, w * 0.68, h * 0.58);
    ctx.fillStyle = "#ffb23c"; ctx.font = `800 ${Math.round(h * 0.1)}px ${SANS}`;
    ctx.fillText("감소", w * 0.68, h * 0.72);
    if (c > 9.3) { ctx.fillStyle = `rgba(18,10,12,${(c - 9.3) / 0.7})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d0) {
    const X = decode(d0), s = KF.canvas(stage);
    let view = "year", metric = "acc", t0 = performance.now(), hover = null;
    KF.segment(controls, [{ id: "year", label: "연도별" }, { id: "age", label: `${d0.ageYear} 연령대별` }], view, (id) => { view = id; t0 = performance.now(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "·"; controls.appendChild(sep);
    KF.segment(controls, [{ id: "acc", label: "사고건수" }, { id: "death", label: "사망자수" }, { id: "injury", label: "부상자수" }], metric, (id) => { metric = id; });
    const onMove = (e) => { const b = stage.getBoundingClientRect(); hover = [e.clientX - b.left, e.clientY - b.top]; };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerdown", onMove);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const x0 = full ? 32 : 14;
      const bodyTop = headline(ctx, x0, full ? 28 : 20, X, full);
      const el = (performance.now() - t0) / 1000;
      let hit = null;
      if (view === "year") {
        const boxH = h - bodyTop - (full ? 20 : 14);
        hit = yearView(ctx, X, [x0, bodyTop, w - x0 * 2, boxH], metric, hover, KF.clamp(el / 0.9, 0, 1) * 10);
      } else {
        const boxH = h - bodyTop - (full ? 20 : 14);
        const ah = ageView(ctx, X, [x0, bodyTop + 14, w - x0 * 2, boxH - 14], metric, hover);
        if (ah) hit = ah;
      }
      if (hit && hover) {
        const lines = hit.yr != null
          ? [[`${hit.yr}년`, 1], [`${MET[metric].label} ${KF.fmt(hit.v)}${MET[metric].unit}`, 0]]
          : [[hit.a, 1], [`${MET[metric].label} ${KF.fmt(hit.v)}${MET[metric].unit} (${X.d.ageYear})`, 0]];
        tip(ctx, w, h, lines, hover);
      }
    });
  }

  VIZ["escooter-safety"] = { thumb, mount, bg: BG };
})();
