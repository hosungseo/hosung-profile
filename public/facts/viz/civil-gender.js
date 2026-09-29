// 89 civil-gender — "승진 사다리". A wooden ladder, 9급 at the bottom rung to 고위공무원단 at the top; each rung
// fills with green from the left in proportion to that rank's women share in the selected year. A year scrubber
// replays 2017-2025 — every rung's fill grows, most visibly at the top. A side panel explains why the *overall*
// average (all ranks combined, including 특정직 교원·경찰·소방) can fall even as every ladder rung rises.
(() => {
  const BG = "#c9d9b4";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#2c3a1f", MUTE = "rgba(44,58,31,.62)", FAINT = "rgba(44,58,31,.16)";
  const WOOD = "#8a6a3e", WOOD_D = "#6b4f2c", TRACK = "rgba(44,58,31,.14)", FILL_LO = "#d8c37a", FILL_HI = "#2f6b3a";

  function mixColor(a, b, t) {
    const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16)), pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
    return `rgb(${pa.map((v, i) => Math.round(KF.lerp(v, pb[i], t))).join(",")})`;
  }

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const order = d.ranks.slice().reverse();   // bottom (9급) first
    const byY = (series, y) => series.find((r) => r.y === y) || series[series.length - 1];
    return (DEC = { years: d.years, ranks: order, total: d.total, general: d.general, special: d.special, branch: d.branch, mgr: d.mgr, byY });
  }

  function rung(ctx, x0, y, w, rh, pct, grow, hover) {
    const x = x0, ww = w * grow;
    ctx.fillStyle = TRACK; ctx.beginPath(); ctx.roundRect(x0, y, w, rh, rh / 2); ctx.fill();
    ctx.fillStyle = mixColor(FILL_LO, FILL_HI, KF.clamp(pct / 55, 0, 1));
    ctx.beginPath(); ctx.roundRect(x0, y, Math.max(rh, (w * pct) / 100) * grow, rh, rh / 2); ctx.fill();
    ctx.strokeStyle = hover ? "#b5482f" : WOOD_D; ctx.lineWidth = hover ? 2.4 : 1.4;
    ctx.beginPath(); ctx.roundRect(x0 + 0.5, y + 0.5, w - 1, rh - 1, rh / 2); ctx.stroke();
  }

  function ladder(ctx, x0, y0, w, h, X, year, el, hover, full) {
    const n = X.ranks.length, rh = Math.min(full ? 30 : 18, (h / n) * 0.62), gap = (h - rh * n) / (n - 1);
    const railW = full ? 10 : 6, lx = x0, rx = x0 + w;
    ctx.strokeStyle = WOOD; ctx.lineWidth = railW; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(lx, y0 - rh); ctx.lineTo(lx, y0 + h + rh * 0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx, y0 - rh); ctx.lineTo(rx, y0 + h + rh * 0.4); ctx.stroke();
    let hit = -1;
    const boxes = [];
    for (let i = 0; i < n; i++) {
      const y = y0 + h - i * (rh + gap) - rh;
      const rd = X.byY(X.ranks[i].series, year);
      const grow = KF.ease(KF.clamp(el * n * 1.2 - i, 0, 1));
      const isHover = hover && hover[0] >= lx - 6 && hover[0] <= rx + 6 && hover[1] >= y - gap / 2 && hover[1] < y + rh + gap / 2;
      if (isHover) hit = i;
      rung(ctx, lx + railW * 0.6, y, w - railW * 1.2, rh, rd.pct, grow, isHover);
      ctx.fillStyle = INK; ctx.font = `600 ${full ? 11.5 : 9.5}px ${SANS}`; ctx.textAlign = "left";
      ctx.globalAlpha = grow;
      if (full) ctx.fillText(X.ranks[i].label, rx + railW + 10, y + rh * 0.7);
      else ctx.fillText(`${X.ranks[i].label} ${rd.pct.toFixed(0)}%`, lx + railW + 6, y + rh * 0.7 - rh - 2);
      if (full) {
        ctx.font = `700 11px ${MONO}`; ctx.textAlign = "center";
        const tx = lx + w * 0.5, ty = y + rh * 0.66;
        ctx.strokeStyle = "rgba(238,242,228,.9)"; ctx.lineWidth = 3; ctx.strokeText(`${rd.pct.toFixed(1)}%`, tx, ty);
        ctx.fillStyle = INK; ctx.fillText(`${rd.pct.toFixed(1)}%`, tx, ty);
        ctx.textAlign = "left";
      }
      ctx.globalAlpha = 1;
      boxes.push({ i, y, rh, rd });
    }
    return { hit, boxes, lx, rx };
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : k === 2 ? `500 10.5px ${MONO}` : `500 11.5px ${SANS}`);
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(44,58,31,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#eef2e4"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? "rgba(238,242,228,.75)" : k === 1 ? "#d8c37a" : "#eef2e4"; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + j * 18); });
  }

  function stat(ctx, x, y, label, a, b, full) {
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 11 : 9.5}px ${SANS}`;
    ctx.fillText(label, x, y);
    const up = b >= a;
    ctx.fillStyle = INK; ctx.font = `700 ${full ? 15 : 12.5}px ${MONO}`;
    ctx.fillText(`${a.toFixed(1)}%`, x, y + (full ? 20 : 16));
    ctx.fillStyle = up ? "#2f6b3a" : "#b5482f"; ctx.font = `600 ${full ? 13 : 11}px ${SANS}`;
    ctx.fillText(`${up ? "↑" : "↓"} ${b.toFixed(1)}%`, x + (full ? 62 : 50), y + (full ? 20 : 16));
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const X = decode(d), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const el = KF.clamp((c - 0.3) / 1.6, 0, 1);
    const yi = X.years[Math.min(X.years.length - 1, Math.floor((c / 10) * X.years.length))];
    ladder(ctx, w * 0.1, h * 0.08, w * 0.42, h * 0.82, X, yi, el, null, true);
    const a = KF.clamp((c - 1.6) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    const tx = w * 0.62;
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText(`고위공무원단 여성 비율`, tx, h * 0.2);
    ctx.fillStyle = "#2f6b3a"; ctx.font = `700 ${Math.round(h * 0.14)}px ${SANS}`;
    const top = X.byY(X.ranks[X.ranks.length - 1].series, 2025).pct, top0 = X.byY(X.ranks[X.ranks.length - 1].series, 2017).pct;
    ctx.fillText(`${top0.toFixed(0)}% → ${top.toFixed(0)}%`, tx, h * 0.4);
    ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.048)}px ${SANS}`;
    ctx.fillText("2017 → 2025", tx, h * 0.52);
    ctx.fillStyle = MUTE; ctx.font = `500 ${Math.round(h * 0.042)}px ${SANS}`;
    ctx.fillText("그런데 전체 평균은", tx, h * 0.7);
    ctx.fillText(`${X.total[0].pct.toFixed(0)}% → ${X.total[X.total.length - 1].pct.toFixed(0)}%로 줄었다`, tx, h * 0.82);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage);
    let yIdx = X.years.length - 1, t0 = performance.now(), hover = null, geo = null;
    KF.segment(controls, X.years.map((y, i) => ({ id: i, label: `${y}` })), X.years.length - 1, (id) => { yIdx = id; t0 = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, el = KF.clamp((performance.now() - t0) / 1000, 0, 1), year = X.years[yIdx];
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 14.5}px ${SERIF}`;
      ctx.fillText(`${year}년 · 일반직 승진 사다리`, full ? 18 : 12, full ? 30 : 22);
      ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`;
      ctx.fillText("가로대 색 = 그 직급의 여성 비율 · 아래가 9급, 위가 고위공무원단", full ? 18 : 12, full ? 48 : 34);

      const lx = full ? 30 : 26, ly = full ? 74 : 56, lw = full ? w * 0.3 : w - 52, lh = full ? h - 108 : h * 0.52;
      geo = ladder(ctx, lx, ly, lw, lh, X, year, el, hover, full);

      if (full) {
        const px = lx + lw + 150, pw = w - px - 22;
        const t1 = X.byY(X.total, year), g1 = X.byY(X.general, year), sp1 = X.byY(X.special, year);
        stat(ctx, px, ly + 18, "전체(A01, 특정직 포함) 여성비율", X.total[0].pct, t1.pct, true);
        stat(ctx, px, ly + 74, "일반직(사다리) 여성비율", X.general[0].pct, g1.pct, true);
        stat(ctx, px, ly + 130, "특정직(교원·경찰·소방 등) 여성비율", X.special[0].pct, sp1.pct, true);
        ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${SANS}`;
        wrapText(ctx, "전체 평균이 줄어든 건 특정직(교원·경찰·소방)이 인원의 4분의 3을 차지하는데, 그 특정직 자체의 여성비율이 줄었기 때문입니다.", px, ly + 168, pw, 15);

        const by = ly + 250, bh2 = 16, bgap = 26;
        ctx.fillStyle = MUTE; ctx.font = `600 11px ${SANS}`; ctx.fillText("소속별 여성비율 (2025)", px, by - 8);
        const maxP = Math.max(...X.branch.map((b) => b.pct));
        X.branch.forEach((b, i) => {
          const y = by + i * bgap;
          ctx.fillStyle = INK; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(b.label, px, y + bh2 * 0.75);
          const bx = px + 78, bw = (pw - 78 - 44) * (b.pct / maxP);
          ctx.fillStyle = "#2f6b3a"; ctx.fillRect(bx, y, Math.max(1, bw), bh2);
          ctx.fillStyle = MUTE; ctx.font = `500 10px ${MONO}`; ctx.fillText(`${b.pct.toFixed(1)}%`, bx + bw + 5, y + bh2 * 0.75);
        });
      } else {
        const py = ly + lh + 18;
        const t1 = X.byY(X.total, year), g1 = X.byY(X.general, year);
        stat(ctx, 26, py, "전체(특정직 포함)", X.total[0].pct, t1.pct, false);
        stat(ctx, w / 2 + 4, py, "일반직(사다리)", X.general[0].pct, g1.pct, false);
        ctx.fillStyle = MUTE; ctx.font = `500 9.5px ${SANS}`;
        wrapText(ctx, "전체 평균 하락은 특정직(교원·경찰·소방)의 비중과 그 자체 여성비율 변화 때문입니다.", 26, py + 44, w - 52, 13);
      }

      if (geo && geo.hit >= 0 && hover) {
        const b = geo.boxes[geo.hit], rk = X.ranks[geo.hit];
        const first = X.byY(rk.series, X.years[0]);
        tip(ctx, w, h, [
          [rk.label, 1],
          [`${year}년 현원 ${KF.fmt(b.rd.total)}명 · 여성 ${KF.fmt(b.rd.women)}명 (${b.rd.pct.toFixed(1)}%)`, 0],
          [`${X.years[0]}년 ${first.pct.toFixed(1)}% → ${year}년 ${b.rd.pct.toFixed(1)}%`, 2],
        ], hover);
      }
    });
  }

  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(""); let line = "", yy = y;
    for (const ch of words) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = ch; yy += lh; }
      else line = test;
    }
    if (line) ctx.fillText(line, x, yy);
  }

  VIZ["civil-gender"] = { thumb, mount, bg: BG };
})();
