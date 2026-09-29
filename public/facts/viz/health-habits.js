// 57 health-habits — "줄자 고리 & 담뱃갑 눈금". A cigarette pack (20 slots) fills with the smoking rate;
// a tailor's tape measure, laid out in a gentle wave with cm ticks, carries a sliding pin at the obesity
// rate. Same people, same years, opposite directions — a single habit cannot stand for "healthier."
(() => {
  const BG = "#d7e4cf";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#22331f", DIM = "rgba(34,51,31,.64)", FAINT = "rgba(34,51,31,.16)";
  const PACK = "#e9e4d6", PACKD = "#c9c0a4", CIG = "#faf8f2", FILTER = "#c97a3f", ASH = "rgba(34,51,31,.16)";
  const TAPE = "#e3b33a", TAPED = "#b8871f", PIN = "#b5303f";
  const SMOKE_C = "#7a4a2f", OBESE_C = "#b5303f", DRINK_C = "#4a6a8a";
  const TIPDIM = "rgba(250,248,242,.68)"; // muted text *inside* the dark tooltip box (DIM is for the light page bg)

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    DEC = { ...d };
    return DEC;
  }

  // ---------------------------------------------------------------- cigarette pack gauge
  function pack(ctx, box, pct, hoverCig) {
    const [x, y, w, h] = box;
    ctx.save();
    ctx.fillStyle = PACK; ctx.strokeStyle = PACKD; ctx.lineWidth = 2;
    const r = 8;
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill(); ctx.stroke();

    const cols = 4, rows = 5, pad = w * 0.1, gw = w - pad * 2, gh = h * 0.74;
    const cw = gw / cols, ch = gh / rows, gx = x + pad, gy = y + h * 0.2;
    const exact = (pct / 100) * 20, full = Math.floor(exact), part = exact - full;
    let hit = null;
    for (let i = 0; i < 20; i++) {
      const c = i % cols, rIdx = Math.floor(i / cols);
      const cx = gx + c * cw + cw * 0.5, cy = gy + rIdx * ch + ch * 0.5;
      const cW = cw * 0.5, cH = ch * 0.68;
      const lit = i < full || (i === full && part > 0.08);
      const frac = i < full ? 1 : i === full ? part : 0;
      ctx.fillStyle = lit ? CIG : "rgba(255,255,255,.5)";
      ctx.fillRect(cx - cW / 2, cy - cH / 2, cW, cH * (1 - frac * 0.001)); // body
      if (lit) {
        ctx.fillStyle = FILTER; ctx.fillRect(cx - cW / 2, cy + cH / 2 - cH * 0.22, cW, cH * 0.22 * frac + (frac >= 1 ? 0 : 0));
        ctx.fillStyle = FILTER; ctx.globalAlpha = 0.35 + 0.65 * frac; ctx.fillRect(cx - cW / 2, cy + cH / 2 - cH * 0.22, cW, cH * 0.22); ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = "rgba(34,51,31,.22)"; ctx.lineWidth = 1; ctx.strokeRect(cx - cW / 2, cy - cH / 2, cW, cH);
      if (hoverCig === i) { ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(cx - cW / 2 - 1, cy - cH / 2 - 1, cW + 2, cH + 2); }
    }
    ctx.fillStyle = INK; ctx.font = `700 ${Math.min(w, h) * 0.09}px ${SANS}`; ctx.textAlign = "center";
    ctx.fillText("흡연", x + w / 2, y + h * 0.13);
    ctx.restore();
    return { gx, gy, cw, ch, cols, rows };
  }
  function packHit(g, box, px, py) {
    const c = Math.floor((px - g.gx) / g.cw), r = Math.floor((py - g.gy) / g.ch);
    if (c < 0 || c >= g.cols || r < 0 || r >= g.rows) return null;
    return r * g.cols + c;
  }

  // ---------------------------------------------------------------- tape measure gauge
  function tape(ctx, box, pct, hoverOn) {
    const [x, y, w, h] = box, midY = y + h * 0.52, amp = h * 0.1;
    const lo = 0, hi = 55;
    const px = (v) => x + w * 0.06 + (w * 0.88) * (v / hi);
    const py = (v) => midY + Math.sin((v / hi) * Math.PI * 2.3) * amp;
    ctx.save();
    ctx.strokeStyle = TAPED; ctx.lineWidth = h * 0.16; ctx.lineCap = "round";
    ctx.beginPath();
    for (let v = lo; v <= hi; v += 1) { const xx = px(v), yy = py(v); v ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
    ctx.strokeStyle = TAPE; ctx.lineWidth = h * 0.13;
    ctx.beginPath();
    for (let v = lo; v <= hi; v += 1) { const xx = px(v), yy = py(v); v ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
    // ticks
    ctx.strokeStyle = "rgba(34,51,31,.55)"; ctx.lineWidth = 1; ctx.font = `600 ${h * 0.07}px ${MONO}`; ctx.fillStyle = DIM; ctx.textAlign = "center";
    for (let v = 0; v <= hi; v += 10) {
      const xx = px(v), yy = py(v);
      ctx.beginPath(); ctx.moveTo(xx, yy - h * 0.07); ctx.lineTo(xx, yy + h * 0.07); ctx.stroke();
      ctx.fillText(String(v), xx, yy + h * 0.22);
    }
    // pin at value
    const vx = px(pct), vy = py(pct);
    ctx.fillStyle = hoverOn ? "#fff" : PIN; ctx.beginPath(); ctx.arc(vx, vy, h * 0.1, 0, 7); ctx.fill();
    ctx.strokeStyle = PIN; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = INK; ctx.font = `700 ${h * 0.1}px ${SANS}`; ctx.textAlign = "left";
    ctx.fillText("", 0, 0);
    ctx.textAlign = "center"; ctx.font = `700 ${Math.min(w, h) * 0.09}px ${SANS}`;
    ctx.fillText("비만", x + w / 2, y + h * 0.13);
    ctx.restore();
    return { vx, vy, r: h * 0.13 };
  }

  function trend(ctx, x0, x1, yLo, yHi, lo, hi, years, vals, color, dashed, full) {
    // yLo = pixel y for value `lo` (chart bottom), yHi = pixel y for value `hi` (chart top)
    const xs = (yr) => x0 + (x1 - x0) * ((yr - years[0]) / (years[years.length - 1] - years[0]));
    const ys = (v) => yLo - ((v - lo) / (hi - lo)) * (yLo - yHi);
    ctx.save();
    if (dashed) ctx.setLineDash([4, 4]);
    ctx.beginPath();
    years.forEach((yr, i) => { const xx = xs(yr), yy = ys(vals[i]); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); });
    ctx.strokeStyle = color; ctx.lineWidth = full ? 2.4 : 2; ctx.lineJoin = "round"; ctx.stroke();
    ctx.restore();
    const x0v = xs(years[0]), y0v = ys(vals[0]), x1v = xs(years[years.length - 1]), y1v = ys(vals[vals.length - 1]);
    ctx.beginPath(); ctx.arc(x0v, y0v, 2.6, 0, 7); ctx.fillStyle = color; ctx.fill();
    ctx.beginPath(); ctx.arc(x1v, y1v, 3.2, 0, 7); ctx.fillStyle = color; ctx.fill();
    return { xs, ys, start: [x0v, y0v], end: [x1v, y1v] };
  }

  function tip(ctx, w, h, lines, p) {
    ctx.font = `600 12px ${SANS}`;
    const bw = Math.max(...lines.map((l) => ctx.measureText(l[0]).width)) + 22, bh = 10 + lines.length * 17;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6);
    const by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(34,51,31,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || "#faf8f2"; ctx.font = `${i ? 500 : 700} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 16 + i * 17); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const D = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const y = D.years[D.years.length - 1];
    // keep clear of the board's top-left badge (~90x36px) and bottom-left glyph box (~50x50px)
    const packTop = Math.max(44, h * 0.2);
    pack(ctx, [w * 0.04, packTop, w * 0.4, h * 0.56], D.smoke[y].total, null);
    tape(ctx, [w * 0.47, packTop, w * 0.5, h * 0.45], D.obese[y].total, false);
    const capX = Math.max(w * 0.16, 64);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.06)}px ${SANS}`;
    ctx.fillText(`흡연 ${D.smoke[y].total.toFixed(0)}%  ·  비만 ${D.obese[y].total.toFixed(0)}%`, capX, h * 0.86);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.045)}px ${SANS}`;
    ctx.fillText(`${y}년`, capX, h * 0.96);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    let year = D.picks[D.picks.length - 1], sex = "total", hover = null;
    KF.segment(controls, D.picks.map((y) => ({ id: y, label: `${y}년` })), year, (id) => { year = +id; });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "·"; controls.appendChild(sep);
    KF.segment(controls, [{ id: "total", label: "전체" }, { id: "male", label: "남자" }, { id: "female", label: "여자" }], sex, (id) => { sex = id; });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    let packG = null, packBox = null, tapeG = null;

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const sVal = D.smoke[year][sex], oVal = D.obese[year][sex];

      const topH = full ? h * 0.42 : h * 0.38;
      packBox = full ? [w * 0.04, 14, w * 0.28, topH] : [w * 0.05, 10, w * 0.42, topH];
      const tapeBox = full ? [w * 0.36, 14, w * 0.6, topH * 0.82] : [w * 0.5, 10, w * 0.46, topH * 0.82];
      packG = pack(ctx, packBox, sVal, null);
      tapeG = tape(ctx, tapeBox, oVal, false);

      // hover detection
      let hoverCig = null, hoverPin = false;
      if (hover) {
        const hc = packHit(packG, packBox, hover[0], hover[1]);
        if (hc != null && hc < Math.ceil((sVal / 100) * 20)) hoverCig = hc;
        if (Math.hypot(hover[0] - tapeG.vx, hover[1] - tapeG.vy) < tapeG.r + 6) hoverPin = true;
      }
      if (hoverCig != null) pack(ctx, packBox, sVal, hoverCig);
      if (hoverPin) tape(ctx, tapeBox, oVal, true);

      // readouts (caption line, then a clear gap, then the big number)
      const capY = packBox[1] + topH + (full ? 16 : 12), numY = capY + (full ? 34 : 26);
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 ${full ? 12 : 10}px ${SANS}`;
      ctx.fillText(`${year}년 · ${sex === "total" ? "전체" : sex === "male" ? "남자" : "여자"} 현재흡연율`, packBox[0], capY);
      ctx.fillText(`${year}년 · 비만 유병률`, tapeBox[0], capY);
      ctx.fillStyle = INK; ctx.font = `700 ${full ? 26 : 18}px ${MONO}`;
      ctx.fillText(`${sVal.toFixed(1)}%`, packBox[0], numY);
      ctx.fillText(`${oVal.toFixed(1)}%`, tapeBox[0], numY);

      // trend chart: give it essentially all the leftover height, scaled to the data (not a fixed 0-80).
      const tx0 = full ? w * 0.06 : 44, tx1 = w - (full ? 36 : 14);
      const headerY = numY + (full ? 34 : 26);
      const legendY = headerY + (full ? 20 : 16);
      const bottomPad = full ? 26 : 22; // room for the x-axis year ticks
      const chartTop = legendY + (full ? 26 : 20);
      const chartBottom = h - bottomPad;
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 ${full ? 12 : 10}px ${SANS}`;
      ctx.fillText(`${D.years[0]}–${D.years[D.years.length - 1]}년 추세 (성별: ${sex === "total" ? "전체" : sex === "male" ? "남자" : "여자"})`, tx0, headerY);
      ctx.font = `500 ${full ? 10.5 : 9.5}px ${SANS}`;
      ctx.fillStyle = SMOKE_C; ctx.fillText("─ 흡연율", tx0, legendY);
      ctx.fillStyle = OBESE_C; ctx.fillText("─ 비만율", tx0 + 66, legendY);
      if (sex === "total") { ctx.fillStyle = DRINK_C; ctx.fillText("╌ 고위험음주율", tx0 + 132, legendY); }

      const sVals = D.years.map((y) => D.smoke[y][sex]);
      const oVals = D.years.map((y) => D.obese[y][sex]);
      const allVals = sVals.concat(oVals).concat(sex === "total" ? D.drink.total : []);
      const dataMax = Math.max(...allVals);
      const hiScale = Math.max(20, Math.ceil((dataMax + 4) / 10) * 10); // fit the data, e.g. 0-50, not a fixed 0-80
      const loScale = 0;
      // y gridlines, scaled to the data
      ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.textAlign = "right"; ctx.font = `500 ${full ? 9.5 : 8.5}px ${MONO}`; ctx.fillStyle = DIM;
      for (let v = 0; v <= hiScale; v += hiScale > 40 ? 10 : 5) {
        const yy = chartBottom - ((v - loScale) / (hiScale - loScale)) * (chartBottom - chartTop);
        ctx.beginPath(); ctx.moveTo(tx0, yy); ctx.lineTo(tx1, yy); ctx.stroke();
        ctx.fillText(`${v}%`, tx0 - 6, yy + 3);
      }
      const sT = trend(ctx, tx0, tx1, chartBottom, chartTop, loScale, hiScale, D.years, sVals, SMOKE_C, false, full);
      const oT = trend(ctx, tx0, tx1, chartBottom, chartTop, loScale, hiScale, D.years, oVals, OBESE_C, false, full);
      if (sex === "total") trend(ctx, tx0, tx1, chartBottom, chartTop, loScale, hiScale, D.drink.years, D.drink.total, DRINK_C, true, full);

      // start/end value labels for each line — offset away from the other line so they never collide
      const lblFont = `700 ${full ? 11.5 : 10}px ${MONO}`;
      const labelPoint = ([px, py], otherPy, v, color, align) => {
        const above = py < otherPy; // this line sits higher on screen at this x
        ctx.textAlign = align; ctx.font = lblFont; ctx.fillStyle = color;
        ctx.fillText(`${v.toFixed(1)}%`, px + (align === "left" ? 8 : -8), py + (above ? -8 : 16));
      };
      labelPoint(sT.start, oT.start[1], sVals[0], SMOKE_C, "left");
      labelPoint(oT.start, sT.start[1], oVals[0], OBESE_C, "left");
      labelPoint(sT.end, oT.end[1], sVals[sVals.length - 1], SMOKE_C, "right");
      labelPoint(oT.end, sT.end[1], oVals[oVals.length - 1], OBESE_C, "right");

      // crossing point: where the two lines swap order (if they do, for this sex)
      let cross = null;
      for (let i = 0; i < D.years.length - 1 && !cross; i++) {
        const d0 = sVals[i] - oVals[i], d1 = sVals[i + 1] - oVals[i + 1];
        if (d0 === 0) cross = { yr: D.years[i], v: sVals[i] };
        else if ((d0 < 0) !== (d1 < 0)) {
          const t = d0 / (d0 - d1), yr = D.years[i] + (D.years[i + 1] - D.years[i]) * t;
          cross = { yr, v: sVals[i] + (sVals[i + 1] - sVals[i]) * t };
        }
      }
      if (cross) {
        const cx = tx0 + (tx1 - tx0) * ((cross.yr - D.years[0]) / (D.years[D.years.length - 1] - D.years[0]));
        const cy = chartBottom - ((cross.v - loScale) / (hiScale - loScale)) * (chartBottom - chartTop);
        ctx.setLineDash([2, 3]); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, chartTop); ctx.lineTo(cx, chartBottom); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(cx, cy, 3.4, 0, 7); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 11 : 9.5}px ${SANS}`;
        ctx.fillText(`교차 ${Math.round(cross.yr)}년경`, cx, chartTop - (full ? 8 : 6));
      }

      // x-axis: every actual survey year gets a tick, endpoints labelled
      ctx.strokeStyle = FAINT; ctx.lineWidth = 1;
      D.years.forEach((yr) => { const xx = tx0 + (tx1 - tx0) * ((yr - D.years[0]) / (D.years[D.years.length - 1] - D.years[0])); ctx.beginPath(); ctx.moveTo(xx, chartBottom); ctx.lineTo(xx, chartBottom + 4); ctx.stroke(); });
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10 : 9}px ${MONO}`; ctx.textAlign = "left";
      ctx.fillText(String(D.years[0]), tx0, chartBottom + (full ? 18 : 16));
      ctx.textAlign = "right"; ctx.fillText(String(D.years[D.years.length - 1]), tx1, chartBottom + (full ? 18 : 16));

      if (hoverCig != null) tip(ctx, w, h, [[`담배 ${hoverCig + 1}/20 개비`], [`5%p 단위 눈금`, TIPDIM]], hover);
      else if (hoverPin) tip(ctx, w, h, [[`${year}년 · 비만 유병률`], [`${oVal.toFixed(1)}%`, OBESE_C]], hover);
    });
  }

  VIZ["health-habits"] = { thumb, mount, bg: BG };
})();
