// 73 youth-employment — "성적표". A paper report card: one ruled-off "subject" row per indicator, a blue
// ballpoint sparkline per row, and a red stamp on the headline number at the top. Single-perspective instinct:
// looking at only one row gives a confident, wrong-shaped story about the whole.
(() => {
  const BG = "#ddd3a4", PAPER = "#f4efdd", RULE = "rgba(43,36,22,.16)", INK = "#2b2416", DIM = "rgba(43,36,22,.62)";
  const RED = "#a3312b", BLUE = "#2c4a7c";
  const SANS = 'Pretendard Variable, sans-serif', MONO = 'IBM Plex Mono, monospace', PEN = "'Nanum Pen Script', cursive";

  const ROWS = [
    { key: "emp1524", label: "고용률 15~24세", note: "이 숫자만 보면: 청년 취업, 줄어드는 중", good: false },
    { key: "emp2529", label: "고용률 25~29세", note: "이 숫자만 보면: 청년 고용, 역대급 호조", good: true },
    { key: "restShare", label: "쉬었음 비중", note: "이 숫자만 보면: 쉬는 청년, 계속 증가", good: false },
    { key: "nonregShare", label: "비정규직 비중", note: "이 숫자만 보면: 청년 일자리, 비정규직화", good: false },
  ];

  function idx(d, y) { return d.years.indexOf(y); }
  function fmt1(v) { return v.toFixed(1); }

  // sparkline: returns {x(year), y(value)} mapper and draws the ruled row
  function sparkline(ctx, d, key, box, hiYear, alpha) {
    const [x, y, w, h] = box, vals = d[key], years = d.years;
    const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.18 || 1;
    const X = (yy) => x + (yy - years[0]) / (years.at(-1) - years[0]) * w;
    const Y = (v) => y + h - (v - (lo - pad)) / (hi + pad - (lo - pad)) * h;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = BLUE; ctx.lineWidth = 2; ctx.beginPath();
    years.forEach((yy, i) => { const px = X(yy), py = Y(vals[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.stroke();
    const hi_i = idx(d, hiYear);
    if (hi_i >= 0) {
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(X(hiYear), Y(vals[hi_i]), alpha > 0.7 ? 4 : 3, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(244,239,221,.9)"; ctx.lineWidth = 1.4; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return { x, y, w, h, X, Y, lo: lo - pad, hi: hi + pad };
  }

  function text(ctx, t, x, y, size, color, align, weight, font) {
    ctx.font = `${weight || 500} ${size}px ${font || SANS}`; ctx.fillStyle = color; ctx.textAlign = align || "left"; ctx.fillText(t, x, y);
  }

  function stamp(ctx, cx, cy, r, label, sub) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.06);
    ctx.strokeStyle = RED; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.55, r * 0.92, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = RED; ctx.textAlign = "center";
    ctx.font = `700 ${r * 0.4}px ${SANS}`; ctx.fillText(label, 0, -r * 0.06);
    if (sub) { ctx.font = `600 ${r * 0.24}px ${MONO}`; ctx.fillText(sub, 0, r * 0.38); }
    ctx.restore();
  }

  function tip(ctx, w, h, x, y, lines) {
    const fs = 12; ctx.font = `700 ${fs}px ${SANS}`;
    let bw = Math.max(...lines.map((l) => ctx.measureText(l[0]).width)) + 22;
    const bh = 10 + lines.length * (fs + 7);
    const bx = KF.clamp(x + 12, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(255,252,242,.98)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach((l, i) => { ctx.fillStyle = l[1] || INK; ctx.font = `${i ? 500 : 700} ${fs}px ${SANS}`; ctx.fillText(l[0], bx + 10, by + 8 + (i + 1) * (fs + 7) - 4); });
  }

  function headerPanel(ctx, d, box, year, full) {
    const [x, y, w, h] = box, yi = idx(d, year), i0 = 0;
    text(ctx, "청년 고용 성적표", x, y + (full ? 22 : 19), full ? 20 : 17, INK, "left", 700, "'Nanum Myeongjo', serif");
    text(ctx, `대상 15~29세 · 국가데이터처 경제활동인구조사 · ${d.base}–${d.latest}`, x, y + (full ? 40 : 35), full ? 11.5 : 10, DIM, "left");
    const g = sparkline(ctx, d, "emp1529", [x, y + (full ? 52 : 44), w - (full ? 190 : 130), full ? 54 : 40], year, 1);
    const chg = d.emp1529[yi] - d.emp1529[i0];
    stamp(ctx, x + w - (full ? 110 : 78), y + (full ? 78 : 62), full ? 46 : 33, "거의 그대로", `${chg >= 0 ? "+" : ""}${fmt1(chg)}%p`);
    text(ctx, `표제 숫자 · 15~29세 전체 고용률: ${fmt1(d.emp1529[i0])}% (${d.base}) → ${fmt1(d.emp1529[yi])}% (${year})`, x, y + (full ? 128 : 104), full ? 12 : 10.5, DIM, "left", 600);
    return g;
  }

  function draw(ctx, w, h, d, state, thumb) {
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const full = w > 520 && !thumb;
    const pad = full ? 28 : 16;
    ctx.fillStyle = PAPER; ctx.fillRect(pad * 0.6, pad * 0.6, w - pad * 1.2, h - pad * 1.2);
    ctx.strokeStyle = RULE; ctx.lineWidth = 1; ctx.strokeRect(pad * 0.6 + .5, pad * 0.6 + .5, w - pad * 1.2 - 1, h - pad * 1.2 - 1);
    const x0 = pad * 0.6 + (full ? 26 : 16), rw = w - pad * 1.2 - (full ? 52 : 32);
    const year = state.year;
    if (thumb) {
      text(ctx, "청년 고용 성적표", x0, h * 0.27, h * 0.09, INK, "left", 700, "'Nanum Myeongjo', serif");
      const g = sparkline(ctx, d, "emp1529", [x0, h * 0.35, rw * 0.6, h * 0.24], year, 1);
      const chg = d.emp1529[idx(d, year)] - d.emp1529[0];
      stamp(ctx, x0 + rw * 0.78, h * 0.48, h * 0.15, "거의 그대로", `${chg >= 0 ? "+" : ""}${fmt1(chg)}%p`);
      const y2 = h * 0.76;
      text(ctx, `15~24세  ${fmt1(d.emp1524[idx(d, year)] - d.emp1524[0])}%p`, x0, y2, h * 0.06, RED, "left", 700, MONO);
      text(ctx, `25~29세  +${fmt1(d.emp2529[idx(d, year)] - d.emp2529[0])}%p`, x0 + rw * 0.42, y2, h * 0.06, BLUE, "left", 700, MONO);
      return null;
    }
    const headY = pad * 0.6 + (full ? 14 : 10);
    const hg = headerPanel(ctx, d, [x0, headY, rw, full ? 150 : 122], year, full);
    const rowsTop = headY + (full ? 168 : 138);
    const footH = full ? 30 : 26;
    const rowH = (h - pad * 0.6 - rowsTop - footH) / ROWS.length;
    const geoms = [];
    ROWS.forEach((row, i) => {
      const ry = rowsTop + i * rowH, on = state.mode === "all" || state.solo === i;
      const labelW = full ? 190 : rw * 0.42;
      text(ctx, row.label, x0, ry + rowH * 0.30, full ? 13 : 11, on ? INK : DIM, "left", 650);
      const yi = idx(d, year), v = d[row.key][yi];
      const decimals = row.key.startsWith("emp") ? 1 : row.key === "restShare" ? 2 : 1;
      text(ctx, `${v.toFixed(decimals)}%`, x0, ry + rowH * 0.60, full ? 20 : 16, on ? INK : DIM, "left", 700, MONO);
      const chg = v - d[row.key][0];
      text(ctx, `${d.base}년 대비 ${chg >= 0 ? "+" : ""}${chg.toFixed(decimals)}%p`, x0, ry + rowH * 0.84, full ? 10.5 : 9.5, on ? DIM : "rgba(43,36,22,.35)", "left", 500, MONO);
      const sx = x0 + labelW, sw = rw - labelW - (full ? 6 : 0);
      const g = sparkline(ctx, d, row.key, [sx, ry + rowH * 0.18, sw, rowH * 0.6], year, on ? 1 : 0.22);
      geoms.push({ ...g, key: row.key, ry, rowH });
      if (state.mode === "solo" && state.solo === i) {
        text(ctx, row.note, sx, ry + rowH * 0.94, full ? 11.5 : 10, RED, "left", 600, PEN);
      }
      if (i < ROWS.length - 1) { ctx.strokeStyle = RULE; ctx.beginPath(); ctx.moveTo(x0, ry + rowH); ctx.lineTo(x0 + rw, ry + rowH); ctx.stroke(); }
    });
    if (full) text(ctx, "쉬었음 비중의 분모는 15~29세 인구, 비정규직 비중의 분모는 15~29세 임금근로자 — 서로 다르다", x0, rowsTop + 4 * rowH + footH * 0.7, 10.5, DIM, "left", 500);
    else text(ctx, "쉬었음·비정규직 비중은 분모가 서로 다르다", x0, rowsTop + 4 * rowH + footH * 0.7, 9.5, DIM, "left", 500);
    state._geoms = geoms; state._head = hg; state._x0 = x0; state._rw = rw;
    if (state.hover) {
      const [hx, hy] = state.hover;
      let hit = null;
      for (const g of geoms) if (hx >= g.x - 6 && hx <= g.x + g.w + 6 && hy >= g.ry && hy <= g.ry + g.rowH) hit = g;
      if (hg && hx >= hg.x - 6 && hx <= hg.x + hg.w + 6 && hy >= hg.y - 8 && hy <= hg.y + hg.h + 8) hit = { ...hg, key: "emp1529" };
      if (hit) {
        const years = d.years, frac = KF.clamp((hx - hit.x) / hit.w, 0, 1);
        const yy = years[Math.round(frac * (years.length - 1))];
        const row = ROWS.find((r) => r.key === hit.key);
        const v = d[hit.key][idx(d, yy)];
        const label = row ? row.label : "고용률 · 15~29세 전체";
        const decimals = hit.key === "restShare" ? 2 : 1;
        tip(ctx, w, h, hx, hy, [[`${yy}년 · ${label}`, INK], [`${v.toFixed(decimals)}%`, BLUE]]);
      }
    }
  }

  function thumbFn(ctx, w, h, t, d) { draw(ctx, w, h, d, { year: d.latest }, true); }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const state = { mode: "all", solo: 1, year: d.latest, hover: null };
    const render = () => draw(s.ctx, s.w, s.h, d, state, false);
    s.onresize = render; stage._kfStill = render;

    KF.segment(controls, [{ id: "all", label: "네 지표 함께" }, { id: "solo", label: "한 지표만" }], "all", (id) => { state.mode = id; render(); soloRow.hidden = id !== "solo"; });
    const soloRow = document.createElement("div"); soloRow.hidden = true; soloRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;width:100%;margin-top:6px";
    ROWS.forEach((row, i) => { const b = document.createElement("button"); b.type = "button"; b.textContent = row.label; b.addEventListener("click", () => { state.solo = i; render(); }); soloRow.appendChild(b); });
    controls.appendChild(soloRow);

    const yrow = document.createElement("div"); yrow.style.cssText = "display:flex;gap:10px;align-items:center;width:100%;margin-top:8px";
    const yl = document.createElement("label"); yl.textContent = "연도 ";
    const range = document.createElement("input"); range.type = "range"; range.min = d.base; range.max = d.latest; range.step = 1; range.value = d.latest;
    range.setAttribute("aria-label", "선택 연도");
    yl.appendChild(range); yrow.appendChild(yl);
    const status = document.createElement("span"); status.setAttribute("aria-live", "polite"); status.style.cssText = "font-size:12px;color:inherit"; status.textContent = `${d.latest}년`;
    yrow.appendChild(status); controls.appendChild(yrow);
    range.addEventListener("input", () => { state.year = +range.value; status.textContent = `${state.year}년`; render(); });

    const move = (e) => { const r = stage.getBoundingClientRect(); state.hover = [e.clientX - r.left, e.clientY - r.top]; render(); };
    stage.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") move(e); });
    stage.addEventListener("pointerdown", move);
    stage.addEventListener("pointerleave", () => { state.hover = null; render(); });

    render();
    if (!KF.reduced) {
      const t0 = performance.now();
      const intro = (now) => { const p = KF.clamp((now - t0) / 700, 0, 1); render(); if (p < 1) requestAnimationFrame(intro); };
      requestAnimationFrame(intro);
    }
  }

  VIZ["youth-employment"] = { thumb: thumbFn, mount, bg: BG };
})();
