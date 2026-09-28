// 01 safety — "Scissors". Every risk indexed to its first year = 100 on a log scale:
// old risks sink toward the floor, new risks climb off the chart. Oscilloscope phosphor on black.
(() => {
  const X0 = 2004, X1 = 2025, LO = Math.log10(8), HI = Math.log10(1100);
  const COL = { old: "#bfe9e4", new: "#ff5a36", flat: "#d9b45a" };
  const BG = "#06090a";

  function frame(w, h, full) {
    const pad = full ? { l: 76, r: 190, t: 34, b: 40 } : { l: 14, r: 14, t: 16, b: 14 };
    return {
      pad,
      x: (y) => pad.l + ((y - X0) / (X1 - X0)) * (w - pad.l - pad.r),
      y: (v) => pad.t + (1 - (Math.log10(Math.max(v, 8)) - LO) / (HI - LO)) * (h - pad.t - pad.b),
    };
  }

  function grid(ctx, w, h, f, full) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(160,220,210,.07)"; ctx.lineWidth = 1;
    for (let y = X0; y <= X1; y++) {
      const x = Math.round(f.x(y)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, f.pad.t); ctx.lineTo(x, h - f.pad.b); ctx.stroke();
    }
    for (const v of [10, 25, 50, 100, 200, 400, 800]) {
      const y = Math.round(f.y(v)) + 0.5;
      ctx.strokeStyle = v === 100 ? "rgba(200,240,230,.34)" : "rgba(160,220,210,.08)";
      ctx.setLineDash(v === 100 ? [4, 4] : []);
      ctx.beginPath(); ctx.moveTo(f.pad.l, y); ctx.lineTo(w - f.pad.r, y); ctx.stroke();
      ctx.setLineDash([]);
      if (full) {
        ctx.fillStyle = v === 100 ? "rgba(220,245,240,.8)" : "rgba(160,220,210,.4)";
        ctx.font = "500 10px IBM Plex Mono, monospace"; ctx.textAlign = "right";
        ctx.fillText(v === 100 ? "100 = 시작" : String(v), f.pad.l - 8, y + 3);
      }
    }
    if (full) {
      ctx.fillStyle = "rgba(160,220,210,.45)"; ctx.textAlign = "center";
      for (let y = X0; y <= X1; y += 3) ctx.fillText(String(y), f.x(y), h - f.pad.b + 18);
    }
  }

  // Draw a series up to fractional year `until`, return head point.
  function line(ctx, s, f, until, alpha, width) {
    const pts = s.years.map((y, i) => [f.x(+y), f.y(s.index[i]), +y]).filter((p) => p[2] <= until + 1);
    if (!pts.length || +s.years[0] > until) return null;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = COL[s.kind]; ctx.lineWidth = width; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.shadowColor = COL[s.kind]; ctx.shadowBlur = 10;
    ctx.beginPath();
    let head = null;
    pts.forEach((p, i) => {
      let [x, y, yr] = p;
      if (yr > until && i > 0) { // interpolate the moving head
        const [px, py, pyr] = pts[i - 1];
        const k = (until - pyr) / (yr - pyr);
        x = KF.lerp(px, x, k); y = KF.lerp(py, y, k);
      }
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      head = [x, y];
    });
    ctx.stroke();
    if (head) { ctx.fillStyle = COL[s.kind]; ctx.beginPath(); ctx.arc(head[0], head[1], width + 1.5, 0, 7); ctx.fill(); }
    ctx.restore();
    return head;
  }

  function thumb(ctx, w, h, t, d) {
    const f = frame(w, h, false);
    grid(ctx, w, h, f, false);
    const cyc = t % 9, until = X0 + KF.ease(cyc / 6) * (X1 - X0);
    const fade = cyc > 8 ? 1 - (cyc - 8) : 1;
    for (const s of d.series) if (s.kind !== "flat") line(ctx, s, f, until, fade, 2);
    // scan line
    ctx.fillStyle = "rgba(190,240,230,.06)";
    ctx.fillRect(f.x(until) - 1, 0, 2, h);
    ctx.fillStyle = "rgba(220,245,240,.9)"; ctx.font = "600 13px IBM Plex Mono, monospace"; ctx.textAlign = "right";
    ctx.fillText(String(Math.floor(until)), w - 14, h - 14);
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let focus = "all", t0 = performance.now(), hover = null;
    KF.segment(controls, [
      { id: "all", label: "전부" }, { id: "old", label: "줄어든 위험" }, { id: "new", label: "늘어난 위험" },
    ], "all", (id) => { focus = id; });
    const replay = document.createElement("button");
    replay.type = "button"; replay.textContent = "다시 그리기"; replay.onclick = () => { t0 = performance.now(); };
    controls.appendChild(replay);
    const note = document.createElement("span"); note.className = "readout";
    note.textContent = "세로축은 로그 눈금 · 각 선의 첫해 = 100"; controls.appendChild(note);

    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top];
    });
    stage.addEventListener("pointerleave", () => { hover = null; });

    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520;
      const f = frame(w, h, full);
      grid(ctx, w, h, f, full);
      const el = (performance.now() - t0) / 1000;
      const until = X0 + KF.ease(el / 5) * (X1 - X0);
      const heads = [];
      for (const sr of d.series) {
        const on = focus === "all" || sr.kind === focus || (focus === "new" && sr.kind === "flat");
        const hd = line(ctx, sr, f, until, on ? 1 : 0.12, on ? 2.2 : 1.4);
        if (hd && on) heads.push([hd, sr]);
      }
      // end labels in one column right of the plot, spread apart, with leader lines
      if (full && until >= X1 - 0.01) {
        heads.sort((a, b) => a[0][1] - b[0][1]);
        const lx = w - f.pad.r + 18, gap = 27;
        const ys = heads.map((hd) => hd[0][1]);
        for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + gap);
        const over = ys.length ? ys[ys.length - 1] - (h - f.pad.b) : 0;
        if (over > 0) for (let i = 0; i < ys.length; i++) ys[i] -= over;
        for (let i = ys.length - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - gap);
        heads.forEach(([[x, y], sr], k) => {
          const ly = ys[k], i = sr.index.length - 1;
          ctx.strokeStyle = "rgba(200,240,230,.25)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x + 5, y); ctx.lineTo(lx - 5, ly - 4); ctx.stroke();
          ctx.textAlign = "left"; ctx.fillStyle = COL[sr.kind]; ctx.font = "500 11px Pretendard Variable, sans-serif";
          ctx.fillText(sr.label, lx, ly - 1);
          ctx.fillStyle = "rgba(220,245,240,.55)"; ctx.font = "500 10px IBM Plex Mono, monospace";
          ctx.fillText(`${sr.years[0]}→${sr.years[i]}  100→${sr.index[i]}`, lx, ly + 11);
        });
      }
      // hover crosshair with real values
      if (hover && full) {
        const yr = Math.round(X0 + ((hover[0] - f.pad.l) / (w - f.pad.l - f.pad.r)) * (X1 - X0));
        if (yr >= X0 && yr <= X1) {
          const x = f.x(yr);
          ctx.strokeStyle = "rgba(220,245,240,.35)"; ctx.beginPath(); ctx.moveTo(x, f.pad.t); ctx.lineTo(x, h - f.pad.b); ctx.stroke();
          const rows = d.series.map((sr) => {
            const i = sr.years.indexOf(String(yr));
            return i < 0 ? null : [sr, sr.raw[i], sr.index[i]];
          }).filter(Boolean);
          const bw = 250, bh = 20 + rows.length * 17, bx = x + 12 + bw > w ? x - bw - 12 : x + 12, by = f.pad.t + 6;
          ctx.fillStyle = "rgba(6,9,10,.9)"; ctx.fillRect(bx, by, bw, bh);
          ctx.strokeStyle = "rgba(160,220,210,.3)"; ctx.strokeRect(bx + .5, by + .5, bw, bh);
          ctx.font = "600 11px IBM Plex Mono, monospace"; ctx.fillStyle = "#e6f7f4"; ctx.textAlign = "left";
          ctx.fillText(String(yr), bx + 10, by + 15);
          rows.forEach(([sr, raw, idx], k) => {
            ctx.fillStyle = COL[sr.kind]; ctx.font = "500 11px Pretendard Variable, sans-serif";
            ctx.fillText(sr.label, bx + 10, by + 32 + k * 17);
            ctx.fillStyle = "#e6f7f4"; ctx.font = "500 10.5px IBM Plex Mono, monospace"; ctx.textAlign = "right";
            ctx.fillText(`${KF.fmt(raw, raw < 10 ? 2 : 0)} ${sr.unit}`, bx + bw - 10, by + 32 + k * 17);
            ctx.textAlign = "left";
          });
        }
      }
    });
  }

  VIZ.safety = { thumb, mount, bg: BG };
})();
