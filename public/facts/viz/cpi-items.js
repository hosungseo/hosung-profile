// 72 cpi-items — "가격표 행거 (price-tag rack)". A steel rail with hangers; each item's silhouette
// hangs at a size scaled to how much its price index moved (1995=100 baseline for each item, not a
// shared unit). A dashed line marks the headline CPI's own move, so items can be read against it.
(() => {
  const BG = "#b2cca4";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#22321c", DIM = "rgba(34,50,28,.64)", FAINT = "rgba(34,50,28,.2)";
  const RAIL = "#5a6455", RAIL_HI = "#828c72";
  const TAG = "#f6f1de", TAG_EDGE = "#cabf98";
  const FOOD = "#b1502f", UTIL = "#2f7a6b", ELEC = "#4a5568", TOTAL = "#22321c";
  const CAT_COLOR = { food: FOOD, util: UTIL, elec: ELEC, total: TOTAL };
  const ITEM_COLOR = { 자장면: "#5b3a22", 배추: "#5b8c3c", 고등어: "#51707f", 도시가스: "#e0752f", 전기료: "#c99a1f" };
  const colorOf = (it) => ITEM_COLOR[it.key] || CAT_COLOR[it.cat];

  // ---------------------------------------------------------------- item pictograms (centred at 0,0, unit ~ -1..1)
  function icon(ctx, key, size, color) {
    ctx.save(); ctx.scale(size, size); ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.fillStyle = color; ctx.strokeStyle = color;
    if (key === "자장면") {
      ctx.lineWidth = 0.1; ctx.beginPath(); ctx.arc(0, 0.15, 0.62, 0.08, Math.PI - 0.08); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 0.07;
      for (const dx of [-0.22, 0, 0.22]) { ctx.beginPath(); ctx.moveTo(dx - 0.1, -0.05); ctx.quadraticCurveTo(dx, -0.35, dx + 0.1, -0.55); ctx.stroke(); }
    } else if (key === "배추") {
      ctx.fillStyle = color;
      for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate((i - 1.5) * 0.42); ctx.beginPath(); ctx.ellipse(0, -0.05, 0.3, 0.62, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.ellipse(0, 0, 0.16, 0.32, 0, 0, Math.PI * 2); ctx.fill();
    } else if (key === "고등어") {
      ctx.beginPath(); ctx.ellipse(-0.05, 0, 0.55, 0.32, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0.48, 0); ctx.lineTo(0.85, -0.32); ctx.lineTo(0.85, 0.32); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-0.38, -0.06, 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 0.05;
      for (const dx of [-0.15, 0.05, 0.25]) { ctx.beginPath(); ctx.moveTo(dx, -0.24); ctx.quadraticCurveTo(dx + 0.06, 0, dx, 0.24); ctx.stroke(); }
    } else if (key === "도시가스") {
      ctx.beginPath(); ctx.moveTo(0, -0.62); ctx.bezierCurveTo(0.42, -0.2, 0.34, 0.15, 0.1, 0.3); ctx.bezierCurveTo(0.22, 0.05, 0.05, -0.1, 0, -0.28);
      ctx.bezierCurveTo(-0.05, -0.1, -0.22, 0.05, -0.1, 0.3); ctx.bezierCurveTo(-0.34, 0.15, -0.42, -0.2, 0, -0.62); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.ellipse(0, 0.22, 0.14, 0.2, 0, 0, Math.PI * 2); ctx.fill();
    } else if (key === "전기료") {
      ctx.beginPath(); ctx.moveTo(0.16, -0.62); ctx.lineTo(-0.32, 0.06); ctx.lineTo(-0.02, 0.06); ctx.lineTo(-0.16, 0.62); ctx.lineTo(0.32, -0.1); ctx.lineTo(0.02, -0.1); ctx.closePath(); ctx.fill();
    } else if (key === "TV") {
      ctx.beginPath(); ctx.roundRect(-0.62, -0.42, 1.24, 0.78, 0.06); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillRect(-0.5, -0.3, 1.0, 0.54);
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-0.16, 0.36); ctx.lineTo(-0.3, 0.6); ctx.lineTo(0.3, 0.6); ctx.lineTo(0.16, 0.36); ctx.closePath(); ctx.fill();
    } else if (key === "컴퓨터") {
      ctx.beginPath(); ctx.roundRect(-0.5, -0.58, 1.0, 0.7, 0.05); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillRect(-0.4, -0.48, 0.8, 0.5);
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-0.06, 0.12); ctx.lineTo(-0.06, 0.3); ctx.lineTo(0.06, 0.3); ctx.lineTo(0.06, 0.12); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.roundRect(-0.55, 0.3, 1.1, 0.18, 0.04); ctx.fill();
    } else if (key === "휴대전화기") {
      ctx.beginPath(); ctx.roundRect(-0.32, -0.62, 0.64, 1.24, 0.14); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillRect(-0.24, -0.48, 0.48, 0.92);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0.56, 0.06, 0, Math.PI * 2); ctx.fill();
    } else { // 총지수: a shopping basket
      ctx.lineWidth = 0.09; ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(-0.58, -0.1); ctx.lineTo(-0.4, 0.55); ctx.lineTo(0.4, 0.55); ctx.lineTo(0.58, -0.1); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-0.28, -0.1); ctx.quadraticCurveTo(-0.2, -0.6, 0, -0.6); ctx.quadraticCurveTo(0.2, -0.6, 0.28, -0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-0.28, 0.1); ctx.lineTo(0.28, 0.1); ctx.moveTo(-0.22, 0.3); ctx.lineTo(0.22, 0.3); ctx.stroke();
    }
    ctx.restore();
  }

  function rail(ctx, x, y, w) {
    ctx.fillStyle = RAIL; ctx.fillRect(x, y - 4, w, 8);
    ctx.fillStyle = RAIL_HI; ctx.fillRect(x, y - 4, w, 2.4);
    for (const px of [x + 4, x + w - 4]) { ctx.fillStyle = "#3f4638"; ctx.beginPath(); ctx.arc(px, y, 6, 0, Math.PI * 2); ctx.fill(); }
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `700 12px ${SANS}`;
    let bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22;
    const bh = 12 + lines.length * 18;
    const bx = KF.clamp(x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(34,50,28,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || "#f3f6ec"; ctx.font = `${i ? 500 : 700} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 18 + i * 18); });
  }

  const fmtX = (r) => { const s = r.toFixed(2).replace(/0$/, "").replace(/\.$/, ""); return `${s}배`; };

  // ---------------------------------------------------------------- layout: log-scaled hanger length
  function layout(items, railY, floorY) {
    const maxDrop = floorY - railY - 40;
    const logs = items.map((it) => Math.log2(Math.max(0.02, it.ratio)));
    const maxAbsLog = Math.max(2.4, ...logs.map(Math.abs));
    return items.map((it, i) => {
      const lg = Math.log2(Math.max(0.02, it.ratio));
      const drop = KF.clamp((lg / maxAbsLog) * maxDrop * 0.86 + maxDrop * 0.1, 26, maxDrop);
      const iconSize = KF.clamp(0.55 + Math.abs(lg) * 0.16, 0.5, 1.5);
      return { ...it, drop, iconSize };
    });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const railY = h * 0.22, floorY = h * 0.94;
    rail(ctx, w * 0.06, railY, w * 0.88);
    const keys = ["자장면", "휴대전화기", "TV", "배추"];
    const items = layout(d.items.filter((it) => keys.includes(it.key)), railY, floorY);
    const c = t % 10, u = KF.ease(KF.clamp((c - 0.4) / 2.2, 0, 1));
    const gap = w / (items.length + 1);
    items.forEach((it, i) => {
      const cx = gap * (i + 1), y = railY + it.drop * u + it.iconSize * 26 * u;
      ctx.strokeStyle = "rgba(34,50,28,.5)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx, railY + 3); ctx.lineTo(cx, y - it.iconSize * 24); ctx.stroke();
      ctx.save(); ctx.translate(cx, y); icon(ctx, it.key, 28 * it.iconSize * (0.3 + 0.7 * u), colorOf(it)); ctx.restore();
      ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.font = `700 ${Math.round(h * 0.05)}px ${MONO}`;
      ctx.globalAlpha = u; ctx.fillText(fmtX(it.ratio), cx, y + it.iconSize * 30 + 16); ctx.globalAlpha = 1;
    });
    // top-left is reserved for the board's "데이터 N개" badge (~90x36px); the rail sits just under it
    // (railY=h*0.22), so the label goes below the rail rather than squeezed into the gap above it
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.08)}px ${SANS}`;
    ctx.fillText("30년 물가표", w * 0.05, h * 0.32);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let span = "30", hover = null, tSpan = performance.now() - 3000;
    KF.segment(controls, [{ id: "30", label: `${d.y0}→${d.y1} · 30년` }, { id: "50", label: `${d.long.y0}→${d.y1} · 50년(5개 품목)` }], span, (id) => { span = id; tSpan = performance.now(); });

    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const railY = h * (full ? 0.2 : 0.16), floorY = h * (full ? 0.9 : 0.86);
      const pad = full ? 46 : 16;
      rail(ctx, pad, railY, w - pad * 2);

      const source = span === "30" ? d.items : d.long.items.map((x) => ({ ...d.items.find((it) => it.key === x.key), ...x }));
      const items = layout(source, railY, floorY);
      const u = KF.ease(KF.clamp((performance.now() - tSpan) / 700, 0, 1));
      const gap = (w - pad * 2) / (items.length + 1);

      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
      ctx.fillText(`가격표 행거 · ${span === "30" ? `${d.y0}→${d.y1}` : `${d.long.y0}→${d.y1}`}`, pad, full ? 34 : 22);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11.5 : 10}px ${SANS}`;
      ctx.fillText(`걸이 길이·크기 = ${d.y0}년(품목마다 자기 자신) 대비 지수 변화 · 점선 = 소비자물가 총지수`, pad, full ? 52 : 36);

      // headline reference (dashed line at the total index's own drop)
      const totalItem = items.find((it) => it.cat === "total");
      if (totalItem) {
        const ty = railY + totalItem.drop;
        ctx.strokeStyle = "rgba(34,50,28,.55)"; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(pad, ty); ctx.lineTo(w - pad, ty); ctx.stroke(); ctx.setLineDash([]);
        ctx.textAlign = "right"; ctx.fillStyle = DIM; ctx.font = `500 10px ${MONO}`;
        ctx.fillText(`총지수 ${fmtX(totalItem.ratio)}`, w - pad, ty - 6);
      }

      let hit = null;
      items.forEach((it, i) => {
        const cx = pad + gap * (i + 1);
        const y = railY + it.drop * u;
        const size = it.iconSize * (full ? 30 : 20) * (0.4 + 0.6 * u);
        ctx.strokeStyle = "rgba(34,50,28,.55)"; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(cx, railY + 3); ctx.lineTo(cx, y - size * 0.9); ctx.stroke();
        const hi = hover && Math.hypot(hover[0] - cx, hover[1] - y) < size + 16;
        if (hi) { ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, y, size + 10, 0, Math.PI * 2); ctx.stroke(); }
        ctx.save(); ctx.translate(cx, y); icon(ctx, it.key, size, colorOf(it)); ctx.restore();
        if (hi) hit = it;
        ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `800 ${full ? 14 : 10}px ${MONO}`;
        // narrow mode: neighbouring hangers can sit at nearly the same depth, so stagger every other label
        const stagger = !full && i % 2 === 1 ? 15 : 0;
        ctx.fillText(fmtX(it.ratio), cx, y + size + (full ? 22 : 16) + stagger);
        if (full) { ctx.font = `500 10.5px ${SANS}`; ctx.fillStyle = DIM; ctx.fillText(it.label.replace("(외식)", ""), cx, y + size + 38); }
      });

      if (!full) {
        ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`;
        ctx.fillText("품목에 손을 올리면 지수를 확인할 수 있다", pad, h - 14);
      }
      if (hit) {
        const cx = pad + gap * (items.indexOf(hit) + 1), y = railY + hit.drop * u;
        const y0 = span === "30" ? d.y0 : d.long.y0;
        tip(ctx, w, h, cx, y - hit.iconSize * 30, [[hit.label, "#f3f6ec"],
          [`${y0}년 지수 ${hit.v0.toFixed(1)}`], [`${d.y1}년 지수 ${hit.v1.toFixed(1)}`],
          [`${fmtX(hit.ratio)} (${hit.ratio >= 1 ? "올랐다" : "떨어졌다"})`]]);
      }
    });
  }

  VIZ["cpi-items"] = { thumb, mount, bg: BG };
})();
