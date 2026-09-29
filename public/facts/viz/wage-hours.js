// 78 wage-hours — "시간의 계단". A staircase in profile, one step per year (1980-2025): each tread's height
// is that year's weekly average working hours. Two short runs of steep steps line up with the 5-day workweek
// and the 52-hour cap being phased in; the rest is closer to a landing. Straight-line instinct: it never
// looked like a ramp.
(() => {
  const BG = "#cdd0c4", INK = "#26302a", DIM = "rgba(38,48,42,.68)";
  const STONE = "#8f9686", STONE_LT = "#a9b09a", STONE_DK = "#6b7161", NOSING = "rgba(255,255,255,.35)";
  const W5 = "#c8763a", W52 = "#a3352a", SELF = "#3a6b8a", NONREG = "#7a5aa0";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", MYEONGJO = "'Nanum Myeongjo', serif";

  function text(ctx, t, x, y, size, color, align, weight, font) {
    ctx.font = `${weight || 500} ${size}px ${font || SANS}`; ctx.fillStyle = color; ctx.textAlign = align || "left"; ctx.fillText(t, x, y);
  }

  function scales(d, box) {
    const [x, y, w, h] = box, years = d.years, vals = d.avg;
    const extra = [...vals, d.self.se.at(-1), d.self.seEmp.at(-1), d.regnonreg.reg.at(-1), d.regnonreg.nonreg.at(-1)];
    const hMin = Math.min(...extra) - 3, hMax = Math.max(...extra) + 2;
    const X = (yy) => x + (yy - years[0]) / (years.at(-1) - years[0]) * w;
    const Y = (v) => y + h - (v - hMin) / (hMax - hMin) * h;
    return { x, y, w, h, X, Y, years, vals, ground: y + h, hMin, hMax };
  }

  // the staircase: one filled silhouette + shaded risers + tread nosings
  function stairs(ctx, S, upto) {
    const { years, vals, X, Y, ground } = S;
    const n = Math.max(1, Math.min(years.length, upto));
    ctx.beginPath();
    ctx.moveTo(X(years[0]), ground);
    ctx.lineTo(X(years[0]), Y(vals[0]));
    for (let i = 1; i < n; i++) { ctx.lineTo(X(years[i]), Y(vals[i - 1])); ctx.lineTo(X(years[i]), Y(vals[i])); }
    ctx.lineTo(X(years[n - 1]), ground); ctx.closePath();
    const g = ctx.createLinearGradient(0, S.y, 0, ground);
    g.addColorStop(0, STONE_LT); g.addColorStop(1, STONE);
    ctx.fillStyle = g; ctx.fill();
    // riser shading + tread nosing
    for (let i = 1; i < n; i++) {
      const x0 = X(years[i]), y0 = Y(vals[i - 1]), y1 = Y(vals[i]);
      if (y1 > y0) { ctx.fillStyle = "rgba(38,48,42,.16)"; ctx.fillRect(x0 - 1, y0, 2, y1 - y0); }
      ctx.strokeStyle = NOSING; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(years[i - 1]), y0); ctx.lineTo(x0, y0); ctx.stroke();
    }
    ctx.strokeStyle = STONE_DK; ctx.lineWidth = 1.4; ctx.beginPath();
    ctx.moveTo(X(years[0]), Y(vals[0]));
    for (let i = 1; i < n; i++) { ctx.lineTo(X(years[i]), Y(vals[i - 1])); ctx.lineTo(X(years[i]), Y(vals[i])); }
    ctx.stroke();
  }

  function windowBand(ctx, S, a, b, color, label, drop, full) {
    const x0 = S.X(a), x1 = S.X(b);
    ctx.fillStyle = color + "26"; ctx.fillRect(x0, S.y, x1 - x0, S.h);
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x0, S.y); ctx.lineTo(x0, S.ground); ctx.moveTo(x1, S.y); ctx.lineTo(x1, S.ground); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, label, (x0 + x1) / 2, S.y - (full ? 8 : 6), full ? 11 : 9.5, color, "center", 700);
    text(ctx, `${drop}`, (x0 + x1) / 2, S.y - (full ? 22 : 17), full ? 12.5 : 10.5, color, "center", 700, MONO);
  }

  function marker(ctx, x, y, r, color) {
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, 7); ctx.fill();
  }

  function tip(ctx, w, h, x, y, lines) {
    const fs = 12; ctx.font = `700 ${fs}px ${SANS}`;
    let bw = Math.max(...lines.map((l) => ctx.measureText(l[0]).width)) + 22;
    const bh = 10 + lines.length * (fs + 7);
    const bx = KF.clamp(x + 12, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(244,244,236,.98)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    lines.forEach((l, i) => { ctx.fillStyle = l[1] || INK; ctx.font = `${i ? 500 : 700} ${fs}px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(l[0], bx + 10, by + 8 + (i + 1) * (fs + 7) - 4); });
  }

  function draw(ctx, w, h, d, state, thumb) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const full = w > 520 && !thumb;
    const pad = thumb ? 12 : full ? 26 : 14;
    const yi = d.years.indexOf(state.year);

    if (thumb) {
      text(ctx, "여전히 오래 일할까", pad, h * 0.26, h * 0.078, INK, "left", 700, MYEONGJO);
      const S = scales(d, [pad, h * 0.34, w - pad * 2, h * 0.48]);
      stairs(ctx, S, d.years.length);
      const c = state.year;
      marker(ctx, S.X(c), S.Y(d.avg[d.years.indexOf(c)]), h * 0.02, W52);
      text(ctx, `${d.peakYear}년 ${d.avg[d.years.indexOf(d.peakYear)].toFixed(1)}시간 → ${d.latest}년 ${d.avg.at(-1).toFixed(1)}시간`, 54, h * 0.94, h * 0.05, DIM, "left", 600, MONO);
      return;
    }

    text(ctx, "한국인은 여전히 오래 일할까", pad, pad + (full ? 22 : 18), full ? 20 : 16, INK, "left", 700, MYEONGJO);
    text(ctx, "시간의 계단 · 한 단 = 1년의 주당 평균 취업시간 · 경제활동인구조사(1980–2025)", pad, pad + (full ? 40 : 34), full ? 11 : 9.5, DIM, "left");

    const stairX = pad, stairY = pad + (full ? 88 : 74);
    const stairW = full ? w * 0.62 : w - pad * 2, stairH = full ? h * 0.5 : h * 0.27;
    const S = scales(d, [stairX, stairY, stairW, stairH]);
    windowBand(ctx, S, ...d.windows.w5, W5, "주 5일제 단계 시행", `${(d.avg[d.years.indexOf(d.windows.w5[1])] - d.avg[d.years.indexOf(d.windows.w5[0])]).toFixed(1)}시간`.replace("-", "−"), full);
    windowBand(ctx, S, ...d.windows.w52, W52, "주 52시간제 단계 시행", `${(d.avg[d.years.indexOf(d.windows.w52[1])] - d.avg[d.years.indexOf(d.windows.w52[0])]).toFixed(1)}시간`.replace("-", "−"), full);
    const upto = state.intro != null ? Math.max(1, Math.round(state.intro * d.years.length)) : d.years.length;
    stairs(ctx, S, upto);
    if (upto >= d.years.length) {
      marker(ctx, S.X(state.year), S.Y(d.avg[yi]), full ? 6 : 5, INK);
      // axis ticks
      [d.years[0], d.windows.w5[0], d.windows.w52[1], d.years.at(-1)].forEach((yy) => {
        text(ctx, String(yy), S.X(yy), S.ground + (full ? 16 : 14), full ? 10.5 : 9.5, DIM, "center", 600, MONO);
      });
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10.5 : 9.5}px ${MONO}`;
      ctx.fillText(`${Math.round(S.hMax || 0)}`, S.x - 2, S.y + 4);
    }

    // latest-year markers: small dots above the final step showing who's still higher (same hour scale,
    // exact numbers are in the panel — kept short so they never reach past the stair box)
    const latestX = S.X(d.years.at(-1));
    const seLatest = d.self.se.at(-1), regLatest = d.regnonreg.reg.at(-1), nonregLatest = d.regnonreg.nonreg.at(-1);
    if (upto >= d.years.length) {
      [[seLatest, SELF], [regLatest, "rgba(38,48,42,.6)"], [nonregLatest, NONREG]].forEach(([v, col], i) => {
        const yy = S.Y(v), xx = latestX - 9 - i * 9;
        ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, S.ground); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(xx, yy, 3.4, 0, 7); ctx.fill();
      });
    }

    // readout / comparison panel
    const panelX = full ? stairX + stairW + 34 : pad, panelY = full ? stairY : S.ground + (full ? 0 : 18);
    const panelW = full ? w - panelX - pad : w - pad * 2, panelH = full ? stairH + 6 : h - panelY - pad - 4;
    ctx.fillStyle = "rgba(244,244,236,.85)"; ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = "rgba(38,48,42,.35)"; ctx.lineWidth = 1; ctx.strokeRect(panelX + .5, panelY + .5, panelW - 1, panelH - 1);
    text(ctx, `${state.year}년`, panelX + 14, panelY + (full ? 28 : 20), full ? 19 : 15, INK, "left", 700, MONO);
    text(ctx, `주당 평균 취업시간`, panelX + 14, panelY + (full ? 50 : 37), full ? 11.5 : 10, DIM, "left", 600);
    text(ctx, `${d.avg[yi].toFixed(1)}시간`, panelX + panelW - 14, panelY + (full ? 50 : 37), full ? 18 : 14, INK, "right", 700, MONO);
    text(ctx, `주 54시간 이상 일한 사람`, panelX + 14, panelY + (full ? 74 : 54), full ? 11.5 : 10, DIM, "left", 600);
    text(ctx, `${d.share54[yi].toFixed(1)}%`, panelX + panelW - 14, panelY + (full ? 74 : 54), full ? 18 : 14, W52, "right", 700, MONO);
    let py = panelY + (full ? 106 : 76);
    text(ctx, full ? "최신 연도 견주기 — 자영업자는 전체 평균보다 위" : "최신 연도 견주기", panelX + 14, py, full ? 11.5 : 9.5, DIM, "left", 600); py += full ? 22 : 15;
    const rows = [["자영업자", seLatest, SELF], ["고용원 있는 자영업자", d.self.seEmp.at(-1), SELF], ["정규직", regLatest, "rgba(38,48,42,.75)"], ["비정규직", nonregLatest, NONREG]];
    rows.forEach(([lab, v, col]) => {
      ctx.fillStyle = col; ctx.fillRect(panelX + 14, py - (full ? 8 : 7), 7, 7);
      text(ctx, lab, panelX + 26, py, full ? 11.5 : 10, INK, "left", 500);
      text(ctx, `${v.toFixed(1)}시간`, panelX + panelW - 14, py, full ? 13 : 11, col, "right", 700, MONO);
      py += full ? 21 : 16;
    });
    if (full) {
      const smallPct = ((d.firm.small.at(-1) / d.firm.small[0] - 1) * 100).toFixed(1);
      const bigPct = ((d.firm.big.at(-1) / d.firm.big[0] - 1) * 100).toFixed(1);
      py += 4;
      text(ctx, `${d.firm.years[0]}→${d.firm.years.at(-1)} 월 총근로시간(단위 다름)`, panelX + 14, py, 10, DIM, "left", 500);
      text(ctx, `5인 미만 ${smallPct}% · 300인 이상 ${bigPct}%`, panelX + 14, py + 15, 10, DIM, "left", 500);
    }

    state._S = S;
    if (state.hover) {
      const [hx, hy] = state.hover;
      if (hx >= S.x - 6 && hx <= S.x + S.w + 6 && hy >= S.y - 30 && hy <= S.ground + 20) {
        const i = KF.clamp(Math.round((hx - S.x) / S.w * (d.years.length - 1)), 0, d.years.length - 1);
        const yy = d.years[i];
        tip(ctx, w, h, hx, hy, [[`${yy}년`, INK], [`주당 ${d.avg[i].toFixed(1)}시간 · 54h+ ${d.share54[i].toFixed(1)}%`, DIM]]);
      }
    }
  }

  function thumbFn(ctx, w, h, t, d) { draw(ctx, w, h, d, { year: d.latest }, true); }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const state = { year: d.latest, hover: null, intro: null };
    const render = () => draw(s.ctx, s.w, s.h, d, state, false);
    s.onresize = render; stage._kfStill = render;

    const row = document.createElement("div"); row.style.cssText = "display:flex;gap:10px;align-items:center;width:100%;flex-wrap:wrap";
    for (const [label, step] of [["이전 연도", -1], ["다음 연도", 1]]) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = label;
      b.addEventListener("click", () => { const i = KF.clamp(d.years.indexOf(state.year) + step, 0, d.years.length - 1); state.year = d.years[i]; sync(); render(); });
      row.appendChild(b);
    }
    const jumps = [["5일제 전", d.windows.w5[0]], ["5일제 후", d.windows.w5[1]], ["52시간제 전", d.windows.w52[0]], ["52시간제 후", d.windows.w52[1]]];
    jumps.forEach(([label, yy]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.addEventListener("click", () => { state.year = yy; sync(); render(); }); row.appendChild(b); });
    controls.appendChild(row);
    const status = document.createElement("p"); status.setAttribute("aria-live", "polite"); status.style.cssText = "font-size:12px;line-height:1.6;width:100%;margin:8px 0 0";
    controls.appendChild(status);
    function sync() { const i = d.years.indexOf(state.year); status.textContent = `${state.year}년 · 주당 ${d.avg[i].toFixed(1)}시간 · 54시간 이상 ${d.share54[i].toFixed(1)}%`; }

    const move = (e) => { const rc = stage.getBoundingClientRect(); state.hover = [e.clientX - rc.left, e.clientY - rc.top]; render(); };
    stage.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") move(e); });
    stage.addEventListener("pointerdown", (e) => {
      move(e);
      if (state._S) {
        const [hx] = state.hover, S = state._S;
        if (hx >= S.x - 10 && hx <= S.x + S.w + 10) {
          const i = KF.clamp(Math.round((hx - S.x) / S.w * (d.years.length - 1)), 0, d.years.length - 1);
          state.year = d.years[i]; sync(); render();
        }
      }
    });
    stage.addEventListener("pointerleave", () => { state.hover = null; render(); });

    sync();
    if (!KF.reduced) {
      const t0 = performance.now();
      const intro = (now) => { state.intro = KF.clamp((now - t0) / 1400, 0, 1); render(); if (state.intro < 1) requestAnimationFrame(intro); else state.intro = null; };
      requestAnimationFrame(intro);
    } else render();
  }

  VIZ["wage-hours"] = { thumb: thumbFn, mount, bg: BG };
})();
