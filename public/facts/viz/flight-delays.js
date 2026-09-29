// 82 flight-delays — "관제탑 비행 스트립 랙". 관제사가 손으로 다루던 종이 운항 스트립을 두 랙에 꽂는다.
// 위 랙 "지연", 아래 랙 "결항" — 같은 공항·노선의 자료를 같은 네 사유(연결편·기상·정비·기타)로 나누어도
// 랙마다 맨 위에 꽂히는 사유가 다르다. 공항·노선을 바꾸면 두 랙이 그 자리에서 다시 꽂힌다.
(() => {
  const BG = "#1e160f";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace";
  const INK = "#f3e9d8", MUTE = "rgba(243,233,216,.62)", FAINT = "rgba(243,233,216,.16)";
  const RACK = "#140d07", PAPER = "#ece1c8", PAPER_SHADE = "rgba(0,0,0,.24)";
  const CAUSE = { 연결편: "#d9a441", 기상: "#5fa8d6", 정비: "#a586c9", 기타: "#8a8074" };
  const INK_PAPER = "#241a0e";

  let DEC = null;
  function decode(d) {
    if (DEC && DEC.d === d) return DEC;
    return (DEC = { d, airportOpts: ["전체", ...d.airports] });
  }
  const sumV = (cs) => cs.reduce((a, c) => a + c.value, 0);
  const panelOf = (X, airport, route) => X.d.panels[`${airport}|${route}`];

  function rivet(ctx, x, y) { ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.arc(x + 0.6, y + 0.6, 1.2, 0, 7); ctx.fill(); }

  function rackFrame(ctx, x, y, w, h, label, full) {
    ctx.fillStyle = RACK; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    [x + 8, x + w - 8].forEach((rx) => { rivet(ctx, rx, y + 8); rivet(ctx, rx, y + h - 8); });
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `700 ${full ? 11 : 9.5}px ${MONO}`; ctx.letterSpacing = "0.06em";
    ctx.fillText(label, x + 16, y - (full ? 10 : 7));
    ctx.letterSpacing = "0px";
  }

  // one paper strip: length = share% of maxW, sorted rows stack top to bottom
  function stripRow(ctx, x, y, maxW, rh, c, prog, full, hi) {
    const w = Math.max(3, maxW * (c.share / 100) * prog);
    ctx.fillStyle = PAPER_SHADE; ctx.fillRect(x + 10, y + 3, w, rh);
    ctx.fillStyle = hi ? "#fff8ea" : PAPER; ctx.fillRect(x + 8, y, w, rh);
    ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 1; ctx.strokeRect(x + 8.5, y + 0.5, w - 1, rh - 1);
    ctx.fillStyle = CAUSE[c.name]; ctx.fillRect(x, y, 10, rh);
    const nameFont = `700 ${full ? 12.5 : 10.5}px ${SANS}`, valFont = `600 ${full ? 11 : 9.5}px ${MONO}`;
    const valText = `${c.share.toFixed(1)}% · ${KF.fmt(c.value)}편`;
    ctx.font = nameFont; const nameW = ctx.measureText(c.name).width;
    ctx.font = valFont; const valW = ctx.measureText(valText).width;
    const fits = w - 16 > Math.max(nameW, valW) + 4;
    if (fits) {
      ctx.textAlign = "left"; ctx.fillStyle = INK_PAPER; ctx.font = nameFont;
      ctx.fillText(c.name, x + 18, y + rh * 0.42);
      ctx.font = valFont; ctx.fillStyle = "rgba(36,26,14,.72)";
      ctx.fillText(valText, x + 18, y + rh * 0.78);
    } else {
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 11.5 : 10}px ${SANS}`;
      ctx.fillText(`${c.name} ${c.share.toFixed(1)}%`, x + 8 + w + 8, y + rh * 0.68);
    }
    return { x: x, y, w: Math.max(w + 18, 60), h: rh, c };
  }

  function rack(ctx, x, y, w, causes, label, prog, full, hover, sorted) {
    const rh = full ? 30 : 21, gap = full ? 6 : 4;
    const h = causes.length * (rh + gap) - gap;
    rackFrame(ctx, x, y, w, h, label, full);
    const list = sorted ? [...causes].sort((a, b) => b.share - a.share) : causes;
    const geo = [];
    list.forEach((c, i) => {
      const yy = y + i * (rh + gap);
      const hi = hover && hover[1] >= yy && hover[1] < yy + rh && hover[0] >= x && hover[0] <= x + w;
      const g = stripRow(ctx, x, yy, w - 20, rh, c, prog, full, hi);
      geo.push({ ...g, top: yy, bottom: yy + rh, x0: x, x1: x + w });
    });
    return { h, geo };
  }

  function headline(ctx, x, y, X, panel, full) {
    const dShare = [...panel.delay].sort((a, b) => b.share - a.share)[0];
    const cShare = [...panel.cancel].sort((a, b) => b.share - a.share)[0];
    const dTot = sumV(panel.delay), cTot = sumV(panel.cancel);
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 11 : 9.5}px ${MONO}`;
    ctx.fillText("FLIGHT STRIP RACK", x, y);
    ctx.fillStyle = INK; ctx.font = `700 ${full ? 18 : 14}px ${SANS}`;
    ctx.fillText("지연 1위와 결항 1위, 같은 사유일까", x, y + (full ? 25 : 18));
    const by = y + (full ? 58 : 40);
    ctx.font = `600 ${full ? 10.5 : 9.5}px ${SANS}`; ctx.fillStyle = MUTE;
    ctx.fillText(`지연 ${KF.fmt(dTot)}편 중 1위`, x, by); ctx.fillText(`결항 ${KF.fmt(cTot)}편 중 1위`, x + (full ? 165 : 118), by);
    ctx.font = `800 ${full ? 24 : 17}px ${SANS}`;
    ctx.fillStyle = CAUSE[dShare.name]; ctx.fillText(`${dShare.name} ${dShare.share.toFixed(1)}%`, x, by + (full ? 28 : 20));
    ctx.fillStyle = CAUSE[cShare.name]; ctx.fillText(`${cShare.name} ${cShare.share.toFixed(1)}%`, x + (full ? 165 : 118), by + (full ? 28 : 20));
    return by + (full ? 42 : 30);
  }

  function tip(ctx, w, h, lines, hover) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : k === 2 ? `500 10.5px ${SANS}` : `500 11.5px ${MONO}`);
    const bw = Math.min(w - 16, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 14 + lines.length * 18;
    const bx = KF.clamp(hover[0] + 14, 8, w - bw - 8), by = KF.clamp(hover[1] - bh - 10, 8, h - bh - 8);
    ctx.fillStyle = "rgba(15,10,5,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(243,233,216,.3)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? MUTE : k === 1 ? "#f4c968" : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + j * 18); });
  }

  // ---------------------------------------------------------------- thumb
  // Just the #1 strip from each rack (not the full 4-cause rack): keeps clear of the card's
  // top-left badge and bottom-left glyph zones, and avoids the full rack overflowing a short thumb.
  function thumb(ctx, w, h, t, d) {
    const X = decode(d), panel = panelOf(X, "전체", "전체"), c = t % 10;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const prog = KF.ease(KF.clamp((c - 0.3) / 1.8, 0, 1));
    const dl = [...panel.delay].sort((a, b) => b.share - a.share), cl = [...panel.cancel].sort((a, b) => b.share - a.share);
    const rx = w * 0.06, rw = w * 0.44, rh = h * 0.15;
    stripRow(ctx, rx, h * 0.34, rw, rh, dl[0], prog, false, false);
    stripRow(ctx, rx, h * 0.58, rw, rh, cl[0], prog, false, false);
    ctx.textAlign = "right"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.06)}px ${SANS}`;
    ctx.fillText(`지연 1위 ${dl[0].name}`, w - 12, h * 0.28);
    ctx.fillStyle = CAUSE[dl[0].name]; ctx.font = `800 ${Math.round(h * 0.12)}px ${SANS}`;
    ctx.fillText(`${dl[0].share.toFixed(0)}%`, w - 12, h * 0.28 + h * 0.12);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.06)}px ${SANS}`;
    ctx.fillText(`결항 1위 ${cl[0].name}`, w - 12, h * 0.68);
    ctx.fillStyle = CAUSE[cl[0].name]; ctx.font = `800 ${Math.round(h * 0.12)}px ${SANS}`;
    ctx.fillText(`${cl[0].share.toFixed(0)}%`, w - 12, h * 0.68 + h * 0.12);
    if (c > 9.3) { ctx.fillStyle = `rgba(30,22,15,${(c - 9.3) / 0.7})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage);
    let airport = "전체", route = "전체", t0 = performance.now(), hover = null, geo = { d: [], c: [] };

    const sel = document.createElement("select");
    X.airportOpts.forEach((a) => { const o = document.createElement("option"); o.value = a; o.textContent = a === "전체" ? "공항 전체" : a; sel.appendChild(o); });
    sel.onchange = () => { airport = sel.value; t0 = performance.now(); };
    controls.appendChild(sel);
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "노선"; controls.appendChild(sep);
    KF.segment(controls, [{ id: "전체", label: "전체" }, { id: "국내", label: "국내" }, { id: "국제", label: "국제" }], route, (id) => { route = id; t0 = performance.now(); });

    const onMove = (e) => { const b = stage.getBoundingClientRect(); hover = [e.clientX - b.left, e.clientY - b.top]; };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerdown", onMove);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const panel = panelOf(X, airport, route) || panelOf(X, "전체", "전체");
      const prog = KF.ease(KF.clamp(((performance.now() - t0) / 1000 - 0.15) / 1.1, 0, 1));

      const x0 = full ? Math.round(w * 0.06) : 14;
      const y0 = headline(ctx, x0, full ? 30 : 22, X, panel, full);
      const rackW = full ? Math.min(460, w * 0.55) : w - 28;
      const r1 = rack(ctx, x0, y0 + (full ? 26 : 20), rackW, panel.delay, "지연 스트립 · 사유별", prog, full, hover, true);
      const y1 = y0 + (full ? 26 : 20) + r1.h;
      const r2 = rack(ctx, x0, y1 + (full ? 34 : 24), rackW, panel.cancel, "결항 스트립 · 사유별", prog, full, hover, true);
      geo = { d: r1.geo, c: r2.geo };

      const flights = panel.flights, planned = panel.planned;
      const dRate = sumV(panel.delay) / flights * 100, cRate = sumV(panel.cancel) / planned * 100;
      if (full) {
        const px = x0 + rackW + 46, pw = w - px - 24;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 15px ${SANS}`;
        ctx.fillText(airport === "전체" ? "전체 공항" : airport, px, 46);
        ctx.fillStyle = MUTE; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(`노선: ${route}`, px, 66);
        ctx.font = `600 11px ${MONO}`;
        ctx.fillText(`운항 ${KF.fmt(flights)}편 중 지연 ${dRate.toFixed(1)}%`, px, 96);
        ctx.fillText(`계획 ${KF.fmt(planned)}편 중 결항 ${cRate.toFixed(2)}%`, px, 116);
        ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${SANS}`;
        wrapText(ctx, "기록된 사유일 뿐 최초 원인이 아니다. 연결편이 늦은 진짜 이유가 날씨일 수도 있다.", px, 150, pw, 15);
        ctx.fillStyle = "rgba(243,233,216,.4)"; ctx.font = `500 10px ${MONO}`;
        wrapText(ctx, X.d.period, px, 210, pw, 14);
        // top delay-rate airports for this route
        const rankList = (X.d.groups[route] || X.d.groups["전체"]).airports.slice(0, 6);
        ctx.fillStyle = MUTE; ctx.font = `600 11px ${SANS}`; ctx.fillText("지연율 상위 (해당 노선)", px, 250);
        const bw = pw, mx = Math.max(...rankList.map((a) => a.rate));
        const nameFont = `500 10.5px ${SANS}`, valFont = `500 10px ${MONO}`;
        // reserve enough room after the longest bar for that row's own name+value (avoids the two colliding
        // when the top-ranked bar is nearly full width)
        let needed = 60;
        rankList.forEach((a) => {
          ctx.font = nameFont; const nw = ctx.measureText(a.name).width;
          ctx.font = valFont; const vw = ctx.measureText(`${a.rate.toFixed(1)}%`).width;
          needed = Math.max(needed, 8 + nw + 10 + vw + 4);
        });
        rankList.forEach((a, i) => {
          const yy = 268 + i * 22, bwid = (a.rate / mx) * (bw - needed);
          ctx.fillStyle = "rgba(217,164,65,.75)"; ctx.fillRect(px, yy, Math.max(2, bwid), 12);
          ctx.fillStyle = INK; ctx.font = nameFont; ctx.textAlign = "left";
          ctx.fillText(a.name, px + bwid + 8, yy + 10);
          ctx.font = valFont; const nw2 = ctx.measureText(a.name).width;
          ctx.fillStyle = MUTE; ctx.fillText(`${a.rate.toFixed(1)}%`, px + bwid + 8 + nw2 + 10, yy + 10);
        });
      }
      // hover tooltip
      if (hover) {
        const hit = [...geo.d, ...geo.c].find((g) => hover[0] >= g.x0 && hover[0] <= g.x1 && hover[1] >= g.top && hover[1] <= g.bottom);
        if (hit) {
          const isDelay = geo.d.includes(hit);
          const lines = [[`${hit.c.name} · ${isDelay ? "지연" : "결항"}`, 1], [`${KF.fmt(hit.c.value)}편 · ${isDelay ? "지연" : "결항"} 안의 ${hit.c.share.toFixed(1)}%`, 0], [airport === "전체" ? "전체 공항" : airport + " · " + route, 2]];
          tip(ctx, w, h, lines, hover);
        }
      }
    });
  }

  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(""); let line = "", yy = y;
    for (const ch of words) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = ch; yy += lh; }
      else line = test;
    }
    if (line) ctx.fillText(line, x, yy);
  }

  VIZ["flight-delays"] = { thumb, mount, bg: BG };
})();
