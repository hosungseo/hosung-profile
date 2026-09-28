// 36 disasters — "태풍 나선 (typhoon spiral on a weather chart)". The years 2007–2024 wind inward like a typhoon's
// rain bands: the outer end is 2007, the eye is 2024. Outside the spiral line runs a band for the people displaced
// (width ~ sqrt of persons, coloured by cause), inside it a coral band for property damage (2016–2023 only).
(() => {
  const BG = "#243447";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#eef3f7", DIM = "rgba(238,243,247,.66)", FAINT = "rgba(238,243,247,.14)";
  const CORAL = "#ff8a5b";
  // displaced-people causes, in the order of the data (호우 태풍 지진 대설 강풍 풍랑 산불 낙뢰 폭염) -> 5 display groups
  const VG = [["호우", "#59c1f0", [0]], ["태풍", "#a58af5", [1]], ["지진", "#e0a060", [2]], ["대설·그 밖", "#dfe7ef", [3, 4, 5, 6, 7, 8]]];
  const TURNS = 2.05;

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const years = d.v.map((_, i) => d.vy0 + i), n = years.length;
    const people = d.v.map((r) => VG.map(([, , idx]) => idx.reduce((s, k) => s + r[k], 0)));
    const ptot = people.map((g) => g.reduce((a, b) => a + b, 0));
    const prop = years.map((y) => { const i = y - d.py0; return i >= 0 && i < d.p.length ? d.p[i] : null; });
    const pt = prop.map((r) => (r ? r.reduce((a, b) => a + b, 0) : null));
    return (DEC = { years, n, people, ptot, prop, pt, vmax: Math.max(...ptot), pmax: Math.max(...pt.filter((x) => x != null)) });
  }
  const man = (x) => (x >= 10000 ? `${(x / 10000).toFixed(1)}만` : KF.fmt(x));
  const eok = (m) => { const e = Math.round(m / 100), j = Math.floor(e / 10000), r = e % 10000; return j ? `${j}조 ${KF.fmt(r)}억 원` : `${KF.fmt(r)}억 원`; };

  // ---------------------------------------------------------------- spiral geometry
  function G(cx, cy, Rout, Rin, rot) {
    const th = (u) => -Math.PI * 0.62 + rot - u * TURNS * Math.PI * 2;   // counter-clockwise inward, like a northern typhoon
    const r = (u) => Rout - u * (Rout - Rin);
    const pt = (u, off) => { const a = th(u), rr = r(u) + off; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; };
    return { cx, cy, Rout, Rin, th, r, pt, gap: (Rout - Rin) / TURNS };
  }
  const taper = (t) => Math.pow(KF.clamp(Math.min(t / 0.14, (1 - t) / 0.14, 1), 0, 1), 0.6);

  function band(ctx, g, u0, u1, off0, off1, col) { // polygon between offsets off0(t)..off1(t) along the centreline
    const N = 22;
    ctx.beginPath();
    for (let k = 0; k <= N; k++) { const t = k / N, [x, y] = g.pt(KF.lerp(u0, u1, t), off1(t)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    for (let k = N; k >= 0; k--) { const t = k / N, [x, y] = g.pt(KF.lerp(u0, u1, t), off0(t)); ctx.lineTo(x, y); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }

  function chartPaper(ctx, w, h, g, full) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    // lat/lon grid
    ctx.strokeStyle = "rgba(238,243,247,.05)"; ctx.lineWidth = 1;
    const step = full ? 48 : 36;
    for (let x = (g.cx % step); x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = (g.cy % step); y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    // isobars around the low, wobbly
    ctx.strokeStyle = "rgba(238,243,247,.16)"; ctx.lineWidth = 1;
    const k = 7;
    for (let i = 1; i <= k; i++) {
      const R = g.Rin * 0.9 + i * (g.Rout * 1.12 - g.Rin * 0.9) / k;
      ctx.beginPath();
      for (let j = 0; j <= 120; j++) {
        const a = (j / 120) * Math.PI * 2, rr = R * (1 + 0.035 * Math.sin(3 * a + i) + 0.02 * Math.sin(5 * a - i * 0.7));
        const x = g.cx + Math.cos(a) * rr * 1.04, y = g.cy + Math.sin(a) * rr * 0.96;
        j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      if (full && i % 2 === 1) {
        const a = -0.18, rr = R * (1 + 0.035 * Math.sin(3 * a + i) + 0.02 * Math.sin(5 * a - i * 0.7));
        const x = g.cx + Math.cos(a) * rr * 1.04, y = g.cy + Math.sin(a) * rr * 0.96;
        ctx.fillStyle = BG; ctx.fillRect(x - 13, y - 7, 26, 13);
        ctx.fillStyle = "rgba(238,243,247,.4)"; ctx.font = `500 9px ${MONO}`; ctx.textAlign = "center"; ctx.fillText(String(960 + i * 8), x, y + 3);
      }
    }
  }

  function spiral(ctx, g, D, mode, grow, hover, full) {
    const n = D.n, wMax = g.gap * 0.56, pMax = g.gap * 0.34;
    // centreline
    ctx.strokeStyle = "rgba(238,243,247,.35)"; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.beginPath();
    for (let k = 0; k <= 400; k++) { const u = (k / 400) * grow, [x, y] = g.pt(u, 0); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      if (u0 >= grow) break;
      const uu1 = Math.min(u1, grow), hi = hover === i;
      // people outside the line
      if (mode !== "p") {
        const W = Math.sqrt(D.ptot[i] / D.vmax) * wMax;
        let acc = 0;
        D.people[i].forEach((v, gi) => {
          if (!v) return;
          const a0 = acc / D.ptot[i], a1 = (acc + v) / D.ptot[i]; acc += v;
          band(ctx, g, u0, uu1, (t) => 1.5 + W * a0 * taper(t), (t) => 1.5 + W * a1 * taper(t), VG[gi][1]);
        });
        if (hi) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.4; band2(ctx, g, u0, uu1, (t) => 1.5, (t) => 1.5 + Math.max(4, W) * taper(t)); }
      }
      // property inside the line
      if (mode !== "v" && D.pt[i] != null) {
        const Wp = Math.sqrt(D.pt[i] / D.pmax) * pMax;
        band(ctx, g, u0, uu1, (t) => -1.5 - Wp * taper(t), (t) => -1.5, CORAL);
        if (hi) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.4; band2(ctx, g, u0, uu1, (t) => -1.5 - Math.max(4, Wp) * taper(t), (t) => -1.5); }
      }
    }
    // year labels on the line
    const lab = full ? [0, 3, 8, 13, 15, n - 1] : [0, 3, 15, n - 1];
    ctx.font = `600 ${full ? 10 : 9}px ${MONO}`; ctx.textAlign = "center";
    for (const i of lab) {
      if ((i + 0.5) / n > grow) continue;
      const [x, y] = g.pt((i + 0.5) / n, 0), t = String(D.years[i]), tw = ctx.measureText(t).width;
      ctx.fillStyle = "rgba(20,30,42,.8)"; ctx.fillRect(x - tw / 2 - 3, y - 7, tw + 6, 13);
      ctx.fillStyle = INK; ctx.fillText(t, x, y + 3.5);
    }
    // the eye
    const er = g.Rin * 0.78;
    const eg = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, er);
    eg.addColorStop(0, "rgba(238,243,247,.16)"); eg.addColorStop(1, "rgba(238,243,247,.02)");
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(g.cx, g.cy, er, 0, 7); ctx.fill();
  }
  function band2(ctx, g, u0, u1, off0, off1) {
    const N = 22; ctx.beginPath();
    for (let k = 0; k <= N; k++) { const t = k / N, [x, y] = g.pt(KF.lerp(u0, u1, t), off1(t)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    for (let k = N; k >= 0; k--) { const t = k / N, [x, y] = g.pt(KF.lerp(u0, u1, t), off0(t)); ctx.lineTo(x, y); }
    ctx.closePath(); ctx.stroke();
  }
  function yearAt(g, D, x, y) { // nearest spiral position to the pointer, within the band reach
    let best = null, bd = 1e9;
    for (let k = 0; k <= 360; k++) {
      const u = k / 360, [px, py] = g.pt(u, 0), dd = (px - x) ** 2 + (py - y) ** 2;
      if (dd < bd) { bd = dd; best = u; }
    }
    if (Math.sqrt(bd) > g.gap * 0.55) return null;
    return KF.clamp(Math.floor(best * D.n), 0, D.n - 1);
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `700 12.5px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 11.5px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 12 + lines.length * 17;
    const bx = KF.clamp(x + 14 + bw > w - 6 ? x - bw - 14 : x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(20,30,42,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(238,243,247,.3)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = i ? `500 11.5px ${SANS}` : `700 12.5px ${SANS}`; ctx.fillText(t, bx + 11, by + 17 + i * 17); });
  }
  function yearTip(d, D, i) {
    const y = D.years[i], v = d.v[i], L = [[`${y}년`], [`이재민 ${KF.fmt(D.ptot[i])}명`, "#9fdcf7"]];
    const parts = d.vcause.map((c, k) => [c, v[k]]).filter(([, x]) => x > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (parts.length) L.push([`  ${parts.map(([c, x]) => `${c} ${KF.fmt(x)}`).join(" · ")}`, DIM]);
    if (D.pt[i] != null) {
      L.push([`재산피해 ${eok(D.pt[i])}`, CORAL]);
      const pp = d.pcause.map((c, k) => [c, D.prop[i][k]]).filter(([, x]) => x > 0).sort((a, b) => b[1] - a[1]).slice(0, 2);
      L.push([`  ${pp.map(([c, x]) => `${c} ${Math.round(x / D.pt[i] * 100)}%`).join(" · ")}`, DIM]);
    } else L.push(["재산피해: 이 API에 없는 해", DIM]);
    return L;
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const D = decode(d), c = t % 10;
    const E = h * 0.48, R = E / 1.24, g = G(w - E - h * 0.04, h * 0.5, R, R * 0.17, 0);
    chartPaper(ctx, w, h, g, false);
    const grow = KF.ease(KF.clamp(c / 2.8, 0, 1)) * (c > 9.3 ? 1 - (c - 9.3) / 0.7 : 1);
    spiral(ctx, g, D, "both", Math.max(0.001, grow), null, false);
    const s = d.sum, x = h * 0.09, a = KF.clamp((c - 1) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`; ctx.fillText("자연재난 이재민", x, h * 0.3);
    ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.05)}px ${MONO}`; ctx.fillText(`${s.A[0]}–${String(s.A[1]).slice(2)}`, x, h * 0.42);
    ctx.font = `700 ${Math.round(h * 0.1)}px ${SANS}`; ctx.fillText(`${man(s.vA)}명`, x, h * 0.53);
    ctx.fillStyle = "#9fdcf7"; ctx.font = `600 ${Math.round(h * 0.05)}px ${MONO}`; ctx.fillText(`${s.B[0]}–${String(s.B[1]).slice(2)}`, x, h * 0.66);
    ctx.font = `700 ${Math.round(h * 0.1)}px ${SANS}`; ctx.fillText(`${man(s.vB)}명`, x, h * 0.77);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    let mode = "both", t0 = performance.now(), hover = null, geo = null;
    KF.segment(controls, [{ id: "both", label: "사람과 돈" }, { id: "v", label: "이재민만" }, { id: "p", label: "재산피해만" }], mode, (id) => { mode = id; });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520, el = (performance.now() - t0) / 1000;
      let R, cx, cy;
      // R is the spiral line; the outer band reaches about 1.24 R
      if (full) { const E = Math.min(h * 0.485, w * 0.3); R = E / 1.24; cx = E + 20; cy = h * 0.5; }
      else { const E = Math.min(w * 0.48, h * 0.33); R = E / 1.24; cx = w / 2; cy = E + 6; }
      const rot = (1 - KF.ease(KF.clamp(el / 4, 0, 1))) * 0.9;
      const g = G(cx, cy, R, R * 0.16, rot);
      geo = g;
      chartPaper(ctx, w, h, g, full);
      const grow = KF.ease(KF.clamp((el - 0.2) / 3.8, 0, 1));
      const hy = hover && grow >= 1 ? yearAt(g, D, hover[0], hover[1]) : null;
      spiral(ctx, g, D, mode, Math.max(0.001, grow), hy, full);
      const s = d.sum;
      if (full) {
        const x0 = cx + R * 1.24 + 40, pw = w - x0 - 26;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 21px ${SERIF}`;
        ctx.fillText("태풍 나선", x0, 46);
        const tw = ctx.measureText("태풍 나선").width;
        ctx.fillStyle = DIM; ctx.font = `500 12px ${MONO}`; ctx.fillText(`자연재난 ${D.years[0]}–${D.years[D.n - 1]}`, x0 + tw + 10, 46);
        ctx.font = `500 12px ${SANS}`;
        ctx.fillText("나선 한 토막 = 한 해 · 바깥에서 태풍의 눈 쪽으로 갈수록 최근", x0, 70);
        // legend
        let lx = x0, ly = 94;
        ctx.font = `600 11.5px ${SANS}`; ctx.fillStyle = INK; ctx.fillText("바깥 띠 = 이재민", lx, ly);
        lx += ctx.measureText("바깥 띠 = 이재민").width + 10;
        VG.forEach(([lab, col]) => { ctx.fillStyle = col; ctx.fillRect(lx, ly - 9, 10, 10); ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText(lab, lx + 14, ly); lx += ctx.measureText(lab).width + 26; });
        ly += 20;
        ctx.fillStyle = INK; ctx.font = `600 11.5px ${SANS}`; ctx.fillText("안쪽 띠 = 재산피해", x0, ly);
        const t2 = ctx.measureText("안쪽 띠 = 재산피해").width + 10;
        ctx.fillStyle = CORAL; ctx.fillRect(x0 + t2, ly - 9, 10, 10);
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText(`${d.py0}–${d.py0 + d.p.length - 1}년만 · 띠 폭 = 크기의 제곱근`, x0 + t2 + 14, ly);
        // numbers
        const by = 162;
        ctx.fillStyle = DIM; ctx.font = `600 12.5px ${SANS}`;
        ctx.fillText(`이재민 ${s.A[0]}–${s.A[1]}`, x0, by); ctx.fillText(`${s.B[0]}–${s.B[1]}`, x0 + pw * 0.5, by);
        ctx.font = `700 34px ${SANS}`; ctx.fillStyle = INK; ctx.fillText(KF.fmt(s.vA), x0, by + 38);
        let ww = ctx.measureText(KF.fmt(s.vA)).width; ctx.font = `600 14px ${SANS}`; ctx.fillText("명", x0 + ww + 3, by + 38);
        ctx.font = `700 34px ${SANS}`; ctx.fillStyle = "#9fdcf7"; ctx.fillText(KF.fmt(s.vB), x0 + pw * 0.5, by + 38);
        ww = ctx.measureText(KF.fmt(s.vB)).width; ctx.font = `600 14px ${SANS}`; ctx.fillText("명", x0 + pw * 0.5 + ww + 3, by + 38);
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`가장 많은 해 ${s.vmax[0]}년 ${KF.fmt(s.vmax[1])}명 · 재산피해 가장 큰 해 ${s.pmax[0]}년 ${eok(s.pmax[1])}`, x0, by + 60);
        // heavy rain by decade
        let yb = by + 100;
        ctx.fillStyle = INK; ctx.font = `700 12.5px ${SANS}`; ctx.fillText("하루 80mm 넘게 온 날 · 6곳 평균(일/년)", x0, yb);
        const dec = d.heavy.dec, dmax = Math.max(...dec.map((x) => x[1])), bw = Math.min(28, (pw - 10) / dec.length - 4), bh = 58;
        dec.forEach(([dc, v], i) => {
          const bx = x0 + i * (bw + 4), hh = (v / dmax) * bh;
          ctx.fillStyle = dc >= 1990 ? "#59c1f0" : "rgba(89,193,240,.45)"; ctx.fillRect(bx, yb + 12 + bh - hh, bw, hh);
          ctx.fillStyle = DIM; ctx.font = `500 9px ${MONO}`; ctx.textAlign = "center";
          ctx.fillText(v.toFixed(1), bx + bw / 2, yb + 12 + bh - hh - 3);
          ctx.font = `500 8.5px ${MONO}`; ctx.fillText(String(dc), bx + bw / 2, yb + 12 + bh + 12);
        });
        ctx.textAlign = "left";
        // risk spots
        yb += 110;
        ctx.fillStyle = INK; ctx.font = `700 12.5px ${SANS}`; ctx.fillText(`2026년 여름 인명피해 우려지역 ${KF.fmt(d.riskTot)}곳`, x0, yb);
        const rk = d.risk.filter(([c]) => c !== "기타").slice(0, 4), rmax = rk[0][1];
        rk.forEach(([c, v], i) => {
          const yy = yb + 12 + i * 19;
          ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(c, x0, yy + 10);
          const bx = x0 + 116, bl = (pw - 170) * v / rmax;
          ctx.fillStyle = "rgba(238,243,247,.55)"; ctx.fillRect(bx, yy + 2, bl, 10);
          ctx.fillStyle = INK; ctx.font = `500 10.5px ${MONO}`; ctx.fillText(KF.fmt(v), bx + bl + 5, yy + 11);
        });
      } else {
        const y0 = cy + R * 1.24 + 22;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 13px ${SANS}`;
        ctx.fillText("자연재난 이재민 · 바깥에서 눈 쪽으로 최근", 12, y0);
        ctx.fillStyle = DIM; ctx.font = `600 10.5px ${SANS}`;
        ctx.fillText(`${s.A[0]}–${s.A[1]}`, 12, y0 + 22); ctx.fillText(`${s.B[0]}–${s.B[1]}`, w / 2 + 6, y0 + 22);
        ctx.font = `700 24px ${SANS}`; ctx.fillStyle = INK; ctx.fillText(`${KF.fmt(s.vA)}명`, 12, y0 + 50);
        ctx.fillStyle = "#9fdcf7"; ctx.fillText(`${KF.fmt(s.vB)}명`, w / 2 + 6, y0 + 50);
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
        ctx.fillText(`바깥 띠 = 이재민(파랑 호우·보라 태풍) · 안쪽 산호색 = 재산피해`, 12, y0 + 72);
        ctx.fillText(`재산피해 최대 ${s.pmax[0]}년 ${eok(s.pmax[1])}`, 12, y0 + 90);
      }
      if (hy != null && hover) tip(ctx, w, h, hover[0], hover[1], yearTip(d, D, hy));
    });
  }

  VIZ.disasters = { thumb, mount, bg: BG };
})();
