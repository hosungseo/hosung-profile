// 92 fuel-price-lag — "두 계기판과 고무호스 (twin gauges + hose)". A supply-price gauge and a
// retail-price gauge, joined by a rubber hose; a coloured pulse leaves the supply gauge the week
// its price moves and reaches the retail gauge after the chosen lag. The needles are the two
// prices themselves, not a scatter of their correlation.
(() => {
  const BG = "#a4ccc8";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#1c2f2c", DIM = "rgba(28,47,44,.64)", FAINT = "rgba(28,47,44,.18)";
  const FACE = "#f3ecd9", RIM = "#8a6f2e", RIM_HI = "#c9a94a", NEEDLE = "#a23b2c";
  const UP = "#b1502f", DOWN = "#2f6b8a", HOSE = "#3a4440";
  const A0 = Math.PI * 0.78, A1 = Math.PI * 2.22; // gauge sweep (radians), like a speedometer

  function range(d, product) {
    const vals = d.series.flatMap((r) => r[product]);
    const lo = Math.floor(Math.min(...vals) / 50) * 50, hi = Math.ceil(Math.max(...vals) / 50) * 50;
    return [lo, hi];
  }

  function gauge(ctx, cx, cy, R, value, lo, hi, opts = {}) {
    ctx.save();
    ctx.fillStyle = "rgba(20,25,20,.22)"; ctx.beginPath(); ctx.ellipse(cx + 4, cy + 6, R * 1.02, R * 1.02, 0, 0, Math.PI * 2); ctx.fill();
    const rimG = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    rimG.addColorStop(0, RIM_HI); rimG.addColorStop(0.5, RIM); rimG.addColorStop(1, RIM_HI);
    ctx.fillStyle = rimG; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = FACE; ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, Math.PI * 2); ctx.fill();
    // ticks
    const n = 10;
    for (let i = 0; i <= n; i++) {
      const a = A0 + (A1 - A0) * (i / n), v = lo + (hi - lo) * (i / n);
      const r0 = R * 0.72, r1 = R * (i % 5 === 0 ? 0.62 : 0.67);
      ctx.strokeStyle = "rgba(28,20,10,.55)"; ctx.lineWidth = i % 5 === 0 ? 1.8 : 1;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      if (i % 5 === 0 && opts.ticks) {
        ctx.fillStyle = DIM; ctx.font = `500 9px ${MONO}`; ctx.textAlign = "center";
        const rt = R * 0.52; ctx.fillText(v.toFixed(0), cx + Math.cos(a) * rt, cy + Math.sin(a) * rt + 3);
      }
    }
    // arc traversed so far (a soft band)
    const av = A0 + (A1 - A0) * KF.clamp((value - lo) / (hi - lo), 0, 1);
    ctx.strokeStyle = opts.color || NEEDLE; ctx.globalAlpha = 0.28; ctx.lineWidth = R * 0.1; ctx.lineCap = "butt";
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.72, A0, av); ctx.stroke(); ctx.globalAlpha = 1;
    // needle
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(av);
    ctx.fillStyle = opts.color || NEEDLE;
    ctx.beginPath(); ctx.moveTo(-R * 0.12, -R * 0.045); ctx.lineTo(R * 0.68, 0); ctx.lineTo(-R * 0.12, R * 0.045); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#3a2f12"; ctx.beginPath(); ctx.arc(cx, cy, R * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.arc(cx - R * 0.02, cy - R * 0.02, R * 0.03, 0, Math.PI * 2); ctx.fill();
    // digital readout
    ctx.fillStyle = "#20241d"; ctx.beginPath(); ctx.roundRect(cx - R * 0.42, cy + R * 0.34, R * 0.84, R * 0.28, 3); ctx.fill();
    ctx.fillStyle = "#bfe3c8"; ctx.textAlign = "center"; ctx.font = `700 ${Math.round(R * 0.19)}px ${MONO}`;
    ctx.fillText(value.toFixed(0), cx, cy + R * 0.34 + R * 0.21);
    ctx.restore();
  }

  function hose(ctx, x0, y0, x1, y1, sag, pulse) {
    const mx = (x0 + x1) / 2, my = Math.max(y0, y1) + sag;
    ctx.strokeStyle = HOSE; ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0, y0 - 2); ctx.quadraticCurveTo(mx, my - 2, x1, y1 - 2); ctx.stroke();
    if (pulse != null) {
      const t = KF.clamp(pulse.t, 0, 1);
      const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1;
      const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1;
      ctx.fillStyle = pulse.up ? UP : DOWN; ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.4; ctx.stroke();
    }
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `700 12px ${SANS}`;
    let bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22;
    const bh = 12 + lines.length * 18;
    const bx = KF.clamp(x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(28,47,44,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || "#eef6f0"; ctx.font = `${i ? 500 : 700} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 18 + i * 18); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const [lo, hi] = range(d, "gas");
    const c = t % 10, idx = Math.min(d.series.length - 1, Math.round(KF.clamp(c / 9, 0, 1) * (d.series.length - 1)));
    // gauges sit lower/smaller than the mount() view so a title fits above them, clear of the board's
    // top-left "데이터 N개" badge (~90x36px)
    const r = h * 0.26, cy = h * 0.55, cxL = w * 0.28, cxR = w * 0.72;
    hose(ctx, cxL, cy + r * 0.55, cxR, cy + r * 0.55, h * 0.1, null);
    gauge(ctx, cxL, cy, r, d.series[idx].gas[0], lo, hi, {});
    gauge(ctx, cxR, cy, r, d.series[Math.min(d.series.length - 1, idx + 1)].gas[1], lo, hi, { color: "#2f6b8a" });
    ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.06)}px ${SANS}`;
    ctx.fillText("공급", cxL, h * 0.9); ctx.fillText("판매(1주 뒤)", cxR, h * 0.9);
    ctx.textAlign = "left"; ctx.font = `700 ${Math.round(h * 0.07)}px ${SANS}`;
    ctx.fillText("주유소 가격, 며칠 늦게 온다", w * 0.05, h * 0.24);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let product = "gas", lag = 1, hover = null;
    let idx = 0, t0 = performance.now(), animating = true;
    KF.segment(controls, [{ id: "gas", label: "보통휘발유" }, { id: "diesel", label: "자동차용경유" }], product, (id) => { product = id; });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "시차"; controls.appendChild(sep);
    KF.segment(controls, [0, 1, 2, 3, 4].map((k) => ({ id: k, label: `${k}주` })), lag, (id) => { lag = id; });
    const range_ = document.createElement("input");
    range_.type = "range"; range_.min = 0; range_.max = d.series.length - 1; range_.step = 1; range_.value = 0;
    const lab = document.createElement("label"); lab.append("주차", range_); controls.appendChild(lab);
    range_.oninput = () => { idx = +range_.value; animating = false; };

    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);

      if (animating) {
        const el = (performance.now() - t0) / 1000, p = KF.clamp((el - 0.3) / 5, 0, 1);
        idx = Math.round(p * (d.series.length - 1)); range_.value = idx;
        if (p >= 1) animating = false;
      }
      const ridx = Math.min(d.series.length - 1, idx + lag);
      const [lo, hi] = range(d, product);
      const supplyV = d.series[idx][product][0], retailV = d.series[ridx][product][1];
      const week = d.series[idx].week, retailWeek = d.series[ridx].week;

      const panelW = full ? w * 0.34 : 0, sceneW = w - panelW;
      const R = Math.min(sceneW * 0.2, h * 0.28), cy = h * (full ? 0.42 : 0.36);
      const cxL = sceneW * 0.28, cxR = sceneW * 0.72;

      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
      ctx.fillText(`두 계기판 · ${week}`, full ? 22 : 12, full ? 34 : 24);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11.5 : 10}px ${SANS}`;
      ctx.fillText("호스 속 점 = 공급가격이 움직인 방향 · 오른쪽 계기판은 지정한 시차만큼 뒤의 주유소 가격", full ? 22 : 12, full ? 54 : 38);

      // pulse: animates from supply gauge to retail gauge across the chosen lag; colour = direction of that week's supply change
      const prevSupply = idx > 0 ? d.series[idx - 1][product][0] : supplyV;
      const up = supplyV >= prevSupply;
      const pulseT = lag === 0 ? 1 : (animating ? 1 : KF.clamp(((performance.now() - t0) % 1600) / 1600, 0, 1));
      hose(ctx, cxL, cy + R * 0.62, cxR, cy + R * 0.62, h * 0.1, { t: pulseT, up });

      gauge(ctx, cxL, cy, R, supplyV, lo, hi, { ticks: full, color: UP });
      gauge(ctx, cxR, cy, R, retailV, lo, hi, { ticks: full, color: DOWN });
      ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 13 : 11}px ${SANS}`;
      ctx.fillText("정유사 공급가격", cxL, cy + R + (full ? 30 : 22));
      ctx.fillText(lag ? `주유소 판매가격 (+${lag}주)` : "주유소 판매가격(같은 주)", cxR, cy + R + (full ? 30 : 22));
      ctx.font = `500 10.5px ${MONO}`; ctx.fillStyle = DIM;
      ctx.fillText(retailWeek, cxR, cy + R + (full ? 46 : 36));

      const hiL = hover && Math.hypot(hover[0] - cxL, hover[1] - cy) < R;
      const hiR = hover && Math.hypot(hover[0] - cxR, hover[1] - cy) < R;
      if (hiL) tip(ctx, w, h, hover[0], hover[1], [["정유사 공급가격", "#eef6f0"], [`${week}`], [`${supplyV.toFixed(2)} 원/L`]]);
      if (hiR) tip(ctx, w, h, hover[0], hover[1], [["주유소 판매가격", "#eef6f0"], [`${retailWeek}`], [`${retailV.toFixed(2)} 원/L`]]);

      if (full) {
        const x0 = sceneW + 20;
        const m = d.metrics[product];
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 14px ${SANS}`;
        ctx.fillText("시차별 상관계수(주간 변화)", x0, 36);
        const bw = panelW - 70, bh = 16, by0 = 54;
        m.correlations.forEach((r, i) => {
          const yy = by0 + i * (bh + 12);
          ctx.fillStyle = DIM; ctx.font = `500 11px ${MONO}`; ctx.fillText(`${i}주`, x0, yy + 12);
          ctx.fillStyle = i === m.best ? UP : "rgba(28,47,44,.28)";
          ctx.fillRect(x0 + 30, yy, bw * Math.max(0, r), bh);
          ctx.fillStyle = i === lag ? INK : DIM; ctx.font = `${i === lag ? 700 : 500} 11px ${MONO}`;
          ctx.fillText(r.toFixed(3), x0 + 34 + bw * Math.max(0, r), yy + 12);
          if (i === lag) { ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(x0 + 29, yy - 1, bw * Math.max(0, r) + 2, bh + 2); }
        });
        let yy = by0 + m.correlations.length * (bh + 12) + 14;
        ctx.strokeStyle = FAINT; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + panelW - 40, yy); ctx.stroke();
        yy += 24;
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText(`가장 높은 시차: ${m.best}주 뒤`, x0, yy);
        yy += 24;
        ctx.fillStyle = DIM; ctx.fillText(`공급 하락 뒤(0주) 판매도 하락 ${m.downRates[0].toFixed(1)}%`, x0, yy);
        yy += 18;
        ctx.fillText(`공급 상승 뒤(0주) 판매도 상승 ${m.upRates[0].toFixed(1)}%`, x0, yy);
        yy += 26;
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
        ["주차 슬라이더나 계기판에 손을", "올려 값을 확인할 수 있다."].forEach((t, i) => ctx.fillText(t, x0, yy + i * 15));
      } else {
        ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`;
        ctx.fillText(`${lag}주 뒤 상관계수 ${d.metrics[product].correlations[lag].toFixed(3)}`, 12, h - 14);
      }
    });
  }

  VIZ["fuel-price-lag"] = { thumb, mount, bg: BG };
})();
