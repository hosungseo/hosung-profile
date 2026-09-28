// 43 subway — "노선도". The in-car route strip for every Seoul Metro line, stacked: stations as circles along
// each line in running order. Circle size = riders at the chosen hour on two ordinary weekdays of September 2026
// (Seoul Metro open API); colour = the station's 2025 riders against 2019 (below = warm, above = cool, same = pale).
(() => {
  const BG = "#1f2326";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const LINE = { "1호선": "#2a6fd0", "2호선": "#00a84d", "3호선": "#ef7c1c", "4호선": "#00a5de", "5호선": "#996cac", "6호선": "#cd7c2f", "7호선": "#8a9612", "8호선": "#e6186c", "9호선": "#bdb092" };
  const TXT = "#eef0ee", DIM = "rgba(238,240,238,.58)", FAINT = "rgba(238,240,238,.14)";
  // diverging: warm below 2019, pale at 2019, cool above
  const STOPS = [[60, [214, 72, 44]], [80, [240, 158, 92]], [100, [226, 226, 222]], [120, [104, 190, 214]], [150, [44, 128, 196]]];
  function rcol(r) {
    if (r == null) return "rgba(160,160,160,.5)";
    const v = KF.clamp(r, 60, 150);
    for (let i = 1; i < STOPS.length; i++) if (v <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], t = (v - a) / (b - a);
      return `rgb(${ca.map((c, k) => Math.round(c + (cb[k] - c) * t)).join(",")})`;
    }
    return `rgb(${STOPS[STOPS.length - 1][1].join(",")})`;
  }
  const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
  const hlabel = (p) => (p === 0 ? "하루 전체" : `${String(HOURS[p - 1]).padStart(2, "0")}시대`);

  function prep(d) {
    if (d._p) return d._p;
    let maxH = 0, maxDay = 0;
    d.strips.forEach((s) => s.st.forEach((x) => {
      if (!x[5]) return;
      maxH = Math.max(maxH, ...x[5]); maxDay = Math.max(maxDay, x[5].reduce((a, b) => a + b, 0));
    }));
    return (d._p = { maxH, maxDay });
  }
  const val = (x, pos) => (!x[5] ? 0 : pos === 0 ? x[5].reduce((a, b) => a + b, 0) : x[5][HOURS[pos - 1]]);
  const ratio = (x) => (x[3] > 0 && x[4] > 0 ? (x[4] / x[3]) * 100 : null);

  // strip geometry: x positions per station with small gaps before branches
  function layout(d, w, h, mode) {
    const full = mode === "full", thumb = mode === "thumb";
    const x0 = full ? 70 : thumb ? 30 : 34, x1 = w - (full ? 272 : thumb ? w * 0.42 : 10);
    const top = full ? 44 : thumb ? 38 : 30, bottom = full ? h - 18 : thumb ? h - 50 : Math.round(h * 0.7);
    const n = d.strips.length, pitch = (bottom - top) / n;
    const rows = d.strips.map((s, i) => {
      const y = top + pitch * (i + 0.5), st = s.st;
      let gaps = 0, prev = null;
      const grp = st.map((x) => { const g = x[2] ? `b${x[0].slice(0, 3)}` : "m"; if (prev !== null && g !== prev) gaps++; prev = g; return g; });
      const sp = (x1 - x0) / Math.max(1, st.length - 1 + gaps * 1.5);
      let x = x0, last = null;
      const xs = st.map((_, k) => { if (last !== null && grp[k] !== last) x += sp * 1.5; else if (k) x += sp; last = grp[k]; return x; });
      return { line: s.line, y, xs, grp, sp };
    });
    return { full, thumb, mode, x0, x1, top, bottom, pitch, rows };
  }

  function strips(ctx, L, d, pos, prog, hot) {
    const P = prep(d), maxV = pos === 0 ? P.maxDay : P.maxH;
    const rmax = Math.min(L.pitch * 0.42, L.full ? 15 : L.thumb ? 7 : 8.5);
    const hits = [];
    L.rows.forEach((row, i) => {
      const s = d.strips[i], col = LINE[row.line];
      // track, segment by segment (main line, then each branch)
      ctx.strokeStyle = col; ctx.lineWidth = L.full ? 3 : 2; ctx.lineCap = "round";
      let a = 0;
      for (let k = 1; k <= s.st.length; k++) {
        if (k === s.st.length || row.grp[k] !== row.grp[a]) {
          ctx.beginPath(); ctx.moveTo(row.xs[a], row.y); ctx.lineTo(row.xs[Math.max(a, k - 1)] + (a === k - 1 ? 0.1 : 0), row.y); ctx.stroke();
          if (row.grp[a] !== "m" && !L.thumb) { ctx.strokeStyle = col; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(row.xs[a] - row.sp * 1.4, row.y); ctx.lineTo(row.xs[a], row.y); ctx.stroke(); ctx.setLineDash([]); }
          a = k;
        }
      }
      // badge
      const bx = L.x0 - (L.full ? 38 : L.thumb ? 18 : 20), br = L.full ? 12 : L.thumb ? 7 : 8.5;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(bx, row.y, br, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `700 ${L.full ? 12 : L.thumb ? 8 : 9.5}px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(row.line.replace("호선", ""), bx, row.y + 0.5); ctx.textBaseline = "alphabetic";
      if (!s.st.some((x) => x[5]) && !L.thumb) { ctx.fillStyle = DIM; ctx.font = `500 ${L.full ? 10 : 8.5}px ${SANS}`; ctx.textAlign = "left"; ctx.fillText("2·3단계 · 시간대 자료 없음 (색만)", L.x0, row.y + L.pitch * 0.42); }
      // stations: biggest last so small ones stay visible
      const order = s.st.map((x, k) => k).sort((p, q) => val(s.st[p], pos) - val(s.st[q], pos));
      for (const k of order) {
        const x = s.st[k], v = val(x, pos), r = x[5] ? Math.max(1.4, rmax * Math.sqrt(v / maxV) * prog) : (L.full ? 4 : 2.6) * prog;
        const X = row.xs[k], Y = row.y, rr = ratio(x);
        ctx.globalAlpha = hot && !(hot.i === i && hot.k === k) ? 0.9 : 1;
        ctx.fillStyle = rcol(rr); ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = rr == null ? "rgba(255,255,255,.6)" : "rgba(15,17,18,.75)"; ctx.lineWidth = r > 4 ? 1 : 0.6; ctx.stroke();
        ctx.globalAlpha = 1;
        hits.push({ i, k, X, Y, r });
      }
    });
    return { hits, rmax, maxV };
  }

  function stationLabels(ctx, L, d, pos, a) { // the busiest stations of each line at this hour
    if (L.thumb) return;
    ctx.globalAlpha = a; ctx.font = `600 ${L.full ? 10.5 : 9}px ${SANS}`; ctx.textAlign = "center";
    L.rows.forEach((row, i) => {
      const s = d.strips[i], idx = s.st.map((x, k) => k).filter((k) => s.st[k][5]).sort((p, q) => val(s.st[q], pos) - val(s.st[p], pos));
      const placed = [];
      for (const k of idx.slice(0, L.full ? 3 : 1)) {
        const X = row.xs[k], name = s.st[k][1], tw = ctx.measureText(name).width;
        if (placed.some((p) => Math.abs(p - X) < tw + 8)) continue;
        placed.push(X);
        const ly = row.y + L.pitch * 0.46;
        ctx.fillStyle = "rgba(31,35,38,.75)"; ctx.fillRect(X - tw / 2 - 2, ly - 9, tw + 4, 12);
        ctx.fillStyle = TXT; ctx.fillText(name, KF.clamp(X, L.x0 + tw / 2, L.x1 + 6 - tw / 2), ly);
      }
    });
    ctx.globalAlpha = 1;
  }

  function legendBar(ctx, x, y, wd, full) {
    for (let k = 0; k < wd; k++) { ctx.fillStyle = rcol(60 + (90 * k) / wd); ctx.fillRect(x + k, y, 1.2, 8); }
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 9.5 : 9}px ${MONO}`; ctx.textAlign = "center";
    [[60, "60%"], [100, "100%"], [150, "150%"]].forEach(([v, t], i) => { ctx.textAlign = i === 0 ? "left" : i === 2 ? "right" : "center"; ctx.fillText(t, x + ((v - 60) / 90) * wd, y + 20); });
    ctx.textAlign = "left";
  }

  function panel(ctx, w, h, d, pos, a, S) {
    const x0 = w - 256, y0 = 14, bw = 242, bh = h - 28, px = x0 + 14, pr = x0 + bw - 14;
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(12,14,15,.72)"; ctx.fillRect(x0, y0, bw, bh);
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 10px ${MONO}`; ctx.fillText(`서울교통공사 · 같은 역 ${d.nSt}곳`, px, y0 + 22);
    ctx.fillStyle = TXT; ctx.font = `700 34px ${MONO}`; ctx.fillText(`${d.rec.toFixed(1)}%`, px, y0 + 60);
    ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText(`${d.now}년 승하차 ÷ ${d.base}년`, px, y0 + 78);
    // same-station totals by year (2024 left out, see caveats)
    const ys = d.years.filter((y) => y >= 2015), cx0 = px + 4, cx1 = pr, cy0 = y0 + 94, cy1 = y0 + 160, vmax = Math.max(...ys.map((y) => d.same[y]));
    const X = (y) => cx0 + ((cx1 - cx0) * (y - 2015)) / (d.now - 2015), Y = (v) => cy1 - ((cy1 - cy0) * v) / vmax;
    ctx.strokeStyle = FAINT; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(cx0, Y(d.same[d.base]) + 0.5); ctx.lineTo(cx1, Y(d.same[d.base]) + 0.5); ctx.stroke(); ctx.setLineDash([]);
    ys.forEach((y) => {
      const v = d.same[y], bwid = (cx1 - cx0) / (d.now - 2015 + 1) * 0.62;
      ctx.fillStyle = y === d.base ? "#e2e2de" : y === d.now ? rcol(d.rec) : "rgba(238,240,238,.35)";
      ctx.fillRect(X(y) - bwid / 2, Y(v), bwid, cy1 - Y(v));
    });
    ctx.fillStyle = DIM; ctx.font = `500 9px ${MONO}`; ctx.textAlign = "center";
    [2015, d.base, 2021, d.now].forEach((y) => ctx.fillText(`'${String(y).slice(2)}`, X(y), cy1 + 11));
    ctx.textAlign = "left"; ctx.fillText("연간 승하차 · 2024 없음", px, cy1 + 24);
    // colour legend
    let y = cy1 + 46;
    ctx.fillStyle = TXT; ctx.font = `600 11px ${SANS}`; ctx.fillText(`색 = ${d.now}년 ÷ ${d.base}년 (역마다)`, px, y);
    legendBar(ctx, px, y + 8, pr - px, true);
    y += 44;
    ctx.fillStyle = TXT; ctx.font = `600 11px ${SANS}`; ctx.fillText(`크기 = ${hlabel(pos)} 승하차`, px, y);
    ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`;
    ctx.fillText(`${d.days[0].slice(0, 4)}.${Number(d.days[0].slice(4, 6))}.${Number(d.days[0].slice(6))}·${Number(d.days[1].slice(6))} 평일 평균 · 오픈API`, px, y + 15);
    const tot = pos === 0 ? d.apiHour.reduce((s2, v) => s2 + v, 0) : d.apiHour[HOURS[pos - 1]];
    ctx.fillStyle = TXT; ctx.font = `700 16px ${MONO}`; ctx.fillText(`${KF.fmt(Math.round(tot / 1e4))}만 명`, px, y + 36);
    // hourly bars (the whole network)
    const hx0 = px, hx1 = pr, hy1 = y + 76, hmax = Math.max(...d.apiHour), bwid = (hx1 - hx0) / HOURS.length;
    HOURS.forEach((hh, k) => {
      const v = d.apiHour[hh], bh2 = (v / hmax) * 30;
      ctx.fillStyle = pos === k + 1 || pos === 0 ? "rgba(238,240,238,.75)" : "rgba(238,240,238,.28)"; ctx.fillRect(hx0 + k * bwid + 1, hy1 - bh2, bwid - 2, bh2);
    });
    ctx.fillStyle = DIM; ctx.font = `500 9px ${MONO}`; ctx.textAlign = "left"; ctx.fillText("05", hx0, hy1 + 11); ctx.textAlign = "right"; ctx.fillText("24시", hx1, hy1 + 11);
    // stations that moved most (5M+ riders in the base year)
    y = hy1 + 34; ctx.textAlign = "left";
    [["많이 늘어난 역", d.highs], ["덜 돌아온 역", d.lows]].forEach(([t, list], j) => {
      const yy = y + j * 62;
      ctx.fillStyle = TXT; ctx.font = `600 11px ${SANS}`; ctx.fillText(t, px, yy);
      list.slice(0, 3).forEach(([nm, r], m) => {
        ctx.fillStyle = rcol(r); ctx.beginPath(); ctx.arc(px + 5, yy + 12 + m * 15, 4, 0, 7); ctx.fill();
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(nm, px + 14, yy + 16 + m * 15);
        ctx.textAlign = "right"; ctx.fillStyle = TXT; ctx.font = `500 10.5px ${MONO}`; ctx.fillText(`${r}%`, pr, yy + 16 + m * 15); ctx.textAlign = "left";
      });
    });
    ctx.globalAlpha = 1;
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `600 12.5px ${SANS}`;
    let bw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${SANS}`;
    lines.slice(1).forEach((l) => { bw = Math.max(bw, ctx.measureText(l).width); });
    bw += 22;
    const bh = 12 + lines.length * 17, bx = KF.clamp(x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 12, 6, h - bh - 6);
    ctx.fillStyle = "rgba(246,246,242,.97)"; ctx.fillRect(bx, by, bw, bh);
    lines.forEach((l, i) => { ctx.fillStyle = i ? "#23272a" : "#000"; ctx.font = i ? `500 11px ${SANS}` : `600 12.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(l, bx + 11, by + 18 + i * 17); });
  }

  // ------------------------------------------------------------------ thumb
  function thumb(ctx, w, h, t, d) {
    const c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const L = layout(d, w, h, "thumb");
    const pos = c < 3.2 ? 1 + Math.min(19, Math.floor((c / 3.2) * 20)) : 0;
    strips(ctx, L, d, pos, KF.clamp(c / 0.6, 0, 1), null);
    const X = w - 12, a = KF.clamp((c - 2.4) / 0.6, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "right";
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText("지하철 승하차", X, h * 0.2);
    ctx.fillStyle = TXT; ctx.font = `700 ${Math.round(h * 0.17)}px ${MONO}`; ctx.fillText(`${Math.round(d.rec)}%`, X, h * 0.2 + h * 0.18);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.05)}px ${SANS}`; ctx.fillText(`${d.now}년 ÷ ${d.base}년`, X, h * 0.2 + h * 0.26);
    ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`;
    ctx.fillStyle = rcol(d.highs[0][1]); ctx.fillText(`${d.highs[0][0]} ${d.highs[0][1]}%`, X, h * 0.66);
    ctx.fillStyle = rcol(d.lows[0][1]); ctx.fillText(`${d.lows[0][0]} ${d.lows[0][1]}%`, X, h * 0.66 + h * 0.085);
    ctx.globalAlpha = 1;
    if (c > 9.4) { ctx.fillStyle = BG; ctx.globalAlpha = (c - 9.4) / 0.6; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let pos = 0, t0 = performance.now(), hover = null, manual = false;
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = HOURS.length; range.step = 1; range.value = 0;
    const lab = document.createElement("label"), out = document.createElement("span");
    out.className = "readout"; out.textContent = hlabel(0);
    lab.append("시간", range, out);
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "하루 다시 보기";
    replay.onclick = () => { t0 = performance.now(); manual = false; };
    KF.segment(controls, [{ id: 0, label: "하루 전체" }, { id: 4, label: "아침 8시" }, { id: 14, label: "저녁 6시" }, { id: 18, label: "밤 10시" }], 0, (id) => { pos = id; manual = true; range.value = id; out.textContent = hlabel(id); });
    controls.append(lab, replay);
    range.oninput = () => { pos = +range.value; manual = true; out.textContent = hlabel(pos); };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, el = (performance.now() - t0) / 1000;
      // intro: a day passes (05 → 24시) in 4.2 s, then the whole day
      let p = pos;
      if (!manual) { p = el < 4.4 ? 1 + Math.min(HOURS.length - 1, Math.floor((el / 4.4) * HOURS.length)) : 0; out.textContent = hlabel(p); range.value = p; }
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const L = layout(d, w, h, full ? "full" : "phone");
      if (full) {
        ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 14px ${SANS}`;
        ctx.fillText(`서울교통공사 노선도 · ${hlabel(p)}`, 20, 26);
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText("줄 하나 = 호선 하나, 달리는 순서대로 · 점선 뒤는 지선", 250, 26);
      }
      let hot = null, best = 1e9;
      const S = strips(ctx, L, d, p, KF.clamp(el / 0.8, 0, 1), null);
      if (hover) for (const q of S.hits) { const dd = (q.X - hover[0]) ** 2 + (q.Y - hover[1]) ** 2; if (dd < best && dd < Math.max(81, (q.r + 4) ** 2)) { best = dd; hot = q; } }
      stationLabels(ctx, L, d, p, KF.clamp((el - 0.8) / 0.6, 0, 1));
      if (full) panel(ctx, w, h, d, p, KF.clamp((el - 1.2) / 0.8, 0, 1), S);
      else {
        const y = L.bottom + 26;
        ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 22px ${MONO}`; ctx.fillText(`${d.rec.toFixed(1)}%`, 12, y + 4);
        ctx.font = `500 11px ${SANS}`; ctx.fillStyle = DIM; ctx.fillText(`${d.now}년 승하차 ÷ ${d.base}년 (같은 역 ${d.nSt}곳)`, 104, y);
        ctx.fillText(`크기 = ${hlabel(p)} 승하차 (2026년 9월 평일)`, 104, y + 15);
        legendBar(ctx, 12, y + 26, w - 24, false);
        ctx.fillStyle = TXT; ctx.font = `600 11px ${SANS}`; ctx.textAlign = "left";
        ctx.fillText(`${d.highs[0][0]} ${d.highs[0][1]}% · ${d.highs[1][0]} ${d.highs[1][1]}% · ${d.lows[0][0]} ${d.lows[0][1]}% · ${d.lows[1][0]} ${d.lows[1][1]}%`, 12, y + 70);
      }
      if (hot) {
        const x = d.strips[hot.i].st[hot.k], r = ratio(x);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hot.X, hot.Y, hot.r + 3, 0, 7); ctx.stroke();
        const lines = [`${x[1]} · ${d.strips[hot.i].line}`];
        lines.push(r != null ? `${d.base}년 ${KF.fmt(x[3])}만 → ${d.now}년 ${KF.fmt(x[4])}만 명 (${r.toFixed(0)}%)` : `${d.base}년과 비교할 수 없는 역`);
        if (x[5]) lines.push(`${hlabel(p)} 승하차 ${KF.fmt(Math.round(val(x, p)))}명 (2026년 9월 평일 평균)`);
        tip(ctx, w, h, hover[0], hover[1], lines);
      }
    });
  }

  VIZ.subway = { thumb, mount, bg: BG };
})();
