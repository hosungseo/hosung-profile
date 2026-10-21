import {
  makePopulation, mulberry32, allocate, soldOutAt, estimate, profileOf, willingness,
  AGES, INCOMES, NEEDS, AGENTS, WORLDS, AGE_BY_ID, INCOME_BY_ID, NEED_BY_ID, AGENT_BY_ID, WORLD_BY_ID,
  SEATS, APPLICANTS, BASE_FARE, agentMix,
} from './sim.js';

const $ = (id) => document.getElementById(id);
const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
const sec = (t) => `${t < 0.01 ? t.toFixed(3) : t < 1 ? t.toFixed(2) : t.toFixed(1)}초`;
const pct = (p) => (p === 0 ? '0%' : p < 0.01 ? '1% 미만' : `${Math.round(p * 100)}%`);
const tierColor = (agent) => `var(--t-${agent})`;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const params = new URLSearchParams(location.search);
const state = {
  world: WORLD_BY_ID[params.get('w')] ? params.get('w') : 'fcfs',
  life: null, // { seed, meId, crowd, layout, tapSpeed }
  run: 0,
};

// ---------- storage (per-viewer convenience only) ----------
const MINE_KEY = 'whose-seat:mine';
const loadMine = () => {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY)) || {};
  } catch {
    return {};
  }
};
const saveMine = (mine) => {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(mine));
  } catch {
    // Storage may be blocked; the comparison just won't persist
  }
};

// ---------- setup ----------
function buildWorldChips() {
  const box = $('world-chips');
  for (const world of WORLDS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.setAttribute('role', 'radio');
    chip.dataset.world = world.id;
    chip.textContent = world.name;
    chip.addEventListener('click', () => setWorld(world.id));
    box.append(chip);
  }
}

function syncWorldUi() {
  for (const chip of document.querySelectorAll('.chip')) {
    chip.setAttribute('aria-checked', String(chip.dataset.world === state.world));
  }
  const world = WORLD_BY_ID[state.world];
  $('world-desc').innerHTML = `${world.desc} 대가: <b>${world.cost}</b>`;
}

function buildMine() {
  const mine = loadMine();
  const fill = (select, list, key) => {
    select.append(new Option('고르기', ''));
    for (const item of list) select.append(new Option(item.label, item.id));
    select.value = mine[key] ?? '';
    select.addEventListener('change', () => {
      saveMine({ ...loadMine(), [key]: select.value });
      if (state.life && !$('odds').hidden) renderOdds();
    });
  };
  fill($('mine-age'), AGES, 'age');
  fill($('mine-income'), INCOMES, 'income');
  fill($('mine-agent'), AGENTS, 'agent');
}

const currentMine = () => {
  const mine = { age: $('mine-age').value, income: $('mine-income').value, agent: $('mine-agent').value };
  return mine.age && mine.income && mine.agent ? mine : null;
};

function buildAssumptions() {
  const shortName = (a) => a.label.replace(' 에이전트', '').replace(' AI 비서', '');
  const head = `<tr><th>나이 \\ 에이전트</th>${AGENTS.map((a) => `<th>${shortName(a)}</th>`).join('')}</tr>`;
  const rows = AGES.map((age) => {
    const mix = agentMix(age.id, 'mid');
    return `<tr><td>${age.label}</td>${mix.map((m) => `<td>${Math.round(m * 100)}%</td>`).join('')}</tr>`;
  }).join('');
  const speed = `<tr><td>도착 시간</td>${AGENTS.map((a) => `<td>${a.speed[0]}~${a.speed[1]}초</td>`).join('')}</tr>`;
  $('assume-table').innerHTML = `<p class="note">2030년 에이전트 보급 가정(소득 중간 기준)</p><table>${head}${rows}${speed}</table>`;
}

function buildLegend() {
  $('legend').innerHTML = AGENTS.map((a) => `<li><i style="background:${tierColor(a.id)}"></i>${a.label}</li>`).join('')
    + '<li><i style="background:var(--good)"></i>탑승</li><li><i style="background:var(--t-none);opacity:.35"></i>탈락</li>';
}

// ---------- life ----------
function makeLife(seed, meId) {
  const crowd = makePopulation(seed);
  const me = meId ?? Math.floor(mulberry32(seed + 1)() * APPLICANTS);
  return { seed, meId: me, crowd, tapSpeed: null, layout: null };
}

