// 63 cancer-trends — "오년 완주 트랙". Two eras of 100 patients run toward a 5-year finish line; the dots
// that reach it (bright) are 5-year survivors, the rest (dim) fall short — the share crossing is the
// national 5-year relative survival rate, by cancer type. Below: the age-specific "start blocks" bar
// chart Codex built — incidence *counts* grew mostly because the population aged, not because every age
// got riskier by the same amount.
(() => {
  const BG = "#cf8a5c";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#3a2013", DIM = "rgba(58,32,19,.62)", FAINT = "rgba(58,32,19,.16)";
  const TRACK = "#a8532f", TRACKD = "#8f4526", LANE = "rgba(255,247,235,.85)";
  const OK = "#2f8f5b", NO = "rgba(58,32,19,.28)", FLAG = "#f4efe3";
  const TIPDIM = "rgba(244,239,227,.65)"; // muted text *inside* the dark tooltip box (DIM is for the light page bg)

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    DEC = { ...d };
    return DEC;
  }

  // stable pseudo-random in [0,1), seeded by an integer — no per-frame flicker
  function hash(i) {
    const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return s - Math.floor(s);
  }

  // 100 runners race left -> right down the lane. Survivors' cap is the finish line (p=1, they arrive and
  // stay); the rest stop partway (a stable per-runner cap between ~8% and ~80% of the lane). `grow` (0->1)
  // is the shared "how far into the race are we" clock, so every runner advances together and the two
  // lanes visibly differ: a low-survival lane leaves most dots stranded mid-track, a high one clusters at
  // the flag.
  function lane(ctx, box, okShare, hoverIdx, grow, full) {
    const [x, y, w, h] = box;
    ctx.save();
    const r = h * 0.22;
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    ctx.fillStyle = TRACK; ctx.fill();
    ctx.clip();
    // lane texture: faint diagonal hatch + running lines (start post to finish)
    ctx.strokeStyle = "rgba(0,0,0,.06)"; ctx.lineWidth = 1;
    for (let i = -h; i < w; i += 9) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.stroke(); }
    ctx.strokeStyle = TRACKD; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x + w, y + 1); ctx.moveTo(x, y + h - 1); ctx.lineTo(x + w, y + h - 1); ctx.stroke();
    ctx.restore();

    const railL = w * 0.045, railR = w * 0.05, trackLen = w - railL - railR;
    const rows = 5, padY = h * 0.15, gh = h - padY * 2, cellH = gh / rows;
    const dotR = KF.clamp(cellH * 0.36, 2.4, full ? 6.5 : 4.6);
    const total = Math.round(okShare * 100);
    // start post
    ctx.strokeStyle = "rgba(244,239,227,.6)"; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(x + railL, y + 3); ctx.lineTo(x + railL, y + h - 3); ctx.stroke();

    const pts = [];
    for (let i = 0; i < 100; i++) {
      const on = i < total;
      const cap = on ? 1 : 0.1 + hash(i) * 0.72; // survivors run all the way; the rest stop along the way
      const p = KF.clamp(cap * grow, 0, cap);
      const row = i % rows;
      const jitterY = (hash(i + 500) - 0.5) * cellH * 0.55;
      const jitterX = on ? (hash(i + 900) - 0.5) * railR * 0.7 : 0; // finishers pack in a little unevenly
      pts.push({ i, on, cx: x + railL + p * trackLen + jitterX, cy: y + padY + row * cellH + cellH / 2 + jitterY });
    }
    // dim runners first (mid-track stragglers, underneath), bright finishers drawn last (on top of the flag zone)
    for (const pt of pts) if (!pt.on) drawRunner(pt);
    for (const pt of pts) if (pt.on) drawRunner(pt);
    function drawRunner(pt) {
      const big = hoverIdx === pt.i, rr = dotR * (big ? 1.4 : 1);
      ctx.fillStyle = pt.on ? OK : NO;
      ctx.beginPath(); ctx.arc(pt.cx, pt.cy, rr, 0, 7); ctx.fill();
      if (pt.on) { ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(pt.cx - rr * 0.28, pt.cy - rr * 0.28, rr * 0.32, 0, 7); ctx.fill(); }
      if (big) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(pt.cx, pt.cy, rr + 1.4, 0, 7); ctx.stroke(); }
    }
    // finish flag at the end of the track (not the box edge — leaves room for stragglers beyond it visually)
    const fx = x + railL + trackLen;
    ctx.fillStyle = FLAG; ctx.fillRect(fx, y - 4, 3, h + 8);
    for (let k = 0; k < Math.ceil(h / 8) + 1; k++) { ctx.fillStyle = k % 2 ? INK : FLAG; ctx.fillRect(fx, y - 4 + k * 8, 3, 8); }
    return { pts, dotR };
  }

  function hitInLane(geo, px, py) {
    if (!geo) return null;
    let best = null, bd = 1e9;
    for (const pt of geo.pts) {
      const d = (pt.cx - px) ** 2 + (pt.cy - py) ** 2;
      if (d < bd) { bd = d; best = pt.i; }
    }
    return bd < (geo.dotR + 5) ** 2 ? best : null;
  }

  function startBlocks(ctx, x, y, w, h, groups, hoverI, full) {
    const n = groups.length, rh = h / n;
    const mx = Math.max(...groups.map((g) => (g.after / g.before - 1) * 100));
    const boxes = [];
    groups.forEach((g, i) => {
      const chg = (g.after / g.before - 1) * 100, bw = (chg / mx) * (w - 120);
      const yy = y + i * rh, on = hoverI === i;
      ctx.fillStyle = on ? INK : DIM; ctx.font = `${on ? 700 : 500} ${full ? 10.5 : 9}px ${MONO}`; ctx.textAlign = "right";
      ctx.fillText(g.age, x + 46, yy + rh * 0.68);
      ctx.fillStyle = FAINT; ctx.fillRect(x + 52, yy + rh * 0.22, w - 120, rh * 0.5);
      const t = Math.min(1, chg / mx);
      ctx.fillStyle = on ? "#7a2f10" : `rgba(122,47,16,${0.35 + 0.5 * t})`;
      ctx.fillRect(x + 52, yy + rh * 0.22, Math.max(1, bw), rh * 0.5);
      ctx.fillStyle = on ? INK : DIM; ctx.textAlign = "left"; ctx.font = `${on ? 700 : 500} ${full ? 10.5 : 9}px ${SANS}`;
      ctx.fillText(`${chg >= 0 ? "+" : ""}${chg.toFixed(0)}%`, x + 56 + Math.max(1, bw), yy + rh * 0.68);
      boxes.push([x + 52, yy, w - 120, rh]);
    });
    return boxes;
  }

  function tip(ctx, w, h, lines, p) {
    ctx.font = `600 12px ${SANS}`;
    const bw = Math.max(...lines.map((l) => ctx.measureText(l[0]).width)) + 22, bh = 10 + lines.length * 17;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6);
    const by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(40,22,13,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(244,239,227,.35)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || "#f4efe3"; ctx.font = `${i ? 500 : 700} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 16 + i * 17); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const D = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, tk = D.track[0];
    const grow = KF.ease(KF.clamp((c - 0.3) / 2, 0, 1));
    // keep clear of the board's top-left badge (~90x36px): title baseline well below y=40, accounting for ascent
    const titleY = Math.max(58, h * 0.26);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.075)}px ${SANS}`;
    ctx.fillText("5년 완주 트랙", w * 0.05, titleY);
    const sub1Y = titleY + h * 0.09, lane1Y = sub1Y + 6, laneH = h * 0.22;
    const sub2Y = lane1Y + laneH + h * 0.09, lane2Y = sub2Y + 6;
    lane(ctx, [w * 0.05, lane1Y, w * 0.9, laneH], tk.before / 100, null, grow, false);
    lane(ctx, [w * 0.05, lane2Y, w * 0.9, laneH], tk.after / 100, null, grow, false);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.045)}px ${SANS}`;
    ctx.fillText(`${D.p0}년 ${tk.before.toFixed(0)}%`, w * 0.05, sub1Y);
    ctx.fillText(`${D.p1}년 ${tk.after.toFixed(0)}%`, w * 0.05, sub2Y);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    let pick = 0, hover = null, t0 = performance.now();
    KF.segment(controls, D.track.map((t, i) => ({ id: i, label: t.name })), 0, (id) => { pick = +id; t0 = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    let geo1 = null, geo2 = null, blocks = null;

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const tk = D.track[pick];
      const grow = KF.reduced ? 1 : KF.ease(KF.clamp((performance.now() - t0) / 1000, 0, 1));

      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
      ctx.fillText(`${tk.name} · 5년 진단 후 생존한 사람 100명 중`, 16, full ? 30 : 18);

      const laneX = 16, laneW = w - 32, laneH = full ? 78 : 56, gap = full ? 54 : 40;
      const y1 = full ? 50 : 32, y2 = y1 + laneH + gap;
      ctx.fillStyle = DIM; ctx.font = `600 ${full ? 12.5 : 10}px ${SANS}`;
      ctx.fillText(`${D.p0}년 진단`, laneX, y1 - 8);
      ctx.fillStyle = INK; ctx.font = `700 ${full ? 15 : 12}px ${MONO}`;
      ctx.fillText(`${tk.before.toFixed(1)}%`, laneX + laneW - 60, y1 - 8);
      geo1 = lane(ctx, [laneX, y1, laneW, laneH], tk.before / 100, null, grow, full);

      ctx.fillStyle = DIM; ctx.font = `600 ${full ? 12.5 : 10}px ${SANS}`;
      ctx.fillText(`${D.p1}년 진단`, laneX, y2 - 8);
      ctx.fillStyle = INK; ctx.font = `700 ${full ? 15 : 12}px ${MONO}`;
      ctx.fillText(`${tk.after.toFixed(1)}%`, laneX + laneW - 60, y2 - 8);
      geo2 = lane(ctx, [laneX, y2, laneW, laneH], tk.after / 100, null, grow, full);

      let hit = null;
      if (hover) {
        const i1 = hitInLane(geo1, hover[0], hover[1]);
        const i2 = i1 == null ? hitInLane(geo2, hover[0], hover[1]) : null;
        if (i1 != null) { hit = { lane: 1, i: i1 }; geo1 = lane(ctx, [laneX, y1, laneW, laneH], tk.before / 100, i1, grow, full); }
        else if (i2 != null) { hit = { lane: 2, i: i2 }; geo2 = lane(ctx, [laneX, y2, laneW, laneH], tk.after / 100, i2, grow, full); }
      }

      const by = y2 + laneH + (full ? 40 : 30);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 9.5}px ${SANS}`;
      if (full) {
        ctx.fillText(`점 100개 = 환자 100명 · 밝은 점 = 5년 뒤 생존 · ${D.p0} 진단자 ${KF.fmt(tk.n0)}명, ${D.p1} 진단자 ${KF.fmt(tk.n1)}명`, laneX, by);
      } else {
        ctx.fillText(`점 100개=환자 100명 · 밝은 점=5년 뒤 생존`, laneX, by);
      }

      // secondary: age-specific start blocks
      const sy = by + (full ? 34 : 22);
      ctx.fillStyle = INK; ctx.font = `700 ${full ? 13.5 : 11}px ${SANS}`;
      ctx.fillText(full ? "그래도 남는 문제 — 나이별 조발생률 변화(1999→2023, 모든 암)" : "그래도 남는 문제 — 나이별 조발생률 변화율", laneX, sy);
      const bh = h - sy - (full ? 14 : 10);
      if (bh > 40) {
        blocks = startBlocks(ctx, laneX, sy + 10, laneW, bh - 10, D.age.groups, null, full);
        if (hover && !hit) {
          const bi = blocks.findIndex(([bx, byy, bw, brh]) => hover[0] >= laneX && hover[0] <= laneX + laneW && hover[1] >= byy && hover[1] < byy + brh);
          if (bi >= 0) { blocks = startBlocks(ctx, laneX, sy + 10, laneW, bh - 10, D.age.groups, bi, full); hit = { blockIdx: bi }; }
        }
      }

      if (hit && hover) {
        if (hit.lane) {
          const total = Math.round((hit.lane === 1 ? tk.before : tk.after));
          const ok = hit.i < total;
          tip(ctx, w, h, [[`${hit.lane === 1 ? D.p0 : D.p1}년 진단 · ${tk.name}`], [ok ? "5년 뒤에도 생존" : "5년 안에 사망 (추정)", ok ? OK : TIPDIM]], hover);
        } else if (hit.blockIdx != null) {
          const g = D.age.groups[hit.blockIdx];
          tip(ctx, w, h, [[`${g.age} · 조발생률`], [`1999년 ${g.before.toFixed(1)}명 → 2023년 ${g.after.toFixed(1)}명 (10만 명당)`, "#e0a67c"], [`발생자 ${KF.fmt(g.countBefore)}→${KF.fmt(g.countAfter)}명`, TIPDIM]], hover);
        }
      }
    });
  }

  VIZ["cancer-trends"] = { thumb, mount, bg: BG };
})();
