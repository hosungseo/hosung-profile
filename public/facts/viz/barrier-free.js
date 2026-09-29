// 99 barrier-free — "경사로 단면 수평계". Six ramps in side elevation, one per facility group (매개·내부·위생·
// 안내·기타시설·비치용품). Each ramp's rise (0-100%) is filled in two bands: a green zone up to the *proper*
// install rate, an amber "built but under spec" zone up to the plain install rate, and bare ground beyond that
// (never installed). A small spirit level at the ramp's crest tips further off-centre the bigger that gap is.
(() => {
  const BG = "#e6ddc6";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#3b2e22", MUTE = "rgba(59,46,34,.64)", FAINT = "rgba(59,46,34,.16)";
  const GROUND = "#cdc2a8", PROPER = "#2f6b52", UNDER = "#c9903f", OUTLINE = "#3b2e22";
  const SKY = "#efe8d4";

  const GROUPS = ["매개시설", "내부시설", "위생시설", "안내시설", "기타시설", "비치용품"];
  const GDEF = {
    매개시설: "출입로·주차구역", 내부시설: "복도·승강기", 위생시설: "화장실", 안내시설: "점자블록·안내판", 기타시설: "기타 설비", 비치용품: "점자안내서 등",
  };
  const PRESETS = [["all", "전체"], ["우체국", "우체국"], ["보건소", "보건소"], ["초등학교", "초등학교"]];

  // ---------------------------------------------------------------- helpers
  function short(name, max) {
    let s = name.replace(/^제[12]종근린생활시설\s*/, "").replace(/^.*?시설\s*/, "");
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }
  function fmtN(n) {
    return KF.fmt(n);
  }

  // draw one ramp (side elevation). Returns the hit-box for hover.
  function ramp(ctx, x0, yBase, w, h, v, small) {
    if (v.n === 0) {
      ctx.strokeStyle = FAINT; ctx.setLineDash([3, 3]); ctx.strokeRect(x0 + 1, yBase - h, w - 2, h); ctx.setLineDash([]);
      ctx.fillStyle = MUTE; ctx.font = `500 ${small ? 9 : 10.5}px ${SANS}`; ctx.textAlign = "center";
      ctx.fillText("자료 없음", x0 + w / 2, yBase - h / 2);
      return { x0, yBase, w, h, v, empty: true };
    }
    const tri = new Path2D();
    tri.moveTo(x0, yBase); tri.lineTo(x0 + w, yBase); tri.lineTo(x0 + w, yBase - h); tri.closePath();
    ctx.save(); ctx.clip(tri);
    ctx.fillStyle = GROUND; ctx.fillRect(x0, yBase - h, w, h);
    // hatch for the "installed but not to spec" full width first (so it only shows past the proper line)
    ctx.fillStyle = UNDER; ctx.fillRect(x0, yBase - h, (w * v.installed) / 100, h);
    ctx.fillStyle = PROPER; ctx.fillRect(x0, yBase - h, (w * v.proper) / 100, h);
    ctx.restore();
    // diagonal hazard hatch on the under-spec band only
    const px = x0 + (w * v.proper) / 100, ix = x0 + (w * v.installed) / 100;
    if (ix > px + 1) {
      ctx.save();
      const band = new Path2D(); band.rect(px, yBase - h, ix - px, h); band.addPath(tri);
      ctx.clip(tri);
      ctx.strokeStyle = "rgba(59,46,34,.35)"; ctx.lineWidth = small ? 1.4 : 2;
      for (let x = px - h; x < ix + 1; x += small ? 7 : 9) {
        ctx.beginPath(); ctx.moveTo(x, yBase); ctx.lineTo(x + h, yBase - h); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = small ? 1.1 : 1.5; ctx.stroke(tri);
    // ground hatch (soil) beneath
    ctx.strokeStyle = "rgba(59,46,34,.5)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 - 3, yBase + 0.5); ctx.lineTo(x0 + w + 3, yBase + 0.5); ctx.stroke();
    for (let x = x0 - 2; x < x0 + w + 2; x += 6) { ctx.beginPath(); ctx.moveTo(x, yBase + 1); ctx.lineTo(x - 3, yBase + 5); ctx.stroke(); }
    return { x0, yBase, w, h, v, px, ix, empty: false };
  }

  // small bubble level at the ramp crest; bubble drifts off-centre with the install/proper gap
  function level(ctx, cx, cy, r, gap, small) {
    ctx.save();
    ctx.fillStyle = "rgba(239,232,212,.92)"; ctx.strokeStyle = OUTLINE; ctx.lineWidth = small ? 1 : 1.3;
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, 7); ctx.fill(); ctx.stroke();
    const off = KF.clamp(gap / 22, -0.72, 0.72) * (r - r * 0.32);
    ctx.fillStyle = gap > 8 ? "#b5482f" : "#2f6b52";
    ctx.beginPath(); ctx.ellipse(cx + off, cy, r * 0.3, r * 0.19, 0, 0, 7); ctx.fill();
    ctx.restore();
  }

  function tip(ctx, w, h, lines, p) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : k === 2 ? `500 10.5px ${MONO}` : `500 11.5px ${SANS}`);
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 12 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(59,46,34,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#efe8d4"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? "rgba(239,232,212,.75)" : k === 1 ? "#e8c98a" : "#efe8d4"; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + j * 18); });
  }

  function certStrip(ctx, x0, y0, w, cert, full) {
    const bh = full ? 34 : 22, gap = full ? 10 : 6;
    const mx = cert.pre + cert.final;
    const preW = (w - gap) * (cert.pre / mx), finW = (w - gap) - preW;
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 11 : 9.5}px ${SANS}`;
    ctx.fillText("BF 인증 현황 (설치율과는 다른 자료·다른 기준)", x0, y0 - 6);
    ctx.fillStyle = "#a99a7e"; ctx.fillRect(x0, y0, preW, bh);
    let gx = x0;
    const gcolors = { 최우수: "#2f6b52", 우수: "#4f8f6c", 일반: "#8fb39c" };
    for (const g of ["최우수", "우수", "일반"]) {
      const gw = finW * (cert.grades[g] / cert.final);
      ctx.fillStyle = gcolors[g]; ctx.fillRect(x0 + preW + gap + (gx - x0 - preW - gap), y0, gw, bh);
      gx += gw;
    }
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, preW - 1, bh - 1);
    ctx.strokeRect(x0 + preW + gap + 0.5, y0 + 0.5, finW - 1, bh - 1);
    ctx.font = `700 ${full ? 11 : 9}px ${MONO}`; ctx.textAlign = "center"; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(45,35,20,.85)"; ctx.fillStyle = "#fbf6ea";
    if (preW > 44) { ctx.strokeText(`예비 ${fmtN(cert.pre)}`, x0 + preW / 2, y0 + bh / 2 + 4); ctx.fillText(`예비 ${fmtN(cert.pre)}`, x0 + preW / 2, y0 + bh / 2 + 4); }
    if (finW > 44) { ctx.strokeText(`본 ${fmtN(cert.final)}`, x0 + preW + gap + finW / 2, y0 + bh / 2 + 4); ctx.fillText(`본 ${fmtN(cert.final)}`, x0 + preW + gap + finW / 2, y0 + bh / 2 + 4); }
    return y0 + bh + 8;
  }

  // ---------------------------------------------------------------- layout: place 6 ramps
  function layout(w, h, full) {
    const cols = full ? 6 : 2, rows = full ? 1 : 3;
    const top = full ? h * 0.22 : h * 0.14, bottom = full ? h * 0.62 : h * 0.74;
    const gx = full ? 18 : 14, gy = full ? 0 : 14;
    const cw = (w - gx * (cols + 1)) / cols, ch = (bottom - top - gy * (rows - 1)) / rows;
    const out = [];
    for (let i = 0; i < 6; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      out.push({ x0: gx + c * (cw + gx), yBase: top + r * (ch + gy) + ch, w: cw, h: ch * 0.86 });
    }
    return out;
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const set = d.sets[0].values; // 전체
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = SKY; ctx.fillRect(0, 0, w, h * 0.7);
    const boxes = layout(w, h, true);
    const grow = KF.ease(KF.clamp((t % 10) / 1.4, 0, 1));
    GROUPS.forEach((g, i) => {
      const v = set[i], b = boxes[i];
      ramp(ctx, b.x0, b.yBase, b.w, b.h * grow, v.n ? v : { n: 0 }, true);
      ctx.fillStyle = INK; ctx.font = `600 ${Math.max(8, h * 0.032)}px ${SANS}`; ctx.textAlign = "center";
      ctx.fillText(g.replace("시설", ""), b.x0 + b.w / 2, b.yBase + h * 0.06);
    });
    const a = KF.clamp(((t % 10) - 1.6) / 0.8, 0, 1);
    ctx.globalAlpha = a;
    // glyph badge sits bottom-left (~50x50px) — start these stat lines well right of it.
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.09)}px ${SANS}`; ctx.textAlign = "left";
    ctx.fillText(`설치율 ${d.total.installed.toFixed(0)}%`, w * 0.19, h * 0.8);
    ctx.fillStyle = "#b5482f"; ctx.font = `600 ${Math.round(h * 0.055)}px ${SANS}`;
    ctx.fillText(`적정설치율은 ${d.total.proper.toFixed(0)}%`, w * 0.19, h * 0.91);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let facility = null; // null = using a preset; otherwise index into d.facilities
    let presetId = "all";
    let hover = null, t0 = performance.now();
    let boxes = [];

    const row = document.createElement("div");
    row.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;align-items:center;width:100%";
    controls.appendChild(row);
    KF.segment(row, PRESETS.map(([id, label]) => ({ id, label })), "all", (id) => { presetId = id; facility = null; t0 = performance.now(); render(); });
    const sep = document.createElement("span"); sep.className = "readout"; sep.textContent = "또는"; row.appendChild(sep);
    const sel = document.createElement("select");
    sel.style.cssText = "font:inherit;font-size:12px;max-width:220px;padding:7px;background:#efe8d4;color:#3b2e22;border:1px solid #a99a7e;border-radius:4px";
    const opt0 = document.createElement("option"); opt0.value = ""; opt0.textContent = "시설 유형 79종 중 선택…"; sel.appendChild(opt0);
    d.facilities.forEach((f, i) => { const o = document.createElement("option"); o.value = String(i); o.textContent = f.name; sel.appendChild(o); });
    sel.addEventListener("change", () => { if (sel.value === "") return; facility = +sel.value; t0 = performance.now(); render(); });
    row.appendChild(sel);
    const live = document.createElement("span"); live.setAttribute("aria-live", "polite");
    live.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)"; row.appendChild(live);

    function currentSet() {
      if (facility != null) return { name: d.facilities[facility].name, values: d.facilities[facility].values };
      const p = d.sets.find((x) => x.id === presetId);
      return { name: p.name, values: p.values };
    }

    function render() {
      const cs = currentSet();
      live.textContent = `${cs.name}: 설치율과 적정설치율을 여섯 편의시설군 경사로로 보여줍니다.`;
    }

    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerdown", (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, cs = currentSet();
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = SKY; ctx.fillRect(0, 0, w, h * (full ? 0.66 : 0.6));
      const el = (performance.now() - t0) / 1000;
      const grow = KF.ease(KF.clamp(el / 1.1, 0, 1));

      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 14.5}px ${SERIF}`;
      ctx.fillText(full ? `${short(cs.name, 26)} · 시설군별 설치 경사로` : short(cs.name, 16), full ? 18 : 12, full ? 30 : 22);
      ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11.5 : 9.5}px ${SANS}`;
      ctx.fillText("초록 = 적정설치 · 빗금 = 설치는 됐지만 기준 미달 · 맨땅 = 미설치", full ? 18 : 12, full ? 48 : 34);

      boxes = layout(w, h, full);
      let hit = null, hd = 30 * 30;
      GROUPS.forEach((g, i) => {
        const v = cs.values[i], b = boxes[i];
        const box = ramp(ctx, b.x0, b.yBase, b.w, b.h * grow, v.n ? v : { n: 0 }, !full);
        if (v.n) level(ctx, b.x0 + b.w * 0.5, b.yBase - b.h * grow - (full ? 14 : 9), full ? 11 : 8, v.gap, !full);
        ctx.fillStyle = INK; ctx.font = `600 ${full ? 12.5 : 10}px ${SANS}`; ctx.textAlign = "center";
        ctx.fillText(g, b.x0 + b.w / 2, b.yBase + (full ? 20 : 14));
        if (full) { ctx.fillStyle = MUTE; ctx.font = `500 9.5px ${SANS}`; ctx.fillText(GDEF[g], b.x0 + b.w / 2, b.yBase + 34); }
        if (hover) {
          const cx = KF.clamp(hover[0], b.x0, b.x0 + b.w), cy = KF.clamp(hover[1], b.yBase - b.h, b.yBase);
          const e = (hover[0] - cx) ** 2 + (hover[1] - cy) ** 2;
          if (e < hd) { hd = e; hit = { g, v, b }; }
        }
      });

      if (full) {
        const readY = boxes[0].yBase + 64;
        ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 12px ${SANS}`;
        ctx.fillText(cs.name === "전체" ? "전체 시설 합계" : `${short(cs.name, 30)} 전체`, 18, readY);
        ctx.fillStyle = INK; ctx.font = `700 26px ${SANS}`;
        const totN = cs.values.reduce((a, v) => a + v.n, 0), totI = cs.values.reduce((a, v) => a + v.i, 0), totP = cs.values.reduce((a, v) => a + v.p, 0);
        const instR = totN ? (totI / totN) * 100 : 0, propR = totN ? (totP / totN) * 100 : 0;
        ctx.fillText(`${instR.toFixed(1)}%`, 18, readY + 30);
        ctx.fillStyle = "#b5482f"; ctx.font = `500 12.5px ${SANS}`;
        ctx.fillText(`적정설치율 ${propR.toFixed(1)}% (차이 ${(instR - propR).toFixed(1)}%p)`, 18, readY + 50);
        certStrip(ctx, w - 340, readY - 8, 322, d.cert, full);
        ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${SANS}`; ctx.textAlign = "left";
        ctx.fillText(`조사 항목 분모 ${fmtN(totN)}개 · 설치 ${fmtN(totI)} · 적정 ${fmtN(totP)}`, 18, readY + 70);
      } else {
        certStrip(ctx, 12, h - 46, w - 24, d.cert, full);
      }

      if (hit && hover && !hit.v.empty) {
        tip(ctx, w, h, [
          [`${hit.g}`, 1],
          [`설치율 ${hit.v.installed.toFixed(1)}%  ·  적정설치율 ${hit.v.proper.toFixed(1)}%`, 0],
          [`차이 ${hit.v.gap.toFixed(1)}%p`, 0],
          [`설치 ${fmtN(hit.v.i)} / 적정 ${fmtN(hit.v.p)} / 분모 ${fmtN(hit.v.n)}`, 2],
        ], hover);
      } else if (hit && hover && hit.v.empty) {
        tip(ctx, w, h, [[`${hit.g}`, 1], ["이 시설 유형은 집계값이 없습니다", 2]], hover);
      }
    });
    render();
  }

  VIZ["barrier-free"] = { thumb, mount, bg: BG };
})();