function born() {
  const seed = 1 + Math.floor(Math.random() * 999999);
  state.life = makeLife(seed);
  $('life').hidden = false;
  runLife();
  $('life').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

function setWorld(worldId) {
  state.world = worldId;
  syncWorldUi();
  if (state.life) {
    state.life.tapSpeed = null;
    runLife();
  }
  updateUrl();
}

function updateUrl() {
  const query = new URLSearchParams();
  if (state.world !== 'fcfs') query.set('w', state.world);
  if (state.life) query.set('life', `${state.life.seed}.${state.life.meId}`);
  const search = query.toString();
  history.replaceState(null, '', search ? `?${search}` : location.pathname);
}

function renderProfile(me) {
  const income = INCOME_BY_ID[me.income];
  const agent = AGENT_BY_ID[me.agent];
  $('profile-main').textContent = `${me.years}세, ${income.label}. ${me.reason} 때문에 부산에 가야 합니다.`;
  $('profile-agent').innerHTML = `<span class="tier-dot" style="background:${tierColor(me.agent)}"></span>쓰는 에이전트: <b>${agent.label}</b> — ${agent.desc}`;
}

// ---------- time scale ----------
const T_MIN = 0.001;
const T_MAX = 40;
const uOf = (t) => Math.min(1, Math.max(0, Math.log(t / T_MIN) / Math.log(T_MAX / T_MIN)));
const tOf = (u) => T_MIN * (T_MAX / T_MIN) ** u;
const clock = (t) => `07:00:${String(Math.floor(t)).padStart(2, '0')}.${String(Math.floor((t % 1) * 1000)).padStart(3, '0')}`;
const countUpTo = (sorted, t) => {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

// ---------- stage (canvas) ----------
const SEAT_COLS = 20;
const SEAT_ROWS = 5;
let colors = {};
const readColors = () => {
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  colors = {
    ink: v('--ink'), muted: v('--muted'), surface: v('--surface'), good: v('--good'), bad: v('--bad'), line: v('--line'),
    tier: Object.fromEntries(AGENTS.map((a) => [a.id, v(`--t-${a.id}`)])),
  };
};

function buildLayout() {
  const canvas = $('stage-canvas');
  const width = canvas.clientWidth || 343;
  const pad = 12;
  const cell = (width - pad * 2) / SEAT_COLS;
  const seatsTop = pad;
  const seatsBottom = seatsTop + cell * SEAT_ROWS;
  const crowdTop = seatsBottom + 34;
  const crowdHeight = 170;
  const height = crowdTop + crowdHeight + pad;
  const rand = mulberry32(state.life.seed + 3);
  const start = state.life.crowd.map(() => ({
    x: pad + 4 + rand() * (width - pad * 2 - 8),
    y: crowdTop + 4 + rand() * (crowdHeight - 8),
  }));
  const seat = (i) => ({
    x: pad + (i % SEAT_COLS) * cell + cell / 2,
    y: seatsTop + Math.floor(i / SEAT_COLS) * cell + cell / 2,
  });
  const dpr = window.devicePixelRatio || 1;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height, pad, cell, seatsTop, seatsBottom, crowdTop, crowdHeight, start, seat };
}

const ease = (x) => 1 - (1 - x) ** 3;
const lerp = (a, b, k) => a + (b - a) * k;

// Per-person motion plan for the replay, in u-units [0, 1]
function planMotion(result, world) {
  const { crowd, layout } = state.life;
  const winnerIndex = new Map(result.winners.map((id, i) => [id, i]));
  const rankOf = new Map();
  if (!world.timed) {
    const order = state.world === 'lottery'
      ? [...crowd].sort((a, b) => a.lotteryDraw - b.lotteryDraw)
      : [...crowd].sort((a, b) => a.id - b.id);
    order.forEach((p, i) => rankOf.set(p.id, i));
  }
  const hopper = { x: layout.width / 2, y: layout.seatsBottom + 17 };
  return crowd.map((person) => {
    const seatIdx = winnerIndex.get(person.id);
    const win = seatIdx !== undefined;
    const from = layout.start[person.id];
    if (world.timed) {
      const launch = uOf(person.speed);
      const dur = 0.07;
      const to = win ? layout.seat(seatIdx) : { x: lerp(from.x, hopper.x, 0.35), y: lerp(from.y, hopper.y, 0.45) };
      return { person, win, from, to, launch, dur, bounce: !win };
    }
    const launch = (rankOf.get(person.id) / APPLICANTS) * 0.5;
    const spread = { x: hopper.x + (from.x - layout.width / 2) * 0.25, y: hopper.y + (from.y - layout.crowdTop - layout.crowdHeight / 2) * 0.05 };
    return {
      person, win, from, launch, dur: 0.12, bounce: false,
      to: spread,
      second: win ? { at: 0.6 + (seatIdx / SEATS) * 0.3, dur: 0.08, to: layout.seat(seatIdx) } : null,
    };
  });
}

function positionAt(plan, u) {
  let { from, to } = plan;
  let k = (u - plan.launch) / plan.dur;
  if (k <= 0) return { x: from.x, y: from.y, state: 'wait' };
  if (plan.second && u >= plan.second.at) {
    const k2 = Math.min(1, (u - plan.second.at) / plan.second.dur);
    const e = ease(k2);
    return { x: lerp(to.x, plan.second.to.x, e), y: lerp(to.y, plan.second.to.y, e), state: k2 >= 1 ? 'seated' : 'fly' };
  }
  if (k >= 1) return { x: to.x, y: to.y, state: plan.win && !plan.second ? 'seated' : plan.bounce ? 'out' : 'held' };
  if (plan.bounce) {
    const b = Math.sin(k * Math.PI);
    return { x: lerp(from.x, to.x, b), y: lerp(from.y, to.y, b), state: 'fly' };
  }
  const e = ease(k);
  return { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e), state: 'fly' };
}

