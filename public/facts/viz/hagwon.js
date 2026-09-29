// 65 hagwon — "동전 탑" (coin stacks). A bank-counter tray: one coin stack per year, stack height =
// that year's spending (per-student, toggle nominal/real), a shrinking row of student dots above each
// stack = that year's student population. Second view "오늘의 격차": coin stacks by school level,
// region and household income for the latest year.
(() => {
  const BG = "#cbe0c8";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#20301f", DIM = "rgba(32,48,31,.64)", FAINT = "rgba(32,48,31,.18)";
  const FELT = "#a9c79f", FELT_D = "#8fb185";
  const GOLD = ["#f4d888", "#d8ab3f"], BRASS = ["#e9c98a", "#b8863a"], SILVER = ["#eef1ea", "#b9c2b2"];
  const RED = "#9a3324";

  function decode(d) {
    return d; // already compact
  }

  // ---------------------------------------------------------------- coin-stack primitive
  // baseY = tray surface y at cx; h = stack height in px; rx/ry = coin radii
  function stack(ctx, cx, baseY, h, rx, palette, alpha = 1) {
    const ry = rx * 0.34, thick = Math.max(2.2, ry * 0.62);
    const n = Math.max(1, Math.round(h / thick));
    ctx.globalAlpha = alpha;
    // shadow
    ctx.fillStyle = "rgba(20,30,18,.18)";
    ctx.beginPath(); ctx.ellipse(cx, baseY + ry * 0.3, rx * 1.08, ry * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < n; i++) {
      const y = baseY - i * thick;
      const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      g.addColorStop(0, palette[1]); g.addColorStop(0.5, palette[0]); g.addColorStop(1, palette[1]);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(60,40,10,.35)"; ctx.lineWidth = 0.8; ctx.stroke();
      // rim edge (side of the coin below)
      if (i > 0) {
        ctx.fillStyle = palette[1];
        ctx.fillRect(cx - rx, y, rx * 2, thick * 0.9);
        ctx.beginPath(); ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // top face highlight + mint mark
    const topY = baseY - (n - 1) * thick;
    ctx.fillStyle = "rgba(255,255,255,.4)";
    ctx.beginPath(); ctx.ellipse(cx - rx * 0.32, topY - ry * 0.28, rx * 0.38, ry * 0.32, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    return topY;
  }

  // a caliper-style bracket whose width encodes the year's student population (popMax -> maxHalf)
  function studentBar(ctx, cx, y, pop, popMax, maxHalf, color) {
    const half = Math.max(3, (pop / popMax) * maxHalf);
    ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx + half, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - half, y - 3); ctx.lineTo(cx - half, y + 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + half, y - 3); ctx.lineTo(cx + half, y + 3); ctx.stroke();
  }

  function tipBox(ctx, w, h, px, py, lines) {
    const fs = 12;
    ctx.font = `700 ${fs + 1}px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 ${fs}px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 12 + lines.length * (fs + 6);
    const bx = KF.clamp(px + 14 + bw > w - 6 ? px - bw - 14 : px + 14, 6, w - bw - 6), by = KF.clamp(py - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(253,251,244,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(32,48,31,.35)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = `${i ? 500 : 700} ${i ? fs : fs + 1}px ${SANS}`; ctx.fillText(t, bx + 11, by + 6 + (i + 1) * (fs + 6) - 3); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = FELT; ctx.fillRect(0, h * 0.62, w, h * 0.38);
    const c = t % 10;
    const years = d.years, xs = h * 0.12, xe = w - h * 0.1, baseY = h * 0.86;
    const rx = Math.max(2.2, (xe - xs) / years.length * 0.34);
    const maxV = Math.max(...d.perStudentNominal);
    const maxH = h * 0.56;
    const up = KF.ease(KF.clamp((c - 0.2) / 3.2, 0, 1));
    years.forEach((y, i) => {
      const cx = xs + (i + 0.5) * (xe - xs) / years.length;
      const val = d.perStudentNominal[i] * up;
      const hh = KF.clamp(val / maxV, 0, 1) * maxH;
      stack(ctx, cx, baseY, hh, rx, y >= 2015 && y <= 2024 && i === years.length - 6 ? BRASS : GOLD, 0.95);
    });
    const a = KF.clamp((c - 1.4) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.078)}px ${SANS}`;
    ctx.fillText("학생 1인당 사교육비", h * 0.12, h * 0.22);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText(`${years[0]} → ${years[years.length - 1]}`, h * 0.12, h * 0.32);
    ctx.font = `700 ${Math.round(h * 0.1)}px ${SANS}`;
    ctx.fillStyle = "#7a4f14";
    ctx.fillText(`${d.perStudentNominal[d.perStudentNominal.length - 1].toFixed(1)}만원`, h * 0.12, h * 0.47);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage);
    let view = "time", basis = "nom", hover = null, geo = null, t0 = performance.now();
    KF.segment(controls, [{ id: "time", label: "해마다 쌓은 탑" }, { id: "cross", label: "오늘의 격차" }], view, (id) => { view = id; t0 = performance.now(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "·"; controls.appendChild(sep);
    const basisBtns = KF.segment(controls, [{ id: "nom", label: "명목" }, { id: "real", label: "실질(2020원)" }], basis, (id) => { basis = id; });

    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const trayTop = view === "cross" ? (full ? h * 0.22 : h * 0.3) : (full ? h * 0.4 : h * 0.46);
      ctx.fillStyle = FELT; ctx.fillRect(0, trayTop, w, h - trayTop);
      ctx.fillStyle = FELT_D; ctx.fillRect(0, trayTop, w, 3);

      if (view === "cross") {
        drawCross(ctx, w, h, full, trayTop);
        return;
      }

      const years = d.years, series = basis === "nom" ? d.perStudentNominal : d.perStudentReal;
      const pad = full ? 50 : 20, xs = pad, xe = w - (full ? 258 : 14);
      const baseY = h - (full ? 46 : 34);
      const maxV = Math.max(...d.perStudentNominal, ...d.perStudentReal);
      const maxH = baseY - trayTop - (full ? 34 : 22);
      const rx = Math.max(2.4, (xe - xs) / years.length * 0.32);
      const el = (performance.now() - t0) / 1000;
      const grow = KF.ease(KF.clamp((el - 0.15) / 1.6, 0, 1));

      // caliper bracket above the tray: its width is that year's student population
      const popMax = Math.max(...d.pop);
      ctx.save();

      const bounds = [];
      years.forEach((y, i) => {
        const cx = xs + (i + 0.5) * (xe - xs) / years.length;
        const val = series[i] * grow;
        const hh = KF.clamp(val / maxV, 0, 1) * maxH;
        const isTrough = y === d.trough, isPeakN = y === d.peakNom, isPeakR = y === d.peakReal;
        const pal = isPeakR && basis === "real" ? SILVER : isPeakN && basis === "nom" ? BRASS : GOLD;
        stack(ctx, cx, baseY, hh, rx, pal, 1);
        bounds.push({ y, cx, top: baseY - hh, h: hh });
        studentBar(ctx, cx, trayTop - 10, d.pop[i], popMax, rx * 1.55, "rgba(32,48,31,.6)");
        if ((isTrough || isPeakN) && grow > 0.98) {
          ctx.fillStyle = INK; ctx.font = `700 ${full ? 10 : 8.5}px ${MONO}`; ctx.textAlign = "center";
          ctx.fillText(isTrough ? "최저" : "명목 최고", cx, baseY - hh - 8);
        }
        const skip2025 = years[years.length - 1] - y === 1; // avoid colliding with the last-year label
        if (full ? (y % 2 === 0) : ((y % 5 === 0 && !skip2025) || i === years.length - 1)) {
          ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10 : 8.5}px ${MONO}`; ctx.textAlign = "center";
          ctx.fillText(String(y), cx, baseY + (full ? 20 : 16));
        }
      });
      ctx.restore();

      // header / readout
      ctx.textAlign = "left";
      if (full) {
        const x0 = xe + 26, pw = w - x0 - 20;
        ctx.fillStyle = INK; ctx.font = `700 17px ${SERIF}`;
        ctx.fillText("1인당 월평균 사교육비", x0, 34);
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
        ctx.fillText("탑 1개 = 그해 1인당 지출", x0, 54);
        ctx.fillText("위 꺾쇠 너비 = 그해 학생 수", x0, 69);
        const hov = hover && hover[0] > xs - rx * 2 ? bounds.reduce((a, b) => Math.abs(b.cx - hover[0]) < Math.abs(a.cx - hover[0]) ? b : a, bounds[0]) : null;
        const cur = hov || bounds[bounds.length - 1];
        const i = years.indexOf(cur.y);
        ctx.fillStyle = "#7a4f14"; ctx.font = `700 34px ${SANS}`;
        ctx.fillText(`${series[i].toFixed(1)}만원`, x0, 118);
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`${cur.y}년 · ${basis === "nom" ? "명목" : "실질(2020원 기준)"}`, x0, 137);
        ctx.fillStyle = INK; ctx.font = `600 12.5px ${SANS}`;
        ctx.fillText(`학생 ${KF.fmt(d.pop[i])}명`, x0, 168);
        ctx.fillText(`참여율 ${d.participation[i].toFixed(1)}%`, x0, 188);
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`;
        ctx.fillText(`총액(명목) ${(d.totalNominal[i] / 10000).toFixed(1)}조 원`, x0, 214);
        ctx.fillText(`총액(실질,2020원) ${(d.totalReal[i] / 10000).toFixed(1)}조 원`, x0, 231);
        ctx.strokeStyle = FAINT; ctx.beginPath(); ctx.moveTo(x0, 248); ctx.lineTo(x0 + pw, 248); ctx.stroke();
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
        ctx.fillText(`명목 최고 ${d.peakNom}년 · 실질 최고 ${d.peakReal}년`, x0, 269);
        ctx.fillText(`명목 최저 ${d.trough}년`, x0, 286);
      } else {
        const hov = hover && hover[0] > xs - rx * 2 ? bounds.reduce((a, b) => Math.abs(b.cx - hover[0]) < Math.abs(a.cx - hover[0]) ? b : a, bounds[0]) : null;
        const cur = hov || bounds[bounds.length - 1];
        const i = years.indexOf(cur.y);
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`;
        ctx.fillText(`${cur.y}년 · ${basis === "nom" ? "명목" : "실질(2020원 기준)"}`, 14, 26);
        ctx.fillStyle = "#7a4f14"; ctx.font = `700 42px ${SANS}`;
        ctx.fillText(`${series[i].toFixed(1)}만원`, 14, 76);
        ctx.fillStyle = INK; ctx.font = `600 13px ${SANS}`;
        ctx.fillText("1인당 월평균 사교육비", 14, 98);
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`;
        ctx.fillText(`학생 ${KF.fmt(d.pop[i])}명 · 참여율 ${d.participation[i].toFixed(1)}%`, 14, 122);
        ctx.fillText(`총액(명목) ${(d.totalNominal[i] / 10000).toFixed(1)}조 원`, 14, 141);
        ctx.fillStyle = FAINT; ctx.font = `500 10px ${SANS}`;
        ctx.fillText(`명목 최고 ${d.peakNom}년 · 실질 최고 ${d.peakReal}년 · 명목 최저 ${d.trough}년`, 14, 163);
      }

      if (hover && bounds.length) {
        const hb = bounds.reduce((a, b) => Math.abs(b.cx - hover[0]) < Math.abs(a.cx - hover[0]) ? b : a, bounds[0]);
        if (Math.abs(hb.cx - hover[0]) < (xe - xs) / years.length) {
          const i = years.indexOf(hb.y);
          tipBox(ctx, w, h, hover[0], hover[1], [
            [`${hb.y}년`],
            [`1인당 ${series[i].toFixed(1)}만원 (${basis === "nom" ? "명목" : "실질"})`],
            [`학생 ${KF.fmt(d.pop[i])}명 · 참여율 ${d.participation[i].toFixed(1)}%`, DIM],
            [`총액(명목) ${(d.totalNominal[i] / 10000).toFixed(1)}조 원`, DIM],
          ]);
        }
      }
    });

    function drawCross(ctx, w, h, full, trayTop) {
      const groups = [
        { label: "학교급", labels: d.levels.labels, vals: d.levels.perStudent, pal: GOLD },
        { label: "지역", labels: d.region.labels, vals: d.region.perStudent, pal: BRASS },
        { label: "가구 소득(만원)", labels: d.income.labels, vals: d.income.perStudent, pal: SILVER },
      ];
      const maxV = Math.max(...groups.flatMap((g) => g.vals));
      const baseY = h - (full ? 40 : 30);
      const maxH = baseY - trayTop - (full ? 30 : 18);
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 14}px ${SERIF}`;
      ctx.fillText(`${d.levels.year}년, 오늘의 격차`, full ? 26 : 12, full ? 34 : 22);
      if (full) {
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText("학교급 · 지역 · 가구 소득별 학생 1인당 월평균 사교육비(명목)", 26, 54);
      } else {
        ctx.fillStyle = DIM; ctx.font = `500 9.5px ${SANS}`;
        ctx.fillText("학생 1인당 월평균 사교육비(명목)", 12, 38);
      }

      const top0 = full ? 74 : 62;
      let bounds = [];
      const totalSlots = groups.reduce((a, g) => a + g.vals.length, 0) + (groups.length - 1) * 1.4;
      const gx0 = full ? 30 : 10, gx1 = w - (full ? 30 : 10);
      let slot = 0;
      groups.forEach((g) => {
        const gStartSlot = slot;
        g.vals.forEach((v, i) => {
          const cx = gx0 + (slot + 0.5) / totalSlots * (gx1 - gx0);
          const rx = Math.max(3, (gx1 - gx0) / totalSlots * 0.32);
          const hh = KF.clamp(v / maxV, 0, 1) * maxH;
          stack(ctx, cx, baseY, hh, rx, g.pal, 1);
          bounds.push({ cx, label: g.labels[i], v, group: g.label });
          ctx.save();
          ctx.translate(cx, baseY + (full ? 16 : 12));
          ctx.rotate(full ? 0 : -Math.PI / 5);
          ctx.textAlign = full ? "center" : "right";
          ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10.5 : 8}px ${SANS}`;
          ctx.fillText(g.labels[i].length > 6 && full ? g.labels[i].slice(0, 5) + "…" : g.labels[i], 0, 0);
          ctx.restore();
          slot++;
        });
        const gEndX = gx0 + (slot - 0.3) / totalSlots * (gx1 - gx0);
        const gStartX = gx0 + (gStartSlot + 0.3) / totalSlots * (gx1 - gx0);
        ctx.fillStyle = INK; ctx.font = `600 ${full ? 11.5 : 9.5}px ${SANS}`; ctx.textAlign = "center";
        ctx.fillText(g.label, (gStartX + gEndX) / 2, top0 - 6);
        slot += 1.4;
      });

      if (hover) {
        const hb = bounds.reduce((a, b) => Math.abs(b.cx - hover[0]) < Math.abs(a.cx - hover[0]) ? b : a, bounds[0]);
        if (hb && Math.abs(hb.cx - hover[0]) < 26) {
          tipBox(ctx, w, h, hover[0], hover[1], [[`${hb.group} · ${hb.label}`], [`1인당 ${hb.v.toFixed(1)}만원`, DIM]]);
        }
      }
    }
  }

  VIZ.hagwon = { thumb, mount, bg: BG };
})();
