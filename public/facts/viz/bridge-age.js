// 90 bridge-age — "교량 리벳 점검판". A riveted steel plate cut into four structural bays, one per
// age band. Each bay carries 100 rivets coloured by that band's most recent safety grade (A-E) — so
// the eye compares how the colour mix shifts bay to bay, left (young) to right (old), without ever
// implying any single rivet is one particular bridge. Toggle to the "제원 일치 후보" cross-matched
// subsample to see the same shift hold up independently.
(() => {
  const BG = "#c6c5b9";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#262521", MUTE = "rgba(38,37,33,.64)";
  const PLATE = ["#d6d4c6", "#9a978a"];             // steel plate gradient (light, dark)
  const GRADE_C = { A: "#2f6f90", B: "#4c8478", C: "#a66c16", D: "#9b4e68", E: "#5d3550" };
  const GRADE_L = { A: "A등급", B: "B등급", C: "C등급", D: "D등급", E: "E등급" };
  const HILITE = "#c0392b";

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function rivet(ctx, cx, cy, r, color) {
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.15, cx, cy, r);
    g.addColorStop(0, "rgba(255,255,255,.6)"); g.addColorStop(0.4, color); g.addColorStop(1, color);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.28)"; ctx.lineWidth = Math.max(0.4, r * 0.12); ctx.stroke();
  }

  // largest-remainder rounding: N grade counts -> exactly 100 rivets
  function chips100(grades) {
    const total = grades.reduce((a, b) => a + b, 0) || 1;
    const exact = grades.map((v) => (v / total) * 100);
    const base = exact.map(Math.floor);
    let rem = 100 - base.reduce((a, b) => a + b, 0);
    const order = exact.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0]);
    const out = base.slice();
    for (let k = 0; k < rem; k++) out[order[k][1]] += 1;
    return out;
  }

  function bay(ctx, x0, y0, w, h, band, grow, hover, small) {
    const g = ctx.createLinearGradient(x0, y0, x0, y0 + h);
    g.addColorStop(0, PLATE[0]); g.addColorStop(1, PLATE[1]);
    roundRect(ctx, x0, y0, w, h, 8); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "rgba(38,37,33,.35)"; ctx.lineWidth = 1.2; ctx.stroke();
    // corner bolts, like a bolted plate seam
    const bm = 8;
    [[x0 + bm, y0 + bm], [x0 + w - bm, y0 + bm], [x0 + bm, y0 + h - bm], [x0 + w - bm, y0 + h - bm]].forEach(([cx, cy]) => rivet(ctx, cx, cy, 2.6, "#6b6a5e"));

    const counts = chips100(band.grades);
    const cols = small ? 8 : 10, rows = 10;
    const pad = w * 0.1;
    const cw = (w - pad * 2) / cols, ch = (h * 0.72 - pad * 0.6) / rows;
    const r = Math.min(cw, ch) * 0.36;
    let hit = null, i = 0;
    "ABCDE".split("").forEach((grade, gi) => {
      const n = counts[gi];
      for (let k = 0; k < n; k++, i++) {
        const col = i % cols, row = Math.floor(i / cols);
        const cx = x0 + pad + cw / 2 + col * cw, cy = y0 + h * 0.15 + ch / 2 + row * ch;
        const e = KF.clamp(grow * 110 - i, 0, 1);
        if (e > 0.02) rivet(ctx, cx, cy, r * e, GRADE_C[grade]);
        if (hover && (hover[0] - cx) ** 2 + (hover[1] - cy) ** 2 < r * r * 2.6) hit = { grade, n, band };
      }
    });
    return hit;
  }

  function legend(ctx, x, y, fs) {
    let cx = x;
    ctx.textAlign = "left"; ctx.font = `600 ${fs}px ${SANS}`;
    for (const grade of "ABCDE") {
      ctx.fillStyle = GRADE_C[grade]; ctx.beginPath(); ctx.arc(cx, y, fs * 0.34, 0, 7); ctx.fill();
      ctx.fillStyle = INK; ctx.fillText(grade, cx + fs * 0.62, y + fs * 0.34);
      cx += fs * 1.9;
    }
  }

  function draw(ctx, w, h, groups, el, hover, small) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = small ? 14 : 26, top = small ? 112 : 102;
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${small ? 10 : 11}px ${MONO}`;
    ctx.fillText("교량 안전점검등급 · 연령대별 · 리벳 100개 = 그 연령대의 100%", pad, small ? 18 : 22);
    ctx.fillStyle = INK; ctx.font = `700 ${small ? 15 : 19}px ${SANS}`;
    ctx.fillText("나이가 들수록 등급이 내려간다", pad, small ? 38 : 48);
    ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 10.5 : 12}px ${SANS}`;
    ctx.fillText(small ? "파랑·초록(A·B)이 줄고 황·자주가 늘어난다" : "파랑·초록(A·B)이 줄고 황·자주(C·D·E)가 늘어나는 흐름을 보라", pad, small ? 56 : 70);
    if (small) legend(ctx, pad, 84, 11.5); else legend(ctx, w - pad - 205, 48, 13.5);

    const cols = small ? 2 : 4, rows = Math.ceil(groups.length / cols);
    const gapX = small ? 12 : 18, gapY = small ? 30 : 34;
    const areaW = w - pad * 2, areaH = h - top - pad;
    const bw = (areaW - gapX * (cols - 1)) / cols, bh = (areaH - gapY * (rows - 1)) / rows - 16;
    let hit = null;
    groups.forEach((band, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x0 = pad + c * (bw + gapX), y0 = top + r * (bh + gapY + 16);
      const g = bay(ctx, x0, y0, bw, bh, band, el, hover, small);
      if (g) hit = g;
      ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `600 ${small ? 10.5 : 12}px ${SANS}`;
      ctx.fillText(band.label, x0 + bw / 2, y0 + bh + 15);
      ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 9 : 10}px ${MONO}`;
      ctx.fillText(`n=${KF.fmt(band.total)}`, x0 + bw / 2, y0 + bh + (small ? 28 : 30));
    });
    return hit;
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : `500 11px ${MONO}`);
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 10 + lines.length * 17;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(24,23,19,.94)"; roundRect(ctx, bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = HILITE; ctx.lineWidth = 1; roundRect(ctx, bx + .5, by + .5, bw - 1, bh - 1, 6); ctx.stroke();
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k ? "#ffd9c8" : "#e7e5da"; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 19 + j * 17); });
  }

  // ---------------------------------------------------------------- thumb (own compact layout: two
  // bays only — youngest vs oldest — since a card-size canvas has no room for four)
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = Math.max(10, w * 0.03);
    const line1Y = Math.max(pad + w * 0.026, 42), line2Y = Math.max(pad + w * 0.072, 66);
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${Math.max(9, w * 0.026)}px ${MONO}`;
    ctx.fillText("오래된 다리는 위험할까", pad, line1Y);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.max(13, w * 0.044)}px ${SANS}`;
    ctx.fillText("나이 들수록 등급 하락", pad, line2Y);

    const young = d.all[0], old = d.all[d.all.length - 1];
    const grow = KF.clamp((t % 10) / 9, 0.03, 1);
    const BOTTOM_CLEAR = 58, LABEL_H = 13; // keep the board's own bottom-left glyph badge clear
    const bw = w * 0.34, gap = w * 0.08, y0 = line2Y + 20;
    const bh = (h - BOTTOM_CLEAR - LABEL_H) - y0;
    [young, old].forEach((band, i) => {
      const x0 = pad + i * (bw + gap);
      bay(ctx, x0, y0, bw, bh, band, grow, null, true);
      ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `600 ${Math.max(9, w * 0.024)}px ${SANS}`;
      ctx.fillText(band.label, x0 + bw / 2, y0 + bh + 13);
    });
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let sample = "all", t0 = performance.now(), hover = null;
    KF.segment(controls, [{ id: "all", label: `전체 유효 표본 (${KF.fmt(d.total)}건)` }, { id: "matched", label: `제원 일치 후보 (${KF.fmt(d.matchedTotal)}건)` }], sample, (id) => { sample = id; t0 = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, small = w <= 560, el = (performance.now() - t0) / 1000;
      const groups = sample === "all" ? d.all : d.matched;
      const hit = draw(ctx, w, h, groups, el, hover, small);
      if (hit && hover) {
        const abPct = (hit.band.grades[0] + hit.band.grades[1]) / hit.band.total * 100;
        tip(ctx, w, h, [
          [`${hit.band.label} · ${GRADE_L[hit.grade]}`, 1],
          [`이 연령대의 약 ${hit.n}% (표본 ${KF.fmt(hit.band.total)}건 중)`, 0],
          [`같은 연령대 A·B등급 합계: ${abPct.toFixed(1)}%`, 2],
        ], hover);
      }
    });
  }

  VIZ["bridge-age"] = { thumb, mount, bg: BG };
})();
