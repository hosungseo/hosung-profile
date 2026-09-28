// 13 shops — "Night shopping street". Every one of the 100 everyday business types is a storefront whose width is
// its number of businesses; the neon sign glows mint if it grew in a year and flickers red if it shrank. The biggest
// shop, online selling, has no sign at all.
(() => {
  const BG = "#120d17";
  const MINT = [92, 242, 194], RED = [255, 90, 110], WHITE = [245, 230, 200], WARM = [255, 214, 150];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const MONO = "IBM Plex Mono, monospace", SANS = "Pretendard Variable, sans-serif";
  const clamp = KF.clamp;
  const ONLINE = "통신판매업";
  const hash = (i, k) => { const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5453; return x - Math.floor(x); };
  const gr = (x) => x.c / x.y - 1;
  const signColor = (x) => (gr(x) > 0.003 ? MINT : gr(x) < -0.003 ? RED : WHITE);
  const short = (n) => n.replace("ㆍ", "·");

  // ---------------------------------------------------------------- views: which shops, in what order, at what scale
  function view(d, id, W) {
    const by = Object.fromEntries(d.items.map((x) => [x.n, x]));
    let list, val;
    if (id === "all") { list = d.items.slice(); val = (x) => x.c; }
    else if (id === "up") { list = d.items.slice().sort((a, b) => (b.c - b.y) - (a.c - a.y)).slice(0, 10); val = (x) => x.c - x.y; }
    else if (id === "down") { list = d.items.slice().sort((a, b) => (a.c - a.y) - (b.c - b.y)).slice(0, W > 520 ? 10 : 6); val = (x) => x.y - x.c; }
    else { list = [ONLINE, "한식음식점", ...d.trio].map((n) => by[n]); val = (x) => x.c; }
    const gap = 3, sum = list.reduce((a, x) => a + val(x), 0);
    const scale = id === "all" ? (W * (W > 520 ? 2.2 : 2.4)) / sum : (W - 40 - gap * list.length) / sum;
    let x = 0;
    const shops = list.map((it, i) => { const w = val(it) * scale, s = { it, x, w, i, v: val(it) }; x += w + gap; return s; });
    return { id, shops, len: x - gap, scale, mode: id === "up" ? "new" : id === "down" ? "closed" : "count" };
  }

  // ---------------------------------------------------------------- scenery
  function sky(ctx, w, h, yb, cam, dusk) {
    const g = ctx.createLinearGradient(0, 0, 0, yb);
    g.addColorStop(0, "#120d17"); g.addColorStop(1, `rgb(${34 + 30 * dusk},${22 + 14 * dusk},${44 + 10 * dusk})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, yb);
    // distant skyline, slow parallax
    for (let k = 0; k < 40; k++) {
      const bw = 30 + hash(k, 1) * 70, bh = 40 + hash(k, 2) * 120, bx = ((k * 83 - cam * 0.25) % (w + 400) + w + 400) % (w + 400) - 200;
      ctx.fillStyle = "#0d0a12"; ctx.fillRect(bx, yb - bh - 60, bw, bh + 60);
      for (let j = 0; j < 6; j++) if (hash(k, j + 3) > 0.72) { ctx.fillStyle = "rgba(255,210,150,.16)"; ctx.fillRect(bx + 6 + (j % 3) * (bw / 3.4), yb - bh - 50 + Math.floor(j / 3) * 18, 4, 6); }
    }
  }
  function street(ctx, w, h, yb) {
    ctx.fillStyle = "#1c1620"; ctx.fillRect(0, yb, w, 10);                    // sidewalk
    const g = ctx.createLinearGradient(0, yb + 10, 0, h);
    g.addColorStop(0, "#0f0b13"); g.addColorStop(1, "#08060b");
    ctx.fillStyle = g; ctx.fillRect(0, yb + 10, w, h - yb - 10);
    ctx.strokeStyle = "rgba(255,255,255,.05)"; ctx.setLineDash([26, 22]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, h - (h - yb) * 0.35); ctx.lineTo(w, h - (h - yb) * 0.35); ctx.stroke(); ctx.setLineDash([]);
  }

  // text helpers
  function fitFont(ctx, s, maxW, big, small, weight = 600) {
    for (let f = big; f >= small; f -= 1) { ctx.font = `${weight} ${f}px ${SANS}`; if (ctx.measureText(s).width <= maxW) return f; }
    return 0;
  }
  function txt(ctx, s, x, y, font, color, align = "left") { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); }

  // ---------------------------------------------------------------- one storefront
  // sx: screen x, S: shop, geo: {yb, Hf}, t: seconds, on: 0..1 sign power
  function shop(ctx, sx, S, geo, t, on, full, mode) {
    const { it, w, i } = S, { yb, Hf } = geo, top = yb - Hf, gf = Hf * 0.4, sb = full ? 30 : 24;
    const online = it.n === ONLINE, col = signColor(it), g = gr(it);
    // building + upper-floor windows
    ctx.fillStyle = `rgb(${26 + (i % 3) * 3},${20 + (i % 2) * 3},${32 + (i % 4) * 2})`;
    ctx.fillRect(sx, top, w, Hf);
    if (w > 10) {
      const cols = Math.max(1, Math.floor(w / 26)), cw = w / cols, rowsN = Math.floor((Hf - gf - sb - 16) / 26);
      for (let r = 0; r < rowsN; r++) for (let c = 0; c < cols; c++) {
        const lit = hash(i * 13 + c, r) > 0.62;
        ctx.fillStyle = lit ? "rgba(255,214,150,.22)" : "rgba(0,0,0,.25)";
        ctx.fillRect(sx + c * cw + cw * 0.28, top + 10 + r * 26, cw * 0.44, 14);
      }
    }
    // ground floor: lit window, minus the shutter for businesses gone / plus a new bay for businesses added
    const wy = yb - gf + 6, wh = gf - 8;
    const lost = it.y > it.c ? (it.y - it.c) / it.y : 0, added = it.c > it.y ? (it.c - it.y) / it.c : 0;
    const shut = w * lost, fresh = w * added;
    if (mode === "closed") { // every business counted here is gone: a fully shuttered front
      ctx.fillStyle = "#3b3441"; ctx.fillRect(sx + 2, wy, Math.max(0, w - 4), wh);
      ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1;
      for (let y = wy + 3; y < wy + wh; y += 4) { ctx.beginPath(); ctx.moveTo(sx + 2, y); ctx.lineTo(sx + w - 2, y); ctx.stroke(); }
    } else if (mode === "new") { // every business counted here opened this year
      ctx.fillStyle = rgba(MINT, 0.12 + 0.16 * on); ctx.fillRect(sx + 2, wy, Math.max(0, w - 4), wh);
      ctx.strokeStyle = rgba(MINT, 0.6 * on); ctx.lineWidth = 1; if (w > 5) ctx.strokeRect(sx + 2.5, wy + 0.5, w - 5, wh - 1);
      if (online) for (let k = 0; k < Math.floor(w / 22); k++) { const bx = sx + 8 + k * 22, bh = 8 + hash(k, 9) * 10; ctx.fillStyle = "rgba(196,150,96,.6)"; ctx.fillRect(bx, yb - bh, 14, bh); }
    } else if (online) {
      ctx.fillStyle = "rgba(20,26,48,.9)"; ctx.fillRect(sx + 2, wy, w - 4, wh);
      for (let k = 0; k < Math.floor(w / 36); k++) { // screens glowing inside
        const px = sx + 14 + k * 36, py = wy + wh * 0.35;
        ctx.fillStyle = `rgba(120,170,255,${0.22 + 0.1 * Math.sin(t * 1.3 + k)})`; ctx.fillRect(px, py, 16, 11);
      }
      for (let k = 0; k < Math.floor(w / 22); k++) { // parcels by the door
        const bx = sx + 8 + k * 22, bh = 8 + hash(k, 9) * 10;
        ctx.fillStyle = "rgba(196,150,96,.55)"; ctx.fillRect(bx, yb - bh, 14, bh);
        ctx.strokeStyle = "rgba(90,60,30,.6)"; ctx.strokeRect(bx + 0.5, yb - bh + 0.5, 13, bh - 1);
      }
    } else {
      const lg = ctx.createLinearGradient(0, wy, 0, wy + wh);
      lg.addColorStop(0, rgba(WARM, 0.12 + 0.28 * on)); lg.addColorStop(1, rgba(WARM, 0.05 + 0.12 * on));
      ctx.fillStyle = lg; ctx.fillRect(sx + 2, wy, Math.max(0, w - 4 - shut), wh);
      if (shut >= 1.5) { // rolling shutter
        ctx.fillStyle = "#3b3441"; ctx.fillRect(sx + w - 2 - shut, wy, shut, wh);
        ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1;
        for (let y = wy + 3; y < wy + wh; y += 4) { ctx.beginPath(); ctx.moveTo(sx + w - 2 - shut, y); ctx.lineTo(sx + w - 2, y); ctx.stroke(); }
      }
    }
    if (mode === "count" && fresh >= 1.5) { // the part that is new this year
      ctx.fillStyle = rgba(MINT, 0.16 + 0.1 * on); ctx.fillRect(sx + w - 2 - fresh, wy, fresh, wh);
      ctx.strokeStyle = rgba(MINT, 0.6 * on); ctx.lineWidth = 1; ctx.strokeRect(sx + w - 2 - fresh + 0.5, wy + 0.5, fresh - 1, wh - 1);
    }
    // sign
    const sy = yb - gf - sb - 2;
    const flick = g < -0.003 ? (Math.sin(t * 17 + i * 5) > 0.86 - Math.min(0.5, -g * 5) ? 0.35 : 1) * (0.78 + 0.22 * Math.sin(t * 9 + i)) : 1;
    const glow = (g > 0.003 ? 0.55 + 0.45 * Math.min(1, g / 0.08) : g < -0.003 ? 0.5 : 0.6) * on * flick;
    const out = { sign: null };
    if (online) {
      ctx.strokeStyle = "rgba(200,190,220,.25)"; ctx.setLineDash([4, 4]); ctx.strokeRect(sx + 8, sy, w - 16, sb); ctx.setLineDash([]);
      if (w > 120) txt(ctx, "간판 없음", sx + w / 2, sy + sb / 2 + 4, `500 ${full ? 12 : 10.5}px ${SANS}`, "rgba(210,200,230,.5)", "center");
    } else if (w >= 18) {
      const name = short(it.n), fsH = w >= 54 ? fitFont(ctx, name, w - 18, full ? 15 : 13, 10) : 0;
      ctx.save(); ctx.shadowColor = rgba(col, 0.9 * glow); ctx.shadowBlur = 14 * glow;
      if (fsH) {
        ctx.fillStyle = "rgba(10,8,14,.92)"; ctx.fillRect(sx + 4, sy, w - 8, sb);
        ctx.strokeStyle = rgba(col, 0.3 + 0.6 * glow); ctx.lineWidth = 1.5; ctx.strokeRect(sx + 4.5, sy + 0.5, w - 9, sb - 1);
        ctx.restore();
        ctx.save(); ctx.shadowColor = rgba(col, glow); ctx.shadowBlur = 8 * glow;
        txt(ctx, name, sx + w / 2, sy + sb / 2 + fsH * 0.36, `700 ${fsH}px ${SANS}`, rgba(col, 0.35 + 0.65 * glow), "center");
        ctx.restore();
        out.sign = "h";
      } else { // narrow shop (or long name): vertical projecting sign with every character
        const chars = [...name.replace(/·/g, "")], vw = Math.min(w - 4, 20);
        const room = sy + sb - (top + 8), fs = Math.max(7, Math.min(12, vw - 6, (room - 10) / chars.length - 2));
        const vh = chars.length * (fs + 2) + 10, vx = sx + (w - vw) / 2, vy = sy + sb - vh;
        ctx.fillStyle = "rgba(10,8,14,.92)"; ctx.fillRect(vx, vy, vw, vh);
        ctx.strokeStyle = rgba(col, 0.3 + 0.6 * glow); ctx.lineWidth = 1.2; ctx.strokeRect(vx + 0.5, vy + 0.5, vw - 1, vh - 1);
        ctx.restore();
        ctx.save(); ctx.shadowColor = rgba(col, glow); ctx.shadowBlur = 6 * glow;
        chars.forEach((ch, k) => txt(ctx, ch, vx + vw / 2, vy + 7 + (k + 0.82) * (fs + 2), `700 ${fs}px ${SANS}`, rgba(col, 0.35 + 0.65 * glow), "center"));
        ctx.restore();
        out.sign = "v";
      }
    } else {
      ctx.fillStyle = rgba(col, 0.25 + 0.6 * glow); ctx.fillRect(sx, sy + sb - 4, Math.max(1, w), 3);
    }
    // change printed on the window glass for wide shops
    if (w >= 54) {
      const pct = `${g >= 0 ? "+" : ""}${(g * 100).toFixed(1)}%`, dv = it.c - it.y;
      const l1 = mode === "count" ? pct : `${dv >= 0 ? "+" : ""}${KF.fmt(dv)}`, l2 = mode === "count" ? `${KF.fmt(it.c)}곳` : pct;
      txt(ctx, l1, sx + 10, wy + (full ? 17 : 14), `600 ${full ? 12 : 10.5}px ${MONO}`, mode === "closed" ? "rgba(255,190,198,.95)" : rgba(online ? MINT : col, 0.9 * on + 0.1), "left");
      if (w >= (mode === "count" ? 110 : 54)) txt(ctx, l2, sx + 10, wy + (full ? 33 : 28), `500 ${full ? 11 : 10}px ${MONO}`, "rgba(240,230,215,.75)");
    }
    // wet-street reflection
    const rg = ctx.createLinearGradient(0, yb + 10, 0, yb + 10 + (full ? 90 : 60));
    rg.addColorStop(0, rgba(online ? [120, 170, 255] : col, (online ? 0.08 : 0.2) * glow)); rg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = rg; ctx.fillRect(sx + 4, yb + 10, Math.max(0, w - 8), full ? 90 : 60);
    return out;
  }

  function tip(ctx, w, h, x, y, lines) {
    ctx.font = `600 12px ${SANS}`; let tw = ctx.measureText(lines[0]).width;
    ctx.font = `500 11px ${MONO}`; for (const l of lines.slice(1)) tw = Math.max(tw, ctx.measureText(l).width);
    const bw = tw + 22, bh = 14 + lines.length * 17;
    let bx = x + 14; if (bx + bw > w - 6) bx = x - bw - 14; bx = clamp(bx, 6, w - bw - 6);
    const by = clamp(y - bh - 12, 6, h - bh - 6);
    ctx.fillStyle = "rgba(14,10,18,.95)"; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "rgba(245,230,200,.5)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    lines.forEach((l, k) => txt(ctx, l, bx + 11, by + 20 + k * 17, k ? `500 11px ${MONO}` : `600 12px ${SANS}`, k ? "rgba(240,230,215,.82)" : "#fff"));
  }

  // café billboard (소진공 series) — shown with the chicken/café/convenience view
  function billboard(ctx, x, y, w, h, d, on) {
    ctx.fillStyle = "rgba(10,8,14,.9)"; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = rgba(WHITE, 0.35); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = "#0d0a12"; ctx.fillRect(x + w * 0.2, y + h, 3, 14); ctx.fillRect(x + w * 0.8, y + h, 3, 14);
    const v = d.cafe.v, n = v.length, lo = 60000, hi = 102000;
    const X = (k) => x + 12 + (k / (n - 1)) * (w - 24), Y = (val) => y + h - 12 - ((val - lo) / (hi - lo)) * (h - 40);
    txt(ctx, `카페 점포 수 ${d.cafe.m[0].replace("-", ".")}–${d.cafe.m[n - 1].replace("-", ".")} · 소상공인시장진흥공단`, x + 10, y + 16, `500 10.5px ${SANS}`, "rgba(240,230,215,.75)");
    ctx.save(); ctx.shadowColor = rgba(MINT, on); ctx.shadowBlur = 8; ctx.strokeStyle = rgba(MINT, 0.9 * on); ctx.lineWidth = 2;
    ctx.beginPath(); v.forEach((val, k) => (k ? ctx.lineTo(X(k), Y(val)) : ctx.moveTo(X(k), Y(val)))); ctx.stroke(); ctx.restore();
    txt(ctx, KF.fmt(v[0]), X(0), Y(v[0]) + 14, `500 10px ${MONO}`, "rgba(240,230,215,.8)");
    txt(ctx, KF.fmt(v[n - 1]), X(n - 1), Y(v[n - 1]) - 6, `600 10.5px ${MONO}`, rgba(MINT, 1), "right");
  }

  // ---------------------------------------------------------------- the scene
  function scene(ctx, w, h, d, V, cam, t, intro, hover, full, extra) {
    const yb = Math.round(h * (full ? 0.74 : 0.72)), Hf = h * (full ? 0.44 : 0.4);
    const geo = { yb, Hf }, pad = 20;
    const dusk = clamp(1 - intro / 0.9, 0, 1);
    sky(ctx, w, h, yb, cam, dusk);
    street(ctx, w, h, yb);
    let hit = null;
    const onAt = (S) => clamp((intro - 0.5 - (S.x - cam) / Math.max(w, 1) * 2.4) / 0.5, 0, 1);
    for (const S of V.shops) {
      const sx = pad + S.x - cam;
      if (sx + S.w < -40 || sx > w + 40) continue;
      shop(ctx, sx, S, geo, t, onAt(S), full, V.mode);
      if (hover && hover[0] >= sx && hover[0] <= sx + S.w + 3 && hover[1] > yb - Hf - 30 && hover[1] < yb + 40) hit = S;
    }
    // narrow shops in the focused views: name and change in the sky, with a leader line
    if (V.id === "trio") {
      const narrow = V.shops.filter((S) => S.w < 54 && S.it.n !== ONLINE);
      const a = clamp((intro - 1.4) / 0.6, 0, 1), top = yb - Hf, lh = full ? 30 : 26;
      ctx.globalAlpha = a;
      narrow.forEach((S, k) => {
        const sx = pad + S.x - cam + S.w / 2, row = k % 3, ly = top - 12 - row * lh, it = S.it, dv = it.c - it.y;
        const label = `${short(it.n)}${it.n === "패스트푸드점" ? "(치킨 포함)" : ""}`;
        const val = V.mode === "count" ? `${((it.c / it.y - 1) * 100).toFixed(1)}%` : `${dv >= 0 ? "+" : ""}${KF.fmt(dv)}`;
        ctx.font = `600 ${full ? 11.5 : 10.5}px ${SANS}`;
        const tw = ctx.measureText(label).width + 8 + (full ? 50 : 44);
        const tx = clamp(sx - tw / 2, 6, w - tw - 6);
        ctx.strokeStyle = rgba(signColor(it), 0.55); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx, ly + 4); ctx.lineTo(sx, top + (full ? 30 : 24)); ctx.stroke();
        ctx.fillStyle = "rgba(14,10,18,.82)"; ctx.fillRect(tx - 4, ly - 13, tw + 8, 18);
        txt(ctx, label, tx, ly, `600 ${full ? 11.5 : 10.5}px ${SANS}`, "#f4ecff");
        txt(ctx, val, tx + tw, ly, `600 ${full ? 11 : 10}px ${MONO}`, rgba(signColor(it), 1), "right");
      });
      ctx.globalAlpha = 1;
    }
    // change views: values of narrow shops under the sidewalk; shops too thin for a sign are summed up
    if (V.id === "up" || V.id === "down") {
      const a = clamp((intro - 1.4) / 0.6, 0, 1);
      ctx.globalAlpha = a;
      let row = 0;
      for (const S of V.shops) {
        if (S.w >= 54 || S.w < 18) continue;
        const sx = pad + S.x - cam + S.w / 2, dv = S.it.c - S.it.y;
        txt(ctx, `${dv >= 0 ? "+" : ""}${KF.fmt(dv)}`, sx, yb + (full ? 30 : 26) + row * 15, `600 ${full ? 11 : 10}px ${MONO}`, rgba(signColor(S.it), 0.95), "center");
        row = 1 - row;
      }
      const thin = V.shops.filter((S) => S.w < 18);
      if (thin.length) {
        const x0 = pad + thin[0].x - cam, x1 = pad + thin[thin.length - 1].x + thin[thin.length - 1].w - cam;
        const sum = thin.reduce((q, S) => q + (S.it.c - S.it.y), 0), cx = clamp((x0 + x1) / 2, 90, w - 90);
        const lab = `그 밖의 ${thin.length}개 업종 합계 ${sum >= 0 ? "+" : ""}${KF.fmt(sum)}`;
        ctx.strokeStyle = "rgba(240,230,215,.5)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, yb - Hf - 8); ctx.lineTo(x0, yb - Hf - 14); ctx.lineTo(x1, yb - Hf - 14); ctx.lineTo(x1, yb - Hf - 8); ctx.stroke();
        txt(ctx, lab, cx, yb - Hf - 22, `600 ${full ? 12 : 11}px ${SANS}`, "#f4ecff", "center");
      }
      ctx.globalAlpha = 1;
    }
    // the giant with no sign gets a caption in the sky
    const on0 = V.shops.find((S) => S.it.n === ONLINE);
    if (on0) {
      const sx = pad + on0.x - cam, it = on0.it, cx = clamp(sx + on0.w / 2, 110, w - 110);
      if (sx + on0.w > 30 && sx < w - 30) {
        const a = clamp((intro - 1.6) / 0.6, 0, 1);
        ctx.globalAlpha = a;
        txt(ctx, "간판 없는 가게 · 통신판매업", cx, yb - Hf - (full ? 44 : 34), `700 ${full ? 16 : 13}px ${SANS}`, "#f4ecff", "center");
        txt(ctx, V.mode === "new" ? `1년 새 +${KF.fmt(it.c - it.y)}곳 · 순증의 ${Math.round(((it.c - it.y) / (d.total.c - d.total.y)) * 100)}%` : `${KF.fmt(it.c)}곳 · 1년 새 +${KF.fmt(it.c - it.y)}`, cx, yb - Hf - (full ? 22 : 16), `600 ${full ? 13 : 11}px ${MONO}`, rgba(MINT, 1), "center");
        ctx.globalAlpha = 1;
      }
    }
    return { hit, geo };
  }

  function thumb(ctx, w, h, t, d) {
    const c = t % 9;
    const V = view(d, "trio", w);
    scene(ctx, w, h, d, V, 0, t, clamp(c, 0, 6), null, false);
    const a = clamp((c - 2.2) / 0.6, 0, 1);
    ctx.globalAlpha = a;
    const T = d.total.c, trio = d.trio.reduce((s, n) => s + d.items.find((x) => x.n === n).c, 0);
    txt(ctx, `치킨·카페·편의점 = ${((trio / T) * 100).toFixed(0)}%`, 48, h - 14, `700 15px ${SANS}`, "#fff");
    txt(ctx, `100대 생활업종 ${Math.round(T / 10000)}만 곳`, w - 14, h - 14, `500 11px ${MONO}`, "rgba(240,230,215,.75)", "right");
    ctx.globalAlpha = 1;
    if (c > 8.3) { ctx.fillStyle = `rgba(18,13,23,${(c - 8.3) / 0.7})`; ctx.fillRect(0, 0, w, h); }
  }

  function mount(stage, controls, d) {
    const s = KF.canvas(stage);
    let vid = "trio", V = null, cam = 0, camT = 0, t0 = performance.now(), hover = null, drag = null, touched = false, lastW = 0, pausedAt = 0;
    const TITLES = {
      all: `100대 생활업종 ${d.now} · 가게 폭 = 사업자 수 · 큰 순서`, up: `1년 새 가장 많이 는 10개 업종 · 가게 폭 = 늘어난 사업자 수`,
      down: `1년 새 가장 많이 준 업종 · 가게 폭 = 줄어든 사업자 수`, trio: `치킨·카페·편의점과 가장 큰 두 업종 · 가게 폭 = 사업자 수 (${d.now})`,
    };
    const rebuild = () => { V = view(d, vid, s.w); lastW = s.w; };
    KF.segment(controls, [{ id: "trio", label: "치킨·카페·편의점" }, { id: "all", label: "전체 100업종" }, { id: "up", label: "많이 는 곳" }, { id: "down", label: "많이 준 곳" }], vid,
      (id) => { vid = id; rebuild(); cam = camT = 0; t0 = performance.now(); touched = false; });
    const note = document.createElement("span"); note.className = "readout"; note.textContent = "전체 보기는 끌어서 거리 이동";
    controls.appendChild(note);
    rebuild();
    const pos = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    stage.addEventListener("pointerdown", (e) => { drag = { x: pos(e)[0], cam: camT }; touched = true; });
    window.addEventListener("pointerup", () => { drag = null; });
    stage.addEventListener("pointermove", (e) => {
      hover = pos(e);
      if (drag) camT = clamp(drag.cam - (hover[0] - drag.x), 0, Math.max(0, V.len - s.w + 40));
    });
    stage.addEventListener("pointerleave", () => { hover = null; });
    stage.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault(); touched = true; camT = clamp(camT + e.deltaX, 0, Math.max(0, V.len - s.w + 40));
    }, { passive: false });
    stage.addEventListener("click", (e) => { // minimap jump
      const [x, y] = pos(e);
      if (y > s.h - 22 && V.len > s.w) { touched = true; camT = clamp(((x - 20) / (s.w - 40)) * V.len - s.w / 2, 0, V.len - s.w + 40); }
    });
    KF.loop(stage, (t) => {
      const { ctx, w, h } = s, full = w > 520;
      if (Math.abs(w - lastW) > 1) rebuild();
      const intro = (performance.now() - t0) / 1000, maxCam = Math.max(0, V.len - w + 40);
      // after the lights come on, drift slowly down the street until someone takes over (hover pauses)
      if (!touched && !hover && intro > 4.2 && maxCam > 0) camT = Math.min(maxCam, camT + 0.45);
      cam += (camT - cam) * 0.2;
      ctx.clearRect(0, 0, w, h);
      const { hit, geo } = scene(ctx, w, h, d, V, cam, t, intro, drag ? null : hover, full);
      // title + legend
      const a = clamp((intro - 0.3) / 0.6, 0, 1);
      ctx.globalAlpha = a;
      txt(ctx, TITLES[vid], 18, 28, `600 ${full ? 13 : 11.5}px ${SANS}`, "#f4ecff");
      const scaleN = vid === "all" || vid === "trio" ? 50000 : 1000, sl = scaleN * V.scale;
      if (sl > 6 && sl < w * 0.5) {
        ctx.strokeStyle = "rgba(240,230,215,.7)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(18, 40); ctx.lineTo(18, 46); ctx.lineTo(18 + sl, 46); ctx.lineTo(18 + sl, 40); ctx.stroke();
        txt(ctx, `폭 ${KF.fmt(scaleN)}곳`, 24 + sl, 47, `500 10.5px ${MONO}`, "rgba(240,230,215,.7)");
      }
      if (full) {
        [["늘었다", MINT], ["줄었다 (깜빡임·셔터)", RED], ["그대로", WHITE]].forEach(([lab, col], k, arr) => {
          const x = w - 18 - (arr.length - k) * 130 + 12;
          ctx.fillStyle = rgba(col, 0.9); ctx.fillRect(x, 20, 16, 5);
          txt(ctx, lab, x + 22, 27, `500 11px ${SANS}`, "rgba(240,230,215,.8)");
        });
      }
      ctx.globalAlpha = 1;
      if (vid === "trio" && full) {
        const bw = 250, bh = Math.min(96, geo.yb - geo.Hf - 64);
        if (bh > 60) billboard(ctx, Math.round(w * 0.5), 50, bw, bh, d, clamp((intro - 1.2) / 0.6, 0, 1));
      }
      // minimap of the whole street
      if (V.len > w) {
        const my = h - 16, mw = w - 40;
        V.shops.forEach((S) => { ctx.fillStyle = S.it.n === ONLINE ? "rgba(120,170,255,.55)" : rgba(signColor(S.it), 0.55); ctx.fillRect(20 + (S.x / V.len) * mw, my, Math.max(1, (S.w / V.len) * mw - 0.5), 5); });
        ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1;
        ctx.strokeRect(20 + (cam / V.len) * mw + 0.5, my - 3.5, Math.min(mw, (w / V.len) * mw), 12);
      }
      if (hit && !drag) {
        const it = hit.it, dv = it.c - it.y;
        tip(ctx, w, h, hover[0], hover[1], [short(it.n) + (it.n === "패스트푸드점" ? " (치킨 포함)" : ""),
          `${d.now}  ${KF.fmt(it.c)}곳`, `${d.yago}  ${KF.fmt(it.y)}곳`, `1년 증감  ${dv >= 0 ? "+" : ""}${KF.fmt(dv)} (${dv >= 0 ? "+" : ""}${((it.c / it.y - 1) * 100).toFixed(1)}%)`, `전월  ${KF.fmt(it.p)}곳`]);
      }
    });
  }

  VIZ.shops = { thumb, mount, bg: BG };
})();
