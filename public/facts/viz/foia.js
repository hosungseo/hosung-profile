// 35 foia — "먹칠된 문서". Paper on a blue-grey desk. View 1: the year's information-disclosure decisions as
// 100 sheets (1 sheet = 1%): clean sheets = full disclosure, sheets with black bars = partial, blacked-out
// sheets = refused. View 2: one stack of sheets per year, 1 sheet = 10,000 decisions.
(() => {
  const BG = "#76828d";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const PAPER = "#f6f4ee", LINE = "#aeb3b9", INK = "#131416", RED = "#c8321e", TXT = "#f4f5f6", DIM = "rgba(244,245,246,.72)", SOFT = "rgba(244,245,246,.45)";
  const hash = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
  const UNIT = 10000;

  // ---------------------------------------------------------------- desk (cached per size)
  let DESK = null;
  function desk(w, h) {
    const key = `${w}x${h}`;
    if (DESK && DESK.key === key) return DESK.c;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    g.fillStyle = BG; g.fillRect(0, 0, w, h);
    for (let i = 0; i < (w * h) / 14; i++) {
      g.fillStyle = hash(i + 0.3) > 0.5 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.05)";
      g.fillRect(hash(i) * w, hash(i + 0.7) * h, 1, 1);
    }
    const v = g.createRadialGradient(w * 0.45, h * 0.45, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.22)");
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    DESK = { key, c };
    return c;
  }

  // ---------------------------------------------------------------- one sheet, seen from above
  // red: 0..1 how far the black bars are drawn (partial), black: 0..1 blacked out (refused)
  function sheet(ctx, x, y, w, h, red, black, seed, drop = 1) {
    ctx.globalAlpha = drop;
    ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fillRect(x + 1.2, y + 1.6, w, h);
    ctx.fillStyle = PAPER; ctx.fillRect(x, y, w, h);
    const pad = Math.max(2.5, w * 0.12), lh = Math.max(1, h * 0.035), gapL = Math.max(3, h * 0.105);
    const nl = Math.max(3, Math.floor((h - pad * 2) / gapL));
    for (let k = 0; k < nl; k++) {
      const ly = y + pad + k * gapL, lw = (k === 0 ? 0.45 : 0.62 + hash(seed * 13 + k) * 0.32) * (w - 2 * pad);
      ctx.fillStyle = k === 0 ? "#7f858c" : LINE; ctx.fillRect(x + pad + (k === 0 ? (w - 2 * pad - lw) / 2 : 0), ly, lw, k === 0 ? lh * 1.4 : lh);
    }
    if (red > 0.001) { // two or three redaction bars over body lines
      const picks = [1 + Math.floor(hash(seed * 7) * (nl - 2)), 1 + Math.floor(hash(seed * 11 + 3) * (nl - 2)), nl - 1];
      const nb = hash(seed * 5) > 0.5 ? 3 : 2;
      ctx.fillStyle = INK;
      for (let b = 0; b < nb; b++) {
        const ly = y + pad + picks[b] * gapL - lh * 0.9, st = hash(seed * 17 + b) * 0.35;
        const bw = (w - 2 * pad) * (0.35 + hash(seed * 19 + b) * 0.55) * KF.clamp(red * 1.6 - b * 0.3, 0, 1);
        if (bw > 0.3) ctx.fillRect(x + pad + st * (w - 2 * pad) * 0.5, ly, Math.min(bw, (w - 2 * pad) * (1 - st * 0.5)), lh * 2.8);
      }
    }
    if (black > 0.001) { // blacked out from the top down (a fractional sheet is partly inked)
      ctx.fillStyle = INK; ctx.fillRect(x, y, w, h * KF.clamp(black, 0, 1));
    }
    // folded corner
    const fc = Math.max(2.5, w * 0.16);
    ctx.fillStyle = BG; ctx.beginPath(); ctx.moveTo(x + w - fc, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + fc); ctx.closePath(); ctx.fill();
    ctx.fillStyle = black > 0.5 ? "#3a3c40" : "#d9d6cd"; ctx.beginPath(); ctx.moveTo(x + w - fc, y); ctx.lineTo(x + w, y + fc); ctx.lineTo(x + w - fc, y + fc); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- data helpers
  const share = (d, f) => { // fractional year index -> [full, partial, none] in % (interpolated)
    const i = Math.floor(f), j = Math.min(d.years.length - 1, i + 1), k = f - i;
    const s = (a) => KF.lerp(a[i] / d.req[i], a[j] / d.req[j], k) * 100;
    return [s(d.full), s(d.part), s(d.none)];
  };
  const reqAt = (d, f) => { const i = Math.floor(f), j = Math.min(d.years.length - 1, i + 1); return KF.lerp(d.req[i], d.req[j], f - i); };

  // the 10 x 10 grid; returns geometry for hover
  function grid(ctx, x0, y0, pw, ph, gx, gy, d, f, drop, hover) {
    const [a, b] = share(d, f), A = a, AB = a + b;
    let hit = null;
    for (let i = 0; i < 100; i++) {
      const r = Math.floor(i / 10), c = i % 10, x = x0 + c * (pw + gx), y = y0 + r * (ph + gy);
      const dp = KF.clamp(drop * 100 - i * 0.6, 0, 1);
      if (dp <= 0) continue;
      const red = KF.clamp(i + 1 - A, 0, 1), black = KF.clamp(i + 1 - AB, 0, 1);
      sheet(ctx, x, y - (1 - dp) * 8, pw, ph, red, black, i + 1, dp);
      if (hover && hover[0] >= x && hover[0] <= x + pw && hover[1] >= y && hover[1] <= y + ph) hit = { i, x, y, kind: black > 0.5 ? 2 : red > 0.5 ? 1 : 0 };
    }
    return hit;
  }

  // one stack per year, sheets seen edge-on (1 sheet = 10,000 decisions)
  function stacks(ctx, x0, x1, yb, hmax, d, sel, grow, full, hover) {
    const n = d.years.length, cw = (x1 - x0) / n, sw = cw * 0.74;
    const maxS = Math.max(...d.req) / UNIT, pitch = Math.min(full ? 3.3 : 2.1, hmax / maxS), th = Math.max(1, pitch * 0.72);
    let hit = null;
    for (let j = 0; j < n; j++) {
      const x = x0 + j * cw + (cw - sw) / 2, nS = d.req[j] / UNIT * grow;
      const nf = d.full[j] / UNIT * grow, np = d.part[j] / UNIT * grow;
      const on = j === sel;
      for (let k = 0; k < Math.ceil(nS); k++) {
        const fr = Math.min(1, nS - k), yy = yb - (k + 1) * pitch, jit = (hash(j * 131 + k) - 0.5) * sw * 0.08;
        const kind = k < nf ? 0 : k < nf + np ? 1 : 2;
        ctx.fillStyle = kind === 2 ? INK : PAPER;
        ctx.fillRect(x + jit, yy, sw * (fr < 1 ? fr : 1), th);
        if (kind === 1) { // partial: black marks on the sheet's edge
          ctx.fillStyle = INK;
          const m = hash(j * 17 + k);
          ctx.fillRect(x + jit + sw * (0.1 + m * 0.3), yy, sw * (0.18 + hash(k * 3 + j) * 0.25), th);
        }
      }
      if (on) {
        const top = yb - Math.ceil(nS) * pitch;
        ctx.strokeStyle = TXT; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
        ctx.strokeRect(x - 3.5, top - 4.5, sw + 7, yb - top + 7); ctx.setLineDash([]);
      }
      if (hover && hover[0] >= x0 + j * cw && hover[0] < x0 + (j + 1) * cw && hover[1] <= yb + 16 && hover[1] >= yb - hmax - 30) hit = j;
      const lab = full ? (j % 3 === 0 || j === n - 1) : (j % 9 === 0 || j === n - 1);
      if (lab) {
        ctx.fillStyle = on ? TXT : DIM; ctx.font = `${on ? 600 : 500} ${full ? 10.5 : 9.5}px ${MONO}`; ctx.textAlign = "center";
        ctx.fillText(full ? String(d.years[j]) : `'${String(d.years[j]).slice(2)}`, x + sw / 2, yb + 15);
      }
    }
    ctx.textAlign = "left";
    return { hit, pitch };
  }

  // ---------------------------------------------------------------- side panel (desktop)
  function panel(ctx, x0, x1, y0, h, d, f, view, a) {
    const i = Math.round(f), y = d.years[i], [A, Bp, C] = share(d, i), R = d.req[i], W = x1 - x0;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `600 12.5px ${SANS}`; ctx.fillText("정보공개 청구 결정", x0, y0);
    ctx.fillStyle = TXT; ctx.font = `700 26px ${MONO}`; ctx.fillText(String(y), x0, y0 + 32);
    ctx.fillStyle = DIM; ctx.font = `500 13px ${SANS}`; ctx.fillText(`${KF.fmt(R)}건`, x0 + 82, y0 + 30);
    // stamp: share with anything disclosed
    const sy = y0 + 58;
    ctx.save(); ctx.translate(x0 + W - 58, sy + 30); ctx.rotate(-0.12);
    ctx.strokeStyle = RED; ctx.lineWidth = 2.2; ctx.globalAlpha = a * 0.9;
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.stroke(); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 35, 0, 7); ctx.stroke();
    ctx.fillStyle = RED; ctx.textAlign = "center"; ctx.font = `700 12px ${SANS}`; ctx.fillText("전부·일부", 0, -9);
    ctx.font = `800 17px ${SANS}`; ctx.fillText("공개", 0, 13);
    ctx.restore();
    ctx.fillStyle = TXT; ctx.font = `800 44px ${SANS}`; ctx.fillText(`${KF.fmt(A + Bp, 1)}%`, x0, sy + 44);
    ctx.fillStyle = DIM; ctx.font = `500 12.5px ${SANS}`; ctx.fillText("전부 또는 일부가 공개된 결정", x0, sy + 66);
    // three rows
    const rows = [["전부공개", A, d.full[i], 0], ["부분공개", Bp, d.part[i], 1], ["비공개", C, d.none[i], 2]];
    rows.forEach(([t, v, n, k], j) => {
      const ry = sy + 96 + j * 30;
      sheet(ctx, x0, ry - 15, 13, 18, k === 1 ? 1 : 0, k === 2 ? 1 : 0, 900 + k);
      ctx.fillStyle = TXT; ctx.font = `600 13px ${SANS}`; ctx.fillText(t, x0 + 22, ry);
      ctx.font = `700 15px ${MONO}`; ctx.textAlign = "right"; ctx.fillText(`${KF.fmt(v, 1)}%`, x0 + W * 0.62, ry);
      ctx.fillStyle = DIM; ctx.font = `500 11.5px ${MONO}`; ctx.fillText(`${KF.fmt(n)}건`, x1, ry); ctx.textAlign = "left";
    });
    // decision time
    let ty = sy + 96 + 3 * 30 + 16;
    ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`; ctx.fillText("결정까지 걸린 날", x0, ty);
    const ti = d.time.years.indexOf(y);
    if (ti >= 0) {
      const bb = d.time.b[ti], S = bb.reduce((s, v) => s + v, 0), cols = ["#f6f4ee", "#d3d6da", "#e2a33a", RED];
      let bx = x0;
      bb.forEach((v, k) => { const bw = v / S * W; ctx.fillStyle = cols[k]; ctx.fillRect(bx, ty + 8, Math.max(0, bw - 1), 12); bx += bw; });
      const lab = [`즉시 ${KF.fmt(bb[0] / S * 100, 1)}%`, `10일 이내 ${KF.fmt(bb[1] / S * 100, 1)}%`, `11–20일 ${KF.fmt(bb[2] / S * 100, 1)}%`, `20일 넘음 ${KF.fmt(bb[3] / S * 100, 1)}% (${KF.fmt(bb[3])}건)`];
      ctx.font = `500 11px ${SANS}`;
      lab.forEach((t, k) => {
        const lx = x0 + (k % 2) * (W / 2), ly = ty + 38 + Math.floor(k / 2) * 17;
        ctx.fillStyle = cols[k]; ctx.fillRect(lx, ly - 8, 8, 8);
        ctx.fillStyle = k === 3 ? TXT : DIM; ctx.fillText(t, lx + 13, ly);
      });
    } else { ctx.fillStyle = SOFT; ctx.font = `500 11px ${SANS}`; ctx.fillText(`${d.time.years[0]}년 전에는 구간이 달라 싣지 않았다`, x0, ty + 22); }
    // proactive release of original documents (no request needed)
    const oi = d.odoc.years.indexOf(y), oy = ty + 92;
    if (oy < y0 + h - 100) {
      ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`; ctx.textAlign = "left"; ctx.fillText("청구 없이 먼저 공개한 결재문서 원문", x0, oy);
      if (oi >= 0) {
        const O = d.odoc, tot = O.tot[oi], cen = O.k[oi][2], c0 = Math.max(...O.k.map((k) => k[2])), cy = O.years[O.k.findIndex((k) => k[2] === c0)];
        ctx.fillStyle = TXT; ctx.font = `700 17px ${MONO}`; ctx.fillText(`${KF.fmt(tot)}건`, x0, oy + 24);
        ctx.fillStyle = DIM; ctx.font = `500 11.5px ${SANS}`;
        ctx.fillText(`청구 결정의 ${KF.fmt(tot / R, 0)}배 · ${O.kinds[0]} ${KF.fmt(O.k[oi][0] / tot * 100, 1)}%`, x0 + 150, oy + 23);
        ctx.fillText(`중앙행정기관 ${KF.fmt(cen)}건${cy !== y ? ` (${cy}년 ${KF.fmt(c0)}건)` : " (가장 많은 해)"}`, x0, oy + 43);
      } else { ctx.fillStyle = SOFT; ctx.font = `500 11px ${SANS}`; ctx.fillText(`${d.odoc.years[0]}년부터 집계`, x0, oy + 22); }
    }
    // strip: share per year (click to jump)
    const sy2 = y0 + h - 64, sh = 40, n = d.years.length, cw = W / n;
    ctx.fillStyle = DIM; ctx.font = `600 12px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(`해마다 몫 · ${d.years[0]}–${d.years[n - 1]}`, x0, sy2 - 10);
    for (let j = 0; j < n; j++) {
      const r = d.req[j], hf = d.full[j] / r * sh, hp = d.part[j] / r * sh, x = x0 + j * cw;
      ctx.fillStyle = PAPER; ctx.fillRect(x, sy2, cw - 1, hf);
      ctx.fillStyle = "#8d949b"; ctx.fillRect(x, sy2 + hf, cw - 1, hp);
      ctx.fillStyle = INK; ctx.fillRect(x, sy2 + hf + hp, cw - 1, sh - hf - hp);
      if (j === i) { ctx.strokeStyle = RED; ctx.lineWidth = 1.5; ctx.strokeRect(x - 0.5, sy2 - 2.5, cw, sh + 5); }
    }
    ctx.fillStyle = SOFT; ctx.font = `500 10px ${MONO}`;
    ctx.fillText(String(d.years[0]), x0, sy2 + sh + 13); ctx.textAlign = "right"; ctx.fillText(String(d.years[n - 1]), x1, sy2 + sh + 13);
    ctx.textAlign = "left";
    ctx.restore();
    return { strip: [x0, sy2, W, sh] };
  }

  function tip(ctx, w, h, lines, p) {
    ctx.font = `600 12px ${SANS}`;
    const bw = Math.max(...lines.map(([t]) => ctx.measureText(t).width)) + 22, bh = 12 + lines.length * 18;
    const bx = KF.clamp(p[0] + 14 + bw > w - 6 ? p[0] - bw - 14 : p[0] + 14, 6, w - bw - 6), by = KF.clamp(p[1] - bh - 10, 6, h - bh - 6);
    ctx.fillStyle = "rgba(246,244,238,.98)"; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = RED; ctx.fillRect(bx, by, 3, bh);
    ctx.strokeStyle = "rgba(19,20,22,.5)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, wt, c], k) => { ctx.fillStyle = c || INK; ctx.font = `${wt} 12px ${SANS}`; ctx.fillText(t, bx + 12, by + 19 + k * 18); });
  }
  const KIND = ["전부공개", "부분공개", "비공개"];
  const yearLines = (d, j) => {
    const r = d.req[j];
    return [[`${d.years[j]}년 청구 결정 ${KF.fmt(r)}건`, 700],
      [`전부공개 ${KF.fmt(d.full[j])} (${KF.fmt(d.full[j] / r * 100, 1)}%)`, 500], [`부분공개 ${KF.fmt(d.part[j])} (${KF.fmt(d.part[j] / r * 100, 1)}%)`, 500],
      [`비공개 ${KF.fmt(d.none[j])} (${KF.fmt(d.none[j] / r * 100, 1)}%)`, 500, RED]];
  };

  // ---------------------------------------------------------------- thumb
  function thumb(ctx, w, h, t, d) {
    const c = t % 10, n = d.years.length - 1, b = d.years.indexOf(d.sum.base);
    ctx.drawImage(desk(w, h), 0, 0, w, h);
    const f = b + KF.ease(KF.clamp((c - 0.9) / 2.1, 0, 1)) * (n - b), drop = KF.clamp(c / 0.9, 0, 1);
    const ph = (h - 38 - 9 * 2.2) / 10, pw = ph / 1.38, gx = 2.6, x0 = 52, y0 = 28;   // clear of the card's data badge
    grid(ctx, x0, y0, pw, ph, gx, 2.2, d, f, drop, null);
    const X = x0 + 10 * pw + 9 * gx + w * 0.05, a = KF.clamp((c - 0.5) / 0.6, 0, 1) * (c > 9.4 ? 1 - (c - 9.4) / 0.6 : 1);
    const [A, B] = share(d, f);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.058)}px ${SANS}`; ctx.fillText(`${d.years[Math.round(f)]}년 청구`, X, h * 0.22);
    ctx.fillStyle = TXT; ctx.font = `800 ${Math.round(h * 0.17)}px ${SANS}`; ctx.fillText(`${KF.fmt(A + B, 0)}%`, X, h * 0.22 + h * 0.18);
    ctx.fillStyle = DIM; ctx.font = `600 ${Math.round(h * 0.056)}px ${SANS}`; ctx.fillText("전부·일부 공개", X, h * 0.22 + h * 0.26);
    ctx.fillStyle = TXT; ctx.font = `700 ${Math.round(h * 0.066)}px ${SANS}`; ctx.fillText(`검은 줄 ${KF.fmt(d.sum.partBase, 0)}% → ${KF.fmt(B, 0)}%`, X, h * 0.8);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const s = KF.canvas(stage), n = d.years.length - 1;
    let view = "grid", f = 0, target = n, t0 = performance.now(), intro = true, playing = false, hover = null, geo = null, shown = -1, tv = performance.now();
    KF.segment(controls, [{ id: "grid", label: "100장으로 보기" }, { id: "stack", label: "해마다 쌓기" }], "grid", (id) => { view = id; tv = performance.now(); });
    const range = document.createElement("input"); range.type = "range"; range.min = d.years[0]; range.max = d.years[n]; range.step = 1; range.value = d.years[n];
    const lab = document.createElement("label"); lab.append("연도", range);
    const out = document.createElement("span"); out.className = "readout";
    const play = document.createElement("button"); play.type = "button"; play.textContent = `▶ ${d.years[0]}년부터`;
    controls.append(lab, out, play);
    range.oninput = () => { intro = false; playing = false; target = +range.value - d.years[0]; };
    play.onclick = () => { intro = false; playing = true; f = 0; target = 0; };
    const pick = (e, click) => {
      const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top];
      if (click && geo && geo.strip) {
        const [sx, sy, sw, sh] = geo.strip;
        if (hover[0] >= sx && hover[0] <= sx + sw && hover[1] >= sy - 4 && hover[1] <= sy + sh + 4) { intro = false; playing = false; target = KF.clamp(Math.floor((hover[0] - sx) / sw * (n + 1)), 0, n); }
      }
      if (click && geo && geo.stackHit != null && view === "stack") { intro = false; playing = false; target = geo.stackHit; }
    };
    stage.addEventListener("pointermove", (e) => pick(e, false));
    stage.addEventListener("pointerdown", (e) => pick(e, true));
    stage.addEventListener("pointerleave", () => { hover = null; });
    let last = performance.now();
    KF.loop(stage, () => {
      const { ctx, w, h } = s, full = w > 520, now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const el = (now - t0) / 1000;
      let drop = 1;
      if (intro) {
        drop = KF.clamp(el / 1.3, 0, 1);
        f = KF.ease(KF.clamp((el - 1.3) / 3.6, 0, 1)) * n;
        if (el > 5) { intro = false; f = target = n; }
      } else if (playing) { f = Math.min(n, f + dt * 6); target = f; if (f >= n) playing = false; }
      else { f += (target - f) * (1 - Math.exp(-dt * 7)); if (Math.abs(target - f) < 0.002) f = target; }
      const yi = Math.round(f);
      if (yi !== shown) { shown = yi; range.value = d.years[yi]; out.textContent = `${d.years[yi]}년`; }
      ctx.drawImage(desk(w, h), 0, 0, w, h);
      geo = {};
      let tipLines = null;
      if (view === "grid") {
        const ph = full ? Math.floor((h - 44 - 9 * 5) / 10) : Math.floor((h * 0.72 - 9 * 4) / 10), pw = Math.round(ph / 1.4);
        const gx = full ? 9 : Math.min(7, (w - 24 - 10 * pw) / 9), gy = full ? 5 : 4;
        const gw = 10 * pw + 9 * gx, x0 = full ? 40 : (w - gw) / 2, y0 = full ? 22 : 12;
        const hit = grid(ctx, x0, y0, pw, ph, gx, gy, d, f, drop, hover);
        if (hit && !intro) {
          const [A, Bp, C] = share(d, yi), per = d.req[yi] / 100;
          ctx.strokeStyle = RED; ctx.lineWidth = 1.5; ctx.strokeRect(hit.x - 2, hit.y - 2, pw + 4, ph + 4);
          const kk = hit.kind, sv = [A, Bp, C][kk], nv = [d.full, d.part, d.none][kk][yi];
          tipLines = [[`${d.years[yi]}년 · 종이 한 장 = 결정의 1% (약 ${KF.fmt(per)}건)`, 700], [`이 장: ${KIND[kk]}`, 600, kk ? RED : INK],
            [`${KIND[kk]} 전체 ${KF.fmt(nv)}건 = ${KF.fmt(sv, 1)}%`, 500]];
        }
        if (full) {
          ctx.fillStyle = DIM; ctx.font = `500 11px ${MONO}`; ctx.textAlign = "left";
          geo = panel(ctx, x0 + gw + 44, w - 30, 40, h - 40, d, f, view, intro ? KF.clamp((el - 0.8) / 0.8, 0, 1) : 1);
        } else {
          const [A, Bp, C] = share(d, f), yb = y0 + 10 * ph + 9 * gy + 26;
          ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 15px ${SANS}`;
          ctx.fillText(`${d.years[yi]}년 · 전부·일부 공개 ${KF.fmt(A + Bp, 1)}%`, 14, yb);
          ctx.font = `500 12px ${SANS}`; ctx.fillStyle = DIM;
          ctx.fillText(`전부 ${KF.fmt(A, 1)}% · 부분 ${KF.fmt(Bp, 1)}% · 비공개 ${KF.fmt(C, 1)}%`, 14, yb + 21);
          ctx.fillStyle = SOFT; ctx.font = `500 10.5px ${MONO}`; ctx.fillText(`한 장 = 1% · ${KF.fmt(d.req[yi])}건`, 14, yb + 40);
        }
      } else {
        const g = KF.ease(KF.clamp((now - tv) / 1000 / 1.2, 0, 1));
        const x0 = full ? 40 : 14, x1 = full ? w * 0.63 : w - 14, yb = full ? h - 44 : h - 110, hm = full ? h - 110 : h - 200;
        const S = stacks(ctx, x0, x1, yb, hm, d, yi, g * (intro ? drop : 1), full, hover);
        geo.stackHit = S.hit;
        ctx.textAlign = "left"; ctx.fillStyle = TXT; ctx.font = `700 ${full ? 17 : 14}px ${SANS}`;
        ctx.fillText("해마다 쌓인 정보공개 청구", x0, full ? 36 : 24);
        ctx.fillStyle = DIM; ctx.font = `500 ${full ? 11.5 : 10.5}px ${full ? MONO : SANS}`;
        ctx.fillText(full ? `종이 한 장 = 청구 결정 ${KF.fmt(UNIT)}건 · 검은 표시 = 부분공개 · 검은 장 = 비공개` : `한 장 = ${KF.fmt(UNIT / 10000)}만 건 · 검은 표시 = 부분공개 · 검은 장 = 비공개`, x0, full ? 56 : 40);
        if (S.hit != null && hover) tipLines = yearLines(d, S.hit);
        if (full) geo = { ...panel(ctx, w * 0.66 + 20, w - 30, 40, h - 40, d, f, view, 1), stackHit: S.hit };
        else {
          const [A, Bp, C] = share(d, yi), ty = yb + 36;
          ctx.fillStyle = TXT; ctx.font = `700 15px ${SANS}`; ctx.fillText(`${d.years[yi]}년 ${KF.fmt(d.req[yi])}건`, 14, ty);
          ctx.font = `500 12px ${SANS}`; ctx.fillStyle = DIM;
          ctx.fillText(`전부 ${KF.fmt(A, 1)}% · 부분 ${KF.fmt(Bp, 1)}% · 비공개 ${KF.fmt(C, 1)}%`, 14, ty + 21);
          ctx.fillStyle = SOFT; ctx.font = `500 10.5px ${MONO}`; ctx.fillText(`${d.years[0]}년 ${KF.fmt(d.req[0])}건의 ${KF.fmt(d.req[yi] / d.req[0], 0)}배`, 14, ty + 40);
        }
      }
      if (!tipLines && hover && geo && geo.strip && full) {
        const [sx, sy, sw, sh] = geo.strip;
        if (hover[0] >= sx && hover[0] <= sx + sw && hover[1] >= sy - 4 && hover[1] <= sy + sh + 4) tipLines = yearLines(d, KF.clamp(Math.floor((hover[0] - sx) / sw * (n + 1)), 0, n));
      }
      if (tipLines && hover && !intro) tip(ctx, w, h, tipLines, hover);
    });
  }

  VIZ.foia = { thumb, mount, bg: BG };
})();
