// 50 laws — "법전 쌓기". Statute books lying flat on a walnut desk against an oxblood wall. View 1: every law in
// force as books of 20 (one stack per rank: statutes, presidential decrees, ministerial ordinances, other rules);
// cover colour = the year its current version was promulgated, oldest at the bottom. View 2: one pile of thin
// booklets per year = legislative notices in the Official Gazette (1 booklet = 20), coloured new / amend / repeal.
(() => {
  const BG = "#4a2328";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const TXT = "#f6ede4", DIM = "rgba(246,237,228,.72)", SOFT = "rgba(246,237,228,.45)", GILT = "rgba(255,236,190,.55)";
  const AGE = ["#f0cf73", "#d9994c", "#a97a5c", "#7c625b", "#5c4d50"];          // current version promulgated: newest -> oldest
  const ACT = ["#7fc79c", "#efe6d2", "#e3605a", "#8f8580"];                      // notices: 제정 · 개정 · 폐지 · 기타
  const hash = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  // ---------------------------------------------------------------- wall + desk (cached)
  let ROOM = null;
  function room(w, h, deskY) {
    const key = `${w}x${h}x${deskY}`;
    if (ROOM && ROOM.key === key) return ROOM.c;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    g.fillStyle = BG; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 18) { g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(x, 0, 1, deskY); g.fillStyle = "rgba(255,210,190,.035)"; g.fillRect(x + 9, 0, 1, deskY); }
    for (let i = 0; i < (w * h) / 18; i++) { g.fillStyle = hash(i) > 0.5 ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.05)"; g.fillRect(hash(i + 0.4) * w, hash(i + 0.9) * h, 1, 1); }
    const vg = g.createRadialGradient(w * 0.35, h * 0.1, 20, w * 0.35, h * 0.2, Math.max(w, h) * 0.8);
    vg.addColorStop(0, "rgba(255,220,170,.10)"); vg.addColorStop(1, "rgba(0,0,0,.28)");
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    const dg = g.createLinearGradient(0, deskY, 0, h); dg.addColorStop(0, "#5b3a24"); dg.addColorStop(0.1, "#6e4629"); dg.addColorStop(1, "#2e1c11");
    g.fillStyle = dg; g.fillRect(0, deskY, w, h - deskY);
    g.fillStyle = "rgba(255,220,170,.18)"; g.fillRect(0, deskY, w, 1.5);
    g.strokeStyle = "rgba(255,210,160,.08)"; g.lineWidth = 1;
    for (let k = 0; k < 5; k++) { g.beginPath(); for (let x = 0; x <= w; x += 14) g.lineTo(x, deskY + 8 + k * 9 + Math.sin(x / 90 + k * 2) * 2); g.stroke(); }
    ROOM = { key, c };
    return c;
  }

  // one book lying flat, spine towards us
  function book(ctx, x, y, w, t, col, seed, hi) {
    const r = Math.min(2, t / 2);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(x + 1.5, y + 1, w, t);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + t - r);
    ctx.quadraticCurveTo(x + w, y + t, x + w - r, y + t); ctx.lineTo(x + r, y + t); ctx.quadraticCurveTo(x, y + t, x, y + t - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.fill();
    if (t >= 2.6) {
      ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fillRect(x + 1, y, w - 2, Math.max(0.6, t * 0.22));
      ctx.fillStyle = GILT; ctx.fillRect(x + w * 0.1, y + 0.4, 1, t - 0.8); ctx.fillRect(x + w * 0.9 - 1, y + 0.4, 1, t - 0.8);
      ctx.fillStyle = "rgba(255,236,190,.35)"; ctx.fillRect(x + w * (0.3 + hash(seed) * 0.1), y + t * 0.42, w * (0.18 + hash(seed + 1) * 0.12), Math.max(0.6, t * 0.16));
    }
    if (hi) { ctx.strokeStyle = TXT; ctx.lineWidth = 1.2; ctx.strokeRect(x - 1.5, y - 1.5, w + 3, t + 3); }
  }

  // ---------------------------------------------------------------- view 1: the stacks
  function stacks(ctx, d, X, deskY, topY, widths, gap, fill, hover, full) {
    const nMax = Math.max(...d.books.map((b) => b.length)), t = Math.min(full ? 4.4 : 2.9, (deskY - topY) / nMax);
    let x = X, hit = null;
    const geo = [];
    d.books.forEach((B, s) => {
      const w = widths[s], shown = B.length * fill;
      for (let k = 0; k < Math.ceil(shown); k++) {
        const [n, , , bk] = B[k], th = t * (n / d.book) - (t > 3 ? 0.6 : 0.3), jit = (hash(s * 997 + k) - 0.5) * (full ? 6 : 3);
        const drop = KF.clamp(shown - k, 0, 1), y = deskY - (k + 1) * t - (1 - drop) * 40;
        const on = hover && hover[0] >= x + jit && hover[0] <= x + jit + w && hover[1] >= y && hover[1] < y + t;
        ctx.globalAlpha = drop;
        book(ctx, x + jit, y, w, Math.max(0.8, th), AGE[bk], s * 131 + k, on);
        ctx.globalAlpha = 1;
        if (on) hit = { s, k, x: x + jit, y };
      }
      geo.push({ x, w, top: deskY - B.length * t });
      x += w + gap;
    });
    return { geo, hit, t };
  }

  // ---------------------------------------------------------------- view 2: notices per year
  function piles(ctx, d, X0, X1, deskY, topY, sel, grow, hover, full) {
    const n = d.nyears.length, cw = (X1 - X0) / n, bw = cw * 0.78, U = d.book;
    const mx = Math.max(...d.notices.map((c) => c.reduce((a, b) => a + b, 0))) / U, t = Math.min(full ? 3.2 : 2.3, (deskY - topY) / mx);
    let hit = null;
    for (let j = 0; j < n; j++) {
      const c = d.notices[j], yr = d.nyears[j], tot = c.reduce((a, b) => a + b, 0), partial = yr < d.full[0];
      const x = X0 + j * cw + (cw - bw) / 2, nb = tot / U * grow, on = j === sel;
      // order bottom-up: 개정, 제정, 폐지, 기타
      const seq = [[1, c[1]], [0, c[0]], [2, c[2]], [3, c[3]]];
      let k = 0;
      ctx.globalAlpha = partial ? 0.45 : 1;
      for (const [a, v] of seq) {
        const m = v / U;
        for (let q = 0; q < Math.ceil(m - 1e-9) && k < nb; q++, k++) {
          const fr = Math.min(1, m - q, nb - k), jit = (hash(j * 71 + k) - 0.5) * bw * 0.12;
          book(ctx, x + jit, deskY - (k + 1) * t, bw, Math.max(0.7, t * fr - 0.5), ACT[a], j * 53 + k, false);
        }
      }
      ctx.globalAlpha = 1;
      if (on) { const top = deskY - Math.ceil(tot / U) * t; ctx.strokeStyle = TXT; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.strokeRect(x - 3.5, top - 4.5, bw + 7, deskY - top + 5); ctx.setLineDash([]); }
      if (hover && hover[0] >= X0 + j * cw && hover[0] < X0 + (j + 1) * cw && hover[1] >= topY - 20 && hover[1] <= deskY + 20) hit = j;
      const lab = full ? (j % 3 === 2 || j === n - 1) : (j % 7 === 2 || j === n - 1);
      if (lab) {
        ctx.fillStyle = on ? TXT : DIM; ctx.font = `${on ? 600 : 500} ${full ? 10.5 : 9.5}px ${MONO}`; ctx.textAlign = "center";
        ctx.fillText(full ? String(yr) : `'${String(yr).slice(2)}`, x + bw / 2, deskY + 16);
      }
    }
    ctx.textAlign = "left";
    return hit;
  }

  function tip(ctx, w, h, lines, p) {
    ctx.font = `600 12px ${SANS}`;
    const bw = Math.min(w - 12, Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22), bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(38,18,20,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#d9b86a"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, wt, c], k) => { ctx.fillStyle = c || TXT; ctx.font = `${wt} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 19 + k * 18); });
  }
  const fdate = (s) => `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6)}`;
  const noticeLines = (d, j) => {
    const c = d.notices[j], tot = c.reduce((a, b) => a + b, 0), y = d.nyears[j], M = d.mins[String(y)] || [];
    const L = [[`${y}년 입법예고 ${KF.fmt(tot)}건${y === d.nyears[d.nyears.length - 1] ? ` (1–${d.ytd}월)` : ""}`, 700],
      [`제정 ${KF.fmt(c[0])} · 개정 ${KF.fmt(c[1])} · 폐지 ${KF.fmt(c[2])}${c[3] ? ` · 기타 ${KF.fmt(c[3])}` : ""}`, 500],
      [`제정 ${KF.fmt(c[0] / tot * 100, 1)}% · 개정 ${KF.fmt(c[1] / tot * 100, 1)}%`, 500, DIM]];
    if (M.length) L.push([`많이 낸 곳: ${M.map(([m, v]) => `${m} ${KF.fmt(v)}`).join(", ")}`, 500, DIM]);
    if (y < d.full[0]) L.push(["이 해는 관보 수록이 덜 된 것으로 보인다", 500, SOFT]);
    return L;
  };

  // ---------------------------------------------------------------- panels
  function stockPanel(ctx, x0, x1, y0, d, a) {
    const S = d.sum, W = x1 - x0;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `600 12.5px ${SANS}`; ctx.fillText(`현행 법령 · ${fdate(d.snap)} 공포분까지`, x0, y0);
    ctx.fillStyle = TXT; ctx.font = `800 40px ${SANS}`; ctx.fillText(`${KF.fmt(S.total)}건`, x0, y0 + 46);
    ctx.fillStyle = "#f0cf73"; ctx.font = `800 30px ${SANS}`; ctx.fillText(`${KF.fmt(S.recentShare, 1)}%`, x0, y0 + 98);
    ctx.fillStyle = DIM; ctx.font = `500 12.5px ${SANS}`;
    ctx.fillText(`지금 모습이 ${d.buckets[1]}년 이후에 공포된 법령`, x0, y0 + 120);
    // legend: colour = year the current version was promulgated
    let y = y0 + 158;
    ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`; ctx.fillText("표지 색 = 지금 모습이 공포된 해", x0, y);
    const tot = d.buckets.map((_, b) => d.stock.reduce((s, r) => s + r[b], 0));
    d.buckets.forEach((lab, b) => {
      const yy = y + 22 + b * 22;
      book(ctx, x0, yy - 10, 34, 10, AGE[b], 700 + b, false);
      ctx.fillStyle = TXT; ctx.font = `500 12.5px ${SANS}`; ctx.fillText(lab.includes("–") || lab.startsWith("~") ? lab : `${lab}년`, x0 + 46, yy);
      ctx.font = `500 12px ${MONO}`; ctx.textAlign = "right"; ctx.fillText(`${KF.fmt(tot[b])}건`, x1, yy); ctx.textAlign = "left";
    });
    y += 22 + 5 * 22 + 18;
    ctx.fillStyle = SOFT; ctx.font = `500 11px ${MONO}`; ctx.fillText(`책 1권 = 법령 ${d.book}건 · 아래가 오래된 모습`, x0, y);
    ctx.restore();
  }
  function flowPanel(ctx, x0, x1, y0, d, j, a) {
    const c = d.notices[j], tot = c.reduce((s, v) => s + v, 0), y = d.nyears[j], W = x1 - x0;
    const all = [0, 1, 2, 3].map((k) => d.notices.reduce((s, r, q) => s + (d.nyears[q] >= d.full[0] && d.nyears[q] <= d.full[1] ? r[k] : 0), 0)), T = all.reduce((s, v) => s + v, 0);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `600 12.5px ${SANS}`; ctx.fillText(`관보 입법예고 · ${d.full[0]}–${d.full[1]}`, x0, y0);
    ctx.fillStyle = TXT; ctx.font = `800 40px ${SANS}`; ctx.fillText(`${KF.fmt(all[0] / T * 100, 1)}%`, x0, y0 + 46);
    ctx.fillStyle = DIM; ctx.font = `500 12.5px ${SANS}`; ctx.fillText(`새 법령을 만드는 제정의 몫 (${KF.fmt(T)}건 중 ${KF.fmt(all[0])}건)`, x0, y0 + 68);
    let bx = x0;
    [1, 0, 2, 3].forEach((k) => { const bw = all[k] / T * W; ctx.fillStyle = ACT[k]; ctx.fillRect(bx, y0 + 84, Math.max(0, bw - 1), 12); bx += bw; });
    ["제정", "개정", "폐지", "기타"].forEach((t, k) => {
      const lx = x0 + (k % 2) * (W / 2), ly = y0 + 120 + Math.floor(k / 2) * 18;
      ctx.fillStyle = ACT[k]; ctx.fillRect(lx, ly - 9, 10, 9);
      ctx.fillStyle = TXT; ctx.font = `500 12px ${SANS}`; ctx.fillText(`${t} ${KF.fmt(all[k] / T * 100, 1)}%`, lx + 15, ly);
    });
    let yy = y0 + 178;
    ctx.fillStyle = TXT; ctx.font = `700 22px ${MONO}`; ctx.fillText(String(y), x0, yy);
    ctx.font = `600 13px ${SANS}`; ctx.fillText(`${KF.fmt(tot)}건${y === d.nyears[d.nyears.length - 1] ? ` (1–${d.ytd}월)` : ""}`, x0 + 72, yy - 2);
    ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
    ctx.fillText(`제정 ${KF.fmt(c[0])} · 개정 ${KF.fmt(c[1])} · 폐지 ${KF.fmt(c[2])}`, x0, yy + 22);
    const M = d.mins[String(y)] || [];
    M.forEach(([m, v], k) => { ctx.fillStyle = k ? DIM : TXT; ctx.fillText(`${k + 1}. ${m}`, x0, yy + 48 + k * 18); ctx.textAlign = "right"; ctx.fillText(`${KF.fmt(v)}건`, x1, yy + 48 + k * 18); ctx.textAlign = "left"; });
    if (y < d.full[0]) { ctx.fillStyle = SOFT; ctx.fillText("수록이 덜 된 해로 보여 평균에서 뺐다", x0, yy + 48 + 3 * 18 + 4); }
    ctx.fillStyle = SOFT; ctx.font = `500 11px ${MONO}`; ctx.fillText(`책 1권 = 공고 ${d.book}건`, x0, yy + 48 + 4 * 18 + 12);
    ctx.restore();
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const c = t % 10, deskY = h - 20;
    ctx.drawImage(room(w, h, deskY), 0, 0, w, h);
    const widths = [w * 0.13, w * 0.12, w * 0.11, w * 0.085], gap = w * 0.02;
    stacks(ctx, d, 54, deskY, h * 0.1, widths, gap, KF.clamp(c / 2.4, 0, 1), null, false);
    const X = 54 + widths.reduce((a, b) => a + b, 0) + 3 * gap + w * 0.04, a = KF.clamp((c - 0.6) / 0.6, 0, 1) * (c > 9.4 ? 1 - (c - 9.4) / 0.6 : 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText("입법예고 가운데 제정", X, h * 0.22);
    ctx.fillStyle = "#7fc79c"; ctx.font = `800 ${Math.round(h * 0.16)}px ${SANS}`; ctx.fillText(`${KF.fmt(d.sum.newShare, 0)}%`, X, h * 0.22 + h * 0.17);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText(`현행 ${KF.fmt(d.sum.total)}건 중`, X, h * 0.6);
    ctx.fillStyle = "#f0cf73"; ctx.font = `800 ${Math.round(h * 0.1)}px ${SANS}`; ctx.fillText(`${KF.fmt(d.sum.recentShare, 0)}%`, X, h * 0.6 + h * 0.12);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`; ctx.fillText(`${d.buckets[1]}년 뒤 고친 모습`, X, h * 0.6 + h * 0.2);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage), n = d.nyears.length - 1;
    let view = "stock", t0 = performance.now(), tv = t0, hover = null, sel = n - 1, geo = {};
    KF.segment(controls, [{ id: "stock", label: "지금 있는 법령" }, { id: "flow", label: "해마다 입법예고" }], "stock", (id) => { view = id; tv = performance.now(); });
    const range = document.createElement("input"); range.type = "range"; range.min = d.nyears[0]; range.max = d.nyears[n]; range.step = 1; range.value = d.nyears[sel];
    const lab = document.createElement("label"); lab.append("예고 연도", range);
    const out = document.createElement("span"); out.className = "readout"; out.textContent = `${d.nyears[sel]}년`;
    controls.append(lab, out);
    range.oninput = () => { sel = +range.value - d.nyears[0]; out.textContent = `${d.nyears[sel]}년`; if (view !== "flow") { view = "flow"; tv = performance.now(); controls.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === 1))); } };
    const pick = (e, click) => {
      const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top];
      if (click && view === "flow" && geo.pile != null) { sel = geo.pile; range.value = d.nyears[sel]; out.textContent = `${d.nyears[sel]}년`; }
    };
    stage.addEventListener("pointermove", (e) => pick(e, false));
    stage.addEventListener("pointerdown", (e) => pick(e, true));
    stage.addEventListener("pointerleave", () => { hover = null; });
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), el = (now - t0) / 1000, ev = (now - tv) / 1000;
      const deskY = full ? h - 52 : h - 38;
      ctx.drawImage(room(w, h, deskY), 0, 0, w, h);
      geo = {};
      let lines = null;
      if (view === "stock") {
        const fill = KF.ease(KF.clamp((Math.min(el, ev) - 0.2) / 3.6, 0, 1));
        const widths = full ? [168, 150, 134, 108] : [w * 0.24, w * 0.22, w * 0.2, w * 0.16], gap = full ? 28 : (w - 24 - (w * 0.82)) / 3;
        const X = full ? 44 : 12, topY = full ? 92 : 158;
        const S = stacks(ctx, d, X, deskY, topY, widths, gap, fill, hover, full);
        // stack labels
        S.geo.forEach((g, i) => {
          ctx.textAlign = "center"; ctx.fillStyle = TXT; ctx.font = `700 ${full ? 13.5 : 11}px ${SANS}`;
          ctx.globalAlpha = KF.clamp(fill * 1.4 - 0.3, 0, 1);
          ctx.fillText(d.types[i], g.x + g.w / 2, g.top - (full ? 26 : 20));
          ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11.5 : 9.5}px ${MONO}`; ctx.fillText(KF.fmt(d.sum.tcount[i]), g.x + g.w / 2, g.top - (full ? 10 : 7));
          ctx.globalAlpha = 1;
        });
        ctx.textAlign = "left";
        if (full) stockPanel(ctx, w * 0.69, w - 32, 50, d, KF.clamp((el - 0.8) / 0.8, 0, 1));
        else {
          ctx.fillStyle = DIM; ctx.font = `600 11.5px ${SANS}`; ctx.fillText(`현행 법령 ${fdate(d.snap)} · 책 1권 = ${d.book}건`, 12, 22);
          ctx.fillStyle = TXT; ctx.font = `800 24px ${SANS}`; ctx.fillText(`${KF.fmt(d.sum.total)}건`, 12, 50);
          ctx.fillStyle = "#f0cf73"; ctx.font = `700 13px ${SANS}`; ctx.fillText(`${KF.fmt(d.sum.recentShare, 1)}%는 ${d.buckets[1]}년 이후 고친 모습`, 12, 72);
          d.buckets.forEach((b, k) => { const lx = 12 + (k % 3) * (w - 24) / 3, ly = 90 + Math.floor(k / 3) * 16; ctx.fillStyle = AGE[k]; ctx.fillRect(lx, ly - 8, 14, 7); ctx.fillStyle = DIM; ctx.font = `500 10px ${MONO}`; ctx.fillText(b, lx + 18, ly); });
        }
        if (S.hit && hover && fill >= 1) {
          const B = d.books[S.hit.s][S.hit.k];
          lines = [[`${d.types[S.hit.s]} · 책 ${S.hit.k + 1}/${d.books[S.hit.s].length} (${B[0]}건)`, 700],
            [`지금 모습 공포 ${fdate(B[1])}${B[2] !== B[1] ? ` – ${fdate(B[2])}` : ""}`, 500],
            [`예: ${B[4]}${B[0] > 1 ? ` 외 ${B[0] - 1}건` : ""}`, 500, DIM]];
        }
      } else {
        const grow = KF.ease(KF.clamp(ev / 1.4, 0, 1));
        const X0 = full ? 40 : 12, X1 = full ? w * 0.66 : w - 12, topY = full ? 96 : 150;
        const hit = piles(ctx, d, X0, X1, deskY, topY, sel, grow, hover, full);
        geo.pile = hit;
        ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 ${full ? 17 : 14}px ${SANS}`;
        ctx.fillText("해마다 관보에 실린 입법예고", X0, full ? 40 : 24);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11.5 : 10}px ${full ? MONO : SANS}`;
        ctx.fillText(full ? `책 1권 = 공고 ${d.book}건 · 초록 = 제정 · 흰색 = 개정 · 빨강 = 폐지` : `1권 = ${d.book}건 · 초록 제정 · 흰색 개정 · 빨강 폐지`, X0, full ? 62 : 42);
        if (full) flowPanel(ctx, w * 0.69, w - 32, 50, d, sel, 1);
        else {
          const c = d.notices[sel], tot = c.reduce((a, b) => a + b, 0);
          ctx.fillStyle = TXT; ctx.font = `700 14px ${SANS}`; ctx.fillText(`${d.nyears[sel]}년 ${KF.fmt(tot)}건${sel === n ? ` (1–${d.ytd}월)` : ""}`, 12, 70);
          ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.fillText(`제정 ${KF.fmt(c[0])} · 개정 ${KF.fmt(c[1])} · 폐지 ${KF.fmt(c[2])}`, 12, 90);
          ctx.fillStyle = "#7fc79c"; ctx.font = `600 12px ${SANS}`; ctx.fillText(`${d.full[0]}–${d.full[1]}년 제정의 몫 ${KF.fmt(d.sum.newShare, 1)}%`, 12, 110);
        }
        if (hit != null && hover) lines = noticeLines(d, hit);
      }
      if (lines && hover) tip(ctx, w, h, lines, hover);
    });
  }

  VIZ.laws = { thumb, mount, bg: BG };
})();
