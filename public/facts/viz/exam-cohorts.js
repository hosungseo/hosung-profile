// 71 exam-cohorts — "감독관 계수기" (a proctor's mechanical hand-tally counter). Each category gets
// its own digit-wheel counter; scrub the school year and the wheels reset to that year's count.
// Below, in the same composition, birth-year counters line up against registration counters to show
// the 2007 "golden pig year" cohort explains the 2026학년도 rebound in enrolled-student registrations.
(() => {
  const BG = "#181c24";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#eef0f4", DIM = "rgba(238,240,244,.6)", FAINT = "rgba(238,240,244,.16)";
  const BODY = "#2c313d", BODY_D = "#20242d", WHEEL = "#f2efe4", WHEEL_INK = "#20242d";
  const AMBER = "#e0a840", RED = "#c9654a", TEAL = "#5aa8a0";

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // a mechanical tally counter: dark body + a row of digit wheels showing `value`, padded to nDigits
  function counter(ctx, x, y, w, h, value, nDigits, accent, full) {
    roundRect(ctx, x, y, w, h, h * 0.14); ctx.fillStyle = BODY; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(x, y, w, Math.max(2, h * 0.06));
    const pad = w * 0.06, winY = y + h * 0.24, winH = h * 0.5, winW = w - pad * 2;
    roundRect(ctx, x + pad, winY, winW, winH, winH * 0.1); ctx.fillStyle = BODY_D; ctx.fill();
    const str = String(Math.max(0, Math.round(value))).padStart(nDigits, "0");
    const dgap = Math.min(3, winW * 0.01), dw = (winW - dgap * (nDigits + 1)) / nDigits;
    for (let i = 0; i < nDigits; i++) {
      const dx = x + pad + dgap + i * (dw + dgap), dy = winY + winH * 0.08, dh = winH * 0.84;
      roundRect(ctx, dx, dy, dw, dh, Math.min(2, dw * 0.14)); ctx.fillStyle = WHEEL; ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(dx, dy, dw, dh * 0.32);
      ctx.fillStyle = WHEEL_INK; ctx.font = `700 ${Math.round(dh * 0.66)}px ${MONO}`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(str[i], dx + dw / 2, dy + dh * 0.56);
    }
    ctx.textBaseline = "alphabetic";
    // side lever
    if (full) {
      ctx.fillStyle = "rgba(0,0,0,.5)"; roundRect(ctx, x + w - w * 0.03, y + h * 0.15, w * 0.05, h * 0.35, 3); ctx.fill();
    }
    return { x, y, w, h };
  }

  function tipBox(ctx, w, h, px, py, lines) {
    const fs = 12;
    ctx.font = `700 ${fs + 1}px ${SANS}`;
    let bw = ctx.measureText(lines[0][0]).width;
    ctx.font = `500 ${fs}px ${SANS}`;
    for (const [t] of lines.slice(1)) bw = Math.max(bw, ctx.measureText(t).width);
    bw += 22; const bh = 12 + lines.length * (fs + 6);
    const bx = KF.clamp(px + 14 + bw > w - 6 ? px - bw - 14 : px + 14, 6, w - bw - 6), by = KF.clamp(py - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(10,12,16,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(238,240,244,.3)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, c], i) => { ctx.fillStyle = c || INK; ctx.font = `${i ? 500 : 700} ${i ? fs : fs + 1}px ${SANS}`; ctx.fillText(t, bx + 11, by + 6 + (i + 1) * (fs + 6) - 3); });
  }

  // ---------------------------------------------------------------- thumb
  // Keep the top-left 90x36 (badge) and bottom-left 50x50 (glyph) corners clear: the counter and both
  // caption lines sit inside y in [0.2h, 0.79h] here.
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, i = d.years.length - 1;
    const up = KF.clamp((c - 0.15) / 1.2, 0, 1);
    counter(ctx, h * 0.1, h * 0.2, w - h * 0.2, h * 0.38, d.total[i] * up, 6, AMBER, false);
    const a = KF.clamp((c - 1.4) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(h * 0.066)}px ${SANS}`;
    ctx.fillText(`${d.years[i]}학년도 수능 접수`, h * 0.1, h * 0.66);
    ctx.fillStyle = DIM; ctx.font = `500 ${Math.round(h * 0.046)}px ${SANS}`;
    ctx.fillText(`재학생 아닌 접수자 ${(((d.graduate[i] + d.other[i]) / d.total[i]) * 100).toFixed(0)}%`, h * 0.1, h * 0.76);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  // One composition, always: the year-slider counters on top, the "황금돼지해 코호트" comparison
  // (fixed to the latest 학년도) below — no view toggle, so the stage is never half-empty.
  function mount(stage, controls, d) {
    const sc = KF.canvas(stage);
    let yi = d.years.length - 1, hover = null, t0 = performance.now(), counters = [];
    const slider = document.createElement("input");
    slider.type = "range"; slider.min = 0; slider.max = d.years.length - 1; slider.value = yi;
    slider.setAttribute("aria-label", "학년도");
    const out = document.createElement("output");
    const lab = document.createElement("label"); lab.style.cssText = "display:flex;align-items:center;gap:8px"; lab.append(slider, out);
    controls.append(lab);
    slider.oninput = () => { yi = +slider.value; t0 = performance.now() - 2000; }; // skip the grow-in on scrub

    const setHover = (e) => { const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointermove", setHover);
    stage.addEventListener("pointerdown", setHover);
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = sc, full = w > 520;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      counters = [];
      out.textContent = `${d.years[yi]}학년도`;
      const el = (performance.now() - t0) / 1000;
      const grow = KF.ease(KF.clamp((el - 0.15) / 1.1, 0, 1));

      // ---- section 1: 선택한 학년도의 접수 계수기 ----
      const y = d.years[yi];
      const pad = full ? 32 : 14;
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 19 : 14}px ${SERIF}`;
      ctx.fillText(`${y}학년도 수능 접수`, pad, full ? 32 : 21);
      const bigW = full ? Math.min(460, w * 0.44) : w - pad * 2;
      const bigH = full ? 82 : 60;
      const c0 = counter(ctx, pad, full ? 54 : 42, bigW, bigH, d.total[yi] * grow, 6, AMBER, full);
      counters.push({ ...c0, name: `${y}학년도 총 접수`, val: d.total[yi] });
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11.5 : 9.5}px ${SANS}`;
      ctx.fillText("총 접수", pad, full ? 54 + bigH + 17 : 42 + bigH + 14);

      const subs = [["재학생", d.student[yi], TEAL], ["졸업생", d.graduate[yi], AMBER], ["검정고시 등", d.other[yi], RED]];
      const sy = full ? 54 + bigH + 42 : 42 + bigH + 32;
      const sw = full ? (bigW - 16 * 2) / 3 : (w - pad * 2 - 10 * 2) / 3;
      const sh = full ? 60 : 46;
      subs.forEach(([lbl, val, col], i) => {
        const sx = pad + i * (sw + (full ? 16 : 10));
        const cc = counter(ctx, sx, sy, sw, sh, val * grow, 6, col, full);
        counters.push({ ...cc, name: `${y}학년도 ${lbl}`, val });
        ctx.textAlign = "center"; ctx.fillStyle = DIM; ctx.font = `600 ${full ? 11.5 : 9}px ${SANS}`;
        ctx.fillText(lbl, sx + sw / 2, sy + sh + (full ? 17 : 13));
      });
      let sec1Bottom = sy + sh + (full ? 17 : 13);

      if (full) {
        const px = pad + bigW + 44, py = 66;
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = "700 16px " + SERIF;
        ctx.fillText("실제 응시", px, py);
        ctx.fillStyle = DIM; ctx.font = "500 11.5px " + SANS;
        ctx.fillText("접수했지만 시험장에 오지 않은 사람도 있다", px, py + 21);
        ctx.fillStyle = "#8fb8ff"; ctx.font = "700 38px " + SANS;
        ctx.fillText(`${KF.fmt(Math.round(d.attended[yi] * grow))}명`, px, py + 68);
        ctx.fillStyle = DIM; ctx.font = "500 12.5px " + SANS;
        ctx.fillText(`접수의 ${(d.attended[yi] / d.total[yi] * 100).toFixed(1)}%`, px, py + 92);
        sec1Bottom = Math.max(sec1Bottom, py + 92);
      }

      // ---- section 2: 황금돼지해 코호트 비교 (연도 슬라이더와 무관, 최신 학년도 고정) ----
      const cc = d.cohort;
      const divY = sec1Bottom + (full ? 30 : 22);
      ctx.strokeStyle = FAINT; ctx.beginPath(); ctx.moveTo(pad, divY); ctx.lineTo(w - pad, divY); ctx.stroke();
      const top1 = divY + (full ? 30 : 22);
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 17 : 13}px ${SERIF}`;
      ctx.fillText(`${cc.examLatest}학년도, 1년 늦게 도착한 코호트`, pad, top1);
      ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11 : 9}px ${SANS}`;
      ctx.fillText("출생아수와 재학생 접수, 같은 방향으로 움직였다", pad, top1 + (full ? 20 : 16));

      const items = [
        [`${cc.birthYearPrev}년생 출생아수`, cc.birthPrev, cc.birthLatest, `${cc.birthYearLatest}년생 출생아수`, cc.birthGrowth, AMBER],
        [`${cc.examPrev}학년도 재학생 접수`, cc.studentPrev, cc.studentLatest, `${cc.examLatest}학년도 재학생 접수`, cc.studentGrowth, TEAL],
      ];
      const top0 = top1 + (full ? 34 : 26), rowH = full ? 108 : 82;
      items.forEach(([lab0, v0, v1, lab1, growth, col], ri) => {
        const ry = top0 + ri * rowH;
        const cw = full ? Math.min(320, (w - 2 * pad - 60) / 2) : (w - 2 * pad - 30) / 2;
        const ch = full ? 54 : 40;
        const c1x = pad, c2x = pad + cw + (full ? 60 : 30);
        const cA = counter(ctx, c1x, ry, cw, ch, v0 * grow, 6, col, full);
        const cB = counter(ctx, c2x, ry, cw, ch, v1 * grow, 6, col, full);
        counters.push({ ...cA, name: lab0, val: v0 }, { ...cB, name: lab1, val: v1 });
        ctx.textAlign = "left"; ctx.fillStyle = DIM; ctx.font = `500 ${full ? 10.5 : 8.5}px ${SANS}`;
        ctx.fillText(lab0, c1x, ry + ch + (full ? 16 : 12));
        ctx.fillText(lab1, c2x, ry + ch + (full ? 16 : 12));
        ctx.fillStyle = col; ctx.font = `700 ${full ? 13 : 10}px ${MONO}`; ctx.textAlign = "center";
        ctx.fillText(`${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`, (c1x + cw + c2x) / 2, ry + ch / 2 + 4);
        ctx.textAlign = "left";
      });
      if (full) {
        ctx.fillStyle = DIM; ctx.font = "500 11.5px " + SANS;
        ctx.fillText(`두 증가율의 차이는 ${Math.abs(cc.birthGrowth - cc.studentGrowth).toFixed(1)}%p로 크지 않다. 다음 나이(${cc.birthYearNext}년생, ${KF.fmt(cc.birthNext)}명)는 다시 ${Math.abs(cc.birthDropNext).toFixed(1)}% 적다.`,
          pad, top0 + items.length * rowH + 6);
      }

      if (hover) {
        for (const cc2 of counters) {
          if (hover[0] >= cc2.x && hover[0] <= cc2.x + cc2.w && hover[1] >= cc2.y && hover[1] <= cc2.y + cc2.h) {
            tipBox(ctx, w, h, hover[0], hover[1], [[cc2.name], [`${KF.fmt(Math.round(cc2.val))}명`, DIM]]);
            break;
          }
        }
      }
    });
  }

  VIZ["exam-cohorts"] = { thumb, mount, bg: BG };
})();
