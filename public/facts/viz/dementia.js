// 24 dementia — "Faded photo album". A cream self-adhesive album page. Each age band is one print of
// 100 small sepia portraits; the share estimated to have dementia is washed out (paler = more severe).
// Below, a strip of faded photos counts the estimated patients (1 photo = 10,000 people) for the chosen year.
(() => {
  const BG = "#efe4d0";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  const SERIF = "'Nanum Myeongjo', serif", HAND = "'Nanum Pen Script', cursive";
  const INK = "#4a3422", RED = "#9a3a26";
  const STATE_NAME = ["또렷", "경도", "중등도", "중증"];
  const hash = (i) => { const x = Math.sin(i * 45.233 + 1.7) * 43758.5453; return x - Math.floor(x); };

  // ------------------------------------------------------------ data helpers
  function tiles(pop, pat, split) {  // per-100 counts [clear, mild, moderate, severe]
    const faded = Math.round((pat / pop) * 100);
    const raw = split.map((s) => s * faded), fl = raw.map(Math.floor);
    let rest = faded - fl.reduce((a, b) => a + b, 0);
    raw.map((v, i) => [v - fl[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest > 0) { fl[i]++; rest--; } });
    return [100 - faded, ...fl];
  }

  // ------------------------------------------------------------ portrait sprites (rendered per tile size)
  let SPR = null;
  function sprites(tw, th) {
    const key = `${tw.toFixed(1)}x${th.toFixed(1)}`;
    if (SPR && SPR.key === key) return SPR;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const make = (state, hair, v) => {
      const c = document.createElement("canvas");
      c.width = Math.ceil(tw * dpr); c.height = Math.ceil(th * dpr);
      const g = c.getContext("2d"); g.scale(dpr, dpr);
      const fade = [0, 0.55, 0.8, 0.95][state];
      const bg = g.createLinearGradient(0, 0, 0, th);
      bg.addColorStop(0, `rgb(${KF.lerp(196, 236, fade)},${KF.lerp(170, 226, fade)},${KF.lerp(128, 206, fade)})`);
      bg.addColorStop(1, `rgb(${KF.lerp(160, 232, fade)},${KF.lerp(130, 220, fade)},${KF.lerp(92, 198, fade)})`);
      g.fillStyle = bg; g.fillRect(0, 0, tw, th);
      const ink = (a) => `rgba(${KF.lerp(70, 150, fade)},${KF.lerp(48, 124, fade)},${KF.lerp(30, 96, fade)},${a})`;
      const passes = state ? 3 : 1;                           // a blurred silhouette for faded prints
      for (let p = 0; p < passes; p++) {
        const ox = state ? (p - 1) * tw * 0.05 : 0, a = state ? (1 - fade) * 0.55 : 0.92;
        g.fillStyle = ink(a);
        g.beginPath(); g.ellipse(tw * 0.5 + ox, th * 1.02, tw * 0.42, th * 0.34, 0, 0, 7); g.fill();       // shoulders
        g.beginPath(); g.ellipse(tw * 0.5 + ox, th * 0.42, tw * 0.2 + v * tw * 0.03, th * 0.2, 0, 0, 7); g.fill(); // head
        g.fillStyle = hair ? `rgba(236,228,212,${state ? 0.25 : 0.7})` : ink(a);                                  // white or dark hair
        g.beginPath(); g.ellipse(tw * 0.5 + ox, th * 0.3, tw * 0.21, th * 0.1, 0, Math.PI, 0); g.fill();
      }
      g.strokeStyle = `rgba(90,64,40,${0.35 * (1 - fade)})`; g.lineWidth = 0.6; g.strokeRect(0.3, 0.3, tw - 0.6, th - 0.6);
      return c;
    };
    const out = { key };
    for (let st = 0; st < 4; st++) for (let hair = 0; hair < 2; hair++) for (let v = 0; v < 2; v++) out[`${st}${hair}${v}`] = make(st, hair, v);
    return (SPR = out);
  }

  // ------------------------------------------------------------ page texture (made once)
  let PAGE = null;
  function pageTexture() {
    if (PAGE) return PAGE;
    const c = document.createElement("canvas"); c.width = c.height = 160;
    const g = c.getContext("2d");
    for (let i = 0; i < 900; i++) {
      g.fillStyle = hash(i) < 0.5 ? `rgba(120,90,50,${0.03 + hash(i + 3) * 0.05})` : `rgba(255,255,255,${0.1 + hash(i + 9) * 0.15})`;
      g.fillRect(hash(i + 1) * 160, hash(i + 2) * 160, 1 + hash(i + 4) * 2.5, 0.6);
    }
    return (PAGE = c);
  }
  function page(ctx, w, h) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = ctx.createPattern(pageTexture(), "repeat"); ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(160,130,90,.10)"; ctx.lineWidth = 1;   // self-adhesive album page ridges
    for (let y = 9; y < h; y += 11) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
    const g = ctx.createLinearGradient(0, 0, w, h);                 // film cover sheen
    g.addColorStop(0, "rgba(255,255,255,.18)"); g.addColorStop(0.45, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(120,90,50,.06)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  // ------------------------------------------------------------ layout
  function layout(w, h, mode) {
    const full = mode === "full", thumb = mode === "thumb";
    const cols = full || thumb ? 6 : 3, rowsN = 6 / cols;
    const mx = thumb ? 12 : full ? 30 : 14, gap = thumb ? 7 : full ? 24 : 10;
    const top = thumb ? 14 : full ? 86 : 52;
    const printW = (w - 2 * mx - gap * (cols - 1)) / cols, border = thumb ? 3 : full ? 6 : 4;
    const tw = (printW - 2 * border) / 10, th = tw * (thumb ? 1.05 : full ? 1.28 : 1.1);
    const printH = th * 10 + 2 * border;
    const capH = thumb ? 22 : full ? 62 : 35;
    const prints = [];
    for (let i = 0; i < 6; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      prints.push({ i, x: mx + c * (printW + gap), y: top + r * (printH + capH + (full ? 0 : 4)), w: printW, h: printH, border, rot: (hash(i + 20) - 0.5) * (thumb ? 0.02 : 0.03) });
    }
    const stripY = top + rowsN * (printH + capH) + (full ? 14 : 4);
    return { full, thumb, mx, tw, th, prints, stripY, capH };
  }

  function photoCorners(ctx, x, y, w, h, s) {
    ctx.fillStyle = "#3c2a1b";
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(cx - dx * 2, cy - dy * 2); ctx.lineTo(cx + dx * s, cy - dy * 2); ctx.lineTo(cx - dx * 2, cy + dy * s); ctx.closePath(); ctx.fill();
    });
  }

  // draw one print of 100 portraits; dev = 0..1 develop, wash = 0..1 fading of the dementia share
  function print(ctx, P, L, counts, band, dev, wash, hi) {
    const S = sprites(L.tw, L.th);
    ctx.save();
    ctx.translate(P.x + P.w / 2, P.y + P.h / 2); ctx.rotate(P.rot); ctx.translate(-P.w / 2, -P.h / 2);
    ctx.fillStyle = "rgba(60,40,20,.18)"; ctx.fillRect(2, 3, P.w, P.h);                 // shadow
    ctx.fillStyle = "#f8f3e6"; ctx.fillRect(0, 0, P.w, P.h);                            // white print border
    const seq = [];
    counts.forEach((n, st) => { for (let k = 0; k < n; k++) seq.push(st); });
    const hairBias = band / 5;                                                          // older bands: more white hair
    seq.forEach((st, k) => {
      const c = k % 10, r = Math.floor(k / 10);
      const x = P.border + c * L.tw, y = P.border + r * L.th;
      const hair = hash(band * 131 + k) < 0.25 + hairBias * 0.6 ? 1 : 0, v = hash(band * 71 + k * 3) < 0.5 ? 1 : 0;
      const a = KF.clamp(dev * 1.6 - (k / 100) * 0.6, 0, 1);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      if (st === 0) ctx.drawImage(S[`0${hair}${v}`], x, y, L.tw, L.th);
      else { // fade from a clear portrait to its washed-out state
        ctx.drawImage(S[`0${hair}${v}`], x, y, L.tw, L.th);
        ctx.globalAlpha = a * wash;
        ctx.drawImage(S[`${st}${hair}${v}`], x, y, L.tw, L.th);
      }
    });
    ctx.globalAlpha = 1;
    if (hi) { ctx.strokeStyle = RED; ctx.lineWidth = 2; ctx.strokeRect(-3, -3, P.w + 6, P.h + 6); }
    photoCorners(ctx, 0, 0, P.w, P.h, L.thumb ? 6 : L.full ? 12 : 9);
    ctx.restore();
  }

  function caption(ctx, P, L, label, counts, sub, a) {
    ctx.globalAlpha = a;
    const cx = P.x + P.w / 2, y = P.y + P.h + (L.thumb ? 13 : L.full ? 22 : 17);
    ctx.textAlign = "center"; ctx.fillStyle = INK;
    ctx.font = `${L.thumb ? 13 : L.full ? 21 : 17}px ${HAND}`;
    ctx.fillText(label, cx, y);
    if (!L.thumb) {
      const faded = 100 - counts[0];
      ctx.font = `${L.full ? 18 : 15}px ${HAND}`;
      ctx.fillStyle = RED; ctx.fillText(`100명 중 ${faded}명`, cx, y + (L.full ? 19 : 15));
      if (L.full && sub) { ctx.fillStyle = "rgba(74,52,34,.7)"; ctx.font = `500 9.5px ${MONO}`; ctx.fillText(sub, cx, y + 33); }
    }
    ctx.globalAlpha = 1;
  }

  // strip of faded photos: 1 photo = `per` estimated patients (65+), mild ones first, then moderate, severe
  function strip(ctx, w, h, L, rowsDef, per, split, a, hoverRow) {
    const S = sprites(L.tw, L.th);
    const labelW = L.full ? 150 : 0, x0 = L.mx + labelW, avail = w - L.mx - x0;
    const maxN = Math.max(...rowsDef.map((R) => R.pat / per));
    const lines = L.full ? 2 : 1, perLine = Math.ceil(maxN / lines);
    const pitch = avail / perLine, pw = pitch * 0.86, ph = pw * 1.2;
    ctx.globalAlpha = a;
    rowsDef.forEach((R, ri) => {
      const y = R.y, n = R.pat / per;
      ctx.textAlign = "left"; ctx.fillStyle = INK;
      if (L.full) {
        ctx.font = `21px ${HAND}`; ctx.fillText(`${R.year}년`, L.mx, y + 16);
        ctx.font = `600 14px ${SANS}`; ctx.fillText(`${KF.fmt(R.pat / 1e4, 1)}만 명`, L.mx + 58, y + 15);
        ctx.fillStyle = "rgba(74,52,34,.7)"; ctx.font = `500 10px ${MONO}`;
        ctx.fillText(`65세 이상 ${KF.fmt(R.pop / 1e4, 0)}만 명의 ${KF.fmt((R.pat / R.pop) * 100, 1)}%`, L.mx, y + 32);
      } else {
        ctx.font = `600 10.5px ${SANS}`; ctx.fillText(`${R.year}년 ${KF.fmt(R.pat / 1e4, 1)}만 명`, L.mx, y - 3);
      }
      const nm = Math.round(n * split[0]), nd = Math.round(n * split[1]);
      for (let k = 0; k < Math.ceil(n); k++) {
        const frac = Math.min(1, n - k), col = k % perLine, line = Math.floor(k / perLine);
        const x = x0 + col * pitch, yy = y + line * (ph + 3);
        const st = k < nm ? 1 : k < nm + nd ? 2 : 3;
        ctx.save(); ctx.beginPath(); ctx.rect(x, yy, pw * frac, ph); ctx.clip();
        ctx.drawImage(S[`${st}${k % 2}${(k >> 1) % 2}`], x, yy, pw, ph);
        ctx.restore();
      }
      R.x0 = x0; R.x1 = x0 + Math.min(n, perLine) * pitch; R.y1 = y + lines * (ph + 3);
      if (hoverRow === ri) { ctx.strokeStyle = RED; ctx.lineWidth = 1.5; ctx.strokeRect(x0 - 4, y - 4, R.x1 - x0 + 6, R.y1 - y + 5); }
    });
    ctx.globalAlpha = 1;
  }

  function note(ctx, w, h, x, y, lines) {
    ctx.font = `600 13px ${SANS}`;
    let bw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${MONO}`;
    lines.slice(1).forEach((l) => { bw = Math.max(bw, ctx.measureText(l).width); });
    bw += 24; const bh = 14 + lines.length * 18;
    const bx = KF.clamp(x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.save(); ctx.translate(bx, by); ctx.rotate(-0.012);
    ctx.fillStyle = "rgba(60,40,20,.2)"; ctx.fillRect(3, 4, bw, bh);
    ctx.fillStyle = "#fbf7ec"; ctx.fillRect(0, 0, bw, bh);
    ctx.fillStyle = "rgba(210,190,150,.55)"; ctx.fillRect(bw / 2 - 22, -6, 44, 12);   // a strip of tape
    lines.forEach((l, i) => { ctx.fillStyle = i ? "#4a3422" : "#2a1c10"; ctx.font = i ? `500 11px ${MONO}` : `600 13px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(l, 12, 20 + i * 18); });
    ctx.restore();
  }

  // ------------------------------------------------------------ thumb
  function thumb(ctx, w, h, t, d) {
    const c = t % 10, yr = String(d.years[d.years.length - 1]);
    page(ctx, w, h);
    // one large print: the oldest band
    const border = 5, tw = Math.min((h - 40 - 2 * border) / 10 / 1.12, (w * 0.42 - 2 * border) / 10);
    const pw = tw * 10 + 2 * border, ph = tw * 1.12 * 10 + 2 * border;
    const L = { tw, th: tw * 1.12, thumb: true, full: false };
    const P = { x: w - pw - 22, y: (h - ph) / 2, w: pw, h: ph, border, rot: -0.012 };
    const [pop, pat] = d.d["전체"][yr][5], counts = tiles(pop, pat, d.split);
    const out = c > 9 ? 1 - (c - 9) : 1;
    print(ctx, P, L, counts, 5, KF.clamp(c / 1.6, 0, 1), KF.clamp((c - 1.7) / 1.2, 0, 1) * out, false);
    const a = KF.clamp((c - 2.3) / 0.6, 0, 1);
    if (a > 0) {
      const x = 24, faded = 100 - counts[0];
      ctx.globalAlpha = a; ctx.textAlign = "left"; ctx.fillStyle = INK;
      ctx.font = `${Math.round(h * 0.1)}px ${HAND}`; ctx.fillText("85세 이상 100명", x, h * 0.38);
      ctx.fillStyle = RED; ctx.fillText(`바랜 사진 ${faded}장`, x, h * 0.53);
      ctx.fillStyle = INK; ctx.fillText(`또렷한 사진 ${counts[0]}장`, x, h * 0.68);
      ctx.fillStyle = "rgba(74,52,34,.65)"; ctx.font = `500 ${Math.round(h * 0.042)}px ${MONO}`;
      ctx.fillText(`치매 추정 비율 · ${yr}`, x, h * 0.79);
      ctx.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------ mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const years = d.years.map(String);
    let sex = "전체", year = years[years.length - 1], t0 = performance.now(), hover = null, hit = null;
    KF.segment(controls, [{ id: "전체", label: "전체" }, { id: "여", label: "여성" }, { id: "남", label: "남성" }], sex, (id) => { sex = id; });
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = years.length - 1; range.value = years.length - 1;
    const lab = document.createElement("label"); lab.append("연도", range);
    const out = document.createElement("span"); out.className = "readout";
    controls.append(lab, out);
    const setOut = () => { out.textContent = `${year}년`; };
    range.oninput = () => { year = years[+range.value]; setOut(); };
    setOut();
    const replay = document.createElement("button");
    replay.type = "button"; replay.textContent = "다시 인화";
    replay.onclick = () => { t0 = performance.now(); };
    controls.appendChild(replay);
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, L = layout(w, h, full ? "full" : "phone");
      const el = (performance.now() - t0) / 1000;
      page(ctx, w, h);
      const dev = KF.clamp(el / 2.2, 0, 1), wash = KF.clamp((el - 2.3) / 1.4, 0, 1), ca = KF.clamp((el - 3.3) / 0.6, 0, 1);
      // header
      ctx.textAlign = "left"; ctx.fillStyle = INK;
      ctx.font = `700 ${full ? 17 : 14}px ${SERIF}`;
      const who = sex === "전체" ? "" : sex === "여" ? " · 여성" : " · 남성";
      ctx.fillText(`나이대마다 사진 100장 · ${year}년${who}`, L.mx, full ? 30 : 24);
      ctx.fillStyle = "rgba(74,52,34,.75)"; ctx.font = `500 ${full ? 11 : 10}px ${full ? MONO : SANS}`;
      ctx.fillText(full ? "또렷한 사진 = 치매 아님 · 바랜 사진 = 치매로 추정 (옅을수록 중증) · 보건복지부 추정" : "바랜 사진 = 치매로 추정 · 옅을수록 중증", L.mx, full ? 50 : 42);
      if (full) { // legend with sample portraits
        const S = sprites(L.tw, L.th);
        let lx = w - L.mx;
        ctx.font = `500 11px ${SANS}`; ctx.textAlign = "right";
        [3, 2, 1, 0].forEach((st) => {
          ctx.fillStyle = INK; ctx.fillText(STATE_NAME[st], lx, 30); lx -= ctx.measureText(STATE_NAME[st]).width + 5;
          ctx.drawImage(S[`${st}10`], lx - L.tw, 30 - L.th + 3, L.tw, L.th); lx -= L.tw + 14;
        });
      }
      hit = null;
      const data = d.d[sex][year];
      L.prints.forEach((P, i) => {
        const [pop, pat] = data[i], counts = tiles(pop, pat, d.split);
        const on = hover && hover[0] >= P.x && hover[0] <= P.x + P.w && hover[1] >= P.y && hover[1] <= P.y + P.h + L.capH;
        if (on) hit = { i, P, pop, pat, counts };
        print(ctx, P, L, counts, i, dev, wash, on && full);
        caption(ctx, P, L, d.bands[i], counts, `${KF.fmt(pop / 1e4, 0)}만 명 중 ${KF.fmt(pat / 1e4, 1)}만`, ca);
      });
      // patients strip
      const per = full ? 1e4 : 2e4;
      const y0 = L.stripY, [pop65, pat65] = data[6], first = d.d[sex][years[0]][6];
      const rowH = full ? 88 : 26, ry = y0 + (full ? 32 : 32);
      const rowsDef = year === years[0] ? [{ year, pat: pat65, pop: pop65, y: ry }]
        : [{ year: years[0], pat: first[1], pop: first[0], y: ry }, { year, pat: pat65, pop: pop65, y: ry + rowH }];
      if (ca > 0) {
        ctx.globalAlpha = ca; ctx.textAlign = "left"; ctx.fillStyle = INK;
        ctx.font = `${full ? 22 : 15}px ${HAND}`;
        ctx.fillText(`65세 이상 추정 치매 환자${who} · 바랜 사진 1장 = ${per / 1e4}만 명`, L.mx, y0 + (full ? 10 : 14));
        if (full && rowsDef.length === 2) {
          const [A, B] = rowsDef;
          ctx.fillStyle = RED; ctx.textAlign = "right";
          ctx.fillText(`${A.year}→${B.year} 환자 +${KF.fmt((B.pat / A.pat - 1) * 100, 0)}% · 65세 이상 인구 +${KF.fmt((B.pop / A.pop - 1) * 100, 0)}%`, w - L.mx, y0 + 10);
        }
        ctx.globalAlpha = 1;
        let hr = null;
        if (hover) rowsDef.forEach((R, ri) => { if (hover[1] >= R.y - 6 && hover[1] <= R.y + rowH - 8) hr = ri; });
        strip(ctx, w, h, L, rowsDef, per, d.split, ca, full ? hr : null);
        if (full && hr != null) {
          const R = rowsDef[hr];
          note(ctx, w, h, hover[0], hover[1], [`${R.year}년 · 65세 이상${who}`, `인구 ${KF.fmt(R.pop / 1e4, 1)}만 명`, `추정 치매 환자 ${KF.fmt(R.pat / 1e4, 1)}만 명`, `비율 ${KF.fmt((R.pat / R.pop) * 100, 1)}%`]);
        }
      }
      if (hit && full && ca >= 1) {
        const { i, pop, pat, counts } = hit, sp = d.split.map((x) => (pat * x) / 1e4);
        note(ctx, w, h, hover[0], hover[1], [`${d.bands[i]} · ${year}년${who}`, `인구 ${KF.fmt(pop / 1e4, 1)}만 명`, `치매 추정 ${KF.fmt(pat / 1e4, 1)}만 명 (${KF.fmt((pat / pop) * 100, 1)}%)`,
          `경도 ${KF.fmt(sp[0], 1)} · 중등도 ${KF.fmt(sp[1], 1)} · 중증 ${KF.fmt(sp[2], 2)}만`, `사진: 또렷 ${counts[0]} · 바램 ${100 - counts[0]}`]);
      }
    });
  }

  VIZ.dementia = { thumb, mount, bg: BG };
})();
