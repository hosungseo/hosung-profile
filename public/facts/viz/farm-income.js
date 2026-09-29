// 96 farm-income — "수확 상자". A wooden crate fills with the year's harvest: the bottom (muddy brown) layer
// is 경영비(cost), the top (gold) layer is 소득(income); the two stacked layers are 총수입(revenue). A price
// tag hangs off the crate. Price rising does not always lift the gold layer — the year rail below flags when
// it does not (price up, income down).
(() => {
  const BG = "#f0dcc0", INK = "#2f2412", WOOD = "#8a5a34", WOOD_DK = "#6b431f", SLAT = "rgba(0,0,0,.14)";
  const COST = "#9c6b46", INCOME = "#d9a72c", INCOME_LT = "#f0c95a", RED = "#a3352a", GREEN = "#4f7a3f";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", MYEONGJO = "'Nanum Myeongjo', serif";
  const CROPS = ["사과", "배", "복숭아", "단감"];

  function text(ctx, t, x, y, size, color, align, weight, font) {
    ctx.font = `${weight || 500} ${size}px ${font || SANS}`; ctx.fillStyle = color; ctx.textAlign = align || "left"; ctx.fillText(t, x, y);
  }
  const fmt = (n) => Math.round(n).toLocaleString("ko-KR");
  const sg = (n) => (n > 0 ? "+" : "") + fmt(n);

  // ---------------------------------------------------------------- crate: cost layer (bottom) + income layer (top)
  function crate(ctx, box, row, scale, hoverFrac) {
    const [x, y, w, h] = box;
    const revH = Math.min(h, (row.revenue / scale) * h);
    const costH = revH * (row.cost / row.revenue), incH = revH - costH;
    const top = y + h - revH;
    // crate body (wood sides)
    ctx.fillStyle = WOOD_DK; ctx.fillRect(x - 6, top - 10, w + 12, revH + 10 + (h - revH));
    // cost fill (bottom of the crate's contents)
    ctx.fillStyle = COST; ctx.fillRect(x, y + h - costH, w, costH);
    // income fill (top layer)
    const g = ctx.createLinearGradient(0, top, 0, top + incH);
    g.addColorStop(0, INCOME_LT); g.addColorStop(1, INCOME);
    ctx.fillStyle = g; ctx.fillRect(x, top, w, incH);
    // seam between layers
    ctx.strokeStyle = "rgba(47,36,18,.5)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y + h - costH); ctx.lineTo(x + w, y + h - costH); ctx.stroke();
    // slats (front)
    ctx.strokeStyle = SLAT; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) { const sx = x + (w / 5) * i; ctx.beginPath(); ctx.moveTo(sx, top - 8); ctx.lineTo(sx, y + h); ctx.stroke(); }
    // crate frame
    ctx.strokeStyle = WOOD_DK; ctx.lineWidth = 3; ctx.strokeRect(x - 6, top - 10, w + 12, revH + 10 + (h - revH));
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1; ctx.strokeRect(x - 4, top - 8, w + 8, 4);
    return { x, y: top, w, h: revH, costH, incH, top, bottom: y + h };
  }

  function priceTag(ctx, cx, topY, price, deltaPct, full) {
    const w = full ? 76 : 62, h = full ? 40 : 32, str = full ? 34 : 20;
    ctx.strokeStyle = "rgba(47,36,18,.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, topY - str); ctx.lineTo(cx, topY - h + 8); ctx.stroke();
    ctx.save(); ctx.translate(cx - w / 2, topY - h - 2); ctx.rotate(-0.05);
    ctx.fillStyle = "#f4ecd4"; ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(10, h); ctx.lineTo(0, h / 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(47,36,18,.55)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "rgba(47,36,18,.8)"; ctx.beginPath(); ctx.arc(9, h / 2, 2.2, 0, 7); ctx.fill();
    text(ctx, `${fmt(price)}원/kg`, 15, h * 0.44, full ? 12 : 10, INK, "left", 700, MONO);
    text(ctx, `${deltaPct >= 0 ? "▲" : "▼"} ${Math.abs(deltaPct).toFixed(1)}%`, 15, h * 0.82, full ? 10 : 9, deltaPct >= 0 ? GREEN : RED, "left", 600, MONO);
    ctx.restore();
    return str + h + 2;
  }

  function tip(ctx, w, h, x, y, lines) {
    const fs = 12; ctx.font = `700 ${fs}px ${SANS}`;
    let bw = Math.max(...lines.map((l) => ctx.measureText(l[0]).width)) + 22;
    const bh = 10 + lines.length * (fs + 7);
    const bx = KF.clamp(x + 12, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(244,236,212,.98)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    lines.forEach((l, i) => { ctx.fillStyle = l[1] || INK; ctx.font = `${i ? 500 : 700} ${fs}px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(l[0], bx + 10, by + 8 + (i + 1) * (fs + 7) - 4); });
  }

  function draw(ctx, w, h, d, state, thumb) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const full = w > 520 && !thumb;
    const crop = d.crops[state.ci], rows = crop.rows;
    const yi = rows.findIndex((r) => r.year === state.year);
    const row = rows[yi], prev = rows[yi - 1] || row;
    const scale = Math.max(...rows.map((r) => r.revenue)) * 1.06;
    const pad = thumb ? 12 : full ? 26 : 14;

    if (thumb) {
      text(ctx, `${crop.name} · 가격이 올라도 소득은?`, pad, h * 0.33, h * 0.068, INK, "left", 700, MYEONGJO);
      crate(ctx, [54, h * 0.42, w * 0.24, h * 0.4], row, scale);
      const t = d.transitions.find((tt) => tt.crop === crop.name && tt.year === row.year);
      text(ctx, `가격 ${sg(t ? Math.round(t.pricePct) : 0)}%`, w * 0.42, h * 0.5, h * 0.058, INK, "left", 700, MONO);
      text(ctx, `소득 ${sg(row.income - prev.income)}천원`, w * 0.42, h * 0.63, h * 0.066, row.income < prev.income ? RED : GREEN, "left", 700, MONO);
      text(ctx, `${row.year}년`, w * 0.42, h * 0.76, h * 0.05, "rgba(47,36,18,.7)", "left", 600, MONO);
      return;
    }

    text(ctx, "작물 가격이 오르면 농가도 더 벌까", pad, pad + (full ? 22 : 18), full ? 20 : 16, INK, "left", 700, MYEONGJO);
    text(ctx, "수확 상자 · 금빛 층 = 소득, 갈색 층 = 경영비 · 농촌진흥청 경영성과", pad, pad + (full ? 40 : 34), full ? 11 : 9.5, "rgba(47,36,18,.72)", "left");

    const cropY = pad + (full ? 56 : 46);
    CROPS.forEach((name, i) => {
      const cw = full ? 84 : (w - pad * 2) / 4 - 6, cx = pad + i * (cw + 8);
      const on = i === state.ci;
      ctx.fillStyle = on ? INCOME : "rgba(244,236,212,.55)"; ctx.fillRect(cx, cropY, cw, 24);
      ctx.strokeStyle = "rgba(47,36,18,.5)"; ctx.lineWidth = 1; ctx.strokeRect(cx + .5, cropY + .5, cw - 1, 23);
      text(ctx, name, cx + cw / 2, cropY + 16, full ? 12.5 : 11, INK, "center", on ? 700 : 500);
    });
    state._cropBox = { x: pad, y: cropY, cw: full ? 84 : (w - pad * 2) / 4 - 6, gap: 8 };

    const crateTop = cropY + (full ? 108 : 80);
    const crateH = full ? h * 0.42 : h * 0.17;
    const crateW = full ? w * 0.22 : w * 0.3;
    const crateX = pad + 10;
    const cg = crate(ctx, [crateX, crateTop, crateW, crateH], row, scale);
    priceTag(ctx, crateX + crateW * 0.7, cg.top, row.price, ((row.price / prev.price) - 1) * 100, full);

    // year rail
    const railX = crateX, railW = crateW, railY = cg.bottom + (full ? 34 : 18);
    text(ctx, `${crop.name} · ${rows[0].year}–${rows.at(-1).year}년`, railX, railY - 12, full ? 10.5 : 9.5, "rgba(47,36,18,.65)", "left", 600);
    ctx.strokeStyle = "rgba(47,36,18,.35)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(railX, railY); ctx.lineTo(railX + railW, railY); ctx.stroke();
    const railGeo = { x: railX, w: railW, y: railY, n: rows.length };
    rows.forEach((r, i) => {
      const rx = railX + (i / (rows.length - 1)) * railW;
      const t = d.transitions.find((tt) => tt.crop === crop.name && tt.year === r.year);
      const counter = t && t.counter;
      ctx.fillStyle = r.year === state.year ? INK : counter ? RED : "rgba(47,36,18,.35)";
      ctx.beginPath(); ctx.arc(rx, railY, r.year === state.year ? 5 : counter ? 4 : 2.6, 0, 7); ctx.fill();
      if (counter && r.year !== state.year) { ctx.strokeStyle = RED; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rx, railY - 4); ctx.lineTo(rx, railY - 12); ctx.stroke(); }
    });
    text(ctx, "빨간 점 = 가격은 올랐는데 소득은 준 해", railX, railY + 18, full ? 10 : 9, RED, "left", 500);

    // ledger card
    const ledX = full ? crateX + crateW + 46 : pad, ledY = full ? crateTop - 20 : railY + 22;
    const ledW = full ? w - ledX - pad : w - pad * 2, ledH = full ? crateH + 60 : h - ledY - pad - 4;
    ctx.fillStyle = "rgba(244,236,212,.92)"; ctx.fillRect(ledX, ledY, ledW, ledH);
    ctx.strokeStyle = "rgba(47,36,18,.4)"; ctx.lineWidth = 1; ctx.strokeRect(ledX + .5, ledY + .5, ledW - 1, ledH - 1);
    text(ctx, `${crop.name} ${row.year}년`, ledX + 16, ledY + (full ? 30 : 21), full ? 19 : 15, INK, "left", 700, MONO);
    if (full) text(ctx, `10a당 · 수량 ${fmt(row.yield)}kg (전년비 ${sg(Math.round((row.yield / prev.yield - 1) * 100))}%)`, ledX + 16, ledY + 50, 11, "rgba(47,36,18,.72)", "left", 500);
    const fields = [["총수입", row.revenue, row.revenue - prev.revenue, INK], ["경영비", row.cost, row.cost - prev.cost, COST], ["소득", row.income, row.income - prev.income, row.income - prev.income < 0 ? RED : GREEN]];
    let fy = ledY + (full ? 82 : 42);
    fields.forEach(([lab, val, delta, col]) => {
      text(ctx, lab, ledX + 16, fy, full ? 12.5 : 11, "rgba(47,36,18,.75)", "left", 600);
      text(ctx, `${fmt(val)}천원`, ledX + ledW - 16, fy, full ? 15 : 13, INK, "right", 700, MONO);
      text(ctx, sg(delta), ledX + ledW - 16, fy + (full ? 15 : 13), full ? 11 : 9.5, col, "right", 600, MONO);
      fy += full ? 44 : 32;
    });
    const noteLines = full && crop.name === "사과"
      ? ["수입 − 비용 = 소득. 공표값 반올림으로 약간의 오차가 있을 수 있다.", `참고: ${d.production.year}년 전국 사과 생산량 ${d.production.thousandTons}천톤(전년비 +${d.production.change}%) — 전국 총량, 이 상자는 표본 농가 10a당 값`]
      : ["수입 − 비용 = 소득. 공표값 반올림으로 약간의 오차가 있을 수 있다."];
    noteLines.forEach((t, i) => text(ctx, t, ledX + 16, ledY + ledH - (noteLines.length - i) * (full ? 16 : 14) + (full ? 2 : 0), full ? 10 : 9, "rgba(47,36,18,.6)", "left", 500));

    state._geo = { railGeo, rows, crop };
    if (state.hover) {
      const [hx, hy] = state.hover;
      if (Math.abs(hy - railY) < 14 && hx >= railX - 8 && hx <= railX + railW + 8) {
        const i = KF.clamp(Math.round((hx - railX) / railW * (rows.length - 1)), 0, rows.length - 1);
        const r = rows[i];
        tip(ctx, w, h, hx, hy, [[`${crop.name} ${r.year}년`, INK], [`가격 ${fmt(r.price)}원/kg · 소득 ${fmt(r.income)}천원`, "rgba(47,36,18,.8)"]]);
      }
    }
  }

  function thumbFn(ctx, w, h, t, d) { draw(ctx, w, h, d, { ci: 0, year: 2017 }, true); }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const state = { ci: 0, year: d.crops[0].rows.at(-1).year, hover: null };
    const render = () => draw(s.ctx, s.w, s.h, d, state, false);
    s.onresize = render; stage._kfStill = render;

    const row = document.createElement("div"); row.style.cssText = "display:flex;gap:10px;align-items:center;width:100%;flex-wrap:wrap";
    for (const [label, step] of [["이전 연도", -1], ["다음 연도", 1]]) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = label;
      b.addEventListener("click", () => { const rows = d.crops[state.ci].rows; const ys = rows.map((r) => r.year); const i = KF.clamp(ys.indexOf(state.year) + step, 0, ys.length - 1); state.year = ys[i]; sync(); render(); });
      row.appendChild(b);
    }
    controls.appendChild(row);
    const status = document.createElement("p"); status.setAttribute("aria-live", "polite"); status.style.cssText = "font-size:12px;line-height:1.6;width:100%;margin:8px 0 0";
    controls.appendChild(status);
    function sync() {
      const r = d.crops[state.ci].rows.find((r) => r.year === state.year);
      status.textContent = `${d.crops[state.ci].name} ${state.year}년 · 가격 ${fmt(r.price)}원/kg · 소득 ${fmt(r.income)}천원`;
    }

    function pickCrop(px, py) {
      const b = state._cropBoxCache; if (!b) return null;
      if (py < b.y || py > b.y + 24) return null;
      const i = Math.floor((px - b.x) / (b.cw + b.gap));
      return i >= 0 && i < 4 ? i : null;
    }
    const move = (e) => { const rc = stage.getBoundingClientRect(); state.hover = [e.clientX - rc.left, e.clientY - rc.top]; render(); state._cropBoxCache = state._cropBox; };
    stage.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") move(e); });
    stage.addEventListener("pointerdown", (e) => {
      move(e);
      const [hx, hy] = state.hover;
      const ci = pickCrop(hx, hy);
      if (ci != null && ci !== state.ci) { state.ci = ci; state.year = d.crops[ci].rows.at(-1).year; sync(); render(); return; }
      if (state._geo) {
        const { railGeo, rows } = state._geo;
        if (Math.abs(hy - railGeo.y) < 14 && hx >= railGeo.x - 10 && hx <= railGeo.x + railGeo.w + 10) {
          const i = KF.clamp(Math.round((hx - railGeo.x) / railGeo.w * (rows.length - 1)), 0, rows.length - 1);
          state.year = rows[i].year; sync(); render();
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

  VIZ["farm-income"] = { thumb: thumbFn, mount, bg: BG };
})();
