// 77 unpaid-wages — "뒤집힌 뒷주머니". A denim work-pants back pocket, unbuttoned and turned out: three
// stitched thread lines (신고인원·체불총액·인당액, indexed to a base year) run across the pocket's face, and a
// sewn-on care-label tag shows the selected year's real numbers with a coin spilling from the opening.
(() => {
  const BG = "#c7b783", INK = "#2a2115", CREAM = "#f4efe0";
  const DENIM = "#3c5266", DENIM_LT = "#54718a", DENIM_DK = "#2b3c4c";
  const GOLD = "#e0a83c", RED = "#c23b32", GREEN = "#4f7a52";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const THREAD = { people: { c: CREAM, label: "신고 인원" }, amount: { c: RED, label: "체불 총액" }, per: { c: GOLD, label: "인당액" }, supportAmount: { c: GREEN, label: "대지급금" } };

  function text(ctx, t, x, y, size, color, align, weight, font) {
    ctx.font = `${weight || 500} ${size}px ${font || SANS}`; ctx.fillStyle = color; ctx.textAlign = align || "left"; ctx.fillText(t, x, y);
  }

  // ---------------------------------------------------------------- pocket body + unbuttoned flap
  function pocket(ctx, x, y, w, h) {
    const r = Math.min(28, w * 0.06, h * 0.12);
    ctx.fillStyle = DENIM;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.closePath(); ctx.fill();
    // topstitch border
    ctx.strokeStyle = "rgba(244,239,224,.55)"; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
    ctx.stroke(); ctx.setLineDash([]);
    // fold shading near the top (turned-out edge)
    const g = ctx.createLinearGradient(0, y, 0, y + h * 0.14);
    g.addColorStop(0, "rgba(0,0,0,.28)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h * 0.14);
    return { x: x + w * 0.07, y: y + h * 0.16, w: w * 0.86, h: h * 0.62, r };
  }

  function flap(ctx, x, y, w) {
    // the unbuttoned flap hanging above the pocket: a lighter trapezoid with a button + cross-stitch
    const h = w * 0.16;
    ctx.fillStyle = DENIM_LT;
    ctx.beginPath(); ctx.moveTo(x + w * 0.08, y); ctx.lineTo(x + w * 0.92, y); ctx.lineTo(x + w * 0.8, y + h); ctx.lineTo(x + w * 0.2, y + h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(244,239,224,.5)"; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
    const bx = x + w * 0.5, by = y + h * 0.5;
    ctx.fillStyle = DENIM_DK; ctx.beginPath(); ctx.arc(bx, by, Math.min(7, h * 0.28), 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(244,239,224,.7)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx - 3, by); ctx.lineTo(bx + 3, by); ctx.moveTo(bx, by - 3); ctx.lineTo(bx, by + 3); ctx.stroke();
  }

  // ---------------------------------------------------------------- stitched thread line for one series
  function thread(ctx, rows, key, base, box, hiYear, alpha, stitch) {
    const [x, y, w, h] = box;
    const vals = rows.map((r) => (r[key] / base[key]) * 100);
    const lo = Math.min(100, ...vals) - 8, hi = Math.max(100, ...vals) + 8;
    const X = (i) => x + (i / (rows.length - 1)) * w;
    const Y = (v) => y + h - ((v - lo) / (hi - lo)) * h;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = THREAD[key].c; ctx.lineWidth = 2.2; ctx.beginPath();
    rows.forEach((r, i) => { const px = X(i), py = Y(vals[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.stroke();
    if (stitch) { // running-stitch ticks along the thread
      ctx.strokeStyle = "rgba(0,0,0,.28)"; ctx.lineWidth = 1;
      for (let i = 0; i < rows.length - 1; i++) {
        const x0 = X(i), y0 = Y(vals[i]), x1 = X(i + 1), y1 = Y(vals[i + 1]);
        const steps = 5;
        for (let s = 1; s < steps; s += 2) {
          const tx = x0 + (x1 - x0) * (s / steps), ty = y0 + (y1 - y0) * (s / steps);
          const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
          ctx.beginPath(); ctx.moveTo(tx - nx / nl * 2.4, ty - ny / nl * 2.4); ctx.lineTo(tx + nx / nl * 2.4, ty + ny / nl * 2.4); ctx.stroke();
        }
      }
    }
    const hi_i = rows.findIndex((r) => r.year === hiYear);
    if (hi_i >= 0) {
      ctx.fillStyle = THREAD[key].c; ctx.beginPath(); ctx.arc(X(hi_i), Y(vals[hi_i]), alpha > 0.7 ? 4.2 : 3, 0, 7); ctx.fill();
      ctx.strokeStyle = DENIM_DK; ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return { x, y, w, h, X, lo, hi };
  }

  function coin(ctx, cx, cy, r, label) {
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(42,33,21,.5)"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = "rgba(42,33,21,.3)"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, 7); ctx.stroke();
    text(ctx, "₩", cx, cy + r * 0.32, r * 0.9, "rgba(42,33,21,.75)", "center", 700);
    if (label) text(ctx, label, cx, cy + r + 13, 10, INK, "center", 600, MONO);
  }

  function tip(ctx, w, h, x, y, lines) {
    const fs = 12; ctx.font = `700 ${fs}px ${SANS}`;
    let bw = Math.max(...lines.map((l) => ctx.measureText(l[0]).width)) + 22;
    const bh = 10 + lines.length * (fs + 7);
    const bx = KF.clamp(x + 12, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(244,239,224,.98)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    lines.forEach((l, i) => { ctx.fillStyle = l[1] || INK; ctx.font = `${i ? 500 : 700} ${fs}px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(l[0], bx + 10, by + 8 + (i + 1) * (fs + 7) - 4); });
  }

  function draw(ctx, w, h, d, state, thumb) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const full = w > 520 && !thumb;
    const rows = state.mode === "claim" ? d.rows : d.rows.filter((r) => r.supportAmount !== undefined);
    const base = rows.find((r) => r.year === state.base) || rows[0];
    const pick = rows.find((r) => r.year === state.year) || rows.at(-1);
    const keys = state.mode === "claim" ? ["people", "amount", "per"] : ["amount", "supportAmount"];
    const pad = thumb ? 12 : full ? 26 : 14;

    if (thumb) {
      text(ctx, "체불, 신고는 줄고 인당액은 늘고", pad, h * 0.24, h * 0.072, INK, "left", 700);
      const pk = pocket(ctx, pad, h * 0.32, w - pad * 2, h * 0.48);
      keys.forEach((k) => thread(ctx, rows, k, base, [pk.x, pk.y, pk.w, pk.h], pick.year, 1, false));
      coin(ctx, pk.x + pk.w - 18, pk.y + pk.h + 12, 10, null);
      text(ctx, `${pick.year}년 인당 ${(pick.per).toFixed(0)}만원`, 54, h * 0.94, h * 0.06, INK, "left", 700, MONO);
      return;
    }

    text(ctx, "체불 신고가 줄면 피해도 줄었을까", pad, pad + (full ? 22 : 18), full ? 20 : 16, INK, "left", 700, "'Nanum Myeongjo', serif");
    text(ctx, `${state.base}년 각 지표 = 100 · 뒤집힌 뒷주머니의 박음질 선 · 고용노동부 임금체불현황`, pad, pad + (full ? 40 : 34), full ? 11 : 9.5, "rgba(42,33,21,.72)", "left");

    const flapW = full ? w * 0.5 : w - pad * 2;
    const flapX = pad;
    const flapY = pad + (full ? 56 : 46);
    flap(ctx, flapX, flapY, flapW);
    const pTop = flapY + flapW * 0.16 - 2;
    const pH = (full ? h * 0.62 : h * 0.36);
    const pk = pocket(ctx, flapX, pTop, flapW, pH);
    // baseline (index 100)
    const y100 = pk.y + pk.h - (100 - pk.lo) / (pk.hi - pk.lo) * pk.h;
    ctx.strokeStyle = "rgba(244,239,224,.4)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(pk.x, y100); ctx.lineTo(pk.x + pk.w, y100); ctx.stroke(); ctx.setLineDash([]);
    const geoms = {};
    keys.forEach((k) => { geoms[k] = thread(ctx, rows, k, base, [pk.x, pk.y, pk.w, pk.h], pick.year, 1, true); });
    // legend inside the pocket's top inset, above the thread lines
    keys.forEach((k, i) => {
      const lx = pk.x + i * pk.w / keys.length;
      ctx.fillStyle = THREAD[k].c; ctx.fillRect(lx, pTop + pH * 0.055, 14, 3);
      text(ctx, THREAD[k].label, lx + 18, pTop + pH * 0.085, full ? 11 : 9.5, CREAM, "left", 600);
    });

    // care-label tag: selected year's real numbers
    const tagX = full ? flapX + flapW + 20 : pad, tagY = full ? flapY : pTop + pH + 16;
    const tagW = full ? w - tagX - pad : w - pad * 2, tagH = full ? pH + flapW * 0.16 : h - tagY - pad - 14;
    ctx.fillStyle = CREAM; ctx.beginPath();
    const zig = 7; let zx = tagX;
    ctx.moveTo(tagX, tagY + 4);
    while (zx < tagX + tagW) { ctx.lineTo(zx + zig / 2, tagY); ctx.lineTo(zx + zig, tagY + 4); zx += zig; }
    ctx.lineTo(tagX + tagW, tagY + tagH); ctx.lineTo(tagX, tagY + tagH); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(42,33,21,.3)"; ctx.lineWidth = 1; ctx.stroke();
    const coinR = full ? 22 : 15;
    text(ctx, `${pick.year}년`, tagX + 16, tagY + (full ? 34 : 27), full ? 22 : 19, INK, "left", 700, MONO);
    coin(ctx, tagX + tagW - coinR - 14, tagY + (full ? 24 : 19), coinR, null);
    let ty = tagY + (full ? 66 : 50);
    const rowH = full ? 27 : 23;
    const fields = state.mode === "claim"
      ? [["신고 인원", `${KF.fmt(pick.people)}명`, DENIM], ["체불 총액", `${KF.fmt(pick.amount)}억원`, THREAD.amount.c], ["집계인원당", `${KF.fmt(pick.per)}만원`, THREAD.per.c]]
      : [["체불 총액", `${KF.fmt(pick.amount)}억원`, THREAD.amount.c], ["대지급금", `${KF.fmt(pick.supportAmount)}억원`, THREAD.supportAmount.c], ["지원 인원", `${KF.fmt(pick.supportPeople)}명`, "rgba(42,33,21,.75)"]];
    fields.forEach(([lab, val, col]) => {
      text(ctx, lab, tagX + 16, ty, full ? 12 : 10.5, "rgba(42,33,21,.72)", "left", 600);
      text(ctx, val, tagX + tagW - 16, ty, full ? 15 : 13, col, "right", 700, MONO);
      ty += rowH;
    });
    if (full) {
      const idxText = keys.map((k) => (pick[k] / base[k] * 100).toFixed(1)).join(" / ");
      text(ctx, `기준연도 대비 지수(${keys.map((k) => THREAD[k].label).join("·")}): ${idxText}`, tagX + 16, ty + 6, 10.5, "rgba(42,33,21,.6)", "left", 500);
      text(ctx, state.mode === "claim" ? "인당액 = 체불 총액 ÷ 신고 집계인원. 모든 금액은 명목금액." : "대지급금은 별도 지급연도 집계다. 신고자·수급자를 같은 사람으로 잇지 않는다.", tagX + 16, tagY + tagH - 12, 10.5, "rgba(42,33,21,.6)", "left", 500);
    } else {
      text(ctx, state.mode === "claim" ? "인당액 = 체불 총액 ÷ 신고 집계인원" : "지원은 신고 코호트와 다른 연도 집계", tagX + 16, tagY + tagH - 10, 9.5, "rgba(42,33,21,.6)", "left", 500);
    }

    state._geoms = geoms; state._rows = rows; state._pk = pk;
    if (state.hover) {
      const [hx, hy] = state.hover;
      for (const k of keys) {
        const g = geoms[k];
        if (hx >= g.x - 6 && hx <= g.x + g.w + 6 && hy >= g.y - 10 && hy <= g.y + g.h + 10) {
          const i = KF.clamp(Math.round((hx - g.x) / g.w * (rows.length - 1)), 0, rows.length - 1);
          const r = rows[i];
          tip(ctx, w, h, hx, hy, [[`${r.year}년 · ${THREAD[k].label}`, INK], [`지수 ${(r[k] / base[k] * 100).toFixed(1)} · 원값 ${KF.fmt(r[k])}${k === "people" || k === "supportPeople" ? "명" : k === "per" || k === "supportPer" ? "만원" : "억원"}`, "rgba(42,33,21,.8)"]]);
          break;
        }
      }
    }
  }

  function thumbFn(ctx, w, h, t, d) { draw(ctx, w, h, d, { mode: "claim", base: 2019, year: d.latest }, true); }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const state = { mode: "claim", base: 2019, year: d.latest, hover: null };
    const render = () => draw(s.ctx, s.w, s.h, d, state, false);
    s.onresize = render; stage._kfStill = render;

    KF.segment(controls, [{ id: "claim", label: "인원·총액·인당액" }, { id: "support", label: "체불액·지원액" }], "claim", (id) => { state.mode = id; if (id === "support" && state.year < 2013) state.year = 2013; sync(); render(); });
    const row = document.createElement("div"); row.style.cssText = "display:flex;gap:12px;align-items:center;width:100%;flex-wrap:wrap;margin-top:8px";
    const bl = document.createElement("label"); bl.textContent = "기준연도 ";
    const base = document.createElement("select"); base.setAttribute("aria-label", "비교 기준연도");
    [2011, 2013, 2019, 2022, 2024].forEach((y) => { const o = document.createElement("option"); o.value = y; o.textContent = y + "년 = 100"; base.appendChild(o); });
    base.value = state.base; bl.appendChild(base); row.appendChild(bl);
    for (const [label, step] of [["이전 연도", -1], ["다음 연도", 1]]) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = label;
      b.addEventListener("click", () => { const rows = state.mode === "claim" ? d.rows : d.rows.filter((r) => r.supportAmount !== undefined); const ys = rows.map((r) => r.year); const i = KF.clamp(ys.indexOf(state.year) + step, 0, ys.length - 1); state.year = ys[i]; sync(); render(); });
      row.appendChild(b);
    }
    controls.appendChild(row);
    const status = document.createElement("p"); status.setAttribute("aria-live", "polite"); status.style.cssText = "font-size:12px;line-height:1.6;width:100%;margin:8px 0 0";
    controls.appendChild(status);
    function sync() {
      const rows = state.mode === "claim" ? d.rows : d.rows.filter((r) => r.supportAmount !== undefined);
      if (!rows.find((r) => r.year === state.year)) state.year = rows.at(-1).year;
      const r = rows.find((r) => r.year === state.year);
      status.textContent = state.mode === "claim"
        ? `${state.year}년 · 신고 인원 ${KF.fmt(r.people)}명 · 체불 총액 ${KF.fmt(r.amount)}억원 · 인당액 ${KF.fmt(r.per)}만원`
        : `${state.year}년 · 체불 총액 ${KF.fmt(r.amount)}억원 · 대지급금 ${KF.fmt(r.supportAmount)}억원 (${KF.fmt(r.supportPeople)}명)`;
    }
    base.addEventListener("change", () => { state.base = +base.value; render(); });

    const move = (e) => { const rc = stage.getBoundingClientRect(); state.hover = [e.clientX - rc.left, e.clientY - rc.top]; render(); };
    stage.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") move(e); });
    stage.addEventListener("pointerdown", (e) => {
      move(e);
      if (state._geoms) {
        for (const k in state._geoms) {
          const g = state._geoms[k];
          const [hx, hy] = state.hover;
          if (hx >= g.x - 8 && hx <= g.x + g.w + 8) { const i = KF.clamp(Math.round((hx - g.x) / g.w * (state._rows.length - 1)), 0, state._rows.length - 1); state.year = state._rows[i].year; sync(); render(); break; }
        }
      }
    });
    stage.addEventListener("pointerleave", () => { state.hover = null; render(); });

    sync(); render();
    if (!KF.reduced) {
      const t0 = performance.now();
      const intro = (now) => { const p = KF.clamp((now - t0) / 800, 0, 1); render(); if (p < 1) requestAnimationFrame(intro); };
      requestAnimationFrame(intro);
    }
  }

  VIZ["unpaid-wages"] = { thumb: thumbFn, mount, bg: BG };
})();
