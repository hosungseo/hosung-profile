// 53 waste-weight — "창고 바닥 저울". A cast-iron platform scale on a concrete warehouse floor. Mass is
// shown as stamped metal plates (1 plate = 100만 톤) stacked on two platforms; a steel beam overhead tilts
// toward the heavier side. Household waste sits fixed on the right; pick any other category for the left.
(() => {
  const BG = "#b3b8ab", FLOOR_DARK = "rgba(40,44,36,.12)", INK = "#22241d", DIM = "rgba(34,36,29,.64)";
  const IRON = "#2c2721", BRASS = "#8a6a2f";
  const COLORS = ["#1f6f73", "#6e7d63", "#c85a2a", "#5c6a72", "#7a5a86"];
  const SANS = '"Pretendard Variable", sans-serif', MONO = '"IBM Plex Mono", monospace';

  const fmt = (n) => n.toLocaleString("ko-KR");
  function text(c, v, x, y, size = 14, color = INK, align = "left", weight = 600) {
    c.font = `${weight} ${size}px ${SANS}`; c.fillStyle = color; c.textAlign = align; c.fillText(v, x, y);
  }

  // concrete floor speckle (seeded, stable across frames)
  let SPECK = null;
  function speckle(c, w, h) {
    if (!SPECK || SPECK.w !== w || SPECK.h !== h) {
      let s = 17;
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      SPECK = { w, h, pts: Array.from({ length: 140 }, () => [rnd() * w, rnd() * h, 0.4 + rnd() * 1.1]) };
    }
    c.fillStyle = FLOOR_DARK;
    for (const [x, y, r] of SPECK.pts) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  }

  // one stamped-metal plate, side length `side`, filled fraction `frac` (bottom clip for the partial top plate)
  function plate(c, x, y, side, color, frac) {
    c.save(); c.beginPath(); c.rect(x, y + side * (1 - frac), side, side * frac); c.clip();
    const g = c.createLinearGradient(x, y, x, y + side);
    g.addColorStop(0, "rgba(255,255,255,.35)"); g.addColorStop(0.15, color); g.addColorStop(1, "rgba(0,0,0,.28)");
    c.fillStyle = g; c.fillRect(x, y, side, side);
    c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, side - 1, side - 1);
    c.restore();
  }

  // a stack of plates on a platform: `value` (만 톤) / 100 plates, 10 per row
  function stack(c, x, base, width, value, color, progress = 1) {
    const cols = 10, step = width / cols, side = step - 3, count = (value / 100) * progress;
    c.strokeStyle = "rgba(36,31,22,.12)"; c.lineWidth = 0.5;
    for (let k = 0; k < 130; k++) c.strokeRect(x + (k % cols) * step, base - (Math.floor(k / cols) + 1) * step, side, side);
    for (let k = 0; k < Math.ceil(count); k++) {
      const frac = Math.min(1, count - k);
      plate(c, x + (k % cols) * step, base - (Math.floor(k / cols) + 1) * step, side, color, frac || 1);
    }
    return base - Math.ceil(count / cols) * step; // top of the stack, for the chain to reach
  }

  // steel platform the stack sits on
  function platform(c, x, base, width) {
    c.fillStyle = IRON; c.fillRect(x - 8, base, width + 16, 7);
    c.fillStyle = BRASS; c.fillRect(x - 8, base + 7, width + 16, 2);
    c.strokeStyle = "rgba(0,0,0,.3)"; c.strokeRect(x - 8.5, base + 0.5, width + 17, 6);
  }

  // the beam overhead: pivots on a fulcrum, tilts toward the heavier (lower) side
  function beam(c, cx, y, halfSpan, tilt, leftX, rightX) {
    const dy = Math.sin(tilt) * halfSpan * 0.55;
    const lx = cx - halfSpan, rx = cx + halfSpan, ly = y + dy, ry = y - dy;
    // stand + fulcrum
    c.strokeStyle = IRON; c.lineWidth = 6; c.lineCap = "round";
    c.beginPath(); c.moveTo(cx, y + 20); c.lineTo(cx, y + 6); c.stroke();
    c.fillStyle = IRON; c.beginPath(); c.moveTo(cx - 10, y + 10); c.lineTo(cx + 10, y + 10); c.lineTo(cx, y - 4); c.closePath(); c.fill();
    // beam
    c.strokeStyle = IRON; c.lineWidth = 5; c.beginPath(); c.moveTo(lx, ly); c.lineTo(rx, ry); c.stroke();
    c.strokeStyle = BRASS; c.lineWidth = 1.4; c.beginPath(); c.moveTo(lx, ly); c.lineTo(rx, ry); c.stroke();
    // chains down to each platform
    c.strokeStyle = "rgba(36,31,22,.55)"; c.lineWidth = 1.6; c.setLineDash([3, 3]);
    c.beginPath(); c.moveTo(lx, ly); c.lineTo(leftX, ly + 70); c.stroke();
    c.beginPath(); c.moveTo(rx, ry); c.lineTo(rightX, ry + 70); c.stroke();
    c.setLineDash([]);
    c.fillStyle = IRON; [[lx, ly], [rx, ry], [cx, y - 4]].forEach(([px, py]) => { c.beginPath(); c.arc(px, py, 3, 0, 7); c.fill(); });
  }

  function draw(c, w, h, d, year, pick, progress = 1, thumbMode = false) {
    c.fillStyle = BG; c.fillRect(0, 0, w, h);
    speckle(c, w, h);
    const sm = w < 520, pad = thumbMode ? 16 : sm ? 18 : 44;
    const idx = d.years.indexOf(year), a = d.items[pick], v = a.history[idx], home = d.items[0].history[idx], ratio = v / home;

    if (thumbMode) {
      const bw = w * 0.3, base = h - 32, leftX = w * 0.22, rightX = w * 0.62;
      const tilt = Math.max(-0.16, Math.min(0.16, (v - home) / (v + home) * 0.5));
      beam(c, w * 0.42, h * 0.22, w * 0.24, -tilt, leftX + bw / 2, rightX + bw / 2);
      platform(c, leftX, base, bw); platform(c, rightX, base, bw);
      stack(c, leftX, base, bw, v, COLORS[pick]); stack(c, rightX, base, bw, home, COLORS[0]);
      text(c, "저울에 달아 보면", 16, 58, 13, INK);
      text(c, `${ratio.toFixed(1)}배`, w - 16, h - 10, 20, INK, "right");
      return [];
    }

    text(c, `${year}년, 생활폐기물과 나란히 달아 보면`, pad, 34, sm ? 16 : 23, INK);
    text(c, "쇳덩이 1장 = 100만 톤 · 마지막 장은 남은 양만큼만 채움", pad, 56, sm ? 10 : 12.5, DIM, "left", 500);

    const bw = Math.min((w - pad * 2 - 44) / 2, sm ? 128 : 230);
    const left = sm ? pad : w * 0.15, right = w - pad - bw - (sm ? 0 : w * 0.09);
    const base = h - (sm ? 128 : 150), beamY = sm ? 92 : 108, halfSpan = (right - left) * 0.5 + bw * 0.15;
    const cx = (left + right + bw) / 2;
    const tilt = Math.max(-0.18, Math.min(0.18, (v - home) / (v + home) * 0.55)) * progress;
    beam(c, cx, beamY, halfSpan, -tilt, left + bw / 2, right + bw / 2);

    text(c, `${ratio.toFixed(2)}배`, w / 2, sm ? beamY + 60 : beamY + 66, sm ? 32 : 44, INK, "center");
    text(c, "선택한 분류 ÷ 생활폐기물", w / 2, sm ? beamY + 80 : beamY + 88, 11, DIM, "center", 500);

    platform(c, left, base, bw); platform(c, right, base, bw);
    stack(c, left, base, bw, v, COLORS[pick], progress);
    stack(c, right, base, bw, home, COLORS[0], progress);
    text(c, a.name.replace("사업장 ", "사업장 "), left + bw / 2, base + 34, sm ? 10 : 15, INK, "center");
    text(c, `${fmt(v)}만 톤`, left + bw / 2, base + 55, sm ? 14 : 21, INK, "center");
    text(c, "생활폐기물", right + bw / 2, base + 34, sm ? 11 : 15, INK, "center");
    text(c, `${fmt(home)}만 톤`, right + bw / 2, base + 55, sm ? 14 : 21, INK, "center");

    const total = d.items.reduce((z, q) => z + q.history[idx], 0), barY = h - 34, ww = w - pad * 2;
    let x = pad; const hits = [];
    d.items.forEach((q, i) => {
      const sw = (ww * q.history[idx]) / total;
      c.fillStyle = COLORS[i]; c.fillRect(x, barY, sw, 14);
      if (i === pick) { c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x, barY - 3, sw, 20); }
      hits.push({ x, y: barY - 8, w: sw, h: 28, i });
      x += sw;
    });
    text(c, `분류 5개의 구성 · 선택한 분류의 몫 ${((100 * v) / total).toFixed(1)}%`, pad, h - 46, 11, DIM, "left", 500);
    return hits;
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let year = d.years.at(-1), pick = 2, hits = [], t0 = performance.now();
    const make = (label, items, val, change) => {
      const l = document.createElement("label"); l.textContent = label + " ";
      const e = document.createElement("select");
      e.style.cssText = "font:inherit;padding:7px;border:1px solid #8a6a2f;border-radius:3px;background:#e7ddc0;color:#241f16";
      items.forEach(([v, n]) => { const o = document.createElement("option"); o.value = v; o.textContent = n; e.appendChild(o); });
      e.value = val; e.onchange = () => change(e.value);
      e.addEventListener("keydown", (ev) => {
        if (["ArrowUp", "ArrowDown", "Home", "End"].includes(ev.key)) {
          ev.preventDefault();
          e.selectedIndex = ev.key === "Home" ? 0 : ev.key === "End" ? e.options.length - 1 : Math.max(0, Math.min(e.options.length - 1, e.selectedIndex + (ev.key === "ArrowUp" ? -1 : 1)));
          change(e.value);
        }
      });
      l.appendChild(e); controls.appendChild(l); return e;
    };
    make("연도", d.years.map((y) => [y, y + "년"]), year, (v) => { year = +v; });
    const sel = make("비교 분류", d.items.map((x, i) => [i, x.name]), pick, (v) => { pick = +v; });
    s.c.setAttribute("aria-label", "산업용 저울로 비교. 연도와 분류 선택은 아래 컨트롤로 조작할 수 있습니다.");

    const hit = (e) => { const r = s.c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; return hits.find((q) => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h); };
    s.c.addEventListener("pointerdown", (e) => { const q = hit(e); if (q) { pick = q.i; sel.value = pick; } });
    s.c.addEventListener("pointermove", (e) => { const q = hit(e); s.c.style.cursor = q ? "pointer" : "default"; });

    KF.loop(stage, () => {
      const el = KF.reduced ? 1 : Math.min(1, (performance.now() - t0) / 1100);
      hits = draw(s.ctx, s.w, s.h, d, year, pick, KF.ease(el));
    });
  }

  VIZ["waste-weight"] = { bg: BG, thumb: (c, w, h, t, d) => draw(c, w, h, d, d.years.at(-1), 2, 1, true), mount };
})();