function drawStage(plans, u, { soldOut = null, t = null, world } = {}) {
  const { ctx, width, height, pad, cell, seatsTop, seatsBottom } = state.life.layout;
  const { meId } = state.life;
  ctx.clearRect(0, 0, width, height);

  // Seat grid
  for (let i = 0; i < SEATS; i += 1) {
    const x = pad + (i % SEAT_COLS) * cell;
    const y = seatsTop + Math.floor(i / SEAT_COLS) * cell;
    ctx.fillStyle = colors.surface;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, cell - 2, cell - 2, 3);
    ctx.fill();
  }
  ctx.fillStyle = colors.muted;
  ctx.font = '11px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('좌석 100', pad, seatsBottom + 14);
  ctx.textAlign = 'right';
  ctx.fillText(world.timed ? '신청자 1,000명' : '접수함', width - pad, seatsBottom + 14);

  // Crowd
  const r = cell * 0.3;
  let me = null;
  for (const plan of plans) {
    const pos = positionAt(plan, u);
    if (plan.person.id === meId) {
      me = { plan, pos };
      continue;
    }
    ctx.globalAlpha = pos.state === 'out' ? 0.25 : pos.state === 'held' ? 0.6 : 1;
    ctx.fillStyle = pos.state === 'seated' ? colors.good : colors.tier[plan.person.agent];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pos.state === 'seated' ? r * 1.15 : r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (me) {
    const { plan, pos } = me;
    ctx.fillStyle = pos.state === 'seated' ? colors.good : pos.state === 'out' ? colors.bad : colors.tier[plan.person.agent];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = colors.ink;
    ctx.font = 'bold 12px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('나', pos.x + r * 2.2 + 4, pos.y + 4);
  }

  // Sold-out stamp
  if (soldOut !== null && t !== null && t >= soldOut) {
    const age = Math.min(1, (uOf(t) - uOf(soldOut)) / 0.05);
    const scale = 1.6 - 0.6 * ease(age);
    ctx.save();
    ctx.translate(width / 2, seatsTop + (cell * SEAT_ROWS) / 2);
    ctx.rotate(-0.12);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = colors.bad;
    ctx.font = 'bold 30px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`매진 ${sec(soldOut)}`, 0, 0);
    ctx.restore();
  }
}

// ---------- phase A: the live window ----------
function showOverlay(text, { small = false, note = '', button = null, disabled = false, hot = false } = {}) {
  const overlay = $('overlay');
  const label = $('overlay-text');
  const press = $('press');
  overlay.hidden = false;
  label.textContent = text;
  label.classList.toggle('small', small);
  $('overlay-note').textContent = note;
  press.hidden = button === null;
  press.textContent = button ?? '';
  press.disabled = disabled;
  press.classList.toggle('hot', hot);
}
const hideOverlay = () => {
  $('overlay').hidden = true;
  $('press').classList.remove('hot');
};

