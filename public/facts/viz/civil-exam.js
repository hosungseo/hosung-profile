// 09 civil-exam — "Exam-hall queue". One exam desk = one seat to fill; a roped queue of little people
// waits for it, one person per applicant per seat. Year by year the queue swells and drains.
(() => {
  const BG = "#e9edf2", INK = "#1f2d3d", RED = "#c8452d", SLATE = "#5b6f8a", WOOD = "#b98b57", ROPE = "#b0443a";
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif", SERIF = "'Nanum Myeongjo', serif";
  const COATS = ["#2f4058", "#3d5474", "#50698a", "#6a7f9c", "#2b3a4e", "#46607f"];
  const hash = (a) => { const x = Math.sin(a * 91.345 + 7.13) * 43758.5453; return x - Math.floor(x); };

  const rowsOf = (d, id) => d.exams.find((e) => e.id === id).rows; // [year, seats, apps, ratio]

  // ---------------------------------------------------------------- drawing pieces
  function person(ctx, x, y, s, i, alpha, ghost) { // x: centre, y: feet
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha = alpha;
    if (ghost) { // an outline of someone who used to stand here
      const hr = s * 0.17, bw = s * 0.46, bh = s * 0.5;
      ctx.fillStyle = "rgba(31,45,61,.10)"; ctx.strokeStyle = "rgba(31,45,61,.22)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(x - bw / 2, y - s * 0.26 - bh, bw, bh + s * 0.26); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y - s * 0.26 - bh - hr * 0.9, hr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore(); return;
    }
    const c = COATS[Math.floor(hash(i) * COATS.length)];
    const hr = s * 0.17, bw = s * 0.46, bh = s * 0.5;
    ctx.fillStyle = "#1c2735"; // legs
    ctx.fillRect(x - bw * 0.32, y - s * 0.26, bw * 0.24, s * 0.26); ctx.fillRect(x + bw * 0.08, y - s * 0.26, bw * 0.24, s * 0.26);
    ctx.fillStyle = c; // body
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - bw / 2, y - s * 0.26 - bh, bw, bh, [bw * 0.45, bw * 0.45, 2, 2]); else ctx.rect(x - bw / 2, y - s * 0.26 - bh, bw, bh);
    ctx.fill();
    if (hash(i + 5) < 0.28) { ctx.fillStyle = "#d9a441"; ctx.fillRect(x + bw * 0.28, y - s * 0.26 - bh * 0.62, bw * 0.28, bh * 0.4); } // a book under the arm
    ctx.fillStyle = hash(i + 9) < 0.5 ? "#e8c9a8" : "#d7b28f"; // head
    ctx.beginPath(); ctx.arc(x, y - s * 0.26 - bh - hr * 0.9, hr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hash(i + 2) < 0.8 ? "#1c2735" : "#6b4a2e"; // hair
    ctx.beginPath(); ctx.arc(x, y - s * 0.26 - bh - hr * 1.15, hr * 0.92, Math.PI, 0); ctx.fill();
    ctx.restore();
  }

  function desk(ctx, x, y, s) { // exam desk + chair, side view; (x, y) = floor under the desk
    ctx.save();
    ctx.fillStyle = "#6b7a8f"; // chair
    ctx.fillRect(x - s * 0.62, y - s * 0.46, s * 0.3, s * 0.05); ctx.fillRect(x - s * 0.62, y - s * 0.46, s * 0.04, s * 0.46);
    ctx.fillRect(x - s * 0.36, y - s * 0.46, s * 0.04, s * 0.46); ctx.fillRect(x - s * 0.62, y - s * 0.9, s * 0.04, s * 0.46);
    ctx.fillStyle = WOOD; // desk
    ctx.fillRect(x - s * 0.3, y - s * 0.62, s * 0.78, s * 0.06);
    ctx.fillStyle = "#8f6a40"; ctx.fillRect(x - s * 0.26, y - s * 0.56, s * 0.05, s * 0.56); ctx.fillRect(x + s * 0.38, y - s * 0.56, s * 0.05, s * 0.56);
    ctx.fillStyle = "#fbfaf6"; ctx.fillRect(x - s * 0.12, y - s * 0.65, s * 0.34, s * 0.03); // exam paper
    ctx.strokeStyle = "#c5ccd6"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - s * 0.8, y + 0.5); ctx.lineTo(x + s * 0.6, y + 0.5); ctx.stroke();
    ctx.restore();
  }

  // queue geometry: rows snake right, left, right... starting beside the desk
  function queueGeom(x0, y0, w, rowH, per) {
    const slot = w / per;
    return (k) => {
      const r = Math.floor(k / per), c = k % per, rtl = r % 2 === 1;
      return [x0 + (rtl ? per - 1 - c : c) * slot + slot / 2, y0 + r * rowH, r];
    };
  }

  function queue(ctx, G, count, t, target, ghost) {
    const { x0, y0, w, rowH, per, fig } = G;
    const pos = queueGeom(x0, y0, w, rowH, per);
    const rows = Math.max(1, Math.ceil(Math.max(count, target, ghost ? ghost.n : 0) / per)), slot = w / per;
    // ropes between rows, open at the end where the line turns
    for (let r = 0; r < rows - 1; r++) {
      const y = y0 + r * rowH + (rowH - fig * 1.1) / 2 + 1, openRight = r % 2 === 0;
      const xa = x0 + (openRight ? 2 : slot), xb = x0 + w - (openRight ? slot : 2);
      ctx.strokeStyle = ROPE; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(xa, y); ctx.quadraticCurveTo((xa + xb) / 2, y + 3, xb, y); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = "#8b96a5";
      for (const x of [xa, xb]) { ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill(); }
    }
    if (ghost && ghost.n > count + 2) {
      for (let k = Math.ceil(count); k < Math.ceil(ghost.n); k++) { const [x, y] = pos(k); person(ctx, x, y, fig, k, KF.clamp(ghost.n - k, 0, 1) * ghost.a, true); }
      if (ghost.label) { // under the last outline, kept inside the queue area
        const [lx, ly] = pos(Math.ceil(ghost.n) - 1);
        ctx.save(); ctx.globalAlpha = ghost.a; ctx.fillStyle = "rgba(31,45,61,.66)"; ctx.font = `600 ${G.small ? 10 : 11.5}px ${SANS}`;
        const tw = ctx.measureText(ghost.label).width;
        ctx.textAlign = "left"; ctx.fillText(ghost.label, KF.clamp(lx - tw / 2, x0, x0 + w - tw), ly + (G.small ? 12 : 15)); ctx.restore();
      }
    }
    const n = Math.ceil(count);
    for (let k = 0; k < n; k++) {
      const [x, y] = pos(k), a = KF.clamp(count - k, 0, 1);
      const bob = Math.sin(t * 2.2 + k * 1.7) * 0.6;
      person(ctx, x, y - bob, fig, k, a);
    }
  }

  // small multiples at the bottom: ratio (line), applicants (bars), seats (bars)
  function minis(ctx, x, y, w, h, R, year, full, hover) {
    const gap = full ? 26 : 0, cw = full ? (w - gap * 2) / 3 : w;
    const panels = full ? [["경쟁률 (대 1)", 3, RED, "line"], ["원서 접수 (명)", 2, SLATE, "bar"], ["선발 예정 (명)", 1, WOOD, "bar"]] : [["경쟁률 (대 1)", 3, RED, "line"]];
    const boxes = [];
    panels.forEach(([title, col, color, kind], p) => {
      const px = x + p * (cw + gap), top = y + 18, ph = h - 34;
      const vmax = Math.max(...R.map((r) => r[col])) * 1.08;
      const bx = (i) => px + (i + 0.5) * (cw / R.length);
      const by = (v) => top + ph - (v / vmax) * ph;
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 ${full ? 12 : 11}px ${SANS}`; ctx.fillText(title, px, y + 8);
      const cur = R.find((r) => r[0] === year);
      if (cur) {
        ctx.textAlign = "right"; ctx.fillStyle = color === WOOD ? "#8a5a24" : color; ctx.font = `600 ${full ? 12 : 11}px ${MONO}`;
        ctx.fillText(col === 3 ? cur[3].toFixed(1) : KF.fmt(cur[col]), px + cw, y + 8);
      }
      ctx.strokeStyle = "rgba(31,45,61,.18)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, top + ph + 0.5); ctx.lineTo(px + cw, top + ph + 0.5); ctx.stroke();
      if (kind === "bar") {
        const bw = Math.max(2, (cw / R.length) * 0.62);
        R.forEach((r, i) => {
          const on = r[0] === year, hv = hover && hover.p === p && hover.i === i;
          ctx.fillStyle = on ? (color === WOOD ? "#8a5a24" : INK) : hv ? "rgba(31,45,61,.55)" : color;
          ctx.globalAlpha = on || hv ? 1 : 0.55;
          ctx.fillRect(bx(i) - bw / 2, by(r[col]), bw, top + ph - by(r[col]));
        });
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
        R.forEach((r, i) => (i ? ctx.lineTo(bx(i), by(r[col])) : ctx.moveTo(bx(i), by(r[col])))); ctx.stroke();
        R.forEach((r, i) => {
          const on = r[0] === year;
          ctx.fillStyle = on ? RED : "#fff"; ctx.strokeStyle = RED; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(bx(i), by(r[col]), on ? 4.2 : 2.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
      }
      // first / last year ticks
      ctx.fillStyle = "rgba(31,45,61,.55)"; ctx.font = `500 ${full ? 10 : 9.5}px ${MONO}`;
      ctx.textAlign = "left"; ctx.fillText(String(R[0][0]), px, top + ph + 13);
      ctx.textAlign = "right"; ctx.fillText(String(R[R.length - 1][0]), px + cw, top + ph + 13);
      boxes.push({ px, top, cw, ph, n: R.length, p });
    });
    return boxes;
  }

  let ghostA = 0;
  function ghostOf(R, count, dt) {
    const pk = R.reduce((a, r) => (r[3] > a[3] ? r : a));
    ghostA += ((count < pk[3] - 2 ? 1 : 0) - ghostA) * (1 - Math.exp(-dt * 4));
    return { n: pk[3], a: ghostA, label: `${pk[0]}년엔 ${pk[3].toFixed(1)}명` };
  }

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const R = rowsOf(d, "g9"), hi = R.reduce((a, r) => (r[3] > a[3] ? r : a)), lo = R.reduce((a, r) => (r[3] < a[3] ? r : a));
    const c = t % 10, k = c < 4.6 ? 0 : c < 5.8 ? KF.ease((c - 4.6) / 1.2) : c < 9 ? 1 : 1 - KF.ease((c - 9) / 1);
    const grow = KF.clamp(c / 1.4, 0, 1), cur = k < 0.5 ? hi : lo;
    const count = KF.lerp(hi[3], lo[3], k) * (c < 1.4 ? KF.ease(grow) : 1);
    const fig = h * 0.12, per = 24, x0 = w * 0.16, rowH = h * 0.17;
    const G = { x0, y0: h * 0.36, w: w * 0.8, rowH, per, fig };
    desk(ctx, w * 0.08, h * 0.36 + 2, h * 0.24);
    queue(ctx, G, count, t, count, { n: hi[3], a: k, label: "" });
    const rt = `${cur[3].toFixed(1)} : 1`;
    ctx.textAlign = "right"; ctx.fillStyle = RED; ctx.font = `700 ${Math.round(h * 0.13)}px ${SANS}`;
    const rw = ctx.measureText(rt).width; ctx.fillText(rt, w - 14, h * 0.2);
    ctx.fillStyle = INK; ctx.font = `600 ${Math.round(h * 0.07)}px ${SANS}`;
    ctx.fillText(`${cur[0]}년 9급`, w - 24 - rw, h * 0.2);
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let exam = "g9", R = rowsOf(d, exam), year = R[R.length - 1][0], count = 0, intro = true, t0 = performance.now();
    let hover = null, pointer = null, boxes = [], G = null, last = performance.now(), shown = null;
    KF.segment(controls, d.exams.map((e) => ({ id: e.id, label: e.label })), exam, (id) => {
      exam = id; R = rowsOf(d, exam); intro = false;
      if (!R.find((r) => r[0] === year)) year = KF.clamp(year, R[0][0], R[R.length - 1][0]);
      syncRange();
    });
    const range = document.createElement("input"); range.type = "range";
    const lab = document.createElement("label"); lab.append("연도", range);
    const out = document.createElement("span"); out.className = "readout";
    controls.append(lab, out);
    const syncRange = () => { range.min = R[0][0]; range.max = R[R.length - 1][0]; range.value = year; };
    syncRange();
    range.oninput = () => { intro = false; year = +range.value; };
    const pick = (e, commit) => {
      const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      pointer = [x, y]; hover = null;
      for (const b of boxes) {
        if (x >= b.px && x <= b.px + b.cw && y >= b.top - 20 && y <= b.top + b.ph + 16) {
          const i = KF.clamp(Math.floor((x - b.px) / (b.cw / b.n)), 0, b.n - 1);
          hover = { p: b.p, i };
          if (commit) { intro = false; year = R[i][0]; range.value = year; }
        }
      }
      if (!hover && G && x > G.x0 - 10 && y > G.y0 - G.fig * 1.4 && y < G.y0 + G.rowH * G.rows) hover = { queue: true };
    };
    stage.addEventListener("pointermove", (e) => pick(e, e.buttons === 1));
    stage.addEventListener("pointerdown", (e) => pick(e, true));
    stage.addEventListener("pointerleave", () => { hover = null; pointer = null; });

    KF.loop(stage, (tt) => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (intro) { // walk through the years once
        const el = (now - t0) / 1000, k = KF.clamp((el - 0.3) / 4.6, 0, 1);
        year = R[Math.min(R.length - 1, Math.floor(k * R.length))][0];
        if (k >= 1) intro = false;
      }
      if (year !== shown) { shown = year; range.value = year; out.textContent = `${year}년`; }
      const cur = R.find((r) => r[0] === year);
      count += (cur[3] - count) * (1 - Math.exp(-dt * (intro ? 9 : 5)));
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      // floor tiles, faint
      const label = d.exams.find((e) => e.id === exam).label;
      const maxRatio = Math.max(...d.exams.flatMap((e) => e.rows.map((r) => r[3])));
      if (full) {
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 21px ${SERIF}`; ctx.fillText(`${label} · ${year}년`, 40, 42);
        ctx.fillStyle = RED; ctx.font = `700 46px ${SANS}`; const rt = `${cur[3].toFixed(1)} : 1`; ctx.fillText(rt, 40, 96);
        const rw = ctx.measureText(rt).width;
        ctx.fillStyle = INK; ctx.font = `500 14px ${SANS}`;
        ctx.fillText(`원서 ${KF.fmt(cur[2])}명 ÷ 선발 예정 ${KF.fmt(cur[1])}명`, 40 + rw + 22, 80);
        ctx.fillStyle = "rgba(31,45,61,.6)"; ctx.font = `500 12px ${SANS}`;
        ctx.fillText("합격 자리 하나 앞에 줄 선 사람 · 한 사람 = 1명", 40 + rw + 22, 98);
        const per = 25, rowsMax = Math.ceil(maxRatio / per), fig = 30;
        G = { x0: 150, y0: 196, w: w - 150 - 40, rowH: Math.min(56, (h - 196 - 140) / (rowsMax - 1)), per, fig, rows: rowsMax };
        desk(ctx, 84, G.y0 + 2, 80);
        ctx.fillStyle = "rgba(31,45,61,.62)"; ctx.font = `600 11px ${SANS}`; ctx.textAlign = "center"; ctx.fillText("합격 자리 하나", 84, G.y0 + 20);
        queue(ctx, G, count, tt, cur[3], ghostOf(R, count, dt));
        boxes = minis(ctx, 40, h - 112, w - 80, 104, R, year, true, hover && !hover.queue ? hover : null);
      } else {
        ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 16px ${SERIF}`; ctx.fillText(`${label} · ${year}년`, 12, 26);
        ctx.fillStyle = RED; ctx.font = `700 32px ${SANS}`; ctx.fillText(`${cur[3].toFixed(1)} : 1`, 12, 64);
        ctx.fillStyle = INK; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`원서 ${KF.fmt(cur[2])}명 ÷ 선발 ${KF.fmt(cur[1])}명`, 12, 84);
        const per = 16, rowsMax = Math.ceil(maxRatio / per), fig = 17;
        G = { x0: 62, y0: 140, w: w - 62 - 10, rowH: Math.min(30, (h - 140 - 92) / (rowsMax - 1)), per, fig, rows: rowsMax, small: true };
        desk(ctx, 32, G.y0 + 2, 46);
        queue(ctx, G, count, tt, cur[3], ghostOf(R, count, dt));
        boxes = minis(ctx, 12, h - 74, w - 24, 66, R, year, false, hover && !hover.queue ? hover : null);
      }
      if (hover && pointer && full) tip(ctx, w, h, R, year, hover, pointer, label, d);
    });
  }

  function tip(ctx, w, h, R, year, hv, p, label, d) {
    let lines;
    if (hv.queue) {
      const r = R.find((x) => x[0] === year);
      lines = [`${year}년 ${label}`, `원서 ${KF.fmt(r[2])}명 ÷ 선발 예정 ${KF.fmt(r[1])}명`, `= 자리 하나에 ${r[3].toFixed(1)}명`];
      if (year === d.extra.year && (label.startsWith("9급") || label.startsWith("7급"))) {
        const x = d.extra[label.startsWith("9급") ? "g9" : "g7"];
        lines.push(`(이해 추가 채용 ${KF.fmt(x[0])}명에 ${KF.fmt(x[1])}명 · ${x[2].toFixed(1)}대 1은 뺐다)`);
      }
    } else {
      const r = R[hv.i];
      lines = [`${r[0]}년 ${label}`, `경쟁률 ${r[3].toFixed(1)} : 1`, `원서 ${KF.fmt(r[2])}명`, `선발 예정 ${KF.fmt(r[1])}명`];
    }
    ctx.font = `500 12px ${SANS}`;
    const bw = Math.max(...lines.map((t) => ctx.measureText(t).width)) + 24, bh = 14 + lines.length * 18;
    const bx = KF.clamp(p[0] + 16 + bw > w - 8 ? p[0] - bw - 16 : p[0] + 16, 8, w - bw - 8), by = KF.clamp(p[1] - bh - 12, 8, h - bh - 8);
    ctx.fillStyle = "rgba(255,255,255,.97)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(31,45,61,.35)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    lines.forEach((t, k) => {
      ctx.fillStyle = k === 0 ? INK : k === 1 && !hv.queue ? RED : "rgba(31,45,61,.85)";
      ctx.font = `${k === 0 ? 700 : 500} 12px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(t, bx + 12, by + 20 + k * 18);
    });
  }

  VIZ["civil-exam"] = { thumb, mount, bg: BG };
})();
