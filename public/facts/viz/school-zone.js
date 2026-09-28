// 23 school-zone — "Yellow road". A school-zone street seen from above. Each zebra stripe is one year
// (or age, month, region); its painted length = children hurt, layered by severity; a small white flower
// below the stripe for every child killed. Red pavement, yellow curb lines, children in yellow caps crossing.
(() => {
  const BG = "#3a3a3c";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  const YEL = "#f2c230", WHITE = "#efede5", GREYP = "#9a9994", RED = "#e0402f", REDROAD = "#8c3a31";
  const SEV = [RED, YEL, WHITE, GREYP]; // death, serious, minor, report
  const SEV_NAME = ["사망", "중상", "경상", "부상신고"];
  const hash = (i) => { const x = Math.sin(i * 91.345 + 7.7) * 43758.5453; return x - Math.floor(x); };

  // ------------------------------------------------------------ textures (made once)
  let TEX = null;
  function textures() {
    if (TEX) return TEX;
    const mk = (n, dark, light) => {
      const c = document.createElement("canvas"); c.width = c.height = 128;
      const g = c.getContext("2d");
      for (let i = 0; i < n; i++) {
        const x = hash(i) * 128, y = hash(i + 999) * 128, r = 0.4 + hash(i + 77) * 0.9, lt = hash(i + 5) < light;
        g.fillStyle = lt ? `rgba(255,255,255,${0.05 + hash(i + 3) * 0.09})` : `rgba(0,0,0,${dark * (0.4 + hash(i + 8) * 0.6)})`;
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }
      return c;
    };
    TEX = { road: mk(1400, 0.22, 0.5), wear: mk(700, 0.3, 0) };
    return TEX;
  }

  // ------------------------------------------------------------ geometry
  function geom(w, h, mode) {
    const full = mode === "full", thumb = mode === "thumb";
    const SW = thumb ? 12 : full ? 40 : 14;
    const base = h - (thumb ? 72 : full ? 150 : 136);
    const top = thumb ? 30 : full ? 96 : 110;
    const pad = thumb ? 16 : full ? 34 : 14;
    return {
      full, thumb, mode, SW, base, top, x0: SW + pad, x1: w - SW - pad,
      band: thumb ? 16 : full ? 30 : 24,
      labelY: base + (thumb ? 0 : full ? 48 : 36),
      stopY: base + (thumb ? 24 : full ? 76 : 52),
      redY: base + (thumb ? 34 : full ? 86 : 62),
    };
  }

  // ------------------------------------------------------------ static street
  function street(ctx, w, h, G) {
    const T = textures();
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = REDROAD; ctx.fillRect(G.SW, G.redY, w - 2 * G.SW, h - G.redY);
    ctx.fillStyle = ctx.createPattern(T.road, "repeat"); ctx.fillRect(G.SW, 0, w - 2 * G.SW, h);
    // sidewalks with paving blocks and curbs
    for (const x of [0, w - G.SW]) {
      ctx.fillStyle = "#77746d"; ctx.fillRect(x, 0, G.SW, h);
      ctx.strokeStyle = "rgba(40,38,34,.35)"; ctx.lineWidth = 1;
      const step = G.full ? 20 : 12;
      for (let y = 0, k = 0; y < h; y += step, k++) {
        ctx.beginPath(); ctx.moveTo(x, y + 0.5); ctx.lineTo(x + G.SW, y + 0.5); ctx.stroke();
        const mx = x + (k % 2 ? G.SW * 0.33 : G.SW * 0.66);
        ctx.beginPath(); ctx.moveTo(mx + 0.5, y); ctx.lineTo(mx + 0.5, y + step); ctx.stroke();
      }
      ctx.fillStyle = "#b9b5ab"; ctx.fillRect(x === 0 ? G.SW - 3 : x, 0, 3, h);
    }
    // yellow double lines along both curbs (no stopping in a school zone)
    ctx.fillStyle = YEL;
    const lw = G.full ? 2.2 : 1.5, off = G.full ? 6 : 3;
    for (const x of [G.SW + off, G.SW + off + lw * 2.2, w - G.SW - off - lw, w - G.SW - off - lw * 3.2]) ctx.fillRect(x, 0, lw, h);
    // stop line
    ctx.fillStyle = WHITE; ctx.fillRect(G.SW + (G.full ? 18 : 10), G.stopY, w - 2 * G.SW - (G.full ? 36 : 20), G.full ? 6 : 4);
    // painted words on the red pavement, stretched along the driving direction
    const ry = G.redY, rh = h - G.redY;
    if (rh > 20) {
      ctx.save();
      ctx.fillStyle = "rgba(240,236,226,.88)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const fs = Math.min(rh * 0.42, G.full ? 26 : 18);
      ctx.translate(w / 2 - (G.full ? 40 : G.thumb ? 20 : 26), ry + rh / 2 + 1); ctx.scale(1, 1.45);
      ctx.font = `800 ${fs}px ${SANS}`; ctx.fillText("어린이보호구역", 0, 0);
      ctx.restore();
      const cx = w / 2 + (G.full ? 150 : G.thumb ? 72 : 96), cy = ry + rh / 2, r = Math.min(rh * 0.36, G.full ? 20 : 14);
      ctx.strokeStyle = "rgba(240,236,226,.88)"; ctx.lineWidth = G.full ? 3 : 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 1.2, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = "rgba(240,236,226,.88)"; ctx.font = `800 ${r * 1.05}px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.save(); ctx.translate(cx, cy + 1); ctx.scale(1, 1.25); ctx.fillText("30", 0, 0); ctx.restore();
      ctx.textBaseline = "alphabetic";
    }
  }

  // ------------------------------------------------------------ data per view: [{key, label, parts[], value, flowers, note}]
  function items(view, d) {
    if (view === "year") return d.years.map((y) => {
      const c = d.cas[y], v = c.reduce((a, b) => a + b, 0);
      return { key: y, label: String(y), short: `'${String(y).slice(2)}`, parts: c, value: v, flowers: c[0], hatched: y === 2025 };
    });
    if (view === "age") return d.ages.map((a) => ({ key: a[0], label: `${a[0]}세`, short: String(a[0]), parts: a.slice(1, 5), value: a[1] + a[2] + a[3] + a[4], flowers: a[1], sex: [a[5], a[6]] }));
    if (view === "month") return d.months.map((v, i) => ({ key: i + 1, label: `${i + 1}월`, short: String(i + 1), parts: [0, 0, v, 0], value: v, flowers: 0, vac: [0, 1, 7].includes(i) }));
    return d.regions.map(([name, acc, zones]) => ({ key: name, label: name, short: name, parts: [0, 0, (acc / zones) * 100, 0], value: (acc / zones) * 100, acc, zones, flowers: 0 }));
  }
  const fmtV = (view, v) => (view === "region" ? KF.fmt(v, 1) : KF.fmt(v));

  function flowerFit(sw, band, maxD, fsMax) {
    for (let fs = fsMax; fs >= 3.5; fs -= 0.5) {
      const cols = Math.max(1, Math.floor(sw / fs)), rows = Math.ceil(maxD / cols);
      if (rows * fs <= band) return { fs, cols };
    }
    return { fs: 3.5, cols: Math.max(1, Math.floor(sw / 3.5)) };
  }

  function flower(ctx, x, y, r, a) {
    ctx.globalAlpha = a;
    ctx.fillStyle = "#f7f4ea";
    for (let k = 0; k < 5; k++) {
      const an = (k / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath(); ctx.arc(x + Math.cos(an) * r * 0.5, y + Math.sin(an) * r * 0.5, r * 0.46, 0, 7); ctx.fill();
    }
    ctx.fillStyle = YEL; ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // draw the stripes; returns hit-testing geometry
  function paint(ctx, w, h, G, view, d, p, hoverKey) {
    const T = textures(), its = items(view, d), n = its.length;
    const pitch = (G.x1 - G.x0) / n, sw = Math.max(5, pitch * (G.full ? 0.64 : 0.66));
    const vmax = Math.max(...its.map((it) => it.value)) * 1.06;
    const H = G.base - G.top;
    const maxD = Math.max(1, ...its.map((it) => it.flowers));
    const ff = flowerFit(sw, G.band - 4, maxD, G.full ? 9 : G.thumb ? 5 : 6.5);
    const geo = [];
    its.forEach((it, i) => {
      const cx = G.x0 + pitch * (i + 0.5), x = cx - sw / 2;
      const k = KF.ease(KF.clamp(p * 1.8 - (i / n) * 0.8, 0, 1));
      const full = (it.value / vmax) * H;
      let y = G.base;
      ctx.fillStyle = "rgba(240,238,230,.055)"; ctx.fillRect(x, G.top - 14, sw, G.base - G.top + 14); // worn full-length zebra paint
      ctx.globalAlpha = it.hatched ? 0.5 : 0.96;
      it.parts.forEach((v, j) => {
        const hh = (v / vmax) * H * k;
        if (hh <= 0) return;
        ctx.fillStyle = SEV[j]; ctx.fillRect(x, y - hh, sw, hh);
        y -= hh;
      });
      ctx.globalAlpha = 1;
      // worn paint
      ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = ctx.createPattern(T.wear, "repeat"); ctx.fillRect(x, y, sw, G.base - y); ctx.restore();
      if (it.hatched && k > 0) { // recording changed: hatched, dashed outline
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, sw, G.base - y); ctx.clip();
        ctx.strokeStyle = "rgba(58,58,60,.55)"; ctx.lineWidth = 2;
        for (let t = -sw; t < G.base - y + sw; t += 7) { ctx.beginPath(); ctx.moveTo(x, y + t); ctx.lineTo(x + sw, y + t - sw); ctx.stroke(); }
        ctx.restore();
        ctx.strokeStyle = WHITE; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2; ctx.strokeRect(x + 0.5, y + 0.5, sw - 1, G.base - y - 1); ctx.setLineDash([]);
      }
      // flowers for children killed
      if (it.flowers && p > 0.55) {
        const a = KF.clamp((p - 0.55) / 0.3, 0, 1);
        const cols = Math.min(ff.cols, it.flowers), gx = cx - (cols * ff.fs) / 2 + ff.fs / 2;
        for (let f = 0; f < it.flowers; f++) {
          flower(ctx, gx + (f % cols) * ff.fs, G.base + 4 + ff.fs / 2 + Math.floor(f / cols) * ff.fs, ff.fs * 0.5, a * KF.clamp(a * it.flowers - f + 1, 0, 1));
        }
      }
      if (hoverKey === it.key) { ctx.strokeStyle = YEL; ctx.lineWidth = 2; ctx.strokeRect(x - 3, G.base - full - 3, sw + 6, full + 6); }
      geo.push({ it, cx, x, top: G.base - full, sw });
    });
    return { geo, pitch, sw, vmax, its };
  }

  function labels(ctx, w, G, view, P, pa) {
    ctx.globalAlpha = pa;
    const { geo, pitch } = P;
    ctx.textAlign = "center";
    const small = pitch < 34;
    geo.forEach(({ it, cx, top }, i) => {
      // axis label under the flowers
      ctx.fillStyle = "rgba(240,238,230,.8)";
      if (view === "region" && small) { // stack two syllables vertically on phones
        ctx.font = `600 9.5px ${SANS}`;
        [...it.label].forEach((ch, k) => ctx.fillText(ch, cx, G.base + 14 + k * 10.5));
      } else {
        ctx.font = view === "region" ? `600 ${G.full ? 11 : 9.5}px ${SANS}` : `500 ${G.full ? 10.5 : 9.5}px ${MONO}`;
        ctx.fillText(small ? it.short : it.label, cx, G.labelY);
      }
      if (it.vac) { ctx.fillStyle = YEL; ctx.font = `600 ${G.full ? 10.5 : 9}px ${SANS}`; ctx.fillText("방학", cx, G.labelY + (G.full ? 15 : 12)); }
      // value on top of the stripe
      const showVal = G.full || pitch >= 36 || (view === "month" && pitch >= 22) || i === 0 || i === geo.length - 1 ||
        (view === "year" && [2019, 2024].includes(it.key)) || (view === "age" && it.key === 7);
      if (showVal) {
        ctx.fillStyle = it.hatched ? "rgba(240,238,230,.75)" : "#f5f3ea";
        ctx.font = `600 ${G.full ? 11 : 9.5}px ${MONO}`;
        ctx.fillText(fmtV(view, it.value) + (it.hatched ? "*" : ""), cx, top - 6);
      }
    });
    ctx.globalAlpha = 1;
  }

  // view-specific annotations painted on the asphalt
  function notes(ctx, w, G, view, d, P, pa) {
    ctx.globalAlpha = pa;
    const { geo, pitch } = P;
    if (view === "year") {
      const i20 = geo.findIndex((g) => g.it.key === 2020), lx = G.x0 + pitch * i20;
      ctx.strokeStyle = YEL; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(lx, G.top - (G.full ? 30 : 22)); ctx.lineTo(lx, G.base + G.band); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = YEL; ctx.textAlign = "left"; ctx.font = `700 ${G.full ? 12 : 10.5}px ${SANS}`;
      ctx.fillText("민식이법 시행 2020.3", lx + 6, G.top - (G.full ? 20 : 13));
      if (G.full) {
        const pre = geo.filter((g) => g.it.key <= 2019), post = geo.filter((g) => g.it.key >= 2020 && g.it.key <= 2024);
        const H = G.base - G.top;
        [[pre, d.avg.pre], [post, d.avg.post]].forEach(([gs, a]) => {
          const xa = gs[0].x - 4, xb = gs[gs.length - 1].x + gs[gs.length - 1].sw + 4, y = G.base - (a[2] / P.vmax) * H;
          ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
          ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke(); ctx.setLineDash([]);
          // deaths bracket under the year labels
          const by = G.labelY + 14;
          ctx.strokeStyle = "rgba(240,238,230,.45)"; ctx.beginPath(); ctx.moveTo(xa, by - 4); ctx.lineTo(xa, by); ctx.lineTo(xb, by); ctx.lineTo(xb, by - 4); ctx.stroke();
          ctx.fillStyle = BG; ctx.font = `600 11px ${SANS}`; ctx.textAlign = "center";
          const tt = `한 해 평균 · 사상자 ${KF.fmt(a[2])}명(점선) · 숨진 어린이 ${KF.fmt(a[0], 1)}명`, ttw = ctx.measureText(tt).width + 12;
          ctx.fillRect((xa + xb) / 2 - ttw / 2, by - 6, ttw, 14);
          ctx.fillStyle = "#f7f4ea"; ctx.fillText(tt, (xa + xb) / 2, by + 5);
        });
      }
      const g25 = geo.find((g) => g.it.key === 2025);
      if (g25 && G.full) {
        ctx.fillStyle = "rgba(240,238,230,.85)"; ctx.font = `500 10px ${SANS}`; ctx.textAlign = "right";
        ctx.fillText("* 2025년부터 보호구역 여부 확인이", g25.x + g25.sw, g25.top - 34);
        ctx.fillText("시스템화되어 집계가 늘었다", g25.x + g25.sw, g25.top - 21);
      }
    }
    if (view === "age" && G.full) {
      const a = geo.find((g) => g.it.key === 7), b = geo.find((g) => g.it.key === 8);
      const y = Math.min(a.top, b.top) - 30;
      ctx.strokeStyle = YEL; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(a.x, y + 6); ctx.lineTo(a.x, y); ctx.lineTo(b.x + b.sw, y); ctx.lineTo(b.x + b.sw, y + 6); ctx.stroke();
      ctx.fillStyle = YEL; ctx.font = `700 12px ${SANS}`; ctx.textAlign = "center";
      ctx.fillText("초등학교 1–2학년 나이", (a.x + b.x + b.sw) / 2, y - 8);
    }
    ctx.globalAlpha = 1;
  }

  function caption(ctx, w, G, view, d) {
    const A = d.avg;
    const T = {
      year: ["스쿨존에서 다치거나 숨진 어린이 · 해마다", G.full ? "12세 이하 · 줄 길이 = 사상자 수 · 흰 꽃 = 숨진 어린이 1명" : `사망 한 해 ${A.pre[0]} → ${A.post[0]}명 · 사상자 ${A.pre[2]} → ${A.post[2]}명`],
      age: ["몇 살 아이가 다치나 · 2011–2021년 합계", G.full ? "줄 하나 = 나이 하나 · 줄 길이 = 사상자 수 · 흰 꽃 = 숨진 어린이 1명" : "7–8세가 가장 많다 · 흰 꽃 = 숨진 어린이"],
      month: ["2025년 달마다 스쿨존 어린이 사고", G.full ? "줄 길이 = 사고 건수 · 노란 글씨 = 방학이 낀 달" : "줄 길이 = 사고 건수 · 노랑 = 방학"],
      region: ["보호구역 100곳당 2025년 사고", G.full ? "줄 길이 = 사고 건수 ÷ 보호구역 수 × 100 · 시도경찰청 기준" : "사고 ÷ 보호구역 × 100 · 시도경찰청"],
    }[view];
    ctx.textAlign = "left"; ctx.fillStyle = "#f7f4ea"; ctx.font = `700 ${G.full ? 15 : 13}px ${SANS}`;
    const x = G.SW + (G.full ? 22 : 12);
    ctx.fillText(T[0], x, G.full ? 30 : 26);
    ctx.fillStyle = "rgba(240,238,230,.72)"; ctx.font = `500 ${G.full ? 11 : 10.5}px ${G.full ? MONO : SANS}`;
    ctx.fillText(T[1], x, G.full ? 50 : 46);
    if (!G.full && (view === "year" || view === "age")) { // compact legend row on phones
      let lx = x; const ly = 66;
      ctx.font = `500 9.5px ${SANS}`;
      SEV.forEach((c, j) => { ctx.fillStyle = c; ctx.fillRect(lx, ly - 7, 8, 8); ctx.fillStyle = "rgba(240,238,230,.8)"; ctx.fillText(SEV_NAME[j], lx + 11, ly); lx += ctx.measureText(SEV_NAME[j]).width + 22; });
    }
    if (G.full && (view === "year" || view === "age")) {
      let lx = w - G.SW - 22; const ly = 30;
      ctx.font = `500 11px ${SANS}`; ctx.textAlign = "right";
      const items = [["숨진 어린이 1명", null], ...SEV.map((c, j) => [SEV_NAME[j], c]).reverse()];
      items.forEach(([t, c]) => {
        ctx.fillStyle = "rgba(240,238,230,.85)"; ctx.fillText(t, lx, ly); lx -= ctx.measureText(t).width + 5;
        if (c) { ctx.fillStyle = c; ctx.fillRect(lx - 9, ly - 9, 9, 10); lx -= 9; }
        else { flower(ctx, lx - 5, ly - 4, 5, 1); lx -= 11; }
        lx -= 14;
      });
    }
  }

  // children in yellow caps, seen from above
  const PACKS = ["#d9433a", "#2f6fb0", "#3f8f55"];
  function kid(ctx, x, y, s, k, dir, step) {
    const bob = Math.sin(step * 9 + k) * s * 0.08;
    ctx.save(); ctx.translate(x, y + bob);
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(1.5, 2, s * 0.62, s * 0.46, 0, 0, 7); ctx.fill();
    ctx.fillStyle = PACKS[k % 3]; ctx.fillRect(-dir * s * 0.62 - s * 0.2, -s * 0.34, s * 0.4, s * 0.68);
    ctx.fillStyle = ["#f1f0ea", "#8fb6d9", "#e8a3a0"][k % 3];
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.36, s * 0.55, 0, 0, 7); ctx.fill();
    ctx.fillStyle = YEL; ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(dir * s * 0.3, 0, s * 0.16, s * 0.24, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  function kids(ctx, w, G, t, loop) {
    const s = G.full ? 12 : G.thumb ? 8 : 9, dur = G.full ? 4.6 : 4.2;
    [0, 0.5, 1.1].forEach((delay, k) => {
      const y = G.base - (G.full ? 16 : 10) - k * (G.full ? 17 : 11);
      let u = (t - delay) / dur;
      if (loop) u = ((t - delay) % 9) / dur;
      const x = u <= 0 ? G.SW / 2 + k * 2 : u >= 1 ? w - G.SW / 2 - k * 2 : KF.lerp(G.SW / 2, w - G.SW / 2, u);
      if (G.mode === "phone" && (u <= 0 || u >= 1)) return; // sidewalk too narrow to stand on
      kid(ctx, x, y, s, k, 1, u > 0 && u < 1 ? t : 0);
    });
  }

  function sign(ctx, w, h, x, y, lines) {
    ctx.font = `700 13px ${SANS}`;
    let bw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11.5px ${SANS}`;
    lines.slice(1).forEach((l) => { bw = Math.max(bw, ctx.measureText(l).width); });
    bw += 26; const bh = 16 + lines.length * 18;
    const bx = KF.clamp(x + 16, 6, w - bw - 6), by = KF.clamp(y - bh - 12, 6, h - bh - 6);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(bx + 3, by + 4, bw, bh);
    ctx.fillStyle = YEL; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#1c1c1c"; ctx.lineWidth = 2.5; ctx.strokeRect(bx + 4, by + 4, bw - 8, bh - 8);
    ctx.fillStyle = "#1c1c1c"; ctx.textAlign = "left";
    lines.forEach((l, i) => { ctx.font = i ? `500 11.5px ${SANS}` : `700 13px ${SANS}`; ctx.fillText(l, bx + 13, by + 22 + i * 18); });
  }

  // ------------------------------------------------------------ thumb
  function thumb(ctx, w, h, t, d) {
    const G = geom(w, h, "thumb"), c = t % 10;
    street(ctx, w, h, G);
    const out = c > 9 ? 1 - (c - 9) : 1;
    ctx.globalAlpha = out;
    const P = paint(ctx, w, h, G, "year", d, KF.clamp((c - 0.2) / 2.6, 0, 1) * out, null);
    ctx.globalAlpha = 1;
    const a = KF.clamp((c - 2.2) / 0.5, 0, 1) * out;
    if (a > 0) {
      ctx.globalAlpha = a;
      const i20 = P.geo.findIndex((g) => g.it.key === 2020), lx = G.x0 + P.pitch * i20;
      ctx.strokeStyle = YEL; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(lx, G.top - 8); ctx.lineTo(lx, G.base + 14); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = YEL; ctx.font = `700 10px ${SANS}`; ctx.textAlign = "right"; ctx.fillText("민식이법 →", lx - 3, G.top - 2);
      ctx.fillStyle = "#f7f4ea"; ctx.font = `700 11px ${SANS}`; ctx.textAlign = "right";
      ctx.fillText("스쿨존 어린이 사상자 2011–2025", w - G.SW - 8, 18);
      ctx.globalAlpha = 1;
    }
    kids(ctx, w, G, c, true);
  }

  // ------------------------------------------------------------ mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let view = "year", t0 = performance.now(), tKids = performance.now(), hover = null;
    KF.segment(controls, [{ id: "year", label: "해마다" }, { id: "age", label: "나이별" }, { id: "month", label: "달마다 2025" }, { id: "region", label: "지역별 2025" }],
      view, (id) => { view = id; t0 = performance.now(); });
    const replay = document.createElement("button");
    replay.type = "button"; replay.textContent = "다시 칠하기";
    replay.onclick = () => { t0 = performance.now(); tKids = performance.now(); };
    controls.appendChild(replay);
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, G = geom(w, h, full ? "full" : "phone");
      const el = (performance.now() - t0) / 1000;
      street(ctx, w, h, G);
      const p = KF.clamp(el / 2.6, 0, 1);
      // hover target
      let hk = null, hitG = null;
      if (hover && full && p >= 1) {
        const its = items(view, d), pitch = (G.x1 - G.x0) / its.length;
        const i = Math.floor((hover[0] - G.x0) / pitch);
        if (i >= 0 && i < its.length && hover[1] > G.top - 40 && hover[1] < G.labelY + 20) hk = its[i].key;
      }
      const P = paint(ctx, w, h, G, view, d, p, hk);
      const pa = KF.clamp((el - 2.2) / 0.5, 0, 1);
      if (pa > 0) { labels(ctx, w, G, view, P, pa); notes(ctx, w, G, view, d, P, pa); }
      caption(ctx, w, G, view, d);
      kids(ctx, w, G, (performance.now() - tKids) / 1000, false);
      if (hk != null) {
        hitG = P.geo.find((g) => g.it.key === hk);
        const it = hitG.it;
        let lines;
        if (view === "year") {
          const c = it.parts, acc = d.acc[it.key];
          lines = [`${it.key}년 · 사상자 ${KF.fmt(it.value)}명`, `사망 ${c[0]} · 중상 ${KF.fmt(c[1])}`, `경상 ${KF.fmt(c[2])} · 부상신고 ${KF.fmt(c[3])}`];
          if (acc) lines.push(`사고 ${KF.fmt(acc)}건`);
          if (it.hatched) lines.push("* 집계 방식이 바뀐 해");
        } else if (view === "age") {
          const c = it.parts;
          lines = [`${it.label} · 2011–2021년`, `사상자 ${KF.fmt(it.value)}명 (사망 ${c[0]})`, `중상 ${KF.fmt(c[1])} · 경상 ${KF.fmt(c[2])} · 부상신고 ${KF.fmt(c[3])}`, `남자아이 ${KF.fmt(it.sex[0])} · 여자아이 ${KF.fmt(it.sex[1])}`];
        } else if (view === "month") {
          lines = [`2025년 ${it.label}`, `스쿨존 어린이 사고 ${KF.fmt(it.value)}건`];
          if (it.vac) lines.push("방학이 낀 달");
        } else {
          lines = [it.label, `2025년 사고 ${KF.fmt(it.acc)}건`, `보호구역 ${KF.fmt(it.zones)}곳 (2026 상반기)`, `100곳당 ${KF.fmt(it.value, 1)}건`];
        }
        sign(ctx, w, h, hover[0], Math.max(hover[1], hitG.top), lines);
      }
    });
  }

  VIZ["school-zone"] = { thumb, mount, bg: BG };
})();
