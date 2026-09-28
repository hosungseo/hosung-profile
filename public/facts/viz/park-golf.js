// 46 park-golf — "잔디 위 깃발 (golf flags on greens)". Seen from above: one putting green per 시도, sized by its
// people aged 60+, placed roughly where the region is. Every public park-golf course is one flag pin on its green,
// coloured by when it was completed; the flags are planted year by year. Switch to gateball: one hoop = 5 courts.
(() => {
  const BG = "#2f5a3a";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#f3f6ee", DIM = "rgba(243,246,238,.7)", FAINT = "rgba(243,246,238,.16)";
  const GREEN = "#86c46a", GREEN2 = "#76b65c", FRINGE = "#5d9a4a", SAND = "#e7d8a8";
  const PER = [["2020–", "#ef4a3c", (y) => y >= 2020], ["2010–19", "#f5c542", (y) => y >= 2010 && y < 2020], ["–2009", "#f7f4ea", (y) => y > 0 && y < 2010], ["준공일 모름", "#9fb39a", (y) => !y]];
  const perOf = (y) => PER.findIndex((p) => p[2](y));
  const POS = { 서울: [126.98, 37.57], 인천: [126.5, 37.45], 경기: [127.3, 37.4], 강원: [128.3, 37.75], 충북: [127.75, 36.75], 세종: [127.25, 36.56],
    대전: [127.4, 36.33], 충남: [126.75, 36.5], 경북: [128.75, 36.45], 대구: [128.6, 35.85], 울산: [129.35, 35.55], 전북: [127.15, 35.75],
    전남광주: [126.85, 34.95], 경남: [128.2, 35.3], 부산: [129.1, 35.15], 제주: [126.55, 33.4] };

  function rnd(i) { const x = Math.sin(i * 91.7 + 13.3) * 43758.5453; return x - Math.floor(x); }

  // ---------------------------------------------------------------- layout of the greens (cached per box)
  let LAY = null;
  function layout(d, box) {
    const key = box.join(",");
    if (LAY && LAY.key === key) return LAY;
    const [bx, by, bw, bh] = box;
    const lon0 = 125.9, lon1 = 129.9, lat0 = 33.0, lat1 = 38.4, K = Math.cos(36 * Math.PI / 180);
    const sc = Math.min(bw / ((lon1 - lon0) * K), bh / (lat1 - lat0));
    const ox = bx + (bw - (lon1 - lon0) * K * sc) / 2, oy = by + (bh - (lat1 - lat0) * sc) / 2;
    const px = (lon, lat) => [ox + (lon - lon0) * K * sc, oy + (lat1 - lat) * sc];
    const maxO = Math.max(...d.o60), rMax = Math.min(bw, bh) * 0.13;
    const G = d.sido.map((s, i) => { const [x, y] = px(...POS[s]); return { s, i, x, y, hx: x, hy: y, r: rMax * Math.sqrt(d.o60[i] / maxO) + 6 }; });
    for (let it = 0; it < 200; it++) { // push overlapping greens apart, pull gently home
      for (let a = 0; a < G.length; a++) for (let b = a + 1; b < G.length; b++) {
        const A = G[a], B = G[b], dx = B.x - A.x, dy = B.y - A.y, dd = Math.hypot(dx, dy) || 0.01, need = A.r + B.r + 5;
        if (dd < need) { const m = (need - dd) / 2, ux = dx / dd, uy = dy / dd; A.x -= ux * m; A.y -= uy * m; B.x += ux * m; B.y += uy * m; }
      }
      for (const g of G) { g.x += (g.hx - g.x) * 0.03; g.y += (g.hy - g.y) * 0.03; g.x = KF.clamp(g.x, bx + g.r + 2, bx + bw - g.r - 2); g.y = KF.clamp(g.y, by + g.r + 2, by + bh - g.r - 14); }
    }
    // flag positions: a sunflower spiral inside each green
    const bySido = G.map(() => []);
    d.pg.forEach((f, k) => bySido[f[0]].push(k));
    const flags = new Array(d.pg.length);
    bySido.forEach((ks, gi) => {
      const g = G[gi], n = ks.length;
      ks.forEach((k, j) => {
        const a = j * 2.39996 + gi, rr = g.r * 0.78 * Math.sqrt((j + 0.5) / Math.max(n, 1));
        flags[k] = [g.x + Math.cos(a) * rr, g.y + Math.sin(a) * rr * 0.92];
      });
    });
    return (LAY = { key, G, flags });
  }

  function blob(ctx, g, grow) {
    const r = g.r * grow; if (r < 1) return;
    const path = new Path2D();
    for (let k = 0; k <= 48; k++) {
      const a = (k / 48) * Math.PI * 2, rr = r * (1 + 0.07 * Math.sin(3 * a + g.i) + 0.05 * Math.sin(5 * a + g.i * 2));
      const x = g.x + Math.cos(a) * rr * 1.06, y = g.y + Math.sin(a) * rr * 0.94;
      k ? path.lineTo(x, y) : path.moveTo(x, y);
    }
    path.closePath();
    ctx.fillStyle = FRINGE; ctx.save(); ctx.translate(0, 2.5); ctx.fill(path); ctx.restore();
    ctx.fillStyle = GREEN; ctx.fill(path);
    ctx.save(); ctx.clip(path); // mowing stripes
    ctx.fillStyle = GREEN2;
    for (let x = g.x - r * 1.2; x < g.x + r * 1.2; x += Math.max(6, r * 0.22)) ctx.fillRect(x, g.y - r * 1.2, Math.max(3, r * 0.11), r * 2.4);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,.28)"; ctx.lineWidth = 1; ctx.stroke(path);
    return path;
  }
  function flag(ctx, x, y, col, s, pop) {
    const h = s * 1.5 * pop;
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x + 1, y, 2.2 * pop, 1 * pop, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = "#fbfbf6"; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + s * 0.75 * pop, y - h + s * 0.28 * pop); ctx.lineTo(x, y - h + s * 0.56 * pop); ctx.closePath(); ctx.fill();
  }
  function hoop(ctx, x, y, col, s) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - s * 0.4, y); ctx.lineTo(x - s * 0.4, y - s * 0.6); ctx.lineTo(x + s * 0.4, y - s * 0.6); ctx.lineTo(x + s * 0.4, y); ctx.stroke();
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `700 12.5px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 11.5px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 12 + lines.length * 17;
    const bx = KF.clamp(x + 14 + bw > w - 6 ? x - bw - 14 : x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(18,36,24,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(243,246,238,.3)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = i ? `500 11.5px ${SANS}` : `700 12.5px ${SANS}`; ctx.fillText(t, bx + 11, by + 17 + i * 17); });
  }

  // the map: greens + flags (or hoops) up to year `yr`
  function course(ctx, d, L, mode, yr, grow, full, hoverG, labels = true) {
    const s = full ? 8 : 6;
    for (const g of L.G) {
      blob(ctx, g, grow);
      if (hoverG === g.i) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r * 1.12, g.r * 1.0, 0, 0, 7); ctx.stroke(); }
    }
    if (mode === "pg") {
      d.pg.forEach((f, k) => {
        const y = f[1], show = y ? KF.clamp((yr - y) + 1, 0, 1) : KF.clamp(grow * 2 - 1, 0, 1);
        if (show <= 0) return;
        const [x, yy] = L.flags[k];
        flag(ctx, x, yy, PER[perOf(y)][1], s, KF.ease(show));
      });
    } else {
      // gateball: one hoop = 5 courts, spread on a spiral; old ones white, 2020- red, unknown grey
      L.G.forEach((g, gi) => {
        const [tot, old, neu] = d.gb[gi], nh = Math.round(tot / 5), nNew = Math.round(neu / 5), nOld = Math.round(old / 5);
        for (let j = 0; j < nh; j++) {
          const a = j * 2.39996 + gi, rr = g.r * 0.8 * Math.sqrt((j + 0.5) / Math.max(nh, 1));
          const col = j < nNew ? "#ef4a3c" : j < nNew + nOld ? "#f7f4ea" : "#9fb39a";
          if (grow > 0.5) hoop(ctx, g.x + Math.cos(a) * rr, g.y + Math.sin(a) * rr * 0.92, col, s * 0.9);
        }
      });
    }
    // labels: a small pill on the lower rim of each green
    ctx.textAlign = "center"; ctx.font = `700 ${full ? 11 : 9}px ${SANS}`;
    for (const g of labels ? L.G : []) {
      const tw = ctx.measureText(g.s).width, y = g.y + g.r * 0.93 * grow, ph = full ? 15 : 12;
      ctx.fillStyle = "rgba(20,44,28,.82)"; ctx.beginPath(); ctx.roundRect(g.x - tw / 2 - 5, y - ph / 2, tw + 10, ph, ph / 2); ctx.fill();
      ctx.fillStyle = INK; ctx.fillText(g.s, g.x, y + (full ? 4 : 3.2));
    }
    ctx.textAlign = "left";
  }

  // year bars: park golf vs gateball courts completed per year
  function years(ctx, d, x, y, w, h, yr, full) {
    const Y = d.years, n = Y.length, bw = w / n, vmax = Math.max(...d.pgY, ...d.gbY);
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
    Y.forEach((yy, i) => {
      const gx = x + i * bw;
      const hg = d.gbY[i] / vmax * h, hp = d.pgY[i] / vmax * h;
      ctx.strokeStyle = "rgba(247,244,234,.8)"; ctx.lineWidth = 1; ctx.strokeRect(gx + 1.5, y + h - hg, bw * 0.42, hg);
      if (yy <= yr) { ctx.fillStyle = "#ef4a3c"; ctx.fillRect(gx + bw * 0.46, y + h - hp, bw * 0.42, hp); }
    });
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 9.5 : 9}px ${MONO}`; ctx.textAlign = "center";
    Y.forEach((yy, i) => { if (yy % 5 === 0) ctx.fillText(String(yy), x + (i + 0.5) * bw, y + h + 12); });
    ctx.textAlign = "left";
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const box = [w * 0.52, 4, w * 0.46, h - 8], L = layout(d, box);
    const grow = KF.ease(KF.clamp(c / 0.8, 0, 1)), yr = 2000 + KF.clamp((c - 0.6) / 2.4, 0, 1) * 26.99;
    course(ctx, d, L, "pg", c > 9.3 ? 1999 + (1 - (c - 9.3) / 0.7) * 28 : yr, grow, false, null, false);
    LAY = null;
    const x = h * 0.09, a = KF.clamp((c - 0.8) / 0.8, 0, 1);
    const since = d.types.find((r) => r[0] === "파크골프"), gb = d.types.find((r) => r[0] === "게이트볼");
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.07)}px ${SANS}`; ctx.fillText("공공 파크골프장", x, h * 0.28);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`; ctx.fillText("2020년 이후 준공", x, h * 0.4);
    ctx.fillStyle = "#ef4a3c"; ctx.font = `700 ${Math.round(h * 0.15)}px ${SANS}`; ctx.fillText(`${Math.round(since[3] / since[2] * 100)}%`, x, h * 0.57);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`; ctx.fillText(`게이트볼장은 ${Math.round(gb[3] / gb[2] * 100)}%`, x, h * 0.7);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage);
    let mode = "pg", t0 = performance.now(), hover = null, replay = 0;
    KF.segment(controls, [{ id: "pg", label: "파크골프장" }, { id: "gb", label: "게이트볼장" }], mode, (id) => { mode = id; });
    const rb = document.createElement("button"); rb.type = "button"; rb.textContent = "▶ 해마다 다시 꽂기"; controls.appendChild(rb);
    rb.onclick = () => { replay = performance.now(); mode = "pg"; controls.querySelectorAll("button[aria-pressed]").forEach((b, i) => b.setAttribute("aria-pressed", String(i === 0))); };
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520, now = performance.now(), el = (now - t0) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      // rough texture
      ctx.fillStyle = "rgba(0,0,0,.05)"; for (let k = 0; k < 220; k++) ctx.fillRect(rnd(k) * w, rnd(k + 500) * h, 2, 2);
      const box = full ? [14, 12, w * 0.6, h - 24] : [6, 8, w - 12, h * 0.6];
      const L = layout(d, box);
      const grow = KF.ease(KF.clamp((el - 0.1) / 0.9, 0, 1));
      const rel = replay ? (now - replay) / 1000 : el;
      const yr = 1999 + KF.clamp((rel - (replay ? 0.2 : 0.9)) / 4.2, 0, 1) * 27.99;
      // hover: flag first (pg mode), then green
      let hg = null, hf = null;
      if (hover) {
        if (mode === "pg") { let bd = 49; d.pg.forEach((f, k) => { const [x, y] = L.flags[k], dd = (x - hover[0]) ** 2 + (y - 6 - hover[1]) ** 2; if (dd < bd && (!f[1] || f[1] <= yr)) { bd = dd; hf = k; } }); }
        if (hf == null) for (const g of L.G) if ((hover[0] - g.x) ** 2 + (hover[1] - g.y) ** 2 < (g.r * 1.08) ** 2) hg = g.i;
      }
      course(ctx, d, L, mode, yr, grow, full, hg);
      const pgT = d.types.find((r) => r[0] === "파크골프"), gbT = d.types.find((r) => r[0] === "게이트볼");
      const nPG = d.pg.length + 0;
      if (full) {
        const x0 = box[0] + box[2] + 26, pw = w - x0 - 22;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 21px ${SERIF}`; ctx.fillText("잔디 위 깃발", x0, 42);
        const tw = ctx.measureText("잔디 위 깃발").width;
        ctx.fillStyle = DIM; ctx.font = `500 12px ${MONO}`; ctx.fillText(mode === "pg" ? "공공 파크골프장" : "공공 게이트볼장", x0 + tw + 10, 42);
        ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(mode === "pg" ? "깃발 1개 = 1곳 · 잔디 크기 = 60세 이상 인구" : "문 1개 = 게이트볼장 5곳 · 잔디 크기 = 60세 이상 인구", x0, 64);
        // legend
        let lx = x0;
        PER.forEach(([lab, col], i) => {
          if (mode === "gb" && i === 1) return;
          if (mode === "pg") flag(ctx, lx + 3, 90, col, 8, 1); else hoop(ctx, lx + 5, 88, col, 8);
          ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText(mode === "gb" && i === 2 ? "–2019" : lab, lx + 13, 88);
          lx += ctx.measureText(lab).width + 26;
        });
        // numbers
        const by = 132, T = mode === "pg" ? pgT : gbT;
        ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`;
        ctx.fillText(`공공 체육시설 ${KF.fmt(d.nAll)}곳 중`, x0, by); ctx.fillText("준공일 있는 곳 중 2020년 이후", x0 + pw * 0.48, by);
        ctx.font = `700 34px ${SANS}`; ctx.fillStyle = INK; ctx.fillText(`${KF.fmt(T[1])}곳`, x0, by + 38);
        ctx.fillStyle = "#ef4a3c"; ctx.fillText(`${Math.round(T[3] / T[2] * 100)}%`, x0 + pw * 0.48, by + 38);
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`;
        ctx.fillText(`${(T[1] / d.nAll * 100).toFixed(1)}%`, x0, by + 56); ctx.fillText(`${T[3]} / ${T[2]}곳`, x0 + pw * 0.48, by + 56);
        // year chart
        const yb = 222;
        ctx.fillStyle = INK; ctx.font = `700 12.5px ${SANS}`; ctx.fillText("해마다 새로 지은 곳 (준공일 기준)", x0, yb);
        ctx.fillStyle = "#ef4a3c"; ctx.fillRect(x0, yb + 9, 9, 9); ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText("파크골프장", x0 + 13, yb + 17);
        ctx.strokeStyle = "rgba(247,244,234,.8)"; ctx.strokeRect(x0 + 90.5, yb + 9.5, 8, 8); ctx.fillText("게이트볼장", x0 + 103, yb + 17);
        years(ctx, d, x0, yb + 26, pw, 92, yr, true);
        // types: share completed since 2020
        let ty = yb + 150;
        ctx.fillStyle = INK; ctx.font = `700 12.5px ${SANS}`; ctx.fillText("2020년 이후 준공 비율 (준공일 있는 곳)", x0, ty);
        const rows = d.types.filter((r, i) => i < 7 || r[0] === "게이트볼");
        rows.forEach(([k, n, dated, since], i) => {
          const yy = ty + 10 + i * 17, v = since / dated;
          ctx.fillStyle = k === "파크골프" ? INK : DIM; ctx.font = `${k === "파크골프" ? 700 : 500} 11px ${SANS}`; ctx.fillText(k, x0, yy + 9);
          const bx = x0 + 92, bl = (pw - 130) * v;
          ctx.fillStyle = k === "파크골프" ? "#ef4a3c" : k === "게이트볼" ? "rgba(247,244,234,.8)" : "rgba(243,246,238,.45)"; ctx.fillRect(bx, yy + 1, bl, 9);
          ctx.fillStyle = DIM; ctx.font = `500 10px ${MONO}`; ctx.fillText(`${Math.round(v * 100)}%`, bx + bl + 5, yy + 9);
        });
      } else {
        const y0 = box[1] + box[3] + 22;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 13px ${SANS}`;
        ctx.fillText(mode === "pg" ? `공공 파크골프장 ${KF.fmt(pgT[1])}곳 · 깃발 1개 = 1곳` : `공공 게이트볼장 ${KF.fmt(gbT[1])}곳 · 문 1개 = 5곳`, 10, y0);
        const T = mode === "pg" ? pgT : gbT;
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.fillText("준공일 있는 곳 중 2020년 이후", 10, y0 + 20);
        ctx.fillStyle = "#ef4a3c"; ctx.font = `700 22px ${SANS}`; ctx.fillText(`${Math.round(T[3] / T[2] * 100)}%`, 10, y0 + 44);
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(`게이트볼장은 ${Math.round(gbT[3] / gbT[2] * 100)}%`, w * 0.3, y0 + 44);
        ctx.fillStyle = "#ef4a3c"; ctx.fillRect(w * 0.56, y0 + 35, 8, 8); ctx.fillStyle = DIM; ctx.fillText("파크골프", w * 0.56 + 11, y0 + 43);
        ctx.strokeStyle = "rgba(247,244,234,.8)"; ctx.strokeRect(w * 0.77 + 0.5, y0 + 35.5, 7, 7); ctx.fillText("게이트볼", w * 0.77 + 11, y0 + 43);
        years(ctx, d, 10, y0 + 56, w - 20, h - y0 - 76, yr, false);
      }
      // tooltips
      if (hf != null && hover) {
        const f = d.pg[hf];
        tip(ctx, w, h, hover[0], hover[1], [[f[2] || "파크골프장"], [`${d.sido[f[0]]} · ${f[1] ? `${f[1]}년 준공` : "준공일 모름"}`, PER[perOf(f[1])][1]]]);
      } else if (hg != null && hover) {
        const i = hg, npg = d.pg.filter((f) => f[0] === i), nnew = npg.filter((f) => f[1] >= 2020).length;
        tip(ctx, w, h, hover[0], hover[1], [[`${d.sido[i]}`], [`60세 이상 ${KF.fmt(d.o60[i])}명 (${(d.o60[i] / d.tot[i] * 100).toFixed(0)}%)`],
          [`파크골프장 ${npg.length}곳 · 2020년 이후 ${nnew}곳`, "#ffb3aa"], [`60세 이상 10만 명당 ${(npg.length / d.o60[i] * 1e5).toFixed(1)}곳`], [`게이트볼장 ${d.gb[i][0]}곳`, DIM]]);
      }
    });
  }

  VIZ["park-golf"] = { thumb, mount, bg: BG };
})();
