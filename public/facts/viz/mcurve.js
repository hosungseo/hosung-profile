// 64 mcurve — "능선 고도표". Women's employment rate by age drawn as a trailhead elevation-profile sign:
// the M-shaped ridge with a valley where employment dips during marriage/child-rearing years. A thin
// dashed line traces the men's curve (no valley) for comparison. A small step-chart below tracks how far
// along the trail (which age band) the valley has sat, year by year.
(() => {
  const BG = "#16261f";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#eef2e6", DIM = "rgba(238,242,230,.62)", FAINT = "rgba(238,242,230,.16)";
  const WOMEN = "#e8a23c", WOMEN_D = "#c77f22", MEN = "rgba(150,180,190,.75)", VALLEY = "#ff6a5c";
  const SKY = "#1c3327", CARD = "#0f1c15";
  const YLO = 30, YHI = 85;

  function path(pts) {
    const p = new Path2D();
    pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    return p;
  }

  function ridge(ctx, X, x0, y0, w, h, yi, hover, full, grow = 1) {
    const n = X.d.ages.length;
    const xAt = (i) => x0 + (i / (n - 1)) * w;
    const yAt = (v) => y0 + h - ((v - YLO) / (YHI - YLO)) * h;
    // sky gradient
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, "rgba(238,242,230,.05)"); g.addColorStop(1, "rgba(238,242,230,0)");
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    // gridlines
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.font = `500 ${full ? 10 : 9}px ${MONO}`; ctx.fillStyle = DIM; ctx.textAlign = "right";
    for (let v = 30; v <= 80; v += 10) {
      const yy = yAt(v);
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + w, yy); ctx.stroke();
      if (full) ctx.fillText(`${v}%`, x0 - 6, yy + 3);
    }
    const women = X.d.women[yi], men = X.d.men[yi];
    const wpts = women.map((v, i) => [xAt(i), yAt(v)]);
    const mpts = men.map((v, i) => [xAt(i), yAt(v)]);
    // reveal the ridge left-to-right, like tracing a trail on a map
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0 - 30, w * KF.clamp(grow, 0, 1) + 1, h + 40); ctx.clip();
    // filled ridge under women curve
    const area = path([[x0, y0 + h], ...wpts, [x0 + w, y0 + h]]);
    const fg = ctx.createLinearGradient(0, yAt(YHI), 0, y0 + h);
    fg.addColorStop(0, "rgba(232,162,60,.55)"); fg.addColorStop(1, "rgba(232,162,60,.06)");
    ctx.fillStyle = fg; ctx.fill(area);
    // men reference line (dashed)
    ctx.strokeStyle = MEN; ctx.lineWidth = full ? 1.6 : 1.3; ctx.setLineDash([4, 3]);
    ctx.stroke(path(mpts)); ctx.setLineDash([]);
    // women ridge line
    ctx.strokeStyle = WOMEN_D; ctx.lineWidth = full ? 2.6 : 2;
    ctx.stroke(path(wpts));
    ctx.restore();
    // valley marker (fades in once the line has reached it)
    const val = X.d.valley[yi];
    const vi = X.d.ages.indexOf(val.age);
    if (vi >= 0) {
      const vx = xAt(vi), vy = yAt(val.val);
      const a = KF.clamp((grow - vi / (n - 1)) * 6, 0, 1);
      ctx.globalAlpha = a;
      ctx.strokeStyle = VALLEY; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(vx, y0); ctx.lineTo(vx, y0 + h); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = VALLEY; ctx.beginPath(); ctx.arc(vx, vy, full ? 5 : 4, 0, 7); ctx.fill();
      ctx.strokeStyle = BG; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.textAlign = "center"; ctx.fillStyle = VALLEY; ctx.font = `700 ${full ? 11.5 : 10}px ${SANS}`;
      ctx.fillText(`골짜기 ${val.age}세`, vx, y0 - (full ? 10 : 8));
      ctx.globalAlpha = 1;
    }
    // x-axis labels
    ctx.textAlign = "center"; ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10.5 : 9}px ${MONO}`;
    X.d.ages.forEach((a, i) => { if (full || i % 2 === 0) ctx.fillText(a, xAt(i), y0 + h + (full ? 18 : 15)); });
    // hover
    let hit = null;
    if (hover && hover[0] >= x0 && hover[0] <= x0 + w && hover[1] >= y0 - 20 && hover[1] <= y0 + h + 20) {
      const i = KF.clamp(Math.round(((hover[0] - x0) / w) * (n - 1)), 0, n - 1);
      hit = { i, w: women[i], m: men[i] };
    }
    return { hit, xAt, yAt };
  }

  function trajectory(ctx, X, x0, y0, w, h, yi, full) {
    const years = X.d.years, n = years.length;
    const xAt = (i) => x0 + (i / (n - 1)) * w;
    const codes = ["30–34", "35–39", "40–44"];
    const yAt = (ci) => y0 + h - (ci / (codes.length - 1)) * h * 0.62 - h * 0.06;
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10.5 : 9}px ${SANS}`;
    ctx.fillText("골짜기가 있던 나이대 (연도별)", x0, y0 - 6);
    codes.forEach((lab, ci) => {
      ctx.fillStyle = FAINT; ctx.font = `500 ${full ? 9.5 : 8.5}px ${MONO}`; ctx.textAlign = "right";
      ctx.fillText(lab, x0 - 6, yAt(ci) + 3);
    });
    ctx.strokeStyle = WOMEN_D; ctx.lineWidth = full ? 2 : 1.5;
    ctx.beginPath();
    X.d.valley.forEach((v, i) => { const p = [xAt(i), yAt(v.codeIdx)]; i ? ctx.lineTo(...p) : ctx.moveTo(...p); });
    ctx.stroke();
    X.d.valley.forEach((v, i) => {
      const on = i === yi;
      ctx.fillStyle = on ? VALLEY : WOMEN_D; ctx.beginPath(); ctx.arc(xAt(i), yAt(v.codeIdx), on ? 4 : 2, 0, 7); ctx.fill();
    });
    ctx.textAlign = "center"; ctx.fillStyle = DIM; ctx.font = `500 ${full ? 9.5 : 8.5}px ${MONO}`;
    for (let i = 0; i < n; i += full ? 5 : 10) ctx.fillText(String(years[i]), xAt(i), y0 + h + 12);
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 13px ${SANS}` : `500 11.5px ${SANS}`);
    let bw = 0;
    for (const [t] of lines) { ctx.font = fontOf(0); bw = Math.max(bw, ctx.measureText(t).width); }
    bw += 22; const bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6);
    const by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = CARD; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = WOMEN_D; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], i) => { ctx.fillStyle = k === 2 ? DIM : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + i * 18); });
  }

  let DEC = null;
  function decode(d) { if (!DEC || DEC.d !== d) DEC = { d }; return DEC; }

  // ---------------------------------------------------------------- thumb
  // Card layout guard: badge top-left (x<96, y<40), glyph bottom-left (x<50, y>h-50).
  function thumb(ctx, w, h, t, d) {
    const X = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10;
    const yi = c < 5 ? 0 : d.years.length - 1;
    const topY = 44, botY2 = h - 60, botY1 = h - 82;
    ridge(ctx, X, w * 0.09, topY, w - w * 0.14, botY1 - topY - 44, yi, null, w > 260);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.072)}px ${SANS}`;
    ctx.fillText("여성 고용률의 골짜기", w * 0.045, botY1);
    ctx.fillStyle = "#e8a23c"; ctx.font = `600 ${Math.round(h * 0.05)}px ${MONO}`;
    ctx.fillText(`${d.years[yi]}년 · ${d.valley[yi].age}세`, w * 0.045, botY2);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), sc = KF.canvas(stage);
    let yi = d.years.length - 1, t0 = performance.now(), tGrow = performance.now(), hover = null;
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = d.years.length - 1; range.step = 1; range.value = yi;
    const lab = document.createElement("label"); lab.append("연도", range);
    const readout = document.createElement("span"); readout.className = "readout"; readout.textContent = String(d.years[yi]);
    controls.append(lab, readout);
    range.oninput = () => { yi = +range.value; readout.textContent = String(d.years[yi]); };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const y = d.years[yi], val = d.valley[yi];
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 15}px ${SERIF}`;
      ctx.fillText(`${y}년 · 나이대별 여성 고용률`, full ? 26 : 14, full ? 32 : 24);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10} px ${SANS}`;
      ctx.fillText(full ? "굵은 선 = 여성 · 점선 = 남성(참고) · 25–29세 대비 골짜기 깊이" : "굵은 선=여성 · 점선=남성", full ? 26 : 14, full ? 52 : 40);

      const grow = KF.ease(KF.clamp((performance.now() - tGrow) / 1000 / 1.1, 0, 1));
      const top = full ? 100 : 86;
      const ridgeH = full ? h - top - 190 : h - top - 150;
      const r = ridge(ctx, X, full ? 60 : 44, top, w - (full ? 90 : 58), ridgeH, yi, hover, full, grow);

      const ty = top + ridgeH + (full ? 52 : 44), th = full ? 84 : 62;
      trajectory(ctx, X, full ? 60 : 44, ty, w - (full ? 90 : 58), th, yi, full);

      const by = h - (full ? 20 : 14);
      ctx.fillStyle = "#e8a23c"; ctx.font = `600 ${full ? 12.5 : 11}px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(`깊이 ${val.depth.toFixed(1)}%p (25–29세 ${d.women[yi][2].toFixed(1)}% → ${val.age}세 ${val.val.toFixed(1)}%)`, full ? 26 : 14, by, w - 40);

      if (r.hit && hover) {
        tip(ctx, w, h, [[`${d.ages[r.hit.i]}세`, 1], [`여성 ${r.hit.w.toFixed(1)}%`, 0], [`남성 ${r.hit.m.toFixed(1)}%`, 2]], hover);
      }
    });
  }

  VIZ.mcurve = { thumb, mount, bg: BG };
})();
