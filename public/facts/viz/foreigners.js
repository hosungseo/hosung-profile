// 04 foreigners — "One word, many people". Passport paper. One grey block labelled 외국인
// (1 square = 10,000 people) breaks into stamp-inked columns by visa purpose.
(() => {
  const PAPER = "#efe8d8";
  const INK = { work: "#1f5fa8", kin: "#6d3a96", study: "#2e7a4e", family: "#b8322a", perm: "#2b2b2b", short: "#c9800e", other: "#8f8a80" };
  const ORDER = ["kin", "work", "short", "family", "study", "perm", "other"];
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";

  function paper(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(120,95,50,.07)"; ctx.lineWidth = 1;
    for (let k = -h; k < w + h; k += 9) { // guilloche-ish diagonal hatching
      ctx.beginPath(); ctx.moveTo(k, 0); ctx.bezierCurveTo(k + 40, h * .3, k - 40, h * .7, k, h); ctx.stroke();
    }
  }

  function counts(d, month) {
    const s = d.series[month];
    return ORDER.map((g) => ({ g, n: s[g] || 0, sq: Math.round((s[g] || 0) / 10000) }));
  }

  function layout(w, h, cs, full) {
    const total = cs.reduce((a, c) => a + c.sq, 0);
    const padT = full ? 70 : 18, padB = full ? 64 : 16;
    const colsPer = 5;
    const maxRows = Math.max(...cs.map((c) => Math.ceil(c.sq / colsPer)));
    const gap = full ? 26 : 12;
    const cell = Math.min((w - 40 - gap * (cs.length - 1)) / (cs.length * colsPer), (h - padT - padB) / maxRows);
    const sz = cell * 0.82;
    const groupW = colsPer * cell;
    const x0 = (w - (groupW * cs.length + gap * (cs.length - 1))) / 2;
    const blockCols = Math.ceil(Math.sqrt(total * 1.9));
    const bx0 = (w - blockCols * cell) / 2, by0 = padT + (h - padT - padB - Math.ceil(total / blockCols) * cell) / 2;
    const pts = [];
    let k = 0;
    cs.forEach((c, gi) => {
      for (let j = 0; j < c.sq; j++, k++) {
        const bx = bx0 + (k % blockCols) * cell, by = by0 + Math.floor(k / blockCols) * cell;
        const gx = x0 + gi * (groupW + gap) + (j % colsPer) * cell;
        const gy = h - padB - (Math.floor(j / colsPer) + 1) * cell;
        pts.push({ g: c.g, bx, by, gx, gy, k });
      }
    });
    return { pts, sz, cell, x0, groupW, gap, padB, padT, total, bx0, by0, blockCols };
  }

  function draw(ctx, w, h, d, month, p, full, hoverG) {
    paper(ctx, w, h);
    const cs = counts(d, month), L = layout(w, h, cs, full);
    for (const q of L.pts) {
      const stagger = KF.clamp(p * 1.6 - (q.k / L.total) * 0.6, 0, 1), e = KF.ease(stagger);
      const x = KF.lerp(q.bx, q.gx, e), y = KF.lerp(q.by, q.gy, e);
      ctx.fillStyle = e < 0.02 ? "#7d776c" : INK[q.g];
      ctx.globalAlpha = hoverG && hoverG !== q.g && e > 0.9 ? 0.25 : 0.92;
      ctx.fillRect(x, y, L.sz, L.sz);
    }
    ctx.globalAlpha = 1;
    const total = cs.reduce((a, c) => a + c.n, 0);
    if (p < 0.35) { // the single word
      ctx.save(); ctx.globalAlpha = 1 - p / 0.35;
      ctx.fillStyle = "#1c1a16"; ctx.textAlign = "center";
      ctx.font = `700 ${full ? 40 : 22}px ${SANS}`;
      ctx.fillText("외국인", w / 2, L.by0 - (full ? 20 : 8));
      ctx.font = `500 ${full ? 14 : 10}px ${MONO}`;
      ctx.fillText(`${KF.fmt(total)}명 · 1칸 = 1만 명`, w / 2, L.by0 + Math.ceil(L.total / L.blockCols) * L.cell + (full ? 26 : 14));
      ctx.restore();
    }
    if (p > 0.75) { // stamp labels
      const a = KF.clamp((p - 0.75) / 0.25, 0, 1);
      cs.forEach((c, gi) => {
        const cx = L.x0 + gi * (L.groupW + L.gap) + L.groupW / 2;
        const rows = Math.ceil(c.sq / 5);
        const top = h - L.padB - rows * L.cell;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, top - (full ? 34 : 16)); ctx.rotate(((gi % 3) - 1) * 0.06);
        const label = d.groups.find((x) => x.id === c.g).label.split(" (")[0];
        const pct = `${Math.round((c.n / total) * 1000) / 10}%`;
        ctx.strokeStyle = INK[c.g]; ctx.fillStyle = INK[c.g]; ctx.lineWidth = full ? 2 : 1.2;
        ctx.font = `700 ${full ? 13 : 8}px ${SANS}`; ctx.textAlign = "center";
        const tw = Math.max(ctx.measureText(label).width, 30) + (full ? 16 : 8);
        ctx.strokeRect(-tw / 2, full ? -26 : -12, tw, full ? 40 : 19);
        ctx.fillText(label, 0, full ? -8 : -3);
        ctx.font = `600 ${full ? 13 : 7.5}px ${MONO}`;
        ctx.fillText(pct, 0, full ? 9 : 5);
        ctx.restore();
      });
    }
    if (full) {
      ctx.fillStyle = "#1c1a16"; ctx.textAlign = "left"; ctx.font = `600 12px ${MONO}`;
      ctx.fillText(`체류외국인 ${month.replace("-", ".")} · ${KF.fmt(total)}명`, 24, 30);
    }
    return L;
  }

  function thumb(ctx, w, h, t, d) {
    const c = t % 8;
    const p = c < 1.2 ? 0 : c < 4 ? KF.ease((c - 1.2) / 2.8) : c < 7 ? 1 : 1 - KF.ease((c - 7) / 1);
    draw(ctx, w, h, d, d.latest, p, false);
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let month = d.latest, t0 = performance.now(), split = true, hoverG = null, L = null;
    const btn = document.createElement("button");
    btn.type = "button"; btn.textContent = "한 덩어리로 / 쪼개기";
    btn.onclick = () => { split = !split; t0 = performance.now(); };
    controls.appendChild(btn);
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = d.months.length - 1; range.value = d.months.length - 1;
    const lab = document.createElement("label"); lab.append("월", range);
    const out = document.createElement("span"); out.className = "readout";
    controls.append(lab, out);
    const setOut = () => { out.textContent = month.replace("-", "."); };
    range.oninput = () => { month = d.months[+range.value]; setOut(); };
    setOut();
    stage.addEventListener("pointermove", (e) => {
      if (!L) return;
      const r = stage.getBoundingClientRect(), x = e.clientX - r.left;
      const gi = Math.floor((x - L.x0) / (L.groupW + L.gap));
      hoverG = gi >= 0 && gi < ORDER.length ? ORDER[gi] : null;
    });
    stage.addEventListener("pointerleave", () => { hoverG = null; });
    KF.loop(stage, () => {
      const el = (performance.now() - t0) / 1000;
      const p = split ? KF.clamp((el - 0.6) / 2.2, 0, 1) : 1 - KF.clamp(el / 1.4, 0, 1);
      L = draw(s.ctx, s.w, s.h, d, month, p, s.w > 520, hoverG);
      if (hoverG && p >= 1 && s.w > 520) { // visa breakdown for the hovered group
        const pat = { work: /^(E\d+|C4|D7|D8|D9|H1)\(/, kin: /^(F4|H2)\(/, study: /^(D2|D4|D10)\(/, family: /^(F6|F1|F2|F3)\(/,
          perm: /^F5\(/, short: /^(B1|B2|C3|C1)\(/ }[hoverG];
        const items = Object.entries(d.latest_detail).filter(([k]) => (pat ? pat.test(k) : !/^(E\d+|C4|D7|D8|D9|H1|F\d|H2|D2|D4|D10|B1|B2|C3|C1)\(/.test(k))).slice(0, 8);
        const ctx = s.ctx, bw = 230, bx = s.w - bw - 20, by = 50;
        ctx.fillStyle = "rgba(255,252,244,.95)"; ctx.fillRect(bx, by, bw, 26 + items.length * 18);
        ctx.strokeStyle = INK[hoverG]; ctx.strokeRect(bx + .5, by + .5, bw, 26 + items.length * 18);
        ctx.fillStyle = INK[hoverG]; ctx.font = `600 11px ${MONO}`; ctx.textAlign = "left";
        ctx.fillText(`${d.latest.replace("-", ".")} 체류자격`, bx + 10, by + 17);
        items.forEach(([k, v], i) => {
          ctx.fillStyle = "#1c1a16"; ctx.font = `500 11px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(k, bx + 10, by + 36 + i * 18);
          ctx.font = `500 11px ${MONO}`; ctx.textAlign = "right"; ctx.fillText(KF.fmt(v), bx + bw - 10, by + 36 + i * 18);
        });
      }
    });
  }

  VIZ.foreigners = { thumb, mount, bg: PAPER };
})();
