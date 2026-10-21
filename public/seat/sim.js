// Pure simulation: 2030 KTX holiday booking, 1,000 applicants for 100 seats.
// Same seed + same inputs always produce the same result.

export const SEATS = 100;
export const APPLICANTS = 1000;
export const BASE_FARE = 59800;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const AGES = [
  { id: 'young', label: '20·30대', share: 0.35, years: [20, 39], humanFactor: 0.7 },
  { id: 'middle', label: '40·50대', share: 0.35, years: [40, 59], humanFactor: 1 },
  { id: 'senior', label: '60대', share: 0.18, years: [60, 69], humanFactor: 1.5 },
  { id: 'elder', label: '70대 이상', share: 0.12, years: [70, 86], humanFactor: 2.5 },
];

export const INCOMES = [
  { id: 'low', label: '소득 하위 30%', short: '하위', share: 0.3, wtp: 1.2 },
  { id: 'mid', label: '소득 중간', short: '중간', share: 0.5, wtp: 2 },
  { id: 'high', label: '소득 상위 20%', short: '상위', share: 0.2, wtp: 4 },
];

export const NEEDS = [
  { id: 'urgent', label: '긴급', share: 0.2, wtp: 1.5, reasons: ['장례식', '취업 면접', '병원 진료'] },
  { id: 'normal', label: '보통', share: 0.5, wtp: 1, reasons: ['명절 귀성', '출장'] },
  { id: 'leisure', label: '여가', share: 0.3, wtp: 0.7, reasons: ['여행'] },
];

// Seconds from booking open to the moment the request lands (log-uniform range)
export const AGENTS = [
  { id: 'none', label: '직접 누름', desc: '손가락과 새로고침', speed: [1.5, 15] },
  { id: 'free', label: '무료 AI 비서', desc: '휴대폰 기본 비서. 대기열을 수백만 명과 나눠 쓴다', speed: [0.5, 3] },
  { id: 'paid', label: '유료 에이전트', desc: '월 구독. 오픈 순간 자동 접속', speed: [0.05, 0.5] },
  { id: 'premium', label: '최상위 에이전트', desc: '전용 서버와 여러 계정. 비싸다', speed: [0.005, 0.05] },
  { id: 'corporate', label: '여행사 대행', desc: '기업이 먼저 잡아 둔 물량을 웃돈 받고 판다', speed: [0.001, 0.01] },
];

// 2030 assumption: agent mix by age, in AGENTS order
const AGENT_MIX = {
  young: [0.15, 0.47, 0.32, 0.06, 0.03],
  middle: [0.25, 0.42, 0.27, 0.06, 0.03],
  senior: [0.5, 0.36, 0.12, 0.02, 0.02],
  elder: [0.8, 0.17, 0.03, 0, 0.01],
};
// Income tilts the mix: the rich buy faster agents
const INCOME_TILT = {
  low: [1.3, 1.1, 0.5, 0.2, 0.3],
  mid: [1, 1, 1, 1, 1],
  high: [0.6, 0.8, 1.5, 2.5, 2],
};

const byId = (list) => Object.fromEntries(list.map((item) => [item.id, item]));
export const AGE_BY_ID = byId(AGES);
export const INCOME_BY_ID = byId(INCOMES);
export const NEED_BY_ID = byId(NEEDS);
export const AGENT_BY_ID = byId(AGENTS);

export function agentMix(age, income) {
  const weights = AGENT_MIX[age].map((w, i) => w * INCOME_TILT[income][i]);
  const total = weights.reduce((sum, w) => sum + w, 0);
  return weights.map((w) => w / total);
}

const pick = (r, list, weights = list.map((item) => item.share)) => {
  let acc = 0;
  for (let i = 0; i < list.length; i += 1) {
    acc += weights[i];
    if (r < acc) return list[i];
  }
  return list[list.length - 1];
};

const logBetween = ([lo, hi], r) => lo * (hi / lo) ** r;

// Always consumes the same number of draws so overrides never shift later people.
export function makePerson(rand, id, overrides = {}) {
  const draws = Array.from({ length: 8 }, rand);
  const age = overrides.age ?? pick(draws[0], AGES).id;
  const income = overrides.income ?? pick(draws[1], INCOMES).id;
  const need = overrides.need ?? pick(draws[2], NEEDS).id;
  const agent = overrides.agent ?? pick(draws[3], AGENTS, agentMix(age, income)).id;
  const ageRange = AGE_BY_ID[age].years;
  const reasons = NEED_BY_ID[need].reasons;
  const raw = logBetween(AGENT_BY_ID[agent].speed, draws[4]);
  return {
    id,
    age,
    income,
    need,
    agent,
    years: ageRange[0] + Math.floor(draws[5] * (ageRange[1] - ageRange[0] + 1)),
    reason: overrides.reason ?? reasons[Math.floor(draws[6] * reasons.length)],
    speed: agent === 'none' ? raw * AGE_BY_ID[age].humanFactor : raw,
    lotteryDraw: draws[7],
  };
}

