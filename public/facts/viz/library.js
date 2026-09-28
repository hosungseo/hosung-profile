// 22 library — "Bookcase". Dark walnut shelves. Every public library is one book: height = 2024 loans (log),
// colour = number of librarians (cold grey = none, warm gilt = many). Re-shelve by loan bracket or by staff;
// small libraries and the whole country are shelved at 1 book = 10 libraries.
(() => {
  const BG = "#3b2a1e";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  const STAFF_COL = ["#5f6468", "#877e6b", "#a98c5b", "#c99b4c", "#e0b24f", "#f4d88e"];
  const STAFF_SHORT = ["0", "≤1", "2–3", "4–6", "7–10", "11+"];
  const GOLD = "#e0b24f", GREY = "#5f6468", GILT = "#ecd49a", INKC = "#2a1a0e";
  const staffBin = (s) => (s <= 0 ? 0 : s <= 1 ? 1 : s <= 3 ? 2 : s <= 6 ? 3 : s <= 10 ? 4 : 5);
  const loanBin = (v) => (v >= 4e5 ? 0 : v >= 2e5 ? 1 : v >= 1e5 ? 2 : v >= 5e4 ? 3 : v >= 1e4 ? 4 : v >= 1 ? 5 : 6);
  const hash = (i) => { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
  const logH = (v) => KF.clamp((Math.log10(Math.max(v, 1)) - 2.5) / 3.5, 0.12, 1);
  const man = (n) => (n >= 1e4 ? `${KF.fmt(n / 1e4, 1)}만` : KF.fmt(n));

  // ------------------------------------------------------------ geometry
  function geom(w, h, mode, n) {
    const full = mode === "full", thumb = mode === "thumb";
    const crown = thumb ? 0 : full ? 50 : 54;
    const plinth = thumb ? 4 : full ? 8 : 30;
    const sp = thumb ? 6 : full ? 16 : 9, pk = thumb ? 13 : full ? 16 : 14;
    const top = crown + 4, bottom = h - plinth;
    const rh = (bottom - top) / n;
    const rows = [];
    for (let i = 0; i < n; i++) {
      const y0 = top + i * rh;
      rows.push({ y0: y0 + (thumb ? 2 : 5), y1: y0 + rh - pk, x0: sp + (thumb ? 3 : 6), x1: w - sp - (thumb ? 3 : 6) });
    }
    return { crown, plinth, sp, pk, rows, full, thumb, mode };
  }

  // ------------------------------------------------------------ layouts: items {key, x, y(bottom), w, h, col, row, flat, frac}
  function flatBook(key, row, k, G, x, col) {
    const t = G.full ? 3.4 : 2.6, len = G.full ? 36 : G.thumb ? 20 : 26;
    return { key, x: x + (hash(key) - 0.5) * 6, y: row.y1 - k * t, w: len, h: t - 0.4, col, flat: true };
  }

  function layoutLoans(d, G) {
    const R = Array.from({ length: 7 }, () => []);
    d.pub.forEach((p, i) => R[loanBin(p[3])].push(i));
    R.forEach((r) => r.sort((a, b) => staffBin(d.pub[b][4]) - staffBin(d.pub[a][4]) || d.pub[b][3] - d.pub[a][3]));
    const maxN = Math.max(...R.map((r) => r.length));
    const bw = (G.rows[0].x1 - G.rows[0].x0) / maxN;
    const items = [];
    R.forEach((r, ri) => {
      const row = G.rows[ri], bs = row.y1 - row.y0;
      let k0 = 0;
      r.forEach((i, k) => {
        const p = d.pub[i], col = STAFF_COL[staffBin(p[4])];
        if (p[3] === 0) items.push({ ...flatBook(i, row, k0++, G, row.x0 + 4, col), row: ri });
        else items.push({ key: i, x: row.x0 + k * bw, y: row.y1, w: bw, h: bs * logH(p[3]), col, row: ri });
      });
    });
    const plates = d.loanBins.map(([lab, n], ri) => ({ row: ri, x: G.rows[ri].x0, text: G.full ? `${lab} · ${KF.fmt(n)}곳 (${Math.round((n / d.pub.length) * 100)}%)` : `${lab} · ${KF.fmt(n)}곳` }));
    // the middle library (rank n/2 by loans) gets the red ribbon
    const mid = items.find((it) => it.key === Math.floor(d.pub.length / 2) - 1);
    const rowEnd = G.rows[mid.row].x0 + R[mid.row].length * bw;
    const ribbons = [{ row: mid.row, x: mid.x + mid.w / 2, top: mid.y - mid.h, note: true, noteX: rowEnd + 16 }];
    return { items, plates, ribbons, rowsBooks: R };
  }

  function layoutStaff(d, G) {
    const R = Array.from({ length: 6 }, () => []);
    d.pub.forEach((p, i) => R[staffBin(p[4])].push(i));
    R.forEach((r) => r.sort((a, b) => d.pub[b][3] - d.pub[a][3]));
    const maxN = Math.max(...R.map((r) => r.length));
    const bw = (G.rows[0].x1 - G.rows[0].x0) / maxN;
    const items = [], ribbons = [];
    R.forEach((r, ri) => {
      const row = G.rows[ri], bs = row.y1 - row.y0;
      let k0 = 0;
      const standing = r.filter((i) => d.pub[i][3] > 0).length;
      r.forEach((i, k) => {
        const p = d.pub[i], col = STAFF_COL[ri];
        if (p[3] === 0) items.push({ ...flatBook(i, row, k0++, G, row.x0 + standing * bw + 6, col), row: ri });
        else items.push({ key: i, x: row.x0 + k * bw, y: row.y1, w: bw, h: bs * logH(p[3]), col, row: ri });
      });
      const med = d.staffBins[ri][2];
      ribbons.push({ row: ri, x: row.x0 + (r.length / 2) * bw, top: row.y1 - bs * logH(med) });
    });
    const plates = d.staffBins.map(([lab, n, med], ri) => ({
      row: ri, x: G.rows[ri].x0,
      text: G.thumb ? `${lab} · ${man(med)}권` : G.full ? `${lab} · ${KF.fmt(n)}곳 · 대출 중앙값 ${KF.fmt(med)}권` : `${lab} · ${KF.fmt(n)}곳 · 중앙값 ${man(med)}권`,
    }));
    return { items, plates, ribbons, rowsBooks: R };
  }

  // grouped shelves: 1 book = `per` libraries, staffed ones first (gold), the rest grey
  function groupBooks(n, staffed, per) {
    const out = [];
    for (let k = 0; k * per < n; k++) {
      const lo = k * per, hi = Math.min(n, lo + per);
      out.push({ size: hi - lo, frac: KF.clamp((staffed - lo) / (hi - lo), 0, 1) });
    }
    return out;
  }

  function layoutSmall(d, G) {
    const per = 10, bins = d.small.bins;
    const books = bins.map(([, , n, s]) => groupBooks(n, s, per));
    const maxN = Math.max(...books.map((b) => b.length));
    const bw = (G.rows[0].x1 - G.rows[0].x0) / maxN;
    const items = [];
    books.forEach((bk, ri) => {
      const row = G.rows[ri], bs = row.y1 - row.y0;
      bk.forEach((b, k) => items.push({ key: `s${ri}-${k}`, x: row.x0 + k * bw, y: row.y1, w: bw * (b.size / per), h: bs * (0.7 + 0.2 * hash(ri * 97 + k)), col: GREY, frac: b.frac, row: ri, grp: ri }));
    });
    const plates = bins.map(([lab, , n, s], ri) => ({ row: ri, x: G.rows[ri].x0, text: G.full ? `${lab} · ${KF.fmt(n)}곳 · 사서 있는 곳 ${KF.fmt((s / n) * 100, 1)}%` : `${lab} · ${KF.fmt(n)}곳 · 사서 ${Math.round((s / n) * 100)}%` }));
    return { items, plates, ribbons: [] };
  }

  function layoutAll(d, G) {
    const per = 10, nRows = G.rows.length;
    const secs = d.all.map(([lab, n, s]) => ({ lab, n, s, books: groupBooks(n, s, per) }));
    const total = secs.reduce((a, s) => a + s.books.length, 0);
    const gap = G.full ? 14 : 8;
    const len = (G.rows[0].x1 - G.rows[0].x0) * nRows - gap * secs.length;
    const bw = len / total;
    const items = [], plates = [];
    let ri = 0, x = G.rows[0].x0;
    secs.forEach((sec, si) => {
      if (x > G.rows[ri].x0) x += gap;
      if (x > G.rows[ri].x1 - bw) { ri++; x = G.rows[ri].x0; }
      plates.push({ row: ri, x, text: G.full ? `${sec.lab} ${KF.fmt(sec.n)}곳 · 사서 있는 곳 ${Math.round((sec.s / sec.n) * 100)}%` : `${sec.lab.slice(0, 2)} ${KF.fmt(sec.n)} · ${Math.round((sec.s / sec.n) * 100)}%`, sec: si });
      sec.books.forEach((b, k) => {
        if (x + bw * 0.5 > G.rows[ri].x1) { ri = Math.min(ri + 1, nRows - 1); x = G.rows[ri].x0; }
        const row = G.rows[ri], bs = row.y1 - row.y0;
        items.push({ key: `a${si}-${k}`, x, y: row.y1, w: bw * (b.size / per), h: bs * (0.7 + 0.2 * hash(si * 131 + k)), col: GREY, frac: b.frac, row: ri, grp: si });
        x += bw;
      });
    });
    return { items, plates, ribbons: [] };
  }

  const withTone = (L) => { L.items.forEach((it) => { it.tone = hash(typeof it.key === "number" ? it.key * 3.7 : it.key.length * 11 + it.x) - 0.5; }); return L; };

  const VIEWS = {
    loans: { rows: () => 7, lay: layoutLoans },
    staff: { rows: () => 6, lay: layoutStaff },
    small: { rows: () => 6, lay: layoutSmall },
    all: { rows: (G) => (G === "full" ? 6 : 7), lay: layoutAll },
  };

  // ------------------------------------------------------------ drawing
  function wall(ctx, w, h, G) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (let x = G.sp + 3; x < w - G.sp; x += 9) { // back-panel grain
      ctx.strokeStyle = `rgba(20,10,4,${0.10 + 0.12 * hash(x)})`;
      ctx.beginPath(); ctx.moveTo(x, 0);
      for (let y = 0; y <= h; y += 40) ctx.lineTo(x + Math.sin(y / 70 + x) * 1.6, y);
      ctx.stroke();
    }
  }

  function book(ctx, it, alpha) {
    const { x, y, w, h } = it;
    if (w <= 0 || h <= 0) return;
    ctx.globalAlpha = alpha;
    const gw = w > 2.2 ? w - 0.7 : w;              // hairline gap between thicker books
    if (it.frac > 0 && it.frac < 1) {               // split book: part staffed
      ctx.fillStyle = GREY; ctx.fillRect(x, y - h, gw, h);
      ctx.fillStyle = GOLD; ctx.fillRect(x, y - h, gw * it.frac, h);
    } else {
      ctx.fillStyle = it.frac === 1 ? GOLD : it.col;
      ctx.fillRect(x, y - h, gw, h);
    }
    const j = it.tone ?? 0;                         // cloth tone variation, same book = same tone
    ctx.fillStyle = j > 0 ? `rgba(255,245,220,${j * 0.12})` : `rgba(15,8,2,${-j * 0.2})`;
    ctx.fillRect(x, y - h, gw, h);
    if (it.flat) { ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(x, y - 0.8, gw, 0.8); }
    else if (gw >= 2.4 && h > 12) {                 // spine bands
      ctx.fillStyle = "rgba(20,10,0,.28)"; ctx.fillRect(x, y - h, 0.8, h);
      ctx.fillStyle = "rgba(255,240,200,.28)"; ctx.fillRect(x, y - h + h * 0.12, gw, 1); ctx.fillRect(x, y - h * 0.16, gw, 1);
    }
    ctx.globalAlpha = 1;
  }

  function planks(ctx, w, h, G) {
    for (const r of G.rows) { // shadow under the board above
      const g = ctx.createLinearGradient(0, r.y0 - 5, 0, r.y0 + 16);
      g.addColorStop(0, "rgba(10,5,2,.55)"); g.addColorStop(1, "rgba(10,5,2,0)");
      ctx.fillStyle = g; ctx.fillRect(G.sp, r.y0 - 5, w - 2 * G.sp, 21);
    }
    for (const r of G.rows) {
      const g = ctx.createLinearGradient(0, r.y1, 0, r.y1 + G.pk);
      g.addColorStop(0, "#94643c"); g.addColorStop(0.2, "#7c522f"); g.addColorStop(1, "#553620");
      ctx.fillStyle = g; ctx.fillRect(0, r.y1, w, G.pk);
      ctx.fillStyle = "rgba(255,220,170,.22)"; ctx.fillRect(0, r.y1, w, 1);
    }
    // side panels
    for (const x of [0, w - G.sp]) {
      const g = ctx.createLinearGradient(x, 0, x + G.sp, 0);
      g.addColorStop(0, "#2a1a0f"); g.addColorStop(0.5, "#3a2515"); g.addColorStop(1, "#1e1209");
      ctx.fillStyle = g; ctx.fillRect(x, G.crown, G.sp, h - G.crown);
    }
    if (G.crown) {
      const g = ctx.createLinearGradient(0, 0, 0, G.crown);
      g.addColorStop(0, "#22160c"); g.addColorStop(1, "#2e1d10");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, G.crown);
      ctx.fillStyle = "#6a4629"; ctx.fillRect(0, G.crown - 2, w, 2);
    }
    if (G.plinth > 6) { ctx.fillStyle = "#24170d"; ctx.fillRect(0, h - G.plinth, w, G.plinth); }
  }

  function plate(ctx, x, y, text, G, xmax) {
    const fs = G.thumb ? 9 : G.full ? 10.5 : 9.5;
    ctx.font = `600 ${fs}px ${SANS}`;
    const tw = ctx.measureText(text).width + (G.thumb ? 8 : 12), ph = G.pk - (G.thumb ? 2 : 4);
    if (xmax) x = Math.min(x, xmax - tw);
    const py = y + (G.pk - ph) / 2;
    const g = ctx.createLinearGradient(0, py, 0, py + ph);
    g.addColorStop(0, "#d8b56a"); g.addColorStop(0.5, "#b9924b"); g.addColorStop(1, "#8d6a31");
    ctx.fillStyle = g; ctx.fillRect(x, py, tw, ph);
    ctx.strokeStyle = "rgba(40,24,8,.8)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, py + 0.5, tw - 1, ph - 1);
    ctx.fillStyle = INKC; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(text, x + (G.thumb ? 4 : 6), py + ph / 2 + 0.5);
    ctx.textBaseline = "alphabetic";
    return tw;
  }

  function ribbon(ctx, rb, G, a, d) {
    const r = G.rows[rb.row], bot = r.y1 + G.pk + (G.thumb ? 2 : 5), rw = G.thumb ? 2 : 2.4;
    ctx.globalAlpha = a;
    ctx.fillStyle = "#c22a1f";
    ctx.fillRect(rb.x - rw / 2, rb.top - 5, rw, bot - rb.top + 5);
    ctx.beginPath(); ctx.moveTo(rb.x - rw, bot); ctx.lineTo(rb.x + rw, bot); ctx.lineTo(rb.x + rw, bot + 5); ctx.lineTo(rb.x, bot + 2.5); ctx.lineTo(rb.x - rw, bot + 5); ctx.closePath(); ctx.fill();
    if (rb.note && G.full && d) {
      const y = (r.y0 + r.y1) / 2 + 6;
      ctx.fillStyle = "#f0dcaa"; ctx.font = `23px 'Nanum Pen Script', cursive`; ctx.textAlign = "left";
      ctx.fillText(`← 한가운데 도서관: 1년 ${KF.fmt(d.pubMedian)}권`, rb.noteX, y);
      ctx.fillStyle = "rgba(240,220,170,.6)"; ctx.font = `500 10px ${MONO}`;
      ctx.fillText(`하루 약 ${KF.fmt(d.pubMedian / 365)}권 · 빨간 끈 = 중앙값`, rb.noteX + 20, y + 16);
    }
    ctx.globalAlpha = 1;
  }

  // brass ruler on the right of the top shelf: where 1천 · 1만 · 10만 · 100만 sit on the log height scale
  function ruler(ctx, G, a) {
    const r = G.rows[0], bs = r.y1 - r.y0, x = r.x1 - 10;
    ctx.globalAlpha = a;
    ctx.fillStyle = "#b9924b"; ctx.fillRect(x, r.y0 - 1, 5, bs + 1);
    ctx.fillStyle = "rgba(40,24,8,.8)"; ctx.fillRect(x + 5, r.y0 - 1, 1, bs + 1);
    ctx.font = `500 9.5px ${MONO}`; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    [[1e3, "1천 권"], [1e4, "1만"], [1e5, "10만"], [1e6, "100만"]].forEach(([v, t]) => {
      const y = r.y1 - bs * logH(v);
      ctx.fillStyle = "#2a1a0e"; ctx.fillRect(x, y, 4, 1);
      ctx.fillStyle = "rgba(240,220,170,.8)"; ctx.fillText(t, x - 4, y);
    });
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.globalAlpha = 1;
  }

  // warm reading-lamp falloff
  function lamp(ctx, w, h) {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.3, Math.min(w, h) * 0.2, w * 0.5, h * 0.45, Math.max(w, h) * 0.8);
    g.addColorStop(0, "rgba(255,200,120,.05)"); g.addColorStop(1, "rgba(0,0,0,.34)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  function legend(ctx, w, G, view, y) {
    ctx.font = `500 ${G.full ? 10.5 : 9.5}px ${MONO}`; ctx.textBaseline = "middle";
    const items = view === "loans" || view === "staff"
      ? STAFF_COL.map((c, i) => [c, STAFF_SHORT[i]])
      : [[GOLD, "사서 있음"], [GREY, "사서 없음"]];
    const head = view === "loans" || view === "staff" ? "사서" : "";
    let widths = items.map(([, t]) => ctx.measureText(t).width + 18);
    const hw = head ? ctx.measureText(head).width + 8 : 0;
    const total = widths.reduce((a, b) => a + b, 0) + hw;
    let x = w - G.sp - 8 - total;
    ctx.fillStyle = "rgba(236,212,154,.75)"; ctx.textAlign = "left";
    if (head) { ctx.fillText(head, x, y); x += hw; }
    items.forEach(([c, t], i) => {
      ctx.fillStyle = c; ctx.fillRect(x, y - 5, 8, 10);
      ctx.fillStyle = "rgba(236,212,154,.85)"; ctx.fillText(t, x + 11, y);
      x += widths[i];
    });
    if (view === "loans" || view === "staff") {
      ctx.textAlign = "right"; ctx.fillStyle = "rgba(236,212,154,.55)";
      if (G.full) ctx.fillText("명", w - G.sp - 2, y);
    }
    ctx.textBaseline = "alphabetic";
  }

  function caption(ctx, w, G, view, d) {
    const nAll = d.all.reduce((a, x) => a + x[1], 0), sAll = d.all.reduce((a, x) => a + x[2], 0);
    const T = {
      loans: [`공공도서관 ${KF.fmt(d.pub.length)}곳 · ${d.year}년 대출 권수로 나눈 칸`, G.full ? "책 1권 = 도서관 1곳 · 책 높이 = 대출 권수(로그 눈금) · 누운 책 = 대출 0권" : "1권 = 1곳 · 높이 = 대출(로그) · 빨간 끈 = 중앙값"],
      staff: ["같은 책을 사서 수로 다시 꽂으면", G.full ? "칸 = 사서 수 · 빨간 끈 = 그 칸의 대출 중앙값 · 책 높이 = 대출 권수(로그)" : "칸 = 사서 수 · 빨간 끈 = 대출 중앙값"],
      small: [`작은도서관 ${KF.fmt(d.small.n)}곳 · 1년 방문자 수로 나눈 칸`, G.full ? "책 1권 = 작은도서관 10곳 · 금색 = 사서 있음 · 회색 = 사서 없음 (대출 기록은 없음)" : "책 1권 = 10곳 · 금색 = 사서 있음"],
      all: [G.full ? `도서관 ${KF.fmt(nAll)}곳 가운데 사서가 있는 곳 ${KF.fmt(sAll)}곳 (${Math.round((sAll / nAll) * 100)}%)` : `도서관 ${KF.fmt(nAll)}곳 · 사서 있는 곳 ${Math.round((sAll / nAll) * 100)}%`, G.full ? "책 1권 = 도서관 10곳 · 공공 → 작은 → 학교 순서로 꽂음" : "책 1권 = 10곳 · 공공→작은→학교"],
    }[view];
    ctx.textAlign = "left"; ctx.fillStyle = GILT;
    ctx.font = `600 ${G.full ? 14 : 12.5}px ${SANS}`; ctx.fillText(T[0], G.sp + 6, G.full ? 22 : 22);
    ctx.fillStyle = "rgba(236,212,154,.62)"; ctx.font = `500 ${G.full ? 10.5 : 10}px ${MONO}`;
    ctx.fillText(T[1], G.sp + 6, G.full ? 39 : 41);
  }

  // library index card as a tooltip
  function card(ctx, w, h, px, py, lines) {
    ctx.font = `600 13px ${SANS}`;
    let bw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${MONO}`;
    for (const l of lines.slice(1)) bw = Math.max(bw, ctx.measureText(l).width);
    bw += 24; const bh = 18 + lines.length * 18;
    const bx = KF.clamp(px + 14, 6, w - bw - 6), by = KF.clamp(py - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(bx + 3, by + 4, bw, bh);
    ctx.fillStyle = "#f3ead3"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(90,120,170,.25)";
    for (let y = by + 29; y < by + bh - 4; y += 18) { ctx.beginPath(); ctx.moveTo(bx + 6, y + 0.5); ctx.lineTo(bx + bw - 6, y + 0.5); ctx.stroke(); }
    ctx.fillStyle = "#b8261d"; ctx.fillRect(bx, by + 24, bw, 1.2);
    lines.forEach((l, i) => {
      ctx.fillStyle = i ? "#3a2c1c" : "#1c120a"; ctx.font = i ? `500 11px ${MONO}` : `600 13px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(l, bx + 12, by + 17 + i * 18 + (i ? 7 : 0));
    });
  }

  // ------------------------------------------------------------ thumb
  let thumbCache = null;
  function thumb(ctx, w, h, t, d) {
    const G = geom(w, h, "thumb", 6);
    if (!thumbCache || thumbCache.w !== w || thumbCache.h !== h) thumbCache = { w, h, L: layoutStaff(d, G) };
    const L = thumbCache.L, c = t % 10;
    wall(ctx, w, h, G);
    const n = L.items.length;
    for (let i = 0; i < n; i++) {
      const it = L.items[i];
      const k = KF.ease(KF.clamp((c - 0.2 - it.row * 0.28 - (i % 97) / 97 * 0.5) / 0.9, 0, 1));
      const out = c > 8.8 ? KF.ease(KF.clamp((c - 8.8) / 1, 0, 1)) : 0;
      if (k <= 0) continue;
      book(ctx, { ...it, y: it.y - (1 - k) * 40 }, k * (1 - out));
    }
    planks(ctx, w, h, G);
    lamp(ctx, w, h);
    const a = KF.clamp((c - 2) / 0.6, 0, 1) * (c > 8.8 ? 1 - KF.clamp((c - 8.8) / 1, 0, 1) : 1);
    if (a > 0) {
      ctx.globalAlpha = a;
      for (const rb of L.ribbons) ribbon(ctx, rb, G, a, null);
      ctx.globalAlpha = a;
      for (const p of L.plates) {
        ctx.font = `600 9px ${SANS}`;
        const tw = ctx.measureText(p.text).width + 8;
        plate(ctx, w - G.sp - 4 - tw, G.rows[p.row].y1, p.text, G);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------ mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let view = "loans", prevView = null, t0 = performance.now(), hover = null;
    let cache = {}, prevPos = new Map();
    const layout = (v, w, h, mode) => {
      const key = `${v}|${w}|${h}|${mode}`;
      if (!cache[key]) {
        const G = geom(w, h, mode, VIEWS[v].rows(mode));
        cache[key] = { G, ...withTone(VIEWS[v].lay(d, G)) };
      }
      return cache[key];
    };
    let lastDrawn = null; // positions actually on screen last frame (for smooth re-shelving)
    const pick = (id) => {
      if (id === view) return;
      prevPos = lastDrawn ? new Map(lastDrawn) : new Map();
      prevView = view; view = id; t0 = performance.now();
    };
    KF.segment(controls, [
      { id: "loans", label: "공공 · 대출 구간" }, { id: "staff", label: "공공 · 사서 수" },
      { id: "small", label: "작은도서관" }, { id: "all", label: "학교까지 전체" },
    ], view, pick);
    const replay = document.createElement("button");
    replay.type = "button"; replay.textContent = "다시 꽂기";
    replay.onclick = () => { prevPos = new Map(); t0 = performance.now(); };
    controls.appendChild(replay);
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    s.onresize = () => { cache = {}; prevPos = new Map(); };

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, mode = full ? "full" : "phone";
      const L = layout(view, w, h, mode), G = L.G;
      const el = (performance.now() - t0) / 1000;
      wall(ctx, w, h, G);
      const n = L.items.length, drawn = new Map();
      let hit = null;
      for (let i = 0; i < n; i++) {
        const it = L.items[i], from = prevPos.get(it.key);
        let cur;
        if (from) { // re-shelve: fly from old spot, staggered
          const k = KF.ease(KF.clamp((el - (i / n) * 0.7) / 1.1, 0, 1));
          cur = { ...it, x: KF.lerp(from.x, it.x, k), y: KF.lerp(from.y, it.y, k), w: KF.lerp(from.w, it.w, k), h: KF.lerp(from.h, it.h, k) };
          cur.col = k < 0.5 ? from.col : it.col;
          book(ctx, cur, 1);
        } else {   // drop in shelf by shelf
          const k = KF.ease(KF.clamp((el - 0.1 - it.row * 0.22 - ((i * 7919) % n) / n * 0.6) / 0.8, 0, 1));
          if (k <= 0) continue;
          cur = { ...it, y: it.y - (1 - k) * 60 };
          book(ctx, cur, k);
        }
        drawn.set(it.key, cur);
        if (hover && full) {
          const r = G.rows[it.row];
          if (hover[1] >= r.y0 - 4 && hover[1] <= r.y1 + G.pk && hover[0] >= cur.x - 0.5 && hover[0] < cur.x + Math.max(cur.w, 1) + 0.5) hit = it;
        }
      }
      lastDrawn = drawn;
      planks(ctx, w, h, G);
      lamp(ctx, w, h);
      const settle = prevPos.size ? 1.9 : 2.5;
      const pa = KF.clamp((el - settle) / 0.5, 0, 1);
      if (pa > 0) {
        for (const rb of L.ribbons) ribbon(ctx, rb, G, pa, d);
        if (full && (view === "loans" || view === "staff")) ruler(ctx, G, pa);
        ctx.globalAlpha = pa;
        for (const p of L.plates) plate(ctx, p.x, G.rows[p.row].y1, p.text, G, G.rows[p.row].x1);
        ctx.globalAlpha = 1;
      }
      caption(ctx, w, G, view, d);
      if (full) legend(ctx, w, G, view, 22);
      else legend(ctx, w, G, view, h - G.plinth / 2);
      if (hit && pa >= 1) {
        let lines;
        if (typeof hit.key === "number") {
          const p = d.pub[hit.key];
          lines = [p[0], `${d.sido[p[1]]} ${p[2]}`, `대출 ${KF.fmt(p[3])}권`, `사서 ${KF.fmt(p[4], p[4] % 1 ? 1 : 0)}명 · 장서 ${KF.fmt(p[5])}권`];
        } else if (view === "small") {
          const [lab, rng, nn, st] = d.small.bins[hit.grp];
          lines = [`작은도서관 · ${lab}`, `${rng}`, `${KF.fmt(nn)}곳 중 사서 있는 곳 ${KF.fmt(st)}곳`, `(${KF.fmt((st / nn) * 100, 1)}%) · 책 1권 = 10곳`];
        } else {
          const [lab, nn, st] = d.all[hit.grp];
          lines = [lab, `${KF.fmt(nn)}곳 중 사서 있는 곳 ${KF.fmt(st)}곳`, `(${KF.fmt((st / nn) * 100, 1)}%) · 책 1권 = 10곳`];
          if (hit.grp === 2) lines.push(...d.school.levels.map(([l, a, b]) => `${l} ${KF.fmt(a)}곳 · 사서 ${Math.round((b / a) * 100)}%`));
        }
        const r = G.rows[hit.row];
        ctx.strokeStyle = "rgba(255,236,190,.9)"; ctx.lineWidth = 1;
        const c = drawn.get(hit.key);
        ctx.strokeRect(c.x - 1, c.y - c.h - 1, Math.max(c.w, 1) + 2, c.h + 2);
        card(ctx, w, h, hover[0], Math.min(hover[1], r.y1 - 10), lines);
      }
    });
  }

  VIZ.library = { thumb, mount, bg: BG };
})();
