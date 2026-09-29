// 84 uncontested — "후보 번호표 게시판". Four cork-board columns, one per office (시도지사·구시군장·시도의원·
// 구시군의원): each is a grid of pegs. A peg with a single hanging number tag stands for a district decided
// without a vote (무투표); a peg with a stacked pair of tags stands for a contested one. The share lit amber
// matches the real uncontested rate for the selected election. A side strip ranks 시도 by 2026 구시군의원 rate.
(() => {
  const BG = "#d7b989";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#3a2a16", MUTE = "rgba(58,42,22,.62)", FAINT = "rgba(58,42,22,.18)";
  const BOARD = "#c7a670", BOARD_D = "#b3925d", HOOK = "#4a3419", TAG = "#f6efdd", TAG_BACK = "#d8c39a", TAG_UNC = "#c1502e", RING = "#7a2e17";

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    return (DEC = { offices: d.offices, series: d.series, sido: d.sido26_office6, examples: d.examples });
  }

  function board(ctx, x0, y0, w, h) {
    ctx.fillStyle = BOARD; ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = BOARD_D; ctx.lineWidth = 3; ctx.strokeRect(x0 + 1.5, y0 + 1.5, w - 3, h - 3);
    // cork speckle
    ctx.fillStyle = "rgba(107,79,44,.14)";
    for (let i = 0; i < (w * h) / 900; i++) {
      const rx = x0 + ((i * 53) % w), ry = y0 + ((i * 97) % h);
      ctx.beginPath(); ctx.arc(rx, ry, 0.9, 0, 7); ctx.fill();
    }
  }

  // one peg: a hook dot, and either one bright tag (uncontested) or a muted stacked pair (contested)
  function peg(ctx, cx, cy, s, uncontested, grow, hoverHit, showNum) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(grow, grow);
    ctx.fillStyle = HOOK; ctx.beginPath(); ctx.arc(0, -s * 1.3, s * 0.2, 0, 7); ctx.fill();
    const tagW = s * 1.5, tagH = s * 1.08;
    function tag(dx, dy, col, num, bold) {
      ctx.strokeStyle = "rgba(58,42,22,.55)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, -s * 1.22); ctx.lineTo(dx, dy - tagH * 0.5 + 2); ctx.stroke();
      ctx.fillStyle = col; ctx.strokeStyle = bold ? RING : "rgba(58,42,22,.55)"; ctx.lineWidth = bold ? 1.6 : 1.1;
      const rr = new Path2D(); rr.roundRect ? rr.roundRect(dx - tagW / 2, dy - tagH / 2, tagW, tagH, tagH * 0.28) : null;
      if (rr) { ctx.fill(rr); ctx.stroke(rr); } else { ctx.beginPath(); ctx.ellipse(dx, dy, tagW * 0.5, tagH * 0.5, 0, 0, 7); ctx.fill(); ctx.stroke(); }
      if (num != null && showNum) { ctx.fillStyle = bold ? "#fbeee2" : INK; ctx.font = `800 ${Math.max(7, s * 0.72)}px ${MONO}`; ctx.textAlign = "center"; ctx.fillText(num, dx, dy + s * 0.26); }
    }
    if (uncontested) {
      tag(0, -s * 0.1, TAG_UNC, "1", true);
      if (hoverHit) { ctx.strokeStyle = "#fbeee2"; ctx.lineWidth = 2; ctx.strokeRect(-tagW * 0.62, -s * 0.1 - tagH * 0.62, tagW * 1.24, tagH * 1.24); }
    } else {
      tag(-s * 0.26, s * 0.12, TAG_BACK, null, false);
      tag(s * 0.22, -s * 0.22, TAG, "2", false);
      if (hoverHit) { ctx.strokeStyle = RING; ctx.lineWidth = 2; ctx.strokeRect(s * 0.22 - tagW * 0.62, -s * 0.22 - tagH * 0.62, tagW * 1.24, tagH * 1.24); }
    }
    ctx.restore();
  }

  // one office column: a cap-sized grid of pegs, `lit` of them uncontested (front-loaded so the amber count is legible)
  function column(ctx, x0, y0, w, h, cap, lit, el, hover, small) {
    board(ctx, x0, y0, w, h);
    const pad = w * 0.12, gx = w - pad * 2, gy = h - pad * 2;
    const cols = small ? 4 : 5, rows = Math.ceil(cap / cols);
    const s = Math.min(gx / cols, gy / rows) * 0.42;
    const stepX = gx / cols, stepY = gy / rows;
    let hit = -1;
    for (let i = 0; i < cap; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      const cx = x0 + pad + stepX * (c + 0.5), cy = y0 + pad + stepY * (r + 0.5) + s * 0.5;
      const grow = KF.clamp(el * cap * 1.15 - i, 0, 1);
      if (grow <= 0) continue;
      const isHover = hover && Math.hypot(hover[0] - cx, hover[1] - cy) < s * 1.5;
      if (isHover) hit = i;
      peg(ctx, cx, cy, s, i < lit, grow, isHover, s > 7);
    }
    return hit;
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : k === 2 ? `500 10.5px ${MONO}` : `500 11.5px ${SANS}`);
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(58,42,22,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#f3ead4"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? "rgba(243,234,212,.75)" : k === 1 ? "#e8c27a" : "#f3ead4"; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + j * 18); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const X = decode(d), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const r6 = X.series["6"][X.series["6"].length - 1];
    const cap = 20, lit = Math.round((r6.uncW / r6.seats) * cap);
    const el = KF.clamp((c - 0.3) / 1.4, 0, 1);
    column(ctx, w * 0.05, h * 0.04, w * 0.52, h * 0.92, cap, lit, el, null, true);
    const a = KF.clamp((c - 1.3) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    const tx = w * 0.62;
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText("2026 기초의원", tx, h * 0.22);
    ctx.fillStyle = RING; ctx.font = `700 ${Math.round(h * 0.16)}px ${SANS}`;
    ctx.fillText(`${r6.uncW}명`, tx, h * 0.44);
    ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText("무투표 당선", tx, h * 0.56);
    ctx.fillStyle = MUTE; ctx.font = `500 ${Math.round(h * 0.044)}px ${SANS}`;
    ctx.fillText("시·도지사는 0명", tx, h * 0.72);
    ctx.fillText(`(${r6.seats.toLocaleString()}석 중)`, tx, h * 0.84);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage);
    const years = X.series["6"].map((r) => r.y);
    let yi = years.length - 1, t0 = performance.now(), hover = null, cols = [];
    KF.segment(controls, years.map((y, i) => ({ id: i, label: `${y}` })), years.length - 1, (id) => { yi = id; t0 = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, el = KF.clamp((performance.now() - t0) / 1100, 0, 1);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 14.5}px ${SERIF}`;
      ctx.fillText(`${years[yi]}년 지방선거 · 후보 번호표 게시판`, full ? 18 : 12, full ? 30 : 22);
      ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`;
      ctx.fillText("번호표 1장 = 무투표 당선 · 번호표 2장 이상 = 경쟁 · 칸 하나가 여러 석을 대표합니다", full ? 18 : 12, full ? 48 : 34);

      const boardTop = full ? 64 : 46, boardBottom = full ? h - 30 : h * 0.56;
      const panelW = full ? (w - 40) * 0.7 : w - 20;
      const gx = full ? 14 : 8, colW = (panelW - gx * 3) / 4;
      cols = [];
      let hitInfo = null;
      X.offices.forEach((o, i) => {
        const r = X.series[o.tc][yi];
        const cap = full ? 20 : 12;
        const lit = Math.round((r.uncW / r.seats) * cap);
        const x0 = (full ? 18 : 10) + i * (colW + gx);
        const hh = boardBottom - boardTop - (full ? 26 : 20);
        const hit = column(ctx, x0, boardTop, colW, hh, cap, lit, el, hover, !full);
        cols.push({ x0, y0: boardTop, w: colW, h: hh, o, r, cap, lit });
        if (hit >= 0) hitInfo = { o, r, unc: hit < lit };
        ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 12.5 : 10}px ${SANS}`;
        ctx.fillText(o.label, x0 + colW / 2, boardTop + hh + (full ? 18 : 14));
        ctx.fillStyle = r.uncW > 0 ? RING : MUTE; ctx.font = `600 ${full ? 12 : 10}px ${MONO}`;
        ctx.fillText(`${r.uncW}/${KF.fmt(r.seats)} 무투표`, x0 + colW / 2, boardTop + hh + (full ? 34 : 27));
      });

      if (full) {
        const px = 18 + panelW + 22, pw = w - px - 18;
        ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 11.5px ${SANS}`;
        ctx.fillText("시도별 기초의원 무투표 비율 (2026)", px, boardTop + 14);
        const rows = X.sido.slice().sort((a, b) => b.rate - a.rate).slice(0, 10);
        const rh = (boardBottom - boardTop - 20) / rows.length, maxR = Math.max(...X.sido.map((r) => r.rate), 1);
        rows.forEach((r, i) => {
          const y = boardTop + 24 + i * rh;
          ctx.fillStyle = INK; ctx.font = `500 10.5px ${SANS}`; ctx.textAlign = "left";
          ctx.fillText(r.sido.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, ""), px, y + rh * 0.62);
          const bx = px + 62, bw = (pw - 62 - 46) * (r.rate / maxR);
          ctx.fillStyle = r.rate > 15 ? RING : "#8a6a3a"; ctx.fillRect(bx, y + rh * 0.18, Math.max(1, bw), rh * 0.5);
          ctx.fillStyle = MUTE; ctx.font = `500 10px ${MONO}`; ctx.textAlign = "left";
          ctx.fillText(`${r.rate.toFixed(1)}%`, bx + bw + 5, y + rh * 0.62);
        });
      } else {
        const py = boardBottom + 30, pw = w - 24;
        ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 10.5px ${SANS}`;
        ctx.fillText("시도별 기초의원 무투표 비율 (2026) · 상위 5곳", 12, py);
        const rows = X.sido.slice().sort((a, b) => b.rate - a.rate).slice(0, 5);
        const rh = 24, maxR = Math.max(...X.sido.map((r) => r.rate), 1);
        rows.forEach((r, i) => {
          const y = py + 14 + i * rh;
          ctx.fillStyle = INK; ctx.font = `500 10.5px ${SANS}`; ctx.textAlign = "left";
          const nm = r.sido.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "");
          ctx.fillText(nm, 12, y + rh * 0.55);
          const bx = 66, bw = (pw - 66 - 56) * (r.rate / maxR);
          ctx.fillStyle = r.rate > 15 ? RING : "#8a6a3a"; ctx.fillRect(bx, y + 2, Math.max(1, bw), rh * 0.55);
          ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`;
          ctx.fillText(`${r.rate.toFixed(1)}%`, bx + bw + 6, y + rh * 0.55);
        });
      }

      if (hitInfo && hover) {
        const { o, r, unc } = hitInfo;
        const ex = X.examples[`office${o.tc}_${years[yi]}`] || [];
        const lines = [[o.full, 1], [`정수 ${KF.fmt(r.seats)} · 후보 ${KF.fmt(r.cands)} · 무투표 ${r.uncW}명 (${(r.uncW / r.seats * 100).toFixed(1)}%)`, 0]];
        if (unc && ex.length) lines.push([`예: ${ex[0]}`, 2]);
        tip(ctx, w, h, lines, hover);
      }
    });
  }

  VIZ["uncontested"] = { thumb, mount, bg: BG };
})();
