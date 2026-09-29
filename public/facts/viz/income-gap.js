// 69 income-gap — "다섯 개의 밥그릇 (rice bowls)". Five bowls on a wooden table, one per income
// quintile; the rice mound in each bowl is that quintile's share of total income. Switching
// 시장소득→처분가능소득 re-spoons rice from the tall bowls into the short ones. A second tab pours
// the same rice into ten bowls of net worth, where the top bowl overflows the table edge.
(() => {
  const BG = "#d1a69e";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#3a2318", DIM = "rgba(58,35,24,.64)", FAINT = "rgba(58,35,24,.18)";
  const WOOD_HI = "#a8783f", WOOD = "#8a5a35", WOOD_LO = "#6e4526";
  const BOWL = "#f4efe3", BOWL_IN = "#e3d7bf", BOWL_EDGE = "#c9bb9c";
  const RICE = "#fdf9ee", RICE_SH = "#e7dfc6", RICE_LN = "#cdbf9c";
  const ACCENT = "#b6432b", GOOD = "#3c6b4a";
  const SCALE = 50; // income/wealth share (%) that fills a bowl to the rim

  function decode(d) {
    return d; // already small & flat
  }

  // ---------------------------------------------------------------- one bowl + its rice mound
  // cx: centre x at the table line (baseY). diam: rim width. frac: 0..1 of SCALE (opts.scale).
  // A bowl's own height is fixed at ~0.56x its diameter, so it always reads as a bowl, not a glass.
  function bowl(ctx, cx, baseY, diam, frac, opts = {}) {
    const rimW = diam, botW = diam * 0.46, h = diam * 0.56, rimY = baseY - h, ellW = h * 0.24;
    ctx.save();
    ctx.fillStyle = "rgba(50,28,16,.2)";
    ctx.beginPath(); ctx.ellipse(cx + diam * 0.05, baseY + 3, rimW * 0.52, h * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    // bowl body (outside): rounded, wide rim tapering to a small foot
    const body = new Path2D();
    body.moveTo(cx - botW / 2, baseY);
    body.bezierCurveTo(cx - rimW * 0.56, baseY - h * 0.18, cx - rimW / 2, rimY + h * 0.55, cx - rimW / 2, rimY + ellW * 0.3);
    body.quadraticCurveTo(cx - rimW / 2, rimY, cx, rimY);
    body.quadraticCurveTo(cx + rimW / 2, rimY, cx + rimW / 2, rimY + ellW * 0.3);
    body.bezierCurveTo(cx + rimW / 2, rimY + h * 0.55, cx + rimW * 0.56, baseY - h * 0.18, cx + botW / 2, baseY);
    body.closePath();
    const grad = ctx.createLinearGradient(cx - rimW / 2, 0, cx + rimW / 2, 0);
    grad.addColorStop(0, BOWL_EDGE); grad.addColorStop(0.14, BOWL); grad.addColorStop(0.5, "#fffdf8"); grad.addColorStop(0.86, BOWL); grad.addColorStop(1, BOWL_EDGE);
    ctx.fillStyle = opts.dim ? "rgba(244,239,227,.55)" : grad;
    ctx.fill(body);
    // a thin painted stripe, like a 사기그릇 rim band
    ctx.strokeStyle = opts.hi ? INK : "rgba(140,60,40,.4)"; ctx.lineWidth = opts.hi ? 1.6 : 1.1;
    ctx.beginPath(); ctx.ellipse(cx, rimY + ellW * 0.62, rimW / 2 - rimW * 0.09, ellW * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = opts.hi ? INK : "rgba(80,50,30,.4)"; ctx.lineWidth = opts.hi ? 2 : 1; ctx.stroke(body);
    // interior well (empty bowl mouth, before rice is drawn on top)
    ctx.fillStyle = "rgba(70,45,28,.16)";
    ctx.beginPath(); ctx.ellipse(cx, rimY + ellW * 0.5, rimW / 2 - 3, ellW * 0.42, 0, 0, Math.PI * 2); ctx.fill();

    // rice mound, clipped to the bowl body. fillH is measured up from the true bottom (baseY),
    // so an empty share draws (almost) no rice and a full share nearly reaches the rim.
    const MAXFILL = h * 0.86;
    const f = Math.max(0, frac);
    if (f > 0.003) {
      const fillH = Math.max(3, Math.min(MAXFILL, MAXFILL * (f / (opts.scale || 1))));
      const topY = baseY - fillH;
      const wAt = (y) => {
        const t = KF.clamp((baseY - y) / h, 0, 1);
        return KF.lerp(botW / 2 - 3, rimW / 2 - 5, t);
      };
      ctx.save();
      ctx.clip(body);
      const p = new Path2D();
      const n = 18, wTop = wAt(topY);
      p.moveTo(cx - wTop, topY);
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = KF.lerp(cx - wTop, cx + wTop, t);
        const bulge = Math.sin(t * Math.PI) * Math.min(9, diam * 0.09) * Math.min(1, fillH / 14);
        p.lineTo(x, topY - bulge + (opts.wobble || 0));
      }
      p.lineTo(cx + wAt(baseY + 6), baseY + 6);
      p.lineTo(cx - wAt(baseY + 6), baseY + 6);
      p.closePath();
      ctx.fillStyle = opts.riceColor || RICE;
      ctx.fill(p);
      ctx.fillStyle = RICE_SH; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.ellipse(cx, topY + 2, wTop * 0.88, Math.min(6, diam * 0.05), 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = RICE_LN;
      const rng = mulberry(Math.round(cx * 7 + baseY * 3 + diam));
      const speck = Math.min(90, Math.round(fillH * 1.6));
      for (let i = 0; i < speck; i++) {
        const yy = topY + rng() * fillH * 0.92;
        const ww = wAt(yy);
        const xx = cx + (rng() - 0.5) * ww * 1.75;
        if (Math.abs(xx - cx) < ww * 0.96) ctx.fillRect(xx, yy, 1.7, 1);
      }
      ctx.restore();
    } else if (opts.debt) {
      ctx.save(); ctx.clip(body);
      ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx - 4, baseY - MAXFILL * 0.7); ctx.lineTo(cx + 3, baseY - MAXFILL * 0.4); ctx.lineTo(cx - 3, baseY - MAXFILL * 0.12); ctx.stroke();
      ctx.restore();
    }
    // rim highlight
    ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.ellipse(cx, rimY + 1, rimW / 2 - 1, ellW * 0.46, 0, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.restore();
    return { cx, rimY: rimY, topY: rimY, baseY, rimW, diam };
  }

  function mulberry(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  function table(ctx, x, y, w, h) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, WOOD_HI); g.addColorStop(0.5, WOOD); g.addColorStop(1, WOOD_LO);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(40,20,8,.25)"; ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) { const yy = y + 6 + i * (h - 12) / 6 + Math.sin(i * 3.1) * 3; ctx.beginPath(); ctx.moveTo(x, yy); ctx.bezierCurveTo(x + w * 0.3, yy + 4, x + w * 0.7, yy - 4, x + w, yy); ctx.stroke(); }
    ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fillRect(x, y, w, 3);
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `700 12px ${SANS}`;
    let bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22;
    const bh = 12 + lines.length * 18;
    const bx = KF.clamp(x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(58,35,24,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || "#f4efe3"; ctx.font = `${i ? 500 : 700} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 18 + i * 18); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    table(ctx, 0, h * 0.72, w, h * 0.28);
    const c = t % 10, u = KF.ease(KF.clamp((c - 0.6) / 2.4, 0, 1));
    const m = d.share.market[d.share.market.length - 1], p = d.share.disp[d.share.disp.length - 1];
    const n = 5, gap = w / (n + 1);
    for (let i = 0; i < n; i++) {
      const cx = gap * (i + 1), val = KF.lerp(m[i], p[i], u);
      bowl(ctx, cx, h * 0.76, Math.min(78, gap * 0.82), val, { scale: SCALE });
    }
    // top-left is reserved for the board's "데이터 N개" badge (~90x36px) — keep text baselines well below h*0.4
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.078)}px ${SANS}`;
    ctx.fillText("소득 5분위", w * 0.04, h * 0.3);
    ctx.font = `500 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillStyle = DIM;
    ctx.fillText("밥그릇 속 쌀 = 소득 점유율", w * 0.04, h * 0.3 + h * 0.08);
    ctx.textAlign = "right"; ctx.font = `800 ${Math.round(h * 0.09)}px ${MONO}`;
    ctx.fillStyle = ACCENT; ctx.fillText(`${KF.lerp(m[4], p[4], u).toFixed(1)}%`, w * 0.96, h * 0.3);
    ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`; ctx.fillText("상위 20%의 몫", w * 0.96, h * 0.3 + h * 0.07);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let tab = "income", type = "disp", year = d.years[d.years.length - 1];
    let hover = null, tType = performance.now() - 5000, tTab = performance.now() - 5000;
    let curFrac = null, targetFrac = null, lastKey = "";
    KF.segment(controls, [{ id: "income", label: "소득 · 다섯 그릇" }, { id: "wealth", label: "자산 · 열 그릇" }], tab, (id) => { tab = id; tTab = performance.now(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "·"; controls.appendChild(sep);
    KF.segment(controls, [{ id: "market", label: "시장소득" }, { id: "disp", label: "처분가능소득" }], type, (id) => { if (id === type) return; type = id; tType = performance.now(); });
    const yr = document.createElement("span"); yr.className = "readout"; yr.textContent = `${year}년`; controls.appendChild(yr);

    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    const yi = d.years.indexOf(String(year));

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const panelW = full ? w * 0.36 : 0;
      const sceneW = w - panelW;
      const baseY = h * (full ? 0.6 : 0.58);
      table(ctx, 0, baseY - 2, sceneW, h - (baseY - 2));

      let hit = null;
      if (tab === "income") {
        const n = 5, gap = sceneW / (n + 1);
        const target = (type === "market" ? d.share.market[yi] : d.share.disp[yi]);
        const key = tab + type;
        if (key !== lastKey) { curFrac = curFrac || target; targetFrac = target; lastKey = key; }
        const u = KF.ease(KF.clamp((performance.now() - tType) / 900, 0, 1));
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
        ctx.fillText(`다섯 개의 밥그릇 · ${year}년`, full ? 22 : 12, full ? 40 : 26);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10.5}px ${SANS}`;
        ctx.fillText("밥그릇 속 쌀의 높이 = 그 무리(20%씩)가 가진 소득의 몫", full ? 22 : 12, full ? 62 : 42);
        if (full) {
          ctx.textAlign = "center"; ctx.fillStyle = type === "disp" ? "rgba(60,107,74,.85)" : "rgba(182,67,43,.8)";
          ctx.font = `700 15px ${SANS}`;
          ctx.fillText(type === "disp" ? "세금·연금·수당을 걷고 나눠 준 뒤 — 처분가능소득" : "세금·연금·수당을 걷기 전 — 시장소득", sceneW / 2, h * 0.34);
          ctx.textAlign = "left";
        }
        const bw = Math.min(full ? 190 : 84, gap * 0.82), bh = bw * 0.56;
        for (let i = 0; i < n; i++) {
          const cx = gap * (i + 1);
          const mv = d.share.market[yi][i], dv = d.share.disp[yi][i];
          const val = KF.lerp(mv, dv, type === "disp" ? u : 1 - u);
          const hi = hover && Math.hypot(hover[0] - cx, hover[1] - (baseY - bh * 0.6)) < bw * 0.62;
          const g = bowl(ctx, cx, baseY, bw, val, { scale: SCALE, hi, wobble: hi ? -2 : 0 });
          if (hi) hit = { i, mv, dv, cx: g.cx, y: g.rimY };
          ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 12.5 : 10.5}px ${SANS}`;
          ctx.fillText(`${i + 1}분위`, cx, baseY + (full ? 26 : 20));
          if (full) { ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(i === 0 ? "(하위 20%)" : i === 4 ? "(상위 20%)" : "", cx, baseY + 42); }
          ctx.fillStyle = i === 4 ? ACCENT : INK; ctx.font = `700 ${full ? 15 : 12}px ${MONO}`;
          ctx.fillText(`${val.toFixed(1)}%`, cx, g.rimY - 8);
        }
      } else {
        const n = 10, gap = sceneW / (n + 1);
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
        ctx.fillText(`같은 상, 열 개의 그릇 · 순자산 ${d.wealth.years[d.wealth.years.length - 1]}년`, full ? 22 : 12, full ? 40 : 26);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10.5}px ${SANS}`;
        ctx.fillText("이번엔 쌀 대신 순자산(자산−부채) 10분위 · 맨 오른쪽 그릇은 상 밖으로 넘친다", full ? 22 : 12, full ? 62 : 42);
        const bw = Math.min(full ? 78 : 46, gap * 0.82), bh = bw * 0.56;
        const wy1 = d.wealth.deciles1, wy0 = d.wealth.deciles0;
        const u = KF.ease(KF.clamp((performance.now() - tTab) / 900, 0, 1));
        const WSCALE = 38; // a shorter scale than income bowls, so the top decile visibly spills over
        for (let i = 0; i < n; i++) {
          const cx = gap * (i + 1);
          const val = KF.lerp(0, wy1[i], u);
          const overflow = val > WSCALE;
          const hi = hover && Math.hypot(hover[0] - cx, hover[1] - (baseY - bh * 0.6)) < bw * 0.7;
          const g = bowl(ctx, cx, baseY, bw, Math.min(val, WSCALE * 0.98), { scale: WSCALE, hi, debt: val < 0 });
          if (overflow) {
            ctx.fillStyle = RICE; ctx.beginPath();
            ctx.moveTo(g.cx - bw * 0.4, g.rimY + 2); ctx.lineTo(g.cx + bw * 0.4, g.rimY + 2);
            ctx.lineTo(g.cx + bw * 0.62, g.rimY - 16 * u); ctx.lineTo(g.cx - bw * 0.62, g.rimY - 16 * u); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = "rgba(120,90,50,.3)"; ctx.stroke();
          }
          if (hi) hit = { decile: i + 1, v1: wy1[i], v0: wy0[i], cx: g.cx, y: g.rimY, wealth: true };
          ctx.textAlign = "center"; ctx.fillStyle = i === 9 ? ACCENT : INK; ctx.font = `700 ${full ? 10.5 : 9}px ${MONO}`;
          ctx.fillText(`${i + 1}`, cx, baseY + (full ? 20 : 16));
          if (full || i === 9 || i === 0) { ctx.font = `700 ${full ? 12.5 : 10}px ${MONO}`; ctx.fillStyle = val < 0 ? ACCENT : INK; ctx.fillText(`${val.toFixed(1)}%`, cx, g.rimY - (overflow ? 22 : 8)); }
        }
      }

      // ---- side panel ----
      if (full) {
        const x0 = sceneW + 22, pw = panelW - 40;
        ctx.textAlign = "left";
        if (tab === "income") {
          const rows = [
            ["지니계수", d.gini.market[yi], d.gini.disp[yi], d.gini.market[0], d.gini.disp[0], 3],
            ["5분위배율", d.quint.market[yi], d.quint.disp[yi], d.quint.market[0], d.quint.disp[0], 2],
            ["상대적 빈곤율(%)", d.pov.market[yi], d.pov.disp[yi], d.pov.market[0], d.pov.disp[0], 1],
          ];
          ctx.fillStyle = INK; ctx.font = `700 14px ${SANS}`;
          ctx.fillText(`${d.years[0]}년 → ${year}년`, x0, 40);
          let yy = 68;
          rows.forEach(([label, mNow, dNow, mThen, dThen, dec]) => {
            ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText(label, x0, yy);
            ctx.font = `700 20px ${MONO}`; ctx.fillStyle = type === "disp" ? GOOD : INK;
            ctx.fillText(`${dThen.toFixed(dec)} → ${dNow.toFixed(dec)}`, x0, yy + 24);
            ctx.font = `500 10.5px ${SANS}`; ctx.fillStyle = DIM;
            ctx.fillText(`처분가능소득 (시장소득은 ${mThen.toFixed(dec)} → ${mNow.toFixed(dec)})`, x0, yy + 40);
            yy += 66;
          });
          ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`;
          ctx.fillText("바구니에 손을 올리면 그 무리의 몫을 확인할 수 있다.", x0, yy + 6);
        } else {
          ctx.fillStyle = INK; ctx.font = `700 14px ${SANS}`;
          ctx.fillText(`${d.wealth.years[0]}년 → ${d.wealth.years[d.wealth.years.length - 1]}년`, x0, 40);
          ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText("순자산 지니계수", x0, 68);
          ctx.font = `700 26px ${MONO}`; ctx.fillStyle = ACCENT;
          ctx.fillText(`${d.wealth.gini[0].toFixed(3)} → ${d.wealth.gini[d.wealth.gini.length - 1].toFixed(3)}`, x0, 96);
          ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText("상위 10%의 순자산 점유율", x0, 130);
          ctx.font = `700 26px ${MONO}`; ctx.fillStyle = ACCENT;
          ctx.fillText(`${d.wealth.top10[0].toFixed(1)}% → ${d.wealth.top10[d.wealth.top10.length - 1].toFixed(1)}%`, x0, 158);
          ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`;
          const lines = ["해마다(2023년 한 해만 빼고) 오른 것은", "소득이 아니라 자산 쪽이다.", "하위 10%(맨 왼쪽 그릇)는 빚이", "자산보다 많아 몫이 음수다."];
          lines.forEach((t, i) => ctx.fillText(t, x0, 192 + i * 17));
        }
      } else {
        ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`;
        ctx.fillText(tab === "income" ? "그릇을 눌러 그 무리의 몫을 확인" : "맨 오른쪽 그릇이 상 밖으로 넘친다", 12, h - 14);
      }

      if (hit) {
        const lines = hit.wealth
          ? [[`순자산 ${hit.decile}분위`, "#f4efe3"], [`${d.wealth.years[d.wealth.years.length - 1]}년 ${hit.v1.toFixed(1)}%`], [`${d.wealth.years[0]}년에는 ${hit.v0.toFixed(1)}%`]]
          : [[`소득 ${hit.i + 1}분위`, "#f4efe3"], [`시장소득 ${hit.mv.toFixed(1)}%`], [`처분가능소득 ${hit.dv.toFixed(1)}%`]];
        tip(ctx, w, h, hit.cx, hit.y, lines);
      }
    });
  }

  VIZ["income-gap"] = { thumb, mount, bg: BG };
})();
