// 03 regions — "Land map vs people map". Survey-map paper. Every 시군구 becomes a square:
// sized by land it is 59% terracotta; sized by people the same 89 places shrink to 9%.
(() => {
  const PAPER = "#e8eadc", INKLINE = "rgba(60,70,50,.35)", TERRA = "#c55a32", PALE = "#e7b49c", SAGE = "#9aa58c";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  let prepared = null;

  // Push overlapping squares apart (positions in 0..1000 map units).
  function relax(units, sizeKey) {
    const P = units.map((u) => ({ x: u.cx, y: u.cy, s: u[sizeKey] / 2 }));
    for (let it = 0; it < 160; it++) {
      let moved = 0;
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
        const a = P[i], b = P[j], dx = b.x - a.x, dy = b.y - a.y;
        const ox = a.s + b.s + 0.6 - Math.abs(dx), oy = a.s + b.s + 0.6 - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          moved++;
          if (ox < oy) { const m = (ox / 2) * Math.sign(dx || 1); a.x -= m; b.x += m; }
          else { const m = (oy / 2) * Math.sign(dy || 1); a.y -= m; b.y += m; }
        }
      }
      for (let i = 0; i < P.length; i++) { // gentle pull back home, stay inside the frame
        P[i].x += (units[i].cx - P[i].x) * 0.02; P[i].y += (units[i].cy - P[i].y) * 0.02;
        P[i].x = KF.clamp(P[i].x, P[i].s + 4, 1000 - P[i].s - 4); P[i].y = KF.clamp(P[i].y, P[i].s + 4, 1000 - P[i].s - 4);
      }
      if (!moved) break;
    }
    return P;
  }

  function prepare(d) {
    if (prepared) return prepared;
    const units = d.units.map((u) => ({ ...u, path: new Path2D(u.d) }));
    const INK = 0.26 * 1000 * 1000; // same total ink for both views, so shares compare directly
    const ka = Math.sqrt(INK / units.reduce((a, u) => a + u.area, 0));
    const kp = Math.sqrt(INK / units.reduce((a, u) => a + u.pop, 0));
    units.forEach((u) => { u.sa = ka * Math.sqrt(u.area); u.sp = kp * Math.sqrt(u.pop); });
    const A = relax(units, "sa"), Pp = relax(units, "sp");
    units.forEach((u, i) => { u.ax = A[i].x; u.ay = A[i].y; u.px = Pp[i].x; u.py = Pp[i].y; });
    return (prepared = units);
  }

  function colorOf(u, mode) {
    if (mode === "type") return u.type === "감소" ? TERRA : u.type === "관심" ? PALE : SAGE;
    const ch = mode === "pop" ? (u.pop_old ? u.pop / u.pop_old - 1 : 0) : (u.b23 ? u.b25 / u.b23 - 1 : 0);
    const k = KF.clamp(ch / (mode === "pop" ? 0.08 : 0.3), -1, 1);
    return k < 0 ? `rgba(197,90,50,${0.25 + 0.75 * -k})` : `rgba(40,110,120,${0.25 + 0.75 * k})`;
  }

  function paper(ctx, w, h, full) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(90,110,70,.08)"; ctx.lineWidth = 1;
    const step = full ? 22 : 14;
    for (let r = step; r < Math.max(w, h) * 1.2; r += step) { // faint contour rings
      ctx.beginPath(); ctx.ellipse(w * 0.78, h * 0.2, r * 1.3, r, 0.3, 0, 7); ctx.stroke();
    }
  }

  function draw(ctx, w, h, d, m, mode, full, hover) {
    const units = prepare(d);
    paper(ctx, w, h, full);
    const box = full ? Math.min(w * 0.62, h - 40) : Math.min(w, h) - 8;
    const ox = full ? 30 + (w * 0.62 - box) / 2 : (w - box) / 2, oy = (h - box) / 2;
    const sc = box / 1000;
    const tf = (x, y) => [ox + x * sc, oy + y * sc];
    // m: 0 map polygons, 1 land squares, 2 people squares
    const polyA = KF.clamp(1 - m, 0, 1);
    if (polyA > 0) {
      ctx.save(); ctx.translate(ox, oy); ctx.scale(sc, sc);
      ctx.globalAlpha = polyA; ctx.lineWidth = 0.6 / sc; ctx.strokeStyle = INKLINE;
      for (const u of units) { ctx.fillStyle = colorOf(u, mode); ctx.fill(u.path); ctx.stroke(u.path); }
      ctx.restore();
    }
    let hit = null;
    if (m > 0) {
      const sq = KF.clamp(m, 0, 1), pp = KF.ease(KF.clamp(m - 1, 0, 1));
      for (const u of units) {
        const s = KF.lerp(u.sa, u.sp, pp) * sc * KF.ease(sq);
        const [x, y] = tf(KF.lerp(u.ax, u.px, pp), KF.lerp(u.ay, u.py, pp));
        ctx.globalAlpha = 0.25 + 0.75 * sq;
        ctx.fillStyle = colorOf(u, mode); ctx.fillRect(x - s / 2, y - s / 2, s, s);
        ctx.strokeStyle = "rgba(40,45,30,.35)"; ctx.lineWidth = 0.6; ctx.strokeRect(x - s / 2, y - s / 2, s, s);
        if (hover && Math.abs(hover[0] - x) < s / 2 && Math.abs(hover[1] - y) < s / 2) hit = { u, x, y, s };
      }
      ctx.globalAlpha = 1;
    } else if (hover) {
      // isPointInPath takes device pixels and applies the current transform to the path
      const dpr = ctx.getTransform().a;
      ctx.save(); ctx.translate(ox, oy); ctx.scale(sc, sc);
      for (const u of units) if (ctx.isPointInPath(u.path, hover[0] * dpr, hover[1] * dpr)) hit = { u };
      ctx.restore();
    }
    if (full) legend(ctx, w, h, d, m, mode);
    if (hit && full) {
      const u = hit.u, ch = u.pop_old ? ((u.pop / u.pop_old - 1) * 100).toFixed(1) : "–";
      const lines = [`${u.sido} ${u.name}${u.type ? ` · 인구${u.type}지역` : ""}`, `땅 ${KF.fmt(u.area)}㎢`,
        `사람 ${KF.fmt(u.pop)}명 (22.10 대비 ${ch}%)`, `출생 2023 ${KF.fmt(u.b23)} → 2025 ${KF.fmt(u.b25)}`];
      const bx = Math.min((hover[0] + 14), w - 250), by = Math.max(hover[1] - 90, 10);
      ctx.fillStyle = "rgba(250,250,242,.96)"; ctx.fillRect(bx, by, 236, 82);
      ctx.strokeStyle = "rgba(40,45,30,.5)"; ctx.strokeRect(bx + .5, by + .5, 236, 82);
      lines.forEach((t, i) => {
        ctx.fillStyle = i ? "#3a4030" : "#1b1f14"; ctx.font = i ? `500 11px ${MONO}` : `600 13px ${SANS}`; ctx.textAlign = "left";
        ctx.fillText(t, bx + 10, by + 20 + i * 19);
      });
    }
  }

  function legend(ctx, w, h, d, m, mode) {
    const s = d.summary, x = w * 0.66, share = m >= 1.5 ? s.pop_share : s.land_share;
    ctx.textAlign = "left"; ctx.fillStyle = "#1b1f14";
    ctx.font = `600 12px ${MONO}`;
    ctx.fillText(m >= 1.5 ? "사람의 지도 · 1칸 넓이 = 인구" : m >= 0.5 ? "땅의 지도 · 1칸 넓이 = 면적" : "지도 · 시군구 경계", x, 44);
    if (mode === "type") {
      ctx.fillStyle = TERRA; ctx.font = `700 ${Math.min(96, w * 0.08)}px ${SANS}`;
      ctx.fillText(`${Math.round(share * 100)}%`, x - 4, 44 + Math.min(96, w * 0.08) + 12);
      ctx.fillStyle = "#1b1f14"; ctx.font = `500 14px ${SANS}`;
      ctx.fillText(m >= 1.5 ? "인구감소지역 89곳에 사는 사람의 몫" : "인구감소지역 89곳이 차지한 땅의 몫", x, 44 + Math.min(96, w * 0.08) + 40);
      [[TERRA, "인구감소지역 89"], [PALE, "인구감소 관심지역 18"], [SAGE, "그 밖의 시군구"]].forEach(([c, t], i) => {
        ctx.fillStyle = c; ctx.fillRect(x, h - 110 + i * 22, 12, 12);
        ctx.fillStyle = "#1b1f14"; ctx.font = `500 12px ${SANS}`; ctx.fillText(t, x + 20, h - 100 + i * 22);
      });
    } else {
      const t = mode === "pop" ? "주민등록 인구 2022.10 → 2026.8" : "출생등록 2023 → 2025";
      ctx.fillStyle = "#1b1f14"; ctx.font = `500 14px ${SANS}`; ctx.fillText(t, x, 70);
      [["rgba(197,90,50,1)", "줄었다"], ["rgba(197,90,50,.35)", "조금 줄었다"], ["rgba(40,110,120,.35)", "조금 늘었다"], ["rgba(40,110,120,1)", "늘었다"]]
        .forEach(([c, l], i) => { ctx.fillStyle = c; ctx.fillRect(x, 88 + i * 22, 12, 12); ctx.fillStyle = "#1b1f14"; ctx.font = `500 12px ${SANS}`; ctx.fillText(l, x + 20, 98 + i * 22); });
    }
  }

  function thumb(ctx, w, h, t, d) {
    const c = t % 10;
    const m = c < 2 ? 0 : c < 3.5 ? (c - 2) / 1.5 : c < 4.5 ? 1 : c < 6.5 ? 1 + (c - 4.5) / 2 : c < 8.5 ? 2 : 2 - (c - 8.5) * 1.33;
    draw(ctx, w, h, d, Math.max(0, m), "type", false);
    ctx.fillStyle = "#1b1f14"; ctx.font = `700 ${Math.round(h * 0.13)}px ${SANS}`; ctx.textAlign = "right";
    const share = m >= 1.5 ? d.summary.pop_share : d.summary.land_share;
    ctx.fillStyle = TERRA; ctx.fillText(`${Math.round(share * 100)}%`, w - 16, h - 18);
    ctx.fillStyle = "#1b1f14"; ctx.font = `500 ${Math.round(h * 0.055)}px ${SANS}`;
    ctx.fillText(m >= 1.5 ? "사람" : "땅", w - 16, h - 18 - h * 0.14);
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let target = 0, m = 0, mode = "type", hover = null;
    KF.segment(controls, [{ id: 0, label: "지도" }, { id: 1, label: "땅 크기로" }, { id: 2, label: "사람 수로" }], 0, (id) => { target = id; });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "  색:"; controls.appendChild(sep);
    KF.segment(controls, [{ id: "type", label: "인구감소지역" }, { id: "pop", label: "인구 변화" }, { id: "births", label: "출생 변화" }], "type", (id) => { mode = id; });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    KF.loop(stage, () => {
      m += (target - m) * 0.06; if (Math.abs(target - m) < 0.001) m = target;
      draw(s.ctx, s.w, s.h, d, m, mode, s.w > 520, hover);
      if (s.w <= 520 && mode === "type") { // phones: no side legend, so put the share on the map
        const ctx = s.ctx, share = m >= 1.5 ? d.summary.pop_share : d.summary.land_share;
        ctx.textAlign = "right"; ctx.fillStyle = TERRA; ctx.font = `700 ${Math.round(s.w * 0.16)}px ${SANS}`;
        ctx.fillText(`${Math.round(share * 100)}%`, s.w - 14, s.h - 18);
        ctx.fillStyle = "#1b1f14"; ctx.font = `500 13px ${SANS}`;
        ctx.fillText(m >= 1.5 ? "89곳에 사는 사람의 몫" : "89곳이 차지한 땅의 몫", s.w - 14, s.h - 18 - s.w * 0.17);
      }
    });
  }

  VIZ.regions = { thumb, mount, bg: PAPER };
})();
