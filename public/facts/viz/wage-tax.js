// 98 wage-tax — "급여봉투 (pay envelopes)". View 1: five pay-band envelopes, sized by how many people are
// in that band; a red stamp on each, sized by how much of all determined tax that band actually paid —
// small band, huge stamp, and back. View 2: one envelope per year (2013-2025), its top left unsealed
// (cross-hatched) in proportion to that year's share of filers with zero determined tax.
(() => {
  const BG = "#b9c4b0", KRAFT = "#cdae7c", INK = "#332417", DIM = "rgba(51,36,23,.64)", FAINT = "rgba(51,36,23,.22)";
  const STAMP = "#a3312a";
  const SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif", MONO = "IBM Plex Mono, monospace";

  function envelope(ctx, x, y, w, h) {
    ctx.fillStyle = "rgba(51,36,23,.14)"; ctx.fillRect(x + 2, y + 3, w, h);
    ctx.fillStyle = KRAFT; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(51,36,23,.4)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w / 2, y + h * 0.4); ctx.lineTo(x + w, y);
    ctx.moveTo(x, y + h); ctx.lineTo(x + w / 2, y + h * 0.4);
    ctx.moveTo(x + w, y + h); ctx.lineTo(x + w / 2, y + h * 0.4);
    ctx.strokeStyle = "rgba(51,36,23,.5)"; ctx.lineWidth = 1; ctx.stroke();
  }
  function stamp(ctx, cx, cy, r, k) {
    if (r < 2) return;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.18);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2 * k);
    ctx.strokeStyle = STAMP; ctx.lineWidth = Math.max(1.4, r * 0.16); ctx.lineCap = "round"; ctx.stroke();
    if (r > 10) { ctx.beginPath(); ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2 * k); ctx.lineWidth = Math.max(1, r * 0.07); ctx.stroke(); }
    ctx.restore();
  }
  // envelope whose top voidK share is cross-hatched empty — the zero-determined-tax filers that year.
  function envelopeVoid(ctx, x, y, w, h, voidK) {
    ctx.fillStyle = "rgba(51,36,23,.14)"; ctx.fillRect(x + 2, y + 3, w, h);
    ctx.fillStyle = KRAFT; ctx.fillRect(x, y, w, h);
    const vh = h * voidK;
    if (vh > 1) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x + 1, y + 1, w - 2, vh - 1); ctx.clip();
      ctx.strokeStyle = "rgba(51,36,23,.4)"; ctx.lineWidth = 1;
      for (let hx = -h - w; hx < w + h; hx += 5) { ctx.beginPath(); ctx.moveTo(x + hx, y + h); ctx.lineTo(x + hx + h, y); ctx.stroke(); }
      ctx.restore();
    }
    ctx.strokeStyle = "rgba(51,36,23,.5)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    if (vh > 2) { ctx.beginPath(); ctx.setLineDash([3, 2]); ctx.moveTo(x, y + vh); ctx.lineTo(x + w, y + vh); ctx.strokeStyle = STAMP; ctx.lineWidth = 1.3; ctx.stroke(); ctx.setLineDash([]); }
  }
  function wrapLabel(ctx, text, cx, y, maxW, lh) {
    const words = text.split(" "); let line = "", lines = [];
    for (const wd of words) { const t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t; }
    lines.push(line);
    lines.forEach((ln, i) => ctx.fillText(ln, cx, y + i * lh));
  }

  function bandItems(d) { return d.bands.map((b) => ({ key: b.label, label: b.label, nShare: b.nShare, taxShare: b.taxShare, n: b.n })); }
  const top10Share = (d) => d.decileLatest.find((x) => x.code === "B02").taxShare;

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    if (!d) return;
    const bands = bandItems(d), lo = bands[0], hi = bands[bands.length - 1];
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${w * 0.05}px ${SERIF}`;
    ctx.fillText("작은 봉투, 큰 도장", w * 0.055, h * 0.32);
    const maxTax = Math.max(...bands.map((b) => b.taxShare));
    const pairs = [{ b: lo, x: w * 0.18, s: 1 }, { b: hi, x: w * 0.62, s: 0.46 }];
    pairs.forEach(({ b, x, s }) => {
      const ew = w * 0.22 * s, eh = h * 0.38 * s, ey = h * 0.86 - eh;
      envelope(ctx, x, ey, ew, eh);
      stamp(ctx, x + ew * 0.55, ey + eh * 0.6, Math.max(6, ew * 0.5 * Math.sqrt(Math.max(0.5, b.taxShare) / maxTax)), 1);
      ctx.fillStyle = INK; ctx.font = `600 ${w * 0.026}px ${SANS}`;
      wrapLabel(ctx, b.label, x, h * 0.94, ew + 24, w * 0.03);
      ctx.fillStyle = STAMP; ctx.font = `700 ${w * 0.024}px ${MONO}`;
      ctx.fillText(`세금 ${b.taxShare.toFixed(1)}%`, x, ey - 6);
    });
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage), canvas = sc.c;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bands = bandItems(d);
    let view = "bands", hover = null, areas = [], selected = bands[0].key, tStart = performance.now();

    const detail = document.createElement("p");
    detail.style.cssText = "width:100%;margin:6px 0 0;font-size:13.5px;line-height:1.65";
    detail.setAttribute("aria-live", "polite");
    function bandDetail(b) {
      return `${b.label}: 신고 인원의 ${b.nShare.toFixed(1)}%(${Math.round(b.n).toLocaleString("ko-KR")}명)가 ${d.bandYear}년 결정세액의 ${b.taxShare < 1 ? b.taxShare.toFixed(2) : b.taxShare.toFixed(1)}%를 냈다.`;
    }
    function yearDetail(s) {
      const gapNote = d.gap.includes(s.y) ? "" : "";
      return `${s.y}년: 신고 ${s.total.toLocaleString("ko-KR")}명 중 결정세액 0원 ${s.zero.toLocaleString("ko-KR")}명(${s.zeroShare.toFixed(1)}%).${gapNote}`;
    }
    function setView(id) { view = id; hover = null; selected = id === "bands" ? bands[0].key : String(d.series[0].y); tStart = performance.now(); request();
      detail.textContent = id === "bands" ? bandDetail(bands[0]) : yearDetail(d.series[0]); }
    KF.segment(controls, [{ id: "bands", label: "급여 구간별 도장" }, { id: "years", label: "면세자 비율 추이" }], view, setView);
    controls.append(detail);
    detail.textContent = bandDetail(bands[0]);

    let raf = 0;
    function request() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); }

    // One row of envelopes, each item's height driven by sizeKey (0-100ish scale) and a red stamp/void
    // driven by voidOrTax. Wraps into 2 rows on narrow stages when there are more than ~5 items.
    function drawRow(ctx, w, h, full, grow, items, sizeKey, mode) {
      const n = items.length;
      const cols = full ? n : (n <= 5 ? n : Math.ceil(n / 2));
      const rows = Math.ceil(n / cols);
      const left = full ? 26 : 14, right = full ? 26 : 14;
      const slot = (w - left - right) / cols;
      const maxEW = Math.min(slot * 0.72, full ? 150 : 70), maxEH = maxEW * 1.3;
      const lh = full ? 14 : 11;
      const zoneTop = full ? 96 : 78, zoneBottom = h - (full ? 14 : 10);
      const rowGap = rows > 1 ? (full ? 8 : 30) : 0;
      const rowH = (zoneBottom - zoneTop - (rows - 1) * rowGap) / rows;
      const capH = (full ? 20 : 16) + lh + 4;
      const maxSize = Math.max(...items.map((it) => it[sizeKey]));
      areas = [];
      for (let ri = 0; ri < rows; ri++) {
        const rowItems = items.slice(ri * cols, ri * cols + cols);
        const rowTop = zoneTop + ri * (rowH + rowGap), rowBottom = rowTop + rowH;
        const geom = (base) => rowItems.map((it, i) => {
          const scale = Math.max(0.28, Math.sqrt(it[sizeKey] / maxSize)) * grow;
          const ew = maxEW * scale, eh = maxEH * scale;
          const cx = left + slot * (i + 0.5), ex = cx - ew / 2, ey = base - eh;
          const r = mode === "stamp" ? Math.max(3, maxEH * 0.34 * Math.sqrt(Math.max(0.02, it.taxShare) / 100)) * grow : 0;
          return { it, ew, eh, cx, ex, ey, r, scx: ex + ew * 0.52, scy: ey + eh * 0.58 };
        });
        const probe = geom(0);
        const aboveBase = -(Math.min(...probe.map((g) => Math.min(g.ey, g.scy - g.r))) - 10 - lh - 10);
        const belowBase = Math.max(...probe.map((g) => Math.max(0, g.scy + g.r))) + capH;
        const base = (rowTop + rowBottom) / 2 - (belowBase - aboveBase) / 2;
        const G = geom(base);
        const topY = Math.min(...G.map((g) => Math.min(g.ey, g.scy - g.r))) - 10;
        const labelY = Math.max(...G.map((g) => Math.max(base, g.scy + g.r))) + (full ? 20 : 16);
        const gaps = [];
        G.forEach(({ it, ew, eh, cx, ex, ey, r, scx, scy }) => {
          const on = String(it.key) === selected, hv = String(it.key) === hover;
          if (on || hv) { ctx.strokeStyle = on ? STAMP : FAINT; ctx.lineWidth = on ? 2 : 1; ctx.strokeRect(ex - 6, ey - 6, ew + 12, eh + 12); }
          if (mode === "stamp") { envelope(ctx, ex, ey, ew, eh); stamp(ctx, scx, scy, r, Math.min(1, grow)); }
          else envelopeVoid(ctx, ex, ey, ew, eh, (it.zeroShare / 100) * Math.min(1, grow));
          ctx.textAlign = "center";
          ctx.fillStyle = INK; ctx.font = `600 ${full ? 12 : 9.5}px ${mode === "stamp" ? SANS : MONO}`;
          wrapLabel(ctx, String(it.label), cx, labelY, slot - 4, full ? 13 : 10.5);
          ctx.fillStyle = STAMP; ctx.font = `700 ${full ? 12 : 9.5}px ${MONO}`;
          ctx.fillText(mode === "stamp" ? `세금 ${it.taxShare < 1 ? it.taxShare.toFixed(2) : it.taxShare.toFixed(1)}%` : `${it.zeroShare.toFixed(0)}%`, cx, topY);
          if (mode === "stamp") { ctx.fillStyle = DIM; ctx.font = `${full ? 11 : 8.5}px ${MONO}`; ctx.fillText(`인원 ${it.nShare.toFixed(1)}%`, cx, topY - lh); }
          ctx.textAlign = "left";
          areas.push({ key: String(it.key), ref: it, x: ex - 8, y: topY - lh - 10, w: ew + 16, h: labelY + 14 - (topY - lh - 10) });
          // gap marker: a year column missing the next chronological year (2022-2023 not in KOSIS).
          // Collected here, drawn in a second pass below so a later envelope never paints over the label.
          if (mode === "void") {
            const nextIdx = d.series.findIndex((s) => s.y === it.key) + 1;
            const nextY = d.series[nextIdx] && d.series[nextIdx].y;
            if (nextY && nextY - it.key > 1) gaps.push({ x: cx + slot / 2, y: ey + eh * 0.55 });
          }
        });
        ctx.strokeStyle = FAINT; ctx.beginPath(); ctx.moveTo(left - 6, base + 2); ctx.lineTo(w - right + 6, base + 2); ctx.stroke();
        ctx.fillStyle = DIM; ctx.textAlign = "center";
        if (full) { ctx.font = "9.5px " + SANS; gaps.forEach(({ x, y }) => wrapLabel(ctx, "자료 없음", x, y - 5, slot * 0.9, 11)); }
        else { ctx.font = "600 12px " + MONO; gaps.forEach(({ x, y }) => ctx.fillText("⋯", x, y)); }
        ctx.textAlign = "left";
      }
    }

    function draw() {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 25 : 18}px ${SERIF}`;
      ctx.fillText(view === "bands" ? "작은 봉투, 큰 도장" : "봉투 위쪽 빈 칸 = 그해 면세자", full ? 22 : 14, full ? 36 : 26);
      ctx.fillStyle = DIM; ctx.font = `${full ? 12.5 : 10}px ${SANS}`;
      ctx.fillText(
        view === "bands" ? `${d.bandYear}년 · 봉투 크기 = 신고 인원 비중 · 도장 크기 = 결정세액 비중`
                          : `해마다 결정세액 0원인 신고자의 비중 · 점선 = 그해의 경계`,
        full ? 22 : 14, full ? 55 : 40
      );
      if (full) {
        ctx.fillStyle = STAMP; ctx.font = `600 12px ${SANS}`; ctx.textAlign = "right";
        ctx.fillText(`총급여 상위 10% 신고자가 낸 결정세액 ${top10Share(d).toFixed(1)}%(${d.bandYear}년)`, w - 22, 30);
        ctx.textAlign = "left";
      }
      const grow = reduced ? 1 : KF.ease(Math.min(1, ((performance.now() - tStart) / 1000 - 0.15) / 1.2));
      if (view === "bands") drawRow(ctx, w, h, full, grow, bands, "nShare", "stamp");
      else drawRow(ctx, w, h, full, grow, d.series.map((s) => ({ ...s, key: s.y, label: s.y })), "zeroShare", "void");
      if (!reduced && grow < 1) request();
    }

    function hit(e) { const b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top; return areas.find((a) => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h); }
    canvas.addEventListener("pointermove", (e) => {
      const a = hit(e);
      if ((a ? a.key : null) !== hover) { hover = a ? a.key : null; canvas.style.cursor = hover ? "pointer" : "default"; request(); }
      if (a) detail.textContent = view === "bands" ? bandDetail(a.ref) : yearDetail(a.ref);
    });
    canvas.addEventListener("pointerleave", () => { hover = null; request(); });
    canvas.addEventListener("click", (e) => {
      const a = hit(e); if (!a) return;
      selected = a.key;
      detail.textContent = view === "bands" ? bandDetail(a.ref) : yearDetail(a.ref);
      request();
    });

    sc.onresize = () => request();
    stage._kfStill = () => draw();
    draw();
  }

  VIZ["wage-tax"] = { thumb, mount, bg: BG };
})();
