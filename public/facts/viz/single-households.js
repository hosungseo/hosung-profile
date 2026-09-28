// 32 single-households — "우편함 벽". An apartment-lobby mailbox wall: floors = age of the householder (youngest at the
// bottom), each floor a men's row over a women's row. View 1: one box = N one-person households, name-tag colour = sex.
// View 2: every row becomes 100% of the people of that age and sex; lit boxes = the share who form a one-person household.
// View 3: one mailbox per 시군구, tag colour = the age of its largest one-person group.
(() => {
  const BG = "#23292e";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#eef1f2", DIM = "rgba(238,241,242,.64)", FAINT = "rgba(238,241,242,.13)";
  const MEN = "#62a6e0", WOM = "#f0806e", TAGC = { m: MEN, f: WOM };
  const M_TOP = "#dfe4e7", M_BASE = "#b0b9bf", EDGE = "rgba(20,26,30,.55)", SLOT = "#1d2428";
  const OFF_BASE = "#4b555c", OFF_TOP = "#566169";
  const AGE_C = ["#7fd6c9", "#b7b2ea", "#f2cf6b", "#f08a62"];          // largest group aged 20–39 · 40–59 · 60s · 70+
  const AGE_L = ["20–30대", "40–50대", "60대", "70대 이상"];
  const ageClass = (i) => (i <= 2 ? 0 : i <= 4 ? 1 : i === 5 ? 2 : 3);
  const NICE = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000];
  const SX = { m: "남성", f: "여성" };
  const sg = (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`;
  const ymL = (ym) => `${ym.slice(0, 4)}.${+ym.slice(4)}`;

  // ---------------------------------------------------------------- one mailbox
  function box(ctx, x, y, w, h, tag, on, frac = 1) {
    const ww = w * frac;
    if (ww <= 0.3) return;
    ctx.fillStyle = on ? M_BASE : OFF_BASE; ctx.fillRect(x, y, ww, h);
    ctx.fillStyle = on ? M_TOP : OFF_TOP; ctx.fillRect(x, y, ww, h * 0.44);
    if (w >= 7 && h >= 7) {
      ctx.fillStyle = SLOT; ctx.fillRect(x + w * 0.16, y + h * 0.2, Math.min(ww, w * 0.84) - w * 0.16, Math.max(1, h * 0.09));
      if (tag && ww > w * 0.3) { ctx.fillStyle = tag; ctx.fillRect(x + w * 0.2, y + h * 0.56, Math.min(ww - w * 0.2, w * 0.6), Math.max(1.5, h * 0.22)); }
      if (on && w >= 12 && frac === 1) { ctx.fillStyle = "rgba(20,26,30,.45)"; ctx.fillRect(x + w * 0.82, y + h * 0.62, 1.2, 1.2); }
    } else if (tag) { ctx.fillStyle = tag; ctx.fillRect(x, y + h * 0.55, ww, Math.max(1, h * 0.3)); }
    ctx.strokeStyle = EDGE; ctx.lineWidth = 0.8; ctx.strokeRect(x + 0.4, y + 0.4, ww - 0.8, h - 0.8);
  }

  // ---------------------------------------------------------------- data
  const CACHE = new WeakMap();
  function prep(d) {
    if (CACHE.has(d)) return CACHE.get(d);
    const hhBy = {}; let hhAll = 0;
    for (const s of d.sgg) { hhBy[s.s] = (hhBy[s.s] || 0) + s.hh; hhAll += s.hh; }
    const reg = d.reg.map((r) => {
      const tot = r.o.m.reduce((a, b) => a + b, 0) + r.o.f.reduce((a, b) => a + b, 0);
      const tot0 = r.o0.m.reduce((a, b) => a + b, 0) + r.o0.f.reduce((a, b) => a + b, 0);
      const band = r.o.m.map((v, i) => v + r.o.f[i]);
      return { ...r, tot, tot0, band, hh: r.n === "전국" ? d.hh : hhBy[r.n], max: Math.max(...r.o.m, ...r.o.f) };
    });
    const sgg = d.sgg.map((s) => {
      const flat = []; for (const k of ["m", "f"]) s[k].forEach((v, i) => flat.push([k, i, v]));
      flat.sort((a, b) => b[2] - a[2]);
      const y = (s.m[1] + s.m[2] + s.f[1] + s.f[2]) / s.t, o = (s.m[6] + s.m[7] + s.m[8] + s.f[6] + s.f[7] + s.f[8]) / s.t;
      return { ...s, top: flat[0], top3: flat.slice(0, 3), y, o };
    });
    const X = { reg, sgg };
    CACHE.set(d, X);
    return X;
  }
  const pickN = (mx, C) => NICE.find((n) => mx / n <= C) || NICE[NICE.length - 1];
  const fmtN = (n) => (n >= 10000 ? `${KF.fmt(n / 10000, n % 10000 ? 1 : 0)}만` : KF.fmt(n));

  // ---------------------------------------------------------------- the wall (views 1 and 2)
  function wallLayout(w, h, full) {
    const x0 = full ? 92 : 44, x1 = full ? w * 0.61 : w - 12, y0 = full ? 84 : 88, y1 = full ? h - 26 : h - 56;
    const floorGap = full ? 8 : 5, gap = full ? 2 : 1.5, C = full ? 34 : 20;
    const rowH = (y1 - y0 - 8 * floorGap) / 18, bh = rowH - gap, bw = (x1 - x0 - (C - 1) * gap) / C;
    return { x0, x1, y0, y1, floorGap, gap, C, rowH, bh, bw };
  }
  const rowY = (L, fl, k) => L.y0 + (8 - fl) * (2 * L.rowH + L.floorGap) + (k === "f" ? L.rowH : 0);

  function wall(ctx, w, h, d, X, r, mode, el, full, hover, rateMix) {
    const L = wallLayout(w, h, full), N = pickN(r.max, L.C);
    let hit = null;
    for (let fl = 0; fl < 9; fl++) {
      // floor label
      const yc = rowY(L, fl, "m") + L.rowH - 1;
      ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 12.5 : 10.5}px ${SANS}`;
      ctx.fillText(full ? d.bands[fl] : ["0–19", "20대", "30대", "40대", "50대", "60대", "70대", "80대", "90+"][fl], L.x0 - (full ? 12 : 6), yc + 4);
      for (const k of ["m", "f"]) {
        const y = rowY(L, fl, k), v = r.o[k][fl], p = r.p[k][fl], rate = p ? v / p : 0;
        const nCount = v / N, nRate = rate * L.C;
        const t0 = 0.15 + fl * 0.11 + (k === "f" ? 0.05 : 0), prog = KF.clamp((el - t0) / 1.6, 0, 1);
        const isHover = hover && hover[1] >= y && hover[1] < y + L.rowH && hover[0] >= L.x0 - 60 && hover[0] <= L.x1 + 50;
        if (isHover) hit = { fl, k, v, p, rate, y };
        const lit = KF.lerp(nCount, nRate, rateMix), shownLit = lit * KF.ease(prog), total = KF.lerp(nCount, L.C, rateMix);
        for (let j = 0; j < L.C; j++) {
          const x = L.x0 + j * (L.bw + L.gap);
          if (j >= shownLit) { // an empty slot: a ghost in the count view, a dark mailbox in the rate view
            if (rateMix > 0.02) { ctx.globalAlpha = rateMix * KF.clamp(prog * 3, 0, 1); box(ctx, x, y, L.bw, L.bh, null, false); ctx.globalAlpha = 1; }
            if (rateMix < 0.98) { ctx.strokeStyle = `rgba(238,241,242,${0.07 * (1 - rateMix)})`; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, L.bw - 1, L.bh - 1); }
            if (j + 1 > shownLit && j < shownLit) {}
          }
          const fr = KF.clamp(shownLit - j, 0, 1);
          if (fr > 0) box(ctx, x, y, L.bw, L.bh, TAGC[k], true, fr);
        }
        if (isHover) { ctx.strokeStyle = "rgba(238,241,242,.9)"; ctx.lineWidth = 1.2; ctx.strokeRect(L.x0 - 3, y - 1.5, L.C * (L.bw + L.gap) + 2, L.rowH + 1); }
        // value column at the right of the wall
        if (full && prog >= 1) {
          ctx.textAlign = "left"; ctx.font = `500 10px ${MONO}`; ctx.fillStyle = k === "m" ? "rgba(98,166,224,.95)" : "rgba(240,128,110,.95)";
          ctx.fillText(rateMix < 0.5 ? fmtN(v) : `${(rate * 100).toFixed(1)}%`, L.x1 + 7, y + L.bh * 0.72);
        }
      }
    }
    return { L, N, hit };
  }

  function header(ctx, w, d, r, N, mode, full) {
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
    const where = r.n === "전국" ? "전국" : r.n;
    ctx.fillText(mode === "count" ? `우편함 벽 · ${where} 1인 세대 ${KF.fmt(r.tot)}` : `${where} · 같은 나이·성별 주민 중 1인 세대`, full ? 24 : 12, full ? 36 : 26);
    ctx.font = `500 ${full ? 12 : 10.5}px ${SANS}`; ctx.fillStyle = DIM;
    const t1 = mode === "count" ? `우편함 1칸 = ${fmtN(N)} 세대 · 층 = 세대주 나이` : `한 줄 = 그 나이·성별 주민 전체 · 불 켜진 칸 = 1인 세대`;
    ctx.fillText(t1, full ? 24 : 12, full ? 58 : 45);
    // tag legend
    const lx = full ? 24 : 12, ly = full ? 76 : 62;
    [[MEN, "남성 (위 줄)"], [WOM, "여성 (아래 줄)"]].forEach(([c, t], i) => {
      const x = lx + i * (full ? 110 : 96);
      ctx.fillStyle = M_BASE; ctx.fillRect(x, ly - 9, 16, 11); ctx.fillStyle = c; ctx.fillRect(x + 3, ly - 3, 10, 3);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11.5 : 10}px ${SANS}`; ctx.fillText(t, x + 22, ly);
    });
  }

  function panelCount(ctx, w, h, d, r) {
    const x = w * 0.7, s = (i0, i1) => r.band.slice(i0, i1 + 1).reduce((a, b) => a + b, 0);
    const top = r.band.indexOf(Math.max(...r.band));
    ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText(`${r.n} 1인 세대 · ${ymL(d.ym[1])}`, x, 108);
    ctx.fillStyle = INK; ctx.font = `800 36px ${SANS}`; ctx.fillText(KF.fmt(r.tot), x, 146);
    if (r.hh) { ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText(`전체 세대의 ${(r.tot / r.hh * 100).toFixed(1)}%`, x, 168); }
    // young vs old share bar
    const yv = s(1, 2) / r.tot, ov = s(5, 8) / r.tot, bw = w - x - 30, by = 214;
    ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("1인 세대 가운데", x, by - 14);
    ctx.fillStyle = "#7fd6c9"; ctx.fillRect(x, by, bw * yv, 12);
    ctx.fillStyle = "rgba(238,241,242,.16)"; ctx.fillRect(x + bw * yv, by, bw * (1 - yv - ov), 12);
    ctx.fillStyle = "#f2cf6b"; ctx.fillRect(x + bw * (1 - ov), by, bw * ov, 12);
    ctx.font = `700 20px ${SANS}`; ctx.fillStyle = "#7fd6c9"; ctx.fillText(`${(yv * 100).toFixed(1)}%`, x, by + 38);
    ctx.textAlign = "right"; ctx.fillStyle = "#f2cf6b"; ctx.fillText(`${(ov * 100).toFixed(1)}%`, x + bw, by + 38);
    ctx.font = `500 11.5px ${SANS}`; ctx.fillStyle = DIM; ctx.textAlign = "left"; ctx.fillText("20–30대", x, by + 56);
    ctx.textAlign = "right"; ctx.fillText("60대 이상", x + bw, by + 56);
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("가장 긴 층", x, by + 96);
    ctx.fillStyle = INK; ctx.font = `700 20px ${SANS}`; ctx.fillText(`${d.bands[top]} ${KF.fmt(r.band[top])}`, x, by + 122);
    ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
    ctx.fillText(`${ymL(d.ym[0])} 대비 ${sg((r.band[top] / (r.o0.m[top] + r.o0.f[top]) - 1) * 100)}`, x, by + 142);
    if (r.n === "전국") { // elderly living alone, 2010–2024 (보건복지부)
      const E = d.elderly, sx = x, sy = h - 74, sw = bw, sh = 40, mx = Math.max(...E.v), n = E.v.length;
      const px = (i) => sx + (i / (n - 1)) * sw, py = (v) => sy + sh - (v / mx) * sh;
      ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(`혼자 사는 65세 이상 (추계) ${E.years[0]}–${E.years[n - 1]}`, sx, sy - 22);
      ctx.fillStyle = "rgba(242,207,107,.14)"; ctx.beginPath(); ctx.moveTo(px(0), sy + sh);
      E.v.forEach((v, i) => ctx.lineTo(px(i), py(v))); ctx.lineTo(px(n - 1), sy + sh); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#f2cf6b"; ctx.lineWidth = 2; ctx.beginPath();
      E.v.forEach((v, i) => (i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v)))); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = `600 11px ${MONO}`;
      ctx.fillText(`${Math.round(E.v[0] / 10000)}만`, sx, py(E.v[0]) - 6);
      ctx.textAlign = "right"; ctx.fillText(`${Math.round(E.v[n - 1] / 10000)}만`, sx + sw, py(E.v[n - 1]) - 6);
      ctx.fillStyle = DIM; ctx.font = `500 10px ${MONO}`; ctx.textAlign = "left"; ctx.fillText(String(E.years[0]), sx, sy + sh + 13);
      ctx.textAlign = "right"; ctx.fillText(String(E.years[n - 1]), sx + sw, sy + sh + 13); ctx.textAlign = "left";
    }
  }

  function panelRate(ctx, w, h, d, r) {
    const x = w * 0.7;
    const rows = [];
    for (const k of ["m", "f"]) for (let i = 1; i < 9; i++) rows.push([k, i, r.p[k][i] ? r.o[k][i] / r.p[k][i] : 0]);
    rows.sort((a, b) => b[2] - a[2]);
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
    ctx.fillText(`${r.n} · 1인 세대 비율이 높은 무리`, x, 108);
    rows.slice(0, 4).forEach(([k, i, v], j) => {
      const y = 146 + j * 46;
      ctx.fillStyle = TAGC[k]; ctx.font = `800 ${j ? 22 : 30}px ${SANS}`; ctx.fillText(`${(v * 100).toFixed(1)}%`, x, y);
      ctx.fillStyle = INK; ctx.font = `600 13px ${SANS}`; ctx.fillText(`${d.bands[i]} ${SX[k]}`, x + (j ? 88 : 118), y - 2);
    });
    const low = rows.filter(([, i]) => i >= 1).slice(-1)[0];
    ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("가장 낮은 성인 무리", x, 350);
    ctx.fillStyle = TAGC[low[0]]; ctx.font = `700 20px ${SANS}`; ctx.fillText(`${(low[2] * 100).toFixed(1)}%`, x, 376);
    ctx.fillStyle = INK; ctx.font = `600 13px ${SANS}`; ctx.fillText(`${d.bands[low[1]]} ${SX[low[0]]}`, x + 80, 374);
    ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`;
    ctx.fillText("분모 = 같은 달 같은 나이·성별 주민등록 인구", x, h - 40);
  }

  // ---------------------------------------------------------------- 시군구 view
  function sggView(ctx, w, h, d, X, el, full, hover) {
    const order = d.order, x0 = full ? 70 : 44, x1 = full ? w * 0.66 : w - 12, y0 = full ? 70 : 64, y1 = full ? h - 24 : h - 70;
    const maxN = Math.max(...order.map((s) => X.sgg.filter((g) => g.s === s).length));
    const gap = full ? 2 : 1.2, bw = Math.min(full ? 22 : 12, (x1 - x0 - (maxN - 1) * gap) / maxN);
    const rh = (y1 - y0) / order.length, bh = Math.min(rh - (full ? 5 : 3), bw * 1.3);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
    ctx.fillText(full ? `시군구 ${X.sgg.length}곳의 우편함` : `시군구 ${X.sgg.length}곳`, full ? 24 : 12, full ? 36 : 26);
    ctx.font = `500 ${full ? 12 : 10}px ${SANS}`; ctx.fillStyle = DIM;
    ctx.fillText(full ? "우편함 1칸 = 시군구 하나 · 이름표 색 = 그곳 1인 세대에서 가장 큰 무리의 나이 · 줄 안에서는 젊은 곳부터" : "1칸 = 시군구 · 이름표 색 = 가장 큰 무리의 나이", full ? 24 : 12, full ? 56 : 44);
    let hit = null;
    order.forEach((s, ri) => {
      const y = y0 + ri * rh, list = X.sgg.filter((g) => g.s === s).sort((a, b) => (b.y - b.o) - (a.y - a.o));
      ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 11.5 : 9.5}px ${SANS}`;
      ctx.fillText(s, x0 - (full ? 10 : 5), y + bh * 0.72);
      list.forEach((g, j) => {
        const x = x0 + j * (bw + gap), prog = KF.clamp((el - 0.1 - ri * 0.05 - j * 0.02) / 0.35, 0, 1);
        if (prog <= 0) return;
        const isHover = hover && hover[0] >= x && hover[0] < x + bw + gap && hover[1] >= y && hover[1] < y + rh;
        if (isHover) hit = { g, x, y };
        box(ctx, x, y, bw, bh, AGE_C[ageClass(g.top[1])], true, prog);
        if (isHover) { ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(x - 1, y - 1, bw + 2, bh + 2); }
      });
    });
    // the two ends: the youngest and the oldest one-person wall
    const yg = X.sgg.reduce((a, b) => (b.y > a.y ? b : a)), og = X.sgg.reduce((a, b) => (b.o > a.o ? b : a));
    if (full) for (const [g, c] of [[yg, AGE_C[0]], [og, AGE_C[3]]]) {
      const ri = order.indexOf(g.s), list = X.sgg.filter((q) => q.s === g.s).sort((a, b) => (b.y - b.o) - (a.y - a.o)), j = list.indexOf(g);
      const x = x0 + j * (bw + gap), y = y0 + ri * rh;
      if (el > 1.4) { ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.strokeRect(x - 2, y - 2, bw + 4, bh + 4); }
    }
    // legend + counts
    const cnt = [0, 0, 0, 0]; X.sgg.forEach((g) => cnt[ageClass(g.top[1])]++);
    if (full) {
      const x = w * 0.7;
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("가장 큰 1인 세대 무리의 나이", x, 100);
      AGE_L.forEach((t, i) => {
        const y = 126 + i * 30;
        box(ctx, x, y - 14, 18, 20, AGE_C[i], true);
        ctx.fillStyle = INK; ctx.font = `600 13px ${SANS}`; ctx.fillText(t, x + 28, y);
        ctx.fillStyle = AGE_C[i]; ctx.font = `700 13px ${MONO}`; ctx.fillText(`${cnt[i]}곳`, x + 120, y);
      });
      ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("성별까지 나눈 가장 큰 무리", x, 276);
      d.sum.dom.slice(0, 5).forEach(([k, i, n], j) => {
        const y = 302 + j * 24;
        ctx.fillStyle = TAGC[k]; ctx.font = `700 14px ${SANS}`; ctx.fillText(`${d.bands[i]} ${SX[k]}`, x, y);
        ctx.fillStyle = INK; ctx.font = `600 13px ${MONO}`; ctx.fillText(`${n}곳`, x + 110, y);
      });
      const nm = (g) => (g.s === "세종" ? g.n : `${g.s} ${g.n}`);
      ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("양 끝 (테두리)", x, h - 88);
      ctx.fillStyle = AGE_C[0]; ctx.font = `600 12.5px ${SANS}`; ctx.fillText(`${nm(yg)} · 20–30대 ${(yg.y * 100).toFixed(0)}%`, x, h - 66);
      ctx.fillStyle = AGE_C[3]; ctx.fillText(`${nm(og)} · 70대 이상 ${(og.o * 100).toFixed(0)}%`, x, h - 44);
    } else {
      const y = h - 44;
      AGE_L.forEach((t, i) => {
        const x = 12 + (i % 2) * ((w - 24) / 2), yy = y + Math.floor(i / 2) * 20;
        box(ctx, x, yy - 10, 12, 13, AGE_C[i], true);
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 11px ${SANS}`; ctx.fillText(`${t} ${cnt[i]}곳`, x + 18, yy);
      });
    }
    return hit;
  }

  // ---------------------------------------------------------------- tooltip
  function tip(ctx, w, h, lines, p) {
    const fs = 12;
    const width = (t, k) => { ctx.font = `${k === 1 ? 700 : 500} ${k === 1 ? 13 : fs}px ${SANS}`; return ctx.measureText(t).width; };
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => width(t, k))) + 22), bh = 12 + lines.length * 19;
    const bx = KF.clamp(p[0] + 16 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 16, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(24,30,34,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(223,228,231,.6)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => {
      ctx.fillStyle = k === 1 ? INK : k === 2 ? MEN : k === 3 ? WOM : DIM;
      ctx.font = `${k === 1 ? 700 : 500} ${k === 1 ? 13 : fs}px ${SANS}`; ctx.fillText(t, bx + 11, by + 22 + j * 19);
    });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const X = prep(d), r = X.reg[0], c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const x0 = w * 0.43, x1 = w - 12, y0 = h * 0.07, y1 = h * 0.95, C = 15, gap = 1.4, fg = 3;
    const rowH = (y1 - y0 - 8 * fg) / 18, bw = (x1 - x0 - (C - 1) * gap) / C, N = pickN(r.max, C);
    for (let fl = 0; fl < 9; fl++) for (const k of ["m", "f"]) {
      const y = y0 + (8 - fl) * (2 * rowH + fg) + (k === "f" ? rowH : 0), n = r.o[k][fl] / N;
      const prog = KF.ease(KF.clamp((c - 0.1 - fl * 0.16) / 1.1, 0, 1)), shown = n * prog;
      ctx.strokeStyle = "rgba(238,241,242,.08)"; ctx.lineWidth = 1;
      for (let j = 0; j < C; j++) {
        const x = x0 + j * (bw + gap), fr = KF.clamp(shown - j, 0, 1);
        if (fr < 1) ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, rowH - gap - 1);
        if (fr > 0) box(ctx, x, y, bw, rowH - gap, TAGC[k], true, fr);
      }
    }
    const a = KF.clamp((c - 2.2) / 0.5, 0, 1), fy = y0 + (8 - 5) * (2 * rowH + fg);
    if (a > 0) { ctx.strokeStyle = `rgba(242,207,107,${a})`; ctx.lineWidth = 1.6; ctx.strokeRect(x0 - 3, fy - 2, C * (bw + gap) + 3, 2 * rowH + 2); }
    ctx.textAlign = "left"; const tx = w * 0.05;
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText("1인 세대가 가장 많은", tx, h * 0.33);
    ctx.fillStyle = "#f2cf6b"; ctx.font = `800 ${Math.round(h * 0.17)}px ${SANS}`; ctx.fillText("60대", tx, h * 0.33 + h * 0.18);
    const yv = (r.band[1] + r.band[2]) / r.tot * 100, ov = r.band.slice(5).reduce((p, q) => p + q, 0) / r.tot * 100;
    ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`;
    ctx.fillStyle = "#7fd6c9"; ctx.fillText(`20–30대 ${yv.toFixed(0)}%`, tx, h * 0.66);
    ctx.fillStyle = "#f2cf6b"; ctx.fillText(`60대 이상 ${ov.toFixed(0)}%`, tx, h * 0.66 + h * 0.08);
    if (c > 9.4) { ctx.fillStyle = `rgba(35,41,46,${(c - 9.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = prep(d), s = KF.canvas(stage);
    let view = "count", reg = 0, t0 = performance.now(), hover = null, mix = 0;
    if (KF.reduced) t0 -= 1e5;
    KF.segment(controls, [{ id: "count", label: "나이·성별" }, { id: "rate", label: "혼자 사는 비율" }, { id: "sgg", label: "시군구" }], "count", (id) => {
      if ((view === "sgg") !== (id === "sgg")) t0 = performance.now();
      view = id; lab.style.display = id === "sgg" ? "none" : "";
    });
    const lab = document.createElement("label"), sel = document.createElement("select");
    X.reg.forEach((r, i) => { const o = document.createElement("option"); o.value = i; o.textContent = r.n; sel.appendChild(o); });
    sel.style.cssText = "font:inherit;background:transparent;color:inherit;border:0";
    lab.append("지역", sel); controls.append(lab);
    sel.onchange = () => { reg = +sel.value; t0 = performance.now(); };
    const at = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = at(e); });
    stage.addEventListener("pointerdown", (e) => { hover = at(e); });
    stage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hover = null; });
    let prev = performance.now();
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), dt = Math.min(0.1, (now - prev) / 1000); prev = now;
      const el = (now - t0) / 1000;
      mix += ((view === "rate" ? 1 : 0) - mix) * (1 - Math.exp(-dt * 4));
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const lg = ctx.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, "rgba(255,255,255,.035)"); lg.addColorStop(1, "rgba(0,0,0,.12)");
      ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
      if (view === "sgg") {
        const hit = sggView(ctx, w, h, d, X, el, full, hover);
        if (hit && hover) {
          const g = hit.g;
          tip(ctx, w, h, [[g.s === "세종" ? g.n : `${g.s} ${g.n}`, 1], [`1인 세대 ${KF.fmt(g.t)} · 전체 세대의 ${(g.t / g.hh * 100).toFixed(1)}%`, 0],
            ...g.top3.map(([k, i, v], j) => [`${j + 1}. ${d.bands[i]} ${SX[k]} ${KF.fmt(v)}`, k === "m" ? 2 : 3]),
            [`20–30대 ${(g.y * 100).toFixed(0)}% · 70대 이상 ${(g.o * 100).toFixed(0)}%`, 0]], hover);
        }
        return;
      }
      const r = X.reg[reg];
      const res = wall(ctx, w, h, d, X, r, view, el, full, hover, mix);
      header(ctx, w, d, r, res.N, mix < 0.5 ? "count" : "rate", full);
      if (full) (mix < 0.5 ? panelCount : panelRate)(ctx, w, h, d, r);
      else {
        ctx.textAlign = "right"; ctx.fillStyle = "#f2cf6b"; ctx.font = `800 20px ${SANS}`;
        if (mix < 0.5) {
          const top = r.band.indexOf(Math.max(...r.band));
          ctx.fillText(`${d.bands[top]} ${(r.band[top] / r.tot * 100).toFixed(1)}%`, w - 12, h - 26);
          ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.fillText("가장 긴 층", w - 12, h - 12);
        } else {
          ctx.fillStyle = WOM; ctx.fillText(`80대 여성 ${(r.o.f[7] / r.p.f[7] * 100).toFixed(1)}%`, w - 12, h - 26);
          ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.fillText("그 나이 여성 가운데 1인 세대", w - 12, h - 12);
        }
      }
      if (res.hit && hover) {
        const q = res.hit, v0 = r.o0[q.k][q.fl];
        tip(ctx, w, h, [[`${d.bands[q.fl]} ${SX[q.k]} · ${r.n}`, 1], [`1인 세대 ${KF.fmt(q.v)}`, q.k === "m" ? 2 : 3],
          [`그 나이 ${SX[q.k]} ${KF.fmt(q.p)}명 중 ${(q.rate * 100).toFixed(1)}%`, 0],
          [`${ymL(d.ym[0])} ${KF.fmt(v0)}세대 → ${v0 ? sg((q.v / v0 - 1) * 100) : "–"}`, 0]], hover);
      }
    });
  }

  VIZ["single-households"] = { thumb, mount, bg: BG };
})();
