// 86 electrical-fire — "차단기함". A household breaker box: ten miniature circuit breakers, one per
// investigated cause, mounted on a panel. Each breaker's lever fill = its share of that year's fires.
// The five "단락"(short-circuit) breakers glow copper, "과부하"(overload) glows teal — so the eye can
// compare the whole copper cluster against the single, much smaller teal one. Flip the year tab to see
// the same panel in 2022/2023/2024; click a breaker to see its own three-year trend.
(() => {
  const BG = "#aeb6a0";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#232920", MUTE = "rgba(35,41,32,.64)";
  const BOX = ["#c7cdbb", "#93998a"];               // panel housing gradient (light, dark)
  const BODY = ["#4a4e44", "#20231d"];              // breaker plastic body gradient
  const SHORT = "#b9793a", OVER = "#3f8a82", REST = "#8b8f80";
  const HILITE = "#c0392b";
  const SHORT_LABELS = ["절연열화에 의한 단락", "트래킹에 의한 단락", "압착 손상에 의한 단락", "층간 단락", "미확인 단락"];

  function colorOf(label) {
    if (label === "과부하 및 과전류") return OVER;
    if (SHORT_LABELS.includes(label)) return SHORT;
    return REST;
  }
  function short(label) { return label.replace("에 의한 단락", " 단락").replace(" 및 과전류", "·과전류"); }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function screw(ctx, cx, cy, r) {
    ctx.fillStyle = "rgba(0,0,0,.32)"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = r * 0.35;
    ctx.beginPath(); ctx.moveTo(cx - r * 0.55, cy); ctx.lineTo(cx + r * 0.55, cy); ctx.stroke();
  }

  function panelBox(ctx, x, y, w, h) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, BOX[0]); g.addColorStop(1, BOX[1]);
    roundRect(ctx, x, y, w, h, 12); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "rgba(35,41,32,.4)"; ctx.lineWidth = 1.4; ctx.stroke();
    const m = 12;
    [[x + m, y + m], [x + w - m, y + m], [x + m, y + h - m], [x + w - m, y + h - m]].forEach(([cx, cy]) => screw(ctx, cx, cy, 3.4));
  }

  // one breaker: coloured group cap + body + a lever track filled from the bottom, share in [0,1].
  // The fill is the whole story, so it gets most of the switch's width and a small knob that never
  // hides it; a bold % sits in the cap so the number reads even where the fill itself is thin.
  function breaker(ctx, cx, cy, w, h, share, color, grow, selected, small) {
    const bx = cx - w / 2, by = cy - h / 2;
    const capH = h * 0.22;
    // coloured cap: this is what makes the 단락(copper)/과부하(teal)/나머지(grey) split legible at a glance
    roundRect(ctx, bx, by, w, capH, w * 0.16);
    ctx.save(); ctx.beginPath(); roundRect(ctx, bx, by, w, capH * 2, w * 0.16); ctx.clip();
    ctx.fillStyle = color; ctx.fillRect(bx, by, w, capH); ctx.restore();
    ctx.fillStyle = "#1a1c17"; ctx.textAlign = "center"; ctx.font = `800 ${small ? 11 : 13}px ${MONO}`;
    ctx.fillText(`${Math.round(share * 100)}%`, cx, by + capH * 0.7);
    // body
    const bodyY = by + capH - 1, bodyH = h - capH + 1;
    const g = ctx.createLinearGradient(bx, bodyY, bx, bodyY + bodyH);
    g.addColorStop(0, BODY[0]); g.addColorStop(1, BODY[1]);
    roundRect(ctx, bx, bodyY, w, bodyH, w * 0.14); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = selected ? HILITE : "rgba(0,0,0,.4)"; ctx.lineWidth = selected ? 2.4 : 1; ctx.stroke();
    // lever track, filled from the bottom — wide enough that even a small share reads as a visible block
    const tw = w * 0.56, tx = cx - tw / 2, ty0 = bodyY + bodyH * 0.14, th = bodyH * 0.72;
    roundRect(ctx, tx, ty0, tw, th, tw * 0.22); ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fill();
    const fillH = Math.max(th * 0.06, th * KF.clamp(share, 0, 1) * grow);
    const fg = ctx.createLinearGradient(0, ty0 + th - fillH, 0, ty0 + th);
    fg.addColorStop(0, "rgba(255,255,255,.55)"); fg.addColorStop(0.3, color); fg.addColorStop(1, color);
    roundRect(ctx, tx + 1.5, ty0 + th - fillH, tw - 3, fillH - 1.5, tw * 0.18); ctx.fillStyle = fg; ctx.fill();
    // thin knob line marking the fill's top edge (small, so it never hides a low fill)
    ctx.fillStyle = "#e9e6da"; roundRect(ctx, tx - 1, ty0 + th - fillH - 1.6, tw + 2, 3.2, 1.6); ctx.fill();
  }

  function layout(items, x0, y0, w, h, cols) {
    const rows = Math.ceil(items.length / cols), gapX = w * 0.05, gapY = h * 0.16;
    const cw = (w - gapX * (cols - 1)) / cols, ch = (h - gapY * (rows - 1)) / rows;
    return items.map((it, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      return { ...it, cx: x0 + cw / 2 + c * (cw + gapX), cy: y0 + ch / 2 + r * (ch + gapY), w: cw * 0.62, h: ch * 0.86 };
    });
  }

  function wrap(ctx, s, maxW) {
    if (ctx.measureText(s).width <= maxW) return [s];
    const cut = s.indexOf(" ") > 0 ? s.indexOf(" ") : Math.ceil(s.length / 2);
    return [s.slice(0, cut).trim(), s.slice(cut).trim()];
  }

  function draw(ctx, w, h, X, year, el, hover, small, pick) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = small ? 14 : 26;
    const panel = X.panels[year];
    const shortPct = (panel.short / panel.total) * 100, overPct = (panel.over / panel.total) * 100;

    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${small ? 10 : 11}px ${MONO}`;
    ctx.fillText(`전기화재 발화원인 · ${year}년 · 스위치 채움 = 그해 몫`, pad, small ? 18 : 22);
    ctx.fillStyle = INK; ctx.font = `700 ${small ? 15 : 19}px ${SANS}`;
    ctx.fillText("과부하는 10건 중 1건이 안 된다", pad, small ? 38 : 48);
    ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 10.5 : 12}px ${SANS}`;
    ctx.fillText("구릿빛 = 단락 계열 · 청록 = 과부하 · 회색 = 나머지 원인", pad, small ? 56 : 70);

    // main-breaker summary strip: the two group totals, unmissable, before any of the ten small switches
    const barY = small ? 68 : 82, barH = small ? 22 : 26, barW = w - pad * 2;
    roundRect(ctx, pad, barY, barW, barH, barH * 0.28); ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fill();
    const restPct = 100 - shortPct - overPct;
    let bx = pad;
    [[shortPct, SHORT], [overPct, OVER], [restPct, REST]].forEach(([pct, color]) => {
      const segW = (pct / 100) * barW;
      ctx.fillStyle = color; ctx.fillRect(bx, barY, Math.max(segW, 0), barH);
      bx += segW;
    });
    ctx.strokeStyle = "rgba(35,41,32,.5)"; ctx.lineWidth = 1; roundRect(ctx, pad, barY, barW, barH, barH * 0.28); ctx.stroke();
    ctx.textAlign = "left"; ctx.fillStyle = "#1a1c17"; ctx.font = `800 ${small ? 11 : 13}px ${MONO}`;
    ctx.fillText(`단락 계열 ${shortPct.toFixed(0)}%`, pad + 8, barY + barH / 2 + (small ? 4 : 4.5));
    ctx.textAlign = "right"; ctx.fillStyle = "#eef2ea";
    ctx.fillText(`과부하 ${overPct.toFixed(0)}%`, pad + barW - 8, barY + barH / 2 + (small ? 4 : 4.5));

    const boxTop = barY + barH + (small ? 10 : 14);
    const boxH = h - boxTop - pad - (small ? 30 : 36);
    panelBox(ctx, pad, boxTop, w - pad * 2, boxH);
    const cols = small ? 3 : 5;
    const items = layout(panel.causes, pad + (w - pad * 2) * 0.06, boxTop + boxH * 0.1, (w - pad * 2) * 0.88, boxH * 0.78, cols);
    const grow = KF.clamp(el * 1.3, 0.08, 1);
    let hit = null;
    items.forEach((it, i) => {
      const share = it.value / panel.total, sel = pick === it.label;
      const g2 = KF.clamp(grow * (items.length + 2) - i, 0, 1);
      breaker(ctx, it.cx, it.cy, it.w, it.h, share, colorOf(it.label), g2, sel, small);
      ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `600 ${small ? 8.6 : 10.5}px ${SANS}`;
      const lines = wrap(ctx, short(it.label), it.w * (small ? 2.3 : 2.6));
      lines.forEach((ln, li) => ctx.fillText(ln, it.cx, it.cy + it.h / 2 + 14 + li * (small ? 10 : 12)));
      const hx = it.cx, hy = it.cy;
      if (hover && Math.abs(hover[0] - hx) < it.w * 0.9 && Math.abs(hover[1] - hy) < it.h * 0.7) hit = it;
    });

    // meter readout strip
    const my = h - pad - (small ? 14 : 18);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${small ? 10 : 11.5}px ${MONO}`;
    ctx.fillText(`총 ${KF.fmt(panel.total)}건`, pad, my);
    ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 9.5 : 11}px ${MONO}`;
    ctx.fillText(`사망 ${KF.fmt(panel.deaths)} · 부상 ${KF.fmt(panel.injuries)}`, pad + (small ? 90 : 120), my);
    return hit;
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : `500 11px ${MONO}`);
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 10 + lines.length * 17;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(20,23,17,.94)"; roundRect(ctx, bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = HILITE; ctx.lineWidth = 1; roundRect(ctx, bx + .5, by + .5, bw - 1, bh - 1, 6); ctx.stroke();
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k ? "#ffd9c8" : "#e7ece0"; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 19 + j * 17); });
  }

  // ---------------------------------------------------------------- thumb (own compact layout)
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = Math.max(10, w * 0.03);
    const line1Y = Math.max(pad + w * 0.026, 42), line2Y = Math.max(pad + w * 0.072, 66);
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${Math.max(9, w * 0.026)}px ${MONO}`;
    ctx.fillText("전기화재는 대부분 과부하일까", pad, line1Y);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.max(13, w * 0.05)}px ${SANS}`;
    ctx.fillText("단락 vs 과부하", pad, line2Y);

    const year = d.years[d.years.length - 1], panel = d.panels[year];
    const shortPct = panel.short / panel.total, overPct = panel.over / panel.total;
    const grow = KF.clamp((t % 10) / 1.2, 0.08, 1);
    const BOTTOM_CLEAR = 58, LABEL_H = 14; // keep the board's own bottom-left glyph badge clear
    const bw = w * 0.16, gap = w * 0.1, baseY = h - BOTTOM_CLEAR - LABEL_H;
    const areaH = baseY - line2Y - 24;
    [["단락 계열", shortPct, SHORT], ["과부하", overPct, OVER]].forEach(([label, share, color], i) => {
      const cx = pad + bw / 2 + i * (bw + gap);
      breaker(ctx, cx, baseY - areaH / 2, bw, areaH, share, color, grow, false, true);
      ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `600 ${Math.max(9, w * 0.028)}px ${SANS}`;
      ctx.fillText(label, cx, baseY + LABEL_H);
      ctx.fillStyle = color; ctx.font = `700 ${Math.max(13, w * 0.05)}px ${SANS}`;
      ctx.fillText(`${(share * 100).toFixed(0)}%`, cx, line2Y + 18);
    });
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let year = d.years[d.years.length - 1], t0 = performance.now(), hover = null, pick = null;
    KF.segment(controls, d.years.map((y) => ({ id: y, label: `${y}년` })), year, (id) => { year = id; t0 = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, small = w <= 560, el = (performance.now() - t0) / 1000;
      const hit = draw(ctx, w, h, d, year, el, hover, small, pick);
      if (hit && hover) {
        const trend = d.years.map((y) => d.panels[y].causes.find((c) => c.label === hit.label)?.value || 0);
        tip(ctx, w, h, [[short(hit.label), 1], [`${year}년 ${KF.fmt(hit.value)}건 · ${(hit.value / d.panels[year].total * 100).toFixed(1)}%`, 0],
          [`${d.years.join("→")} 추세: ${trend.map((v) => KF.fmt(v)).join(" → ")}`, 2]], hover);
      }
    });
  }

  VIZ["electrical-fire"] = { thumb, mount, bg: BG };
})();
