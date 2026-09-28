// 39 physique — "문틀 키 재기". A door frame with pencil height marks, the way parents mark a child's height each
// birthday — here in reverse. Left post: one graphite mark per exam year (2019–2025), height = how many 19-year-olds
// were examined, with the year and count written beside it. Right post: fainter marks for 2026–2044, counted from
// the boys already born 19 years earlier. On the wall, one blue chalk dot per future year shows where the count
// would be if it kept falling at the 2019–2025 speed. View 2 measures the 2025 examinees' actual heights.
(() => {
  const BG = "#e7cfbf";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", PEN = "'Nanum Pen Script', cursive";
  const INK = "#2f2622", MUTE = "rgba(47,38,34,.62)", LEAD = "#3a3634", SOFT = "rgba(58,54,52,.5)", RED = "#c2412d";
  const WOOD = "#b98a5c", WOOD2 = "#a47448", GAP = "#3b2f28", CHALK = "#3f78b5";
  const VMAX = 350000;

  // ---------------------------------------------------------------- scene
  function wall(ctx, w, h) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,.08)";
    for (let y = 0; y < h; y += 5) if ((y * 7) % 13 < 3) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = "#cdb4a2"; ctx.fillRect(0, h - 18, w, 18);                   // skirting board
    ctx.fillStyle = "rgba(0,0,0,.08)"; ctx.fillRect(0, h - 18, w, 2);
  }
  function wood(ctx, x, y0, w, y1, seed) {                                          // one painted-over wooden post
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, WOOD2); g.addColorStop(0.12, WOOD); g.addColorStop(0.88, WOOD); g.addColorStop(1, "#8f6541");
    ctx.fillStyle = g; ctx.fillRect(x, y0, w, y1 - y0);
    ctx.strokeStyle = "rgba(90,55,30,.2)"; ctx.lineWidth = 1;
    for (let k = 0; k < 6; k++) {
      const gx = x + 8 + k * (w - 16) / 5;
      ctx.beginPath(); ctx.moveTo(gx, y0);
      for (let y = y0; y <= y1; y += 22) ctx.lineTo(gx + Math.sin(y * 0.019 + k + seed) * 2.4, y);
      ctx.stroke();
    }
  }
  function jamb(ctx, x, w, h) {                                                    // view 2: a single post at the left edge
    ctx.fillStyle = GAP; ctx.fillRect(0, 0, x, h - 18);
    wood(ctx, x, 0, w, h - 18, 0);
    ctx.fillStyle = "rgba(0,0,0,.16)"; ctx.fillRect(x + w, 0, 3, h - 18);
  }
  function mark(ctx, x0, x1, y, col, lw, seed) {                                    // a slightly wobbly pencil line
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    ctx.moveTo(x0, y + Math.sin(seed) * 0.6);
    ctx.quadraticCurveTo((x0 + x1) / 2, y + Math.sin(seed * 3.1) * 1.1, x1, y + Math.cos(seed) * 0.7); ctx.stroke();
  }
  function chalk(ctx, x, y, r, a) {                                                  // a dusty chalk dot
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = `rgba(63,120,181,${0.3 * a})`;
      ctx.beginPath(); ctx.arc(x + Math.sin(k * 2.3 + y) * r * 0.45, y + Math.cos(k * 1.9 + x) * r * 0.45, r * 0.72, 0, 7); ctx.fill();
    }
  }
  // push labels apart vertically (keeping their order), within [lo, hi]
  function spread(items, gap, lo, hi) {
    const s = items.slice().sort((a, b) => a.y - b.y);
    s.forEach((it, i) => { it.ly = Math.max(it.y, i ? s[i - 1].ly + gap : lo); });
    for (let i = s.length - 1; i >= 0; i--) { const lim = i === s.length - 1 ? hi : s[i + 1].ly - gap; if (s[i].ly > lim) s[i].ly = lim; }
    return s;
  }

  // ---------------------------------------------------------------- view 1: the door frame
  function frame(w, h, mode) {
    const floor = h - 18;
    const F = mode === "full" ? { L0: 84, pw: 170, gap: 128, top: 76, headH: 34, fs: 18, lg: 19, chalkLab: true }
      : mode === "phone" ? { L0: 8, pw: 126, gap: 50, top: 104, headH: 20, fs: 14.5, lg: 15, chalkLab: false }
      : { L0: Math.round(w * 0.1), pw: Math.round(w * 0.16), gap: Math.round(w * 0.08), top: 40, headH: 14, fs: 0, lg: 0, chalkLab: false };
    F.floor = floor; F.L1 = F.L0 + F.pw; F.R0 = F.L1 + F.gap; F.R1 = F.R0 + F.pw;
    F.headY = F.top - F.headH - (mode === "thumb" ? 8 : 16); F.chalkX = F.R1 + (mode === "full" ? 26 : mode === "phone" ? 14 : 12);
    F.yv = (v) => floor - (v / VMAX) * (floor - F.top);
    F.mode = mode;
    return F;
  }
  function doorway(ctx, F, full) {
    const { L0, L1, R0, R1, headY, headH, floor } = F, y0 = headY + headH;
    const g = ctx.createLinearGradient(0, y0, 0, floor);                            // the dim room behind
    g.addColorStop(0, "#2d231e"); g.addColorStop(0.75, "#3b2f28"); g.addColorStop(1, "#4a3c33");
    ctx.fillStyle = g; ctx.fillRect(L1, y0, R0 - L1, floor - y0);
    ctx.fillStyle = "rgba(255,236,210,.05)"; ctx.fillRect(L1, floor - (floor - y0) * 0.16, R0 - L1, (floor - y0) * 0.16);
    ctx.fillStyle = "#5a4436"; ctx.fillRect(R0 - (R0 - L1) * 0.2, y0, (R0 - L1) * 0.2, floor - y0);   // the open door's edge
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(R0 - (R0 - L1) * 0.2 - 2, y0, 2, floor - y0);
    wood(ctx, L0, y0, F.pw, floor, 1); wood(ctx, R0, y0, F.pw, floor, 4);
    wood(ctx, L0 - 10, headY, R1 - L0 + 20, y0, 7);                                 // lintel
    ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.fillRect(L0 - 10, y0, R1 - L0 + 20, 3); ctx.fillRect(R1, y0, 3, floor - y0);
    ctx.fillStyle = "rgba(0,0,0,.1)"; ctx.fillRect(L1, y0, 2, floor - y0); ctx.fillRect(R0 - 2, y0, 2, floor - y0);
  }

  function view1(ctx, w, h, d, el, hover, mode) {
    const F = frame(w, h, mode), full = mode === "full", thumb = mode === "thumb", { L1, R0, R1, top, floor, yv } = F;
    wall(ctx, w, h); doorway(ctx, F, full);
    const y0 = F.headY + F.headH;
    // what is written on the frame
    if (!thumb) {
      ctx.fillStyle = LEAD; ctx.textAlign = "center"; ctx.font = `${full ? 21 : 15}px ${PEN}`;
      ctx.fillText(full ? "해마다 병역판정검사를 받은 19세 · 키 대신 사람 수를 재다" : "19세 사람 수 재기", (F.L0 + R1) / 2, F.headY + F.headH / 2 + (full ? 7 : 5));
      ctx.font = `600 ${full ? 11 : 9.5}px ${SANS}`; ctx.fillStyle = "rgba(47,38,34,.72)";
      ctx.fillText(full ? "잰 해 2019–2025" : "잰 해", F.L0 + F.pw / 2, y0 + (full ? 16 : 13));
      ctx.fillText(full ? "이미 태어난 아이로 센 해" : "태어난 아이로 센 해", R0 + F.pw / 2, y0 + (full ? 16 : 13));
    }
    // scale on the wall, left of the frame
    if (full) {
      ctx.textAlign = "right"; ctx.font = `500 10px ${MONO}`; ctx.fillStyle = MUTE; ctx.strokeStyle = "rgba(47,38,34,.35)"; ctx.lineWidth = 1;
      for (let v = 50000; v <= 300000; v += 50000) {
        const y = yv(v);
        ctx.beginPath(); ctx.moveTo(F.L0 - 20, y); ctx.lineTo(F.L0 - 12, y); ctx.stroke();
        ctx.fillText(`${v / 10000}만`, F.L0 - 24, y + 3);
      }
    }
    const pa = d.ex.map(([y, v], i) => ({ y: yv(v), yr: y, v, real: 1, t: 0.3 + i * 0.27 }));
    const pf = d.proj.map(([y, v], i) => ({ y: yv(v), yr: y, v, real: 0, t: 2.3 + i * 0.11 }));
    const speed = thumb ? 2.2 : 1;
    const ml = full ? 44 : thumb ? F.pw * 0.5 : 28;                                  // mark length on the post face
    const hits = [];
    // left post: graphite marks, drawn from the doorway side outwards; labels to the left
    for (const p of pa) {
      const k = KF.clamp((el * speed - p.t) / 0.25, 0, 1); if (k <= 0) continue;
      const x1 = L1 - 5, x0 = x1 - ml * KF.ease(k);
      mark(ctx, x0, x1, p.y, LEAD, thumb ? 1.5 : 2, p.yr);
      hits.push({ p, x0: F.L0, x1: L1, y: p.y });
    }
    // right post: fainter marks for the years still to come
    for (const p of pf) {
      const k = KF.clamp((el * speed - p.t) / 0.25, 0, 1); if (k <= 0) continue;
      const x0 = R0 + 5, x1 = x0 + ml * KF.ease(k);
      mark(ctx, x0, x1, p.y, SOFT, thumb ? 1.1 : 1.4, p.yr);
      hits.push({ p, x0: R0, x1: R1, y: p.y });
    }
    // chalk: one dot per future year at the 2019–2025 speed, until it reaches the floor
    const [a, b] = d.line, zeroYr = Math.ceil(d.zero), cx = F.chalkX;
    const chalkPts = [];
    for (let yr = d.ex[d.ex.length - 1][0] + 1; yr <= zeroYr; yr++) {
      const v = Math.max(0, a + b * yr), t = 4.3 + (yr - 2026) * 0.07, k = KF.clamp((el * speed - t) / 0.3, 0, 1);
      if (k <= 0) continue;
      const y = v > 0 ? yv(v) : floor - 3;
      chalk(ctx, cx, y, full ? 4.2 : thumb ? 2.6 : 3.2, k);
      chalkPts.push({ yr, v, y });
    }
    if (!thumb) {
      const la = (p) => KF.clamp((el - p.t - 0.2) / 0.35, 0, 1);                   // each label arrives with its mark
      ctx.textAlign = "left";
      // labels: measured years, all of them, with leaders when pushed apart
      const gapL = full ? 19 : 15, grp = [];
      for (const p of pa) {                                                          // years whose marks coincide share one label
        const g = grp[grp.length - 1];
        if (g && Math.abs(g.y - p.y) < 3 && p.yr === g.yr2 + 1) { g.yr2 = p.yr; g.t = p.t; } else grp.push({ ...p, yr2: p.yr });
      }
      spread(grp, gapL, top - 6, floor - 10).forEach((p) => {
        const xm = L1 - 5 - ml, xl = xm - 8;
        ctx.globalAlpha = la(p); ctx.fillStyle = LEAD; ctx.font = `${F.fs}px ${PEN}`; ctx.textAlign = "right";
        ctx.fillText(`${p.yr2 > p.yr ? `${p.yr}·${String(p.yr2).slice(2)}` : p.yr} · ${(p.v / 1e4).toFixed(1)}만`, xl, p.ly + 5);
        if (Math.abs(p.ly - p.y) > 3) { ctx.strokeStyle = "rgba(58,54,52,.55)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(xl + 2, p.ly); ctx.lineTo(xm - 1, p.y); ctx.stroke(); }
      });
      // labels: a few of the future years
      const keys = full ? [2026, 2031, 2035, 2042, 2044] : [2026, 2035, 2042];
      spread(pf.filter((p) => keys.includes(p.yr)), gapL, top - 6, floor - 10).forEach((p) => {
        const xm = R0 + 5 + ml, xl = xm + 8;
        ctx.globalAlpha = la(p); ctx.fillStyle = "rgba(58,54,52,.8)"; ctx.font = `${F.fs}px ${PEN}`; ctx.textAlign = "left";
        ctx.fillText(`${p.yr} · ${(p.v / 1e4).toFixed(1)}만`, xl, p.ly + 5);
        if (Math.abs(p.ly - p.y) > 3) { ctx.strokeStyle = "rgba(58,54,52,.4)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(xl - 2, p.ly); ctx.lineTo(xm + 1, p.y); ctx.stroke(); }
      });
      // chalk writing
      if (F.chalkLab) {
        ctx.globalAlpha = KF.clamp((el - 5.0) / 0.5, 0, 1); ctx.fillStyle = CHALK; ctx.font = `${F.lg}px ${PEN}`; ctx.textAlign = "left";
        for (const q of chalkPts) if (q.yr === 2030 || q.yr === 2035) ctx.fillText(`${q.yr} · ${(q.v / 1e4).toFixed(1)}만`, cx + 12, q.y + 5);
        ctx.fillText("분필 = 같은 속도로 줄면", cx + 12, floor - 28);
        ctx.fillText(`${zeroYr}년 0명`, cx + 12, floor - 8);
      }
      ctx.globalAlpha = 1;
    }
    // hover: the nearest mark on the post (or chalk dot) under the pointer
    let hit = null;
    if (hover) {
      let best = 9;
      for (const q of hits) if (hover[0] >= q.x0 && hover[0] <= q.x1) { const e = Math.abs(hover[1] - q.y); if (e < best) { best = e; hit = { kind: "mark", p: q.p }; } }
      for (const q of chalkPts) { const e = Math.hypot(hover[0] - cx, hover[1] - q.y); if (e < best + 3) { best = e; hit = { kind: "chalk", q }; } }
      if (hit && hit.kind === "mark") { const p = hit.p, xs = p.real ? [F.L0, L1] : [R0, R1]; ctx.strokeStyle = RED; ctx.lineWidth = 1.2; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(xs[0], p.y); ctx.lineTo(xs[1], p.y); ctx.stroke(); ctx.setLineDash([]); }
    }
    return { hit, F };
  }

  // ---------------------------------------------------------------- view 2: the heights of 2025
  function view2(ctx, w, h, d, el, hover, full) {
    const jx = full ? 46 : 16, jw = full ? 50 : 30, top = full ? 30 : 64, floor = h - 18, H0 = 140, H1 = 205;
    const yv = (cm) => floor - ((cm - H0) / (H1 - H0)) * (floor - top);
    wall(ctx, w, h); jamb(ctx, jx, jw, h);
    // pencil centimetre ticks on the jamb
    ctx.strokeStyle = "rgba(60,35,15,.55)"; ctx.lineWidth = 1; ctx.fillStyle = "rgba(40,25,10,.8)"; ctx.font = `500 ${full ? 9.5 : 8.5}px ${MONO}`; ctx.textAlign = "right";
    for (let cm = H0; cm <= H1; cm++) {
      const y = yv(cm), l = cm % 10 === 0 ? jw * 0.45 : cm % 5 === 0 ? jw * 0.3 : jw * 0.16;
      ctx.beginPath(); ctx.moveTo(jx + jw - l, y); ctx.lineTo(jx + jw, y); ctx.stroke();
      if (cm % 10 === 0) ctx.fillText(String(cm), jx + jw - l - 2, y + 3);
    }
    // everyone's mark: 1 pencil stroke = 500 examinees, scattered inside their 5 cm band
    const x0 = jx + jw + (full ? 18 : 10), maxLen = full ? w * 0.4 : w - x0 - 128;
    const mx = Math.max(...d.hbins.map((b) => b[2])), prog = KF.clamp((el - 0.2) / 1.8, 0, 1);
    let hit = null;
    d.hbins.forEach(([lo, hi, n], i) => {
      if (hi <= H0) return;
      const ya = yv(Math.max(lo, H0)), yb = yv(Math.min(hi, H1)), len = (n / mx) * maxLen * KF.ease(prog);
      let s = i * 977 + 3; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      const strokes = Math.round(n / 500);
      ctx.strokeStyle = "rgba(58,54,52,.5)"; ctx.lineWidth = 0.8;
      for (let k = 0; k < strokes; k++) { const y = yb + rnd() * (ya - yb); ctx.beginPath(); ctx.moveTo(jx + 2, y); ctx.lineTo(jx + jw - 2, y + (rnd() - 0.5)); ctx.stroke(); }
      // hatched bar on the wall
      ctx.fillStyle = "rgba(58,54,52,.1)"; ctx.fillRect(x0, yb + 1, len, ya - yb - 2);
      ctx.strokeStyle = "rgba(58,54,52,.55)"; ctx.lineWidth = 0.9;
      for (let x = x0; x < x0 + len; x += 4) { ctx.beginPath(); ctx.moveTo(x, ya - 1); ctx.lineTo(Math.min(x + 3, x0 + len), yb + 1); ctx.stroke(); }
      if (n >= 1000 && prog >= 1) {
        ctx.fillStyle = LEAD; ctx.font = `${full ? 17 : 14}px ${PEN}`; ctx.textAlign = "left";
        ctx.fillText(`${lo.toFixed(0)}–${(hi - 0.1).toFixed(1)}cm  ${KF.fmt(n)}명`, x0 + len + 8, (ya + yb) / 2 + 5);
      }
      if (hover && hover[1] <= ya && hover[1] >= yb && hover[0] > jx && hover[0] < x0 + Math.max(len, 120)) hit = { lo, hi, n };
    });
    // the average
    const ym = yv(d.hmean);
    ctx.strokeStyle = RED; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(jx - 6, ym); ctx.lineTo(jx + jw + 6, ym); ctx.stroke();
    ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(jx + jw + 6, ym); ctx.lineTo(x0 + maxLen, ym); ctx.stroke(); ctx.setLineDash([]);
    return { hit };
  }

  const at = (d, yr) => Math.max(0, d.line[0] + d.line[1] * yr);
  function panel1(ctx, x, y, w, d, el) {
    const a = KF.clamp((el - 0.8) / 0.8, 0, 1), ex = d.ex, e0 = ex[0], e1 = ex[ex.length - 1], pr = Object.fromEntries(d.proj), last = d.proj[d.proj.length - 1];
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = MUTE; ctx.font = `600 11px ${SANS}`; ctx.fillText("병역판정검사를 받은 19세 (처분 인원)", x, y);
    ctx.fillStyle = INK; ctx.font = `700 30px ${SANS}`; ctx.fillText(`${(e0[1] / 1e4).toFixed(1)}만 → ${(e1[1] / 1e4).toFixed(1)}만`, x, y + 36);
    ctx.fillStyle = MUTE; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(`${e0[0]} → ${e1[0]} · 해마다 약 ${(-d.line[1] / 1e4).toFixed(1)}만 명씩`, x, y + 56);
    const rows = [[LEAD, "흐린 연필 · 이미 태어난 아이로 세면", `2035년 ${(pr[2035] / 1e4).toFixed(1)}만`, `${last[0]}년 ${(last[1] / 1e4).toFixed(1)}만`],
      [CHALK, "분필 · 같은 속도로 줄면", `${Math.ceil(d.zero)}년 0명`, `2035년 ${(at(d, 2035) / 1e4).toFixed(1)}만`]];
    rows.forEach(([c, t, v1, v2], i) => {
      const yy = y + 96 + i * 62;
      ctx.fillStyle = c; ctx.font = `600 12px ${SANS}`; ctx.fillText(t, x, yy);
      ctx.font = `700 21px ${SANS}`; ctx.fillText(v1, x, yy + 26);
      ctx.fillStyle = MUTE; ctx.font = `500 12px ${SANS}`; ctx.fillText(v2, x + 150, yy + 25);
    });
    ctx.fillStyle = MUTE; ctx.font = `500 11px ${SANS}`;
    ctx.fillText(`19세 수 ≈ 19년 전 남자 출생아 × ${(d.rat * 100).toFixed(1)}%`, x, y + 236);
    ctx.fillText(`주민등록 2025.12 · 10대 남자 ${KF.fmt(d.moe.m10)}명`, x, y + 254);
    ctx.fillText(`0–9세 남자 ${KF.fmt(d.moe.m0)}명`, x, y + 272);
    ctx.globalAlpha = 1;
  }

  function panel2(ctx, x, y, w, d, el) {
    const a = KF.clamp((el - 0.8) / 0.8, 0, 1), R = d.rea, n = R.years.length;
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = MUTE; ctx.font = `600 11px ${SANS}`; ctx.fillText(`${d.hyear}년 병역판정검사 · 키를 잰 사람`, x, y);
    ctx.fillStyle = INK; ctx.font = `700 30px ${SANS}`; ctx.fillText(`${KF.fmt(d.hn)}명`, x, y + 36);
    ctx.fillStyle = MUTE; ctx.font = `500 11.5px ${SANS}`; ctx.fillText("연필 한 줄 = 500명 · 5cm 구간", x, y + 56);
    ctx.fillStyle = RED; ctx.font = `600 12px ${SANS}`; ctx.fillText(`빨간 선 = 평균 약 ${d.hmean}cm (구간 가운데값)`, x, y + 76);
    const g = d.grade;
    ctx.fillStyle = INK; ctx.font = `600 12px ${SANS}`; ctx.fillText(`현역 판정 ${g[0][1]}% (${g[0][0]}) → ${g[g.length - 1][1]}% (${g[g.length - 1][0]})`, x, y + 100);
    // 4–6급 사유: two pencil lines (share of 신장·체중 and 정신건강)
    const cy = y + 134, ch = 110, cw = w - 20, xs = (i) => x + (i / (n - 1)) * cw, ys = (v) => cy + ch - (v / 45) * ch;
    ctx.fillStyle = MUTE; ctx.font = `600 11px ${SANS}`; ctx.fillText("4–6급 판정 사유의 몫", x, cy - 6);
    [[R.bw, "#8a6a3a", "신장·체중"], [R.mh, RED, "정신건강의학과"]].forEach(([arr, c, lab]) => {
      ctx.strokeStyle = c; ctx.lineWidth = 1.8; ctx.beginPath();
      arr.forEach((v, i) => { const X = xs(i), Y = ys((v / R.tot[i]) * 100); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
      const lv = (arr[n - 1] / R.tot[n - 1]) * 100;
      ctx.fillStyle = c; ctx.font = `${19}px ${PEN}`; ctx.fillText(`${lab} ${lv.toFixed(0)}%`, xs(n - 1) - 88, ys(lv) + (c === RED ? -8 : 18));
    });
    ctx.fillStyle = MUTE; ctx.font = `500 10px ${MONO}`; ctx.fillText(String(R.years[0]), x, cy + ch + 14); ctx.textAlign = "right"; ctx.fillText(String(R.years[n - 1]), x + cw, cy + ch + 14);
    ctx.globalAlpha = 1;
  }

  function tip(ctx, w, h, lines, p) {
    ctx.font = `600 12px ${SANS}`;
    const bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22, bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(252,247,240,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = LEAD; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], j) => { ctx.fillStyle = c; ctx.font = `${j ? 500 : 700} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 20 + j * 18); });
  }
  function tip1(ctx, w, h, d, hit, hover) {
    const mb = Object.fromEntries(d.mb), pr = Object.fromEntries(d.proj), ex = Object.fromEntries(d.ex);
    const yr = hit.kind === "chalk" ? hit.q.yr : hit.p.yr, lines = [[`${yr}년`, RED]];
    if (ex[yr] !== undefined) lines.push([`병역판정검사 ${KF.fmt(ex[yr])}명`, INK], [`${yr - 19}년생 남자 ${KF.fmt(mb[yr])}명의 ${(ex[yr] / mb[yr] * 100).toFixed(1)}%`, MUTE]);
    else {
      lines.push([`${yr - 19}년생 남자 ${KF.fmt(mb[yr])}명 × ${(d.rat * 100).toFixed(1)}% ≈ ${KF.fmt(pr[yr])}명`, INK]);
      lines.push([`분필(같은 속도로 줄면) ${KF.fmt(Math.round(at(d, yr)))}명`, CHALK]);
    }
    tip(ctx, w, h, lines, hover);
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const c = t % 10;
    view1(ctx, w, h, d, c, null, "thumb");
    const x = w * 0.62, a = KF.clamp((c - 1) / 0.8, 0, 1), pr = Object.fromEntries(d.proj);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText("이미 태어난 19세", x, h * 0.2);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.11)}px ${SANS}`; ctx.fillText(`2035년 ${Math.round(pr[2035] / 1e4)}만`, x, h * 0.34);
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText("같은 속도로 줄면", x, h * 0.56);
    ctx.fillStyle = CHALK; ctx.font = `700 ${Math.round(h * 0.11)}px ${SANS}`; ctx.fillText(`${Math.ceil(d.zero)}년 0명`, x, h * 0.7);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let view = "count", t0 = performance.now(), hover = null;
    KF.segment(controls, [{ id: "count", label: "몇 명이 재나" }, { id: "height", label: `얼마나 큰가 (${d.hyear})` }], "count", (id) => { view = id; t0 = performance.now(); });
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 재기";
    replay.onclick = () => { t0 = performance.now(); }; controls.appendChild(replay);
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, el = (performance.now() - t0) / 1000;
      if (view === "count") {
        const r = view1(ctx, w, h, d, el, hover, full ? "full" : "phone");
        if (full) panel1(ctx, w * 0.69, 60, w * 0.29, d, el);
        else {
          const pr = Object.fromEntries(d.proj), a = KF.clamp((el - 0.8) / 0.8, 0, 1);
          ctx.globalAlpha = a; ctx.textAlign = "left";
          ctx.fillStyle = INK; ctx.font = `700 15px ${SANS}`; ctx.fillText(`${(d.ex[0][1] / 1e4).toFixed(1)}만 → ${(d.ex[d.ex.length - 1][1] / 1e4).toFixed(1)}만 (${d.ex[0][0]}→${d.ex[d.ex.length - 1][0]})`, 12, 22);
          ctx.font = `600 12px ${SANS}`; ctx.fillStyle = LEAD; ctx.fillText(`흐린 연필(태어난 아이로 세면) 2035년 ${(pr[2035] / 1e4).toFixed(1)}만`, 12, 41);
          ctx.fillStyle = CHALK; ctx.fillText(`분필(같은 속도로 줄면) ${Math.ceil(d.zero)}년 0명`, 12, 58);
          ctx.globalAlpha = 1;
        }
        if (r.hit && hover) tip1(ctx, w, h, d, r.hit, hover);
      } else {
        const r = view2(ctx, w, h, d, el, hover, full);
        if (full) panel2(ctx, w * 0.69, 60, w * 0.29, d, el);
        else {
          ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 15px ${SANS}`;
          ctx.fillText(`${d.hyear}년 키를 잰 ${KF.fmt(d.hn)}명`, 58, 24);
          ctx.fillStyle = MUTE; ctx.font = `500 11px ${SANS}`; ctx.fillText("연필 한 줄 = 500명 · 5cm 구간", 58, 42);
          ctx.fillStyle = RED; ctx.font = `600 11px ${SANS}`; ctx.fillText(`빨간 선 = 평균 약 ${d.hmean}cm`, 58, 58);
        }
        if (r.hit && hover) tip(ctx, w, h, [[`${r.hit.lo.toFixed(0)}–${(r.hit.hi - 0.1).toFixed(1)}cm`, RED], [`${KF.fmt(r.hit.n)}명 · ${(r.hit.n / d.hn * 100).toFixed(1)}%`, INK]], hover);
      }
    });
  }

  VIZ.physique = { thumb, mount, bg: BG };
})();
