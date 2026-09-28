// 08 solar — "Sundial". One turn of the dial = one day, noon at the top. Each hour is a sector: its
// outer edge is national demand, the gold band under that edge is market-traded solar, teal is wind.
(() => {
  const BG = "#1b1433";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif";
  const GOLD = "#ffc94d", TEAL = "#58cfc2", LINE = "#efeaff", DIM = "rgba(239,234,255,.6)", FAINT = "rgba(239,234,255,.16)";
  const V1 = 100000; // radial scale (MWh per hour) from zero at the centre disc to 100 GW at the rim, so gold/sector = share
  const WDAY = "일월화수목금토";
  const CACHE = new WeakMap();

  // ---------------------------------------------------------------- data
  function decode(d) {
    if (CACHE.has(d)) return CACHE.get(d);
    const n = d.d.length, u = d.unit, N = n * 24;
    const D = new Float32Array(N), S = new Float32Array(N), W = new Float32Array(N);
    for (let i = 0; i < n; i++) for (let h = 0; h < 24; h++) {
      D[i * 24 + h] = parseInt(d.d[i].substr(h * 3, 3), 36) * u;
      S[i * 24 + h] = parseInt(d.s[i].substr(h * 2, 2), 36) * u;
      W[i * 24 + h] = parseInt(d.w[i].substr(h * 2, 2), 36) * u;
    }
    const dayMax = new Float32Array(n), dayPeak = new Uint8Array(n), dayShare = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let sd = 0, ss = 0;
      for (let h = 0; h < 24; h++) {
        const k = i * 24 + h, sh = S[k] / D[k];
        sd += D[k]; ss += S[k];
        if (sh > dayMax[i]) { dayMax[i] = sh; dayPeak[i] = h; }
      }
      dayShare[i] = ss / sd;
    }
    const smooth = (A) => { // 7-day centred average per hour, for the looping thumbnail
      const B = new Float32Array(N);
      for (let i = 0; i < n; i++) for (let h = 0; h < 24; h++) {
        let s = 0, c = 0;
        for (let j = Math.max(0, i - 3); j <= Math.min(n - 1, i + 3); j++) { s += A[j * 24 + h]; c++; }
        B[i * 24 + h] = s / c;
      }
      return B;
    };
    const [y, m, dd] = d.start.split("-").map(Number);
    const dates = Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - 1, dd + i)));
    const best = dates.findIndex((x) => x.toISOString().slice(0, 10) === d.sum.best[0]);
    const X = { n, D, S, W, dayMax, dayPeak, dayShare, dates, best, Ds: null, Ss: null, Ws: null, smooth };
    CACHE.set(d, X);
    return X;
  }
  const sm = (X) => { if (!X.Ds) { X.Ds = X.smooth(X.D); X.Ss = X.smooth(X.S); X.Ws = X.smooth(X.W); } return X; };
  const kdate = (dt, wd = true) => `${dt.getUTCMonth() + 1}월 ${dt.getUTCDate()}일${wd ? `(${WDAY[dt.getUTCDay()]})` : ""}`;

  // values of hour h on fractional day f
  function at(X, f, h, smooth) {
    const D = smooth ? X.Ds : X.D, S = smooth ? X.Ss : X.S, W = smooth ? X.Ws : X.W;
    const i = Math.floor(f), j = Math.min(X.n - 1, i + 1), k = f - i;
    const L = (A) => KF.lerp(A[i * 24 + h], A[j * 24 + h], k);
    return [L(D), L(S), L(W)];
  }

  // season tint of the dial face, by day of year
  const SEASON = [[15, [236, 228, 214]], [105, [255, 226, 150]], [196, [255, 192, 104]], [288, [255, 164, 104]], [380, [236, 228, 214]]];
  function tint(doy) {
    for (let i = 1; i < SEASON.length; i++) {
      const [a, ca] = SEASON[i - 1], [b, cb] = SEASON[i];
      const x = doy < SEASON[0][0] ? doy + 365 : doy;
      if (x <= b) { const k = (x - a) / (b - a); return ca.map((c, j) => Math.round(KF.lerp(c, cb[j], k))); }
    }
    return SEASON[0][1];
  }
  function sun(doy) { // sunrise / sunset (KST, hours) for Seoul, simple declination model
    const lat = 37.57 * Math.PI / 180, dec = 23.44 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + doy) / 365);
    const w0 = Math.acos(KF.clamp(-Math.tan(lat) * Math.tan(dec), -1, 1)) * 180 / Math.PI;
    const noon = 12 + (135 - 126.98) / 15, half = w0 / 15;
    return [noon - half, noon + half];
  }

  // ---------------------------------------------------------------- the dial
  const ang = (hc) => -Math.PI / 2 + (hc - 12) * Math.PI / 12; // clock hour -> canvas angle, noon at the top

  function sector(ctx, cx, cy, r1, r2, a0, a1) {
    if (r2 <= r1 + 0.05) return false;
    ctx.beginPath(); ctx.arc(cx, cy, r2, a0, a1); ctx.arc(cx, cy, r1, a1, a0, true); ctx.closePath();
    return true;
  }

  function dial(ctx, cx, cy, R, X, f, o) {
    const R0 = R * 0.27, rad = (v) => R0 + (KF.clamp(v, 0, V1) / V1) * (R - R0);
    const doy = Math.floor(f) + 1, c = tint(doy).join(",");
    // face: night disc, with the daylight hours lit in the season's colour
    const g = ctx.createRadialGradient(cx, cy, R0, cx, cy, R * 1.04);
    g.addColorStop(0, "#1f1740"); g.addColorStop(1, "#2a2152");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, 0, Math.PI * 2); ctx.fill();
    const [sr, ss] = sun(doy);
    const lg = ctx.createRadialGradient(cx, cy, R0, cx, cy, R * 1.04);
    lg.addColorStop(0, `rgba(${c},.02)`); lg.addColorStop(0.7, `rgba(${c},.09)`); lg.addColorStop(1, `rgba(${c},.2)`);
    ctx.fillStyle = lg; sector(ctx, cx, cy, R0, R * 1.04, ang(sr), ang(ss)); ctx.fill();
    ctx.strokeStyle = `rgba(${c},.45)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, ang(sr), ang(ss)); ctx.stroke();
    ctx.strokeStyle = "rgba(239,234,255,.06)"; ctx.lineWidth = 1;
    for (let hh = 0; hh < 24; hh++) { const a = ang(hh); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); ctx.lineTo(cx + Math.cos(a) * R * 1.04, cy + Math.sin(a) * R * 1.04); ctx.stroke(); }
    // grid circles
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
    for (const v of [25000, 50000, 75000]) { ctx.beginPath(); ctx.arc(cx, cy, rad(v), 0, Math.PI * 2); ctx.stroke(); }
    ctx.setLineDash([]);
    if (o.full && o.labels) {
      ctx.fillStyle = "rgba(239,234,255,.42)"; ctx.font = `500 9.5px ${MONO}`; ctx.textAlign = "left";
      for (const v of [25000, 50000, 75000]) ctx.fillText(`${v / 1000}GW`, cx + 4, cy + rad(v) - 3);
    }
    // hour sectors
    const pad = o.full ? 0.012 : 0.02;
    let peak = -1, pv = -1;
    for (let h = 0; h < 24; h++) {
      const [Dv, Sv, Wv] = at(X, f, h, o.smooth);
      if (Sv / Dv > pv) { pv = Sv / Dv; peak = h; }
      const a0 = ang(h) + pad, a1 = ang(h + 1) - pad, hi = o.hover === h;
      const rD = rad(Dv), rS = rad(Dv - Sv), rW = rad(Dv - Sv - Wv);
      ctx.fillStyle = hi ? "rgba(200,190,255,.34)" : "rgba(170,160,235,.17)";
      if (sector(ctx, cx, cy, R0, rW, a0, a1)) ctx.fill();
      ctx.fillStyle = TEAL; ctx.globalAlpha = hi ? 1 : 0.85;
      if (sector(ctx, cx, cy, rW, rS, a0, a1)) ctx.fill();
      ctx.fillStyle = GOLD; ctx.globalAlpha = hi ? 1 : 0.95;
      if (sector(ctx, cx, cy, rS, rD, a0, a1)) ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = LINE; ctx.lineWidth = hi ? 2.4 : 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, rD, a0, a1); ctx.stroke();
    }
    // hour lines and labels
    ctx.strokeStyle = "rgba(239,234,255,.35)"; ctx.lineWidth = 1;
    for (let h = 0; h < 24; h++) {
      const a = ang(h), long = h % 6 === 0;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R + 3), cy + Math.sin(a) * (R + 3));
      ctx.lineTo(cx + Math.cos(a) * (R + (long ? 11 : 7)), cy + Math.sin(a) * (R + (long ? 11 : 7))); ctx.stroke();
    }
    if (o.labels) {
      const L = o.full ? [[0, "자정"], [3, "3"], [6, "6시"], [9, "9"], [12, "정오"], [15, "15"], [18, "18시"], [21, "21"]] : [[0, "자정"], [6, "6시"], [12, "정오"], [18, "18시"]];
      ctx.fillStyle = DIM; ctx.textAlign = "center";
      for (const [hh, t] of L) {
        const a = ang(hh), rr = R + (o.full ? 24 : 19);
        ctx.font = `${hh % 6 === 0 ? 600 : 500} ${o.full ? (hh % 6 === 0 ? 12 : 10.5) : 10.5}px ${hh % 6 === 0 ? SANS : MONO}`;
        ctx.fillText(t, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr + 4);
      }
    }
    // the sun on the rim, over the hour with the largest solar share
    if (peak >= 0 && pv > 0.004) {
      const a = ang(peak + 0.5), sx = cx + Math.cos(a) * (R * 1.04), sy = cy + Math.sin(a) * (R * 1.04), sr2 = o.full ? 7 : 5;
      ctx.strokeStyle = "rgba(255,201,77,.45)"; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); ctx.lineTo(sx, sy); ctx.stroke(); ctx.setLineDash([]);
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr2 * 3);
      sg.addColorStop(0, "rgba(255,214,110,.75)"); sg.addColorStop(1, "rgba(255,214,110,0)");
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, sr2 * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(sx, sy, sr2, 0, Math.PI * 2); ctx.fill();
    }
    // centre disc
    ctx.fillStyle = "rgba(20,14,40,.92)"; ctx.beginPath(); ctx.arc(cx, cy, R0 - 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,201,77,.35)"; ctx.lineWidth = 1; ctx.stroke();
    return { R0, rad, peak, pv };
  }

  function centre(ctx, cx, cy, R0, X, f, pk, full, dateA) {
    const i = Math.round(f), dt = X.dates[KF.clamp(i, 0, X.n - 1)];
    ctx.save(); ctx.globalAlpha = dateA; ctx.textAlign = "center";
    ctx.fillStyle = DIM; ctx.font = `600 ${full ? 12.5 : 10}px ${SANS}`;
    ctx.fillText(kdate(dt), cx, cy - R0 * 0.4);
    ctx.fillStyle = GOLD; ctx.font = `700 ${Math.round(R0 * (full ? 0.46 : 0.48))}px ${SANS}`;
    ctx.fillText(`${(pk.pv * 100).toFixed(1)}%`, cx, cy + R0 * 0.14);
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9}px ${SANS}`;
    ctx.fillText(`${pk.peak}–${pk.peak + 1}시 태양광 몫`, cx, cy + R0 * 0.5);
    ctx.restore();
  }

  // year strip: each day's largest hourly solar share, with the annual share as a dashed line
  function strip(ctx, x, y, w, h, X, d, sel, full, hoverDay) {
    const top = 0.18, n = X.n, bw = w / n;
    ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fillRect(x, y, w, h);
    for (let i = 0; i < n; i++) {
      const v = X.dayMax[i], bh = (v / top) * h;
      ctx.fillStyle = i === sel ? "#fff4d0" : hoverDay === i ? "#ffe29a" : "rgba(255,201,77,.72)";
      ctx.fillRect(x + i * bw, y + h - bh, Math.max(1, bw - (bw > 2 ? 0.4 : 0)), bh);
    }
    const ay = y + h - (d.sum.share_s / 100 / top) * h;
    ctx.strokeStyle = "rgba(239,234,255,.8)"; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, ay); ctx.lineTo(x + w, ay); ctx.stroke(); ctx.setLineDash([]);
    // month ticks
    ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10 : 9.5}px ${MONO}`; ctx.textAlign = "center";
    X.dates.forEach((dt, i) => {
      if (dt.getUTCDate() !== 1) return;
      const m = dt.getUTCMonth() + 1;
      if (!full && m % 3 !== 1) return;
      ctx.fillText(full ? String(m) : `${m}월`, x + i * bw + (full ? 12 : 8), y + h + 13);
    });
    // selected day marker
    const sx = x + (sel + 0.5) * bw;
    ctx.fillStyle = "#fff4d0"; ctx.beginPath(); ctx.moveTo(sx, y - 2); ctx.lineTo(sx - 4, y - 8); ctx.lineTo(sx + 4, y - 8); ctx.closePath(); ctx.fill();
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const X = sm(decode(d));
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const u = (t % 10) / 10, f = ((u * 365 + X.best - 3.5 * 36.5) % 365 + 365) % 365;
    const R = h * 0.4, cx = w * 0.06 + R + 6, cy = h * 0.52;
    const pk = dial(ctx, cx, cy, R, X, Math.min(f, X.n - 1.001), { smooth: true, full: false, labels: false });
    ctx.save(); ctx.textAlign = "center"; // the season clock: month only (the dial here is a 7-day average)
    ctx.fillStyle = LINE; ctx.font = `700 ${Math.round(pk.R0 * 0.5)}px ${SERIF}`;
    ctx.fillText(`${X.dates[Math.floor(f)].getUTCMonth() + 1}월`, cx, cy + pk.R0 * 0.18); ctx.restore();
    const x = cx + R + w * 0.07;
    ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.06)}px ${SANS}`; ctx.fillText("1년 평균", x, h * 0.3);
    ctx.fillStyle = LINE; ctx.font = `700 ${Math.round(h * 0.15)}px ${SANS}`; ctx.fillText(`${d.sum.share_s.toFixed(1)}%`, x, h * 0.3 + h * 0.15);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.06)}px ${SANS}`; ctx.fillText("가장 큰 한 시간", x, h * 0.66);
    ctx.fillStyle = GOLD; ctx.font = `700 ${Math.round(h * 0.15)}px ${SANS}`; ctx.fillText(`${d.sum.best[2].toFixed(0)}%`, x, h * 0.66 + h * 0.15);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage);
    let f = 0, target = X.best, t0 = performance.now(), playing = false, intro = true, hover = null, hoverDay = null, geo = null, pointer = null;
    const play = document.createElement("button"); play.type = "button"; play.textContent = "▶ 1년 재생";
    const range = document.createElement("input"); range.type = "range"; range.min = 0; range.max = X.n - 1; range.value = X.best;
    const lab = document.createElement("label"); lab.append("날짜", range);
    const out = document.createElement("span"); out.className = "readout";
    const best = document.createElement("button"); best.type = "button"; best.textContent = "가장 큰 한 시간";
    controls.append(play, lab, out, best);
    const setOut = () => { out.textContent = kdate(X.dates[Math.round(f)]); };
    const stop = () => { playing = false; play.textContent = "▶ 1년 재생"; };
    play.onclick = () => { intro = false; playing = !playing; play.textContent = playing ? "❚❚ 멈춤" : "▶ 1년 재생"; if (playing && f >= X.n - 1.5) f = 0; };
    range.oninput = () => { intro = false; stop(); f = +range.value; target = f; };
    best.onclick = () => { intro = false; stop(); target = X.best; };
    const pick = (e, commit) => {
      const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      pointer = [x, y]; hover = null; hoverDay = null;
      if (!geo) return;
      const dx = x - geo.cx, dy = y - geo.cy, rr = Math.hypot(dx, dy);
      if (rr > geo.R0 && rr < geo.R + 12) {
        let hc = 12 + (Math.atan2(dy, dx) + Math.PI / 2) * 12 / Math.PI;
        hc = ((hc % 24) + 24) % 24; hover = Math.floor(hc);
      } else if (geo.strip && x >= geo.strip[0] && x <= geo.strip[0] + geo.strip[2] && y >= geo.strip[1] - 10 && y <= geo.strip[1] + geo.strip[3] + 16) {
        hoverDay = KF.clamp(Math.floor((x - geo.strip[0]) / geo.strip[2] * X.n), 0, X.n - 1);
        if (commit) { intro = false; stop(); f = hoverDay; target = hoverDay; range.value = hoverDay; }
      }
    };
    stage.addEventListener("pointermove", (e) => pick(e, e.buttons === 1));
    stage.addEventListener("pointerdown", (e) => pick(e, true));
    stage.addEventListener("pointerleave", () => { hover = null; hoverDay = null; pointer = null; });
    let last = performance.now(), shown = -1;

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const el = (now - t0) / 1000;
      if (intro) { f = KF.ease(KF.clamp((el - 0.4) / 4.2, 0, 1)) * X.best; if (el > 4.6) { intro = false; f = X.best; target = f; } }
      else if (playing) { f += dt * 8; if (f >= X.n - 1) { f = X.n - 1; stop(); } target = f; }
      else f += (target - f) * (1 - Math.exp(-dt * 7));
      if (Math.round(f) !== shown) { shown = Math.round(f); range.value = shown; setOut(); } // touch the DOM only on change
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const R = full ? Math.min(h * 0.4, w * 0.25) : Math.min(w * 0.39, h * 0.3);
      const cx = full ? R + 62 : w / 2, cy = full ? h * 0.5 + 4 : R + 30;
      const pk = dial(ctx, cx, cy, R, X, KF.clamp(f, 0, X.n - 1.0001), { smooth: false, full, labels: true, hover });
      centre(ctx, cx, cy, pk.R0, X, f, pk, full, 1);
      let stripBox;
      if (full) {
        const x0 = cx + R + 70, pw = w - x0 - 30;
        ctx.textAlign = "left"; ctx.fillStyle = LINE; ctx.font = `700 21px ${SERIF}`;
        ctx.fillText(`해시계 · ${d.year}년의 하루`, x0, 50);
        const leg = [[LINE, "가장자리", "시간마다의 전국 전력수요"], [GOLD, "금색", "태양광 (전력시장 거래분)"], [TEAL, "청록", "풍력"], ["rgba(170,160,235,.5)", "안쪽", "그 밖의 발전 (원전·석탄·가스 등)"]];
        leg.forEach(([c, k, t], j) => {
          const y = 80 + j * 21;
          ctx.fillStyle = c; ctx.fillRect(x0, y - 9, 12, 10);
          ctx.fillStyle = DIM; ctx.font = `500 12.5px ${SANS}`; ctx.fillText(`${k} = ${t}`, x0 + 20, y);
        });
        ctx.fillStyle = "rgba(239,234,255,.45)"; ctx.font = `500 11px ${SANS}`;
        ctx.fillText("가운데 원 = 0, 바깥 테 = 100GW · 금색 해 = 태양광 몫이 가장 큰 시간", x0, 80 + 4 * 21);
        // the two numbers
        const by = 222;
        ctx.fillStyle = DIM; ctx.font = `600 12.5px ${SANS}`;
        ctx.fillText("1년 전체", x0, by); ctx.fillText("가장 큰 한 시간", x0 + pw * 0.5, by);
        ctx.fillStyle = LINE; ctx.font = `700 40px ${SANS}`; ctx.fillText(`${d.sum.share_s.toFixed(1)}%`, x0, by + 44);
        ctx.fillStyle = GOLD; ctx.fillText(`${d.sum.best[2].toFixed(1)}%`, x0 + pw * 0.5, by + 44);
        const bdt = X.dates[X.best];
        ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
        ctx.fillText("전력수요 중 태양광", x0, by + 66);
        ctx.fillText(`${kdate(bdt)} ${d.sum.best[1] - 1}–${d.sum.best[1]}시`, x0 + pw * 0.5, by + 66);
        dayLine(ctx, X, f, x0, 338);
        const sy = h - 118, sh = 70;
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`날마다 가장 큰 한 시간의 태양광 몫 · 점선 = 1년 평균 ${d.sum.share_s.toFixed(1)}% · 누르면 그날로`, x0, sy - 16);
        strip(ctx, x0, sy, pw, sh, X, d, Math.round(f), true, hoverDay);
        stripBox = [x0, sy, pw, sh];
      } else {
        const y0 = cy + R + 44;
        ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 11px ${SANS}`;
        ctx.fillText("1년 전체", 12, y0); ctx.fillText("가장 큰 한 시간", w / 2 + 6, y0);
        ctx.fillStyle = LINE; ctx.font = `700 24px ${SANS}`; ctx.fillText(`${d.sum.share_s.toFixed(1)}%`, 12, y0 + 26);
        ctx.fillStyle = GOLD; ctx.fillText(`${d.sum.best[2].toFixed(1)}%`, w / 2 + 6, y0 + 26);
        const sy = h - 38, sh = 22;
        strip(ctx, 12, sy, w - 24, sh, X, d, Math.round(f), false, hoverDay);
        stripBox = [12, sy, w - 24, sh];
      }
      geo = { cx, cy, R, R0: pk.R0, strip: stripBox };
      if (hover != null && pointer) tip(ctx, w, h, X, f, hover, pointer, full);
      else if (hoverDay != null && pointer && full) dayTip(ctx, w, X, hoverDay, pointer);
    });
    setOut();
  }

  function dayLine(ctx, X, f, x, y) {
    const i = KF.clamp(Math.round(f), 0, X.n - 1);
    let lo = 0, hi = 0;
    for (let h = 1; h < 24; h++) { if (X.D[i * 24 + h] < X.D[i * 24 + lo]) lo = h; if (X.D[i * 24 + h] > X.D[i * 24 + hi]) hi = h; }
    const gw = (v) => `${(v / 1000).toFixed(1)}GW`;
    ctx.textAlign = "left"; ctx.fillStyle = LINE; ctx.font = `700 13px ${SANS}`;
    ctx.fillText(`${kdate(X.dates[i])}`, x, y);
    ctx.font = `500 13px ${SANS}`; ctx.fillStyle = DIM;
    ctx.fillText(`하루 전체 태양광 몫 ${(X.dayShare[i] * 100).toFixed(1)}% · 가장 클 때 ${(X.dayMax[i] * 100).toFixed(1)}%`, x, y + 22);
    const t = `수요 최저 ${lo}–${lo + 1}시 ${gw(X.D[i * 24 + lo])} → 최고 ${hi}–${hi + 1}시 ${gw(X.D[i * 24 + hi])}`;
    ctx.fillText(t, x, y + 44);
    if (lo >= 10 && lo <= 15) { ctx.fillStyle = GOLD; ctx.font = `600 12.5px ${SANS}`; ctx.fillText("수요가 가장 낮은 때가 새벽이 아니라 한낮", x, y + 66); }
  }

  function tip(ctx, w, h, X, f, hr, p, full) {
    const i = Math.round(f), [Dv, Sv, Wv] = at(X, i, hr, false);
    const lines = [[`${kdate(X.dates[i])} ${hr}–${hr + 1}시`, LINE, 700], [`전력수요 ${KF.fmt(Dv)} MWh`, LINE, 500],
      [`태양광 ${KF.fmt(Sv)} MWh · ${(Sv / Dv * 100).toFixed(1)}%`, GOLD, 600], [`풍력 ${KF.fmt(Wv)} MWh · ${(Wv / Dv * 100).toFixed(1)}%`, TEAL, 600]];
    const fs = full ? 12 : 11;
    ctx.font = `600 ${fs}px ${SANS}`;
    const bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22, bh = 12 + lines.length * (fs + 7);
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(20,14,40,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(255,201,77,.5)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, c, wt], k) => { ctx.fillStyle = c; ctx.font = `${wt} ${fs}px ${SANS}`; ctx.fillText(t, bx + 11, by + 8 + (k + 1) * (fs + 7) - 4); });
  }

  function dayTip(ctx, w, X, i, p) {
    const t = `${kdate(X.dates[i])} · 가장 큰 한 시간 ${(X.dayMax[i] * 100).toFixed(1)}% (${X.dayPeak[i]}–${X.dayPeak[i] + 1}시) · 하루 ${(X.dayShare[i] * 100).toFixed(1)}%`;
    ctx.font = `600 11.5px ${SANS}`;
    const bw = ctx.measureText(t).width + 18, bx = KF.clamp(p[0] - bw / 2, 6, w - bw - 6), by = p[1] - 44;
    ctx.fillStyle = "rgba(20,14,40,.95)"; ctx.fillRect(bx, by, bw, 24);
    ctx.strokeStyle = "rgba(255,201,77,.5)"; ctx.strokeRect(bx + 0.5, by + 0.5, bw, 24);
    ctx.fillStyle = LINE; ctx.textAlign = "left"; ctx.fillText(t, bx + 9, by + 16);
  }

  VIZ.solar = { thumb, mount, bg: BG };
})();
