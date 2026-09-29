// 83 rail-passengers — "두 철로 위 열차 편성". 두 개의 나란한 철로: 위는 고속계열(KTX·고속철도),
// 아래는 일반열차(새마을·무궁화·통근). 편성 길이 = 그해 수송량(지수 또는 실제량). 슬라이더로 연도를
// 넘기면 두 열차가 늘었다 줄었다 하며 서로 다른 방향으로 간다. 일반열차 칸은 세 열차종의 몫대로 물든다.
(() => {
  const BG = "#8fabc0";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#12212f", MUTE = "rgba(18,33,47,.66)", FAINT = "rgba(18,33,47,.2)";
  const RAIL = "#2c3b47", TIE = "rgba(18,33,47,.35)", BALLAST = "rgba(18,33,47,.12)";
  const HI = "#0f5da3", HI_DARK = "#0a3f70";
  const PART = [["새마을", "#c9862c"], ["무궁화", "#7c426b"], ["통근", "#1f7d68"]];
  const GEN_DARK = "#4a2f42";

  let DEC = null;
  function decode(d) {
    if (DEC && DEC.d === d) return DEC;
    const maxIdx = Math.max(...d.series.flatMap((s) => s.index));
    const maxVal = Math.max(...d.series.flatMap((s) => s.values));
    const byYear = new Map(d.series.map((s) => [s.year, s]));
    return (DEC = { d, maxIdx, maxVal, years: d.series.map((s) => s.year), byYear });
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, h / 2, Math.max(0, w) / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function seams(ctx, bx, bw, y, ch) {
    ctx.strokeStyle = "rgba(255,255,255,.38)"; ctx.lineWidth = 1;
    for (let cx = bx + 15; cx < bx + bw - 3; cx += 15) { ctx.beginPath(); ctx.moveTo(cx, y - ch * 0.38); ctx.lineTo(cx, y + ch * 0.38); ctx.stroke(); }
  }

  // single-colour train (고속계열)
  function trainSolid(ctx, x0, y, L, ch, color, dark) {
    const locoW = ch * 0.95;
    ctx.fillStyle = dark; roundRect(ctx, x0, y - ch / 2, locoW, ch, 4); ctx.fill();
    ctx.fillStyle = "#ffe27a"; ctx.beginPath(); ctx.arc(x0 + locoW - 5, y, 2.4, 0, 7); ctx.fill();
    const bx = x0 + locoW + 3, bw = Math.max(0, L - locoW - 3);
    ctx.fillStyle = color; roundRect(ctx, bx, y - ch * 0.42, bw, ch * 0.84, 3); ctx.fill();
    seams(ctx, bx, bw, y, ch);
    return { x0, x1: bx + bw, top: y - ch / 2, bottom: y + ch / 2 };
  }
  // mixed train (일반열차): body split into coloured blocks by sub-share
  function trainMixed(ctx, x0, y, L, ch, shares) {
    const locoW = ch * 0.95;
    ctx.fillStyle = GEN_DARK; roundRect(ctx, x0, y - ch / 2, locoW, ch, 4); ctx.fill();
    ctx.fillStyle = "#ffe27a"; ctx.beginPath(); ctx.arc(x0 + locoW - 5, y, 2.4, 0, 7); ctx.fill();
    const bx = x0 + locoW + 3, bw = Math.max(0, L - locoW - 3);
    let cx = bx; const segs = [];
    shares.forEach(([name, color, share]) => {
      const w = bw * (share / 100);
      if (w > 0.4) { ctx.fillStyle = color; ctx.fillRect(cx, y - ch * 0.42, w, ch * 0.84); }
      segs.push({ x0: cx, x1: cx + w, name, share, color });
      cx += w;
    });
    seams(ctx, bx, bw, y, ch);
    return { x0, x1: bx + bw, top: y - ch / 2, bottom: y + ch / 2, segs };
  }

  // thin rail line, drawn clearly BELOW the train body (never overlapping its height) so an unreached
  // stretch of track reads as bare rail, not as more train.
  function track(ctx, x0, x1, y) {
    ctx.strokeStyle = BALLAST; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.strokeStyle = TIE; ctx.lineWidth = 2;
    for (let x = x0; x < x1; x += 11) { ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke(); }
    ctx.strokeStyle = RAIL; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x0, y - 4); ctx.lineTo(x1, y - 4); ctx.moveTo(x0, y + 4); ctx.lineTo(x1, y + 4); ctx.stroke();
  }

  function timeline(ctx, x0, y0, w, h, X, mode, selYear, hover) {
    const yrs = X.years, bw = w / yrs.length, mx = mode === "index" ? X.maxIdx : X.maxVal;
    let hit = null;
    [0, 1].forEach((si) => {
      const base = y0 + si * (h / 2 + 4), rh = h / 2 - 8;
      ctx.strokeStyle = FAINT; ctx.beginPath(); ctx.moveTo(x0, base + rh); ctx.lineTo(x0 + w, base + rh); ctx.stroke();
      yrs.forEach((yr, i) => {
        const s = X.byYear.get(yr), v = mode === "index" ? s.index[si] : s.values[si];
        const bh = (v / mx) * rh, x = x0 + i * bw;
        const on = yr === selYear;
        ctx.fillStyle = si === 0 ? (on ? HI : "rgba(15,93,163,.45)") : (on ? PART[1][1] : "rgba(124,66,107,.4)");
        ctx.fillRect(x + bw * 0.22, base + rh - bh, bw * 0.56, Math.max(1.5, bh));
        if (on) { ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(x + bw * 0.22 - 1, base + rh - bh - 1, bw * 0.56 + 2, Math.max(1.5, bh) + 2); }
        if (hover && hover[0] >= x && hover[0] < x + bw && hover[1] >= y0 - 4 && hover[1] < y0 + h + 4) hit = yr;
      });
    });
    ctx.textAlign = "center"; ctx.fillStyle = MUTE; ctx.font = `500 9.5px ${MONO}`;
    yrs.forEach((yr, i) => { if (i % 1 === 0) ctx.fillText(`'${String(yr).slice(2)}`, x0 + i * bw + bw / 2, y0 + h + 12); });
    ctx.textAlign = "left";
    return hit;
  }

  function fmtVal(v, mode) { return mode === "index" ? v.toFixed(1) : `${(v / 1e4).toFixed(0)}만 명`; }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const X = decode(d), c = t % 10, s = X.d.series[X.d.series.length - 1];
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const prog = KF.ease(KF.clamp((c - 0.3) / 1.8, 0, 1));
    const x0 = w * 0.07, Lmax = w * 0.62;
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`;
    ctx.fillText(`${s.year}년, 반대로 간 두 철도`, x0, h * 0.29);
    const y1 = h * 0.42, y2 = h * 0.74, ch = h * 0.16;
    trainSolid(ctx, x0, y1, Lmax * (s.index[0] / X.maxIdx) * prog, ch, HI, HI_DARK);
    trainMixed(ctx, x0, y2, Lmax * (s.index[1] / X.maxIdx) * prog, ch, PART.map(([n, c2], i) => [n, c2, (s.parts[i] / s.values[1]) * 100]));
    ctx.textAlign = "right"; ctx.fillStyle = HI_DARK; ctx.font = `800 ${Math.round(h * 0.09)}px ${SANS}`;
    ctx.fillText(`고속계열 ${s.index[0].toFixed(0)}`, w - x0 * 0.6, y1 - ch * 0.75);
    ctx.fillStyle = GEN_DARK; ctx.fillText(`일반열차 ${s.index[1].toFixed(0)}`, w - x0 * 0.6, y2 - ch * 0.75);
    ctx.fillStyle = MUTE; ctx.font = `500 ${Math.round(h * 0.042)}px ${SANS}`;
    ctx.fillText("2019=100", w - x0 * 0.6, y2 + ch * 1.05);
    if (c > 9.3) { ctx.fillStyle = `rgba(143,171,192,${(c - 9.3) / 0.7})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage);
    let mode = "index", selYear = X.years[X.years.length - 1], t0 = performance.now(), hover = null, geoTrains = [];
    KF.segment(controls, [{ id: "index", label: "지수 (2019=100)" }, { id: "value", label: "실제 수송량" }], mode, (id) => { mode = id; t0 = performance.now(); });
    const range = document.createElement("input");
    range.type = "range"; range.min = X.years[0]; range.max = X.years[X.years.length - 1]; range.step = 1; range.value = selYear;
    const lab = document.createElement("label"); lab.append("연도 ", range);
    controls.appendChild(lab);
    range.oninput = () => { selYear = +range.value; t0 = performance.now() - 5000; };
    const onMove = (e) => { const b = stage.getBoundingClientRect(); hover = [e.clientX - b.left, e.clientY - b.top]; };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", () => { hover = null; });
    stage.addEventListener("pointerdown", (e) => {
      onMove(e);
      const hitYear = lastTimelineHit;
      if (hitYear) { selYear = hitYear; range.value = hitYear; t0 = performance.now() - 5000; }
    });
    let lastTimelineHit = null;

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const sYear = X.byYear.get(selYear);
      const chgH = ((X.byYear.get(X.years[X.years.length - 1]).index[0] / 100) - 1) * 100;
      const chgG = ((X.byYear.get(X.years[X.years.length - 1]).index[1] / 100) - 1) * 100;
      const el = KF.ease(KF.clamp(((performance.now() - t0) / 1000 - 0.1) / 1.0, 0, 1));

      // stretch factor: the 16:9 / 4:5 stage is taller than this layout's original tuning, so every
      // vertical gap below scales with V to fill the card instead of leaving the lower third blank.
      const V = full ? KF.clamp(h / 386, 1, 1.75) : KF.clamp(h / 280, 1, 1.85);
      const x0 = full ? 34 : 14, top0 = full ? 30 : 20;
      ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 11 : 9.5}px ${MONO}`;
      ctx.fillText("TWO RAILS · 2016–2024", x0, top0);
      ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 14}px ${SANS}`;
      ctx.fillText("두 철로, 다른 도착", x0, top0 + (full ? 26 : 19));
      ctx.font = `600 ${full ? 11 : 9.5}px ${SANS}`; ctx.fillStyle = MUTE;
      const by = top0 + (full ? 58 : 40) * V;
      ctx.fillText(`${X.d.baseYear}→${X.years[X.years.length - 1]} 고속계열`, x0, by);
      ctx.fillText(`${X.d.baseYear}→${X.years[X.years.length - 1]} 일반열차`, x0 + (full ? 190 : 130), by);
      ctx.font = `800 ${full ? 22 : 16}px ${SANS}`;
      ctx.fillStyle = HI_DARK; ctx.fillText(`${chgH >= 0 ? "+" : ""}${chgH.toFixed(1)}%`, x0, by + (full ? 26 : 19));
      ctx.fillStyle = GEN_DARK; ctx.fillText(`${chgG >= 0 ? "+" : ""}${chgG.toFixed(1)}%`, x0 + (full ? 190 : 130), by + (full ? 26 : 19));

      const tlY = by + (full ? 48 : 34) * V, tlH = (full ? 64 : 46) * V;
      lastTimelineHit = timeline(ctx, x0, tlY, full ? Math.min(560, w * 0.56) : w - x0 * 2, tlH, X, mode, selYear, hover);

      const trackX0 = x0, trackW = full ? Math.min(560, w * 0.56) - 90 : w - x0 * 2 - 70;
      const y1 = tlY + tlH + (full ? 60 : 44) * V, y2 = y1 + (full ? 66 : 48) * V;
      const ch = (full ? 22 : 15) * Math.min(V, 1.7), Lmax = trackW;
      track(ctx, trackX0, trackX0 + trackW, y1 + ch * 0.5 + 7);
      track(ctx, trackX0, trackX0 + trackW, y2 + ch * 0.5 + 7);
      const refMax = mode === "index" ? X.maxIdx : X.maxVal;
      const L1 = Lmax * (mode === "index" ? sYear.index[0] : sYear.values[0]) / refMax * KF.lerp(0.4, 1, el);
      const L2 = Lmax * (mode === "index" ? sYear.index[1] : sYear.values[1]) / refMax * KF.lerp(0.4, 1, el);
      const g1 = trainSolid(ctx, trackX0, y1, Math.max(ch, L1), ch, HI, HI_DARK);
      const shares = PART.map(([n, c2], i) => [n, c2, (sYear.parts[i] / sYear.values[1]) * 100]);
      const g2 = trainMixed(ctx, trackX0, y2, Math.max(ch, L2), ch, shares);
      geoTrains = [{ ...g1, label: X.d.names[0], year: selYear, val: mode === "index" ? sYear.index[0] : sYear.values[0] }, { ...g2, label: X.d.names[1], year: selYear, val: mode === "index" ? sYear.index[1] : sYear.values[1] }];

      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 12.5 : 11}px ${SANS}`;
      ctx.fillText(`${X.d.names[0]} · ${selYear}`, trackX0, y1 - ch - 4);
      ctx.fillText(`${X.d.names[1]} · ${selYear}`, trackX0, y2 - ch - 4);
      ctx.textAlign = "right"; ctx.font = `700 ${full ? 14 : 12}px ${MONO}`;
      ctx.fillStyle = HI_DARK; ctx.fillText(fmtVal(mode === "index" ? sYear.index[0] : sYear.values[0], mode), trackX0 + trackW + 78, y1 + 4);
      ctx.fillStyle = GEN_DARK; ctx.fillText(fmtVal(mode === "index" ? sYear.index[1] : sYear.values[1], mode), trackX0 + trackW + 78, y2 + 4);
      ctx.textAlign = "left";

      // sub-composition legend
      const legY = y2 + (full ? 36 : 28) * V;
      ctx.font = `500 ${full ? 10.5 : 9}px ${SANS}`;
      let lx = trackX0;
      PART.forEach(([n, c2], i) => {
        ctx.fillStyle = c2; ctx.fillRect(lx, legY - 8, 10, 10);
        ctx.fillStyle = MUTE; ctx.fillText(`${n} ${sYear.parts[i] ? (sYear.parts[i] / sYear.values[1] * 100).toFixed(0) : 0}%`, lx + 14, legY);
        lx += full ? 92 : 68;
      });

      if (full) {
        const px = trackX0 + trackW + 110, pw = w - px - 24;
        const rowH = 22 * V, topPad = 40 * V;
        ctx.fillStyle = INK; ctx.font = `700 12.5px ${SANS}`; ctx.fillText(`역별 승차 상위 (${X.d.stationYear}년)`, px, topPad);
        const mx = X.d.stations[0].value;
        X.d.stations.slice(0, 6).forEach((st, i) => {
          const yy = topPad + 22 + i * rowH, bw = (st.value / mx) * (pw - 70);
          ctx.fillStyle = "rgba(18,33,47,.65)"; ctx.fillRect(px, yy, Math.max(2, bw), 12);
          ctx.fillStyle = INK; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(st.name, px + bw + 6, yy + 10);
          ctx.textAlign = "right"; ctx.font = `500 9.5px ${MONO}`; ctx.fillStyle = MUTE;
          ctx.fillText(`${(st.value / 1e4).toFixed(0)}만`, px + pw, yy + 10);
          ctx.textAlign = "left";
        });
        const noteY = topPad + 22 + 6 * rowH + 24 * V;
        ctx.fillStyle = MUTE; ctx.font = `500 10px ${SANS}`;
        wrap(ctx, `상위 ${X.d.topN}개 역이 이 파일 승차의 ${X.d.topShare.toFixed(1)}%.`, px, noteY, pw, 15);
        wrap(ctx, `역별 자료(${X.d.stationYear}년)는 같은 해 연간 수송자료와 집계 범위가 달라 곧바로 더하지 않는다.`, px, noteY + 32 * V, pw, 15);
      }

      if (hover) {
        const hit = geoTrains.find((g) => hover[0] >= g.x0 - 4 && hover[0] <= g.x1 + 4 && hover[1] >= g.top - 6 && hover[1] <= g.bottom + 6);
        if (hit) {
          const seg = hit.segs && hit.segs.find((sg) => hover[0] >= sg.x0 && hover[0] <= sg.x1);
          const lines = seg ? [[`${seg.name} · ${hit.year}`, 1], [`일반열차 안의 ${seg.share.toFixed(1)}%`, 0]]
            : [[`${hit.label} · ${hit.year}`, 1], [mode === "index" ? `지수 ${hit.val.toFixed(1)} (2019=100)` : `${KF.fmt(hit.val)}명`, 0]];
          tip(ctx, w, h, lines, hover);
        }
      }
    });
  }

  function wrap(ctx, text, x, y, maxW, lh) {
    const chars = [...text]; let line = "", yy = y;
    for (const ch of chars) { const t = line + ch; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = ch; yy += lh; } else line = t; }
    if (line) ctx.fillText(line, x, yy);
  }
  function tip(ctx, w, h, lines, hover) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : `500 11px ${MONO}`);
    const bw = Math.min(w - 16, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 14 + lines.length * 18;
    const bx = KF.clamp(hover[0] + 14, 8, w - bw - 8), by = KF.clamp(hover[1] - bh - 10, 8, h - bh - 8);
    ctx.fillStyle = "rgba(250,250,247,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + j * 18); });
  }

  VIZ["rail-passengers"] = { thumb, mount, bg: BG };
})();
