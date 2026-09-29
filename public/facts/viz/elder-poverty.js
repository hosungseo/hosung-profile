// 70 elder-poverty — "지팡이 눈금자 (walking-cane ruler)". Two wooden canes stand on the floor, one
// per group; a brass grip band climbs or drops the shaft as the year slider moves, and the wood
// below the band is stained darker — the share of that group living under the poverty line.
(() => {
  const BG = "#d8bec7";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#3a2028", DIM = "rgba(58,32,40,.64)", FAINT = "rgba(58,32,40,.16)";
  const WOOD_HI = "#a9764a", WOOD = "#8a5a35", WOOD_DK = "#5c3a22", WOOD_STAIN = "#4a3020";
  const BRASS = "#c9a227", BRASS_DK = "#8a6c1a", ACCENT = "#a23b3b", GOOD = "#3c6b4a";
  const SCALE = 60; // poverty-rate (%) at the top of the cane

  // ---------------------------------------------------------------- one cane
  // baseY: floor line. cx: centre x. len: shaft length (handle to ferrule tip). rate: 0..SCALE.
  function cane(ctx, cx, baseY, len, thick, rate, opts = {}) {
    const topY = baseY - len, hookR = thick * 2.1;
    const bandY = KF.clamp(baseY - (rate / SCALE) * len, topY + hookR * 1.6, baseY - thick * 1.4);
    ctx.save();
    // shadow
    ctx.fillStyle = "rgba(40,20,15,.18)";
    ctx.beginPath(); ctx.ellipse(cx + thick * 0.4, baseY + 4, thick * 2.6, thick * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    // shaft path (used for clipping the stain + gradient fill)
    const shaft = new Path2D();
    shaft.roundRect(cx - thick / 2, topY + hookR * 0.9, thick, baseY - (topY + hookR * 0.9), thick / 2);
    // hook handle
    const hook = new Path2D();
    hook.arc(cx + hookR - thick / 2, topY + hookR, hookR, Math.PI, Math.PI * 2.02, false);
    ctx.save();
    ctx.lineWidth = thick; ctx.lineCap = "round"; ctx.strokeStyle = opts.hi ? WOOD_HI : WOOD;
    ctx.stroke(hook);
    ctx.restore();
    // shaft: wood grain gradient above the band, stained dark below it
    const grad = ctx.createLinearGradient(cx - thick / 2, 0, cx + thick / 2, 0);
    grad.addColorStop(0, WOOD_DK); grad.addColorStop(0.22, WOOD_HI); grad.addColorStop(0.5, "#c79866"); grad.addColorStop(0.78, WOOD_HI); grad.addColorStop(1, WOOD_DK);
    ctx.fillStyle = grad; ctx.fill(shaft);
    ctx.save();
    ctx.clip(shaft);
    ctx.fillStyle = WOOD_STAIN; ctx.globalAlpha = 0.86;
    ctx.fillRect(cx - thick, bandY, thick * 2, baseY - bandY + 4);
    ctx.globalAlpha = 1;
    // faint grain lines
    ctx.strokeStyle = "rgba(40,20,10,.16)"; ctx.lineWidth = 1;
    for (let yy = topY + hookR; yy < baseY; yy += thick * 0.9) { ctx.beginPath(); ctx.moveTo(cx - thick / 2, yy); ctx.lineTo(cx + thick / 2, yy + thick * 0.3); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = opts.hi ? INK : "rgba(50,25,15,.4)"; ctx.lineWidth = opts.hi ? 1.8 : 1; ctx.stroke(shaft);
    // ferrule (metal tip)
    ctx.fillStyle = "#9a9a94"; ctx.fillRect(cx - thick / 2 - 0.5, baseY - thick * 1.3, thick + 1, thick * 1.3);
    ctx.fillStyle = "#3a3a36"; ctx.fillRect(cx - thick / 2 - 0.5, baseY - 3, thick + 1, 4);
    // brass grip band at the poverty line
    const bh = Math.max(4, thick * 0.62);
    ctx.fillStyle = opts.hi ? "#e4bf3c" : BRASS;
    ctx.fillRect(cx - thick / 2 - 2.5, bandY - bh / 2, thick + 5, bh);
    ctx.fillStyle = BRASS_DK; ctx.fillRect(cx - thick / 2 - 2.5, bandY + bh / 2 - 1.4, thick + 5, 1.4);
    ctx.strokeStyle = "rgba(60,40,10,.5)"; ctx.lineWidth = 1; ctx.strokeRect(cx - thick / 2 - 2.5, bandY - bh / 2, thick + 5, bh);
    // graduation ticks (full mode)
    if (opts.ticks) {
      ctx.strokeStyle = "rgba(58,32,40,.4)"; ctx.lineWidth = 1; ctx.textAlign = "left"; ctx.font = `500 9px ${MONO}`; ctx.fillStyle = DIM;
      for (let v = 0; v <= SCALE; v += 10) {
        const yy = baseY - (v / SCALE) * len;
        ctx.beginPath(); ctx.moveTo(cx + thick / 2 + 4, yy); ctx.lineTo(cx + thick / 2 + 9, yy); ctx.stroke();
        if (opts.tickLabels) ctx.fillText(`${v}`, cx + thick / 2 + 12, yy + 3);
      }
    }
    ctx.restore();
    return { cx, bandY, topY, baseY, hookR, thick, hitX0: cx - thick * 2, hitX1: cx + thick * 2, hitY0: topY, hitY1: baseY };
  }

  function floor(ctx, x, y, w, h) {
    ctx.fillStyle = "rgba(70,40,30,.14)"; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(70,40,30,.18)"; ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) { const xx = x + (i / 10) * w; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke(); }
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `700 12px ${SANS}`;
    let bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22;
    const bh = 12 + lines.length * 18;
    const bx = KF.clamp(x + 14, 6, w - bw - 6), by = KF.clamp(y - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(58,32,40,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || "#f4ece6"; ctx.font = `${i ? 500 : 700} 12px ${SANS}`; ctx.fillText(t, bx + 11, by + 18 + i * 18); });
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const baseY = h * 0.86, len = h * 0.62;
    const c = t % 10;
    // ends (u=1) at c=3.0 and holds — by t=3.5 (the reduced-motion / offscreen still frame) there is a
    // clean 0.5s margin, so that frame always reads as the latest year, never a mid-transition value
    const u = KF.ease(KF.clamp((c - 0.5) / 2.5, 0, 1));
    const y0 = 0, y1 = d.age["66-75"].length - 1;
    const a = KF.lerp(d.age["66-75"][y0], d.age["66-75"][y1], u), b = KF.lerp(d.age["76+"][y0], d.age["76+"][y1], u);
    const yr = Math.round(KF.lerp(+d.years[y0], +d.years[d.years.length - 1], u));
    cane(ctx, w * 0.36, baseY, len, Math.max(7, w * 0.028), a, {});
    cane(ctx, w * 0.62, baseY, len, Math.max(7, w * 0.028), b, {});
    // top-left is reserved for the board's "데이터 N개" badge (~90x36px) — keep text baselines well below h*0.4
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.075)}px ${SANS}`;
    ctx.fillText("노인 빈곤율", w * 0.05, h * 0.3);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.05)}px ${SANS}`;
    ctx.fillText("66~75세 · 76세 이상", w * 0.05, h * 0.3 + h * 0.075);
    // the percentages below move with the animation, so label the year they belong to — without this a
    // reader catching a mid-transition frame has no way to tell it isn't the latest year
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.048)}px ${MONO}`;
    ctx.fillText(`${yr}년`, w * 0.05, h * 0.3 + h * 0.075 * 2.1);
    ctx.textAlign = "center"; ctx.font = `700 ${Math.round(h * 0.06)}px ${MONO}`; ctx.fillStyle = INK;
    ctx.fillText(`${a.toFixed(0)}%`, w * 0.36, baseY + h * 0.1);
    ctx.fillStyle = ACCENT; ctx.fillText(`${b.toFixed(0)}%`, w * 0.62, baseY + h * 0.1);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let tab = "age", hover = null;
    const years = d.years;
    let yr = years[years.length - 1];
    let t0 = performance.now(), animating = true;

    KF.segment(controls, [{ id: "age", label: "66~75세 · 76세 이상" }, { id: "sex", label: "66세 이상 · 성별" }], tab, (id) => { tab = id; });
    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = years.length - 1; range.step = 1; range.value = years.length - 1;
    const lab = document.createElement("label"); lab.append("연도", range); controls.appendChild(lab);
    const replay = document.createElement("button"); replay.type = "button"; replay.textContent = "처음부터";
    replay.onclick = () => { t0 = performance.now(); animating = true; range.value = 0; };
    controls.appendChild(replay);
    range.oninput = () => { yr = years[+range.value]; animating = false; };

    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      const panelW = full ? w * 0.34 : 0;
      const sceneW = w - panelW;

      // auto-play once on entry: sweep the slider 2011 -> latest over ~5s, then hand control to the user
      let yi;
      if (animating) {
        const el = (performance.now() - t0) / 1000;
        const p = KF.clamp((el - 0.3) / 4.2, 0, 1);
        yi = Math.round(p * (years.length - 1));
        range.value = yi;
        if (p >= 1) animating = false;
      } else yi = years.indexOf(yr);
      const year = years[yi];

      const baseY = h * (full ? 0.82 : 0.74), len = h * (full ? 0.62 : 0.52), thick = Math.max(9, sceneW * 0.02);
      floor(ctx, 0, baseY, sceneW, h - baseY);

      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
      ctx.fillText(`지팡이 눈금자 · ${year}년`, full ? 22 : 12, full ? 40 : 24);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 12 : 10.5}px ${SANS}`;
      ctx.fillText("놋쇠 밴드 높이 = 상대적 빈곤율 · 밴드 아래 짙은 색 = 그만큼이 가난하다", full ? 22 : 12, full ? 62 : 40);

      const cx0 = sceneW * (full ? 0.34 : 0.32), cx1 = sceneW * (full ? 0.64 : 0.62);
      if (full) { // one shared ruler, drawn once so it never collides with a value label
        const ax = cx0 - thick * 4.4;
        ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.textAlign = "right"; ctx.font = `500 9.5px ${MONO}`; ctx.fillStyle = DIM;
        for (let v = 0; v <= SCALE; v += 10) {
          const yy = baseY - (v / SCALE) * len;
          ctx.beginPath(); ctx.moveTo(ax - 5, yy); ctx.lineTo(ax, yy); ctx.stroke();
          ctx.fillText(`${v}%`, ax - 8, yy + 3);
        }
      }

      const groups = tab === "age"
        ? [{ label: "66~75세", v: d.age["66-75"][yi], v0: d.age["66-75"][0] }, { label: "76세 이상", v: d.age["76+"][yi], v0: d.age["76+"][0] }]
        : (() => { const si = d.sex.years.indexOf(year); return [{ label: "남자(66+)", v: d.sex.mD[si], v0: d.sex.mD[0] }, { label: "여자(66+)", v: d.sex.fD[si], v0: d.sex.fD[0] }]; })();

      let hit = null;
      [cx0, cx1].forEach((cx, i) => {
        const g = groups[i];
        const rHi = hover && hover[0] > cx - thick * 3 && hover[0] < cx + thick * 3 && hover[1] > baseY - len - 20 && hover[1] < baseY + 10;
        const c = cane(ctx, cx, baseY, len, thick, g.v, { hi: rHi, ticks: full });
        if (rHi) hit = { ...g, cx, y: c.bandY };
        ctx.textAlign = "center"; ctx.fillStyle = i === 1 ? ACCENT : INK; ctx.font = `700 ${full ? 13 : 11}px ${SANS}`;
        ctx.fillText(g.label, cx, baseY + (full ? 26 : 20));
        ctx.font = `800 ${full ? 17 : 13}px ${MONO}`;
        // always set the value beside the shaft (never centred on it, or the digits cross the wood) —
        // push further right when the band sits in the hook's zone so it clears the curve too
        const crowdedByHook = c.bandY - c.topY < c.hookR * 2.3;
        ctx.textAlign = "left";
        ctx.fillText(`${g.v.toFixed(1)}%`, cx + (crowdedByHook ? c.hookR * 2 + 6 : thick / 2 + 10), c.bandY + 4);
        ctx.textAlign = "center";
      });

      // ---- side panel ----
      if (full) {
        const x0 = sceneW + 20;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 14px ${SANS}`;
        ctx.fillText(`${years[0]}년 → ${years[years.length - 1]}년`, x0, 40);
        let yy = 66;
        groups.forEach((g, i) => {
          const last = tab === "age" ? d.age[i === 0 ? "66-75" : "76+"][years.length - 1] : (i === 0 ? d.sex.mD[d.sex.mD.length - 1] : d.sex.fD[d.sex.fD.length - 1]);
          ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText(`${g.label} 빈곤율`, x0, yy);
          ctx.font = `700 21px ${MONO}`; ctx.fillStyle = i === 1 ? ACCENT : GOOD;
          ctx.fillText(`${g.v0.toFixed(1)}% → ${last.toFixed(1)}%`, x0, yy + 25);
          yy += 46;
        });
        yy += 8;
        ctx.strokeStyle = FAINT; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + panelW - 40, yy); ctx.stroke();
        yy += 26;
        const mLast = d.sex.allM[d.sex.allM.length - 1], dLast = d.sex.allD[d.sex.allD.length - 1];
        const gap0 = (d.sex.allM[0] - d.sex.allD[0]).toFixed(1), gap1 = (mLast - dLast).toFixed(1);
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText("연금·수당의 효과(시장−처분가능 빈곤율)", x0, yy);
        ctx.font = `700 20px ${MONO}`; ctx.fillStyle = GOOD; ctx.fillText(`${gap0}%p → ${gap1}%p`, x0, yy + 24);
        yy += 50;
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText("65세 이상 고용률", x0, yy);
        ctx.font = `700 20px ${MONO}`; ctx.fillStyle = INK;
        ctx.fillText(`${d.employ65.rate[0].toFixed(1)}% → ${d.employ65.rate[d.employ65.rate.length - 1].toFixed(1)}%`, x0, yy + 24);
        yy += 50;
        const r0 = d.income.retire[0], r1 = d.income.retire[d.income.retire.length - 1];
        const pubShare = (arr) => (arr[4] / (arr[0] + arr[1] + arr[2] + arr[3] + arr[4]) * 100);
        ctx.fillStyle = DIM; ctx.font = `500 11px ${SANS}`; ctx.fillText("소득 중 공적이전(연금 등)의 몫", x0, yy);
        ctx.font = `700 20px ${MONO}`; ctx.fillStyle = INK;
        ctx.fillText(`${pubShare(r0).toFixed(1)}% → ${pubShare(r1).toFixed(1)}%`, x0, yy + 24);
        yy += 46;
        ctx.fillStyle = DIM; ctx.font = `500 10.5px ${SANS}`;
        ["연도 슬라이더를 움직이거나 지팡이에", "손을 올려 값을 확인할 수 있다."].forEach((t, i) => ctx.fillText(t, x0, yy + i * 15));
      } else {
        ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 10px ${SANS}`;
        ctx.fillText("연도 슬라이더로 시간을 움직인다", 12, h - 14);
      }

      if (hit) tip(ctx, w, h, hit.cx, hit.y, [[hit.label, "#f4ece6"], [`${year}년 ${hit.v.toFixed(1)}%`], [`${years[0]}년에는 ${hit.v0.toFixed(1)}%`]]);
    });
  }

  VIZ["elder-poverty"] = { thumb, mount, bg: BG };
})();
