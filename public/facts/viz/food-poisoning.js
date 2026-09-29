// 75 food-poisoning — "급식 식판 달력". A stainless cafeteria tray whose compartments reshape into
// month / cause / place. Compartment size = share of case count (건수); a red-orange ring marks
// whichever compartment actually carries the most patients (환자수) — often a different one.
(() => {
  const BG = "#f0d878";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#2c2210", MUTE = "rgba(44,34,16,.64)", FAINT = "rgba(44,34,16,.16)";
  const TRAY = ["#e9e3d4", "#b9b2a0"];              // steel rim gradient (light, dark)
  const WELL = ["#d8d0bc", "#a49c88"];              // recessed compartment gradient
  const FOOD = "#8a5a2e", FOOD_HI = "#8a5a2e";       // stew colour for the count blob
  const PAT_RING = "#c8401f";                        // ring = this cell leads in patient count
  const SUMMER_RING = "#c8401f";

  const man = (v) => (v >= 10000 ? `${KF.fmt(v / 10000, 1)}만` : KF.fmt(v));
  const pct = (v, t) => `${(v / t) * 100}`;

  const SEASON = { "3월": "봄", "4월": "봄", "5월": "봄", "6월": "여름", "7월": "여름", "8월": "여름", "9월": "가을", "10월": "가을", "11월": "가을", "12월": "겨울", "1월": "겨울", "2월": "겨울" };

  function views(d) {
    const total = { case: d.caseTotal, pat: d.patTotal };
    const month = d.month.map((r) => ({ key: r.m, label: r.m, case: r.case, pat: r.pat, summer: d.summer.includes(r.m) }));
    const cause = d.cause.filter((r) => r.case > 0).map((r) => ({ key: r.k, label: r.k, case: r.case, pat: r.pat }));
    const place = d.place.map((r) => ({ key: r.k, label: r.k, case: r.case, pat: r.pat }));
    for (const arr of [cause, place]) {
      const topPat = arr.reduce((a, b) => (b.pat > a.pat ? b : a), arr[0]);
      arr.forEach((r) => (r.patTop = r === topPat));
    }
    const seasonOrder = ["봄", "여름", "가을", "겨울"];
    const season = seasonOrder.map((s) => ({ key: s, case: month.filter((m) => SEASON[m.key] === s).reduce((a, b) => a + b.case, 0) }));
    return { total, month, cause, place, season };
  }

  // ---------------------------------------------------------------- layout: compartments for one view
  function layout(items, x0, y0, w, h, cols) {
    const rows = Math.ceil(items.length / cols);
    const gap = Math.max(4, w * 0.012);
    const cw = (w - gap * (cols - 1)) / cols, ch = (h - gap * (rows - 1)) / rows;
    return items.map((it, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      return { ...it, x: x0 + c * (cw + gap), y: y0 + r * (ch + gap), w: cw, h: ch };
    });
  }

  function wrap(ctx, s, maxW) {
    if (ctx.measureText(s).width <= maxW) return [s];
    const cut = s.indexOf(" ") > 0 ? s.indexOf(" ") : Math.ceil(s.length / 2);
    return [s.slice(0, cut).trim(), s.slice(cut).trim()];
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function cell(ctx, it, maxCase, totalCase, small, grow, fontBase) {
    const { x, y, w, h } = it;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, WELL[0]); g.addColorStop(1, WELL[1]);
    roundRect(ctx, x, y, w, h, Math.min(10, w * 0.12));
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(44,34,16,.28)"; ctx.stroke();

    // food blob: area sized relative to this view's biggest cell; label shows the real share of the total
    const sizeShare = it.case / maxCase;
    const pctOfTotal = (it.case / totalCase) * 100;
    const rad = Math.min(w, h) * 0.34 * Math.sqrt(Math.max(sizeShare, 0.02)) * grow;
    const cx = x + w / 2, cy = y + h * (small ? 0.42 : 0.46);
    if (rad > 1) {
      // deeper, more saturated toward the largest share; paler toward the smallest
      const k = KF.clamp(sizeShare, 0, 1);
      const lo = [201, 163, 110], hi = [122, 71, 26];
      const mix = lo.map((c, i) => Math.round(KF.lerp(c, hi[i], k)));
      const fg = ctx.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, rad * 0.1, cx, cy, rad);
      fg.addColorStop(0, `rgb(${mix.map((c) => Math.min(255, c + 45)).join(",")})`);
      fg.addColorStop(1, `rgb(${mix.join(",")})`);
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill();
    }
    if (it.summer || it.patTop) {
      ctx.strokeStyle = it.summer ? SUMMER_RING : PAT_RING;
      ctx.lineWidth = 2.2; roundRect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, Math.min(9, w * 0.11)); ctx.stroke();
    }

    // label + case share
    ctx.textAlign = "center"; ctx.fillStyle = INK;
    const lf = Math.max(small ? 9 : 10.5, Math.min(fontBase, w * 0.16));
    ctx.font = `600 ${lf}px ${SANS}`;
    const lines = small && w < 70 ? [it.label] : wrap(ctx, it.label, w - 6);
    const ly = y + h - (lines.length > 1 ? lines.length * (lf + 2) + 6 : lf + 8);
    lines.forEach((ln, i) => ctx.fillText(ln, cx, ly + i * (lf + 2)));
    if (!small || w > 74) {
      ctx.font = `500 ${Math.max(8.5, lf * 0.82)}px ${MONO}`; ctx.fillStyle = MUTE;
      ctx.fillText(`${pctOfTotal.toFixed(1)}%`, cx, y + h - 6);
    }
  }

  function draw(ctx, w, h, X, view, el, hover, small) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = small ? 14 : 26, top = small ? 78 : 92;
    // tray body
    const tg = ctx.createLinearGradient(0, top - 14, 0, h - pad);
    tg.addColorStop(0, TRAY[0]); tg.addColorStop(1, TRAY[1]);
    roundRect(ctx, pad - 10, top - 14, w - (pad - 10) * 2, h - top - pad + 24, 16);
    ctx.fillStyle = tg; ctx.fill();
    ctx.strokeStyle = "rgba(44,34,16,.35)"; ctx.lineWidth = 1.4; ctx.stroke();

    const items = view === "월별" ? X.month : view === "원인별" ? X.cause : X.place;
    const maxCase = Math.max(...items.map((i) => i.case));
    const cols = view === "월별" ? (small ? 3 : 4) : small ? 2 : 5;
    const cells = layout(items, pad + 4, top, w - (pad + 4) * 2, h - top - pad - 8, cols);
    const grow = KF.clamp(el / 1.1, 0.05, 1);
    let hit = null;
    for (const it of cells) {
      cell(ctx, it, maxCase, X.total.case, small, grow, small ? 11 : 13);
      if (hover && hover[0] >= it.x && hover[0] <= it.x + it.w && hover[1] >= it.y && hover[1] <= it.y + it.h) hit = it;
    }

    // caption
    ctx.textAlign = "left";
    ctx.fillStyle = MUTE; ctx.font = `600 ${small ? 10 : 11}px ${MONO}`;
    ctx.fillText("식중독 발생건수 · 2018–2025 합계 · 칸 크기 = 건수 비중", pad, small ? 18 : 22);
    ctx.fillStyle = INK; ctx.font = `700 ${small ? 15 : 19}px ${SANS}`;
    const head = view === "월별" ? "여름(6~8월) 칸에는 테두리가 있다" : view === "원인별" ? "빨간 테두리 = 환자수 1위" : "빨간 테두리 = 환자수 1위";
    ctx.fillText(head, pad, small ? 38 : 48);
    ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 10.5 : 12}px ${SANS}`;
    const sub = view === "월별"
      ? `여름 석 달 ${(X.month.filter((m) => m.summer).reduce((a, b) => a + b.case, 0) / X.total.case * 100).toFixed(0)}% · 나머지 ${(100 - X.month.filter((m) => m.summer).reduce((a, b) => a + b.case, 0) / X.total.case * 100).toFixed(0)}%는 다른 계절`
      : view === "원인별" ? "건수 1위는 특정 세균이 아니라 '불명'" : "식당은 자주, 급식소는 한 번에 크게";
    ctx.fillText(sub, pad, small ? 56 : 70);

    if (hit) {
      const lines = [[hit.label, 1], [`건수 ${KF.fmt(hit.case)}건 · ${(hit.case / X.total.case * 100).toFixed(1)}%`, 0], [`환자수 ${KF.fmt(hit.pat)}명 · ${(hit.pat / X.total.pat * 100).toFixed(1)}%`, 0]];
      const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : `500 11px ${MONO}`);
      const bw = Math.min(w - 16, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
      const bh = 10 + lines.length * 17;
      let bx = KF.clamp(hit.x + hit.w / 2 - bw / 2, 6, w - bw - 6);
      let by = hit.y - bh - 10; if (by < top - 12) by = hit.y + hit.h + 8;
      ctx.fillStyle = "rgba(35,27,12,.95)"; roundRect(ctx, bx, by, bw, bh, 6); ctx.fill();
      ctx.strokeStyle = PAT_RING; ctx.lineWidth = 1; roundRect(ctx, bx + .5, by + .5, bw - 1, bh - 1, 6); ctx.stroke();
      ctx.textAlign = "left";
      lines.forEach(([t, k], j) => { ctx.fillStyle = k ? "#ffe6b8" : "#f0e6cf"; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 19 + j * 17); });
    }
    return hit;
  }

  // ---------------------------------------------------------------- thumb (own compact layout: a card-size
  // 16:9 canvas is far smaller than the detail stage, so this does not reuse draw()).
  function thumb(ctx, w, h, t, d) {
    const X = views(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = Math.max(10, w * 0.03);
    // page draws its own "데이터 N개" badge over the top-left corner (~10,10 to ~100,30) — clear it
    const line1Y = Math.max(pad + w * 0.026, 42), line2Y = Math.max(pad + w * 0.075, 66);
    ctx.textAlign = "left"; ctx.fillStyle = MUTE;
    ctx.font = `600 ${Math.max(9, w * 0.028)}px ${MONO}`;
    ctx.fillText("식중독 · 계절별 발생건수", pad, line1Y);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.max(13, w * 0.05)}px ${SANS}`;
    ctx.fillText("여름에만 걸릴까", pad, line2Y);

    // four small tray wells, one per season, summer emphasised
    const rowY = h * 0.52, cw = (w - pad * 2) / 4.6, gap = cw * 0.18, r = Math.min(cw, h * 0.3) * 0.42;
    const maxC = Math.max(...X.season.map((s) => s.case));
    const grow = KF.clamp((t % 10) / 1.1, 0.15, 1);
    X.season.forEach((s, i) => {
      const cx = pad + cw / 2 + i * (cw + gap), cy = rowY;
      const k = s.case / maxC, rad = r * Math.sqrt(Math.max(k, 0.05)) * (s.key === "여름" ? 1 : 0.92) * grow;
      roundRect(ctx, cx - cw / 2, cy - r - 6, cw, r * 2 + 26, 8);
      ctx.fillStyle = "rgba(255,255,255,.28)"; ctx.fill();
      if (s.key === "여름") { ctx.strokeStyle = SUMMER_RING; ctx.lineWidth = 2; roundRect(ctx, cx - cw / 2 + 1, cy - r - 5, cw - 2, r * 2 + 24, 7); ctx.stroke(); }
      const fg = ctx.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, rad * 0.1, cx, cy, Math.max(rad, 0.1));
      fg.addColorStop(0, "#b98a51"); fg.addColorStop(1, s.key === "여름" ? "#8a5a2e" : "#a9825a");
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(cx, cy, Math.max(rad, 1), 0, 7); ctx.fill();
      ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `600 ${Math.max(9, w * 0.026)}px ${SANS}`;
      ctx.fillText(s.key, cx, cy + r + 18);
    });

    const summerPct = X.season.find((s) => s.key === "여름").case / X.total.case * 100;
    ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `700 ${Math.max(16, w * 0.062)}px ${SANS}`;
    ctx.fillText(`${summerPct.toFixed(0)}%`, w - pad, line2Y);
    ctx.font = `500 ${Math.max(8.5, w * 0.022)}px ${MONO}`; ctx.fillStyle = MUTE;
    ctx.fillText("만 여름 몫", w - pad, line2Y + w * 0.032);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = views(d), s = KF.canvas(stage);
    let view = "월별", t0 = performance.now(), hover = null;
    KF.segment(controls, [{ id: "월별", label: "월별" }, { id: "원인별", label: "원인별" }, { id: "장소별", label: "장소별" }], view, (id) => {
      view = id; t0 = performance.now();
    });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, small = w <= 560, el = (performance.now() - t0) / 1000;
      draw(ctx, w, h, X, view, el, hover, small);
    });
  }

  VIZ["food-poisoning"] = { thumb, mount, bg: BG };
})();
