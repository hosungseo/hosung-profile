// 87 digital-access — "자작나무 퍼즐 조각". A dashed socket the size of the general public (=100) for each
// of 접근·역량·활용; each vulnerable group's own wooden puzzle piece sits inside, scaled to its relative
// index — so a smaller piece leaves a visible gap around it, never a chain of steps (the three columns are
// independent indices, not a funnel). Second view: internet-use rate by age (a different survey).
(() => {
  const BG = "#d9d2bd";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#3a2f1f", DIM = "rgba(58,47,31,.62)", FAINT = "rgba(58,47,31,.18)";
  const GROUP_C = { 고령층: "#a2453f", 장애인: "#2f6e6a", 저소득층: "#5a4a8a", 농어민: "#8a6a2f" };
  const CARD = "#f6f1e4";

  // a rounded square with one tab (top) and one notch (bottom) — reads as "a puzzle piece" without full interlock
  function piecePath(cx, cy, s) {
    const r = s * 0.14, tab = s * 0.19, half = s / 2;
    const p = new Path2D();
    p.moveTo(cx - half + r, cy - half);
    p.lineTo(cx - tab, cy - half);
    p.arc(cx, cy - half - tab * 0.05, tab, Math.PI, 0, true);
    p.lineTo(cx + half - r, cy - half);
    p.arcTo(cx + half, cy - half, cx + half, cy - half + r, r);
    p.lineTo(cx + half, cy + half - r);
    p.arcTo(cx + half, cy + half, cx + half - r, cy + half, r);
    p.lineTo(cx + tab, cy + half);
    p.arc(cx, cy + half + tab * 0.05, tab, 0, Math.PI, true);
    p.lineTo(cx - half + r, cy + half);
    p.arcTo(cx - half, cy + half, cx - half, cy + half - r, r);
    p.lineTo(cx - half, cy - half + r);
    p.arcTo(cx - half, cy - half, cx - half + r, cy - half, r);
    p.closePath();
    return p;
  }

  function grain(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.clip(piecePath(cx, cy, s));
    ctx.strokeStyle = "rgba(0,0,0,.08)"; ctx.lineWidth = Math.max(0.6, s * 0.012);
    for (let i = -3; i <= 3; i++) {
      const yy = cy + (i / 3) * s * 0.42 + Math.sin(i * 1.7) * s * 0.02;
      ctx.beginPath(); ctx.moveTo(cx - s * 0.6, yy); ctx.bezierCurveTo(cx - s * 0.2, yy + s * 0.03, cx + s * 0.2, yy - s * 0.03, cx + s * 0.6, yy); ctx.stroke();
    }
    ctx.restore();
  }

  function socket(ctx, cx, cy, s, hover) {
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(58,47,31,.45)"; ctx.lineWidth = 1.4;
    ctx.stroke(piecePath(cx, cy, s));
    ctx.restore();
    const hit = hover && Math.abs(hover[0] - cx) < s * 0.56 && Math.abs(hover[1] - cy) < s * 0.56;
    return hit;
  }

  function piece(ctx, cx, cy, s, value, color, full) {
    const scale = KF.clamp(value / 100, 0.12, 1);
    const ss = s * scale;
    const p = piecePath(cx, cy, ss);
    ctx.fillStyle = color; ctx.fill(p);
    grain(ctx, cx, cy, ss, color);
    ctx.strokeStyle = "rgba(0,0,0,.28)"; ctx.lineWidth = Math.max(0.8, full ? 1.4 : 1); ctx.stroke(p);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.beginPath(); ctx.ellipse(cx - ss * 0.16, cy - ss * 0.18, ss * 0.22, ss * 0.1, -0.5, 0, 7); ctx.fill();
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
    lines.forEach(([t, k], i) => { ctx.fillStyle = k === 2 ? DIM : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + i * 18); });
  }

  // ---------------------------------------------------------------- main grid: groups (rows) x labels (cols)
  function grid(ctx, d, x0, y0, w, h, yi, grow, hover, full) {
    const groupNames = d.cohorts.map((c) => c.name);
    const cols = d.labels.length, rows = groupNames.length;
    const colW = w / cols, rowH = h / rows, s = Math.min(colW, rowH) * (full ? 0.62 : 0.56);
    ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 12.5 : 11}px ${SANS}`;
    d.labels.forEach((lab, ci) => ctx.fillText(lab, x0 + colW * (ci + 0.5), y0 - (full ? 10 : 6)));
    let hit = null;
    groupNames.forEach((name, ri) => {
      const cy = y0 + rowH * (ri + 0.5);
      ctx.textAlign = "right"; ctx.fillStyle = GROUP_C[name]; ctx.font = `700 ${full ? 12 : 10.5}px ${SANS}`;
      ctx.fillText(name, x0 - (full ? 14 : 8), cy + 4);
      d.labels.forEach((lab, ci) => {
        const cx = x0 + colW * (ci + 0.5);
        const on = socket(ctx, cx, cy, s, hover);
        const val = d.cohorts[ri].series[yi].values[ci];
        piece(ctx, cx, cy, s, val * grow, GROUP_C[name], full);
        ctx.fillStyle = INK; ctx.font = `600 ${full ? 10.5 : 9.5}px ${MONO}`; ctx.textAlign = "center";
        ctx.fillText(val.toFixed(1), cx, cy + s * 0.56 + (full ? 15 : 12));
        if (on) hit = { name, lab, val, gap: +(100 - val).toFixed(1) };
      });
    });
    return hit;
  }

  function internetView(ctx, d, x0, y0, w, h, hover, full) {
    const rows = d.internet, bh = Math.min(full ? 30 : 22, (h - 10) / rows.length);
    const lw = full ? 74 : 58;
    let hit = null;
    rows.forEach((r, i) => {
      const y = y0 + i * (bh + (full ? 8 : 5));
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `500 ${full ? 12 : 10.5}px ${SANS}`;
      ctx.fillText(r.name, x0, y + bh * 0.68);
      const bw = (w - lw - 50) * (r.value / 100);
      const c = r.name === "70세 이상" ? GROUP_C.고령층 : "#8a7a55";
      ctx.fillStyle = FAINT; ctx.fillRect(x0 + lw, y, w - lw - 50, bh);
      ctx.fillStyle = c; ctx.fillRect(x0 + lw, y, bw, bh);
      ctx.fillStyle = INK; ctx.font = `600 ${full ? 11.5 : 10}px ${MONO}`; ctx.textAlign = "left";
      ctx.fillText(`${r.value.toFixed(1)}%`, x0 + lw + bw + 6, y + bh * 0.68);
      if (hover && hover[1] >= y && hover[1] < y + bh && hover[0] >= x0) hit = r;
    });
    return hit;
  }

  let DEC = null;
  function decode(d) { if (!DEC || DEC.d !== d) DEC = { d }; return DEC; }

  // ---------------------------------------------------------------- thumb
  // Card layout guard: badge top-left (x<96, y<40), glyph bottom-left (x<50, y>h-50).
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, grow = KF.ease(KF.clamp(c / 2.6, 0, 1));
    const yi = d.years.length - 1;
    const botY2 = h - 60, botY1 = h - 82;
    const cols = d.labels, s = h * 0.2, gx = w * 0.5, gy = 44 + (botY1 - 14 - 44) / 2;
    cols.forEach((lab, i) => {
      const cx = gx + (i - 1) * s * 1.15;
      socket(ctx, cx, gy, s, null);
      piece(ctx, cx, gy, s, d.cohorts[0].series[yi].values[i] * grow, GROUP_C.고령층, w > 260);
    });
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.072)}px ${SANS}`;
    ctx.fillText("디지털 격차", w * 0.045, botY1);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.05)}px ${MONO}`;
    ctx.fillText(`고령층 역량 ${d.cohorts[0].series[yi].values[1].toFixed(1)} (일반국민=100)`, w * 0.045, botY2);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage);
    let view = "grid", yi = d.years.length - 1, t0 = performance.now(), tGrow = performance.now(), hover = null;
    KF.segment(controls, [{ id: "grid", label: "격차 퍼즐" }, { id: "net", label: "인터넷 이용률" }], "grid", (id) => { view = id; tGrow = performance.now(); });
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = d.years.length - 1; range.step = 1; range.value = yi;
    const lab = document.createElement("label"); lab.append("연도", range);
    const readout = document.createElement("span"); readout.className = "readout"; readout.textContent = String(d.years[yi]);
    controls.append(lab, readout);
    range.oninput = () => { yi = +range.value; readout.textContent = String(d.years[yi]); };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const elGrow = (performance.now() - tGrow) / 1000, grow = KF.ease(KF.clamp(elGrow / 1.2, 0, 1));
      if (view === "grid") {
        const y = d.years[yi];
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 15}px ${SERIF}`;
        ctx.fillText(`${y}년 · 일반국민=100 소켓 안의 퍼즐 조각`, full ? 26 : 14, full ? 32 : 24);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10}px ${SANS}`;
        ctx.fillText("점선 = 일반국민 크기 · 조각이 작을수록 격차가 크다 (세 칸은 독립 지표, 순서가 아니다)", full ? 26 : 14, full ? 52 : 40);
        const top = full ? 90 : 92;
        const hit = grid(ctx, d, full ? 120 : 74, top, w - (full ? 150 : 88), h - top - (full ? 30 : 24), yi, grow, hover, full);
        if (hit && hover) tip(ctx, w, h, [[`${hit.name} · ${hit.lab}`, 1], [`${hit.val.toFixed(1)} (일반국민 대비)`, 0], [`격차 ${hit.gap.toFixed(1)}점`, 2]], hover);
      } else {
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 15}px ${SERIF}`;
        ctx.fillText(`${d.internetYear}년 · 나이대별 인터넷 이용률`, full ? 26 : 14, full ? 32 : 24);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10}px ${SANS}`;
        ctx.fillText("최근 1개월 이용 기준 · 위 퍼즐과는 다른 조사", full ? 26 : 14, full ? 52 : 40);
        const top = full ? 76 : 66;
        const hit = internetView(ctx, d, full ? 26 : 14, top, w - (full ? 52 : 28), h - top - 20, hover, full);
        if (hit && hover) tip(ctx, w, h, [[hit.name, 1], [`${hit.value.toFixed(1)}%`, 0]], hover);
      }
    });
  }

  VIZ["digital-access"] = { thumb, mount, bg: BG };
})();
