// 61 blood-donors — "헌혈버스 좌석표". A mobile blood-donation bus, 40 seats, filled front-to-back by age
// band in proportion to that year's donation share. The front rows (youngest) shrink year by year while
// the back rows grow — the bus stays full (total events ~flat) but who is sitting in it changes.
(() => {
  const BG = "#e8cfd2";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#3a1f28", DIM = "rgba(58,31,40,.64)", FAINT = "rgba(58,31,40,.14)";
  const BODY = "#f7edea", BODYD = "#e4d2cf", GLASS = "#bcd9e3", RED = "#b5303f";
  const AGEC = ["#3f7b8c", "#4fa07f", "#c7a23a", "#d97a3f", "#b5303f", "#6b4a7a"];
  const ROWS = 10, PER_ROW = 4; // 2 seats + aisle + 2 seats
  const N = ROWS * PER_ROW;

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const idx = {}; d.years.forEach((y, i) => (idx[y] = i));
    // largest-remainder seat allocation per year, front(young) -> back(old)
    const seatsByYear = d.years.map((y, yi) => {
      const shares = d.ages[yi].map((v) => (v / d.events[yi]) * N);
      const base = shares.map(Math.floor);
      let left = N - base.reduce((a, b) => a + b, 0);
      const rema = shares.map((v, k) => [v - Math.floor(v), k]).sort((a, b) => b[0] - a[0]);
      for (let k = 0; k < rema.length && left > 0; k++, left--) base[rema[k][1]]++;
      const seq = [];
      base.forEach((n, band) => { for (let k = 0; k < n; k++) seq.push(band); });
      return seq;
    });
    DEC = { ...d, idx, seatsByYear };
    return DEC;
  }

  function busOutline(ctx, x, y, w, h) {
    const r = h * 0.16;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r * 1.4, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawBus(ctx, box, seq, hoverSeat, grow) {
    const [x, y, w, h] = box;
    ctx.save();
    busOutline(ctx, x, y, w, h);
    ctx.fillStyle = BODY; ctx.fill();
    ctx.strokeStyle = BODYD; ctx.lineWidth = 2; ctx.stroke();
    // red cross emblem on the side
    ctx.fillStyle = RED;
    const ex = x + w * 0.5, ey = y + h * 0.09, es = Math.min(w, h) * 0.028;
    ctx.fillRect(ex - es * 0.35, ey - es, es * 0.7, es * 2);
    ctx.fillRect(ex - es, ey - es * 0.35, es * 2, es * 0.7);
    // windshield hint at front (top)
    ctx.fillStyle = GLASS; ctx.globalAlpha = 0.55;
    ctx.fillRect(x + w * 0.12, y + h * 0.02, w * 0.76, h * 0.045);
    ctx.globalAlpha = 1;
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.min(w, h) * 0.028}px ${SANS}`; ctx.textAlign = "center";
    ctx.fillText("앞", x + w / 2, y + h * 0.075);
    ctx.restore();

    // seats grid: ROWS front(0)->back, PER_ROW: 0,1 | aisle | 2,3
    const pad = w * 0.1, top = y + h * 0.14, bottom = y - h * 0.02 + h;
    const rowH = (bottom - top - h * 0.05) / ROWS;
    const seatW = (w - pad * 2) * 0.21, aisle = (w - pad * 2) * 0.16;
    const cols = [x + pad, x + pad + seatW + w * 0.02, 0, 0];
    cols[2] = cols[1] + seatW + aisle; cols[3] = cols[2] + seatW + w * 0.02;
    let hit = null;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < PER_ROW; c++) {
        const idx = r * PER_ROW + c;
        if (idx >= seq.length * grow) continue;
        const band = seq[idx];
        const sx = cols[c], sy = top + r * rowH;
        const sw = seatW, sh = rowH * 0.72;
        const on = hoverSeat === idx;
        ctx.fillStyle = on ? "#fff" : AGEC[band];
        ctx.globalAlpha = on ? 1 : 0.92;
        const rr = Math.min(sw, sh) * 0.22;
        ctx.beginPath();
        ctx.moveTo(sx + rr, sy);
        ctx.arcTo(sx + sw, sy, sx + sw, sy + sh, rr);
        ctx.arcTo(sx + sw, sy + sh, sx, sy + sh, rr);
        ctx.arcTo(sx, sy + sh, sx, sy, rr);
        ctx.arcTo(sx, sy, sx + sw, sy, rr);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        if (on) { ctx.strokeStyle = AGEC[band]; ctx.lineWidth = 2; ctx.stroke(); }
        if (hoverSeat != null || true) {
          // store hit box via closure return below
        }
        if (hit === null && false) hit = idx;
      }
    }
    return { top, rowH, cols, seatW, sh: rowH * 0.72, pad };
  }

  function seatAt(geo, box, px, py) {
    const [x, y] = box;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < PER_ROW; c++) {
        const sx = geo.cols[c], sy = geo.top + r * geo.rowH;
        if (px >= sx && px <= sx + geo.seatW && py >= sy && py <= sy + geo.sh) return r * PER_ROW + c;
      }
    }
    return null;
  }

  function trend(ctx, x0, x1, y, vals, color, label, full) {
    const lo = Math.min(...vals) * 0.94, hi = Math.max(...vals) * 1.04, span = full ? 30 : 20;
    const xs = (i) => x0 + (x1 - x0) * (i / (vals.length - 1));
    const ys = (v) => y - ((v - lo) / (hi - lo)) * span;
    ctx.beginPath();
    vals.forEach((v, i) => { const xx = xs(i), yy = ys(v); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); });
    ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath(); ctx.arc(xs(vals.length - 1), ys(vals[vals.length - 1]), 2.6, 0, 7); ctx.fillStyle = color; ctx.fill();
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 ${full ? 10.5 : 9.5}px ${SANS}`;
    ctx.fillText(label, x0, y - span - 4);
  }

  function tip(ctx, w, h, lines, p) {
    ctx.font = `600 12px ${SANS}`;
    const bw = Math.max(...lines.map((l) => ctx.measureText(l[0]).width)) + 22, bh = 10 + lines.length * 17;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6);
    const by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(58,31,40,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || "#f7edea"; ctx.font = `${i ? 500 : 700} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 16 + i * 17); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const D = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, yi = c < 5 ? D.idx[D.years[0]] : D.idx[D.years[D.years.length - 1]];
    const grow = KF.ease(KF.clamp((c % 5) / 3.2, 0, 1));
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.09)}px ${SANS}`;
    ctx.fillText("헌혈버스", w * 0.42, h * 0.18);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`;
    ctx.fillText(`${D.years[yi]}년`, w * 0.42, h * 0.3);
    drawBus(ctx, [w * 0.02, h * 0.06, w * 0.34, h * 0.9], D.seatsByYear[yi], null, grow);
    const youth = D.ages[yi][0] + D.ages[yi][1], share = (youth / D.events[yi]) * 100;
    ctx.fillStyle = AGEC[0]; ctx.font = `700 ${Math.round(h * 0.16)}px ${MONO}`;
    ctx.fillText(`${share.toFixed(0)}%`, w * 0.42, h * 0.62);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText("16–29세 몫", w * 0.42, h * 0.74);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    let year = D.years[D.years.length - 1], hover = null, geo = null, box = null, t0 = performance.now();
    KF.segment(controls, D.picks.map((y) => ({ id: y, label: `${y}년` })), year, (id) => { year = +id; t0 = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const yi = D.idx[year];
      const grow = KF.reduced ? 1 : KF.ease(KF.clamp((performance.now() - t0) / 900, 0, 1));
      box = full ? [24, 26, w * 0.3, h - 60] : [16, h * 0.30, w * 0.4, h * 0.62];
      geo = drawBus(ctx, box, D.seatsByYear[yi], null, grow);
      let hoverSeat = null;
      if (hover) {
        const s = seatAt(geo, box, hover[0], hover[1]);
        if (s != null && s < D.seatsByYear[yi].length) hoverSeat = s;
      }
      if (hoverSeat != null) drawBus(ctx, box, D.seatsByYear[yi], hoverSeat, grow);

      const rx = box[0] + box[2] + (full ? 34 : 14);
      const topY = full ? 40 : 18;
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 21 : 15}px ${SERIF}`;
      ctx.fillText(`${year}년 헌혈버스, 좌석 40석`, rx, topY);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12.5 : 9.5}px ${SANS}`;
      ctx.fillText(full ? "한 좌석 = 그해 헌혈 건수의 40분의 1 몫 · 앞(왼쪽 위)이 젊은 나이대" : "좌석 1개 = 헌혈 건수의 1/40 · 앞이 젊은 나이대", rx, topY + (full ? 22 : 16));

      // legend: 3 columns full / 2 columns narrow
      const ly = topY + (full ? 40 : 30);
      const lcols = full ? 3 : 2, lcw = full ? 150 : (w - rx - 10) / lcols;
      D.labels.forEach((lab, k) => {
        const lx = rx + (k % lcols) * lcw, lyy = ly + Math.floor(k / lcols) * (full ? 20 : 17);
        ctx.fillStyle = AGEC[k]; ctx.beginPath(); ctx.arc(lx + 4, lyy - 4, 4, 0, 7); ctx.fill();
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`; ctx.fillText(lab, lx + 12, lyy);
      });

      // big numbers: 3-across full width, stacked rows on narrow (avoids column overlap)
      const by = ly + (full ? 58 : Math.ceil(D.labels.length / lcols) * 17 + 22);
      const stats = [
        ["총 헌혈", `${KF.fmt(D.events[yi])}건`],
        ["헌혈자 실인원", `${KF.fmt(D.donors[yi])}명`],
        ["1인당 평균", `${D.per_donor[yi].toFixed(2)}회`],
      ];
      stats.forEach((s, k) => {
        if (full) {
          const sx = rx + k * 165;
          ctx.fillStyle = DIM; ctx.font = `600 11px ${SANS}`; ctx.fillText(s[0], sx, by);
          ctx.fillStyle = INK; ctx.font = `700 18px ${MONO}`; ctx.fillText(s[1], sx, by + 22);
        } else {
          const syy = by + k * 20;
          ctx.fillStyle = DIM; ctx.font = `600 10px ${SANS}`; ctx.fillText(s[0], rx, syy);
          ctx.fillStyle = INK; ctx.font = `700 12.5px ${MONO}`; ctx.textAlign = "right";
          ctx.fillText(s[1], w - 14, syy); ctx.textAlign = "left";
        }
      });

      // context trend lines: youth pop vs 65+ pop (headerY -> trend1 -> trend2, each row well clear of the last)
      const headerY = h - (full ? 140 : 104);
      const row1 = headerY + (full ? 56 : 40), row2 = row1 + (full ? 48 : 36);
      const man = (v) => `${(v / 10000).toFixed(0)}만`;
      ctx.fillStyle = DIM; ctx.font = `600 ${full ? 11.5 : 10}px ${SANS}`;
      ctx.fillText(`${D.years[0]}–${D.years[D.years.length - 1]}년 인구 추세 (통계청 추계)`, rx, headerY);
      trend(ctx, rx, w - (full ? 40 : 16), row1, D.youth_pop, AGEC[0], `15–29세 인구 ${man(D.youth_pop[0])}→${man(D.youth_pop[D.youth_pop.length - 1])}`, full);
      trend(ctx, rx, w - (full ? 40 : 16), row2, D.old_pop, AGEC[4], `65세 이상 인구 ${man(D.old_pop[0])}→${man(D.old_pop[D.old_pop.length - 1])}`, full);

      if (hoverSeat != null) {
        const band = D.seatsByYear[yi][hoverSeat];
        const cnt = D.ages[yi][band], share = (cnt / D.events[yi]) * 100;
        tip(ctx, w, h, [[`${year}년 · ${D.labels[band]}`], [`${KF.fmt(cnt)}건 · 전체의 ${share.toFixed(1)}%`, AGEC[band]]], hover);
      }
    });
  }

  VIZ["blood-donors"] = { thumb, mount, bg: BG };
})();
