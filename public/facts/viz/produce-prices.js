// 91 produce-prices — "감열지 영수증 두 장 (two thermal receipts)". Two paper receipts hang side by
// side, pinned together by a wooden clothespin; each prints its season's cabbage price breakdown
// line by line. Swap either receipt's season to compare — the profit line does not always move
// the way the total does.
(() => {
  const BG = "#d6d9c8";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#2a2e22", DIM = "rgba(42,46,34,.6)";
  const PAPER = "#fbf8ef", PAPER_EDGE = "#e7e2cf";
  const ROWCOL = ["#8a7355", "#b1502f", "#3f7a63", "#a23b3b"]; // 생산자수취분·직접비·간접비·이윤
  const PIN = "#7a5636", PIN_DK = "#5a3d22", METAL = "#9aa08c";

  function seasonRow(d, name, year) {
    return d.rows.find((r) => r.name === name && r.year === year);
  }

  // ---------------------------------------------------------------- a torn-edge paper rect
  function paperShape(x, y, w, h, seed) {
    const p = new Path2D(), r = mulberry(seed);
    p.moveTo(x, y);
    p.lineTo(x + w, y);
    p.lineTo(x + w, y + h - 6);
    const teeth = Math.round(w / 9);
    for (let i = teeth; i >= 0; i--) {
      const tx = x + (i / teeth) * w;
      p.lineTo(tx, y + h - (i % 2 ? 2 : 9) - r() * 2);
    }
    p.lineTo(x, y);
    p.closePath();
    return p;
  }
  function mulberry(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  function barcode(ctx, x, y, w, h, seed) {
    const r = mulberry(seed);
    let cx = x;
    while (cx < x + w) { const bw = 1 + r() * 2.4; ctx.fillStyle = "#2a2e22"; ctx.globalAlpha = 0.82; ctx.fillRect(cx, y, bw, h); cx += bw + 1 + r() * 2; }
    ctx.globalAlpha = 1;
  }

  const LABELS = ["생산자 수취분*", "직접비", "간접비", "이윤"];

  // one receipt. box=[x,y,w,h]. progress 0..1 reveals rows top to bottom.
  function receipt(ctx, box, row, tilt, hoverRow, progress, seed) {
    const [x, y, w, h] = box;
    ctx.save();
    ctx.translate(x + w / 2, y); ctx.rotate(tilt); ctx.translate(-w / 2, 0);
    ctx.fillStyle = "rgba(30,25,15,.16)";
    ctx.fill(paperShape(3, 5, w, h, seed + 1));
    const shape = paperShape(0, 0, w, h, seed);
    ctx.fillStyle = PAPER; ctx.fill(shape);
    ctx.strokeStyle = PAPER_EDGE; ctx.lineWidth = 1; ctx.stroke(shape);
    ctx.save(); ctx.clip(shape);
    // faint horizontal ruling like receipt paper
    ctx.strokeStyle = "rgba(150,140,110,.14)"; ctx.lineWidth = 1;
    for (let yy = 14; yy < h; yy += 5) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke(); }

    const pad = 16;
    ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `700 15px ${SERIF}`;
    ctx.fillText(row.name, w / 2, 30);
    ctx.font = `500 10px ${MONO}`; ctx.fillStyle = DIM;
    ctx.fillText(`${row.year}년 · 소비자가격 100 기준`, w / 2, 46);
    ctx.strokeStyle = "rgba(42,46,34,.35)"; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(pad, 56); ctx.lineTo(w - pad, 56); ctx.stroke(); ctx.setLineDash([]);

    let yy = 82;
    const rowH = 30;
    const n = Math.floor(progress * (LABELS.length + 0.999));
    LABELS.forEach((lab, i) => {
      if (i >= n) return;
      const a = KF.clamp(progress * (LABELS.length + 1) - i, 0, 1);
      const hi = hoverRow === i;
      ctx.globalAlpha = a;
      if (hi) { ctx.fillStyle = "rgba(178,80,47,.12)"; ctx.fillRect(pad - 6, yy - 15, w - pad * 2 + 12, 22); }
      ctx.textAlign = "left"; ctx.fillStyle = hi ? ROWCOL[i] : INK; ctx.font = `${hi ? 700 : 500} 12px ${SANS}`;
      ctx.fillText(lab.replace("*", ""), pad, yy);
      const val = `${row.values[i].toFixed(1)}`;
      ctx.textAlign = "right"; ctx.font = `700 13px ${MONO}`; ctx.fillStyle = hi ? ROWCOL[i] : INK;
      ctx.fillText(val, w - pad, yy);
      // dot leader
      ctx.fillStyle = "rgba(42,46,34,.3)"; ctx.font = `500 12px ${MONO}`; ctx.textAlign = "left";
      const labW = ctx.measureText(lab.replace("*", "")).width + pad + 6, valW = w - pad - 30;
      let dx = labW;
      while (dx < valW) { ctx.fillText(".", dx, yy); dx += 5; }
      // little swatch
      ctx.fillStyle = ROWCOL[i]; ctx.fillRect(pad - 6, yy - 9, 4, 10);
      ctx.globalAlpha = 1;
      yy += rowH;
    });
    if (progress > 0.92) {
      ctx.strokeStyle = "rgba(42,46,34,.5)"; ctx.beginPath(); ctx.moveTo(pad, yy - 6); ctx.lineTo(w - pad, yy - 6); ctx.stroke();
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 12.5px ${SANS}`; ctx.fillText("유통비용 합계", pad, yy + 14);
      ctx.textAlign = "right"; ctx.font = `800 14px ${MONO}`; ctx.fillText(`${row.total.toFixed(1)}`, w - pad, yy + 14);
      yy += 32;
      // narrow receipts (phone width) don't have room for the full label beside the value on one line —
      // drop to the short form, and failing that stack the value on its own line below.
      const shareLabelFull = "유통비용 중 이윤 비중", shareLabelShort = "이윤 비중";
      ctx.font = `500 10.5px ${SANS}`;
      const shareLabel = ctx.measureText(shareLabelFull).width < w - pad * 2 - 46 ? shareLabelFull : shareLabelShort;
      const stacked = ctx.measureText(shareLabel).width >= w - pad * 2 - 46;
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.fillText(shareLabel, pad, yy);
      ctx.textAlign = stacked ? "left" : "right"; ctx.fillStyle = ROWCOL[3]; ctx.font = `700 12px ${MONO}`;
      ctx.fillText(`${row.profitShare.toFixed(1)}%`, stacked ? pad : w - pad, stacked ? yy + 16 : yy);
      yy += stacked ? 36 : 20;
      barcode(ctx, pad, yy, w - pad * 2, 20, seed + 3);
    }
    ctx.restore(); // clip
    ctx.restore(); // rotate

    return { x, y, w, h, tilt, rowAt: (px, py) => {
      // undo the receipt's own rotation to test in its local space
      const lx = (px - (x + w / 2)) * Math.cos(-tilt) - (py - y) * Math.sin(-tilt) + w / 2;
      const ly = (px - (x + w / 2)) * Math.sin(-tilt) + (py - y) * Math.cos(-tilt);
      if (lx < 0 || lx > w || ly < 70 || ly > 70 + LABELS.length * rowH) return null;
      return Math.floor((ly - 70) / rowH);
    } };
  }

  function clothespin(ctx, cx, y) {
    ctx.save(); ctx.translate(cx, y);
    ctx.fillStyle = PIN; ctx.beginPath(); ctx.roundRect(-7, -4, 14, 34, 4); ctx.fill();
    ctx.fillStyle = PIN_DK; ctx.fillRect(-7, -4, 14, 6);
    ctx.strokeStyle = METAL; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-9, 4); ctx.lineTo(9, 4); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 4, 3, 3, 0, 0, Math.PI * 2); ctx.fillStyle = METAL; ctx.fill();
    ctx.restore();
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `700 12px ${SANS}`;
    let bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22;
    const bh = 12 + lines.length * 18;
    const bx = KF.clamp(x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(42,46,34,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || "#faf7ee"; ctx.font = `${i ? 500 : 700} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 18 + i * 18); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const row = seasonRow(d, "봄배추", d.latest);
    const c = t % 10, p = KF.ease(KF.clamp(c / 2.6, 0, 1));
    const bw = Math.min(190, w * 0.5), bh = h * 0.86;
    receipt(ctx, [w / 2 - bw / 2, h * 0.06, bw, bh], row, 0, null, Math.max(0.18, p), 7);
    ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.08)}px ${SANS}`;
    ctx.globalAlpha = KF.clamp((c - 1.6) / 1, 0, 1);
    ctx.fillText(`이윤 ${row.values[3].toFixed(1)}`, w - 12, h * 0.92);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let left = "봄배추", right = "가을배추", hover = null;
    let tLeft = performance.now(), tRight = performance.now();
    KF.segment(controls, d.names.map((n) => ({ id: n, label: n })), left, (id) => { if (id === left) return; left = id; tLeft = performance.now(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "↔"; controls.appendChild(sep);
    KF.segment(controls, d.names.map((n) => ({ id: n, label: n })), right, (id) => { if (id === right) return; right = id; tRight = performance.now(); });

    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 14}px ${SERIF}`;
      ctx.fillText(`영수증 두 장 · ${d.latest}년 배추`, full ? 20 : 12, full ? 32 : 22);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11.5 : 10}px ${SANS}`;
      ctx.fillText("소비자가격 100을 두 번 펼쳐, 계절이 다른 배추의 유통비용을 나란히 인쇄한다", full ? 20 : 12, full ? 50 : 36);

      const bw = Math.min(full ? 250 : w * 0.4, w * 0.42), bh = Math.min(h - 90, 372);
      const gap = full ? 46 : 14;
      const x0 = w / 2 - bw - gap / 2, x1 = w / 2 + gap / 2;
      const top = full ? 68 : 56;
      const r0 = seasonRow(d, left, d.latest), r1 = seasonRow(d, right, d.latest);
      const p0 = KF.ease(KF.clamp((performance.now() - tLeft) / 1400, 0, 1)), p1 = KF.ease(KF.clamp((performance.now() - tRight) / 1400, 0, 1));

      let hoverIdx = null, hoverSide = null;
      const g0 = receipt(ctx, [x0, top, bw, bh], r0, -0.02, null, p0, 11);
      const g1 = receipt(ctx, [x1, top, bw, bh], r1, 0.025, null, p1, 23);
      if (hover) {
        let idx = g0.rowAt(hover[0], hover[1]);
        if (idx != null && idx < LABELS.length) { hoverIdx = idx; hoverSide = "L"; }
        else { idx = g1.rowAt(hover[0], hover[1]); if (idx != null && idx < LABELS.length) { hoverIdx = idx; hoverSide = "R"; } }
      }
      if (hoverIdx != null) { // redraw both with the shared row highlighted, so the comparison is visible on both receipts
        receipt(ctx, [x0, top, bw, bh], r0, -0.02, hoverIdx, p0, 11);
        receipt(ctx, [x1, top, bw, bh], r1, 0.025, hoverIdx, p1, 23);
      }
      clothespin(ctx, w / 2, top - 6);

      if (hoverIdx != null) {
        const lab = LABELS[hoverIdx].replace("*", "");
        tip(ctx, w, h, hover[0], hover[1], [
          [lab, "#faf7ee"],
          [`${left}: ${r0.values[hoverIdx].toFixed(1)}`, hoverSide === "L" ? "#f0c9b8" : "#faf7ee"],
          [`${right}: ${r1.values[hoverIdx].toFixed(1)}`, hoverSide === "R" ? "#f0c9b8" : "#faf7ee"],
        ]);
      } else if (!full) {
        ctx.textAlign = "center"; ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`;
        ctx.fillText("줄에 손을 올리면 두 영수증을 함께 비교할 수 있다", w / 2, h - 10);
      }
    });
  }

  VIZ["produce-prices"] = { thumb, mount, bg: BG };
})();
