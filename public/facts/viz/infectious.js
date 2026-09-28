// 44 infectious — "배양접시". A lab bench of petri dishes, one per notifiable disease. Cream colonies = reported
// cases (each dish has its own dot size: 1·10·100·1,000 cases), dark red spots = deaths. Moving the year grows or
// shrinks the colonies; the agar colour is the disease group (제1–4군).
(() => {
  const BG = "#2b3440";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#eef1f4", MUTE = "rgba(238,241,244,.66)", FAINT = "rgba(238,241,244,.14)";
  const AGAR = { 1: [214, 128, 146], 2: [190, 78, 72], 3: [222, 170, 74], 4: [132, 86, 58] };      // MacConkey · blood · nutrient · chocolate
  const GNAME = { 1: "제1군 물·음식", 2: "제2군 예방접종", 3: "제3군 감시", 4: "제4군 해외·신종" };
  const COL = "#f6efdc", DEAD = "#3a0a10", GA = Math.PI * (3 - Math.sqrt(5));

  let DEC = null;
  function decode(d) {
    if (DEC && DEC.d === d) return DEC;
    const dz = d.dz.map(([short, full, g, c, dd, isNew], i) => {
      const mx = Math.max(...c), md = Math.max(...dd);
      const unit = [1, 10, 100, 1000, 10000].find((u) => mx / u <= 120);
      const dunit = md <= 60 ? 1 : 5;
      let s = (i * 7919 + 13) % 2147483647;
      const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
      const jit = Array.from({ length: 140 }, () => [rnd() - 0.5, rnd() - 0.5, 0.75 + rnd() * 0.5]);
      const spots = Array.from({ length: 60 }, () => [rnd() * Math.PI * 2, Math.sqrt(rnd())]);
      return { i, short, full, g, c, dd, isNew, unit, dunit, jit, spots, rot: rnd() * Math.PI * 2 };
    });
    return (DEC = { d, dz });
  }
  const at = (arr, f) => { const i = Math.floor(f), j = Math.min(arr.length - 1, i + 1), k = f - i; return KF.lerp(arr[i], arr[j], k); };

  // ---------------------------------------------------------------- one dish
  function dish(ctx, cx, cy, R, z, f, hi, small) {
    const [r, g, b] = AGAR[z.g];
    // shadow + glass
    ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(cx + R * 0.06, cy + R * 0.1, R * 1.04, R * 1.02, 0, 0, 7); ctx.fill();
    const gl = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
    gl.addColorStop(0, "rgba(255,255,255,.22)"); gl.addColorStop(1, "rgba(255,255,255,.06)");
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, 0, 7); ctx.fill();
    // agar
    const ag = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, R * 0.1, cx, cy, R * 0.95);
    ag.addColorStop(0, `rgb(${Math.min(255, r + 30)},${Math.min(255, g + 30)},${Math.min(255, b + 24)})`); ag.addColorStop(1, `rgb(${r - 18},${g - 18},${b - 14})`);
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(cx, cy, R * 0.92, 0, 7); ctx.fill();
    // colonies on a sunflower spiral from the centre
    const n = at(z.c, f) / z.unit, nd = at(z.dd, f) / z.dunit, sp = (R * 0.84) / Math.sqrt(122), dr = Math.max(0.9, sp * 0.52);
    const full = Math.floor(n), frac = n - full;
    for (let k = 0; k < Math.ceil(n) && k < 140; k++) {
      const a = k * GA + z.rot, rr = sp * Math.sqrt(k + 0.5), j = z.jit[k];
      const x = cx + Math.cos(a) * rr + j[0] * sp * 0.5, y = cy + Math.sin(a) * rr + j[1] * sp * 0.5;
      const s = dr * j[2] * (k < full ? 1 : Math.sqrt(frac));
      ctx.fillStyle = COL; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
      if (!small && s > 2.2) { ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(x - s * 0.3, y - s * 0.3, s * 0.35, 0, 7); ctx.fill(); }
    }
    // deaths: dark spots scattered through the colony
    const ext = sp * Math.sqrt(Math.max(n, 6) + 0.5);
    for (let k = 0; k < Math.ceil(nd) && k < 60; k++) {
      const [a, u] = z.spots[k], rr = ext * u;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr, s = Math.max(1.1, dr * 0.95) * (k < Math.floor(nd) ? 1 : Math.sqrt(nd - Math.floor(nd)));
      ctx.fillStyle = "rgba(20,0,4,.35)"; ctx.beginPath(); ctx.arc(x, y, s * 1.5, 0, 7); ctx.fill();
      ctx.fillStyle = DEAD; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
    }
    if (!small && R > 26) {                                          // what one dot means in this dish
      ctx.font = `600 9px ${MONO}`; ctx.textAlign = "center";
      const t = `점1=${KF.fmt(z.unit)}`, tw = ctx.measureText(t).width + 8;
      ctx.fillStyle = "rgba(20,24,30,.62)"; ctx.fillRect(cx - tw / 2, cy + R * 0.66, tw, 12);
      ctx.fillStyle = "#f6efdc"; ctx.fillText(t, cx, cy + R * 0.66 + 9);
    }
    // rim highlight
    ctx.strokeStyle = hi ? "#fff" : "rgba(255,255,255,.55)"; ctx.lineWidth = hi ? 2 : 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, 0, 7); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.97, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
    if (z.isNew && f < 1.999) {                                     // not yet collected
      ctx.fillStyle = "rgba(30,36,44,.55)"; ctx.beginPath(); ctx.arc(cx, cy, R * 0.92, 0, 7); ctx.fill();
      if (!small) { ctx.fillStyle = INK; ctx.font = `600 ${Math.max(9, R * 0.24)}px ${SANS}`; ctx.textAlign = "center"; ctx.fillText("2017년부터", cx, cy + 4); }
    }
  }

  function layout(w, h, n, full) {
    const top = full ? 74 : 62, bot = full ? 34 : 44, W = w - (full ? 24 : 12), H = h - top - bot;
    let best = null;
    for (let cols = 3; cols <= 12; cols++) {
      const rows = Math.ceil(n / cols), cw = W / cols, ch = H / rows;
      const R = Math.min(cw * 0.4, (ch - (full ? 30 : 16)) * 0.46);
      if (!best || R > best.R) best = { cols, rows, cw, ch, R, top, x0: (w - W) / 2 };
    }
    return best;
  }

  function draw(ctx, w, h, X, list, f, hover, full, el) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    // bench texture
    ctx.strokeStyle = "rgba(255,255,255,.025)"; ctx.lineWidth = 1;
    for (let y = 8; y < h; y += 9) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 3); ctx.stroke(); }
    const L = layout(w, h, list.length, full), d = X.d;
    let hit = null;
    list.forEach((z, k) => {
      const col = k % L.cols, row = Math.floor(k / L.cols);
      const cx = L.x0 + (col + 0.5) * L.cw, cy = L.top + row * L.ch + L.R * 1.08;
      const hv = hover && (hover[0] - cx) ** 2 + (hover[1] - cy) ** 2 < (L.R * 1.1) ** 2;
      const grow = KF.clamp((el - k * 0.012) / 0.6, 0, 1);
      dish(ctx, cx, cy, L.R * (0.85 + 0.15 * KF.ease(grow)), z, f, hv, !full);
      if (z.isNew || z.short === "수두" || z.short === "A형간염") {       // the dishes behind the rise
        ctx.strokeStyle = "#ff9d9d"; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(cx, cy, L.R * 1.13, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.textAlign = "center";
      const yl = cy + L.R * 1.04 + (full ? 14 : 10);
      ctx.fillStyle = INK; ctx.font = `600 ${full ? 11.5 : 9}px ${SANS}`;
      ctx.fillText(z.short, cx, yl);
      if (full) {
        const v = Math.round(at(z.c, f)), dv = Math.round(at(z.dd, f));
        ctx.font = `500 10px ${MONO}`; ctx.fillStyle = MUTE;
        const t1 = KF.fmt(v), t2 = dv ? ` · †${KF.fmt(dv)}` : "";
        const w1 = ctx.measureText(t1).width, w2 = ctx.measureText(t2).width;
        ctx.textAlign = "left"; ctx.fillText(t1, cx - (w1 + w2) / 2, yl + 13);
        if (dv) { ctx.fillStyle = "#ff9d9d"; ctx.fillText(t2, cx - (w1 + w2) / 2 + w1, yl + 13); }
      }
      if (hv) hit = { z, cx, cy };
    });
    // the rise, taken apart
    const S = d.sum, sg = (v) => `${v >= 0 ? "+" : "−"}${KF.fmt(Math.abs(v))}`;
    ctx.textAlign = "left"; ctx.font = `600 ${full ? 11.5 : 10}px ${SANS}`;
    const parts = [[`${d.years[0]}→${d.years[d.years.length - 1]} 늘어난 ${KF.fmt(S.rise)}건 =`, INK], [`수두 ${sg(S.dVar)}`, "#ff9d9d"], [`A형간염 ${sg(S.dHepa)}`, "#ff9d9d"],
      [`2017년부터 센 병 ${sg(S.newY1)}`, "#ff9d9d"], [`나머지 ${S.nRest}개 병 ${sg(S.rest1 - S.rest0)}`, "#bfe3c3"]];
    if (full) {
      let x = 16; const y = h - 13;
      parts.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, x, y); x += ctx.measureText(t).width + (i ? 14 : 8); });
      ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${SANS}`; ctx.fillText("점선 = 늘어난 몫이 몰린 접시", x + 4, y);
    } else {
      ctx.fillStyle = INK; ctx.fillText(parts[0][0], 10, h - 26);
      let x = 10; const y = h - 10; ctx.font = `600 9.5px ${SANS}`;
      [[`수두·A형간염·새로 센 병 ${sg(S.big3)}`, "#ff9d9d"], [`나머지 ${S.nRest}개 ${sg(S.rest1 - S.rest0)}`, "#bfe3c3"]].forEach(([t, c]) => { ctx.fillStyle = c; ctx.fillText(t, x, y); x += ctx.measureText(t).width + 10; });
    }
    // header
    const yi = Math.round(f), yr = d.years[yi];
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 22 : 16}px ${SERIF}`;
    ctx.fillText(`${yr}년`, full ? 16 : 10, full ? 32 : 24);
    ctx.font = `600 ${full ? 13 : 11}px ${SANS}`; ctx.fillStyle = INK;
    const tot = at(d.tot, f), dead = at(d.dead, f);
    ctx.fillText(`신고 ${KF.fmt(Math.round(tot))}건`, full ? 92 : 64, full ? 31 : 24);
    ctx.fillStyle = "#ff9d9d"; ctx.fillText(`사망 ${KF.fmt(Math.round(dead))}명`, full ? 92 + ctx.measureText(`신고 ${KF.fmt(Math.round(tot))}건`).width + 12 : 64 + ctx.measureText(`신고 ${KF.fmt(Math.round(tot))}건`).width + 8, full ? 31 : 24);
    ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`;
    ctx.fillText(full ? "접시 하나 = 병 하나 · 흰 군락 = 신고 환자 (점 1개 = 접시 아래 단위) · 검붉은 점 = 사망" : "흰 점 = 신고 · 검붉은 점 = 사망 · 누르면 숫자", full ? 16 : 10, full ? 52 : 42);
    if (full) {                                                      // group legend, right
      let x = w - 16; ctx.textAlign = "right"; ctx.font = `500 11px ${SANS}`;
      for (const g of [4, 3, 2, 1]) {
        const t = GNAME[g], tw = ctx.measureText(t).width;
        ctx.fillStyle = MUTE; ctx.fillText(t, x, 31);
        const [r, gg, b] = AGAR[g]; ctx.fillStyle = `rgb(${r},${gg},${b})`; ctx.beginPath(); ctx.arc(x - tw - 9, 27, 5, 0, 7); ctx.fill();
        x -= tw + 26;
      }
    }
    if (hit && hover) {
      const z = hit.z, lines = [[`${z.full}`, 1], [`${GNAME[z.g]} · 점 1개 = ${KF.fmt(z.unit)}명`, 2]];
      d.years.forEach((y, i) => { if (!(z.isNew && i < 2)) lines.push([`${y}  신고 ${KF.fmt(z.c[i])}${z.dd[i] ? ` · 사망 ${KF.fmt(z.dd[i])}` : ""}`, 0]); });
      if (z.isNew) lines.push(["2017년부터 전수 신고", 2]);
      tip(ctx, w, h, lines, hover);
    }
  }

  function tip(ctx, w, h, lines, hover) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : k === 2 ? `500 10.5px ${SANS}` : `500 11px ${MONO}`);
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 12 + lines.length * 17;
    const bx = KF.clamp(hover[0] + 14 + bw > w - 6 ? hover[0] - bw - 12 : hover[0] + 14, 6, w - bw - 6), by = KF.clamp(hover[1] - bh / 2, 6, h - bh - 6);
    ctx.fillStyle = "rgba(24,29,36,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(246,239,220,.6)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? MUTE : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 19 + j * 17); });
  }

  // ---------------------------------------------------------------- thumb
  const THUMB = ["수두", "A형간염", "쯔쯔가무시증", "CRE 감염증", "메르스", "말라리아"];
  function thumb(ctx, w, h, t, d) {
    const X = decode(d), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const f = KF.clamp((c - 0.3) / 2.6, 0, 1) * (d.years.length - 1);
    const list = THUMB.map((s) => X.dz.find((z) => z.short === s)).filter(Boolean);
    const R = h * 0.15, x0 = Math.max(w * 0.05, 48 - R * 0.6) + R;         // keep the glyph corner free
    list.forEach((z, k) => {
      const col = k % 3, row = Math.floor(k / 3), cx = x0 + col * R * 2.55, cy = h * 0.3 + row * R * 2.75 + (row ? 6 : 0);
      dish(ctx, cx, cy, R, z, f, false, true);
      ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.045)}px ${SANS}`; ctx.textAlign = "center";
      ctx.fillText(z.short, cx, cy + R * 1.04 + h * 0.055);
    });
    const x = x0 + 2 * R * 2.55 + R + w * 0.05, S = d.sum;
    ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.07)}px ${SERIF}`; ctx.fillText(`${d.years[Math.round(f)]}`, x, h * 0.2);
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText("신고 전체", x, h * 0.36);
    ctx.fillStyle = "#ff9d9d"; ctx.font = `700 ${Math.round(h * 0.13)}px ${SANS}`; ctx.fillText(`+${Math.round((d.tot[d.tot.length - 1] / d.tot[0] - 1) * 100)}%`, x, h * 0.5);
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText(`나머지 ${S.nRest}개 병`, x, h * 0.68);
    ctx.fillStyle = COL; ctx.font = `700 ${Math.round(h * 0.13)}px ${SANS}`; ctx.fillText(`${Math.round((S.rest1 / S.rest0 - 1) * 100)}%`.replace("-", "−"), x, h * 0.82);
    if (c > 9.4) { ctx.fillStyle = `rgba(43,52,64,${(c - 9.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage), n = d.years.length;
    let grp = 0, f = 0, target = n - 1, t0 = performance.now(), hover = null, playing = false, intro = true;
    KF.segment(controls, [{ id: 0, label: "모든 병" }, { id: 1, label: "제1군" }, { id: 2, label: "제2군" }, { id: 3, label: "제3군" }, { id: 4, label: "제4군" }], 0, (id) => { grp = id; });
    const play = document.createElement("button"); play.type = "button"; play.textContent = "▶ 다시 키우기";
    const range = document.createElement("input"); range.type = "range"; range.min = d.years[0]; range.max = d.years[n - 1]; range.step = 1; range.value = d.years[n - 1];
    const lab = document.createElement("label"); lab.append("연도", range);
    const out = document.createElement("span"); out.className = "readout"; out.textContent = `${d.years[n - 1]}년`;
    controls.append(play, lab, out);
    range.oninput = () => { intro = false; playing = false; target = +range.value - d.years[0]; };
    play.onclick = () => { intro = false; playing = true; f = 0; target = 0; t0 = performance.now(); };
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    let last = performance.now(), shown = -1;
    KF.loop(stage, () => {
      const { ctx, w, h } = s, now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const el = (now - t0) / 1000;
      if (intro || playing) { f = KF.clamp((el - 0.8) / 4.2, 0, 1) * (n - 1); if (el > 5) { intro = false; playing = false; target = n - 1; } }
      else f += (target - f) * (1 - Math.exp(-dt * 6));
      const yi = Math.round(f);
      if (yi !== shown) { shown = yi; out.textContent = `${d.years[yi]}년`; range.value = d.years[yi]; }
      const list = X.dz.filter((z) => !grp || z.g === grp);
      draw(ctx, w, h, X, list, KF.clamp(f, 0, n - 1), hover, w > 520, el);
    });
  }

  VIZ.infectious = { thumb, mount, bg: BG };
})();
