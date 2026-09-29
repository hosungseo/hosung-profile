// 97 admin-appeals — "재결 스탬프 대장 (adjudication stamp ledger)". A leather ledger page: one big ink
// stamp carries the grant rate (인용률) for the chosen year, a field of small paper tickets below it carries
// the real case count (1 ticket = a fixed share of the decided cases that year, coloured by outcome).
(() => {
  const BG = "#241512", LEATHER = "#2c1a16", INK = "#f0e6d2", DIM = "rgba(240,230,210,.62)", FAINT = "rgba(240,230,210,.18)";
  const PAPER = "#f2e9d8", GRANT = "#4fa085", REJECT = "#c1503a", DISMISS = "#9a8f7c", STAMP = "#b6402f";
  const SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif", MONO = "IBM Plex Mono, monospace";

  const DATASETS = {
    national: { label: "전국 전체", unit: "건", cap: (v) => v.decided },
    driving: { label: "운전면허 사건", unit: "건", cap: (v) => v.n },
  };

  function years(d, key) {
    return Object.keys(d[key]).map(Number).sort((a, b) => a - b);
  }
  function periodLabel(key, y, v) {
    if (key === "national") return v.through < 12 ? `${y}년 1–${v.through}월` : `${y}년`;
    return `${y}년`;
  }

  // jittered "ink-bled" circle path, stable per seed (so it doesn't crawl between frames)
  function stampPath(cx, cy, r, seed) {
    const p = new Path2D();
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const n = Math.sin(a * 5 + seed) * 0.045 + Math.sin(a * 11 + seed * 2.3) * 0.02 + Math.sin(a * 23 + seed * 4.1) * 0.012;
      const rr = r * (1 + n);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath();
    return p;
  }

  function drawStamp(ctx, cx, cy, r, rate, label1, label2, seed, alpha, rot) {
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot); ctx.translate(-cx, -cy);
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = STAMP; ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.stroke(stampPath(cx, cy, r, seed));
    ctx.lineWidth = Math.max(1, r * 0.015);
    ctx.stroke(stampPath(cx, cy, r * 0.82, seed + 7));
    ctx.globalAlpha = alpha * 0.13;
    ctx.fillStyle = STAMP; ctx.fill(stampPath(cx, cy, r * 0.82, seed + 7));
    ctx.restore();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = STAMP; ctx.textAlign = "center";
    ctx.font = `800 ${r * 0.5}px ${MONO}`;
    ctx.fillText(`${rate.toFixed(1)}%`, cx, cy + r * 0.16);
    ctx.font = `700 ${r * 0.12}px ${SANS}`;
    ctx.fillText(label1, cx, cy - r * 0.32);
    ctx.font = `600 ${r * 0.1}px ${SANS}`;
    ctx.fillText(label2, cx, cy + r * 0.44);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  // one ticket: a small paper stub with a perforated left edge
  function ticket(ctx, x, y, w, h, color) {
    ctx.fillStyle = "rgba(15,8,6,.28)"; ctx.fillRect(x + 0.8, y + 1, w, h);
    ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
    if (w > 5) {
      ctx.fillStyle = LEATHER;
      const n = Math.max(1, Math.round(h / 4));
      for (let i = 0; i < n; i++) ctx.beginPath(), ctx.arc(x, y + (i + 0.5) * (h / n), Math.min(1.1, h / n / 3), 0, 7), ctx.fill();
    }
  }

  function ticketGrid(ctx, box, v, key, cols, grow, hoverIdx, targetTotal) {
    const [bx, by, bw] = box;
    const decided = DATASETS[key].cap(v);
    const unit = Math.max(1, Math.round(decided / targetTotal));
    const gN = Math.round(v.g / unit), rN = Math.round(v.r / unit), dN = Math.max(0, Math.round(v.d / unit));
    const total = Math.max(1, gN + rN + dN);
    const gap = 3, tw = (bw - gap * (cols - 1)) / cols, th = tw * 1.28;
    const shown = Math.round(total * grow);
    for (let i = 0; i < shown; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = bx + col * (tw + gap), y = by + row * (th + gap);
      const c = i < gN ? GRANT : i < gN + rN ? REJECT : DISMISS;
      ctx.globalAlpha = i === hoverIdx ? 1 : 0.94;
      ticket(ctx, x, y, tw, th, c);
      if (i === hoverIdx) { ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(x - 1, y - 1, tw + 2, th + 2); }
    }
    ctx.globalAlpha = 1;
    return { rows: Math.ceil(total / cols), tw, th, gap, cols, total, unit, gN, rN, dN };
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    if (!d) return;
    const ny = years(d, "national"), y = ny[ny.length - 2] || ny[ny.length - 1]; // latest FULL national year
    const v = d.national[y];
    const c = t % 10;
    const settle = KF.ease(KF.clamp((c - 0.3) / 1.1, 0, 1));
    const fade = c > 9.2 ? 1 - (c - 9.2) / 0.8 : 1;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${w * 0.052}px ${SERIF}`;
    ctx.globalAlpha = fade;
    ctx.fillText("재결 스탬프 대장", w * 0.055, h * 0.28);
    ctx.fillStyle = DIM; ctx.font = `500 ${w * 0.028}px ${SANS}`;
    ctx.fillText(`전국 행정심판 · ${y}년`, w * 0.055, h * 0.36);
    const cx = w * 0.29, cy = h * 0.66, r = h * 0.25 * (0.7 + 0.3 * settle);
    drawStamp(ctx, cx, cy, r, v.rate, "인용률", `${y}년`, 3.1, settle * fade, -0.09);
    const gridA = KF.clamp((c - 1.0) / 1.6, 0, 1);
    ticketGrid(ctx, [w * 0.5, h * 0.3, w * 0.44], v, "national", 10, gridA, -1, 60);
    ctx.globalAlpha = fade;
    ctx.fillStyle = INK; ctx.font = `700 ${w * 0.03}px ${SANS}`; ctx.textAlign = "center";
    ctx.fillText("받아들여진 청구는 열에 하나가 안 된다", w * 0.5, h * 0.93);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let key = "national", yi = years(d, "national").length - 2; // start on the latest full year
    let beg = performance.now(), hover = null, gridBox = null, stampBox = null;

    const yearSel = document.createElement("select");
    yearSel.setAttribute("aria-label", "연도 선택");
    const readout = document.createElement("span"); readout.className = "readout";

    function fillYears() {
      yearSel.replaceChildren();
      years(d, key).forEach((y, i) => {
        const o = document.createElement("option"); o.value = i; o.textContent = `${y}년`; yearSel.append(o);
      });
      yi = Math.min(yi, years(d, key).length - 1);
      yearSel.value = yi;
    }
    function setKey(id) { key = id; yi = years(d, key).length - (key === "national" ? 2 : 1); fillYears(); beg = performance.now(); update(); }
    KF.segment(controls, [{ id: "national", label: DATASETS.national.label }, { id: "driving", label: DATASETS.driving.label }], key, setKey);
    const lab = document.createElement("label"); lab.textContent = "연도 "; lab.append(yearSel); controls.append(lab, readout);
    fillYears();
    yearSel.addEventListener("change", () => { yi = +yearSel.value; beg = performance.now(); update(); });

    function current() {
      const y = years(d, key)[yi], v = d[key][y];
      return { y, v };
    }
    function update() {
      const { y, v } = current();
      readout.textContent = `${periodLabel(key, y, v)} · 인용률 ${v.rate.toFixed(1)}%`;
    }
    update();

    function hit(mx, my) {
      if (gridBox && mx >= gridBox.bx && mx <= gridBox.bx + gridBox.bw && my >= gridBox.by) {
        const col = Math.floor((mx - gridBox.bx) / (gridBox.tw + gridBox.gap));
        const row = Math.floor((my - gridBox.by) / (gridBox.th + gridBox.gap));
        const i = row * gridBox.cols + col;
        if (col >= 0 && col < gridBox.cols && i < gridBox.total) return { kind: "ticket", i };
      }
      if (stampBox) {
        const dx = mx - stampBox.cx, dy = my - stampBox.cy;
        if (Math.hypot(dx, dy) < stampBox.r) return { kind: "stamp" };
      }
      return null;
    }
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      hover = hit(e.clientX - r.left, e.clientY - r.top);
      stage.style.cursor = hover ? "pointer" : "default";
    });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      const el = (performance.now() - beg) / 1000;
      const stampA = reduced ? 1 : KF.ease(KF.clamp(el / 0.9, 0, 1));
      const rot = reduced ? -0.06 : -0.5 * (1 - stampA) - 0.06;
      const gridA = reduced ? 1 : KF.ease(KF.clamp((el - 0.5) / 1.6, 0, 1));

      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      // leather page border
      ctx.strokeStyle = "rgba(240,230,210,.08)"; ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, w - 10, h - 10);
      ctx.strokeStyle = FAINT; ctx.lineWidth = 1;
      ctx.strokeRect(14, 14, w - 28, h - 28);

      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 25 : 18}px ${SERIF}`;
      ctx.fillText("재결 스탬프 대장", full ? 28 : 18, full ? 42 : 28);
      const { y, v } = current();
      const targetTotal = full ? 108 : 24;
      const unit = Math.max(1, Math.round(DATASETS[key].cap(v) / targetTotal));
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 13 : 10}px ${SANS}`;
      ctx.fillText(full
        ? `${DATASETS[key].label} · ${periodLabel(key, y, v)} · 도장 = 그 기간의 인용률, 티켓 1장 = 실제 ${KF.fmt(unit)}건`
        : `${DATASETS[key].label} · ${periodLabel(key, y, v)} · 티켓 1장 ≈ ${KF.fmt(unit)}건`, full ? 28 : 18, full ? 64 : 44);

      const cx = full ? w * 0.2 : w * 0.5, cy = full ? h * 0.52 : Math.min(150, h * 0.28) + 16;
      const r = full ? Math.min(h * 0.32, w * 0.16) : Math.min(w * 0.23, 66);
      drawStamp(ctx, cx, cy, r, v.rate, "인용률", periodLabel(key, y, v), y % 97, stampA, rot);
      stampBox = { cx, cy, r };

      const gx = full ? w * 0.42 : w * 0.1, gy = full ? h * 0.16 : cy + r + 20, gw = full ? w * 0.52 : w * 0.8;
      const cols = full ? 14 : 7;
      const info = ticketGrid(ctx, [gx, gy, gw], v, key, cols, gridA, hover && hover.kind === "ticket" ? hover.i : -1, targetTotal);
      gridBox = { bx: gx, by: gy, bw: gw, tw: info.tw, th: info.th, gap: info.gap, cols: info.cols, total: info.total };
      const gridBottom = gy + info.rows * (info.th + info.gap);

      // legend — placed right under the grid's actual bottom, never anchored blindly to the canvas edge.
      // Font shrinks (down to a floor) until the whole row is guaranteed to fit inside the canvas width,
      // so "각하" can never clip off narrow (phone) stages.
      const ly = KF.clamp(gridBottom + (full ? 30 : 24), 0, h - (full ? 16 : 12));
      const margin = full ? 28 : 18, gap = full ? 30 : 14, swatch = 9, pad = 13;
      const items = [["인용(청구 받아들임)", GRANT], ["기각", REJECT], ["각하", DISMISS]];
      let fs = full ? 12.5 : 10;
      let legendW;
      do {
        ctx.font = `${fs}px ${SANS}`;
        legendW = items.reduce((sum, [lab]) => sum + pad + ctx.measureText(lab).width, 0) + gap * (items.length - 1);
        if (legendW <= w - margin * 2 || fs <= 8) break;
        fs -= 0.5;
      } while (true);
      let lx = margin;
      items.forEach(([lab, col]) => {
        ctx.fillStyle = col; ctx.fillRect(lx, ly - swatch, swatch, swatch);
        ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.fillText(lab, lx + pad, ly);
        lx += pad + ctx.measureText(lab).width + gap;
      });

      // scale note: only when a year that overlaps the cross-dataset comparison is showing, and only if it fits (desktop)
      if (full && key === "driving" && y === 2017 && d.national["2024"] && ly < h - 60) {
        const n24 = d.national["2024"];
        ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.textAlign = "left";
        ctx.fillText(`참고: ${y}년 운전면허 사건(${KF.fmt(v.n)}건)은 7년 뒤 ${2024}년 전국 전체 접수(${KF.fmt(n24.intake)}건)와 규모가 비슷하다.`, 28, ly + 30);
      } else if (full && key === "national" && y === 2024 && d.driving["2017"] && ly < h - 60) {
        const dv = d.driving["2017"];
        ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`; ctx.textAlign = "left";
        ctx.fillText(`참고: ${y}년 전국 전체 접수(${KF.fmt(v.intake)}건)는 7년 전 운전면허 사건 한 유형(${KF.fmt(dv.n)}건)과 규모가 비슷하다.`, 28, ly + 30);
      }

      if (hover) {
        const lines = [];
        if (hover.kind === "stamp") {
          lines.push([`${DATASETS[key].label} · ${periodLabel(key, y, v)}`, INK]);
          lines.push([`인용 ${KF.fmt(v.g)}건 · 기각 ${KF.fmt(v.r)}건 · 각하 ${KF.fmt(v.d)}건`, DIM]);
          lines.push([`인용률 ${v.rate.toFixed(2)}%`, STAMP]);
        } else {
          const cat = hover.i < info.gN ? "인용" : hover.i < info.gN + info.rN ? "기각" : "각하";
          lines.push([`티켓 ${hover.i + 1} / ${info.total}`, INK]);
          lines.push([`이 구간 = ${cat} · 1장 ≈ ${KF.fmt(info.unit)}건`, DIM]);
        }
        const fs = 12; ctx.font = `700 ${fs}px ${SANS}`;
        let bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22;
        const bh = 10 + lines.length * (fs + 6);
        const px = KF.clamp(w * 0.5, bw / 2 + 6, w - bw / 2 - 6);
        const bx = px - bw / 2, by = KF.clamp(cy - r - bh - 10, 6, h - bh - 6);
        ctx.fillStyle = "rgba(18,10,8,.95)"; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "rgba(240,230,210,.3)"; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
        ctx.textAlign = "left";
        lines.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.font = `${i ? 500 : 700} ${fs}px ${SANS}`; ctx.fillText(t, bx + 11, by + 6 + (i + 1) * (fs + 6) - 3); });
      }
    });
    stage._kfStill = () => {};
  }

  VIZ["admin-appeals"] = { thumb, mount, bg: BG };
})();
