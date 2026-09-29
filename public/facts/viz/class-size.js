// 66 class-size — "교실 바닥 평면도" (classroom floor plan). A room of fixed size; one desk = one
// student. Scrub the year and the room refills or empties as the national class-size average moves.
// Second view "오늘의 격차": three same-size rooms side by side — the most crowded district, the
// national average, and the most empty district, for 2025.
(() => {
  const BG = "#f0d9c0";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#3a2a18", DIM = "rgba(58,42,24,.62)", FAINT = "rgba(58,42,24,.18)";
  const FLOOR = "#e8d0ae", FLOOR_LINE = "rgba(120,90,50,.14)", WALL = "#6b4b2a", BOARD = "#2f4a3a";
  const DESK = ["#c8935a", "#9c6a38"], DESK_HOT = ["#c0563f", "#8c3624"];
  const LEVELS = [["elem", "초등학교"], ["mid", "중학교"], ["high", "고등학교"]];

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // draws a fixed-size room and packs n desks inside; returns desk centres for hover use
  function room(ctx, x, y, w, h, n, palette, full) {
    ctx.fillStyle = FLOOR; roundRect(ctx, x, y, w, h, 5); ctx.fill();
    ctx.strokeStyle = WALL; ctx.lineWidth = Math.max(1.4, w * 0.012); ctx.stroke();
    // floor plank lines
    ctx.strokeStyle = FLOOR_LINE; ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) { const yy = y + (h * i) / 6; ctx.beginPath(); ctx.moveTo(x + 3, yy); ctx.lineTo(x + w - 3, yy); ctx.stroke(); }
    const boardH = Math.max(4, h * 0.045);
    ctx.fillStyle = BOARD; ctx.fillRect(x + w * 0.16, y + h * 0.035, w * 0.68, boardH);

    const top = y + boardH + h * 0.09, bottom = y + h - h * 0.05, left = x + w * 0.06, right = x + w - w * 0.06;
    const areaW = Math.max(1, right - left), areaH = Math.max(1, bottom - top);
    const nn = Math.max(0, Math.round(n));
    const desks = [];
    if (nn > 0) {
      const cols = Math.max(1, Math.round(Math.sqrt((nn * areaW) / areaH)));
      const rows = Math.ceil(nn / cols);
      const cellW = areaW / cols, cellH = areaH / rows;
      const dw = cellW * 0.72, dh = cellH * 0.56;
      let placed = 0;
      for (let r = 0; r < rows && placed < nn; r++) {
        for (let c = 0; c < cols && placed < nn; c++, placed++) {
          const cx = left + c * cellW + cellW / 2, cy = top + r * cellH + cellH * 0.42;
          const g = ctx.createLinearGradient(cx, cy - dh / 2, cx, cy + dh / 2);
          g.addColorStop(0, palette[0]); g.addColorStop(1, palette[1]);
          ctx.fillStyle = g;
          roundRect(ctx, cx - dw / 2, cy - dh / 2, dw, dh, Math.min(2.4, dw * 0.18)); ctx.fill();
          if (full !== false && dh > 5) {
            ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cx - dw / 2 + 1, cy); ctx.lineTo(cx + dw / 2 - 1, cy); ctx.stroke();
          }
          // chair notch below the desk
          ctx.fillStyle = "rgba(58,42,24,.22)";
          ctx.beginPath(); ctx.ellipse(cx, cy + dh / 2 + dh * 0.32, dw * 0.22, dh * 0.24, 0, 0, Math.PI * 2); ctx.fill();
          desks.push({ x: cx, y: cy });
        }
      }
    }
    return { x, y, w, h, desks, n: nn };
  }

  function tipBox(ctx, w, h, px, py, lines) {
    const fs = 12;
    ctx.font = `700 ${fs + 1}px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 ${fs}px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 12 + lines.length * (fs + 6);
    const bx = KF.clamp(px + 14 + bw > w - 6 ? px - bw - 14 : px + 14, 6, w - bw - 6), by = KF.clamp(py - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(255,250,241,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(58,42,24,.35)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = `${i ? 500 : 700} ${i ? fs : fs + 1}px ${SANS}`; ctx.fillText(t, bx + 11, by + 6 + (i + 1) * (fs + 6) - 3); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10;
    const n1999 = d.classSize.elem[0], n2025 = d.classSize.elem[d.classSize.elem.length - 1];
    const phase = KF.clamp((c - 0.3) / 3.2, 0, 1);
    const n = phase < 0.5 ? KF.lerp(n1999, n2025, KF.ease(phase * 2)) : n2025;
    const rw = h * 0.62, rh = h * 0.62, rx = w * 0.06, ry = h * 0.24;
    room(ctx, rx, ry, rw, rh, n, DESK, false);
    const a = KF.clamp((c - 3.4) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.08)}px ${SANS}`;
    ctx.fillText("초등 학급당 학생수", rx + rw + h * 0.08, h * 0.32);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText("1999 → 2025", rx + rw + h * 0.08, h * 0.44);
    ctx.font = `700 ${Math.round(h * 0.16)}px ${SANS}`;
    ctx.fillStyle = "#8c3624";
    ctx.fillText(`${n2025.toFixed(0)}명`, rx + rw + h * 0.08, h * 0.68);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage);
    let view = "time", level = "elem", yi = d.years.length - 1, playing = false, last = 0, hover = null, rooms = [];
    const levelBtns = KF.segment(controls, LEVELS.map(([id, label]) => ({ id, label })), level, (id) => { level = id; });
    const viewBtns = KF.segment(controls, [{ id: "time", label: "해마다" }, { id: "cross", label: "오늘의 격차" }], view, (id) => { view = id; slider.parentElement.hidden = id !== "time"; playBtn.hidden = id !== "time"; });
    const slider = document.createElement("input");
    slider.type = "range"; slider.min = 0; slider.max = d.years.length - 1; slider.value = yi;
    slider.setAttribute("aria-label", "연도");
    const out = document.createElement("output");
    const lab = document.createElement("label"); lab.style.cssText = "display:flex;align-items:center;gap:8px"; lab.append(slider, out);
    const playBtn = document.createElement("button"); playBtn.type = "button"; playBtn.textContent = "자동 재생"; playBtn.disabled = KF.reduced;
    playBtn.onclick = () => { playing = !playing; playBtn.textContent = playing ? "정지" : "자동 재생"; if (playing && yi >= d.years.length - 1) yi = 0; last = performance.now(); };
    slider.oninput = () => { playing = false; playBtn.textContent = "자동 재생"; yi = +slider.value; };
    controls.append(lab, playBtn);

    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      if (playing && !KF.reduced && performance.now() - last > 220) {
        yi++; last = performance.now();
        if (yi >= d.years.length - 1) { yi = d.years.length - 1; playing = false; playBtn.textContent = "자동 재생"; }
        slider.value = yi;
      }
      out.textContent = `${d.years[yi]}년`;
      rooms = [];

      if (view === "time") {
        const y = d.years[yi], n = d.classSize[level][yi], tr = d.teacherRatio[level][yi];
        const label = LEVELS.find(([id]) => id === level)[1];
        const side = full ? Math.min(h - 60, w * 0.42) : Math.min(w - 32, h * 0.56);
        const rx = full ? 40 : (w - side) / 2, ry = full ? (h - side) / 2 + 10 : 54;
        const rm = room(ctx, rx, ry, side, side, n, DESK, full);
        rooms.push({ ...rm, name: `${y}년 · ${label}`, val: n, tr, n0: n });
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 18 : 14}px ${SERIF}`;
        ctx.fillText(`${y}년 ${label} 교실`, full ? rx + side + 36 : 14, full ? 44 : 24);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11.5 : 9.5}px ${SANS}`;
        ctx.fillText("책상 1개 = 학생 1명 · 방 크기는 항상 같다", full ? rx + side + 36 : 14, full ? 64 : 40);
        const x0 = full ? rx + side + 36 : 14, ty = full ? 118 : 0;
        if (full) {
          ctx.fillStyle = "#8c3624"; ctx.font = `700 40px ${SANS}`;
          ctx.fillText(`${n.toFixed(1)}명`, x0, ty);
          ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
          ctx.fillText("학급당 학생수", x0, ty + 22);
          ctx.fillStyle = INK; ctx.font = `600 13px ${SANS}`;
          ctx.fillText(`교원 1인당 학생수 ${tr.toFixed(1)}명`, x0, ty + 56);
          ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`;
          ctx.fillText(`${d.years[0]}년 ${d.classSize[level][0].toFixed(1)}명에서 시작`, x0, ty + 82);
        } else {
          ctx.fillStyle = "#8c3624"; ctx.font = `700 20px ${SANS}`; ctx.textAlign = "left";
          ctx.fillText(`${n.toFixed(1)}명 / 학급`, 14, side + ry + 26);
        }
      } else {
        const label = LEVELS.find(([id]) => id === level)[1];
        const ex = d.extremes[level];
        const items = [
          { name: `가장 붐비는 ${ex.hiName}`, val: ex.hiVal, pal: DESK_HOT },
          { name: "전국 평균", val: d.nationalToday[level], pal: DESK },
          { name: `가장 한산한 ${ex.loName}`, val: ex.loVal, pal: DESK },
        ];
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 18 : 14}px ${SERIF}`;
        ctx.fillText(`${d.distYear}년, 같은 크기 교실 셋 — ${label}`, full ? 26 : 12, full ? 34 : 22);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9}px ${SANS}`;
        ctx.fillText("시군구 학급당 학생수(전국 자료 있는 곳 기준)", full ? 26 : 12, full ? 54 : 36);
        const top0 = full ? 78 : 52;
        const side = full ? Math.min(h - top0 - 20, (w - 80) / 3.4) : Math.min((w - 40) / 3.1, h - top0 - 34);
        const gap = full ? 40 : 12;
        const totalW = side * 3 + gap * 2;
        let sx = (w - totalW) / 2;
        items.forEach((it) => {
          const rm = room(ctx, sx, top0, side, side, it.val, it.pal, full);
          rooms.push({ ...rm, name: it.name, val: it.val });
          ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 12.5 : 9.5}px ${SANS}`;
          ctx.fillText(it.name, sx + side / 2, top0 + side + (full ? 18 : 13));
          ctx.fillStyle = "#8c3624"; ctx.font = `700 ${full ? 15 : 11.5}px ${MONO}`;
          ctx.fillText(`${it.val.toFixed(1)}명`, sx + side / 2, top0 + side + (full ? 36 : 26));
          sx += side + gap;
        });
      }

      if (hover) {
        for (const rm of rooms) {
          if (hover[0] >= rm.x && hover[0] <= rm.x + rm.w && hover[1] >= rm.y && hover[1] <= rm.y + rm.h) {
            tipBox(ctx, w, h, hover[0], hover[1], [[rm.name], [`학급당 ${rm.val.toFixed(1)}명 (책상 ${rm.n}개)`, DIM]]);
            break;
          }
        }
      }
    });
  }

  VIZ["class-size"] = { thumb, mount, bg: BG };
})();
