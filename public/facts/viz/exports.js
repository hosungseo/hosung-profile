// 28 exports — "컨테이너 부두". A container terminal seen from above: one concrete pier per 시도 reaching into
// dark harbour water, one container per 20억 달러 of that year's exports, coloured by product. Semiconductor
// boxes are loaded first, at the root of each pier. Year slider 2000–2025, a product highlight, and a terminal
// board with the semiconductor / capital-region shares and where chips and cars went.
(() => {
  const BG = "#17333b";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  // validated order (adjacent CVD ≥ 8, normal ≥ 15 on the deck colour): chip, machinery, electronics, cars,
  // ships, petro-chem, metals, other (grey on purpose)
  const COL = ["#e8622f", "#2f74c8", "#e3a21a", "#22a77a", "#4d3d9e", "#de7aa0", "#1f7f2a", "#87837a"];
  const LAND = "#cdc8bb", LAND_EDGE = "#8e897c", DECK = "#d9d5cb", DECK_EDGE = "#a29d90", INK = "#1d2326", INK2 = "rgba(29,35,38,.62)";
  const BOARD = "#0c181c", AMBER = "#ffb54a", LED = "#e8efec", DIM = "rgba(232,239,236,.56)", FAINT = "rgba(232,239,236,.16)";
  const HI = [{ id: -1, label: "모든 품목" }, { id: 0, label: "반도체" }, { id: 3, label: "자동차" }, { id: 5, label: "석유·화학" }, { id: 4, label: "선박" }, { id: 1, label: "기계" }];

  function apportion(v, n) { // largest remainder: integer counts per group that add up to n
    const tot = v.reduce((a, b) => a + b, 0);
    if (!tot || n <= 0) return { cnt: v.map(() => 0), rem: v.map((x) => x) };
    const raw = v.map((x) => (x / tot) * n), cnt = raw.map(Math.floor);
    let left = n - cnt.reduce((a, b) => a + b, 0);
    raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { cnt[i]++; left--; } });
    return { cnt, rem: raw.map((x, i) => x - cnt[i]) };
  }

  const CARGO = new Map();
  function cargo(d, yi, si) { // containers of one pier: group per whole box + one part-filled box for the rest
    const key = yi * 100 + si;
    if (CARGO.has(key)) return CARGO.get(key);
    const t = d.tot[yi][si], units = t / d.unit, n = Math.floor(units), frac = units - n;
    const { cnt, rem } = apportion(d.mix[yi][si], n), seq = [];
    cnt.forEach((c, g) => { for (let k = 0; k < c; k++) seq.push(g); });
    const fg = frac > 0.03 ? rem.indexOf(Math.max(...rem)) : -1;
    const out = { seq, frac: fg < 0 ? 0 : frac, fg, t, units };
    CARGO.set(key, out);
    return out;
  }

  // ------------------------------------------------------------------ layout
  function layout(d, w, h, mode) {
    const full = mode === "full", thumb = mode === "thumb";
    const N = thumb ? 12 : d.sido.length;
    const land = full ? 92 : thumb ? Math.round(w * 0.075) : 46;
    const right = full ? 270 : thumb ? w * 0.44 : 0;
    const top = full ? 14 : thumb ? 32 : 8, bottom = full ? h - 14 : thumb ? h - 50 : Math.round(h * 0.67);
    const slot = (bottom - top) / N, tip = full ? 64 : thumb ? 6 : 40;
    const L = w - right - land - tip - (full ? 18 : 6) - 8;
    if (!d.maxU) d.maxU = Math.max(...d.tot.flat()) / d.unit;
    const pitch = L / Math.ceil(d.maxU + 1.2);
    const gap = pitch > 5 ? 1 : pitch > 3 ? 0.7 : 0.5, cw = pitch - gap;
    const ph = Math.min(slot * (full ? 0.64 : 0.68), full ? 21 : 14);
    const cl = Math.max(2, Math.min(ph - (full ? 5 : 3), cw * 2.6));
    const piers = [];
    for (let i = 0; i < N; i++) piers.push({ i, yc: top + slot * (i + 0.5) });
    return { full, thumb, mode, N, land, top, bottom, slot, pitch, gap, cw, ph, cl, x0: land + 5, right, piers };
  }

  // static layer: water, ripples, land strip (cached per size + mode)
  let ST = null;
  function statics(L, w, h, d) {
    const key = `${w}x${h}x${L.mode}`;
    if (ST && ST.key === key) return ST.c;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    g.fillStyle = BG; g.fillRect(0, 0, w, h);
    // water: soft light bands and short ripple strokes
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, "rgba(255,255,255,.03)"); grd.addColorStop(0.5, "rgba(0,0,0,0)"); grd.addColorStop(1, "rgba(0,0,0,.12)");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(190,225,225,.07)"; g.lineWidth = 1;
    for (let k = 0; k < (L.thumb ? 60 : 260); k++) {
      const x = L.land + r() * (w - L.land), y = r() * h, len = 6 + r() * 16;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + len / 2, y - 1.5, x + len, y); g.stroke();
    }
    // land strip (quay apron): concrete, crane rails, a painted safety line, the quay wall
    const lh = L.mode === "phone" ? L.bottom + 6 : h;                                     // phones: notes strip below
    g.fillStyle = LAND; g.fillRect(0, 0, L.land, lh);
    g.fillStyle = "rgba(0,0,0,.05)";
    for (let y = 0; y < lh; y += 26) g.fillRect(0, y, L.land, 1);                       // slab joints
    g.fillStyle = "rgba(60,55,45,.35)";
    if (!L.thumb) { g.fillRect(L.land - 13, 0, 1.2, lh); g.fillRect(L.land - 7, 0, 1.2, lh); } // crane rails
    g.fillStyle = "#d9b84a"; g.fillRect(L.land - 3.5, 0, 1.5, lh);                         // yellow edge line
    g.fillStyle = LAND_EDGE; g.fillRect(L.land - 1, 0, 2, lh);                             // quay wall
    g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(L.land + 1, 0, 3, lh);                     // wall shadow on water
    if (L.mode === "phone") { g.fillStyle = LAND_EDGE; g.fillRect(0, lh - 2, L.land + 1, 2); g.fillStyle = BOARD; g.fillRect(0, lh + 6, w, h - lh - 6); }
    ST = { key, c };
    return c;
  }

  // one container seen from above: long side across the pier, corrugated roof, darker door end
  function box(ctx, x, y, cw, cl, col, alpha, detail) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = col; ctx.fillRect(x, y, cw, cl);
    if (detail) {
      ctx.fillStyle = "rgba(0,0,0,.17)";
      for (let yy = y + 2.2; yy < y + cl - 1.5; yy += 2.4) ctx.fillRect(x + 0.7, yy, cw - 1.4, 0.7);
      ctx.fillStyle = "rgba(255,255,255,.28)"; ctx.fillRect(x, y, cw, 1);
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(x, y + cl - 1.3, cw, 1.3);
    }
    ctx.globalAlpha = 1;
  }

  // piers + cargo. `el` = seconds since loading began (Infinity = all loaded)
  function drawPiers(ctx, L, d, yi, el, hi) {
    const detail = L.full && L.cw >= 4.5, rate = 0.03, drop = 0.24;
    for (const p of L.piers) {
      const cg = cargo(d, yi, p.i), nBox = cg.seq.length + (cg.frac > 0 ? 1 : 0);
      const loaded = Math.min(nBox, Math.max(0, Math.floor((el - 0.15) / rate) + 1));
      const crane = L.full ? Math.max(9, L.pitch * 1.7) : 0, len = Math.max(nBox, 1) * L.pitch + 8 + crane;
      const deckLen = KF.lerp(Math.min(len, 18), len, KF.clamp((el - 0.05) / 0.6, 0, 1));
      const y0 = p.yc - L.ph / 2;
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(L.land, y0 + 3, deckLen + 3, L.ph);           // shadow on water
      ctx.fillStyle = DECK; ctx.fillRect(L.land, y0, deckLen, L.ph);
      ctx.fillStyle = DECK_EDGE; ctx.fillRect(L.land, y0 + L.ph - 1, deckLen, 1); ctx.fillRect(L.land + deckLen - 1, y0, 1, L.ph);
      if (L.full) { ctx.fillStyle = "rgba(60,55,45,.45)"; ctx.fillRect(L.land + deckLen - 4, y0 + 2, 2, 2); ctx.fillRect(L.land + deckLen - 4, y0 + L.ph - 5, 2, 2); } // bollards
      const cy = p.yc - L.cl / 2;
      p.end = L.land + deckLen; p.n = nBox; p.cg = cg;
      for (let k = 0; k < loaded; k++) {
        const g = k < cg.seq.length ? cg.seq[k] : cg.fg, part = k >= cg.seq.length;
        const x = L.x0 + k * L.pitch, a = hi < 0 || hi === g ? 1 : 0.14;
        const age = el - (0.15 + k * rate), s = KF.ease(KF.clamp(age / drop, 0, 1));
        if (s < 1) { // lowered by a crane: bigger (closer), shadow offset, fading in
          const sc = 1 + (1 - s) * 0.45, ww = L.cw * sc, hh = L.cl * sc, off = (1 - s) * 5;
          ctx.globalAlpha = 0.35 * s; ctx.fillStyle = "#000"; ctx.fillRect(x + off, cy + off, L.cw, L.cl); ctx.globalAlpha = 1;
          box(ctx, x + L.cw / 2 - ww / 2, p.yc - hh / 2, ww, hh, COL[g], a * s, false);
          continue;
        }
        if (part) { // the rest (< 1 box): outline + a part-filled floor
          ctx.globalAlpha = a; ctx.strokeStyle = COL[g]; ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, cy + 0.5, L.cw - 1, L.cl - 1);
          ctx.fillStyle = COL[g]; ctx.fillRect(x, cy + L.cl * (1 - cg.frac), L.cw, L.cl * cg.frac); ctx.globalAlpha = 1;
          continue;
        }
        box(ctx, x, cy, L.cw, L.cl, COL[g], a, detail);
      }
      if (crane) { // rubber-tyred gantry seen from above: yellow frame across the pier, dark trolley, shadow
        const cx = L.x0 + Math.min(loaded, nBox) * L.pitch + 1, fy = y0 - 3, fh = L.ph + 6;
        ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(cx + 3, fy + 4, crane, fh);
        ctx.strokeStyle = "#f0c23a"; ctx.lineWidth = 2; ctx.strokeRect(cx + 1, fy + 1, crane - 2, fh - 2);
        ctx.fillStyle = "#f0c23a"; ctx.fillRect(cx, fy + fh / 2 - 1, crane, 2);
        ctx.fillStyle = "#2a2a28"; ctx.fillRect(cx + crane / 2 - 2.5, fy + fh / 2 - 3, 5, 6);
      }
    }
  }

  function groupValue(d, yi, si, hi) { return hi < 0 ? d.tot[yi][si] : d.mix[yi][si][hi]; }

  function labels(ctx, L, d, yi, hi, alpha) {
    const fs = L.full ? 12.5 : 10.5;
    ctx.textBaseline = "middle";
    for (const p of L.piers) {
      const s = d.sido[p.i], capital = d.capital.includes(s);
      ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `${capital ? 700 : 600} ${fs}px ${SANS}`;
      ctx.fillText(s, L.land - (L.full ? 20 : 8), p.yc + 0.5);
      if (capital && L.full) { ctx.fillStyle = INK2; ctx.beginPath(); ctx.arc(L.land - (L.full ? 20 : 8) - ctx.measureText(s).width - 7, p.yc, 2.2, 0, 7); ctx.fill(); }
      if (p.end === undefined) continue;
      const v = groupValue(d, yi, p.i, hi);
      ctx.globalAlpha = alpha; ctx.textAlign = "left"; ctx.font = `500 ${L.full ? 11 : 9.5}px ${MONO}`;
      ctx.fillStyle = hi < 0 ? LED : v > 0 ? LED : DIM;
      const tv = d.tot[yi][p.i], fv = (x) => KF.fmt(x, x > 0 && x < 10 && x % 1 ? 1 : 0);
      ctx.fillText(hi < 0 || !L.full ? fv(v) : `${fv(v)} / ${fv(tv)}`, p.end + 6, p.yc + 0.5);
      ctx.globalAlpha = 1;
    }
    ctx.textBaseline = "alphabetic";
  }

  // ------------------------------------------------------------------ terminal board (desktop)
  function board(ctx, w, h, d, yi, hi, a) {
    const x0 = w - 258, y0 = 14, bw = 244, bh = h - 28, px = x0 + 16, pr = x0 + bw - 16;
    ctx.globalAlpha = a;
    ctx.fillStyle = BOARD; ctx.fillRect(x0, y0, bw, bh);
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = "rgba(232,239,236,.3)"; [[x0 + 6, y0 + 6], [x0 + bw - 6, y0 + 6], [x0 + 6, y0 + bh - 6], [x0 + bw - 6, y0 + bh - 6]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); });
    const yr = d.years[yi], nat = d.nat[yi];
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 10px ${MONO}`; ctx.fillText("EXPORT TERMINAL", px, y0 + 24);
    ctx.textAlign = "right"; ctx.fillText("수출 현황판", pr, y0 + 24);
    ctx.textAlign = "left"; ctx.fillStyle = AMBER; ctx.font = `600 30px ${MONO}`; ctx.fillText(String(yr), px, y0 + 58);
    ctx.textAlign = "right"; ctx.fillStyle = LED; ctx.font = `700 16px ${SANS}`; ctx.fillText(`${KF.fmt(nat)}억 달러`, pr, y0 + 57);
    ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`; ctx.fillText("그해 수출 · 컨테이너 1개 = 20억 달러", pr, y0 + 72);
    // KPIs: the highlighted product's share (default: semiconductors) and the capital region's share
    const g = hi < 0 ? 0 : hi, gs = (d.grp[yi][g] / nat) * 100;
    const kpi = (x, label, val, sw) => {
      ctx.textAlign = "left"; ctx.fillStyle = sw; ctx.fillRect(x, y0 + 93, 12, 2.5);
      ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(label, x + 16, y0 + 98);
      ctx.fillStyle = AMBER; ctx.font = `600 22px ${MONO}`; ctx.fillText(val, x, y0 + 123);
    };
    kpi(px, `${d.groups[g]} 몫`, `${gs.toFixed(1)}%`, COL[g]);
    kpi(px + 118, "수도권(•) 몫", `${d.cap[yi].toFixed(1)}%`, LED);
    // share lines 2000–2025, one axis 0–50%
    const cx0 = px + 22, cx1 = pr - 6, cy0 = y0 + 142, cy1 = y0 + 206, n = d.years.length;
    const X = (i) => cx0 + ((cx1 - cx0) * i) / (n - 1), Y = (v) => cy1 - ((cy1 - cy0) * v) / 50;
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.fillStyle = DIM; ctx.font = `500 9px ${MONO}`; ctx.textAlign = "right";
    [0, 25, 50].forEach((v) => { ctx.beginPath(); ctx.moveTo(cx0, Y(v) + 0.5); ctx.lineTo(cx1, Y(v) + 0.5); ctx.stroke(); ctx.fillText(`${v}%`, cx0 - 4, Y(v) + 3); });
    ctx.textAlign = "center"; ctx.fillText(String(d.years[0]), cx0, cy1 + 12); ctx.fillText(String(d.years[n - 1]), cx1, cy1 + 12);
    const series = [[d.grp.map((r, i) => (r[g] / d.nat[i]) * 100), COL[g]], [d.cap, LED]];
    series.forEach(([vals, col]) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
      vals.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.stroke();
    });
    ctx.strokeStyle = AMBER; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(X(yi) + 0.5, cy0 - 4); ctx.lineTo(X(yi) + 0.5, cy1); ctx.stroke(); ctx.setLineDash([]);
    series.forEach(([vals, col]) => { ctx.fillStyle = col; ctx.strokeStyle = BOARD; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(yi), Y(vals[yi]), 3.5, 0, 7); ctx.fill(); ctx.stroke(); });
    // cargo table: every product this year
    let y = y0 + 240;
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 9.5px ${MONO}`; ctx.fillText("품목", px, y);
    ctx.textAlign = "right"; ctx.fillText("억 달러", pr - 44, y); ctx.fillText("몫", pr, y);
    y += 6;
    const rows = [];
    d.groups.forEach((name, i) => {
      const yy = y + 6 + i * 18.5, v = d.grp[yi][i], on = hi < 0 || hi === i;
      ctx.globalAlpha = a * (on ? 1 : 0.45);
      ctx.fillStyle = COL[i]; ctx.fillRect(px, yy + 1, 12, 8);
      ctx.fillStyle = LED; ctx.textAlign = "left"; ctx.font = `${hi === i ? 700 : 500} 11.5px ${SANS}`; ctx.fillText(name, px + 18, yy + 9.5);
      ctx.textAlign = "right"; ctx.font = `500 11px ${MONO}`; ctx.fillText(KF.fmt(v), pr - 44, yy + 9.5);
      ctx.fillStyle = DIM; ctx.fillText(`${((v / nat) * 100).toFixed(1)}`, pr, yy + 9.5);
      rows.push([i, yy - 3, yy + 14]);
    });
    ctx.globalAlpha = a;
    // where the chips and the cars went (last year only)
    y += 6 + 8 * 18.5 + 18;
    const D = d.dest, dests = hi === 3 ? [["car", "승용차"]] : hi === 0 ? [["semi", "반도체"]] : [["semi", "반도체"], ["car", "승용차"]];
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`; ctx.fillText(`${D.year}년 행선지 (수출액 몫)`, px, y);
    dests.forEach(([k, lab], j) => {
      const yy = y + 10 + j * 44, list = D[k];
      ctx.fillStyle = LED; ctx.font = `600 11px ${SANS}`; ctx.fillText(lab, px, yy + 11);
      let x = px + 44; const W = pr - x;
      list.slice(0, 4).forEach(([name, , p], m) => {
        const ww = (W * p) / 100;
        ctx.fillStyle = m % 2 ? "rgba(232,239,236,.42)" : "rgba(232,239,236,.72)"; ctx.fillRect(x, yy + 3, ww - 1, 9);
        x += ww;
      });
      ctx.fillStyle = FAINT; ctx.fillRect(x, yy + 3, pr - x, 9);
      ctx.fillStyle = DIM; ctx.font = `500 9.5px ${SANS}`;
      ctx.fillText(list.slice(0, k === "semi" ? 4 : 3).map(([name, , p]) => `${name} ${Math.round(p)}`).join(" · ") + (k === "car" ? " …" : ""), px + 44, yy + 26);
    });
    ctx.globalAlpha = 1;
    return rows;
  }

  function phoneNotes(ctx, w, h, L, d, yi, hi) {
    let y = L.bottom + 30;
    const nat = d.nat[yi];
    ctx.textAlign = "left"; ctx.fillStyle = LED; ctx.font = `700 14px ${SANS}`;
    ctx.fillText(`${d.years[yi]} · 수출 ${KF.fmt(nat)}억 달러`, 12, y);
    y += 20; ctx.font = `500 11.5px ${SANS}`;
    const g = hi < 0 ? 0 : hi;
    ctx.fillStyle = AMBER; ctx.fillText(`${d.groups[g]} ${((d.grp[yi][g] / nat) * 100).toFixed(1)}% · 수도권 ${d.cap[yi].toFixed(1)}%`, 12, y);
    y += 17; ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`;
    ctx.fillText("컨테이너 1개 = 20억 달러 · 숫자 = 억 달러 · 굵은 이름 = 수도권", 12, y);
    y += 14;
    d.groups.forEach((name, i) => {
      const x = 12 + (i % 4) * ((w - 24) / 4), yy = y + Math.floor(i / 4) * 17;
      ctx.globalAlpha = hi < 0 || hi === i ? 1 : 0.4;
      ctx.fillStyle = COL[i]; ctx.fillRect(x, yy + 3, 10, 7);
      ctx.fillStyle = LED; ctx.font = `500 10px ${SANS}`; ctx.fillText(name, x + 14, yy + 10.5);
      ctx.globalAlpha = 1;
    });
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `600 12.5px ${SANS}`;
    let bw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${SANS}`;
    lines.slice(1).forEach((l) => { bw = Math.max(bw, ctx.measureText(l).width); });
    bw += 22;
    const bh = 12 + lines.length * 17, bx = KF.clamp(x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 12, 6, h - bh - 6);
    ctx.fillStyle = "rgba(246,244,238,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    lines.forEach((l, i) => { ctx.fillStyle = i ? INK : "#000"; ctx.font = i ? `500 11px ${SANS}` : `600 12.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(l, bx + 11, by + 18 + i * 17); });
  }

  // ------------------------------------------------------------------ thumb
  function thumb(ctx, w, h, t, d) {
    const L = layout(d, w, h, "thumb"), c = t % 10, yi = d.years.length - 1;
    ctx.drawImage(statics(L, w, h, d), 0, 0, w, h);
    drawPiers(ctx, L, d, yi, c < 0.2 ? 0 : (c - 0.2) * 1.15, -1);
    // three pier names so the order reads: 경기, 충남, 울산 above 서울
    ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.font = `700 ${Math.max(9, Math.round(h * 0.05))}px ${SANS}`;
    L.piers.slice(0, 4).forEach((p) => {
      if (p.end === undefined) return;
      ctx.fillStyle = LED; ctx.fillText(d.sido[p.i], p.end + 4, p.yc + 0.5);
    });
    ctx.textBaseline = "alphabetic";
    const X = w - 12, a = KF.clamp((c - 2.2) / 0.6, 0, 1), last = d.years[yi];
    ctx.globalAlpha = a; ctx.textAlign = "right";
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText(`${last}년 수출에서 반도체`, X, h * 0.2);
    ctx.fillStyle = AMBER; ctx.font = `700 ${Math.round(h * 0.17)}px ${MONO}`; ctx.fillText(`${Math.round(d.share[yi])}%`, X, h * 0.2 + h * 0.18);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText("수도권 밖 부두에서", X, h * 0.62);
    ctx.fillStyle = LED; ctx.font = `700 ${Math.round(h * 0.13)}px ${MONO}`; ctx.fillText(`${Math.round(100 - d.cap[yi])}%`, X, h * 0.62 + h * 0.15);
    ctx.globalAlpha = 1;
    if (c > 9.4) { ctx.fillStyle = BG; ctx.globalAlpha = (c - 9.4) / 0.6; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage), last = d.years.length - 1;
    let yi = last, hi = -1, t0 = performance.now(), hover = null, rows = [];
    KF.segment(controls, HI, -1, (id) => { hi = id; });
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = last; range.step = 1; range.value = last;
    const lab = document.createElement("label"), out = document.createElement("span");
    out.className = "readout"; out.textContent = String(d.years[last]);
    lab.append("연도", range, out);
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 싣기";
    replay.onclick = () => { t0 = performance.now(); };
    controls.append(lab, replay);
    range.oninput = () => { yi = +range.value; out.textContent = String(d.years[yi]); t0 = performance.now() - 60000; };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", (e) => {
      setHover(e);
      for (const [i, a, b] of rows) if (hover[1] >= a && hover[1] <= b && hover[0] > s.w - 258) { hi = hi === i ? -1 : i; syncButtons(); }
    });
    stage.addEventListener("pointerleave", () => { hover = null; });
    const syncButtons = () => [...controls.querySelectorAll("button")].slice(0, HI.length).forEach((b, k) => b.setAttribute("aria-pressed", String(HI[k].id === hi)));

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, L = layout(d, w, h, full ? "full" : "phone");
      const el = (performance.now() - t0) / 1000;
      ctx.drawImage(statics(L, w, h, d), 0, 0, w, h);
      drawPiers(ctx, L, d, yi, el, hi);
      const a = KF.clamp((el - 2.2) / 0.8, 0, 1);
      labels(ctx, L, d, yi, hi, KF.clamp((el - 0.4) / 1.2, 0, 1));
      if (full) rows = board(ctx, w, h, d, yi, hi, a);
      else phoneNotes(ctx, w, h, L, d, yi, hi);
      if (!hover || el < 2.8) return;
      // hover: the container (or pier) under the pointer
      const p = L.piers.find((q) => Math.abs(hover[1] - q.yc) <= L.slot / 2 && hover[0] >= 0 && hover[0] <= (q.end || 0) + (full ? 64 : 40));
      if (!p) return;
      const si = p.i, sname = d.sido[si], t = d.tot[yi][si], cg = p.cg;
      const k = Math.floor((hover[0] - L.x0) / L.pitch);
      const g = k >= 0 && k < cg.seq.length ? cg.seq[k] : k === cg.seq.length && cg.frac > 0 ? cg.fg : hi >= 0 ? hi : -1;
      const lines = [`${sname} · ${d.years[yi]}년`, `수출 ${KF.fmt(t, t < 10 && t % 1 ? 1 : 0)}억 달러 · 전국의 ${((t / d.nat[yi]) * 100).toFixed(t / d.nat[yi] < 0.001 ? 2 : 1)}%`];
      if (g >= 0) {
        const v = d.mix[yi][si][g];
        lines.splice(1, 0, `${d.groups[g]} ${KF.fmt(v)}억 달러 (이 시도 수출의 ${t ? ((v / t) * 100).toFixed(0) : 0}%)`);
        const x = L.x0 + k * L.pitch;
        if (k >= 0 && k < p.n) { ctx.strokeStyle = LED; ctx.lineWidth = 1.5; ctx.strokeRect(x - 1.5, p.yc - L.cl / 2 - 1.5, L.cw + 3, L.cl + 3); }
      }
      if (!full) lines.push(`컨테이너 ${KF.fmt(cg.units, 1)}개 분량`);
      tip(ctx, w, h, hover[0], hover[1], lines);
    });
  }

  VIZ.exports = { thumb, mount, bg: BG };
})();
