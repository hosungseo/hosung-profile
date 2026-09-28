// 07 turnout — "Ballot stamps". Ballot paper: one row per age band, ten stamp spaces per row,
// one vermilion ⊙ stamp for every 10% of turnout (the last stamp cut to the fraction).
(() => {
  const PAPER = "#f7f2ea", INK = "#2b2621", RED = "#c62b2b";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif";
  const SPR = new Map();

  // ---------------------------------------------------------------- stamp sprite (device px, cached)
  function sprites(rpx) {
    const key = Math.max(2, Math.round(rpx * 2) / 2);
    if (SPR.has(key)) return SPR.get(key);
    const out = [];
    for (let v = 0; v < 4; v++) {
      const size = Math.ceil(key * 2 + 8), c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d"), m = size / 2, r = key;
      let seed = 97 + v * 131;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      g.strokeStyle = RED; g.fillStyle = RED; g.lineCap = "round";
      g.lineWidth = Math.max(1, r * 0.17);
      g.beginPath(); g.arc(m, m, r - g.lineWidth / 2, 0, Math.PI * 2); g.stroke();
      g.lineWidth = Math.max(1, r * 0.15);
      g.beginPath(); g.moveTo(m - r * 0.1, m - r * 0.5); g.lineTo(m - r * 0.1, m + r * 0.5); g.stroke();
      g.beginPath(); g.moveTo(m - r * 0.06, m - r * 0.02); g.lineTo(m + r * 0.33, m + r * 0.22); g.stroke();
      // uneven ink: voids and a slightly heavier side
      g.globalCompositeOperation = "destination-out";
      for (let k = 0; k < r * 1.8; k++) {
        const a = rnd() * Math.PI * 2, d = rnd() * r * 1.05;
        g.globalAlpha = 0.2 + rnd() * 0.5;
        g.beginPath(); g.arc(m + Math.cos(a) * d, m + Math.sin(a) * d, 0.25 + rnd() * r * 0.05, 0, 7); g.fill();
      }
      const side = rnd() * Math.PI * 2, lg = g.createLinearGradient(m + Math.cos(side) * r, m + Math.sin(side) * r, m - Math.cos(side) * r, m - Math.sin(side) * r);
      lg.addColorStop(0, "rgba(0,0,0,0)"); lg.addColorStop(1, "rgba(0,0,0,.22)");
      g.globalAlpha = 1; g.fillStyle = lg; g.fillRect(0, 0, size, size);
      g.globalCompositeOperation = "source-over";
      out.push(c);
    }
    SPR.set(key, out);
    return out;
  }
  const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

  function stamp(ctx, x, y, r, frac, a, b, pop) {
    const dpr = ctx.getTransform().a || 1, spr = sprites(r * dpr), img = spr[Math.floor(hash(a, b) * spr.length)];
    const S = img.width / dpr, rot = (hash(b, a) - 0.5) * 0.5, jx = (hash(a + 3, b) - 0.5) * r * 0.12, jy = (hash(a, b + 5) - 0.5) * r * 0.12;
    ctx.save();
    if (frac < 1) { ctx.beginPath(); ctx.rect(x - r - 4, y - r - 4, (2 * r + 8) * frac, 2 * r + 8); ctx.clip(); }
    ctx.translate(x + jx, y + jy); ctx.rotate(rot);
    const k = 1 + (1 - pop) * 0.35;
    ctx.scale(k, k); ctx.globalAlpha = 0.92 * pop;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(img, -S / 2, -S / 2, S, S);
    ctx.restore();
  }

  function paper(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(120,100,70,.05)"; // paper fibres, deterministic
    for (let i = 0; i < Math.min(900, (w * h) / 700); i++) {
      const x = hash(i, 1) * w, y = hash(1, i) * h, l = 2 + hash(i, i) * 7;
      ctx.fillRect(x, y, l, 0.7);
    }
  }

  // ---------------------------------------------------------------- data -> rows
  function rowsFor(d, view) {
    if (view === "y20") return d.elections.map((e) => {
      const b = e.bands.find((x) => x.k === "20대");
      return { label: e.label, t: b.t, b, e, tick: e.actual };
    });
    const e = d.elections.find((x) => x.id === view);
    return e.bands.map((b) => ({ label: b.k, t: b.t, b, e, bold: b.k === "20대" }));
  }
  const lowestIndex = (rows) => rows.reduce((k, r, i) => (r.t < rows[k].t ? i : k), 0);

  function geom(w, h, n, full) {
    const top = full ? 96 : 80, bottom = full ? 22 : 12, left = full ? 40 : 8, right = full ? 40 : 8;
    const labelW = full ? 124 : 62, valW = full ? 150 : 56;
    const rowH = (h - top - bottom) / n, cell = (w - left - right - labelW - valW) / 10;
    const r = Math.max(3.5, Math.min(cell / 2 - (full ? 6 : 1.5), rowH / 2 - (full ? 9 : 5), full ? 24 : 14));
    const sx = left + labelW;
    return { top, bottom, left, right, labelW, valW, rowH, cell, r, sx, vx: sx + cell * 10, n };
  }

  // T: seconds since stamping began, dc: seconds per column
  function ballot(ctx, w, h, rows, G, T, dc, full, hover, alpha, lowOn) {
    const { top, rowH, cell, r, sx, vx, left, right } = G;
    ctx.save(); ctx.globalAlpha = alpha;
    // printed frame: double rule around the rows
    ctx.strokeStyle = "rgba(43,38,33,.55)"; ctx.lineWidth = 1;
    const fx = left - (full ? 10 : 4), fy = top - 6, fw = w - left - right + (full ? 20 : 8), fh = rowH * rows.length + 12;
    ctx.strokeRect(fx + 0.5, fy + 0.5, fw, fh);
    if (full) ctx.strokeRect(fx + 3.5, fy + 3.5, fw - 6, fh - 6);
    rows.forEach((row, i) => {
      const y0 = top + i * rowH, cy = y0 + rowH / 2;
      if (hover === i) { ctx.fillStyle = "rgba(198,43,43,.07)"; ctx.fillRect(left, y0, w - left - right, rowH); }
      if (i) { ctx.strokeStyle = "rgba(43,38,33,.28)"; ctx.beginPath(); ctx.moveTo(left, Math.round(y0) + 0.5); ctx.lineTo(w - right, Math.round(y0) + 0.5); ctx.stroke(); }
      // label
      ctx.fillStyle = INK; ctx.textAlign = "left";
      ctx.font = `${row.bold ? 700 : 500} ${full ? 15 : 12}px ${SANS}`;
      ctx.fillText(row.label, left + (full ? 12 : 4), cy + (full ? 5 : 4));
      // empty stamp spaces
      ctx.strokeStyle = "rgba(43,38,33,.13)"; ctx.lineWidth = 1;
      for (let c = 0; c < 10; c++) { ctx.beginPath(); ctx.arc(sx + c * cell + cell / 2, cy, r, 0, Math.PI * 2); ctx.stroke(); }
      // stamps, column by column
      const full10 = Math.floor(row.t / 10), frac = (row.t - full10 * 10) / 10;
      for (let c = 0; c <= full10 && c < 10; c++) {
        const f = c < full10 ? 1 : frac;
        if (f < 0.02) continue;
        const at = c * dc + i * 0.025, pop = KF.clamp((T - at) / 0.14, 0, 1);
        if (pop <= 0) continue;
        stamp(ctx, sx + c * cell + cell / 2, cy, r, f, i * 13 + c, c * 7 + i, KF.ease(pop));
      }
      // value, once the row has finished stamping
      const endAt = Math.min(full10, 9) * dc + i * 0.025 + 0.15, va = KF.clamp((T - endAt) / 0.3, 0, 1);
      if (va > 0) {
        ctx.save(); ctx.globalAlpha = alpha * va;
        const isLow = lowOn && i === lowOn.index;
        ctx.fillStyle = isLow ? RED : INK; ctx.textAlign = "left";
        ctx.font = `600 ${full ? 17 : 12.5}px ${MONO}`;
        ctx.fillText(`${row.t.toFixed(1)}%`, vx + (full ? 18 : 6), cy + (full ? 6 : 4.5));
        if (isLow && full) {
          ctx.font = `600 11.5px ${SANS}`; ctx.fillText("가장 낮음", vx + 88, cy + 5);
        }
        ctx.restore();
      }
      // the election's own overall turnout, as a short tick (20대 view)
      if (row.tick != null) {
        const tx = sx + (row.tick / 10) * cell, ta = KF.clamp((T - 10 * dc) / 0.4, 0, 1);
        ctx.save(); ctx.globalAlpha = alpha * ta; ctx.strokeStyle = "rgba(43,38,33,.55)"; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(tx, y0 + rowH * 0.14); ctx.lineTo(tx, y0 + rowH * 0.86); ctx.stroke(); ctx.restore();
      }
    });
    // column rules: label | stamps | value
    ctx.strokeStyle = "rgba(43,38,33,.4)"; ctx.lineWidth = 1;
    for (const x of [sx - 4, vx + 2]) { ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, top); ctx.lineTo(Math.round(x) + 0.5, top + rowH * rows.length); ctx.stroke(); }
    ctx.restore();
  }

  function overallLine(ctx, G, v, a, full, label) {
    if (a <= 0 || v == null) return;
    const x = G.sx + (v / 10) * G.cell;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = "rgba(43,38,33,.6)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, G.top - 4); ctx.lineTo(x, G.top + G.rowH * G.n); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = INK; ctx.font = `600 ${full ? 11.5 : 10}px ${MONO}`; ctx.textAlign = "center";
    ctx.fillText(label, x, G.top - (full ? 12 : 9));
    ctx.restore();
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    paper(ctx, w, h);
    const c = t % 12, second = c >= 6, T = second ? c - 6 : c;
    const view = second ? "l22" : "p22", rows = rowsFor(d, view);
    const G = geom(w, h, rows.length, false);
    G.top = h * 0.2; G.bottom = h * 0.05; G.left = w * 0.04; G.right = w * 0.04; G.labelW = w * 0.15; G.valW = w * 0.16;
    G.rowH = (h - G.top - G.bottom) / rows.length; G.cell = (w - G.left - G.right - G.labelW - G.valW) / 10;
    G.r = Math.min(G.cell / 2 - 1, G.rowH / 2 - 1.5); G.sx = G.left + G.labelW; G.vx = G.sx + G.cell * 10;
    const fade = T > 5.4 ? 1 - (T - 5.4) / 0.6 : Math.min(1, T / 0.3);
    const li = lowestIndex(rows);
    ballot(ctx, w, h, rows, G, T - 0.2, 0.2, false, null, fade, { index: li });
    const e = rows[0].e;
    ctx.save(); ctx.globalAlpha = fade; ctx.textAlign = "right"; ctx.fillStyle = INK;
    ctx.font = `700 ${Math.round(h * 0.085)}px ${SERIF}`;
    ctx.fillText(`${e.date.slice(0, 4)} ${e.kind === "대선" ? "대통령선거" : "지방선거"}`, w - G.right, h * 0.125);
    ctx.restore();
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let view = "p25", t0 = performance.now(), hover = null, pointer = null, prev = null, dc = 0.27;
    const items = d.elections.map((e) => ({ id: e.id, label: e.label })).concat([{ id: "y20", label: "20대만 모아 보기" }]);
    KF.segment(controls, items, view, (id) => {
      prev = { view, t: performance.now() };
      view = id; t0 = performance.now() + 250; dc = 0.11;
    });
    const note = document.createElement("span"); note.className = "readout";
    note.textContent = "도장 1개 = 투표율 10%p · 줄에 마우스를 올리면 자세히"; controls.appendChild(note);
    let G = null;
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect(); pointer = [e.clientX - r.left, e.clientY - r.top];
      if (!G) return;
      const i = Math.floor((pointer[1] - G.top) / G.rowH);
      hover = i >= 0 && i < G.n && pointer[0] > G.left && pointer[0] < s.w - G.right ? i : null;
    });
    stage.addEventListener("pointerleave", () => { hover = null; pointer = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now();
      paper(ctx, w, h);
      const T = (now - t0) / 1000;
      if (prev && now - prev.t < 250) { // old ballot lifts away
        const pr = rowsFor(d, prev.view), PG = geom(w, h, pr.length, full);
        ballot(ctx, w, h, pr, PG, 99, dc, full, null, 1 - (now - prev.t) / 250, null);
      }
      const rows = rowsFor(d, view);
      G = geom(w, h, rows.length, full);
      const li = lowestIndex(rows), endT = 10 * dc + rows.length * 0.025 + 0.2;
      const la = KF.clamp((T - endT) / 0.5, 0, 1);
      if (T > 0) ballot(ctx, w, h, rows, G, T, dc, full, T > endT ? hover : null, 1, la > 0 ? { index: li } : null);
      const e = rows[0].e;
      if (view !== "y20") overallLine(ctx, G, e.actual, la, full, full ? `전체 ${e.actual.toFixed(1)}%` : `전체 ${e.actual.toFixed(1)}`);
      header(ctx, w, d, view, rows, li, full, T > endT ? hover : null);
      if (full && hover != null && pointer && T > endT) tip(ctx, w, h, rows[hover], view, pointer);
    });
  }

  function header(ctx, w, d, view, rows, li, full, hover) {
    const e = rows[0].e;
    ctx.save(); ctx.textAlign = "left"; ctx.fillStyle = INK;
    if (full) {
      ctx.font = `700 21px ${SERIF}`;
      const title = view === "y20" ? "20대만 모아 보기" : e.name;
      ctx.fillText(title, 40, 42);
      const tw = ctx.measureText(title).width;
      ctx.font = `500 13px ${SANS}`; ctx.fillStyle = "rgba(43,38,33,.62)";
      ctx.fillText(view === "y20" ? "다섯 선거의 20대 투표율 · 점선 = 그 선거 전체 투표율" : `${e.date} · 연령대별 투표율`, 40 + tw + 12, 42);
      ctx.font = `500 12px ${SANS}`;
      ctx.fillText("도장 1개 = 10%p · 중앙선관위 표본조사", 40, 64);
      if (view !== "y20") {
        ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `600 13px ${SANS}`;
        ctx.fillText(`실제 투표율 ${e.actual.toFixed(1)}%`, w - 40, 42);
      }
    } else {
      const title = view === "y20" ? "20대만 모아 보기" : e.name;
      ctx.font = `700 16px ${SERIF}`; ctx.fillText(title, 8, 24);
      ctx.font = `500 11px ${SANS}`; ctx.fillStyle = "rgba(43,38,33,.62)";
      ctx.fillText(view === "y20" ? "도장 1개 = 10%p · 점선 = 전체" : `${e.date} · 도장 1개 = 10%p`, 8, 42);
      let line, col = RED;
      if (hover != null) {
        const r = rows[hover];
        line = `${r.label} ${r.t.toFixed(1)}% · 남 ${r.b.m.toFixed(1)} · 여 ${r.b.f.toFixed(1)}`; col = INK;
      } else line = `가장 낮은 칸: ${rows[li].label} ${rows[li].t.toFixed(1)}%`;
      ctx.fillStyle = col; ctx.font = `600 12.5px ${SANS}`; ctx.fillText(line, 8, 61);
    }
    ctx.restore();
  }

  function tip(ctx, w, h, row, view, p) {
    const b = row.b, e = row.e, fine = e.fine;
    const lines = [
      [`${view === "y20" ? e.label + " · 20대" : e.label + " · " + row.label}`, 700, INK],
      [`투표율 ${b.t.toFixed(1)}% (표본)`, 600, RED],
      [`남 ${b.m.toFixed(1)}% · 여 ${b.f.toFixed(1)}%`, 500, INK],
    ];
    if (b.k === "20대") lines.push([`20–24세 ${fine["20-24세"].toFixed(1)}% · 25–29세 ${fine["25-29세"].toFixed(1)}%`, 500, INK]);
    if (b.k === "30대") lines.push([`30–34세 ${fine["30-34세"].toFixed(1)}% · 35–39세 ${fine["35-39세"].toFixed(1)}%`, 500, INK]);
    lines.push([`표본 선거인 ${KF.fmt(b.e)}명 중 ${KF.fmt(b.v)}명 투표`, 500, "rgba(43,38,33,.7)"]);
    if (view === "y20") lines.push([`그 선거 전체 ${e.actual.toFixed(1)}%`, 500, "rgba(43,38,33,.7)"]);
    ctx.font = `500 12px ${SANS}`;
    const bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 26, bh = 16 + lines.length * 19;
    const bx = p[0] + 18 + bw > w - 8 ? p[0] - bw - 18 : p[0] + 18, by = KF.clamp(p[1] - bh / 2, 8, h - bh - 8);
    ctx.save();
    ctx.fillStyle = "rgba(255,253,248,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(198,43,43,.55)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, wt, c], k) => { ctx.fillStyle = c; ctx.font = `${wt} 12px ${SANS}`; ctx.fillText(t, bx + 13, by + 22 + k * 19); });
    ctx.restore();
  }

  VIZ.turnout = { thumb, mount, bg: PAPER };
})();
