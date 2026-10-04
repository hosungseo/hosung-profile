export const SITE_TITLE = '서호성';
export const SITE_DESCRIPTION = 'AI에 대한 생각을 길게 씁니다.';

export const THREADS_URL = 'https://www.threads.com/@gongpenclaw';
export const CLOUDFLARE_WALLET_URL = 'https://seohosung.cloudflare.pay/';

export const SOCIAL_LINKS = [
  { label: 'Threads', url: THREADS_URL },
  { label: 'Substack', url: 'https://gongpenclaw.substack.com' },
  { label: 'GitHub', url: 'https://github.com/hosungseo' },
  { label: 'Cloudflare Wallet', url: CLOUDFLARE_WALLET_URL },
  { label: 'Email', url: 'mailto:ghtjd10855@gmail.com' },
];

// Sidebar groups of the workspace shell. `note` is the one-line description shown on the home tools list.
export const NAV_GROUPS = [
  {
    key: 'write',
    label: '쓰기',
    items: [
      { href: '/writing', label: '글' },
      { href: '/notes', label: '단상' },
      { href: '/threads', label: '쓰레드' },
    ],
  },
  {
    key: 'work',
    label: '작업',
    items: [
      { href: '/first/', label: '먼저 챙김', note: '신청주의 극복 이행 점검판 — 정부24 서비스 9,934건을 데이터·법·위탁으로 전수 분석' },
      { href: '/facts/', label: '팩트풀니스', note: '데이터로 보는 대한민국 100장' },
      { href: '/supply/', label: '공급상황판', note: '부동산 공급 대책의 진행 경과와 맡은 곳' },
      { href: '/atlas/', label: '특공대', note: '특례에 맞는 공공데이터 — 규제특례·승인과제·창업지원의 관계망' },
      { href: 'https://jiphaeng2.seohosung.com', label: '집행대장', note: '전국 지방정부 예산 집행 상황판, 매일 갱신' },
      { href: 'https://changup.seohosung.com', label: '창업대장', note: '중앙·지방 창업지원 사업을 지역·유형·시기별로' },
      { href: '/press/', label: '보도자료', note: '국무총리 주재 AI 행정혁신 간담회 발표 2회' },
      { href: '/work', label: '모든 작업' },
    ],
  },
  {
    key: 'me',
    label: '사람',
    items: [{ href: '/about', label: '소개' }],
  },
];
