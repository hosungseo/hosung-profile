// 26 climate — "나이테 (tree rings)". A trunk cut across: one ring per year, the pith is the oldest year and the
// bark is 2025. Ring colour = that year's count (tropical nights, heatwave days, summer length, freezing days).
// A younger station is a younger (smaller) tree. The increment core on the right is the same rings laid flat.
(() => {
  const BG = "#17211b";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#f1ead8", DIM = "rgba(241,234,216,.66)", FAINT = "rgba(241,234,216,.18)", EMBER = "#ff9a5c", ICE = "#9cc7e4";
  const HOT = [[0, [241, 228, 198]], [0.12, [236, 208, 152]], [0.3, [229, 165, 94]], [0.55, [211, 105, 58]], [0.8, [168, 50, 31]], [1, [104, 22, 18]]];
  const COLD = [[0, [241, 228, 198]], [0.25, [205, 220, 222]], [0.55, [132, 170, 200]], [1, [46, 88, 134]]];
  const MET = {
    tn: { label: "열대야", unit: "일", def: "최저기온 25℃ 이상인 날", lo: 0, hi: 40, ramp: HOT, ticks: [0, 10, 20, 30, 40] },
    hw: { label: "폭염일", unit: "일", def: "최고기온 33℃ 이상인 날", lo: 0, hi: 40, ramp: HOT, ticks: [0, 10, 20, 30, 40] },
    sl: { label: "여름 길이", unit: "일", def: "일평균 20℃ 이상이 이어진 기간", lo: 70, hi: 150, ramp: HOT, ticks: [70, 90, 110, 130, 150] },
    fd: { label: "결빙일", unit: "일", def: "최고기온도 0℃ 아래인 날", lo: 0, hi: 50, ramp: COLD, ticks: [0, 10, 20, 30, 40, 50] },
  };
  const MIDS = ["tn", "hw", "sl", "fd"];

  function rampColor(ramp, k) {
    k = KF.clamp(k, 0, 1);
    for (let i = 1; i < ramp.length; i++) {
      if (k <= ramp[i][0]) {
        const [a, ca] = ramp[i - 1], [b, cb] = ramp[i], u = (k - a) / (b - a);
        return ca.map((c, j) => Math.round(KF.lerp(c, cb[j], u)));
      }
    }
    return ramp[ramp.length - 1][1];
  }
  const colorOf = (m, v) => (v == null ? null : rampColor(MET[m].ramp, (v - MET[m].lo) / (MET[m].hi - MET[m].lo)));
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // ---------------------------------------------------------------- data
  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const N = d.y1 - d.y0 + 1;
    const st = d.stations.map((s) => {
      const i0 = s.first - d.y0, n = N - i0;
      const stats = {};
      for (const m of MIDS) {
        const v = s[m];
        const avg = (a, b) => { const xs = []; for (let y = a; y <= b; y++) { const x = v[y - d.y0]; if (x != null) xs.push(x); } return xs.length ? xs.reduce((p, q) => p + q, 0) / xs.length : null; };
        const ys = []; for (let y = s.first; y <= d.y1; y++) if (v[y - d.y0] != null) ys.push(y);
        const a0 = ys[0], aEnd = ys.filter((y) => y < a0 + 30).pop();
        const dec = [];
        for (let dc = Math.floor(s.first / 10) * 10; dc <= d.y1; dc += 10) {
          const xs = ys.filter((y) => y >= dc && y < dc + 10);
          if (xs.length >= 5) dec.push([dc, avg(dc, dc + 9)]);
        }
        let top = ys[0]; ys.forEach((y) => { if (v[y - d.y0] >= v[top - d.y0]) top = y; });
        stats[m] = { first: [a0, aEnd, avg(a0, a0 + 29)], last: [d.y1 - 29, d.y1, avg(d.y1 - 29, d.y1)], dec, top };
      }
      return { ...s, i0, n, stats };
    });
    return (DEC = { N, st, y0: d.y0, y1: d.y1, heat: d.heat });
  }

  // ---------------------------------------------------------------- trunk geometry
  const NP = 150;
  const wob = (a) => 1 + 0.026 * Math.sin(2 * a + 0.7) + 0.016 * Math.sin(3 * a + 2.1) + 0.007 * Math.sin(5 * a + 0.3) + 0.003 * Math.sin(9 * a + 1.1);
  function rings(cx, cy, R, D, s) {
    // boundaries 0..n (0 = pith = the station's first year, n = cambium). Every station grows R / N per year,
    // so a station with a shorter record is a younger, smaller tree.
    const out = [];
    for (let k = 0; k <= s.n; k++) {
      const r = (k / D.N) * R, e = (1 - k / s.n) * (s.n / D.N) * R * 0.05; // pith sits a little off-centre
      const ox = cx - e * 0.8, oy = cy + e * 0.5, p = new Path2D();
      for (let j = 0; j <= NP; j++) {
        const a = (j / NP) * Math.PI * 2, rr = Math.max(0.5, r * wob(a));
        const x = ox + Math.cos(a) * rr, y = oy + Math.sin(a) * rr;
        j ? p.lineTo(x, y) : p.moveTo(x, y);
      }
      p.closePath();
      out.push({ p, r, ox, oy });
    }
    return out;
  }
  function ringAt(G, x, y) { // index of the ring under (x, y), or -1
    for (let k = 1; k < G.length; k++) {
      const g = G[k], a = Math.atan2(y - g.oy, x - g.ox), d = Math.hypot(x - g.ox, y - g.oy);
      if (d <= g.r * wob(a)) return k - 1;
    }
    return -1;
  }

  function bark(ctx, g, R, full) {
    const t = Math.max(5, R * 0.055);
    ctx.save();
    const p = new Path2D();
    for (let j = 0; j <= 240; j++) {
      const a = (j / 240) * Math.PI * 2, n = Math.sin(a * 37) * 0.35 + Math.sin(a * 91 + 1.3) * 0.25 + Math.sin(a * 13 + 0.5) * 0.4;
      const rr = g.r * wob(a) + t * (0.85 + 0.25 * n);
      const x = g.ox + Math.cos(a) * rr, y = g.oy + Math.sin(a) * rr;
      j ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath();
    ctx.fillStyle = "#3a2a1f"; ctx.fill(p);
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1; ctx.stroke(p);
    // bark fissures
    ctx.strokeStyle = "rgba(20,12,8,.55)"; ctx.lineWidth = full ? 1.2 : 0.8;
    for (let j = 0; j < 64; j++) {
      const a = (j / 64) * Math.PI * 2 + Math.sin(j * 7.1) * 0.03, r0 = g.r * wob(a) + 1, r1 = r0 + t * (0.5 + 0.4 * Math.abs(Math.sin(j * 3.3)));
      ctx.beginPath(); ctx.moveTo(g.ox + Math.cos(a) * r0, g.oy + Math.sin(a) * r0); ctx.lineTo(g.ox + Math.cos(a) * r1, g.oy + Math.sin(a) * r1); ctx.stroke();
    }
    ctx.restore();
  }

  // draw the cross-section: rings 0..upto-1 (fractional upto grows the tree), colour metric m (old metric mo below sweep k)
  function trunk(ctx, G, s, m, mo, sweep, upto, hi, full) {
    const n = s.n, up = KF.clamp(upto, 0, n), last = Math.ceil(up) - 1;
    if (last < 0) return;
    // cambium / bark on the current outer edge
    const outer = G[Math.min(n, Math.ceil(up))];
    bark(ctx, outer, outer.r, full);
    for (let k = last; k >= 0; k--) {
      const v = s[k < sweep * n ? m : mo][s.i0 + k], mm = k < sweep * n ? m : mo;
      const c = colorOf(mm, v);
      const g = G[k + 1];
      if (c) { ctx.fillStyle = rgb(c); ctx.fill(g.p); }
      else {
        ctx.fillStyle = "#77736a"; ctx.fill(g.p);
      }
    }
    // latewood lines (every ring faint, every 10th a bit stronger)
    ctx.lineWidth = full ? 0.6 : 0.45;
    for (let k = 1; k <= last + 1; k++) {
      const y = s.first + k - 1;
      ctx.strokeStyle = y % 10 === 9 ? "rgba(70,34,16,.55)" : "rgba(90,48,22,.2)";
      ctx.stroke(G[k].p);
    }
    // missing years: hatch the annulus
    for (let k = 0; k <= last; k++) {
      if (s[m][s.i0 + k] != null) continue;
      const band = new Path2D(); band.addPath(G[k + 1].p); band.addPath(G[k].p);
      const g = G[k + 1], rr = g.r * 1.1;
      ctx.save(); ctx.clip(band, "evenodd");
      ctx.strokeStyle = "rgba(30,24,18,.55)"; ctx.lineWidth = 0.8;
      for (let q = -rr; q < rr; q += 3) { ctx.beginPath(); ctx.moveTo(g.ox + q, g.oy - rr); ctx.lineTo(g.ox + q + 2 * rr, g.oy + rr); ctx.stroke(); }
      ctx.restore();
    }
    // pith
    ctx.fillStyle = "#5a3a22"; ctx.beginPath(); ctx.arc(G[0].ox, G[0].oy, full ? 2.2 : 1.6, 0, 7); ctx.fill();
    if (hi != null && hi <= last) {
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6; ctx.stroke(G[hi + 1].p);
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1; ctx.stroke(G[hi].p);
    }
  }

  // ---------------------------------------------------------------- increment core + bars (flat view of the same rings)
  function core(ctx, D, s, m, box, upto, hoverY, full) {
    const [x, y, w, h] = box, M = MET[m], N = D.N, bw = w / N;
    const barH = h - (full ? 42 : 24), cy = y + barH + 4, ch = full ? 12 : 8;
    const vmax = M.hi;
    // grid
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.font = `500 ${full ? 9.5 : 8.5}px ${MONO}`; ctx.fillStyle = "rgba(241,234,216,.45)"; ctx.textAlign = "right";
    const gv = m === "sl" ? [90, 120, 150] : M.ticks.slice(1);
    for (const v of gv) {
      const yy = y + barH - ((v - (m === "sl" ? 60 : 0)) / (vmax - (m === "sl" ? 60 : 0))) * barH;
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
      if (full) ctx.fillText(String(v), x - 4, yy + 3);
    }
    const base = m === "sl" ? 60 : 0;
    // bars
    for (let k = 0; k < s.n && k < upto; k++) {
      const i = s.i0 + k, v = s[m][i], xx = x + i * bw;
      if (v == null) { ctx.fillStyle = "rgba(160,155,140,.35)"; ctx.fillRect(xx, y + barH - 3, Math.max(1, bw - 0.4), 3); continue; }
      const over = v > vmax, hh = (Math.min(v, vmax) - base) / (vmax - base) * barH;
      const c = colorOf(m, v), bwid = Math.max(1, bw - (bw > 2.5 ? 0.6 : 0.2));
      ctx.fillStyle = hoverY === D.y0 + i ? "#fff" : rgb(c, 0.95);
      ctx.fillRect(xx, y + barH - Math.max(0.8, hh), bwid, Math.max(0.8, hh));
      if (over) { ctx.beginPath(); ctx.moveTo(xx + bwid / 2, y - 5); ctx.lineTo(xx + bwid / 2 - 3, y); ctx.lineTo(xx + bwid / 2 + 3, y); ctx.closePath(); ctx.fill(); }
    }
    // decade averages as a step line
    const st = s.stats[m];
    ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.4;
    for (const [dc, v] of st.dec) {
      if (dc - D.y0 >= upto + s.i0) continue;
      const x0 = x + Math.max(0, dc - D.y0) * bw, x1 = x + Math.min(N, dc + 10 - D.y0) * bw, yy = y + barH - ((v - base) / (vmax - base)) * barH;
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    }
    // the core: a wooden dowel whose stripes are the rings
    ctx.fillStyle = "#3a2a1f"; ctx.fillRect(x + s.i0 * bw - 2, cy - 1, (s.n) * bw + 6, ch + 2);
    for (let k = 0; k < s.n && k < upto; k++) {
      const i = s.i0 + k, c = colorOf(m, s[m][i]);
      ctx.fillStyle = c ? rgb(c) : "#77736a"; ctx.fillRect(x + i * bw, cy, Math.ceil(bw), ch);
    }
    // decade ticks
    ctx.fillStyle = "rgba(241,234,216,.62)"; ctx.font = `500 ${full ? 10 : 9}px ${MONO}`; ctx.textAlign = "center";
    for (let yy = 1910; yy <= D.y1; yy += full ? 10 : 30) {
      const xx = x + (yy - D.y0) * bw;
      ctx.fillRect(xx, cy + ch + 1, 1, 3);
      if (full ? yy % 20 === 0 || yy === 1910 : true) ctx.fillText(String(yy), xx, cy + ch + 13);
    }
    // decade values under the core (desktop)
    if (full) {
      ctx.font = `600 9.5px ${MONO}`;
      for (const [dc, v] of st.dec) {
        if (dc - D.y0 >= upto + s.i0) continue;
        const xm = x + (Math.max(dc, s.first) - D.y0 + Math.min(10, D.y1 + 1 - Math.max(dc, s.first)) / 2) * bw;
        ctx.fillStyle = rgb(colorOf(m, v)); ctx.fillText(v >= 99.5 ? v.toFixed(0) : v.toFixed(v < 10 ? 1 : 0), xm, cy + ch + 27);
      }
    }
    return { x, y, w, h: cy + ch + 14 - y, bw };
  }

  // ---------------------------------------------------------------- panels
  function legend(ctx, x, y, w, m, full) {
    const M = MET[m];
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    for (let k = 0; k <= 10; k++) g.addColorStop(k / 10, rgb(rampColor(M.ramp, k / 10)));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, full ? 10 : 8);
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10 : 9}px ${MONO}`; ctx.textAlign = "center";
    M.ticks.forEach((v, i) => { const xx = x + (i / (M.ticks.length - 1)) * w; ctx.fillText(i === M.ticks.length - 1 ? `${v}+` : String(v), xx, y + (full ? 23 : 19)); });
    ctx.textAlign = "left";
  }

  function tipBox(ctx, w, h, px, py, lines) {
    const fs = 12;
    ctx.font = `700 ${fs + 1}px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 ${fs}px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 12 + lines.length * (fs + 6);
    const bx = KF.clamp(px + 16 + bw > w - 6 ? px - bw - 16 : px + 16, 6, w - bw - 6), by = KF.clamp(py - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(14,20,16,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(241,234,216,.35)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = `${i ? 500 : 700} ${i ? fs : fs + 1}px ${SANS}`; ctx.fillText(t, bx + 11, by + 6 + (i + 1) * (fs + 6) - 3); });
  }

  function yearLines(D, s, y, m) {
    const i = y - D.y0, v = (k) => s[k][i];
    if (v("tn") == null) return [[`${y}년 · ${s.name}`], ["관측 공백 (기온 자료가 모자란 해)", DIM]];
    const L = [[`${y}년 · ${s.name}`]];
    const ss = s.ss[i], dt = (doy) => { const t = new Date(Date.UTC(y, 0, 1 + doy)); return `${t.getUTCMonth() + 1}월 ${t.getUTCDate()}일`; };
    L.push([`열대야 ${v("tn")}일 · 폭염일 ${v("hw")}일`, m === "tn" || m === "hw" ? EMBER : INK]);
    L.push([`여름 ${v("sl")}일${ss != null ? ` (${dt(ss)}–${dt(ss + v("sl") - 1)})` : ""}`, m === "sl" ? EMBER : INK]);
    L.push([`결빙일 ${v("fd")}일 · 연평균 ${s.ta[i].toFixed(1)}℃`, m === "fd" ? ICE : INK]);
    if (D.heat && y >= D.heat.y0 && y - D.heat.y0 < D.heat.cases.length) L.push([`온열질환 신고(전국) ${KF.fmt(D.heat.cases[y - D.heat.y0])}건`, DIM]);
    return L;
  }

  // ---------------------------------------------------------------- thumb
  let TG = null;
  function thumb(ctx, w, h, t, d) {
    const D = decode(d), s = D.st[0], m = "tn", c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const R = h * 0.44, cx = w - R - h * 0.1, cy = h * 0.5;
    if (!TG || TG.w !== w || TG.h !== h) TG = { w, h, G: rings(cx, cy, R * 0.94, D, s) };
    const up = KF.ease(KF.clamp((c - 0.2) / 2.6, 0, 1)) * s.n;
    const fade = c > 9.3 ? 1 - (c - 9.3) / 0.7 : 1;
    ctx.globalAlpha = fade;
    trunk(ctx, TG.G, s, m, m, 1, Math.max(1, up), null, false);
    ctx.globalAlpha = 1;
    const st = s.stats[m], x = h * 0.1, x2 = x + h * 0.36;
    const a = KF.clamp((c - 1.2) / 0.8, 0, 1) * fade;
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.075)}px ${SANS}`;
    ctx.fillText("서울의 열대야", x, h * 0.3);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.052)}px ${SANS}`;
    ctx.fillText("한 해 평균 (최저 25℃ 이상)", x, h * 0.4);
    ctx.font = `600 ${Math.round(h * 0.05)}px ${MONO}`;
    ctx.fillText(`${st.first[0]}–${String(st.first[1]).slice(2)}`, x, h * 0.55);
    ctx.fillStyle = EMBER; ctx.fillText(`${st.last[0]}–${String(st.last[1]).slice(2)}`, x2, h * 0.55);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.12)}px ${SANS}`; ctx.fillText(`${st.first[2].toFixed(1)}일`, x, h * 0.69);
    ctx.fillStyle = EMBER; ctx.fillText(`${st.last[2].toFixed(1)}일`, x2, h * 0.69);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    let si = 0, m = "tn", mo = "tn", t0 = performance.now(), tSweep = -9, tGrow = 0, hover = null, G = null, gkey = "", geo = null;
    const stBtns = KF.segment(controls, D.st.map((s, i) => ({ id: String(i), label: s.name })), "0", (id) => { si = +id; G = null; tGrow = performance.now(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "·"; controls.appendChild(sep);
    KF.segment(controls, MIDS.map((k) => ({ id: k, label: MET[k].label })), m, (id) => { if (id === m) return; mo = m; m = id; tSweep = performance.now(); });
    let rowHover = null;
    const rowAt = (x, y) => {
      const b = geo && geo.rows;
      if (!b || x < b[0] - 4 || x > b[0] + b[2] + 4 || y < b[1] || y >= b[1] + b[3]) return null;
      return Math.floor((y - b[1]) / (b[3] / D.st.length));
    };
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; rowHover = rowAt(...hover); stage.style.cursor = rowHover != null ? "pointer" : ""; });
    stage.addEventListener("pointerleave", () => { hover = null; rowHover = null; });
    stage.addEventListener("pointerdown", (e) => {
      const r = stage.getBoundingClientRect(), j = rowAt(e.clientX - r.left, e.clientY - r.top);
      if (j == null || j === si) return;
      si = j; G = null; tGrow = performance.now();
      stBtns.forEach((b, k) => b.setAttribute("aria-pressed", String(k === j)));
    });
    sc.onresize = () => { G = null; };

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520, now = performance.now(), s = D.st[si];
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      // layout
      let R, cx, cy;
      if (full) { R = Math.min(h * 0.45, w * 0.27); cx = R + Math.max(24, w * 0.03); cy = h * 0.5; }
      else { R = Math.min(w * 0.4, h * 0.3); cx = w / 2; cy = R + 14; }
      const key = `${w}x${h}x${si}`;
      if (!G || gkey !== key) { G = rings(cx, cy, R * 0.94, D, s); gkey = key; }
      const elGrow = (now - (tGrow || t0)) / 1000, growDur = tGrow ? 1.4 : 4.2;
      const up = KF.ease(KF.clamp((elGrow - (tGrow ? 0 : 0.3)) / growDur, 0, 1)) * s.n;
      const sweep = KF.clamp((now - tSweep) / 900, 0, 1);
      // hover: ring on the trunk or year on the core
      let hy = null;
      if (hover && geo) {
        const k = ringAt(G, hover[0], hover[1]);
        if (k >= 0 && k < up) hy = s.first + k;
        else if (hover[0] >= geo.core.x && hover[0] <= geo.core.x + geo.core.w && hover[1] >= geo.core.y - 6 && hover[1] <= geo.core.y + geo.core.h) {
          const yy = D.y0 + Math.floor((hover[0] - geo.core.x) / geo.core.bw);
          if (yy >= s.first && yy <= D.y1) hy = yy;
        }
      }
      trunk(ctx, G, s, m, mo, sweep, Math.max(1, up), hy != null ? hy - s.first : null, full);
      // year pins along the upper-left radius
      if (up >= s.n) {
        const pins = full ? [s.first, ...[1950, 2000].filter((y) => y > s.first + 8), D.y1] : [s.first, D.y1];
        ctx.font = `600 ${full ? 10.5 : 9.5}px ${MONO}`;
        const a = -2.45;
        for (const py of pins) {
          if (py < s.first) continue;
          const g = G[py - s.first + 1], rr = g.r * wob(a) - (G[1].r - G[0].r) / 2;
          const x = g.ox + Math.cos(a) * rr, y = g.oy + Math.sin(a) * rr;
          ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 3; ctx.textAlign = "left";
          const lab = String(py), lx = x + 5, ly = y - 4;
          ctx.strokeText(lab, lx, ly); ctx.fillStyle = "#fff"; ctx.fillText(lab, lx, ly);
        }
      }
      const M = MET[m], st = s.stats[m], hotc = m === "fd" ? ICE : EMBER;
      const fmtv = (v) => (v >= 99.5 ? v.toFixed(0) : v.toFixed(1));
      let coreBox, rowsBox = null;
      if (full) {
        const x0 = cx + R + 44, pw = w - x0 - 28;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 21px ${SERIF}`;
        ctx.fillText(`${s.name}의 나이테`, x0, 46);
        const tw = ctx.measureText(`${s.name}의 나이테`).width;
        ctx.fillStyle = DIM; ctx.font = `500 12px ${MONO}`; ctx.fillText(`${s.first}–${D.y1}`, x0 + tw + 10, 46);
        ctx.font = `500 12px ${SANS}`;
        ctx.fillText(`고리 1개 = 1년 · 가운데(심)가 ${s.first}년, 껍질 쪽이 ${D.y1}년`, x0, 70);
        ctx.fillText(`고리 색 = ${M.label} (${M.def}) · 회색 = 관측 공백`, x0, 89);
        legend(ctx, x0, 104, Math.min(260, pw), m, true);
        // first vs last 30 years
        const by = 172;
        ctx.fillStyle = DIM; ctx.font = `600 12.5px ${SANS}`;
        ctx.fillText(`첫 30년 (${st.first[0]}–${st.first[1]})`, x0, by);
        ctx.fillText(`최근 30년 (${st.last[0]}–${st.last[1]})`, x0 + pw * 0.52, by);
        ctx.font = `700 40px ${SANS}`; ctx.fillStyle = INK; ctx.fillText(`${fmtv(st.first[2])}`, x0, by + 44);
        let ww = ctx.measureText(fmtv(st.first[2])).width;
        ctx.font = `600 15px ${SANS}`; ctx.fillText("일", x0 + ww + 4, by + 44);
        ctx.font = `700 40px ${SANS}`; ctx.fillStyle = hotc; ctx.fillText(`${fmtv(st.last[2])}`, x0 + pw * 0.52, by + 44);
        ww = ctx.measureText(fmtv(st.last[2])).width;
        ctx.font = `600 15px ${SANS}`; ctx.fillText("일", x0 + pw * 0.52 + ww + 4, by + 44);
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`한 해 평균 ${M.label}`, x0, by + 64);
        const topv = s[m][st.top - D.y0];
        ctx.fillText(`${m === "sl" ? "가장 길었던" : "가장 많았던"} 해: ${st.top}년 ${topv}일`, x0 + pw * 0.52, by + 64);
        // every station: first 30 years (hollow) -> last 30 years (filled), each on its own record
        const ly = by + 96, rh = 16, xs0 = x0 + 52, xs1 = x0 + pw - 86;
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`관측소 7곳 · 첫 30년 ○ → 최근 30년 ● (한 해 평균 ${M.label})`, x0, ly);
        const vx = (v) => xs0 + KF.clamp((v - M.lo) / (M.hi - M.lo), 0, 1) * (xs1 - xs0);
        rowsBox = [x0, ly + 8, pw, D.st.length * rh];
        D.st.forEach((t, j) => {
          const yy = ly + 8 + j * rh + rh / 2, a = t.stats[m].first[2], b = t.stats[m].last[2], on = j === si, hv = rowHover === j;
          if (on || hv) { ctx.fillStyle = on ? "rgba(241,234,216,.09)" : "rgba(241,234,216,.05)"; ctx.fillRect(x0 - 4, yy - rh / 2, pw + 8, rh); }
          ctx.fillStyle = on ? INK : DIM; ctx.font = `${on ? 700 : 500} 11.5px ${SANS}`; ctx.textAlign = "left";
          ctx.fillText(t.name, x0, yy + 4);
          ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xs0, yy); ctx.lineTo(xs1, yy); ctx.stroke();
          ctx.strokeStyle = rgb(colorOf(m, b), 0.9); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(vx(a), yy); ctx.lineTo(vx(b), yy); ctx.stroke();
          ctx.fillStyle = BG; ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(vx(a), yy, 3.6, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = rgb(colorOf(m, b)); ctx.beginPath(); ctx.arc(vx(b), yy, 4.2, 0, 7); ctx.fill();
          ctx.fillStyle = on ? INK : DIM; ctx.font = `500 10.5px ${MONO}`;
          ctx.fillText(`${fmtv(a)} → ${fmtv(b)}`, xs1 + 12, yy + 4);
        });
        // core
        const cyb = h - 158;
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`해마다의 ${M.label} · 흰 선 = 10년 평균 · 아래 막대 = 같은 고리를 편 것`, x0, cyb - 12);
        coreBox = core(ctx, D, s, m, [x0 + 16, cyb, pw - 16, 132], s.n * KF.clamp(up / s.n, 0, 1), hy, true);
      } else {
        const y0 = cy + R + 24;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 13px ${SANS}`;
        ctx.fillText(`${s.name} · ${M.label}`, 12, y0);
        const tw = ctx.measureText(`${s.name} · ${M.label}`).width;
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(M.def, 12 + tw + 8, y0);
        ctx.fillStyle = DIM; ctx.font = `600 10.5px ${SANS}`;
        ctx.fillText(`첫 30년 ${st.first[0]}–${st.first[1]}`, 12, y0 + 22);
        ctx.fillText(`최근 30년 ${st.last[0]}–${st.last[1]}`, w / 2 + 6, y0 + 22);
        ctx.font = `700 25px ${SANS}`; ctx.fillStyle = INK; ctx.fillText(`${fmtv(st.first[2])}일`, 12, y0 + 50);
        ctx.fillStyle = hotc; ctx.fillText(`${fmtv(st.last[2])}일`, w / 2 + 6, y0 + 50);
        coreBox = core(ctx, D, s, m, [12, h - 84, w - 24, 58], s.n * KF.clamp(up / s.n, 0, 1), hy, false);
      }
      geo = { core: coreBox, rows: full ? rowsBox : null };
      if (hy != null && hover) tipBox(ctx, w, h, hover[0], hover[1], yearLines(D, s, hy, m));
    });
  }

  VIZ.climate = { thumb, mount, bg: BG };
})();