export function makePopulation(seed, n = APPLICANTS) {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, (_, id) => makePerson(rand, id));
}

export const willingness = (person) => INCOME_BY_ID[person.income].wtp * NEED_BY_ID[person.need].wtp;

const bySpeed = (a, b) => a.speed - b.speed;
const byLottery = (a, b) => a.lotteryDraw - b.lotteryDraw;
const ids = (list) => list.map((person) => person.id);
const NEED_RANK = { urgent: 0, normal: 1, leisure: 2 };

export const WORLDS = [
  { id: 'fcfs', name: '선착순', cost: '에이전트 등급', timed: true, desc: '2030년에도 지금 방식 그대로. 먼저 잡는 쪽이 탄다.' },
  { id: 'lottery', name: '추첨제', cost: '운', timed: false, desc: '10분 동안 신청을 받고 무작위로 100명을 뽑는다.' },
  { id: 'dynamic', name: '동적 가격', cost: '돈', timed: true, desc: '좌석이 팔릴수록 값이 오른다. 마지막 좌석은 4배.' },
  { id: 'need', name: '사유 심사', cost: '사생활', timed: false, desc: '장례·면접·진료를 증명한 사람이 먼저. 나머지는 추첨.' },
  { id: 'quota', name: '할당제', cost: '칸막이', timed: true, desc: '여행사 20 · 에이전트 30 · 직접 누른 사람 50석을 따로 둔다.' },
];
export const WORLD_BY_ID = byId(WORLDS);

const ALLOCATORS = {
  fcfs: (crowd, seats) => ({ winners: ids([...crowd].sort(bySpeed).slice(0, seats)) }),

  lottery: (crowd, seats) => ({ winners: ids([...crowd].sort(byLottery).slice(0, seats)) }),

  dynamic: (crowd, seats) => {
    const winners = [];
    const prices = {};
    for (const person of [...crowd].sort(bySpeed)) {
      if (winners.length >= seats) break;
      const price = BASE_FARE * (1 + (3 * winners.length) / seats);
      if (willingness(person) * BASE_FARE >= price) {
        winners.push(person.id);
        prices[person.id] = Math.round(price);
      }
    }
    return { winners, prices };
  },

  need: (crowd, seats) => ({
    winners: ids(
      [...crowd].sort((a, b) => NEED_RANK[a.need] - NEED_RANK[b.need] || byLottery(a, b)).slice(0, seats),
    ),
  }),

  quota: (crowd, seats) => {
    const sorted = [...crowd].sort(bySpeed);
    const taken = new Set();
    const fill = (predicate, n) => {
      for (const person of sorted) {
        if (n <= 0) break;
        if (!taken.has(person.id) && predicate(person)) {
          taken.add(person.id);
          n -= 1;
        }
      }
    };
    fill((person) => person.agent === 'corporate', Math.round(seats * 0.2));
    fill((person) => ['free', 'paid', 'premium'].includes(person.agent), Math.round(seats * 0.3));
    fill((person) => person.agent === 'none', seats - taken.size);
    // Pools that run short fall back to whoever is fastest
    fill(() => true, seats - taken.size);
    return { winners: [...taken] };
  },
};

export function allocate(worldId, crowd, seats = SEATS) {
  const allocator = ALLOCATORS[worldId];
  if (!allocator) throw new Error(`Unknown world: ${worldId}`);
  return allocator(crowd, seats);
}

// Time the last seat was taken (speed-based worlds only)
export function soldOutAt(crowd, winners) {
  return Math.max(...winners.map((id) => crowd[id].speed));
}

// Monte Carlo: inject one person with a fixed profile into many random crowds.
const populationCache = new Map();
const population = (seed) => {
  if (!populationCache.has(seed)) populationCache.set(seed, makePopulation(seed, APPLICANTS - 1));
  return populationCache.get(seed);
};

export function estimate(profile, worldId, runs = 120) {
  let wins = 0;
  for (let r = 0; r < runs; r += 1) {
    const me = makePerson(mulberry32(90001 + r), APPLICANTS - 1, profile);
    const crowd = [...population(1000 + r), me];
    if (allocate(worldId, crowd).winners.includes(me.id)) wins += 1;
  }
  return wins / runs;
}

export const profileOf = (person) => ({ age: person.age, income: person.income, need: person.need, agent: person.agent });
