// 81 car-growth — "낮의 주차타워 단면". 콘크리트 주차타워를 옆에서 본 단면: 한 해가 한 층이다. 층마다
// 주차칸이 늘어서고, 칸 수(=자동차 등록대수)는 해마다 예외 없이 길어진다. 같은 층 옆에 놓인 붉은 표식은
// 그해 인구 — 2019년 층에서 꺾여 거꾸로 내려간다. 두 번째 보기는 17개 시도가 인구·자동차로 벌이는 줄다리기.
(() => {
  const BG = "#c5c0a6";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#2a2319", MUTE = "rgba(42,35,25,.64)", FAINT = "rgba(42,35,25,.16)";
  const SLAB = "#e7e2d2", SLAB_EDGE = "rgba(42,35,25,.28)", SLAB_HI = "rgba(255,255,255,.55)";
  const CAR = "#26526d", CAR_HI = "#173a4e";
  const POP_DOWN = "#b8412a", POP_UP = "#4c6b34";

  let DEC = null;
  function decode(d) {
    if (DEC && DEC.d === d) return DEC;
    const carMax = Math.max(...d.carNat), carMin = Math.min(...d.carNat);
    const popMax = Math.max(...d.popNat), popMin = Math.min(...d.popNat);
    const regions = [...d.regions].sort((a, b) => a.popChg - b.popChg);
    return (DEC = { d, carMax, carMin, popMax, popMin, regions });
  }

  function slab(ctx, x0, y, w, floorH, carFrac, hi, full) {
    const bh = floorH * 0.62;
    // concrete floor slab (full available run, faint) + the filled car-bay run on top
    ctx.fillStyle = hi ? "#f5f1e2" : SLAB; ctx.fillRect(x0, y - bh, w, bh);
    ctx.fillStyle = CAR_HI ? (hi ? "#0f2c3d" : CAR) : CAR;
    const cw = w * carFrac;
    ctx.fillStyle = hi ? "#0f2c3d" : CAR; ctx.fillRect(x0, y - bh, cw, bh);
    // bay dividers on the filled run
    ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1;
    for (let x = x0 + (full ? 10 : 8); x < x0 + cw - 2; x += full ? 10 : 8) { ctx.beginPath(); ctx.moveTo(x, y - bh + 2); ctx.lineTo(x, y - 2); ctx.stroke(); }
    ctx.strokeStyle = SLAB_EDGE; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y - bh + 0.5, w - 1, bh - 1);
    ctx.fillStyle = SLAB_HI; ctx.fillRect(x0, y - bh, w, 1.4);
    return { x0, x1: x0 + w, top: y - bh, bottom: y };
  }

  function towerView(ctx, X, box, hover, grow, caption = true) {
    const [x0, y0, w, h] = box, full = w > 460;
    const d = X.d, n = d.years.length, floorH = h / n;
    const trackW = w - (full ? 150 : 110);
    if (caption) {
      ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 10.5 : 9}px ${SANS}`;
      const cap = full
        ? "층 = 연도(2015 맨 아래 → 2025 맨 위, ★=인구 정점) · 칸 길이 = 자동차 등록대수 · 점 = 인구(자체 범위 안 위치 — 실제 변동은 1.4%로 자동차 26%보다 훨씬 작다)"
        : "층=연도(★=인구 정점) · 칸 길이=자동차 · 점=인구(자체 범위, 실제 변동은 작음)";
      ctx.fillText(cap, x0, y0 - 10);
    }
    let hit = null;
    for (let i = 0; i < n; i++) {
      const y = y0 + h - i * floorH, yr = d.years[i], isPeak = yr === d.popPeak;
      const g = KF.clamp((grow - i * 0.7) / 1.2, 0, 1);
      const carFrac = ((d.carNat[i] - X.carMin) / (X.carMax - X.carMin) * 0.78 + 0.16) * g;
      const hi = hover && hover[0] >= x0 && hover[0] <= x0 + trackW && hover[1] >= y - floorH * 0.62 && hover[1] <= y;
      const geo = slab(ctx, x0, y, trackW, floorH, carFrac, hi, full);
      ctx.textAlign = "right"; ctx.fillStyle = isPeak ? POP_DOWN : MUTE; ctx.font = `${isPeak ? 700 : 600} ${full ? 11 : 9.5}px ${MONO}`;
      const yl = full ? String(yr) : `'${String(yr).slice(2)}`;
      ctx.fillText(isPeak ? `★${yl}` : yl, x0 - 8, y - floorH * 0.31 + 4);
      // population marker: own min-max scale (see caption — a different, much narrower scale than the car bars)
      const popX = x0 + ((d.popNat[i] - X.popMin) / (X.popMax - X.popMin)) * trackW * g;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(popX, y - floorH * 0.31, full ? 4.2 : 3.4, 0, 7); ctx.fill();
      ctx.fillStyle = yr <= d.popPeak ? POP_UP : POP_DOWN; ctx.beginPath(); ctx.arc(popX, y - floorH * 0.31, full ? 2.8 : 2.2, 0, 7); ctx.fill();
      if (full) {
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 10.5px ${MONO}`;
        ctx.fillText(`${(d.carNat[i] / 1e4).toFixed(0)}만대`, x0 + trackW + 10, y - floorH * 0.31 - 1);
        ctx.fillStyle = MUTE; ctx.font = `500 9.5px ${MONO}`;
        ctx.fillText(`인구 ${(d.popNat[i] / 1e4).toFixed(0)}만`, x0 + trackW + 10, y - floorH * 0.31 + 13);
      }
      if (hi) hit = { yr, car: d.carNat[i], pop: d.popNat[i] };
    }
    return hit;
  }

  function tugView(ctx, X, box, hover) {
    const [x0, y0, w, h] = box, full = w > 460;
    const regs = X.regions, rh = h / regs.length;
    const midX = x0 + w * (full ? 0.42 : 0.5);
    const popMax = Math.max(...regs.map((r) => Math.abs(r.popChg))), carMax = Math.max(...regs.map((r) => r.carChg));
    const leftW = midX - x0 - (full ? 70 : 46), rightW = x0 + w - midX - 8 - (full ? 82 : 56);
    ctx.textAlign = "center"; ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 10.5 : 9}px ${SANS}`;
    ctx.fillText("인구 증감(2015→2025)", midX - leftW / 2 - 20, y0 - 10);
    ctx.fillText("자동차 증감", midX + rightW / 2 + 20, y0 - 10);
    let hit = null;
    regs.forEach((r, i) => {
      const y = y0 + i * rh + rh * 0.5;
      const hiRow = hover && hover[1] >= y - rh * 0.44 && hover[1] < y + rh * 0.44;
      if (hiRow) { ctx.fillStyle = "rgba(42,35,25,.06)"; ctx.fillRect(x0, y - rh * 0.5, w, rh); }
      ctx.textAlign = "center"; ctx.fillStyle = hiRow ? INK : MUTE; ctx.font = `${hiRow ? 700 : 500} ${full ? 11 : 9.5}px ${SANS}`;
      ctx.fillText(r.name, midX, y + 4);
      const pw = (Math.abs(r.popChg) / popMax) * leftW;
      ctx.fillStyle = r.popChg < 0 ? POP_DOWN : POP_UP;
      ctx.fillRect(midX - 26 - pw, y - rh * 0.22, pw, rh * 0.44);
      ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 10.5 : 9}px ${MONO}`;
      ctx.fillText(`${r.popChg > 0 ? "+" : ""}${r.popChg.toFixed(1)}%`, midX - 30 - pw, y + 4);
      const cw = (r.carChg / carMax) * rightW;
      ctx.fillStyle = CAR; ctx.fillRect(midX + 26, y - rh * 0.22, cw, rh * 0.44);
      ctx.textAlign = "left"; ctx.fillText(`+${r.carChg.toFixed(1)}%`, midX + 30 + cw, y + 4);
      if (hiRow) hit = r;
    });
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(midX, y0 - 4); ctx.lineTo(midX, y0 + h + 2); ctx.stroke();
    return hit;
  }

  function headline(ctx, x, y, X, full) {
    const d = X.d;
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 11 : 9.5}px ${MONO}`;
    ctx.fillText("PARKING TOWER · " + `${d.y0}–${d.y1}`, x, y);
    ctx.fillStyle = INK; ctx.font = `700 ${full ? 18 : 14}px ${SANS}`;
    ctx.fillText("인구가 줄어도 자동차는 늘까", x, y + (full ? 25 : 18));
    const by = y + (full ? 56 : 38);
    ctx.font = `600 ${full ? 10.5 : 9.5}px ${SANS}`; ctx.fillStyle = MUTE;
    ctx.fillText(`인구 (${d.popPeak}년 정점 이후)`, x, by); ctx.fillText("자동차 등록", x + (full ? 170 : 118), by);
    ctx.font = `800 ${full ? 22 : 16}px ${SANS}`;
    const popChg = ((d.popNat[d.popNat.length - 1] / d.popNat[d.years.indexOf(d.popPeak)]) - 1) * 100;
    const carChg = ((d.carNat[d.carNat.length - 1] / d.carNat[0]) - 1) * 100;
    ctx.fillStyle = POP_DOWN; ctx.fillText(`${popChg.toFixed(1)}%`, x, by + (full ? 26 : 19));
    ctx.fillStyle = CAR; ctx.fillText(`+${carChg.toFixed(1)}%`, x + (full ? 170 : 118), by + (full ? 26 : 19));
    return by + (full ? 42 : 30);
  }

  function tip(ctx, w, h, lines, hover) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : `500 11px ${MONO}`);
    const bw = Math.min(w - 16, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 14 + lines.length * 18;
    const bx = KF.clamp(hover[0] + 14, 8, w - bw - 8), by = KF.clamp(hover[1] - bh - 10, 8, h - bh - 8);
    ctx.fillStyle = "rgba(250,248,240,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + j * 18); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d0) {
    const X = decode(d0), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    towerView(ctx, X, [w * 0.1, h * 0.18, w * 0.42, h * 0.74], null, KF.ease(KF.clamp((c - 0.3) / 2, 0, 1)) * 16, false);
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText("2015→2025", w * 0.6, h * 0.2);
    ctx.fillStyle = POP_DOWN; ctx.font = `800 ${Math.round(h * 0.085)}px ${SANS}`;
    ctx.fillText("인구 감소", w * 0.6, h * 0.34);
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText("그래도 자동차는", w * 0.6, h * 0.56);
    ctx.fillStyle = CAR; ctx.font = `800 ${Math.round(h * 0.1)}px ${SANS}`;
    ctx.fillText("17곳 모두 증가", w * 0.6, h * 0.7);
    if (c > 9.3) { ctx.fillStyle = `rgba(197,192,166,${(c - 9.3) / 0.7})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d0) {
    const X = decode(d0), s = KF.canvas(stage);
    let view = "tower", t0 = performance.now(), hover = null;
    KF.segment(controls, [{ id: "tower", label: "연도별 주차타워" }, { id: "tug", label: "시도 17곳 줄다리기" }], view, (id) => { view = id; t0 = performance.now(); });
    const onMove = (e) => { const b = stage.getBoundingClientRect(); hover = [e.clientX - b.left, e.clientY - b.top]; };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerdown", onMove);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const x0 = full ? 32 : 14;
      const bodyTop = headline(ctx, x0, full ? 28 : 20, X, full);
      const el = (performance.now() - t0) / 1000;
      const boxH = h - bodyTop - (full ? 20 : 14);
      let hit = null;
      if (view === "tower") {
        hit = towerView(ctx, X, [x0 + (full ? 58 : 46), bodyTop + 6, w - x0 * 2 - (full ? 58 : 46), boxH - 6], hover, KF.clamp(el / 0.9, 0, 1) * 16);
      } else {
        hit = tugView(ctx, X, [x0, bodyTop + 16, w - x0 * 2, boxH - 16], hover);
      }
      if (hit && hover) {
        const lines = hit.yr != null
          ? [[`${hit.yr}년`, 1], [`자동차 ${KF.fmt(hit.car)}대`, 0], [`인구 ${KF.fmt(hit.pop)}명`, 0]]
          : [[hit.name, 1], [`인구 ${hit.popChg > 0 ? "+" : ""}${hit.popChg.toFixed(1)}%`, 0], [`자동차 +${hit.carChg.toFixed(1)}%`, 0]];
        tip(ctx, w, h, lines, hover);
      }
    });
  }

  VIZ["car-growth"] = { thumb, mount, bg: BG };
})();
