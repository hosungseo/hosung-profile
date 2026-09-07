# 호성 프로필 사이트

AI에 대한 생각을 긴 글로 쓰는 개인 사이트. Astro로 만들었습니다.

## 글 쓰는 법

글 하나 = 마크다운 파일 하나. 파일을 추가하고 push하면 Vercel이 자동 배포합니다.

### 긴 글 — `src/content/writing/제목-슬러그.md`

```markdown
---
title: 글 제목
date: 2026-08-09
description: 목록에 보이는 한 줄 요약 (선택)
---

본문을 마크다운으로 씁니다.
```

파일 이름이 URL이 됩니다: `my-post.md` → `/writing/my-post`.
`draft: true`를 넣으면 목록·RSS에서 빠집니다.

### KakaoWiki에서 발전시킨 글

카카오톡 기반 글감은 이 저장소에서 직접 생성하지 않습니다. 비공개 원문·근거 계보·검증 전
원고는 모두 `~/kakao-wiki/out/publishing/`에만 두고, 공식·1차 자료 사실확인과 사람의 개인정보·
직접인용·반론·문체·저작권 검토가 끝난 원고만 이 저장소에 `draft: true`로 스테이징합니다.

`npm run build`는 `check:privacy`를 먼저 실행합니다. `kw-*`, `room-*`, 계보 필드, 로컬 경로,
익명화 자리표시자 같은 비공개 표식이 글 폴더에 들어오면 빌드를 중단합니다. 전체 승인 절차는
`~/kakao-wiki/ARTICLE-PIPELINE.md`에 있습니다.

### 브런치 글 아카이브

공픈클로 브런치의 공개 글과 이미지를 로컬 콘텐츠로 동기화합니다.

```bash
npm run sync:brunch
```

가져온 글은 `src/content/writing/brunch-글번호.md`, 이미지는
`public/images/brunch/글번호/`에 저장됩니다. 기존 파일은 최신 공개 원문으로 갱신되며,
직접 작성한 다른 글은 건드리지 않습니다.

### 서브스택 글 아카이브

공픈클로 서브스택(gongpenclaw.substack.com)의 공개 글을 로컬 콘텐츠로 동기화합니다.

```bash
npm run sync:substack
```

가져온 글은 `src/content/writing/substack-슬러그.md`에 저장되며, 목록·글 페이지에
"서브스택 아카이브" 표시와 원문 링크가 함께 붙습니다. 기존 파일은 최신 공개 원문으로
갱신되며, 직접 작성한 다른 글은 건드리지 않습니다.

### PGR21 글 아카이브

PGR21 자유게시판에 jarvis 계정으로 쓴 글을 보관합니다. ppt21.com은 안티봇
챌린지(Anubis) 뒤에 있어 자동 수집이 안 되므로, 실제 브라우저에서 글 JSON을
추출한 뒤 변환합니다 (`scripts/import-pgr.mjs` 상단 주석 참고).

```bash
node scripts/import-pgr.mjs 106965 106786 …
```

가져온 글은 `src/content/writing/pgr-글번호.md`에 저장됩니다.

### 쓰레드 아카이브 — `src/data/threads.json` → `/threads`

Threads(@gongpenclaw) 글을 Buffer를 통해 가져와 사이트에 시간순으로 보관합니다.

```bash
BUFFER_API_TOKEN=… npm run sync:threads
```

- 로컬: 위 명령으로 `src/data/threads.json` 갱신 후 push
- 자동: GitHub Actions가 **매일 07:00 KST**에 동기화 → 변경 있으면 commit/push → Vercel 배포
- 수동 실행: GitHub → Actions → **Sync Threads archive** → Run workflow

저장소 시크릿 `BUFFER_API_TOKEN`이 필요합니다 (Buffer API 키 또는 MCP 토큰).

### 단상 — `src/content/notes/2026-08-09-아무이름.md`

```markdown
---
date: 2026-08-09
---

짧은 생각. 제목 없이 본문만.
```

### 포트폴리오 — `src/content/work/프로젝트.md`

```markdown
---
title: 프로젝트 이름
description: 한 줄 설명
url: https://example.com
order: 1
---
```

## 개발

### 아틀라스 메뉴

`/atlas/`는 지역별 규제특례·공공데이터·창업지원 연결을 탐색하는 독립 실행 화면입니다. 상단·하단 메뉴와 `/work`에서 연결합니다. 기존 글·단상·쓰레드 게시판은 유지합니다.

- 화면: `src/pages/atlas.astro`, 기능·스타일: `src/atlas/`.
- 공개자료: `public/atlas/assets/`의 5개 목록·지도 파일. Three.js와 Pretendard 이용허락은 `public/atlas/licenses/`에 둡니다.
- 원본 아틀라스를 갱신할 때 `node scripts/import-atlas.mjs /path/to/atlas-project`로 실행 파일만 가져옵니다. 폴더 전체를 공개 디렉터리에 복사하지 않습니다.
- 기획안·작업 기록·QA 예시·사용자가 작성한 수요는 배포 대상이 아닙니다. `npm run check:atlas`가 파일 허용 목록과 비공개 경로 표식을 검사합니다.
- ‘내 데이터 묶음’은 방문자의 브라우저에만 저장됩니다. 기관 접수·서버 저장·기기간 동기화는 하지 않습니다.
- `/atlas`와 `/atlas/` 어느 주소로 들어와도 자원이 같은 경로에서 로드되도록 기준 경로를 지정했습니다. Astro가 앱 스크립트·스타일·글꼴을 빌드하므로 원본 `node_modules`는 공개하지 않습니다.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 정적 빌드 → dist/
```

## 배포 (Vercel)

1. GitHub에 저장소를 만들고 push
2. [vercel.com](https://vercel.com)에서 New Project → 저장소 선택 → Deploy (Astro 자동 감지)
3. 배포 후 `astro.config.mjs`의 `site` 값을 실제 도메인으로 변경

## 설정

- 이름·소개·SNS 링크: `src/consts.ts` (쓰레드 핸들 교체 필요)
- 소개 페이지: `src/pages/about.astro`
