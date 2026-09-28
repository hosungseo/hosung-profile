// 33 housing-permits — "크레인과 골조". A building site seen from the street: one building per 시도. The scaffold
// frame stands at the usual level (2017–2022 average of HUG pre-sale guarantees, Jan–Aug), the poured floors are the
// chosen year's pre-sales, and a tower crane works on top of the poured part. Missing floors stay as bare scaffold
// under green netting; floors above the usual level are amber. Second view: the construction schedule board
// (공정표) of every project in two sample areas from the housing-permit API — approval, start and completion.
(() => {
  const BG = "#c9d2d6";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#1f262a", INK2 = "rgba(31,38,42,.66)", CONC = "#8e979b", CONC_D = "#6c7579", WIN = "rgba(33,43,49,.5)";
  const EXTRA = "#e0a33b", EXTRA_D = "#b07a22", NET = "rgba(46,125,88,.2)", POLE = "rgba(40,52,58,.62)";
  const CRANE = "#f2b705", CRANE_D = "#3a3632", GROUND = "#6f665a", FENCE = "#f3f1eb", NAVY = "#23466b";
  const AREA_COL = ["#2c6e9b", "#c4552d"];                      // 세종 동 지역, 서울 강남구

  // ------------------------------------------------------------------ data helpers
  function prep(d) {
    if (d._p) return d._p;
    const R = d.regions.length, Y = d.years.length, ri = d.years.map((_, i) => i).slice(6);
    // slot index Y = the 2023–2025 average (what the text compares)
    const val = d.ja.map((row) => [...row, ri.reduce((a, i) => a + row[i], 0) / ri.length]);
    const nat = [...d.nat, ri.reduce((a, i) => a + d.nat[i], 0) / ri.length];
    const cap = [...d.cap, ri.reduce((a, i) => a + d.cap[i], 0) / ri.length];
    const labels = [...d.years.map(String), `${d.years[6]}–${String(d.years[Y - 1]).slice(2)} 평균`];
    let maxAbs = 0;
    d.base.forEach((b, r) => { maxAbs = Math.max(maxAbs, b, ...val[r]); });
    return (d._p = { R, Y, val, nat, cap, labels, maxAbs });
  }

  // ------------------------------------------------------------------ layout
  function layout(w, h, mode, R) {
    const full = mode === "full", thumb = mode === "thumb";
    const panel = full ? 286 : 0;
    const left = full ? 18 : thumb ? 10 : 8, right = w - panel - (full ? 30 : thumb ? w * 0.43 : 8);
    const ground = full ? h - 92 : thumb ? h - 34 : Math.round(h * 0.62);
    const top = full ? 34 : thumb ? 14 : 30;
    const pitch = (right - left) / R, bw = pitch * (full ? 0.74 : 0.72);
    return { full, thumb, mode, panel, left, right, ground, top, pitch, bw, cx: (i) => left + pitch * (i + 0.5) };
  }

  // one building: frame (usual level) + poured floors (value). floors in "floor units"; fh = px per floor
  function building(ctx, x, ground, bw, fh, frame, fill, grow, detail) {
    const fTop = ground - frame * fh * grow;
    // scaffold frame under green netting where it is not poured
    const pour = Math.min(fill, frame);
    if (frame > pour) {
      const y0 = ground - frame * fh * grow, y1 = ground - pour * fh;
      ctx.fillStyle = NET; ctx.fillRect(x - 2, y0, bw + 4, Math.max(0, y1 - y0));
      ctx.strokeStyle = POLE; ctx.lineWidth = 1;
      const cols = bw > 22 ? 4 : 3;
      for (let c = 0; c < cols; c++) { const xx = x + (bw * c) / (cols - 1); ctx.beginPath(); ctx.moveTo(xx + 0.5, y1); ctx.lineTo(xx + 0.5, y0); ctx.stroke(); }
      const step = fh >= 5 ? 1 : fh >= 2.5 ? 2 : 5;
      ctx.strokeStyle = "rgba(40,52,58,.35)";
      for (let k = Math.ceil(pour / step) * step; k <= frame + 1e-6; k += step) {
        const yy = ground - k * fh * grow; if (yy < y0 - 0.5) break;
        ctx.beginPath(); ctx.moveTo(x - 2, yy + 0.5); ctx.lineTo(x + bw + 2, yy + 0.5); ctx.stroke();
      }
      if (detail && y1 - y0 > 14) { // cross bracing on the scaffold face
        ctx.strokeStyle = "rgba(40,52,58,.22)"; ctx.beginPath();
        for (let yy = y1; yy > y0 + 6; yy -= Math.max(12, fh * 4)) { ctx.moveTo(x, yy); ctx.lineTo(x + bw, Math.max(y0, yy - Math.max(12, fh * 4))); }
        ctx.stroke();
      }
    }
    // poured floors: concrete up to the usual level, amber above it
    if (fill > 0) {
      const yTop = ground - fill * fh;
      const yFrame = ground - frame * fh;
      ctx.fillStyle = CONC; ctx.fillRect(x, Math.max(yTop, yFrame), bw, ground - Math.max(yTop, yFrame));
      if (fill > frame) { ctx.fillStyle = EXTRA; ctx.fillRect(x, yTop, bw, yFrame - yTop); }
      if (detail && fh >= 4) { // slab lines and a row of windows per floor
        for (let k = 0; k < Math.floor(fill); k++) {
          const yy = ground - (k + 1) * fh, above = k >= frame;
          ctx.fillStyle = above ? EXTRA_D : CONC_D; ctx.fillRect(x, yy, bw, 1);
          if (fh >= 6) { ctx.fillStyle = WIN; const n = Math.max(2, Math.floor(bw / 7)); for (let j = 0; j < n; j++) ctx.fillRect(x + 2 + (j * (bw - 4)) / n, yy + 2.5, (bw - 4) / n - 2, fh - 4.5); }
        }
      } else {
        ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(x + bw - 2, yTop, 2, ground - yTop);
      }
    }
    return fTop;
  }

  function crane(ctx, x, y, s, swing) { // tower crane standing on the roof at (x, y); s = scale
    const mh = 34 * s, jr = 30 * s, jl = 11 * s;
    ctx.strokeStyle = CRANE_D; ctx.lineWidth = Math.max(0.6, 0.8 * s);
    ctx.fillStyle = CRANE;
    ctx.fillRect(x - 1.5 * s, y - mh, 3 * s, mh);                                     // mast
    ctx.beginPath();
    for (let k = 0; k < mh - 2; k += 5 * s) { ctx.moveTo(x - 1.5 * s, y - k); ctx.lineTo(x + 1.5 * s, y - k - 5 * s); }
    ctx.stroke();
    const jy = y - mh;
    ctx.fillRect(x - jl, jy - 2 * s, jl + jr, 2.2 * s);                                // jib + counter-jib
    ctx.fillStyle = CRANE_D; ctx.fillRect(x - jl, jy - 4.5 * s, 5 * s, 4.6 * s);       // counterweight
    ctx.beginPath(); ctx.moveTo(x, jy - 7 * s); ctx.lineTo(x + jr, jy - 1.5 * s); ctx.moveTo(x, jy - 7 * s); ctx.lineTo(x - jl, jy - 1.5 * s); ctx.stroke();
    ctx.fillStyle = CRANE; ctx.fillRect(x - 1 * s, jy - 7 * s, 2 * s, 5 * s);             // tower top
    const tx = x + jr * (0.45 + 0.4 * swing), hook = 8 * s + 10 * s * (1 - swing);
    ctx.strokeStyle = "rgba(40,40,40,.7)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(tx, jy); ctx.lineTo(tx, jy + hook); ctx.stroke();
    ctx.fillStyle = "#6c7579"; ctx.fillRect(tx - 3 * s, jy + hook, 6 * s, 2.5 * s);        // a bundle of rebar on the hook
  }

  function scene(ctx, w, h, L) {
    const g = ctx.createLinearGradient(0, 0, 0, L.ground);
    g.addColorStop(0, "#bcc7cc"); g.addColorStop(1, "#e2e6e5");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, L.ground);
    // far city: low grey blocks on the horizon
    ctx.fillStyle = "rgba(92,108,116,.16)";
    let s = 11; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    for (let x = 0; x < w; ) { const bw = 14 + r() * 30, bh = 12 + r() * (L.full ? 60 : 30); ctx.fillRect(x, L.ground - bh, bw, bh); x += bw + 2 + r() * 8; }
    ctx.fillStyle = GROUND; ctx.fillRect(0, L.ground, w, h - L.ground);
    ctx.fillStyle = "rgba(0,0,0,.08)";
    for (let k = 0; k < 90; k++) ctx.fillRect(r() * w, L.ground + 20 + r() * (h - L.ground - 20), 2 + r() * 5, 1);
  }

  function fence(ctx, L, d, hover) { // hoarding panels under the buildings, one per 시도
    const fh = L.full ? 22 : L.thumb ? 0 : 17, y = L.ground;
    if (!fh) return;
    ctx.fillStyle = FENCE; ctx.fillRect(L.left - 4, y, L.right - L.left + 8, fh);
    ctx.fillStyle = NAVY; ctx.fillRect(L.left - 4, y, L.right - L.left + 8, 3);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    d.regions.forEach((s, i) => {
      const x = L.cx(i), cap = d.capital.includes(s);
      if (i) { ctx.fillStyle = "rgba(31,38,42,.14)"; ctx.fillRect(L.left + L.pitch * i - 0.5, y + 3, 1, fh - 3); }
      ctx.fillStyle = hover === i ? "#000" : cap ? NAVY : INK;
      ctx.font = `${cap || hover === i ? 700 : 600} ${L.full ? 12 : 9.5}px ${SANS}`;
      ctx.fillText(s, x, y + fh / 2 + 1.5);
    });
    ctx.textBaseline = "alphabetic";
  }

  // ------------------------------------------------------------------ site board (desktop)
  function board(ctx, w, h, d, P, yi, rel, a) {
    const x0 = w - 272, y0 = 16, bw = 258, bh = h - 32, px = x0 + 16, pr = x0 + bw - 16;
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(x0 + 4, y0 + 5, bw, bh);
    ctx.fillStyle = "#fbfaf6"; ctx.fillRect(x0, y0, bw, bh);
    ctx.fillStyle = NAVY; ctx.fillRect(x0, y0, bw, 30);
    ctx.fillStyle = "#fff"; ctx.font = `700 13px ${SANS}`; ctx.textAlign = "left"; ctx.fillText("아파트 분양 현황판", px, y0 + 20);
    ctx.font = `500 10px ${MONO}`; ctx.textAlign = "right"; ctx.fillText("HUG 분양보증", pr, y0 + 20);
    const lab = P.labels[yi], nat = P.nat[yi], pct = (nat / d.natBase) * 100;
    ctx.textAlign = "left"; ctx.fillStyle = INK2; ctx.font = `500 11px ${SANS}`;
    ctx.fillText(`${lab}${yi < P.Y ? "년" : ""} · 1–${d.mLast}월 누계`, px, y0 + 52);
    ctx.fillStyle = INK; ctx.font = `700 26px ${MONO}`; ctx.fillText(`${KF.fmt(nat)}`, px, y0 + 82);
    const tw = ctx.measureText(KF.fmt(nat)).width;
    ctx.font = `600 13px ${SANS}`; ctx.fillText("세대", px + tw + 5, y0 + 82);
    ctx.fillStyle = pct < 100 ? "#8a2d12" : "#1d5a3a"; ctx.font = `600 12px ${SANS}`;
    ctx.fillText(`평소(${d.years[0]}–${String(d.years[5]).slice(2)} 평균)의 ${pct.toFixed(0)}%`, px, y0 + 102);
    // bars: national Jan–Aug per year, capital (dark) + rest (light), average line
    const bx0 = px, bx1 = pr, by1 = y0 + 196, bhMax = 74, n = d.years.length, bwid = (bx1 - bx0) / n;
    const mx = Math.max(...d.nat);
    d.years.forEach((yr, i) => {
      const x = bx0 + i * bwid + bwid * 0.18, ww = bwid * 0.64, hAll = (d.nat[i] / mx) * bhMax, hCap = (d.cap[i] / mx) * bhMax;
      const on = i === yi || (yi === P.Y && i >= 6);
      ctx.fillStyle = on ? "#b9c4c9" : "#dde3e5"; ctx.fillRect(x, by1 - hAll, ww, hAll - hCap);
      ctx.fillStyle = on ? NAVY : "#9fb0bf"; ctx.fillRect(x, by1 - hCap, ww, hCap);
      ctx.fillStyle = on ? INK : INK2; ctx.font = `${on ? 700 : 500} 9.5px ${MONO}`; ctx.textAlign = "center";
      ctx.fillText(`'${String(yr).slice(2)}`, x + ww / 2, by1 + 12);
    });
    const ay = by1 - (d.natBase / mx) * bhMax;
    ctx.strokeStyle = "#8a2d12"; ctx.setLineDash([3, 2]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx0, ay + 0.5); ctx.lineTo(bx1, ay + 0.5); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#8a2d12"; ctx.font = `500 9.5px ${SANS}`; ctx.textAlign = "right"; ctx.fillText("평소", bx1, ay - 3);
    ctx.textAlign = "left"; ctx.fillStyle = NAVY; ctx.fillRect(px, by1 + 20, 9, 7); ctx.fillStyle = INK2; ctx.font = `500 10px ${SANS}`; ctx.fillText("수도권", px + 13, by1 + 27);
    ctx.fillStyle = "#b9c4c9"; ctx.fillRect(px + 58, by1 + 20, 9, 7); ctx.fillStyle = INK2; ctx.fillText("지방 · 막대 = 1–8월 세대수", px + 71, by1 + 27);
    // legend of the building
    let y = by1 + 52;
    const sw = (col, t, yy, hatch) => { ctx.fillStyle = col; ctx.fillRect(px, yy - 8, 14, 10); if (hatch) { ctx.strokeStyle = POLE; ctx.strokeRect(px + 0.5, yy - 7.5, 13, 9); } ctx.fillStyle = INK; ctx.font = `500 11px ${SANS}`; ctx.fillText(t, px + 20, yy + 1); };
    sw(CONC, rel ? "부은 층 = 그해 분양 (1층 = 평소의 10%)" : "부은 층 = 그해 분양 (1층 = 1,000세대)", y); y += 17;
    sw(NET, "그물 친 골조 = 평소만큼 못 채운 층", y, true); y += 17;
    sw(EXTRA, "주황 층 = 평소보다 많이 분양한 층", y); y += 26;
    // pipeline from the API sample
    ctx.fillStyle = INK; ctx.font = `700 11.5px ${SANS}`; ctx.fillText("사업승인 → 입주, 표본 두 곳 (중간값)", px, y); y += 8;
    const mxm = 60;
    d.lag.forEach(([as, su, au, q1, q3, done], k) => {
      const yy = y + 10 + k * 30, X = (m) => px + 70 + ((pr - px - 70) * m) / mxm;
      ctx.fillStyle = INK2; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(d.areas[k], px, yy + 8);
      ctx.strokeStyle = AREA_COL[k]; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(q1), yy + 5); ctx.lineTo(X(q3), yy + 5); ctx.stroke();
      ctx.fillStyle = AREA_COL[k]; ctx.fillRect(X(0), yy + 2, X(au) - X(0), 6);
      ctx.fillStyle = INK; ctx.font = `600 10.5px ${MONO}`; ctx.fillText(`${Math.round(au)}개월`, Math.min(X(Math.max(au, q3)) + 5, pr - 38), yy + 8);
      ctx.fillStyle = INK2; ctx.font = `500 9px ${SANS}`; ctx.fillText(`착공까지 ${as.toFixed(0)} + 공사 ${su.toFixed(0)}개월 · ${done}곳`, px + 70, yy + 20);
    });
    y += 84;
    const M = d.movein;
    ctx.fillStyle = INK; ctx.font = `700 11.5px ${SANS}`; ctx.fillText(`입주 예정 ${M.months[0].replace("-", ".")}–${M.months[M.months.length - 1].replace("-", ".")}`, px, y);
    ctx.font = `700 16px ${MONO}`; ctx.fillText(`${KF.fmt(M.total)}세대`, px, y + 22);
    const capM = d.capital.reduce((s, c) => s + M.reg[d.regions.indexOf(c)], 0);
    ctx.fillStyle = INK2; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(`수도권 ${((capM / M.total) * 100).toFixed(0)}% · 한국부동산원`, px + 122, y + 21);
    // month by month: already scheduled completions
    const my1 = Math.min(y0 + bh - 26, y + 92), mh = Math.max(20, my1 - (y + 38)), mw = (pr - px) / M.units.length, mm = Math.max(...M.units);
    M.units.forEach((v, i) => {
      const hh = (v / mm) * mh;
      ctx.fillStyle = M.months[i].endsWith("-01") ? "#6c7579" : "#a9b3b7"; ctx.fillRect(px + i * mw + 1, my1 - hh, mw - 2, hh);
    });
    ctx.fillStyle = INK2; ctx.font = `500 9.5px ${MONO}`; ctx.textAlign = "left";
    ctx.fillText(M.months[0].replace("-", "."), px, my1 + 12);
    ctx.textAlign = "right"; ctx.fillText(M.months[M.units.length - 1].replace("-", "."), pr, my1 + 12);
    ctx.textAlign = "center"; ctx.fillText(`월별 · 가장 많은 달 ${KF.fmt(mm)}`, (px + pr) / 2, my1 + 12);
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ schedule board (공정표): API sample
  function schedule(ctx, w, h, d, prog, hover, full) {
    const x0 = full ? 64 : 44, x1 = w - (full ? 210 : 14), t0 = d.t0, t1 = 2027.5;
    const X = (t) => x0 + ((x1 - x0) * (t - t0)) / (t1 - t0);
    ctx.fillStyle = "#f7f6f1"; ctx.fillRect(0, 0, w, h);
    const rows = [d.sample.filter((p) => p[0] === 0), d.sample.filter((p) => p[0] === 1)];
    const topY = full ? 48 : 40, gap = full ? 34 : 30, bottomY = h - (full ? 34 : 118);
    const rowH = Math.min(3, (bottomY - topY - gap) / (rows[0].length + rows[1].length));
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 14 : 12.5}px ${SANS}`;
    ctx.fillText("공정표 · 사업승인 → 착공 → 사용검사(입주)", full ? 16 : 10, full ? 26 : 22);
    // year grid
    ctx.font = `500 ${full ? 10 : 8.5}px ${MONO}`; ctx.textAlign = "center";
    for (let t = t0; t <= 2027; t++) {
      const x = X(t); ctx.strokeStyle = t % 5 ? "rgba(31,38,42,.07)" : "rgba(31,38,42,.18)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 0.5, topY - 6); ctx.lineTo(x + 0.5, bottomY + 4); ctx.stroke();
      if (full ? t % 2 === 1 : t % 5 === 0) { ctx.fillStyle = INK2; ctx.fillText(String(t), x, bottomY + 16); }
    }
    const nowX = X(d.now);
    ctx.strokeStyle = "#8a2d12"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(nowX + 0.5, topY - 8); ctx.lineTo(nowX + 0.5, bottomY + 4); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#8a2d12"; ctx.font = `600 ${full ? 10 : 9}px ${SANS}`; ctx.fillText("지금", nowX, topY - 11);
    let y = topY, hit = null;
    const tmax = t0 + (t1 - t0) * prog;
    rows.forEach((list, k) => {
      ctx.textAlign = "right"; ctx.fillStyle = AREA_COL[k]; ctx.font = `700 ${full ? 11 : 9.5}px ${SANS}`;
      const midY = y + (list.length * rowH) / 2;
      d.areas[k].split(" ").forEach((part, j, arr) => ctx.fillText(part, x0 - 8, midY + (j - (arr.length - 1) / 2) * 13 + 4));
      list.forEach((p, i) => {
        const [, ap, st, us, n] = p, yy = y + i * rowH;
        if (ap > tmax) return;
        const end = us || d.now, waitEnd = st || us || d.now;
        // thin line: approval until start (or until completion when the start date is missing); faint when neither is on record
        ctx.fillStyle = st || us ? "rgba(31,38,42,.35)" : "rgba(31,38,42,.13)";
        ctx.fillRect(X(ap), yy + rowH * 0.4, Math.max(0.5, X(Math.min(waitEnd, tmax)) - X(ap)), Math.max(0.6, rowH * 0.25));
        if (st && st <= tmax) {
          ctx.fillStyle = AREA_COL[k]; ctx.globalAlpha = us ? 0.9 : 0.45;
          ctx.fillRect(X(st), yy, Math.max(1, X(Math.min(end, tmax)) - X(st)), Math.max(1, rowH - 0.6)); ctx.globalAlpha = 1;
        } else if (us && us <= tmax) { ctx.fillStyle = AREA_COL[k]; ctx.fillRect(X(us) - 1, yy, 2, Math.max(1, rowH - 0.6)); }
        if (hover && hover[1] >= yy - 1 && hover[1] < yy + rowH + 0.5 && hover[0] > x0 - 2 && hover[0] < x1) hit = { p, k, yy };
      });
      y += list.length * rowH + gap;
    });
    if (full) { // side notes: medians
      const sx = w - 190;
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 12px ${SANS}`; ctx.fillText("중간값 (다 지은 사업)", sx, 70);
      d.lag.forEach(([as, su, au, q1, q3, done, n], k) => {
        const yy = 96 + k * 108;
        ctx.fillStyle = AREA_COL[k]; ctx.fillRect(sx, yy - 9, 10, 10);
        ctx.fillStyle = INK; ctx.font = `700 12px ${SANS}`; ctx.fillText(d.areas[k], sx + 16, yy);
        ctx.font = `500 11px ${SANS}`; ctx.fillStyle = INK2;
        [[`승인 → 착공`, `${as.toFixed(1)}개월`], [`착공 → 입주`, `${su.toFixed(1)}개월`], [`승인 → 입주`, `${au.toFixed(1)}개월`], [`가운데 절반`, `${q1.toFixed(0)}–${q3.toFixed(0)}개월`], [`30세대 이상 사업`, `${n}건 (다 지은 ${done})`]].forEach(([a, b], j) => {
          ctx.fillStyle = INK2; ctx.fillText(a, sx, yy + 20 + j * 16); ctx.fillStyle = INK; ctx.textAlign = "right"; ctx.fillText(b, w - 16, yy + 20 + j * 16); ctx.textAlign = "left";
        });
      });
      ctx.fillStyle = INK2; ctx.font = `500 10px ${SANS}`;
      ["가는 선 = 승인 뒤 착공 전 (흐리면 착공·준공 기록 없음)", "굵은 막대 = 공사 (옅으면 아직 공사 중)", "줄 하나 = 30세대 이상 사업 하나 (승인 순)"].forEach((t, j) => ctx.fillText(t, sx, h - 70 + j * 15));
    } else {
      ctx.textAlign = "left"; ctx.font = `500 11px ${SANS}`;
      d.lag.forEach(([as, su, au, q1, q3, done], k) => {
        const yy = h - 92 + k * 36;
        ctx.fillStyle = AREA_COL[k]; ctx.fillRect(12, yy - 9, 9, 9);
        ctx.fillStyle = INK; ctx.font = `700 12px ${SANS}`; ctx.fillText(`${d.areas[k]} · 승인 → 입주 ${Math.round(au)}개월`, 26, yy);
        ctx.fillStyle = INK2; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(`착공까지 ${as.toFixed(0)}개월 + 공사 ${su.toFixed(0)}개월 · 가운데 절반 ${q1.toFixed(0)}–${q3.toFixed(0)}개월`, 26, yy + 16);
      });
    }
    return hit;
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `600 12.5px ${SANS}`;
    let bw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${SANS}`;
    lines.slice(1).forEach((l) => { bw = Math.max(bw, ctx.measureText(l).width); });
    bw += 22;
    const bh = 12 + lines.length * 17, bx = KF.clamp(x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 12, 6, h - bh - 6);
    ctx.fillStyle = "rgba(255,255,253,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = CRANE; ctx.fillRect(bx, by, 3, bh);
    lines.forEach((l, i) => { ctx.fillStyle = i ? INK : "#000"; ctx.font = i ? `500 11px ${SANS}` : `600 12.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(l, bx + 11, by + 18 + i * 17); });
  }

  const ym = (t) => { const y = Math.floor(t), m = Math.min(12, Math.floor((t - y) * 12) + 1); return `${y}.${String(m).padStart(2, "0")}`; };

  // the skyline for slot yi; cur = animated floors per building
  function skyline(ctx, w, h, d, P, L, rel, cur, grow, t, hover, labelsA) {
    const R = P.R, fh = rel ? (L.ground - L.top - (L.thumb ? 26 : 44)) / 25 : (L.ground - L.top - (L.thumb ? 26 : 44)) / (P.maxAbs / 1000);
    const cs = L.full ? 0.9 : L.thumb ? 0.45 : 0.5;
    for (let i = 0; i < R; i++) {
      const frame = rel ? 10 : d.base[i] / 1000, fill = cur[i], x = L.cx(i) - L.bw / 2;
      const shown = Math.min(fill, rel ? 25 : 1e9);
      const fTop = building(ctx, x, L.ground, L.bw, fh, frame, shown, grow, L.full);
      if (shown > 0.05 && grow >= 1) crane(ctx, x + L.bw * 0.35, L.ground - shown * fh, cs, 0.5 + 0.5 * Math.sin(t * 0.9 + i * 1.7));
      if (rel && fill > 25) { ctx.fillStyle = EXTRA_D; ctx.font = `700 ${L.full ? 11 : 9}px ${MONO}`; ctx.textAlign = "center"; ctx.fillText("▲", x + L.bw / 2, L.ground - 25 * fh - 3); }
      if (labelsA > 0 && (L.full || hover === i)) {
        const topY = Math.min(fTop, L.ground - shown * fh - (shown > 0.05 ? 40 * cs : 0)) - 6;
        const pct = Math.round((P.val[i][P.slot] / d.base[i]) * 100);
        ctx.globalAlpha = labelsA; ctx.fillStyle = hover === i ? "#000" : INK; ctx.font = `600 ${L.full ? 10.5 : 9}px ${MONO}`; ctx.textAlign = "center";
        ctx.fillText(`${pct}%`, L.cx(i), Math.max(12, topY)); ctx.globalAlpha = 1;
      }
    }
    return fh;
  }

  // ------------------------------------------------------------------ thumb
  function thumb(ctx, w, h, t, d) {
    const P = prep(d), L = layout(w, h, "thumb", P.R), c = t % 10, slot = P.Y;
    scene(ctx, w, h, L);
    const grow = KF.clamp(c / 1.0, 0, 1), fillP = KF.ease(KF.clamp((c - 1.0) / 1.6, 0, 1));
    const cur = P.val.map((row, i) => (row[slot] / d.base[i]) * 10 * fillP);
    P.slot = slot;
    skyline(ctx, w, h, d, P, L, true, cur, grow, c, null, 0);
    const X = w - 12, a = KF.clamp((c - 2.2) / 0.6, 0, 1), drop = Math.round((1 - P.nat[slot] / d.natBase) * 100);
    const dg = Math.round((P.val[d.regions.indexOf("대구")][slot] / d.base[d.regions.indexOf("대구")]) * 100);
    ctx.globalAlpha = a; ctx.textAlign = "right";
    ctx.fillStyle = INK2; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText(`아파트 분양 ${d.years[6]}–${String(d.years[P.Y - 1]).slice(2)}`, X, h * 0.2);
    ctx.fillStyle = "#8a2d12"; ctx.font = `700 ${Math.round(h * 0.17)}px ${MONO}`; ctx.fillText(`−${drop}%`, X, h * 0.2 + h * 0.18);
    ctx.fillStyle = INK2; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText("대구는 평소의", X, h * 0.62);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.13)}px ${MONO}`; ctx.fillText(`${dg}%`, X, h * 0.62 + h * 0.15);
    ctx.globalAlpha = 1;
    if (c > 9.4) { ctx.fillStyle = BG; ctx.globalAlpha = (c - 9.4) / 0.6; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ mount
  function mount(stage, controls, d) {
    const P = prep(d), s = KF.canvas(stage);
    let view = "sky", rel = true, slot = P.Y, t0 = performance.now(), tv = performance.now(), hover = null;
    let cur = null, from = null, tChange = -1;
    const target = () => P.val.map((row, i) => (rel ? (row[slot] / d.base[i]) * 10 : row[slot] / 1000));
    KF.segment(controls, [{ id: "sky", label: "시도별 골조" }, { id: "plan", label: "공정표 (표본)" }], "sky", (id) => { view = id; tv = performance.now(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = " 높이:"; controls.appendChild(sep);
    KF.segment(controls, [{ id: "rel", label: "평소 대비" }, { id: "abs", label: "세대 수" }], "rel", (id) => { from = cur; rel = id === "rel"; tChange = performance.now(); cur = null; });
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = P.Y; range.step = 1; range.value = P.Y;
    const lab = document.createElement("label"), out = document.createElement("span");
    out.className = "readout"; out.textContent = P.labels[P.Y];
    lab.append("연도", range, out);
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 짓기";
    replay.onclick = () => { t0 = tv = performance.now(); cur = null; from = null; };
    controls.append(lab, replay);
    range.oninput = () => { from = cur; slot = +range.value; out.textContent = P.labels[slot]; tChange = performance.now(); };
    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), t = (now - t0) / 1000;
      if (view === "plan") {
        const hit = schedule(ctx, w, h, d, KF.clamp((now - tv) / 1000 / 1.8, 0, 1), hover, full);
        if (hit && hover) {
          const [, ap, st, us, n] = hit.p;
          tip(ctx, w, h, hover[0], hover[1], [`${d.areas[hit.k]} · ${KF.fmt(n)}세대`, `사업승인 ${ym(ap)}`, st ? `착공 ${ym(st)}` : "착공 기록 없음", us ? `사용검사 ${ym(us)} · 승인 뒤 ${Math.round((us - ap) * 12)}개월` : "아직 사용검사 전"]);
        }
        return;
      }
      const L = layout(w, h, full ? "full" : "phone", P.R);
      scene(ctx, w, h, L);
      const grow = KF.ease(KF.clamp((t - 0.1) / 1.1, 0, 1)), pour = KF.ease(KF.clamp((t - 1.2) / 1.8, 0, 1));
      const tg = target();
      if (tChange > 0) { const k = KF.ease(KF.clamp((now - tChange) / 700, 0, 1)); cur = tg.map((v, i) => KF.lerp(from ? from[i] : v, v, k)); if (k >= 1) tChange = -1; }
      else cur = tg.map((v) => v * pour);
      P.slot = slot;
      // hover: which building
      let hi = null;
      if (hover && hover[0] >= L.left && hover[0] <= L.right && hover[1] <= L.ground + 24) hi = KF.clamp(Math.floor((hover[0] - L.left) / L.pitch), 0, P.R - 1);
      skyline(ctx, w, h, d, P, L, rel, cur, grow, t, hi, KF.clamp((t - 2.8) / 0.6, 0, 1));
      fence(ctx, L, d, hi);
      if (full) board(ctx, w, h, d, P, slot, rel, KF.clamp((t - 2.2) / 0.8, 0, 1));
      else { // phone notes on the ground
        const y = L.ground + 36, nat = P.nat[slot], pct = (nat / d.natBase) * 100;
        ctx.textAlign = "left"; ctx.fillStyle = "#fbfaf6"; ctx.font = `700 14px ${SANS}`;
        ctx.fillText(`${P.labels[slot]}${slot < P.Y ? "년" : ""} 1–${d.mLast}월 분양 ${KF.fmt(nat)}세대`, 12, y);
        ctx.font = `600 12px ${SANS}`; ctx.fillStyle = pct < 100 ? "#ffd9c7" : "#d4f2df";
        ctx.fillText(`평소(${d.years[0]}–${String(d.years[5]).slice(2)} 평균)의 ${pct.toFixed(0)}%`, 12, y + 20);
        ctx.fillStyle = "rgba(251,250,246,.85)"; ctx.font = `500 10.5px ${SANS}`;
        ctx.fillText(rel ? "부은 층 = 그해 분양 · 1층 = 평소의 10%" : "부은 층 = 그해 분양 · 1층 = 1,000세대", 12, y + 40);
        ctx.fillText("그물 친 골조 = 평소만큼 못 채운 층 · 주황 = 평소보다 많이", 12, y + 56);
        ctx.fillText(`입주 예정 ${d.movein.months[0].replace("-", ".")}–${d.movein.months[23].replace("-", ".")} ${KF.fmt(d.movein.total)}세대`, 12, y + 72);
        ctx.fillText(`사업승인 → 입주 중간값: ${d.areas[0]} ${Math.round(d.lag[0][2])}개월 · ${d.areas[1]} ${Math.round(d.lag[1][2])}개월`, 12, y + 88);
      }
      if (hi !== null && hover && t > 3) {
        const i = hi, v = P.val[i][slot], b = d.base[i], M = d.movein.reg[i];
        tip(ctx, w, h, hover[0], hover[1], [`${d.regions[i]} · ${P.labels[slot]}${slot < P.Y ? "년" : ""} 1–${d.mLast}월`, `분양보증 ${KF.fmt(v)}세대`, `평소 ${KF.fmt(b)}세대의 ${Math.round((v / b) * 100)}%`, `입주 예정 ${d.movein.months[0].slice(0, 4)}.${Number(d.movein.months[0].slice(5))}–${d.movein.months[23].slice(0, 4)}.${Number(d.movein.months[23].slice(5))}: ${KF.fmt(M)}세대`]);
      }
    });
  }

  VIZ["housing-permits"] = { thumb, mount, bg: BG };
})();
