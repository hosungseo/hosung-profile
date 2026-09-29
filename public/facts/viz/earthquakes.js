// 55 earthquakes — "지진계 두루마리 기록지". One long paper strip, x = year (1978→2025). The pen trace's
// jitter/noise density encodes small quakes (M2.0-2.9) — it gets busier as the network grows, laid over a
// filled "관측소 수" curve so the two move together. Red ink ticks are M3.0+ events: rare, and roughly flat
// across the whole strip except 2016/2017, where they pile up for real.
(() => {
  const BG = "#cfc4a0";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#2a2118", DIM = "rgba(42,33,24,.66)", FAINT = "rgba(42,33,24,.16)";
  const PEN = "#31281c", STA = "#5c7a72", RED = "#a8342a", PAPER_LINE = "rgba(42,33,24,.08)";

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const N = d.years.length;
    const maxSt = Math.max(...d.stations.v);
    return (DEC = { years: d.years, N, total: d.total, m23: d.m23, m3p: d.m3p, stations: d.stations, maxSt, dg: d.dg });
  }

  // seeded pseudo-random so the trace is stable across frames/resizes
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // build the wiggle trace once per geometry (x0,w,h) and dataset; returns {pts:[[x,y]], spikes:[{x,yr,up,dn}]}
  // M3.0+ is drawn as ONE pen-deflection spike per year (height = that year's count) — not one mark per
  // event: with only ~19px of width per year, 8-30 individual ticks would merge into a solid red block and
  // hide the very thing this chart needs to show (2016/2017 standing out from a flat, quiet baseline).
  function buildTrace(D, x0, w, midY, ampMax) {
    const pts = [], spikes = [];
    const xOf = (yr, frac) => x0 + ((yr - D.years[0] + frac) / D.N) * w;
    const maxM3 = Math.max(...D.m3p);
    for (let i = 0; i < D.N; i++) {
      const yr = D.years[i], rnd = mulberry32(yr * 7919 + 13);
      const dens = Math.round(KF.clamp(2 + Math.sqrt(D.m23[i]) * 2.1, 3, 46));
      for (let k = 0; k < dens; k++) {
        const frac = (k + 0.3 + 0.4 * rnd()) / dens;
        const amp = ampMax * KF.clamp(Math.sqrt(D.m23[i]) / 15, 0.06, 1);
        const y = midY + (rnd() * 2 - 1) * amp * (0.5 + 0.5 * rnd());
        pts.push([xOf(yr, frac), y]);
      }
      const k = D.m3p[i] / maxM3, up = ampMax * (0.22 + 1.35 * k), dn = ampMax * (0.14 + 0.55 * k);
      spikes.push({ x: xOf(yr, 0.5), yr, up, dn });
    }
    return { pts, spikes };
  }

  function drawPaper(ctx, x0, y0, w, h) {
    ctx.fillStyle = "#e2d6b0"; ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = "rgba(42,33,24,.35)"; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
    ctx.strokeStyle = PAPER_LINE; ctx.lineWidth = 1;
    for (let x = x0; x <= x0 + w; x += Math.max(18, w / 48)) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h); ctx.stroke(); }
  }

  function drawStrip(ctx, D, box, hoverYr, full) {
    const [x0, y0, w, h] = box, midY = y0 + h * 0.62, ampMax = h * 0.32;
    drawPaper(ctx, x0, y0, w, h);
    // station-count filled curve (own scale, bottom-anchored)
    const stY0 = y0 + h - 4, stH = h * 0.32;
    ctx.beginPath(); ctx.moveTo(x0, stY0);
    for (let i = 0; i < D.N; i++) {
      const yr = D.years[i], x = x0 + ((yr - D.years[0] + 0.5) / D.N) * w;
      const sv = yr >= D.stations.y0 ? D.stations.v[yr - D.stations.y0] : 0;
      ctx.lineTo(x, stY0 - (sv / D.maxSt) * stH);
    }
    ctx.lineTo(x0 + w, stY0); ctx.closePath();
    ctx.fillStyle = "rgba(92,122,114,.28)"; ctx.fill();
    ctx.strokeStyle = "rgba(92,122,114,.6)"; ctx.lineWidth = 1.2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < D.N; i++) {
      const yr = D.years[i]; if (yr < D.stations.y0) continue;
      const x = x0 + ((yr - D.years[0] + 0.5) / D.N) * w, sv = D.stations.v[yr - D.stations.y0];
      const y = stY0 - (sv / D.maxSt) * stH;
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const { pts, spikes } = buildTrace(D, x0, w, midY, ampMax);
    ctx.strokeStyle = PEN; ctx.lineWidth = full ? 1.1 : 0.9; ctx.lineJoin = "round";
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();

    for (const s of spikes) {
      const on = s.yr == hoverYr;
      ctx.strokeStyle = on ? "#ff5a45" : RED; ctx.lineWidth = on ? 2.2 : 1.5;
      ctx.beginPath(); ctx.moveTo(s.x, midY - s.up); ctx.lineTo(s.x, midY + s.dn); ctx.stroke();
    }
    // sequence callout: 2016(경주)/2017(포항) sit one year apart, too close for two separate labels — one
    // combined label centered between them, with a short leader line down to the taller (2016) spike.
    if (2016 >= D.years[0] && 2016 <= D.years[D.N - 1]) {
      const x16 = x0 + ((2016 - D.years[0] + 0.5) / D.N) * w;
      const xMid = x0 + ((2016.5 - D.years[0] + 0.5) / D.N) * w;
      ctx.textAlign = "center"; ctx.fillStyle = "rgba(168,52,42,.9)"; ctx.font = `700 ${full ? 11 : 9.5}px ${SANS}`;
      ctx.fillText("2016 경주 · 2017 포항", xMid, y0 - 8);
      ctx.strokeStyle = "rgba(168,52,42,.6)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xMid, y0 - 4); ctx.lineTo(x16, y0 + 4); ctx.stroke();
    }
    // hovered year marker
    if (hoverYr != null) {
      const x = x0 + ((hoverYr - D.years[0] + 0.5) / D.N) * w;
      ctx.strokeStyle = "rgba(42,33,24,.55)"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h); ctx.stroke(); ctx.setLineDash([]);
    }
    // axis ticks (decades)
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10 : 9}px ${MONO}`; ctx.textAlign = "center";
    for (let yr = 1980; yr <= D.years[D.N - 1]; yr += 10) {
      if (yr < D.years[0]) continue;
      const x = x0 + ((yr - D.years[0] + 0.5) / D.N) * w;
      ctx.fillText(String(yr), x, y0 + h + (full ? 16 : 13));
    }
    return { x0, y0, w, h };
  }

  function tip(ctx, w, h, lines, p) {
    const fs = 11.5;
    ctx.font = `700 ${fs + 1}px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 ${fs}px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 10 + lines.length * (fs + 6);
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(238,230,206,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(42,33,24,.4)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = `${i ? 500 : 700} ${i ? fs : fs + 1}px ${SANS}`; ctx.fillText(t, bx + 11, by + 6 + (i + 1) * (fs + 6) - 3); });
  }

  function yearLines(D, yr) {
    const i = D.years.indexOf(yr), L = [[`${yr}년`]];
    L.push([`전체 ${D.total[i].toFixed(0)}회`, INK]);
    L.push([`규모 3.0 이상 ${D.m3p[i].toFixed(0)}회`, RED]);
    L.push([`규모 2.0대 ${D.m23[i].toFixed(0)}회`, PEN]);
    if (yr >= D.stations.y0) L.push([`관측지점 ${KF.fmt(D.stations.v[yr - D.stations.y0])}곳`, STA]);
    if (D.dg && yr >= D.dg.y0 && yr - D.dg.y0 < D.dg.share.length) L.push([`대구·경북 몫 ${D.dg.share[yr - D.dg.y0]}%`, DIM]);
    return L;
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const D = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const box = [w * 0.04, h * 0.14, w * 0.92, h * 0.5];
    drawStrip(ctx, D, box, null, false);
    const a = KF.clamp((t % 10 - 0.5) / 1, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.08)}px ${SANS}`;
    ctx.fillText("규모 3.0 이상은 40년째 제자리", Math.max(60, w * 0.05), h * 0.86);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText("늘어난 건 관측망이 잡아낸 작은 흔들림", Math.max(60, w * 0.05), h * 0.95);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    let hoverYr = null, hover = null, showFull = true, strip = null;
    KF.segment(controls, [{ id: "all", label: "전체" }, { id: "m3", label: "규모 3.0 이상만" }], "all", (id) => { showFull = id === "all"; });

    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top];
      if (strip && hover[0] >= strip.x0 && hover[0] <= strip.x0 + strip.w && hover[1] >= strip.y0 - 20 && hover[1] <= strip.y0 + strip.h + 20) {
        const frac = (hover[0] - strip.x0) / strip.w;
        hoverYr = D.years[KF.clamp(Math.round(frac * D.N - 0.5), 0, D.N - 1)];
      } else hoverYr = null;
    });
    stage.addEventListener("pointerleave", () => { hover = null; hoverYr = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const box = full ? [w * 0.06, h * 0.24, w * 0.88, h * 0.42] : [w * 0.07, h * 0.2, w * 0.86, h * 0.3];
      if (!showFull) {
        // "규모 3.0 이상만": dim the paper/noise, keep only the red ticks readable by fading the pen trace
      }
      strip = drawStrip(ctx, D, box, hoverYr, full);
      ctx.globalAlpha = showFull ? 0 : 0.72;
      if (!showFull) { ctx.fillStyle = "#e2d6b0"; ctx.fillRect(box[0], box[1] - 14, box[2], box[3] * 0.62 + 14); }
      ctx.globalAlpha = 1;

      const i0 = 0, i1 = D.N - 1;
      const avgOf = (arr, a, b) => { let s = 0, n = 0; for (let i = a; i <= b; i++) { s += arr[i]; n++; } return s / n; };
      const eEnd = D.years.indexOf(1997), rStart = D.years.indexOf(2018);
      const m3Early = avgOf(D.m3p, 0, eEnd), m3Recent = avgOf(D.m3p, rStart, i1);
      const m23Early = avgOf(D.m23, 0, eEnd), m23Recent = avgOf(D.m23, rStart, i1);

      if (full) {
        const x0 = box[0], ty = box[1] - 48;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 21px ${SERIF}`;
        ctx.fillText("지진계 두루마리", x0, 40);
        ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
        ctx.fillText("가로 = 연도(1978→2025) · 검은 선 흔들림 = 작은 지진 밀도 · 초록 면 = 관측지점 수 · 빨간 못 = 규모 3.0 이상", x0, 62);

        const by = box[1] + box[3] + 56;
        ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`;
        ctx.fillText(`${D.years[0]}–1997년 평균`, x0, by);
        ctx.fillText(`2018–${D.years[D.N - 1]}년 평균`, x0 + box[2] * 0.36, by);
        ctx.fillStyle = RED; ctx.font = `700 26px ${SANS}`;
        ctx.fillText(`${m3Early.toFixed(1)}회`, x0, by + 30);
        ctx.fillText(`${m3Recent.toFixed(1)}회`, x0 + box[2] * 0.36, by + 30);
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`;
        ctx.fillText("규모 3.0 이상, 한 해 평균", x0, by + 48);
        ctx.fillStyle = PEN; ctx.font = `600 13px ${SANS}`;
        ctx.fillText(`규모 2.0대는 ${m23Early.toFixed(0)} → ${m23Recent.toFixed(0)}회로 늘었다`, x0 + box[2] * 0.68, by + 20);
        ctx.fillStyle = STA; ctx.font = `500 11px ${SANS}`;
        ctx.fillText(`관측지점 ${D.stations.v[0]} → ${D.stations.v[D.stations.v.length - 1]}곳 (${D.stations.y0}–${D.years[D.N - 1]}년)`, x0 + box[2] * 0.68, by + 40);
      } else {
        const y0b = box[1] + box[3] + 34;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 13px ${SANS}`;
        ctx.fillText("규모 3.0 이상, 한 해 평균", 14, y0b);
        ctx.fillStyle = RED; ctx.font = `700 20px ${SANS}`;
        ctx.fillText(`${m3Early.toFixed(1)}회 → ${m3Recent.toFixed(1)}회`, 14, y0b + 24);
        ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`;
        ctx.fillText(`(${D.years[0]}–1997 대 2018–${D.years[D.N - 1]})`, 14, y0b + 38);
        ctx.fillStyle = PEN; ctx.font = `600 11px ${SANS}`;
        ctx.fillText(`규모 2.0대는 ${m23Early.toFixed(0)}→${m23Recent.toFixed(0)}회, 관측지점 ${D.stations.v[D.stations.v.length - 1]}곳`, 14, y0b + 56);
      }
      if (hoverYr != null && hover) tip(ctx, w, h, yearLines(D, hoverYr), hover);
    });
  }

  VIZ.earthquakes = { thumb, mount, bg: BG };
})();
