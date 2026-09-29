// 95 forest-carbon — "숲의 저금통". A glass jar fills with wood-toned "growth" as the census years advance
// (1990→2020) — that is the stock, 임목축적. Below it, a row of coins — one per year, 1990→2023 — is the
// flow: coin SIZE = that year's net carbon uptake. The jar only ever fills further; the coins get visibly
// smaller after 2008. Same forest, a rising stock and a shrinking flow at once.
(() => {
  const BG = "#d2cb8f";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#233623", DIM = "rgba(35,54,35,.66)", FAINT = "rgba(35,54,35,.16)";
  const GLASS = "rgba(255,255,255,.4)", WOOD_HI = "#a9835a", WOOD_LO = "#5c3f24", COIN_HI = "#8fae74", COIN_LO = "#3f5c3f";
  const RED = "#a8402e";

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const st = d.stock, sk = d.sink;
    const stockYears = []; for (let y = st.y0; y <= st.y1; y++) stockYears.push(y);
    const sinkYears = []; for (let y = sk.y0; y <= sk.y1; y++) sinkYears.push(y);
    return (DEC = {
      stockYears, stockV: st.v, area: st.area, density: st.density, maxStock: Math.max(...st.v),
      sinkYears, sinkV: sk.v, maxSink: Math.max(...sk.v), peakYear: d.peakYear, jumpYears: d.jumpYears || [],
    });
  }

  // ---------------------------------------------------------------- jar
  function jarPath(cx, top, bot, halfW, neckW, neckH) {
    const p = new Path2D(), bodyTop = top + neckH, r = halfW * 0.16;
    p.moveTo(cx - neckW, top);
    p.lineTo(cx - neckW, bodyTop - r);
    p.quadraticCurveTo(cx - neckW, bodyTop, cx - neckW + r, bodyTop);
    p.lineTo(cx - halfW + r, bodyTop);
    p.quadraticCurveTo(cx - halfW, bodyTop, cx - halfW, bodyTop + r);
    p.lineTo(cx - halfW, bot - r);
    p.quadraticCurveTo(cx - halfW, bot, cx - halfW + r, bot);
    p.lineTo(cx + halfW - r, bot);
    p.quadraticCurveTo(cx + halfW, bot, cx + halfW, bot - r);
    p.lineTo(cx + halfW, bodyTop + r);
    p.quadraticCurveTo(cx + halfW, bodyTop, cx + halfW - r, bodyTop);
    p.lineTo(cx + neckW - r, bodyTop);
    p.quadraticCurveTo(cx + neckW, bodyTop, cx + neckW, bodyTop - r);
    p.lineTo(cx + neckW, top);
    p.closePath();
    return p;
  }

  function drawJar(ctx, cx, top, bot, halfW, fillFrac, full) {
    const neckW = halfW * 0.42, neckH = (bot - top) * 0.1;
    const jar = jarPath(cx, top, bot, halfW, neckW, neckH);
    ctx.save(); ctx.clip(jar);
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillRect(cx - halfW, top, halfW * 2, bot - top);
    const fh = (bot - top - neckH) * fillFrac, fy = bot - fh;
    const g = ctx.createLinearGradient(0, fy, 0, bot);
    g.addColorStop(0, WOOD_HI); g.addColorStop(1, WOOD_LO);
    ctx.fillStyle = g; ctx.fillRect(cx - halfW, fy, halfW * 2, fh);
    // horizontal growth striations inside the fill (wood build-up, not tree-ring cross-section)
    ctx.strokeStyle = "rgba(40,26,12,.22)"; ctx.lineWidth = 1;
    for (let y = bot - 6; y > fy; y -= Math.max(5, halfW * 0.09)) { ctx.beginPath(); ctx.moveTo(cx - halfW, y); ctx.lineTo(cx + halfW, y); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.fillRect(cx - halfW, fy, halfW * 0.12, fh);
    ctx.restore();
    // glass body
    ctx.strokeStyle = "rgba(60,70,55,.55)"; ctx.lineWidth = full ? 2 : 1.4; ctx.stroke(jar);
    ctx.save(); ctx.clip(jar);
    const sheen = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
    sheen.addColorStop(0, "rgba(255,255,255,0)"); sheen.addColorStop(0.18, GLASS); sheen.addColorStop(0.3, "rgba(255,255,255,0)"); sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen; ctx.fillRect(cx - halfW, top, halfW * 2, bot - top);
    ctx.restore();
    // lid
    const lidH = neckH * 0.55;
    ctx.fillStyle = "#5a6a4a"; ctx.fillRect(cx - neckW - 3, top - lidH, neckW * 2 + 6, lidH);
    ctx.strokeStyle = "rgba(35,54,35,.4)"; ctx.strokeRect(cx - neckW - 3, top - lidH, neckW * 2 + 6, lidH);
    return { fy, fh };
  }

  // ---------------------------------------------------------------- coin row (annual sink)
  function coinShade(ctx, cx, cy, r, hi) {
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r * 1.05);
    g.addColorStop(0, hi ? "#fff" : COIN_HI); g.addColorStop(0.5, COIN_HI); g.addColorStop(1, COIN_LO);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(20,30,20,.4)"; ctx.lineWidth = 1; ctx.stroke();
  }

  function drawCoins(ctx, D, box, hoverYr, full) {
    const [x0, y0, w, h] = box, n = D.sinkYears.length, colW = w / n, baseY = y0 + h;
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, baseY); ctx.lineTo(x0 + w, baseY); ctx.stroke();
    const maxR = Math.min(colW * 0.48, h * 0.46);
    for (let i = 0; i < n; i++) {
      const yr = D.sinkYears[i], v = D.sinkV[i], r = Math.max(1.4, maxR * Math.sqrt(v / D.maxSink));
      const cx = x0 + (i + 0.5) * colW, cy = baseY - r;
      coinShade(ctx, cx, cy, r, yr === hoverYr);
      if (yr === D.peakYear) { ctx.strokeStyle = RED; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, cy, r + 2.5, 0, 7); ctx.stroke(); }
      if (yr === hoverYr) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r + 2.5, 0, 7); ctx.stroke(); }
    }
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10 : 9}px ${MONO}`; ctx.textAlign = "center";
    for (const yr of [D.sinkYears[0], D.peakYear, D.sinkYears[n - 1]]) {
      const i = D.sinkYears.indexOf(yr), cx = x0 + (i + 0.5) * colW;
      ctx.fillText(String(yr), cx, baseY + (full ? 16 : 13));
    }
  }

  function tip(ctx, w, h, lines, p) {
    const fs = 11.5;
    ctx.font = `700 ${fs + 1}px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 ${fs}px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 10 + lines.length * (fs + 6);
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(255,255,255,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(35,54,35,.35)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = `${i ? 500 : 700} ${i ? fs : fs + 1}px ${SANS}`; ctx.fillText(t, bx + 11, by + 6 + (i + 1) * (fs + 6) - 3); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const D = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, grow = KF.ease(KF.clamp((c - 0.3) / 3, 0, 1));
    drawJar(ctx, w * 0.24, h * 0.14, h * 0.82, w * 0.15, grow, false);
    drawCoins(ctx, D, [w * 0.5, h * 0.58, w * 0.42, h * 0.22], null, false);
    const a = KF.clamp((c - 1) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.075)}px ${SANS}`;
    ctx.fillText("숲은 계속 울창해질까", w * 0.5, h * 0.28);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText("쌓인 나무는 늘어도", w * 0.5, h * 0.9);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  // The jar fills year by year: switching the selected year does not fade between two fractions, it walks
  // the pointer across every real annual value in between (fromIdx -> toIdx), so a jump like 2006->2010
  // visibly surges through the two step years (2007, 2010) instead of a smooth fake tween.
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    const N = D.stockYears.length;
    // 4 landmark buttons: first year, the year right before the first identified jump, the last jump
    // year itself, and the last year — so "직전 -> 도약 후" sweeps through every real step-jump at once.
    const jy = D.jumpYears.length ? D.jumpYears : [D.stockYears[N - 1]];
    const marks = [D.stockYears[0], jy[0] - 1, jy[jy.length - 1], D.stockYears[N - 1]];
    const uniqMarks = [...new Set(marks)].sort((a, b) => a - b);
    let yi = N - 1, hoverYr = null, hover = null, tGrow = performance.now(), fromIdx = 0, toIdx = N - 1, jarGeo = null, coinsBox = null;
    let animDur = 2200; // initial mount: sweep the whole range slowly so the fill is visibly "year by year"
    const markLabel = (y) => (y === jy[0] - 1 ? `${y}년(도약 전)` : y === jy[jy.length - 1] ? `${y}년(도약 후)` : `${y}년`);
    KF.segment(controls, uniqMarks.map((y) => ({ id: String(D.stockYears.indexOf(y)), label: markLabel(y) })), String(yi), (id) => {
      fromIdx = yi; toIdx = +id; animDur = KF.clamp(Math.abs(toIdx - fromIdx) * 55, 500, 2200); yi = toIdx; tGrow = performance.now();
    });

    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top];
      hoverYr = null;
      if (coinsBox) {
        const [x0, y0, w, h] = coinsBox;
        if (hover[0] >= x0 && hover[0] <= x0 + w && hover[1] >= y0 - 4 && hover[1] <= y0 + h + 18) {
          const i = KF.clamp(Math.floor(((hover[0] - x0) / w) * D.sinkYears.length), 0, D.sinkYears.length - 1);
          hoverYr = D.sinkYears[i];
        }
      }
    });
    stage.addEventListener("pointerleave", () => { hover = null; hoverYr = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520, now = performance.now();
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const el = KF.ease(KF.clamp((now - tGrow) / animDur, 0, 1));
      // walk the real annual sequence from fromIdx to toIdx (not a fake 2-point tween) — a jump year in
      // between shows up as a visible surge in the fill level while this is in motion.
      const curIdx = KF.reduced ? toIdx : Math.round(KF.lerp(fromIdx, toIdx, el));
      const frac = D.stockV[curIdx] / D.maxStock;

      let jarBox, infoX, coinsY;
      if (full) { jarBox = [w * 0.21, h * 0.1, h * 0.68, w * 0.1]; infoX = w * 0.42; coinsY = h * 0.72; }
      else { jarBox = [w * 0.24, h * 0.09, h * 0.37, w * 0.14]; infoX = 14; coinsY = h * 0.56; }
      const [cx, top, bodyH, halfW] = jarBox, bot = top + bodyH;
      jarGeo = drawJar(ctx, cx, top, bot, halfW, frac, full);

      coinsBox = full ? [w * 0.06, coinsY, w * 0.88, h * 0.12] : [w * 0.06, coinsY, w * 0.88, h * 0.11];
      drawCoins(ctx, D, coinsBox, hoverYr, full);

      const y = D.stockYears[curIdx], stockNow = D.stockV[curIdx], stock0 = D.stockV[0];
      if (full) {
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 21px ${SERIF}`;
        ctx.fillText("숲의 저금통", infoX, 42);
        ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
        ctx.fillText(`병 속 나무 부피(${D.stockYears[0]}–${D.stockYears[N - 1]}년, 매년) · 아래 동전 하나 = 그해의 연간 순흡수(${D.sinkYears[0]}–${D.sinkYears[D.sinkYears.length - 1]})`, infoX, 64);
        const by = 104;
        ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`;
        ctx.fillText(`${y}년 임목축적`, infoX, by);
        ctx.fillStyle = "#6b4a26"; ctx.font = `700 32px ${SANS}`;
        ctx.fillText(`${stockNow.toFixed(1)}백만㎥`, infoX, by + 34);
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`관측 시작(${D.stockYears[0]}년) ${stock0.toFixed(1)} → ${y}년 ${stockNow.toFixed(1)} (${(stockNow / stock0).toFixed(1)}배) · ha당 ${D.density[curIdx].toFixed(1)}㎥`, infoX, by + 54);

        const sy = by + 90;
        const i = hoverYr != null ? D.sinkYears.indexOf(hoverYr) : D.sinkYears.indexOf(D.peakYear);
        const yy = D.sinkYears[i], vv = D.sinkV[i];
        ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`;
        ctx.fillText(hoverYr != null ? `${yy}년 순흡수 (가리킨 해)` : `정점 ${yy}년 순흡수`, infoX, sy);
        ctx.fillStyle = yy === D.peakYear ? RED : "#3f5c3f"; ctx.font = `700 26px ${SANS}`;
        ctx.fillText(`${vv.toFixed(1)}백만tCO₂eq`, infoX, sy + 30);
        const chg = (D.sinkV[D.sinkYears.length - 1] / D.sinkV[D.sinkYears.indexOf(D.peakYear)] - 1) * 100;
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`${D.peakYear}년 정점 대비 ${D.sinkYears[D.sinkYears.length - 1]}년은 ${chg.toFixed(1)}%`, infoX, sy + 48);
      } else {
        const y0b = Math.max(top + bodyH + 10, coinsY + coinsBox[3] + 30);
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 13px ${SANS}`;
        ctx.fillText(`${y}년 임목축적`, 14, y0b);
        ctx.fillStyle = "#6b4a26"; ctx.font = `700 20px ${SANS}`;
        ctx.fillText(`${stockNow.toFixed(1)}백만㎥ (${(stockNow / stock0).toFixed(1)}배)`, 14, y0b + 24);
        const i = hoverYr != null ? D.sinkYears.indexOf(hoverYr) : D.sinkYears.indexOf(D.peakYear);
        const yy = D.sinkYears[i], vv = D.sinkV[i];
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
        ctx.fillText(`동전: ${yy}년 순흡수 ${vv.toFixed(1)}백만tCO₂eq${yy === D.peakYear ? " (정점)" : ""}`, 14, y0b + 42);
      }
      if (hoverYr != null && hover) {
        const i = D.sinkYears.indexOf(hoverYr);
        tip(ctx, w, h, [[`${hoverYr}년`], [`연간 순흡수 ${D.sinkV[i].toFixed(2)}백만tCO₂eq`, hoverYr === D.peakYear ? RED : "#3f5c3f"]], hover);
      }
    });
  }

  VIZ["forest-carbon"] = { thumb, mount, bg: BG };
})();
