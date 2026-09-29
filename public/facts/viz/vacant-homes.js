// 68 vacant-homes — "부동산 열쇠 보관함" (a real-estate agency's key cabinet). Every housing unit is a
// hook; a hook holding a key tag is occupied, an empty hook is a vacant home. Tag shape marks housing
// type. Second view compares a rural county's wall (high vacancy RATE) with a city's wall (more empty
// hooks in absolute COUNT, but a lower rate).
(() => {
  const BG = "#f0e6d2";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#332a1a", DIM = "rgba(51,42,26,.62)", FAINT = "rgba(51,42,26,.16)";
  const BOARD = "#d9c49c", BOARD_HOLE = "#a98f61";
  const KEY = ["#c9922f", "#8a5d1e"], KEY_APT = ["#8a9a7a", "#556848"];
  const RED = "#a8432a";

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // a hook: `filled` in [0,1] chance-ish — we draw either a key (occupied) or bare hook (vacant)
  function hook(ctx, cx, cy, r, vacant, apt) {
    ctx.strokeStyle = "rgba(51,42,26,.55)"; ctx.lineWidth = Math.max(1, r * 0.18);
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.1, r * 0.42, Math.PI * 0.15, Math.PI * 0.95, false); ctx.stroke();
    if (vacant) {
      ctx.fillStyle = BOARD_HOLE; ctx.beginPath(); ctx.arc(cx, cy - r * 0.5, r * 0.16, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const pal = apt ? KEY_APT : KEY;
    const g = ctx.createLinearGradient(cx - r * 0.3, 0, cx + r * 0.3, 0);
    g.addColorStop(0, pal[1]); g.addColorStop(0.5, pal[0]); g.addColorStop(1, pal[1]);
    ctx.fillStyle = g;
    // key ring
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.1, r * 0.34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = BOARD; ctx.beginPath(); ctx.arc(cx, cy - r * 0.1, r * 0.18, 0, Math.PI * 2); ctx.fill();
    // key shaft + teeth
    ctx.fillStyle = g;
    ctx.fillRect(cx - r * 0.09, cy + r * 0.18, r * 0.18, r * 0.95);
    ctx.fillRect(cx + r * 0.09, cy + r * 0.72, r * 0.16, r * 0.14);
    ctx.fillRect(cx + r * 0.09, cy + r * 0.98, r * 0.12, r * 0.12);
  }

  function pegboard(ctx, x, y, w, h) {
    ctx.fillStyle = BOARD; roundRect(ctx, x, y, w, h, 6); ctx.fill();
    ctx.strokeStyle = "rgba(51,42,26,.3)"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = "rgba(51,42,26,.16)";
    for (let yy = y + 10; yy < y + h - 6; yy += 14) for (let xx = x + 10; xx < x + w - 6; xx += 14) { ctx.beginPath(); ctx.arc(xx, yy, 1, 0, Math.PI * 2); ctx.fill(); }
  }

  // pack `n` hooks on a board of given pixel size at density `rate` (0..1 vacant share), returns hook list
  function wall(ctx, x, y, w, h, n, vacantShare, full) {
    pegboard(ctx, x, y, w, h);
    const cols = Math.max(1, Math.round(Math.sqrt((n * w) / h)));
    const rows = Math.ceil(n / cols);
    const cellW = (w - 16) / cols, cellH = (h - 16) / rows;
    const r = Math.min(cellW, cellH) * 0.34;
    // pick exactly round(n*vacantShare) hook indices, evenly spread (not random) so the pattern reads clearly
    const nVacant = Math.round(n * vacantShare);
    const vacantSet = new Set();
    for (let i = 0; i < nVacant; i++) vacantSet.add(Math.floor(((i + 0.5) * n) / Math.max(1, nVacant)));
    const pts = [];
    let idx = 0;
    for (let ro = 0; ro < rows && idx < n; ro++) {
      for (let c = 0; c < cols && idx < n; c++, idx++) {
        const cx = x + 8 + c * cellW + cellW / 2, cy = y + 8 + ro * cellH + cellH / 2;
        const isVacant = vacantSet.has(idx);
        hook(ctx, cx, cy, r, isVacant, idx % 3 === 0);
        pts.push({ x: cx, y: cy, r, vacant: isVacant });
      }
    }
    return { x, y, w, h, pts };
  }

  function tipBox(ctx, w, h, px, py, lines) {
    const fs = 12;
    ctx.font = `700 ${fs + 1}px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 ${fs}px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 12 + lines.length * (fs + 6);
    const bx = KF.clamp(px + 14 + bw > w - 6 ? px - bw - 14 : px + 14, 6, w - bw - 6), by = KF.clamp(py - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(255,251,240,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(51,42,26,.35)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = `${i ? 500 : 700} ${i ? fs : fs + 1}px ${SANS}`; ctx.fillText(t, bx + 11, by + 6 + (i + 1) * (fs + 6) - 3); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10;
    const up = KF.clamp((c - 0.3) / 3, 0, 1);
    const rate = d.rate[d.rate.length - 1] / 100;
    wall(ctx, h * 0.08, h * 0.14, h * 0.72, h * 0.72, 48, rate * up, false);
    const a = KF.clamp((c - 3.2) / 0.9, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.075)}px ${SANS}`;
    ctx.fillText("전국 빈집", h * 0.92, h * 0.32);
    ctx.fillStyle = RED; ctx.font = `700 ${Math.round(h * 0.11)}px ${SANS}`;
    ctx.fillText(`${d.rate[d.rate.length - 1]}%`, h * 0.92, h * 0.5);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.045)}px ${SANS}`;
    ctx.fillText(`${d.years[d.years.length - 1]}년 · 절반은 아파트`, h * 0.92, h * 0.62);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage);
    let view = "time", hover = null, t0 = performance.now(), yi = d.years.length - 1, walls = [];
    KF.segment(controls, [{ id: "time", label: "전국, 해마다" }, { id: "gap", label: "시골 vs 도시" }], view, (id) => { view = id; t0 = performance.now(); });
    const slider = document.createElement("input");
    slider.type = "range"; slider.min = 0; slider.max = d.years.length - 1; slider.value = yi;
    slider.setAttribute("aria-label", "연도");
    const out = document.createElement("output");
    const lab = document.createElement("label"); lab.style.cssText = "display:flex;align-items:center;gap:8px"; lab.append(slider, out);
    controls.append(lab);
    slider.oninput = () => { yi = +slider.value; };

    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      walls = [];
      const el = (performance.now() - t0) / 1000;
      const grow = KF.ease(KF.clamp((el - 0.15) / 1, 0, 1));
      lab.parentElement && (slider.parentElement.hidden = view !== "time");
      out.textContent = `${d.years[yi]}년`;

      if (view === "time") {
        const y = d.years[yi], rate = d.rate[yi] / 100;
        const side = full ? Math.min(h - 90, w * 0.44) : Math.min(w - 32, h * 0.52);
        const x0 = full ? 36 : (w - side) / 2, y0 = full ? (h - side) / 2 + 6 : 50;
        const wl = wall(ctx, x0, y0, side, side, 90, rate * grow, full);
        walls.push({ ...wl, name: `${y}년 · 전국`, rate: d.rate[yi], count: d.count[yi] });
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 18 : 13}px ${SERIF}`;
        ctx.fillText(`${y}년 전국 빈집 비율 ${d.rate[yi]}%`, full ? x0 : 14, full ? 30 : 22);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9}px ${SANS}`;
        ctx.fillText("빈 고리 1개 = 빈집 · 채워진 고리 = 사람이 사는 집", full ? x0 : 14, full ? 50 : 36);
        if (full) {
          const px = x0 + side + 40;
          ctx.fillStyle = RED; ctx.font = "700 38px " + SANS;
          ctx.fillText(`${KF.fmt(d.count[yi])}채`, px, 130);
          ctx.fillStyle = DIM; ctx.font = "500 12px " + SANS;
          ctx.fillText(`전체 주택 ${KF.fmt(d.total[yi])}채 가운데`, px, 152);
          ctx.fillStyle = INK; ctx.font = "600 13px " + SANS;
          ctx.fillText(`빈집 비율 ${d.rate[yi]}%`, px, 186);
        } else {
          const by = y0 + side + 30;
          ctx.textAlign = "left";
          ctx.fillStyle = RED; ctx.font = "700 30px " + SANS;
          ctx.fillText(`${KF.fmt(d.count[yi])}채`, 14, by);
          ctx.fillStyle = DIM; ctx.font = "500 10.5px " + SANS;
          ctx.fillText(`전체 주택 ${KF.fmt(d.total[yi])}채 가운데`, 14, by + 20);
          ctx.fillStyle = INK; ctx.font = "600 12.5px " + SANS;
          ctx.fillText(`빈집 비율 ${d.rate[yi]}%`, 14, by + 42);
        }
      } else {
        const rural = d.topRate[0], city = d.topCount[0];
        // board area (and hook count) scales with each place's total housing stock, so the empty-hook
        // COUNT reads honestly too, not just the vacancy rate
        const totalOf = (it) => it.count / (it.rate / 100);
        const items = [rural, city].map((it) => ({ ...it, total: totalOf(it) }));
        const maxTotal = Math.max(...items.map((it) => it.total));
        const baseSide = full ? Math.min(h - 110, (w - 120) / 2.2) : Math.min((w - 40) / 2.1, h - 130);
        const gap = full ? 60 : 16;
        const sideOf = (it) => baseSide * KF.clamp(Math.sqrt(it.total / maxTotal), 0.55, 1);
        const totalW = sideOf(items[0]) + sideOf(items[1]) + gap;
        let sx = (w - totalW) / 2, y0 = full ? 96 : 58;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 18 : 13}px ${SERIF}`;
        ctx.fillText("시골 군 대 도시, 판 크기는 전체 주택 수", full ? 26 : 12, full ? 34 : 22);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9}px ${SANS}`;
        ctx.fillText("빈 고리 비율은 시골이 높지만, 빈 고리 실제 개수는 도시가 많다", full ? 26 : 12, full ? 54 : 36);
        items.forEach((it) => {
          const side = sideOf(it);
          const n = Math.max(30, Math.round(90 * (side / baseSide) ** 2));
          const yy = y0 + (baseSide - side); // align bottoms
          const wl = wall(ctx, sx, yy, side, side, n, (it.rate / 100) * grow, full);
          walls.push({ ...wl, name: it.name, rate: it.rate, count: it.count });
          ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 13 : 10}px ${SANS}`;
          ctx.fillText(it.name, sx + side / 2, y0 + baseSide + (full ? 20 : 15));
          ctx.fillStyle = RED; ctx.font = `700 ${full ? 15 : 11.5}px ${MONO}`;
          ctx.fillText(`비율 ${it.rate}%`, sx + side / 2, y0 + baseSide + (full ? 40 : 30));
          ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9}px ${MONO}`;
          ctx.fillText(`빈집 ${KF.fmt(it.count)}채`, sx + side / 2, y0 + baseSide + (full ? 58 : 44));
          sx += side + gap;
        });
      }

      if (hover) {
        for (const wl of walls) {
          if (hover[0] >= wl.x && hover[0] <= wl.x + wl.w && hover[1] >= wl.y && hover[1] <= wl.y + wl.h) {
            tipBox(ctx, w, h, hover[0], hover[1], [[wl.name], [`빈집 비율 ${wl.rate}%`, DIM], [`빈집 ${KF.fmt(wl.count)}채`, DIM]]);
            break;
          }
        }
      }
    });
  }

  VIZ["vacant-homes"] = { thumb, mount, bg: BG };
})();
