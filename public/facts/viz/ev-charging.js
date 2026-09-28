// 41 ev-charging — "콘센트와 케이블 (plug sockets & cables)". A mustard wall; for every 시도 a power strip whose
// sockets count chargers (one socket = 10,000 chargers, or 1,000 fast chargers), a cable, and a queue of electric cars:
// one car drawing = one car per charger. Toggle all / fast / slow chargers; rows re-sort by the queue length.
(() => {
  const BG = "#e8cf7a";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#2a2416", DIM = "rgba(42,36,22,.68)", FAINT = "rgba(42,36,22,.14)";
  const PLATE = "#fbf8ef", HOLE = "#5b5446", CAR = "#23405a", CAR2 = "#3f6f93", CABLE = "#2a2a2a", BOLT = "#1f9d6b", HOT = "#b3401f";
  const MODES = { all: { label: "전체", unit: 10000, key: "ch" }, fast: { label: "급속", unit: 1000, key: "fast" }, slow: { label: "완속", unit: 10000, key: "slow" } };

  function prep(d) {
    const n = d.sido.length, slow = d.ch.map((c, i) => c - d.fast[i]);
    const rows = d.sido.map((s, i) => ({ s, i, ev: d.ev[i], ch: d.ch[i], fast: d.fast[i], slow: slow[i], fire: d.fires.sido[i] }));
    return { n, rows };
  }
  const ratio = (r, m) => r.ev / r[MODES[m].key];

  function socket(ctx, x, y, s) { // faceplate with a round schuko socket
    ctx.fillStyle = PLATE; ctx.beginPath(); ctx.roundRect(x, y, s, s, s * 0.18); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.fillStyle = "#e7e1d2"; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * 0.34, 0, 7); ctx.fill();
    ctx.fillStyle = HOLE; const r = Math.max(0.6, s * 0.06);
    ctx.beginPath(); ctx.arc(x + s / 2 - s * 0.13, y + s / 2, r, 0, 7); ctx.arc(x + s / 2 + s * 0.13, y + s / 2, r, 0, 7); ctx.fill();
  }
  function car(ctx, x, y, w, col, frac = 1) { // side view, facing left (towards the socket)
    const h = w * 0.46;
    ctx.save();
    if (frac < 1) { ctx.beginPath(); ctx.rect(x, y - h, w * frac, h * 1.6); ctx.clip(); }
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.roundRect(x, y - h * 0.62, w, h * 0.5, h * 0.18); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + w * 0.2, y - h * 0.6); ctx.lineTo(x + w * 0.32, y - h * 0.98); ctx.lineTo(x + w * 0.72, y - h * 0.98); ctx.lineTo(x + w * 0.86, y - h * 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(x + w * 0.36, y - h * 0.9, w * 0.14, h * 0.24); ctx.fillRect(x + w * 0.54, y - h * 0.9, w * 0.14, h * 0.24);
    ctx.fillStyle = "#151515"; ctx.beginPath(); ctx.arc(x + w * 0.24, y - h * 0.12, h * 0.17, 0, 7); ctx.arc(x + w * 0.76, y - h * 0.12, h * 0.17, 0, 7); ctx.fill();
    ctx.restore();
  }

  // one row: name | power strip | cable | queue | number
  function row(ctx, L, r, m, y, rh, grow, hi, full) {
    const M = MODES[m], cnt = r[M.key] / M.unit, s = Math.min(rh * 0.62, full ? 15 : 9), gap = s * 0.14;
    const perRow = Math.max(1, Math.floor((L.stripW + gap) / (s + gap)));
    const shown = Math.min(cnt, perRow) * KF.clamp(grow * 1.6, 0, 1);
    if (hi) { ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(L.x0 - 6, y - rh / 2, L.x1 - L.x0 + 12, rh); }
    ctx.fillStyle = INK; ctx.font = `${hi ? 700 : 600} ${full ? 12.5 : 11}px ${SANS}`; ctx.textAlign = "left";
    ctx.fillText(r.s, L.x0, y + 4);
    // strip body
    const sx = L.stripX, sy = y - s / 2 - 2, whole = Math.floor(shown), part = shown - whole;
    const sw = Math.max(s * 0.6, Math.ceil(shown) * (s + gap) + gap);
    ctx.fillStyle = "#f4efe2"; ctx.beginPath(); ctx.roundRect(sx - gap, sy - 2, sw + gap, s + 4, 3); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 0.8; ctx.stroke();
    for (let k = 0; k < whole; k++) socket(ctx, sx + k * (s + gap), sy, s);
    if (part > 0.02) { ctx.save(); ctx.beginPath(); ctx.rect(sx + whole * (s + gap), sy - 1, s * part, s + 2); ctx.clip(); socket(ctx, sx + whole * (s + gap), sy, s); ctx.restore(); }
    if (cnt > perRow) { ctx.fillStyle = DIM; ctx.font = `600 ${full ? 10 : 9}px ${MONO}`; ctx.fillText(`+${Math.round(cnt - perRow)}`, sx + perRow * (s + gap) + 2, y + 3); }
    // cable from the strip to the queue start
    const q0 = L.queueX, rat = ratio(r, m);
    ctx.strokeStyle = CABLE; ctx.lineWidth = full ? 1.6 : 1.2;
    const cx0 = sx + Math.min(cnt, perRow) * (s + gap) * KF.clamp(grow * 1.6, 0, 1);
    ctx.beginPath(); ctx.moveTo(cx0, y); ctx.bezierCurveTo(cx0 + 14, y + rh * 0.22, q0 - 14, y + rh * 0.22, q0 - 4, y - 1); ctx.stroke();
    ctx.fillStyle = BOLT; ctx.beginPath(); ctx.arc(q0 - 4, y - 1, 2.2, 0, 7); ctx.fill();
    // queue: one car per car-per-charger (fractional last car); cars roll in
    const cw = full ? 15 : 10.5, cg = full ? 2 : 1.4, maxCars = Math.floor((L.queueW) / (cw + cg));
    const showN = Math.min(rat, maxCars) * KF.clamp((grow - 0.25) / 0.75, 0, 1);
    for (let k = 0; k < Math.ceil(showN); k++) {
      const fr = Math.min(1, showN - k);
      car(ctx, q0 + k * (cw + cg), y + s * 0.42, cw, k % 2 ? CAR2 : CAR, fr);
    }
    if (rat > maxCars && showN >= maxCars - 0.01) { ctx.fillStyle = HOT; ctx.font = `700 ${full ? 10 : 9}px ${MONO}`; ctx.fillText("…", q0 + maxCars * (cw + cg) - 2, y + 3); }
    // number
    ctx.textAlign = "right"; ctx.fillStyle = rat >= 20 ? HOT : INK; ctx.font = `700 ${full ? 13 : 11}px ${SANS}`;
    ctx.fillText(`${rat.toFixed(1)}대`, L.x1, y + 4.5);
    ctx.textAlign = "left";
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `700 12.5px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 11.5px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 12 + lines.length * 17;
    const bx = KF.clamp(x + 14 + bw > w - 6 ? x - bw - 14 : x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(34,30,20,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || "#f7f1de"; ctx.font = i ? `500 11.5px ${SANS}` : `700 12.5px ${SANS}`; ctx.fillText(t, bx + 11, by + 17 + i * 17); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const P = prep(d), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const grow = KF.ease(KF.clamp(c / 2.6, 0, 1)) * (c > 9.3 ? 1 - (c - 9.3) / 0.7 : 1);
    // left: one big socket with the national queue for all vs fast chargers
    const nat = d.nat, x = h * 0.09;
    ctx.globalAlpha = KF.clamp((c - 0.6) / 0.8, 0, 1); ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.072)}px ${SANS}`; ctx.fillText("충전기 1기당 전기차", x, h * 0.28);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`; ctx.fillText("전체", x, h * 0.44); ctx.fillText("급속만", x, h * 0.66);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.1)}px ${SANS}`; ctx.fillText(`${nat.ratio.toFixed(1)}대`, x + h * 0.36, h * 0.46);
    ctx.fillStyle = HOT; ctx.fillText(`${nat.ratioF.toFixed(0)}대`, x + h * 0.36, h * 0.68);
    ctx.globalAlpha = 1;
    const qx = w * 0.5, cw = h * 0.075, step = cw + 1.8, room = Math.floor((w - qx - 22) / step);
    [[h * 0.42, nat.ratio], [h * 0.64, nat.ratioF]].forEach(([yy, r], j) => {
      socket(ctx, qx - h * 0.12, yy - h * 0.06, h * 0.11);
      ctx.strokeStyle = CABLE; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(qx - h * 0.01, yy); ctx.lineTo(qx + 5, yy); ctx.stroke();
      const cap = r > room ? room - 1 : r, nshow = cap * KF.clamp((grow - 0.1 * j) / 0.9, 0, 1);
      for (let k = 0; k < Math.ceil(nshow); k++) car(ctx, qx + 7 + k * step, yy + h * 0.035, cw, k % 2 ? CAR2 : CAR, Math.min(1, nshow - k));
      if (r > room && nshow >= cap - 0.01) { ctx.fillStyle = HOT; ctx.font = `700 ${Math.round(h * 0.07)}px ${MONO}`; ctx.textAlign = "left"; ctx.fillText("…", qx + 9 + cap * step, yy + h * 0.02); }
    });
    ctx.globalAlpha = KF.clamp((c - 1.2) / 0.8, 0, 1); ctx.textAlign = "right"; ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText(`전기차 ${(nat.ev / 10000).toFixed(1)}만 대 · 충전기 ${(nat.ch / 10000).toFixed(1)}만 기 (${d.evMonth[1].slice(0, 7).replace("-", ".")})`, w - h * 0.08, h * 0.88);
    ctx.textAlign = "left"; ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const P = prep(d), sc = KF.canvas(stage);
    let m = "all", t0 = performance.now(), tSw = -99, hover = null, order = null, pos = null, geo = null;
    KF.segment(controls, [{ id: "all", label: "모든 충전기" }, { id: "fast", label: "급속만" }, { id: "slow", label: "완속만" }], m, (id) => { m = id; tSw = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520, now = performance.now(), el = (now - t0) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const top = full ? 84 : 58, bottom = full ? 18 : 36;
      const L = full
        ? { x0: 24, x1: w * 0.69, stripX: 78, stripW: w * 0.69 * 0.38, queueX: 78 + w * 0.69 * 0.38 + 34 }
        : { x0: 10, x1: w - 10, stripX: 50, stripW: w * 0.34, queueX: 50 + w * 0.34 + 16 };
      L.queueW = L.x1 - 44 - L.queueX;
      const rh = (h - top - bottom) / P.n;
      // order by queue length for the mode, animated
      const target = [...P.rows].sort((a, b) => ratio(b, m) - ratio(a, m)).map((r) => r.i);
      if (!order || order.join() !== target.join()) { order = target; }
      if (!pos) pos = new Map(order.map((i, k) => [i, k]));
      order.forEach((i, k) => { const p = pos.get(i); pos.set(i, p + (k - p) * 0.15); });
      const grow = KF.ease(KF.clamp((el - 0.2) / 3.6, 0, 1));
      const sw = KF.clamp((now - tSw) / 1000 / 1.0, 0, 1), g2 = tSw > 0 && sw < 1 ? 0.25 + 0.75 * KF.ease(sw) : grow;
      // hover row
      let hr = null;
      if (hover && hover[1] > top && hover[1] < h - bottom && hover[0] < L.x1 + 6) {
        const k = Math.floor((hover[1] - top) / rh);
        hr = order[KF.clamp(k, 0, P.n - 1)];
      }
      for (const r of P.rows) {
        const y = top + (pos.get(r.i) + 0.5) * rh;
        row(ctx, L, r, m, y, rh, g2, hr === r.i, full);
      }
      // header
      const M = MODES[m], nat = d.nat;
      const natR = m === "all" ? nat.ratio : m === "fast" ? nat.ratioF : nat.ev / (nat.ch - nat.fast);
      ctx.textAlign = "left"; ctx.fillStyle = INK;
      if (full) {
        ctx.font = `700 21px ${SERIF}`; ctx.fillText("콘센트 앞의 줄", 24, 38);
        const tw = ctx.measureText("콘센트 앞의 줄").width;
        ctx.fillStyle = DIM; ctx.font = `500 12px ${MONO}`; ctx.fillText(`${d.evMonth[1].slice(0, 7).replace("-", ".")} 전기차 · 그때까지 설치된 충전기`, 24 + tw + 10, 38);
        ctx.font = `500 12px ${SANS}`;
        socket(ctx, 24, 52, 13); ctx.fillStyle = DIM;
        ctx.fillText(`= ${M.label === "급속" ? "급속 충전기" : M.label === "완속" ? "완속 충전기" : "충전기"} ${KF.fmt(M.unit)}기`, 42, 63);
        car(ctx, 170, 64, 15, CAR); ctx.fillText("= 충전기 1기당 전기차 1대", 190, 63);
        ctx.fillText("오른쪽 숫자 = 1기당 전기차 · 줄이 긴 시도가 위", 360, 63);
        // right panel
        const x0 = w * 0.69 + 34, pw = w - x0 - 24;
        ctx.fillStyle = INK; ctx.font = `700 13px ${SANS}`; ctx.fillText(`전국 · ${M.label === "전체" ? "모든 충전기" : M.label + " 충전기"}`, x0, 108);
        ctx.font = `700 44px ${SANS}`; ctx.fillStyle = m === "fast" ? HOT : INK; ctx.fillText(`${natR.toFixed(1)}`, x0, 158);
        const ww = ctx.measureText(natR.toFixed(1)).width; ctx.font = `600 15px ${SANS}`; ctx.fillText("대 / 1기", x0 + ww + 4, 158);
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`전기차 ${KF.fmt(nat.ev)}대 · 충전기 ${KF.fmt(nat.ch)}기`, x0, 180);
        ctx.fillText(`(급속 ${KF.fmt(nat.fast)}기 · 완속 ${KF.fmt(nat.ch - nat.fast)}기)`, x0, 197);
        // installs per year
        let yb = 236;
        ctx.fillStyle = INK; ctx.font = `700 12.5px ${SANS}`; ctx.fillText("해마다 새로 설치된 충전기", x0, yb);
        const ys = d.years, vals = d.byYear, vf = d.byYearFast, vm = Math.max(...vals), bw = Math.min(18, (pw - 8) / ys.length - 3), bh = 76;
        ys.forEach((y, i) => {
          const bx = x0 + i * (bw + 3), hh = vals[i] / vm * bh, hf = vf[i] / vm * bh;
          ctx.fillStyle = "rgba(35,64,90,.35)"; ctx.fillRect(bx, yb + 12 + bh - hh, bw, hh);
          ctx.fillStyle = CAR; ctx.fillRect(bx, yb + 12 + bh - hf, bw, hf);
          if (i % 3 === 0 || i === ys.length - 1) { ctx.fillStyle = DIM; ctx.font = `500 9px ${MONO}`; ctx.textAlign = "center"; ctx.fillText(String(y).slice(2), bx + bw / 2, yb + 12 + bh + 11); ctx.textAlign = "left"; }
        });
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
        ctx.fillText(`진한 색 = 급속 · 2025년 ${KF.fmt(nat.new25)}기(급속 ${KF.fmt(nat.new25Fast)})`, x0, yb + bh + 42);
        ctx.fillText(`같은 해 전기차 +${KF.fmt(nat.evGrowth)}대 (${d.evMonth[0].slice(5, 7) * 1}–${d.evMonth[1].slice(5, 7) * 1}월)`, x0, yb + bh + 59);
        // fires
        yb += bh + 96;
        ctx.fillStyle = INK; ctx.font = `700 12.5px ${SANS}`; ctx.fillText("2024년 전기차 화재", x0, yb);
        ctx.font = `700 26px ${SANS}`; ctx.fillStyle = HOT; ctx.fillText(`${d.fires.n}건`, x0, yb + 32);
        const fw = ctx.measureText(`${d.fires.n}건`).width;
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(`1만 대당 ${d.fires.per10k.toFixed(1)}건`, x0 + fw + 10, yb + 30);
        ctx.fillText(d.fires.state.map(([k, v]) => `${k} ${v}`).join(" · "), x0, yb + 52);
        ctx.fillText("내연기관차와 비교할 분모는 이 자료에 없다", x0, yb + 70);
      } else {
        ctx.font = `700 14px ${SANS}`; ctx.fillText(`충전기 1기당 전기차 · 전국 ${natR.toFixed(1)}대`, 10, 22);
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
        ctx.fillText(`콘센트 1개 = ${M.label === "전체" ? "" : M.label + " "}충전기 ${KF.fmt(M.unit)}기 · 차 1대 = 1기당 1대`, 10, 40);
        ctx.fillText(`2024년 전기차 화재 ${d.fires.n}건 · 1만 대당 ${d.fires.per10k.toFixed(1)}건 (비교 분모 없음)`, 10, h - 14);
      }
      if (hr != null && hover) {
        const r = P.rows[hr];
        tip(ctx, w, h, hover[0], hover[1], [[`${r.s} · ${d.evMonth[1].slice(0, 7).replace("-", ".")}`], [`전기차 ${KF.fmt(r.ev)}대`],
          [`충전기 ${KF.fmt(r.ch)}기 → 1기당 ${ratio(r, "all").toFixed(1)}대`], [`급속 ${KF.fmt(r.fast)}기 → 1기당 ${ratio(r, "fast").toFixed(1)}대`, "#ffb08f"],
          [`완속 ${KF.fmt(r.slow)}기 → 1기당 ${ratio(r, "slow").toFixed(1)}대`], [`2024년 전기차 화재 ${r.fire}건`, "rgba(247,241,222,.7)"]]);
      }
    });
  }

  VIZ["ev-charging"] = { thumb, mount, bg: BG };
})();
