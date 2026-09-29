// 79 juvenile-crime — "저울추 막대". Cast-iron counterweight discs, stacked one column per year —
// height = the youth-population-adjusted rate that year. A dashed line marks 2008's starting height,
// so every later, shorter stack reads directly against where the count started. Second view: the
// same discs laid out sideways as bars, one per offence type (2019).
(() => {
  const BG = "#c8b0b8";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#3a2420", MUTE = "rgba(58,36,32,.64)";
  const IRON = ["#726a5f", "#38342e"], IRON_HI = "#8f8577";
  const MARK = "#8a3b32";

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // one cast-iron disc, drawn as a short cylinder (ring highlight + hub hole)
  function disc(ctx, cx, cy, rw, rh) {
    const g = ctx.createLinearGradient(cx - rw, cy, cx + rw, cy);
    g.addColorStop(0, IRON[1]); g.addColorStop(0.45, IRON_HI); g.addColorStop(1, IRON[1]);
    ctx.fillStyle = g; roundRect(ctx, cx - rw, cy - rh, rw * 2, rh * 2, rh * 0.9); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(cx, cy, rw * 0.22, rh * 0.5, 0, 0, 7); ctx.fill();
  }

  function trend(ctx, w, h, d, el, hover, small) {
    const pad = small ? 14 : 26, top = small ? 88 : 100;
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${small ? 10 : 11}px ${MONO}`;
    ctx.fillText("소년범죄 검거 · 인구 천 명당 · 저울추 1개 = 1건대", pad, small ? 18 : 22);
    ctx.fillStyle = INK; ctx.font = `700 ${small ? 15 : 19}px ${SANS}`;
    ctx.fillText("17년 사이 저울추가 줄어들었다", pad, small ? 38 : 48);
    const first = d.years[0], last = d.years[d.years.length - 1];
    ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 10.5 : 12}px ${SANS}`;
    ctx.fillText(`${first}년 ${d.rate[0].toFixed(1)}건 → ${last}년 ${d.rate[d.rate.length - 1].toFixed(1)}건 (점선은 ${first}년 높이)`, pad, small ? 56 : 70);

    const n = d.years.length, gap = small ? 3 : 6;
    const areaW = w - pad * 2, areaH = h - top - pad - 20;
    const cw = (areaW - gap * (n - 1)) / n;
    const unit = Math.min(areaH / Math.ceil(Math.max(...d.rate)), cw * 0.62);
    const rw = cw * 0.42, rh = unit * 0.46;
    const base = h - pad - 20;
    const refY = base - Math.round(d.rate[0]) * unit;
    ctx.setLineDash([4, 4]); ctx.strokeStyle = MARK; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(pad, refY); ctx.lineTo(w - pad, refY); ctx.stroke(); ctx.setLineDash([]);

    let hit = null;
    d.years.forEach((y, i) => {
      const cx = pad + cw / 2 + i * (cw + gap);
      const nDiscs = Math.round(d.rate[i]);
      const grow = KF.clamp(el * 1.4 - i * 0.05, 0, 1);
      for (let k = 0; k < Math.round(nDiscs * grow); k++) {
        disc(ctx, cx, base - unit * (k + 0.5), rw, rh);
      }
      if (hover && hover[0] >= cx - cw / 2 && hover[0] <= cx + cw / 2 && hover[1] >= base - unit * nDiscs - 8 && hover[1] <= base + 8) hit = { y, i };
      if (!small || i % 2 === 0) {
        ctx.textAlign = "center"; ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 8 : 10}px ${MONO}`;
        ctx.fillText(y.slice(2), cx, base + 14);
      }
    });
    return hit;
  }

  function composition(ctx, w, h, d, el, hover, small) {
    const pad = small ? 14 : 26, top = small ? 88 : 100;
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${small ? 10 : 11}px ${MONO}`;
    ctx.fillText("2019년 범죄소년 검거인원 · 죄종별 · 저울추 1개 = 1%", pad, small ? 18 : 22);
    ctx.fillStyle = INK; ctx.font = `700 ${small ? 15 : 19}px ${SANS}`;
    ctx.fillText("강력범죄는 드물고, 대부분은 폭력·절도다", pad, small ? 38 : 48);
    const violent = d.offRank.find((r) => r.label.startsWith("강력범죄"));
    ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 10.5 : 12}px ${SANS}`;
    ctx.fillText(`강력범죄(살인·강도·강간추행·방화)는 전체의 ${violent.pct}%`, pad, small ? 56 : 70);

    const rowH = (h - top - pad) / d.offRank.length;
    const labelW = small ? Math.min(64, w * 0.22) : 150, textW = small ? 40 : 52;
    const barX0 = pad + labelW, barAvail = w - pad - textW - barX0;
    const maxN = Math.max(...d.offRank.map((r) => Math.max(1, Math.round(r.pct))));
    const gapU = small ? 1 : 1.4;
    const unit = Math.max(2, Math.min(14, barAvail / maxN - gapU));
    let hit = null;
    d.offRank.forEach((r, i) => {
      const y0 = top + i * rowH, cy = y0 + rowH / 2;
      const n = Math.max(1, Math.round(r.pct));
      const grow = KF.clamp(el * 1.6 - i * 0.08, 0, 1);
      const shown = Math.round(n * grow);
      for (let k = 0; k < shown; k++) disc(ctx, barX0 + k * (unit + gapU) + unit / 2, cy, unit * 0.48, rowH * 0.32);
      ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `600 ${small ? 10 : 12.5}px ${SANS}`;
      ctx.fillText(r.label, barX0 - 6, cy + 4);
      ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 9 : 11}px ${MONO}`;
      ctx.fillText(`${r.pct}%`, barX0 + n * (unit + gapU) + 6, cy + 4);
      if (hover && hover[1] >= y0 && hover[1] < y0 + rowH) hit = r;
    });
    return hit;
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : `500 11px ${MONO}`);
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 10 + lines.length * 17;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(40,24,20,.94)"; roundRect(ctx, bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = MARK; ctx.lineWidth = 1; roundRect(ctx, bx + .5, by + .5, bw - 1, bh - 1, 6); ctx.stroke();
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k ? "#f3d9cf" : "#ecdfd9"; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 19 + j * 17); });
  }

  // ---------------------------------------------------------------- thumb (own compact layout)
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = Math.max(10, w * 0.03);
    const line1Y = Math.max(pad + w * 0.026, 42), line2Y = Math.max(pad + w * 0.072, 66);
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${Math.max(9, w * 0.026)}px ${MONO}`;
    ctx.fillText("소년 인구 천 명당 검거", pad, line1Y);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.max(13, w * 0.046)}px ${SANS}`;
    const rateDrop = (1 - d.rate[d.rate.length - 1] / d.rate[0]) * 100;
    ctx.fillText(`${d.years[0]}→${d.years[d.years.length - 1]}년 ${rateDrop.toFixed(0)}% 줄었다`, pad, line2Y);

    const BOTTOM_CLEAR = 58; // keep the board's own bottom-left glyph badge clear — the leftmost
    // (2008) column would otherwise sit right under it
    const n = d.years.length, areaW = w - pad * 2, base = h - BOTTOM_CLEAR, areaH = base - line2Y;
    const cw = areaW / n, unit = Math.min(areaH / Math.ceil(Math.max(...d.rate)), cw * 0.7);
    const rw = cw * 0.4, rh = unit * 0.46;
    const grow = KF.clamp((t % 10) / 1.4, 0.1, 1);
    d.years.forEach((y, i) => {
      const cx = pad + cw / 2 + i * cw, nDiscs = Math.round(Math.round(d.rate[i]) * grow);
      for (let k = 0; k < nDiscs; k++) disc(ctx, cx, base - unit * (k + 0.5), rw, rh);
    });
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let view = "추이", t0 = performance.now(), hover = null;
    KF.segment(controls, [{ id: "추이", label: "17년 추이" }, { id: "죄종", label: "죄종 구성 (2019)" }], view, (id) => { view = id; t0 = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, small = w <= 560, el = (performance.now() - t0) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      if (view === "추이") {
        const hit = trend(ctx, w, h, d, el, hover, small);
        if (hit && hover) tip(ctx, w, h, [[`${hit.y}년`, 1], [`검거 ${KF.fmt(d.count[hit.i])}건`, 0], [`인구 ${KF.fmt(d.pop[hit.i])}명 · 천 명당 ${d.rate[hit.i].toFixed(1)}건`, 0]], hover);
      } else {
        const hit = composition(ctx, w, h, d, el, hover, small);
        if (hit && hover) tip(ctx, w, h, [[hit.label, 1], [`${KF.fmt(hit.value)}명 · ${hit.pct}%`, 0]], hover);
      }
    });
  }

  VIZ["juvenile-crime"] = { thumb, mount, bg: BG };
})();
