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
      { href: '/first/', label: '먼저 챙김', work: 'first-serve', note: '신청주의 극복 이행 점검판 — 정부24 서비스 9,934건을 데이터·법·위탁으로 전수 분석' },
      { href: '/facts/', label: '팩트풀니스', work: 'facts', note: '데이터로 보는 대한민국 100장' },
      { href: '/supply/', label: '공급상황판', work: 'supply', note: '부동산 공급 대책의 진행 경과와 맡은 곳' },
      { href: '/atlas/', label: '특공대', work: 'atlas', note: '특례에 맞는 공공데이터 — 규제특례·승인과제·창업지원의 관계망' },
      { href: 'https://jiphaeng2.seohosung.com', label: '집행대장', work: 'jiphaeng-daejang', note: '전국 지방정부 예산 집행 상황판, 매일 갱신' },
      { href: 'https://changup.seohosung.com', label: '창업대장', work: 'changup-daejang', note: '중앙·지방 창업지원 사업을 지역·유형·시기별로' },
      { href: 'https://gonpunclaw-policymap.vercel.app', label: '폴리시맵', work: 'policymap', note: '주소 엑셀 한 장으로 공개 정책지도 — 공유·임베드·공개 API·검토 링크' },
      { href: 'https://policy-preview.vercel.app', label: '정책 미리듣기', work: 'policy-preview', note: '정책안을 합성 국민 패널에게 먼저 들어 보는 의견수렴 설계 도구 — 부동산 대책 100만 명 지도' },
      { href: '/signal/', label: 'SIGNAL', work: 'signal', note: '위기경보 의사결정 보좌 — 상황보고·재난문자를 다섯 판단으로 병렬 추적하는 상황판(훈련판 공개)' },
      { href: 'http://127.0.0.1:3048/sms-board.html', label: '문자 상황판', note: 'SIGNAL 재난문자 → 가까운 CCTV 4화면. 맥미니 로컬 서버(3048)가 켜져 있을 때만 열림' },
      { href: '/work#minwon-reform', label: '민원을 제도로', work: 'minwon-reform', note: '민원 한 건을 법령·조례·지침 조문과 권익위 결정례까지 끌어내는 의견서 — 시제품(로컬)' },
      { href: '/press/', label: '보도자료', work: 'pm-roundtable', note: '국무총리 주재 AI 행정혁신 간담회 발표 2회' },
      { href: '/work', label: '모든 작업' },
    ],
  },
  {
    key: 'me',
    label: '사람',
    items: [{ href: '/about', label: '소개' }],
  },
];
