// 02 births — "Ruler vs curve". Engineering paper; a ruler laid on the 2015–2023 decline
// predicts the future in pencil, and the real ink line walks off the ruler.
(() => {
  const PAPER = "#f3f0e6", GRID = "rgba(70,130,170,.16)", GRID2 = "rgba(70,130,170,.3)";
  const INK = "#1d3f8f", LEAD = "#4a4a48", RED = "#c8321e";
  const HAND = "'Nanum Pen Script', cursive", SERIF = "'Nanum Myeongjo', serif", MONO = "IBM Plex Mono, monospace";

  function paper(ctx, w, h, step) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += step) {
      ctx.strokeStyle = Math.round(x / step) % 5 ? GRID : GRID2; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.strokeStyle = Math.round(y / step) % 5 ? GRID : GRID2;
      ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); ctx.stroke();
    }
  }

  // Deterministic wobble so pencil lines look hand-drawn but do not flicker.
  const wob = (i, k) => Math.sin(i * 12.9898 + k * 78.233) * 0.8;

  function penLine(ctx, pts, prog, color, width, dash) {
    const n = pts.length - 1, upto = prog * n;
    if (upto <= 0) return null;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    let head = pts[0];
    for (let i = 1; i <= Math.ceil(upto) && i <= n; i++) {
      const k = Math.min(1, upto - (i - 1));
      const x = KF.lerp(pts[i - 1][0], pts[i][0], k), y = KF.lerp(pts[i - 1][1], pts[i][1], k);
      ctx.lineTo(x + wob(i, 1), y + wob(i, 2)); head = [x, y];
    }
    ctx.stroke(); ctx.restore();
    return head;
  }

  function axes(w, h, full, x0, x1, vmax) {
    const pad = full ? { l: 70, r: 40, t: 40, b: 46 } : { l: 18, r: 18, t: 20, b: 20 };
    return {
      pad,
      x: (yr) => pad.l + ((yr - x0) / (x1 - x0)) * (w - pad.l - pad.r),
      y: (v) => pad.t + (1 - v / vmax) * (h - pad.t - pad.b),
    };
  }

  function ruler(ctx, a, b, alpha) {
    // a translucent ruler lying along segment a->b
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), len = Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.25;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(a[0], a[1]); ctx.rotate(ang); ctx.translate(-len * 0.08, 6);
    ctx.fillStyle = "rgba(235,215,120,.55)"; ctx.strokeStyle = "rgba(120,100,30,.55)";
    ctx.fillRect(0, 0, len, 26); ctx.strokeRect(0, 0, len, 26);
    ctx.strokeStyle = "rgba(80,65,20,.55)";
    for (let i = 0; i < len; i += 8) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, i % 40 === 0 ? 10 : 5); ctx.stroke();
    }
    ctx.restore();
  }

  function annualScene(ctx, w, h, d, p, full) {
    // p: 0..1 progress of the whole choreography
    const years = Object.keys(d.annual).map(Number).sort((a, b) => a - b);
    const x0 = full ? 1981 : 2005, x1 = 2027;
    const f = axes(w, h, full, x0, x1, full ? 900000 : 500000);
    const real = years.filter((y) => y >= x0 && y <= 2023).map((y) => [f.x(y), f.y(d.annual[y])]);
    const tail = [2023, 2024, 2025].map((y) => [f.x(y), f.y(d.annual[y])]);
    const rl = [2015, 2026].map((y) => [f.x(y), f.y(d.ruler[y])]);

    if (full) {
      ctx.font = `500 10px ${MONO}`; ctx.fillStyle = "rgba(40,70,100,.6)"; ctx.textAlign = "right";
      for (let v = 0; v <= 900000; v += 100000) ctx.fillText(v ? `${v / 10000}만` : "0", f.pad.l - 10, f.y(v) + 3);
      ctx.textAlign = "center";
      for (let y = 1985; y <= 2025; y += 5) ctx.fillText(String(y), f.x(y), h - f.pad.b + 20);
    }
    penLine(ctx, real, KF.clamp(p / 0.35, 0, 1), LEAD, full ? 2.2 : 1.8);
    const pr = KF.clamp((p - 0.35) / 0.2, 0, 1);
    if (pr > 0) {
      ruler(ctx, rl[0], rl[1], Math.min(1, pr * 2));
      penLine(ctx, rl, pr, LEAD, 1.4, [6, 5]);
      if (pr > 0.9) {
        const px = f.x(2025), py = f.y(d.ruler[2025]);
        ctx.fillStyle = LEAD; ctx.beginPath(); ctx.arc(px, py, 3, 0, 7); ctx.fill();
        ctx.font = `${full ? 26 : 19}px ${HAND}`; ctx.textAlign = "left";
        ctx.fillText(`자로 그으면 2025년 ${Math.round(d.ruler[2025] / 1000) / 10}만 명`, px - (full ? 250 : 170), py + (full ? 40 : 30));
      }
    }
    const pt = KF.clamp((p - 0.6) / 0.2, 0, 1);
    if (pt > 0) {
      const head = penLine(ctx, tail, pt, INK, full ? 3.2 : 2.6);
      if (pt >= 1) {
        const [cx, cy] = [f.x(2025), f.y(d.annual[2025])];
        const pc = KF.clamp((p - 0.8) / 0.12, 0, 1);
        ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx, cy, full ? 28 : 20, full ? 18 : 13, -0.2, 0, Math.PI * 2 * pc); ctx.stroke(); ctx.restore();
        if (pc >= 1) {
          ctx.fillStyle = RED; ctx.font = `${full ? 30 : 21}px ${HAND}`; ctx.textAlign = "right";
          ctx.fillText(`실제 ${Math.round(d.annual[2025] / 1000) / 10}만 명`, cx + (full ? 36 : 26), cy - (full ? 30 : 20));
        }
      }
      if (head && pt < 1) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(head[0], head[1], 3, 0, 7); ctx.fill(); }
    }
    if (full) {
      ctx.fillStyle = "rgba(29,63,143,.9)"; ctx.font = `600 12px ${MONO}`; ctx.textAlign = "left";
      ctx.fillText("연간 출생아 수 · 1981–2025", f.pad.l, 26);
    }
  }

  function monthlyScene(ctx, w, h, d, p) {
    const m = d.monthly.filter((x) => x.prev);
    const pad = { l: 60, r: 30, t: 86, b: 60 };
    const bw = (w - pad.l - pad.r) / m.length;
    const lo = 16000, hi = 28000;
    const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (h - pad.t - pad.b);
    ctx.font = `500 10px ${MONO}`; ctx.fillStyle = "rgba(40,70,100,.6)"; ctx.textAlign = "right";
    for (let v = 16000; v <= 28000; v += 4000) ctx.fillText(`${v / 1000}천`, pad.l - 10, y(v) + 3);
    m.forEach((r, i) => {
      const k = KF.clamp(p * m.length * 1.4 - i, 0, 1);
      if (!k) return;
      const x = pad.l + i * bw + bw / 2, up = r.n >= r.prev;
      ctx.strokeStyle = up ? INK : LEAD; ctx.lineWidth = Math.max(2, bw * 0.45);
      ctx.globalAlpha = up ? 1 : 0.45;
      ctx.beginPath(); ctx.moveTo(x, y(r.prev)); ctx.lineTo(x, KF.lerp(y(r.prev), y(r.n), k)); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = LEAD; ctx.fillRect(x - bw * 0.35, y(r.prev) - 1, bw * 0.7, 2);
      if (r.ym.endsWith("01")) {
        ctx.fillStyle = "rgba(40,70,100,.7)"; ctx.textAlign = "center"; ctx.fillText(r.ym.slice(0, 4), x, h - pad.b + 20);
      }
    });
    const upN = m.filter((r) => r.n >= r.prev).length;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 12px ${MONO}`;
    ctx.fillText("월별 출생등록 · 같은 달 전년(가로 눈금) 대비", pad.l, 30);
    ctx.font = `28px ${HAND}`; ctx.fillStyle = RED;
    ctx.fillText(`${m.length}달 중 ${upN}달이 전년보다 많았다`, pad.l, 56);
  }

  function lagScene(ctx, w, h, d, p) {
    const pad = { l: 96, r: 130, t: 60, b: 50 };
    const yrs = Object.keys(d.daycare).map(Number);
    const x = (yr) => pad.l + ((yr - 2005) / 20) * (w - pad.l - pad.r);
    const base = 2013;
    const y = (v) => pad.t + (1 - (v - 40) / 90) * (h - pad.t - pad.b);
    const dc = yrs.map((yr) => [x(yr), y((d.daycare[yr] / d.daycare[base]) * 100)]);
    const bt = yrs.map((yr) => [x(yr), y((d.annual[yr] / d.annual[base]) * 100)]);
    ctx.font = `500 10px ${MONO}`; ctx.fillStyle = "rgba(40,70,100,.6)"; ctx.textAlign = "center";
    for (let yr = 2005; yr <= 2025; yr += 5) ctx.fillText(String(yr), x(yr), h - pad.b + 20);
    ctx.textAlign = "right"; ctx.fillText("2013 = 100", pad.l - 8, y(100) + 3);
    ctx.setLineDash([3, 4]); ctx.strokeStyle = GRID2; ctx.beginPath(); ctx.moveTo(pad.l, y(100)); ctx.lineTo(w - pad.r, y(100)); ctx.stroke(); ctx.setLineDash([]);
    const h1 = penLine(ctx, bt, KF.clamp(p / 0.6, 0, 1), INK, 3);
    const h2 = penLine(ctx, dc, KF.clamp((p - 0.25) / 0.6, 0, 1), RED, 3);
    ctx.font = `26px ${HAND}`; ctx.textAlign = "left";
    if (h1 && p > 0.6) { ctx.fillStyle = INK; ctx.fillText("출생아", h1[0] + 10, h1[1] + 26); }
    if (h2 && p > 0.85) { ctx.fillStyle = RED; ctx.fillText("어린이집 수", h2[0] + 10, h2[1] - 10); }
    ctx.fillStyle = INK; ctx.font = `600 12px ${MONO}`;
    ctx.fillText("출생아 수와 어린이집 수 · 2013년 = 100", pad.l, 30);
  }

  function thumb(ctx, w, h, t, d) {
    paper(ctx, w, h, 12);
    const p = (t % 11) / 9;
    annualScene(ctx, w, h, d, Math.min(1, p), false);
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let scene = "annual", t0 = performance.now();
    KF.segment(controls, [
      { id: "annual", label: "자와 곡선 (연간)" }, { id: "monthly", label: "달마다 (2022.10–)" }, { id: "lag", label: "시차 (어린이집)" },
    ], scene, (id) => { scene = id; t0 = performance.now(); });
    KF.loop(stage, () => {
      const { ctx, w, h } = s;
      paper(ctx, w, h, 16);
      const p = KF.clamp((performance.now() - t0) / 1000 / (scene === "annual" ? 7 : 3.5), 0, 1);
      if (scene === "annual") annualScene(ctx, w, h, d, p, w > 520);
      if (scene === "monthly") monthlyScene(ctx, w, h, d, p);
      if (scene === "lag") lagScene(ctx, w, h, d, p);
    });
  }

  VIZ.births = { thumb, mount, bg: PAPER };
})();
