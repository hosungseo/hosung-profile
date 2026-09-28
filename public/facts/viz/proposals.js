// 45 proposals — "제안함". A wooden suggestion box with an acrylic front on a teal wall. Every paper slip in
// the box = 500 proposals received that year; adopted ones rise out of the slot and glow in gold above it.
// Toggle citizen / civil-servant proposals, move through the years, compare counts with rates.
(() => {
  const BG = "#406a6c";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const PAPER = "#f3eee0", GOLD = "#ffd36b", GOLDD = "#e2a92f", TXT = "#f2f5f3", DIM = "rgba(242,245,243,.72)", SOFT = "rgba(242,245,243,.45)";
  const UNIT = 500;
  const hash = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  // ---------------------------------------------------------------- wall + shelf (cached)
  let WALL = null;
  function wall(w, h, shelfY) {
    const key = `${w}x${h}x${shelfY}`;
    if (WALL && WALL.key === key) return WALL.c;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    g.fillStyle = BG; g.fillRect(0, 0, w, h);
    for (let i = 0; i < (w * h) / 16; i++) { g.fillStyle = hash(i) > 0.5 ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.05)"; g.fillRect(hash(i + 0.2) * w, hash(i + 0.6) * h, 1, 1); }
    const lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, "rgba(255,255,255,.06)"); lg.addColorStop(1, "rgba(0,0,0,.18)");
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
    // shelf
    const sg = g.createLinearGradient(0, shelfY, 0, h); sg.addColorStop(0, "#6b4527"); sg.addColorStop(0.15, "#8a5a33"); sg.addColorStop(1, "#4d301b");
    g.fillStyle = sg; g.fillRect(0, shelfY, w, h - shelfY);
    g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(0, shelfY - 5, w, 5);
    g.strokeStyle = "rgba(255,230,190,.12)"; g.lineWidth = 1;
    for (let k = 0; k < 4; k++) { g.beginPath(); for (let x = 0; x <= w; x += 12) g.lineTo(x, shelfY + 9 + k * 7 + Math.sin(x / 70 + k) * 1.4); g.stroke(); }
    WALL = { key, c };
    return c;
  }

  // ---------------------------------------------------------------- one paper slip
  function slip(ctx, x, y, w, h, rot, fill, alpha, glow) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha;
    if (glow) { ctx.shadowColor = "rgba(255,211,107,.9)"; ctx.shadowBlur = glow; }
    ctx.fillStyle = fill; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = glow ? "rgba(140,90,10,.45)" : "rgba(80,70,50,.28)";
    ctx.fillRect(-w / 2 + w * 0.14, -h / 2 + h * 0.3, w * 0.62, Math.max(0.6, h * 0.09));
    ctx.fillRect(-w / 2 + w * 0.14, -h / 2 + h * 0.58, w * 0.45, Math.max(0.6, h * 0.09));
    ctx.restore();
  }

  // pile positions inside the window (bottom up), deterministic
  function pilePos(k, W, s) {
    const per = Math.max(6, Math.floor(W / (s * 0.85))), r = Math.floor(k / per), c = k % per;
    const x = (c + 0.5 + (hash(k * 3.1) - 0.5) * 0.9 + (r % 2) * 0.5) * (W / (per + 0.5));
    return [x, r * s * 0.36 + (hash(k * 7.7) - 0.5) * s * 0.2, (hash(k * 1.3) - 0.5) * 1.1];
  }

  // ---------------------------------------------------------------- the box
  function box(ctx, cx, bottom, BW, BH, disp, target, label, hoverBox, unit = UNIT) {
    const depth = BW * 0.14, top = bottom - BH, x0 = cx - BW / 2;
    // shadow on the shelf
    ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(cx + 8, bottom + 2, BW * 0.56, 7, 0, 0, 7); ctx.fill();
    // top face (parallelogram)
    ctx.fillStyle = "#c48c55";
    ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0 + depth, top - depth * 0.55); ctx.lineTo(x0 + BW + depth, top - depth * 0.55); ctx.lineTo(x0 + BW, top); ctx.closePath(); ctx.fill();
    // side face
    ctx.fillStyle = "#7a4a26";
    ctx.beginPath(); ctx.moveTo(x0 + BW, top); ctx.lineTo(x0 + BW + depth, top - depth * 0.55); ctx.lineTo(x0 + BW + depth, bottom - depth * 0.55); ctx.lineTo(x0 + BW, bottom); ctx.closePath(); ctx.fill();
    // slot
    const sw = BW * 0.46, sx = cx + depth / 2 - sw / 2, sy = top - depth * 0.3;
    ctx.fillStyle = "#24160c"; ctx.beginPath(); ctx.ellipse(sx + sw / 2, sy, sw / 2, 3.2, 0, 0, 7); ctx.fill();
    // front face (wood frame)
    const fg = ctx.createLinearGradient(0, top, 0, bottom); fg.addColorStop(0, "#b27a44"); fg.addColorStop(1, "#935f33");
    ctx.fillStyle = fg; ctx.fillRect(x0, top, BW, BH);
    ctx.strokeStyle = "rgba(60,30,10,.25)"; ctx.lineWidth = 1;
    for (let k = 0; k < 7; k++) { ctx.beginPath(); for (let x = x0; x <= x0 + BW; x += 10) ctx.lineTo(x, top + 6 + k * BH / 7 + Math.sin((x - x0) / 40 + k * 1.7) * 2); ctx.stroke(); }
    // acrylic window
    const m = Math.max(10, BW * 0.06), wx = x0 + m, wy = top + m, ww = BW - 2 * m, wh = BH - 2 * m - BH * 0.16;
    ctx.fillStyle = "rgba(20,35,35,.55)"; ctx.fillRect(wx, wy, ww, wh);
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    const s = Math.max(unit > UNIT ? 7 : 9, BW * 0.052), rest = Math.abs(disp - target) < 0.01;
    const n = Math.ceil(rest ? target : disp - 1e-9), fr = target - Math.floor(target);
    for (let k = 0; k < n; k++) {
      const [px, py, rot] = pilePos(k, ww, s), tx = wx + px, ty = wy + wh - s * 0.4 - py;
      let x = tx, y = ty, a = 1;
      if (rest) { if (k === n - 1 && fr > 0.01) a = 0.3 + 0.7 * fr; }
      else { const p = KF.clamp((disp - k) / 3, 0, 1), e = KF.ease(p); x = KF.lerp(cx, tx, e); y = KF.lerp(wy - 6, ty, e); }
      slip(ctx, x, y, s * 1.55, s, rot, PAPER, a);
    }
    // reflections
    const rg = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
    rg.addColorStop(0, "rgba(255,255,255,.14)"); rg.addColorStop(0.25, "rgba(255,255,255,0)"); rg.addColorStop(0.55, "rgba(255,255,255,0)"); rg.addColorStop(0.62, "rgba(255,255,255,.1)"); rg.addColorStop(0.7, "rgba(255,255,255,0)");
    ctx.fillStyle = rg; ctx.fillRect(wx, wy, ww, wh);
    ctx.restore();
    ctx.strokeStyle = "rgba(40,20,5,.55)"; ctx.lineWidth = 1.5; ctx.strokeRect(wx + 0.5, wy + 0.5, ww - 1, wh - 1);
    // brass plate
    const ph = BH * 0.11, pw = Math.min(BW * 0.5, 170), px = cx - pw / 2, py = bottom - BH * 0.13;
    const bg = ctx.createLinearGradient(px, 0, px + pw, 0); bg.addColorStop(0, "#b9964f"); bg.addColorStop(0.5, "#ecd48f"); bg.addColorStop(1, "#b08b44");
    ctx.fillStyle = bg; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = "#3b2a10"; ctx.font = `700 ${Math.round(ph * 0.58)}px ${SERIF}`; ctx.textAlign = "center"; ctx.fillText(label, cx, py + ph * 0.72);
    if (hoverBox) { ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.strokeRect(x0 - 4, top - depth * 0.55 - 4, BW + depth + 8, BH + depth * 0.55 + 8); ctx.setLineDash([]); }
    ctx.textAlign = "left";
    return { x0, top: top - depth * 0.55, x1: x0 + BW + depth, bottom, slot: [sx + sw / 2, sy], s };
  }

  // adopted slips: rise from the slot into a glowing grid above the box
  function adopted(ctx, B, gx0, gy1, cols, disp, target, s, t) {
    const rest = Math.abs(disp - target) < 0.01, n = Math.ceil(rest ? target : disp - 1e-9), fr = target - Math.floor(target);
    const sp = s * 1.95, rowH = s * 1.45, rows = Math.ceil(Math.max(n, Math.ceil(target)) / cols);
    if (n > 0) {
      const gw = cols * sp, gh = rows * rowH, gx = gx0 + gw / 2, gy = gy1 - gh / 2, R = Math.max(gw, gh) * 0.8;
      const rg = ctx.createRadialGradient(gx, gy, 4, gx, gy, R);
      rg.addColorStop(0, `rgba(255,211,107,${0.2 * KF.clamp(disp, 0, 1)})`); rg.addColorStop(1, "rgba(255,211,107,0)");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(gx, gy, R, R * 0.8, 0, 0, 7); ctx.fill();
    }
    for (let j = 0; j < n; j++) {
      const r = Math.floor(j / cols), c = j % cols, tx = gx0 + (c + 0.5) * sp, ty = gy1 - (r + 0.5) * rowH;
      let x = tx, y = ty, a = 1;
      if (rest) { if (j === n - 1 && fr > 0.01) a = 0.3 + 0.7 * fr; }
      else { const e = KF.ease(KF.clamp((disp - j) / 2.5, 0, 1)); x = KF.lerp(B.slot[0], tx, e); y = KF.lerp(B.slot[1], ty, e) - Math.sin(e * Math.PI) * 18; }
      slip(ctx, x, y + Math.sin(t * 1.6 + j) * 0.8, s * 1.55, s, (hash(j * 5.3) - 0.5) * 0.25, GOLD, a, 10);
    }
    return { rows, n };
  }

  // ---------------------------------------------------------------- data helpers
  const series = (d, kind) => d[kind];
  const at = (S, f, key) => {
    const i = Math.floor(f), j = Math.min(S.years.length - 1, i + 1), k = f - i;
    const a = S[key][i], b = S[key][j];
    if (a == null || b == null) return a == null ? null : a;
    return KF.lerp(a, b, k);
  };

  // right-hand panel: numbers + counts vs rates
  function panel(ctx, x0, x1, y0, y1, d, kind, i, hov) {
    const S = series(d, kind), y = S.years[i], rec = S.rec[i], ad = S.adopt[i], W = x1 - x0;
    ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `600 12.5px ${SANS}`; ctx.fillText(kind === "citizen" ? "국민제안" : "공무원제안", x0, y0);
    ctx.fillStyle = TXT; ctx.font = `700 26px ${MONO}`; ctx.fillText(String(y), x0, y0 + 30);
    if (ad != null) {
      ctx.fillStyle = GOLD; ctx.font = `800 46px ${SANS}`; ctx.fillText(`${KF.fmt(ad / rec * 100, 1)}%`, x0, y0 + 86);
      ctx.fillStyle = DIM; ctx.font = `500 12.5px ${SANS}`; ctx.fillText("채택률 (채택 ÷ 접수)", x0, y0 + 108);
    } else {
      ctx.fillStyle = SOFT; ctx.font = `600 16px ${SANS}`; ctx.fillText("채택 건수 기록 없음", x0, y0 + 80);
      ctx.font = `500 12px ${SANS}`; ctx.fillText(`채택은 ${d.sum.adoptFrom}년부터 적혀 있다`, x0, y0 + 102);
    }
    ctx.fillStyle = TXT; ctx.font = `600 14px ${SANS}`;
    ctx.fillText(`접수 ${KF.fmt(rec)}건`, x0, y0 + 140);
    ctx.fillStyle = GOLD; ctx.fillText(ad != null ? `채택 ${KF.fmt(ad)}건` : "채택 –", x0 + W * 0.5, y0 + 140);
    ctx.fillStyle = SOFT; ctx.font = `500 11px ${MONO}`; ctx.fillText(`쪽지 1장 = ${UNIT}건`, x0, y0 + 160);
    const ni = d.sinmungo.years.indexOf(y);
    if (ni >= 0) { ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(`국민신문고 '제안' 접수 ${KF.fmt(d.sinmungo[kind][ni])}건`, x0 + W * 0.5, y0 + 160); }
    // chart 1: received (white) with adopted (gold), same scale
    const cy0 = y0 + 196, ch = Math.max(60, (y1 - cy0 - 64) * 0.5), n = S.years.length, cw = W / n;
    const mx = Math.max(...S.rec);
    ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`; ctx.fillText("접수와 채택 (건, 같은 눈금)", x0, cy0 - 6);
    let hit = null;
    for (let j = 0; j < n; j++) {
      const r = S.rec[j] / mx * ch, a = (S.adopt[j] || 0) / mx * ch, x = x0 + j * cw, on = j === i;
      ctx.fillStyle = on ? "rgba(242,245,243,.9)" : "rgba(242,245,243,.38)"; ctx.fillRect(x + cw * 0.15, cy0 + ch - r, cw * 0.7, r);
      ctx.fillStyle = on ? GOLD : GOLDD; ctx.fillRect(x + cw * 0.15, cy0 + ch - a, cw * 0.7, Math.max(a > 0 ? 1 : 0, a));
      if (hov && hov[0] >= x && hov[0] < x + cw && hov[1] >= cy0 - 10 && hov[1] <= cy0 + ch * 2 + 60) hit = j;
    }
    // chart 2: adoption rate, both kinds
    const ry0 = cy0 + ch + 34, rh = ch, rmax = 20;
    ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`; ctx.fillText("채택률 (%)", x0, ry0 - 6);
    ctx.strokeStyle = "rgba(242,245,243,.14)"; ctx.lineWidth = 1;
    [0, 10, 20].forEach((v) => { const yy = ry0 + rh - v / rmax * rh; ctx.beginPath(); ctx.moveTo(x0, yy + 0.5); ctx.lineTo(x1, yy + 0.5); ctx.stroke(); ctx.fillStyle = SOFT; ctx.font = `500 9.5px ${MONO}`; ctx.textAlign = "right"; ctx.fillText(`${v}%`, x1, yy - 2); ctx.textAlign = "left"; });
    const line = (K, col, dash) => {
      const T = d[K], xOf = (yr) => x0 + (yr - S.years[0] + 0.5) * cw;
      ctx.strokeStyle = col; ctx.lineWidth = K === kind ? 2.2 : 1.4; ctx.setLineDash(dash); ctx.beginPath();
      let st = false;
      T.years.forEach((yr, j) => {
        if (yr < S.years[0] || T.adopt[j] == null) { st = false; return; }
        const v = T.adopt[j] / T.rec[j] * 100, xx = xOf(yr), yy = ry0 + rh - Math.min(v, rmax) / rmax * rh;
        st ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); st = true;
      });
      ctx.stroke(); ctx.setLineDash([]);
    };
    line(kind === "citizen" ? "official" : "citizen", "rgba(242,245,243,.55)", [3, 3]);
    line(kind, GOLD, []);
    if (ad != null) { const v = ad / rec * 100; ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(x0 + (i + 0.5) * cw, ry0 + rh - Math.min(v, rmax) / rmax * rh, 3.5, 0, 7); ctx.fill(); }
    ctx.fillStyle = SOFT; ctx.font = `500 9.5px ${MONO}`; ctx.textAlign = "left"; ctx.fillText(String(S.years[0]), x0, ry0 + rh + 13);
    ctx.textAlign = "right"; ctx.fillText(String(S.years[n - 1]), x1, ry0 + rh + 13); ctx.textAlign = "left";
    ctx.fillStyle = GOLD; ctx.fillRect(x0 + 60, ry0 + rh + 7, 14, 2.5); ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(kind === "citizen" ? "국민" : "공무원", x0 + 78, ry0 + rh + 12);
    ctx.strokeStyle = "rgba(242,245,243,.55)"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0 + 130, ry0 + rh + 8); ctx.lineTo(x0 + 144, ry0 + rh + 8); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillText(kind === "citizen" ? "공무원" : "국민", x0 + 148, ry0 + rh + 12);
    return { chart: [x0, cy0, W, ch], hit };
  }

  function tip(ctx, w, h, lines, p) {
    ctx.font = `600 12px ${SANS}`;
    const bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22, bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(24,40,40,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, wt, c], k) => { ctx.fillStyle = c || TXT; ctx.font = `${wt} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 19 + k * 18); });
  }
  const yearLines = (d, kind, j) => {
    const S = d[kind], ad = S.adopt[j];
    const L = [[`${S.years[j]}년 ${kind === "citizen" ? "국민제안" : "공무원제안"}`, 700], [`접수 ${KF.fmt(S.rec[j])}건`, 500]];
    L.push(ad != null ? [`채택 ${KF.fmt(ad)}건 · 채택률 ${KF.fmt(ad / S.rec[j] * 100, 1)}%`, 600, GOLD] : ["채택 건수 기록 없음", 500, SOFT]);
    if (S.central[j]) L.push([`중앙우수제안 ${KF.fmt(S.central[j])}건`, 500, DIM]);
    return L;
  };

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const c = t % 10, S = d.citizen, n = S.years.length - 1, b = S.years.indexOf(d.sum.base), TU = 1000;
    const shelfY = h - 20;
    ctx.drawImage(wall(w, h, shelfY), 0, 0, w, h);
    const f = b + KF.ease(KF.clamp((c - 1.4) / 1.7, 0, 1)) * (n - b);
    const BW = w * 0.33, BH = h * 0.44, cx = w * 0.3;
    const tR = at(S, f, "rec") / TU, tA = at(S, f, "adopt") / TU;
    const B = box(ctx, cx, shelfY, BW, BH, tR * KF.clamp(c / 1.3, 0, 1), tR, "국민제안함", false, TU);
    const cols = 6, ss = B.s * 0.9, gw = cols * ss * 1.95;
    adopted(ctx, B, cx + BW * 0.07 - gw / 2, B.top - 6, cols, tA * KF.clamp((c - 1.2) / 0.5, 0, 1), tA, ss, t);
    const X = w * 0.6, a = KF.clamp((c - 0.4) / 0.6, 0, 1) * (c > 9.4 ? 1 - (c - 9.4) / 0.6 : 1), i = Math.round(f);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.058)}px ${SANS}`; ctx.fillText(`${S.years[i]}년 국민제안 채택률`, X, h * 0.24);
    ctx.fillStyle = GOLD; ctx.font = `800 ${Math.round(h * 0.17)}px ${SANS}`; ctx.fillText(`${KF.fmt(S.adopt[i] / S.rec[i] * 100, 1)}%`, X, h * 0.24 + h * 0.18);
    ctx.fillStyle = TXT; ctx.font = `600 ${Math.round(h * 0.06)}px ${SANS}`; ctx.fillText(`${d.sum.base}년 ${KF.fmt(d.sum.rate0, 1)}%`, X, h * 0.66);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText(`채택 ${KF.fmt(S.adopt[i])}건`, X, h * 0.66 + h * 0.1);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let kind = "citizen", S = d.citizen, n = S.years.length - 1, f = n, target = n, t0 = performance.now(), intro = true, hover = null, geo = null, shown = "", dispR = 0, dispA = 0;
    const range = document.createElement("input"); range.type = "range"; range.step = 1;
    const setRange = () => { range.min = S.years[0]; range.max = S.years[n]; range.value = S.years[Math.round(target)]; };
    KF.segment(controls, [{ id: "citizen", label: "국민제안" }, { id: "official", label: "공무원제안" }], "citizen", (id) => {
      const y = S.years[Math.round(target)];
      kind = id; S = d[id]; n = S.years.length - 1;
      f = target = KF.clamp(S.years.indexOf(y) >= 0 ? S.years.indexOf(y) : n, 0, n); setRange();
    });
    const lab = document.createElement("label"); lab.append("연도", range);
    const out = document.createElement("span"); out.className = "readout";
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "▶ 다시 넣기";
    controls.append(lab, out, replay);
    setRange();
    range.oninput = () => { intro = false; target = +range.value - S.years[0]; };
    replay.onclick = () => { intro = true; t0 = performance.now(); dispR = 0; dispA = 0; };
    const pick = (e, click) => {
      const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top];
      if (click && geo && geo.hitYear != null) { intro = false; target = geo.hitYear; }
    };
    stage.addEventListener("pointermove", (e) => pick(e, false));
    stage.addEventListener("pointerdown", (e) => pick(e, true));
    stage.addEventListener("pointerleave", () => { hover = null; });
    let last = performance.now();
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const el = (now - t0) / 1000, tt = now / 1000;
      if (intro && el > 5) intro = false;
      f += (target - f) * (1 - Math.exp(-dt * 6)); if (Math.abs(target - f) < 0.002) f = target;
      const i = Math.round(f), key = `${kind}${i}`;
      if (key !== shown) { shown = key; range.value = S.years[i]; out.textContent = `${S.years[i]}년`; }
      const shelfY = full ? h - 34 : h - 26;
      ctx.drawImage(wall(w, h, shelfY), 0, 0, w, h);
      const BW = full ? Math.min(340, w * 0.33) : w * 0.62, BH = full ? h * 0.42 : h * 0.33, cx = full ? w * 0.3 : w * 0.46;
      const rec = at(S, f, "rec"), adv = at(S, f, "adopt");
      const bx0 = cx - BW / 2;
      const hoverBox = !!(hover && hover[0] >= bx0 && hover[0] <= bx0 + BW * 1.14 && hover[1] >= shelfY - BH - 20 && hover[1] <= shelfY);
      // slip counts move toward the selected year's values (intro: the pile fills first, then adoptions rise)
      const tR = S.rec[i] / UNIT * (intro && el < 0.3 ? 0 : 1), tA = (S.adopt[i] || 0) / UNIT * (intro && el < 3.1 ? 0 : 1);
      const vR = intro ? Math.max(40, tR / 2.6) : Math.max(60, Math.abs(tR - dispR) * 2.5), vA = intro ? Math.max(8, tA / 1.6) : Math.max(12, Math.abs(tA - dispA) * 2.5);
      dispR += KF.clamp(tR - dispR, -dt * vR, dt * vR); dispA += KF.clamp(tA - dispA, -dt * vA, dt * vA);
      const B = box(ctx, cx, shelfY, BW, BH, dispR, tR, kind === "citizen" ? "국민제안함" : "공무원제안함", hoverBox);
      // adopted grid above the box
      const cols = full ? 12 : 10, ss = B.s * 0.95, gw = cols * ss * 1.95;
      const G = adopted(ctx, B, cx + BW * 0.07 - gw / 2, B.top - (full ? 26 : 14), cols, dispA, tA, ss, tt);
      const gTop = B.top - (full ? 26 : 14) - G.rows * ss * 1.45;
      const hoverGold = !!(hover && adv != null && hover[0] >= cx + BW * 0.07 - gw / 2 - 6 && hover[0] <= cx + BW * 0.07 + gw / 2 + 6 && hover[1] >= gTop - 6 && hover[1] <= B.top - 6);
      // labels
      ctx.textAlign = "center"; ctx.fillStyle = GOLD; ctx.font = `700 ${full ? 14 : 12}px ${SANS}`;
      if (adv != null) ctx.fillText(`채택 ${KF.fmt(Math.round(adv))}건`, cx + BW * 0.07, gTop - 12);
      else { ctx.fillStyle = SOFT; ctx.fillText("채택 기록 없음", cx + BW * 0.07, B.top - 30); }
      ctx.textAlign = "left";
      geo = {};
      let lines = null;
      if (full) {
        const P = panel(ctx, w * 0.6, w - 34, 44, h - 30, d, kind, i, hover);
        geo.hitYear = P.hit;
        if (P.hit != null && hover) lines = yearLines(d, kind, P.hit);
        ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 18px ${SANS}`;
        ctx.fillText("넣은 쪽지는 상자에, 채택된 쪽지는 위로", 40, 46);
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${MONO}`;
        ctx.fillText(`흰 쪽지 1장 = 접수 ${UNIT}건 · 금빛 쪽지 = 채택 ${UNIT}건`, 40, 68);
        ctx.fillStyle = TXT; ctx.font = `700 13px ${SANS}`;
        ctx.fillText(`접수 ${KF.fmt(Math.round(rec))}건`, B.x0, shelfY + 22);
        ctx.fillStyle = SOFT; ctx.font = `500 11px ${MONO}`; ctx.fillText(`쪽지 1장 = ${UNIT}건`, B.x0 + 150, shelfY + 22);
      } else {
        const ad = S.adopt[i];
        ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`;
        ctx.fillText(`${S.years[i]}년 ${kind === "citizen" ? "국민제안" : "공무원제안"}`, 14, 26);
        ctx.fillStyle = ad != null ? GOLD : SOFT; ctx.font = `800 30px ${SANS}`;
        ctx.fillText(ad != null ? `${KF.fmt(ad / S.rec[i] * 100, 1)}%` : "기록 없음", 14, 60);
        ctx.fillStyle = TXT; ctx.font = `500 12px ${SANS}`; ctx.fillText(`접수 ${KF.fmt(S.rec[i])} · 채택 ${ad != null ? KF.fmt(ad) : "–"}`, 14, 80);
        ctx.fillStyle = SOFT; ctx.font = `500 10px ${MONO}`; ctx.fillText(`쪽지 1장 = ${UNIT}건`, 14, 96);
      }
      if (!lines && hover && (hoverBox || hoverGold)) {
        const ad = S.adopt[i];
        lines = hoverGold ? [[`${S.years[i]}년 채택 ${KF.fmt(ad)}건`, 700, GOLD], [`접수의 ${KF.fmt(ad / S.rec[i] * 100, 1)}% · 쪽지 ${KF.fmt(ad / UNIT, 1)}장`, 500], [`중앙우수제안 ${KF.fmt(S.central[i])}건`, 500, DIM]]
          : [[`${S.years[i]}년 접수 ${KF.fmt(S.rec[i])}건`, 700], [`쪽지 ${KF.fmt(S.rec[i] / UNIT, 1)}장 (1장 = ${UNIT}건)`, 500], [ad != null ? `이 가운데 ${KF.fmt(100 - ad / S.rec[i] * 100, 1)}%는 채택되지 않았다` : "채택 건수 기록 없음", 500, DIM]];
      }
      if (lines && hover && !intro) tip(ctx, w, h, lines, hover);
    });
  }

  VIZ.proposals = { thumb, mount, bg: BG };
})();
