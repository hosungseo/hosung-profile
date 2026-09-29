// 85 fiscal-gap — "천칭 저울". A brass balance scale: the left pan holds a region's self revenue (재정자립도),
// the right pan holds the extra that transfers (교부세·조정교부금 = 재정자주도 − 재정자립도) add on top. Default view
// is "지금" (2026, 개편 후 = the current official basis) for whichever region is picked. Touching the year slider
// switches into "장기 추세" mode — 전국만, 2001-2026, 2014년 개편 전 기준 — with its own clearly-labelled badge so
// its 2026 number (different from "지금") is never mistaken for the current one. A sorted strip of every 시군구
// (지금 기준) sits below; click to load a region into the scale. Whatever is left to 100 (매칭이 필요한 국고보조금 등)
// is shown as an unweighed pile beside the stand, never on a pan.
(() => {
  const BG = "#d8d2c2";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#2c261c", MUTE = "rgba(44,38,28,.62)", FAINT = "rgba(44,38,28,.16)";
  const BRASS = "#a9782f", BRASS_D = "#8a5f22", TEAL = "#2f6b64", TEAL_D = "#20504a", WOOD = "#5b4632", OTHER = "#8f8770";

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const byRegion = new Map();
    byRegion.set("전국", { name: "전국", kind: "nat", sr: d.current_t20.sr, auto: d.current_t20.auto });
    for (const s of d.sido) byRegion.set(s.name, { name: s.name, kind: "sido", sr: s.sr, auto: s.auto });
    const sgg = d.sgg.slice().sort((a, b) => a.sr - b.sr);
    return (DEC = { years: d.years, byRegion, sido: d.sido, sgg, yLatest: d.y_latest, current: d.current_t20, trendT10: d.national_trend_t10 });
  }

  // "지금" (개편 후, T20): whichever region is picked, always the current/latest figure.
  function currentValuesFor(X, region) {
    const hit = X.byRegion.get(region);
    if (hit) return { sr: hit.sr, auto: hit.auto };
    const g = X.sgg.find((r) => r.name === region);
    return g ? { sr: g.sr, auto: g.auto } : { sr: 0, auto: 0 };
  }
  // "장기 추세" (개편 전, T10): 전국만, any year 2001-2026 — a different series from currentValuesFor, on purpose.
  function trendValuesFor(X, y) {
    const r = X.trendT10.find((r) => r.y === y) || X.trendT10[X.trendT10.length - 1];
    return { sr: r.sr, auto: r.auto };
  }

  // ---------------------------------------------------------------- the scale
  function scale(ctx, cx, cyPivot, L, v, el, full) {
    const gap = Math.max(0, v.auto - v.sr);
    const theta = KF.clamp(((gap - v.sr) / 46) * (full ? 0.3 : 0.24), -0.3, 0.3) * KF.ease(el);
    const cosT = Math.cos(theta), sinT = Math.sin(theta);
    const leftEnd = [cx - L * cosT, cyPivot - L * sinT];
    const rightEnd = [cx + L * cosT, cyPivot + L * sinT];
    const stringLen = full ? 46 : 32;

    // stand: post + tripod base
    ctx.strokeStyle = WOOD; ctx.lineWidth = full ? 9 : 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx, cyPivot); ctx.lineTo(cx, cyPivot + L * (full ? 0.92 : 0.86)); ctx.stroke();
    ctx.lineWidth = full ? 6 : 4;
    const by = cyPivot + L * (full ? 0.92 : 0.86);
    ctx.beginPath(); ctx.moveTo(cx - L * 0.4, by + L * 0.22); ctx.lineTo(cx, by); ctx.lineTo(cx + L * 0.4, by + L * 0.22); ctx.stroke();
    ctx.fillStyle = BRASS_D; ctx.beginPath(); ctx.arc(cx, cyPivot, full ? 7 : 5, 0, 7); ctx.fill();

    // beam
    ctx.strokeStyle = BRASS; ctx.lineWidth = full ? 6 : 4.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(leftEnd[0], leftEnd[1]); ctx.lineTo(rightEnd[0], rightEnd[1]); ctx.stroke();
    for (const e of [leftEnd, rightEnd]) { ctx.fillStyle = BRASS_D; ctx.beginPath(); ctx.arc(e[0], e[1], full ? 4 : 3, 0, 7); ctx.fill(); }

    const pans = [
      { x: leftEnd[0], y: leftEnd[1] + stringLen, end: leftEnd, v: v.sr, col: BRASS, colD: BRASS_D, label: "자체수입(재정자립도)" },
      { x: rightEnd[0], y: rightEnd[1] + stringLen, end: rightEnd, v: gap, col: TEAL, colD: TEAL_D, label: "이전재원 자주분(자주도−자립도)" },
    ];
    const R = full ? 34 : 24, maxFill = R * 1.5;
    for (const p of pans) {
      ctx.strokeStyle = "rgba(44,38,28,.55)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x - R * 0.86, p.y - stringLen * 0.02); ctx.lineTo(p.end[0], p.end[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x + R * 0.86, p.y - stringLen * 0.02); ctx.lineTo(p.end[0], p.end[1]); ctx.stroke();
      // bowl
      ctx.fillStyle = "rgba(169,120,47,.16)"; ctx.strokeStyle = p.colD; ctx.lineWidth = full ? 2 : 1.5;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, R, R * 0.34, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
      // fill (weight) rising from the bowl floor
      const fh = KF.clamp(p.v / 65, 0, 1) * maxFill * KF.ease(el);
      ctx.save();
      const clip = new Path2D(); clip.ellipse(p.x, p.y, R, R * 0.34, 0, 0, Math.PI); clip.lineTo(p.x - R, p.y + maxFill + 20); clip.lineTo(p.x + R, p.y + maxFill + 20); clip.closePath();
      ctx.clip(clip);
      ctx.fillStyle = p.col; ctx.fillRect(p.x - R, p.y - fh, R * 2, fh + 30);
      ctx.strokeStyle = p.colD; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p.x - R, p.y - fh); ctx.lineTo(p.x + R, p.y - fh); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = p.colD; ctx.lineWidth = full ? 2 : 1.5;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, R, R * 0.34, 0, Math.PI, 0, true); ctx.stroke();
    }
    return { pans, leftEnd, rightEnd, remainder: Math.max(0, 100 - v.auto) };
  }

  function pile(ctx, x, y, r, val, full) {
    ctx.fillStyle = OTHER; ctx.strokeStyle = "rgba(44,38,28,.4)"; ctx.lineWidth = 1;
    const n = Math.max(1, Math.round(val / 8));
    for (let i = 0; i < Math.min(n, 9); i++) {
      const a = (i / 9) * Math.PI * 2, rr = r * (0.3 + 0.25 * (i % 3));
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * rr * 0.5, y - i * (full ? 3.2 : 2.4), r * 0.5, r * 0.22, 0, 0, 7); ctx.fill(); ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- sorted 시군구 strip
  function strip(ctx, x0, y0, w, h, X, selected, hoverX) {
    const n = X.sgg.length, bw = w / n;
    let hit = null;
    for (let i = 0; i < n; i++) {
      const r = X.sgg[i], x = x0 + i * bw;
      const hsr = (r.sr / 90) * h, hauto = (r.auto / 90) * h;
      const on = r.name === selected;
      ctx.fillStyle = on ? TEAL : "rgba(169,120,47,.30)"; ctx.fillRect(x, y0 + h - hauto, Math.max(1, bw - 0.3), hauto);
      ctx.fillStyle = on ? TEAL_D : BRASS; ctx.fillRect(x, y0 + h - hsr, Math.max(1, bw - 0.3), hsr);
      if (hoverX != null && hoverX >= x && hoverX < x + bw) hit = r;
    }
    ctx.strokeStyle = FAINT; ctx.beginPath(); ctx.moveTo(x0, y0 + h + 0.5); ctx.lineTo(x0 + w, y0 + h + 0.5); ctx.stroke();
    return hit;
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const X = decode(d), c = t % 9;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const el = KF.clamp((c - 0.3) / 1.1, 0, 1);
    const v = X.current;
    scale(ctx, w * 0.42, h * 0.32, Math.min(w, h) * 0.3, v, el, false);
    const a = KF.clamp((c - 1.4) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    // card badge sits top-left (~90x36px) and the glyph badge bottom-left (~50x50px) — keep clear of both:
    // the caption starts well below the badge, the stat lines start well right of the glyph.
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText(`전국 · ${v.y}년 지금`, w * 0.05, h * 0.26);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.075)}px ${SANS}`;
    ctx.fillText(`자립도 ${v.sr.toFixed(0)}%`, w * 0.19, h * 0.8);
    ctx.fillStyle = TEAL_D;
    ctx.fillText(`자주도 ${v.auto.toFixed(0)}%`, w * 0.19, h * 0.91);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage);
    // mode: "current" (지금, 개편 후 T20, any region) | "trend" (장기 추세, 개편 전 T10, 전국만).
    let region = "전국", mode = "current", year = X.yLatest, t0 = performance.now(), hover = null, stripBox = null, playing = false, playT = 0;

    const row = document.createElement("div");
    row.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;align-items:center;width:100%";
    controls.appendChild(row);
    const sel = document.createElement("select");
    sel.style.cssText = "font:inherit;font-size:12px;padding:7px;background:#efe9dc;color:#2c261c;border:1px solid #a9782f;border-radius:4px";
    for (const name of ["전국", ...X.sido.map((r) => r.name)]) { const o = document.createElement("option"); o.value = name; o.textContent = name; sel.appendChild(o); }
    sel.addEventListener("change", () => { region = sel.value; mode = "current"; t0 = performance.now(); render(); });
    row.appendChild(sel);
    const trendLab = document.createElement("span"); trendLab.className = "readout"; trendLab.textContent = "장기 추세(2014년 개편 전 기준) →"; row.appendChild(trendLab);
    const yLab = document.createElement("span"); yLab.className = "readout"; yLab.textContent = `${year}년`; row.appendChild(yLab);
    const range = document.createElement("input");
    range.type = "range"; range.min = String(X.years[0]); range.max = String(X.years[X.years.length - 1]); range.value = String(year); range.step = "1";
    range.style.cssText = "width:130px"; row.appendChild(range);
    range.addEventListener("input", () => { year = +range.value; mode = "trend"; region = "전국"; sel.value = "전국"; playing = false; yLab.textContent = `${year}년`; t0 = performance.now(); render(); });
    const playBtn = document.createElement("button"); playBtn.type = "button"; playBtn.textContent = "추세 재생 ▶";
    playBtn.addEventListener("click", () => {
      playing = !playing; playBtn.textContent = playing ? "정지 ■" : "추세 재생 ▶";
      if (playing) { mode = "trend"; region = "전국"; sel.value = "전국"; playT = performance.now(); }
    });
    row.appendChild(playBtn);
    const live = document.createElement("span"); live.setAttribute("aria-live", "polite");
    live.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)"; row.appendChild(live);

    function render() {
      const v = mode === "trend" ? trendValuesFor(X, year) : currentValuesFor(X, region);
      const basis = mode === "trend" ? `${year}년, 2014년 개편 전 기준` : `${X.yLatest}년, 지금(개편 후) 기준`;
      live.textContent = `${region}, ${basis}: 재정자립도 ${v.sr.toFixed(1)}%, 재정자주도 ${v.auto.toFixed(1)}%`;
    }
    render();

    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => {
      const r = stage.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
      if (stripBox && y >= stripBox.y0 - 6 && y <= stripBox.y0 + stripBox.h + 6) {
        const i = Math.floor(((x - stripBox.x0) / stripBox.w) * X.sgg.length);
        if (i >= 0 && i < X.sgg.length) { region = X.sgg[i].name; mode = "current"; sel.value = X.sido.some((sd) => sd.name === region) ? region : "전국"; t0 = performance.now(); render(); }
      }
    });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now();
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      if (playing) {
        const step = Math.floor((now - playT) / 550);
        const idx = step % X.years.length;
        if (X.years[idx] !== year) { year = X.years[idx]; range.value = String(year); yLab.textContent = `${year}년`; }
      }
      const el = KF.clamp((now - t0) / 900, 0, 1);
      const trend = mode === "trend";
      const shownYear = trend ? year : X.yLatest;
      const v = trend ? trendValuesFor(X, year) : currentValuesFor(X, region);

      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
      ctx.fillText(`${region} · ${shownYear}년${trend ? " (개편 전 기준)" : " · 지금"}`, full ? 20 : 12, full ? 32 : 22);
      ctx.fillStyle = trend ? "#b5482f" : MUTE; ctx.font = `600 ${full ? 11.5 : 9.5}px ${SANS}`;
      ctx.fillText(trend ? "2014년 세입과목 개편 전 계산 방식 — 위 '지금' 수치와 다른 계열이니 비교하지 마세요" : "왼쪽 접시 = 자체수입 · 오른쪽 접시 = 교부세 등 이전재원(자주분)", full ? 20 : 12, full ? 52 : 36);

      const cy = full ? h * 0.16 : h * 0.1, cx = full ? w * 0.27 : w * 0.5, L = Math.min(w * 0.22, h * 0.34);
      const geo = scale(ctx, cx, cy + L * 0.5, L, v, KF.reduced ? 1 : el, full);
      if (geo.remainder > 0.5) {
        pile(ctx, cx + L * (full ? 1.35 : 0), cy + L * (full ? 0.9 : 1.7), full ? 16 : 11, geo.remainder, full);
        ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 10.5 : 9}px ${SANS}`; ctx.textAlign = "center";
        ctx.fillText(`나머지 ${geo.remainder.toFixed(0)}%`, cx + L * (full ? 1.35 : 0), cy + L * (full ? 0.9 : 1.7) + (full ? 34 : 24));
        ctx.fillText("(용도 정해진 보조금 등)", cx + L * (full ? 1.35 : 0), cy + L * (full ? 0.9 : 1.7) + (full ? 48 : 36));
      }

      const readX = full ? cx + L * 1.7 : 14, readY = full ? cy - L * 0.2 : cy + L * 1.35;
      ctx.textAlign = "left";
      ctx.fillStyle = BRASS_D; ctx.font = `700 ${full ? 30 : 20}px ${SANS}`;
      ctx.fillText(`${v.sr.toFixed(1)}%`, readX, readY);
      ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`; ctx.fillText("재정자립도", readX, readY + (full ? 18 : 14));
      ctx.fillStyle = TEAL_D; ctx.font = `700 ${full ? 30 : 20}px ${SANS}`;
      ctx.fillText(`${v.auto.toFixed(1)}%`, readX, readY + (full ? 56 : 42));
      ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`; ctx.fillText("재정자주도", readX, readY + (full ? 74 : 56));

      const sy0 = full ? h * 0.66 : h * 0.6, sh = full ? h * 0.24 : h * 0.22, sx0 = full ? 20 : 10, sw = w - sx0 * 2;
      ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 11.5 : 9.5}px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(`시군구 ${X.sgg.length}곳 · 자립도 낮은 곳 → 높은 곳 (진한 색 = 자립도, 옅은 색 = 자주도) · 눌러서 보기`, sx0, sy0 - 8);
      stripBox = { x0: sx0, y0: sy0, w: sw, h: sh };
      const hoverX = hover && hover[1] >= sy0 - 10 && hover[1] <= sy0 + sh + 10 ? hover[0] : null;
      const hit = strip(ctx, sx0, sy0, sw, sh, X, region, hoverX);
      if (hit && hover) {
        ctx.textAlign = "left";
        const lines = [[`${hit.sido} ${hit.name}`, 1], [`자립도 ${hit.sr.toFixed(1)}% · 자주도 ${hit.auto.toFixed(1)}%`, 0], [`차이 ${(hit.auto - hit.sr).toFixed(1)}%p (${X.yLatest}년)`, 2]];
        const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : k === 2 ? `500 10.5px ${MONO}` : `500 11.5px ${SANS}`);
        const bw = Math.max(...lines.map(([tt, k]) => { ctx.font = fontOf(k); return ctx.measureText(tt).width; })) + 22;
        const bh = 12 + lines.length * 18;
        const bx = KF.clamp(hover[0] + 14 + bw > w - 6 ? hover[0] - bw - 12 : hover[0] + 14, 6, w - bw - 6), by = KF.clamp(hover[1] - bh - 10, 6, h - bh - 6);
        ctx.fillStyle = "rgba(44,38,28,.95)"; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "#efe9dc"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
        lines.forEach(([tt, k], j) => { ctx.fillStyle = k === 2 ? "rgba(239,233,220,.75)" : k === 1 ? "#e8c98a" : "#efe9dc"; ctx.font = fontOf(k); ctx.fillText(tt, bx + 11, by + 20 + j * 18); });
      }
    });
  }

  VIZ["fiscal-gap"] = { thumb, mount, bg: BG };
})();