function waitForPress(timeoutMs) {
  return new Promise((resolve) => {
    const press = $('press');
    const started = performance.now();
    let timer = 0;
    const done = (value) => {
      clearTimeout(timer);
      press.removeEventListener('click', onClick);
      resolve(value);
    };
    const onClick = () => done((performance.now() - started) / 1000);
    press.addEventListener('click', onClick);
    if (timeoutMs) timer = setTimeout(() => done(null), timeoutMs);
  });
}

async function liveWindow(run, me, world, prelim) {
  const sortedWinnerTimes = prelim.winners.map((id) => state.life.crowd[id].speed).sort((a, b) => a - b);
  const soldOut = world.timed ? soldOutAt(state.life.crowd, prelim.winners) : null;
  $('race-sub').textContent = '';

  if (!world.timed) {
    showOverlay(state.world === 'lottery' ? '추첨 신청' : '사유 심사 신청', {
      small: true, button: '신청', note: '서두를 필요 없습니다. 10분 동안 받습니다.',
    });
    await waitForPress(0);
    if (run !== state.run) return null;
    hideOverlay();
    $('race-sub').textContent = state.world === 'lottery' ? '접수 마감 · 추첨 중' : '접수 마감 · 심사 중';
    return null;
  }

  // Countdown
  for (const n of ['3', '2', '1']) {
    showOverlay(n, { note: '예매창이 열립니다' });
    await wait(650);
    if (run !== state.run) return null;
  }

  const human = me.agent === 'none';
  const openAt = performance.now();
  showOverlay('열림!', human
    ? { button: '예매', hot: true, note: '지금 누르세요' }
    : { button: '…', disabled: true, note: `${AGENT_BY_ID[me.agent].label}이(가) 대신 누릅니다` });

  // Real-time drain while the user reacts
  let raf = 0;
  const tick = () => {
    const t = (performance.now() - openAt) / 1000;
    $('clock').textContent = clock(t);
    const sold = countUpTo(sortedWinnerTimes, t);
    $('counter').textContent = SEATS - sold;
    if (soldOut !== null && t >= soldOut) {
      $('race-sub').textContent = `매진 ${sec(soldOut)}`;
      $('overlay-text').textContent = '매진';
      if (human) $('overlay-note').textContent = '그래도 눌러 보세요';
    } else if (state.world === 'dynamic') {
      $('race-sub').textContent = `지금 값 ${won(BASE_FARE * (1 + (3 * sold) / SEATS))}`;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  let tapSpeed = null;
  if (human) {
    tapSpeed = await waitForPress(8000);
    if (tapSpeed === null) tapSpeed = 8;
  } else {
    await wait(Math.max(500, Math.min(2500, me.speed * 1000)));
    $('overlay-note').textContent = `${sec(me.speed)}에 눌렀습니다`;
    await wait(700);
  }
  cancelAnimationFrame(raf);
  if (run !== state.run) return null;
  hideOverlay();
  return tapSpeed;
}

// ---------- phase B: slow-motion replay ----------
function replay(run, result, world, soldOut) {
  const plans = planMotion(result, world);
  const sortedWinnerTimes = result.winners.map((id) => state.life.crowd[id].speed).sort((a, b) => a - b);
  const sortedTimes = state.life.crowd.map((p) => p.speed).sort((a, b) => a - b);
  $('counter-label').textContent = world.timed ? '남은 좌석' : '접수';

  const frame = (u) => {
    if (world.timed) {
      const t = tOf(u);
      $('clock').textContent = clock(t);
      const sold = countUpTo(sortedWinnerTimes, t);
      $('counter').textContent = SEATS - sold;
      if (soldOut !== null && t >= soldOut) {
        $('race-sub').textContent = `매진. 1,000명 중 ${(APPLICANTS - countUpTo(sortedTimes, soldOut)).toLocaleString('ko-KR')}명은 매진 뒤에 도착했습니다.`;
      } else if (state.world === 'dynamic') {
        $('race-sub').textContent = `느리게 다시 보기 · 지금 값 ${won(BASE_FARE * (1 + (3 * sold) / SEATS))}`;
      } else {
        $('race-sub').textContent = '느리게 다시 보기';
      }
      drawStage(plans, u, { soldOut, t, world });
    } else {
      const received = Math.min(APPLICANTS, Math.floor((u / 0.5) * APPLICANTS));
      $('counter').textContent = received.toLocaleString('ko-KR');
      $('race-sub').textContent = u < 0.6 ? '접수 중' : state.world === 'lottery' ? '추첨 중' : '심사 중 · 긴급 사유부터';
      drawStage(plans, u, { world });
    }
  };

  return new Promise((resolve) => {
    if (reducedMotion) {
      frame(1);
      return resolve();
    }
    const duration = world.timed ? 5200 : 4200;
    const startAt = performance.now();
    const step = (now) => {
      if (run !== state.run) return resolve();
      const u = Math.min(1, (now - startAt) / duration);
      frame(u);
      if (u < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

function renderTiers(result) {
  const { crowd } = state.life;
  const winners = new Set(result.winners);
  const rows = AGENTS.map((a) => {
    const all = crowd.filter((p) => p.agent === a.id);
    const won = all.filter((p) => winners.has(p.id)).length;
    return { a, all: all.length, won };
  });
  const max = Math.max(...rows.map((r) => r.won), 1);
  $('tiers').innerHTML = rows.map((r) => `<div class="tier-row">
    <span class="bar-name"><i class="tier-dot" style="background:${tierColor(r.a.id)}"></i>${r.a.label}</span>
    <span class="bar-track"><span class="bar-fill" style="width:${(r.won / max) * 100}%;background:${tierColor(r.a.id)}"></span></span>
    <span class="bar-val">${r.won}/${r.all}</span></div>`).join('');
}

// ---------- main flow ----------
async function runLife() {
  state.run += 1;
  const run = state.run;
  const life = state.life;
  const world = WORLD_BY_ID[state.world];
  const baseMe = life.crowd[life.meId];

  renderProfile(baseMe);
  updateUrl();
  readColors();
  life.layout = buildLayout();
  $('verdict').hidden = true;
  $('odds').hidden = true;
  $('tiers').innerHTML = '';
  $('clock').textContent = clock(0);
  $('counter').textContent = world.timed ? SEATS : 0;
  $('counter-label').textContent = world.timed ? '남은 좌석' : '접수';

  // Everyone waits on the platform
  const prelim = allocate(state.world, life.crowd);
  drawStage(planMotion(prelim, world), 0, { world });

  let tapSpeed = life.tapSpeed;
  if (!reducedMotion) {
    tapSpeed = await liveWindow(run, baseMe, world, prelim);
    if (run !== state.run) return;
  }
  life.tapSpeed = tapSpeed;

  // A hand booker's real tap replaces the modelled reaction time
  const crowd = tapSpeed === null ? life.crowd : life.crowd.map((p) => (p.id === life.meId ? { ...p, speed: tapSpeed } : p));
  life.crowd = crowd;
  const me = crowd[life.meId];
  const result = allocate(state.world, crowd);
  const winners = new Set(result.winners);
  const soldOut = world.timed && result.winners.length === SEATS ? soldOutAt(crowd, result.winners) : null;

  await replay(run, result, world, soldOut);
  if (run !== state.run) return;
  renderTiers(result);
  showVerdict(me, result, winners, soldOut, tapSpeed !== null);
}

function verdictText(me, result, winners, soldOut, tapped) {
  const { crowd } = state.life;
  const arrived = tapped ? `당신은 ${sec(me.speed)} 만에 눌렀습니다` : `당신은 ${sec(me.speed)}에 도착했습니다`;
  if (winners.has(me.id)) {
    if (state.world === 'dynamic') return `탔습니다. ${won(result.prices[me.id])}을 냈습니다.`;
    if (state.world === 'quota' && me.agent === 'corporate') return '탔습니다. 여행사 몫 20석 덕분입니다.';
    return `탔습니다. ${arrived}.`;
  }
  switch (state.world) {
    case 'fcfs':
      return `매진은 ${sec(soldOut)}, ${arrived}.`;
    case 'dynamic': {
      if (soldOut !== null && me.speed > soldOut) return `매진은 ${sec(soldOut)}, ${arrived}.`;
      const sold = result.winners.filter((id) => crowd[id].speed < me.speed).length;
      return `당신이 낼 수 있는 돈은 ${won(willingness(me) * BASE_FARE)}, 도착했을 때 값은 ${won(BASE_FARE * (1 + (3 * sold) / SEATS))}이었습니다.`;
    }
    case 'lottery':
      return '추첨에서 떨어졌습니다. 1,000명 중 100명만 뽑힙니다.';
    case 'need':
      return me.need === 'urgent'
        ? '긴급 사유인데도 추첨에서 밀렸습니다. 긴급 신청자가 100명보다 많았습니다.'
        : '좌석은 모두 장례·면접·진료를 증명한 사람에게 갔습니다.';
    case 'quota': {
      const pool = me.agent === 'none' ? '직접 누른 사람 몫 50석' : me.agent === 'corporate' ? '여행사 몫 20석' : '에이전트 몫 30석';
      return `${pool} 안에 들지 못했습니다. ${arrived}.`;
    }
    default:
      return '';
  }
}

function showVerdict(me, result, winners, soldOut, tapped) {
  const ok = winners.has(me.id);
  const mark = $('mark');
  mark.textContent = ok ? '○' : '×';
  mark.className = `mark ${ok ? 'yes' : 'no'}`;
  $('verdict-text').textContent = verdictText(me, result, winners, soldOut, tapped);
  $('verdict').hidden = false;
  $('verdict').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  // Let the verdict paint before the Monte Carlo work
  setTimeout(renderOdds, 30);
}

// ---------- odds ----------
function barsHtml(rows, currentId, clickable) {
  const max = Math.max(...rows.map((r) => r.p), 0.01);
  return rows
    .map((r) => {
      const tag = clickable ? 'button' : 'div';
      const attrs = clickable ? ` type="button" data-world="${r.id}"` : '';
      const fill = r.color ? `background:${r.color};` : '';
      return `<${tag} class="bar${r.id === currentId ? ' current' : ''}"${attrs}>
        <span class="bar-name">${r.label}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${(r.p / max) * 100}%;${r.id === currentId ? '' : fill}"></span></span>
        <span class="bar-val">${pct(r.p)}</span></${tag}>`;
    })
    .join('');
}

function renderOdds() {
  const { crowd, meId } = state.life;
  const me = crowd[meId];
  const profile = profileOf(me);
  const world = WORLD_BY_ID[state.world];
  const p = estimate(profile, state.world);

  $('odds-label').textContent = `${AGE_BY_ID[me.age].label} · ${INCOME_BY_ID[me.income].label} · ${NEED_BY_ID[me.need].label} 사유 · ${AGENT_BY_ID[me.agent].label}인 사람이 ‘${world.name}’ 세상에서 탈 확률`;
  $('odds-value').textContent = pct(p);

  const mine = currentMine();
  const mineBox = $('odds-mine');
  mineBox.hidden = !mine;
  if (mine) {
    const mp = estimate({ ...mine, need: me.need }, state.world);
    mineBox.innerHTML = `실제 당신(${AGE_BY_ID[mine.age].label} · ${INCOME_BY_ID[mine.income].label} · ${AGENT_BY_ID[mine.agent].label})이 같은 이유로 예매했다면: <b>${pct(mp)}</b>`;
  }

  $('bars-agent').innerHTML = barsHtml(
    AGENTS.map((a) => ({ id: a.id, label: a.label, p: estimate({ ...profile, agent: a.id }, state.world), color: tierColor(a.id) })),
    me.agent,
    false,
  );
  $('bars-world').innerHTML = barsHtml(
    WORLDS.map((w) => ({ id: w.id, label: w.name, p: w.id === state.world ? p : estimate(profile, w.id) })),
    state.world,
    true,
  );
  $('odds').hidden = false;
}

$('bars-world').addEventListener('click', (event) => {
  const bar = event.target.closest('[data-world]');
  if (!bar) return;
  setWorld(bar.dataset.world);
  $('race').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
});

// ---------- share ----------
const toast = (text) => {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1600);
};

$('share').addEventListener('click', async () => {
  const url = location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: '오픈런의 민족, 누구의 좌석인가?', url });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('주소를 복사했습니다');
  } catch {
    toast(url);
  }
});

// ---------- boot ----------
$('born').addEventListener('click', born);
$('again').addEventListener('click', born);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);

buildWorldChips();
syncWorldUi();
buildMine();
buildAssumptions();
buildLegend();
readColors();

const lifeParam = params.get('life')?.match(/^(\d+)\.(\d+)$/);
if (lifeParam && Number(lifeParam[2]) < APPLICANTS) {
  state.life = makeLife(Number(lifeParam[1]), Number(lifeParam[2]));
  $('life').hidden = false;
  runLife();
}
