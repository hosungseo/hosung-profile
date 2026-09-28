// 48 volunteer — "손도장 벽". A slate community wall. Left: 100 adult hands in chalk; the painted ones are the
// adults who volunteered through the 1365 portal that year (year slider 2010–2025). Right: one row per 시도 of
// handprints for social-welfare volunteers who were active that year (1 print = 10,000 people), over faint
// chalk prints showing 2019.
(() => {
  const BG = "#2d3a4a";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", PEN = "'Nanum Pen Script', cursive";
  const PAINT = "#f2c14e", CITY = "#ef7d57", PROV = "#4fb3a9", CHALK = "rgba(255,255,255,.13)", CHALK2 = "rgba(255,255,255,.3)";
  const TXT = "#f3f1ea", DIM = "rgba(243,241,234,.62)";
  const rnd = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; };

  // plaster wall with faint streaks (cached)
  let WALL = null;
  function wall(w, h) {
    const key = `${w}x${h}`;
    if (WALL && WALL.key === key) return WALL.c;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    g.fillStyle = BG; g.fillRect(0, 0, w, h);
    const r = rnd(3);
    for (let k = 0; k < 900; k++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.05)"; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2); }
    for (let k = 0; k < 40; k++) { g.fillStyle = "rgba(255,255,255,.018)"; g.fillRect(r() * w, 0, 1 + r() * 2, h); }
    WALL = { key, c };
    return c;
  }

  // a handprint (palm up) as one path, s = height
  function handPath(ctx, cx, cy, s, rot) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    const p = new Path2D();
    const cap = (x, y, len, wd, ang) => { // capsule from (x, y) going up at angle ang
      const m = new DOMMatrix().translate(x, y).rotate((ang * 180) / Math.PI);
      const q = new Path2D(); q.roundRect(-wd / 2, -len, wd, len + wd / 2, wd / 2);
      p.addPath(q, m);
    };
    const pw = 0.5 * s, ph = 0.46 * s, py = 0.08 * s;
    const palm = new Path2D(); palm.roundRect(-pw / 2, py - ph / 2, pw, ph, pw * 0.34); p.addPath(palm);
    [[-0.18, 0.25, -0.13], [-0.06, 0.32, -0.04], [0.06, 0.3, 0.04], [0.18, 0.23, 0.13]].forEach(([dx, len, a]) => cap(dx * s, py - ph / 2 + 0.04 * s, len * s, 0.1 * s, a));
    cap(-pw / 2 + 0.03 * s, py + 0.02 * s, 0.22 * s, 0.11 * s, -0.95);
    ctx.fill(p);
    ctx.restore();
  }
  function print(ctx, cx, cy, s, col, rot, alpha) {
    ctx.globalAlpha = alpha; ctx.fillStyle = col; handPath(ctx, cx, cy, s, rot); ctx.globalAlpha = 1;
  }

  const clampY = (d, y) => KF.clamp(y, d.wYears[0], d.wYears[d.wYears.length - 1]);

  // ------------------------------------------------------------------ left: 100 hands
  function hundred(ctx, x0, y0, size, d, yi, prog, full, hover) {
    const cell = size / 10, rate = d.rate[yi], r = rnd(7);
    let hit = false;
    for (let k = 0; k < 100; k++) {
      const cx = x0 + (k % 10) * cell + cell / 2, cy = y0 + Math.floor(k / 10) * cell + cell / 2, rot = (r() - 0.5) * 0.3;
      print(ctx, cx, cy, cell * 0.88, CHALK, rot, 1);
      const paint = KF.clamp(rate - k, 0, 1) * KF.clamp(prog * 100 / Math.max(1, rate) - k, 0, 1);
      if (paint > 0) {
        if (paint < 1) { ctx.save(); ctx.beginPath(); ctx.rect(cx - cell / 2, cy + cell / 2 - cell * paint, cell, cell * paint); ctx.clip(); }
        print(ctx, cx, cy, cell * 0.88, PAINT, rot, 0.95);
        if (paint < 1) ctx.restore();
      }
      if (hover && Math.abs(hover[0] - cx) < cell / 2 && Math.abs(hover[1] - cy) < cell / 2) hit = true;
    }
    return hit;
  }

  // ------------------------------------------------------------------ right: rows of prints per 시도
  function rows(ctx, L, d, wy, prog, hover) {
    const wi = d.wYears.indexOf(wy), i19 = d.wYears.indexOf(2019), n = d.sido.length;
    const rh = (L.ry1 - L.ry0) / n, ps = Math.min(rh * 0.92, L.full ? 19 : 12), sp = L.pitch;
    let hit = null;
    d.sido.forEach((s, i) => {
      const y = L.ry0 + rh * (i + 0.5), col = d.city.includes(s) ? CITY : PROV, r = rnd(100 + i);
      ctx.textAlign = "right"; ctx.fillStyle = TXT; ctx.font = `${L.full ? 600 : 600} ${L.full ? 12 : 10}px ${SANS}`; ctx.textBaseline = "middle";
      ctx.fillText(s, L.rx0 - 8, y + 0.5); ctx.textBaseline = "alphabetic";
      const ghost = d.act[i][i19] / 1e4, now = d.act[i][wi] / 1e4;
      for (let k = 0; k < Math.ceil(ghost - 0.05); k++) print(ctx, L.rx0 + k * sp + ps / 2, y, ps, CHALK2, (r() - 0.5) * 0.35, 0.55);
      const shown = now * prog;
      for (let k = 0; k < Math.ceil(shown - 0.02); k++) {
        const part = Math.min(1, shown - k), cx = L.rx0 + k * sp + ps / 2, rot = ((k * 37 + i * 11) % 10 - 5) * 0.04;
        if (part < 1) { ctx.save(); ctx.beginPath(); ctx.rect(cx - ps / 2, y - ps / 2, ps * part, ps); ctx.clip(); }
        print(ctx, cx, y, ps, col, rot, 0.95);
        if (part < 1) ctx.restore();
      }
      const pct = (d.act[i][wi] / d.act[i][i19]) * 100;
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 ${L.full ? 10.5 : 9}px ${MONO}`; ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(pct)}%`, L.rx0 + Math.max(ghost, now) * sp + 6, y + 0.5); ctx.textBaseline = "alphabetic";
      if (hover && Math.abs(hover[1] - y) <= rh / 2 && hover[0] > L.rx0 - 40) hit = i;
    });
    return hit;
  }

  function spark(ctx, x0, y0, wd, ht, d, yi, full) {
    const n = d.years.length, mx = Math.max(...d.rate);
    const X = (i) => x0 + (wd * i) / (n - 1), Y = (v) => y0 + ht - (ht * v) / mx;
    ctx.strokeStyle = "rgba(242,193,78,.85)"; ctx.lineWidth = 2; ctx.beginPath();
    d.rate.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.stroke();
    ctx.fillStyle = PAINT; ctx.beginPath(); ctx.arc(X(yi), Y(d.rate[yi]), 4, 0, 7); ctx.fill();
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 9.5 : 8.5}px ${MONO}`; ctx.textAlign = "left"; ctx.fillText(String(d.years[0]), x0, y0 + ht + 12);
    ctx.textAlign = "right"; ctx.fillText(String(d.years[n - 1]), x0 + wd, y0 + ht + 12);
    const pk = d.rate.indexOf(mx); ctx.textAlign = "center"; ctx.fillText(`${mx}%`, X(pk), Y(mx) - 6);
  }

  function layout(w, h, mode) {
    const full = mode === "full";
    if (full) {
      const size = Math.min(h - 150, 360);
      return { full, gx: 34, gy: 70, gsize: size, rx0: 520, rx1: w - 20, ry0: 60, ry1: h - 44 };
    }
    const size = Math.min(w * 0.46, 170);
    return { full, gx: 12, gy: 34, gsize: size, rx0: 48, rx1: w - 10, ry0: 34 + size + 34, ry1: h - 12 };
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `600 12.5px ${SANS}`;
    let bw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${SANS}`;
    lines.slice(1).forEach((l) => { bw = Math.max(bw, ctx.measureText(l).width); });
    bw += 22;
    const bh = 12 + lines.length * 17, bx = KF.clamp(x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 12, 6, h - bh - 6);
    ctx.fillStyle = "rgba(250,248,242,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = PAINT; ctx.fillRect(bx, by, 3, bh);
    lines.forEach((l, i) => { ctx.fillStyle = i ? "#27313d" : "#000"; ctx.font = i ? `500 11px ${SANS}` : `600 12.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(l, bx + 11, by + 18 + i * 17); });
  }

  // ------------------------------------------------------------------ thumb
  function thumb(ctx, w, h, t, d) {
    const c = t % 10, yi = d.years.length - 1;
    ctx.drawImage(wall(w, h), 0, 0, w, h);
    const size = h - 100;                                        // keep the bottom-left corner free for the glyph badge
    hundred(ctx, 22, 42, size, d, yi, KF.clamp((c - 0.3) / 1.6, 0, 1), false, null);
    const X = w - 12, a = KF.clamp((c - 2.0) / 0.6, 0, 1), wi = d.wYears.length - 1, i19 = d.wYears.indexOf(2019);
    ctx.globalAlpha = a; ctx.textAlign = "right";
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText(`${d.years[yi]}년 성인 100명 중 봉사`, X, h * 0.2);
    ctx.fillStyle = PAINT; ctx.font = `700 ${Math.round(h * 0.17)}px ${MONO}`; ctx.fillText(`${d.rate[yi].toFixed(1)}명`, X, h * 0.2 + h * 0.18);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText("사회복지 봉사는 2019년의", X, h * 0.62);
    ctx.fillStyle = CITY; ctx.font = `700 ${Math.round(h * 0.12)}px ${MONO}`; ctx.fillText(`${Math.round((d.actTot[wi] / d.actTot[i19]) * 100)}%`, X, h * 0.62 + h * 0.14);
    ctx.globalAlpha = 1;
    if (c > 9.4) { ctx.fillStyle = BG; ctx.globalAlpha = (c - 9.4) / 0.6; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage), last = d.years.length - 1;
    let yi = last, t0 = performance.now(), hover = null;
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = last; range.step = 1; range.value = last;
    const lab = document.createElement("label"), out = document.createElement("span");
    out.className = "readout"; out.textContent = String(d.years[last]);
    lab.append("연도", range, out);
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 찍기";
    replay.onclick = () => { t0 = performance.now(); };
    KF.segment(controls, [{ id: last, label: `${d.years[last]}` }, { id: d.years.indexOf(2021), label: "2021 (가장 적음)" }, { id: d.rate.indexOf(Math.max(...d.rate)), label: `${d.years[d.rate.indexOf(Math.max(...d.rate))]} (가장 많음)` }, { id: 0, label: `${d.years[0]}` }], last,
      (id) => { yi = id; range.value = id; out.textContent = String(d.years[id]); t0 = performance.now() - 1200; });
    controls.append(lab, replay);
    range.oninput = () => { yi = +range.value; out.textContent = String(d.years[yi]); t0 = performance.now() - 60000; };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, el = (performance.now() - t0) / 1000, L = layout(w, h, full ? "full" : "phone");
      ctx.drawImage(wall(w, h), 0, 0, w, h);
      const y = d.years[yi], wy = clampY(d, y), wi = d.wYears.indexOf(wy), i19 = d.wYears.indexOf(2019);
      // left
      ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 ${full ? 15 : 12.5}px ${SANS}`;
      ctx.fillText(`성인 100명의 손 · ${y}`, L.gx, full ? 36 : 22);
      if (full) { ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText("칠한 손 = 그해 1365자원봉사포털로 봉사한 사람", L.gx, 54); }
      const onHands = hundred(ctx, L.gx, L.gy, L.gsize, d, yi, KF.clamp((el - 0.2) / 1.4, 0, 1), full, hover);
      const nx = full ? L.gx : L.gx + L.gsize + 14, ny = full ? L.gy + L.gsize + 34 : L.gy + 26;
      ctx.fillStyle = PAINT; ctx.font = `700 ${full ? 30 : 24}px ${MONO}`; ctx.textAlign = "left"; ctx.fillText(`${d.rate[yi].toFixed(1)}명`, nx, ny);
      ctx.fillStyle = TXT; ctx.font = `500 ${full ? 12 : 10.5}px ${SANS}`;
      ctx.fillText(`${KF.fmt(Math.round(d.vol[yi] / 1e4))}만 명 참여`, nx + (full ? 110 : 0), full ? ny - 4 : ny + 18);
      spark(ctx, full ? L.gx + 250 : nx, full ? ny - 30 : ny + 34, full ? L.gsize - 250 : w - nx - 16, full ? 30 : 34, d, yi, full);
      // right
      ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 ${full ? 15 : 12}px ${SANS}`;
      const ttl = `사회복지 분야 활동 자원봉사자 · ${wy}`;
      ctx.fillText(ttl, full ? L.rx0 - 40 : 12, full ? 36 : L.ry0 - 14);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`;
      const note = (wy !== y ? `(자료 ${d.wYears[0]}–${d.wYears[d.wYears.length - 1]}) ` : "") + "손도장 1개 = 1만 명 · 흐린 윤곽 = 2019년";
      if (full) ctx.fillText(note, L.rx0 - 40, 54);
      L.pitch = full ? 13 : Math.min(8.4, (L.rx1 - L.rx0 - 30) / 38);
      const hit = rows(ctx, L, d, wy, KF.clamp((el - 0.8) / 1.6, 0, 1), hover);
      if (full) {
        ctx.fillStyle = CITY; ctx.fillRect(L.rx0 - 40, h - 22, 10, 10); ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText("특별·광역시", L.rx0 - 26, h - 13);
        ctx.fillStyle = PROV; ctx.fillRect(L.rx0 + 50, h - 22, 10, 10); ctx.fillStyle = DIM; ctx.fillText("도", L.rx0 + 64, h - 13);
        ctx.fillText(`전국 ${KF.fmt(Math.round(d.actTot[wi] / 1e4))}만 명 (2019년 ${KF.fmt(Math.round(d.actTot[i19] / 1e4))}만 명의 ${Math.round((d.actTot[wi] / d.actTot[i19]) * 100)}%)`, L.rx0 + 90, h - 13);
      } else { ctx.fillStyle = DIM; ctx.font = `500 9px ${SANS}`; ctx.textAlign = "right"; ctx.fillText("1개 = 1만 명 · 윤곽 = 2019", w - 10, L.ry0 - 14); }
      if (hover && el > 1.5) {
        if (onHands) tip(ctx, w, h, hover[0], hover[1], [`${y}년 · 성인 100명 중 ${d.rate[yi].toFixed(1)}명`, `1365 참여 ${KF.fmt(d.vol[yi])}명`, `20세 이상 ${KF.fmt(d.adults[yi])}명`]);
        else if (hit !== null) {
          const i = hit, a = d.act[i][wi], a19 = d.act[i][i19];
          tip(ctx, w, h, hover[0], hover[1], [`${d.sido[i]} · ${wy}년`, `활동 자원봉사자 ${KF.fmt(a)}명`, `2019년 ${KF.fmt(a19)}명의 ${Math.round((a / a19) * 100)}%`, `등록 ${KF.fmt(d.reg[i][wi])}명 중 ${((a / d.reg[i][wi]) * 100).toFixed(1)}%가 활동`]);
        }
      }
    });
  }

  VIZ.volunteer = { thumb, mount, bg: BG };
})();
