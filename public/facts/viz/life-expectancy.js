// 56 life-expectancy — "촛불 행렬". Three wax candles (남자·전체·여자); flame height above the table line =
// that year's 0세 기대수명 (life expectancy at birth). A dark soot band near the flame = years lived beyond
// WHO 건강수명(HALE) — the "그래도 남는 문제". A glowing ember trail along the base is the 1970-2024 series;
// 2022 gusts the flames sideways (the one year expectancy actually fell) before they recover.
(() => {
  const BG = "#1d140d";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#f2e8d5", DIM = "rgba(242,232,213,.6)", FAINT = "rgba(242,232,213,.16)";
  const WAX = "#efe3c9", WAXD = "#c9b78e", WICKC = "#241a10", SOOT = "rgba(58,49,38,.86)";
  const FLAME_IN = "#fff4d2", FLAME_MID = "#ffb44a", FLAME_OUT = "#ff7a3d";
  const CANDLES = [
    { key: "male", label: "남자", ribbon: "#5f8fae" },
    { key: "total", label: "전체", ribbon: "#b99a5a" },
    { key: "female", label: "여자", ribbon: "#c96a7f" },
  ];
  const AXIS_LO = 55, AXIS_HI = 90;
  const frac = (v) => KF.clamp((v - AXIS_LO) / (AXIS_HI - AXIS_LO), 0, 1);

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const idx = {};
    d.years.forEach((y, i) => (idx[y] = i));
    DEC = { ...d, idx };
    return DEC;
  }

  // ---------------------------------------------------------------- one candle
  function candle(ctx, cx, baseY, pxH, w, val, sootFrom, ribbon, flick, gust, label) {
    const hh = frac(val) * pxH, top = baseY - hh;
    const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    g.addColorStop(0, WAXD); g.addColorStop(0.48, WAX); g.addColorStop(1, WAXD);
    ctx.fillStyle = g;
    ctx.fillRect(cx - w / 2, top, w, hh);
    if (sootFrom != null) {
      const sTop = baseY - frac(sootFrom) * pxH;
      ctx.fillStyle = SOOT;
      ctx.fillRect(cx - w / 2, top, w, Math.max(0, sTop - top));
      ctx.fillStyle = "rgba(255,255,255,.14)";
      ctx.fillRect(cx - w / 2, Math.max(top, sTop) - 1, w, 1);
    }
    ctx.strokeStyle = "rgba(0,0,0,.1)"; ctx.lineWidth = 1;
    [-0.26, 0.26].forEach((k) => { ctx.beginPath(); ctx.moveTo(cx + k * w, top + 5); ctx.lineTo(cx + k * w, baseY - 1); ctx.stroke(); });
    ctx.fillStyle = ribbon;
    ctx.fillRect(cx - w / 2 - 1, top + hh * 0.16, w + 2, Math.max(3, w * 0.1));
    // wick + flame
    const sway = flick + gust * 8;
    ctx.strokeStyle = WICKC; ctx.lineWidth = Math.max(1.4, w * 0.045);
    ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx + sway * 0.4, top - 7); ctx.stroke();
    const fx = cx + sway, fy = top - 8, dim = 1 - gust * 0.55;
    const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, 27);
    glow.addColorStop(0, `rgba(255,170,90,${0.5 * dim})`); glow.addColorStop(1, "rgba(255,170,90,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(fx, fy, 27, 0, 7); ctx.fill();
    const fh = (15 + Math.sin(performance.now() / 140) * 1.6) * dim;
    const lean = sway * 0.5;
    ctx.beginPath(); ctx.moveTo(fx, fy - fh);
    ctx.bezierCurveTo(fx + 6 + lean, fy - fh * 0.5, fx + 5 + lean, fy - 2, fx, fy + 2);
    ctx.bezierCurveTo(fx - 5 + lean, fy - 2, fx - 6 + lean, fy - fh * 0.5, fx, fy - fh);
    ctx.closePath(); ctx.fillStyle = FLAME_OUT; ctx.fill();
    ctx.beginPath(); ctx.moveTo(fx, fy - fh * 0.6);
    ctx.bezierCurveTo(fx + 3.6 + lean * 0.6, fy - fh * 0.32, fx + 3 + lean * 0.6, fy - 1, fx, fy + 1);
    ctx.bezierCurveTo(fx - 3 + lean * 0.6, fy - 1, fx - 3.6 + lean * 0.6, fy - fh * 0.32, fx, fy - fh * 0.6);
    ctx.closePath(); ctx.fillStyle = FLAME_MID; ctx.fill();
    ctx.beginPath(); ctx.arc(fx + lean * 0.3, fy - fh * 0.28, 2.4, 0, 7); ctx.fillStyle = FLAME_IN; ctx.fill();
    // label under
    ctx.textAlign = "center"; ctx.fillStyle = DIM; ctx.font = `600 ${w > 30 ? 11.5 : 10}px ${SANS}`;
    ctx.fillText(label, cx, baseY + 16);
    ctx.fillStyle = INK; ctx.font = `700 ${w > 30 ? 15 : 12.5}px ${MONO}`;
    ctx.fillText(val.toFixed(1), cx, baseY + (w > 30 ? 34 : 29));
    return { cx, top, baseY, w };
  }

  function ember(ctx, x0, x1, y, D, hoverX, full) {
    const n = D.years.length, xs = (i) => x0 + (x1 - x0) * (i / (n - 1));
    const lo = Math.min(...D.total) - 1.2, hiV = Math.max(...D.total) + 0.6, span = full ? 34 : 24;
    const ys = (v) => y - ((v - lo) / (hiV - lo)) * span;
    ctx.beginPath();
    D.total.forEach((v, i) => { const xx = xs(i), yy = ys(v); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); });
    ctx.strokeStyle = "rgba(255,140,70,.85)"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.lineTo(x1, y); ctx.lineTo(x0, y); ctx.closePath();
    const g = ctx.createLinearGradient(0, y - span, 0, y);
    g.addColorStop(0, "rgba(255,140,70,.22)"); g.addColorStop(1, "rgba(255,140,70,0)");
    ctx.fillStyle = g; ctx.fill();
    const di = D.idx[D.dip.year];
    ctx.beginPath(); ctx.arc(xs(di), ys(D.total[di]), 2.6, 0, 7); ctx.fillStyle = "#ffd27a"; ctx.fill();
    ctx.strokeStyle = "rgba(255,210,122,.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xs(di), y); ctx.lineTo(xs(di), y + 4); ctx.stroke();
    let hi = null;
    if (hoverX != null) {
      let bi = 0, bd = 1e9;
      for (let i = 0; i < n; i++) { const d = Math.abs(xs(i) - hoverX); if (d < bd) { bd = d; bi = i; } }
      if (bd < 10) hi = bi;
    }
    if (hi != null) { ctx.beginPath(); ctx.arc(xs(hi), ys(D.total[hi]), 3, 0, 7); ctx.fillStyle = "#fff"; ctx.fill(); }
    return { x0, x1, y, xs, hover: hi };
  }

  function dotgrid(ctx, x, y, w, per1000, color, label, sub) {
    const cols = 20, rows = 5, gap = 2, cell = (w - gap * (cols - 1)) / cols;
    const exact = per1000 / 10, full = Math.floor(exact), part = exact - full;
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 10.5px ${SANS}`; ctx.fillText(label, x, y - 6);
    for (let i = 0; i < 100; i++) {
      const cx = x + (i % cols) * (cell + gap), cy = y + Math.floor(i / cols) * (cell + gap);
      ctx.globalAlpha = i < full ? 1 : i === full && part > 0.08 ? Math.max(0.3, part) : 1;
      ctx.fillStyle = i < full || (i === full && part > 0.08) ? color : "rgba(242,232,213,.15)";
      ctx.beginPath(); ctx.arc(cx + cell / 2, cy + cell / 2, cell / 2, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = INK; ctx.font = `700 12px ${MONO}`;
    ctx.fillText(sub, x, y + rows * (cell + gap) + 14);
    ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`;
    ctx.fillText("점 1개 = 10명 (부분 채움 = 소수점)", x, y + rows * (cell + gap) + 28);
  }

  function tip(ctx, w, h, lines, p) {
    ctx.font = `600 12px ${SANS}`;
    let bw = Math.max(...lines.map((l) => ctx.measureText(l[0]).width)) + 22;
    const bh = 10 + lines.length * 17;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6);
    const by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(20,14,9,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(242,232,213,.3)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = `${i ? 500 : 700} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 16 + i * 17); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const D = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, base = h * 0.82, pxH = h * 0.56;
    const yr = D.y1, i = D.idx[yr];
    const grow = KF.ease(KF.clamp((c - 0.3) / 1.6, 0, 1));
    // keep clear of the board's top-left badge (~90x36px): title baseline well below y=40, accounting for ascent
    const titleY = Math.max(58, h * 0.26);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.075)}px ${SANS}`;
    ctx.fillText("기대수명 촛불", w * 0.06, titleY);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText(`${D.y0}년 → ${D.y1}년`, w * 0.06, titleY + h * 0.1);
    // the flame height animates (pxH * grow), but the printed number must never be a fake in-between value —
    // always the true latest-year figure, with its own year tag right above the candles so it can't be read
    // as "today" by accident, whatever moment this thumb happens to be captured or paused at (incl. the
    // t=3.5 reduced-motion still frame, where grow is already 1 but this keeps the two facts visibly tied).
    const cw = Math.min(30, w * 0.09);
    ctx.textAlign = "center"; ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.042)}px ${MONO}`;
    ctx.fillText(`${yr}년 기준`, w * 0.52, base - pxH - 12);
    CANDLES.forEach((cc, k) => {
      const cx = w * (0.28 + k * 0.24);
      candle(ctx, cx, base, pxH * grow, cw, D[cc.key][i], null, cc.ribbon, Math.sin(performance.now() / 300 + k) * 1.1, 0, cc.label);
    });
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    let year = D.y1, showHale = true, hover = null, geo = { candles: [], ember: null };
    const t0 = performance.now();
    KF.segment(controls, D.picks.map((y) => ({ id: y, label: `${y}년` })), year, (id) => { year = +id; });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520, now = performance.now();
      const el = (now - t0) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const i = D.idx[year];
      const isLatest = year === D.y1;
      const isDip = year === D.dip.year;
      const base = full ? h * 0.66 : h * 0.56;
      const pxH = full ? h * 0.46 : h * 0.36;
      const cw = full ? 56 : 34;
      const cx0 = full ? w * 0.2 : w * 0.22;
      const spacing = full ? w * 0.15 : w * 0.16;
      const grow = KF.reduced ? 1 : KF.ease(KF.clamp(el / 1.1, 0, 1));
      geo.candles = [];
      CANDLES.forEach((cc, k) => {
        const cx = cx0 + k * spacing;
        const val = AXIS_LO + (D[cc.key][i] - AXIS_LO) * grow;
        const sootFrom = isLatest ? D.hale[cc.key === "total" ? "total1" : cc.key === "male" ? "male1" : "female1"] : null;
        const flick = Math.sin(now / 260 + k * 1.7) * 1.1 + Math.sin(now / 90 + k) * 0.4;
        const gust = isDip ? (0.55 + 0.45 * Math.sin(now / 200)) : 0;
        const box = candle(ctx, cx, base, pxH, cw, val, sootFrom, cc.ribbon, flick, gust, cc.label);
        geo.candles.push({ ...box, key: cc.key, val: D[cc.key][i] });
      });
      // caption
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
      ctx.fillText(`${year}년 태어난 아이의 기대수명`, full ? cx0 + spacing * 2 + 46 : 14, full ? 44 : 20);
      if (full) {
        const rx = cx0 + spacing * 2 + 46;
        ctx.fillStyle = DIM; ctx.font = `500 12.5px ${SANS}`;
        ctx.fillText(isDip ? "코로나19 시기 — 유일하게 전년보다 줄어든 해" : "0세가 앞으로 살 것으로 기대되는 햇수", rx, 66);
        if (isLatest) {
          ctx.fillStyle = "rgba(242,232,213,.85)"; ctx.font = `600 12.5px ${SANS}`;
          ctx.fillText(`어두운 밴드 = 건강수명(WHO, ${D.hale.y1}) 이후 · 유병 추정 기간`, rx, 88);
        }
        // sparkline timeline
        const sy = h - 52, sx0 = rx, sx1 = w - 30;
        ctx.fillStyle = DIM; ctx.font = `600 11.5px ${SANS}`;
        ctx.fillText(`${D.y0}–${D.y1}년 기대수명(전체) · 점 = ${D.dip.year}년`, sx0, sy - 40);
        geo.ember = ember(ctx, sx0, sx1, sy, D, hover && hover[1] > sy - 44 && hover[1] < sy + 14 ? hover[0] : null, true);
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${MONO}`; ctx.textAlign = "left";
        ctx.fillText(`${D.y0}`, sx0, sy + 14); ctx.textAlign = "right"; ctx.fillText(`${D.y1}`, sx1, sy + 14);
        // infant mortality dot grid
        dotgrid(ctx, w - 210, 130, 168, D.imr.v0, "rgba(255,122,61,.55)", `${D.imr.y0}년 출생아 1,000명당 첫돌 전 사망`, `${D.imr.v0.toFixed(1)}명`);
        dotgrid(ctx, w - 210, 240, 168, D.imr.v1, "#ff7a3d", `${D.imr.y1}년`, `${D.imr.v1.toFixed(1)}명`);
      } else {
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
        ctx.fillText(isDip ? "코로나19 시기 — 유일한 감소 해" : "0세 기대수명", 14, 36);
        if (isLatest) {
          ctx.fillStyle = "rgba(242,232,213,.85)"; ctx.font = `500 9px ${SANS}`;
          ctx.fillText(`어두운 밴드 = 건강수명(WHO,${D.hale.y1}) 이후 유병 추정기간`, 14, 51);
        }
        const sy = h - 108, sx0 = 14, sx1 = w - 14;
        ctx.fillStyle = DIM; ctx.font = `600 10.5px ${SANS}`;
        ctx.fillText(`${D.y0}–${D.y1}년 기대수명(전체)`, sx0, sy - 30);
        geo.ember = ember(ctx, sx0, sx1, sy, D, null, false);
        ctx.fillStyle = DIM; ctx.font = `500 9.5px ${MONO}`; ctx.textAlign = "left"; ctx.fillText(`${D.y0}`, sx0, sy + 12);
        ctx.textAlign = "right"; ctx.fillText(`${D.y1}`, sx1, sy + 12);
        ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 10.5px ${SANS}`;
        ctx.fillText("출생아 1,000명당 첫돌 전 사망", sx0, h - 40);
        ctx.fillStyle = INK; ctx.font = `700 15px ${MONO}`;
        ctx.fillText(`${D.imr.y0}년 ${D.imr.v0.toFixed(0)}명 → ${D.imr.y1}년 ${D.imr.v1.toFixed(1)}명`, sx0, h - 20);
      }
      // hover tooltip on candles
      if (hover) {
        const hit = geo.candles.find((b) => hover[0] >= b.cx - b.w / 2 - 4 && hover[0] <= b.cx + b.w / 2 + 4 && hover[1] >= b.top - 34 && hover[1] <= b.baseY + 34);
        if (hit) {
          const lines = [[`${year}년 · ${CANDLES.find((c) => c.key === hit.key).label}`], [`기대수명 ${hit.val.toFixed(2)}세`, "#ffb44a"]];
          if (hit.key === "total" && isLatest) lines.push([`건강수명(${D.hale.y1}) ${D.hale.total1.toFixed(1)}세 · 유병 ${(hit.val - D.hale.total1).toFixed(1)}년`, DIM]);
          tip(ctx, w, h, lines, hover);
        } else if (geo.ember && geo.ember.hover != null) {
          const yy = D.years[geo.ember.hover];
          tip(ctx, w, h, [[`${yy}년`], [`기대수명(전체) ${D.total[geo.ember.hover].toFixed(2)}세`, "#ffb44a"]], hover);
        }
      }
    });
  }

  VIZ["life-expectancy"] = { thumb, mount, bg: BG };
})();
