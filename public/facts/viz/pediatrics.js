// 29 pediatrics — "여닫히는 문". A night corridor of clinic doors: one door = one clinic. A door that swings
// open with warm light = a clinic that opened that year; a door whose window goes dark and gets a notice = one
// that closed. Second view: the same doors per 10,000 children (towers morph from "count" to "per child");
// third view: doors per 10,000 children by 시도.
(() => {
  const BG = "#1e2623";
  const SANS = "Pretendard Variable, sans-serif", MONO = "IBM Plex Mono, monospace", SERIF = "'Nanum Myeongjo', serif";
  const INK = "#e9efe9", MUTE = "rgba(233,239,233,.66)", FAINT = "rgba(233,239,233,.16)";
  const WARM = "#ffcf73", COLD = "#a3b8c9";
  const WALL = "#27322e", FLOOR = "#161c1a", FRAME = "#7d9188", LEAF = "#55675f", DLEAF = "#2c3531", DFRAME = "#49564f", NOTE = "#e6e0d2";
  const MC = "123456789abc", SC = "ABCDEFGHIJKLMNOPQ";
  const PED = "소아청소년과";
  const UNIT = 250;                                   // clinics per door in the "count" towers

  // ---------------------------------------------------------------- data
  let DEC = null;
  function decode(d) {
    if (DEC && DEC.d === d) return DEC;
    const parse = (str) => {
      const [m, s] = str.split("|");
      return [...m].map((ch, i) => ({ m: MC.indexOf(ch) + 1, si: s ? SC.indexOf(s[i]) : -1 }));
    };
    const ev = {};
    d.sp.forEach((sp) => { ev[sp] = { o: d.ev[sp].o.map(parse), c: d.ev[sp].c.map(parse) }; });
    const wo = parse(d.win.o), wc = parse(d.win.c).map((e, i) => ({ ...e, age: d.win.age[i] }));
    const dens = d.up.map((u, i) => (u / d.k10[i]) * 1e4);
    const reg = d.reg.map(([s, n, k, z, u, wcl]) => ({ s, n, k, z, u, wcl, v: (n / k) * 1e4 })).sort((a, b) => b.v - a.v);
    return (DEC = { d, ev, wo, wc, dens, reg });
  }
  // events of one wall: {o:[...], c:[...], win}
  function wallEvents(X, sp, yi) {
    if (yi >= 0) return { o: X.ev[sp].o[yi], c: X.ev[sp].c[yi], win: false };
    if (sp === PED) return { o: X.wo, c: X.wc, win: true };
    const [no, nc] = X.d.win.sp[X.d.sp.indexOf(sp)];
    const spread = (n) => Array.from({ length: n }, (_, i) => ({ m: Math.floor((i * 12) / n) + 1, si: -1, synth: true }));
    return { o: spread(no), c: spread(nc), win: true };
  }
  const ymLabel = (d, m) => { const s = d.win.ym[m - 1]; return `${s.slice(0, 4)}년 ${+s.slice(4)}월`; };

  // ---------------------------------------------------------------- door
  function door(ctx, x, y, w, h, kind, p, hi) {
    const tiny = w < 7;
    ctx.fillStyle = "#0f1412"; ctx.fillRect(x, y, w, h);                      // doorway
    if (kind === "o") {
      const a = KF.clamp(p, 0, 1);
      if (a > 0) {
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, `rgba(255,214,130,${0.35 + 0.6 * a})`); g.addColorStop(1, `rgba(255,236,190,${0.4 + 0.6 * a})`);
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      }
      const lw = w * (1 - 0.74 * a), sk = h * 0.08 * a;                        // leaf swings toward us, hinged left
      ctx.fillStyle = a > 0.05 ? `rgb(${Math.round(KF.lerp(85, 196, a))},${Math.round(KF.lerp(103, 170, a))},${Math.round(KF.lerp(95, 120, a))})` : LEAF;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + lw, y - sk); ctx.lineTo(x + lw, y + h + sk * 0.35); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
      if (!tiny && a < 0.4) { ctx.fillStyle = "#ffe2a0"; ctx.fillRect(x + w * 0.22, y + h * 0.14, w * 0.56, h * 0.2); }
    } else {
      const a = KF.clamp(p, 0, 1);                                               // 0 = still lit, 1 = shut and dark
      ctx.fillStyle = a < 1 ? `rgb(${Math.round(KF.lerp(85, 44, a))},${Math.round(KF.lerp(103, 53, a))},${Math.round(KF.lerp(95, 49, a))})` : DLEAF;
      ctx.fillRect(x + 0.5, y + 0.5, w - 1, h - 0.5);
      if (!tiny) {
        ctx.fillStyle = a < 1 ? `rgba(255,226,160,${1 - a})` : "#141a18";
        ctx.fillRect(x + w * 0.22, y + h * 0.14, w * 0.56, h * 0.2);
        if (a > 0.65) {                                                         // the notice taped on the door
          ctx.globalAlpha = KF.clamp((a - 0.65) / 0.35, 0, 1) * 0.9;
          ctx.fillStyle = NOTE; ctx.fillRect(x + w * 0.2, y + h * 0.46, w * 0.6, h * 0.22);
          if (w >= 12) { ctx.fillStyle = "#8b847a"; ctx.fillRect(x + w * 0.28, y + h * 0.53, w * 0.44, 1); ctx.fillRect(x + w * 0.28, y + h * 0.6, w * 0.3, 1); }
          ctx.globalAlpha = 1;
        }
      }
    }
    if (!tiny && !(kind === "o" && p > 0.5)) { ctx.fillStyle = kind === "c" && p > 0.5 ? "#5d6a64" : "#c8d3cd"; ctx.fillRect(x + w * 0.76, y + h * 0.56, Math.max(1, w * 0.08), Math.max(1, w * 0.08)); }
    ctx.strokeStyle = hi ? "#fff" : kind === "c" && p > 0.5 ? DFRAME : FRAME; ctx.lineWidth = hi ? 1.6 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function spill(ctx, x, y, w, fh, a) {                                         // warm light on the floor
    if (a <= 0) return;
    const g = ctx.createLinearGradient(0, y, 0, y + fh);
    g.addColorStop(0, `rgba(255,207,115,${0.42 * a})`); g.addColorStop(1, "rgba(255,207,115,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w + w * 0.55, y + fh); ctx.lineTo(x - w * 0.55, y + fh); ctx.closePath(); ctx.fill();
  }

  // ---------------------------------------------------------------- wall layout (cached)
  const FITS = new Map();
  function fit(W, H, no, nc, lab) {
    const key = [W, H, no, nc, lab].map(Math.round).join("|");
    if (FITS.has(key)) return FITS.get(key);
    let out = null;
    for (let cw = 44; cw >= 4; cw -= 0.25) {
      const cols = Math.max(1, Math.floor(W / cw)), dw = cw * 0.66, dh = dw * 1.85, rh = dh * 1.32 + 2;
      const ro = Math.ceil(no / cols), rc = Math.ceil(nc / cols);
      const need = (no ? lab + ro * rh : 0) + (nc ? lab + rc * rh : 0) + (no && nc ? 8 : 0);
      out = { cols, cw, dw, dh, rh, ro, rc };
      if (need <= H) break;
    }
    if (FITS.size > 40) FITS.clear();
    FITS.set(key, out);
    return out;
  }
  // animation time of the i-th door of month m (1..12)
  const tOf = (m, i, span) => 0.25 + ((m - 1) / 12) * span + (i % 9) * 0.018;

  // draws the wall, returns door rects for hover
  function wall(ctx, box, E, el, span, lab, hover, full, nolabel) {
    const no = E.o.length, nc = E.c.length, F = fit(box.w, box.h, no, nc, lab);
    const rects = [];
    const groups = [["o", E.o, F.ro], ["c", E.c, F.rc]];
    let gy = box.y;
    const perMonth = {};
    let hit = null;
    for (const [kind, list, rowsN] of groups) {
      if (!list.length) continue;
      // label
      ctx.textAlign = "left"; ctx.font = `600 ${full ? 12 : 11}px ${SANS}`;
      ctx.fillStyle = kind === "o" ? WARM : COLD;
      const shown = list.filter((e, i) => el >= tOf(e.m, i, span)).length;
      if (!nolabel) ctx.fillText(`${kind === "o" ? "새로 연 문" : "닫힌 문"} ${KF.fmt(shown)}`, box.x, gy + lab - 6);
      const y0 = gy + lab;
      const gw = Math.min(list.length, F.cols) * F.cw;
      for (let r = 0; r < rowsN; r++) {                                      // corridor bands
        const ry = y0 + r * F.rh, rw = Math.min(list.length - r * F.cols, F.cols) * F.cw;
        ctx.fillStyle = WALL; ctx.fillRect(box.x, ry, gw, F.dh * 1.1);
        ctx.fillStyle = FLOOR; ctx.fillRect(box.x, ry + F.dh * 1.1, gw, F.dh * 0.22);
        ctx.fillStyle = "#3a4742"; ctx.fillRect(box.x, ry + F.dh * 1.1 - 1, gw, 1);
        if (rw < gw) { ctx.fillStyle = "rgba(30,38,35,.72)"; ctx.fillRect(box.x + rw, ry, gw - rw, F.dh * 1.32); }
      }
      list.forEach((e, i) => {
        const t = tOf(e.m, i, span);
        if (el < t) return;
        const col = i % F.cols, row = Math.floor(i / F.cols);
        const x = box.x + col * F.cw + (F.cw - F.dw) / 2, y = y0 + row * F.rh + F.dh * 0.1;
        const p = KF.clamp((el - t) / 0.5, 0, 1);
        const isHi = hover && hover[0] >= x - 1 && hover[0] <= x + F.dw + 1 && hover[1] >= y - 2 && hover[1] <= y + F.dh + 2;
        if (kind === "o") {
          const a = KF.ease(p), gr = ctx.createRadialGradient(x + F.dw / 2, y + F.dh * 0.55, 0, x + F.dw / 2, y + F.dh * 0.55, F.dh * 0.95);
          gr.addColorStop(0, `rgba(255,207,115,${0.22 * a})`); gr.addColorStop(1, "rgba(255,207,115,0)");
          ctx.fillStyle = gr; ctx.fillRect(x - F.dh, y - F.dh * 0.4, F.dw + F.dh * 2, F.dh * 1.9);
          spill(ctx, x, y + F.dh, F.dw, F.dh * 0.22, a);
        }
        door(ctx, x, y, F.dw, F.dh, kind, KF.ease(p), isHi);
        if (isHi) hit = { kind, e, x, y };
        perMonth[e.m] = true;
      });
      gy = y0 + rowsN * F.rh + 8;
    }
    return { hit, F };
  }

  // ---------------------------------------------------------------- timeline (year selector)
  function timeline(ctx, x, y, w, h, X, sp, sel, full, hoverX) {
    const d = X.d, n = d.years.length, cols = n + 1.8, cw = w / cols;
    let mx = 1;
    d.years.forEach((_, i) => { mx = Math.max(mx, X.ev[sp].o[i].length, X.ev[sp].c[i].length); });
    const ws = d.win.sp[d.sp.indexOf(sp)];
    mx = Math.max(mx, ws[0], ws[1]);
    const mid = y + h * 0.5, sc = (h * 0.46) / mx;
    ctx.strokeStyle = FAINT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, mid + 0.5); ctx.lineTo(x + w, mid + 0.5); ctx.stroke();
    const col = (i, no, nc, xx, on) => {
      const bw = Math.max(1.5, cw * 0.62);
      ctx.fillStyle = on ? WARM : "rgba(255,207,115,.5)"; ctx.fillRect(xx - bw / 2, mid - no * sc, bw, no * sc);
      ctx.fillStyle = on ? COLD : "rgba(163,184,201,.45)"; ctx.fillRect(xx - bw / 2, mid + 1, bw, nc * sc);
      if (on) { ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(xx - cw / 2 + 0.5, y - 2, cw - 1, h + 4); }
    };
    d.years.forEach((yr, i) => col(i, X.ev[sp].o[i].length, X.ev[sp].c[i].length, x + (i + 0.5) * cw, sel === i));
    const wx = x + (n + 1.3) * cw;
    col(-1, ws[0], ws[1], wx, sel === -1);
    ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 10 : 9}px ${MONO}`; ctx.textAlign = "center";
    d.years.forEach((yr, i) => { if (yr % 5 === 0 && i < n - 2) ctx.fillText(full ? String(yr) : `'${String(yr).slice(2)}`, x + (i + 0.5) * cw, y + h + 13); });
    ctx.textAlign = "right"; ctx.fillText("최근 12개월", x + w, y + h + 13);
    return { x, y, w, h, cw, n, wx };
  }

  // same period, other specialties: openings to the left, closures to the right
  function compare(ctx, x, y, w, X, st, hover) {
    const d = X.d, rows = d.sp.map((sp, k) => {
      if (st.yi < 0) return [sp, ...d.win.sp[k]];
      return [sp, X.ev[sp].o[st.yi].length, X.ev[sp].c[st.yi].length];
    });
    const mx = Math.max(...rows.map((r) => Math.max(r[1], r[2])), 1), lw = 78, mid = x + lw + (w - lw) / 2, half = (w - lw) / 2 - 30;
    ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 11px ${SANS}`;
    ctx.fillText(`같은 ${st.yi < 0 ? "12개월" : "해"}, 다른 과목 · 새로 연 곳 ← → 닫은 곳`, x, y - 12);
    const boxes = [];
    rows.forEach(([sp, no, nc], i) => {
      const yy = y + i * 19, on = sp === st.sp;
      if (on) { ctx.fillStyle = "rgba(233,239,233,.07)"; ctx.fillRect(x - 4, yy - 2, w + 8, 18); }
      ctx.fillStyle = on ? INK : MUTE; ctx.font = `${on ? 700 : 500} 11.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(sp, x, yy + 11);
      const a = (no / mx) * half, b = (nc / mx) * half;
      ctx.fillStyle = on ? WARM : "rgba(255,207,115,.55)"; ctx.fillRect(mid - a, yy + 3, a, 10);
      ctx.fillStyle = on ? COLD : "rgba(163,184,201,.5)"; ctx.fillRect(mid + 1, yy + 3, b, 10);
      ctx.font = `500 10px ${MONO}`; ctx.fillStyle = on ? INK : MUTE;
      ctx.textAlign = "right"; ctx.fillText(KF.fmt(no), mid - a - 4, yy + 12);
      ctx.textAlign = "left"; ctx.fillText(KF.fmt(nc), mid + b + 5, yy + 12);
      boxes.push([sp, yy - 2, yy + 16]);
    });
    return { x, w, boxes };
  }

  // ---------------------------------------------------------------- view 1: doors of one year
  function viewDoors(ctx, w, h, X, st, el, hover) {
    const d = X.d, full = w > 520, E = wallEvents(X, st.sp, st.yi), yr = st.yi >= 0 ? d.years[st.yi] : null;
    const span = st.fast ? 1.4 : 3.3;
    let box, geo = {};
    if (full) box = { x: 28, y: 64, w: w * 0.6 - 28, h: h - 88 };
    else box = { x: 14, y: 48, w: w - 28, h: h * 0.56 };
    // header
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
    const head = `${st.sp} 의원 · ${yr ? `${yr}년` : `최근 12개월`}`;
    ctx.fillText(head, full ? 28 : 14, full ? 34 : 24);
    ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11 : 9.5}px ${SANS}`;
    ctx.fillText(yr ? (full ? "문 1개 = 의원 1곳 · 불 켜진 문 = 그해 열어 지금(2025년 말)도 진료 중인 곳 · 불 꺼진 문 = 그해 문 닫은 곳" : "문 1개 = 의원 1곳 · 불 켜진 문 = 그해 열어 지금도 여는 곳")
      : (full ? `문 1개 = 의원 1곳 · ${d.win.label} (심평원 개폐업 API, 기준년월) · 불 켜진 문 = 개업, 불 꺼진 문 = 폐업` : `문 1개 = 의원 1곳 · ${d.win.label}`), full ? 28 : 14, full ? 52 : 38);
    const r = wall(ctx, box, E, el, span, full ? 20 : 17, hover, full);
    // month tick while the doors are still moving
    if (el < span + 0.6) {
      const m = KF.clamp(Math.floor(((el - 0.25) / span) * 12) + 1, 1, 12);
      ctx.textAlign = "right"; ctx.fillStyle = MUTE; ctx.font = `600 ${full ? 12 : 10}px ${MONO}`;
      ctx.fillText(E.win ? ymLabel(d, m).replace("년 ", ".").replace("월", "") : `${m}월`, full ? w * 0.6 : w - 14, full ? 34 : 24);
    }
    const no = E.o.length, nc = E.c.length;
    if (full) {
      const x0 = w * 0.6 + 34, x1 = w - 26;
      ctx.textAlign = "left";
      ctx.fillStyle = MUTE; ctx.font = `600 12px ${SANS}`; ctx.fillText("새로 연 곳", x0, 88); ctx.fillText("문 닫은 곳", x0 + (x1 - x0) * 0.5, 88);
      ctx.font = `700 46px ${SANS}`; ctx.fillStyle = WARM; ctx.fillText(KF.fmt(no), x0, 136);
      ctx.fillStyle = COLD; ctx.fillText(KF.fmt(nc), x0 + (x1 - x0) * 0.5, 136);
      ctx.fillStyle = MUTE; ctx.font = `500 11px ${SANS}`;
      const note = E.win ? `개업 1곳당 폐업 ${(nc / Math.max(1, no)).toFixed(1)}곳` : "새로 연 곳 = 그해 열어 2025년 말에도 여는 곳";
      ctx.fillText(note, x0, 160);
      if (!E.win && st.yi < d.years.length - 5) { ctx.fillText("(그 뒤 닫은 곳은 빠져 옛날일수록 적게 보인다)", x0, 176); }
      // per child line (pediatrics only)
      if (st.sp === PED) {
        const v = st.yi >= 0 ? X.dens[st.yi] : (d.win.nLast / d.win.kLast) * 1e4;
        ctx.fillStyle = INK; ctx.font = `600 12.5px ${SANS}`;
        ctx.fillText(`0–9세 아이 1만 명당 의원 ${st.yi >= 0 && st.yi < d.years.length - 1 ? "많아야 " : ""}${v.toFixed(1)}곳`, x0, 214);
        ctx.fillStyle = MUTE; ctx.font = `500 11px ${SANS}`;
        ctx.fillText(st.yi >= 0 ? `그해 말 의원 ${st.yi < d.years.length - 1 ? "많아야 " : ""}${KF.fmt(d.up[st.yi])}곳 · 출생아 ${KF.fmt(d.births[st.yi])}명` : `${d.win.lastYm.slice(0, 4)}년 ${+d.win.lastYm.slice(4)}월 의원 ${KF.fmt(d.win.nLast)}곳(추정) · 0–9세 ${KF.fmt(d.win.kLast)}명`, x0, 232);
      } else {
        ctx.fillStyle = MUTE; ctx.font = `500 11px ${SANS}`;
        ctx.fillText("폐업은 이름에 과목이 든 의원으로 셌다", x0, 214);
      }
      geo.sp = compare(ctx, x0, 268, x1 - x0, X, st, hover);
      ctx.fillStyle = MUTE; ctx.font = `500 11px ${SANS}`;
      ctx.fillText("해마다 새로 연 곳(위) · 문 닫은 곳(아래) · 누르면 그해로", x0, h - 170);
      geo.tl = timeline(ctx, x0, h - 150, x1 - x0, 104, X, st.sp, st.yi, true);
    } else {
      const yb = box.y + box.h + 30;
      ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 11px ${SANS}`;
      ctx.fillText("새로 연 곳", 14, yb); ctx.fillText("문 닫은 곳", w * 0.5, yb);
      ctx.font = `700 26px ${SANS}`; ctx.fillStyle = WARM; ctx.fillText(KF.fmt(no), 14, yb + 28);
      ctx.fillStyle = COLD; ctx.fillText(KF.fmt(nc), w * 0.5, yb + 28);
      if (st.sp === PED) {
        const v = st.yi >= 0 ? X.dens[st.yi] : (d.win.nLast / d.win.kLast) * 1e4;
        ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${SANS}`;
        ctx.fillText(`0–9세 1만 명당 의원 ${st.yi >= 0 && st.yi < d.years.length - 1 ? "많아야 " : ""}${v.toFixed(1)}곳`, 14, yb + 48);
      }
      geo.tl = timeline(ctx, 14, h - 58, w - 28, 38, X, st.sp, st.yi, false);
    }
    // tooltip
    if (r.hit && hover) {
      const { kind, e } = r.hit, lines = [];
      if (E.win) {
        lines.push([`${e.synth ? "최근 12개월" : ymLabel(d, e.m)} ${kind === "o" ? "개업" : "폐업"}`, 1]);
        if (e.si >= 0) lines.push([`${d.sido[e.si]}`, 0]);
        if (kind === "c" && e.age !== undefined) lines.push([`문 연 지 ${e.age}년 만에`, 0]);
      } else {
        lines.push([`${yr}년 ${e.m}월 ${kind === "o" ? "개원" : "폐업"}`, 1]);
        if (e.si >= 0) lines.push([`${d.sido[e.si]}`, 0]);
        lines.push([kind === "o" ? "지금도 진료 중" : "폐업", 2]);
      }
      tip(ctx, w, h, lines, hover);
    }
    return geo;
  }

  // ---------------------------------------------------------------- view 2: count vs per child towers
  function viewTowers(ctx, w, h, X, st, el, hover) {
    const d = X.d, full = w > 520, n = d.years.length;
    const k = KF.ease(KF.clamp(st.mix, 0, 1));                               // 0 = count, 1 = per child
    const L = full ? { x: 58, y: 96, w: w - 88, h: h - 142 } : { x: 30, y: 84, w: w - 40, h: h - 150 };
    const cw = L.w / n, dw = Math.min(full ? 20 : 9, cw * 0.62), unitMax = KF.lerp(12, 9, k);
    const uh = L.h / unitMax, dh = Math.min(uh * 0.82, dw * 1.9);
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
    ctx.fillText(k < 0.5 ? "의원 수로 세면" : "아이 수로 나누면", full ? 28 : 14, full ? 34 : 24);
    ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11.5 : 9.5}px ${SANS}`;
    ctx.fillText(k < 0.5 ? `소아청소년과 의원 · 문 1개 = 의원 ${UNIT}곳` : "0–9세 아이 1만 명당 소아청소년과 의원 · 문 1개 = 1곳", full ? 28 : 14, full ? 54 : 40);
    if (full) ctx.fillText("그해 말 기준 · 2024년 이전은 많아야 이만큼 (그 뒤 닫은 의원을 모두 그때 열려 있었다고 셈)", 28, 72);
    else ctx.fillText("2024년 이전은 많아야 이만큼", 14, 56);
    let hit = null;
    const grow = KF.clamp((el - 0.2) / 1.6, 0, 1);
    if (full) {                                                               // the division, spelled out
      const bx = w - 330, by = 26, a0 = d.years[0], a1 = d.years[n - 1], pct = (a, b) => `${b >= a ? "+" : "−"}${Math.abs((b / a - 1) * 100).toFixed(0)}%`;
      const rowsT = [["소아청소년과 의원", `많아야 ${KF.fmt(d.up[0])}`, KF.fmt(d.up[n - 1]), pct(d.up[0], d.up[n - 1]), k < 0.5],
        ["÷ 0–9세 아이", `${(d.k10[0] / 1e4).toFixed(0)}만`, `${(d.k10[n - 1] / 1e4).toFixed(0)}만`, pct(d.k10[0], d.k10[n - 1]), false],
        ["= 1만 명당 의원", `많아야 ${X.dens[0].toFixed(1)}`, X.dens[n - 1].toFixed(1), pct(X.dens[0], X.dens[n - 1]), k >= 0.5]];
      ctx.font = `500 10.5px ${MONO}`; ctx.fillStyle = MUTE; ctx.textAlign = "right";
      ctx.fillText(String(a0), bx + 212, by); ctx.fillText(String(a1), bx + 262, by); ctx.fillText("변화", bx + 310, by);
      rowsT.forEach(([lab, v0, v1, ch, on], j) => {
        const yy = by + 20 + j * 19;
        ctx.textAlign = "left"; ctx.fillStyle = on ? WARM : INK; ctx.font = `${on ? 700 : 500} 12px ${SANS}`; ctx.fillText(lab, bx, yy);
        ctx.textAlign = "right"; ctx.font = `${on ? 700 : 500} 11.5px ${MONO}`;
        ctx.fillText(v0, bx + 212, yy); ctx.fillText(v1, bx + 262, yy); ctx.fillText(ch, bx + 310, yy);
      });
    }
    d.years.forEach((yr, i) => {
      const units = KF.lerp(d.up[i] / UNIT, X.dens[i], k) * grow;
      const cx = L.x + (i + 0.5) * cw, base = L.y + L.h;
      const on = st.yi === i, hv = hover && Math.abs(hover[0] - cx) < cw / 2 && hover[1] > L.y - 20 && hover[1] < base + 16;
      for (let u = 0; u < Math.ceil(units); u++) {
        const frac = Math.min(1, units - u), yy = base - (u + 1) * uh + (uh - dh);
        ctx.save();
        if (frac < 1) { ctx.beginPath(); ctx.rect(cx - dw / 2 - 1, yy + dh * (1 - frac), dw + 2, dh * frac + 1); ctx.clip(); }
        door(ctx, cx - dw / 2, yy, dw, dh, "c", 0, false);
        if (dw >= 7) { ctx.fillStyle = "#ffe2a0"; ctx.fillRect(cx - dw / 2 + dw * 0.22, yy + dh * 0.14, dw * 0.56, dh * 0.2); }
        ctx.restore();
      }
      ctx.fillStyle = FLOOR; ctx.fillRect(cx - cw / 2 + 0.5, base, cw - 1, 3);
      if (on || hv) { ctx.strokeStyle = on ? INK : MUTE; ctx.lineWidth = 1; ctx.strokeRect(cx - cw / 2 + 0.5, base - units * uh - 8, cw - 1, units * uh + 12); }
      const lbl = k < 0.5 ? (full ? KF.fmt(Math.round(d.up[i] * grow)) : "") : (X.dens[i] * grow).toFixed(1);
      if (lbl && (full || yr % 5 === 0 || i === n - 1)) {
        ctx.fillStyle = on || i === n - 1 ? INK : MUTE; ctx.font = `${on || i === n - 1 ? 700 : 500} ${full ? (k < 0.5 ? 9 : 10.5) : 9.5}px ${MONO}`; ctx.textAlign = "center";
        ctx.fillText(lbl, cx, base - units * uh - (full ? 5 : 4));
      }
      if (yr % 5 === 0 || i === n - 1) { ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 10.5 : 9}px ${MONO}`; ctx.textAlign = "center"; ctx.fillText(full ? String(yr) : `'${String(yr).slice(2)}`, cx, base + 16); }
      if (hv) hit = i;
    });
    if (!full) {                                                              // phone: the two ends in words
      const a = d.years[0], b = d.years[n - 1];
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 12px ${SANS}`;
      const t = k < 0.5 ? `${a}년 많아야 ${KF.fmt(d.up[0])}곳 → ${b}년 ${KF.fmt(d.up[n - 1])}곳` : `${a}년 많아야 ${X.dens[0].toFixed(1)}곳 → ${b}년 ${X.dens[n - 1].toFixed(1)}곳`;
      ctx.fillText(t, 14, h - 34);
      ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${SANS}`;
      ctx.fillText(`출생아 ${KF.fmt(d.births[0])}명 → ${KF.fmt(d.births[n - 1])}명`, 14, h - 16);
    }
    if (hit !== null && hover) {
      const i = hit, up = i < n - 1 ? "많아야 " : "";
      tip(ctx, w, h, [[`${d.years[i]}년 말`, 1], [`소아청소년과 의원 ${up}${KF.fmt(d.up[i])}곳`, 0], [`0–9세 ${KF.fmt(d.k10[i])}명 (출생아 10년 합)`, 0],
        [`1만 명당 ${up}${X.dens[i].toFixed(2)}곳`, 0], [`그해 출생아 ${KF.fmt(d.births[i])}명`, 2]], hover);
    }
  }

  // ---------------------------------------------------------------- view 3: by 시도
  function viewRegions(ctx, w, h, X, el, hover) {
    const d = X.d, full = w > 520, S = d.sum;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `700 ${full ? 20 : 15}px ${SERIF}`;
    ctx.fillText("사는 곳마다", full ? 28 : 14, full ? 34 : 24);
    ctx.fillStyle = MUTE; ctx.font = `500 ${full ? 11.5 : 9.5}px ${SANS}`;
    ctx.fillText(`0–9세 아이 1만 명당 소아청소년과 의원 · 2025년 12월 · 문 1개 = 1곳`, full ? 28 : 14, full ? 54 : 40);
    const top = full ? 78 : 56, bot = full ? h - 20 : h - 64, rh = (bot - top) / X.reg.length;
    const lx = full ? 28 : 14, lw = full ? 44 : 34, dx0 = lx + lw;
    const dh = Math.min(rh * 0.78, full ? 22 : 16), dw = dh * 0.54, step = dw + (full ? 7 : 4.5);
    let hit = null;
    X.reg.forEach((r, i) => {
      const y = top + i * rh, p = KF.clamp((el - 0.2 - i * 0.07) / 0.8, 0, 1), units = r.v * KF.ease(p);
      const hv = hover && hover[1] >= y && hover[1] < y + rh && hover[0] < (full ? w * 0.62 : w);
      ctx.fillStyle = hv ? "rgba(233,239,233,.06)" : i % 2 ? "rgba(0,0,0,.08)" : "rgba(0,0,0,0)"; ctx.fillRect(lx - 6, y, (full ? w * 0.62 : w - 16) - lx + 6, rh);
      ctx.fillStyle = INK; ctx.font = `600 ${full ? 12 : 11}px ${SANS}`; ctx.textAlign = "left";
      ctx.fillText(r.s, lx, y + rh / 2 + 4);
      const yy = y + (rh - dh) / 2;
      for (let u = 0; u < Math.ceil(units); u++) {
        const frac = Math.min(1, units - u), x = dx0 + u * step;
        ctx.save();
        if (frac < 1) { ctx.beginPath(); ctx.rect(x - 1, yy - 1, dw * frac + 1, dh + 2); ctx.clip(); }
        door(ctx, x, yy, dw, dh, "c", 0, false);
        if (dw >= 7) { ctx.fillStyle = "#ffe2a0"; ctx.fillRect(x + dw * 0.22, yy + dh * 0.14, dw * 0.56, dh * 0.2); }
        ctx.restore();
      }
      ctx.fillStyle = r.v < 5 ? COLD : INK; ctx.font = `700 ${full ? 12 : 11}px ${MONO}`;
      const vx = dx0 + 10 * step + (full ? 8 : 4);
      ctx.fillText(r.v.toFixed(1), vx, y + rh / 2 + 4);
      if (full) {
        ctx.fillStyle = MUTE; ctx.font = `500 11px ${SANS}`;
        ctx.fillText(`의원 ${KF.fmt(r.n)} · 0–9세 ${KF.fmt(r.k)}${r.z ? ` · 없는 시군구 ${r.z}/${r.u}` : ""}`, vx + 40, y + rh / 2 + 4);
      }
      if (hv) hit = r;
    });
    const zx = full ? w * 0.66 : 14;
    if (full) {
      ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `600 12px ${SANS}`;
      ctx.fillText("소아청소년과 간판이 없는 시군구", zx, 110);
      ctx.fillStyle = COLD; ctx.font = `700 48px ${SANS}`; ctx.fillText(`${S.zero}곳`, zx, 162);
      ctx.fillStyle = INK; ctx.font = `500 12.5px ${SANS}`;
      ctx.fillText(`전국 시군구 ${S.units}곳 가운데`, zx, 186);
      ctx.fillText(`그곳의 0–9세 아이 ${KF.fmt(S.zeroKids)}명`, zx, 206);
      ctx.fillStyle = MUTE; ctx.font = `500 11px ${SANS}`;
      ctx.fillText(`그중 ${S.zeroAny}곳엔 소아청소년과를 진료과목으로`, zx, 230);
      ctx.fillText("적어 둔 다른 의원·병원·보건기관이 있다", zx, 246);
      ctx.fillStyle = INK; ctx.font = `600 11.5px ${SANS}`; ctx.fillText("간판 없는 곳 가운데 아이가 많은 곳", zx, 284);
      S.zeroTop.forEach(([sd, nm, k], j) => {
        ctx.fillStyle = MUTE; ctx.font = `500 11.5px ${SANS}`; ctx.textAlign = "left"; ctx.fillText(`${sd} ${nm}`, zx, 304 + j * 18);
        ctx.font = `500 11px ${MONO}`; ctx.textAlign = "right"; ctx.fillText(`${KF.fmt(k)}명`, zx + 210, 304 + j * 18);
      });
      ctx.textAlign = "left"; ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${SANS}`;
      ctx.fillText(`전국 평균 ${((S.n / S.k2512) * 1e4).toFixed(1)}곳 (의원 ${KF.fmt(S.n)} ÷ 0–9세 ${KF.fmt(S.k2512)})`, zx, h - 44);
      ctx.fillText("일반구는 시로 합침 · 2025년 시군구 경계", zx, h - 26);
    } else {
      ctx.textAlign = "left"; ctx.fillStyle = COLD; ctx.font = `700 13px ${SANS}`;
      ctx.fillText(`간판 없는 시군구 ${S.zero}곳 / ${S.units}곳`, zx, h - 38);
      ctx.fillStyle = MUTE; ctx.font = `500 10.5px ${SANS}`;
      ctx.fillText(`그곳의 0–9세 ${KF.fmt(S.zeroKids)}명 · 전국 평균 ${((S.n / S.k2512) * 1e4).toFixed(1)}곳`, zx, h - 19);
    }
    if (hit && hover) tip(ctx, w, h, [[`${hit.s}`, 1], [`소아청소년과 의원 ${KF.fmt(hit.n)}곳`, 0], [`0–9세 ${KF.fmt(hit.k)}명 · 1만 명당 ${hit.v.toFixed(2)}곳`, 0],
      [`의원 없는 시군구 ${hit.z}곳 / ${hit.u}곳`, 0], [`최근 12개월 폐업 ${hit.wcl}곳`, 2]], hover);
  }

  function tip(ctx, w, h, lines, hover) {
    const fontOf = (k) => (k === 1 ? `700 12.5px ${SANS}` : k === 2 ? `500 11px ${SANS}` : `500 11.5px ${SANS}`);
    const bw = Math.min(w - 12, Math.max(...lines.map(([t, k]) => { ctx.font = fontOf(k); return ctx.measureText(t).width; })) + 22);
    const bh = 12 + lines.length * 18;
    const bx = KF.clamp(hover[0] + 14 + bw > w - 6 ? hover[0] - bw - 12 : hover[0] + 14, 6, w - bw - 6), by = KF.clamp(hover[1] - bh - 8, 6, h - bh - 6);
    ctx.fillStyle = "rgba(16,21,19,.96)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = WARM; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.textAlign = "left";
    lines.forEach(([t, k], j) => { ctx.fillStyle = k === 2 ? MUTE : k === 1 ? WARM : INK; ctx.font = fontOf(k); ctx.fillText(t, bx + 11, by + 20 + j * 18); });
  }

  // ---------------------------------------------------------------- thumb: the last 12 months
  function thumb(ctx, w, h, t, d) {
    const X = decode(d);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const c = t % 10, E = { o: X.wo, c: X.wc, win: true };
    const box = { x: 14, y: 36, w: w * 0.58, h: h - 36 - 44 };
    wall(ctx, box, E, c, 2.6, 2, null, false, true);
    const x = w * 0.62 + 10, a = KF.clamp((c - 1.2) / 0.8, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.058)}px ${SANS}`; ctx.fillText("소아청소년과 의원", x, h * 0.2);
    ctx.fillText(`${d.win.label}`, x, h * 0.2 + h * 0.075);
    const big = (v, col, yy, label) => {
      ctx.fillStyle = col; ctx.font = `700 ${Math.round(h * 0.16)}px ${SANS}`; ctx.fillText(v, x, yy);
      const vw = ctx.measureText(v).width;
      ctx.fillStyle = MUTE; ctx.font = `600 ${Math.round(h * 0.058)}px ${SANS}`; ctx.fillText(label, x + vw + 6, yy);
    };
    big(`${X.wc.length}`, COLD, h * 0.52, "곳 닫고");
    big(`${X.wo.length}`, WARM, h * 0.76, "곳 열고");
    ctx.globalAlpha = 1;
    if (c > 9.4) { ctx.fillStyle = `rgba(30,38,35,${(c - 9.4) / 0.6})`; ctx.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- mount
  function mount(stage, controls, d) {
    const X = decode(d), s = KF.canvas(stage);
    const st = { view: "doors", sp: PED, yi: -1, mix: 0, mixTarget: 1, fast: false };
    let t0 = performance.now(), hover = null, geo = {}, userMix = false;
    const restart = (fast) => { t0 = performance.now(); st.fast = fast; };
    KF.segment(controls, [{ id: "doors", label: "여닫힌 문" }, { id: "kids", label: "아이 수로 나누면" }, { id: "where", label: "사는 곳마다" }], "doors", (id) => {
      st.view = id; restart(false); showCtl();
      if (id === "kids" && !userMix) { st.mix = 0; st.mixTarget = 1; setMixBtns(1); }
    });
    const spBox = document.createElement("span"); spBox.style.display = "contents";
    const lab1 = document.createElement("span"); lab1.className = "readout"; lab1.textContent = " 과목:"; spBox.appendChild(lab1);
    const spBtns = KF.segment(spBox, d.sp.map((x) => ({ id: x, label: x })), PED, (id) => { st.sp = id; restart(true); });
    const range = document.createElement("input"); range.type = "range"; range.min = d.years[0]; range.max = d.years[d.years.length - 1]; range.step = 1; range.value = d.years[d.years.length - 1];
    const yl = document.createElement("label"); yl.append("연도", range);
    const out = document.createElement("span"); out.className = "readout"; out.textContent = "최근 12개월";
    const winBtn = document.createElement("button"); winBtn.type = "button"; winBtn.textContent = "최근 12개월";
    const mixBox = document.createElement("span"); mixBox.style.display = "contents";
    const lab2 = document.createElement("span"); lab2.className = "readout"; lab2.textContent = " 세는 법:"; mixBox.appendChild(lab2);
    const mixBtns = KF.segment(mixBox, [{ id: 0, label: "의원 수" }, { id: 1, label: "아이 1만 명당" }], 1, (id) => { userMix = true; st.mixTarget = id; });
    const setMixBtns = (id) => mixBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === id)));
    controls.append(spBox, yl, out, winBtn, mixBox);
    const showCtl = () => {
      spBox.style.display = st.view === "doors" ? "contents" : "none";
      winBtn.style.display = st.view === "doors" ? "" : "none";
      yl.style.display = st.view === "where" ? "none" : ""; out.style.display = st.view === "where" ? "none" : "";
      mixBox.style.display = st.view === "kids" ? "contents" : "none";
    };
    const setYear = (yi) => { st.yi = yi; out.textContent = yi >= 0 ? `${d.years[yi]}년` : "최근 12개월"; if (yi >= 0) range.value = d.years[yi]; };
    range.oninput = () => { setYear(d.years.indexOf(+range.value)); restart(true); };
    winBtn.onclick = () => { setYear(-1); restart(true); };
    showCtl();
    const pick = (e, click) => {
      const r = stage.getBoundingClientRect(); hover = [e.clientX - r.left, e.clientY - r.top];
      if (!click || st.view !== "doors" || !geo.tl) return;
      if (geo.sp && hover[0] >= geo.sp.x - 4 && hover[0] <= geo.sp.x + geo.sp.w) {   // a row of the specialty list
        const b = geo.sp.boxes.find(([, y0, y1]) => hover[1] >= y0 && hover[1] < y1);
        if (b) { st.sp = b[0]; spBtns.forEach((x) => x.setAttribute("aria-pressed", String(x.textContent === b[0]))); restart(true); return; }
      }
      const T = geo.tl;
      if (hover[1] < T.y - 8 || hover[1] > T.y + T.h + 16 || hover[0] < T.x || hover[0] > T.x + T.w) return;
      const i = Math.floor((hover[0] - T.x) / T.cw);
      if (i >= 0 && i < T.n) { setYear(i); restart(true); } else if (Math.abs(hover[0] - T.wx) < T.cw) { setYear(-1); restart(true); }
    };
    stage.addEventListener("pointermove", (e) => pick(e, false));
    stage.addEventListener("pointerdown", (e) => pick(e, true));
    stage.addEventListener("pointerleave", () => { hover = null; });
    let last = performance.now();
    KF.loop(stage, () => {
      const { ctx, w, h } = s, now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const el = (now - t0) / 1000;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
      if (st.view === "doors") geo = viewDoors(ctx, w, h, X, st, el, hover);
      else if (st.view === "kids") {
        if (!userMix) st.mix = el < 1.9 ? 0 : Math.min(1, (el - 1.9) / 1.4);
        else st.mix += (st.mixTarget - st.mix) * (1 - Math.exp(-dt * 4));
        viewTowers(ctx, w, h, X, st, el, hover); geo = {};
      } else { viewRegions(ctx, w, h, X, el, hover); geo = {}; }
    });
  }

  VIZ.pediatrics = { thumb, mount, bg: BG };
})();
