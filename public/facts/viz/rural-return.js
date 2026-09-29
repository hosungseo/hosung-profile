// 93 rural-return — "갈림길 표지판 (fork-in-the-road signpost)". One weathered wooden post, two arms.
// Arm thickness = that path's headcount (so 귀촌's arm dwarfs 귀농's). Paint bands on each arm = age
// composition. A small 이정표(destination board) under each arm tip lists where people actually went.
(() => {
  const BG = "#dfe3d0";
  const WOOD = "#8a6f4d", WOOD_D = "#6b5438", WOOD_L = "#a68a63", INK = "#2c2417", PAPER = "#f3ecd8";
  const DIM = "rgba(44,36,23,.66)", FAINT = "rgba(44,36,23,.22)";
  const SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif", MONO = "IBM Plex Mono, monospace";
  const ACCENT = "#a3432c";

  // age -> colour, warm(young) to cool(old); farm's coarse "0-39" band lands in the young zone too.
  const STOPS = [[0, [244, 196, 92]], [30, [230, 150, 74]], [40, [199, 108, 74]], [50, [122, 104, 122]], [60, [79, 92, 112]], [70, [51, 63, 84]]];
  function ageColor(a) {
    for (let i = 1; i < STOPS.length; i++) {
      if (a <= STOPS[i][0]) {
        const [a0, c0] = STOPS[i - 1], [a1, c1] = STOPS[i], t = (a - a0) / (a1 - a0);
        return c0.map((c, j) => Math.round(c + (c1[j] - c) * t));
      }
    }
    return STOPS[STOPS.length - 1][1];
  }
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const AGE_ANCHOR = { "0 - 39세": 18, "0 - 29세": 12, "30 - 39세": 32, "40 - 49세": 42, "50 - 59세": 52, "60 - 69세": 62, "70세 이상": 75 };

  function wrapLabel(ctx, text, cx, y, maxW, lh) {
    const words = String(text).split(" "); let line = "", lines = [];
    for (const wd of words) { const t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t; }
    lines.push(line);
    lines.forEach((ln, i) => ctx.fillText(ln, cx, y + i * lh));
    return lines.length;
  }

  function decode(d) {
    const n = d.years.length;
    const at = (arr, y) => arr[d.years.indexOf(y)];
    return {
      years: d.years, y0: d.years[0], y1: d.years[n - 1],
      farmHead: d.farmHead, villageHead: d.villageHead, ratio: d.ratio, farm60p: d.farm60p, villageU40: d.villageU40,
      farmAges: d.farmAges, villAges: d.villAges, farmAgeShare: d.farmAgeShare, villAgeShare: d.villAgeShare,
      regions: d.regions, at,
      maxHead: Math.max(...d.villageHead),
    };
  }

  // ---------------------------------------------------------------- geometry: one post, two arms
  function postGeom(w, h, full) {
    const px = w / 2, py = h * (full ? 0.2 : 0.14);
    const armLen = full ? Math.min(w * 0.34, h * 0.42) : Math.min(w * 0.4, h * 0.3);
    const angL = Math.PI * 0.74, angR = Math.PI * 0.26; // radians from +x axis, downward-left / downward-right
    return {
      px, py, armLen,
      farm: { angle: angL, tipX: px + Math.cos(angL) * armLen, tipY: py + Math.sin(angL) * armLen },
      village: { angle: angR, tipX: px + Math.cos(angR) * armLen, tipY: py + Math.sin(angR) * armLen },
    };
  }

  // draws one arm as a wooden plank from (px,py) to the tip, thickness = th, painted with age bands
  function drawArm(ctx, px, py, angle, len, th, ages, shareOf, hoverBand) {
    ctx.save();
    ctx.translate(px, py); ctx.rotate(angle);
    // plank body (slightly tapered toward the tip)
    const thTip = th * 0.72;
    ctx.beginPath();
    ctx.moveTo(0, -th / 2); ctx.lineTo(len - 10, -thTip / 2); ctx.lineTo(len, 0); ctx.lineTo(len - 10, thTip / 2); ctx.lineTo(0, th / 2);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, -th / 2, 0, th / 2);
    grad.addColorStop(0, WOOD_L); grad.addColorStop(0.5, WOOD); grad.addColorStop(1, WOOD_D);
    ctx.fillStyle = grad; ctx.fill();
    // age paint-bands along the plank, each band's along-arm length = its population share
    let x = 6;
    const bandsW = len - 16;
    const bandRects = [];
    ages.forEach((a) => {
      const share = shareOf(a) / 100, bw = Math.max(1, bandsW * share);
      const c = ageColor(AGE_ANCHOR[a] ?? 40);
      const on = hoverBand === a;
      ctx.fillStyle = rgb(c, on ? 1 : 0.86);
      ctx.fillRect(x, -th * 0.34, bw, th * 0.68);
      if (on) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.4; ctx.strokeRect(x + 0.7, -th * 0.34 + 0.7, bw - 1.4, th * 0.68 - 1.4); }
      bandRects.push({ a, x0: x, x1: x + bw });
      x += bw;
    });
    ctx.strokeStyle = "rgba(44,36,23,.55)"; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -th / 2); ctx.lineTo(len - 10, -thTip / 2); ctx.lineTo(len, 0); ctx.lineTo(len - 10, thTip / 2); ctx.lineTo(0, th / 2); ctx.closePath();
    ctx.stroke();
    // wood-grain hint lines
    ctx.strokeStyle = "rgba(44,36,23,.12)"; ctx.lineWidth = 1;
    for (let gy = -th / 2 + 4; gy < th / 2; gy += 5) { ctx.beginPath(); ctx.moveTo(2, gy); ctx.lineTo(len - 12, gy * 0.7); ctx.stroke(); }
    ctx.restore();
    return bandRects.map((b) => ({
      a: b.a,
      // convert local (along-arm x, 0) back to stage coords for hit-testing
      x0: px + Math.cos(angle) * b.x0 - Math.sin(angle) * 0, y0: py + Math.sin(angle) * b.x0,
      x1: px + Math.cos(angle) * b.x1, y1: py + Math.sin(angle) * b.x1,
      angle,
    }));
  }

  function postAndSign(ctx, px, py, full) {
    const pw = full ? 20 : 15, ph = full ? 64 : 46;
    ctx.fillStyle = WOOD_D; ctx.fillRect(px - pw / 2, py - ph * 0.25, pw, ph);
    ctx.strokeStyle = "rgba(44,36,23,.5)"; ctx.lineWidth = 1; ctx.strokeRect(px - pw / 2 + 0.5, py - ph * 0.25 + 0.5, pw - 1, ph - 1);
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    if (!d) return;
    const D = decode(d), y1 = D.y1;
    const G = postGeom(w, h * 1.5, true);
    const c = t % 10, grow = Math.min(1, Math.max(0, (c - 0.3) / 2.2));
    postAndSign(ctx, G.px, G.py, true);
    const thV = Math.max(6, (w * 0.16) * Math.sqrt(D.at(D.villageHead, y1) / D.maxHead)) * grow;
    const thF = Math.max(3, (w * 0.16) * Math.sqrt(D.at(D.farmHead, y1) / D.maxHead)) * grow;
    drawArm(ctx, G.px, G.py, G.village.angle, G.armLen * grow, thV, D.villAges, (a) => D.villAgeShare[y1][a], null);
    drawArm(ctx, G.px, G.py, G.farm.angle, G.armLen * grow, thF, D.farmAges, (a) => D.farmAgeShare[y1][a], null);
    const a = Math.min(1, Math.max(0, (c - 1.3) / 0.8));
    ctx.globalAlpha = a;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.078)}px ${SERIF}`;
    ctx.fillText("귀촌은 은퇴자의 길일까", w * 0.05, h * 0.34);
    ctx.fillStyle = ACCENT; ctx.font = `700 ${Math.round(h * 0.1)}px ${SANS}`;
    ctx.fillText(`귀촌이 귀농의 ${D.at(D.ratio, y1).toFixed(1)}배`, w * 0.17, h * 0.92);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const D = decode(d);
    let year = D.y1, hover = null, areas = [], t0 = performance.now();
    KF.segment(controls, D.years.map((y) => ({ id: String(y), label: `${y}년` })).filter((_, i) => i === 0 || i === D.years.length - 1), String(year), (id) => { year = +id; t0 = performance.now(); request(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "이 두 해만 도착지·나이 자료가 있습니다"; controls.appendChild(sep);

    const detail = document.createElement("p");
    detail.style.cssText = "width:100%;margin:6px 0 0;font-size:13.5px;line-height:1.65";
    detail.setAttribute("aria-live", "polite");
    function overview() {
      return `${year}년: 귀촌 ${KF.fmt(D.at(D.villageHead, year))}명, 귀농 ${KF.fmt(D.at(D.farmHead, year))}명(귀촌이 귀농의 ${D.at(D.ratio, year).toFixed(1)}배). 귀촌 40세 미만 ${D.at(D.villageU40, year).toFixed(1)}% · 귀농 60대 이상 ${D.at(D.farm60p, year).toFixed(1)}%.`;
    }
    detail.textContent = overview();
    controls.appendChild(detail);

    let raf = 0;
    function request() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); }

    function destBoard(ctx, x, y, w, title, list, full) {
      const rh = full ? 17 : 14.5;
      const bh = 24 + list.length * rh;
      ctx.fillStyle = PAPER; ctx.fillRect(x, y, w, bh);
      ctx.strokeStyle = "rgba(44,36,23,.4)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, bh - 1);
      ctx.strokeStyle = "rgba(44,36,23,.2)"; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + 2, y + i * 4); ctx.lineTo(x + w - 2, y + i * 4); ctx.stroke(); }
      ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 ${full ? 10.5 : 9}px ${SANS}`;
      ctx.fillText(title, x + 8, y + 15);
      list.forEach(([name, v, share], i) => {
        const ry = y + 24 + i * rh + rh * 0.72;
        ctx.fillStyle = i === 0 ? ACCENT : INK; ctx.font = `${i === 0 ? 700 : 500} ${full ? 11.5 : 10}px ${SANS}`;
        ctx.fillText(`${i + 1}. ${name}`, x + 8, ry);
        ctx.textAlign = "right"; ctx.font = `${full ? 10.5 : 9}px ${MONO}`; ctx.fillStyle = DIM;
        ctx.fillText(`${share.toFixed(1)}%`, x + w - 8, ry);
        ctx.textAlign = "left";
      });
      return bh;
    }

    function draw() {
      const { ctx, w, h } = s, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 24 : 18}px ${SERIF}`;
      ctx.fillText("갈림길에 선 귀농귀촌", full ? 22 : 14, full ? 34 : 25);
      ctx.fillStyle = DIM; ctx.font = `${full ? 12.5 : 10}px ${SANS}`;
      ctx.fillText("팔의 굵기 = 그해 인원 · 색 띠 = 나이대 구성 · 아래 이정표 = 많이 간 곳", full ? 22 : 14, full ? 53 : 40);

      const grow = KF.ease(Math.min(1, ((performance.now() - t0) / 1000 - 0.1) / 1.1));
      const G = postGeom(w, h, full);
      postAndSign(ctx, G.px, G.py, full);

      const maxTh = full ? 108 : 58;
      const thV = Math.max(10, maxTh * Math.sqrt(D.at(D.villageHead, year) / D.maxHead)) * grow;
      const thF = Math.max(6, maxTh * Math.sqrt(D.at(D.farmHead, year) / D.maxHead)) * grow;
      const villBands = drawArm(ctx, G.px, G.py, G.village.angle, G.armLen * Math.max(0.06, grow), thV, D.villAges, (a) => D.villAgeShare[year][a], hover && hover.side === "village" ? hover.a : null);
      const farmBands = drawArm(ctx, G.px, G.py, G.farm.angle, G.armLen * Math.max(0.06, grow), thF, D.farmAges, (a) => D.farmAgeShare[year][a], hover && hover.side === "farm" ? hover.a : null);

      // arm-end labels
      ctx.textAlign = "center";
      const labelAt = (tip, angle, text, sub) => {
        const lx = tip.x + Math.cos(angle) * 4, ly = tip.y + Math.sin(angle) * 4 + (full ? 22 : 18);
        ctx.fillStyle = INK; ctx.font = `700 ${full ? 15 : 12.5}px ${SERIF}`; ctx.fillText(text, lx, ly);
        ctx.fillStyle = ACCENT; ctx.font = `700 ${full ? 12.5 : 10.5}px ${MONO}`; ctx.fillText(sub, lx, ly + (full ? 18 : 15));
      };
      const villTip = { x: G.village.tipX, y: G.py + (G.village.tipY - G.py) * Math.max(0.06, grow) };
      const farmTip = { x: G.farm.tipX, y: G.py + (G.farm.tipY - G.py) * Math.max(0.06, grow) };
      labelAt(villTip, G.village.angle, "귀촌", `${KF.fmt(D.at(D.villageHead, year))}명`);
      labelAt(farmTip, G.farm.angle, "귀농", `${KF.fmt(D.at(D.farmHead, year))}명`);
      ctx.textAlign = "left";

      // centre callout (desktop only — at phone width the post sits too close under the title for this
      // to clear both without colliding; the same ratio is already legible from the two arm-end labels).
      if (full) {
        ctx.textAlign = "center";
        ctx.fillStyle = ACCENT; ctx.font = "700 17px " + SANS;
        ctx.fillText(`귀촌이 귀농의 ${D.at(D.ratio, year).toFixed(1)}배`, G.px, G.py - maxTh / 2 - 22);
        ctx.textAlign = "left";
      }

      // destination boards, if this year has region data
      areas = [];
      const rg = D.regions[String(year)];
      // clearance must be enough for BOTH lines of labelAt's two-line label (name + headcount, the
      // second line's baseline lands at tip.y + (22|18) + (18|15)) plus a real gap, or the destination
      // board's title collides with the headcount number (found via a 500px-wide diagnostic render).
      let boardBottom = Math.max(villTip.y, farmTip.y) + (full ? 54 : 46);
      if (rg && grow > 0.98) {
        const bw = full ? Math.min(220, w * 0.26) : w * 0.42;
        const vList = rg.village.slice(0, 3).map(([n, v]) => [n, v, (v / D.at(D.villageHead, year)) * 100]);
        const fList = rg.farm.slice(0, 3).map(([n, v]) => [n, v, (v / D.at(D.farmHead, year)) * 100]);
        const vx = KF.clamp(villTip.x - bw / 2, 4, w - bw - 4), fx = KF.clamp(farmTip.x - bw / 2, 4, w - bw - 4);
        const by = boardBottom;
        const h1 = destBoard(ctx, vx, by, bw, "귀촌이 많이 간 곳", vList, full);
        const h2 = destBoard(ctx, fx, by, bw, "귀농이 많이 간 곳", fList, full);
        areas.push({ kind: "board", x: vx, y: by, w: bw, h: Math.max(h1, h2), text: `귀촌 상위 지역: ${vList.map(([n, , sh]) => `${n} ${sh.toFixed(1)}%`).join(", ")}` });
        areas.push({ kind: "board", x: fx, y: by, w: bw, h: Math.max(h1, h2), text: `귀농 상위 지역: ${fList.map(([n, , sh]) => `${n} ${sh.toFixed(1)}%`).join(", ")}` });
        boardBottom = by + Math.max(h1, h2);
      }
      // hover hit-areas for the age bands (thick line segments)
      [...villBands.map((b) => ({ ...b, side: "village" })), ...farmBands.map((b) => ({ ...b, side: "farm" }))].forEach((b) => {
        areas.push({ kind: "band", side: b.side, a: b.a, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 });
      });

      // age legend: the arm stripes are coloured young(warm) -> old(cool); spell that out once, low on the stage
      if (grow > 0.98) {
        const legY = Math.min(h - (full ? 26 : 22), boardBottom + (full ? 30 : 22));
        const legX = full ? 22 : 14, legW = Math.min(full ? 300 : w - 28, w - legX * 2), legH = full ? 8 : 6;
        const grad = ctx.createLinearGradient(legX, 0, legX + legW, 0);
        [0, 20, 30, 40, 50, 60, 70].forEach((a) => grad.addColorStop(a / 70, rgb(ageColor(a))));
        ctx.fillStyle = grad; ctx.fillRect(legX, legY, legW, legH);
        ctx.strokeStyle = "rgba(44,36,23,.35)"; ctx.lineWidth = 1; ctx.strokeRect(legX + 0.5, legY + 0.5, legW - 1, legH - 1);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10.5 : 9}px ${SANS}`;
        ctx.textAlign = "left"; ctx.fillText("젊은 나이대", legX, legY + legH + (full ? 15 : 12));
        ctx.textAlign = "right"; ctx.fillText("고령", legX + legW, legY + legH + (full ? 15 : 12));
        ctx.textAlign = "left";
      }

      if (!KF.reduced && grow < 1) request();
    }

    function hit(e) {
      const r = s.c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      for (const a of areas) {
        if (a.kind === "board") { if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) return a; continue; }
        const d = distToSeg(x, y, a.x0, a.y0, a.x1, a.y1);
        if (d < 14) return a;
      }
      return null;
    }
    function distToSeg(px, py, x0, y0, x1, y1) {
      const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy;
      let t = len2 ? ((px - x0) * dx + (py - y0) * dy) / len2 : 0;
      t = KF.clamp(t, 0, 1);
      return Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t));
    }
    s.c.addEventListener("pointermove", (e) => {
      const a = hit(e);
      const key = a ? (a.kind === "band" ? a.side + a.a : a.text) : null;
      const prevKey = hover ? (hover.kind === "band" ? hover.side + hover.a : hover.text) : null;
      if (key !== prevKey) { hover = a; s.c.style.cursor = a ? "pointer" : "default"; request(); }
      if (a && a.kind === "band") {
        const share = (a.side === "village" ? D.villAgeShare[year] : D.farmAgeShare[year])[a.a];
        detail.textContent = `${a.side === "village" ? "귀촌" : "귀농"} · ${a.a}: 그 나이대가 ${share.toFixed(1)}%다.`;
      } else if (a && a.kind === "board") {
        detail.textContent = a.text;
      } else detail.textContent = overview();
    });
    s.c.addEventListener("pointerleave", () => { hover = null; detail.textContent = overview(); request(); });

    s.onresize = () => request();
    stage._kfStill = request;
    draw();
  }

  VIZ["rural-return"] = { thumb, mount, bg: BG };
})();
