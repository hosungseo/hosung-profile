// 31 air — "김 서린 유리창 (fogged window)". A window of twelve panes, one per month of 2024; inside a pane every
// day is a vertical wipe of the glass: clear where the day's fine dust was low, milky where it was high. The city
// behind the glass shows through the clean days. Yellow dust (황사) days logged by KMA observers since 1961 pile up
// on the windowsill, one small heap per year.
(() => {
  const BG = "#1e252c";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#eef1f2", DIM = "rgba(238,241,242,.66)", FAINT = "rgba(238,241,242,.16)";
  const GOOD = "#8fd0f0", MID = "#c9ccc4", BAD = "#e8a33c", VBAD = "#d0602e";
  const WOOD = "#7a5638", WOOD_HI = "#9c7250", WOOD_LO = "#4f3522", DUST = "#d8b25a", DUST_HI = "#efd38e";
  const MON = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const GRADE = ["좋음", "보통", "나쁨", "매우나쁨"], GCOL = [GOOD, MID, BAD, VBAD];

  // ---------------------------------------------------------------- data
  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const start = Date.UTC(d.year, 0, 1), days = d.d25["전국"].length;
    const month = new Uint8Array(days), dom = new Uint8Array(days);
    for (let i = 0; i < days; i++) { const t = new Date(start + i * 864e5); month[i] = t.getUTCMonth(); dom[i] = t.getUTCDate(); }
    const first = []; for (let m = 0; m < 12; m++) first.push(month.indexOf(m));
    const len = first.map((f, m) => (m < 11 ? first[m + 1] : days) - f);
    return (DEC = { days, month, dom, first, len });
  }
  const key = (p) => (p === "pm10" ? "d10" : "d25");
  function grade(v, cut) { if (v == null) return -1; return v <= cut[0] ? 0 : v <= cut[1] ? 1 : v <= cut[2] ? 2 : 3; }
  function fogA(v, p) { // opacity of the fog for a day's value
    if (v == null) return 0.5;
    const x = p === "pm10" ? (v - 12) / 85 : (v - 4) / 38;
    return KF.clamp(0.05 + 0.88 * x, 0.05, 0.93);
  }
  function counts(arr, cut) {
    const c = [0, 0, 0, 0]; let s = 0, n = 0;
    for (const v of arr) { if (v == null) continue; c[grade(v, cut)]++; s += v; n++; }
    return { c, mean: s / n, n };
  }

  // ---------------------------------------------------------------- the city behind the glass (cached per size)
  let SC = null;
  function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function scene(w, h) {
    const k = `${Math.round(w)}x${Math.round(h)}`;
    if (SC && SC.k === k) return SC.c;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#5f93bf"); sky.addColorStop(0.55, "#a9c9de"); sky.addColorStop(1, "#dfe9ec");
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const sg = g.createRadialGradient(w * 0.78, h * 0.2, 0, w * 0.78, h * 0.2, h * 0.28);
    sg.addColorStop(0, "rgba(255,250,228,.95)"); sg.addColorStop(0.25, "rgba(255,246,214,.6)"); sg.addColorStop(1, "rgba(255,246,214,0)");
    g.fillStyle = sg; g.fillRect(0, 0, w, h);
    // far ridge, near ridge
    const ridge = (y0, amp, col, seed) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const u = x / w, y = y0 - amp * (0.55 * Math.sin(u * 5.1 + seed) + 0.3 * Math.sin(u * 11.3 + seed * 2) + 0.15 * Math.sin(u * 23 + seed));
        g.lineTo(x, y);
      }
      g.lineTo(w, h); g.closePath(); g.fill();
    };
    ridge(h * 0.42, h * 0.1, "#8fa6b8", 1.3);
    ridge(h * 0.52, h * 0.08, "#728ca0", 4.1);
    // towers
    let x = -4, i = 0;
    while (x < w) {
      const bw = 14 + rnd(i) * 26, bh = h * (0.18 + rnd(i + 50) * 0.42) * (rnd(i + 9) > 0.8 ? 1.45 : 1);
      const y = h * 0.93 - bh, shade = 70 + Math.round(rnd(i + 3) * 40);
      g.fillStyle = `rgb(${shade - 20},${shade},${shade + 18})`; g.fillRect(x, y, bw, h - y);
      g.fillStyle = `rgba(255,255,255,${0.12 + rnd(i + 5) * 0.1})`; g.fillRect(x, y, 2, h - y);
      g.fillStyle = "rgba(235,240,245,.55)";
      for (let wy = y + 5; wy < h * 0.93 - 4; wy += 7) for (let wx = x + 4; wx < x + bw - 4; wx += 6) if (rnd(wx * 3.1 + wy) > 0.45) g.fillRect(wx, wy, 2.4, 3);
      x += bw + 2 + rnd(i + 7) * 5; i++;
    }
    g.fillStyle = "#5f7282"; g.fillRect(0, h * 0.93, w, h * 0.07);
    SC = { k, c };
    return c;
  }
  // grain for the fog, tiled
  let GRAIN = null;
  function grain() {
    if (GRAIN) return GRAIN;
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"), im = g.createImageData(128, 128);
    for (let i = 0; i < 128 * 128; i++) { const v = 200 + rnd(i * 0.37) * 55; im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = rnd(i * 1.7 + 3) * 90; }
    g.putImageData(im, 0, 0);
    return (GRAIN = c);
  }

  // ---------------------------------------------------------------- layout
  function layout(w, h, mode) {
    if (mode === "thumb") {
      const H = h - 22, W = Math.min(w * 0.6, H * 1.62), x0 = w - W - 12, y0 = 10;
      return geo(x0, y0, W, H - 14, mode);
    }
    if (mode === "full") {
      const W = Math.min(w * 0.6, 640), H = h - 122;
      return geo(26, 24, W, H, mode);
    }
    const W = w - 16, H = Math.min(W * 0.66, h * 0.5);
    return geo(8, 10, W, H, mode);
  }
  function geo(x0, y0, W, H, mode) {
    const fo = mode === "full" ? 12 : mode === "thumb" ? 6 : 8, mu = mode === "full" ? 7 : mode === "thumb" ? 3.5 : 5;
    const pw = (W - 2 * fo - 3 * mu) / 4, ph = (H - 2 * fo - 2 * mu) / 3;
    const panes = [];
    for (let m = 0; m < 12; m++) {
      const c = m % 4, r = Math.floor(m / 4);
      panes.push([x0 + fo + c * (pw + mu), y0 + fo + r * (ph + mu), pw, ph]);
    }
    return { x0, y0, W, H, fo, mu, pw, ph, panes, mode, sill: [x0 - 6, y0 + H, W + 12, mode === "full" ? 18 : mode === "thumb" ? 7 : 12] };
  }

  // ---------------------------------------------------------------- the window
  function windowView(ctx, L, D, vals, p, reveal, fogIn, hoverDay) {
    const { x0, y0, W, H, panes, mode } = L;
    // frame (outer shadow, then wood)
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(x0 + 5, y0 + 7, W, H);
    ctx.fillStyle = WOOD; ctx.fillRect(x0, y0, W, H);
    const gx = panes[0][0], gy = panes[0][1];
    const sc = scene(W - 2 * L.fo, H - 2 * L.fo);
    for (let m = 0; m < 12; m++) {
      const [px, py, pw, ph] = panes[m];
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
      ctx.drawImage(sc, gx, gy, W - 2 * L.fo, H - 2 * L.fo);
      // fog: one horizontal gradient per pane, one colour stop per day
      const f = D.first[m], n = D.len[m];
      const gr = ctx.createLinearGradient(px, 0, px + pw, 0);
      for (let i = 0; i < n; i++) {
        const di = f + i, v = vals[di], rv = KF.clamp(reveal * 12 - m - i / n, 0, 1);
        const a = KF.lerp(0.9 * fogIn, fogA(v, p), KF.ease(rv));
        const dusty = v != null && grade(v, p === "pm10" ? [30, 80, 150] : [15, 35, 75]) >= 2 ? 1 : 0;
        const col = dusty ? `rgba(206,193,160,${a})` : `rgba(232,236,236,${a})`;
        if (i === 0) gr.addColorStop(0, col);
        gr.addColorStop((i + 0.5) / n, col);
        if (i === n - 1) gr.addColorStop(1, col);
      }
      ctx.fillStyle = gr; ctx.fillRect(px, py, pw, ph);
      ctx.globalAlpha = 0.35 * KF.clamp(fogIn, 0, 1); ctx.fillStyle = ctx.createPattern(grain(), "repeat"); ctx.fillRect(px, py, pw, ph); ctx.globalAlpha = 1;
      // condensation drips on the dusty days
      if (mode !== "thumb") {
        for (let i = 0; i < n; i++) {
          const di = f + i, v = vals[di], rv = KF.clamp(reveal * 12 - m - i / n, 0, 1);
          if (v == null || rv < 1 || fogA(v, p) < 0.72) continue;
          const cx = px + (i + 0.5) * pw / n, cy = py + ph * (0.18 + rnd(di) * 0.5), len = ph * (0.12 + rnd(di + 7) * 0.3);
          ctx.strokeStyle = "rgba(120,130,135,.35)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 0.6, cy + len); ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.arc(cx + 0.6, cy + len, 1.5, 0, 7); ctx.fill();
        }
      }
      if (hoverDay != null && D.month[hoverDay] === m) {
        const i = hoverDay - f, sx = px + i * pw / n;
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.strokeRect(sx + 0.5, py + 1, Math.max(2, pw / n - 1), ph - 2);
      }
      ctx.restore();
      // glass sheen
      const sh = ctx.createLinearGradient(px, py, px + pw, py + ph);
      sh.addColorStop(0, "rgba(255,255,255,.10)"); sh.addColorStop(0.4, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(255,255,255,.04)");
      ctx.fillStyle = sh; ctx.fillRect(px, py, pw, ph);
      // pane edge (inner shadow of the frame)
      ctx.strokeStyle = WOOD_LO; ctx.lineWidth = 1; ctx.strokeRect(px - 0.5, py - 0.5, pw + 1, ph + 1);
    }
    // bevel highlights on the frame
    ctx.strokeStyle = WOOD_HI; ctx.lineWidth = 1.2; ctx.strokeRect(x0 + 1, y0 + 1, W - 2, H - 2);
    ctx.strokeStyle = WOOD_LO; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, W - 1, H - 1);
  }

  function paneLabels(ctx, L, D, vals, cut, full) {
    ctx.textAlign = "left";
    for (let m = 0; m < 12; m++) {
      const [px, py, pw, ph] = L.panes[m];
      let bad = 0; for (let i = 0; i < D.len[m]; i++) if (grade(vals[D.first[m] + i], cut) >= 2) bad++;
      const fs = full ? 11 : 9.5;
      ctx.font = `700 ${fs}px ${SANS}`;
      const tw = ctx.measureText(MON[m]).width;
      ctx.fillStyle = "rgba(24,30,36,.72)"; ctx.fillRect(px + 4, py + 4, tw + 8, fs + 6);
      ctx.fillStyle = "#fff"; ctx.fillText(MON[m], px + 8, py + 4 + fs + 1);
      if (bad && full) {
        const t = `나쁨 ${bad}일`; ctx.font = `700 10.5px ${SANS}`;
        const bw = ctx.measureText(t).width + 8;
        ctx.fillStyle = "rgba(24,30,36,.72)"; ctx.fillRect(px + pw - bw - 4, py + ph - 20, bw, 16);
        ctx.fillStyle = BAD; ctx.fillText(t, px + pw - bw, py + ph - 8);
      } else if (bad) {
        ctx.fillStyle = BAD; ctx.beginPath(); ctx.arc(px + pw - 7, py + 8, 3.2, 0, 7); ctx.fill();
      }
    }
  }

  // ---------------------------------------------------------------- windowsill with yellow dust heaps (one per year)
  function sill(ctx, L, d, grow, hoverY, full) {
    const [sx, sy, sw, sh] = L.sill, n = d.dust.avg.length, step = sw / n;
    const vmax = Math.max(...d.dust.avg), hmax = full ? 30 : L.mode === "thumb" ? 10 : 20;
    // heaps sit on top of the sill
    for (let i = 0; i < n; i++) {
      const v = d.dust.avg[i] * KF.clamp(grow * 1.4 - i / n * 0.4, 0, 1);
      if (v <= 0) continue;
      const hh = (v / vmax) * hmax, cx = sx + (i + 0.5) * step, r = step * 0.62;
      const g = ctx.createLinearGradient(0, sy - hh, 0, sy);
      g.addColorStop(0, hoverY === i ? "#fff3c4" : DUST_HI); g.addColorStop(1, DUST);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - r, sy);
      ctx.quadraticCurveTo(cx - r * 0.35, sy - hh * 1.05, cx, sy - hh); ctx.quadraticCurveTo(cx + r * 0.35, sy - hh * 1.05, cx + r, sy); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = WOOD_HI; ctx.fillRect(sx, sy, sw, 3);
    ctx.fillStyle = WOOD; ctx.fillRect(sx, sy + 3, sw, sh - 3);
    ctx.fillStyle = WOOD_LO; ctx.fillRect(sx, sy + sh - 2, sw, 2);
    return { x: sx, y: sy - hmax - 4, w: sw, h: hmax + sh + 18, step };
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `700 12.5px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 11.5px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 12 + lines.length * 17;
    const bx = KF.clamp(x + 14 + bw > w - 6 ? x - bw - 14 : x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(18,23,28,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(238,241,242,.3)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = i ? `500 11.5px ${SANS}` : `700 12.5px ${SANS}`; ctx.fillText(t, bx + 11, by + 17 + i * 17); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const D = decode(d), c = t % 10, L = layout(w, h, "thumb"), vals = d.d25["서울"];
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const fogIn = KF.clamp(c / 0.8, 0, 1) * (c > 9.2 ? 1 : 1);
    const reveal = c > 9.2 ? KF.clamp(1 - (c - 9.2) / 0.8, 0, 1) : KF.clamp((c - 0.8) / 2.2, 0, 1);
    windowView(ctx, L, D, vals, "pm25", reveal, fogIn, null);
    sill(ctx, L, d, KF.clamp((c - 1.5) / 1.5, 0, 1), null, false);
    const s = counts(vals, d.cut.pm25), x = h * 0.09, a = KF.clamp((c - 1) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.075)}px ${SANS}`; ctx.fillText("서울 2024", x, h * 0.3);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.052)}px ${SANS}`; ctx.fillText("초미세먼지 하루 평균", x, h * 0.4);
    ctx.fillStyle = BAD; ctx.font = `700 ${Math.round(h * 0.11)}px ${SANS}`; ctx.fillText(`나쁨 ${s.c[2] + s.c[3]}일`, x, h * 0.56);
    ctx.fillStyle = GOOD; ctx.fillText(`좋음 ${s.c[0]}일`, x, h * 0.7);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    let region = "서울", p = "pm25", t0 = performance.now(), tSwitch = -99, hover = null, geoSill = null, L = null;
    const lab = document.createElement("label"), sel = document.createElement("select");
    d.regions.forEach((r) => { const o = document.createElement("option"); o.value = r; o.textContent = r; if (r === region) o.selected = true; sel.appendChild(o); });
    lab.append("지역", sel); controls.appendChild(lab);
    sel.onchange = () => { region = sel.value; tSwitch = performance.now(); };
    KF.segment(controls, [{ id: "pm25", label: "초미세먼지 PM2.5" }, { id: "pm10", label: "미세먼지 PM10" }], p, (id) => { p = id; tSwitch = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520, now = performance.now(), el = (now - t0) / 1000;
      L = layout(w, h, full ? "full" : "phone");
      const vals = d[key(p)][region], cut = d.cut[p], st = counts(vals, cut);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      // wall: a faint vertical texture
      ctx.fillStyle = "rgba(255,255,255,.018)"; for (let x = 0; x < w; x += 9) ctx.fillRect(x, 0, 1, h);
      // intro: fog condenses, then the wipe runs January -> December; a switch re-wipes quickly
      const sw = (now - tSwitch) / 1000;
      let fogIn = KF.clamp((el - 0.2) / 1.0, 0, 1), reveal = KF.clamp((el - 1.2) / 3.0, 0, 1);
      if (sw < 1.6) { reveal = KF.clamp(sw / 1.4, 0, 1); fogIn = 1; }
      // hover targets
      let hd = null, hy = null;
      if (hover && reveal >= 1) {
        for (let m = 0; m < 12; m++) {
          const [px, py, pw, ph] = L.panes[m];
          if (hover[0] >= px && hover[0] < px + pw && hover[1] >= py && hover[1] < py + ph) { hd = D.first[m] + Math.floor((hover[0] - px) / pw * D.len[m]); break; }
        }
        if (hd == null && geoSill && hover[0] >= geoSill.x && hover[0] < geoSill.x + geoSill.w && hover[1] >= geoSill.y && hover[1] < geoSill.y + geoSill.h)
          hy = KF.clamp(Math.floor((hover[0] - geoSill.x) / geoSill.step), 0, d.dust.avg.length - 1);
      }
      windowView(ctx, L, D, vals, p, reveal, fogIn, hd);
      if (reveal >= 1) paneLabels(ctx, L, D, vals, cut, full);
      geoSill = sill(ctx, L, d, KF.clamp((el - 2.4) / 2.0, 0, 1), hy, full);
      const [sx, sy, swd, sh] = L.sill;
      const pname = p === "pm10" ? "미세먼지(PM10)" : "초미세먼지(PM2.5)";
      if (full) {
        // sill caption + decade ticks
        ctx.fillStyle = "rgba(238,241,242,.55)"; ctx.font = `500 10px ${MONO}`; ctx.textAlign = "center";
        for (let y = 1970; y <= 2020; y += 10) ctx.fillText(String(y), sx + (y - d.dust.y0 + 0.5) * geoSill.step, sy + sh + 13);
        ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`창틀의 노란 먼지 = 해마다 황사가 관측된 날 (${d.dust.stations.join("·")} 평균, ${d.dust.y0}–${d.dust.y0 + d.dust.avg.length - 1})`, sx + 6, sy + sh + 32);
        // right panel
        const x0 = L.x0 + L.W + 38, pw = w - x0 - 24;
        ctx.fillStyle = INK; ctx.font = `700 21px ${SERIF}`; ctx.fillText(`김 서린 창 · ${region}`, x0, 48);
        const tw = ctx.measureText(`김 서린 창 · ${region}`).width;
        ctx.fillStyle = DIM; ctx.font = `500 12px ${MONO}`; ctx.fillText(String(d.year), x0 + tw + 10, 48);
        ctx.font = `500 12px ${SANS}`;
        ctx.fillText(`창 한 칸 = 한 달, 세로 줄 = 하루의 ${pname}`, x0, 72);
        ctx.fillText("뿌열수록 짙은 날 · 노르스름한 줄 = '나쁨' 이상", x0, 91);
        // legend tiles
        const lc = p === "pm10" ? [20, 60, 110, 170] : [8, 25, 50, 90], rng = p === "pm10" ? ["0–30", "31–80", "81–150", "151+"] : ["0–15", "16–35", "36–75", "76+"];
        lc.forEach((v, i) => {
          const lx = x0 + i * Math.min(84, pw / 4), ly = 108;
          ctx.save(); ctx.beginPath(); ctx.rect(lx, ly, 26, 18); ctx.clip();
          ctx.fillStyle = "#5f93bf"; ctx.fillRect(lx, ly, 26, 18); ctx.fillStyle = "#4a5c6c"; ctx.fillRect(lx + 4, ly + 6, 7, 12); ctx.fillRect(lx + 14, ly + 3, 8, 15);
          ctx.fillStyle = i >= 2 ? `rgba(206,193,160,${fogA(v, p)})` : `rgba(232,236,236,${fogA(v, p)})`; ctx.fillRect(lx, ly, 26, 18);
          ctx.restore(); ctx.strokeStyle = WOOD; ctx.strokeRect(lx + 0.5, ly + 0.5, 25, 17);
          ctx.fillStyle = GCOL[i]; ctx.font = `700 11px ${SANS}`; ctx.fillText(GRADE[i], lx + 31, ly + 9);
          ctx.fillStyle = DIM; ctx.font = `500 9.5px ${MONO}`; ctx.fillText(rng[i], lx + 31, ly + 21);
        });
        // day counts
        const by = 176, bad = st.c[2] + st.c[3];
        ctx.fillStyle = DIM; ctx.font = `600 12.5px ${SANS}`;
        ctx.fillText("나쁨 이상", x0, by); ctx.fillText("좋음", x0 + pw * 0.36, by); ctx.fillText("보통", x0 + pw * 0.68, by);
        ctx.font = `700 38px ${SANS}`;
        ctx.fillStyle = BAD; ctx.fillText(String(bad), x0, by + 42);
        let ww = ctx.measureText(String(bad)).width; ctx.font = `600 14px ${SANS}`; ctx.fillText("일", x0 + ww + 3, by + 42);
        ctx.font = `700 38px ${SANS}`; ctx.fillStyle = GOOD; ctx.fillText(String(st.c[0]), x0 + pw * 0.36, by + 42);
        ww = ctx.measureText(String(st.c[0])).width; ctx.font = `600 14px ${SANS}`; ctx.fillText("일", x0 + pw * 0.36 + ww + 3, by + 42);
        ctx.font = `700 38px ${SANS}`; ctx.fillStyle = MID; ctx.fillText(String(st.c[1]), x0 + pw * 0.68, by + 42);
        ww = ctx.measureText(String(st.c[1])).width; ctx.font = `600 14px ${SANS}`; ctx.fillText("일", x0 + pw * 0.68 + ww + 3, by + 42);
        // 366 days as one bar
        const bx = x0, bw = pw, byy = by + 58;
        let cx = bx;
        [0, 1, 2, 3].forEach((g) => { const ww2 = st.c[g] / st.n * bw; ctx.fillStyle = GCOL[g]; ctx.fillRect(cx, byy, ww2, 8); cx += ww2; });
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`${d.year}년 ${st.n}일 · 1년 평균 ${st.mean.toFixed(1)}㎍/㎥ · 측정소 ${d.nst[region]}곳 평균(확정자료)`, x0, byy + 26);
        // latest data: API month + forecasts
        let ly = byy + 58;
        ctx.fillStyle = INK; ctx.font = `700 12.5px ${SANS}`; ctx.fillText("가장 최근", x0, ly);
        ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
        const rc = d.recent[p], rr = region === "전국" ? null : rc.sido[region];
        const md = (s) => `${+s.slice(5, 7)}.${+s.slice(8, 10)}`;
        if (rr) ctx.fillText(`${rc.from.slice(0, 4)}.${md(rc.from)}–${md(rc.to)} 평균 ${rr[0].toFixed(1)}㎍/㎥ (2024년 같은 기간 ${rr[1].toFixed(1)})`, x0, ly + 20);
        else {
          const vs = Object.values(rc.sido), a1 = vs.reduce((s, v) => s + v[0], 0) / vs.length, a0 = vs.reduce((s, v) => s + v[1], 0) / vs.length;
          ctx.fillText(`${rc.from.slice(0, 4)}.${md(rc.from)}–${md(rc.to)} 17개 시도 평균 ${a1.toFixed(1)}㎍/㎥ (2024년 같은 기간 ${a0.toFixed(1)})`, x0, ly + 20);
        }
        const fcr = d.fc.sido[region];
        if (fcr && p === "pm25") ctx.fillText(`지난 1년 예보(${d.fc.from.slice(0, 7).replace("-", ".")}–${d.fc.to.slice(0, 7).replace("-", ".")}) 나쁨 이상 ${fcr.bad}일 · 좋음 ${fcr.good}일`, x0, ly + 39);
        else if (p === "pm25") ctx.fillText("예보는 시도별로만 있습니다", x0, ly + 39);
        // emissions
        ly += 76;
        ctx.fillStyle = INK; ctx.font = `700 12.5px ${SANS}`; ctx.fillText(`직접 배출된 초미세먼지의 출처 · ${region} 2023`, x0, ly);
        const E = d.emis[region], em = E.slice(0, 4).concat(E.slice(4).filter((e) => e[0] === "도로이동오염원")), emax = em[0][1];
        em.forEach(([k, v, lab], i) => {
          const yy = ly + 12 + i * 19;
          ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(lab, x0, yy + 10);
          const bxx = x0 + 118, bl = (pw - 164) * v / emax;
          ctx.fillStyle = k === "도로이동오염원" ? "#9aa5ad" : "#b8a988"; ctx.fillRect(bxx, yy + 2, bl, 10);
          ctx.fillStyle = INK; ctx.font = `500 10.5px ${MONO}`; ctx.fillText(`${v.toFixed(1)}%`, bxx + bl + 5, yy + 11);
        });
      } else {
        const y0 = sy + sh + 24, bad = st.c[2] + st.c[3];
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 13px ${SANS}`;
        ctx.fillText(`${region} ${d.year} · ${p === "pm10" ? "미세먼지" : "초미세먼지"} 하루 평균`, 12, y0);
        ctx.font = `600 10.5px ${SANS}`; ctx.fillStyle = DIM;
        ctx.fillText("나쁨 이상", 12, y0 + 22); ctx.fillText("좋음", w * 0.37, y0 + 22); ctx.fillText("보통", w * 0.68, y0 + 22);
        ctx.font = `700 25px ${SANS}`;
        ctx.fillStyle = BAD; ctx.fillText(`${bad}일`, 12, y0 + 50);
        ctx.fillStyle = GOOD; ctx.fillText(`${st.c[0]}일`, w * 0.37, y0 + 50);
        ctx.fillStyle = MID; ctx.fillText(`${st.c[1]}일`, w * 0.68, y0 + 50);
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
        ctx.fillText(`1년 평균 ${st.mean.toFixed(1)}㎍/㎥ · 창틀 = 황사 관측일 ${d.dust.y0}–${d.dust.y0 + d.dust.avg.length - 1}`, 12, y0 + 72);
        const fcr = d.fc.sido[region], rc = d.recent[p], rr = rc.sido[region];
        let yy = y0 + 92;
        if (rr) { ctx.fillText(`최근 한 달 평균 ${rr[0].toFixed(1)}㎍/㎥ (2024년 같은 기간 ${rr[1].toFixed(1)})`, 12, yy); yy += 20; }
        if (fcr && p === "pm25") ctx.fillText(`지난 1년 예보: 나쁨 이상 ${fcr.bad}일 · 좋음 ${fcr.good}일`, 12, yy);
      }
      // tooltips
      if (hd != null && hover) {
        const v = vals[hd], g = grade(v, cut);
        tip(ctx, w, h, hover[0], hover[1], [[`${d.year}년 ${D.month[hd] + 1}월 ${D.dom[hd]}일 · ${region}`],
          [v == null ? "측정값 없음" : `${pname} ${v}㎍/㎥ · ${GRADE[g]}`, v == null ? DIM : GCOL[g]]]);
      } else if (hy != null && hover) {
        const yr = d.dust.y0 + hy, by = d.dust.stations.map((s) => `${s} ${d.dust.by[s][hy] == null ? "–" : d.dust.by[s][hy]}`).join(" · ");
        tip(ctx, w, h, hover[0], hover[1], [[`${yr}년 황사 관측일`], [`5곳 평균 ${d.dust.avg[hy].toFixed(1)}일`, DUST_HI], [by, DIM]]);
      }
    });
  }

  VIZ.air = { thumb, mount, bg: BG };
})();
