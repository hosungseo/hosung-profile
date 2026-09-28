// 16 travel — "출발 안내판". A black split-flap departure board; every character is a flap that falls through the drum
// when the board switches between four pairings of the same numbers: destinations, both directions, years, ages.
(() => {
  const BG = "#15161a", AMBER = "#ffb338", TEAL = "#5fd4c8", PAPER = "#f2efe6", DIM = "#8f949e";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  const ROWS = 9, STEP = 0.075, DRUM = "0123456789가나다라마바사아자차카타파하";
  const COLS = { full: [6, 10, 10, 7], m: [3, 5, 5, 4] };
  const hash = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

  // ---------------------------------------------------------------- number formats
  const full = (n) => KF.fmt(n);
  const man = (n) => `${Math.round(n / 1e4)}만`;
  const pct = (a, b, d = 1) => `${KF.fmt((a / b) * 100, d)}%`;
  const pad = (s, w, align) => { const a = [...s].slice(0, w); while (a.length < w) align === "r" ? a.unshift(" ") : a.push(" "); return a; };

  // ---------------------------------------------------------------- the four boards
  function views(d, wide) {
    const N = wide ? full : man;
    const V = {};
    const D = d.dest, tot = D.total;
    V.dest = {
      title: wide ? `행선지 · ${D.y}년 한국인 출국 (첫 도착지)` : `행선지 · ${D.y} 한국인 출국`,
      heads: wide ? ["행선지", `${D.y} 출국`, `${D.prev} 출국`, `${D.y} 몫`] : ["행선지", `${D.y}`, `${D.prev}`, "몫"],
      rows: D.rows.map(([c, a, b]) => ({ cells: [c, N(a), N(b), wide ? pct(a, tot) : `${Math.round((a / tot) * 100)}%`],
        detail: `${c} · ${D.y}년 ${KF.fmt(a)}건 (${D.prev}년 ${KF.fmt(b)}건, ${a >= b ? "+" : ""}${KF.fmt((a / b - 1) * 100, 1)}%) · 한국인 출국의 ${pct(a, tot)}` })),
    };
    V.pairs = {
      title: wide ? "주고받기 · 2025년 그 나라로 간 한국인 vs 한국에 온 그 나라 사람" : "주고받기 · 2025",
      heads: wide ? ["나라", "간 한국인", "온 그 나라 사람", "기우는 쪽"] : ["나라", "간 사람", "온 사람", "기울기"],
      rows: d.pairs.map(([c, o, i]) => {
        const out = o >= i, k = KF.fmt(Math.max(o, i) / Math.min(o, i), 1);
        return { cells: [c, N(o), N(i), wide ? (out ? `나감×${k}` : `들어옴×${k}`) : (out ? `→${k}` : `←${k}`)], color: out ? AMBER : TEAL,
          detail: `${c} · 한국 → ${c} ${KF.fmt(o)}명 · ${c} → 한국 ${KF.fmt(i)}명 · ${out ? "나가는" : "들어오는"} 쪽이 ${KF.fmt(Math.max(o, i) / Math.min(o, i), 2)}배` };
      }),
    };
    V.years = {
      title: wide ? "해마다 · 출입국 심사를 마친 승객 (나간 한국인 ÷ 들어온 외국인)" : "해마다 · 승객",
      heads: wide ? ["해", "나간 한국인", "들어온 외국인", "나감÷들어옴"] : ["해", "나감", "들어옴", "비율"],
      rows: d.years.map(([y, o, i, m]) => ({ cells: [wide ? (m < 12 ? `${y}*` : String(y)) : `'${String(y).slice(2)}${m < 12 ? "*" : ""}`.slice(0, 3), N(o), N(i), KF.fmt(o / i, 2)],
        color: PAPER,
        detail: `${y}년${m < 12 ? ` 1–${m}월` : ""} · 나간 한국인 ${KF.fmt(o)}명 · 들어온 외국인 ${KF.fmt(i)}명 · ${KF.fmt(o / i, 2)}배` })),
    };
    const nOut = d.pairs.filter(([, o, i]) => o >= i).length;
    V.pairs.head = `${d.pairs.length}개 나라 중 ${nOut}곳은 나가는 쪽, ${d.pairs.length - nOut}곳은 들어오는 쪽이 많다`;
    const top = D.rows[0];
    V.dest.head = `${top[0]}행 ${KF.fmt(top[1] / 1e4)}만 = 한국인 출국의 ${pct(top[1], tot)}`;
    const Y0 = d.years[0], Y1 = d.years[d.years.length - 1];
    V.years.head = `나감 ÷ 들어옴  ${KF.fmt(Y0[1] / Y0[2], 2)} (${Y0[0]}) → ${KF.fmt(Y1[1] / Y1[2], 2)} (${Y1[0]}년 1–${Y1[3]}월)`;
    const a19 = d.ages.reduce((a, r) => a + r[1], 0);
    const short = { "10세 미만": "0–9", "70세 이상": "70+" };
    V.ages = {
      title: wide ? "나이별 · 한국인 출국 2019 (코로나 전) · 2022" : "나이별 · 2019 · 2022",
      heads: wide ? ["나이", "2019 출국", "2022 출국", "2019 몫"] : ["나이", "2019", "2022", "몫"],
      rows: d.ages.map(([k, a, b]) => ({ cells: [wide ? k.replace("10세 미만", "0–9세").replace("70세 이상", "70세+") : short[k] || k, N(a), N(b), wide ? pct(a, a19) : `${Math.round((a / a19) * 100)}%`],
        detail: `${k} · 2019년 ${KF.fmt(a)}건 (출국의 ${pct(a, a19)}) · 2022년 ${KF.fmt(b)}건` })),
    };
    const topAge = d.ages.reduce((m, r) => (r[1] > m[1] ? r : m));
    V.ages.head = `2019년 가장 많이 떠난 나이: ${topAge[0]} (${pct(topAge[1], a19)})`;
    return V;
  }

  // grid of characters for a view
  function grid(view, cols) {
    const G = [], C = [];
    for (let r = 0; r < ROWS; r++) {
      const row = view.rows[r], chars = [], colors = [];
      cols.forEach((w, k) => {
        const s = row ? row.cells[k] : "";
        pad(s, w, k === 0 ? "l" : "r").forEach((ch) => { chars.push(ch); colors.push(k === 3 && row && row.color ? row.color : k === 0 ? PAPER : AMBER); });
      });
      G.push(chars); C.push(colors);
    }
    return { G, C };
  }

  // ---------------------------------------------------------------- geometry
  function geom(w, h, cols, wide, thumbRows) {
    const rows = thumbRows || ROWS;
    const padX = wide ? 30 : 10, top = thumbRows ? h * 0.2 : wide ? 88 : 72, bottom = thumbRows ? h * 0.2 : wide ? 46 : 52;
    const nT = cols.reduce((a, b) => a + b, 0), gapK = wide ? 0.9 : 0.55;
    let tw = (w - padX * 2) / (nT * 1.1 + (cols.length - 1) * gapK);
    let th = tw * 1.36;
    const rowGap = th * 0.16, availH = h - top - bottom;
    if (rows * (th + rowGap) > availH) { th = availH / rows / 1.16; tw = th / 1.36; }
    const pitch = tw * 1.1, gap = tw * gapK;
    const boardW = nT * pitch + (cols.length - 1) * gap;
    const x0 = (w - boardW) / 2 + tw * 0.05;
    const xs = [], colX = [];
    let x = x0;
    cols.forEach((n, k) => { colX.push(x); for (let i = 0; i < n; i++) { xs.push(x); x += pitch; } x += gap; });
    const rh = th * 1.16;
    return { tw, th, xs, colX, top, rh, y: (r) => top + r * rh, boardW, x0, rows };
  }

  // ---------------------------------------------------------------- one flap
  function half(ctx, x, y, w, h, ch, color, fs, which, sy = 1, shade = 0) {
    const mid = y + h / 2;
    ctx.save();
    ctx.beginPath(); which === "t" ? ctx.rect(x, y, w, h / 2) : ctx.rect(x, mid, w, h / 2); ctx.clip();
    if (sy !== 1) { ctx.translate(0, mid); ctx.scale(1, Math.max(0.001, sy)); ctx.translate(0, -mid); }
    ctx.fillStyle = which === "t" ? "#26272d" : "#1e1f24";
    ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(3, w * 0.12)); ctx.fill();
    if (ch && ch !== " ") {
      ctx.fillStyle = color;
      ctx.font = `${/[가-힣]/.test(ch) ? 700 : 600} ${fs}px ${/[가-힣]/.test(ch) ? SANS : MONO}`;
      ctx.fillText(ch, x + w / 2, mid + fs * 0.05);
    }
    if (shade > 0) { ctx.fillStyle = `rgba(0,0,0,${shade})`; ctx.fillRect(x, y, w, h); }
    ctx.restore();
  }

  function flap(ctx, x, y, w, h, a, b, p, ca, cb, fs) {
    if (p <= 0 || a === b) { half(ctx, x, y, w, h, a, ca, fs, "t"); half(ctx, x, y, w, h, a, ca, fs, "b"); }
    else if (p >= 1) { half(ctx, x, y, w, h, b, cb, fs, "t"); half(ctx, x, y, w, h, b, cb, fs, "b"); }
    else {
      half(ctx, x, y, w, h, b, cb, fs, "t");
      half(ctx, x, y, w, h, a, ca, fs, "b");
      if (p < 0.5) half(ctx, x, y, w, h, a, ca, fs, "t", 1 - 2 * p, p * 0.9);
      else half(ctx, x, y, w, h, b, cb, fs, "b", 2 * p - 1, (1 - p) * 0.9);
    }
    ctx.fillStyle = "#08080a"; ctx.fillRect(x, y + h / 2 - 0.6, w, 1.2);
  }

  // State of one cell at time `now`: transition from char a to b starting at t0 through n drum steps.
  function cellAt(tr, now) {
    if (!tr) return null;
    const k = (now - tr.t0) / STEP;
    if (k <= 0) return { a: tr.a, b: tr.a, p: 0, ca: tr.ca, cb: tr.ca };
    const steps = tr.n + 1;
    if (k >= steps) return { a: tr.b, b: tr.b, p: 0, ca: tr.cb, cb: tr.cb };
    const i = Math.floor(k), seq = (j) => (j === 0 ? tr.a : j >= steps ? tr.b : DRUM[Math.floor(hash(tr.r, tr.c, j + tr.seed) * DRUM.length)]);
    return { a: seq(i), b: seq(i + 1), p: k - i, ca: i === 0 ? tr.ca : tr.cb, cb: tr.cb };
  }

  function board(ctx, w, h, g, heads, cells, now, wide, fsK = 0.6) {
    // frame
    const fx = g.x0 - g.tw * 0.6, fw = g.boardW + g.tw * 1.1, fy = g.top - (wide ? 30 : 24), fh = g.rows * g.rh + (wide ? 38 : 30);
    ctx.fillStyle = "#0d0e11"; ctx.beginPath(); ctx.roundRect(fx, fy, fw, fh, 6); ctx.fill();
    ctx.strokeStyle = "#2a2c33"; ctx.lineWidth = 1; ctx.stroke();
    // column heads
    ctx.fillStyle = DIM; ctx.font = `500 ${wide ? 11 : 9.5}px ${SANS}`;
    heads.forEach((t, k) => {
      ctx.textAlign = k === 0 ? "left" : "right";
      const x = k === 0 ? g.colX[0] : g.colX[k] + COLS[wide ? "full" : "m"][k] * g.tw * 1.1 - g.tw * 0.1;
      ctx.fillText(t, x, g.top - (wide ? 10 : 8));
    });
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const fs = Math.min(g.th * fsK, g.tw * 0.84);
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.xs.length; c++) {
      const s = cells(r, c, now);
      flap(ctx, g.xs[c], g.y(r), g.tw, g.th, s.a, s.b, s.p, s.ca, s.cb, fs);
    }
    ctx.textBaseline = "alphabetic";
  }

  // ---------------------------------------------------------------- thumbnail
  const TH = { rows: 6, cols: [3, 5, 5, 4] };
  let thumbCache = null;
  function thumb(ctx, w, h, t, d) {
    if (!thumbCache || thumbCache.d !== d) {
      const V = views(d, false);
      const order = ["일본", "베트남", "중국", "태국", "미국", "타이완"];
      const pairs = { ...V.pairs, rows: order.map((c) => V.pairs.rows.find((r) => r.cells[0] === c)) };
      const inn = d.pairs.filter(([, o, i]) => i > o).map(([c2]) => c2);
      const tot = d.dest.total, jp = d.dest.rows[0];
      thumbCache = { d, A: grid(pairs, TH.cols), B: grid(V.dest, TH.cols),
        foot: [`← 오는 사람이 더 많은 곳: ${inn.join(" · ")}`, `${jp[0]} = 한국인 출국의 ${KF.fmt((jp[1] / tot) * 100)}%`] };
    }
    const { A, B } = thumbCache, c = t % 12;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const g = geom(w, h, TH.cols, false, TH.rows);
    const blank = " ";
    const cells = (r, cc) => {
      let tr;
      if (c < 7) tr = { a: blank, b: A.G[r][cc], ca: AMBER, cb: A.C[r][cc], t0: 0.2 + r * 0.16 + cc * 0.045 + hash(r, cc, 1) * 0.15, n: 2 + Math.floor(hash(r, cc, 2) * 3), r, c: cc, seed: 1 };
      else tr = { a: A.G[r][cc], b: B.G[r][cc], ca: A.C[r][cc], cb: B.C[r][cc], t0: 7 + r * 0.1 + cc * 0.035 + hash(r, cc, 3) * 0.12, n: 2 + Math.floor(hash(r, cc, 4) * 3), r, c: cc, seed: 9 };
      return cellAt(tr, c);
    };
    board(ctx, w, h, g, c < 7 ? ["나라", "간 사람", "온 사람", "기울기"] : ["행선지", "2025", "2024", "몫"], cells, c, false);
    const fs = Math.max(10, Math.round(h * 0.05));
    ctx.textAlign = "right"; ctx.fillStyle = PAPER; ctx.font = `600 ${fs}px ${SANS}`;
    ctx.fillText(c < 7 ? "2025 · 간 한국인 vs 온 그 나라 사람" : "2025 · 한국인 출국 행선지", w - 14, h * 0.09);
    ctx.font = `700 ${Math.round(fs * 1.15)}px ${SANS}`; ctx.fillStyle = c < 7 ? TEAL : AMBER;
    ctx.fillText(thumbCache.foot[c < 7 ? 0 : 1], w - 14, h - Math.max(10, h * 0.055));
    if (c > 11.4) { ctx.fillStyle = `rgba(21,22,26,${(c - 11.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- detail stage
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const V0 = "pairs";
    let wide = s.w > 520, V = views(d, wide), view = V0, hover = null, pinned = null;
    let cur = null, tr = null; // settled chars + running transitions
    const blankGrid = (cols) => { const n = cols.reduce((a, b) => a + b, 0); return { G: Array.from({ length: ROWS }, () => Array(n).fill(" ")), C: Array.from({ length: ROWS }, () => Array(n).fill(AMBER)) }; };
    const now = () => performance.now() / 1000;
    function go(id, first) {
      const cols = COLS[wide ? "full" : "m"], nxt = grid(V[id], cols), t = now();
      const from = cur || blankGrid(cols);
      tr = nxt.G.map((row, r) => row.map((b, c) => {
        // start from whatever the flap shows right now
        const live = tr && tr[r] && tr[r][c] ? cellAt(tr[r][c], t) : null;
        const a = live ? (live.p > 0.5 ? live.b : live.a) : from.G[r][c];
        return { a, b, ca: live ? live.cb : from.C[r][c], cb: nxt.C[r][c], r, c, seed: Math.floor(t * 10) % 97,
          t0: t + (first ? 0.3 : 0.05) + r * (first ? 0.14 : 0.07) + c * (first ? 0.035 : 0.02) + hash(r, c, t) * 0.1,
          n: a === b ? 0 : 2 + Math.floor(hash(c, r, t) * 3) };
      }));
      cur = nxt; view = id;
    }
    if (KF.reduced) { cur = grid(V[view], COLS[wide ? "full" : "m"]); tr = null; } else go(view, true);
    s.onresize = () => { const w2 = s.w > 520; if (w2 !== wide) { wide = w2; V = views(d, wide); cur = null; tr = null; go(view, false); } };

    KF.segment(controls, [{ id: "pairs", label: "주고받기" }, { id: "dest", label: "행선지" }, { id: "years", label: "해마다" }, { id: "ages", label: "나이별" }],
      view, (id) => { pinned = null; go(id, false); });
    const out = document.createElement("span"); out.className = "readout"; out.textContent = "줄에 마우스를 올리면 정확한 값";
    controls.appendChild(out);
    const at = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = at(e); });
    stage.addEventListener("pointerdown", (e) => { hover = at(e); pinned = hover; });
    stage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, t = now(), cols = COLS[wide ? "full" : "m"];
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const g = geom(w, h, cols, wide);
      // header: board name + view title
      ctx.textAlign = "left"; ctx.fillStyle = AMBER; ctx.font = `600 ${wide ? 20 : 15}px ${MONO}`;
      ctx.fillText("DEPARTURES", wide ? 30 : 10, wide ? 34 : 24);
      const dw = ctx.measureText("DEPARTURES").width;
      ctx.fillStyle = PAPER; ctx.font = `700 ${wide ? 18 : 14}px ${SANS}`; ctx.fillText("출발", (wide ? 30 : 10) + dw + 10, wide ? 34 : 24);
      ctx.fillStyle = DIM; ctx.font = `500 ${wide ? 12 : 10.5}px ${SANS}`;
      if (wide) { ctx.textAlign = "right"; ctx.fillText(V[view].title, w - 30, 32); }
      else ctx.fillText(V[view].title, 10, 44);
      const cells = (r, c, tt) => (tr ? cellAt(tr[r][c], tt) : { a: cur.G[r][c], b: cur.G[r][c], p: 0, ca: cur.C[r][c], cb: cur.C[r][c] });
      board(ctx, w, h, g, V[view].heads, cells, t, wide);
      // hover row -> outline + exact values in the footer
      const hp = hover || pinned;
      let row = -1;
      if (hp) { const r = Math.floor((hp[1] - g.top + g.rh * 0.08) / g.rh); if (r >= 0 && r < ROWS && hp[0] > g.x0 - 10 && hp[0] < g.x0 + g.boardW + 10) row = r; }
      const rows = V[view].rows, fy = g.y(ROWS - 1) + g.th + (wide ? 30 : 22);
      const hy = Math.min(h - (wide ? 18 : 16), fy + (wide ? 62 : 58));
      ctx.textAlign = wide ? "left" : "left"; ctx.fillStyle = PAPER; ctx.font = `700 ${wide ? 20 : 14}px ${SANS}`;
      ctx.fillText(V[view].head, wide ? g.x0 - 5 : 10, hy);
      ctx.textAlign = "left"; ctx.font = `500 ${wide ? 12 : 10.5}px ${SANS}`;
      if (row >= 0 && rows[row]) {
        ctx.strokeStyle = AMBER; ctx.lineWidth = 1.5;
        ctx.strokeRect(g.x0 - 5, g.y(row) - 3, g.boardW + 6, g.th + 6);
        ctx.fillStyle = PAPER;
        const txt = rows[row].detail;
        if (wide) ctx.fillText(txt, g.x0 - 5, fy);
        else { // two lines on phones
          const parts = txt.split(" · ");
          ctx.fillText(parts.slice(0, 2).join(" · "), 10, fy); ctx.fillStyle = DIM; ctx.fillText(parts.slice(2).join(" · "), 10, fy + 15);
        }
      } else {
        ctx.fillStyle = DIM;
        const note = view === "pairs" ? (wide ? "나감 = 한국인이 더 많이 떠남 · 들어옴 = 그 나라 사람이 더 많이 옴 · 행선지·국적 파일은 승무원 포함" : "→ 한국인이 더 많이 감 · ← 더 많이 옴")
          : view === "years" ? (wide ? "* 1–7월 · 승무원 제외" : "* 1–7월 · 승객만")
          : view === "dest" ? (wide ? "첫 도착지 기준 · 승무원 포함 · 몫은 전체 출국 대비" : "첫 도착지 · 승무원 포함")
          : (wide ? "출국 횟수 · 나이대별 인구로 나누지 않았다" : "횟수 · 인구로 나누지 않음");
        ctx.fillText(note, wide ? g.x0 - 5 : 10, fy);
      }
    });
  }

  VIZ.travel = { thumb, mount, bg: BG };
})();
