// 67 semi-basement — "반지하 창문" (semi-basement window wells). A row of small concrete window
// wells, one per census year: the light filling each pane is that year's 지하(반지하) household count
// (2024 is a differently-measured administrative count, marked apart). A second view shows what
// actually grew in "non-housing" dwellings — mostly officetel windows, not shacks.
(() => {
  const BG = "#25231e";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#f0ece2", DIM = "rgba(240,236,226,.62)", FAINT = "rgba(240,236,226,.16)";
  const CONCRETE = "#4a4640", CONCRETE_D = "#33302b", GLASS_DARK = "#141a1d", GLASS = ["#fef3c4", "#e7b34a"];
  const RED = "#c96a4a";

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // a semi-basement window well: concrete frame, recessed glass, light rising to `frac`, iron bars
  function windowWell(ctx, x, y, w, h, frac, hot) {
    ctx.fillStyle = hot ? "#5a4030" : CONCRETE; roundRect(ctx, x, y, w, h, Math.min(4, w * 0.06)); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 1; ctx.stroke();
    const gx = x + w * 0.14, gy = y + h * 0.12, gw = w * 0.72, gh = h * 0.76;
    ctx.fillStyle = GLASS_DARK; ctx.fillRect(gx, gy, gw, gh);
    const fh = Math.max(1, gh * KF.clamp(frac, 0, 1));
    const g = ctx.createLinearGradient(0, gy + gh - fh, 0, gy + gh);
    g.addColorStop(0, GLASS[0]); g.addColorStop(1, GLASS[1]);
    ctx.fillStyle = g; ctx.fillRect(gx, gy + gh - fh, gw, fh);
    // ground line + a little dust/moss at the base
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(x - w * 0.06, y + h - h * 0.04, w * 1.12, h * 0.04);
    // iron bars
    ctx.strokeStyle = "rgba(20,15,10,.75)"; ctx.lineWidth = Math.max(1, w * 0.035);
    const bars = w > 26 ? 3 : 2;
    for (let i = 1; i <= bars; i++) {
      const bx = gx + (gw * i) / (bars + 1);
      ctx.beginPath(); ctx.moveTo(bx, gy - 1); ctx.lineTo(bx, gy + gh + 1); ctx.stroke();
    }
    ctx.strokeStyle = hot ? RED : "rgba(0,0,0,.5)"; ctx.lineWidth = hot ? 2 : 1.2; ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);
    return { x, y, w, h };
  }

  function tipBox(ctx, w, h, px, py, lines) {
    const fs = 12;
    ctx.font = `700 ${fs + 1}px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 ${fs}px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 12 + lines.length * (fs + 6);
    const bx = KF.clamp(px + 14 + bw > w - 6 ? px - bw - 14 : px + 14, 6, w - bw - 6), by = KF.clamp(py - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(20,20,18,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(240,236,226,.3)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = `${i ? 500 : 700} ${i ? fs : fs + 1}px ${SANS}`; ctx.fillText(t, bx + 11, by + 6 + (i + 1) * (fs + 6) - 3); });
  }

  // ---------------------------------------------------------------- thumb
  // Keep the top-left 90x36 (badge) and bottom-left 50x50 (glyph) corners clear: the window row and
  // both caption lines sit inside y in [0.13h, 0.78h] here.
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, years = d.floorYears, n = years.length;
    const x0 = h * 0.1, x1 = w - h * 0.1, y0 = h * 0.13, ww = (x1 - x0) / n - 5;
    const hi = Math.max(...d.basement);
    const up = KF.clamp((c - 0.3) / 3, 0, 1);
    years.forEach((y, i) => {
      const frac = (d.basement[i] / hi) * 0.85 + 0.08;
      windowWell(ctx, x0 + i * (ww + 5), y0, ww, h * 0.35, frac * up, y === d.registerYear);
    });
    const a = KF.clamp((c - 1.4) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.062)}px ${SANS}`;
    ctx.fillText("지하(반지하) 거주 가구", x0, h * 0.62);
    ctx.fillStyle = GLASS[0]; ctx.font = `700 ${Math.round(h * 0.09)}px ${SANS}`;
    ctx.fillText(`${d.censusLast}년 ${(d.basement[years.indexOf(d.censusLast)] / 10000).toFixed(0)}만가구`, x0, h * 0.78);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage);
    let view = "time", hover = null, t0 = performance.now(), wells = [];
    KF.segment(controls, [{ id: "time", label: "반지하, 조사연도별" }, { id: "cats", label: "무엇이 늘었나" }], view, (id) => { view = id; t0 = performance.now(); });

    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      // sidewalk ground band
      ctx.fillStyle = CONCRETE_D; ctx.fillRect(0, full ? h * 0.78 : h * 0.7, w, h);
      wells = [];
      const el = (performance.now() - t0) / 1000;
      const grow = KF.ease(KF.clamp((el - 0.15) / 1.3, 0, 1));

      if (view === "time") {
        const years = d.floorYears, n = years.length;
        const pad = full ? 40 : 16, x0 = pad, x1 = w - pad;
        const gap = full ? 22 : 8, ww = (x1 - x0 - gap * (n - 1)) / n;
        const y0 = full ? 60 : 48, wh = (full ? h * 0.56 : h * 0.4);
        const hiV = Math.max(...d.basement);
        years.forEach((y, i) => {
          const x = x0 + i * (ww + gap);
          const isReg = y === d.registerYear;
          const frac = ((d.basement[i] / hiV) * 0.85 + 0.08) * grow;
          const rm = windowWell(ctx, x, y0, ww, wh, frac, isReg);
          wells.push({ ...rm, label: `${y}년`, val: `${KF.fmt(d.basement[i])}가구 (${d.basementRate[i].toFixed(2)}%)` });
          ctx.fillStyle = isReg ? RED : DIM; ctx.font = `600 ${full ? 11 : 9}px ${MONO}`; ctx.textAlign = "center";
          ctx.fillText(String(y), x + ww / 2, y0 + wh + (full ? 20 : 14));
          if (isReg) { ctx.font = `500 ${full ? 9 : 7.5}px ${SANS}`; ctx.fillText("(행정자료)", x + ww / 2, y0 + wh + (full ? 34 : 25)); }
        });
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 18 : 13}px ${SERIF}`;
        ctx.fillText("반지하에서 올려다본 창문", pad, full ? 26 : 20);
        const hov = hover && wells.find((r) => hover[0] >= r.x && hover[0] <= r.x + r.w);
        const cur = hov || wells[wells.length - 1];
        const idx = years.indexOf(parseInt(cur.label));
        const yBase = y0 + wh + (full ? 58 : 42);
        ctx.fillStyle = GLASS[0]; ctx.font = `700 ${full ? 28 : 18}px ${SANS}`;
        ctx.fillText(`${KF.fmt(d.basement[idx])}가구`, pad, yBase);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10}px ${SANS}`;
        ctx.fillText(`${cur.label} 지하(반지하) 거주 가구 · 전체의 ${d.basementRate[idx].toFixed(2)}%`, pad, yBase + (full ? 20 : 15));
        if (full) {
          ctx.fillText(`창 안의 빛이 높을수록 가구 수가 많다 · 붉은 테두리 = 2024년(다른 방식으로 집계)`, pad, yBase + 40);
        }
      } else {
        const cats = d.nonhousing.cats, years = d.nonhousing.years;
        const labels = Object.keys(cats);
        const i0 = 0, i1 = years.length - 1;
        const maxV = Math.max(...labels.map((l) => cats[l][i1]));
        const pad = full ? 40 : 14, x0 = pad, x1 = w - pad;
        const gap = full ? 26 : 10, ww = (x1 - x0 - gap * (labels.length - 1)) / labels.length;
        const y0 = full ? 92 : 60, wh = full ? h * 0.44 : h * 0.32;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 18 : 13}px ${SERIF}`;
        ctx.fillText(`'주택 이외의 거처', ${years[i0]}→${years[i1]} 무엇이 늘었나`, pad, full ? 30 : 20);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9}px ${SANS}`;
        ctx.fillText("창 크기 = 그해 가구 수 · 빨간 테두리 = 줄어든 항목", pad, full ? 50 : 36);
        labels.forEach((lab, i) => {
          const x = x0 + i * (ww + gap);
          const v0 = cats[lab][i0], v1 = cats[lab][i1];
          const frac = KF.clamp(v1 / maxV, 0.06, 1) * grow;
          const bw = ww, bh = wh * KF.clamp(v1 / maxV, 0.08, 1) * grow + wh * 0.1;
          const shrank = v1 < v0;
          const rm = windowWell(ctx, x + (ww - bw) / 2, y0 + wh - bh, bw, bh, 0.7, shrank);
          wells.push({ ...rm, label: lab, val: `${Math.round(v0).toLocaleString()} → ${Math.round(v1).toLocaleString()}가구 (${(v1 >= v0 ? "+" : "")}${(((v1 - v0) / v0) * 100).toFixed(0)}%)` });
          ctx.textAlign = "center"; ctx.fillStyle = shrank ? RED : INK; ctx.font = `600 ${full ? 11.5 : 8.5}px ${SANS}`;
          const words = full ? [lab] : lab.split("·");
          words.forEach((wd, wi) => ctx.fillText(wd, x + ww / 2, y0 + wh + (full ? 20 : 14) + wi * (full ? 14 : 10)));
          ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10.5 : 8}px ${MONO}`;
          ctx.fillText(`${((v1 - v0) / v0 * 100).toFixed(0)}%`, x + ww / 2, y0 + wh + (full ? 20 : 14) + words.length * (full ? 14 : 10) + 2);
        });
      }

      if (hover) {
        const hb = wells.find((r) => hover[0] >= r.x && hover[0] <= r.x + r.w && hover[1] >= r.y - 6 && hover[1] <= r.y + r.h + 30);
        if (hb) tipBox(ctx, w, h, hover[0], hover[1], [[hb.label], [hb.val, DIM]]);
      }
    });
  }

  VIZ["semi-basement"] = { thumb, mount, bg: BG };
})();
