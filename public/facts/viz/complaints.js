// 40 complaints — "코르크 게시판 쪽지". A cork board of pinned sticky notes. View 1: electronic petitions processed in
// one quarter, 1 note = 10,000, clustered by the kind of institution that handled them (red pin = the share that
// missed its deadline). View 2: online counselling by field, 1 note = 20. View 3: what the ACRC did with the
// petitions it processed in one year, 1 note = 500 (gold = grievances it upheld).
(() => {
  const BG = "#b4865a";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", PEN = "'Nanum Pen Script', cursive";
  const INK = "#2b1d12", DIM = "rgba(43,29,18,.74)", SOFT = "rgba(43,29,18,.5)", CARD = "rgba(255,251,238,.95)", RED = "#c62f22";
  const KCOL = ["#ffe873", "#9fdcff", "#b9ef9f", "#ffb4c8", "#ffc47d", "#d7c0ff", "#e8e4dc"];     // kinds of institution
  const FCOL = ["#ffe873", "#9fdcff", "#ffb4c8", "#b9ef9f", "#d7c0ff", "#e8e4dc"];                 // counselling field groups
  const GCOL = { rest: "#e8e4dc", other: "#9fdcff", gr: "#fff6d8", cite: "#ffc93c" };
  const hash = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  // ---------------------------------------------------------------- cork (cached)
  let CORK = null;
  function cork(w, h, frame) {
    const key = `${w}x${h}x${frame}`;
    if (CORK && CORK.key === key) return CORK.c;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    const fg = g.createLinearGradient(0, 0, w, h); fg.addColorStop(0, "#6f4a2b"); fg.addColorStop(0.5, "#8d5f36"); fg.addColorStop(1, "#5f3f23");
    g.fillStyle = fg; g.fillRect(0, 0, w, h);
    g.fillStyle = BG; g.fillRect(frame, frame, w - 2 * frame, h - 2 * frame);
    for (let i = 0; i < (w * h) / 4; i++) {
      const x = frame + hash(i) * (w - 2 * frame), y = frame + hash(i + 0.37) * (h - 2 * frame), r = hash(i + 0.71);
      g.fillStyle = r < 0.45 ? "rgba(96,60,28,.2)" : r < 0.82 ? "rgba(232,196,146,.16)" : "rgba(64,38,16,.28)";
      g.fillRect(x, y, r < 0.93 ? 1 : 2, r < 0.93 ? 1 : 1.6);
    }
    const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(40,20,5,.24)");
    g.fillStyle = v; g.fillRect(frame, frame, w - 2 * frame, h - 2 * frame);
    if (frame > 0) { g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1.5; g.strokeRect(frame - 0.5, frame - 0.5, w - 2 * frame + 1, h - 2 * frame + 1); }
    CORK = { key, c };
    return c;
  }

  // one pinned note centred at (x, y); part < 1 draws a smaller note for the remainder
  function note(ctx, x, y, s, col, pin, rot, a, hi, part = 1) {
    const z = s * (part < 1 ? 0.45 + 0.55 * part : 1);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(40,20,5,.3)"; ctx.fillRect(-z / 2 + 1.1, -z / 2 + 1.5, z, z);
    ctx.fillStyle = col; ctx.fillRect(-z / 2, -z / 2, z, z);
    if (z >= 9) { ctx.fillStyle = "rgba(0,0,0,.07)"; ctx.fillRect(-z / 2, z / 2 - z * 0.2, z, z * 0.2); }
    if (hi) { ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(-z / 2 - 1.5, -z / 2 - 1.5, z + 3, z + 3); }
    const late = col === "#ffd6cf", pr = Math.max(1.2, z * (late ? 0.18 : 0.14));
    if (late) { ctx.strokeStyle = RED; ctx.lineWidth = 1.2; ctx.strokeRect(-z / 2 + 0.6, -z / 2 + 0.6, z - 1.2, z - 1.2); }
    ctx.fillStyle = pin; ctx.beginPath(); ctx.arc(0, -z / 2 + pr + 0.8, pr, 0, 7); ctx.fill();
    if (pr > 1.6) { ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(-pr * 0.3, -z / 2 + pr * 0.7 + 0.8, pr * 0.38, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  // a pinned index card with a handwritten label and a small number
  function card(ctx, x, y, w, h, text, sub, size, rot) {
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot);
    ctx.fillStyle = "rgba(40,20,5,.26)"; ctx.fillRect(-w / 2 + 1.5, -h / 2 + 2, w, h);
    ctx.fillStyle = CARD; ctx.fillRect(-w / 2, -h / 2, w, h);
    let sw = 0;
    if (sub) { ctx.font = `500 ${Math.round(size * 0.5)}px ${MONO}`; sw = ctx.measureText(sub).width + 8; ctx.fillStyle = DIM; ctx.textAlign = "right"; ctx.fillText(sub, w / 2 - 5, size * 0.3); }
    ctx.fillStyle = INK; ctx.font = `${size}px ${PEN}`; ctx.textAlign = "left"; ctx.fillText(text, -w / 2 + 6, size * 0.33, w - 12 - sw);
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(0, -h / 2 + 3.2, 2.4, 0, 7); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- clusters
  // a cluster = {label, sub, notes:[{it, col, pin, part}]}; laid out as a small grid under its index card
  function layout(clusters, X0, Y0, W, H, s, gap, cardH) {
    const pitch = s + gap, out = [];
    let x = X0, y = Y0, rowH = 0;
    for (const c of clusters) {
      const n = c.notes.length;
      let cols = Math.max(c.minCols || 3, Math.ceil(Math.sqrt(n * (c.aspect || 1.6))));
      cols = Math.min(cols, Math.max(1, Math.floor((W - 4) / pitch)));
      const rows = Math.ceil(n / cols), cw = Math.max(cols * pitch, c.cardW || 70), ch = cardH + 6 + rows * pitch;
      if (x + cw > X0 + W && x > X0) { x = X0; y += rowH + 14; rowH = 0; }
      out.push({ c, x, y, cols, rows, cw, ch });
      x += cw + 18; rowH = Math.max(rowH, ch);
    }
    const used = y + rowH - Y0;
    return { out, used, fits: used <= H };
  }
  function drawClusters(ctx, L, s, gap, cardH, prog, hover, hiKey, full) {
    const pitch = s + gap;
    let hit = null, k0 = 0;
    const total = L.out.reduce((a, o) => a + o.c.notes.length, 0);
    L.out.forEach((o, ci) => {
      card(ctx, o.x, o.y, Math.min(o.cw, full ? 150 : 118), cardH, o.c.label, o.c.sub, full ? cardH * 0.86 : cardH * 0.84, (hash(ci * 7.7) - 0.5) * 0.05);
      o.c.notes.forEach((nt, k) => {
        const r = Math.floor(k / o.cols), c = k % o.cols;
        const x = o.x + c * pitch + s / 2 + (hash(ci * 131 + k * 1.7) - 0.5) * gap, y = o.y + cardH + 6 + r * pitch + s / 2 + (hash(ci * 71 + k * 2.3) - 0.5) * gap;
        const a = KF.clamp(prog * (total + 20) - (k0 + k), 0, 1);
        if (a <= 0) return;
        note(ctx, x, y - (1 - a) * 8, s, nt.col, nt.pin, (hash(ci * 31 + k * 3.1) - 0.5) * 0.22, a, hiKey != null && nt.it.key === hiKey, nt.part);
        if (hover && Math.abs(hover[0] - x) <= pitch / 2 && Math.abs(hover[1] - y) <= pitch / 2) hit = nt.it;
      });
      k0 += o.c.notes.length;
    });
    return hit;
  }

  // notes for one cluster: note j covers [j*U, (j+1)*U) of the cluster total and belongs to the item holding its midpoint
  function notesOf(items, U, colOf, pinOf) {
    const total = items.reduce((a, it) => a + it.v, 0), n = Math.ceil(total / U - 1e-9), cum = [];
    let acc = 0;
    items.forEach((it) => { cum.push(acc); acc += it.v; });
    const out = [], seen = new Map();
    for (let j = 0; j < n; j++) {
      const lo = j * U, hi = Math.min(total, (j + 1) * U), mid = (lo + hi) / 2;
      let i = items.length - 1;
      while (i > 0 && cum[i] > mid) i--;
      const it = items[i], q = seen.get(it) || 0;
      seen.set(it, q + 1);
      out.push({ it, col: colOf(it, mid - cum[i]), pin: pinOf(it, q), part: (hi - lo) / U });
    }
    return out;
  }

  // ---------------------------------------------------------------- data -> clusters per view
  function clustersFor(d, view, full) {
    const [U1, U2, U3] = d.unit, PIN = "#3b5b7a";
    if (view === "where") {
      // on-time petitions per institution, then the kind's late petitions as red-pinned notes at the end
      return d.kinds.map((k, ki) => {
        const items = d.inst[k].map((r) => ({ key: `${k}|${r[0]}`, kind: k, name: r[0], v: r[1] - r[2], all: r[1], late: r[2] }));
        const late = d.inst[k].reduce((a, r) => a + r[2], 0), all = d.inst[k].reduce((a, r) => a + r[1], 0);
        items.push({ key: `${k}|late`, kind: k, name: "기한을 넘긴 처리", v: late, all, late, isLate: true });
        return { label: k, sub: `${KF.fmt(all / 10000, 1)}만`, cardW: 96,
          notes: notesOf(items, U1, (it) => (it.isLate ? "#ffd6cf" : KCOL[ki]), (it) => (it.isLate ? RED : PIN)) };
      });
    }
    if (view === "ask") {
      const keep = full ? d.field.length : 8;                // phones: the eight largest fields, the rest merged
      const top = d.field.filter((r, j) => j < keep && r[1] + r[2] + r[3] >= U2 * 2), small = d.field.filter((r) => !top.includes(r));
      const mk = (name, rs, g) => {
        const it = { key: name, name, v: rs.reduce((a, r) => a + r[1] + r[2] + r[3], 0), res: rs.reduce((a, r) => a + r[3], 0), wd: rs.reduce((a, r) => a + r[2], 0), ref: rs.reduce((a, r) => a + r[1], 0), g };
        return { label: name, sub: KF.fmt(it.v), cardW: full ? 118 : 92, minCols: 3,
          notes: notesOf([it], U2, (x, off) => (off < x.res ? FCOL[g] : "#d9d2c4"), (x) => PIN) };
      };
      const cl = top.map((r) => mk(r[0], [r], r[4]));
      if (small.length) cl.push(mk(`그 밖 ${small.length}개 분야`, small, 5));
      return cl;
    }
    const G = d.gr, i = G.years.length - 1, rest = G.proc[i] - G.gr[i] - G.oth[i];
    const mk = (key, label, v, col) => ({ label, sub: KF.fmt(v), cardW: full ? 150 : 118, aspect: 2.2,
      notes: notesOf([{ key, name: label, v }], U3, () => col, () => (key === "cite" ? RED : PIN)) });
    return [mk("rest", "그 밖의 처리", rest, GCOL.rest), mk("other", "기타민원", G.oth[i], GCOL.other),
      mk("gr", "고충민원 (인용 안 됨)", G.gr[i] - G.cite[i], GCOL.gr), mk("cite", "인용", G.cite[i], GCOL.cite)];
  }

  // note size that lets the clusters fit the board
  const FIT = new Map();
  function fit(d, view, X0, Y0, W, H, full) {
    const key = `${view}|${Math.round(W)}|${Math.round(H)}|${full}`;
    if (FIT.has(key)) return FIT.get(key);
    const cl = clustersFor(d, view, full), cardH = full ? 22 : 18;
    let best = null;
    for (let s = full ? 30 : 20; s >= 5; s -= 0.5) {
      const gap = Math.max(1.4, s * 0.2), L = layout(cl, X0, Y0, W, H, s, gap, cardH);
      if (L.fits) { best = { s, gap, L, cardH }; break; }
    }
    if (!best) { const s = 5, gap = 1.4; best = { s, gap, L: layout(cl, X0, Y0, W, H, s, gap, cardH), cardH }; }
    if (FIT.size > 24) FIT.clear();
    FIT.set(key, best);
    return best;
  }

  function tip(ctx, w, h, lines, p) {
    ctx.font = `600 12px ${SANS}`;
    const bw = Math.min(w - 12, Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22), bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(255,251,238,.98)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, wt, c], k) => { ctx.fillStyle = c || INK; ctx.font = `${wt} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 19 + k * 18); });
  }
  function tipLines(d, view, it) {
    if (view === "where") {
      if (it.isLate) return [[`${it.kind} · 기한을 넘긴 처리`, 700, RED], [`${KF.fmt(it.late)}건 (${it.kind} 처리 ${KF.fmt(it.all)}건의 ${KF.fmt(it.late / it.all * 100, 1)}%)`, 500],
        [`쪽지 ${KF.fmt(it.late / d.unit[0], 1)}장`, 500, SOFT]];
      const L = [[`${it.name} (${it.kind})`, 700], [`${d.period} 처리 ${KF.fmt(it.all)}건`, 500], [`기한 초과 ${KF.fmt(it.late)}건 · 기한 준수 ${KF.fmt((it.all - it.late) / it.all * 100, 1)}%`, 500, it.late / it.all > 0.03 ? RED : INK]];
      if (d.per[it.name] != null) L.push([`주민 1,000명당 ${KF.fmt(d.per[it.name], 1)}건 (시·군·구 평균 ${KF.fmt(d.avgPer, 1)}건)`, 500, DIM]);
      return L;
    }
    if (view === "ask") return [[`${it.name} · ${d.fieldPeriod}`, 700], [`온라인 상담 ${KF.fmt(it.v)}건`, 500],
      [`상담으로 해결 ${KF.fmt(it.res)}건 (${KF.fmt(it.res / it.v * 100, 1)}%)`, 500], [`취하 등 ${KF.fmt(it.wd)} · 기관 안내 ${KF.fmt(it.ref)}`, 500, DIM]];
    const G = d.gr, i = G.years.length - 1;
    const L = [[`${G.years[i]}년 국민권익위원회 · ${it.name}`, 700], [`${KF.fmt(it.v)}건 (처리 ${KF.fmt(G.proc[i])}건의 ${KF.fmt(it.v / G.proc[i] * 100, 1)}%)`, 500]];
    if (it.key === "cite") L.push([`조정합의 ${KF.fmt(G.adj[i])}건 · 고충민원으로 처리한 것의 ${KF.fmt(G.cite[i] / G.gr[i] * 100, 1)}%`, 500, DIM]);
    if (it.key === "rest") L.push(["이 자료에는 고충·기타 말고 따로 구분돼 있지 않다", 500, SOFT]);
    return L;
  }

  // ---------------------------------------------------------------- side panel (desktop)
  function panel(ctx, x0, x1, y0, H, d, view) {
    const W = x1 - x0;
    ctx.fillStyle = CARD; ctx.fillRect(x0 - 14, y0 - 20, W + 28, H);
    ctx.strokeStyle = "rgba(43,29,18,.18)"; ctx.strokeRect(x0 - 13.5, y0 - 19.5, W + 27, H - 1);
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x0 + W / 2, y0 - 12, 3.4, 0, 7); ctx.fill();
    ctx.textAlign = "left";
    const [TOT, OK, LATE] = d.total;
    let y = y0 + 8;
    const line = (t, font, col, dy) => { ctx.fillStyle = col; ctx.font = font; ctx.fillText(t, x0, y); y += dy; };
    if (view === "where") {
      line(`국민신문고 전자민원 · ${d.period}`, `600 12.5px ${SANS}`, DIM, 38);
      line(`${KF.fmt(OK / TOT * 100, 1)}%`, `800 38px ${SANS}`, INK, 22);
      line(`처리 ${KF.fmt(TOT)}건 가운데 기한 안에 처리`, `500 12.5px ${SANS}`, DIM, 30);
      line(`기한 초과 ${KF.fmt(LATE)}건 (${KF.fmt(LATE / TOT * 100, 1)}%)`, `600 13px ${SANS}`, RED, 30);
      d.kinds.forEach((k, i) => {
        const v = d.inst[k].reduce((a, r) => a + r[1], 0);
        note(ctx, x0 + 6, y - 4, 11, KCOL[i], "#3b5b7a", 0, 1, false);
        ctx.fillStyle = INK; ctx.font = `500 12px ${SANS}`; ctx.fillText(`${k} ${d.kcount[i]}곳`, x0 + 18, y);
        ctx.font = `500 11.5px ${MONO}`; ctx.textAlign = "right"; ctx.fillText(`${KF.fmt(v / TOT * 100, 1)}%`, x1, y); ctx.textAlign = "left";
        y += 20;
      });
      y += 8;
      line(`쪽지 1장 = ${KF.fmt(d.unit[0])}건 · 빨간 핀 = 기한 초과`, `500 10.5px ${MONO}`, SOFT, 0);
    } else if (view === "ask") {
      const T = d.field.reduce((a, r) => a + r[1] + r[2] + r[3], 0) + d.preWd, R = d.field.reduce((a, r) => a + r[3], 0);
      line(`정부합동민원센터 온라인 상담 · ${d.fieldPeriod}`, `600 12.5px ${SANS}`, DIM, 38);
      line(`${KF.fmt(R / T * 100, 1)}%`, `800 38px ${SANS}`, INK, 22);
      line(`상담 ${KF.fmt(T)}건 가운데 상담으로 해결`, `500 12.5px ${SANS}`, DIM, 30);
      d.fgroups.forEach((g, i) => {
        const v = d.field.filter((r) => r[4] === i).reduce((a, r) => a + r[1] + r[2] + r[3], 0);
        note(ctx, x0 + 6, y - 4, 11, FCOL[i], "#3b5b7a", 0, 1, false);
        ctx.fillStyle = INK; ctx.font = `500 12px ${SANS}`; ctx.fillText(g, x0 + 18, y);
        ctx.font = `500 11.5px ${MONO}`; ctx.textAlign = "right"; ctx.fillText(`${KF.fmt(v / T * 100, 1)}%`, x1, y); ctx.textAlign = "left";
        y += 20;
      });
      y += 8;
      line(`쪽지 1장 = 상담 ${d.unit[1]}건 · 회색 = 취하 등`, `500 10.5px ${MONO}`, SOFT, 0);
    } else {
      const G = d.gr, i = G.years.length - 1;
      line(`국민권익위원회 고충민원 · ${G.years[i]}년`, `600 12.5px ${SANS}`, DIM, 38);
      line(`${KF.fmt(G.cite[i] / G.gr[i] * 100, 1)}%`, `800 38px ${SANS}`, INK, 22);
      line(`고충민원으로 처리한 ${KF.fmt(G.gr[i])}건 가운데 인용`, `500 12.5px ${SANS}`, DIM, 30);
      line(`접수 ${KF.fmt(G.rec[i])} · 처리 ${KF.fmt(G.proc[i])}`, `600 12.5px ${SANS}`, INK, 26);
      // cited per year, a small strip
      const n = G.years.length, bw = W / n, mx = Math.max(...G.cite), sh = 46;
      ctx.fillStyle = DIM; ctx.font = `600 11.5px ${SANS}`; ctx.fillText("인용 건수, 해마다", x0, y); y += 22;
      G.years.forEach((yr, j) => {
        const hh = G.cite[j] / mx * sh;
        ctx.fillStyle = j === n - 1 ? "#e0a800" : "rgba(224,168,0,.55)"; ctx.fillRect(x0 + j * bw + bw * 0.18, y + sh - hh, bw * 0.64, hh);
      });
      ctx.fillStyle = SOFT; ctx.font = `500 9.5px ${MONO}`; ctx.fillText(String(G.years[0]), x0, y + sh + 12);
      ctx.textAlign = "right"; ctx.fillText(String(G.years[n - 1]), x1, y + sh + 12); ctx.textAlign = "left";
      ctx.fillStyle = INK; ctx.font = `600 11px ${MONO}`; ctx.fillText(KF.fmt(G.cite[0]), x0, y - 2);
      ctx.textAlign = "right"; ctx.fillText(KF.fmt(G.cite[n - 1]), x1, y - 2); ctx.textAlign = "left";
      y += sh + 34;
      line(`쪽지 1장 = ${KF.fmt(d.unit[2])}건 · 금빛 = 인용`, `500 10.5px ${MONO}`, SOFT, 0);
    }
  }

  // ---------------------------------------------------------------- thumb
  // the thumbnail shows every note of view 1 as one wall (kinds in order, late notes at the end of each kind)
  let TN = null;
  const thumbNotes = (d) => TN || (TN = clustersFor(d, "where", false).flatMap((c) => c.notes));

  function thumb(ctx, w, h, t, d) {
    const c = t % 10;
    ctx.drawImage(cork(w, h, 0), 0, 0, w, h);
    const N = thumbNotes(d), X0 = 52, Y0 = 26, W = w * 0.58 - X0, H = h - Y0 - 14;
    const cols = Math.ceil(Math.sqrt(N.length * W / H)), rows = Math.ceil(N.length / cols), pitch = Math.min(W / cols, H / rows), sz = pitch * 0.8;
    const prog = KF.clamp(c / 2.6, 0, 1);
    N.forEach((nt, k) => {
      const a = KF.clamp(prog * (N.length + 20) - k, 0, 1);
      if (a <= 0) return;
      const x = X0 + (k % cols) * pitch + pitch / 2, y = Y0 + Math.floor(k / cols) * pitch + pitch / 2;
      note(ctx, x, y - (1 - a) * 5, sz, nt.col, nt.pin, (hash(k * 3.1) - 0.5) * 0.2, a, false, nt.part);
    });
    const X = w * 0.62, a = KF.clamp((c - 0.4) / 0.6, 0, 1) * (c > 9.4 ? 1 - (c - 9.4) / 0.6 : 1), [TOT, OK] = d.total;
    ctx.globalAlpha = a;
    ctx.fillStyle = CARD; ctx.fillRect(X - 8, 16, w - X - 4, h - 32);
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(X - 8 + (w - X - 4) / 2, 22, 2.6, 0, 7); ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText(`전자민원 ${KF.fmt(TOT / 10000, 0)}만 건 중`, X, h * 0.3);
    ctx.fillStyle = INK; ctx.font = `800 ${Math.round(h * 0.15)}px ${SANS}`; ctx.fillText(`${KF.fmt(OK / TOT * 100, 1)}%`, X, h * 0.3 + h * 0.16);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText("기한 안에 처리", X, h * 0.3 + h * 0.25);
    ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText(`${KF.fmt(d.sum.local, 0)}%는 시·군·구로`, X, h * 0.78);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let view = "where", t0 = performance.now(), tv = t0, hover = null, hiKey = null;
    KF.segment(controls, [{ id: "where", label: "어디서 처리하나" }, { id: "ask", label: "무엇을 묻나" }, { id: "grievance", label: "고충민원" }], "where", (id) => { view = id; tv = performance.now(); });
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; hiKey = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), el = (now - t0) / 1000, ev = (now - tv) / 1000;
      const frame = full ? 10 : 7;
      ctx.drawImage(cork(w, h, frame), 0, 0, w, h);
      const X0 = frame + 16, Y0 = frame + 16, W = full ? w * 0.68 - X0 : w - 2 * X0, H = full ? h - 2 * frame - 30 : h - 2 * frame - 118;
      const F = fit(d, view, X0, Y0, W, H, full);
      const prog = KF.clamp((view === "where" ? Math.min(el, ev) : ev) / (view === "where" ? 3.4 : 1.8), 0, 1);
      const hit = drawClusters(ctx, F.L, F.s, F.gap, F.cardH, prog, hover, hiKey, full);
      hiKey = hit ? hit.key : null;
      if (full) panel(ctx, w * 0.72 + 12, w - frame - 22, frame + 40, h - 2 * frame - 40, d, view);
      else {
        const y = h - frame - 96, [TOT, OK, LATE] = d.total;
        ctx.fillStyle = CARD; ctx.fillRect(X0 - 6, y, w - 2 * X0 + 12, 88);
        ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(w / 2, y + 6, 2.8, 0, 7); ctx.fill();
        ctx.textAlign = "left"; ctx.fillStyle = INK;
        if (view === "where") {
          ctx.font = `800 22px ${SANS}`; ctx.fillText(`${KF.fmt(OK / TOT * 100, 1)}% 기한 안에 처리`, X0, y + 34);
          ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(`${d.period} 전자민원 ${KF.fmt(TOT)}건 · 기한 초과 ${KF.fmt(LATE)}건`, X0, y + 56);
          ctx.fillStyle = SOFT; ctx.font = `500 10px ${MONO}`; ctx.fillText(`쪽지 1장 = ${KF.fmt(d.unit[0])}건 · 빨간 핀 = 기한 초과`, X0, y + 74);
        } else if (view === "ask") {
          const T = d.field.reduce((a, r) => a + r[1] + r[2] + r[3], 0) + d.preWd, R = d.field.reduce((a, r) => a + r[3], 0);
          ctx.font = `800 22px ${SANS}`; ctx.fillText(`${KF.fmt(R / T * 100, 1)}% 상담으로 해결`, X0, y + 34);
          ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(`정부합동민원센터 온라인 상담 ${KF.fmt(T)}건 · ${d.fieldPeriod}`, X0, y + 56);
          ctx.fillStyle = SOFT; ctx.font = `500 10px ${MONO}`; ctx.fillText(`쪽지 1장 = 상담 ${d.unit[1]}건`, X0, y + 74);
        } else {
          const G = d.gr, i = G.years.length - 1;
          ctx.font = `800 22px ${SANS}`; ctx.fillText(`인용 ${KF.fmt(G.cite[i] / G.gr[i] * 100, 1)}%`, X0, y + 34);
          ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(`${G.years[i]}년 고충민원으로 처리한 ${KF.fmt(G.gr[i])}건 가운데`, X0, y + 56);
          ctx.fillStyle = SOFT; ctx.font = `500 10px ${MONO}`; ctx.fillText(`쪽지 1장 = ${KF.fmt(d.unit[2])}건 · 금빛 = 인용`, X0, y + 74);
        }
      }
      if (hit && hover) tip(ctx, w, h, tipLines(d, view, hit), hover);
    });
  }

  VIZ.complaints = { thumb, mount, bg: BG };
})();
