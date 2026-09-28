// 10 noise — "Blueprint section". An apartment drawn as a blueprint section; sound waves spread from the
// neighbours' units into the applicant's home. Toggles redraw the sheet: direction, cause, housing type, build year.
(() => {
  const BG = "#0f2a4a";
  const INK = "rgba(232,243,255,.93)", INK2 = "rgba(170,208,242,.74)", INK3 = "rgba(160,200,238,.34)", INK4 = "rgba(160,200,238,.15)";
  const amb = (a) => `rgba(255,203,105,${a})`;
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  const PER = 50, WIN = 5; // tower modes: one window = 50 applications, five windows per floor
  const MODES = [
    { id: "loc", label: "소리가 온 방향", title: "상세 A · 소리가 온 방향", sub: "신청인이 사는 곳 기준" },
    { id: "cause", label: "원인", title: "상세 B · 무슨 소리였나", sub: "신청인이 고른 주된 원인" },
    { id: "house", label: "집의 형태", title: "상세 C · 주거형태", sub: "창 한 칸 = 신청 50건" },
    { id: "built", label: "준공연도", title: "상세 D · 건물 준공연도", sub: "창 한 칸 = 신청 50건" },
  ];
  const LOC_ROW = ["위층 소리 · 아래층 신청인", "아래층 소리 · 위층 신청인", "옆집 소리", "기타"];
  const BUILT_SHORT = ["~1999", "2000–07", "2008", "2009~", "확인불가"];
  const clamp = KF.clamp, PI = Math.PI;

  // ---------------------------------------------------------------- drawing primitives
  function paper(ctx, w, h, step) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.45, h * 0.45, Math.min(w, h) * 0.1, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
    g.addColorStop(0, "rgba(46,98,158,.22)"); g.addColorStop(1, "rgba(0,8,22,.4)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (let i = 0, x = 0; x < w; i++, x += step) {
      ctx.strokeStyle = i % 5 ? "rgba(140,190,240,.055)" : "rgba(140,190,240,.12)";
      ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, h); ctx.stroke();
    }
    for (let i = 0, y = 0; y < h; i++, y += step) {
      ctx.strokeStyle = i % 5 ? "rgba(140,190,240,.055)" : "rgba(140,190,240,.12)";
      ctx.beginPath(); ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(w, Math.round(y) + 0.5); ctx.stroke();
    }
  }
  // progressive "plotter" strokes: k in 0..1
  function seg(ctx, x1, y1, x2, y2, k) {
    if (k <= 0) return;
    k = Math.min(1, k);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k); ctx.stroke();
  }
  function box(ctx, x, y, w, h, k) {
    if (k <= 0) return;
    let d = 2 * (w + h) * Math.min(1, k), px = x, py = y;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (const [qx, qy] of [[x + w, y], [x + w, y + h], [x, y + h], [x, y]]) {
      const L = Math.hypot(qx - px, qy - py);
      if (d >= L) { ctx.lineTo(qx, qy); d -= L; px = qx; py = qy; } else { ctx.lineTo(px + ((qx - px) * d) / L, py + ((qy - py) * d) / L); break; }
    }
    ctx.stroke();
  }
  function hatch(ctx, x, y, w, h, gap, col, k) {
    if (k <= 0 || w <= 0 || h <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w * Math.min(1, k), h); ctx.clip();
    ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath();
    for (let q = -h; q < w; q += gap) { ctx.moveTo(x + q, y + h); ctx.lineTo(x + q + h, y); }
    ctx.stroke(); ctx.restore();
  }
  const step = (P, i, n, span = 0.5) => clamp((P - (n > 1 ? i / (n - 1) : 0) * (1 - span)) / span, 0, 1);
  function txt(ctx, s, x, y, font, color, align = "left") {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic"; ctx.fillText(s, x, y);
  }
  const pc = (v, t, dgt = 1) => (t > 0 ? `${((v / t) * 100).toFixed(dgt)}%` : "–");
  const fmt = (v) => KF.fmt(Math.round(v));

  // tooltip box near (x, y): first line bold sans, the rest mono
  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `600 12px ${SANS}`; let tw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${MONO}`; for (const l of lines.slice(1)) tw = Math.max(tw, ctx.measureText(l).width);
    const bw = tw + 22, bh = 14 + lines.length * 17;
    let bx = x + 14, by = y - bh - 12;
    if (bx + bw > w - 6) bx = x - bw - 14;
    bx = clamp(bx, 6, w - bw - 6);
    if (by < 6) by = y + 18;
    by = clamp(by, 6, h - bh - 6);
    ctx.fillStyle = "rgba(7,22,42,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = amb(0.8); ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    lines.forEach((l, i) => txt(ctx, l, bx + 11, by + 20 + i * 17, i ? `500 11px ${MONO}` : `600 12px ${SANS}`, i ? INK2 : INK));
  }

  // tiny line drawings (x, y = point on the floor, s = scale)
  function runner(c, x, y, s) {
    const hy = y - s * 1.8;
    c.beginPath(); c.arc(x + s * 0.12, hy, s * 0.2, 0, 7); c.stroke();
    c.beginPath();
    c.moveTo(x + s * 0.06, hy + s * 0.22); c.lineTo(x - s * 0.1, y - s * 0.8);
    c.lineTo(x - s * 0.5, y - s * 0.38); c.lineTo(x - s * 0.62, y - s * 0.02);
    c.moveTo(x - s * 0.1, y - s * 0.8); c.lineTo(x + s * 0.3, y - s * 0.42); c.lineTo(x + s * 0.22, y);
    c.moveTo(x + s * 0.02, hy + s * 0.5); c.lineTo(x + s * 0.42, hy + s * 0.78);
    c.moveTo(x + s * 0.02, hy + s * 0.5); c.lineTo(x - s * 0.36, hy + s * 0.62);
    c.stroke();
  }
  function sitter(c, x, y, s) { // person on a sofa
    c.strokeRect(x - s * 0.9, y - s * 0.62, s * 1.8, s * 0.62);
    c.beginPath(); c.moveTo(x - s * 0.9, y - s * 0.62); c.lineTo(x - s * 0.9, y - s * 1.2); c.stroke();
    const hx = x - s * 0.35, hy = y - s * 1.9;
    c.beginPath(); c.arc(hx, hy, s * 0.2, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(hx, hy + s * 0.22); c.lineTo(hx - s * 0.05, y - s * 0.66); c.lineTo(hx + s * 0.55, y - s * 0.66); c.lineTo(hx + s * 0.6, y); c.stroke();
    c.beginPath(); c.moveTo(hx - s * 0.02, hy + s * 0.5); c.lineTo(hx + s * 0.35, hy + s * 0.4); c.lineTo(hx + s * 0.3, hy + s * 0.14); c.stroke(); // hand to ear
  }
  const ICON = [
    runner,
    (c, x, y, s) => { // hammer
      c.beginPath(); c.moveTo(x - s * 0.25, y - s * 0.05); c.lineTo(x + s * 0.2, y - s * 1.05); c.stroke();
      c.save(); c.translate(x + s * 0.2, y - s * 1.05); c.rotate(0.42); c.strokeRect(-s * 0.4, -s * 0.15, s * 0.8, s * 0.3); c.restore();
    },
    (c, x, y, s) => { // chair being dragged
      c.beginPath(); c.moveTo(x - s * 0.35, y); c.lineTo(x - s * 0.35, y - s * 1.15); c.moveTo(x - s * 0.35, y - s * 0.5);
      c.lineTo(x + s * 0.4, y - s * 0.5); c.lineTo(x + s * 0.4, y); c.stroke();
      c.beginPath(); c.moveTo(x + s * 0.6, y - s * 0.2); c.lineTo(x + s * 0.95, y - s * 0.2); c.moveTo(x + s * 0.6, y - s * 0.38); c.lineTo(x + s * 0.85, y - s * 0.38); c.stroke();
    },
    (c, x, y, s) => { // door
      c.strokeRect(x - s * 0.35, y - s * 1.3, s * 0.7, s * 1.3);
      c.beginPath(); c.arc(x + s * 0.2, y - s * 0.65, s * 0.06, 0, 7); c.stroke();
    },
    (c, x, y, s) => { // washing machine
      c.strokeRect(x - s * 0.45, y - s * 1.0, s * 0.9, s * 1.0);
      c.beginPath(); c.arc(x, y - s * 0.46, s * 0.26, 0, 7); c.stroke();
    },
    (c, x, y, s) => { // upright piano
      c.strokeRect(x - s * 0.6, y - s * 1.0, s * 1.2, s * 1.0);
      c.beginPath(); c.moveTo(x - s * 0.6, y - s * 0.5); c.lineTo(x + s * 0.6, y - s * 0.5);
      for (let i = 1; i < 6; i++) { c.moveTo(x - s * 0.6 + i * s * 0.2, y - s * 0.5); c.lineTo(x - s * 0.6 + i * s * 0.2, y - s * 0.3); }
      c.stroke();
    },
    (c, x, y, s) => { // other: a question mark in a circle
      c.beginPath(); c.arc(x, y - s * 0.55, s * 0.45, 0, 7); c.stroke();
      c.font = `600 ${Math.max(8, Math.round(s * 0.7))}px ${MONO}`; c.fillStyle = c.strokeStyle; c.textAlign = "center"; c.fillText("?", x, y - s * 0.32);
    },
  ];

  // concentric arcs travelling in direction `dir` (radians), clipped by the caller
  function waves(ctx, x, y, dir, R, s, amp, t, dashed) {
    if (amp <= 0 || R <= 2) return;
    const A = (0.12 + 0.88 * Math.sqrt(clamp(s, 0, 1))) * amp, lw = 1 + 2.6 * clamp(s, 0, 1);
    ctx.save(); ctx.lineWidth = lw; ctx.lineCap = "round";
    if (dashed) ctx.setLineDash([3, 5]);
    for (let k = 0; k < 5; k++) {
      const ph = (t * 0.42 + k / 5) % 1, r = 4 + ph * R;
      ctx.strokeStyle = amb(A * Math.pow(1 - ph, 1.25));
      ctx.beginPath(); ctx.arc(x, y, r, dir - 0.44 * PI, dir + 0.44 * PI); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- A · direction (3 x 3 section)
  function drawLoc(ctx, B, d, V, yr, P, LA, WA, t, lay, hits) {
    const aspect = lay === "thumb" ? 2.2 : clamp(B.w / 3.25 / (B.h / 3.15), 1.2, 2.2);
    const uw = Math.min(B.w / 3.25, (B.h / 3.15) * aspect), uh = uw / aspect;
    const cx = B.x + B.w / 2, cy = B.y + B.h / 2, x0 = cx - 1.5 * uw, y0 = cy - 1.5 * uh;
    const sl = Math.max(3, uh * 0.085), wl = Math.max(2.5, uw * 0.018);
    const [above, below, side, other] = V.loc, tot = V.total;
    const flag = d.loc.flag[yr];
    const room = (r, c) => ({ x: x0 + c * uw + wl / 2, y: y0 + r * uh + sl / 2, w: uw - wl, h: uh - sl });
    ctx.save(); ctx.beginPath(); ctx.rect(B.x - 4, B.y - 4, B.w + 8, B.h + 8); ctx.clip();

    // slabs (hatched concrete) and walls, the building continuing faintly past the drawn block
    for (let k = 0; k <= 3; k++) {
      const y = y0 + k * uh - sl / 2, kk = step(P, k, 7, 0.45);
      ctx.strokeStyle = INK3; ctx.lineWidth = 1;
      seg(ctx, x0, y, x0 - uw * 0.55, y, kk); seg(ctx, x0, y + sl, x0 - uw * 0.55, y + sl, kk);
      seg(ctx, x0 + 3 * uw, y, x0 + 3.55 * uw, y, kk); seg(ctx, x0 + 3 * uw, y + sl, x0 + 3.55 * uw, y + sl, kk);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
      seg(ctx, x0, y, x0 + 3 * uw, y, kk); seg(ctx, x0, y + sl, x0 + 3 * uw, y + sl, kk);
      hatch(ctx, x0, y, 3 * uw, sl, 5, INK3, kk);
    }
    for (let k = 0; k <= 3; k++) {
      const x = x0 + k * uw - wl / 2, kk = step(P, k + 3, 7, 0.45);
      ctx.strokeStyle = INK3; ctx.lineWidth = 1;
      seg(ctx, x, y0, x, y0 - uh * 0.5, kk); seg(ctx, x + wl, y0, x + wl, y0 - uh * 0.5, kk);
      seg(ctx, x, y0 + 3 * uh, x, y0 + 3.5 * uh, kk); seg(ctx, x + wl, y0 + 3 * uh, x + wl, y0 + 3.5 * uh, kk);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
      seg(ctx, x, y0, x, y0 + 3 * uh, kk); seg(ctx, x + wl, y0, x + wl, y0 + 3 * uh, kk);
    }

    // furniture in the quiet rooms, so the drawing reads as homes
    const fs = uh * 0.2;
    ctx.strokeStyle = INK3; ctx.lineWidth = 1;
    if (P > 0.5) {
      const a = step(P, 0, 1, 0.5);
      ctx.globalAlpha = a;
      const q = [[0, 0], [0, 2], [2, 0], [2, 2], [1, 0]];
      q.forEach(([r, c], i) => {
        const R = room(r, c), fx = R.x + R.w * (0.3 + 0.12 * i % 0.4), fy = R.y + R.h;
        if (i % 3 === 0) { ctx.strokeRect(fx - fs, fy - fs * 0.7, fs * 2.2, fs * 0.7); ctx.strokeRect(fx - fs, fy - fs * 1.0, fs * 0.5, fs * 0.3); }
        else if (i % 3 === 1) { ctx.strokeRect(fx, fy - fs * 1.1, fs * 1.6, fs * 0.12); seg(ctx, fx + fs * 0.2, fy - fs, fx + fs * 0.2, fy, 1); seg(ctx, fx + fs * 1.4, fy - fs, fx + fs * 1.4, fy, 1); }
        else { ctx.strokeRect(fx, fy - fs * 1.8, fs * 0.9, fs * 1.8); seg(ctx, fx, fy - fs * 0.9, fx + fs * 0.9, fy - fs * 0.9, 1); }
      });
      ctx.globalAlpha = 1;
    }

    // source rooms: above, below, side (right)
    const C = room(1, 1);
    const srcs = [
      { R: room(0, 1), v: above, i: 0, dir: PI / 2, px: C.x + C.w / 2, py: C.y },
      { R: room(2, 1), v: below, i: 1, dir: -PI / 2, px: C.x + C.w / 2, py: C.y + C.h },
      { R: room(1, 2), v: side, i: 2, dir: PI, px: C.x + C.w, py: C.y + C.h / 2 },
    ];
    const share = (s) => (flag && s.i === flag.i ? 0.03 : tot > 0 ? s.v / tot : 0);

    // the applicant's room: glow where sound enters, then the waves
    ctx.save(); ctx.beginPath(); ctx.rect(C.x, C.y, C.w, C.h); ctx.clip();
    for (const s of srcs) {
      const sh = share(s), a = 0.34 * Math.sqrt(sh) * WA;
      if (a <= 0) continue;
      const g = s.i === 2 ? ctx.createLinearGradient(C.x + C.w, 0, C.x + C.w * 0.55, 0)
        : s.i === 0 ? ctx.createLinearGradient(0, C.y, 0, C.y + C.h * 0.6) : ctx.createLinearGradient(0, C.y + C.h, 0, C.y + C.h * 0.4);
      g.addColorStop(0, amb(a)); g.addColorStop(1, amb(0));
      ctx.fillStyle = g; ctx.fillRect(C.x, C.y, C.w, C.h);
      const R = s.i === 2 ? C.w * 0.62 : C.h * 1.05;
      waves(ctx, s.px, s.py, s.dir, R, sh, WA, t + s.i * 0.37, flag && s.i === flag.i);
    }
    ctx.restore();
    ctx.strokeStyle = amb(0.55 * LA); ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.strokeRect(C.x + 3, C.y + 3, C.w - 6, C.h - 6); ctx.setLineDash([]);
    ctx.strokeStyle = INK2; ctx.lineWidth = 1.2;
    const sit = Math.min(uh * 0.2, uw * 0.1);
    ctx.globalAlpha = LA; sitter(ctx, C.x + C.w * 0.5, C.y + C.h - 1, sit); ctx.globalAlpha = 1;
    const small = clamp(uh * 0.15, 9.5, 13);
    if (LA > 0) { // room tag on a plaque so the waves do not run through it
      ctx.font = `600 ${small}px ${SANS}`;
      const tw = ctx.measureText("신청인의 집").width;
      ctx.globalAlpha = LA; ctx.fillStyle = "rgba(10,31,56,.92)"; ctx.fillRect(C.x + 6, C.y + 6, tw + 12, small + 9);
      ctx.strokeStyle = amb(0.8); ctx.lineWidth = 1; ctx.strokeRect(C.x + 6.5, C.y + 6.5, tw + 11, small + 8);
      txt(ctx, "신청인의 집", C.x + 12, C.y + small + 9, `600 ${small}px ${SANS}`, amb(1)); ctx.globalAlpha = 1;
    }

    // labels inside the source rooms
    for (const s of srcs) {
      const R = s.R, sh = share(s), fl = flag && s.i === flag.i;
      ctx.strokeStyle = amb((0.18 + 0.7 * Math.sqrt(sh)) * LA); ctx.lineWidth = 1.3;
      if (fl) ctx.setLineDash([4, 4]);
      ctx.strokeRect(R.x + 3, R.y + 3, R.w - 6, R.h - 6); ctx.setLineDash([]);
      if (s.i === 0) { ctx.strokeStyle = INK2; ctx.lineWidth = 1.2; ctx.globalAlpha = LA; runner(ctx, R.x + R.w * 0.14, R.y + R.h - 1, Math.min(uh * 0.19, uw * 0.09)); ctx.globalAlpha = 1; }
      const big = clamp(uh * (lay === "thumb" ? 0.36 : 0.3), 15, 34), lx = R.x + R.w * (s.i === 0 ? 0.56 : 0.5);
      const midY = R.y + R.h / 2 + big * 0.32;
      ctx.globalAlpha = LA;
      txt(ctx, LOC_ROW[s.i].split(" · ")[0], lx, midY - big * 0.95, `600 ${small}px ${SANS}`, INK, "center");
      txt(ctx, fl ? `${fmt(s.v)}?` : pc(s.v, tot), lx, midY, `600 ${fl ? Math.round(big * 0.72) : big}px ${MONO}`, amb(fl ? 0.55 : 1), "center");
      txt(ctx, fl ? "표 합계와 불일치" : `${fmt(s.v)}건`, lx, midY + small + 5, `500 ${small - 1}px ${fl ? SANS : MONO}`, INK2, "center");
      ctx.globalAlpha = 1;
      hits.push({ x: R.x, y: R.y, w: R.w, h: R.h, tip: [
        `${LOC_ROW[s.i]} · ${yr}`,
        fl ? `원본 ${KF.fmt(flag.raw)}건 — 표 합계 ${KF.fmt(flag.sum)}건` : `${KF.fmt(s.v)}건 · 신청의 ${pc(s.v, tot)}`,
        fl ? `다른 표 합계 ${KF.fmt(tot)}건과 맞지 않음` : `이 해 신청 ${KF.fmt(tot)}건`,
      ] });
    }
    hits.push({ x: C.x, y: C.y, w: C.w, h: C.h, tip: [`신청인의 집 · ${yr}`, `현장진단 신청 ${KF.fmt(tot)}건`, other > 0 ? `위치 '기타' ${KF.fmt(other)}건` : "위치 '기타' 0건"] });
    ctx.restore();
  }

  // ---------------------------------------------------------------- B · causes (two-storey section)
  // Each cause is a beam of sound going down through the slab; depth ∝ count on one scale for all years.
  function drawCause(ctx, B, d, V, yr, P, LA, WA, t, lay, hits) {
    const full = lay === "full", vals = V.cause, tot = V.total, n = vals.length;
    const labH = full ? 40 : 36, sl = full ? 10 : 7;
    const H = B.h - labH, upH = H * (full ? 0.2 : 0.22), yS = B.y + upH, yL = yS + sl, yF = B.y + H - sl, loH = yF - yL;
    const vmax = d.vmax.cause, sw = B.w / n, rx = Math.max(8, Math.min(sw / 2 - 5, 46));
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    const kk = step(P, 0, 1, 0.6);
    seg(ctx, B.x, B.y + 1, B.x + B.w, B.y + 1, kk);
    for (const y of [yS, yF]) { seg(ctx, B.x, y, B.x + B.w, y, kk); seg(ctx, B.x, y + sl, B.x + B.w, y + sl, kk); hatch(ctx, B.x, y, B.w, sl, 5, INK3, kk); }
    const small = full ? 12 : 10.5;
    ctx.globalAlpha = LA;
    txt(ctx, "소리가 나는 집", B.x + 4, B.y + small + 8, `600 ${small}px ${SANS}`, amb(0.9));
    txt(ctx, "소리를 듣는 집", B.x + B.w - 4, yF - 8, `600 ${small}px ${SANS}`, amb(0.9), "right");
    ctx.globalAlpha = 1;
    // depth scale on the left: 0 at the slab, the largest year-cause at the floor
    if (full) {
      ctx.strokeStyle = INK3; ctx.lineWidth = 1;
      for (let v = 0; v <= vmax; v += 2000) {
        const y = yL + ((loH - 10) * v) / vmax;
        seg(ctx, B.x - 6, y, B.x - 1, y, kk);
        ctx.globalAlpha = LA; txt(ctx, v ? `${v / 1000}천` : "0", B.x - 9, y + 3, `500 9.5px ${MONO}`, INK3, "right"); ctx.globalAlpha = 1;
      }
    }
    const order = vals.map((v, i) => i).sort((a, b) => vals[b] - vals[a]);
    vals.forEach((v, i) => {
      const cx = B.x + sw * (i + 0.5), sh = tot > 0 ? v / tot : 0;
      const D = Math.max(3, ((loH - 10) * Math.max(v, 0)) / vmax), rr = Math.min(rx, D * 0.9 + 4);
      ctx.save(); ctx.beginPath(); ctx.rect(B.x, yS, B.w, yF - yS); ctx.clip();
      // body of the beam
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, yS, rr, D + sl, 0, 0, PI); ctx.clip();
      const g = ctx.createLinearGradient(0, yS, 0, yS + D + sl);
      g.addColorStop(0, amb(0.34 * WA)); g.addColorStop(1, amb(0.06 * WA));
      ctx.fillStyle = g; ctx.fillRect(cx - rr, yS, 2 * rr, D + sl);
      ctx.restore();
      // travelling wave fronts
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 4; k++) {
        const ph = (t * 0.38 + k / 4 + i * 0.13) % 1, ry = ph * (D + sl);
        ctx.strokeStyle = amb(WA * 0.9 * Math.pow(1 - ph, 0.8));
        ctx.beginPath(); ctx.ellipse(cx, yS, rr * clamp(ry / (rr * 1.1), 0.3, 1), ry, 0, 0.06 * PI, 0.94 * PI); ctx.stroke();
      }
      // the value: dashed outline of the beam
      ctx.strokeStyle = amb(0.85 * LA); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.ellipse(cx, yS, rr, D + sl, 0, 0.02 * PI, 0.98 * PI); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      // the source, standing on the upper floor
      const s = clamp(Math.min(sw * 0.2, upH * 0.3), 7, 22);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.globalAlpha = step(P, i, n, 0.5);
      ICON[i](ctx, cx, yS - 1, s);
      ctx.globalAlpha = LA;
      const rank = order.indexOf(i), ly = yF + sl;
      if (full) {
        txt(ctx, d.cause.labels[i].replace("뛰거나 걷는 소리", "뛰거나 걷기").replace("가구 끌기·찍기", "가구 끌기"), cx, ly + 16, `500 11.5px ${SANS}`, INK, "center");
        txt(ctx, pc(v, tot), cx, ly + 32, `600 11.5px ${MONO}`, amb(0.95), "center");
      } else if (rank < 2) {
        txt(ctx, rank === 0 ? "걷기·뛰기" : d.cause.labels[i], cx, ly + 14, `600 10.5px ${SANS}`, INK, "center");
        txt(ctx, pc(v, tot, 0), cx, ly + 30, `600 13px ${MONO}`, amb(1), "center");
      } else {
        txt(ctx, pc(v, tot, 0), cx, ly + 22, `500 9.5px ${MONO}`, INK2, "center");
      }
      ctx.globalAlpha = 1;
      hits.push({ x: cx - sw / 2, y: B.y, w: sw, h: B.h, tip: [`${d.cause.full[i]} · ${yr}`, `${KF.fmt(v)}건 · 신청의 ${pc(v, tot)}`] });
    });
  }

  // ---------------------------------------------------------------- C/D · towers of windows
  function drawTowers(ctx, B, d, V, yr, P, LA, t, lay, hits, kind) {
    const full = lay === "full";
    const labels = kind === "house" ? d.house.labels : full ? d.built.labels : BUILT_SHORT;
    const vals = kind === "house" ? V.house : V.built, tot = vals.reduce((a, b) => a + b, 0), n = labels.length;
    const gap = full ? 24 : 9, tw = (B.w - gap * (n - 1)) / n, cw = tw / WIN;
    const labH = full ? 42 : 36, roofH = full ? 18 : 11;
    const floorsMax = Math.ceil(d.vmax[kind] / PER / WIN);
    const fh = Math.min(full ? 18 : 12, (B.h - labH - roofH - 4) / floorsMax);
    const gy = B.y + B.h - labH;
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    seg(ctx, B.x - 8, gy, B.x + B.w + 8, gy, step(P, 0, 1, 0.5));
    hatch(ctx, B.x - 8, gy, B.w + 16, 5, 4, INK3, step(P, 0, 1, 0.5));
    if (kind === "built" && yr === "2024") {
      txt(ctx, "2024년 준공연도 자료 없음 · 2023년 10월까지", B.x + B.w / 2, gy - 40, `500 ${full ? 13 : 11}px ${SANS}`, INK2, "center");
      return;
    }
    const tallest = vals.indexOf(Math.max(...vals));
    vals.forEach((v, i) => {
      const x = B.x + i * (tw + gap), wins = Math.max(0, v) / PER, floors = Math.ceil(wins / WIN - 1e-9);
      const Ht = floors * fh, top = gy - Ht, k = step(P, i, n, 0.6);
      const dashed = i === 4 && (kind === "built" || kind === "house");
      ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.setLineDash(dashed ? [4, 3] : []);
      if (floors > 0) {
        box(ctx, x, top, tw, Ht, k);
        // windows: lit ones = counted applications, filled bottom-up, last one partly
        for (let j = 0; j < floors * WIN; j++) {
          const f = Math.floor(j / WIN), c = j % WIN;
          const wx = x + c * cw + cw * 0.2, wy = gy - (f + 1) * fh + fh * 0.22, ww = cw * 0.6, wh = fh * 0.56;
          if (wy < top - 1) continue;
          const lit = clamp(wins - j, 0, 1) * k;
          ctx.setLineDash([]);
          ctx.strokeStyle = INK4; ctx.lineWidth = 1; if (wh > 3) ctx.strokeRect(wx, wy, ww, wh);
          if (lit > 0) { ctx.fillStyle = dashed ? amb(0.35) : amb(0.82); ctx.fillRect(wx, wy + wh * (1 - lit), ww, wh * lit); }
        }
        ctx.strokeStyle = INK4; ctx.lineWidth = 1;
        for (let f = 1; f < floors; f++) seg(ctx, x, gy - f * fh, x + tw, gy - f * fh, k);
        // roofs
        ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.setLineDash(dashed ? [4, 3] : []);
        if (k > 0.95) {
          if (kind === "house" && i === 2) { ctx.beginPath(); ctx.moveTo(x - 3, top); ctx.lineTo(x + tw / 2, top - roofH); ctx.lineTo(x + tw + 3, top); ctx.stroke(); }
          else {
            ctx.strokeRect(x - 2, top - 3, tw + 4, 3);
            if (kind === "house" && i === 0) ctx.strokeRect(x + tw * 0.35, top - roofH * 0.8, tw * 0.3, roofH * 0.8 - 3);
            if (kind === "house" && i === 3) seg(ctx, x + tw * 0.7, top - 3, x + tw * 0.7, top - roofH, 1);
            if (dashed) txt(ctx, "?", x + tw / 2, top - 6, `600 ${full ? 13 : 11}px ${MONO}`, INK2, "center");
          }
        }
      } else {
        ctx.strokeStyle = INK3; ctx.setLineDash([3, 3]); ctx.strokeRect(x, gy - 3, tw, 3);
      }
      ctx.setLineDash([]);
      // dimension line on the tallest tower
      if (full && i === tallest && floors > 2 && LA > 0) {
        const dx = x - 9;
        ctx.strokeStyle = amb(0.8 * LA); ctx.lineWidth = 1;
        seg(ctx, dx, gy, dx, top, 1); seg(ctx, dx - 4, gy, dx + 4, gy, 1); seg(ctx, dx - 4, top, dx + 4, top, 1);
      }
      ctx.globalAlpha = LA;
      const name = labels[i];
      txt(ctx, name, x + tw / 2, gy + (full ? 17 : 14), `${full ? 500 : 600} ${full ? 12 : 10.5}px ${SANS}`, dashed ? INK2 : INK, "center");
      if (full) txt(ctx, `${fmt(v)} · ${pc(v, tot)}`, x + tw / 2, gy + 34, `500 11px ${MONO}`, amb(0.95), "center");
      else txt(ctx, pc(v, tot, 0), x + tw / 2, gy + 30, `600 12px ${MONO}`, amb(0.95), "center");
      ctx.globalAlpha = 1;
      hits.push({ x, y: Math.min(top - roofH, gy - 40), w: tw, h: gy - Math.min(top - roofH, gy - 40) + labH, tip: [
        `${kind === "house" ? d.house.labels[i] : d.built.labels[i]} · ${yr}${kind === "built" && yr === "2023" ? " (1–10월)" : ""}`,
        `${KF.fmt(v)}건 · ${pc(v, tot)}`, `창 ${KF.fmt(Math.ceil(wins - 1e-9))}칸 (1칸 = ${PER}건)`] });
    });
    if (full && LA > 0) {
      const note = kind === "built" ? (yr === "2023" ? "2023년은 1–10월" : "") : "";
      if (note) txt(ctx, note, B.x + B.w, B.y + 14, `500 11px ${SANS}`, INK2, "right");
    }
  }

  // ---------------------------------------------------------------- year strip (totals as slim buildings)
  function strip(ctx, x, y, w, h, d, yi, full, hits, LA) {
    const n = d.years.length, bw = w / n, max = Math.max(...d.total);
    d.years.forEach((yr, i) => {
      const v = d.total[i], bh = Math.max(2, (v / max) * h), bx = x + i * bw + bw * 0.18, ww = bw * 0.64, by = y + h - bh;
      const sel = i === yi;
      ctx.fillStyle = sel ? amb(0.85) : "rgba(160,200,238,.12)"; ctx.fillRect(bx, by, ww, bh);
      ctx.strokeStyle = sel ? amb(1) : INK3; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, ww - 1, bh - 1);
      const ch = i ? `전년 대비 ${((v / d.total[i - 1] - 1) * 100).toFixed(1)}%` : "첫해 (수도권만)";
      hits.push({ x: x + i * bw, y: y - 6, w: bw, h: h + 22, year: i, tip: [`${yr}년 현장진단 신청`, `${KF.fmt(v)}건`, ch] });
    });
    ctx.strokeStyle = INK3; seg(ctx, x, y + h + 0.5, x + w, y + h + 0.5, 1);
    ctx.globalAlpha = LA;
    const f = `500 ${full ? 10 : 9}px ${MONO}`;
    txt(ctx, String(d.years[0]), x + bw * 0.5, y + h + 13, f, INK2, "center");
    txt(ctx, String(d.years[n - 1]), x + (n - 0.5) * bw, y + h + 13, f, INK2, "center");
    const pk = d.total.indexOf(max);
    if (pk !== yi) txt(ctx, `${d.years[pk]} ${full ? KF.fmt(max) : ""}`.trim(), x + (pk + 0.5) * bw, y - 5, f, INK2, "center");
    const sx = x + (yi + 0.5) * bw, sy = y + h - (d.total[yi] / max) * h - 5;
    txt(ctx, `${KF.fmt(d.total[yi])}`, clamp(sx, x + 20, x + w - 20), sy, `600 ${full ? 11 : 10}px ${MONO}`, amb(1), "center");
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- side panel: schedule of the current detail
  function rowsFor(mode, d, V, yr) {
    const tot = V.total, flag = mode === "loc" && d.loc.flag[yr];
    if (mode === "loc") return LOC_ROW.map((l, i) => ({ l, v: V.loc[i], s: flag && flag.i === i ? null : V.loc[i] / tot, flag: flag && flag.i === i }));
    if (mode === "cause") return d.cause.labels.map((l, i) => ({ l, v: V.cause[i], s: V.cause[i] / tot }));
    const vals = mode === "house" ? V.house : V.built, t2 = vals.reduce((a, b) => a + b, 0);
    if (mode === "built" && yr === "2024") return [];
    return (mode === "house" ? d.house.labels : d.built.labels).map((l, i) => ({ l, v: vals[i], s: t2 ? vals[i] / t2 : 0 }));
  }
  function wrap(ctx, str, x, y, maxW, lh, font, color) {
    ctx.font = font; let line = "", yy = y;
    for (const word of str.split(" ")) {
      const t = line ? line + " " + word : word;
      if (ctx.measureText(t).width > maxW && line) { txt(ctx, line, x, yy, font, color); line = word; yy += lh; } else line = t;
    }
    if (line) txt(ctx, line, x, yy, font, color);
    return yy + lh;
  }
  function noteFor(mode, d, yr) {
    const at = (y) => d.years.indexOf(y);
    if (mode === "loc") {
      const f = d.loc.flag[yr];
      if (f) return `${yr}년 옆집 칸(${KF.fmt(f.raw)}건)을 넣으면 합계가 ${KF.fmt(f.sum)}건이 되어 다른 표(${KF.fmt(d.total[at(+yr)])}건)와 맞지 않는다. 원본 값을 점선으로 두었다.`;
      return "'위층 소리'는 아래층에 사는 사람이 낸 신청이다. 표 이름(거주위치별)대로 읽었다. 포털 설명문은 같은 열을 '소음 발생 위치'라고 적어 뜻이 엇갈린다.";
    }
    if (mode === "cause") {
      const a = d.cause.data[at(2020)][6], b = d.cause.data[at(2024)][6];
      return `'기타'는 2020년 ${KF.fmt(a)}건에서 2024년 ${KF.fmt(b)}건으로 줄었다. 분류 방식이 바뀐 몫이 섞여 있다.`;
    }
    if (mode === "house") return "2022년부터 주상복합·기타가 0건이다. 분류가 합쳐진 것으로 보인다.";
    const u = d.built.data[at(2020)], share = u ? Math.round((u[4] / u.reduce((x, y) => x + y, 0)) * 100) : 0;
    return `준공연도를 모르는 신청(점선)이 2016–2021년에 많다(2020년 ${share}%). 비교는 2022년 이후가 낫다.`;
  }
  function panel(ctx, x0, pw, top, bottom, mode, d, V, yr, LA) {
    const M = MODES.find((m) => m.id === mode);
    ctx.globalAlpha = LA;
    txt(ctx, M.title, x0, top, `600 12px ${SANS}`, INK);
    txt(ctx, M.sub, x0, top + 17, `500 11px ${SANS}`, INK2);
    txt(ctx, yr, x0, top + 62, `500 40px ${MONO}`, INK);
    const bsum = V.built.reduce((a, b) => a + b, 0), partial = mode === "built" && yr === "2023";
    txt(ctx, partial ? "준공연도 표 합계 (1–10월)" : "현장진단 신청", x0 + 116, top + 38, `500 11px ${SANS}`, INK2);
    txt(ctx, `${fmt(partial ? bsum : V.total)}건`, x0 + 116, top + 61, `600 20px ${MONO}`, amb(1));
    ctx.strokeStyle = INK4; ctx.lineWidth = 1; seg(ctx, x0, top + 78, x0 + pw, top + 78, 1);
    const rows = rowsFor(mode, d, V, yr), y1 = top + 100;
    const rh = rows.length ? Math.min(36, (bottom - y1 - 60) / rows.length) : 0;
    const two = rh >= 30;
    rows.forEach((r, i) => {
      const y = y1 + i * rh;
      txt(ctx, r.l, x0, y + 4, `500 12px ${SANS}`, r.flag ? INK2 : INK);
      const val = r.flag ? `원본 ${KF.fmt(r.v)} · 합계 불일치` : `${fmt(r.v)}  ${r.s == null ? "" : pc(r.s, 1)}`;
      if (two) {
        const L = (pw - 4) * clamp(r.s == null ? 0 : r.s, 0, 1), yy = y + 15;
        ctx.strokeStyle = r.flag ? INK3 : amb(0.9); ctx.lineWidth = 1;
        if (r.flag) ctx.setLineDash([3, 3]);
        if (L > 0.5) { seg(ctx, x0, yy, x0 + L, yy, 1); seg(ctx, x0, yy - 4, x0, yy + 4, 1); seg(ctx, x0 + L, yy - 4, x0 + L, yy + 4, 1); }
        ctx.setLineDash([]);
        txt(ctx, val, x0 + pw, y + 4, `500 11px ${MONO}`, r.flag ? INK2 : amb(0.95), "right");
      } else {
        txt(ctx, val, x0 + pw, y + 4, `500 11px ${MONO}`, amb(0.95), "right");
      }
    });
    if (mode === "built" && yr === "2024") txt(ctx, "2023년 10월까지만 있다", x0, y1 + 4, `500 12px ${SANS}`, INK2);
    const ny = y1 + rows.length * rh + 14;
    if (bottom - ny > 44) wrap(ctx, noteFor(mode, d, yr), x0, ny, pw, 16, `500 11px ${SANS}`, INK2);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- whole sheet
  function sheet(ctx, w, h, d, st, t, hover) {
    const lay = w > 520 ? "full" : "narrow", full = lay === "full";
    const hits = [];
    paper(ctx, w, h, full ? 12 : 10);
    const V = st.V, yr = String(d.years[st.yi]);
    let B;
    if (full) {
      ctx.strokeStyle = INK3; ctx.lineWidth = 1; ctx.strokeRect(10.5, 10.5, w - 21, h - 21);
      ctx.strokeStyle = INK4; ctx.strokeRect(14.5, 14.5, w - 29, h - 29);
      const split = Math.round(w * 0.625);
      seg(ctx, split + 0.5, 15, split + 0.5, h - 15, 1);
      B = { x: 40, y: 44, w: split - 72, h: h - 88 };
      const x0 = split + 26, pw = w - 15 - 26 - x0;
      const sTop = h - 128, sH = 50;
      panel(ctx, x0, pw, 44, sTop - 34, st.mode, d, V, yr, st.LA);
      ctx.globalAlpha = st.LA;
      txt(ctx, "연도별 신청 (막대를 누르면 그해로)", x0, sTop - 14, `500 10.5px ${SANS}`, INK2);
      ctx.globalAlpha = 1;
      strip(ctx, x0, sTop, pw, sH, d, st.yi, true, hits, st.LA);
      ctx.strokeStyle = INK4; seg(ctx, split, h - 44, w - 15, h - 44, 1);
      txt(ctx, "KF-10  층간소음 단면도", split + 26, h - 24, `600 10.5px ${MONO}`, INK2);
      txt(ctx, "한국환경공단 이웃사이센터", w - 36, h - 24, `500 10.5px ${SANS}`, INK3, "right");
    } else {
      const M = MODES.find((m) => m.id === st.mode);
      txt(ctx, yr, 12, 26, `600 16px ${MONO}`, INK);
      const bsum = V.built.reduce((a, b) => a + b, 0), partial = st.mode === "built" && yr === "2023";
      txt(ctx, partial ? `표 ${fmt(bsum)}건 (1–10월)` : `신청 ${fmt(V.total)}건`, 58, 26, `600 12px ${MONO}`, amb(1));
      txt(ctx, M.label, w - 12, 26, `600 12px ${SANS}`, INK2, "right");
      B = { x: 12, y: 44, w: w - 24, h: h - 44 - 74 };
      strip(ctx, 16, h - 56, w - 32, 30, d, st.yi, false, hits, st.LA);
    }
    if (st.mode === "loc") drawLoc(ctx, B, d, V, yr, st.P, st.LA, st.WA, t, lay, hits);
    if (st.mode === "cause") drawCause(ctx, B, d, V, yr, st.P, st.LA, st.WA, t, lay, hits);
    if (st.mode === "house" || st.mode === "built") drawTowers(ctx, B, d, V, yr, st.P, st.LA, t, lay, hits, st.mode);
    if (hover) {
      const hit = hits.filter((q) => hover[0] >= q.x && hover[0] <= q.x + q.w && hover[1] >= q.y && hover[1] <= q.y + q.h).pop();
      if (hit) {
        if (hit.year != null) { ctx.strokeStyle = amb(0.6); ctx.lineWidth = 1; ctx.strokeRect(hit.x + 0.5, hit.y + 0.5, hit.w - 1, hit.h - 1); }
        tip(ctx, w, h, hover[0], hover[1], hit.tip);
      }
    }
    return hits;
  }

  function prep(d) {
    if (d.vmax) return;
    const col = (rows) => Math.max(...rows.flat().filter((v) => v != null));
    d.vmax = { cause: col(d.cause.data), house: col(d.house.data), built: col(d.built.data.filter(Boolean)) };
  }
  const targetOf = (d, yi) => ({
    loc: d.loc.data[yi].slice(), cause: d.cause.data[yi].slice(), house: d.house.data[yi].slice(),
    built: (d.built.data[yi] || [0, 0, 0, 0, 0]).slice(), total: d.total[yi],
  });

  function thumb(ctx, w, h, t, d) {
    prep(d);
    const c = t % 9, yi = d.years.indexOf(2023);
    paper(ctx, w, h, 10);
    const V = targetOf(d, yi);
    const P = clamp(c / 1.5, 0, 1), LA = clamp((c - 1.1) / 0.7, 0, 1), WA = clamp((c - 0.8) / 1.0, 0, 1);
    drawLoc(ctx, { x: 10, y: 8, w: w - 20, h: h - 16 }, d, V, "2023", P, LA, WA, t, "thumb", []);
    if (c > 8.3) { ctx.fillStyle = `rgba(15,42,74,${(c - 8.3) / 0.7})`; ctx.fillRect(0, 0, w, h); }
  }

  function mount(stage, controls, d) {
    prep(d);
    const s = KF.canvas(stage);
    const st = { mode: "loc", yi: d.years.indexOf(2023), V: null, P: 0, LA: 0, WA: 0 };
    const t0 = performance.now();
    let tm = t0, first = true, hover = null, hits = [];
    st.V = targetOf(d, st.yi);
    KF.segment(controls, MODES.map(({ id, label }) => ({ id, label })), st.mode, (id) => { st.mode = id; tm = performance.now(); first = false; });
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = d.years.length - 1; range.value = st.yi;
    const lab = document.createElement("label"); lab.append("연도", range);
    const out = document.createElement("span"); out.className = "readout";
    controls.append(lab, out);
    const setYear = (i) => { st.yi = i; range.value = i; out.textContent = `${d.years[i]}년 · 신청 ${KF.fmt(d.total[i])}건`; };
    range.oninput = () => setYear(+range.value);
    setYear(st.yi);
    const pos = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = pos(e); });
    stage.addEventListener("pointerleave", () => { hover = null; });
    stage.addEventListener("click", (e) => {
      const [x, y] = pos(e);
      const hit = hits.find((q) => q.year != null && x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
      if (hit) setYear(hit.year);
    });
    KF.loop(stage, (tt) => {
      const now = performance.now(), el = (now - t0) / 1000, em = (now - tm) / 1000;
      st.P = first ? clamp(el / 1.8, 0, 1) : clamp(em / 0.9, 0, 1);
      st.LA = first ? clamp((el - 1.2) / 0.8, 0, 1) : clamp((em - 0.35) / 0.5, 0, 1);
      st.WA = clamp((el - 1.0) / 1.2, 0, 1);
      // values glide to the selected year; during the intro they count up from zero
      const tg = targetOf(d, st.yi), grow = KF.ease(clamp((el - 0.5) / 2.2, 0, 1));
      for (const k of ["loc", "cause", "house", "built"]) st.V[k] = st.V[k].map((v, i) => v + (tg[k][i] * grow - v) * (el < 2.8 ? 1 : 0.16));
      st.V.total += (tg.total * grow - st.V.total) * (el < 2.8 ? 1 : 0.16);
      if (Math.abs(st.V.total - tg.total) < 0.5) st.V.total = tg.total;
      hits = sheet(s.ctx, s.w, s.h, d, st, tt, hover);
    });
  }

  VIZ.noise = { thumb, mount, bg: BG };
})();
