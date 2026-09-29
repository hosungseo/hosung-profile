// 88 disaster-text — "잠금화면 알림 더미". Six phones, one per year (2021-2026): 부산 북구가 실제로 보낸 재난문자가
// 화면에 쌓인다, 색은 종류. 1위 색이 해마다 바뀐다(2021 감염병 → 2022 태풍 → 2024 폭염 → 2025 호우). A dashed
// "지난 기록" panel on the side holds the 2020-2023 부산시 전체(코로나 시기) contrast: 79% 감염병, for scale.
(() => {
  const BG = "#141233";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#eef0ff", MUTE = "rgba(238,240,255,.62)", FAINT = "rgba(238,240,255,.14)";
  const GLOW = "#3d3a7a", SCREEN = "#0b0a20", NOTCH = "#050418";
  const KCOL = { 감염병: "#ff5d73", 태풍: "#9b7fe0", "호우·홍수": "#4fb0e0", 폭염: "#ff9a4a", 기타기상: "#5fd0c0", "산불·산사태": "#e0703a", "사고·통제": "#e8c95a", 기타: "#8f8fd4" };

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const exByKind = new Map();
    for (const k of d.kinds) exByKind.set(k, d.examples.filter((e) => e.kind === k));
    const perYear = d.buk.years.map((y, yi) => {
      const rows = d.kinds.map((k) => ({ kind: k, n: d.buk.kind_year[k][yi] })).filter((r) => r.n > 0);
      return { y, rows, total: d.buk.year_n[String(y)] ?? d.buk.year_n[y] };
    });
    const maxTotal = Math.max(...perYear.map((p) => p.total));
    return (DEC = { years: d.buk.years, kinds: d.kinds, perYear, maxTotal, buk: d.buk, city: d.city, exByKind });
  }

  function roundRectPath(p, x, y, w, h, r) {
    p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r);
    p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath();
  }

  function phone(ctx, x0, y0, w, h) {
    const r = w * 0.14;
    ctx.fillStyle = "#1b1840"; ctx.strokeStyle = "rgba(238,240,255,.28)"; ctx.lineWidth = 2;
    const body = new Path2D(); roundRectPath(body, x0, y0, w, h, r);
    ctx.fill(body); ctx.stroke(body);
    const pad = w * 0.055;
    const screen = { x: x0 + pad, y: y0 + pad * 1.6, w: w - pad * 2, h: h - pad * 2.8 };
    ctx.fillStyle = SCREEN;
    const sp = new Path2D(); roundRectPath(sp, screen.x, screen.y, screen.w, screen.h, r * 0.6);
    ctx.fill(sp);
    ctx.fillStyle = NOTCH;
    ctx.beginPath(); ctx.ellipse(x0 + w / 2, y0 + pad * 0.9, w * 0.09, pad * 0.32, 0, 0, 7); ctx.fill();
    return screen;
  }

  function notifications(ctx, screen, rows, cap, el, hover, small) {
    const tot = rows.reduce((a, b) => a + b.n, 0) || 1;
    const bh = Math.max(small ? 5 : 7, Math.min(small ? 11 : 16, (screen.h - 6) / cap)), gap = Math.max(1, bh * 0.16);
    let i = 0, hit = null;
    ctx.save();
    const clip = new Path2D(); roundRectPath(clip, screen.x, screen.y, screen.w, screen.h, 4); ctx.clip(clip);
    outer: for (const r of rows) {
      const nSlots = Math.max(1, Math.round((r.n / tot) * cap));
      for (let k = 0; k < nSlots; k++) {
        const y = screen.y + 3 + i * (bh + gap);
        if (y > screen.y + screen.h) break outer;
        const grow = KF.clamp(el * cap * 1.15 - i, 0, 1);
        if (grow <= 0) { i++; continue; }
        const x = screen.x + 3, w = screen.w - 6;
        ctx.globalAlpha = 0.94 * grow;
        ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fillRect(x, y, w, bh * grow);
        ctx.fillStyle = KCOL[r.kind]; ctx.fillRect(x, y, Math.max(2, w * 0.045), bh * grow);
        ctx.globalAlpha = 1;
        if (hover && hover[0] >= screen.x && hover[0] <= screen.x + screen.w && hover[1] >= y && hover[1] <= y + bh * grow) hit = { kind: r.kind, y, x, w, bh };
        i++;
      }
    }
    ctx.restore();
    return hit;
  }

  function legend(ctx, x0, y0, w, kinds, active, small) {
    let x = x0, xw = 0;
    ctx.font = `600 ${small ? 9 : 10.5}px ${SANS}`;
    for (const k of kinds) {
      const tw = ctx.measureText(k).width, bw = tw + (small ? 14 : 18);
      if (x + bw > x0 + w) { x = x0; y0 += small ? 15 : 17; }
      ctx.globalAlpha = !active || active === k ? 1 : 0.35;
      ctx.fillStyle = KCOL[k]; ctx.beginPath(); ctx.arc(x + (small ? 4.5 : 5.5), y0, small ? 3.2 : 4, 0, 7); ctx.fill();
      ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.fillText(k, x + (small ? 9.5 : 12), y0 + (small ? 3.2 : 3.8));
      ctx.globalAlpha = 1;
      x += bw;
    }
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : k === 2 ? `500 10.5px ${MONO}` : `500 11.5px ${SANS}`);
    const wrap = (t, max) => { ctx.font = fontOf(0); if (ctx.measureText(t).width <= max) return [t]; const out = []; let cur = ""; for (const ch of t) { if (ctx.measureText(cur + ch).width > max) { out.push(cur); cur = ch; } else cur += ch; } if (cur) out.push(cur); return out.slice(0, 3); };
    const flat = [];
    for (const [t, k] of lines) { if (k === 0) wrap(t, 240).forEach((ln) => flat.push([ln, 0])); else flat.push([t, k]); }
    const bw = Math.min(260, Math.max(...flat.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 12 + flat.length * 17;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(10,9,32,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(238,240,255,.3)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    flat.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? MUTE : k === 1 ? "#ffb0bb" : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 19 + j * 17); });
  }

  // dashed "지난 기록" contrast panel: 2020-2023 부산시 전체, 감염병 vs 나머지
  function contrastPanel(ctx, x0, y0, w, h, city) {
    ctx.save();
    ctx.strokeStyle = "rgba(238,240,255,.35)"; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
    const p = new Path2D(); roundRectPath(p, x0, y0, w, h, 8); ctx.stroke(p); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(238,240,255,.06)"; ctx.fill(p);
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 10.5px ${SANS}`;
    ctx.fillText("지난 기록 (대조)", x0 + 12, y0 + 20);
    ctx.fillStyle = INK; ctx.font = `700 12px ${SANS}`;
    ctx.fillText(`${city.years[0]}–${city.years[city.years.length - 1]} 부산시 전체`, x0 + 12, y0 + 40);
    ctx.fillStyle = KCOL["감염병"]; ctx.font = `800 30px ${SANS}`;
    ctx.fillText(`${city.infect_pct}%`, x0 + 12, y0 + 76);
    ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${SANS}`;
    ctx.fillText("가 감염병(코로나19) 안내", x0 + 12, y0 + 94);
    const by = y0 + h - 26, bw = w - 24;
    ctx.fillStyle = "rgba(238,240,255,.14)"; ctx.fillRect(x0 + 12, by, bw, 10);
    ctx.fillStyle = KCOL["감염병"]; ctx.fillRect(x0 + 12, by, bw * (city.infect_pct / 100), 10);
    ctx.fillStyle = MUTE; ctx.font = `500 9.5px ${MONO}`;
    ctx.fillText(`${KF.fmt(city.total)}건 중`, x0 + 12, by + 22);
    ctx.restore();
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const X = decode(d), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.5, h * 0.1, 10, w * 0.5, h * 0.1, w * 0.7);
    g.addColorStop(0, GLOW); g.addColorStop(1, BG); ctx.globalAlpha = 0.5; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * 0.6); ctx.globalAlpha = 1;
    const py = X.perYear[X.perYear.length - 2]; // 2025: the clearest "호우·홍수 dominates" year
    const pw = h * 0.62, ph = h * 0.98, y0 = h * 0.02, x0 = w * 0.06;
    const el = KF.clamp((c - 0.3) / 1.4, 0, 1);
    const screen = phone(ctx, x0, y0, pw, ph);
    notifications(ctx, screen, py.rows, 26, el, null, true);
    const a = KF.clamp((c - 1.2) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    const tx = x0 + pw + w * 0.06;
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText(`${py.y}년 부산 북구`, tx, h * 0.22);
    ctx.fillStyle = KCOL["호우·홍수"]; ctx.font = `700 ${Math.round(h * 0.13)}px ${SANS}`;
    const pct = Math.round((py.rows.find((r) => r.kind === "호우·홍수")?.n || 0) / py.total * 100);
    ctx.fillText(`${pct}%`, tx, h * 0.42);
    ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.048)}px ${SANS}`;
    ctx.fillText("호우·홍수 안내였다", tx, h * 0.54);
    ctx.fillStyle = MUTE; ctx.font = `500 ${Math.round(h * 0.042)}px ${SANS}`;
    ctx.fillText("코로나 시기엔 감염병이 79%였는데", tx, h * 0.72);
    ctx.fillText("해마다 1위 재해가 바뀌었다", tx, h * 0.83);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage);
    let activeKind = null, hover = null, t0 = performance.now();
    KF.segment(controls, X.kinds.map((k) => ({ id: k, label: k })), null, (id) => { activeKind = activeKind === id ? null : id; });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, el = (performance.now() - t0) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * 0.5, 0, 10, w * 0.5, 0, w * 0.75);
      g.addColorStop(0, GLOW); g.addColorStop(1, BG); ctx.globalAlpha = 0.4; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * 0.5); ctx.globalAlpha = 1;

      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 17.5 : 13.5}px ${SANS}`;
      ctx.fillText(`부산 북구 재난문자 · 연도별 종류 (${X.years[0]}–${X.years[X.years.length - 1]})`, full ? 18 : 12, full ? 26 : 19);
      const legY = full ? 46 : 34;
      legend(ctx, full ? 18 : 12, legY, full ? w * 0.72 : w - 24, X.kinds, activeKind, !full);

      const contrastW = full ? 200 : 0;
      const top = full ? 70 : 56, bottom = full ? h - 20 : h * 0.66;
      const gridW = w - (full ? 18 * 2 + contrastW + 16 : 20);
      const cols = full ? 6 : 3, rows = full ? 1 : 2;
      const gx = full ? 12 : 10, gy = 12;
      const cw = (gridW - gx * (cols + 1)) / cols, ch = (bottom - top - gy * (rows - 1)) / rows;
      let hitBanner = null;
      X.perYear.forEach((p, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x0 = (full ? 18 : 10) + gx + col * (cw + gx), y0 = top + row * (ch + gy);
        const cap = Math.max(3, Math.round((p.total / X.maxTotal) * (full ? 28 : 20)));
        ctx.globalAlpha = !activeKind ? 1 : 0.9;
        const screen = phone(ctx, x0, y0, cw, ch * 0.84);
        const rows2 = activeKind ? p.rows.map((r) => (r.kind === activeKind ? r : { kind: r.kind, n: 0 })).filter((r) => r.n > 0) : p.rows;
        const hb = notifications(ctx, screen, rows2.length ? rows2 : [{ kind: "기타", n: 0 }], cap, KF.clamp(el / 1.4, 0, 1), hover, !full);
        if (hb) hitBanner = hb;
        ctx.globalAlpha = 1;
        ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 12.5 : 11}px ${SANS}`;
        ctx.fillText(`${p.y}${p.y === 2026 ? "(~6월)" : ""}`, x0 + cw / 2, y0 + ch * 0.84 + (full ? 18 : 14));
        ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 10.5 : 9}px ${MONO}`;
        ctx.fillText(`${p.total}건`, x0 + cw / 2, y0 + ch * 0.84 + (full ? 33 : 26));
      });

      if (full) {
        contrastPanel(ctx, w - contrastW - 4, top, contrastW, bottom - top, X.city);
      } else {
        const py = bottom + 16, pw = w - 24;
        contrastPanel(ctx, 12, py, pw, h - py - 10, X.city);
      }

      if (hitBanner && hover) {
        const ex = X.exByKind.get(hitBanner.kind);
        const sample = ex && ex.length ? ex[Math.floor((hitBanner.y * 7 + hitBanner.x) % ex.length)] : null;
        const lines = [[hitBanner.kind, 1]];
        if (sample) { lines.push([`${sample.y}${sample.title ? " · " + sample.title : ""}`, 2]); lines.push([sample.msg || sample.type, 0]); }
        else lines.push(["예시 메시지 없음", 2]);
        tip(ctx, w, h, lines, hover);
      }
    });
  }

  VIZ["disaster-text"] = { thumb, mount, bg: BG };
})();
