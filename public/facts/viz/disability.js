// 58 disability — "삶의 강과 나이 델타". Left: a spring where disability "originates" — parallel
// streams sized by cause (mostly acquired: illness, accidents; a thin one is congenital). Right: the
// registered-disabled population as a river flowing through 2007-2025, its cross-section always 100%
// but split between under-65 (shrinking channel) and 65+ (swelling channel) — a thin line above tracks
// the real headcount, which only grew a little.
(() => {
  const BG = "#a8c9c2";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#123330", DIM = "rgba(18,51,48,.64)", FAINT = "rgba(18,51,48,.16)";
  const YOUNG = "#1f6e63", YOUNGL = "#4d9c8e", OLD = "#b5622f", OLDL = "#d99a5c";
  const TIPDIM = "rgba(234,243,239,.68)"; // muted text *inside* the dark tooltip box (DIM is for the light page bg)
  const CAUSEC = { "질병후유증": "#1f6e63", "안전사고": "#4d9c8e", "운수사고": "#7fb8a8", "선천성": "#b5622f", "기타": "#9a8a6a" };

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    DEC = { ...d };
    return DEC;
  }

  // ---------------------------------------------------------------- headwaters (cause streams)
  function headwaters(ctx, box, causes, hoverI, grow) {
    const [x, y, w, h] = box;
    ctx.save();
    ctx.fillStyle = INK; ctx.font = `700 ${Math.min(w, h) * 0.075}px ${SANS}`; ctx.textAlign = "left";
    ctx.fillText("발원지 — 장애 발생 원인", x, y + 4);
    const top = y + h * 0.14, gapEach = h * 0.025, bandTotal = h - h * 0.14 - gapEach * (causes.length - 1);
    let cy = top;
    const boxes = [];
    causes.forEach((c, i) => {
      const sh = Math.max(6, (c.pct / 100) * bandTotal * grow);
      const on = hoverI === i;
      ctx.fillStyle = CAUSEC[c.name] || "#888";
      ctx.globalAlpha = on ? 1 : 0.88;
      // wavy stream band
      ctx.beginPath();
      const amp = sh * 0.12;
      for (let t = 0; t <= 1.001; t += 0.05) {
        const xx = x + w * 0.34 * t, yy = cy + sh / 2 + Math.sin(t * Math.PI * 1.4) * amp * (1 - t);
        t === 0 ? ctx.moveTo(xx, yy - sh / 2) : ctx.lineTo(xx, yy - sh / 2);
      }
      for (let t = 1; t >= -0.001; t -= 0.05) {
        const xx = x + w * 0.34 * t, yy = cy + sh / 2 + Math.sin(t * Math.PI * 1.4) * amp * (1 - t);
        ctx.lineTo(xx, yy + sh / 2);
      }
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      if (on) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.4; ctx.stroke(); }
      ctx.fillStyle = on ? INK : DIM; ctx.font = `${on ? 700 : 500} ${Math.min(w, h) * 0.052}px ${SANS}`;
      ctx.fillText(`${c.name} ${c.pct.toFixed(1)}%`, x + w * 0.38, cy + sh / 2 + 4);
      boxes.push([x, cy, w * 0.36, sh]);
      cy += sh + gapEach;
    });
    ctx.restore();
    return boxes;
  }

  // ---------------------------------------------------------------- river over time (100%-stacked)
  function river(ctx, box, rows, hoverX, full) {
    const [x, y0, w, boxH] = box;
    const lineH = Math.min(56, boxH * 0.2), lineY = y0, y = y0 + lineH + 14, h = boxH - lineH - 14;
    const n = rows.length, xs = (i) => x + (w * i) / (n - 1);
    const maxTotal = Math.max(...rows.map((r) => r.total)), minTotal = Math.min(...rows.map((r) => r.total));
    const oldTop = (r) => y + h * (1 - r.over65 / r.total);
    ctx.save();
    // under-65 band (bottom)
    ctx.beginPath(); ctx.moveTo(x, y + h);
    rows.forEach((r, i) => ctx.lineTo(xs(i), oldTop(r)));
    ctx.lineTo(x + w, y + h); ctx.closePath();
    const gY = ctx.createLinearGradient(0, y, 0, y + h);
    gY.addColorStop(0, YOUNGL); gY.addColorStop(1, YOUNG);
    ctx.fillStyle = gY; ctx.fill();
    // over-65 band (top)
    ctx.beginPath(); ctx.moveTo(x, y);
    rows.forEach((r, i) => ctx.lineTo(xs(i), oldTop(r)));
    ctx.lineTo(x + w, y); ctx.closePath();
    const gO = ctx.createLinearGradient(0, y, 0, y + h);
    gO.addColorStop(0, OLD); gO.addColorStop(1, OLDL);
    ctx.fillStyle = gO; ctx.fill();
    // boundary line
    ctx.beginPath(); rows.forEach((r, i) => { const xx = xs(i), yy = oldTop(r); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); });
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.4; ctx.stroke();
    // headcount line (own scale) in its reserved zone above the river
    ctx.beginPath();
    rows.forEach((r, i) => { const xx = xs(i), yy = lineY + lineH - ((r.total - minTotal) / (maxTotal - minTotal)) * lineH; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); });
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    let hi = null;
    if (hoverX != null) {
      let bi = 0, bd = 1e9;
      for (let i = 0; i < n; i++) { const dd = Math.abs(xs(i) - hoverX); if (dd < bd) { bd = dd; bi = i; } }
      if (bd < (w / n) * 0.8) hi = bi;
    }
    if (hi != null) {
      ctx.strokeStyle = "rgba(18,51,48,.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xs(hi), lineY); ctx.lineTo(xs(hi), y + h); ctx.stroke();
    }
    return { xs, oldTop, hover: hi, lineY, lineH, minTotal, maxTotal, box };
  }

  function tip(ctx, w, h, lines, p) {
    ctx.font = `600 12px ${SANS}`;
    const bw = Math.max(...lines.map((l) => ctx.measureText(l[0]).width)) + 22, bh = 14 + lines.length * 17;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6);
    const by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(10,30,28,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || "#eaf3ef"; ctx.font = `${i ? 500 : 700} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 16 + i * 17); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const D = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, grow = KF.ease(KF.clamp((c - 0.3) / 2, 0, 1));
    // keep clear of the board's top-left badge (~90x36px) and bottom-left glyph box (~50x50px)
    const titleY = Math.max(58, h * 0.26);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.08)}px ${SANS}`;
    ctx.fillText("삶의 강", w * 0.05, titleY);
    river(ctx, [w * 0.05, titleY + h * 0.12, w * 0.9, h * 0.34], D.river, null, false);
    const last = D.river[D.river.length - 1];
    ctx.fillStyle = OLD; ctx.font = `700 ${Math.round(h * 0.09)}px ${MONO}`;
    ctx.fillText(`65세+ ${((last.over65 / last.total) * 100).toFixed(0)}%`, Math.max(w * 0.16, 62), h * 0.9);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    let hover = null, t0 = performance.now();
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    let hwBoxes = [], rGeo = null, rBox = null;

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const grow = KF.reduced ? 1 : KF.ease(KF.clamp((performance.now() - t0) / 1100, 0, 1));

      const hwBox = full ? [16, 20, w * 0.26, h - 40] : [16, 16, w - 32, h * 0.4];
      let hoverHW = null;
      if (hover) {
        for (let i = 0; i < hwBoxes.length; i++) { const [bx, by, bw, bh] = hwBoxes[i]; if (hover[0] >= bx && hover[0] <= bx + bw && hover[1] >= by - 3 && hover[1] <= by + bh + 3) hoverHW = i; }
      }
      hwBoxes = headwaters(ctx, hwBox, D.causes, hoverHW, grow);

      rBox = full ? [hwBox[0] + hwBox[2] + 46, 78, w - hwBox[0] - hwBox[2] - 46 - 20, h - 150]
                  : [16, hwBox[1] + hwBox[3] + 70, w - 32, h - hwBox[1] - hwBox[3] - 130];
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 15 : 12.5}px ${SANS}`;
      ctx.fillText(`등록장애인 연령 구성 · ${D.y0}–${D.y1}년 (강폭 = 100%)`, rBox[0], rBox[1] - 40);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`;
      ctx.fillText("점선 = 실제 총 인원(별도 눈금) · 위 = 65세 이상, 아래 = 65세 미만", rBox[0], rBox[1] - 24);
      const hx = hover && hover[0] >= rBox[0] && hover[0] <= rBox[0] + rBox[2] ? hover[0] : null;
      rGeo = river(ctx, rBox, D.river, hx, full);

      const last = D.river[D.river.length - 1], first = D.river[0];
      ctx.fillStyle = OLD; ctx.font = `700 ${full ? 15 : 12}px ${MONO}`; ctx.textAlign = "left";
      ctx.fillText(`65세 이상 ${(first.over65 / first.total * 100).toFixed(1)}% → ${(last.over65 / last.total * 100).toFixed(1)}%`, rBox[0], rBox[1] + rBox[2] * 0 + rBox[3] + (full ? 26 : 22));
      ctx.fillStyle = YOUNG; ctx.font = `500 ${full ? 11.5 : 10}px ${SANS}`;
      ctx.fillText(`65세 미만 실인원 ${KF.fmt(first.under65)}명 → ${KF.fmt(last.under65)}명 (${((last.under65 / first.under65 - 1) * 100).toFixed(1)}%)`, rBox[0], rBox[1] + rBox[3] + (full ? 46 : 38));

      if (hoverHW != null) {
        const c = D.causes[hoverHW];
        tip(ctx, w, h, [[c.name], [`전체 발생 원인의 ${c.pct.toFixed(1)}%`, CAUSEC[c.name] || TIPDIM]], hover);
      } else if (rGeo && rGeo.hover != null) {
        const r = D.river[rGeo.hover];
        tip(ctx, w, h, [[`${r.year}년`], [`65세 이상 ${KF.fmt(r.over65)}명 (${(r.over65 / r.total * 100).toFixed(1)}%)`, OLD], [`65세 미만 ${KF.fmt(r.under65)}명 (${(r.under65 / r.total * 100).toFixed(1)}%)`, YOUNG], [`전체 ${KF.fmt(r.total)}명`, TIPDIM]], hover);
      }
    });
  }

  VIZ["disability"] = { thumb, mount, bg: BG };
})();
