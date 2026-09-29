// 60 paternity-leave — "육아휴직계 서류함". A pulled-open filing-cabinet drawer full of index-tab folders:
// 1 folder = 500 parents who took parental leave that year, blue tab = dad, pink tab = mom. Second view:
// four smaller drawers, one per firm-size band, for the latest year.
(() => {
  const BG = "#e8d8ae";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#3a2c14", DIM = "rgba(58,44,20,.62)", FAINT = "rgba(58,44,20,.16)";
  const WOOD = "#8a6a3d", WOOD_D = "#6b4f28";
  const DAD = "#3d6fa8", DAD_D = "#2c5480", MOM = "#c2537a", MOM_D = "#9c3c5c";
  const CARD = "#fbf3e2";

  function folder(ctx, x, y, w, h, fill, stroke) {
    const tab = w * 0.42, tabH = h * 0.22;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x, y + tabH);
    ctx.lineTo(x + w * 0.06, y);
    ctx.lineTo(x + tab, y);
    ctx.lineTo(x + tab + w * 0.06, y + tabH);
    ctx.lineTo(x + w, y + tabH);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(0.6, w * 0.035); ctx.stroke(); }
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = Math.max(0.5, w * 0.025);
    ctx.beginPath(); ctx.moveTo(x + w * 0.12, y + h * 0.55); ctx.lineTo(x + w * 0.88, y + h * 0.55); ctx.stroke();
  }

  function fitGrid(n, x, y, w, h, gap) {
    if (n <= 0) return { cells: [], box: [x, y, 0, 0] };
    let best = null;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const cw = (w - (cols - 1) * gap) / cols;
      const ch = (h - (rows - 1) * gap) / rows;
      const cell = Math.min(cw, ch / 0.82);
      if (cell <= 0) continue;
      if (!best || cell > best.cell) best = { cols, rows, cell };
    }
    if (!best) return { cells: [], box: [x, y, 0, 0] };
    const cw = best.cell, ch = best.cell * 0.82;
    const gw = best.cols * cw + (best.cols - 1) * gap, gh = best.rows * ch + (best.rows - 1) * gap;
    const ox = x + (w - gw) / 2, oy = y + (h - gh) / 2;
    const cells = [];
    for (let i = 0; i < n; i++) {
      const c = i % best.cols, r = Math.floor(i / best.cols);
      cells.push({ x: ox + c * (cw + gap), y: oy + r * (ch + gap), w: cw, h: ch });
    }
    return { cells, box: [ox, oy, gw, gh] };
  }

  function drawer(ctx, x, y, w, h, label, full) {
    ctx.fillStyle = WOOD; ctx.fillRect(x, y, w, h * 0.1);
    ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fillRect(x, y, w, h * 0.03);
    ctx.strokeStyle = WOOD_D; ctx.lineWidth = 1.4; ctx.strokeRect(x + 0.7, y + h * 0.1, w - 1.4, h * 0.88);
    ctx.fillStyle = "rgba(138,106,61,.08)"; ctx.fillRect(x, y + h * 0.1, w, h * 0.88);
    if (label) {
      ctx.fillStyle = "#fff"; ctx.font = `600 ${full ? 11 : 9.5}px ${SANS}`; ctx.textAlign = "center";
      ctx.fillText(label, x + w / 2, y + h * 0.075);
    }
  }

  function scene(ctx, unit, x, y, w, h, dadN, momN, grow, hover, full, unitLabel, showLabels = true) {
    const nDad = Math.round(dadN / unit), nMom = Math.round(momN / unit);
    const gap = w > 500 ? 5 : 3;
    const split = 0.5;
    drawer(ctx, x, y - h * 0.09, w, h * 1.09, null, full);
    const innerX = x + w * 0.03, innerY = y + h * 0.1, innerW = w * 0.94, innerH = h * 0.82;
    const gMom = fitGrid(nMom, innerX, innerY, innerW * split - gap * 2, innerH, gap);
    const gDad = fitGrid(Math.max(0, Math.round(nDad * grow)), innerX + innerW * split + gap * 2, innerY, innerW * (1 - split) - gap * 2, innerH, gap);
    let hit = null;
    gMom.cells.forEach((c) => {
      folder(ctx, c.x, c.y, c.w, c.h, MOM, MOM_D);
      if (hover && hover[0] >= c.x && hover[0] <= c.x + c.w && hover[1] >= c.y && hover[1] <= c.y + c.h) hit = "mom";
    });
    gDad.cells.forEach((c) => {
      folder(ctx, c.x, c.y, c.w, c.h, DAD, DAD_D);
      if (hover && hover[0] >= c.x && hover[0] <= c.x + c.w && hover[1] >= c.y && hover[1] <= c.y + c.h) hit = "dad";
    });
    if (showLabels) {
      ctx.textAlign = "left"; ctx.fillStyle = MOM_D; ctx.font = `600 ${full ? 11.5 : 10}px ${SANS}`;
      ctx.fillText(`엄마 ${KF.fmt(momN)}명`, innerX, innerY - 6);
      ctx.fillStyle = DAD_D; ctx.textAlign = "right";
      ctx.fillText(`아빠 ${KF.fmt(dadN)}명`, x + w * 0.97, innerY - 6);
      ctx.textAlign = "left";
    }
    if (unitLabel) {
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10 : 9}px ${MONO}`;
      ctx.fillText(unitLabel, innerX, y + h * 1.02);
    }
    return { hit, gMom, gDad };
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 13px ${SANS}` : `500 11.5px ${SANS}`);
    let bw = 0;
    for (const [t] of lines) { ctx.font = fontOf(0); bw = Math.max(bw, ctx.measureText(t).width); }
    bw += 22; const bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6);
    const by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = CARD; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], i) => { ctx.fillStyle = INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + i * 18); });
  }

  // ---------------------------------------------------------------- thumb
  // Card layout guard: badge top-left (x<96, y<40), glyph bottom-left (x<50, y>h-50). The headline
  // number is the whole point of the card, so it always shows the latest year — never cycles to an
  // older, smaller value — and a one-time grow (no loop) keeps it stable from t=3.5 onward.
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const S = d.standard, yi = S.share.length - 1;
    const grow = KF.ease(KF.clamp(t / 1.6, 0, 1));
    const topY = 44, botY2 = h - 60, botY1 = h - 84;
    scene(ctx, 2200, w * 0.08, topY + 6, w * 0.58, botY1 - topY - 24, S.dad[yi], S.mom[yi], grow, null, w > 260, null, false);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.07)}px ${SANS}`;
    ctx.fillText("육아휴직, 아빠의 몫", w * 0.045, botY1);
    ctx.fillStyle = DAD_D; ctx.font = `700 ${Math.round(h * 0.088)}px ${SANS}`;
    const pctTxt = `${S.share[yi].toFixed(1)}%`;
    ctx.fillText(pctTxt, w * 0.045, botY2);
    const pctW = ctx.measureText(pctTxt).width;   // measure while the percentage's own font is still active
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.05)}px ${MONO}`;
    ctx.fillText(`${d.years[yi]}년`, w * 0.045 + pctW + 14, botY2);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage);
    let view = "year", basis = "standard", year = d.years[d.years.length - 1], t0 = performance.now(), tGrow = performance.now(), hover = null;
    KF.segment(controls, [{ id: "year", label: "연도별" }, { id: "firm", label: "기업 규모별" }], "year", (id) => { view = id; tGrow = performance.now(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "·"; controls.appendChild(sep);
    KF.segment(controls, [{ id: "standard", label: "시작일 기준" }, { id: "cohort", label: "출생아 기준" }], "standard", (id) => { basis = id; tGrow = performance.now(); });
    const range = document.createElement("input");
    range.type = "range"; range.min = d.years[0]; range.max = d.years[d.years.length - 1]; range.step = 1; range.value = year;
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
      const elGrow = (performance.now() - tGrow) / 1000, grow = KF.ease(KF.clamp(elGrow / 1.1, 0, 1));
      if (view === "year") {
        const yi = d.years.indexOf(year);
        const B = d[basis], basisLab = basis === "standard" ? "시작일 기준" : "출생아 기준";
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 15}px ${SERIF}`;
        ctx.fillText(`${year}년 · 육아휴직 서류함 (${basisLab})`, full ? 26 : 14, full ? 32 : 24);
        const top = full ? 74 : 88;
        const res = scene(ctx, full ? 500 : 1000, full ? 26 : 14, top, w - (full ? 52 : 28), h - top - (full ? 74 : 92), B.dad[yi], B.mom[yi], grow, hover, full, full ? "색인탭 1개 = 500명" : "색인탭 1개 = 1,000명");
        const by = h - (full ? 42 : 66);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9.5}px ${MONO}`; ctx.textAlign = "left";
        const other = basis === "standard" ? d.cohort : d.standard, otherLab = basis === "standard" ? "출생아" : "시작일";
        ctx.fillText(full
          ? `아빠 몫 ${B.share[yi].toFixed(1)}% (${otherLab} 기준으로는 ${other.share[yi].toFixed(1)}%) · ${d.ctx.y0}→${d.ctx.y1}년 ${d.ctx.sShare0.toFixed(1)}%→${d.ctx.sShare1.toFixed(1)}%(시작일)`
          : `아빠 몫 ${B.share[yi].toFixed(1)}% (${otherLab} 기준 ${other.share[yi].toFixed(1)}%)`, full ? 26 : 14, by, w - 40);
        if (res.hit && hover) {
          const lines = res.hit === "dad" ? [["아빠 (파랑)", 1], [`${year}년 육아휴직 ${KF.fmt(B.dad[yi])}명 중`, 0], [basisLab, 2]] : [["엄마 (분홍)", 1], [`${year}년 육아휴직 ${KF.fmt(B.mom[yi])}명 중`, 0], [basisLab, 2]];
          tip(ctx, w, h, lines, hover);
        }
      } else {
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 15}px ${SERIF}`;
        ctx.fillText(`${d.firm.year}년 · 기업 규모별 서류함 (출생아 기준)`, full ? 26 : 14, full ? 32 : 24);
        const labels = d.firm.labels;
        const top = full ? 70 : 78;
        const areaH = h - top - (full ? 40 : 30);
        const cols = full ? labels.length : 2;
        const rows = Math.ceil(labels.length / cols);
        const cw = (w - (full ? 52 : 28)) / cols - 12, ch = areaH / rows - 14;
        let hit = null;
        labels.forEach((labText, i) => {
          const cx = (full ? 26 : 14) + (i % cols) * (cw + 12), cy = top + Math.floor(i / cols) * (ch + 14);
          const r = scene(ctx, full ? 100 : 200, cx, cy + ch * 0.1, cw, ch * 0.72, d.firm.dad[i], d.firm.mom[i], grow, hover, full, null, full);
          ctx.fillStyle = INK; ctx.font = `700 ${full ? 12 : 10.5}px ${SANS}`; ctx.textAlign = "center";
          ctx.fillText(`${labText} · 아빠 ${d.firm.share[labText].toFixed(1)}%`, cx + cw / 2, cy + ch + 6);
          if (r.hit) hit = { side: r.hit, lab: labText };
        });
        if (hit && hover) {
          const lines = hit.side === "dad" ? [["아빠 (파랑)", 1], [hit.lab, 0]] : [["엄마 (분홍)", 1], [hit.lab, 0]];
          tip(ctx, w, h, lines, hover);
        }
      }
    });
  }

  VIZ["paternity-leave"] = { thumb, mount, bg: BG };
})();
