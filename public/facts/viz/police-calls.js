// 76 police-calls — "치안상황실 자석 게시판". A pale-enamel status board studded with round magnets.
// 100 magnets = 100 calls. View "신고 종류": one board, coloured by call type (광주, 2025) — the red
// magnets (중요범죄) are a handful in a sea of neutral ones. View "긴급도 추세": ten small tiles, one
// per year (경기북부, 2016–2025), each its own 10-magnet board showing the urgent share that year.
(() => {
  const BG = "#cddbb0";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#22301a", MUTE = "rgba(34,48,26,.64)";
  const BOARD = ["#dbe6c2", "#aebd8d"];             // enamel gradient (light, dark)
  const COLORS = { "중요범죄": "#b8382a", "기타범죄": "#c67c2e", "질서유지": "#cfa53a", "교통": "#3f7a72", "기타경찰업무": "#828d78", "타기관_기타": "#b7c0a8",
                   "긴급신고(출동)": "#b8382a", "비긴급신고(출동)": "#cfa53a", "비출동신고": "#828d78" };
  const NEUTRAL = "#828d78";

  function order(chips) { return chips.slice(); }             // already sorted desc by value from build.py
  function find(chips, label) { return chips.find((c) => c.label === label); }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function board(ctx, x0, y0, w, h) {
    const g = ctx.createLinearGradient(x0, y0, x0, y0 + h);
    g.addColorStop(0, BOARD[0]); g.addColorStop(1, BOARD[1]);
    roundRect(ctx, x0, y0, w, h, Math.min(14, w * 0.03)); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "rgba(34,48,26,.3)"; ctx.lineWidth = 1.2; ctx.stroke();
  }

  function magnet(ctx, cx, cy, r, color, grow) {
    const rr = r * grow; if (rr < 0.4) return;
    const g = ctx.createRadialGradient(cx - rr * 0.35, cy - rr * 0.4, rr * 0.15, cx, cy, rr);
    g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(0.35, color); g.addColorStop(1, color);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = Math.max(0.5, rr * 0.08); ctx.stroke();
  }

  // chip grid inside one board (total chips, in reading order), coloured by category run-lengths
  function chipGrid(ctx, chips, x0, y0, w, h, cols, grow, hover, total = 100) {
    const rows = Math.ceil(total / cols), gap = Math.min(w, h) * (total > 50 ? 0.012 : 0.05);
    const cw = (w - gap * (cols + 1)) / cols, ch = (h - gap * (rows + 1)) / rows;
    const r = Math.min(cw, ch) / 2 * 0.86;
    let i = 0, hit = null;
    for (const c of chips) {
      for (let k = 0; k < c.n; k++, i++) {
        const col = i % cols, row = Math.floor(i / cols);
        const cx = x0 + gap + cw / 2 + col * (cw + gap), cy = y0 + gap + ch / 2 + row * (ch + gap);
        const e = KF.clamp(grow * 14 - i * 0.12, 0, 1);
        magnet(ctx, cx, cy, r, COLORS[c.label] || NEUTRAL, e);
        if (hover) { const d2 = (hover[0] - cx) ** 2 + (hover[1] - cy) ** 2; if (d2 < r * r * 2.4) hit = { label: c.label, pct: c.pct }; }
      }
    }
    return hit;
  }

  function legend(ctx, chips, x, y, w, fs) {
    let cy = y;
    ctx.textAlign = "left";
    for (const c of chips) {
      ctx.fillStyle = COLORS[c.label] || NEUTRAL; ctx.beginPath(); ctx.arc(x + fs * 0.4, cy - fs * 0.32, fs * 0.36, 0, 7); ctx.fill();
      ctx.fillStyle = INK; ctx.font = `600 ${fs}px ${SANS}`;
      ctx.fillText(c.label, x + fs * 1.1, cy);
      ctx.font = `500 ${fs * 0.86}px ${MONO}`; ctx.fillStyle = MUTE;
      ctx.fillText(`${c.pct}%`, x + fs * 1.1 + ctx.measureText(c.label).width + fs * 0.6, cy);
      cy += fs * 1.55;
    }
  }

  function drawComposition(ctx, w, h, X, el, hover, small) {
    const pad = small ? 14 : 26, top = small ? 92 : 104;
    const capt = () => {
      ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${small ? 10 : 11}px ${MONO}`;
      ctx.fillText("112신고 · 광주광역시경찰청 · 2025 · 자석 1개 = 신고 1%", pad, small ? 18 : 22);
      ctx.fillStyle = INK; ctx.font = `700 ${small ? 15 : 19}px ${SANS}`;
      ctx.fillText("광주 신고 100건 중 중요범죄는 몇 건?", pad, small ? 38 : 48);
      ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 10.5 : 12}px ${SANS}`;
      const major = find(X.gjChips, "중요범죄");
      ctx.fillText(`빨간 자석(중요범죄) ${major.n}개 · ${major.pct}% · 나머지는 질서유지·교통·생활 민원`, pad, small ? 56 : 70);
    };
    capt();
    const availH = h - top - pad, availW = w - pad * 2;
    const bh = small ? Math.min(availH * 0.62, availW) : availH;
    const bw = small ? bh : Math.min(bh, availW * 0.62);
    board(ctx, pad, top, bw, bh);
    const hit = chipGrid(ctx, order(X.gjChips), pad, top, bw, bh, 10, el, hover);
    if (!small) legend(ctx, X.gjChips, pad + bw + 22, top + 24, w - pad - bw - 40, 13.5);
    else legend(ctx, X.gjChips, pad, top + bh + 16, w - pad * 2, 11.5);
    return hit;
  }

  function drawTrend(ctx, w, h, X, el, hover, small) {
    const pad = small ? 14 : 26, top = small ? 88 : 100;
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${small ? 10 : 11}px ${MONO}`;
    ctx.fillText("112신고 · 경기도북부경찰청 · 코드별 · 자석 1개 = 그 해 신고 10%", pad, small ? 18 : 22);
    ctx.fillStyle = INK; ctx.font = `700 ${small ? 15 : 19}px ${SANS}`;
    ctx.fillText("긴급 출동 신고는 10년 내내 소수였다", pad, small ? 38 : 48);
    const last = X.years[X.years.length - 1];
    ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 10.5 : 12}px ${SANS}`;
    ctx.fillText(`${last}년 긴급신고 ${X.urgentPct[last]}% · 10년 내내 대략 ${Math.min(...Object.values(X.urgentPct)).toFixed(0)}~${Math.max(...Object.values(X.urgentPct)).toFixed(0)}%`, pad, small ? 56 : 70);

    const cols = 5, rows = Math.ceil(X.years.length / cols);
    const gap = small ? 10 : 12, labelH = small ? 16 : 18;
    const tw = (w - pad * 2 - gap * (cols - 1)) / cols;
    const bh = Math.min(tw * 0.78, (h - top - pad - (rows - 1) * (gap + labelH)) / rows - labelH);
    const blockH = rows * bh + (rows - 1) * (gap + labelH) + labelH;
    const y00 = top + Math.max(0, (h - pad - top - blockH) / 2);
    let hit = null;
    X.years.forEach((y, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x0 = pad + col * (tw + gap), y0 = y00 + row * (bh + gap + labelH);
      board(ctx, x0, y0, tw, bh);
      const g = chipGrid(ctx, order(X.yearChips[y]), x0, y0, tw, bh, 5, el, hover, 10);
      if (g) hit = { ...g, year: y, total: X.yearTotal[y], urgent: X.urgentPct[y] };
      ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `600 ${small ? 10 : 11.5}px ${MONO}`;
      ctx.fillText(y, x0 + tw / 2, y0 + bh + labelH - 3);
    });
    return hit;
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : `500 11px ${MONO}`);
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 10 + lines.length * 17;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(22,30,16,.94)"; roundRect(ctx, bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = "#b8382a"; ctx.lineWidth = 1; roundRect(ctx, bx + .5, by + .5, bw - 1, bh - 1, 6); ctx.stroke();
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k ? "#ffd9c8" : "#e7ecd8"; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 19 + j * 17); });
  }

  // ---------------------------------------------------------------- thumb (own compact layout)
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = Math.max(10, w * 0.03);
    // page draws its own "데이터 N개" badge over the top-left corner (~10,10 to ~100,30) — clear it
    const line1Y = Math.max(pad + w * 0.026, 42), line2Y = Math.max(pad + w * 0.072, 66);
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${Math.max(9, w * 0.026)}px ${MONO}`;
    ctx.fillText("광주 112신고 100건 중", pad, line1Y);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.max(13, w * 0.048)}px ${SANS}`;
    ctx.fillText("중요범죄는 몇 건일까", pad, line2Y);
    const BOTTOM_CLEAR = 58; // keep the board's own bottom-left glyph badge clear
    const chips = d.gjChips, side = Math.min(w * 0.5, h - line2Y - 14 - BOTTOM_CLEAR);
    const x0 = pad, y0 = h - side - BOTTOM_CLEAR;
    board(ctx, x0, y0, side, side);
    const grow = KF.clamp((t % 10) / 1.2, 0.1, 1);
    chipGrid(ctx, order(chips), x0, y0, side, side, 10, grow, null);
    const major = find(chips, "중요범죄"), duty = find(chips, "기타경찰업무");
    ctx.textAlign = "right"; ctx.fillStyle = "#b8382a"; ctx.font = `700 ${Math.max(20, w * 0.09)}px ${SANS}`;
    ctx.fillText(`${major.pct}%`, w - pad, y0 + side * 0.42);
    ctx.font = `500 ${Math.max(8.5, w * 0.024)}px ${MONO}`; ctx.fillStyle = MUTE;
    ctx.fillText("만 중요범죄", w - pad, y0 + side * 0.42 + w * 0.034);
    ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `700 ${Math.max(14, w * 0.04)}px ${SANS}`;
    ctx.fillText(`${(100 - major.pct).toFixed(0)}%는 다른 이유`, w - pad, y0 + side * 0.72);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let view = "종류", t0 = performance.now(), hover = null;
    KF.segment(controls, [{ id: "종류", label: "신고 종류 (광주)" }, { id: "추세", label: "긴급도 추세 (경기북부)" }], view, (id) => { view = id; t0 = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, small = w <= 560, el = (performance.now() - t0) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const hit = view === "종류" ? drawComposition(ctx, w, h, d, el, hover, small) : drawTrend(ctx, w, h, d, el, hover, small);
      if (hit && hover) {
        const lines = hit.year
          ? [[`${hit.year}년`, 1], [`전체 ${KF.fmt(hit.total)}건`, 0], [`긴급 ${hit.urgent}% · 이 자석: ${hit.label} ${hit.pct}%`, 0]]
          : [[hit.label, 1], [`${hit.pct}% (100건 중 약 ${Math.round(hit.pct)}건)`, 0]];
        tip(ctx, w, h, lines, hover);
      }
    });
  }

  VIZ["police-calls"] = { thumb, mount, bg: BG };
})();
