// 21 jeonse — "금 간 벽돌벽". Every year of HUG jeonse-deposit guarantees is one band of a brick wall
// (1 brick = 2,000 guarantees, coloured by housing type); that year's guarantee accidents crack bricks red.
// Second view "금이 몰린 곳": the same 100 bricks coloured by housing type for new guarantees vs. the
// fraud-victim homes that applied for HUG auction support, plus the districts where those homes cluster.
(() => {
  const BG = "#cfcbc4";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#2b2622", MUTE = "rgba(43,38,34,.62)";
  const TC = ["#dfcdae", "#8f9ba6", "#aa583d", "#6b4a3b"];      // 아파트 · 오피스텔 · 다세대 · 그 밖
  const RED = "#d8321f", SEAM = "#2a1712";
  const rng = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

  function apportion(v, n) { // largest remainder: integer brick counts per type that add up to n
    const tot = v.reduce((a, b) => a + b, 0), raw = v.map((x) => (x / tot) * n), out = raw.map(Math.floor);
    let left = n - out.reduce((a, b) => a + b, 0);
    raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
    return out;
  }

  const LAY = new Map();
  function layout(d, x0, y0, W, H, N, bandGap = 5) {
    const key = [x0, y0, W, H, N, bandGap].map(Math.round).join("|");
    if (LAY.has(key)) return LAY.get(key);
    if (LAY.size > 12) LAY.clear();
    const bands = d.years.map((y, i) => {
      const tot = d.iss[i].reduce((a, b) => a + b, 0), n = Math.max(1, Math.round(tot / N));
      return { y, i, tot, n, types: apportion(d.iss[i], n), partial: d.partial.includes(y), acc: d.acc[String(y)] };
    });
    let g = null;
    for (let C = 6; C <= 160; C++) {
      const gap = W / C > 14 ? 2 : 1.2, bw = (W - (C - 1) * gap) / (C + 0.5), bh = bw / 2.3;
      const courses = bands.reduce((a, b) => a + Math.ceil(b.n / C), 0);
      if (courses * (bh + gap) + (bands.length - 1) * bandGap <= H) { g = { C, gap, bw, bh }; break; }
    }
    const { C, gap, bw, bh } = g, bricks = [];
    let yc = y0 + H, course = 0;
    for (const b of bands) {
      const cs = Math.ceil(b.n / C), seq = [];
      b.types.forEach((c, t) => { for (let k = 0; k < c; k++) seq.push(t); });
      b.bottom = yc; b.first = bricks.length;
      for (let c = 0; c < cs; c++, course++) {
        const yy = yc - (c + 1) * (bh + gap), off = course % 2 ? (bw + gap) / 2 : 0;
        for (let j = 0; j < C && c * C + j < b.n; j++) bricks.push({ x: x0 + off + j * (bw + gap), y: yy, t: seq[c * C + j], band: b, k: c * C + j });
      }
      b.top = yc - cs * (bh + gap); b.last = bricks.length;
      yc = b.top - bandGap;
      // cracks: that year's accidents in bricks of N, at seeded positions across the band
      b.crack = new Map();
      if (b.acc !== undefined) {
        const want = b.acc / N, full = Math.min(b.n, Math.floor(want)), frac = want - full, r = rng(b.y * 97);
        const idx = [...Array(b.n).keys()].sort(() => r() - 0.5);
        idx.slice(0, full).forEach((k) => b.crack.set(k, 1));
        if (frac > 0.04 && full < b.n) b.crack.set(idx[full], frac);
      }
    }
    for (const br of bricks) { // a jagged seam per brick, fixed per layout
      const r = rng(Math.round(br.x * 13 + br.y * 7) + 11), pts = [];
      for (let s = 0; s <= 4; s++) pts.push([0.08 + s * 0.21 + (r() - 0.5) * 0.06, 0.2 + r() * 0.6]);
      br.seam = pts;
    }
    const out = { bricks, bands, bw, bh, gap, C, N, x0, y0, W, H, top: bands[bands.length - 1].top };
    LAY.set(key, out);
    return out;
  }

  function brick(ctx, x, y, w, h, fill, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
    if (h >= 6.5) { // face shading only where there is room for it
      ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.fillRect(x, y, w, h * 0.22);
      ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.fillRect(x, y + h * 0.82, w, h * 0.18);
    }
    ctx.globalAlpha = 1;
  }
  function seam(ctx, br, w, h, frac, lw) {
    const pts = br.seam, n = Math.max(2, Math.round(pts.length * Math.min(1, frac)));
    ctx.strokeStyle = SEAM; ctx.lineWidth = lw; ctx.beginPath();
    for (let i = 0; i < n; i++) { const [px, py] = pts[i]; i ? ctx.lineTo(br.x + px * w, br.y + py * h) : ctx.moveTo(br.x + px * w, br.y + py * h); }
    ctx.stroke();
    if (frac >= 1) { // small branch
      const [px, py] = pts[2];
      ctx.beginPath(); ctx.moveTo(br.x + px * w, br.y + py * h); ctx.lineTo(br.x + (px + 0.08) * w, br.y + h * (py > 0.5 ? 0.05 : 0.95)); ctx.stroke();
    }
  }

  // the wall: bricks appear in order up to `upto` (count), bands after `yearMax` stay unbuilt
  function wall(ctx, L, upto, yearMax, hiType, hotBand) {
    const { bw, bh } = L;
    for (let i = 0; i < L.bricks.length && i < upto; i++) {
      const br = L.bricks[i], b = br.band;
      if (b.y > yearMax) break;
      const cr = b.crack.get(br.k), built = upto >= b.last;
      const dim = hiType !== null && br.t !== hiType ? 0.28 : 1;
      if (cr === 1 && built) {
        brick(ctx, br.x, br.y, bw, bh, RED, 1);
        seam(ctx, br, bw, bh, 1, Math.max(0.8, bh * 0.14));
      } else {
        brick(ctx, br.x, br.y, bw, bh, TC[br.t], (b.partial ? 0.5 : 1) * dim);
        if (cr && built) seam(ctx, br, bw, bh, cr, Math.max(0.6, bh * 0.1));
      }
    }
    if (hotBand) {
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
      ctx.strokeRect(L.x0 - 4, hotBand.top - 2, L.W + 8, hotBand.bottom - hotBand.top + 3); ctx.setLineDash([]);
    }
  }

  function yearLabels(ctx, L, yearMax, mode) {
    ctx.textAlign = "right"; ctx.font = `600 ${mode === "full" ? 11 : 9.5}px ${MONO}`;
    for (const b of L.bands) {
      if (b.y > yearMax) break;
      const ym = (b.top + b.bottom) / 2;
      ctx.fillStyle = INK; ctx.fillText(b.partial && mode !== "full" ? `${b.y}*` : String(b.y), L.x0 - 8, ym + 4);
      if (b.partial && mode === "full") { ctx.fillStyle = MUTE; ctx.font = `500 9px ${SANS}`; ctx.fillText("기록 일부", L.x0 - 8, ym + 15); ctx.font = `600 11px ${MONO}`; }
    }
  }

  const fmtJo = (eok) => { const j = Math.floor(eok / 10000), e = Math.round(eok % 10000); return j ? `${j}조 ${KF.fmt(e)}억 원` : `${KF.fmt(e)}억 원`; };

  function yearText(d, b) {
    const a = b.acc, lines = [[`${b.y}`, 1], [`가입 ${KF.fmt(b.tot)}건${b.partial ? " (기록 일부)" : ""}`, 0]];
    if (a === undefined) lines.push(["보증사고: 아직 공개 전", 2]);
    else {
      lines.push([`보증사고 ${KF.fmt(a)}건 · ${fmtJo(d.accAmt[String(b.y)])}`, 0]);
      const r = d.rate[String(b.y)];
      lines.push([r !== undefined ? `가입 100건당 사고 ${r.toFixed(r < 1 ? 2 : 1)}건` : "비율 계산 안 함 (가입 기록 일부)", r !== undefined ? 0 : 2]);
    }
    return lines;
  }

  function panelA(ctx, w, h, d, L, band, x0) {
    const X1 = w - 22;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 17px ${SANS}`;
    ctx.fillText(`벽돌 1장 = 보증 가입 ${KF.fmt(L.N)}건`, x0, 42);
    ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`; ctx.fillText("빨갛게 금 간 벽돌 = 그해 보증사고", x0, 62);
    const sw = 22, sh = 9;
    [...d.types.map((t, i) => [TC[i], t]), [RED, "금 간 벽돌"]].forEach(([c, t], i) => {
      const x = x0 + (i % 2) * 130, y = 84 + Math.floor(i / 2) * 20;
      ctx.fillStyle = c; ctx.fillRect(x, y - 8, sw, sh);
      if (c === RED) { ctx.strokeStyle = SEAM; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 3, y - 5); ctx.lineTo(x + 10, y - 2); ctx.lineTo(x + 19, y - 6); ctx.stroke(); }
      ctx.fillStyle = INK; ctx.font = `500 12px ${SANS}`; ctx.fillText(t, x + sw + 7, y);
    });
    // selected year
    let y = 172;
    yearText(d, band).forEach(([t, k], j) => {
      ctx.fillStyle = k === 2 ? MUTE : INK;
      ctx.font = k === 1 ? `600 30px ${MONO}` : k === 2 ? `500 11.5px ${SANS}` : `500 12.5px ${SANS}`;
      ctx.fillText(t, x0, y); y += j === 0 ? 26 : 21;
    });
    // accidents by year: little red bars
    const ys = Object.keys(d.acc).map(Number), mx = Math.max(...ys.map((k) => d.acc[k])), top = h - 178, bh = 118;
    ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`; ctx.fillText("보증사고 (건)", x0, top - 10);
    const bw = (X1 - x0) / ys.length;
    ys.forEach((yy, i) => {
      const v = d.acc[yy], hh = (v / mx) * bh, x = x0 + i * bw;
      ctx.fillStyle = yy === band.y ? RED : "rgba(216,50,31,.55)"; ctx.fillRect(x + bw * 0.18, top + bh - hh, bw * 0.64, Math.max(1, hh));
      ctx.fillStyle = MUTE; ctx.font = `500 9.5px ${MONO}`; ctx.textAlign = "center";
      ctx.fillText(`'${String(yy).slice(2)}`, x + bw / 2, top + bh + 13);
      if (v / mx > 0.2) { ctx.fillStyle = INK; ctx.fillText(v >= 10000 ? `${(v / 10000).toFixed(1)}만` : KF.fmt(v), x + bw / 2, top + bh - hh - 4); }
      ctx.textAlign = "left";
    });
    const sy = Object.keys(d.sub).map(Number).pop();
    ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`;
    ctx.fillText(`${sy}년 HUG 대위변제 ${KF.fmt(d.sub[String(sy)])}건`, x0, h - 26);
  }

  // ---------------------------------------------------------------- view B: where the cracks cluster
  function strip(ctx, x0, y0, W, shares, cracked, cols, rows, prog, hover) {
    const n = cols * rows, cnt = apportion(shares, n), gap = W / cols > 14 ? 2 : 1.4;
    const bw = (W - (cols - 1) * gap) / cols, bh = Math.max(5, bw / 2.4);
    let k = 0, hit = null;
    const blocks = [];
    cnt.forEach((c, t) => {
      const first = k;
      for (let j = 0; j < c; j++, k++) { // column-major so each type is one block
        const col = Math.floor(k / rows), row = k % rows, x = x0 + col * (bw + gap), y = y0 + row * (bh + gap);
        if (k / n > prog) continue;
        brick(ctx, x, y, bw, bh, TC[t], 1);
        if (cracked) {
          ctx.strokeStyle = RED; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
          seam(ctx, { x, y, seam: [[0.1, 0.3], [0.3, 0.7], [0.5, 0.35], [0.7, 0.75], [0.9, 0.4]] }, bw, bh, 1, Math.max(0.7, bh * 0.12));
        }
      }
      const c0 = Math.floor(first / rows), c1 = Math.floor((k - 1) / rows);
      if (c > 0) blocks.push({ t, x: x0 + c0 * (bw + gap), x1: x0 + (c1 + 1) * (bw + gap) - gap, share: shares[t] });
      if (hover && c > 0 && hover[0] >= x0 + c0 * (bw + gap) && hover[0] <= x0 + (c1 + 1) * (bw + gap) && hover[1] >= y0 && hover[1] <= y0 + rows * (bh + gap)) hit = t;
    });
    return { h: rows * (bh + gap), blocks, hit };
  }

  function viewB(ctx, w, h, d, mode, prog, hover) {
    const S = d.share, full = mode === "full", x0 = full ? 40 : 16, W = full ? w * 0.62 : w - 32;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 18 : 15}px ${SANS}`;
    ctx.fillText("같은 100장, 다른 색", x0, full ? 40 : 30);
    ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 10.5 : 9.5}px ${MONO}`;
    ctx.fillText("벽돌 1장 = 1% · 주택 유형별 몫", x0, full ? 60 : 46);
    let y = full ? 92 : 68, hit = null;
    const rows = full ? 5 : 5, cols = 20;
    for (const [lab, shares, cracked, n] of [[`새로 가입한 보증 · ${S.issYears} · ${KF.fmt(S.issN)}건`, S.iss, false, 0],
      [`전세사기 피해주택 · ${S.vicSpan} · ${KF.fmt(S.vicN)}호`, S.vic, true, 1]]) {
      ctx.fillStyle = INK; ctx.font = `600 ${full ? 12.5 : 11}px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(lab, x0, y);
      const r = strip(ctx, x0, y + 20, W, shares, cracked, cols, rows, prog, hover);
      let lastEnd = -1e9;
      r.blocks.forEach((b) => { // percent on top of each type block; if it would collide, put it under the strip
        ctx.fillStyle = INK; ctx.font = `600 ${full ? 11 : 9.5}px ${MONO}`; ctx.textAlign = "left";
        const t = `${d.types[b.t]} ${b.share.toFixed(0)}%`, tw = ctx.measureText(t).width;
        const lx = Math.min(b.x, x0 + W - tw);
        if (lx >= lastEnd + 6) { ctx.fillText(t, lx, y + 14); lastEnd = lx + tw; }
        else ctx.fillText(t, lx, y + 20 + r.h + (full ? 13 : 11));
      });
      if (r.hit !== null) hit = { kind: n ? "vic" : "iss", t: r.hit };
      y += 20 + r.h + (full ? 44 : 34);
    }
    // district rows: 1 brick = 10 homes
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 12.5 : 11}px ${SANS}`;
    ctx.fillText(`피해주택이 많은 시군구 · 벽돌 1장 = 10호`, x0, y);
    y += 14;
    const rowsN = full ? 6 : 5, rh = full ? 26 : 23, per = 10, lw = full ? 104 : 62, bh = full ? 13 : 11;
    const nbMax = Math.round(d.dist[0][1] / per), bw = Math.min(9, (W - lw - 58) / nbMax - 1.5);
    d.dist.slice(0, rowsN).forEach(([name, v], i) => {
      const yy = y + i * rh, nb = Math.round(v / per);
      ctx.fillStyle = INK; ctx.font = `500 ${full ? 12 : 11}px ${SANS}`; ctx.textAlign = "right";
      ctx.fillText(name, x0 + lw - 10, yy + bh - 2);
      for (let j = 0; j < nb && j / Math.max(1, nb) <= prog * 1.2; j++) {
        const x = x0 + lw + j * (bw + 1.5);
        brick(ctx, x, yy, bw, bh, RED, 0.9);
      }
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 11.5 : 10.5}px ${MONO}`;
      ctx.fillText(`${KF.fmt(v)}호`, x0 + lw + nb * (bw + 1.5) + 6, yy + bh - 2);
      if (hover && hover[1] >= yy - 2 && hover[1] <= yy + rh - 4 && hover[0] < x0 + lw + nb * (bw + 1.5) + 60) hit = { kind: "dist", name, v };
    });
    if (full) { // summary on the right
      const px = w * 0.72, top5 = S.top5, vo = S.vo, io = S.io;
      ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`; ctx.fillText("다세대 + 오피스텔", px, 110);
      ctx.fillStyle = RED; ctx.font = `800 40px ${SANS}`; ctx.fillText(`${vo.toFixed(1)}%`, px, 154);
      ctx.fillStyle = INK; ctx.font = `500 12.5px ${SANS}`; ctx.fillText(`피해주택에서의 몫`, px, 176);
      ctx.fillStyle = INK; ctx.font = `700 22px ${SANS}`; ctx.fillText(`${io.toFixed(1)}%`, px, 216);
      ctx.font = `500 12.5px ${SANS}`; ctx.fillText(`새로 가입한 보증에서의 몫`, px, 236);
      ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`; ctx.fillText("아파트", px, 290);
      ctx.fillStyle = INK; ctx.font = `700 22px ${SANS}`; ctx.fillText(`${S.vic[0].toFixed(1)}% · ${S.iss[0].toFixed(1)}%`, px, 318);
      ctx.font = `500 12.5px ${SANS}`; ctx.fillText("피해주택 · 새로 가입한 보증", px, 338);
      ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`; ctx.fillText("상위 5개 시군구", px, 392);
      ctx.fillStyle = RED; ctx.font = `800 28px ${SANS}`; ctx.fillText(`${top5.toFixed(1)}%`, px, 426);
      ctx.fillStyle = INK; ctx.font = `500 12.5px ${SANS}`; ctx.fillText("전체 피해주택 가운데", px, 446);
    }
    return hit;
  }

  function tip(ctx, w, h, lines, hover) {
    const fontOf = (k) => (k === 1 ? `600 13px ${SANS}` : k === 2 ? `500 10.5px ${SANS}` : `500 11.5px ${MONO}`);
    const bw = Math.min(w - 16, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 14 + lines.length * 19;
    const bx = KF.clamp(hover[0] + 14, 8, w - bw - 8), by = KF.clamp(hover[1] - bh - 10, 8, h - bh - 8);
    ctx.fillStyle = "rgba(250,248,244,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? MUTE : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 22 + j * 19); });
  }

  // ---------------------------------------------------------------- thumb + mount
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, L = layout(d, 40, 30, w * 0.6 - 40, h - 40, 8000, 3);
    const upto = Math.floor(KF.clamp(c / 2.8, 0, 1) * L.bricks.length) + (c >= 2.8 ? 1 : 0);
    wall(ctx, L, upto, 9999, null, null);
    const ys = Object.keys(d.acc).map(Number), yl = ys[ys.length - 1], X = w - 14;
    ctx.textAlign = "right"; ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`;
    ctx.fillText(`전세보증 사고 ${yl}`, X, h * 0.3);
    ctx.fillStyle = RED; ctx.font = `800 ${Math.round(h * 0.15)}px ${SANS}`; ctx.fillText(`${KF.fmt(d.acc[yl])}건`, X, h * 0.3 + h * 0.155);
    ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`;
    ctx.fillText(`피해주택의 ${d.share.vo.toFixed(0)}%`, X, h * 0.68);
    ctx.fillText("다세대·오피스텔", X, h * 0.68 + h * 0.07);
    if (c > 9.4) { ctx.fillStyle = `rgba(207,203,196,${(c - 9.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const y0 = d.years[0], y1 = d.years[d.years.length - 1];
    const yAcc = Math.max(...Object.keys(d.acc).map(Number));
    let view = "wall", yr = yAcc, t0 = performance.now(), tv = performance.now(), hover = null, hiType = null;
    KF.segment(controls, [{ id: "wall", label: "해마다 쌓은 벽" }, { id: "where", label: "금이 몰린 곳" }], "wall", (id) => { view = id; tv = performance.now(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "  유형:"; controls.appendChild(sep);
    KF.segment(controls, [{ id: -1, label: "전체" }, ...d.types.map((t, i) => ({ id: i, label: t }))], -1, (id) => { hiType = id < 0 ? null : id; });
    const range = document.createElement("input");
    range.type = "range"; range.min = y0; range.max = y1; range.step = 1; range.value = yAcc;
    const lab = document.createElement("label"); lab.append("연도", range);
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 쌓기";
    replay.onclick = () => { t0 = tv = performance.now(); yr = yAcc; range.value = yAcc; };
    controls.append(lab, replay);
    range.oninput = () => { yr = +range.value; t0 = performance.now() - 60000; };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, mode = w > 520 ? "full" : "phone";
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      if (view === "where") {
        const hit = viewB(ctx, w, h, d, mode, KF.clamp((performance.now() - tv) / 1000 / 1.6, 0, 1), hover);
        if (hit && hover) {
          const S = d.share;
          const lines = hit.kind === "dist" ? [[hit.name, 1], [`피해주택 ${KF.fmt(hit.v)}호 (${(hit.v / S.vicN * 100).toFixed(1)}%)`, 0], ["시군구 이름만 있어 같은 이름은 합쳐졌을 수 있음", 2]]
            : [[d.types[hit.t], 1], [`새로 가입한 보증 ${S.iss[hit.t].toFixed(1)}%`, 0], [`전세사기 피해주택 ${S.vic[hit.t].toFixed(1)}%`, 0]];
          tip(ctx, w, h, lines, hover);
        }
        return;
      }
      const full = mode === "full";
      const L = full ? layout(d, 58, 22, w * 0.64 - 58, h - 40, 2000) : layout(d, 44, 16, w - 60, h * 0.64, 2000, 4);
      const el = (performance.now() - t0) / 1000;
      const upto = Math.floor(KF.clamp((el - 0.2) / 4, 0, 1) * L.bricks.length) + (el > 4.2 ? 1 : 0);
      const band = L.bands.find((b) => b.y === yr) || L.bands[L.bands.length - 1];
      let hotBand = band, hovBand = null;
      if (hover && hover[0] >= L.x0 - 40 && hover[0] <= L.x0 + L.W + 10) hovBand = L.bands.find((b) => b.y <= yr && hover[1] >= b.top - 2 && hover[1] <= b.bottom + 3) || null;
      if (hovBand) hotBand = hovBand;
      wall(ctx, L, upto, yr, hiType, upto >= L.bricks.length ? hotBand : null);
      yearLabels(ctx, L, yr, mode);
      if (full) panelA(ctx, w, h, d, L, hotBand, w * 0.7);
      else {
        const X = 16; let yb = L.y0 + L.H + 36;
        ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 10px ${MONO}`;
        ctx.fillText(`벽돌 1장 = 가입 ${KF.fmt(L.N)}건 · 빨간 금 = 보증사고 · * 기록 일부`, X, L.y0 + L.H + 16);
        yearText(d, hotBand).forEach(([t, k], j) => {
          if (j === 0) { ctx.fillStyle = INK; ctx.font = `600 20px ${MONO}`; ctx.fillText(t, X, yb); ctx.textAlign = "left"; return; }
          ctx.fillStyle = k === 2 ? MUTE : INK; ctx.font = k === 2 ? `500 11px ${SANS}` : `500 12px ${SANS}`;
          ctx.fillText(t, X + (j === 1 ? 70 : 0), yb + (j === 1 ? -2 : (j - 1) * 20));
        });
      }
      if (hovBand && hover && upto >= L.bricks.length) tip(ctx, w, h, yearText(d, hovBand).map(([t, k], j) => [j ? t : `${t}년`, k]), hover);
    });
  }

  VIZ.jeonse = { thumb, mount, bg: BG };
})();
