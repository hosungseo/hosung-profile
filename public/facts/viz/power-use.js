// 54 power-use — "전선 다발 단면". A bundled cable cut end-on: each use category is one conductor, its
// cross-section AREA (not radius) set to its share of electricity sold, packed inside one rubber jacket.
// The household wire is copper-coloured — small next to manufacturing's thick core. A month strip below
// shows the household wire is also the one that swells most in August.
(() => {
  const BG = "#12161a";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#e9edf0", DIM = "rgba(233,237,240,.62)", FAINT = "rgba(233,237,240,.14)";
  const COLOR = { "01_01": "#e0925a", "01_02": "#7a97a8", "01_03": "#9a8ec2", "01_04": "#8fae6a", "01_05": "#b08a6a", "01_06": "#5c6b78" };
  const HOME = "01_01", MFG = "01_06";

  let DEC = null;
  function decode(d) {
    if (DEC) return DEC;
    const byId = {}; for (const u of d.use) byId[u.id] = u;
    return (DEC = { years: d.years, use: d.use, byId, months: d.months, latest: d.latest, lowY: d.lowY });
  }

  // ---------------------------------------------------------------- circle packing (unit circle, deterministic)
  const packCache = new Map();
  function pack(D, year) {
    const key = year;
    if (packCache.has(key)) return packCache.get(key);
    const yi = D.years.indexOf(year);
    const items = D.use.map((u) => ({ id: u.id, v: Math.max(u.share[yi], 0.15) }));
    const rs = items.map((s) => Math.sqrt(s.v / 100));
    const P = items.map((s, i) => {
      const a = i * 2.399963, rad = 0.42 * Math.sqrt(i / items.length);
      return { id: s.id, r: rs[i] * 0.86, x: Math.cos(a) * rad, y: Math.sin(a) * rad };
    });
    for (let iter = 0; iter < 260; iter++) {
      for (let i = 0; i < P.length; i++) {
        for (let j = i + 1; j < P.length; j++) {
          let dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, dist = Math.hypot(dx, dy);
          const minD = P[i].r + P[j].r + 0.006;
          if (dist < minD) {
            if (dist < 1e-4) { dx = 0.001 * (i - j); dy = 0.001; dist = Math.hypot(dx, dy); }
            const push = (minD - dist) / 2, ux = dx / dist, uy = dy / dist;
            P[i].x -= ux * push; P[i].y -= uy * push; P[j].x += ux * push; P[j].y += uy * push;
          }
        }
      }
      for (const p of P) { p.x *= 0.997; p.y *= 0.997; }
    }
    for (const p of P) {
      const dc = Math.hypot(p.x, p.y), lim = 1 - p.r;
      if (dc + p.r > 1 && dc > 0) { const k = Math.max(0, lim) / dc; p.x *= k; p.y *= k; }
    }
    packCache.set(key, P);
    return P;
  }
  function lerpPack(a, b, t) {
    return b.map((pb) => { const pa = a.find((x) => x.id === pb.id) || pb; return { id: pb.id, r: KF.lerp(pa.r, pb.r, t), x: KF.lerp(pa.x, pb.x, t), y: KF.lerp(pa.y, pb.y, t) }; });
  }

  function shade(ctx, cx, cy, r, base) {
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r * 1.15);
    g.addColorStop(0, "#fff3"); g.addColorStop(0.35, base); g.addColorStop(1, "rgba(0,0,0,.35)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  }

  function drawBundle(ctx, D, P, cx, cy, R, hoverId, full, yi) {
    ctx.save();
    ctx.fillStyle = "#1c2126"; ctx.beginPath(); ctx.arc(cx, cy, R * 1.1, 0, 7); ctx.fill();
    const rim = ctx.createRadialGradient(cx - R * 0.5, cy - R * 0.6, R * 0.2, cx, cy, R * 1.15);
    rim.addColorStop(0, "rgba(255,255,255,.05)"); rim.addColorStop(0.8, "rgba(255,255,255,0)"); rim.addColorStop(1, "rgba(0,0,0,.3)");
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R * 1.1, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(233,237,240,.18)"; ctx.lineWidth = 1.4; ctx.stroke();
    for (const p of P) {
      const px = cx + p.x * R, py = cy + p.y * R, pr = Math.max(1.2, p.r * R);
      shade(ctx, px, py, pr, COLOR[p.id] || "#888");
      ctx.strokeStyle = p.id === HOME ? "#fff" : "rgba(15,18,20,.55)"; ctx.lineWidth = p.id === hoverId ? 2.4 : p.id === HOME ? 1.6 : 1;
      ctx.stroke();
      if (p.id === hoverId) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, pr + 3, 0, 7); ctx.stroke(); }
      if (full && pr > 20) {
        const u = D.byId[p.id];
        ctx.fillStyle = "#160f0a"; ctx.textAlign = "center";
        ctx.font = `700 ${Math.min(12, pr * 0.24)}px ${SANS}`;
        ctx.fillText(u.name, px, py - pr * 0.18);
        ctx.font = `700 ${Math.min(15, pr * 0.34)}px ${MONO}`;
        ctx.fillText(`${u.share[yi].toFixed(1)}%`, px, py + pr * 0.32);
      }
    }
    ctx.restore();
  }

  function monthPanel(ctx, D, box, hoverM, full) {
    const [x0, y0, w, h] = box, m = D.months, n = 12, bw = w / n;
    const mx = Math.max(...m.total);
    ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `600 ${full ? 11 : 10}px ${SANS}`;
    ctx.fillText(`${m.y}년, 달마다의 판매전력량`, x0, y0 - 8);
    ctx.textAlign = "right"; ctx.fillStyle = COLOR[HOME]; ctx.font = `600 ${full ? 10 : 9}px ${SANS}`;
    ctx.fillText("■ 가정용 몫", x0 + w, y0 - 8);
    const baseY = y0 + h;
    ctx.strokeStyle = FAINT; ctx.beginPath(); ctx.moveTo(x0, baseY); ctx.lineTo(x0 + w, baseY); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const xx = x0 + i * bw, hh = (m.total[i] / mx) * h, hb = (m.home[i] / mx) * h;
      ctx.fillStyle = "rgba(122,151,168,.28)"; ctx.fillRect(xx + bw * 0.14, baseY - hh, bw * 0.72, hh);
      ctx.fillStyle = i === hoverM ? "#fff" : COLOR[HOME];
      ctx.fillRect(xx + bw * 0.14, baseY - hb, bw * 0.72, hb);
      if (i === hoverM) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.strokeRect(xx + bw * 0.14, baseY - hh, bw * 0.72, hh); }
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 9.5 : 8.5}px ${MONO}`; ctx.textAlign = "center";
      if (full || i % 2 === 0) ctx.fillText(String(i + 1), xx + bw / 2, baseY + 12);
    }
  }

  function tip(ctx, w, h, lines, p) {
    const fs = 11.5;
    ctx.font = `700 ${fs + 1}px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 ${fs}px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 10 + lines.length * (fs + 6);
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(16,19,22,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(233,237,240,.28)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = `${i ? 500 : 700} ${i ? fs : fs + 1}px ${SANS}`; ctx.fillText(t, bx + 11, by + 6 + (i + 1) * (fs + 6) - 3); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const D = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const P = pack(D, D.latest);
    const R = h * 0.38, cx = R + h * 0.14, cy = h * 0.52;
    const c = t % 10, grow = KF.ease(KF.clamp((c - 0.3) / 1.6, 0, 1));
    drawBundle(ctx, D, P.map((p) => ({ ...p, r: p.r * grow })), cx, cy, R, null, false);
    const x = cx + R + h * 0.16, a = KF.clamp((c - 1) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.078)}px ${SANS}`;
    ctx.fillText("가정용 전기는", x, h * 0.32);
    ctx.fillText("얼마나 될까", x, h * 0.32 + h * 0.09);
    ctx.fillStyle = COLOR[HOME]; ctx.font = `700 ${Math.round(h * 0.16)}px ${SANS}`;
    ctx.fillText(`${D.byId[HOME].share[D.byId[HOME].share.length - 1].toFixed(1)}%`, x, h * 0.68);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.048)}px ${SANS}`;
    ctx.fillText(`${D.latest}년 전체 판매전력량 중`, x, h * 0.8);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const D = decode(d), sc = KF.canvas(stage);
    let year = D.latest, hoverId = null, hoverM = null, hover = null;
    let curP = pack(D, year), prevP = curP, tSwitch = -9999, geo = null;
    KF.segment(controls, [
      { id: String(D.years[0]), label: `${D.years[0]}년` },
      { id: String(D.lowY), label: `가정용 최저 ${D.lowY}년` },
      { id: String(D.latest), label: `${D.latest}년` },
    ], String(D.latest), (id) => { if (+id === year) return; prevP = curP; year = +id; curP = pack(D, year); tSwitch = performance.now(); });

    const hitWire = (x, y) => {
      if (!geo) return null;
      const { cx, cy, R, P } = geo;
      let best = null, bd = 1e9;
      for (const p of P) {
        const px = cx + p.x * R, py = cy + p.y * R, pr = Math.max(1.2, p.r * R);
        const dd = Math.hypot(x - px, y - py);
        if (dd <= pr + 2 && dd < bd) { bd = dd; best = p.id; }
      }
      return best;
    };
    const hitMonth = (x, y) => {
      if (!geo || !geo.mbox) return null;
      const [x0, y0, w, h] = geo.mbox;
      if (x < x0 || x > x0 + w || y < y0 - 10 || y > y0 + h + 16) return null;
      return KF.clamp(Math.floor((x - x0) / (w / 12)), 0, 11);
    };
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top];
      hoverId = hitWire(...hover); hoverM = hoverId ? null : hitMonth(...hover);
    });
    stage.addEventListener("pointerleave", () => { hover = null; hoverId = null; hoverM = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520, now = performance.now();
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const el = (now - tSwitch) / 1000, t = KF.ease(KF.clamp(el / 0.75, 0, 1));
      const P = lerpPack(prevP, curP, t);

      let cx, cy, R, mbox;
      if (full) { R = Math.min(h * 0.4, w * 0.19); cx = R + w * 0.05; cy = h * 0.46; mbox = [w * 0.05, h * 0.78, R * 2 + w * 0.02, h * 0.14]; }
      else { R = Math.min(w * 0.34, h * 0.28); cx = w * 0.5; cy = R + h * 0.05; mbox = [w * 0.08, h * 0.62, w * 0.84, h * 0.16]; }
      geo = { cx, cy, R, P, mbox };
      drawBundle(ctx, D, P, cx, cy, R, hoverId, full, D.years.indexOf(year));
      monthPanel(ctx, D, mbox, hoverM, full);

      if (full) {
        const x0 = cx + R + 56, pw = w - x0 - 30;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 21px ${SERIF}`;
        ctx.fillText("전선 다발의 단면", x0, 40);
        ctx.fillStyle = DIM; ctx.font = `500 12px ${SANS}`;
        ctx.fillText("굵기(단면적) = 판매전력량 비중 · 구리색 = 가정용", x0, 62);
        const i = D.years.indexOf(year), sorted = [...D.use].sort((a, b) => b.share[i] - a.share[i]);
        let ly = 92;
        for (const u of sorted) {
          const on = u.id === HOME || u.id === hoverId;
          ctx.fillStyle = COLOR[u.id]; ctx.fillRect(x0, ly - 10, 11, 11);
          ctx.fillStyle = on ? INK : DIM; ctx.font = `${on ? 700 : 500} 12.5px ${SANS}`;
          ctx.fillText(`${u.name}  ${u.share[i].toFixed(1)}%`, x0 + 17, ly);
          ly += 22;
        }
        ly += 6;
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`가정용 ÷ (제조업+광업) = 1 : ${((D.byId[MFG].share[i] + D.byId["01_05"].share[i]) / D.byId[HOME].share[i]).toFixed(1)}`, x0, ly);
      } else {
        const y0b = mbox[1] + mbox[3] + 30;
        const i = D.years.indexOf(year);
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 13px ${SANS}`;
        ctx.fillText(`${year}년 가정용 비중`, 14, y0b);
        ctx.fillStyle = COLOR[HOME]; ctx.font = `700 22px ${SANS}`;
        ctx.fillText(`${D.byId[HOME].share[i].toFixed(1)}%`, 14, y0b + 26);
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
        ctx.fillText(`제조업+광업의 1/${((D.byId[MFG].share[i] + D.byId["01_05"].share[i]) / D.byId[HOME].share[i]).toFixed(1)} 수준`, 14, y0b + 42);
      }
      if (hoverId && hover) {
        const i = D.years.indexOf(year), u = D.byId[hoverId];
        tip(ctx, w, h, [[u.name], [`${year}년 비중 ${u.share[i].toFixed(1)}%`, COLOR[hoverId]]], hover);
      } else if (hoverM != null && hover) {
        const m = D.months;
        tip(ctx, w, h, [[`${m.y}년 ${m.labels[hoverM]}`], [`전체 ${KF.fmt(m.total[hoverM])}GWh`, DIM], [`가정용 ${KF.fmt(m.home[hoverM])}GWh`, COLOR[HOME]], [`제조업 ${KF.fmt(m.mfg[hoverM])}GWh`, COLOR[MFG]]], hover);
      }
    });
  }

  VIZ["power-use"] = { thumb, mount, bg: BG };
})();
