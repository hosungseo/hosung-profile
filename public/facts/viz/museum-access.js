// 100 museum-access — "전시벽 (gallery wall)". Every small frame is one real facility (박물관 or 미술관).
// Switching the metric re-sorts the same 1,208 frames into a new order: raw count crowns 경기,
// population-adjusted crowns 제주. The units never change — only which wall they hang on.
(() => {
  const BG = "#D9D2EB", INK = "#382847", PAPER = "#FFFDF7", MUSEUM = "#95607C", ART = "#2f7c86";
  const DIM = "rgba(56,40,71,.64)", FAINT = "rgba(56,40,71,.22)", RAIL = "rgba(56,40,71,.3)", HAIR = "rgba(56,40,71,.14)";
  const SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif", MONO = "IBM Plex Mono, monospace";
  const METRICS = {
    count: { id: "count", label: "시설 수", fmt: (r) => `${r.count}곳` },
    rate: { id: "rate", label: "인구 10만 명당", fmt: (r) => `${r.rate.toFixed(2)}곳` },
    visits: { id: "visits", label: "2024년 보고 관람인원", fmt: (r) => `${(r.visits / 10000).toFixed(1)}만 명` },
  };
  const MODES = ["count", "rate", "visits"];

  const sortedBy = (regions, mode) => [...regions].sort((a, b) => b[mode] - a[mode] || a.name.localeCompare(b.name, "ko"));
  const rankOf = (regions, mode, r) => sortedBy(regions, mode).findIndex((x) => x.name === r.name) + 1;

  // one little picture frame: border + mat + art square. At sub-3px sizes it collapses into a soft chip,
  // which reads as texture ("many, many facilities") rather than an individual unit — both are honest.
  function frame(ctx, x, y, size, art, hi) {
    ctx.fillStyle = hi ? "#fff" : INK;
    ctx.fillRect(x, y, size, size);
    if (size < 2.4) return;
    const m = Math.max(0.5, size * 0.15);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + m, y + m, Math.max(0, size - 2 * m), Math.max(0, size - 2 * m));
    const a = Math.max(0.5, size * 0.34);
    if (size - 2 * a > 0.3) { ctx.fillStyle = art; ctx.fillRect(x + a, y + a, size - 2 * a, size - 2 * a); }
  }

  // draw one region's cluster of frames (museums first, then art galleries — matches facility order)
  function cluster(ctx, x, y, r, step, cols, hiIndex) {
    for (let j = 0; j < r.count; j++) {
      const xx = x + (j % cols) * step, yy = y + Math.floor(j / cols) * step;
      frame(ctx, xx, yy, step * 0.8, j < r.museum ? MUSEUM : ART, j === hiIndex);
    }
    return Math.ceil(r.count / cols) * step;
  }

  // ---------------------------------------------------------------- layout (self-fits w × h, no fixed breakpoint constants)
  function layout(w, h, full, maxCount) {
    const cols = full ? 6 : 3, rows = Math.ceil(17 / cols);
    const left = w * (full ? 0.045 : 0.05), right = w * (full ? 0.03 : 0.04);
    const cw = (w - left - right) / cols;
    const cellCols = full ? 16 : 30;                 // frame-grid columns inside one region's cell
    const titleH = full ? 40 : 28, padBottom = full ? 10 : 6, gapRow = full ? 16 : 7;
    const top = full ? 100 : 78, legendH = full ? 42 : 26;
    const rowsMax = Math.ceil(maxCount / cellCols);
    const availH = Math.max(60, h - top - legendH - (rows - 1) * gapRow);
    const stepW = (cw - 10) / cellCols, stepH = (availH / rows - titleH - padBottom) / rowsMax;
    const step = Math.max(1, Math.min(stepW, stepH));
    const rh = titleH + rowsMax * step + padBottom;
    const slack = Math.max(0, availH - rows * rh);
    return { cols, rows, left, cw, cellCols, titleH, padBottom, gapRow, top: top + slack / 2, legendH, step, rh, rowsMax };
  }

  // ---------------------------------------------------------------- thumb: the flip, shown directly
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    if (!d) return;
    const regions = d.regions;
    const gg = regions.find((r) => r.name === "경기"), jj = regions.find((r) => r.name === "제주");
    ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `600 ${w * 0.052}px ${SERIF}`;
    ctx.fillText("같은 전시벽, 다른 1위", w * 0.055, h * 0.29);
    // centre seam like two wall panels meeting
    ctx.strokeStyle = HAIR; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.36); ctx.lineTo(w * 0.5, h * 0.86); ctx.stroke();
    const panels = [
      { r: gg, label: "시설 총량 1위", x: w * 0.055, cap: 96 },
      { r: jj, label: "인구 10만 명당 1위", x: w * 0.53, cap: 40 },
    ];
    const a = t > 9.3 ? 1 - (t - 9.3) / 0.7 : Math.min(1, t / 0.6);
    ctx.globalAlpha = a;
    for (const p of panels) {
      ctx.fillStyle = DIM; ctx.font = `600 ${w * 0.028}px ${SANS}`;
      ctx.fillText(p.label, p.x, h * 0.38);
      ctx.fillStyle = INK; ctx.font = `700 ${w * 0.05}px ${SANS}`;
      ctx.fillText(p.r.name, p.x, h * 0.48);
      const step = w * 0.011, cols = 12, n = Math.min(p.r.count, p.cap);
      for (let j = 0; j < n; j++) {
        const xx = p.x + (j % cols) * step, yy = h * 0.53 + Math.floor(j / cols) * step;
        frame(ctx, xx, yy, step * 0.78, j < p.r.museum ? MUSEUM : ART, -1);
      }
      ctx.fillStyle = INK; ctx.font = `700 ${w * 0.034}px ${MONO}`;
      ctx.fillText(METRICS[p === panels[0] ? "count" : "rate"].fmt(p.r), p.x, h * 0.8);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = DIM; ctx.font = `500 ${w * 0.026}px ${SANS}`; ctx.textAlign = "center";
    ctx.fillText("액자 한 점 = 실제 시설 한 곳", w * 0.52, h * 0.94);
  }

  // ---------------------------------------------------------------- mount: full interactive wall
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage), canvas = sc.c;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const maxCount = Math.max(...d.regions.map((r) => r.count));
    const fs = (sido) => d.facilities.filter((f) => f.sido === sido);

    let mode = "count", selected = "경기", facility = null, hover = null;
    let areas = [], from = {}, to = {}, beg = performance.now(), sizeKey = "", raf = 0;

    // Bands are sized by their own tallest member (not a global worst case), so a band made only of
    // small provinces sits close under the one above it instead of leaving a fixed gap everywhere.
    function positions(m, L) {
      const rs = sortedBy(d.regions, m);
      const out = {};
      let yCum = L.top;
      for (let b = 0; b < L.rows; b++) {
        const band = rs.slice(b * L.cols, b * L.cols + L.cols);
        if (!band.length) break;
        const rowsNeed = Math.max(...band.map((r) => Math.ceil(r.count / L.cellCols)));
        const bandH = L.titleH + rowsNeed * L.step + L.padBottom;
        band.forEach((r, ci) => { out[r.name] = { col: ci, y: yCum + L.titleH }; });
        yCum += bandH + L.gapRow;
      }
      return out;
    }
    function current(L) {
      const a = reduced ? 1 : KF.ease(Math.min(1, (performance.now() - beg) / 900));
      const out = {};
      for (const r of d.regions) {
        const f0 = from[r.name] || to[r.name], t1 = to[r.name];
        out[r.name] = { col: KF.lerp(f0.col, t1.col, a), y: KF.lerp(f0.y, t1.y, a) };
      }
      return out;
    }

    // ---- controls: metric segment, region select, facility select, live detail text
    const select = document.createElement("select"), fsel = document.createElement("select");
    select.setAttribute("aria-label", "전시벽 지역 선택");
    fsel.setAttribute("aria-label", "실제 박물관과 미술관 선택");
    select.style.maxWidth = "100%"; fsel.style.maxWidth = "100%";
    d.regions.forEach((r) => { const o = document.createElement("option"); o.value = r.name; o.textContent = r.name; select.append(o); });
    select.value = selected;
    const detail = document.createElement("p");
    detail.style.cssText = "width:100%;margin:6px 0 0;font-size:13.5px;line-height:1.65";
    detail.setAttribute("aria-live", "polite");

    function info() {
      const r = d.regions.find((x) => x.name === selected);
      const f = facility === null ? null : fs(selected)[facility];
      detail.textContent = f
        ? `${f.name} · ${f.kind} · 2024년 관람인원 ${f.visits == null ? "미확인" : f.visits.toLocaleString("ko-KR") + "명"}. 관광객과 반복 방문을 포함한 집계다.`
        : `${r.name}: 박물관 ${r.museum}곳 + 미술관 ${r.art}곳 = ${r.count}곳(총량 ${r.countRank}위). 인구 10만 명당 ${r.rate.toFixed(2)}곳(${r.rateRank}위). 보고 관람인원 ${r.visits.toLocaleString("ko-KR")}명, 관람 미확인 ${r.missing}곳.`;
    }
    function pickRegion(name) {
      selected = name; select.value = name; facility = null;
      fsel.replaceChildren();
      const o0 = document.createElement("option"); o0.value = ""; o0.textContent = "시설을 골라 실제 관람인원 보기"; fsel.append(o0);
      fs(name).forEach((f, i) => { const o = document.createElement("option"); o.value = i; o.textContent = f.name; fsel.append(o); });
      info(); request();
    }
    function move(id) {
      const L = layout(sc.w, sc.h, sc.w > 520, maxCount);
      from = current(L); mode = id; to = positions(mode, L); beg = performance.now();
      info(); request();
    }
    KF.segment(controls, MODES.map((k) => ({ id: k, label: METRICS[k].label })), mode, move);
    const l1 = document.createElement("label"); l1.textContent = "지역 "; l1.append(select); controls.append(l1);
    const l2 = document.createElement("label"); l2.textContent = "시설 "; l2.append(fsel); l2.style.maxWidth = "100%"; controls.append(l2, detail);
    select.addEventListener("change", () => pickRegion(select.value));
    fsel.addEventListener("change", () => { facility = fsel.value === "" ? null : Number(fsel.value); info(); request(); });

    // ---- draw
    function draw() {
      const { ctx, w, h } = sc, full = w > 520;
      const L = layout(w, h, full, maxCount);
      const key = `${w}x${h}x${full}`;
      if (sizeKey !== key) { sizeKey = key; to = positions(mode, L); from = to; }
      const pos = current(L);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "left";
      ctx.fillStyle = INK; ctx.font = `600 ${full ? 27 : 20}px ${SERIF}`;
      ctx.fillText("전시벽의 순서가 바뀐다", L.left, full ? 40 : 30);
      ctx.fillStyle = DIM; ctx.font = `${full ? 13 : 10.5}px ${SANS}`;
      ctx.fillText(`${METRICS[mode].label} 순위 · 액자 하나 = 실제 시설 한 곳`, L.left, full ? 64 : 46);

      areas = [];
      d.regions.forEach((r) => {
        const p = pos[r.name], x = L.left + p.col * L.cw, y = p.y;
        const rank = rankOf(d.regions, mode, r);
        const rowsHere = Math.max(1, Math.ceil(r.count / L.cellCols));
        const boxH = L.titleH + rowsHere * L.step + L.padBottom;
        const on = r.name === selected, hv = r.name === hover;
        if (on || hv) {
          ctx.fillStyle = on ? "rgba(255,253,247,.55)" : "rgba(255,253,247,.3)";
          ctx.fillRect(x - 6, y - L.titleH + 4, L.cw - 6, boxH);
          ctx.strokeStyle = on ? INK : FAINT; ctx.lineWidth = on ? 1.3 : 1;
          ctx.strokeRect(x - 6 + 0.5, y - L.titleH + 4 + 0.5, L.cw - 7, boxH - 1);
        }
        ctx.fillStyle = INK; ctx.font = `600 ${full ? 14.5 : 11.5}px ${SANS}`;
        ctx.fillText(`${rank} ${r.name}`, x, y - L.titleH + (full ? 18 : 14));
        ctx.fillStyle = DIM; ctx.font = `${full ? 12.5 : 10}px ${MONO}`;
        ctx.fillText(METRICS[mode].fmt(r), x, y - L.titleH + (full ? 34 : 26));
        cluster(ctx, x, y, r, L.step, L.cellCols, r.name === selected && facility !== null ? facility : -1);
        // picture rail under the cluster
        ctx.strokeStyle = RAIL; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - 3, y + rowsHere * L.step + 3); ctx.lineTo(x + L.cw - 10, y + rowsHere * L.step + 3); ctx.stroke();
        areas.push({ r, x: x - 6, y: y - L.titleH + 4, w: L.cw - 6, h: boxH });
      });

      if (full) {
        const gg = d.regions.find((x) => x.name === "경기"), jj = d.regions.find((x) => x.name === "제주");
        ctx.fillStyle = INK; ctx.font = `500 13px ${SANS}`; ctx.textAlign = "left";
        ctx.fillText(
          `경기는 시설 총량 1위 · 인구 10만 명당 ${gg.rateRank}위. 제주는 총량 ${jj.countRank}위 · 인구 10만 명당 1위. 같은 액자들이 다시 줄을 선다.`,
          L.left, h - L.legendH + 12
        );
      }
      const ly = h - (full ? 16 : 10);
      ctx.font = `${full ? 12.5 : 10}px ${SANS}`;
      ctx.fillStyle = MUSEUM; ctx.fillRect(L.left, ly - 9, 9, 9);
      ctx.fillStyle = INK; ctx.fillText("박물관", L.left + 14, ly);
      const wtx = ctx.measureText("박물관").width;
      ctx.fillStyle = ART; ctx.fillRect(L.left + wtx + 30, ly - 9, 9, 9);
      ctx.fillStyle = INK; ctx.fillText("미술관", L.left + wtx + 44, ly);
      if (full) { ctx.fillStyle = DIM; ctx.fillText("벽을 누르거나 아래에서 지역·시설을 고르세요", w - L.left - 240, ly); }
    }

    function frameLoop() {
      raf = 0; draw();
      if (!reduced && performance.now() - beg < 900) raf = requestAnimationFrame(frameLoop);
    }
    function request() { if (!raf) raf = requestAnimationFrame(frameLoop); }

    function hit(e) {
      const b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      return areas.find((a) => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h)?.r;
    }
    canvas.addEventListener("pointermove", (e) => {
      const r = hit(e); const name = r ? r.name : null;
      if (name !== hover) { hover = name; canvas.style.cursor = hover ? "pointer" : "default"; request(); }
      if (r) detail.textContent = `${r.name}: 박물관 ${r.museum}곳 · 미술관 ${r.art}곳 · 인구 10만 명당 ${r.rate.toFixed(2)}곳(${r.rateRank}위) · 보고 관람인원 ${r.visits.toLocaleString("ko-KR")}명 · 미확인 ${r.missing}곳`;
    });
    canvas.addEventListener("pointerleave", () => { hover = null; info(); request(); });
    canvas.addEventListener("click", (e) => { const r = hit(e); if (r) pickRegion(r.name); });

    sc.onresize = () => { sizeKey = ""; request(); };
    stage._kfStill = request;
    pickRegion(selected);
  }

  VIZ["museum-access"] = { thumb, mount, bg: BG };
})();
