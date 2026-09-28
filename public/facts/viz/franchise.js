// 38 franchise — "사슬". A pegboard in a hardware shop: one hook per industry, one chain per hook. One link = 1,000
// franchise stores; the link's metal says how big the brand that store belongs to is (bright nickel = brands with
// 1,000+ stores ... black iron = brands with fewer than 10). Links on the floor tray = stores whose franchise
// contract ended or was cancelled that year; open rings on the hook = brands with no store at all (1 ring = 100).
// Second view: every brand of four industries as its own strand, on a 1–10–100–1,000 ruler.
(() => {
  const BG = "#8f7456";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const METAL = ["#3d3833", "#d19a5b", "#a3abb0", "#f4f1e8"];   // 1–9 · 10–99 · 100–999 · 1,000+ (brand size class)
  const RUST = "#b8412a", RING = "#e8dcc4", INK = "#241c14", INK2 = "rgba(36,28,20,.68)", TAG = "#efe3c8", LEDGE = "#5e4a35";
  const SHORT = { "운송": "운송(택시)", "교육 (외국어)": "외국어 교육", "교육 (교과)": "교과 교육", "기타 외식": "기타 외식", "기타도소매": "기타 소매", "기타 서비스": "기타 서비스", "그 밖": "그 밖" };
  const nm = (k) => SHORT[k] || k.trim();
  const UNIT = 1000;

  // pegboard with holes (cached per size)
  let PB = null;
  function pegboard(w, h) {
    const key = `${w}x${h}`;
    if (PB && PB.key === key) return PB.c;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    g.fillStyle = BG; g.fillRect(0, 0, w, h);
    const grd = g.createRadialGradient(w * 0.35, h * 0.3, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    grd.addColorStop(0, "rgba(255,240,215,.10)"); grd.addColorStop(1, "rgba(0,0,0,.18)");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const step = w > 520 ? 19 : 16;
    for (let y = step / 2; y < h; y += step) for (let x = step / 2; x < w; x += step) {
      g.fillStyle = "rgba(40,28,16,.55)"; g.beginPath(); g.arc(x, y, 1.9, 0, 7); g.fill();
      g.fillStyle = "rgba(255,235,205,.12)"; g.beginPath(); g.arc(x + 0.6, y + 0.9, 1.9, 0, Math.PI); g.fill();
    }
    PB = { key, c };
    return c;
  }

  // one oval link, alternating face-on / edge-on like a real chain
  function link(ctx, x, y, lw, lh, col, edge) {
    if (edge) { ctx.fillStyle = col; ctx.fillRect(x - 1.2, y - lh * 0.62, 2.4, lh * 1.24); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(x + 0.6, y - lh * 0.62, 0.8, lh * 1.24); return; }
    ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.ellipse(x, y, lw / 2, lh * 0.72, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 2.1; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(x - 0.6, y - 0.6, lw / 2 - 0.8, lh * 0.72 - 0.8, 0, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
  }
  function broken(ctx, x, y, lw, lh, rot) { // an open link lying on the tray
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, lh * 0.72, lw / 2, 0, 0.5, Math.PI * 2 - 0.5); ctx.stroke();
    ctx.strokeStyle = RUST; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  function ring(ctx, x, y, r) {
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.strokeStyle = RING; ctx.lineWidth = 1.3; ctx.stroke();
  }

  function layout(w, h, mode, n) {
    const full = mode === "full", thumb = mode === "thumb";
    const x0 = full ? 22 : thumb ? 10 : 8, x1 = w - (full ? 252 : thumb ? w * 0.42 : 8);
    const rail = full ? 64 : thumb ? 42 : 44, tray = full ? h - 50 : thumb ? h - 54 : Math.round(h * 0.66);
    const pitch = (x1 - x0) / n;
    return { full, thumb, mode, x0, x1, rail, tray, pitch, cx: (i) => x0 + pitch * (i + 0.5), n };
  }

  // chain geometry for one industry in one year: links (by size class, biggest first), broken links, rings
  function chainOf(Y, i) {
    const st = Y.stores[i], links = [];
    for (let c = 3; c >= 0; c--) { const k = st[c] / UNIT; links.push([c, k]); }
    return { links, total: st.reduce((a, b) => a + b, 0), broken: Y.closed[i] / UNIT, rings: Y.zero[i] / 100 };
  }

  function drawChains(ctx, L, d, yi, prog, hot) {
    const Y = d.y[yi], n = L.n, lw = L.full ? 11 : L.thumb ? 7 : 6.5;
    const maxLinks = Math.max(...d.y.map((yy) => Math.max(...yy.stores.slice(0, n).map((s) => s.reduce((a, b) => a + b, 0))))) / UNIT;
    const lh = Math.min(L.full ? 8.4 : 7, (L.tray - L.rail - (L.full ? 40 : 26)) / (maxLinks + 1));
    // rail
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(L.x0 - 6, L.rail + 3, L.x1 - L.x0 + 12, 5);
    const gr = ctx.createLinearGradient(0, L.rail - 4, 0, L.rail + 4); gr.addColorStop(0, "#e6e8e8"); gr.addColorStop(1, "#8b9194");
    ctx.fillStyle = gr; ctx.fillRect(L.x0 - 6, L.rail - 3, L.x1 - L.x0 + 12, 6);
    // tray on the floor
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(L.x0 - 6, L.tray + 4, L.x1 - L.x0 + 12, 6);
    ctx.fillStyle = LEDGE; ctx.fillRect(L.x0 - 6, L.tray, L.x1 - L.x0 + 12, 5);
    const geo = [];
    for (let i = 0; i < n; i++) {
      const cx = L.cx(i), ch = chainOf(Y, i), dim = hot !== null && hot !== i ? 0.35 : 1;
      ctx.globalAlpha = dim;
      // hook
      ctx.strokeStyle = "#d6d9da"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, L.rail); ctx.lineTo(cx, L.rail + 7); ctx.arc(cx + 3, L.rail + 7, 3, Math.PI, 0.2, true); ctx.stroke();
      // links, biggest brands first; the last link of a class may be partial (drawn thinner)
      let y = L.rail + 12, k = 0;
      const total = ch.total / UNIT, shown = total * prog;
      for (const [c, cnt] of ch.links) {
        let left = cnt;
        while (left > 0.02 && k < shown) {
          const part = Math.min(1, left);
          if (part >= 0.5) link(ctx, cx, y, lw, lh, METAL[c], k % 2 === 1);
          else { ctx.fillStyle = METAL[c]; ctx.beginPath(); ctx.arc(cx, y, lw * 0.28, 0, 7); ctx.fill(); }
          y += lh; left -= 1; k++;
        }
      }
      const endY = y;
      // rings: brands with no store, beside the hook
      const nr = Math.round(ch.rings * prog), rr = L.full ? 3.2 : 2.2;
      for (let r = 0; r < nr; r++) {
        const col = Math.floor(r / (L.full ? 10 : 8)), row = r % (L.full ? 10 : 8);
        ring(ctx, cx + lw * 0.9 + 5 + col * (rr * 2 + 2), L.rail + 12 + row * (rr * 2 + 1.5), rr);
      }
      // broken links: on the tray, piled 3 wide
      const nb = ch.broken * KF.clamp((prog - 0.6) / 0.4, 0, 1), nbw = Math.floor(nb);
      for (let b = 0; b < Math.ceil(nb - 0.05); b++) {
        const row = Math.floor(b / 3), col = b % 3, part = b >= nbw;
        ctx.globalAlpha = dim * (part ? 0.55 : 1);
        broken(ctx, cx + (col - 1) * (lw + 2), L.tray - 4 - row * (lw * 0.62), lw, lh, (b * 1.7) % 1 - 0.5);
      }
      ctx.globalAlpha = 1;
      geo.push({ i, cx, y0: L.rail, y1: Math.max(endY, L.rail + 30), total: ch.total });
    }
    return { geo, lh, lw };
  }

  function tags(ctx, L, d, hot) {
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let i = 0; i < L.n; i++) {
      const cx = L.cx(i), t = nm(d.ind[i]);
      ctx.font = `${hot === i ? 700 : 600} ${L.full ? 11.5 : 9}px ${SANS}`;
      const tw = Math.min(L.pitch - 4, ctx.measureText(t).width + 10), th = L.full ? 20 : 15, ty = L.rail - (L.full ? 30 : 22);
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(cx - tw / 2 + 1.5, ty + 2, tw, th);
      ctx.fillStyle = hot === i ? "#fff8e6" : TAG; ctx.fillRect(cx - tw / 2, ty, tw, th);
      ctx.fillStyle = INK; ctx.fillText(t, cx, ty + th / 2 + 0.5, L.pitch - 8);
    }
    ctx.textBaseline = "alphabetic";
  }

  function card(ctx, w, h, d, yi, a) { // the shop's price card on the right
    const x0 = w - 236, y0 = 16, bw = 222, bh = h - 32, px = x0 + 14, pr = x0 + bw - 14, Y = d.y[yi];
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(x0 + 4, y0 + 5, bw, bh);
    ctx.fillStyle = TAG; ctx.fillRect(x0, y0, bw, bh);
    ctx.fillStyle = "#c9b48c"; ctx.beginPath(); ctx.arc(x0 + bw / 2, y0 + 12, 4.5, 0, 7); ctx.fill();
    const brands = Y.brands.reduce((a, b) => a + b, 0), zero = Y.zero.reduce((a, b) => a + b, 0);
    const stores = Y.stores.reduce((a, s) => a + s.reduce((x, z) => x + z, 0), 0), nw = Y.new.reduce((a, b) => a + b, 0), cl = Y.closed.reduce((a, b) => a + b, 0);
    ctx.textAlign = "left"; ctx.fillStyle = INK2; ctx.font = `500 10.5px ${MONO}`; ctx.fillText(`공정위 가맹정보 · ${d.years[yi]}`, px, y0 + 34);
    ctx.fillStyle = INK; ctx.font = `700 22px ${MONO}`; ctx.fillText(KF.fmt(brands), px, y0 + 62);
    ctx.font = `600 12px ${SANS}`; ctx.fillText("브랜드", px + ctx.measureText(KF.fmt(brands)).width + 60, y0 + 61);
    ctx.font = `700 22px ${MONO}`; ctx.fillText(KF.fmt(stores), px, y0 + 90);
    ctx.font = `600 12px ${SANS}`; ctx.fillText("가맹점", px + ctx.measureText(KF.fmt(stores)).width + 60, y0 + 89);
    let y = y0 + 118;
    ctx.fillStyle = INK2; ctx.font = `500 11px ${SANS}`; ctx.fillText(`가맹점 0곳 브랜드 ${KF.fmt(zero)}개 (${((zero / brands) * 100).toFixed(0)}%)`, px, y);
    y += 18; ctx.fillText(`새로 연 가맹점 ${KF.fmt(nw)}곳`, px, y);
    y += 18; ctx.fillText(`계약 종료·해지 ${KF.fmt(cl)}곳 (100곳당 ${((cl / stores) * 100).toFixed(1)})`, px, y);
    // legend
    y += 30; ctx.fillStyle = INK; ctx.font = `700 11.5px ${SANS}`; ctx.fillText("고리 1개 = 가맹점 1,000곳", px, y);
    y += 8;
    const cls = ["브랜드 가맹점 1,000곳 이상", "브랜드 가맹점 100–999곳", "브랜드 가맹점 10–99곳", "브랜드 가맹점 1–9곳"];
    [3, 2, 1, 0].forEach((c, j) => {
      const yy = y + 12 + j * 19;
      link(ctx, px + 7, yy, 10, 7, METAL[c], false);
      ctx.fillStyle = INK; ctx.font = `500 11px ${SANS}`; ctx.fillText(cls[j], px + 20, yy + 4);
    });
    y += 12 + 4 * 19 + 6;
    broken(ctx, px + 7, y, 10, 7, 0.3); ctx.fillStyle = INK; ctx.fillText("떨어진 고리 = 계약 종료·해지 1,000곳", px + 20, y + 4);
    y += 20; ring(ctx, px + 7, y, 3.4); ctx.fillStyle = INK; ctx.fillText("빈 고리 = 가맹점 없는 브랜드 100개", px + 20, y + 4);
    // churn by industry: contract ended or cancelled per 100 stores
    y += 30; ctx.fillStyle = INK; ctx.font = `700 11.5px ${SANS}`; ctx.fillText("가맹점 100곳당 종료·해지", px, y);
    const K = d.ind.length - 1, rates = [];
    for (let i = 0; i < K; i++) { const tot = Y.stores[i].reduce((a, b) => a + b, 0); rates.push([i, tot ? (Y.closed[i] / tot) * 100 : 0]); }
    rates.sort((a, b) => b[1] - a[1]);
    const rmax = Math.max(...rates.map((r) => r[1])), rh = Math.min(13, (y0 + bh - 30 - y) / K);
    rates.forEach(([i, v], j) => {
      const yy = y + 8 + j * rh, bx = px + 62, bwid = ((pr - 34 - bx) * v) / rmax;
      ctx.fillStyle = INK2; ctx.font = `500 ${rh < 12 ? 9 : 10}px ${SANS}`; ctx.textAlign = "right"; ctx.fillText(nm(d.ind[i]), bx - 5, yy + rh * 0.72);
      ctx.fillStyle = RUST; ctx.fillRect(bx, yy + 2, bwid, rh - 4);
      ctx.fillStyle = INK; ctx.font = `500 ${rh < 12 ? 9 : 10}px ${MONO}`; ctx.textAlign = "left"; ctx.fillText(v.toFixed(1), bx + bwid + 4, yy + rh * 0.72);
    });
    ctx.textAlign = "left";
    const rest = K, rt = Y.stores[rest].reduce((a, b) => a + b, 0);
    ctx.fillStyle = INK2; ctx.font = `500 9.5px ${SANS}`; ctx.fillText(`그림 밖 그 밖 업종: 브랜드 ${KF.fmt(Y.brands[rest])} · 가맹점 ${KF.fmt(rt)}`, px, y0 + bh - 12);
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ view 2: every brand a strand, log ruler
  function fringe(ctx, w, h, d, prog, hover, full) {
    const names = Object.keys(d.fringe), n = names.length;
    const x0 = full ? 70 : 38, x1 = w - (full ? 24 : 10), top = full ? 70 : 60, bot = full ? h - 64 : h - 120;
    const colW = (x1 - x0) / n, lg = (v) => (v > 0 ? Math.log10(v) + 0.3 : 0), maxL = lg(20000);
    const Y = (v) => top + ((bot - top) * lg(v)) / maxL;
    ctx.textAlign = "left"; ctx.fillStyle = "#fff5e6"; ctx.font = `700 ${full ? 14 : 12.5}px ${SANS}`;
    ctx.fillText("브랜드마다 사슬 하나 · 길이 = 가맹점 수 (눈금은 10배씩)", full ? 18 : 10, full ? 30 : 24);
    // ruler
    ctx.font = `500 ${full ? 10 : 8.5}px ${MONO}`; ctx.textAlign = "right";
    [1, 10, 100, 1000, 10000].forEach((v) => {
      const y = Y(v); ctx.strokeStyle = "rgba(255,245,230,.22)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 - 4, y + 0.5); ctx.lineTo(x1, y + 0.5); ctx.stroke();
      ctx.fillStyle = "rgba(255,245,230,.8)"; ctx.fillText(v >= 10000 ? `${v / 10000}만` : KF.fmt(v), x0 - 8, y + 3);
    });
    let hit = null;
    names.forEach((k, j) => {
      const F = d.fringe[k], m = F.n.length, cx0 = x0 + j * colW + 8, cw = colW - 16, sp = cw / m;
      // rail for this industry
      ctx.fillStyle = "#c9ced1"; ctx.fillRect(cx0 - 3, top - 8, cw + 6, 4);
      ctx.textAlign = "center"; ctx.fillStyle = "#fff5e6"; ctx.font = `700 ${full ? 12.5 : 10.5}px ${SANS}`;
      ctx.fillText(nm(k), cx0 + cw / 2, top - 16);
      const zero = F.n.filter((v) => v === 0).length;
      for (let b = 0; b < m; b++) {
        const v = F.n[b]; if (!v) continue;
        const x = cx0 + b * sp + sp / 2, yEnd = top + (Y(v) - top) * prog;
        const cls = v >= 1000 ? 3 : v >= 100 ? 2 : v >= 10 ? 1 : 0;
        ctx.strokeStyle = METAL[cls]; ctx.lineWidth = Math.max(0.6, Math.min(3, sp * 0.8)); ctx.globalAlpha = sp < 1 ? 0.55 : 1;
        if (sp >= 4) ctx.setLineDash([3, 1.5]);
        ctx.beginPath(); ctx.moveTo(x, top - 4); ctx.lineTo(x, yEnd); ctx.stroke(); ctx.setLineDash([]);
        if (F.shrink[b] && prog >= 1) { ctx.fillStyle = RUST; ctx.globalAlpha = sp < 1 ? 0.6 : 1; ctx.fillRect(x - Math.max(0.6, sp * 0.4), yEnd - 2, Math.max(1.2, sp * 0.8), 3); }
        ctx.globalAlpha = 1;
      }
      // zero-store brands: a stretch of empty rail, bracketed
      if (zero) {
        const zx0 = cx0 + (m - zero) * sp, zx1 = cx0 + m * sp;
        ctx.strokeStyle = RING; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(zx0, top + 4); ctx.lineTo(zx0, top + 9); ctx.lineTo(zx1, top + 9); ctx.lineTo(zx1, top + 4); ctx.stroke();
        ctx.fillStyle = RING; ctx.font = `600 ${full ? 10.5 : 9}px ${SANS}`; ctx.textAlign = "center";
        if (zx1 - zx0 > 26) ctx.fillText(`0곳 ${((zero / m) * 100).toFixed(0)}%`, (zx0 + zx1) / 2, top + 22);
      }
      const med = F.n[Math.floor(m / 2)];
      ctx.fillStyle = "#fff5e6"; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`; ctx.textAlign = "center";
      ctx.fillText(`브랜드 ${KF.fmt(m)}개`, cx0 + cw / 2, bot + 20);
      ctx.fillText(`중간값 ${KF.fmt(med)}곳`, cx0 + cw / 2, bot + 36);
      if (hover && hover[0] >= cx0 && hover[0] < cx0 + cw && hover[1] > top - 20 && hover[1] < bot + 40) {
        const b = KF.clamp(Math.floor((hover[0] - cx0) / sp), 0, m - 1);
        hit = { k, b, v: F.n[b], m, shrink: F.shrink[b], x: cx0 + b * sp + sp / 2 };
      }
    });
    if (hit) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hit.x, top - 4); ctx.lineTo(hit.x, Math.max(top + 4, Y(hit.v))); ctx.stroke(); }
    ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,245,230,.85)"; ctx.font = `500 ${full ? 10.5 : 9.5}px ${SANS}`;
    ctx.fillText(full ? "왼쪽부터 가맹점이 많은 브랜드 순 · 빨간 끝 = 그해 새로 연 곳보다 빠진 곳이 많은 브랜드 · 오른쪽 빈 레일 = 가맹점 0곳"
      : "빨간 끝 = 그해 연 곳보다 빠진 곳이 많은 브랜드", full ? 18 : 10, h - (full ? 14 : 34));
    return hit;
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `600 12.5px ${SANS}`;
    let bw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${SANS}`;
    lines.slice(1).forEach((l) => { bw = Math.max(bw, ctx.measureText(l).width); });
    bw += 22;
    const bh = 12 + lines.length * 17, bx = KF.clamp(x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 12, 6, h - bh - 6);
    ctx.fillStyle = "rgba(252,248,238,.98)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = RUST; ctx.fillRect(bx, by, 3, bh);
    lines.forEach((l, i) => { ctx.fillStyle = i ? INK : "#000"; ctx.font = i ? `500 11px ${SANS}` : `600 12.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(l, bx + 11, by + 18 + i * 17); });
  }

  const man = (chun) => { const m = Math.round(chun / 10), e = Math.floor(m / 10000), r = m % 10000; return e ? (r ? `${e}억 ${KF.fmt(r)}만 원` : `${e}억 원`) : `${KF.fmt(r)}만 원`; };

  // ------------------------------------------------------------------ thumb
  function thumb(ctx, w, h, t, d) {
    const c = t % 10, yi = d.years.length - 1;
    ctx.drawImage(pegboard(w, h), 0, 0, w, h);
    const L = layout(w, h, "thumb", 8);
    drawChains(ctx, L, { ...d, y: [{ ...d.y[yi], stores: d.y[yi].stores.slice(0, 8), closed: d.y[yi].closed.slice(0, 8), zero: d.y[yi].zero.slice(0, 8) }], ind: d.ind.slice(0, 8) }, 0, KF.clamp((c - 0.2) / 2.2, 0, 1), null);
    const N = d.nat, a = KF.clamp((c - 2.2) / 0.6, 0, 1);
    // a price tag hung on the board carries the numbers
    const tx0 = w * 0.6, tw = w - tx0 - 10, ty0 = h * 0.12, th = h * 0.7, X = tx0 + tw - 12;
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(tx0 + 3, ty0 + 4, tw, th);
    ctx.fillStyle = TAG; ctx.fillRect(tx0, ty0, tw, th);
    ctx.fillStyle = "#c9b48c"; ctx.beginPath(); ctx.arc(tx0 + tw / 2, ty0 + 8, 3, 0, 7); ctx.fill();
    ctx.textAlign = "right"; ctx.fillStyle = INK2; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText("프랜차이즈 브랜드 중", X, ty0 + th * 0.24);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.17)}px ${MONO}`; ctx.fillText(`${Math.round((N.under10 / N.brands) * 100)}%`, X, ty0 + th * 0.55);
    ctx.fillStyle = INK2; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText("가맹점 10곳 미만", X, ty0 + th * 0.72);
    ctx.fillStyle = RUST; ctx.fillText(`0곳인 브랜드 ${Math.round((N.zero / N.brands) * 100)}%`, X, ty0 + th * 0.88);
    ctx.globalAlpha = 1;
    if (c > 9.4) { ctx.fillStyle = BG; ctx.globalAlpha = (c - 9.4) / 0.6; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage), last = d.years.length - 1;
    let view = "ind", yi = last, t0 = performance.now(), tv = performance.now(), hover = null;
    KF.segment(controls, [{ id: "ind", label: "업종별 사슬" }, { id: "brand", label: "브랜드마다 한 줄" }], "ind", (id) => { view = id; tv = performance.now(); });
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = last; range.step = 1; range.value = last;
    const lab = document.createElement("label"), out = document.createElement("span");
    out.className = "readout"; out.textContent = String(d.years[last]);
    lab.append("연도", range, out);
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 걸기";
    replay.onclick = () => { t0 = tv = performance.now(); };
    controls.append(lab, replay);
    range.oninput = () => { yi = +range.value; out.textContent = String(d.years[yi]); t0 = performance.now() - 60000; };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now();
      ctx.drawImage(pegboard(w, h), 0, 0, w, h);
      if (view === "brand") {
        const hit = fringe(ctx, w, h, d, KF.ease(KF.clamp((now - tv) / 1000 / 1.6, 0, 1)), hover, full);
        if (hit && hover) tip(ctx, w, h, hover[0], hover[1], [`${nm(hit.k)} · 가맹점이 ${hit.b + 1}번째로 많은 브랜드`, `가맹점 ${KF.fmt(hit.v)}곳 (브랜드 ${KF.fmt(hit.m)}개 중)`, hit.shrink ? "그해 새로 연 곳보다 빠진 곳이 많음" : "그해 빠진 곳이 새로 연 곳보다 많지 않음"]);
        return;
      }
      const L = layout(w, h, full ? "full" : "phone", full ? d.ind.length - 1 : 8), el = (now - t0) / 1000;
      let hot = null;
      if (hover && hover[0] >= L.x0 && hover[0] <= L.x1 && hover[1] >= L.rail - 36 && hover[1] <= L.tray + 12) hot = KF.clamp(Math.floor((hover[0] - L.x0) / L.pitch), 0, L.n - 1);
      const G = drawChains(ctx, L, d, yi, KF.ease(KF.clamp((el - 0.2) / 2.6, 0, 1)), el > 3 ? hot : null);
      tags(ctx, L, d, hot);
      if (full) card(ctx, w, h, d, yi, KF.clamp((el - 2.2) / 0.8, 0, 1));
      else { // phone notes under the tray
        const Y = d.y[yi], brands = Y.brands.reduce((a, b) => a + b, 0), zero = Y.zero.reduce((a, b) => a + b, 0);
        const stores = Y.stores.reduce((a, s2) => a + s2.reduce((x, z) => x + z, 0), 0), cl = Y.closed.reduce((a, b) => a + b, 0);
        let y = L.tray + 30;
        ctx.textAlign = "left"; ctx.fillStyle = "#fff5e6"; ctx.font = `700 14px ${SANS}`;
        ctx.fillText(`${d.years[yi]} · 브랜드 ${KF.fmt(brands)} · 가맹점 ${KF.fmt(stores)}`, 12, y);
        ctx.font = `500 11.5px ${SANS}`; ctx.fillStyle = "rgba(255,245,230,.9)";
        ctx.fillText(`가맹점 0곳 브랜드 ${((zero / brands) * 100).toFixed(0)}% · 계약 종료·해지 ${KF.fmt(cl)}곳`, 12, y + 20);
        ctx.fillText("고리 1개 = 가맹점 1,000곳 · 떨어진 고리 = 종료·해지", 12, y + 38);
        [[3, "1,000곳+ 브랜드"], [2, "100–999"], [1, "10–99"], [0, "1–9"]].forEach(([c, t], j) => {
          const x = 12 + j * 86; link(ctx, x + 5, y + 58, 8, 6, METAL[c], false);
          ctx.fillStyle = "rgba(255,245,230,.9)"; ctx.font = `500 10px ${SANS}`; ctx.fillText(t, x + 14, y + 62);
        });
      }
      if (hot !== null && hover && el > 3) {
        const Y = d.y[yi], i = hot, st = Y.stores[i], tot = st.reduce((a, b) => a + b, 0);
        const lines = [`${nm(d.ind[i])} · ${d.years[yi]}`, `브랜드 ${KF.fmt(Y.brands[i])}개 (가맹점 0곳 ${KF.fmt(Y.zero[i])}개)`, `가맹점 ${KF.fmt(tot)}곳 · 브랜드당 ${(tot / Y.brands[i]).toFixed(1)}곳`,
          `새로 연 곳 ${KF.fmt(Y.new[i])} · 종료·해지 ${KF.fmt(Y.closed[i])} (100곳당 ${tot ? ((Y.closed[i] / tot) * 100).toFixed(1) : 0})`];
        if (Y.cost[i]) lines.push(`창업비 중간값 ${man(Y.cost[i])}`);
        if (Y.sales[i]) lines.push(`가맹점 평균 매출 ${man(Y.sales[i])} (한 해)`);
        tip(ctx, w, h, hover[0], hover[1], lines);
      }
    });
  }

  VIZ.franchise = { thumb, mount, bg: BG };
})();
