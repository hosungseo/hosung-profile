// 05 heat — "Heat calendar". Thermal-camera palette; one row per summer (2011–2025), one cell
// per day (May 15 – Sep 30); colour = emergency-room heat-illness reports that day.
(() => {
  const BG = "#0a0605", MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  const STOPS = [[0, [18, 8, 30]], [0.15, [70, 12, 90]], [0.35, [170, 30, 70]], [0.55, [235, 80, 30]], [0.78, [252, 175, 40]], [1, [255, 248, 210]]];
  const heatColor = (v) => {
    for (let i = 1; i < STOPS.length; i++) {
      if (v <= STOPS[i][0]) {
        const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], k = (v - a) / (b - a);
        return `rgb(${ca.map((c, j) => Math.round(KF.lerp(c, cb[j], k))).join(",")})`;
      }
    }
    return "rgb(255,248,210)";
  };
  const DAYS = (() => { // May 15 .. Sep 30 as "MM-DD"
    const out = [], d = new Date(Date.UTC(2021, 4, 15));
    while (d.getUTCMonth() < 9) { out.push(d.toISOString().slice(5, 10)); d.setUTCDate(d.getUTCDate() + 1); }
    return out;
  })();
  const VMAX = 120; // reports/day at which the palette saturates

  function calendar(ctx, w, h, d, p, full, hover) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = full ? { l: 54, r: 110, t: 48, b: 40 } : { l: 10, r: 10, t: 12, b: 12 };
    const cw = (w - pad.l - pad.r) / DAYS.length, rh = (h - pad.t - pad.b) / d.years.length;
    let hit = null;
    d.years.forEach((y, r) => {
      const rowP = KF.clamp(p * (d.years.length + 4) - r, 0, 1);
      DAYS.forEach((md, c) => {
        if (c / DAYS.length > rowP) return;
        const n = d.daily[`${y}-${md}`] || 0;
        const x = pad.l + c * cw, yy = pad.t + r * rh;
        ctx.fillStyle = n ? heatColor(Math.min(1, Math.sqrt(n / VMAX))) : "#140b10";
        ctx.fillRect(x, yy, Math.ceil(cw) - (full ? 0.5 : 0), rh - (full ? 2 : 1));
        if (hover && hover[0] >= x && hover[0] < x + cw && hover[1] >= yy && hover[1] < yy + rh) hit = { y, md, n, x, yy };
      });
      if (full) {
        ctx.fillStyle = "rgba(255,220,190,.55)"; ctx.font = `500 10px ${MONO}`; ctx.textAlign = "right";
        ctx.fillText(y, pad.l - 8, pad.t + r * rh + rh / 2 + 3);
        const tot = d.total[y], bw = (tot / 5000) * (pad.r - 50);
        ctx.fillStyle = "rgba(235,80,30,.75)"; ctx.fillRect(w - pad.r + 10, pad.t + r * rh + 2, bw * rowP, rh - 5);
        ctx.fillStyle = "rgba(255,230,200,.8)"; ctx.textAlign = "left";
        if (rowP >= 1) ctx.fillText(KF.fmt(tot), w - pad.r + 14 + bw, pad.t + r * rh + rh / 2 + 3);
      }
    });
    if (full) {
      ctx.fillStyle = "rgba(255,220,190,.5)"; ctx.textAlign = "center"; ctx.font = `500 10px ${MONO}`;
      ["06-01", "07-01", "08-01", "09-01"].forEach((md) => {
        const c = DAYS.indexOf(md); ctx.fillText(`${+md.slice(0, 2)}월`, pad.l + c * cw, h - pad.b + 18);
      });
      ctx.textAlign = "left"; ctx.fillStyle = "#ffd9b8"; ctx.font = `600 12px ${MONO}`;
      ctx.fillText("온열질환 응급실 신고 · 하루 한 칸 (5.15–9.30)", pad.l, 28);
      ctx.textAlign = "right"; ctx.fillText("여름 합계", w - 14, 28);
      if (hit) {
        const t = `${hit.y}.${hit.md.replace("-", ".")}  ${hit.n}명`;
        ctx.font = `600 12px ${MONO}`; const tw = ctx.measureText(t).width + 16;
        const bx = Math.min(hit.x + 8, w - tw - 8), by = Math.max(hit.yy - 30, 4);
        ctx.fillStyle = "rgba(10,6,5,.92)"; ctx.fillRect(bx, by, tw, 22);
        ctx.strokeStyle = "#ffb04a"; ctx.strokeRect(bx + .5, by + .5, tw, 22);
        ctx.fillStyle = "#ffe8cc"; ctx.textAlign = "left"; ctx.fillText(t, bx + 8, by + 15);
      }
    }
  }

  function bars(ctx, w, h, rows, p, title, sub) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = { l: w * 0.28, r: 90, t: 70, b: 30 };
    const max = Math.max(...rows.map((r) => r[1]));
    const rh = Math.min(30, (h - pad.t - pad.b) / rows.length);
    rows.forEach(([k, v], i) => {
      const e = KF.ease(KF.clamp(p * 1.5 - i * 0.05, 0, 1));
      const y = pad.t + i * rh, bw = (v / max) * (w - pad.l - pad.r) * e;
      const g = ctx.createLinearGradient(pad.l, 0, pad.l + bw, 0);
      g.addColorStop(0, "rgb(70,12,90)"); g.addColorStop(1, heatColor(0.25 + 0.75 * (v / max)));
      ctx.fillStyle = g; ctx.fillRect(pad.l, y + 3, bw, rh - 8);
      ctx.fillStyle = "#ffe3c8"; ctx.font = `500 13px ${SANS}`; ctx.textAlign = "right"; ctx.fillText(k, pad.l - 12, y + rh / 2 + 4);
      ctx.font = `500 12px ${MONO}`; ctx.textAlign = "left"; ctx.fillText(KF.fmt(v), pad.l + bw + 8, y + rh / 2 + 4);
    });
    ctx.textAlign = "left"; ctx.fillStyle = "#ffd9b8"; ctx.font = `600 12px ${MONO}`; ctx.fillText(title, 24, 30);
    ctx.fillStyle = "rgba(255,217,184,.6)"; ctx.font = `500 11px ${MONO}`; ctx.fillText(sub, 24, 48);
  }

  function sumOver(obj, years) {
    const out = {};
    for (const y of years) for (const [k, v] of Object.entries(obj[y] || {})) out[k] = (out[k] || 0) + v;
    return out;
  }

  function thumb(ctx, w, h, t, d) {
    const c = t % 9;
    calendar(ctx, w, h, d, KF.clamp(c / 5, 0, 1), false);
    if (c > 7.8) { ctx.fillStyle = `rgba(10,6,5,${(c - 7.8) / 1.2})`; ctx.fillRect(0, 0, w, h); }
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let view = "cal", t0 = performance.now(), hover = null;
    KF.segment(controls, [{ id: "cal", label: "열의 달력" }, { id: "place", label: "어디서 쓰러졌나" }, { id: "age", label: "몇 살이었나" }],
      view, (id) => { view = id; t0 = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    const all = d.years;
    const place = Object.entries(sumOver(d.place, all)).filter(([k]) => k !== "미상").sort((a, b) => b[1] - a[1]);
    const age = Object.entries(sumOver(d.age, all)).sort((a, b) => a[0] - b[0]).map(([k, v]) => [+k >= 80 ? "80세 이상" : `${k}대`, v]);
    KF.loop(stage, () => {
      const p = KF.clamp((performance.now() - t0) / 1000 / (view === "cal" ? 4 : 1.6), 0, 1);
      if (view === "cal") calendar(s.ctx, s.w, s.h, d, p, s.w > 520, hover);
      if (view === "place") bars(s.ctx, s.w, s.h, place, p, "어디서 쓰러졌나 · 2011–2025 신고 합계", "장소가 기록된 신고만");
      if (view === "age") bars(s.ctx, s.w, s.h, age, p, "몇 살이었나 · 2011–2025 신고 합계", "나이대별");
    });
  }

  VIZ.heat = { thumb, mount, bg: BG };
})();
