// 52 emissions — "굴뚝 연기 기둥". Time rises like smoke: each year is a horizontal band stacked from the
// chimney mouth (1990, bottom) to the most recent year (top), band width = that year's total emissions,
// internally split into sector-coloured segments. The column bulges to its widest at the peak year, then
// narrows again — a shape you cannot mistake for a straight line. Side panel: three small traces (total,
// per-capita, per-GDP) so the "which one is really straight" question has a visual answer.
(() => {
  const BG = "#1a1512";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#f1e6d6", DIM = "rgba(241,230,214,.64)", FAINT = "rgba(241,230,214,.16)";
  const COLORS = { power: "#d1652e", industry: "#9a8a76", transport: "#5c85ab", buildings: "#d1a765", ippu: "#9a7ba3", agri: "#7fa35e", waste: "#7a6a48", other: "#5a5650" };
  const FGAS = "#5fd9cf";

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const years = []; for (let y = d.y0; y <= d.y1; y++) years.push(y);
    const N = years.length;
    const maxTotal = Math.max(...d.total);
    const peakIdx = d.total.indexOf(Math.max(...d.total));
    const norm = (arr) => { const xs = arr.filter((v) => v != null); const lo = Math.min(...xs), hi = Math.max(...xs); return arr.map((v) => (v == null ? null : (v - lo) / (hi - lo || 1))); };
    return (DEC = {
      years, N, sectors: d.sectors, total: d.total, percap: d.percap, gdpint: d.gdpint, fgas: d.fgas,
      maxTotal, peakIdx, peak: d.peak,
      ntotal: norm(d.total), npercap: norm(d.percap), ngdpint: norm(d.gdpint),
      fgasChg: Math.round((d.fgas[N - 1] / d.fgas[peakIdx] - 1) * 100),
      totalChg: Math.round((d.total[N - 1] / d.total[peakIdx] - 1) * 1000) / 10,
      percapChg: Math.round((d.percap[N - 1] / d.percap[peakIdx] - 1) * 1000) / 10,
      gdpintChg: Math.round((d.gdpint[N - 1] / d.gdpint[0] - 1) * 1000) / 10,
    });
  }

  const drift = (i) => 9 * Math.sin(i * 0.28 + 0.4) + 5 * Math.sin(i * 0.13 + 1.7);

  // geometry of the smoke column for a given box; returns per-row rects + a lookup fn
  function columnGeo(D, box) {
    const [x0, y0, w, h] = box, rowH = h / D.N, halfW = w * 0.46;
    const rows = D.years.map((y, i) => {
      const total = D.total[i], rowW = Math.max(3, (total / D.maxTotal) * halfW * 2);
      const cx = x0 + w / 2 + drift(i) * (w / 340);
      const top = y0 + h - (i + 1) * rowH, bot = y0 + h - i * rowH;
      return { i, y: y, cx, left: cx - rowW / 2, w: rowW, top, bot: bot + 0.6 };
    });
    return { rows, rowH };
  }

  function drawColumn(ctx, D, geo, upto, hoverI, focusI, full) {
    // soft haze pass behind the crisp column
    ctx.save(); ctx.filter = "blur(7px)"; ctx.globalAlpha = 0.35;
    for (const r of geo.rows) {
      if (r.i > upto) continue;
      ctx.fillStyle = "#caa07a";
      ctx.fillRect(r.left, r.top, r.w, r.bot - r.top + 1);
    }
    ctx.restore();
    for (const r of geo.rows) {
      if (r.i > upto) continue;
      const sec = D.sectors, total = D.total[r.i];
      let acc = r.left;
      for (const s of sec) {
        const segW = r.w * (s.v[r.i] / total);
        ctx.fillStyle = COLORS[s.id] || "#888";
        ctx.globalAlpha = r.i === hoverI || r.i === focusI ? 1 : 0.86;
        ctx.fillRect(acc, r.top, Math.max(0.6, segW), r.bot - r.top + 1);
        acc += segW;
      }
      ctx.globalAlpha = 1;
      if (r.i === hoverI || r.i === focusI) {
        ctx.strokeStyle = "#fff"; ctx.lineWidth = r.i === focusI && r.i !== hoverI ? 1.1 : 1.6;
        ctx.strokeRect(r.left + 0.5, r.top + 0.5, r.w - 1, r.bot - r.top);
      }
    }
    // chimney mouth at the base
    const base = geo.rows[0];
    if (base) {
      const bw = Math.max(base.w * 0.7, 26), bx = base.cx - bw / 2, by = base.bot;
      ctx.fillStyle = "#2a2119"; ctx.fillRect(bx, by, bw, full ? 30 : 18);
      ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 1;
      for (let k = 1; k < (full ? 4 : 2); k++) { const yy = by + (k / (full ? 4 : 2)) * (full ? 30 : 18); ctx.beginPath(); ctx.moveTo(bx, yy); ctx.lineTo(bx + bw, yy); ctx.stroke(); }
    }
  }

  // rising soot particles
  function makeParticles(n) {
    const ps = [];
    for (let k = 0; k < n; k++) ps.push({ x: Math.random(), y: Math.random(), vy: 6 + Math.random() * 10, ph: Math.random() * 7, a: 0.15 + Math.random() * 0.35, r: 0.6 + Math.random() * 1.6 });
    return ps;
  }
  function stepParticles(ps, dt, box) {
    const [x0, y0, w, h] = box;
    for (const p of ps) {
      p.y -= (p.vy / h) * dt;
      if (p.y < -0.05) { p.y = 1.02; p.x = Math.random(); }
      const xx = x0 + (p.x + 0.05 * Math.sin(p.y * 8 + p.ph)) * w, yy = y0 + p.y * h;
      p._x = xx; p._y = yy;
    }
  }
  function drawParticles(ctx, ps) {
    for (const p of ps) {
      ctx.globalAlpha = p.a; ctx.fillStyle = "#e8d9c2";
      ctx.beginPath(); ctx.arc(p._x, p._y, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function sparkline(ctx, D, box, key, color, label, unit, focusI, hoverI, full) {
    const [x0, y0, w, h] = box, arr = D["n" + key], raw = D[key];
    ctx.fillStyle = DIM; ctx.font = `600 ${full ? 11 : 10}px ${SANS}`; ctx.textAlign = "left";
    ctx.fillText(label, x0, y0 - 4);
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
    ctx.beginPath();
    let started = false;
    arr.forEach((v, i) => {
      if (v == null) return;
      const xx = x0 + (i / (D.N - 1)) * w, yy = y0 + h - v * h;
      if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    // peak marker
    const pxp = x0 + (D.peakIdx / (D.N - 1)) * w, pyp = y0 + h - arr[D.peakIdx] * h;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(pxp, pyp, 2.6, 0, 7); ctx.fill();
    const mark = (i, ring) => {
      if (i == null || arr[i] == null) return;
      const xx = x0 + (i / (D.N - 1)) * w, yy = y0 + h - arr[i] * h;
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(xx, yy, ring, 0, 7); ctx.stroke();
    };
    mark(focusI, 4.2); mark(hoverI, 3.2);
    ctx.textAlign = "right"; ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10 : 9}px ${MONO}`;
    ctx.fillText(unit(raw[raw.length - 1]), x0 + w, y0 - 4);
  }

  function tip(ctx, w, h, lines, p) {
    const fs = 11.5;
    ctx.font = `700 ${fs + 1}px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 ${fs}px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 10 + lines.length * (fs + 6);
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(20,15,11,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(241,230,214,.3)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = `${i ? 500 : 700} ${i ? fs : fs + 1}px ${SANS}`; ctx.fillText(t, bx + 11, by + 6 + (i + 1) * (fs + 6) - 3); });
  }

  function yearLines(D, i) {
    const y = D.years[i], L = [[`${y}년`]];
    L.push([`총배출량 ${D.total[i].toFixed(1)}백만 톤`, i === D.peakIdx ? "#ffb37a" : INK]);
    const top = [...D.sectors].sort((a, b) => b.v[i] - a.v[i]).slice(0, 3);
    for (const s of top) L.push([`${s.name} ${s.v[i].toFixed(1)} (${(s.v[i] / D.total[i] * 100).toFixed(0)}%)`, COLORS[s.id]]);
    L.push([`1인당 ${D.percap[i].toFixed(2)}톤 · GDP당 ${D.gdpint[i].toFixed(0)}톤/10억원`, DIM]);
    return L;
  }

  // ---------------------------------------------------------------- thumb
  let TP = null;
  function thumb(ctx, w, h, t, d) {
    const D = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const box = [w * 0.08, h * 0.1, w * 0.42, h * 0.8];
    const geo = columnGeo(D, box);
    const c = t % 10, up = KF.ease(KF.clamp((c - 0.3) / 3, 0, 1)) * (D.N - 1);
    drawColumn(ctx, D, geo, up, null, D.peakIdx, false);
    if (!TP) TP = makeParticles(10);
    stepParticles(TP, 1 / 60, box);
    drawParticles(ctx, TP);
    const x = box[0] + box[2] + w * 0.05, a = KF.clamp((c - 1) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.078)}px ${SANS}`;
    ctx.fillText("온실가스 총배출량", x, h * 0.28);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText(`정점 ${D.peak}년 이후`, x, h * 0.4);
    ctx.fillStyle = "#ffb37a"; ctx.font = `700 ${Math.round(h * 0.14)}px ${SANS}`;
    ctx.fillText(`${D.totalChg}%`, x, h * 0.62);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.048)}px ${SANS}`;
    ctx.fillText(`${D.years[D.N - 1]}년까지`, x, h * 0.74);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    let focusI = D.N - 1, hoverI = null, metric = "total", tGrow = performance.now(), hover = null, geo = null, box = null, PS = makeParticles(34), lastT = performance.now();
    KF.segment(controls, [
      { id: "y0", label: `${D.years[0]}년` }, { id: "peak", label: `정점 ${D.peak}년` }, { id: "last", label: `${D.years[D.N - 1]}년` },
    ], "last", (id) => { focusI = id === "y0" ? 0 : id === "peak" ? D.peakIdx : D.N - 1; });
    KF.segment(controls, [
      { id: "total", label: "총배출량" }, { id: "percap", label: "1인당" }, { id: "gdpint", label: "GDP당" },
    ], "total", (id) => { metric = id; });

    const rowAt = (x, y) => {
      if (!geo || !box) return null;
      if (x < box[0] || x > box[0] + box[2] || y < box[1] || y > box[1] + box[3]) return null;
      const r = geo.rows.find((r) => y >= r.top && y <= r.bot);
      return r ? r.i : null;
    };
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; hoverI = rowAt(...hover); });
    stage.addEventListener("pointerleave", () => { hover = null; hoverI = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520, now = performance.now(), dt = Math.min(50, now - lastT); lastT = now;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      box = full ? [w * 0.05, h * 0.08, w * 0.34, h * 0.84] : [w * 0.06, h * 0.02, w * 0.5, h * 0.5];
      geo = columnGeo(D, box);
      const el = (now - tGrow) / 1000, up = KF.ease(KF.clamp(el / 1.8, 0, 1)) * (D.N - 1);
      drawColumn(ctx, D, geo, up, hoverI, focusI, full);
      stepParticles(PS, dt, box);
      drawParticles(ctx, PS);

      if (full) {
        const x0 = box[0] + box[2] + 46, pw = w - x0 - 30;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 21px ${SERIF}`;
        ctx.fillText("연기 기둥은 곧지 않다", x0, 40);
        ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
        ctx.fillText(`아래(${D.years[0]}년)에서 위(${D.years[D.N - 1]}년)로 · 너비 = 그해 총배출량 · 색 = 부문`, x0, 62);
        // legend
        let lx = x0;
        ctx.font = `600 10.5px ${SANS}`;
        for (const s of D.sectors) {
          ctx.fillStyle = COLORS[s.id]; ctx.fillRect(lx, 74, 9, 9);
          ctx.fillStyle = DIM; const label = s.name.split("(")[0];
          ctx.fillText(label, lx + 13, 82);
          lx += ctx.measureText(label).width + 30;
          if (lx > x0 + pw - 40) { lx = x0; }
        }
        const yy0 = 116;
        ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`;
        ctx.fillText(hoverI != null ? `${D.years[hoverI]}년 (가리킨 해)` : `${D.years[focusI]}년`, x0, yy0);
        const i = hoverI != null ? hoverI : focusI;
        ctx.fillStyle = "#ffb37a"; ctx.font = `700 30px ${SANS}`;
        ctx.fillText(`${D.total[i].toFixed(1)}백만 톤`, x0, yy0 + 32);
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`1인당 ${D.percap[i].toFixed(2)}톤 · GDP 10억원당 ${D.gdpint[i].toFixed(0)}톤`, x0, yy0 + 52);

        const sy = yy0 + 78, sh = 58, gap = 26;
        sparkline(ctx, D, [x0, sy, pw, sh], "total", "#ffb37a", `총배출량 (정점 대비 ${D.totalChg}%)`, (v) => `${v.toFixed(0)}Mt`, focusI, hoverI, true);
        sparkline(ctx, D, [x0, sy + sh + gap, pw, sh], "percap", "#7fc6e8", `1인당 (정점 대비 ${D.percapChg}%)`, (v) => `${v.toFixed(1)}t`, focusI, hoverI, true);
        sparkline(ctx, D, [x0, sy + 2 * (sh + gap), pw, sh], "gdpint", "#9fdc9a", `GDP당 (90년 대비 ${D.gdpintChg}%)`, (v) => `${v.toFixed(0)}t/10억원`, focusI, hoverI, true);

        const fy = sy + 3 * (sh + gap) + 6;
        ctx.fillStyle = FGAS; ctx.font = `700 12px ${SANS}`; ctx.textAlign = "left";
        ctx.fillText(`↗ 아직 늘고 있는 것: 냉매 등 F가스 (${D.peak}→${D.years[D.N - 1]}년 +${D.fgasChg}%)`, x0, fy);
      } else {
        const y0b = box[1] + box[3] + 12;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 13px ${SANS}`;
        const i = hoverI != null ? hoverI : focusI;
        ctx.fillText(`${D.years[i]}년 총배출량`, 14, y0b);
        ctx.fillStyle = "#ffb37a"; ctx.font = `700 21px ${SANS}`;
        ctx.fillText(`${D.total[i].toFixed(1)}백만 톤`, 14, y0b + 24);
        ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`;
        ctx.fillText(`정점(${D.peak}년) 대비 ${D.totalChg}% · 1인당 ${D.percap[i].toFixed(1)}톤`, 14, y0b + 40);
        const my = {
          total: ["총배출량 (백만 톤)", "#ffb37a", (v) => `${v.toFixed(0)}`],
          percap: ["1인당 (톤)", "#7fc6e8", (v) => `${v.toFixed(1)}`],
          gdpint: ["GDP당 (톤/10억원)", "#9fdc9a", (v) => `${v.toFixed(0)}`],
        }[metric];
        sparkline(ctx, D, [14, y0b + 54, w - 28, 40], metric, my[1], my[0], my[2], focusI, hoverI, false);
        ctx.textAlign = "left"; ctx.fillStyle = FGAS; ctx.font = `700 11px ${SANS}`;
        ctx.fillText(`↗ 늘고 있는 것: F가스 +${D.fgasChg}%`, 14, y0b + 114);
      }
      if (hoverI != null && hover) tip(ctx, w, h, yearLines(D, hoverI), hover);
    });
  }

  VIZ.emissions = { thumb, mount, bg: BG };
})();
