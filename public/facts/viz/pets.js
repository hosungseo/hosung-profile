// 42 pets — "발자국". Paw-print trails leave the rescue point and split by what happened next: a home (adoption,
// return to the owner), other exits, still in the shelter, or trails that fade out (death in the shelter). One print =
// N animals. View 2: one print per month, sized by the month's rescues, for 2024–2026. View 3: one band per 시도.
(() => {
  const BG = "#3f3a2f";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif", PEN = "'Nanum Pen Script', cursive";
  const INK = "#f3eee2", DIM = "rgba(243,238,226,.64)", FAINT = "rgba(243,238,226,.14)";
  // lanes: [label, source outcomes, colour, fades]
  const LANES = [["입양", ["입양"], "#f2c96b", false], ["주인에게 반환", ["반환"], "#8ec9e8", false],
    ["기증·방사", ["기증", "방사"], "#c7b6ea", false], ["보호 중·미포획", ["보호중", "미포획"], "#d9d1bf", false],
    ["보호소에서 자연사", ["자연사"], "#a39b8e", true], ["안락사", ["안락사"], "#d0654f", true]];

  const sg = (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`;

  // ---------------------------------------------------------------- one paw print (pointing along angle a)
  function paw(ctx, x, y, s, a, col, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); ctx.globalAlpha = alpha; ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(0, s * 0.18, s * 0.42, s * 0.34, 0, 0, Math.PI * 2); ctx.fill();          // main pad
    if (s > 4) {
      for (const [dx, dy, r] of [[-0.42, -0.2, 0.15], [-0.15, -0.44, 0.16], [0.15, -0.44, 0.16], [0.42, -0.2, 0.15]]) {
        ctx.beginPath(); ctx.ellipse(dx * s, dy * s, r * s, r * s * 1.25, dx * 0.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- data
  const CACHE = new WeakMap();
  function prep(d) {
    if (CACHE.has(d)) return CACHE.get(d);
    const idx = Object.fromEntries(d.out.map((k, i) => [k, i]));
    const lane = (o) => LANES.map(([, ks]) => ks.reduce((a, k) => a + o[idx[k]], 0));
    const years = d.years.map((y) => { const L = lane(y.o); return { ...y, L, tot: L.reduce((a, b) => a + b, 0) }; });
    const sido = d.sido.map((s) => { const L = lane(s.o); return { ...s, L, tot: L.reduce((a, b) => a + b, 0) }; });
    const X = { years, sido };
    CACHE.set(d, X);
    return X;
  }

  // ---------------------------------------------------------------- view 1: trails
  function trailGeom(w, h, full, n) {
    const ox = full ? 96 : 34, oy = full ? h * 0.52 : h * 0.47, x1 = full ? 250 : 92;
    const top = full ? 92 : 104, bot = full ? h - 44 : h - 70, gap = (bot - top) / (n - 1);
    return { ox, oy, x1, top, gap, sp: full ? 10.5 : 7.4, ps: full ? 7.2 : 5.2, xmax: full ? w - 190 : w - 18 };
  }
  // positions along lane i: a quadratic curve from the origin to (x1, ly), then straight
  function lanePts(G, i, n) {
    const ly = G.top + i * G.gap, pts = [];
    const cx = (G.ox + G.x1) / 2, L0 = Math.hypot(G.x1 - G.ox, ly - G.oy) * 1.05;
    let s = G.sp * 2.6;
    while (pts.length < n) {
      let x, y, a;
      if (s < L0) {
        const t = s / L0, u = 1 - t;
        x = u * u * G.ox + 2 * u * t * cx + t * t * G.x1; y = u * u * G.oy + 2 * u * t * ly + t * t * ly;
        const dx = 2 * u * (cx - G.ox) + 2 * t * (G.x1 - cx), dy = 2 * u * (ly - G.oy) + 2 * t * (ly - ly);
        a = Math.atan2(dy, dx);
      } else { x = G.x1 + (s - L0); y = ly; a = 0; }
      const side = pts.length % 2 ? 1 : -1, off = G.ps * 0.55 * side;
      pts.push([x - Math.sin(a) * off, y + Math.cos(a) * off, a]);
      s += G.sp;
    }
    return { pts, ly };
  }

  function trails(ctx, w, h, d, X, yi, el, full, hover) {
    const Y = X.years[yi], G = trailGeom(w, h, full, LANES.length);
    const maxLane = Math.max(...X.years.flatMap((y) => y.L));
    // prints per animal: the longest lane of any year fills the room to xmax
    const cap = Math.floor((G.xmax - G.x1) / G.sp) + 12, N = [100, 200, 250, 500, 1000, 2000].find((n) => maxLane / n <= cap) || 2000;
    let hit = null;
    LANES.forEach(([lab, , col, fade], i) => {
      const n = Math.round(Y.L[i] / N), { pts, ly } = lanePts(G, i, Math.max(n, 1));
      const shown = Math.min(n, Math.floor(KF.clamp((el - 0.2 - i * 0.12) / 3.2, 0, 1) * n + 0.999));
      for (let j = 0; j < shown; j++) {
        const [x, y, a] = pts[j], k = j / Math.max(1, n - 1);
        paw(ctx, x, y, G.ps, a, col, fade ? KF.lerp(0.95, 0.12, Math.pow(k, 0.8)) : 0.95);
      }
      const end = pts[Math.max(0, n - 1)], ex = (n ? end[0] : G.x1) + G.ps + 6;
      const isHover = hover && hover[1] > ly - G.gap / 2 && hover[1] < ly + G.gap / 2 && hover[0] > G.x1 - 30;
      if (isHover) hit = { i, lab, v: Y.L[i], col };
      if (shown >= n) { // label at the end of the trail
        ctx.textAlign = "left";
        const pct = (Y.L[i] / Y.tot * 100).toFixed(1);
        if (full) {
          ctx.fillStyle = fade ? "rgba(243,238,226,.8)" : col; ctx.font = `700 13px ${SANS}`; ctx.fillText(lab, ex, ly - 3);
          ctx.fillStyle = DIM; ctx.font = `500 11px ${MONO}`; ctx.fillText(`${KF.fmt(Y.L[i])} · ${pct}%`, ex, ly + 12);
        } else {
          const short = ["입양", "반환", "기증·방사", "보호 중", "자연사", "안락사"][i];
          ctx.fillStyle = fade ? "rgba(243,238,226,.8)" : col; ctx.font = `600 10px ${SANS}`; ctx.fillText(`${short} ${pct}%`, Math.min(ex, w - 74), ly + 4);
        }
      }
      if (isHover) { ctx.strokeStyle = "rgba(243,238,226,.35)"; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(G.x1 - 20, ly + G.gap / 2 - 2); ctx.lineTo(w - 10, ly + G.gap / 2 - 2); ctx.stroke(); ctx.setLineDash([]); }
    });
    // origin, drawn over the first prints
    ctx.fillStyle = "#4a4436"; ctx.beginPath(); ctx.arc(G.ox, G.oy, full ? 30 : 19, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(243,238,226,.55)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 13 : 10}px ${SANS}`; ctx.fillText("구조", G.ox, G.oy + (full ? 5 : 4));
    return { N, hit, G };
  }

  function headerTrail(ctx, w, h, d, X, yi, N, full) {
    const Y = X.years[yi], died = (Y.L[4] + Y.L[5]) / Y.tot * 100, home = (Y.L[0] + Y.L[1]) / Y.tot * 100;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
    ctx.fillText(`구조된 ${KF.fmt(Y.tot)}마리의 발자국 · ${Y.lab}`, full ? 24 : 12, full ? 36 : 26);
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10}px ${SANS}`;
    ctx.fillText(`발자국 1개 = ${KF.fmt(N)}마리 · 흐려지는 길 = 보호소 안에서의 죽음`, full ? 24 : 12, full ? 56 : 43);
    if (full) {
      const x = w - 24;
      ctx.textAlign = "right"; ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("집으로 (입양·반환)", x, 30);
      ctx.fillStyle = "#f2c96b"; ctx.font = `800 26px ${SANS}`; ctx.fillText(`${home.toFixed(1)}%`, x, 58);
      ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("보호소에서 숨짐", x - 120, 30);
      ctx.fillStyle = "#d0654f"; ctx.font = `800 26px ${SANS}`; ctx.fillText(`${died.toFixed(1)}%`, x - 120, 58);
    } else {
      ctx.textAlign = "left"; ctx.font = `700 13px ${SANS}`;
      ctx.fillStyle = "#f2c96b"; ctx.fillText(`집으로 ${home.toFixed(1)}%`, 12, 66);
      ctx.fillStyle = "#e07a63"; ctx.fillText(`보호소에서 숨짐 ${died.toFixed(1)}%`, 118, 66);
    }
  }

  // ---------------------------------------------------------------- view 2: months (one print per month)
  function months(ctx, w, h, d, X, el, full, hover) {
    const rows = [2023, 2024, 2025, 2026], mx = Math.max(...d.months.map((m) => m[2]));
    const x0 = full ? 110 : 44, x1 = full ? w * 0.72 : w - 14, y0 = full ? 108 : 104, rh = full ? (h - y0 - 40) / 4 : (h - y0 - 96) / 4;
    const cw = (x1 - x0) / 12, S = Math.min(cw * 0.46, rh * 0.36);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
    ctx.fillText(full ? "달마다 찍힌 발자국 · 2023.10–2026.8" : "달마다 발자국", full ? 24 : 12, full ? 36 : 26);
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10}px ${SANS}`;
    ctx.fillText(full ? "발자국 하나 = 한 달, 넓이 = 그달 구조된 동물 수 · 같은 달끼리 위아래로 비교" : "넓이 = 그달 구조 동물 수", full ? 24 : 12, full ? 56 : 43);
    ctx.textAlign = "center"; ctx.font = `500 ${full ? 11 : 9}px ${MONO}`; ctx.fillStyle = DIM;
    for (let m = 1; m <= 12; m++) ctx.fillText(`${m}월`, x0 + (m - 0.5) * cw, y0 - 14);
    let hit = null;
    rows.forEach((yy, r) => {
      const cy = y0 + (r + 0.5) * rh;
      ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 14 : 11}px ${MONO}`; ctx.fillText(String(yy), x0 - (full ? 16 : 6), cy + 5);
      ctx.strokeStyle = FAINT; ctx.setLineDash([1, 5]); ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.stroke(); ctx.setLineDash([]);
      for (const [y, m, v] of d.months) {
        if (y !== yy) continue;
        const k = (yy - 2023) * 12 + m, t = KF.clamp((el - 0.15 - k * 0.045) / 0.4, 0, 1);
        const s = S * Math.sqrt(v / mx) * KF.ease(t) * 2, x = x0 + (m - 0.5) * cw, yy2 = cy + (m % 2 ? -rh * 0.08 : rh * 0.08);
        paw(ctx, x, yy2, s, -Math.PI / 2 + (m % 2 ? -0.18 : 0.18), yy === 2026 ? "#f2c96b" : yy === 2023 ? "rgba(243,238,226,.55)" : "#e9dfc9", 0.92);
        if (hover && Math.abs(hover[0] - x) < cw / 2 && Math.abs(hover[1] - cy) < rh / 2) hit = { y, m, v, x, cy };
      }
    });
    // Jan–Aug totals
    const ja = d.jan_aug;
    if (full) {
      const x = w * 0.76;
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("같은 1–8월끼리", x, y0 + 8);
      [2024, 2025, 2026].forEach((yy, i) => {
        const y = y0 + 44 + i * 52;
        ctx.fillStyle = yy === 2026 ? "#f2c96b" : INK; ctx.font = `800 26px ${SANS}`; ctx.fillText(KF.fmt(ja[i]), x, y);
        ctx.fillStyle = DIM; ctx.font = `500 12px ${MONO}`; ctx.fillText(`${yy}${i ? `  ${sg((ja[i] / ja[i - 1] - 1) * 100)}` : ""}`, x, y + 18);
      });
    } else {
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.fillText("1–8월 합계", 12, h - 70);
      [2024, 2025, 2026].forEach((yy, i) => {
        const x = 12 + i * ((w - 24) / 3);
        ctx.fillStyle = yy === 2026 ? "#f2c96b" : INK; ctx.font = `800 17px ${SANS}`; ctx.fillText(KF.fmt(ja[i]), x, h - 46);
        ctx.fillStyle = DIM; ctx.font = `500 10px ${MONO}`; ctx.fillText(`${yy}${i ? ` ${sg((ja[i] / ja[i - 1] - 1) * 100)}` : ""}`, x, h - 30);
      });
    }
    return hit;
  }

  // ---------------------------------------------------------------- view 3: 시도 bands (50 prints = 100%)
  function regions(ctx, w, h, d, X, el, full, hover) {
    const x0 = full ? 92 : 58, n = 50, x1 = full ? w * 0.7 : w - 12, y0 = full ? 84 : 84, rh = (h - y0 - (full ? 20 : 34)) / X.sido.length;
    const sp = (x1 - x0) / n, ps = Math.min(sp * 0.9, rh * 0.62);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
    ctx.fillText(full ? "시도별로 끝나는 곳 · 2025년" : "시도별 · 2025년", full ? 24 : 12, full ? 36 : 26);
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10}px ${SANS}`;
    ctx.fillText(full ? "한 줄 = 그 시도에서 구조된 동물 전체(발자국 50개 = 100%) · 색 = 간 곳 · 보호소 사망 비율이 높은 순" : "한 줄 = 100%, 색 = 간 곳", full ? 24 : 12, full ? 56 : 43);
    if (!full) { // compact colour key
      LANES.forEach(([lab, , col], i) => {
        const x = 12 + (i % 3) * ((w - 24) / 3), y = 60 + Math.floor(i / 3) * 13;
        paw(ctx, x + 4, y - 3, 6, -Math.PI / 2, col, 0.95);
        ctx.fillStyle = DIM; ctx.font = `500 9.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(lab.replace("보호소에서 ", "").replace("주인에게 ", ""), x + 11, y);
      });
    }
    let hit = null;
    X.sido.forEach((s, r) => {
      const y = y0 + (r + 0.5) * rh, counts = s.L.map((v) => (v / s.tot) * n);
      ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 12 : 10}px ${SANS}`; ctx.fillText(s.n, x0 - (full ? 12 : 6), y + 4);
      // largest-remainder so each band has exactly 50 prints
      const fl = counts.map(Math.floor); let left = n - fl.reduce((a, b) => a + b, 0);
      counts.map((c, i) => [c - Math.floor(c), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { fl[i]++; left--; } });
      let j = 0;
      fl.forEach((c, li) => {
        for (let q = 0; q < c; q++, j++) {
          const t = KF.clamp((el - 0.1 - r * 0.06 - j * 0.012) / 0.3, 0, 1);
          if (t <= 0) continue;
          paw(ctx, x0 + (j + 0.5) * sp, y + (j % 2 ? 2 : -2), ps, 0, LANES[li][2], (LANES[li][3] ? 0.75 : 0.95) * t);
        }
      });
      if (full) {
        const dth = (s.L[4] + s.L[5]) / s.tot * 100;
        ctx.textAlign = "left"; ctx.fillStyle = "#e07a63"; ctx.font = `600 11px ${MONO}`; ctx.fillText(`${dth.toFixed(1)}%`, x1 + 10, y + 4);
        ctx.fillStyle = DIM; ctx.fillText(KF.fmt(s.tot), x1 + 62, y + 4);
      }
      if (hover && hover[1] > y - rh / 2 && hover[1] < y + rh / 2 && hover[0] > 10) hit = { s, y };
    });
    if (full) {
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
      ctx.fillText("숨짐", x1 + 10, y0 - 8); ctx.fillText("구조", x1 + 62, y0 - 8);
      LANES.forEach(([lab, , col], i) => {
        const y = y0 + 20 + i * 22, x = w - 118;
        paw(ctx, x, y - 4, 9, -Math.PI / 2, col, 0.95);
        ctx.fillStyle = INK; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(lab, x + 12, y);
      });
    }
    return hit;
  }

  // ---------------------------------------------------------------- tooltip
  function tip(ctx, w, h, lines, p) {
    const fs = 12;
    const width = (t, k) => { ctx.font = `${k === 1 ? 700 : 500} ${k === 1 ? 13 : fs}px ${SANS}`; return ctx.measureText(t).width; };
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => width(t, k))) + 22), bh = 12 + lines.length * 19;
    const bx = KF.clamp(p[0] + 16 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 16, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(34,31,25,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(242,201,107,.55)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, k, c], j) => {
      ctx.fillStyle = c || (k === 1 ? INK : DIM); ctx.font = `${k === 1 ? 700 : 500} ${k === 1 ? 13 : fs}px ${SANS}`;
      ctx.fillText(t, bx + 11, by + 22 + j * 19);
    });
  }

  // ---------------------------------------------------------------- thumb
  const groups0 = (Y) => [Y.L[0] + Y.L[1], Y.L[2] + Y.L[3], Y.L[4] + Y.L[5]];
  function thumb(ctx, w, h, t, d) {
    const X = prep(d), c = t % 10, Y = X.years[1];
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    // three trails: home, shelter/other, death (fading)
    const groups = [[Y.L[0] + Y.L[1], "#f2c96b", false], [Y.L[2] + Y.L[3], "#d9d1bf", false], [Y.L[4] + Y.L[5], "#d0654f", true]];
    const ox = w * 0.1, oy = h * 0.56, x1 = w * 0.2, sp = w * 0.021, ps = h * 0.042, xEnd = w * 0.47;
    const nFit = (xEnd - x1) / sp + Math.hypot(x1 - ox, h * 0.26) / sp, N = Math.max(...groups0(Y)) / nFit;
    groups.forEach(([v, col, fade], i) => {
      const ly = h * (0.3 + i * 0.26), n = Math.round(v / N), cx = (ox + x1) / 2, L0 = Math.hypot(x1 - ox, ly - oy) * 1.05;
      const shown = Math.min(n, Math.floor(KF.clamp((c - 0.1) / 2.6, 0, 1) * n + 0.999));
      for (let j = 0; j < shown; j++) {
        const s = sp * (j + 1.2);
        let x, y, a;
        if (s < L0) { const q = s / L0, u = 1 - q; x = u * u * ox + 2 * u * q * cx + q * q * x1; y = u * u * oy + 2 * u * q * ly + q * q * ly; a = Math.atan2(2 * u * (ly - oy), 2 * u * (cx - ox) + 2 * q * (x1 - cx)); }
        else { x = x1 + (s - L0); y = ly; a = 0; }
        const off = ps * 0.55 * (j % 2 ? 1 : -1);
        paw(ctx, x - Math.sin(a) * off, y + Math.cos(a) * off, ps, a, col, fade ? KF.lerp(0.95, 0.15, j / Math.max(1, n - 1)) : 0.95);
        if (j === n - 1 && i !== 1) {
          ctx.textAlign = "left"; ctx.fillStyle = i ? "#e07a63" : col; ctx.font = `600 ${Math.round(h * 0.048)}px ${SANS}`;
          ctx.fillText(i ? "숨짐" : "입양·반환", x + ps * 0.9, y + h * 0.018);
        }
      }
    });
    const tx = w * 0.64;
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`; ctx.fillText("구조 동물 (1–8월)", tx, h * 0.2);
    const ja = d.jan_aug, ch = (ja[2] / ja[1] - 1) * 100;
    ctx.fillStyle = INK; ctx.font = `800 ${Math.round(h * 0.16)}px ${SANS}`; ctx.fillText(`${ch < 0 ? "−" : "+"}${Math.abs(ch).toFixed(0)}%`, tx, h * 0.2 + h * 0.16);
    ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText(`2025 → 2026`, tx, h * 0.2 + h * 0.235);
    const died = (Y.L[4] + Y.L[5]) / Y.tot * 100;
    ctx.fillStyle = DIM; ctx.fillText("보호소에서 숨짐", tx, h * 0.68);
    ctx.fillStyle = "#e07a63"; ctx.font = `800 ${Math.round(h * 0.12)}px ${SANS}`; ctx.fillText(`${died.toFixed(0)}%`, tx, h * 0.68 + h * 0.13);
    if (c > 9.4) { ctx.fillStyle = `rgba(63,58,47,${(c - 9.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = prep(d), s = KF.canvas(stage);
    let view = "trail", yi = 1, t0 = performance.now(), hover = null;
    if (KF.reduced) t0 -= 1e5;
    KF.segment(controls, [{ id: "trail", label: "어디로 갔나" }, { id: "months", label: "달마다" }, { id: "sido", label: "시도별" }], "trail", (id) => {
      view = id; t0 = performance.now(); yrWrap.style.display = id === "trail" ? "contents" : "none";
    });
    const yrWrap = document.createElement("span"); yrWrap.style.display = "contents"; controls.appendChild(yrWrap);
    KF.segment(yrWrap, X.years.map((y, i) => ({ id: i, label: y.lab })), 1, (id) => { yi = id; t0 = performance.now(); });
    const at = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = at(e); });
    stage.addEventListener("pointerdown", (e) => { hover = at(e); });
    stage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hover = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, el = (performance.now() - t0) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const vg = ctx.createRadialGradient(w * 0.35, h * 0.45, 20, w * 0.35, h * 0.45, Math.max(w, h) * 0.75);
      vg.addColorStop(0, "rgba(120,110,80,.18)"); vg.addColorStop(1, "rgba(0,0,0,.18)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
      if (view === "trail") {
        const r = trails(ctx, w, h, d, X, yi, el, full, hover);
        headerTrail(ctx, w, h, d, X, yi, r.N, full);
        if (r.hit && hover) {
          const q = r.hit, Y = X.years[yi], prev = yi > 0 && X.years[yi].id !== "2026" ? X.years[yi - 1] : null;
          const lines = [[`${q.lab} · ${Y.lab}`, 1, q.col], [`${KF.fmt(q.v)}마리 · 구조 동물의 ${(q.v / Y.tot * 100).toFixed(1)}%`, 0, INK]];
          if (prev) lines.push([`${prev.lab} ${KF.fmt(prev.L[q.i])}마리 (${(prev.L[q.i] / prev.tot * 100).toFixed(1)}%)`, 0]);
          if (Y.id === "2026") lines.push(["최근 구조일수록 아직 '보호 중'인 동물이 많다", 0]);
          tip(ctx, w, h, lines, hover);
        }
      } else if (view === "months") {
        const hit = months(ctx, w, h, d, X, el, full, hover);
        if (hit && hover) {
          const prev = d.months.find(([y, m]) => y === hit.y - 1 && m === hit.m);
          const lines = [[`${hit.y}년 ${hit.m}월`, 1], [`구조 ${KF.fmt(hit.v)}마리`, 0, INK]];
          if (prev) lines.push([`1년 전 ${KF.fmt(prev[2])}마리 → ${sg((hit.v / prev[2] - 1) * 100)}`, 0]);
          tip(ctx, w, h, lines, hover);
        }
      } else {
        const hit = regions(ctx, w, h, d, X, el, full, hover);
        if (hit && hover) {
          const q = hit.s, pc = (i) => `${(q.L[i] / q.tot * 100).toFixed(1)}%`;
          tip(ctx, w, h, [[`${q.n} · 2025년 구조 ${KF.fmt(q.tot)}마리`, 1], [`입양 ${pc(0)} · 반환 ${pc(1)}`, 0, "#f2c96b"],
            [`자연사 ${pc(4)} · 안락사 ${pc(5)}`, 0, "#e07a63"], [`2024년 ${KF.fmt(q.t24)}마리 → ${sg((q.tot / q.t24 - 1) * 100)}`, 0],
            [`등록 반려동물(2022 누계) 1,000마리당 ${(q.tot / q.reg * 1000).toFixed(1)}마리`, 0]], hover);
        }
      }
    });
  }

  VIZ.pets = { thumb, mount, bg: BG };
})();
