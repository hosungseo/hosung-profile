// 20 ambulance — "회전 경광등". A rotating beacon seen from above on dark asphalt. Each age band is one beam of
// light: its width is that band's share of the patients 119 ambulances took to hospital (2020), so the red side
// (60+) is about half the light. Second view: the reach of each beam = patients per 1,000 people of that age.
// Third view: one small beacon per 시도, sorted by the 60+ share.
(() => {
  const BG = "#101418";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const TXT = "#eef2f5", MUTE = "rgba(238,242,245,.56)";
  const BLUE = ["#7fb2ff", "#6aa4ff", "#5896ff", "#4688fb", "#3a7cf2", "#2f70e6"], RED = ["#ff7a66", "#ff5247", "#ff2f2f"];
  const RC = "#ff3b3b", BC = "#3f86ff";
  const TAU = Math.PI * 2, TOP = -Math.PI / 2, GAP = 0.055;
  const col = (i) => (i < 6 ? BLUE[i] : RED[i - 6]);
  const short = (b) => b.replace("10세 미만", "10세↓").replace("80세 이상", "80세+");

  // asphalt, cached per size
  const GROUND = new Map();
  function ground(w, h, dpr) {
    const key = `${Math.round(w)}x${Math.round(h)}@${dpr}`;
    let c = GROUND.get(key);
    if (c) return c;
    if (GROUND.size > 10) GROUND.clear();
    c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    g.fillStyle = BG; g.fillRect(0, 0, w, h);
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < (w * h) / 60; i++) {
      g.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${0.012 + rnd() * 0.03})` : `rgba(0,0,0,${0.05 + rnd() * 0.08})`;
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 1.4, 1 + rnd() * 1.4);
    }
    GROUND.set(key, c);
    return c;
  }

  function slices(vals) { // angle ∝ value, clockwise from 12 o'clock
    const tot = vals.reduce((a, b) => a + b, 0);
    let a = TOP;
    return vals.map((v, i) => { const a0 = a; a += (v / tot) * TAU; return { i, a0, a1: a, mid: (a0 + a) / 2, share: v / tot }; });
  }

  function wedge(ctx, cx, cy, r0, r1, a0, a1) {
    ctx.beginPath(); ctx.arc(cx, cy, r1, a0, a1); ctx.arc(cx, cy, r0, a1, a0, true); ctx.closePath();
  }

  // one beacon: beams (reach 0..1 per band), unfolded up to angle `open` (0..1), beam direction theta
  function beacon(ctx, cx, cy, R, S, reach, open, theta, hot, small) {
    const r0 = R * (small ? 0.2 : 0.22), lim = TOP + TAU * open;
    for (const sl of S) {
      if (sl.a0 >= lim) continue;
      const a0 = sl.a0 + GAP / 2, a1 = Math.min(sl.a1, lim) - GAP / 2;
      if (a1 <= a0) continue;
      const r1 = r0 + (R - r0) * reach[sl.i], c = col(sl.i);
      ctx.globalAlpha = hot === null || hot === sl.i ? 1 : 0.4;
      if (!small) { // light spilling past the end of the beam
        ctx.fillStyle = c + "22"; wedge(ctx, cx, cy, r0, r1 + R * 0.07, a0 - 0.02, a1 + 0.02); ctx.fill();
      }
      const gr = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1 + 1);
      gr.addColorStop(0, c + "ff"); gr.addColorStop(0.45, c + "c0"); gr.addColorStop(1, c + "58");
      ctx.fillStyle = gr; wedge(ctx, cx, cy, r0, r1, a0, a1); ctx.fill();
      if (!small) { // faint rays
        ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 1;
        for (let a = a0 + 0.05; a < a1 - 0.02; a += 0.09) {
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
        }
      }
      ctx.strokeStyle = c; ctx.lineWidth = small ? 1 : 2.4; ctx.beginPath(); ctx.arc(cx, cy, r1, a0, a1); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // rotating reflector light (additive)
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const [off, rgb] of [[0, "255,70,60"], [Math.PI, "70,130,255"]]) {
      const th = theta + off, span = 0.42;
      const gr = ctx.createRadialGradient(cx, cy, r0 * 0.5, cx, cy, R * 1.18);
      gr.addColorStop(0, `rgba(${rgb},.5)`); gr.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R * 1.18, th - span, th + span); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // dome
    const dr = r0 * 0.78;
    const dg = ctx.createRadialGradient(cx - dr * 0.3, cy - dr * 0.35, dr * 0.1, cx, cy, dr);
    dg.addColorStop(0, "#3a4350"); dg.addColorStop(1, "#151a21");
    ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(cx, cy, dr, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,60,55,.9)"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, dr * 0.72, theta - 1.2, theta + 1.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(70,130,255,.9)"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, dr * 0.72, theta + Math.PI - 1.2, theta + Math.PI + 1.2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, dr, 0, TAU); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.beginPath(); ctx.ellipse(cx - dr * 0.3, cy - dr * 0.4, dr * 0.32, dr * 0.16, -0.5, 0, TAU); ctx.fill();
  }

  // ---------------------------------------------------------------- views
  function geo(w, h, mode) {
    if (mode === "full") { const R = Math.min(h * 0.4, w * 0.24); return { cx: w * 0.3, cy: h * 0.5, R }; }
    if (mode === "phone") { const R = Math.min(w * 0.36, h * 0.3); return { cx: w / 2, cy: R + 46, R }; }
    const R = h * 0.39; return { cx: 50 + R, cy: h * 0.52, R };
  }

  function reachOf(d, view, k) { // k: 0..1 transition into the per-capita view
    const mx = Math.max(...d.rate);
    return d.rate.map((r) => KF.lerp(1, 0.08 + (0.92 * r) / mx, view === "rate" ? k : 1 - k));
  }

  function labels(ctx, G, d, S, reach, mode, view) {
    const r0 = G.R * 0.22, fs = mode === "full" ? 12 : 10.5, placed = [];
    for (const sl of S) {
      if (mode === "phone" && sl.share < 0.08 && view !== "rate") continue;
      const name = mode === "full" ? d.bands[sl.i] : short(d.bands[sl.i]);
      const val = view === "rate" ? `${d.rate[sl.i].toFixed(1)}명` : `${(sl.share * 100).toFixed(1)}%`;
      ctx.font = `600 ${fs}px ${SANS}`;
      const tw = Math.max(ctx.measureText(name).width, val.length * fs * 0.62) + 4, th = fs * 2.3;
      const align = Math.abs(Math.cos(sl.mid)) < 0.25 ? "center" : Math.cos(sl.mid) > 0 ? "left" : "right";
      let rr = r0 + (G.R - r0) * reach[sl.i] + (mode === "full" ? 16 : 12), box;
      for (let k = 0; k < 12; k++) { // push outward until it clears the labels already placed
        const x = G.cx + Math.cos(sl.mid) * rr, y = G.cy + Math.sin(sl.mid) * rr;
        const bx = align === "center" ? x - tw / 2 : align === "left" ? x : x - tw;
        box = { x, y, l: bx, r: bx + tw, t: y - fs, b: y - fs + th };
        if (!placed.some((q) => box.l < q.r && box.r > q.l && box.t < q.b && box.b > q.t)) break;
        rr += fs * 1.2;
      }
      placed.push(box);
      ctx.textAlign = align; ctx.fillStyle = TXT; ctx.font = `600 ${fs}px ${SANS}`;
      ctx.fillText(name, box.x, box.y - 1);
      ctx.fillStyle = sl.i >= d.old ? "#ff8f84" : "#9cc2ff"; ctx.font = `600 ${mode === "full" ? 11 : 10}px ${MONO}`;
      ctx.fillText(val, box.x, box.y + (mode === "full" ? 13 : 11));
    }
  }

  function spark(ctx, x, y, w, h, T) {
    const mx = Math.max(...T.disp) * 1.05, X = (i) => x + (i / (T.years.length - 1)) * w, V = (v) => y + h - (v / mx) * h;
    for (const [arr, c, lw] of [[T.disp, "rgba(238,242,245,.45)", 1.4], [T.pat, RC, 2]]) {
      ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
      arr.forEach((v, i) => (i ? ctx.lineTo(X(i), V(v)) : ctx.moveTo(X(i), V(v)))); ctx.stroke();
    }
    ctx.font = `500 10px ${MONO}`; ctx.fillStyle = MUTE; ctx.textAlign = "left";
    ctx.fillText(String(T.years[0]), x, y + h + 13); ctx.textAlign = "right"; ctx.fillText(String(T.years[T.years.length - 1]), x + w, y + h + 13);
    const L = T.years.length - 1, pk = T.disp.indexOf(Math.max(...T.disp));
    ctx.fillStyle = "rgba(238,242,245,.75)"; ctx.fillText(`출동 ${(T.disp[pk] / 1e4).toFixed(0)}만(${T.years[pk]})`, x + w, V(T.disp[pk]) - 7);
    ctx.fillStyle = "#ff8f84"; ctx.fillText(`이송 환자 ${(T.pat[L] / 1e4).toFixed(0)}만`, x + w, V(T.pat[L]) + 15);
  }

  function panel(ctx, w, h, d, view, x0) {
    const X1 = w - 24, pw = X1 - x0, known = d.nat.reduce((a, b) => a + b, 0);
    const old = d.nat.slice(d.old).reduce((a, b) => a + b, 0) / known * 100;
    ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 19px ${SANS}`;
    ctx.fillText(view === "rate" ? "나이대 인구 1천 명당" : "누가 구급차를 탔나", x0, 44);
    ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`;
    ctx.fillText(view === "rate" ? `${d.year}년 이송 환자 ÷ 건강보험 적용인구` : `${d.year}년 119 이송 환자 ${KF.fmt(d.total)}명`, x0, 65);
    let y = 118;
    if (view === "rate") {
      const i20 = d.bands.indexOf("20대"), i80 = d.bands.length - 1, m = d.mult80;
      ctx.fillStyle = RC; ctx.font = `800 44px ${SANS}`; ctx.fillText(`${m.toFixed(1)}배`, x0, y);
      const bw = ctx.measureText(`${m.toFixed(1)}배`).width;
      ctx.fillStyle = TXT; ctx.font = `600 14px ${SANS}`; ctx.fillText("80세 이상 ÷ 20대", x0 + bw + 12, y - 16);
      ctx.fillStyle = MUTE; ctx.font = `500 11px ${MONO}`; ctx.fillText(`${d.rate[i80].toFixed(1)}명 대 ${d.rate[i20].toFixed(1)}명`, x0 + bw + 12, y);
    } else {
      ctx.fillStyle = RC; ctx.font = `800 44px ${SANS}`; ctx.fillText(`${old.toFixed(1)}%`, x0, y);
      const bw = ctx.measureText(`${old.toFixed(1)}%`).width;
      ctx.fillStyle = TXT; ctx.font = `600 14px ${SANS}`; ctx.fillText("60세 이상", x0 + bw + 12, y - 16);
      const s80 = d.nat[d.nat.length - 1] / known * 100, s20 = d.nat[2] / known * 100;
      ctx.fillStyle = MUTE; ctx.font = `500 11px ${MONO}`; ctx.fillText(`80세 이상 ${s80.toFixed(1)}% · 20대 ${s20.toFixed(1)}%`, x0 + bw + 12, y);
    }
    // bars: the other measure, one row per band
    y += 30;
    ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`;
    ctx.fillText(view === "rate" ? "이송 환자 (명)" : "인구 1천 명당 이송 (명)", x0, y);
    const vals = view === "rate" ? d.nat : d.rate, mx = Math.max(...vals), rowH = Math.min(17, (h - y - 170) / d.bands.length);
    d.bands.forEach((b, i) => {
      const yy = y + 10 + i * rowH, bl = ((pw - 150) * vals[i]) / mx;
      ctx.fillStyle = col(i); ctx.fillRect(x0 + 70, yy + 3, Math.max(1, bl), rowH - 6);
      ctx.textAlign = "right"; ctx.fillStyle = TXT; ctx.font = `500 11px ${SANS}`; ctx.fillText(b, x0 + 62, yy + rowH - 5);
      ctx.textAlign = "left"; ctx.font = `500 10.5px ${MONO}`; ctx.fillStyle = MUTE;
      ctx.fillText(view === "rate" ? KF.fmt(vals[i]) : vals[i].toFixed(1), x0 + 76 + bl, yy + rowH - 5);
    });
    // trend: dispatches vs patients
    const T = d.trend, n = T.years.length - 1, nt = (T.disp[n] - T.trans[n]) / T.disp[n] * 100;
    const ys = y + 10 + d.bands.length * rowH + 34, sh = Math.max(36, h - ys - 76);
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${MONO}`;
    ctx.fillText(`${T.years[0]}–${T.years[n]} 출동과 이송 환자 (건·명)`, x0, ys);
    spark(ctx, x0, ys + 12, pw, sh, T);
    ctx.fillStyle = TXT; ctx.font = `500 11.5px ${SANS}`; ctx.textAlign = "left";
    ctx.fillText(`${T.years[n]}년 출동 ${KF.fmt(T.disp[n])}건 중 ${nt.toFixed(1)}%는 이송 없이 끝났다`, x0, ys + 12 + sh + 38);
  }

  function grid(ctx, w, h, d, mode, t, hover) { // small multiples: one beacon per 시도
    const cols = mode === "full" ? 6 : 3, n = d.sido.length, rows = Math.ceil(n / cols);
    const top = mode === "full" ? 50 : 44, cw = (w - 16) / cols, ch = (h - top - 8) / rows;
    const R = Math.min(cw, ch - 30) * 0.4;
    ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 ${mode === "full" ? 17 : 14}px ${SANS}`;
    ctx.fillText("시도마다 60세 이상의 몫", 14, mode === "full" ? 30 : 26);
    ctx.fillStyle = MUTE; ctx.font = `500 ${mode === "full" ? 10.5 : 9.5}px ${MONO}`; ctx.textAlign = "right";
    ctx.fillText(mode === "full" ? `${d.year}년 이송 환자 · 빨강 = 60세 이상 · 눈금 = 절반` : "빨강 = 60세 이상", w - 14, mode === "full" ? 30 : 26);
    let hit = null;
    d.sido.forEach((r, k) => {
      const c = k % cols, rw = Math.floor(k / cols), cx = 8 + cw * (c + 0.5), cy = top + ch * rw + (ch - 26) / 2;
      const S = slices(r.v), k2 = KF.clamp(t * 1.4 - k * 0.04, 0, 1);
      beacon(ctx, cx, cy, R, S, r.v.map(() => 1), KF.ease(k2), TOP + TAU * (1 - r.old / 200), null, true);
      ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1.5; // half-way tick at 6 o'clock
      ctx.beginPath(); ctx.moveTo(cx, cy + R + 2); ctx.lineTo(cx, cy + R + 7); ctx.stroke();
      ctx.textAlign = "center"; ctx.fillStyle = TXT; ctx.font = `600 ${mode === "full" ? 13 : 11.5}px ${SANS}`;
      const ly = cy + R + (mode === "full" ? 24 : 20);
      ctx.fillText(r.s, cx - (mode === "full" ? 22 : 18), ly);
      ctx.fillStyle = r.old > 50 ? "#ff8f84" : "#9cc2ff"; ctx.font = `700 ${mode === "full" ? 13 : 11.5}px ${MONO}`;
      ctx.fillText(`${r.old.toFixed(1)}%`, cx + (mode === "full" ? 20 : 17), ly);
      if (hover && Math.abs(hover[0] - cx) < cw / 2 && Math.abs(hover[1] - (top + ch * rw + ch / 2)) < ch / 2) hit = r;
    });
    return hit;
  }

  function tip(ctx, w, h, lines, hover, edge) {
    const fontOf = (k) => (k === 1 ? `600 13px ${SANS}` : k === 2 ? `500 10.5px ${SANS}` : `500 11.5px ${MONO}`);
    const bw = Math.min(w - 16, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 14 + lines.length * 19;
    const bx = KF.clamp(hover[0] + 14, 8, w - bw - 8), by = KF.clamp(hover[1] - bh - 10, 8, h - bh - 8);
    ctx.fillStyle = "rgba(12,15,19,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? MUTE : TXT; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 22 + j * 19); });
  }

  function hitSlice(G, S, reach, hover) {
    if (!hover) return null;
    const dx = hover[0] - G.cx, dy = hover[1] - G.cy, r = Math.hypot(dx, dy);
    if (r < G.R * 0.2 || r > G.R + 14) return null;
    let a = Math.atan2(dy, dx); while (a < TOP) a += TAU; while (a >= TOP + TAU) a -= TAU;
    return S.find((s) => a >= s.a0 && a < s.a1) || null;
  }

  // ---------------------------------------------------------------- thumb + mount
  function thumb(ctx, w, h, t, d) {
    ctx.drawImage(ground(w, h, ctx.getTransform().a || 1), 0, 0, w, h);
    const G = geo(w, h, "thumb"), S = slices(d.nat), c = t % 10;
    const open = KF.ease(KF.clamp(c / 1.6, 0, 1));
    beacon(ctx, G.cx, G.cy, G.R, S, d.nat.map(() => 1), open, TOP + t * 2.4, null, false);
    const known = d.nat.reduce((a, b) => a + b, 0), old = d.nat.slice(d.old).reduce((a, b) => a + b, 0) / known * 100;
    const X = w - 14;
    ctx.textAlign = "right"; ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`;
    ctx.fillText(`${d.year} 구급차 이송 환자`, X, h * 0.28);
    ctx.fillStyle = TXT; ctx.font = `700 ${Math.round(h * 0.07)}px ${SANS}`; ctx.fillText("60세 이상", X, h * 0.4);
    ctx.fillStyle = RC; ctx.font = `800 ${Math.round(h * 0.19)}px ${SANS}`; ctx.fillText(`${old.toFixed(1)}%`, X, h * 0.4 + h * 0.19);
    ctx.fillStyle = "#9cc2ff"; ctx.font = `600 ${Math.round(h * 0.055)}px ${MONO}`;
    ctx.fillText(`20대 ${(d.nat[2] / known * 100).toFixed(1)}%`, X, h * 0.84);
    if (c > 9.4) { ctx.fillStyle = `rgba(16,20,24,${(c - 9.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let view = "count", t0 = performance.now(), tv = performance.now(), hover = null, theta = TOP, prevView = "count";
    KF.segment(controls, [{ id: "count", label: "환자 수" }, { id: "rate", label: "인구 1천 명당" }, { id: "sido", label: "시도별" }], "count",
      (id) => { prevView = view; view = id; tv = performance.now(); });
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 보기";
    replay.onclick = () => { t0 = tv = performance.now(); };
    const out = document.createElement("span"); out.className = "readout";
    controls.append(replay, out);
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });
    const S = slices(d.nat), known = d.nat.reduce((a, b) => a + b, 0);
    const restAngle = S.slice(d.old).reduce((a, sl) => a + sl.mid, 0) / (S.length - d.old); // rest on the red side

    KF.loop(stage, () => {
      const { ctx, w, h } = s, mode = w > 520 ? "full" : "phone";
      ctx.drawImage(ground(w, h, s.dpr), 0, 0, w, h);
      const el = (performance.now() - t0) / 1000, ev = (performance.now() - tv) / 1000;
      out.textContent = view === "rate" ? "빛의 폭 = 환자 수 · 길이 = 인구 1천 명당" : view === "sido" ? "시도 순서: 60세 이상 비중이 높은 곳부터" : "빛의 폭 = 나이대별 이송 환자";
      if (view === "sido") {
        const r = grid(ctx, w, h, d, mode, ev, hover);
        if (r && hover) {
          const tot = r.v.reduce((a, b) => a + b, 0);
          tip(ctx, w, h, [[`${r.s} · ${d.year}`, 1], [`이송 환자 ${KF.fmt(tot)}명`, 0], [`60세 이상 ${r.old.toFixed(1)}%`, 0],
            [`80세 이상 ${(r.v[r.v.length - 1] / tot * 100).toFixed(1)}% · 20대 ${(r.v[2] / tot * 100).toFixed(1)}%`, 0]], hover, RC);
        }
        return;
      }
      const G = geo(w, h, mode);
      const open = KF.ease(KF.clamp((el - 0.2) / 2.6, 0, 1));
      const k = KF.ease(KF.clamp(ev / 0.9, 0, 1));
      const reach = view === "rate" ? reachOf(d, "rate", prevView === "rate" ? 1 : k) : reachOf(d, "count", prevView === "rate" ? k : 1);
      const hit = hitSlice(G, S, reach, hover);
      // beam: spins through the intro, then rests on the red side or turns to the hovered beam
      let target = hit ? hit.mid : restAngle;
      if (el < 4.2) theta = TOP + TAU * open + (el < 2.8 ? 0 : KF.ease((el - 2.8) / 1.4) * (restAngle - TOP - TAU + TAU));
      else { let dlt = target - theta; dlt = ((dlt + Math.PI) % TAU + TAU) % TAU - Math.PI; theta += dlt * 0.12; }
      beacon(ctx, G.cx, G.cy, G.R, S, reach, open, theta, hit ? hit.i : null, false);
      if (open >= 1) labels(ctx, G, d, S, reach, mode, view);
      if (mode === "full") panel(ctx, w, h, d, view, w * 0.6);
      else {
        const X = 16, yb = G.cy + G.R + 62;
        const old = d.nat.slice(d.old).reduce((a, b) => a + b, 0) / known * 100, i80 = d.bands.length - 1;
        ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 14px ${SANS}`;
        ctx.fillText(view === "rate" ? "80세 이상 ÷ 20대 (1천 명당)" : `${d.year} 이송 환자 중 60세 이상`, X, yb);
        ctx.textAlign = "right"; ctx.fillStyle = RC; ctx.font = `800 26px ${SANS}`;
        ctx.fillText(view === "rate" ? `${d.mult80.toFixed(1)}배` : `${old.toFixed(1)}%`, w - X, yb + 4);
        ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 11.5px ${MONO}`;
        ctx.fillText(view === "rate" ? `${d.rate[i80].toFixed(1)}명 대 ${d.rate[2].toFixed(1)}명` : `80세 이상 ${(d.nat[i80] / known * 100).toFixed(1)}% · 20대 ${(d.nat[2] / known * 100).toFixed(1)}%`, X, yb + 26);
      }
      if (hit && hover) {
        const i = hit.i, lines = [[`${d.bands[i]} · ${d.year}`, 1], [`이송 환자 ${KF.fmt(d.nat[i])}명 (${(hit.share * 100).toFixed(1)}%)`, 0],
          [`인구 1천 명당 ${d.rate[i].toFixed(1)}명`, 0]];
        if (i === d.bands.length - 1) lines.push([`80대 ${KF.fmt(d.over80[0])} · 90대 ${KF.fmt(d.over80[1])} · 100세+ ${KF.fmt(d.over80[2])}`, 2]);
        tip(ctx, w, h, lines, hover, col(i));
      }
    });
  }

  VIZ.ambulance = { thumb, mount, bg: BG };
})();
