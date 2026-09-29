// 94 reading — "접힌 귀퉁이 (dog-eared pages)". One page per age group. The corner fold is
// how many points its reading rate fell from 2019 to 2025 — 20대's page is almost flat,
// 40대's is folded halfway down the sheet. Same generic word ("성인"), very different pages.
(() => {
  const BG = "#d9d0b8", PAGE = "#fbf6ea", FOLD = "#e6d9bd", INK = "#3a2f20", DIM = "rgba(58,47,32,.62)", FAINT = "rgba(58,47,32,.14)";
  const RULE = "rgba(58,47,32,.09)", ACCENT = "#a8492f";
  const PAPER_C = "#a8492f", EBOOK_C = "#2f7391", AUDIO_C = "#c08a2e";
  const SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif", MONO = "IBM Plex Mono, monospace";

  function groupsOf(d) {
    const byKey = Object.fromEntries(d.ages.map((a) => [a.key, a]));
    return [
      { key: "adultAll", label: "성인 전체", rate: d.adultAll, media: d.media23_25.all, volume: d.volume.all },
      { key: "studentAll", label: "학생", rate: d.studentAll, media: null, volume: d.volume.student },
      { key: "20s", label: "20대", rate: byKey["20s"].rate, media: d.media23_25.byAge["20s"], volume: d.volume.byAge["20s"] },
      { key: "30s", label: "30대", rate: byKey["30s"].rate, media: d.media23_25.byAge["30s"], volume: d.volume.byAge["30s"] },
      { key: "40s", label: "40대", rate: byKey["40s"].rate, media: d.media23_25.byAge["40s"], volume: d.volume.byAge["40s"] },
      { key: "50s", label: "50대", rate: byKey["50s"].rate, media: d.media23_25.byAge["50s"], volume: d.volume.byAge["50s"] },
    ].map((g) => ({ ...g, drop: g.rate[0] - g.rate[g.rate.length - 1] }));
  }

  // a page with a folded top-right corner; foldK in [0,1] is how deep the fold reaches down the edge
  function page(ctx, x, y, w, h, foldK, grow) {
    ctx.save();
    ctx.fillStyle = "rgba(58,47,32,.16)"; ctx.fillRect(x + 3, y + 4, w, h);
    ctx.fillStyle = PAGE; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = RULE;
    for (let i = 1; i <= 4; i++) { const ly = y + h * (0.56 + i * 0.09); ctx.beginPath(); ctx.moveTo(x + 10, ly); ctx.lineTo(x + w - 10, ly); ctx.stroke(); }
    const s = Math.min(w, h) * (0.16 + 0.62 * foldK) * grow;
    if (s > 1.5) {
      ctx.beginPath(); ctx.moveTo(x + w - s, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + s); ctx.closePath();
      ctx.fillStyle = "rgba(58,47,32,.13)"; ctx.fill();
      const g = ctx.createLinearGradient(x + w - s, y, x + w, y + s);
      g.addColorStop(0, FOLD); g.addColorStop(1, "#d8c8a2");
      ctx.beginPath(); ctx.moveTo(x + w - s, y); ctx.lineTo(x + w, y + s); ctx.lineTo(x + w - s, y + s * 0.42); ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = "rgba(58,47,32,.3)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w - s, y); ctx.lineTo(x + w, y + s); ctx.stroke();
    }
    ctx.restore();
    return s;
  }

  function sparkline(ctx, x, y, w, h, values, vmin, vmax, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.beginPath();
    values.forEach((v, i) => {
      const xx = x + (i / (values.length - 1)) * w, yy = y + h - ((v - vmin) / (vmax - vmin || 1)) * h;
      i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    });
    ctx.stroke();
    values.forEach((v, i) => {
      const xx = x + (i / (values.length - 1)) * w, yy = y + h - ((v - vmin) / (vmax - vmin || 1)) * h;
      ctx.beginPath(); ctx.arc(xx, yy, i === values.length - 1 ? 2.6 : 1.8, 0, 7);
      ctx.fillStyle = i === values.length - 1 ? color : PAGE; ctx.strokeStyle = color; ctx.lineWidth = 1.3; ctx.fill(); ctx.stroke();
    });
  }

  function stackBar(ctx, x, y, w, h, segs) {
    let xx = x;
    const tot = segs.reduce((s, v) => s + v.v, 0) || 1;
    for (const seg of segs) {
      const sw = (seg.v / tot) * w;
      ctx.fillStyle = seg.c; ctx.fillRect(xx, y, Math.max(0, sw - 1), h);
      xx += sw;
    }
  }

  // ---------------------------------------------------------------- thumb: one flat page, one deeply folded
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    if (!d) return;
    const gs = groupsOf(d), g20 = gs.find((g) => g.key === "20s"), g40 = gs.find((g) => g.key === "40s");
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${w * 0.05}px ${SERIF}`;
    ctx.fillText("같은 성인, 다른 접힌 페이지", w * 0.055, h * 0.28);
    const cw = w * 0.4, ch = h * 0.42, y0 = h * 0.35;
    [{ g: g20, x: w * 0.055 }, { g: g40, x: w * 0.54 }].forEach(({ g, x }) => {
      page(ctx, x, y0, cw, ch, Math.min(1, g.drop / 20), 1);
      ctx.fillStyle = INK; ctx.font = `700 ${w * 0.036}px ${SANS}`;
      ctx.fillText(g.label, x + 10, y0 + ch * 0.28);
      ctx.fillStyle = DIM; ctx.font = `${w * 0.024}px ${MONO}`;
      ctx.fillText(`${d.years[0]} ${g.rate[0].toFixed(1)}%`, x + 10, y0 + ch * 0.42);
      ctx.fillStyle = ACCENT; ctx.font = `700 ${w * 0.024}px ${MONO}`;
      ctx.fillText(`${d.years[3]} ${g.rate[3].toFixed(1)}%`, x + 10, y0 + ch * 0.54);
      ctx.fillStyle = INK; ctx.font = `600 ${w * 0.026}px ${SANS}`;
      ctx.fillText(`${g.drop >= 0 ? "-" : "+"}${Math.abs(g.drop).toFixed(1)}%p`, x + 10, y0 + ch * 0.7);
    });
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage), canvas = sc.c;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const groups = groupsOf(d);
    const maxDrop = Math.max(...groups.map((g) => g.drop));
    let view = "rate", selected = "40s", hover = null, areas = [];
    const t0 = performance.now();

    const detail = document.createElement("p");
    detail.style.cssText = "width:100%;margin:6px 0 0;font-size:13.5px;line-height:1.65";
    detail.setAttribute("aria-live", "polite");
    function fmtDetail(g) {
      const traj = d.years.map((y, i) => `${y} ${g.rate[i].toFixed(1)}%`).join(" · ");
      let extra = "";
      if (g.media) extra = ` 2025년 매체: 종이책 ${g.media.종이책["2025"].toFixed(1)}% · 전자책 ${g.media.전자책["2025"].toFixed(1)}% · 오디오북 ${g.media.오디오북["2025"].toFixed(1)}%.`;
      const vol = g.volume ? ` 연간 독서량 ${g.volume["2023"].toFixed(1)}권 → ${g.volume["2025"].toFixed(1)}권.` : "";
      return `${g.label}: ${traj}. 2019→2025 ${g.drop >= 0 ? "-" : "+"}${Math.abs(g.drop).toFixed(1)}%p.${extra}${vol}`;
    }
    function pick(key) { selected = key; detail.textContent = fmtDetail(groups.find((g) => g.key === key)); request(); }
    KF.segment(controls, [{ id: "rate", label: "독서율 변화" }, { id: "media", label: "매체 구성(2025)" }], view, (id) => { view = id; request(); });
    controls.append(detail);

    let raf = 0;
    function request() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); }

    function draw() {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 26 : 19}px ${SERIF}`;
      ctx.fillText("접힌 귀퉁이, 세대마다 다르다", full ? 22 : 14, full ? 38 : 28);
      ctx.fillStyle = DIM; ctx.font = `${full ? 12.5 : 10.5}px ${SANS}`;
      ctx.fillText(`귀퉁이 깊이 = ${d.years[0]}→${d.years[3]}년 독서율이 줄어든 정도`, full ? 22 : 14, full ? 58 : 42);

      const cols = full ? 3 : 2, rows = Math.ceil(groups.length / cols);
      const left = full ? 22 : 14, top = full ? 78 : 58, gap = full ? 16 : 10;
      const cw = (w - left * 2 - gap * (cols - 1)) / cols, ch = (h - top - (full ? 24 : 14) - gap) / rows;
      const grow = reduced ? 1 : KF.ease(Math.min(1, ((performance.now() - t0) / 1000 - 0.15) / 1.3));
      areas = [];
      groups.forEach((g, i) => {
        const cx = left + (i % cols) * (cw + gap), cy = top + Math.floor(i / cols) * (ch + gap);
        const on = g.key === selected, hv = g.key === hover;
        if (on || hv) { ctx.strokeStyle = on ? ACCENT : FAINT; ctx.lineWidth = on ? 2 : 1; ctx.strokeRect(cx - 3, cy - 3, cw + 6, ch + 6); }
        page(ctx, cx, cy, cw, ch, Math.max(0, g.drop) / maxDrop, grow);
        ctx.fillStyle = INK; ctx.font = `700 ${full ? 15 : 12.5}px ${SANS}`;
        ctx.fillText(g.label, cx + 12, cy + (full ? 24 : 20));
        ctx.fillStyle = DIM; ctx.font = `${full ? 11.5 : 9.5}px ${MONO}`;
        ctx.fillText(`${d.years[0]} ${g.rate[0].toFixed(1)}%`, cx + 12, cy + (full ? 42 : 36));
        ctx.fillStyle = ACCENT; ctx.font = `700 ${full ? 20 : 16}px ${SANS}`;
        ctx.fillText(`${g.rate[3].toFixed(1)}%`, cx + 12, cy + (full ? 68 : 56));
        ctx.fillStyle = DIM; ctx.font = `${full ? 10.5 : 9}px ${SANS}`;
        ctx.fillText(`${d.years[3]}년 · ${g.drop >= 0 ? "-" : "+"}${Math.abs(g.drop).toFixed(1)}%p`, cx + 12, cy + (full ? 84 : 70));
        const bandY = cy + ch - (full ? 22 : 16), bandH = full ? 12 : 8, bandX = cx + 12, bandW = cw - 24;
        if (view === "rate") {
          sparkline(ctx, bandX, bandY - bandH, bandW, bandH + 4, g.rate, Math.min(...g.rate) - 2, Math.max(...g.rate) + 2, ACCENT);
        } else if (g.media) {
          stackBar(ctx, bandX, bandY, bandW, bandH, [
            { v: g.media.종이책["2025"], c: PAPER_C }, { v: g.media.전자책["2025"], c: EBOOK_C }, { v: g.media.오디오북["2025"], c: AUDIO_C },
          ]);
        } else {
          ctx.fillStyle = DIM; ctx.font = `${full ? 10 : 8.5}px ${SANS}`;
          ctx.fillText("학생 조사는 매체 구분 없음", bandX, bandY + bandH - 1);
        }
        areas.push({ key: g.key, x: cx, y: cy, w: cw, h: ch });
      });

      if (full) {
        ctx.fillStyle = INK; ctx.font = `500 12px ${SANS}`;
        if (view === "media") {
          const lx = left; const ly = h - 8;
          const chip = (x, c, label) => { ctx.fillStyle = c; ctx.fillRect(x, ly - 9, 9, 9); ctx.fillStyle = INK; ctx.fillText(label, x + 13, ly); return x + 13 + ctx.measureText(label).width + 18; };
          let cx2 = chip(lx, PAPER_C, "종이책"); cx2 = chip(cx2, EBOOK_C, "전자책"); cx2 = chip(cx2, AUDIO_C, "오디오북");
          ctx.fillStyle = DIM; ctx.font = `11px ${SANS}`; ctx.fillText("막대 폭 = 매체별 독서율의 상대 비교(중복 응답, 합 100% 아님)", cx2 + 10, ly);
        } else {
          ctx.fillStyle = DIM; ctx.fillText(`선 = ${d.years.join("·")}년 독서율 추이`, left, h - 8);
        }
      }
      if (!reduced && grow < 1) request();
    }

    function hit(e) { const b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top; return areas.find((a) => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h); }
    canvas.addEventListener("pointermove", (e) => {
      const a = hit(e); const key = a ? a.key : null;
      if (key !== hover) { hover = key; canvas.style.cursor = key ? "pointer" : "default"; request(); }
      if (a) detail.textContent = fmtDetail(groups.find((g) => g.key === a.key));
    });
    canvas.addEventListener("pointerleave", () => { hover = null; detail.textContent = fmtDetail(groups.find((g) => g.key === selected)); request(); });
    canvas.addEventListener("click", (e) => { const a = hit(e); if (a) pick(a.key); });

    sc.onresize = () => request();
    stage._kfStill = () => draw();
    pick(selected);
    draw();
  }

  VIZ.reading = { thumb, mount, bg: BG };
})();
