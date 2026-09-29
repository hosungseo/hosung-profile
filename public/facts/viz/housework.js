// 62 housework — "앞치마 눈금". Two apron silhouettes (husband / wife), each filled like a measuring jug
// with that day's housework+care minutes, on a shared scale so the two fill levels are directly comparable.
// Tick marks every 30 minutes. Segment control switches between dual-earner couples and all adults.
(() => {
  const BG = "#d8e4cf";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#26361f", DIM = "rgba(38,54,31,.62)", FAINT = "rgba(38,54,31,.16)";
  const MAN = "#4f7ab0", MAN_D = "#3a5c8a", WOM = "#c26a52", WOM_D = "#9a4e3a";
  const CLOTH = "rgba(255,255,255,.55)", CARD = "#fbfbf3";
  const MAXMIN = 220;

  function apronPath(ctx, x, y, w, h) {
    const bibW = w * 0.5, bibH = h * 0.24, neckR = bibW * 0.16;
    const wx0 = x + (w - bibW) / 2, wx1 = wx0 + bibW, wy = y + bibH;
    ctx.beginPath();
    ctx.moveTo(wx0 + neckR, y);
    ctx.lineTo(wx1 - neckR, y);
    ctx.quadraticCurveTo(wx1, y, wx1, y + neckR);
    ctx.lineTo(wx1, wy - h * 0.02);
    ctx.quadraticCurveTo(wx1, wy, wx1 + w * 0.03, wy + h * 0.02);
    ctx.lineTo(x + w, y + h * 0.94);
    ctx.quadraticCurveTo(x + w, y + h, x + w - w * 0.04, y + h);
    ctx.lineTo(x + w * 0.04, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h * 0.94);
    ctx.lineTo(wx0 - w * 0.03, wy + h * 0.02);
    ctx.quadraticCurveTo(wx0, wy, wx0, wy - h * 0.02);
    ctx.lineTo(wx0, y + neckR);
    ctx.quadraticCurveTo(wx0, y, wx0 + neckR, y);
    ctx.closePath();
  }

  function apron(ctx, x, y, w, h, minutes, color, colorD, label, full, hover) {
    const frac = KF.clamp(minutes / MAXMIN, 0, 1);
    apronPath(ctx, x, y, w, h);
    ctx.fillStyle = CLOTH; ctx.fill();
    ctx.save();
    apronPath(ctx, x, y, w, h);
    ctx.clip();
    const fillY = y + h * (1 - frac);
    ctx.fillStyle = color;
    ctx.fillRect(x - 4, fillY, w + 8, h - (fillY - y) + 4);
    // a soft top edge on the "liquid"
    ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.fillRect(x - 4, fillY, w + 8, Math.max(2, h * 0.012));
    ctx.restore();
    apronPath(ctx, x, y, w, h);
    ctx.strokeStyle = colorD; ctx.lineWidth = full ? 2 : 1.4; ctx.stroke();
    // pocket line + tie
    ctx.strokeStyle = "rgba(38,54,31,.28)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + w * 0.18, y + h * 0.62); ctx.lineTo(x + w * 0.82, y + h * 0.62); ctx.stroke();
    // ticks every 30 min on the right edge
    ctx.textAlign = "left"; ctx.font = `500 ${full ? 9.5 : 8.5}px ${MONO}`;
    for (let m = 30; m < MAXMIN; m += 30) {
      const ty = y + h * (1 - m / MAXMIN);
      ctx.strokeStyle = FAINT; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + w + 2, ty); ctx.lineTo(x + w + 8, ty); ctx.stroke();
      if (full && m % 60 === 0) { ctx.fillStyle = DIM; ctx.fillText(`${m / 60}h`, x + w + 11, ty + 3); }
    }
    const hit = hover && hover[0] >= x && hover[0] <= x + w && hover[1] >= y && hover[1] <= y + h;
    return { hit, frac };
  }

  // ---------------------------------------------------------------- data
  function dualAt(d, yi) {
    return {
      husband: d.dual.husband.home[yi] + d.dual.husband.care[yi],
      wife: d.dual.wife.home[yi] + d.dual.wife.care[yi],
      hHome: d.dual.husband.home[yi], hCare: d.dual.husband.care[yi],
      wHome: d.dual.wife.home[yi], wCare: d.dual.wife.care[yi],
    };
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 13px ${SANS}` : `500 11.5px ${SANS}`);
    let bw = 0;
    for (const [t] of lines) { ctx.font = fontOf(0); bw = Math.max(bw, ctx.measureText(t).width); }
    bw += 22; const bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6);
    const by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = CARD; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], i) => { ctx.fillStyle = INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + i * 18); });
  }

  const mm = (n) => { const h = Math.floor(n / 60), m = Math.round(n % 60); return h ? `${h}시간 ${m}분` : `${m}분`; };

  // ---------------------------------------------------------------- thumb
  // Card layout guard: badge top-left (x<96, y<40), glyph bottom-left (x<50, y>h-50) — captions
  // below stay left of x=50 only while y<=h-60, clearing the glyph box.
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, phase = c < 6 ? 0 : d.dualYears.length - 1;
    const grow = KF.ease(KF.clamp((c % 6) / 4, 0, 1));
    const vals = dualAt(d, phase);
    const botY2 = h - 60, botY1 = h - 82;
    const aw = h * 0.3, ax = w * 0.5, apronTop = 44, apronH = botY1 - apronTop - 14;
    apron(ctx, ax - aw * 1.25, apronTop, aw, apronH, vals.husband * grow, MAN, MAN_D, "", w > 260, null);
    apron(ctx, ax + aw * 0.25, apronTop, aw, apronH, vals.wife * grow, WOM, WOM_D, "", w > 260, null);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.07)}px ${SANS}`;
    ctx.fillText("맞벌이 집안일", w * 0.045, botY1);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.048)}px ${MONO}`;
    ctx.fillText(`${d.dualYears[phase]}년 · 아내 ${(vals.wife / vals.husband).toFixed(1)}배`, w * 0.045, botY2);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage);
    let mode = "dual", yi = d.dualYears.length - 1, t0 = performance.now(), tGrow = performance.now(), hover = null;
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "·";
    let yearBtns = null;
    function buildYearButtons() {
      if (yearBtns) yearBtns.forEach((b) => b.remove());
      const years = mode === "dual" ? d.dualYears : d.allYears;
      yearBtns = KF.segment(controls, years.map((y, i) => ({ id: i, label: `${y}` })), yi, (id) => { yi = id; tGrow = performance.now(); });
    }
    KF.segment(controls, [{ id: "dual", label: "맞벌이 부부" }, { id: "all", label: "전체 성인" }], "dual", (id) => {
      mode = id; yi = (mode === "dual" ? d.dualYears : d.allYears).length - 1; tGrow = performance.now();
      buildYearButtons();
    });
    controls.appendChild(sep);
    buildYearButtons();
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const elGrow = (performance.now() - tGrow) / 1000, grow = KF.ease(KF.clamp(elGrow / 1.1, 0, 1));
      const years = mode === "dual" ? d.dualYears : d.allYears;
      const y = years[yi];
      let hVal, wVal, hHome, hCare, wHome, wCare, ratio;
      if (mode === "dual") {
        const v = dualAt(d, yi);
        hVal = v.husband; wVal = v.wife; hHome = v.hHome; hCare = v.hCare; wHome = v.wHome; wCare = v.wCare;
      } else {
        hVal = d.all.man[yi]; wVal = d.all.woman[yi];
      }
      ratio = wVal / hVal;
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 14.5}px ${SERIF}`;
      ctx.fillText(`${y}년 · ${mode === "dual" ? "맞벌이 부부" : "전체 성인"}`, full ? 26 : 14, full ? 32 : 22);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 9.5}px ${SANS}`;
      ctx.fillText("하루 평균 가사·돌봄 (가정관리 + 가족 돌보기)", full ? 26 : 14, full ? 52 : 38);
      const ratioTxt = `${mode === "dual" ? "아내" : "여자"}가 ${mode === "dual" ? "남편" : "남자"}의 ${ratio.toFixed(1)}배`;
      if (full) {
        ctx.fillStyle = INK; ctx.font = `600 12.5px ${SANS}`; ctx.textAlign = "right";
        ctx.fillText(ratioTxt, w - 26, 32);
        if (mode === "dual") {
          ctx.fillStyle = DIM; ctx.font = `500 11px ${MONO}`;
          ctx.fillText(`${d.ctx.h0}년 ${d.ctx.ratio0}배 → ${d.ctx.h1}년 ${d.ctx.ratio1}배`, w - 26, 52);
        }
        ctx.textAlign = "left";
      } else {
        ctx.fillStyle = INK; ctx.font = `600 11px ${SANS}`;
        ctx.fillText(ratioTxt, 14, 56);
      }

      const top = full ? 78 : 76, areaH = h - top - (full ? 56 : 88);
      const aw = Math.min(full ? 180 : 110, w * 0.24);
      const cx = w / 2, gap = full ? 70 : 34;
      const r1 = apron(ctx, cx - gap - aw, top, aw, areaH, hVal * grow, MAN, MAN_D, "남편/남자", full, hover);
      const r2 = apron(ctx, cx + gap, top, aw, areaH, wVal * grow, WOM, WOM_D, "아내/여자", full, hover);
      ctx.textAlign = "center"; ctx.fillStyle = MAN_D; ctx.font = `700 ${full ? 13 : 11.5}px ${SANS}`;
      ctx.fillText(mode === "dual" ? "남편" : "남자", cx - gap - aw / 2, top + areaH + (full ? 22 : 18));
      ctx.fillStyle = DIM; ctx.font = `600 ${full ? 12 : 10.5}px ${MONO}`;
      ctx.fillText(mm(hVal), cx - gap - aw / 2, top + areaH + (full ? 42 : 34));
      ctx.fillStyle = WOM_D; ctx.font = `700 ${full ? 13 : 11.5}px ${SANS}`;
      ctx.fillText(mode === "dual" ? "아내" : "여자", cx + gap + aw / 2, top + areaH + (full ? 22 : 18));
      ctx.fillStyle = DIM; ctx.font = `600 ${full ? 12 : 10.5}px ${MONO}`;
      ctx.fillText(mm(wVal), cx + gap + aw / 2, top + areaH + (full ? 42 : 34));

      if (hover && (r1.hit || r2.hit)) {
        const lines = r1.hit
          ? (mode === "dual" ? [["남편", 1], [`가정관리 ${mm(hHome)}`, 0], [`가족 돌보기 ${mm(hCare)}`, 0]] : [["남자 (전체 성인)", 1], [`가사·돌봄 ${mm(hVal)}`, 0]])
          : (mode === "dual" ? [["아내", 1], [`가정관리 ${mm(wHome)}`, 0], [`가족 돌보기 ${mm(wCare)}`, 0]] : [["여자 (전체 성인)", 1], [`가사·돌봄 ${mm(wVal)}`, 0]]);
        tip(ctx, w, h, lines, hover);
      }
    });
  }

  VIZ.housework = { thumb, mount, bg: BG };
})();
