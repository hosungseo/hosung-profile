// 51 water-loss — "새는 수도관 진열대". 17개 시도의 급수관을 한 줄씩 늘어놓은 진열대. 관 굵기 = 총급수량,
// 이음매에서 뻗는 스트림 길이 = 누수율(순간 세기), 관 끝의 물방울 크기 = 환산누수량(그동안 새어 나간 양).
// 두 정렬(누수율 순 / 누수량 순) 사이를 바꾸면 관들이 줄을 바꿔 서고, 제주(비율 1위)와 경기(총량 1위)가
// 서로 다른 자리에서 만난다.
(() => {
  const BG = "#0d1f1d";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#eaf5f2", MUTE = "rgba(234,245,242,.64)", FAINT = "rgba(234,245,242,.14)";
  const PIPE = "#48585f", PIPE_HI = "rgba(255,255,255,.16)", PIPE_LO = "rgba(0,0,0,.28)";
  const FLOW = "#5fb8d6", LEAK = "#e2793f", LEAK_DIM = "rgba(226,121,63,.55)", GOLD = "#f2c230";

  let DEC = null;
  function decode(d) {
    if (DEC && DEC.d === d) return DEC;
    const rows = d.rows.map((r, i) => ({ ...r, i }));
    const byRate = [...rows].sort((a, b) => b.rate - a.rate || a.i - b.i);
    const byLoss = [...rows].sort((a, b) => b.loss - a.loss || a.i - b.i);
    const rankRate = new Map(byRate.map((r, k) => [r.i, k]));
    const rankLoss = new Map(byLoss.map((r, k) => [r.i, k]));
    const supplyMax = Math.max(...rows.map((r) => r.supply)), supplyMin = Math.min(...rows.map((r) => r.supply));
    const lossMax = Math.max(...rows.map((r) => r.loss)), rateMax = Math.max(...rows.map((r) => r.rate));
    return (DEC = {
      d, rows, rankRate, rankLoss, supplyMax, supplyMin, lossMax, rateMax,
      rateLeader: byRate[0], lossLeader: byLoss[0],
    });
  }
  const thick = (X, v, full) => KF.lerp(full ? 5 : 3.5, full ? 29 : 17, Math.sqrt((v - X.supplyMin) / (X.supplyMax - X.supplyMin || 1)));
  const dropR = (X, v, full) => KF.lerp(full ? 3.5 : 2.5, full ? 17 : 11, Math.sqrt(v / X.lossMax));
  const fmtLoss = (v) => `${(v / 1e8).toFixed(2)}억㎥`;

  function pipeSeg(ctx, x0, x1, y, w, ripple) {
    const r = w / 2;
    ctx.fillStyle = PIPE;
    ctx.beginPath(); ctx.moveTo(x0, y - r); ctx.lineTo(x1 - r, y - r); ctx.arc(x1 - r, y, r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x0, y + r);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = PIPE_HI; ctx.fillRect(x0, y - r, x1 - x0 - r, Math.max(1, w * 0.22));
    ctx.fillStyle = PIPE_LO; ctx.fillRect(x0, y + r - Math.max(1, w * 0.2), x1 - x0 - r, Math.max(1, w * 0.2));
    if (ripple != null) { // faint moving seams = flowing water, only while settling in
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y - r, x1 - x0 - r, w); ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = Math.max(1, w * 0.1);
      for (let s = -20; s < x1 - x0 + 20; s += 16) {
        const xx = x0 + ((s + ripple * 16) % (x1 - x0 + 20));
        ctx.beginPath(); ctx.moveTo(xx, y - r); ctx.lineTo(xx - w * 0.5, y + r); ctx.stroke();
      }
      ctx.restore();
    }
  }
  function drop(ctx, cx, cy, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 1.5);
    ctx.bezierCurveTo(cx + r * 1.1, cy - r * 0.2, cx + r, cy + r * 0.9, cx, cy + r);
    ctx.bezierCurveTo(cx - r, cy + r * 0.9, cx - r * 1.1, cy - r * 0.2, cx, cy - r * 1.5);
    ctx.fill();
  }

  // one row: pipe (supply) -> joint -> leak stream (rate, frozen length) ... value readout + puddle (loss)
  function row(ctx, X, r, x0, xTrack, trackW, y, rh, full, settle, hi, sel) {
    const w = thick(X, r.supply, full), jointX = xTrack + trackW;
    ctx.save();
    if (hi) { ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fillRect(2, y - rh / 2, (full ? xTrack + trackW + 150 : xTrack + trackW + 30), rh); }
    ctx.textAlign = "left"; ctx.fillStyle = sel ? GOLD : hi ? INK : MUTE;
    ctx.font = `${sel ? 700 : 600} ${full ? 13 : 10.5}px ${SANS}`;
    ctx.fillText(r.name, x0, y + (full ? 4.5 : 3.5));
    pipeSeg(ctx, xTrack, jointX, y, w, settle);
    // joint collar
    ctx.fillStyle = "#26302f"; ctx.fillRect(jointX - Math.max(2, w * 0.16), y - w / 2 - 1.5, Math.max(3, w * 0.32), w + 3);
    // leak stream: length frozen proportional to rate (this region's instantaneous leak rate)
    const sLen = KF.lerp(full ? 3 : 2, rh * 0.92, r.rate / X.rateMax) * KF.clamp(settle, 0, 1);
    ctx.strokeStyle = LEAK; ctx.lineWidth = Math.max(1.4, w * 0.13);
    ctx.beginPath(); ctx.moveTo(jointX, y + w / 2); ctx.lineTo(jointX, y + w / 2 + sLen); ctx.stroke();
    drop(ctx, jointX, y + w / 2 + sLen + (full ? 5 : 3.5), full ? 3.4 : 2.6, LEAK);
    // puddle (accumulated loss volume) + numbers
    const pr = dropR(X, r.loss, full) * KF.clamp(settle, 0, 1);
    const px = jointX + (full ? 34 : 22);
    ctx.globalAlpha = 0.85; drop(ctx, px, y, pr, hi ? LEAK : LEAK_DIM); ctx.globalAlpha = 1;
    if (full) {
      ctx.textAlign = "left"; ctx.fillStyle = hi ? INK : MUTE; ctx.font = `600 11.5px ${MONO}`;
      ctx.fillText(`${r.rate.toFixed(1)}%`, px + 26, y - 3);
      ctx.fillStyle = MUTE; ctx.font = `500 10px ${MONO}`;
      ctx.fillText(fmtLoss(r.loss), px + 26, y + 12);
    }
    ctx.restore();
    return { top: y - rh / 2, bottom: y + rh / 2, x0: 2, x1: full ? px + 90 : px + 14, r };
  }

  function headline(ctx, x, y, X, full) {
    ctx.textAlign = "left";
    ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 11 : 9.5}px ${MONO}`; ctx.fillText("WATER LOSS RACK · 시도 17곳", x, y);
    ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 14}px ${SANS}`;
    ctx.fillText(`${X.d.year}년, 새는 물의 두 가지 1위`, x, y + (full ? 26 : 19));
    const by = y + (full ? 62 : 44);
    ctx.font = `600 ${full ? 11 : 9.5}px ${SANS}`; ctx.fillStyle = MUTE;
    ctx.fillText("누수율 1위", x, by); ctx.fillText("환산누수량 1위", x + (full ? 150 : 108), by);
    ctx.font = `800 ${full ? 26 : 18}px ${SANS}`; ctx.fillStyle = LEAK;
    ctx.fillText(`${X.rateLeader.name} ${X.rateLeader.rate.toFixed(1)}%`, x, by + (full ? 30 : 21));
    ctx.fillText(`${X.lossLeader.name} ${fmtLoss(X.lossLeader.loss)}`, x + (full ? 150 : 108), by + (full ? 30 : 21));
    return by + (full ? 44 : 32);
  }

  function detailPanel(ctx, x, y, w, X, r) {
    if (!r) return;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 15px ${SANS}`;
    ctx.fillText(r.long, x, y);
    const lines = [
      [`누수율 ${r.rate.toFixed(1)}% · 전국 ${X.rankRate.get(r.i) + 1}위`, LEAK],
      [`환산누수량 ${fmtLoss(r.loss)} · 전국 ${X.rankLoss.get(r.i) + 1}위`, LEAK],
      [`총급수량 ${KF.fmt(r.supply / 1e4, 0)}만 ㎥`, INK],
      [`전국 관로 길이의 ${r.pipeShare.toFixed(1)}%`, MUTE],
    ];
    lines.forEach(([t, c], j) => { ctx.fillStyle = c; ctx.font = `500 12px ${MONO}`; ctx.fillText(t, x, y + 24 + j * 19); });
  }

  function legend(ctx, x, y, w, full) {
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 10.5 : 9}px ${SANS}`;
    const t1 = "관 굵기 = 총급수량 · 짧은 스트림 = 누수율(세기)", t2 = "끝의 물방울 크기 = 환산누수량(총급수량×누수율)";
    ctx.fillText(t1, x, y); ctx.fillText(t2, x, y + (full ? 15 : 13));
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const X = decode(d), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const settle = KF.ease(KF.clamp((c - 0.3) / 1.6, 0, 1));
    const rx = w * 0.06, y1 = h * 0.42, y2 = h * 0.72, trackW = w * 0.24;
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`;
    ctx.fillText(`${X.d.year} 수도관 누수`, rx, h * 0.29);
    [[X.rateLeader, y1, true], [X.lossLeader, y2, false]].forEach(([r, y, isRate]) => {
      const ww = thick(X, r.supply, true) * 0.8, jointX = rx + trackW;
      pipeSeg(ctx, rx, jointX, y, ww, null);
      ctx.fillStyle = "#26302f"; ctx.fillRect(jointX - 2, y - ww / 2 - 1.5, 4, ww + 3);
      if (isRate) {
        const sLen = KF.lerp(2, 22, r.rate / X.rateMax) * settle;
        ctx.strokeStyle = LEAK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(jointX, y + ww / 2); ctx.lineTo(jointX, y + ww / 2 + sLen); ctx.stroke();
        drop(ctx, jointX, y + ww / 2 + sLen + 4, 3.2, LEAK);
      } else {
        drop(ctx, jointX + 16, y, dropR(X, r.loss, true) * 0.85 * settle, LEAK);
      }
      ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.06)}px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(r.name, jointX + trackW * 0.42, y - ww / 2 - 6);
    });
    ctx.fillStyle = MUTE; ctx.font = `500 ${Math.round(h * 0.046)}px ${SANS}`;
    ctx.fillText("누수율 1위", rx, y1 - h * 0.06);
    ctx.fillText("누수량 1위", rx, y2 - h * 0.06);
    ctx.textAlign = "right"; ctx.fillStyle = LEAK; ctx.font = `800 ${Math.round(h * 0.078)}px ${SANS}`;
    ctx.fillText(`${X.rateLeader.rate.toFixed(1)}%`, w - rx, y1 + h * 0.03);
    ctx.fillText(fmtLoss(X.lossLeader.loss), w - rx, y2 + h * 0.03);
    if (c > 9.3) { ctx.fillStyle = `rgba(13,31,29,${(c - 9.3) / 0.7})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage);
    let mode = "rate", t0 = performance.now(), tSwitch = -9999, prevRank = X.rankRate, hover = null, sel = null, geo = [];
    KF.segment(controls, [{ id: "rate", label: "누수율 순" }, { id: "loss", label: "누수량 순" }], mode, (id) => {
      if (id === mode) return;
      prevRank = mode === "rate" ? X.rankRate : X.rankLoss; mode = id; tSwitch = performance.now();
    });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "·"; controls.appendChild(sep);
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "다시 채우기";
    replay.onclick = () => { t0 = performance.now(); };
    controls.appendChild(replay);
    const findRow = (x, y) => geo.find((g) => y >= g.top && y <= g.bottom && x >= g.x0 && x <= g.x1);
    const onMove = (e) => { const b = stage.getBoundingClientRect(); hover = [e.clientX - b.left, e.clientY - b.top]; };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", () => { hover = null; });
    stage.addEventListener("pointerdown", (e) => { onMove(e); const hit = findRow(...hover); sel = hit ? (sel === hit.r ? null : hit.r) : null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const elapsed = (performance.now() - t0) / 1000;
      const settle = KF.ease(KF.clamp((elapsed - 0.2) / 1.4, 0, 1));
      const swProg = KF.ease(KF.clamp((performance.now() - tSwitch) / 850, 0, 1));
      const curRank = mode === "rate" ? X.rankRate : X.rankLoss;

      const headX = full ? Math.round(w * 0.63) + 26 : 14;
      const headY = full ? 34 : 26;
      let listBottom;
      if (full) {
        listBottom = headline(ctx, headX, headY, X, true);
      } else {
        headline(ctx, headX, headY, X, false);
        listBottom = 0;
      }

      const listX0 = 14, name0 = listX0 + 4, trackX = full ? name0 + 58 : name0 + 40;
      const trackW = full ? Math.min(230, w * 0.63 - trackX - 150) : Math.min(120, w - trackX - 46);
      const topY = full ? 18 : (headY + 92);
      const botY = full ? h - 14 : h - 40;
      const n = X.rows.length, rh = (botY - topY) / n;
      geo = [];
      for (const r of X.rows) {
        const oldRk = prevRank.get(r.i), newRk = curRank.get(r.i);
        const rk = KF.lerp(oldRk, newRk, swProg);
        const y = topY + rh * (rk + 0.5);
        const hi = hover && Math.abs(hover[1] - y) < rh / 2 && hover[0] < (full ? trackX + trackW + 150 : trackX + trackW + 30);
        const g = row(ctx, X, r, listX0, trackX, trackW, y, rh * 0.86, full, settle, hi || sel === r, sel === r);
        geo.push({ ...g, r });
      }
      if (full) {
        legend(ctx, headX, headY + 118, w - headX - 20, true);
        detailPanel(ctx, headX, headY + 158, w - headX - 20, X, sel || (hover && findRow(...hover)?.r) || (mode === "rate" ? X.rateLeader : X.lossLeader));
      } else {
        legend(ctx, 14, h - 24, w - 28, false);
      }
      const activeHover = hover && findRow(...hover);
      if (activeHover && hover) {
        const r = activeHover.r;
        const lines = [[r.long, 1], [`누수율 ${r.rate.toFixed(1)}% (전국 ${X.rankRate.get(r.i) + 1}위)`, 0], [`환산누수량 ${fmtLoss(r.loss)} (전국 ${X.rankLoss.get(r.i) + 1}위)`, 0]];
        const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : `500 11px ${MONO}`);
        ctx.font = fontOf(0);
        const bw = Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22;
        const bh = 12 + lines.length * 18;
        const bx = KF.clamp(hover[0] + 16, 6, w - bw - 6), by = KF.clamp(hover[1] - bh - 10, 6, h - bh - 6);
        ctx.fillStyle = "rgba(8,18,17,.95)"; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "rgba(234,245,242,.3)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
        ctx.textAlign = "left";
        lines.forEach(([t, k], j) => { ctx.fillStyle = k === 1 ? GOLD : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + j * 18); });
      }
    });
  }

  VIZ["water-loss"] = { thumb, mount, bg: BG };
})();
