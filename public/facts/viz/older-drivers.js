// 15 older-drivers — "면허증 더미". Driver-licence cards piled by age (1 card = 100,000 holders, 2019); a red bar on
// each 65+ pile = accidents per 1,000 licences (pile top = 10). Then 34 years of 65+ accidents, then returned licences.
(() => {
  const BG = "#dfe6e1", INK = "#1f2a26", MUTED = "rgba(31,42,38,.62)", RED = "#c8321e";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  const YOUNG = { body: "#f4f7f3", head: "#5f8f86", edge: "rgba(40,70,64,.42)" };
  const OLD = { body: "#fbefe3", head: "#d0763c", edge: "rgba(120,60,20,.45)" };
  const ACC = { body: "#fbefe3", head: RED, edge: "rgba(120,30,20,.5)" };
  const RET = { body: "#f1f1ec", head: "#7b7f86", edge: "rgba(60,60,70,.45)" };
  const ASPECT = 1.586; // ID-1 card

  // ---------------------------------------------------------------- one card, and a pile of cards
  function card(ctx, x, y, w, h, st, face, clipH) {
    ctx.save();
    if (clipH !== undefined && clipH < h) { ctx.beginPath(); ctx.rect(x - 2, y - 2, w + 4, clipH + 2); ctx.clip(); }
    const r = Math.min(4, w * 0.07);
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = st.body; ctx.fill();
    ctx.strokeStyle = st.edge; ctx.lineWidth = 1; ctx.stroke();
    if (face) {
      ctx.save(); ctx.clip();
      ctx.fillStyle = st.head; ctx.fillRect(x, y, w, h * 0.2);
      if (w > 34) { // photo, text lines, seal
        const px = x + w * 0.08, py = y + h * 0.3, pw = w * 0.24, ph = h * 0.55;
        ctx.fillStyle = "rgba(60,70,66,.16)"; ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = "rgba(60,70,66,.3)";
        ctx.beginPath(); ctx.arc(px + pw / 2, py + ph * 0.38, pw * 0.2, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px + pw / 2, py + ph * 0.95, pw * 0.36, ph * 0.3, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "rgba(40,50,46,.22)";
        for (let k = 0; k < 3; k++) ctx.fillRect(x + w * 0.4, y + h * (0.34 + k * 0.16), w * (k === 1 ? 0.36 : 0.48), Math.max(1, h * 0.06));
        ctx.strokeStyle = "rgba(200,50,30,.45)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x + w * 0.84, y + h * 0.8, Math.min(w, h) * 0.09, 0, 7); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // Pile of n cards standing on baseY; visible height is exactly n*step. Returns the pile's top y.
  function pile(ctx, cx, baseY, w, n, step, st, prog = 1) {
    const h = w / ASPECT, shown = n * KF.clamp(prog, 0, 1), H = shown * step;
    if (shown <= 0) return baseY;
    ctx.fillStyle = "rgba(30,45,40,.12)";
    ctx.beginPath(); ctx.ellipse(cx + 2, baseY + 2, w * 0.56, 3.5, 0, 0, 7); ctx.fill();
    const full = Math.floor(shown);
    const x = cx - w / 2;
    // body of the pile: card edges every `step` px
    if (H > h) {
      ctx.beginPath(); ctx.roundRect(x, baseY - H + h * 0.5, w, H - h * 0.5, Math.min(4, w * 0.07));
      ctx.fillStyle = st.body; ctx.fill(); ctx.strokeStyle = st.edge; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = st.edge; ctx.lineWidth = step > 4 ? 1 : 0.6;
      ctx.beginPath();
      for (let k = 1; k < full; k++) {
        const y = Math.round(baseY - k * step) + 0.5;
        if (y < baseY - H + h) break;
        ctx.moveTo(x + 1.5, y); ctx.lineTo(x + w - 1.5, y);
      }
      ctx.stroke();
      if (step > 5) { // coloured slivers of each card's header on the pile's left edge
        ctx.fillStyle = st.head; ctx.globalAlpha = 0.55;
        for (let k = 1; k < full; k++) { const y = baseY - k * step; if (y < baseY - H + h) break; ctx.fillRect(x + 1, y - step + 1.5, 2.5, step - 2); }
        ctx.globalAlpha = 1;
      }
    }
    card(ctx, x, baseY - H, w, h, st, true, H < h ? H : undefined);
    return baseY - H;
  }

  // ---------------------------------------------------------------- data helpers
  let cache = null;
  function prep(d, full) {
    const key = full ? "f" : "m";
    if (cache && cache.d === d && cache[key]) return cache[key];
    if (!cache || cache.d !== d) cache = { d };
    let bands = d.bands.map((b) => ({ ...b, label: b.b.replace("-", "–") }));
    if (!full) { // phones: 10-year groups under 65
      const g = [["16–19", ["16-19"]], ["20대", ["20-24", "25-29"]], ["30대", ["30-34", "35-39"]], ["40대", ["40-44", "45-49"]],
        ["50대", ["50-54", "55-59"]], ["60–64", ["60-64"]]];
      const young = g.map(([label, ks]) => ({ label, lic: ks.reduce((a, k) => a + d.bands.find((b) => b.b === k).lic, 0), old: false }));
      bands = [...young, ...bands.filter((b) => b.old)];
    }
    // 65+ accident rates use 80–84 + 85+ merged as 80+
    const r = d.rates;
    for (const b of bands) {
      if (!b.old) continue;
      const k = b.b === "80-84" || b.b === "85+" ? "80+" : b.b;
      b.rate = r[k].rate; b.acc = b.b === "85+" ? null : r[k].acc; b.rk = k;
    }
    return (cache[key] = { bands });
  }

  // ---------------------------------------------------------------- view A: licences by age, 2019
  function geomA(w, h, n, full) {
    const pad = full ? { l: 34, r: 34, t: 108, b: 58 } : { l: 10, r: 10, t: 96, b: 44 };
    const slot = (w - pad.l - pad.r) / n, cw = Math.min(slot * (full ? 0.66 : 0.72), 64);
    return { pad, slot, cw, base: h - pad.b, x: (i) => pad.l + slot * (i + 0.5) };
  }

  function viewA(ctx, w, h, d, P, el, full, hover, thumb) {
    const B = P.bands, G = thumb ? geomA(w - 34, h, B.length, full) : geomA(w, h, B.length, full);
    if (thumb) { // leave the card's glyph corner (bottom-left) free
      G.pad.t = h * 0.12; G.pad.b = h * 0.14; G.base = h - G.pad.b;
      const x0 = G.x; G.x = (i) => x0(i) + 34;
    }
    const maxN = Math.max(...B.map((b) => b.lic)) / 1e5;
    const step = (G.base - G.pad.t) / maxN;
    const y = d.y2019;
    let hit = null;
    // 65 divider
    const i65 = B.findIndex((b) => b.old), xd = G.x(i65) - G.slot / 2;
    ctx.strokeStyle = "rgba(31,42,38,.35)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xd, G.pad.t - (thumb ? 4 : 18)); ctx.lineTo(xd, G.base + 4); ctx.stroke(); ctx.setLineDash([]);
    if (!thumb) {
      ctx.fillStyle = INK; ctx.font = `600 ${full ? 12 : 10.5}px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText("65세 →", xd + 5, G.pad.t - (full ? 8 : 6));
    }
    B.forEach((b, i) => {
      const n = b.lic / 1e5, cx = G.x(i);
      const prog = KF.ease(KF.clamp((el - i * 0.13) / 0.7, 0, 1));
      const top = pile(ctx, cx, G.base, G.cw, n, step, b.old ? OLD : YOUNG, prog);
      // accident bar: red (65+ real rate) or dashed (65세 미만 평균)
      const rp = KF.ease(KF.clamp((el - 2.4 - i * 0.03) / 0.9, 0, 1));
      const H = n * step, bx = cx + G.cw / 2 + (full ? 3 : 2), bw = full ? 6 : thumb ? 3 : 4;
      if (rp > 0) {
        if (b.old) {
          const rh = H * (b.rate / 10) * rp;
          ctx.fillStyle = RED; ctx.fillRect(bx, G.base - rh, bw, rh);
        } else if (!thumb) {
          const rh = H * (y.rate_young / 10) * rp;
          ctx.fillStyle = "rgba(200,50,30,.16)"; ctx.fillRect(bx, G.base - rh, bw, rh);
          ctx.strokeStyle = "rgba(200,50,30,.6)"; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
          ctx.strokeRect(bx + 0.5, G.base - rh + 0.5, bw - 1, rh - 1); ctx.setLineDash([]);
        }
      }
      if (!thumb) {
        ctx.fillStyle = b.old ? "#8a3f12" : INK; ctx.textAlign = "center";
        ctx.font = `600 ${full ? 11 : 9.5}px ${MONO}`;
        if (full || i % 1 === 0) ctx.fillText(b.label, cx, G.base + (full ? 18 : 15));
        if (full) { ctx.fillStyle = MUTED; ctx.font = `500 10px ${MONO}`; ctx.fillText(`${KF.fmt(b.lic / 1e4)}만`, cx, G.base + 32); }
        if (b.old && b.rk && (b.b !== "85+") && rp >= 1) {
          ctx.fillStyle = RED; ctx.font = `700 ${full ? 13 : 10.5}px ${MONO}`;
          ctx.fillText(KF.fmt(b.rate, 1), cx, top - (full ? 8 : 6));
        }
      }
      if (hover && Math.abs(hover[0] - cx) < G.slot / 2 && hover[1] > G.pad.t - 30 && hover[1] < G.base + 40) hit = { b, cx, top };
    });
    // the next wave: 55–64 piles are about to cross the 65 line
    const wa = KF.clamp((el - 3.6) / 0.6, 0, 1);
    if (full && !thumb && wa > 0 && B[i65 - 2]) {
      const n2 = B[i65 - 2].lic + B[i65 - 1].lic, xa = (G.x(i65 - 2) + G.x(i65 - 1)) / 2;
      const ya = Math.min(G.base - (B[i65 - 2].lic / 1e5) * step, G.base - (B[i65 - 1].lic / 1e5) * step) - 44;
      ctx.save(); ctx.globalAlpha = wa;
      ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.font = `600 12px ${SANS}`;
      ctx.fillText(`${B[i65 - 2].label.split("–")[0]}–${B[i65 - 1].label.split("–")[1]}세 ${KF.fmt(n2 / 1e4)}만 명`, xa, ya);
      ctx.fillStyle = MUTED; ctx.font = `500 11px ${SANS}`; ctx.fillText("10년 안에 65세를 넘는다", xa, ya + 16);
      ctx.strokeStyle = "rgba(31,42,38,.55)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(xa + 62, ya + 12); ctx.quadraticCurveTo(xd + 20, ya + 6, xd + 26, ya + 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xd + 26, ya + 40); ctx.lineTo(xd + 21, ya + 32); ctx.moveTo(xd + 26, ya + 40); ctx.lineTo(xd + 30, ya + 31); ctx.stroke();
      ctx.restore();
    }
    return { hit, G, step };
  }

  function headerA(ctx, w, d, full, a) {
    const y = d.y2019;
    ctx.save(); ctx.globalAlpha = a;
    if (full) {
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 12px ${MONO}`;
      ctx.fillText("운전면허 소지자 2019 · 카드 1장 = 10만 명", 30, 30);
      ctx.fillStyle = MUTED; ctx.font = `500 11px ${SANS}`;
      ctx.fillText("붉은 막대 = 면허 1,000명당 가해 사고 (더미 꼭대기 = 10건) · 점선 = 65세 미만 평균", 30, 50);
      ctx.textAlign = "right";
      const rx = w - 30;
      ctx.fillStyle = RED; ctx.font = `700 34px ${SANS}`; ctx.fillText(`${KF.fmt(d.share["2019"], 1)}%`, rx, 48);
      const w1 = ctx.measureText(`${KF.fmt(d.share["2019"], 1)}%`).width;
      ctx.fillStyle = INK; ctx.font = `600 12px ${SANS}`; ctx.fillText("사고의 몫", rx - w1 - 10, 32);
      ctx.fillStyle = "#8a3f12"; ctx.font = `700 34px ${SANS}`;
      const t2 = `${KF.fmt(y.lic_old / y.lic * 100, 1)}%`;
      ctx.fillText(t2, rx - w1 - 80, 48);
      const w2 = ctx.measureText(t2).width;
      ctx.fillStyle = INK; ctx.font = `600 12px ${SANS}`; ctx.fillText("65세 이상 · 면허의 몫", rx - w1 - 80 - w2 - 10, 32);
      ctx.fillStyle = MUTED; ctx.font = `500 11px ${MONO}`;
      ctx.fillText(`1,000명당 ${KF.fmt(y.rate_old, 1)}건 vs 65세 미만 ${KF.fmt(y.rate_young, 1)}건`, rx, 70);
    } else {
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 11px ${MONO}`;
      ctx.fillText("면허 소지자 2019 · 1장 = 10만 명", 10, 20);
      ctx.fillStyle = MUTED; ctx.font = `500 10px ${SANS}`; ctx.fillText("붉은 막대 = 1,000명당 사고(꼭대기 = 10건)", 10, 36);
      ctx.font = `700 22px ${SANS}`; ctx.fillStyle = "#8a3f12"; ctx.fillText(`${KF.fmt(y.lic_old / y.lic * 100, 1)}%`, 10, 66);
      const w1 = ctx.measureText(`${KF.fmt(y.lic_old / y.lic * 100, 1)}%`).width;
      ctx.fillStyle = RED; ctx.fillText(`${KF.fmt(d.share["2019"], 1)}%`, 10 + w1 + 64, 66);
      ctx.fillStyle = INK; ctx.font = `600 10px ${SANS}`;
      ctx.fillText("65세+ 면허", 10, 80); ctx.fillText("사고", 10 + w1 + 64, 80);
      ctx.textAlign = "right"; ctx.fillStyle = MUTED; ctx.font = `500 9.5px ${SANS}`; ctx.fillText("점선 = 65세 미만 평균", w - 10, 80);
      ctx.fillStyle = MUTED; ctx.font = `500 16px ${SANS}`; ctx.fillText("→", 10 + w1 + 24, 64);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- view B: 65+ accidents 1992–2025 (1 card = 1,000)
  function viewB(ctx, w, h, d, el, full, sel, hover) {
    const S = d.series, n = S.length;
    const pad = full ? { l: 30, r: 30, t: 104, b: 44 } : { l: 10, r: 10, t: 96, b: 36 };
    const gap = full ? 26 : 16; // break before 2025
    const slot = (w - pad.l - pad.r - gap) / n, cw = Math.max(5, Math.min(slot * 0.74, 40));
    const base = h - pad.b, maxN = Math.max(...S.map((s) => s[1])) / 1000;
    const step = (base - pad.t) / maxN;
    const xOf = (i) => pad.l + slot * (i + 0.5) + (S[i][0] > 2019 ? gap : 0);
    let hit = null;
    S.forEach((s, i) => {
      const cx = xOf(i), prog = KF.ease(KF.clamp((el - i * 0.06) / 0.8, 0, 1));
      const on = i === sel;
      ctx.globalAlpha = sel < 0 || on ? 1 : 0.55;
      const top = pile(ctx, cx, base, cw, s[1] / 1000, step, ACC, prog);
      ctx.globalAlpha = 1;
      const lbl = full ? (s[0] % 5 === 0 || s[0] === 1992 || s[0] >= 2017) : (s[0] % 10 === 0 || s[0] === 1992 || s[0] === 2019 || s[0] === 2025);
      if (lbl || on) {
        ctx.fillStyle = on ? RED : MUTED; ctx.font = `${on ? 700 : 500} ${full ? 10.5 : 9}px ${MONO}`; ctx.textAlign = "center";
        ctx.fillText(full ? String(s[0]) : `'${String(s[0]).slice(2)}`, cx, base + (full ? 17 : 14));
      }
      if (on && prog >= 1) {
        ctx.fillStyle = RED; ctx.font = `700 ${full ? 13 : 11}px ${MONO}`; ctx.textAlign = "center";
        ctx.fillText(KF.fmt(s[1]), KF.clamp(cx, 30, w - 30), top - 8);
      }
      if (hover && Math.abs(hover[0] - cx) < slot / 2 + 1 && hover[1] > pad.t - 20 && hover[1] < base + 24) hit = i;
    });
    // break marks between 2019 and 2025
    const i25 = S.findIndex((s) => s[0] > 2019);
    if (i25 > 0) {
      const xb = (xOf(i25 - 1) + xOf(i25)) / 2;
      ctx.fillStyle = MUTED; ctx.font = `500 ${full ? 11 : 9}px ${MONO}`; ctx.textAlign = "center";
      ctx.fillText("⋯", xb, base - 6);
      if (full) ctx.fillText("2020–24 자료 없음", xb, base + 32);
    }
    return { hit };
  }

  function headerB(ctx, w, d, full, sel, a) {
    const S = d.series, s = S[sel], first = S[0], last = S[S.length - 1];
    ctx.save(); ctx.globalAlpha = a;
    const share = d.share[String(s[0])];
    if (full) {
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 12px ${MONO}`;
      ctx.fillText(`65세 이상 운전자가 가해자인 교통사고 · 카드 1장 = 1,000건`, 30, 30);
      ctx.fillStyle = MUTED; ctx.font = `500 11px ${SANS}`;
      ctx.fillText(`${first[0]}년 ${KF.fmt(first[1])}건 → ${last[0]}년 ${KF.fmt(last[1])}건 (${KF.fmt(last[1] / first[1], 1)}배)`, 30, 50);
      ctx.textAlign = "right"; const rx = w - 30;
      ctx.fillStyle = RED; ctx.font = `700 34px ${SANS}`; ctx.fillText(KF.fmt(s[1]), rx, 48);
      const bw = ctx.measureText(KF.fmt(s[1])).width;
      ctx.fillStyle = INK; ctx.font = `600 12px ${SANS}`; ctx.fillText(`${s[0]}년 사고`, rx - bw - 10, 32);
      ctx.fillStyle = MUTED; ctx.font = `500 11px ${MONO}`;
      ctx.fillText(`사망 ${KF.fmt(s[2])}명${share ? ` · 전체 사고의 ${KF.fmt(share, 1)}%` : ""}`, rx, 70);
    } else {
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 11px ${MONO}`;
      ctx.fillText("65세+ 운전자 가해 사고 · 1장 = 1,000건", 10, 20);
      ctx.fillStyle = RED; ctx.font = `700 24px ${SANS}`; ctx.fillText(KF.fmt(s[1]), 10, 52);
      const bw = ctx.measureText(KF.fmt(s[1])).width;
      ctx.fillStyle = INK; ctx.font = `600 11px ${SANS}`; ctx.fillText(`${s[0]}년`, 16 + bw, 46);
      ctx.fillStyle = MUTED; ctx.font = `500 10px ${MONO}`;
      ctx.fillText(`사망 ${KF.fmt(s[2])}명${share ? ` · 사고의 ${KF.fmt(share, 1)}%` : ""}`, 10, 70);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- view C: returned licences 2015–2024 (1 card = 5,000)
  function viewC(ctx, w, h, d, el, full, sel, hover) {
    const R = d.returns, n = R.length, U = 5000;
    const pad = full ? { l: 150, r: 40, t: 110, b: 44 } : { l: 64, r: 10, t: 104, b: 36 };
    const slot = (w - pad.l - pad.r) / n, cw = Math.min(slot * 0.66, 58);
    const base = h - pad.b, maxN = Math.max(...R.map((r) => r[2])) / U, step = (base - pad.t) / maxN;
    // the pile they leave, drawn to the same scale: it runs far off the top of the stage
    const px = full ? 70 : 32, pw = full ? 70 : 38, PH = (d.y2020.lic_old / U) * step, top = 6;
    const x0 = px - pw / 2;
    ctx.fillStyle = OLD.body; ctx.fillRect(x0, top, pw, base - top);
    ctx.strokeStyle = OLD.edge; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, top, pw - 1, base - top);
    ctx.beginPath();
    for (let yy = base - step; yy > top + 2; yy -= step) { ctx.moveTo(x0 + 1.5, Math.round(yy) + 0.5); ctx.lineTo(x0 + pw - 1.5, Math.round(yy) + 0.5); }
    ctx.stroke();
    ctx.fillStyle = BG; ctx.beginPath(); ctx.moveTo(x0 - 1, top - 1); // torn top edge = "continues upward"
    for (let k = 0; k <= 8; k++) ctx.lineTo(x0 + (pw * k) / 8, top + (k % 2 ? 7 : 1));
    ctx.lineTo(x0 + pw + 1, top - 1); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(px, (top + base) / 2); ctx.rotate(-Math.PI / 2);
    const l1 = `65세 이상 면허 ${KF.fmt(d.y2020.lic_old / 1e4)}만 명 (2020)`, l2 = `같은 눈금이면 이 높이의 ${KF.fmt(PH / (base - top))}배`;
    const f1 = `600 ${full ? 12 : 10}px ${SANS}`, f2 = `500 ${full ? 10.5 : 9}px ${MONO}`;
    ctx.font = f1; let tw = ctx.measureText(l1).width; ctx.font = f2; tw = Math.max(tw, ctx.measureText(l2).width);
    const lh = full ? 17 : 14;
    ctx.fillStyle = "rgba(251,239,227,.96)"; ctx.fillRect(-tw / 2 - 8, -lh + 1, tw + 16, lh * 2 + 2);
    ctx.fillStyle = "#8a3f12"; ctx.textAlign = "center"; ctx.font = f1; ctx.fillText(l1, 0, -3);
    ctx.fillStyle = MUTED; ctx.font = f2; ctx.fillText(l2, 0, lh - 3);
    ctx.restore();
    ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.font = `600 ${full ? 11 : 9}px ${SANS}`;
    ctx.fillText(full ? "면허 더미" : "더미", px, base + (full ? 17 : 14));
    let hit = null;
    R.forEach((r, i) => {
      const cx = pad.l + slot * (i + 0.5), on = i === sel;
      const k = KF.ease(KF.clamp((el - 0.3 - i * 0.16) / 0.9, 0, 1));
      const xNow = KF.lerp(px, cx, k);
      ctx.globalAlpha = (sel < 0 || on ? 1 : 0.5) * (0.35 + 0.65 * k);
      // under-65 returns at the bottom (grey), 65+ on top (warm)
      const nY = (r[2] - r[1]) / U, nO = r[1] / U;
      pile(ctx, xNow, base, cw, nY, step, RET, 1);
      pile(ctx, xNow, base - nY * step, cw, nO, step, OLD, 1);
      ctx.globalAlpha = 1;
      if (k >= 1) {
        ctx.fillStyle = on ? RED : MUTED; ctx.textAlign = "center"; ctx.font = `${on ? 700 : 500} ${full ? 10.5 : 9}px ${MONO}`;
        ctx.fillText(full ? String(r[0]) : `'${String(r[0]).slice(2)}`, cx, base + (full ? 17 : 14));
        if (on || full) {
          ctx.fillStyle = on ? RED : INK; ctx.font = `${on ? 700 : 500} ${full ? 11 : 9.5}px ${MONO}`;
          ctx.fillText(r[1] >= 1e4 ? `${KF.fmt(r[1] / 1e4, 1)}만` : KF.fmt(r[1]), cx, base - (r[2] / U) * step - 8);
        }
      }
      if (hover && Math.abs(hover[0] - cx) < slot / 2 && hover[1] > pad.t - 20 && hover[1] < base + 24) hit = i;
    });
    return { hit };
  }

  function headerC(ctx, w, d, full, sel, a) {
    const R = d.returns, r = R[sel], prev = R[sel - 1], X = full ? 124 : 60;
    ctx.save(); ctx.globalAlpha = a;
    const lic = r[0] === 2019 ? d.y2019.lic_old : r[0] === 2020 ? d.y2020.lic_old : null;
    const sub = lic ? `그해 65세 이상 면허의 ${KF.fmt(r[1] / lic * 100, 1)}%` : prev ? `전년의 ${KF.fmt(r[1] / prev[1], 1)}배` : "";
    if (full) {
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 12px ${MONO}`;
      ctx.fillText("운전면허 자진반납 · 카드 1장 = 5,000건", X, 30);
      ctx.fillStyle = MUTED; ctx.font = `500 11px ${SANS}`;
      ctx.fillText("주황 = 65세 이상 · 회색 = 65세 미만", X, 50);
      ctx.textAlign = "right"; const rx = w - 30;
      ctx.fillStyle = "#8a3f12"; ctx.font = `700 34px ${SANS}`; ctx.fillText(KF.fmt(r[1]), rx, 48);
      const bw = ctx.measureText(KF.fmt(r[1])).width;
      ctx.fillStyle = INK; ctx.font = `600 12px ${SANS}`; ctx.fillText(`${r[0]}년 65세 이상 반납`, rx - bw - 10, 32);
      ctx.fillStyle = MUTED; ctx.font = `500 11px ${MONO}`; ctx.fillText(sub, rx, 70);
    } else {
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 11px ${MONO}`;
      ctx.fillText("면허 자진반납 · 1장 = 5,000건", X, 20);
      ctx.fillStyle = "#8a3f12"; ctx.font = `700 24px ${SANS}`; ctx.fillText(KF.fmt(r[1]), X, 52);
      const bw = ctx.measureText(KF.fmt(r[1])).width;
      ctx.fillStyle = INK; ctx.font = `600 11px ${SANS}`; ctx.fillText(`${r[0]}년 65세+`, X + 6 + bw, 46);
      ctx.fillStyle = MUTED; ctx.font = `500 10px ${MONO}`; ctx.fillText(sub, X, 70);
    }
    ctx.restore();
  }

  function tipBox(ctx, w, h, x, y, lines) {
    ctx.save();
    ctx.font = `600 12px ${SANS}`;
    let bw = 0;
    lines.forEach((t, k) => { ctx.font = k ? `500 11.5px ${MONO}` : `600 12.5px ${SANS}`; bw = Math.max(bw, ctx.measureText(t).width); });
    bw += 22; const bh = 12 + lines.length * 18;
    const bx = KF.clamp(x + 14, 8, w - bw - 8), by = KF.clamp(y - bh - 10, 8, h - bh - 8);
    ctx.fillStyle = "rgba(252,253,250,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(31,42,38,.45)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    lines.forEach((t, k) => {
      ctx.fillStyle = k === 0 ? INK : t.includes("1,000명당") ? RED : "#34413c";
      ctx.font = k ? `500 11.5px ${MONO}` : `600 12.5px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(t, bx + 11, by + 20 + k * 18);
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------- thumbnail
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, el = Math.min(c * 1.25, 6);
    const P = prep(d, false);
    ctx.save(); ctx.translate(0, 0);
    viewA(ctx, w * 0.66, h, d, P, el, false, null, true);
    ctx.restore();
    const a = KF.clamp((el - 3.3) / 0.6, 0, 1), rx = w - 14;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "right";
    const fs = Math.round(h * 0.13), ss = Math.max(10, Math.round(h * 0.05));
    ctx.fillStyle = INK; ctx.font = `600 ${ss}px ${SANS}`; ctx.fillText("65세 이상 운전자 (2019)", rx, h * 0.16);
    ctx.fillStyle = "#8a3f12"; ctx.font = `700 ${fs}px ${SANS}`; ctx.fillText(`${KF.fmt(d.y2019.lic_old / d.y2019.lic * 100, 1)}%`, rx, h * 0.16 + fs * 1.15);
    ctx.fillStyle = INK; ctx.font = `500 ${ss}px ${SANS}`; ctx.fillText("면허의 몫", rx, h * 0.16 + fs * 1.15 + ss * 1.4);
    ctx.fillStyle = RED; ctx.font = `700 ${fs}px ${SANS}`; ctx.fillText(`${KF.fmt(d.share["2019"], 1)}%`, rx, h * 0.16 + fs * 2.45 + ss * 1.4);
    ctx.fillStyle = INK; ctx.font = `500 ${ss}px ${SANS}`; ctx.fillText("사고의 몫", rx, h * 0.16 + fs * 2.45 + ss * 2.8);
    ctx.restore();
    if (c > 9.2) { ctx.fillStyle = `rgba(223,230,225,${(c - 9.2) / 0.8})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- detail stage
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    const V0 = "lic";
    let view = V0, t0 = performance.now(), hover = null;
    let selB = d.series.length - 1, selC = d.returns.findIndex((r) => r[0] === 2019);
    if (KF.reduced) t0 -= 1e5;
    KF.segment(controls, [{ id: "lic", label: "면허와 사고 2019" }, { id: "years", label: "34년 1992–2025" }, { id: "ret", label: "반납 2015–2024" }],
      V0, (id) => { view = id; t0 = performance.now(); syncRange(); });
    const lab = document.createElement("label"), range = document.createElement("input");
    range.type = "range"; lab.append("해", range);
    const out = document.createElement("span"); out.className = "readout";
    const again = document.createElement("button"); again.type = "button"; again.textContent = "다시 쌓기";
    again.onclick = () => { t0 = performance.now(); };
    controls.append(lab, again, out);
    function syncRange() {
      lab.hidden = view === "lic";
      if (view === "years") { range.min = 0; range.max = d.series.length - 1; range.value = selB; }
      if (view === "ret") { range.min = 0; range.max = d.returns.length - 1; range.value = selC; }
      setOut();
    }
    function setOut() {
      if (view === "lic") out.textContent = `65세 이상 면허 ${KF.fmt(d.y2019.lic_old)}명 · 가해 사고 ${KF.fmt(d.y2019.old)}건 (2019)`;
      if (view === "years") { const x = d.series[selB]; out.textContent = `${x[0]}년 · ${KF.fmt(x[1])}건 · 사망 ${KF.fmt(x[2])}명`; }
      if (view === "ret") { const x = d.returns[selC]; out.textContent = `${x[0]}년 · 65세 이상 ${KF.fmt(x[1])}건 / 전체 ${KF.fmt(x[2])}건`; }
    }
    range.oninput = () => { if (view === "years") selB = +range.value; else selC = +range.value; setOut(); };
    syncRange();
    const at = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", (e) => { hover = at(e); });
    stage.addEventListener("pointerdown", (e) => { hover = at(e); });
    stage.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, el = (performance.now() - t0) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      if (view === "lic") {
        const P = prep(d, full);
        const { hit } = viewA(ctx, w, h, d, P, el, full, hover, false);
        headerA(ctx, w, d, full, KF.clamp((el - 3.1) / 0.6, 0, 1));
        if (hit && el > 3) {
          const b = hit.b, lines = [`${b.label}세 운전면허 소지자`, `${KF.fmt(b.lic)}명 (카드 ${KF.fmt(b.lic / 1e5, 1)}장)`];
          if (b.old) {
            const r = d.rates[b.rk];
            lines.push(`가해 사고 ${KF.fmt(r.acc)}건${b.rk === "80+" ? " (80세 이상 전체)" : ""}`, `1,000명당 ${KF.fmt(r.rate, 1)}건`);
          } else lines.push("나이별 사고는 이 자료에 없음", `65세 미만 전체 1,000명당 ${KF.fmt(d.y2019.rate_young, 1)}건`);
          tipBox(ctx, w, h, hit.cx, Math.max(hit.top, 120), lines);
        }
      } else if (view === "years") {
        const { hit } = viewB(ctx, w, h, d, el, full, selB, hover);
        headerB(ctx, w, d, full, hit !== null && hit !== undefined && el > 2 ? hit : selB, KF.clamp(el / 0.5, 0, 1));
      } else {
        const { hit } = viewC(ctx, w, h, d, el, full, selC, hover);
        headerC(ctx, w, d, full, hit !== null && hit !== undefined && el > 2 ? hit : selC, KF.clamp(el / 0.5, 0, 1));
      }
    });
  }

  VIZ["older-drivers"] = { thumb, mount, bg: BG };
})();
