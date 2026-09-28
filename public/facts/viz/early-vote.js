// 47 early-vote — "두 개의 투표함". Two clear ballot boxes: early votes on the left, election-day votes on the right;
// one folded ballot = 100,000 voters. A strip of ten national elections (2014–2026) picks the election and shows the
// zigzag of early turnout. Other views: straight lines drawn through the first two elections of each kind vs what
// happened, early turnout by 시도, and by age.
(() => {
  const BG = "#262a3d";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif", PEN = "'Nanum Pen Script', cursive";
  const INK = "#eef0f7", DIM = "rgba(238,240,247,.64)", FAINT = "rgba(238,240,247,.13)";
  const KC = { 대선: "#f2a65e", 총선: "#79c9bb", 지방: "#b7a4f2" };
  const EARLY = "#f5d67f", DAY = "#9dc0f2", PAPER = "#f6f2e8";
  const UNIT = 100000;
  const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const kname = (e) => ({ 대선: "대선", 총선: "총선", 지방: "지방선거" })[e.k];

  // ---------------------------------------------------------------- pieces
  function ballot(ctx, x, y, w, h, a, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(-w / 2 + 1, -h / 2 + 1.5, w, h);
    ctx.fillStyle = PAPER; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "rgba(40,40,60,.16)"; ctx.fillRect(-0.6, -h / 2, 1.2, h);               // the fold
    ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(-w / 2, -h / 2, w / 2 - 1, Math.max(1, h * 0.18));
    ctx.restore();
  }
  function boxShape(ctx, x, y, w, h, col, label, full) {
    // back face (slightly offset for depth), body, lid with slot
    const dx = w * 0.07, dy = -h * 0.045;
    ctx.fillStyle = "rgba(200,215,255,.05)"; ctx.fillRect(x + dx, y + dy, w, h);
    ctx.strokeStyle = "rgba(200,215,255,.22)"; ctx.lineWidth = 1; ctx.strokeRect(x + dx + 0.5, y + dy + 0.5, w, h);
    for (const [ax, ay] of [[0, 0], [w, 0], [0, h], [w, h]]) { ctx.beginPath(); ctx.moveTo(x + ax, y + ay); ctx.lineTo(x + ax + dx, y + ay + dy); ctx.stroke(); }
    return () => { // front face drawn after the ballots
      ctx.fillStyle = "rgba(200,215,255,.07)"; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(220,230,255,.7)"; ctx.lineWidth = 1.4; ctx.strokeRect(x + 0.5, y + 0.5, w, h);
      ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fillRect(x + 4, y + 4, Math.max(2, w * 0.03), h - 8);  // glare
      // lid + slot
      ctx.fillStyle = "rgba(220,230,255,.18)"; ctx.fillRect(x, y - 3, w, 5);
      ctx.fillStyle = "#12141f"; ctx.fillRect(x + w * 0.3 + dx / 2, y - 2 + dy / 2, w * 0.4, 3);
      // label plate
      const lw = Math.min(w * 0.7, full ? 120 : 76), lh = full ? 24 : 17, lx = x + (w - lw) / 2, ly = y + h * 0.12;
      ctx.fillStyle = col; ctx.fillRect(lx, ly, lw, lh);
      ctx.fillStyle = "#1a1c2a"; ctx.font = `700 ${full ? 13 : 10}px ${SANS}`; ctx.textAlign = "center"; ctx.fillText(label, x + w / 2, ly + lh * 0.7);
    };
  }
  // pile positions for n ballots in a box (deterministic)
  const PILE = new Map();
  function pile(n, w, h, bw, bh) {
    const key = `${n}|${Math.round(w)}|${Math.round(h)}|${bw.toFixed(1)}`;
    if (PILE.has(key)) return PILE.get(key);
    const cols = Math.max(2, Math.floor((w - 10) / (bw * 0.9))), rowH = bh * 0.52, out = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols, off = r % 2 ? bw * 0.45 : 0;
      const x = 5 + bw / 2 + ((c * bw * 0.9 + off) % (w - 10 - bw)) + (rnd(i, 1) - 0.5) * bw * 0.25;
      out.push([x, h - 4 - bh / 2 - r * rowH + (rnd(i, 2) - 0.5) * 2, (rnd(i, 3) - 0.5) * 0.7]);
    }
    if (PILE.size > 40) PILE.clear();
    PILE.set(key, out);
    return out;
  }
  function fill(ctx, x, y, w, h, n, bw, bh, el, dur, frac) {
    const P = pile(Math.ceil(n), w, h, bw, bh), last = n - Math.floor(n);
    for (let i = 0; i < P.length; i++) {
      const s = (i / Math.max(1, P.length)) * dur, t = KF.clamp((el - s) / 0.42, 0, 1);
      if (t <= 0) continue;
      const [px, py, a] = P[i], e = t * t;
      const sx = x + w / 2, sy = y - 10;
      ballot(ctx, KF.lerp(sx, x + px, t), KF.lerp(sy, y + py, e), bw, bh, a * t, i === P.length - 1 && last > 0 ? 0.35 + 0.65 * last : 1);
    }
  }

  // ---------------------------------------------------------------- strip of elections
  function strip(ctx, d, x0, y0, w, h, sel, full, hover) {
    const n = d.el.length, cw = w / n, top = 40, hit = { i: null };
    const py = (v) => y0 + h - 16 - (v / top) * (h - 34);
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0 + h - 16); ctx.lineTo(x0 + w, y0 + h - 16); ctx.stroke();
    // zigzag
    ctx.strokeStyle = "rgba(238,240,247,.55)"; ctx.lineWidth = 1.3; ctx.beginPath();
    d.el.forEach((e, i) => { const x = x0 + (i + 0.5) * cw, y = py(e.er / e.el * 100); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    d.el.forEach((e, i) => {
      const x = x0 + (i + 0.5) * cw, v = e.er / e.el * 100, y = py(v), bw = Math.min(cw * 0.34, full ? 16 : 10);
      ctx.fillStyle = KC[e.k]; ctx.globalAlpha = i === sel ? 1 : 0.55; ctx.fillRect(x - bw / 2, y, bw, y0 + h - 16 - y); ctx.globalAlpha = 1;
      ctx.fillStyle = i === sel ? INK : DIM; ctx.font = `${i === sel ? 700 : 500} ${full ? 11 : 9}px ${MONO}`; ctx.textAlign = "center";
      ctx.fillText(v.toFixed(1), x, y - 5);
      ctx.fillStyle = i === sel ? INK : DIM;
      if (full) {
        ctx.font = `${i === sel ? 700 : 500} 10px ${MONO}`; ctx.fillText(String(e.y), x, y0 + h - 2);
        ctx.font = `${i === sel ? 700 : 500} 10px ${SANS}`; ctx.fillStyle = i === sel ? KC[e.k] : DIM; ctx.fillText(e.k, x, y0 + h + 11);
      } else { ctx.font = `${i === sel ? 700 : 500} 8.5px ${SANS}`; ctx.fillText(`${String(e.y).slice(2)}${e.k[0]}`, x, y0 + h - 2); }
      if (i === sel) { ctx.strokeStyle = "rgba(238,240,247,.8)"; ctx.lineWidth = 1; ctx.strokeRect(x - cw / 2 + 2, y0 - 2, cw - 4, h + (full ? 18 : 4)); }
      if (hover && hover[0] >= x - cw / 2 && hover[0] < x + cw / 2 && hover[1] >= y0 - 4 && hover[1] <= y0 + h + 6) hit.i = i;
    });
    return hit;
  }

  // ---------------------------------------------------------------- view 1: the two boxes
  function boxes(ctx, w, h, d, sel, el, full, hover) {
    const e = d.el[sel], er = e.er / UNIT, day = e.day / UNIT;
    let L;
    if (full) L = { bx: [w * 0.06, w * 0.3], by: h * 0.2, bw: w * 0.2, bh: h * 0.5, B: [22, 13] };
    else L = { bx: [w * 0.07, w * 0.53], by: 76, bw: w * 0.4, bh: h * 0.42, B: [15, 9] };
    const fronts = [boxShape(ctx, L.bx[0], L.by, L.bw, L.bh, EARLY, "사전투표", full), boxShape(ctx, L.bx[1], L.by, L.bw, L.bh, DAY, "선거일 투표", full)];
    fill(ctx, L.bx[0], L.by, L.bw, L.bh, er, L.B[0], L.B[1], el, 2.6);
    fill(ctx, L.bx[1], L.by, L.bw, L.bh, day, L.B[0], L.B[1], el, 2.6);
    fronts.forEach((fn) => fn());
    // counts under the boxes
    const done = el > 3.1;
    ctx.textAlign = "center";
    [[L.bx[0], e.er, EARLY], [L.bx[1], e.day, DAY]].forEach(([x, v, c]) => {
      ctx.fillStyle = c; ctx.font = `800 ${full ? 22 : 15}px ${SANS}`; ctx.fillText(KF.fmt(v), x + L.bw / 2, L.by + L.bh + (full ? 32 : 22));
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11.5 : 9.5}px ${SANS}`; ctx.fillText(`투표자의 ${(v / e.tot * 100).toFixed(1)}%`, x + L.bw / 2, L.by + L.bh + (full ? 50 : 36));
    });
    let hit = null;
    if (hover) L.bx.forEach((x, i) => { if (hover[0] >= x && hover[0] <= x + L.bw && hover[1] >= L.by - 10 && hover[1] <= L.by + L.bh + 40) hit = i; });
    return { L, hit, done };
  }

  function panel(ctx, w, h, d, sel, full) {
    const e = d.el[sel], ert = e.er / e.el * 100;
    if (full) {
      const x = w * 0.57;
      ctx.textAlign = "left"; ctx.fillStyle = KC[e.k]; ctx.font = `700 12px ${SANS}`; ctx.fillText(`${e.y}.${+e.sg.slice(4, 6)}.${+e.sg.slice(6)} · ${kname(e)}`, x, 40);
      ctx.fillStyle = INK; ctx.font = `700 21px ${SERIF}`; ctx.fillText(e.name, x, 68);
      ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("사전투표율 (선거인 가운데)", x, 110);
      ctx.fillStyle = EARLY; ctx.font = `800 46px ${SANS}`; ctx.fillText(`${ert.toFixed(2)}%`, x, 158);
      ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
      ctx.fillText(`전체 투표율 ${e.turn.toFixed(1)}% · 선거인 ${KF.fmt(e.el)}명`, x, 184);
      // same kind before
      const prev = [...d.el.slice(0, sel)].reverse().find((q) => q.k === e.k);
      if (prev) {
        const pv = prev.er / prev.el * 100, up = ert >= pv;
        ctx.fillStyle = up ? INK : "#ff9c86"; ctx.font = `600 13px ${SANS}`;
        ctx.fillText(`지난 ${kname(e)}(${prev.y}) ${pv.toFixed(2)}% → ${up ? "+" : "−"}${Math.abs(ert - pv).toFixed(2)}%p`, x, 214);
      }
      const pj = (d.proj[e.k] || []).find((q) => q[0] === e.y);
      if (pj) {
        ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("처음 두 선거를 이은 직선이었다면", x, 252);
        ctx.fillStyle = "rgba(238,240,247,.9)"; ctx.font = `700 20px ${SANS}`; ctx.fillText(`${pj[1].toFixed(1)}%`, x, 278);
        ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText(`실제와 ${(pj[1] - pj[2]).toFixed(1)}%p 차이`, x + 76, 276);
      }
      ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`;
      ctx.fillText(`투표지 1장 = ${KF.fmt(UNIT)}명 · 거소·선상·재외 ${KF.fmt(e.etc)}명은 뺐다`, x, h * 0.62);
    } else {
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 14px ${SERIF}`; ctx.fillText(e.name, 12, 24);
      ctx.fillStyle = KC[e.k]; ctx.font = `600 10.5px ${SANS}`; ctx.fillText(`${e.y}.${+e.sg.slice(4, 6)} · 사전투표율`, 12, 44);
      ctx.fillStyle = EARLY; ctx.font = `800 20px ${SANS}`; ctx.fillText(`${ert.toFixed(2)}%`, 12 + 124, 46);
    }
  }

  // ---------------------------------------------------------------- view 2: straight lines vs what happened
  function lines(ctx, w, h, d, el, full, hover) {
    const x0 = full ? 74 : 40, x1 = full ? w * 0.66 : w - 16, y0 = full ? 78 : 70, y1 = full ? h - 50 : h * 0.66, top = 50;
    const px = (y) => x0 + ((y - 2013.5) / (2026.8 - 2013.5)) * (x1 - x0), py = (v) => y1 - (v / top) * (y1 - y0);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
    ctx.fillText(full ? "자로 그은 선과 실제 사전투표율" : "직선과 실제", full ? 24 : 12, full ? 36 : 26);
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10}px ${SANS}`;
    ctx.fillText(full ? "점선 = 선거 종류마다 처음 두 선거를 이은 직선 · 실선 = 실제" : "점선 = 처음 두 선거를 이은 직선", full ? 24 : 12, full ? 56 : 44);
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10.5 : 9}px ${MONO}`;
    for (const v of [0, 10, 20, 30, 40, 50]) { ctx.beginPath(); ctx.moveTo(x0, py(v)); ctx.lineTo(x1, py(v)); ctx.stroke(); ctx.textAlign = "right"; ctx.fillText(`${v}%`, x0 - 6, py(v) + 3); }
    ctx.textAlign = "center";
    for (const y of full ? [2014, 2016, 2018, 2020, 2022, 2024, 2026] : [2014, 2018, 2022, 2026]) ctx.fillText(String(y), px(y), y1 + 16);
    const prog = KF.clamp(el / 2.2, 0, 1), ends = [];
    let hit = null;
    for (const k of ["대선", "총선", "지방"]) {
      const es = d.el.filter((e) => e.k === k), c = KC[k];
      const a = es[0], b = es[1], va = a.er / a.el * 100, vb = b.er / b.el * 100, slope = (vb - va) / (b.y - a.y), yEnd = es[es.length - 1].y;
      // straight line
      ctx.strokeStyle = c; ctx.globalAlpha = 0.75; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(px(a.y), py(va)); const ye = KF.lerp(a.y, yEnd, prog); ctx.lineTo(px(ye), py(va + slope * (ye - a.y))); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      // actual
      ctx.strokeStyle = c; ctx.lineWidth = 2.6; ctx.beginPath();
      es.forEach((e, i) => { const x = px(e.y), y = py(e.er / e.el * 100); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      es.forEach((e) => {
        const x = px(e.y), y = py(e.er / e.el * 100);
        ctx.fillStyle = c; ctx.fillRect(x - 5, y - 4, 10, 8); ctx.fillStyle = "#1a1c2a"; ctx.fillRect(x - 2.5, y - 3, 5, 1.3);  // a tiny ballot box
        if (hover && Math.hypot(hover[0] - x, hover[1] - y) < 12) hit = e;
      });
      ends.push({ k, e: es[es.length - 1], vp: va + slope * (es[es.length - 1].y - a.y) });
    }
    if (prog >= 1) { // straight-line vs actual, stacked labels at the right with leaders
      const lx = px(2026.8) + 10, sorted = ends.map((q) => ({ ...q, y: py(q.vp) })).sort((a, b) => a.y - b.y);
      let prevY = -1e9;
      sorted.forEach((q) => {
        q.ly = Math.max(q.y, prevY + (full ? 44 : 30)); prevY = q.ly;
        const c = KC[q.k], xa = px(q.e.y), ya = py(q.e.er / q.e.el * 100);
        ctx.strokeStyle = c; ctx.lineWidth = 1;
        if (full) { ctx.setLineDash([1, 3]); ctx.beginPath(); ctx.moveTo(xa + 4, q.y); ctx.lineTo(lx - 4, q.ly - 4); ctx.stroke(); ctx.setLineDash([]); }
        ctx.beginPath(); ctx.moveTo(xa + 6, q.y); ctx.lineTo(xa + 10, q.y); ctx.lineTo(xa + 10, ya); ctx.lineTo(xa + 6, ya); ctx.stroke();
        if (full) {
          ctx.textAlign = "left"; ctx.fillStyle = c; ctx.font = `700 12.5px ${SANS}`; ctx.fillText(`${kname(q.e)} ${q.e.y}`, lx, q.ly - 8);
          ctx.fillStyle = INK; ctx.font = `500 11.5px ${MONO}`; ctx.fillText(`직선 ${q.vp.toFixed(1)}% → 실제 ${(q.e.er / q.e.el * 100).toFixed(1)}%`, lx, q.ly + 8);
        }
      });
    }
    if (full) {
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
      ctx.fillText("세 종류 모두 처음보다 오르는 폭이 작다", px(2026.8) + 10, y1 - 26); ctx.fillText("직선보다 S자에 가깝다", px(2026.8) + 10, y1 - 8);
    } else {
      const y = h * 0.66 + 38;
      ["대선", "총선", "지방"].forEach((k, i) => {
        const es = d.el.filter((e) => e.k === k), p = d.proj[k][d.proj[k].length - 1];
        ctx.textAlign = "left"; ctx.fillStyle = KC[k]; ctx.font = `700 11px ${SANS}`; ctx.fillText(`${k === "지방" ? "지방" : k} ${p[0]}`, 12, y + i * 26);
        ctx.fillStyle = INK; ctx.font = `500 11px ${MONO}`; ctx.fillText(`직선 ${p[1].toFixed(1)}% · 실제 ${p[2].toFixed(1)}%`, 86, y + i * 26);
      });
    }
    return hit;
  }

  // ---------------------------------------------------------------- view 3: 시도
  function sido(ctx, w, h, d, sel, el, full, hover) {
    const e = d.el[sel], rows = e.sd.map(([n, elc, er]) => [n, er / elc * 100, elc, er]).sort((a, b) => b[1] - a[1]);
    const x0 = full ? 90 : 46, x1 = full ? w * 0.68 : w - 50, y0 = full ? 80 : 64, rh = (h - y0 - (full ? 24 : 70)) / rows.length, top = 60;
    const unit = 2, bw = ((x1 - x0) / (top / unit)) * 0.86, bh = Math.min(rh * 0.62, 12);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
    ctx.fillText(full ? `시도별 사전투표율 · ${e.name}` : `시도별 · ${e.y} ${kname(e)}`, full ? 24 : 12, full ? 36 : 26);
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10}px ${SANS}`;
    ctx.fillText(full ? `투표지 1장 = 선거인의 ${unit}% · 아래 띠에서 선거를 고르면 바뀐다` : `투표지 1장 = ${unit}%`, full ? 24 : 12, full ? 56 : 44);
    let hit = null;
    const nat = e.er / e.el * 100;
    rows.forEach(([n, v], r) => {
      const y = y0 + (r + 0.5) * rh, k = Math.floor(v / unit), fr = v / unit - k;
      ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 12 : 10}px ${SANS}`; ctx.fillText(n, x0 - 8, y + 4);
      const shown = KF.clamp((el - r * 0.05) / 1.2, 0, 1) * (k + fr);
      for (let j = 0; j < Math.ceil(shown); j++) {
        const q = Math.min(1, shown - j), cx = x0 + j * (x1 - x0) / (top / unit) + bw * q / 2 + ((x1 - x0) / (top / unit) - bw) / 2;
        ballot(ctx, cx, y, bw * q, bh, (rnd(j + r * 40, 5) - 0.5) * 0.25 * q, 1);
      }
      ctx.textAlign = "left"; ctx.fillStyle = r === 0 ? EARLY : r === rows.length - 1 ? "#ff9c86" : DIM; ctx.font = `600 ${full ? 11 : 9.5}px ${MONO}`;
      ctx.fillText(`${v.toFixed(1)}%`, x0 + (k + fr) * (x1 - x0) / (top / unit) + 6, y + 4);
      if (hover && hover[1] >= y - rh / 2 && hover[1] < y + rh / 2) hit = { n, v, r };
    });
    const nx = x0 + (nat / unit) * (x1 - x0) / (top / unit);
    ctx.strokeStyle = "rgba(245,214,127,.7)"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(nx, y0 - 4); ctx.lineTo(nx, y0 + rows.length * rh); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = EARLY; ctx.font = `600 ${full ? 11 : 9.5}px ${SANS}`; ctx.textAlign = "center"; ctx.fillText(`전국 ${nat.toFixed(1)}%`, nx, y0 - 8);
    if (full) {
      const x = w * 0.74, top1 = rows[0], low = rows[rows.length - 1];
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText("가장 높은 곳과 낮은 곳", x, 110);
      ctx.fillStyle = EARLY; ctx.font = `800 30px ${SANS}`; ctx.fillText(`${top1[0]} ${top1[1].toFixed(1)}%`, x, 150);
      ctx.fillStyle = "#ff9c86"; ctx.fillText(`${low[0]} ${low[1].toFixed(1)}%`, x, 192);
      ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText(`차이 ${(top1[1] - low[1]).toFixed(1)}%p · ${(top1[1] / low[1]).toFixed(1)}배`, x, 216);
    }
    return hit;
  }

  // ---------------------------------------------------------------- view 4: age
  function ages(ctx, w, h, d, el, full, hover) {
    const keys = Object.keys(d.age), labs = d.age[keys[0]].map((r) => r[0]);
    const x0 = full ? 70 : 38, x1 = full ? w * 0.66 : w - 16, y0 = full ? 80 : 70, y1 = full ? h - 46 : h * 0.62, top = 50;
    const px = (i) => x0 + (i + 0.5) * (x1 - x0) / labs.length, py = (v) => y1 - (v / top) * (y1 - y0);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
    ctx.fillText(full ? "나이대별 사전투표율" : "나이대별 사전투표율", full ? 24 : 12, full ? 36 : 26);
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10}px ${SANS}`;
    ctx.fillText(full ? "선관위 투표율 분석 파일이 있는 네 선거 · 일반국민 선거인 가운데 사전투표자" : "네 선거 · 일반국민", full ? 24 : 12, full ? 56 : 44);
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10.5 : 9}px ${MONO}`;
    for (const v of [0, 10, 20, 30, 40, 50]) { ctx.beginPath(); ctx.moveTo(x0, py(v)); ctx.lineTo(x1, py(v)); ctx.stroke(); ctx.textAlign = "right"; ctx.fillText(`${v}%`, x0 - 6, py(v) + 3); }
    ctx.textAlign = "center"; ctx.font = `500 ${full ? 11 : 8.5}px ${SANS}`;
    labs.forEach((l, i) => ctx.fillText(full ? l : l.replace("세 이상", "+").replace("세", ""), px(i), y1 + 16));
    const style = { "20200415": [KC.총선, 2], "20220309": ["#f7c792", 2], "20220601": [KC.지방, 2], "20250603": [KC.대선, 3.2] };
    const prog = KF.clamp(el / 1.6, 0, 1);
    let hit = null;
    keys.forEach((sg) => {
      const rows = d.age[sg], [c, lw] = style[sg] || [INK, 2];
      ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
      rows.forEach(([, a, b], i) => { if (i / (rows.length - 1) > prog + 0.001) return; const x = px(i), y = py(b / a * 100); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      rows.forEach(([lab, a, b], i) => {
        const x = px(i), y = py(b / a * 100);
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, lw + 1, 0, 7); ctx.fill();
        if (hover && Math.hypot(hover[0] - x, hover[1] - y) < 9) hit = { sg, lab, a, b };
      });
    });
    const x = full ? w * 0.72 : 12;
    keys.forEach((sg, i) => {
      const e = d.el.find((q) => q.sg === sg), [c] = style[sg] || [INK];
      const y = full ? 110 + i * 40 : h * 0.62 + 40 + i * 20, xx = full ? x : 12 + (i % 2) * ((w - 24) / 2), yy = full ? y : h * 0.62 + 40 + Math.floor(i / 2) * 22;
      ctx.fillStyle = c; ctx.fillRect(xx, yy - 8, 14, 4);
      ctx.fillStyle = INK; ctx.font = `600 ${full ? 13 : 10.5}px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(`${e.y} ${kname(e)} ${(e.er / e.el * 100).toFixed(1)}%`, xx + 20, yy - 3);
    });
    return hit;
  }

  // ---------------------------------------------------------------- tooltip
  function tip(ctx, w, h, lines, p) {
    const width = (t, k) => { ctx.font = `${k === 1 ? 700 : 500} ${k === 1 ? 13 : 12}px ${SANS}`; return ctx.measureText(t).width; };
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => width(t, k))) + 22), bh = 12 + lines.length * 19;
    const bx = KF.clamp(p[0] + 16 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 16, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(20,22,34,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(245,214,127,.5)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, k, c], j) => { ctx.fillStyle = c || (k === 1 ? INK : DIM); ctx.font = `${k === 1 ? 700 : 500} ${k === 1 ? 13 : 12}px ${SANS}`; ctx.fillText(t, bx + 11, by + 22 + j * 19); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const c = t % 10, sel = d.el.findIndex((e) => e.sg === "20250603"), e = d.el[sel];
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const bw = w * 0.17, bh = h * 0.48, by = h * 0.27, bx = [w * 0.1, w * 0.3], B = [w * 0.032, w * 0.019];
    const fronts = [boxShape(ctx, bx[0], by, bw, bh, EARLY, "사전", false), boxShape(ctx, bx[1], by, bw, bh, DAY, "선거일", false)];
    fill(ctx, bx[0], by, bw, bh, e.er / UNIT / 2, B[0], B[1], c, 2.2);
    fill(ctx, bx[1], by, bw, bh, e.day / UNIT / 2, B[0], B[1], c, 2.2);
    fronts.forEach((fn) => fn());
    ctx.textAlign = "center"; ctx.font = `700 ${Math.round(h * 0.055)}px ${SANS}`;
    ctx.fillStyle = EARLY; ctx.fillText(`${(e.er / e.tot * 100).toFixed(0)}%`, bx[0] + bw / 2, by + bh + h * 0.09);
    ctx.fillStyle = DAY; ctx.fillText(`${(e.day / e.tot * 100).toFixed(0)}%`, bx[1] + bw / 2, by + bh + h * 0.09);
    // zigzag strip on the right
    const x0 = w * 0.56, x1 = w - 12, y0 = h * 0.42, y1 = h * 0.86, n = d.el.length, cw = (x1 - x0) / n;
    const py = (v) => y1 - (v / 40) * (y1 - y0);
    const shown = KF.clamp((c - 0.2) / 2.4, 0, 1) * n;
    ctx.strokeStyle = "rgba(238,240,247,.6)"; ctx.lineWidth = 1.2; ctx.beginPath();
    d.el.forEach((q, i) => { if (i > shown) return; const x = x0 + (i + 0.5) * cw, y = py(q.er / q.el * 100); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    d.el.forEach((q, i) => {
      if (i > shown) return;
      const x = x0 + (i + 0.5) * cw, y = py(q.er / q.el * 100);
      ctx.fillStyle = KC[q.k]; ctx.fillRect(x - cw * 0.18, y, cw * 0.36, y1 - y);
    });
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText("사전투표율, 선거 10번", x0, h * 0.14);
    const p22 = d.el.find((q) => q.sg === "20220309");
    ctx.fillStyle = INK; ctx.font = `800 ${Math.round(h * 0.1)}px ${SANS}`;
    ctx.fillText(`${(p22.er / p22.el * 100).toFixed(1)}→${(e.er / e.el * 100).toFixed(1)}%`, x0, h * 0.14 + h * 0.12);
    ctx.fillStyle = KC.대선; ctx.font = `600 ${Math.round(h * 0.048)}px ${SANS}`; ctx.fillText("대선 2022 → 2025", x0, h * 0.14 + h * 0.19);
    if (c > 9.4) { ctx.fillStyle = `rgba(38,42,61,${(c - 9.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let view = "box", sel = d.el.findIndex((e) => e.sg === "20250603"), t0 = performance.now(), hover = null, stripBox = null;
    if (sel < 0) sel = d.el.length - 1;
    if (KF.reduced) t0 -= 1e5;
    KF.segment(controls, [{ id: "box", label: "두 투표함" }, { id: "line", label: "직선으로 그으면" }, { id: "sido", label: "시도" }, { id: "age", label: "나이" }], "box", (id) => {
      view = id; t0 = performance.now(); lab.style.display = id === "box" || id === "sido" ? "" : "none";
    });
    const lab = document.createElement("label"), range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = d.el.length - 1; range.step = 1; range.value = sel;
    lab.append("선거", range);
    const out = document.createElement("span"); out.className = "readout";
    controls.append(lab, out);
    const setOut = () => { const e = d.el[sel]; out.textContent = `${e.name} · 사전투표율 ${(e.er / e.el * 100).toFixed(2)}%`; };
    const pickSel = (i) => { if (i === sel) return; sel = i; range.value = i; setOut(); t0 = performance.now() - (view === "box" ? 0.4 : 0) * 1000; };
    range.oninput = () => pickSel(+range.value);
    setOut();
    const at = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = at(e); });
    stage.addEventListener("pointerdown", (e) => {
      hover = at(e);
      if (stripBox && (view === "box" || view === "sido")) {
        const [x0, y0, w0, h0] = stripBox;
        if (hover[0] >= x0 && hover[0] <= x0 + w0 && hover[1] >= y0 - 6 && hover[1] <= y0 + h0 + 8) pickSel(KF.clamp(Math.floor((hover[0] - x0) / w0 * d.el.length), 0, d.el.length - 1));
      }
    });
    stage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hover = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, el = (performance.now() - t0) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const vg = ctx.createRadialGradient(w * 0.3, h * 0.35, 10, w * 0.3, h * 0.35, Math.max(w, h) * 0.8);
      vg.addColorStop(0, "rgba(110,120,180,.16)"); vg.addColorStop(1, "rgba(0,0,0,.14)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
      stripBox = null;
      if (view === "box" || view === "sido") {
        let hitBox = null, hitS = null;
        if (view === "box") { const r = boxes(ctx, w, h, d, sel, el, full, hover); hitBox = r.hit; panel(ctx, w, h, d, sel, full); }
        const sb = full ? (view === "box" ? [w * 0.56, h * 0.7, w * 0.42, h * 0.22] : [w * 0.72, h * 0.62, w * 0.26, h * 0.26]) : [10, h - 64, w - 20, 56];
        if (view === "sido") { hitS = sido(ctx, w, h, d, sel, el, full, hover); if (!full) sb[1] = h - 60; }
        stripBox = sb;
        const hs = strip(ctx, d, sb[0], sb[1], sb[2], sb[3], sel, full && view === "box", hover);
        if (hover && hs.i !== null) {
          const e = d.el[hs.i];
          tip(ctx, w, h, [[`${e.name}`, 1, KC[e.k]], [`사전투표율 ${(e.er / e.el * 100).toFixed(2)}% · ${KF.fmt(e.er)}명`, 0, EARLY],
            [`투표자 중 사전투표 ${(e.er / e.tot * 100).toFixed(1)}% · 전체 투표율 ${e.turn.toFixed(1)}%`, 0], ["누르면 이 선거로", 0]], hover);
        } else if (hitBox !== null && hover) {
          const e = d.el[sel], v = hitBox ? e.day : e.er;
          tip(ctx, w, h, [[hitBox ? "선거일 투표" : "사전투표", 1, hitBox ? DAY : EARLY], [`${KF.fmt(v)}명 · 투표지 ${KF.fmt(Math.round(v / UNIT))}장`, 0, INK],
            [`투표자 ${KF.fmt(e.tot)}명의 ${(v / e.tot * 100).toFixed(1)}%`, 0], [`선거인 ${KF.fmt(e.el)}명의 ${(v / e.el * 100).toFixed(1)}%`, 0]], hover);
        } else if (hitS && hover) {
          const e = d.el[sel], row = e.sd.find((q) => q[0] === hitS.n);
          tip(ctx, w, h, [[`${hitS.n} · ${e.y} ${kname(e)}`, 1], [`사전투표율 ${hitS.v.toFixed(2)}% (${hitS.r + 1}위)`, 0, EARLY],
            [`사전투표 ${KF.fmt(row[2])}명 / 선거인 ${KF.fmt(row[1])}명`, 0], [`투표자 중 사전투표 ${(row[2] / row[3] * 100).toFixed(1)}%`, 0]], hover);
        }
      } else if (view === "line") {
        const hit = lines(ctx, w, h, d, el, full, hover);
        if (hit && hover) tip(ctx, w, h, [[hit.name, 1, KC[hit.k]], [`사전투표율 ${(hit.er / hit.el * 100).toFixed(2)}%`, 0, EARLY], [`전체 투표율 ${hit.turn.toFixed(1)}%`, 0]], hover);
      } else {
        const hit = ages(ctx, w, h, d, el, full, hover);
        if (hit && hover) {
          const e = d.el.find((q) => q.sg === hit.sg);
          tip(ctx, w, h, [[`${e.y} ${kname(e)} · ${hit.lab}`, 1], [`사전투표율 ${(hit.b / hit.a * 100).toFixed(1)}%`, 0, EARLY], [`${KF.fmt(hit.b)}명 / 선거인 ${KF.fmt(hit.a)}명`, 0]], hover);
        }
      }
    });
  }

  VIZ["early-vote"] = { thumb, mount, bg: BG };
})();
