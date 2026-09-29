// 59 sexratio — "신생아실 요람 창". A daylit hospital nursery window: 100 pink cribs for 100 girls (fixed),
// and blue cribs laid out next to them for however many boys were born per 100 girls that year (the sex-ratio
// number itself). Cribs beyond the natural range (103-107) get a small red tag. Second view: the same count,
// ranked by region.
(() => {
  const BG = "#f2e6e2";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#3a2430", DIM = "rgba(58,36,48,.62)", FAINT = "rgba(58,36,48,.14)";
  const PINK = "#e28aa0", PINK_D = "#c9647e", BLUE = "#6f93c4", BLUE_D = "#4c6fa0", TAG = "#c23b30";
  const CARD = "#fffaf6";

  let DEC = null;
  function decode(d) {
    if (DEC && DEC.d === d) return DEC;
    DEC = { d };
    return DEC;
  }

  // ---------------------------------------------------------------- crib drawing
  function crib(ctx, x, y, w, h, fill, stroke, excess) {
    const r = Math.min(w, h) * 0.22;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(0.6, w * 0.04); ctx.stroke(); }
    // blanket fold line
    ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = Math.max(0.5, w * 0.03);
    ctx.beginPath(); ctx.moveTo(x + w * 0.18, y + h * 0.62); ctx.lineTo(x + w * 0.82, y + h * 0.62); ctx.stroke();
    if (excess && w > 5) {
      ctx.fillStyle = TAG;
      ctx.beginPath(); ctx.arc(x + w * 0.82, y + h * 0.2, Math.max(1.2, w * 0.16), 0, 7); ctx.fill();
    }
  }

  function fitGrid(n, x, y, w, h, gap) {
    if (n <= 0) return { cols: 0, rows: 0, cw: 0, ch: 0, cells: [] };
    let best = null;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const cw = (w - (cols - 1) * gap) / cols;
      const ch = (h - (rows - 1) * gap) / rows;
      const cell = Math.min(cw, ch / 0.8);
      if (cell <= 0) continue;
      if (!best || cell > best.cell) best = { cols, rows, cell };
    }
    const cw = best.cell, ch = best.cell * 0.8;
    const gw = best.cols * cw + (best.cols - 1) * gap, gh = best.rows * ch + (best.rows - 1) * gap;
    const ox = x + (w - gw) / 2, oy = y + (h - gh) / 2;
    const cells = [];
    for (let i = 0; i < n; i++) {
      const c = i % best.cols, r = Math.floor(i / best.cols);
      cells.push({ x: ox + c * (cw + gap), y: oy + r * (ch + gap), w: cw, h: ch });
    }
    return { cols: best.cols, rows: best.rows, cw, ch, cells, box: [ox, oy, gw, gh] };
  }

  function nurseryScene(ctx, X, x0, y0, w, h, metric, year, grow, hover, full) {
    const d = X.d, yi = d.years.indexOf(year), lo = d.base.lo, hi = d.base.hi;
    const val = d.nat[metric][yi];
    if (val == null) return { hit: null, girlsN: 0, boysN: 0 };
    const girlsN = 100, boysN = Math.round(val);
    const gap = w > 700 ? 4 : 2.4;
    const split = full ? 0.34 : 0.4;
    const gW = w * split - gap * 4, bW = w * (1 - split) - gap * 4;
    // labels
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 ${full ? 12 : 10.5}px ${SANS}`;
    ctx.fillText(`여아 ${girlsN}명 (기준)`, x0, y0 - 8);
    const excessN0 = Math.max(0, boysN - Math.round(girlsN * hi / 100));
    ctx.fillStyle = excessN0 > 0 ? TAG : DIM;
    ctx.fillText(excessN0 > 0 ? `남아 ${boysN}명 (자연범위 밖 ${excessN0}명 ●)` : `남아 ${boysN}명 (자연범위 안)`, x0 + gW + gap * 8, y0 - 8);
    const gG = fitGrid(girlsN, x0, y0, gW, h, gap);
    const gB = fitGrid(Math.max(1, Math.round(boysN * grow)), x0 + gW + gap * 8, y0, bW, h, gap);
    let hit = null;
    gG.cells.forEach((c) => {
      crib(ctx, c.x, c.y, c.w, c.h, PINK, PINK_D, false);
      if (hover && hover[0] >= c.x && hover[0] <= c.x + c.w && hover[1] >= c.y && hover[1] <= c.y + c.h) hit = { side: "girl" };
    });
    gB.cells.forEach((c, i) => {
      const ex = i >= Math.round(girlsN * hi / 100);
      crib(ctx, c.x, c.y, c.w, c.h, BLUE, BLUE_D, ex);
      if (hover && hover[0] >= c.x && hover[0] <= c.x + c.w && hover[1] >= c.y && hover[1] <= c.y + c.h) hit = { side: "boy", excess: ex, idx: i };
    });
    const excessN = excessN0;
    return { hit, girlsN, boysN, gG, gB, val, excessN };
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 13px ${SANS}` : k === 2 ? `500 10.5px ${SANS}` : `500 11.5px ${SANS}`);
    let bw = 0;
    for (const [t, k] of lines) { ctx.font = fontOf(k); bw = Math.max(bw, ctx.measureText(t).width); }
    bw += 22; const bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6);
    const by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = CARD; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], i) => { ctx.fillStyle = k === 2 ? DIM : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + i * 18); });
  }

  // ---------------------------------------------------------------- region view
  function regionView(ctx, X, x0, y0, w, h, metric, year, prog, hover, full) {
    const d = X.d, yi = d.years.indexOf(year);
    const rows = d.regions.map((name, ri) => ({ name, v: d.reg[metric][ri][yi] })).filter((r) => r.v != null);
    rows.sort((a, b) => b.v - a.v);
    const lo = d.base.lo, hi = d.base.hi;
    const vmax = Math.max(hi + 4, ...rows.map((r) => r.v));
    const vmin = Math.min(lo - 4, ...rows.map((r) => r.v), 90);
    const rh = Math.min(full ? 26 : 20, (h - 10) / rows.length);
    const lw = full ? 110 : 78;
    const px = (v) => x0 + lw + KF.clamp((v - vmin) / (vmax - vmin), 0, 1) * (w - lw - 60);
    let hit = null;
    // natural band
    ctx.fillStyle = "rgba(58,36,48,.06)";
    ctx.fillRect(px(lo), y0, px(hi) - px(lo), rows.length * rh);
    rows.forEach((r, i) => {
      const y = y0 + i * rh, on = KF.clamp((prog * rows.length - i) * 3, 0, 1);
      const c = r.v > hi ? TAG : r.v < lo ? BLUE_D : PINK_D;
      ctx.fillStyle = INK; ctx.font = `500 ${full ? 11.5 : 10}px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(r.name.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, ""), x0, y + rh * 0.68);
      ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + lw, y + rh * 0.5); ctx.lineTo(x0 + w - 60, y + rh * 0.5); ctx.stroke();
      ctx.fillStyle = c; ctx.globalAlpha = on;
      ctx.beginPath(); ctx.arc(px(r.v), y + rh * 0.5, full ? 5 : 4, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10.5 : 9.5}px ${MONO}`;
      ctx.fillText(r.v.toFixed(1), x0 + w - 54, y + rh * 0.68);
      if (hover && hover[1] >= y && hover[1] < y + rh && hover[0] >= x0) hit = r;
    });
    return { hit, rows };
  }

  // ---------------------------------------------------------------- thumb
  // Card layout guard: badge sits top-left (x<96, y<40), glyph sits bottom-left (x<50, y>h-50).
  // Illustration may bleed under either (it's decorative), but text/key figures must clear both.
  function thumb(ctx, w, h, t, d) {
    const X = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10;
    const yrs = X.d.years, phase = (c % 8) / 8;
    const useYear = phase < 0.55 ? X.d.ctx.peakYear : X.d.ctx.latestYear;
    const grow = KF.ease(KF.clamp((c % 8) / 1.2, 0, 1));
    const topY = 44, botY2 = h - 60, botY1 = h - 82;   // safe band: illustration between topY and botY1-14
    ctx.save();
    ctx.beginPath(); ctx.rect(0, topY, w, botY1 - topY - 14); ctx.clip();
    nurseryScene(ctx, X, w * 0.09, topY + 16, w * 0.82, botY1 - topY - 30, "total", useYear, grow, null, w > 260);
    ctx.restore();
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.072)}px ${SANS}`;
    ctx.fillText("출생성비", w * 0.045, botY1);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.05)}px ${MONO}`;
    ctx.fillText(`${useYear}년 · 여아 100명당 남아 ${Math.round(X.d.nat.total[X.d.years.indexOf(useYear)])}명`, w * 0.045, botY2);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), sc = KF.canvas(stage);
    let view = "year", metric = "total", year = X.d.ctx.latestYear;
    let t0 = performance.now(), tGrow = performance.now(), hover = null;
    KF.segment(controls, [{ id: "year", label: "요람 창" }, { id: "region", label: "지역 비교" }], "year", (id) => { view = id; tGrow = performance.now(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "·"; controls.appendChild(sep);
    KF.segment(controls, X.d.metrics.map((m) => ({ id: m, label: X.d.labels[m] })), metric, (id) => { metric = id; });
    const range = document.createElement("input");
    range.type = "range"; range.min = X.d.years[0]; range.max = X.d.years[X.d.years.length - 1]; range.step = 1; range.value = year;
    const lab = document.createElement("label"); lab.append("연도", range);
    controls.append(lab);
    range.oninput = () => { year = +range.value; };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const elGrow = (performance.now() - tGrow) / 1000;
      if (view === "year") {
        const grow = KF.ease(KF.clamp(elGrow / 1.1, 0, 1));
        const top = full ? 74 : 96;
        const res = nurseryScene(ctx, X, full ? 26 : 14, top, w - (full ? 52 : 28), h - top - (full ? 70 : 96), metric, year, grow, hover, full);
        // header
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 15}px ${SERIF}`;
        ctx.fillText(`${year}년 · ${X.d.labels[metric]} 출생성비`, full ? 26 : 14, full ? 34 : 26);
        if (res.val != null) {
          ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10.5}px ${SANS}`;
          ctx.fillText(`여아 100명당 남아 ${res.val.toFixed(1)}명 · 자연범위 ${X.d.base.lo}–${X.d.base.hi}`, full ? 26 : 14, full ? 54 : 44);
        }
        // context readout bottom
        const by = h - (full ? 44 : 68);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9.5}px ${MONO}`; ctx.textAlign = "left";
        const cx = X.d.ctx;
        ctx.fillText(`정점 ${cx.peakYear}년 ${cx.peakVal.toFixed(1)} · 셋째아 이상 정점 ${cx.peak3Year}년 ${cx.peak3Val.toFixed(1)} · ${cx.since}년부터 전국 총출생 자연범위 유지`, full ? 26 : 14, by, w - 40);
        if (res.hit && hover) {
          const lines = res.hit.side === "girl"
            ? [["여아", 1], [`${year}년 기준 100명`, 0]]
            : [["남아", 1], [`${res.hit.idx + 1}번째 (여아 100명당)`, 0], [res.hit.excess ? "자연범위(103–107) 밖" : "자연범위 안", res.hit.excess ? 0 : 2]];
          tip(ctx, w, h, lines, hover);
        }
      } else {
        const top = full ? 70 : 60;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 15}px ${SERIF}`;
        ctx.fillText(`${year}년 · ${X.d.labels[metric]} · 시도 비교`, full ? 26 : 14, full ? 34 : 26);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10.5}px ${SANS}`;
        ctx.fillText(`옅은 띠 = 자연범위 (${X.d.base.lo}–${X.d.base.hi})`, full ? 26 : 14, full ? 52 : 44);
        const prog = KF.clamp(elGrow / 1.4, 0, 1);
        const res = regionView(ctx, X, full ? 26 : 14, top, w - (full ? 52 : 28), h - top - 20, metric, year, prog, hover, full);
        if (res.hit && hover) tip(ctx, w, h, [[res.hit.name, 1], [`${res.hit.v.toFixed(1)}`, 0]], hover);
      }
    });
  }

  VIZ.sexratio = { thumb, mount, bg: BG };
})();
