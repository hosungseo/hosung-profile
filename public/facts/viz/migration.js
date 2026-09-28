// 37 migration — "철새 떼". Flocks of small birds fly between the 17 시도 along arcs: one flock per pair of regions,
// flying the way more people moved (net), one bird = N people, colour = age group. Other views: net moves into the
// capital region by 5-year age band, and Seoul's exchange with 경기·인천 vs the rest of the country.
(() => {
  const BG = "#ecdcd3";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#2b2530", DIM = "rgba(43,37,48,.62)", FAINT = "rgba(43,37,48,.12)";
  const GC = ["#5d8a3a", "#1f5f8b", "#6b3d93", "#a4502c", "#6d6358"], ALLC = "#2e2733";
  const LAND = "#e3cabd", CAPL = "#dcbfae", EDGE = "rgba(120,90,80,.45)";

  // ---------------------------------------------------------------- data
  const CACHE = new WeakMap();
  function prep(d) {
    if (CACHE.has(d)) return CACHE.get(d);
    const n = d.sido.length, G = d.groups.length;
    const F = Array.from({ length: n }, () => Array.from({ length: n }, () => new Float64Array(G)));
    for (const r of d.flows) for (let j = 0; j < G; j++) F[r[0]][r[1]][j] = r[2 + j];
    const rings = {};
    for (const s of d.sido) rings[s] = d.outline[s].map((str) => {
      const a = str.split(",").map(Number), pts = [[a[0], a[1]]];
      for (let i = 2; i < a.length; i += 2) pts.push([pts[pts.length - 1][0] + a[i], pts[pts.length - 1][1] + a[i + 1]]);
      return pts;
    });
    const X = { n, G, F, rings };
    CACHE.set(d, X);
    return X;
  }
  const val = (X, a, b, gi) => (gi < 0 ? X.F[a][b].reduce((p, q) => p + q, 0) : X.F[a][b][gi]);
  function netPairs(X, gi) {
    const out = [];
    for (let a = 0; a < X.n; a++) for (let b = a + 1; b < X.n; b++) {
      const v = val(X, a, b, gi) - val(X, b, a, gi);
      if (v !== 0) out.push(v > 0 ? [a, b, v] : [b, a, -v]);
    }
    return out.sort((p, q) => q[2] - p[2]);
  }
  function sidoNet(X, i, gi) { let inn = 0, out = 0; for (let j = 0; j < X.n; j++) if (j !== i) { inn += val(X, j, i, gi); out += val(X, i, j, gi); } return [inn, out]; }

  // ---------------------------------------------------------------- bird
  function bird(ctx, x, y, s, a, flap, col) { // seen from above-behind: a body along the heading, wings flapping sideways
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const span = s * (0.75 + 0.35 * flap), back = s * (0.15 + 0.35 * (1 - flap));
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1, s * 0.26); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-back, -span); ctx.quadraticCurveTo(s * 0.25, -span * 0.3, 0, 0); ctx.quadraticCurveTo(s * 0.25, span * 0.3, -back, span); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- the map
  function mapGeom(d, x0, y0, W, H) {
    const sc = Math.min(W / d.box[0], H / d.box[1]), ox = x0 + (W - d.box[0] * sc) / 2, oy = y0 + (H - d.box[1] * sc) / 2;
    return { sc, ox, oy, p: (x, y) => [ox + x * sc, oy + y * sc] };
  }
  function drawMap(ctx, d, X, M, full, hoverSido) {
    d.sido.forEach((s, i) => {
      ctx.beginPath();
      for (const ring of X.rings[s]) ring.forEach(([x, y], k) => { const [px, py] = M.p(x, y); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      ctx.fillStyle = hoverSido === i ? "#d6b4a2" : d.cap.includes(s) ? CAPL : LAND; ctx.fill("evenodd");
      ctx.strokeStyle = EDGE; ctx.lineWidth = 0.8; ctx.stroke();
    });
  }
  const LOFF = { 서울: [-6, -10, "right"], 인천: [-9, 4, "right"], 경기: [10, 17, "left"], 세종: [-8, 4, "right"], 대전: [8, 13, "left"],
    충남: [-8, 4, "right"], 충북: [9, -5, "left"], 강원: [0, -9, "center"], 경북: [0, -9, "center"], 대구: [-8, 4, "right"], 울산: [8, 4, "left"],
    부산: [8, 6, "left"], 경남: [0, 14, "center"], 전북: [0, -9, "center"], 광주: [-8, 4, "right"], 전남: [0, 15, "center"], 제주: [0, -10, "center"] };
  function labels(ctx, d, M, full) {
    d.sido.forEach((s) => {
      const [x, y] = M.p(...d.nodes[s]), [dx, dy, al] = LOFF[s] || [0, -8, "center"];
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, full ? 3 : 2.2, 0, 7); ctx.fill();
      if (!full && s === "세종") return;                    // too close to 충남·대전 on a phone; the dot and the tooltip stay
      ctx.font = `700 ${full ? 11.5 : 9.5}px ${SANS}`; ctx.textAlign = al;
      ctx.lineWidth = 3; ctx.strokeStyle = "rgba(236,220,211,.85)"; ctx.strokeText(s, x + dx, y + dy);
      ctx.fillStyle = INK; ctx.fillText(s, x + dx, y + dy);
    });
  }
  function arc(M, a, b, d) {
    const [x1, y1] = M.p(...d.nodes[d.sido[a]]), [x2, y2] = M.p(...d.nodes[d.sido[b]]);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    const k = Math.min(0.28, 18 / Math.max(L, 1) + 0.12), cx = mx - dy * k, cy = my + dx * k;
    return { x1, y1, x2, y2, cx, cy, L };
  }
  const at = (A, t) => { const u = 1 - t; return [u * u * A.x1 + 2 * u * t * A.cx + t * t * A.x2, u * u * A.y1 + 2 * u * t * A.cy + t * t * A.y2]; };
  const dir = (A, t) => Math.atan2(2 * (1 - t) * (A.cy - A.y1) + 2 * t * (A.y2 - A.cy), 2 * (1 - t) * (A.cx - A.x1) + 2 * t * (A.x2 - A.cx));

  function flocks(ctx, d, X, M, gi, time, el, full, hover) {
    const pairs = netPairs(X, gi), top = pairs.slice(0, full ? 26 : 18), mx = top[0][2];
    const per = [10, 20, 50, 100, 200, 250, 500, 1000, 2000, 5000].find((u) => mx / u <= (full ? 34 : 26)) || 5000;
    const col = gi < 0 ? ALLC : GC[gi], grow = KF.clamp(el / 2.4, 0, 1);
    let hit = null;
    top.forEach(([a, b, v], pi) => {
      const A = arc(M, a, b, d), nb = Math.max(1, Math.round(v / per)), speed = 0.05 + 18 / Math.max(A.L, 40) * 0.02;
      ctx.strokeStyle = gi < 0 ? "rgba(46,39,51,.14)" : col; ctx.globalAlpha = gi < 0 ? 1 : 0.18; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(A.x1, A.y1); ctx.quadraticCurveTo(A.cx, A.cy, A.x2, A.y2); ctx.stroke(); ctx.globalAlpha = 1;
      const shown = Math.ceil(nb * grow);
      for (let i = 0; i < shown; i++) {
        const t = ((i / nb) * 0.9 + time * speed + pi * 0.137) % 1, [x, y] = at(A, t), ang = dir(A, t);
        const jit = ((i * 7919) % 13 - 6) / 6, off = jit * (full ? 5 : 3.5);
        const bx = x - Math.sin(ang) * off, by = y + Math.cos(ang) * off, s = full ? 5.4 : 4;
        const edge = Math.min(t, 1 - t) * 8;                                       // fade in/out at the ends
        ctx.globalAlpha = KF.clamp(edge, 0, 1);
        bird(ctx, bx, by, s, ang, 0.5 + 0.5 * Math.sin(time * 9 + i * 1.7), col);
      }
      ctx.globalAlpha = 1;
      if (hover) { // hit test near the arc's middle
        for (let q = 0.15; q <= 0.85; q += 0.05) { const [x, y] = at(A, q); if (Math.hypot(hover[0] - x, hover[1] - y) < 8) { hit = { a, b, v }; break; } }
      }
    });
    return { per, hit };
  }

  // ---------------------------------------------------------------- age bars (net into the capital region / Seoul)
  function bars(ctx, d, x0, y0, W, H, series, full, hover, gi, title, sub) {
    const n = d.bands.length, bw = W / n, all = series.flatMap((s) => s.v);
    const pos = Math.max(1, ...all), neg = Math.max(1, ...all.map((v) => -v)), unit = (H - 24) / (pos + neg), zero = y0 + 12 + pos * unit;
    const py = (v) => zero - v * unit;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 14 : 12}px ${SANS}`; ctx.fillText(title, x0, y0 - 22);
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`; ctx.fillText(sub, x0, y0 - 7);
    ctx.strokeStyle = "rgba(43,37,48,.4)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, zero); ctx.lineTo(x0 + W, zero); ctx.stroke();
    const gOf = (i) => (i < 3 ? 0 : i < 6 ? 1 : i < 9 ? 2 : i < 13 ? 3 : 4);
    let hit = null;
    series.forEach((s, si) => {
      const sw = (bw * 0.78) / series.length;
      s.v.forEach((v, i) => {
        const x = x0 + i * bw + bw * 0.11 + si * sw, y = py(v), g = gOf(i);
        ctx.fillStyle = s.col || GC[g]; ctx.globalAlpha = gi < 0 || gi === g ? 0.92 : 0.3;
        ctx.fillRect(x, Math.min(y, zero), sw - 1, Math.abs(zero - y)); ctx.globalAlpha = 1;
        if (hover && hover[0] >= x0 + i * bw && hover[0] < x0 + (i + 1) * bw && hover[1] > y0 && hover[1] < y0 + H) hit = { i };
      });
    });
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 9.5 : 8.5}px ${MONO}`; ctx.textAlign = "center";
    d.bands.forEach((b, i) => { if (i % (full ? 2 : 3) === 0) ctx.fillText(b.split("–")[0], x0 + (i + 0.5) * bw, y0 + H + 12); });
    ctx.textAlign = "left"; ctx.font = `600 ${full ? 10.5 : 9}px ${SANS}`; ctx.fillStyle = "#1f5f3b"; ctx.fillText(series[0].up, x0 + 2, y0 + 10);
    ctx.fillStyle = "#9b3322"; ctx.fillText(series[0].down, x0 + 2, y0 + H - 4);
    return { hit, bw };
  }

  // ---------------------------------------------------------------- tooltip
  function tip(ctx, w, h, lines, p) {
    const width = (t, k) => { ctx.font = `${k === 1 ? 700 : 500} ${k === 1 ? 13 : 12}px ${SANS}`; return ctx.measureText(t).width; };
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => width(t, k))) + 22), bh = 12 + lines.length * 19;
    const bx = KF.clamp(p[0] + 16 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 16, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(252,247,243,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(43,37,48,.5)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, k, c], j) => { ctx.fillStyle = c || (k === 1 ? INK : DIM); ctx.font = `${k === 1 ? 700 : 500} ${k === 1 ? 13 : 12}px ${SANS}`; ctx.fillText(t, bx + 11, by + 22 + j * 19); });
  }
  const sgn = (v) => `${v >= 0 ? "+" : "−"}${KF.fmt(Math.abs(Math.round(v)))}`;

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const X = prep(d), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const M = mapGeom(d, w * 0.12, h * 0.04, w * 0.5, h * 0.92);
    drawMap(ctx, d, X, M, false, -1);
    flocks(ctx, d, X, M, 1, t, c + 2, false, null);
    const tx = w * 0.64;
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText("15–29세 순이동", tx, h * 0.24);
    const inCap = d.inCap.slice(3, 6).reduce((a, b) => a + b, 0), outCap = d.outCap.slice(3, 6).reduce((a, b) => a + b, 0);
    ctx.fillStyle = GC[1]; ctx.font = `800 ${Math.round(h * 0.11)}px ${SANS}`; ctx.fillText(`수도권 +${Math.round((inCap - outCap) / 1000)}천`, tx, h * 0.24 + h * 0.12);
    const s30 = d.netSeoul.경인.slice(6, 9).reduce((a, b) => a + b, 0);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText("서울 → 경기·인천 30–44세", tx, h * 0.62);
    ctx.fillStyle = GC[2]; ctx.font = `800 ${Math.round(h * 0.11)}px ${SANS}`; ctx.fillText(`−${Math.round(-s30 / 1000)}천`, tx, h * 0.62 + h * 0.12);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = prep(d), s = KF.canvas(stage), t0 = performance.now();
    let view = "map", gi = 1, tg = performance.now(), hover = null;
    KF.segment(controls, [{ id: "map", label: "철새 지도" }, { id: "cap", label: "수도권 · 나이" }, { id: "seoul", label: "서울 · 나이" }], "map", (id) => { view = id; tg = performance.now(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "  나이:"; controls.appendChild(sep);
    KF.segment(controls, [{ id: -1, label: "모두" }, ...d.groups.map((g, i) => ({ id: i, label: g[1] }))], 1, (id) => { gi = id; tg = performance.now(); });
    const at2 = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = at2(e); });
    stage.addEventListener("pointerdown", (e) => { hover = at2(e); });
    stage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hover = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), time = KF.reduced ? 3 : (now - t0) / 1000, el = KF.reduced ? 99 : (now - tg) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "rgba(214,205,228,.55)"); sky.addColorStop(1, "rgba(244,214,190,.35)");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      const gname = gi < 0 ? "모든 나이" : d.groups[gi][1];
      if (view === "map") {
        const M = full ? mapGeom(d, 10, 10, w * 0.56, h - 20) : mapGeom(d, 6, 46, w - 12, h * 0.72);
        // hovered sido (point in polygon via the canvas path)
        let hs = -1;
        if (hover) {
          const dpr = ctx.getTransform().a;
          d.sido.forEach((sn, i) => {
            ctx.beginPath();
            for (const ring of X.rings[sn]) ring.forEach(([x, y], k) => { const [px, py] = M.p(x, y); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
            if (ctx.isPointInPath(hover[0] * dpr, hover[1] * dpr, "evenodd")) hs = i;
          });
        }
        drawMap(ctx, d, X, M, full, hs);
        const r = flocks(ctx, d, X, M, gi, time, el, full, hover);
        labels(ctx, d, M, full);
        // header / legend
        if (full) {
          const x = w * 0.6;
          ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 20px ${SERIF}`; ctx.fillText(`철새 떼 · 2025년 시도 사이 이동`, x, 40);
          ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText(`새 1마리 = 순이동 ${KF.fmt(r.per)}명 · 많이 간 쪽으로 난다 · 큰 흐름 26개`, x, 60);
          bird(ctx, x + 8, 84, 7, 0, 0.6, gi < 0 ? ALLC : GC[gi]);
          ctx.fillStyle = gi < 0 ? ALLC : GC[gi]; ctx.font = `700 14px ${SANS}`; ctx.fillText(gname, x + 22, 89);
          const cap = d.cap.map((c) => d.sido.indexOf(c));
          let inn = 0, out = 0;
          for (let a = 0; a < X.n; a++) for (let b = 0; b < X.n; b++) {
            if (a === b || cap.includes(a) === cap.includes(b)) continue;
            if (cap.includes(b)) inn += val(X, a, b, gi); else out += val(X, a, b, gi);
          }
          ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("비수도권 → 수도권", x, 124); ctx.fillText("수도권 → 비수도권", x + 150, 124);
          ctx.fillStyle = INK; ctx.font = `800 22px ${SANS}`; ctx.fillText(KF.fmt(inn), x, 150); ctx.fillText(KF.fmt(out), x + 150, 150);
          ctx.fillStyle = inn >= out ? "#1f5f3b" : "#9b3322"; ctx.font = `700 13px ${SANS}`;
          ctx.fillText(`수도권 순이동 ${sgn(inn - out)}명 · 거꾸로 간 사람은 10명당 ${(out / inn * 10).toFixed(1)}명`, x, 172);
          const seriesCap = [{ v: d.netCap, up: "수도권으로 ↑", down: "비수도권으로 ↓" }];
          const b = bars(ctx, d, x, 232, w - x - 26, h - 232 - 42, seriesCap, full, hover, gi, "나이별 수도권 순이동 (5세 단위)", "막대 위 = 수도권으로 더 많이, 아래 = 비수도권으로 더 많이");
          if (b.hit && hover) tip(ctx, w, h, [[`${d.bands[b.hit.i]}세`, 1], [`비수도권 → 수도권 ${KF.fmt(d.inCap[b.hit.i])}명`, 0], [`수도권 → 비수도권 ${KF.fmt(d.outCap[b.hit.i])}명`, 0], [`순이동 ${sgn(d.netCap[b.hit.i])}명`, 0, INK]], hover);
        } else {
          ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 15px ${SERIF}`; ctx.fillText("철새 떼 · 2025년", 12, 24);
          ctx.fillStyle = gi < 0 ? ALLC : GC[gi]; ctx.font = `700 12px ${SANS}`; ctx.fillText(gname, 132, 24);
          ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`; ctx.fillText(`새 1마리 = 순이동 ${KF.fmt(r.per)}명 · 많이 간 쪽으로 난다`, 12, 40);
          const cap = d.cap.map((c) => d.sido.indexOf(c));
          let inn = 0, out = 0;
          for (let a = 0; a < X.n; a++) for (let b = 0; b < X.n; b++) {
            if (a === b || cap.includes(a) === cap.includes(b)) continue;
            if (cap.includes(b)) inn += val(X, a, b, gi); else out += val(X, a, b, gi);
          }
          ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.fillText("비수도권 → 수도권  /  수도권 → 비수도권", 12, h - 46);
          ctx.fillStyle = INK; ctx.font = `800 17px ${SANS}`; ctx.fillText(`${KF.fmt(inn)} / ${KF.fmt(out)}`, 12, h - 26);
          ctx.fillStyle = inn >= out ? "#1f5f3b" : "#9b3322"; ctx.font = `700 11px ${SANS}`; ctx.fillText(`수도권 순이동 ${sgn(inn - out)}명`, 12, h - 9);
        }
        if (r.hit && hover) {
          const { a, b, v } = r.hit, ab = val(X, a, b, gi), ba = val(X, b, a, gi);
          tip(ctx, w, h, [[`${d.sido[a]} → ${d.sido[b]} · ${gname}`, 1], [`${d.sido[a]} → ${d.sido[b]} ${KF.fmt(ab)}명`, 0], [`${d.sido[b]} → ${d.sido[a]} ${KF.fmt(ba)}명`, 0], [`순이동 ${KF.fmt(v)}명`, 0, INK]], hover);
        } else if (hs >= 0 && hover && (!full || hover[0] < w * 0.58)) {
          const [inn, out] = sidoNet(X, hs, gi), pop = d.pop[d.sido[hs]];
          tip(ctx, w, h, [[`${d.sido[hs]} · ${gname}`, 1], [`다른 시도에서 들어옴 ${KF.fmt(inn)}명`, 0], [`다른 시도로 나감 ${KF.fmt(out)}명`, 0],
            [`순이동 ${sgn(inn - out)}명 · 인구 1천 명당 ${((inn - out) / pop * 1000).toFixed(1)}`, 0, INK]], hover);
        }
      } else {
        const seoul = view === "seoul", x0 = full ? 70 : 34, W = full ? w * 0.6 : w - 50, y0 = full ? 110 : 96, H = full ? h - y0 - 50 : h * 0.62;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
        ctx.fillText(seoul ? "서울은 누구를 얻고 누구를 내주나" : "수도권은 누구를 얻고 누구를 내주나", full ? 24 : 12, full ? 40 : 26);
        const series = seoul
          ? [{ v: d.netSeoul.지방, col: "#1f5f8b", up: "서울로 ↑", down: "서울에서 ↓" }, { v: d.netSeoul.경인, col: "#b0573a", up: "서울로 ↑", down: "서울에서 ↓" }]
          : [{ v: d.netCap, up: "수도권으로 ↑", down: "비수도권으로 ↓" }];
        const b = bars(ctx, d, x0, y0, W, H, series, full, hover, seoul ? -1 : gi, seoul ? "서울의 순이동, 나이별 (5세 단위)" : "수도권(서울·인천·경기)의 순이동, 나이별",
          seoul ? "파랑 = 비수도권과 주고받은 결과 · 주황 = 경기·인천과 주고받은 결과" : "막대 색 = 나이 무리");
        if (full) {
          const x = w * 0.7, sum = (arr, a, z) => arr.slice(a, z).reduce((p, q) => p + q, 0);
          ctx.textAlign = "left";
          if (seoul) {
            ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("비수도권과 · 15–29세", x, 130);
            ctx.fillStyle = "#1f5f8b"; ctx.font = `800 28px ${SANS}`; ctx.fillText(sgn(sum(d.netSeoul.지방, 3, 6)), x, 162);
            ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("경기·인천과 · 30–44세", x, 206);
            ctx.fillStyle = "#b0573a"; ctx.font = `800 28px ${SANS}`; ctx.fillText(sgn(sum(d.netSeoul.경인, 6, 9)), x, 238);
            ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("모든 나이 합계", x, 282);
            ctx.fillStyle = INK; ctx.font = `700 15px ${SANS}`; ctx.fillText(`비수도권과 ${sgn(sum(d.netSeoul.지방, 0, 99))} · 경기·인천과 ${sgn(sum(d.netSeoul.경인, 0, 99))}`, x, 304);
          } else {
            const yv = sum(d.netCap, 3, 6), ov = sum(d.netCap, 9, 15);
            ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("15–29세", x, 130);
            ctx.fillStyle = GC[1]; ctx.font = `800 28px ${SANS}`; ctx.fillText(sgn(yv), x, 162);
            ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("45–74세", x, 206);
            ctx.fillStyle = GC[3]; ctx.font = `800 28px ${SANS}`; ctx.fillText(sgn(ov), x, 238);
          }
        }
        if (b.hit && hover) {
          const i = b.hit.i;
          const lines = seoul ? [[`${d.bands[i]}세 · 서울`, 1], [`비수도권과 ${sgn(d.netSeoul.지방[i])}명`, 0, "#1f5f8b"], [`경기·인천과 ${sgn(d.netSeoul.경인[i])}명`, 0, "#b0573a"]]
            : [[`${d.bands[i]}세`, 1], [`비수도권 → 수도권 ${KF.fmt(d.inCap[i])}명`, 0], [`수도권 → 비수도권 ${KF.fmt(d.outCap[i])}명`, 0], [`순이동 ${sgn(d.netCap[i])}명`, 0, INK]];
          tip(ctx, w, h, lines, hover);
        }
      }
    });
  }

  VIZ.migration = { thumb, mount, bg: BG };
})();
