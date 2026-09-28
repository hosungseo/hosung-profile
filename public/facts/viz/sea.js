// 25 sea — "Nautical chart". Pale chart paper, buff land, blue tint bands 3 and 12 nautical miles off the
// coast, graticule with a black-and-white border scale, compass rose. Every vessel involved in a marine
// accident 2021–2025 is one mark at its position: size = tonnage, colour = kind of vessel.
(() => {
  const BG = "#e6eef0";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif";
  const LAND = "#f1e5c3", COASTL = "#4f4a38", BAND3 = "#c6dce5", BAND12 = "#d6e6eb", GRID = "rgba(40,80,110,.22)", NAVY = "#1d3557", MAG = "#b0306b";
  const CLS = [ // vessel classes: [label, colour, uses]
    ["어선", "#c0305a", [0]], ["수상레저기구", "#0a8a84", [1]], ["화물·유조·여객선", "#1b2a55", [4, 5, 6]], ["예인선·기타선", "#77736a", [2, 3]],
  ];
  // not drawn: land north of the DMZ. West of 126.66°E a plain box edge (not a coastline), then the
  // northern edge of the mainland from the data (d.meta.north), then up the east coast.
  const NORTH_W = [[124.0, 38.75], [124.0, 38.05], [125.05, 38.05], [125.25, 37.8], [126.2, 37.84]];
  const clsOf = [0, 1, 3, 3, 2, 2, 2];                // use index -> class
  const RAD = [0.9, 1.05, 1.25, 1.5, 2.0, 2.7, 3.5, 4.4]; // tonnage class -> radius (px, desktop)
  const K = Math.cos((35.8 * Math.PI) / 180);

  // ------------------------------------------------------------ decode (once)
  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const v = {}; [...d.b64].forEach((ch, i) => { v[ch] = i; });
    const n = d.pts.length / 7, P = new Array(n);
    for (let i = 0; i < n; i++) {
      const o = i * 7, s = d.pts;
      const cell = (v[s[o]] << 12) | (v[s[o + 1]] << 6) | v[s[o + 2]];
      const vt = v[s[o + 4]];
      P[i] = { lat: d.box[1] + Math.floor(cell / d.nx) * d.q, lon: d.box[0] + (cell % d.nx) * d.q, t: v[s[o + 3]], use: vt >> 3, ton: vt & 7, ym: v[s[o + 5]], dm: v[s[o + 6]] };
      P[i].g = d.gid[P[i].t]; P[i].c = clsOf[P[i].use];
    }
    const coast = d.coast.map((str) => {
      const a = str.split(",").map(Number), pts = [[a[0], a[1]]];
      for (let k = 2; k < a.length; k += 2) { const p = pts[pts.length - 1]; pts.push([p[0] + a[k], p[1] + a[k + 1]]); }
      return pts.map(([x, y]) => [x / 1000, y / 1000]);
    });
    return (DEC = { P, coast, north: d.meta.north.filter(([lo]) => lo >= 126.66), islands: d.meta.islands || [] });
  }

  // ------------------------------------------------------------ projection / layout
  function layout(w, h, mode) {
    const full = mode === "full", thumb = mode === "thumb";
    const [x0, y0, x1, y1] = [0, 0, 0, 0];
    const box = { lon0: 124.0, lat0: 32.9, lon1: 132.25, lat1: 38.75 };
    const ux = (box.lon1 - box.lon0) * K, uy = box.lat1 - box.lat0;
    let area;
    if (full) area = [12, 12, 12 + (h - 24) * (ux / uy), h - 12];
    else if (thumb) area = [0, 0, h * (ux / uy), h];
    else area = [0, 0, w, w * (uy / ux)];
    const s = (area[2] - area[0]) / ux;
    return {
      full, thumb, mode, area, s, box, px: (lon, lat) => [area[0] + (lon - box.lon0) * K * s, area[3] - (lat - box.lat0) * s],
      kmpx: s / 110.57,                                                   // pixels per km
    };
  }

  // ------------------------------------------------------------ static chart layer (cached per size)
  let CH = null, CH_PATH = null;
  function chart(L, dec, w, h) {
    const key = `${w}x${h}x${L.mode}`;
    if (CH && CH.key === key) return CH.c;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    g.fillStyle = BG; g.fillRect(0, 0, w, h);
    const [ax0, ay0, ax1, ay1] = L.area;
    g.save(); g.beginPath(); g.rect(ax0, ay0, ax1 - ax0, ay1 - ay0); g.clip();
    const path = new Path2D();
    for (const ring of dec.coast) { ring.forEach(([lo, la], i) => { const [x, y] = L.px(lo, la); i ? path.lineTo(x, y) : path.moveTo(x, y); }); path.closePath(); }
    g.lineJoin = "round"; g.lineCap = "round";
    g.strokeStyle = BAND12; g.lineWidth = 2 * 22.22 * L.kmpx; g.stroke(path);   // 12 nautical miles
    g.strokeStyle = BAND3; g.lineWidth = 2 * 5.556 * L.kmpx; g.stroke(path);    // 3 nautical miles
    g.fillStyle = LAND; g.fill(path);
    g.strokeStyle = COASTL; g.lineWidth = L.thumb ? 0.6 : 0.8; g.stroke(path);
    // named islands: 독도 is only a few pixels wide at this scale, so give it a visible marker
    for (const [name, lo, la] of dec.islands) {
      const [x, y] = L.px(lo, la);
      g.fillStyle = LAND; g.strokeStyle = COASTL; g.lineWidth = 0.8;
      g.beginPath(); g.arc(x, y, L.thumb ? 1.8 : 2.6, 0, 7); g.fill(); g.stroke();
      if (!L.thumb) {
        g.fillStyle = "rgba(29,53,87,.85)"; g.font = `600 ${L.full ? 10.5 : 9}px ${SANS}`; g.textAlign = "center";
        g.fillText(name, x, y + (L.full ? 16 : 13));
      }
    }
    // grey hatch over what this chart does not draw (north of the DMZ)
    const nk = new Path2D(), north = [...NORTH_W, ...dec.north, [128.37, 38.6], [128.37, 38.75]];
    north.forEach(([lo, la], i) => { const [x, y] = L.px(lo, la); i ? nk.lineTo(x, y) : nk.moveTo(x, y); }); nk.closePath();
    g.fillStyle = "#e4e2da"; g.fill(nk);
    g.save(); g.clip(nk); g.strokeStyle = "rgba(90,90,80,.25)"; g.lineWidth = 0.8;
    for (let k = -h; k < w; k += 6) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + h, h); g.stroke(); }
    g.restore();
    if (!L.thumb) {
      const [lx, ly] = L.px(125.35, 38.33);
      g.fillStyle = "rgba(70,70,60,.7)"; g.font = `500 ${L.full ? 10.5 : 9}px ${SANS}`; g.textAlign = "center";
      g.fillText("휴전선 이북 · 자료 범위 밖", lx, ly);
    }
    CH_PATH = path;
    // graticule
    g.strokeStyle = GRID; g.lineWidth = 0.7;
    for (let lon = 125; lon <= 131; lon++) { const [x] = L.px(lon, 0); g.beginPath(); g.moveTo(x, ay0); g.lineTo(x, ay1); g.stroke(); }
    for (let lat = 33; lat <= 38; lat++) { const [, y] = L.px(124, lat); g.beginPath(); g.moveTo(ax0, y); g.lineTo(ax1, y); g.stroke(); }
    // compass rose in the southeast sea
    if (!L.thumb) rose(g, ...L.px(130.95, 38.15), L.full ? 44 : 28);
    g.restore();
    // border scale: alternating 10-minute ticks, then degree labels
    if (!L.thumb) {
      const bw = L.full ? 5 : 4;
      g.strokeStyle = NAVY; g.lineWidth = 1; g.strokeRect(ax0 + 0.5, ay0 + 0.5, ax1 - ax0 - 1, ay1 - ay0 - 1);
      for (let k = 0, lon = 124; lon < 132.25; lon += 1 / 6, k++) {
        const [xa] = L.px(lon, 0), [xb] = L.px(Math.min(lon + 1 / 6, 132.25), 0);
        g.fillStyle = k % 2 ? "#fff" : NAVY; g.fillRect(xa, ay1 - bw, xb - xa, bw); g.fillRect(xa, ay0, xb - xa, bw);
      }
      for (let k = 0, lat = 32.9; lat < 38.75; lat += 1 / 6, k++) {
        const [, ya] = L.px(0, lat), [, yb] = L.px(0, Math.min(lat + 1 / 6, 38.75));
        g.fillStyle = k % 2 ? "#fff" : NAVY; g.fillRect(ax0, yb, bw, ya - yb); g.fillRect(ax1 - bw, yb, bw, ya - yb);
      }
      g.fillStyle = "rgba(29,53,87,.8)"; g.font = `500 ${L.full ? 10 : 8.5}px ${MONO}`;
      g.textAlign = "center";
      for (let lon = 125; lon <= 131; lon += L.full ? 1 : 2) { const [x] = L.px(lon, 0); g.fillText(`${lon}°E`, x, ay1 - bw - 4); }
      g.textAlign = "left";
      for (let lat = 34; lat <= 38; lat += L.full ? 1 : 2) { const [, y] = L.px(0, lat); g.fillText(`${lat}°N`, ax0 + bw + 3, y - 3); }
    }
    CH = { key, c };
    return c;
  }

  function rose(g, cx, cy, r) {
    g.save(); g.translate(cx, cy);
    g.strokeStyle = "rgba(176,48,107,.55)"; g.fillStyle = "rgba(176,48,107,.55)"; g.lineWidth = 0.8;
    [r, r * 0.8].forEach((rr) => { g.beginPath(); g.arc(0, 0, rr, 0, 7); g.stroke(); });
    for (let k = 0; k < 72; k++) { const a = (k / 72) * Math.PI * 2, l = k % 6 ? 0.06 : 0.12; g.beginPath(); g.moveTo(Math.cos(a) * r, Math.sin(a) * r); g.lineTo(Math.cos(a) * r * (1 - l), Math.sin(a) * r * (1 - l)); g.stroke(); }
    for (let k = 0; k < 4; k++) {
      g.rotate(Math.PI / 2);
      g.beginPath(); g.moveTo(0, -r * 0.78); g.lineTo(r * 0.1, -r * 0.1); g.lineTo(0, 0); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(0, -r * 0.78); g.lineTo(-r * 0.1, -r * 0.1); g.lineTo(0, 0); g.closePath(); g.stroke();
    }
    g.font = `700 ${Math.max(9, r * 0.24)}px ${SERIF}`; g.textAlign = "center"; g.fillText("N", 0, -r * 0.84 - 2);
    g.restore();
  }

  // ------------------------------------------------------------ filters
  const ACC = { all: () => true, fault: (p) => p.g === 0, fatal: (p) => p.dm > 0, sink: (p) => p.t === 16 };
  const VES = { all: () => true, fish: (p) => p.use === 0, leisure: (p) => p.use === 1, big: (p) => p.ton >= 6 };

  function mark(g, p, x, y, sc, mode) {
    const r = RAD[p.ton] * sc;
    if (mode === "sink") { // chart wreck symbol
      g.strokeStyle = CLS[p.c][1]; g.lineWidth = 1.2;
      g.beginPath(); g.ellipse(x, y, r + 3, (r + 3) * 0.5, 0, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(x - r - 3, y); g.lineTo(x + r + 3, y); g.moveTo(x - 2, y - 3); g.lineTo(x - 2, y + 3); g.moveTo(x + 2, y - 3); g.lineTo(x + 2, y + 3); g.stroke();
      return;
    }
    if (mode === "fatal") {
      const rr = (1.8 + Math.sqrt(p.dm) * 1.8) * sc;
      g.fillStyle = CLS[p.c][1]; g.globalAlpha = 0.6; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill();
      g.globalAlpha = 1; g.strokeStyle = "#111"; g.lineWidth = 0.8; g.stroke();
      return;
    }
    g.fillStyle = CLS[p.c][1]; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }

  // points layer (offscreen), drawn incrementally in time order
  function makeLayer(w, h) {
    const dpr = Math.min(devicePixelRatio || 1, 2), c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    return { c, g, upto: 0, grid: new Map() };
  }

  // ------------------------------------------------------------ cartouche (desktop) / notes (phone)
  function cartouche(ctx, w, h, L, d, dec, acc, ves, stats, a) {
    const x0 = L.area[2] + 20, x1 = w - 12, cw = x1 - x0;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(250,252,251,.9)"; ctx.fillRect(x0, 12, cw, h - 24);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5; ctx.strokeRect(x0 + 0.5, 12.5, cw - 1, h - 25);
    ctx.lineWidth = 0.6; ctx.strokeRect(x0 + 4.5, 16.5, cw - 9, h - 33);
    let y = 44;
    ctx.fillStyle = NAVY; ctx.textAlign = "center"; ctx.font = `700 17px ${SERIF}`;
    ctx.fillText("한국 바다 해양사고도", x0 + cw / 2, y);
    ctx.font = `500 10px ${MONO}`; ctx.fillStyle = "rgba(29,53,87,.75)";
    ctx.fillText(`${d.y0}–${d.y0 + 4} · 해도에 찍은 배 ${KF.fmt(d.nMap)}척 (전체 ${KF.fmt(d.n)})`, x0 + cw / 2, y + 17);
    y += 42;
    // filter summary
    ctx.textAlign = "left"; ctx.fillStyle = "#111"; ctx.font = `600 13px ${SANS}`;
    ctx.fillText(`지금 보이는 배 ${KF.fmt(stats.n)}척`, x0 + 16, y);
    ctx.textAlign = "right"; ctx.fillStyle = MAG; ctx.fillText(`사망·실종 ${KF.fmt(stats.dm)}명`, x1 - 16, y);
    y += 12;
    // bars by accident group for the vessel filter
    const max = Math.max(1, ...stats.grp.map((g) => g[0]));
    const bx = x0 + 128, bwMax = cw - 128 - 70;
    stats.grp.forEach(([n, dm], i) => {
      const yy = y + 10 + i * 21, on = n > 0;
      ctx.fillStyle = on ? "#1c2230" : "rgba(28,34,48,.4)"; ctx.font = `500 11.5px ${SANS}`; ctx.textAlign = "right";
      ctx.fillText(d.groups[i], bx - 8, yy + 10);
      const bw = (n / max) * bwMax * a;
      ctx.fillStyle = on ? NAVY : "rgba(29,53,87,.25)"; ctx.fillRect(bx, yy + 2, bw, 10);
      ctx.textAlign = "left"; ctx.font = `500 10.5px ${MONO}`; ctx.fillStyle = on ? "#1c2230" : "rgba(28,34,48,.45)";
      if (n) ctx.fillText(KF.fmt(n), bx + bw + 5, yy + 11);
      if (dm) { ctx.fillStyle = MAG; ctx.textAlign = "right"; ctx.fillText(`†${KF.fmt(dm)}`, x1 - 14, yy + 11); }
    });
    y += 10 + 8 * 21 + 4;
    ctx.fillStyle = "rgba(29,53,87,.6)"; ctx.font = `500 10px ${SANS}`; ctx.textAlign = "right";
    ctx.fillText("막대 = 배 척수 · † = 사망·실종", x1 - 14, y + 4);
    // legend
    y += 22;
    ctx.textAlign = "left"; ctx.font = `500 11px ${SANS}`;
    CLS.forEach(([lab, col], i) => {
      const lx = x0 + 16 + (i % 2) * (cw / 2 - 8), ly = y + Math.floor(i / 2) * 18;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx + 4, ly - 4, 4, 0, 7); ctx.fill();
      ctx.fillStyle = "#1c2230"; ctx.fillText(lab, lx + 13, ly);
    });
    y += 40;
    ctx.fillStyle = "#1c2230"; ctx.font = `500 11px ${SANS}`; ctx.fillText("점 크기 = 톤수", x0 + 16, y);
    [[0, "1톤"], [3, "5톤"], [5, "100톤"], [7, "1만 톤"]].forEach(([k, t], i) => {
      const lx = x0 + 110 + i * 56;
      ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(lx, y - 4, RAD[k], 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(28,34,48,.75)"; ctx.font = `500 10px ${MONO}`; ctx.fillText(t, lx + RAD[k] + 4, y);
    });
    y += 14;
    [[BAND3, "해안에서 3해리(5.6km)"], [BAND12, "12해리(22km)"]].forEach(([c, t], i) => {
      const lx = x0 + 16 + i * 150;
      ctx.fillStyle = c; ctx.fillRect(lx, y + 4, 14, 10); ctx.strokeStyle = "rgba(29,53,87,.3)"; ctx.strokeRect(lx + 0.5, y + 4.5, 13, 9);
      ctx.fillStyle = "#1c2230"; ctx.font = `500 10.5px ${SANS}`; ctx.fillText(t, lx + 19, y + 13);
    });
    // no-ship shore deaths vs vessel deaths
    y += 34;
    ctx.strokeStyle = MAG; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.strokeRect(x0 + 12.5, y - 8.5, cw - 25, h - 24 - y + 2); ctx.setLineDash([]);
    ctx.fillStyle = MAG; ctx.font = `700 12.5px ${SANS}`; ctx.fillText(`배 없는 바닷가에서도 숨진다 · ${d.y0}–${d.y0 + 4}`, x0 + 22, y + 10);
    const rowsC = [["선박 사고 사망", d.dead, NAVY], ["연안사고 사망 (배 없음)", d.coastal.deadTotal, MAG]];
    const cm = Math.max(d.dead, d.coastal.deadTotal);
    rowsC.forEach(([lab, v, col], i) => {
      const yy = y + 26 + i * 22;
      ctx.fillStyle = "#1c2230"; ctx.font = `500 11px ${SANS}`; ctx.fillText(lab, x0 + 22, yy + 9);
      const bw = (v / cm) * (cw - 250) * a;
      ctx.fillStyle = col; ctx.fillRect(x0 + 168, yy, bw, 11);
      ctx.font = `600 11px ${MONO}`; ctx.fillText(`${KF.fmt(v)}명`, x0 + 172 + bw, yy + 10);
    });
    ctx.fillStyle = "rgba(28,34,48,.7)"; ctx.font = `500 10px ${SANS}`;
    ctx.fillText(`연안사고 = 갯벌·갯바위·방파제의 익수 ${KF.fmt(d.coastal.dead[0])} · 추락 ${KF.fmt(d.coastal.dead[1])} · 고립 ${KF.fmt(d.coastal.dead[2])}명`, x0 + 22, y + 82);
    // per year: ship deaths (navy) vs shore deaths (magenta)
    const by = h - 46, bh = Math.min(40, by - (y + 104)), ym = Math.max(...d.yearDead, ...d.coastYearDead);
    if (bh > 20) {
      const colW = (cw - 60) / d.years.length;
      d.years.forEach((yr, i) => {
        const cx = x0 + 30 + i * colW + colW / 2;
        [[d.yearDead[i], NAVY, -7], [d.coastYearDead[i], MAG, 1]].forEach(([v, col, dx]) => {
          const hh = (v / ym) * bh * a;
          ctx.fillStyle = col; ctx.fillRect(cx + dx, by - hh, 6, hh);
        });
        ctx.fillStyle = "rgba(28,34,48,.7)"; ctx.font = `500 9.5px ${MONO}`; ctx.textAlign = "center";
        ctx.fillText(String(yr), cx, by + 12);
        ctx.fillText(`${KF.fmt(d.yearDead[i])}·${KF.fmt(d.coastYearDead[i])}`, cx, by - bh - 4);
      });
      ctx.textAlign = "left";
    }
  }

  function phoneNotes(ctx, w, h, L, d, stats) {
    const y0 = L.area[3] + 8;
    ctx.fillStyle = "rgba(250,252,251,.92)"; ctx.fillRect(0, y0 - 6, w, h - y0 + 6);
    ctx.textAlign = "left"; ctx.fillStyle = NAVY; ctx.font = `700 13px ${SANS}`;
    ctx.fillText(`보이는 배 ${KF.fmt(stats.n)}척 · 사망·실종 ${KF.fmt(stats.dm)}명`, 12, y0 + 12);
    const sink = d.grp[6], total = d.n;
    ctx.fillStyle = "#1c2230"; ctx.font = `500 11.5px ${SANS}`;
    ctx.fillText(`가장 흔한 사고: 기관·설비 고장 ${KF.fmt((d.grp[0][1] / total) * 100, 0)}% · 어선 ${KF.fmt((d.use[0][1] / total) * 100, 0)}%`, 12, y0 + 32);
    ctx.fillText(`사망·실종의 ${KF.fmt((d.grp[5][2] / (d.dead + d.miss)) * 100, 0)}%는 선상 안전사고`, 12, y0 + 50);
    ctx.fillStyle = MAG; ctx.font = `600 11.5px ${SANS}`;
    ctx.fillText(`배 없는 바닷가 사망 ${KF.fmt(d.coastal.deadTotal)}명 > 선박 사고 사망 ${KF.fmt(d.dead)}명`, 12, y0 + 70);
    ctx.fillStyle = "rgba(28,34,48,.65)"; ctx.font = `500 10px ${MONO}`;
    ctx.fillText(`${d.y0}–${d.y0 + 4} · 점 = 사고 난 배 (크기 = 톤수)`, 12, y0 + 88);
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `600 12.5px ${SANS}`;
    let bw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${SANS}`;
    lines.slice(1).forEach((l) => { bw = Math.max(bw, ctx.measureText(l).width); });
    bw += 22; const bh = 12 + lines.length * 17;
    const bx = KF.clamp(x + 12, 4, w - bw - 4), by = KF.clamp(y - bh - 10, 4, h - bh - 4);
    ctx.fillStyle = "rgba(252,253,252,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = MAG; ctx.fillRect(bx, by, 3, bh);
    lines.forEach((l, i) => { ctx.fillStyle = i ? "#1c2230" : NAVY; ctx.font = i ? `500 11px ${SANS}` : `600 12.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(l, bx + 12, by + 18 + i * 17); });
  }

  // ------------------------------------------------------------ thumb
  let TL = null;
  function thumb(ctx, w, h, t, d) {
    const dec = decode(d), L = layout(w, h, "thumb"), c = t % 10;
    ctx.drawImage(chart(L, dec, w, h), 0, 0, w, h);
    if (!TL || TL.w !== w || TL.h !== h || c < TL.c) TL = { w, h, c: 0, lay: makeLayer(w, h) };
    TL.c = c;
    const upto = KF.clamp((c - 0.2) / 2.6, 0, 1) * 60, fade = c > 9 ? 1 - (c - 9) : 1, g = TL.lay.g;
    g.globalAlpha = 0.4;
    while (TL.lay.upto < dec.P.length && dec.P[TL.lay.upto].ym < upto) {
      const p = dec.P[TL.lay.upto++], [x, y] = L.px(p.lon, p.lat), r = 0.6 + p.ton * 0.22;
      g.fillStyle = CLS[p.c][1]; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    ctx.globalAlpha = fade; ctx.drawImage(TL.lay.c, 0, 0, w, h); ctx.globalAlpha = 1;
    // right panel
    const x0 = L.area[2] + 14, a = KF.clamp((c - 2.4) / 0.6, 0, 1) * fade;
    ctx.fillStyle = "rgba(250,252,251,.88)"; ctx.fillRect(L.area[2], 0, w - L.area[2], h);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L.area[2] + 0.5, 0); ctx.lineTo(L.area[2] + 0.5, h); ctx.stroke();
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = NAVY; ctx.font = `600 ${Math.round(h * 0.058)}px ${SANS}`; ctx.fillText("사고 난 배 가운데 침몰", x0, h * 0.3);
    ctx.fillStyle = MAG; ctx.font = `700 ${Math.round(h * 0.2)}px ${SANS}`; ctx.fillText(`${KF.fmt((d.sink / d.n) * 100, 1)}%`, x0, h * 0.52);
    ctx.fillStyle = "#1c2230"; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText(`기관·설비 고장 ${KF.fmt((d.grp[0][1] / d.n) * 100, 0)}%`, x0, h * 0.66);
    ctx.fillText(`어선 ${KF.fmt((d.use[0][1] / d.n) * 100, 0)}% · 레저 ${KF.fmt((d.use[1][1] / d.n) * 100, 0)}%`, x0, h * 0.75);
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ mount
  function mount(stage, controls, d) {
    const dec = decode(d), s = KF.canvas(stage);
    let acc = "all", ves = "all", t0 = performance.now(), hover = null, layer = null, lkey = "", tFilter = 0;
    const reset = () => { layer = null; };
    KF.segment(controls, [{ id: "all", label: "모든 사고" }, { id: "fault", label: "고장" }, { id: "fatal", label: "사망·실종" }, { id: "sink", label: "침몰" }], acc, (id) => { acc = id; reset(); tFilter = performance.now(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = " 배:"; controls.appendChild(sep);
    KF.segment(controls, [{ id: "all", label: "모든 배" }, { id: "fish", label: "어선" }, { id: "leisure", label: "수상레저" }, { id: "big", label: "1,000톤 이상" }], ves, (id) => { ves = id; reset(); tFilter = performance.now(); });
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });
    s.onresize = reset;

    const statsFor = () => {
      const A = ACC[acc], V = VES[ves], grp = d.groups.map(() => [0, 0]);
      let n = 0, dm = 0;
      for (const p of dec.P) {
        if (!V(p) || !A(p)) continue;
        grp[p.g][0]++; grp[p.g][1] += p.dm; n++; dm += p.dm;
      }
      return { n, dm, grp };
    };
    let stats = statsFor(), skey = "";

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, L = layout(w, h, full ? "full" : "phone");
      const el = (performance.now() - t0) / 1000;
      ctx.drawImage(chart(L, dec, w, h), 0, 0, w, h);
      const key = `${w}x${h}|${acc}|${ves}`;
      if (key !== skey) { stats = statsFor(); skey = key; }
      if (!layer || lkey !== key) { layer = makeLayer(w, h); lkey = key; }
      // incremental: add points up to the current month
      const upto = KF.clamp(el / 3.4, 0, 1) * 60, A = ACC[acc], V = VES[ves];
      const sc = full ? 1 : 0.8, g = layer.g;
      g.save(); g.beginPath(); g.rect(L.area[0], L.area[1], L.area[2] - L.area[0], L.area[3] - L.area[1]); g.clip();
      g.globalAlpha = acc === "all" || acc === "fault" ? 0.32 : 1;
      while (layer.upto < dec.P.length && dec.P[layer.upto].ym < upto) {
        const p = dec.P[layer.upto], i = layer.upto++;
        if (!A(p) || !V(p)) continue;
        const [x, y] = L.px(p.lon, p.lat);
        mark(g, p, x, y, sc, acc);
        const gk = `${Math.floor(x / 8)},${Math.floor(y / 8)}`;
        (layer.grid.get(gk) || layer.grid.set(gk, []).get(gk)).push([i, x, y]);
      }
      g.restore();
      ctx.drawImage(layer.c, 0, 0, w, h);
      if (CH_PATH) { ctx.save(); ctx.beginPath(); ctx.rect(L.area[0], L.area[1], L.area[2] - L.area[0], L.area[3] - L.area[1]); ctx.clip();
        ctx.strokeStyle = "rgba(79,74,56,.55)"; ctx.lineWidth = 0.6; ctx.stroke(CH_PATH); ctx.restore(); }
      // time stamp during the intro
      if (upto < 60 && full) {
        const m = Math.floor(upto), yy = d.y0 + Math.floor(m / 12), mm = (m % 12) + 1;
        ctx.fillStyle = NAVY; ctx.font = `600 13px ${MONO}`; ctx.textAlign = "left";
        ctx.fillText(`${yy}.${String(mm).padStart(2, "0")}`, L.area[0] + 16, L.area[1] + 26);
      }
      const a = KF.clamp((el - 2.4) / 0.8, 0, 1);
      if (full) cartouche(ctx, w, h, L, d, dec, acc, ves, stats, a);
      else phoneNotes(ctx, w, h, L, d, stats);
      // hover: nearest visible mark
      if (hover && full && upto >= 60) {
        let best = null, bd = 49;
        const cx = Math.floor(hover[0] / 8), cy = Math.floor(hover[1] / 8);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          for (const [i, x, y] of layer.grid.get(`${cx + dx},${cy + dy}`) || []) {
            const dd = (x - hover[0]) ** 2 + (y - hover[1]) ** 2;
            if (dd < bd) { bd = dd; best = [i, x, y]; }
          }
        }
        if (best) {
          const [i, x, y] = best, p = dec.P[i];
          ctx.strokeStyle = MAG; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, RAD[p.ton] + 4, 0, 7); ctx.stroke();
          const yy = d.y0 + Math.floor(p.ym / 12), mm = (p.ym % 12) + 1;
          const lines = [`${yy}년 ${mm}월 · ${d.types[p.t]}`, `${d.uses[p.use]} · ${d.tons[p.ton]}`,
            p.dm ? `사망·실종 ${p.dm}명` : "사망·실종 없음", `북위 ${KF.fmt(p.lat, 2)}° · 동경 ${KF.fmt(p.lon, 2)}°`];
          tip(ctx, w, h, x, y, lines);
        }
      }
    });
  }

  VIZ.sea = { thumb, mount, bg: BG };
})();
