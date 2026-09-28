// 49 benefits — "뜯어 쓰는 쿠폰북". Every public service on 정부24 is one perforated coupon in an open coupon book
// (colour = who gives it, or the age it targets). Steps tear off the coupons that do not apply: other regions'
// services, those only for businesses/facilities, and those whose age condition does not fit. The coupons that
// remain re-pack and grow, so the book ends up showing one person's share.
(() => {
  const BG = "#9fb8b0";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#1f2a2a", MUTE = "rgba(31,42,42,.66)", PAPER = "#f7f2e4", COVER = "#3f4b4a";
  const PCOL = ["#2f4b7c", "#3a8fb7", "#4c9a5b", "#8b6bb5", "#e07b39", "#c9a13b", "#b5838d"];
  const ACOL = ["#8a8f98", "#5b7fa6", "#e3a21a", "#2fa37a", "#b0523c", "#9a78c2"];
  const B36 = "0123456789abcdefghijklmnopqrstuvwxyz";
  const STEPS = ["모든 혜택", "우리 동네", "개인·가구", "내 나이"];

  let DEC = null;
  function decode(d) {
    if (DEC && DEC.d === d) return DEC;
    const n = d.n, P = d.pack, S = [];
    const v = (s) => [...s].reduce((a, c) => a * 36 + B36.indexOf(c), 0);
    for (let i = 0; i < n; i++) {
      const o = i * 13, reg = P.substr(o + 10, 2);
      const a0 = v(P.substr(o + 6, 2)), a1 = v(P.substr(o + 8, 2));
      S.push({ i, prov: v(P[o]), ag: v(P.substr(o + 1, 2)), typ: v(P[o + 3]), fld: v(P[o + 4]), u: v(P[o + 5]), a0, a1,
        reg: reg === "yy" ? { all: 1 } : reg[0] === "x" ? { sido: v(reg[1]) } : { sgg: v(reg) }, onl: P[o + 12] === "1",
        cls: a0 <= 0 && a1 >= 100 ? 0 : a0 >= 15 && a0 <= 20 && a1 >= 100 ? 1 : a1 <= 24 ? 2 : a0 >= 15 && a1 >= 25 && a1 <= 49 ? 3 : a0 >= 50 && a1 >= 100 ? 4 : 5 });
    }
    const sidoOf = d.sgg.map((g) => d.sido.findIndex((s) => g.startsWith(s)));
    return (DEC = { d, S, sidoOf });
  }
  const VC = new Map();
  function visibleCount(X, step, g, age) {
    const k = `${step}|${g}|${age}`;
    if (!VC.has(k)) { if (VC.size > 400) VC.clear(); VC.set(k, visible(X, step, g, age).length); }
    return VC.get(k);
  }
  function visible(X, step, g, age) {
    const out = [], si = X.sidoOf[g];
    for (const s of X.S) {
      if (step >= 1 && !(s.reg.all || s.reg.sido === si || s.reg.sgg === g)) continue;
      if (step >= 2 && !(s.u & 3)) continue;
      if (step >= 3 && !(s.a0 <= age && age <= s.a1)) continue;
      out.push(s.i);
    }
    return out;
  }

  // book geometry and coupon grid (two pages on desktop, one on phones)
  function book(w, h, full, thumb) {
    if (thumb) { const x0 = 52, pw = (w * 0.6 - x0 - 8) / 2; return { pages: [[x0, 36, pw, h - 52], [x0 + pw + 8, 36, pw, h - 52]] }; }   // clear of both badges
    if (full) { const bw = w * 0.64, pw = (bw - 34) / 2; return { pages: [[20, 24, pw, h - 48], [20 + pw + 14, 24, pw, h - 48]] }; }
    return { pages: [[12, 44, w - 24, h * 0.6]] };
  }
  const GRIDS = new Map();
  function grid(B, n, key) {
    if (GRIDS.has(key)) return GRIDS.get(key);
    if (GRIDS.size > 30) GRIDS.clear();
    const pad = 8, np = B.pages.length;
    let best = null;
    for (let ch = 40; ch >= 0.6; ch -= 0.1) {
      const cw = ch * 1.9, gap = ch < 2.2 ? 0.25 : Math.max(0.6, ch * 0.14);
      let cap = 0;
      const per = B.pages.map(([, , pw, ph]) => { const c = Math.floor((pw - 2 * pad + gap) / (cw + gap)), r = Math.floor((ph - 2 * pad + gap) / (ch + gap)); cap += c * r; return [c, r]; });
      best = { ch, cw, gap, per, pad };
      if (cap >= n) break;
    }
    const rects = new Float32Array(n * 4);
    let k = 0;
    // fill pages row by row, page 1 first
    B.pages.forEach(([px, py], p) => {
      const [c, r] = best.per[p];
      for (let rr = 0; rr < r && k < n; rr++) for (let cc = 0; cc < c && k < n; cc++, k++) {
        rects[k * 4] = px + best.pad + cc * (best.cw + best.gap); rects[k * 4 + 1] = py + best.pad + rr * (best.ch + best.gap);
        rects[k * 4 + 2] = best.cw; rects[k * 4 + 3] = best.ch;
      }
    });
    const out = { ...best, rects };
    GRIDS.set(key, out);
    return out;
  }

  function pagesDraw(ctx, B, full) {
    const [x0, y0] = B.pages[0], last = B.pages[B.pages.length - 1], x1 = last[0] + last[2], y1 = y0 + B.pages[0][3];
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(x0 - 6 + 5, y0 - 6 + 7, x1 - x0 + 12, y1 - y0 + 12);
    ctx.fillStyle = COVER; ctx.fillRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12);
    B.pages.forEach(([px, py, pw, ph], p) => {
      ctx.fillStyle = PAPER; ctx.fillRect(px, py, pw, ph);
      const g = ctx.createLinearGradient(p ? px : px + pw, 0, p ? px + 18 : px + pw - 18, 0);
      g.addColorStop(0, "rgba(0,0,0,.12)"); g.addColorStop(1, "rgba(0,0,0,0)");
      if (B.pages.length > 1) { ctx.fillStyle = g; ctx.fillRect(p ? px : px + pw - 18, py, 18, ph); }
    });
  }

  function coupon(ctx, x, y, w, h, col, a) {
    ctx.globalAlpha = a; ctx.fillStyle = col;
    if (w < 13) { ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; return; }
    const r = Math.min(3, h * 0.2), sx = x + w * 0.27;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill();
    ctx.fillStyle = PAPER;                                           // notches at the perforation
    ctx.beginPath(); ctx.arc(sx, y, h * 0.14, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(sx, y + h, h * 0.14, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(sx + 0.5, y + h * 0.18); ctx.lineTo(sx + 0.5, y + h * 0.82); ctx.stroke(); ctx.setLineDash([]);
    if (w >= 30) { ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(sx + w * 0.1, y + h * 0.32, w * 0.46, Math.max(1, h * 0.1)); ctx.fillRect(sx + w * 0.1, y + h * 0.56, w * 0.3, Math.max(1, h * 0.1)); }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- the animated book
  function makeState(X) {
    return { vis: [], pos: new Map(), from: null, t0: 0, gone: [] };
  }
  function retarget(st, X, list, G, now) {
    const old = st.pos, nextPos = new Map(), was = new Set(st.vis);
    list.forEach((i, k) => nextPos.set(i, [G.rects[k * 4], G.rects[k * 4 + 1], G.rects[k * 4 + 2], G.rects[k * 4 + 3]]));
    const keep = new Set(list);
    st.gone = st.vis.filter((i) => !keep.has(i)).map((i) => [i, old.get(i)]);
    st.from = new Map(); for (const i of list) st.from.set(i, was.has(i) ? old.get(i) : null);
    st.vis = list; st.pos = nextPos; st.t0 = now;
  }
  function drawBook(ctx, X, st, colOf, now, hover) {
    const k = KF.ease(KF.clamp((now - st.t0) / 900, 0, 1)), fall = (now - st.t0) / 1000;
    // coupons torn off: drop and fade
    if (fall < 1.2) {
      for (const [i, r] of st.gone) {
        if (!r) continue;
        const s = X.S[i], dy = 260 * fall * fall, dx = ((i * 37) % 11 - 5) * fall * 6;
        coupon(ctx, r[0] + dx, r[1] + dy, r[2], r[3], colOf(s), KF.clamp(1 - fall / 1.1, 0, 1));
      }
    }
    let hit = null;
    for (const i of st.vis) {
      const to = st.pos.get(i), fr = st.from.get(i), s = X.S[i];
      let x, y, w, h, a = 1;
      if (fr) { x = KF.lerp(fr[0], to[0], k); y = KF.lerp(fr[1], to[1], k); w = KF.lerp(fr[2], to[2], k); h = KF.lerp(fr[3], to[3], k); }
      else { [x, y, w, h] = to; a = k; }
      coupon(ctx, x, y, w, h, colOf(s), a);
      if (hover && k >= 1 && hover[0] >= x && hover[0] <= x + w && hover[1] >= y && hover[1] <= y + h) hit = { s, x, y, w, h };
    }
    if (hit) { ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(hit.x - 1, hit.y - 1, hit.w + 2, hit.h + 2); }
    return hit;
  }

  function panel(ctx, x0, y0, w, h, X, list, step, g, age, colMode, full) {
    const d = X.d, n = list.length;
    ctx.textAlign = "left";
    ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 11 : 10}px ${MONO}`;
    ctx.fillText(`${step + 1} / 4 · ${STEPS[step]}`, x0, y0);
    ctx.fillStyle = INK; ctx.font = `700 ${full ? 40 : 26}px ${SANS}`; ctx.fillText(`${KF.fmt(n)}장`, x0, y0 + (full ? 44 : 30));
    const nw = ctx.measureText(`${KF.fmt(n)}장`).width;
    ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 12 : 10.5}px ${SANS}`;
    ctx.fillText(step ? `전체 ${KF.fmt(d.n)}장의 ${(n / d.n * 100).toFixed(1)}%` : "정부24 공공서비스(혜택)", x0 + nw + 10, y0 + (full ? 44 : 30));
    const desc = [
      "쿠폰 1장 = 공공서비스 1개",
      `${d.sgg[g]} 주민 · 다른 곳 사업은 뜯어냄`,
      "사업자·법인·시설만 받는 것도 뜯어냄",
      `${age}세가 나이 조건에 맞는 것만`,
    ];
    ctx.fillStyle = INK; ctx.font = `500 ${full ? 12.5 : 11}px ${SANS}`; ctx.fillText(desc[step], x0, y0 + (full ? 68 : 48));
    if (!full) {
      const cs = [0, 1, 2, 3].map((k) => visibleCount(X, k, g, age));
      let x = x0; ctx.font = `600 11px ${MONO}`;
      cs.forEach((v, k) => { const t = `${KF.fmt(v)}${k < 3 ? " →" : ""}`; ctx.fillStyle = k === step ? "#b8431c" : MUTE; ctx.fillText(t, x, y0 + 70); x += ctx.measureText(t).width + 6; });
      return;
    }
    // breakdown by colour category
    const cats = colMode === "prov" ? d.prov : d.cls, cols = colMode === "prov" ? PCOL : ACOL;
    const cnt = new Array(cats.length).fill(0), tc = new Array(5).fill(0);
    for (const i of list) { const s = X.S[i]; cnt[colMode === "prov" ? s.prov : s.cls]++; tc[s.typ]++; }
    let y = y0 + 104;
    ctx.fillStyle = MUTE; ctx.font = `600 11px ${SANS}`; ctx.fillText(colMode === "prov" ? "색 = 주는 곳" : "색 = 나이 조건으로 본 대상", x0, y - 14);
    const mx = Math.max(...cnt, 1);
    cats.forEach((c, j) => {
      const yy = y + j * 19, bw = (cnt[j] / mx) * (w - 150);
      ctx.fillStyle = cols[j]; ctx.fillRect(x0, yy, 12, 12);
      ctx.fillStyle = INK; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(c, x0 + 18, yy + 10);
      ctx.fillStyle = cols[j]; ctx.globalAlpha = 0.85; ctx.fillRect(x0 + 104, yy + 1, bw, 10); ctx.globalAlpha = 1;
      ctx.fillStyle = INK; ctx.font = `500 10.5px ${MONO}`; ctx.fillText(KF.fmt(cnt[j]), x0 + 108 + bw, yy + 10);
    });
    y += cats.length * 19 + 30;
    ctx.fillStyle = MUTE; ctx.font = `600 11px ${SANS}`; ctx.fillText("어떤 방식으로 주나", x0, y - 12);
    let x = x0; const bw = w - 10;
    const TC = ["#1f2a2a", "#b8431c", "#d9a441", "#3a8fb7", "#9aa9a4"];
    tc.forEach((v, j) => { const ww = (v / Math.max(1, n)) * bw; ctx.fillStyle = TC[j]; ctx.fillRect(x, y, ww, 14); x += ww; });
    ctx.font = `500 10.5px ${SANS}`; ctx.fillStyle = INK;
    let lx = x0;
    d.types.forEach((t, j) => { const s = `${t} ${Math.round(tc[j] / Math.max(1, n) * 100)}%`; ctx.fillStyle = TC[j]; ctx.fillRect(lx, y + 22, 8, 8); ctx.fillStyle = INK; ctx.fillText(s, lx + 11, y + 30); lx += ctx.measureText(s).width + 22; });
    // the funnel: how many coupons are left after each step
    const fy = y + 64, counts = [0, 1, 2, 3].map((k) => visibleCount(X, k, g, age));
    ctx.fillStyle = MUTE; ctx.font = `600 11px ${SANS}`; ctx.fillText("뜯어낼 때마다 남는 쿠폰", x0, fy - 10);
    counts.forEach((v, k) => {
      const yy = fy + k * 21, bw2 = (v / counts[0]) * (w - 120), on = k === step;
      ctx.fillStyle = on ? "#b8431c" : "rgba(31,42,42,.28)"; ctx.fillRect(x0 + 76, yy, Math.max(2, bw2), 13);
      ctx.fillStyle = on ? INK : MUTE; ctx.font = `${on ? 700 : 500} 11px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(`${k + 1} ${STEPS[k]}`, x0, yy + 11);
      ctx.font = `${on ? 700 : 500} 10.5px ${MONO}`; ctx.fillText(KF.fmt(v), x0 + 82 + Math.max(2, bw2), yy + 11);
    });
    // the whole range across 시군구, for scale
    const E = d.ex;
    ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${SANS}`;
    ctx.fillText(`지역 조건까지: 가장 적은 곳 ${E.lo[0].split(" ").pop()} ${KF.fmt(E.lo[1])}장 · 가장 많은 곳 ${E.hi[0].split(" ").pop()} ${KF.fmt(E.hi[1])}장`, x0, h - 22);
  }

  function tip(ctx, w, h, X, s, p) {
    const d = X.d, name = d.names[s.i] || "", ages = s.a0 <= 0 && s.a1 >= 100 ? "나이 제한 없음" : s.a1 >= 100 ? `${s.a0}세 이상` : s.a0 <= 0 ? `${s.a1}세 이하` : `${s.a0}–${s.a1}세`;
    const who = ["개인", "가구", "소상공인", "법인·시설·단체"].filter((_, b) => s.u & (1 << b)).join("·");
    const lines = [[name || d.ag[s.ag], 1], [name ? d.ag[s.ag] : d.prov[s.prov], 0], [`${d.fields[s.fld]} · ${d.types[s.typ]} · ${ages}`, 0], [`대상 ${who}${s.onl ? " · 온라인 신청" : ""}`, 2]];
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : k === 2 ? `500 10.5px ${SANS}` : `500 11.5px ${SANS}`);
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22), bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(252,250,243,.98)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? MUTE : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + j * 18); });
  }

  // ---------------------------------------------------------------- thumb
  let TH = null;
  function thumb(ctx, w, h, t, d) {
    const X = decode(d), c = t % 10, g = d.sgg.indexOf(d.ex.sgg);
    if (!TH || TH.w !== w || TH.h !== h) {
      const B = book(w, h, false, true), all = X.S.map((s) => s.i), fin = visible(X, 3, g, d.ex.age);
      TH = { w, h, B, all, fin, G0: grid(B, all.length, `t0${w}x${h}`), G1: grid(B, fin.length, `t1${w}x${h}`), keep: new Set(fin) };
    }
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    pagesDraw(ctx, TH.B, false);
    const tear = KF.clamp((c - 1.2) / 1.2, 0, 1), k = KF.ease(KF.clamp((c - 1.6) / 1.1, 0, 1)), pr = KF.clamp(c / 1.0, 0, 1);
    const colOf = (s) => PCOL[s.prov];
    if (tear < 1) TH.all.forEach((i, j) => {
      if (j / TH.all.length > pr) return;
      if (TH.keep.has(i)) return;
      const r = TH.G0.rects, dy = 160 * tear * tear;
      coupon(ctx, r[j * 4], r[j * 4 + 1] + dy, r[j * 4 + 2], r[j * 4 + 3], colOf(X.S[i]), 1 - tear);
    });
    const idx0 = new Map(TH.all.map((i, j) => [i, j]));
    TH.fin.forEach((i, j) => {
      const a = idx0.get(i); if (a / TH.all.length > pr) return;
      const r0 = TH.G0.rects, r1 = TH.G1.rects;
      coupon(ctx, KF.lerp(r0[a * 4], r1[j * 4], k), KF.lerp(r0[a * 4 + 1], r1[j * 4 + 1], k), KF.lerp(r0[a * 4 + 2], r1[j * 4 + 2], k), KF.lerp(r0[a * 4 + 3], r1[j * 4 + 3], k), colOf(X.S[i]), 1);
    });
    const x = w * 0.63, a = KF.clamp((c - 0.4) / 0.6, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`; ctx.fillText("정부24 혜택", x, h * 0.22);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.12)}px ${SANS}`; ctx.fillText(`${KF.fmt(d.n)}개`, x, h * 0.36);
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`; ctx.fillText(`한 사람 몫 (${d.ex.age}세)`, x, h * 0.6);
    ctx.fillStyle = "#b8431c"; ctx.font = `700 ${Math.round(h * 0.15)}px ${SANS}`; ctx.fillText(`${KF.fmt(TH.fin.length)}장`, x, h * 0.77);
    ctx.globalAlpha = 1;
    if (c > 9.4) { ctx.fillStyle = `rgba(159,184,176,${(c - 9.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage);
    let step = 0, g = d.sgg.indexOf(d.ex.sgg), age = d.ex.age, colMode = "prov", hover = null, intro = true, t0 = performance.now(), lastKey = "";
    const st = makeState(X);
    const stepBtns = KF.segment(controls, STEPS.map((l, i) => ({ id: i, label: `${i + 1} ${l}` })), 0, (id) => { intro = false; step = id; });
    const sel = document.createElement("select");
    d.sgg.forEach((n, i) => { const o = document.createElement("option"); o.value = i; o.textContent = n; if (i === g) o.selected = true; sel.appendChild(o); });
    const sl = document.createElement("label"); sl.append("우리 동네", sel);
    sel.onchange = () => { intro = false; g = +sel.value; if (step < 1) setStep(1); };
    const range = document.createElement("input"); range.type = "range"; range.min = 0; range.max = 100; range.value = age;
    const al = document.createElement("label"); al.append("나이", range);
    const out = document.createElement("span"); out.className = "readout"; out.textContent = `${age}세`;
    range.oninput = () => { intro = false; age = +range.value; out.textContent = `${age}세`; if (step < 3) setStep(3); };
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = " 색:";
    controls.append(sl, al, out, sep);
    KF.segment(controls, [{ id: "prov", label: "주는 곳" }, { id: "age", label: "나이 대상" }], "prov", (id) => { colMode = id; });
    const setStep = (k) => { step = k; stepBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === k))); };
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), el = (now - t0) / 1000;
      if (intro) { const k = el < 1.6 ? 0 : el < 2.9 ? 1 : el < 4.1 ? 2 : 3; if (k !== step) setStep(k); if (el > 4.2) intro = false; }
      const B = book(w, h, full, false);
      const key = `${w}x${h}|${step}|${g}|${age}`;
      if (key !== lastKey) {
        const list = visible(X, step, g, age);
        const G = grid(B, list.length, `${w}x${h}|${list.length}`);
        if (lastKey.split("|")[0] !== `${w}x${h}`) { st.vis = []; st.pos = new Map(); }
        retarget(st, X, list, G, now);
        lastKey = key;
      }
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      pagesDraw(ctx, B, full);
      const colOf = colMode === "prov" ? (q) => PCOL[q.prov] : (q) => ACOL[q.cls];
      const hit = drawBook(ctx, X, st, colOf, now, hover);
      if (full) panel(ctx, w * 0.64 + 34, 44, w - (w * 0.64 + 34) - 20, h, X, st.vis, step, g, age, colMode, true);
      else panel(ctx, 12, B.pages[0][1] + B.pages[0][3] + 30, w - 24, h, X, st.vis, step, g, age, colMode, false);
      if (hit && hover) tip(ctx, w, h, X, hit.s, hover);
    });
  }

  VIZ.benefits = { thumb, mount, bg: BG };
})();
