// 30 civil-servants — "청사 층별 안내판". A lobby directory board: green felt with grooves, white plastic
// letters pressed into the slots. Each floor is one service area (or one grade); every white tile = 2,000
// quota posts (5,000 on phones). Amber tiles = posts added since the first year, hollow slots = posts lost.
(() => {
  const BG = "#1b2b24";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const WHITE = "#f3f0e6", DIM = "rgba(243,240,230,.62)", FAINT = "rgba(243,240,230,.3)", AMBER = "#f2b640", BRASS = "#c9a862";
  const hash = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  // ---------------------------------------------------------------- felt + frame (cached per size)
  let FELT = null;
  function felt(w, h, P, frame, top) {
    const key = `${w}x${h}x${P}x${frame}x${top}`;
    if (FELT && FELT.key === key) return FELT.c;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    const fg = g.createLinearGradient(0, 0, w, h);
    fg.addColorStop(0, "#9a7a40"); fg.addColorStop(0.35, "#dcc185"); fg.addColorStop(0.6, "#a8864a"); fg.addColorStop(1, "#6f5528");
    g.fillStyle = fg; g.fillRect(0, 0, w, h);
    g.fillStyle = BG; g.fillRect(frame, frame, w - 2 * frame, h - 2 * frame);
    // felt fibres
    for (let i = 0; i < (w * h) / 22; i++) {
      const x = frame + hash(i) * (w - 2 * frame), y = frame + hash(i + 0.5) * (h - 2 * frame);
      g.fillStyle = hash(i + 0.25) > 0.5 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.09)";
      g.fillRect(x, y, 1, 1);
    }
    // grooves: a dark slot with a faint lit lip under it
    for (let y = top; y < h - frame - 2; y += P) {
      g.fillStyle = "rgba(0,0,0,.34)"; g.fillRect(frame, y, w - 2 * frame, 1.2);
      g.fillStyle = "rgba(255,255,255,.045)"; g.fillRect(frame, y + 1.2, w - 2 * frame, 1);
    }
    // inner shadow of the frame
    const sh = 7;
    [[0, 1], [1, 0]].forEach(([vx, vy]) => {
      const lg = g.createLinearGradient(frame, frame, frame + vx * sh, frame + vy * sh);
      lg.addColorStop(0, "rgba(0,0,0,.45)"); lg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = lg; g.fillRect(frame, frame, vx ? sh : w - 2 * frame, vy ? sh : h - 2 * frame);
    });
    g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 1; g.strokeRect(frame - 0.5, frame - 0.5, w - 2 * frame + 1, h - 2 * frame + 1);
    FELT = { key, c };
    return c;
  }

  // ---------------------------------------------------------------- plastic letters
  const WC = new Map();
  const cw = (ctx, font, ch) => { const k = font + ch; let v = WC.get(k); if (v === undefined) { ctx.font = font; v = ctx.measureText(ch).width; WC.set(k, v); } return v; };
  function letters(ctx, s, x, y, size, o = {}) {
    const font = `${o.weight || 600} ${size}px ${o.mono ? MONO : SANS}`, track = o.track ?? size * 0.07;
    const chars = [...String(s)];
    let W = -track;
    for (const ch of chars) W += cw(ctx, font, ch) + track;
    if (o.measure) return W;
    let cx = o.align === "right" ? x - W : o.align === "center" ? x - W / 2 : x;
    ctx.font = font; ctx.textAlign = "left";
    const seed = o.seed || 1, a = (o.alpha ?? 1) * ctx.globalAlpha;
    chars.forEach((ch, i) => {
      const cwid = cw(ctx, font, ch);
      if (ch !== " ") {
        const r = hash(seed * 31 + i * 7.3) - 0.5, pop = o.pop === undefined ? 1 : KF.clamp(o.pop * chars.length - i, 0, 1);
        if (pop > 0) {
          ctx.save(); ctx.globalAlpha = a * pop;
          ctx.translate(cx + cwid / 2, y + r * 0.9 - (1 - pop) * 4); ctx.rotate(r * 0.045);
          ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillText(ch, -cwid / 2 + 0.8, 1.2);
          ctx.fillStyle = o.color || WHITE; ctx.fillText(ch, -cwid / 2, 0);
          ctx.restore();
        }
      }
      cx += cwid + track;
    });
    return W;
  }

  // one tile slot; fill fractions: white part a, amber part b, hollow part c (each 0..1 of the width)
  function tile(ctx, x, y, w, h, a, b, c) {
    if (c > 0.02) {
      ctx.strokeStyle = "rgba(243,240,230,.42)"; ctx.lineWidth = 0.8; ctx.setLineDash([1.5, 1.5]);
      ctx.strokeRect(x + (a + b) * w + 0.4, y + 0.4, Math.max(0.5, c * w - 0.8), h - 0.8); ctx.setLineDash([]);
    }
    if (a > 0.02) {
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(x + 0.7, y + 1, a * w, h);
      ctx.fillStyle = WHITE; ctx.fillRect(x, y, a * w, h);
      if (h > 6) { ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(x, y + h * 0.72, a * w, h * 0.28); }
    }
    if (b > 0.02) {
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(x + a * w + 0.7, y + 1, b * w, h);
      ctx.fillStyle = AMBER; ctx.fillRect(x + a * w, y, b * w, h);
      if (h > 6) { ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.fillRect(x + a * w, y + h * 0.72, b * w, h * 0.28); }
    }
  }

  // tiles of one floor: n = current value in tiles, b0 = first-year value in tiles
  function run(ctx, x0, y0, per, tw, th, gap, P, n, b0) {
    const N = Math.ceil(Math.max(n, b0) - 1e-6);
    for (let i = 0; i < N; i++) {
      const fill = KF.clamp(n - i, 0, 1), white = Math.min(fill, KF.clamp(b0 - i, 0, 1)), amber = fill - white;
      const hollow = Math.max(0, KF.clamp(b0 - i, 0, 1) - fill);
      if (fill <= 0 && hollow <= 0) continue;
      tile(ctx, x0 + (i % per) * (tw + gap), y0 + Math.floor(i / per) * P, tw, th, white, amber, hollow);
    }
  }

  // ---------------------------------------------------------------- data helpers
  const views = (d) => ({
    area: { rows: d.floors, badge: (i, n) => `${n - i}F` },
    grade: { rows: d.grades, badge: (i, n) => `${n - i}F` },
  });
  const yi = (d, y) => d.years.indexOf(y);
  const valAt = (row, d, f) => { // fractional year index f -> interpolated value
    const i = Math.floor(f), j = Math.min(d.years.length - 1, i + 1), k = f - i;
    return KF.lerp(row.v[i], row.v[j], k);
  };

  // ---------------------------------------------------------------- layout of the floors
  function plan(rows, unit, per) {
    return rows.map((r) => ({ r, lines: Math.max(1, Math.ceil(Math.max(...r.v) / unit / per - 1e-9)) }));
  }

  // draw the directory. f = fractional year index, fillK = 0..1 share of the first-year tiles placed (intro)
  function board(ctx, w, h, d, view, f, fillK, o) {
    const full = o.full, V = views(d)[view], rows = V.rows, n = rows.length;
    const unit = full ? 2000 : 5000;
    const frame = full ? 11 : 7;
    const L = {};
    if (full) {
      L.xs = Math.round(w * 0.68);                  // right edge of the floors
      L.lab = frame + 22; L.tx = frame + 196; L.numR = L.xs - 12;
      L.per = Math.floor((L.numR - 86 - L.tx) / 7);
    } else {
      L.xs = w - frame - 10; L.lab = frame + 12; L.tx = frame + 12; L.numR = w - frame - 12;
      L.per = Math.floor((L.numR - L.tx) / 7);
    }
    const lay = plan(rows, unit, L.per);
    const header = full ? 5 : 3, foot = full ? 1 : 7;
    const lines = lay.reduce((a, x) => a + x.lines + (full ? 0 : 1), 0) + (n - 1) + header + foot;
    const P = Math.min(full ? 22 : 16, Math.floor((h - 2 * frame - 6) / lines));
    const top = frame + 4;
    ctx.drawImage(felt(w, h, P, frame, top), 0, 0, w, h);
    const tw = 5.6, gap = 1.4, th = Math.round(P * 0.58);
    // header: "층별 안내" + year
    const year = d.years[Math.round(f)];
    const hy = top + P * (full ? 3 : 2) - 3;
    const hs = full ? Math.min(28, P * 1.45) : 17;
    let hx = L.lab;
    hx += letters(ctx, full ? "청사 층별 안내" : "층별 안내", hx, hy, hs, { weight: 700, seed: 3, pop: o.headPop }) + hs * 0.6;
    letters(ctx, `공무원 정원 ${year}`, hx, hy, hs, { weight: 700, seed: 5, color: AMBER, pop: o.headPop });
    if (full) {
      letters(ctx, view === "area" ? "분야별 · 조각 1개 = 2,000명" : "일반직 등 계급별 · 조각 1개 = 2,000명", L.lab, top + P * 4 - 4, 11, { weight: 500, color: DIM, seed: 9, mono: true, track: 0.4 });
    }
    // floors
    let g = header, hit = null;
    const out = [];
    lay.forEach((x, i) => {
      const r = x.r, v = valAt(r, d, f), v0 = r.v[0];
      const yLab = top + P * (g + 1) - 3;           // baseline of the floor's first line
      const yTile = full ? top + P * g + (P - th) / 2 + 0.5 : top + P * (g + 1) + (P - th) / 2 + 0.5;
      const k0 = KF.clamp(fillK * rows.length - i, 0, 1);  // intro: floors fill one after another
      run(ctx, L.tx, yTile, L.per, tw, th, gap, P, (k0 < 1 ? v0 * k0 : v) / unit, v0 * k0 / unit);
      // badge + label + number
      const badge = V.badge(i, n);
      letters(ctx, badge, L.lab, yLab, full ? 11.5 : 10, { weight: 700, color: BRASS, mono: true, seed: 20 + i, track: 0.5 });
      const lx = L.lab + (full ? 34 : 28);
      letters(ctx, r.short, lx, yLab, full ? 14.5 : 12, { weight: 600, seed: 40 + i });
      letters(ctx, `${KF.fmt(Math.round(v))}`, L.numR, yLab, full ? 14 : 12, { weight: 600, mono: true, align: "right", seed: 60 + i, track: 0.2 });
      const h0 = top + P * g, h1 = top + P * (g + x.lines + (full ? 0 : 1));
      out.push({ i, r, y0: h0, y1: h1 });
      if (o.hover && o.hover[1] >= h0 && o.hover[1] < h1 && o.hover[0] >= frame && o.hover[0] <= L.xs + 8) hit = { i, r, y0: h0, y1: h1 };
      g += x.lines + (full ? 0 : 1) + 1;
    });
    return { P, top, frame, L, unit, rows: out, hit, yEnd: top + P * g, lay };
  }

  // ---------------------------------------------------------------- right-hand notice (desktop)
  function notice(ctx, w, h, d, view, f, B, a) {
    const x0 = B.L.xs + 30, x1 = w - B.frame - 18, cw_ = x1 - x0, P = B.P;
    // brass divider
    const dg = ctx.createLinearGradient(B.L.xs + 10, 0, B.L.xs + 16, 0);
    dg.addColorStop(0, "#8e7036"); dg.addColorStop(0.5, "#e2c78c"); dg.addColorStop(1, "#7a5f2c");
    ctx.fillStyle = dg; ctx.fillRect(B.L.xs + 10, B.frame, 6, h - 2 * B.frame);
    const i = Math.round(f), y = d.years[i], y0 = d.years[0];
    ctx.save(); ctx.globalAlpha = a;
    let yy = B.top + P * 2 - 3;
    if (view === "area") {
      letters(ctx, "안내 · 정원 합계", x0, yy, 12, { weight: 600, color: DIM, seed: 101 });
      yy += P * 2 + 6;
      letters(ctx, `${KF.fmt(Math.round(valTot(d, f)))}명`, x0, yy, Math.min(34, cw_ / 7.5), { weight: 800, seed: 102 });
      yy += P + 8;
      const g = d.total[i] - d.total[0];
      ctx.fillStyle = DIM; ctx.font = `500 12.5px ${SANS}`; ctx.textAlign = "left";
      if (i > 0) { ctx.fillStyle = AMBER; ctx.fillText(`${y0}년보다 ${g >= 0 ? "+" : ""}${KF.fmt(g)}명 (${g >= 0 ? "+" : ""}${KF.fmt((d.total[i] / d.total[0] - 1) * 100, 1)}%)`, x0, yy); }
      else ctx.fillText("노란 조각은 이 해보다 늘어난 몫", x0, yy);
      yy += 20;
      ctx.fillStyle = WHITE; ctx.font = `500 12.5px ${SANS}`;
      ctx.fillText(`주민 1,000명당 ${KF.fmt(d.total[i] / d.pop[i] * 1000, 1)}명`, x0, yy);
      ctx.fillStyle = DIM; ctx.fillText(i > 0 ? `  (${y0}년 ${KF.fmt(d.total[0] / d.pop[0] * 1000, 1)}명)` : "", x0 + ctx.measureText(`주민 1,000명당 ${KF.fmt(d.total[i] / d.pop[i] * 1000, 1)}명`).width, yy);
      // where the growth went
      yy += P + 16;
      letters(ctx, i > 0 ? `늘어난 몫 · ${y0}→${y}` : "늘어난 몫", x0, yy, 12, { weight: 600, color: DIM, seed: 103 });
      yy += 12;
      const gains = d.floors.map((r) => r.v[i] - r.v[0]), G = gains.reduce((s, v) => s + v, 0);
      if (i > 0 && G > 0) {
        let bx = x0;
        const order = [1, 2, 3, 4, 0, 5];
        order.forEach((k) => {
          const gw = Math.max(0, gains[k]) / G * cw_;
          ctx.fillStyle = k === 1 || k === 2 ? AMBER : k === 3 ? "rgba(243,240,230,.85)" : "rgba(243,240,230,.5)";
          ctx.fillRect(bx, yy, Math.max(0, gw - 1.5), 12); bx += gw;
        });
        yy += 30;
        const pf = (gains[1] + gains[2]) / G * 100;
        const lines = [[`경찰·소방`, pf, AMBER], [d.floors[3].short, gains[3] / G * 100, WHITE], [d.floors[4].short, gains[4] / G * 100, DIM], [d.floors[0].short, gains[0] / G * 100, DIM]];
        lines.forEach(([t, v, c], j) => {
          ctx.fillStyle = c; ctx.font = `600 12.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(t, x0, yy + j * 19);
          ctx.font = `600 12.5px ${MONO}`; ctx.textAlign = "right"; ctx.fillText(`${KF.fmt(v, 1)}%`, x1, yy + j * 19);
        });
        ctx.textAlign = "left";
        yy += 4 * 19 + 6;
      } else yy += 26;
      // residents per officer, first year vs selected year
      yy += 18;
      letters(ctx, "1명이 맡는 주민", x0, yy, 12, { weight: 600, color: DIM, seed: 105 });
      [[1, "경찰"], [2, "소방"]].forEach(([k, t], j) => {
        const r0 = d.pop[0] / d.floors[k].v[0], r1 = d.pop[i] / d.floors[k].v[i], ly = yy + 22 + j * 19;
        ctx.fillStyle = WHITE; ctx.font = `600 12.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(t, x0, ly);
        ctx.font = `500 12.5px ${MONO}`; ctx.textAlign = "right";
        ctx.fillStyle = i > 0 ? DIM : WHITE; ctx.fillText(i > 0 ? `${KF.fmt(r0)} → ` : "", x1 - ctx.measureText(`${KF.fmt(r1)}명`).width, ly);
        ctx.fillStyle = WHITE; ctx.fillText(`${KF.fmt(r1)}명`, x1, ly);
      });
      ctx.textAlign = "left";
      yy += 22 + 2 * 19 + 10;
      // tile legend
      const lgY = yy + 4;
      [[1, 0, 0, `${y0}년 정원`], [0, 1, 0, "늘어난 몫"], [0, 0, 1, "줄어든 몫"]].forEach(([a1, b1, c1, t], j) => {
        const lx = x0 + j * (cw_ / 3);
        tile(ctx, lx, lgY - 9, 5.6, 11, a1, b1, c1); tile(ctx, lx + 7, lgY - 9, 5.6, 11, a1, b1, c1);
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText(t, lx + 18, lgY);
      });
      // yearly change strip
      const sy = h - B.frame - 26 - 54, sh = 44;
      yy = Math.min(yy, sy - 30);
      letters(ctx, "해마다 늘어난 정원", x0, sy - 14, 12, { weight: 600, color: DIM, seed: 104 });
      const inc = d.inc.slice(1), mx = Math.max(...inc), bw = cw_ / inc.length, base = sy + sh * 0.82;
      inc.forEach((v, j) => {
        const hh = (Math.abs(v) / mx) * sh * 0.8, on = j + 1 === i;
        ctx.fillStyle = v < 0 ? "rgba(243,240,230,.45)" : on ? AMBER : "rgba(242,182,64,.55)";
        ctx.fillRect(x0 + j * bw + bw * 0.2, v >= 0 ? base - hh : base, bw * 0.6, Math.max(1.2, hh));
        if (on || j === 0 || j === inc.length - 1) {
          ctx.fillStyle = on ? WHITE : DIM; ctx.font = `500 9.5px ${MONO}`; ctx.textAlign = "center";
          ctx.fillText(`'${String(d.years[j + 1]).slice(2)}`, x0 + j * bw + bw / 2, base + 14);
        }
      });
      ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, base + 0.5); ctx.lineTo(x1, base + 0.5); ctx.stroke();
      if (i > 0) {
        const v = d.inc[i];
        ctx.fillStyle = WHITE; ctx.font = `600 11px ${MONO}`; ctx.textAlign = "right";
        ctx.fillText(`${y}년 ${v >= 0 ? "+" : ""}${KF.fmt(v)}명`, x1, sy - 14);
      }
      ctx.textAlign = "left";
    } else {
      const G = d.grades, tot = (k) => G.reduce((s, r) => s + r.v[k], 0), mid = (k) => (G[3].v[k] + G[4].v[k]) / tot(k) * 100;
      letters(ctx, "안내 · 일반직 등 계급", x0, yy, 12, { weight: 600, color: DIM, seed: 111 });
      yy += P * 2 + 6;
      letters(ctx, `${KF.fmt(mid(i), 1)}%`, x0, yy, 34, { weight: 800, seed: 112, color: AMBER });
      yy += P + 8;
      ctx.fillStyle = WHITE; ctx.font = `500 12.5px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(`6·7급이 계급별 정원에서 차지하는 몫`, x0, yy);
      ctx.fillStyle = DIM; ctx.fillText(`${y0}년 ${KF.fmt(mid(0), 1)}%`, x0, yy + 19);
      yy += 19 + P + 22;
      const nine = G[6];
      letters(ctx, `9급 ${KF.fmt(nine.v[i])}명`, x0, yy, 18, { weight: 700, seed: 113 });
      ctx.fillStyle = DIM; ctx.font = `500 12.5px ${SANS}`;
      ctx.fillText(i > 0 ? `${y0}년보다 ${nine.v[i] - nine.v[0] >= 0 ? "+" : ""}${KF.fmt(nine.v[i] - nine.v[0])}명 · 빈 홈 = 줄어든 자리` : "빈 홈 = 줄어든 자리", x0, yy + 21);
      yy += 21 + P + 18;
      // 6·7급 share, year by year
      const my = yy + 8, mh = 52, lo = 44, hi = 54, bw = cw_ / d.years.length;
      letters(ctx, "6·7급 몫, 해마다", x0, my - 6, 12, { weight: 600, color: DIM, seed: 115 });
      d.years.forEach((yr, j) => {
        const v = mid(j), hh = KF.clamp((v - lo) / (hi - lo), 0, 1) * mh, on = j === i;
        ctx.fillStyle = on ? AMBER : "rgba(242,182,64,.5)";
        ctx.fillRect(x0 + j * bw + bw * 0.18, my + 12 + mh - hh, bw * 0.64, hh);
        if (on || j === 0 || j === d.years.length - 1) {
          ctx.fillStyle = on ? WHITE : DIM; ctx.font = `500 9.5px ${MONO}`; ctx.textAlign = "center";
          ctx.fillText(`'${String(yr).slice(2)}`, x0 + j * bw + bw / 2, my + 12 + mh + 13);
        }
      });
      ctx.strokeStyle = FAINT; ctx.beginPath(); ctx.moveTo(x0, my + 12 + mh + 0.5); ctx.lineTo(x1, my + 12 + mh + 0.5); ctx.stroke();
      ctx.fillStyle = DIM; ctx.font = `500 9.5px ${MONO}`; ctx.textAlign = "right"; ctx.fillText(`세로 ${lo}–${hi}%`, x1, my - 6);
      ctx.textAlign = "left";
      // share of each grade, first year vs selected year
      const sy = h - B.frame - 40 - 7 * 17;
      letters(ctx, `계급별 몫 · ${y0} → ${y}`, x0, sy - 10, 12, { weight: 600, color: DIM, seed: 114 });
      G.forEach((r, j) => {
        const s0 = r.v[0] / tot(0) * 100, s1 = r.v[i] / tot(i) * 100, yy2 = sy + 8 + j * 17;
        ctx.fillStyle = WHITE; ctx.font = `500 11.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(r.short, x0, yy2 + 9);
        const bx = x0 + 70, bwm = cw_ - 70 - 64;
        ctx.fillStyle = "rgba(243,240,230,.28)"; ctx.fillRect(bx, yy2, s0 / 30 * bwm, 4);
        ctx.fillStyle = s1 >= s0 ? AMBER : WHITE; ctx.fillRect(bx, yy2 + 6, s1 / 30 * bwm, 5);
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${MONO}`; ctx.textAlign = "right"; ctx.fillText(`${KF.fmt(s1, 1)}%`, x1, yy2 + 10);
      });
      ctx.textAlign = "left";
    }
    ctx.restore();
  }
  const valTot = (d, f) => { const i = Math.floor(f), j = Math.min(d.years.length - 1, i + 1); return KF.lerp(d.total[i], d.total[j], f - i); };

  // phone: notice under the floors
  function phoneNotice(ctx, w, h, d, view, f, B) {
    const i = Math.round(f), y0 = d.years[0], x0 = B.L.lab, x1 = w - B.frame - 12;
    let yy = Math.max(B.yEnd + 8, h - B.frame - 74);
    ctx.textAlign = "left";
    if (view === "area") {
      const g = d.total[i] - d.total[0];
      letters(ctx, `합계 ${KF.fmt(Math.round(valTot(d, f)))}명`, x0, yy + 4, 15, { weight: 700, seed: 201 });
      ctx.fillStyle = AMBER; ctx.font = `600 11.5px ${SANS}`;
      ctx.fillText(i > 0 ? `${y0}년보다 ${g >= 0 ? "+" : ""}${KF.fmt(g)}명` : "노란 조각 = 늘어난 몫", x0, yy + 24);
      const gains = d.floors.map((r) => r.v[i] - r.v[0]), G = gains.reduce((s, v) => s + v, 0);
      ctx.fillStyle = WHITE; ctx.font = `500 11.5px ${SANS}`;
      if (i > 0 && G > 0) ctx.fillText(`늘어난 몫: 경찰·소방 ${KF.fmt((gains[1] + gains[2]) / G * 100, 1)}% · ${d.floors[3].short} ${KF.fmt(gains[3] / G * 100, 1)}%`, x0, yy + 43);
      ctx.fillStyle = DIM; ctx.font = `500 10px ${MONO}`;
      ctx.fillText(`조각 1개 = ${KF.fmt(B.unit)}명 · 주민 1,000명당 ${KF.fmt(d.total[i] / d.pop[i] * 1000, 1)}명`, x0, yy + 60);
    } else {
      const G = d.grades, tot = (k) => G.reduce((s, r) => s + r.v[k], 0), mid = (k) => (G[3].v[k] + G[4].v[k]) / tot(k) * 100;
      letters(ctx, `6·7급 몫 ${KF.fmt(mid(i), 1)}%`, x0, yy + 4, 15, { weight: 700, seed: 211, color: AMBER });
      ctx.fillStyle = WHITE; ctx.font = `500 11.5px ${SANS}`;
      ctx.fillText(`${y0}년 ${KF.fmt(mid(0), 1)}% · 9급 ${KF.fmt(G[6].v[0])} → ${KF.fmt(G[6].v[i])}명`, x0, yy + 24);
      ctx.fillStyle = DIM; ctx.font = `500 10px ${MONO}`;
      ctx.fillText(`일반직 등 계급별 · 조각 1개 = ${KF.fmt(B.unit)}명 · 빈 홈 = 줄어든 자리`, x0, yy + 43);
    }
  }

  function tip(ctx, w, h, d, view, f, hit, p) {
    const i = Math.round(f), y = d.years[i], y0 = d.years[0], r = hit.r, v = r.v[i], v0 = r.v[0];
    const tot = view === "area" ? d.total[i] : d.grades.reduce((s, q) => s + q.v[i], 0);
    const lines = [[`${r.label} · ${y}년`, WHITE, 700], [`정원 ${KF.fmt(v)}명 (${view === "area" ? "전체" : "계급별 정원"}의 ${KF.fmt(v / tot * 100, 1)}%)`, WHITE, 500]];
    if (i > 0) lines.push([`${y0}년 ${KF.fmt(v0)}명 → ${v - v0 >= 0 ? "+" : ""}${KF.fmt(v - v0)}명 (${v - v0 >= 0 ? "+" : ""}${KF.fmt((v / v0 - 1) * 100, 1)}%)`, v >= v0 ? AMBER : WHITE, 600]);
    if (view === "area") {
      lines.push([`주민 1만 명당 ${KF.fmt(v / d.pop[i] * 10000, 1)}명`, DIM, 500]);
      if (i > 0) { const G = d.total[i] - d.total[0]; if (G > 0) lines.push([`늘어난 정원 가운데 ${KF.fmt((v - v0) / G * 100, 1)}%`, DIM, 500]); }
    }
    const fs = 12;
    ctx.font = `600 ${fs}px ${SANS}`;
    const bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 24, bh = 12 + lines.length * (fs + 7);
    const bx = KF.clamp(p[0] + 16 + bw > w - 8 ? p[0] - bw - 16 : p[0] + 16, 8, w - bw - 8), by = KF.clamp(p[1] - bh - 12, 8, h - bh - 8);
    ctx.fillStyle = "rgba(14,24,20,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = BRASS; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c, wt], k) => { ctx.fillStyle = c; ctx.font = `${wt} ${fs}px ${SANS}`; ctx.fillText(t, bx + 12, by + 8 + (k + 1) * (fs + 7) - 4); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const c = t % 10, frame = 6, n = d.years.length - 1, top = frame + 24;   // clear of the card's data badge
    const unit = 5000, xs = w * 0.6, lx = frame + 9, tx = frame + 42, tw = 2.9, gap = 0.9, per = Math.floor((xs - tx) / (tw + gap));
    const lines = d.floors.map((r) => Math.max(1, Math.ceil(Math.max(...r.v) / unit / per - 1e-9)));
    const P = Math.floor((h - 50 - top) / (lines.reduce((a, b) => a + b, 0) + 0.45 * (lines.length - 1)));
    ctx.drawImage(felt(w, h, P, frame, top), 0, 0, w, h);
    const base = KF.clamp(c / 1.0, 0, 1), grow = KF.ease(KF.clamp((c - 1.0) / 2.0, 0, 1)), f = grow * n;
    const th = Math.max(3, P * 0.62), SHORT = ["교원", "경찰", "소방", "지방", "중앙", "국회 등"];
    let g = 0;
    d.floors.forEach((r, i) => {
      const v = valAt(r, d, f), v0 = r.v[0], k0 = KF.clamp(base * 6 - i, 0, 1), y0 = top + P * g;
      ctx.fillStyle = WHITE; ctx.font = `600 ${Math.max(8.5, Math.min(11, P * 0.78))}px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(SHORT[i], lx, y0 + P * 0.5 + th * 0.42);
      run(ctx, tx, y0 + (P - th) / 2, per, tw, th, gap, P, (k0 < 1 ? v0 * k0 : v) / unit, v0 * k0 / unit);
      g += lines[i] + 0.45;
    });
    const x0 = xs + w * 0.04, X1 = w - frame - 10, a = KF.clamp((c - 0.6) / 0.6, 0, 1) * (c > 9.4 ? 1 - (c - 9.4) / 0.6 : 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText(`${d.years[0]}→${d.years[n]} 늘어난 정원`, x0, h * 0.24);
    ctx.fillStyle = WHITE; ctx.font = `800 ${Math.round(h * 0.13)}px ${SANS}`; ctx.fillText(`${KF.fmt(d.sum.gain / 10000, 1)}만 명`, x0, h * 0.24 + h * 0.14);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText("그중 경찰·소방", x0, h * 0.6);
    ctx.fillStyle = AMBER; ctx.font = `800 ${Math.round(h * 0.13)}px ${SANS}`; ctx.fillText(`${KF.fmt(d.sum.pfShare, 0)}%`, x0, h * 0.6 + h * 0.14);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.045)}px ${MONO}`; ctx.fillText(`${d.years[Math.round(f)]}`, X1 - ctx.measureText("0000").width, h - frame - 10);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage), n = d.years.length - 1;
    let view = "area", f = 0, target = n, t0 = performance.now(), intro = true, hover = null, shown = -1;
    KF.segment(controls, [{ id: "area", label: "분야별" }, { id: "grade", label: "직급별" }], "area", (id) => { view = id; });
    const range = document.createElement("input"); range.type = "range"; range.min = d.years[0]; range.max = d.years[n]; range.step = 1; range.value = d.years[n];
    const lab = document.createElement("label"); lab.append("연도", range);
    const out = document.createElement("span"); out.className = "readout";
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "▶ 다시 꽂기";
    controls.append(lab, out, replay);
    range.oninput = () => { intro = false; target = +range.value - d.years[0]; };
    replay.onclick = () => { intro = true; t0 = performance.now(); f = 0; target = n; };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });
    let last = performance.now();
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const el = (now - t0) / 1000;
      let fillK = 1, headPop = 1;
      if (intro) {
        headPop = KF.clamp(el / 0.7, 0, 1);
        fillK = KF.clamp((el - 0.3) / 1.6, 0, 1);
        f = KF.ease(KF.clamp((el - 2.1) / 2.9, 0, 1)) * n;
        if (el > 5.1) { intro = false; f = target = n; }
      } else f += (target - f) * (1 - Math.exp(-dt * 6));
      if (Math.abs(target - f) < 0.002) f = target;
      const yr = d.years[Math.round(f)];
      if (yr !== shown) { shown = yr; range.value = yr; out.textContent = `${yr}년`; }
      const B = board(ctx, w, h, d, view, f, fillK, { full, hover, headPop });
      if (full) notice(ctx, w, h, d, view, f, B, KF.clamp((el - 1.4) / 0.8, 0, 1) || (intro ? 0 : 1));
      else phoneNotice(ctx, w, h, d, view, f, B);
      if (B.hit && hover && !intro) {
        ctx.strokeStyle = "rgba(242,182,64,.55)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.strokeRect(B.frame + 5.5, B.hit.y0 + 1.5, B.L.xs - B.frame - 4, B.hit.y1 - B.hit.y0 - 3); ctx.setLineDash([]);
        tip(ctx, w, h, d, view, f, B.hit, hover);
      }
    });
  }

  VIZ["civil-servants"] = { thumb, mount, bg: BG };
})();
