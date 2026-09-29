// 74 labor-disputes — "빨랫줄 번팅과 동아줄". A washing line strung with triangular bunting pennants, one per
// year of labour disputes (1996-latest): pennant width ~ case count, pennant colour ~ working days lost per
// 1,000 organisable workers. Below it, a twisted rope runs 1977-latest whose thickness is union density.
(() => {
  const BG = "#e3b23c", INK = "#2c2011", PAPER = "rgba(255,250,232,.9)";
  const CLOTH = "#f3ead0", ROPE = "#8a5a2e", ROPE_DK = "#5f3c1c";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const RAMP = [[250, 234, 197], [178, 47, 36], [90, 16, 14]]; // low -> mid -> high per-1000

  function rampColor(k) {
    k = KF.clamp(k, 0, 1);
    const [a, b] = k < 0.5 ? [RAMP[0], RAMP[1]] : [RAMP[1], RAMP[2]];
    const u = k < 0.5 ? k / 0.5 : (k - 0.5) / 0.5;
    return a.map((c, i) => Math.round(KF.lerp(c, b[i], u)));
  }
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  function text(ctx, t, x, y, size, color, align, weight, font) {
    ctx.font = `${weight || 500} ${size}px ${font || SANS}`; ctx.fillStyle = color; ctx.textAlign = align || "left"; ctx.fillText(t, x, y);
  }

  // ---------------------------------------------------------------- pennant line
  function pennants(ctx, d, box, state, hoverX) {
    const [x, y, w, h] = box, years = d.years, n = years.length;
    const gap = w / n, pw = Math.max(6, gap * 0.72);
    const maxC = Math.sqrt(Math.max(...d.cases)), minC = Math.sqrt(Math.min(...d.cases));
    const maxP = Math.max(...d.per1000.filter((v) => v != null));
    ctx.strokeStyle = "rgba(44,32,17,.55)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
    let hit = null;
    years.forEach((yy, i) => {
      const cx = x + gap * (i + 0.5);
      const wgt = KF.clamp((Math.sqrt(d.cases[i]) - minC) / (maxC - minC || 1), 0, 1);
      const bw = pw * (0.45 + wgt * 0.75);
      const bh = bw * 1.35;
      const on = state.mode !== "solo" || yy === state.year;
      ctx.globalAlpha = on ? 1 : 0.32;
      const p = d.per1000[i];
      const col = p == null ? [188, 178, 150] : rampColor(p / maxP);
      ctx.fillStyle = rgb(col); ctx.beginPath();
      ctx.moveTo(cx - bw / 2, y); ctx.lineTo(cx + bw / 2, y); ctx.lineTo(cx, y + bh); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(44,32,17,.4)"; ctx.lineWidth = 0.8; ctx.stroke();
      if (p == null) { // not yet computable: dashed outline instead of a solid border
        ctx.strokeStyle = "rgba(44,32,17,.75)"; ctx.lineWidth = 1.2; ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(cx - bw / 2, y); ctx.lineTo(cx + bw / 2, y); ctx.lineTo(cx, y + bh); ctx.closePath(); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (yy === state.year) { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - bw / 2, y); ctx.lineTo(cx + bw / 2, y); ctx.lineTo(cx, y + bh); ctx.closePath(); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(cx, y, 2, 0, 7); ctx.fillStyle = "rgba(44,32,17,.7)"; ctx.fill();
      ctx.globalAlpha = 1;
      if (hoverX != null && Math.abs(hoverX - cx) < gap / 2) hit = yy;
    });
    return { x, y, w, gap, n, hit, y0: years[0] };
  }

  // ---------------------------------------------------------------- rope (union density)
  function rope(ctx, d, box, mode, selYear) {
    const [x, y, w, h] = box, years = d.unionYears, vals = mode === "members" ? d.members : d.density;
    const maxV = Math.max(...vals), minV = Math.min(...vals);
    const X = (yy) => x + (yy - years[0]) / (years.at(-1) - years[0]) * w;
    const thick = (v) => 3 + ((v - minV) / (maxV - minV || 1)) * (h - 6);
    ctx.lineCap = "round";
    for (let i = 1; i < years.length; i++) {
      const x0 = X(years[i - 1]), x1 = X(years[i]);
      const t0 = thick(vals[i - 1]), t1 = thick(vals[i]);
      ctx.strokeStyle = ROPE; ctx.lineWidth = (t0 + t1) / 2;
      ctx.beginPath(); ctx.moveTo(x0, y + h - t0 / 2 - 1); ctx.lineTo(x1, y + h - t1 / 2 - 1); ctx.stroke();
    }
    // twist texture
    ctx.strokeStyle = ROPE_DK; ctx.lineWidth = 1;
    for (let xx = x; xx < x + w; xx += 7) {
      const yy = years[0] + (xx - x) / w * (years.at(-1) - years[0]);
      const t = thick(vals[Math.round(KF.clamp((yy - years[0]) / (years.at(-1) - years[0]), 0, 1) * (vals.length - 1))]);
      ctx.beginPath(); ctx.moveTo(xx, y + h - t - 1); ctx.lineTo(xx + 4, y + h - 1); ctx.stroke();
    }
    if (years.includes(selYear)) {
      const t = thick(vals[years.indexOf(selYear)]);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(X(selYear), y + h - t / 2 - 1, 3.4, 0, 7); ctx.fill();
    }
    return { x, y, w, h, X, years };
  }

  function tip(ctx, w, h, x, y, lines) {
    const fs = 12; ctx.font = `700 ${fs}px ${SANS}`;
    let bw = Math.max(...lines.map((l) => ctx.measureText(l[0]).width)) + 22;
    const bh = 10 + lines.length * (fs + 7);
    const bx = KF.clamp(x + 12, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(255,250,238,.98)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    lines.forEach((l, i) => { ctx.fillStyle = l[1] || INK; ctx.font = `${i ? 500 : 700} ${fs}px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(l[0], bx + 10, by + 8 + (i + 1) * (fs + 7) - 4); });
  }

  function draw(ctx, w, h, d, state, thumb) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const full = w > 520 && !thumb;
    const pad = thumb ? 14 : full ? 30 : 16;
    if (thumb) {
      text(ctx, "노사분규, 건수는 그대로", pad, h * 0.26, h * 0.09, INK, "left", 700);
      pennants(ctx, d, [pad, h * 0.4, w - pad * 2, h * 0.16], { mode: "all", year: state.year }, null);
      text(ctx, `1천 명당 근로손실일수 4.7배 ↓`, pad, h * 0.72, h * 0.065, "#7a1f1a", "left", 700, MONO);
      text(ctx, `분규 건수 30년째 제자리`, pad, h * 0.83, h * 0.05, INK, "left", 500);
      rope(ctx, d, [54, h * 0.88, w - pad - 54, h * 0.08], "density", d.lowDensityYear);
      return;
    }
    text(ctx, "한국은 파업이 잦을까", pad, pad + (full ? 22 : 18), full ? 21 : 17, INK, "left", 700, "'Nanum Myeongjo', serif");
    text(ctx, full ? "고용노동부 노사분규통계 · 깃발 너비 = 분규 건수 · 색 = 노조 조직대상 1천 명당 근로손실일수" : "깃발 너비=분규 건수 · 색=1천 명당 손실일수", pad, pad + (full ? 42 : 36), full ? 11.5 : 9.5, "rgba(44,32,17,.72)", "left");

    const lineY = pad + (full ? 92 : 78);
    const geo = pennants(ctx, d, [pad + 8, lineY, w - pad * 2 - 16, full ? 74 : 54], state, state.hover && state.hover[1] < lineY + 90 ? state.hover[0] : null);
    // year ticks
    text(ctx, String(d.years[0]), pad + 8, lineY + (full ? 108 : 82), full ? 10.5 : 9.5, "rgba(44,32,17,.7)", "left", 600, MONO);
    text(ctx, String(d.maxCaseYear) + " 최다", geo.x + (d.maxCaseYear - geo.y0) / (d.years.length) * geo.w, lineY + (full ? 108 : 82), full ? 10.5 : 9.5, "rgba(44,32,17,.7)", "center", 600, MONO);
    text(ctx, String(d.years.at(-1)), pad + w - pad * 2 - 8, lineY + (full ? 108 : 82), full ? 10.5 : 9.5, "rgba(44,32,17,.7)", "right", 600, MONO);

    // readout card for selected year
    const cardY = lineY + (full ? 130 : 100), cardH = full ? 96 : 116;
    ctx.fillStyle = PAPER; ctx.fillRect(pad, cardY, w - pad * 2, cardH);
    ctx.strokeStyle = "rgba(44,32,17,.35)"; ctx.lineWidth = 1; ctx.strokeRect(pad + .5, cardY + .5, w - pad * 2 - 1, cardH - 1);
    const yi = d.years.indexOf(state.year), p = d.per1000[yi];
    const cols = full ? [
      ["분규 건수", `${d.cases[yi].toLocaleString("ko-KR")}건`, INK],
      ["근로손실일수", `${d.lostdays[yi].toLocaleString("ko-KR")}일`, INK],
      ["1천 명당 손실일수", p == null ? "집계 전" : `${p.toFixed(1)}`, "#7a1f1a"],
    ] : [
      ["분규 건수", `${d.cases[yi].toLocaleString("ko-KR")}건`, INK],
      ["근로손실일수", `${d.lostdays[yi].toLocaleString("ko-KR")}일`, INK],
      ["1천 명당", p == null ? "집계 전" : `${p.toFixed(1)}`, "#7a1f1a"],
    ];
    const colW = (w - pad * 2) / cols.length;
    cols.forEach(([lab, val, col], i) => {
      const cx = pad + i * colW + colW / 2;
      text(ctx, `${state.year}년 · ${lab}`, cx, cardY + (full ? 24 : 22), full ? 11.5 : 10, "rgba(44,32,17,.72)", "center", 600);
      text(ctx, val, cx, cardY + (full ? 56 : 52), full ? 26 : 20, col, "center", 700, MONO);
    });
    const unionRow = d.unionYears.includes(state.year) ? d.density[d.unionYears.indexOf(state.year)] : null;
    text(ctx, unionRow != null ? `같은 해 노동조합 조직률 ${unionRow.toFixed(1)}%` : "이 해는 조직률 자료 범위 밖", pad + 10, cardY + cardH - (full ? 10 : 28), full ? 11 : 10.5, "rgba(44,32,17,.72)", "left", 500);

    // rope panel
    const ropeY = cardY + cardH + (full ? 26 : 34), ropeH = full ? 44 : 34;
    text(ctx, `노동조합 조직률 · ${d.unionYears[0]}–${d.unionYears.at(-1)}년 (굵기 = 조직률)`, pad, ropeY - 8, full ? 11.5 : 10, "rgba(44,32,17,.72)", "left", 600);
    const rg = rope(ctx, d, [pad + 8, ropeY, w - pad * 2 - 16, ropeH], "density", state.year);
    text(ctx, `${d.unionYears[0]}년 ${d.density[0].toFixed(1)}%`, rg.x, ropeY + ropeH + 14, full ? 10.5 : 9.5, "rgba(44,32,17,.7)", "left", 600, MONO);
    text(ctx, `${d.lowDensityYear}년 최저 ${d.density[d.unionYears.indexOf(d.lowDensityYear)].toFixed(1)}%`, rg.x + rg.w / 2, ropeY + ropeH + 14, full ? 10.5 : 9.5, "rgba(44,32,17,.7)", "center", 600, MONO);
    text(ctx, `${d.unionYears.at(-1)}년 ${d.density.at(-1).toFixed(1)}%`, rg.x + rg.w, ropeY + ropeH + 14, full ? 10.5 : 9.5, "rgba(44,32,17,.7)", "right", 600, MONO);

    state._geo = geo; state._pad = pad; state._lineY = lineY;
    if (state.hover) {
      const [hx, hy] = state.hover;
      if (geo.hit != null && hy < lineY + 90) {
        const yi2 = d.years.indexOf(geo.hit), p2 = d.per1000[yi2];
        tip(ctx, w, h, hx, hy, [[`${geo.hit}년`, INK], [`분규 ${d.cases[yi2].toLocaleString("ko-KR")}건 · 손실 ${d.lostdays[yi2].toLocaleString("ko-KR")}일`, "rgba(44,32,17,.8)"], [p2 == null ? "1천 명당: 집계 전" : `1천 명당 ${p2.toFixed(1)}일`, "#7a1f1a"]]);
      }
    }
  }

  function thumbFn(ctx, w, h, t, d) { draw(ctx, w, h, d, { year: d.maxCaseYear }, true); }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const state = { mode: "all", year: d.rateY1 || d.years.at(-1), hover: null };
    const render = () => draw(s.ctx, s.w, s.h, d, state, false);
    s.onresize = render; stage._kfStill = render;

    const row = document.createElement("div"); row.style.cssText = "display:flex;gap:10px;align-items:center;width:100%;flex-wrap:wrap";
    const yl = document.createElement("label"); yl.textContent = "연도 ";
    const range = document.createElement("input"); range.type = "range"; range.min = d.years[0]; range.max = d.years.at(-1); range.step = 1; range.value = state.year;
    range.setAttribute("aria-label", "선택 연도");
    yl.appendChild(range); row.appendChild(yl);
    const jump = document.createElement("button"); jump.type = "button"; jump.textContent = `분규 최다해(${d.maxCaseYear})로`;
    jump.addEventListener("click", () => { state.year = d.maxCaseYear; range.value = state.year; status.textContent = `${state.year}년`; render(); });
    row.appendChild(jump);
    const status = document.createElement("span"); status.setAttribute("aria-live", "polite"); status.style.cssText = "font-size:12px"; status.textContent = `${state.year}년`;
    row.appendChild(status); controls.appendChild(row);
    range.addEventListener("input", () => { state.year = +range.value; status.textContent = `${state.year}년`; render(); });

    const move = (e) => { const r = stage.getBoundingClientRect(); state.hover = [e.clientX - r.left, e.clientY - r.top]; render(); };
    stage.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") move(e); });
    stage.addEventListener("pointerdown", (e) => {
      move(e);
      if (state._geo && state._geo.hit != null) { state.year = state._geo.hit; range.value = state.year; status.textContent = `${state.year}년`; }
      render();
    });
    stage.addEventListener("pointerleave", () => { state.hover = null; render(); });

    render();
    if (!KF.reduced) {
      const t0 = performance.now();
      const intro = (now) => { const p = KF.clamp((now - t0) / 800, 0, 1); render(); if (p < 1) requestAnimationFrame(intro); };
      requestAnimationFrame(intro);
    }
  }

  VIZ["labor-disputes"] = { thumb: thumbFn, mount, bg: BG };
})();
