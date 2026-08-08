# 호성 개인 프로필 사이트 — 설계 문서

날짜: 2026-08-09
상태: 사용자 승인 완료

## 목적

AI에 대한 생각을 긴 글로 올리는 개인 사이트. 쓰레드(Threads)는 짧은 단상용 채널이고,
이 사이트는 긴 글이 중심이다. 단상과 포트폴리오도 함께 담는다.

## 기술 스택

- **Astro** (정적 사이트 생성기) — 마크다운 기반 콘텐츠 관리, 빌드 결과물은 순수 정적 사이트
- 배포: **Vercel** (GitHub 연동 자동 배포)
- 스타일: 프레임워크 없이 전역 CSS (미니멀이므로 Tailwind 불필요)
- 폰트: Pretendard (한글 최적화, CDN)

## 페이지 구조

| 경로 | 내용 |
|---|---|
| `/` | 짧은 자기소개 + 최근 긴 글 + 최근 단상 |
| `/writing` | 긴 글 목록 (날짜순) |
| `/writing/[slug]` | 글 본문 — 긴 글 읽기 최적화 타이포그래피 |
| `/notes` | 단상 스트림 — 제목 없이 날짜 + 본문 타임라인 |
| `/threads` | Threads 아카이브 — Buffer 동기화 JSON을 시간순으로 표시 |
| `/work` | 포트폴리오 프로젝트 카드 목록 |
| `/about` | 소개 + SNS 링크 (쓰레드 등) |
| `/rss.xml` | 긴 글 RSS 피드 |

## 콘텐츠 관리

Astro Content Collections 사용. 글 하나 = 마크다운 파일 하나.

- `src/content/writing/*.md` — frontmatter: `title`, `date`, `description`(선택), `draft`(선택)
- `src/content/notes/*.md` — frontmatter: `date` (제목 없음)
- `src/content/work/*.md` — frontmatter: `title`, `description`, `url`(선택), `order`
- `src/data/threads.json` — Threads 아카이브 (Buffer MCP 동기화). `npm run sync:threads`로 갱신

새 글은 파일을 추가하고 git push 하면 Vercel이 자동 배포.

## 디자인

- 미니멀 텍스트 중심: 밝은 배경, 본문 폭 65자(약 42rem), 넉넉한 행간(1.8)
- 상단에 이름 + 간단한 내비게이션 (글 / 단상 / 작업 / 소개)
- 장식 최소화 — 긴 글 가독성이 최우선
- 반응형 (모바일에서도 읽기 편하게)

## 범위 제외 (YAGNI)

- 댓글, 검색, 태그, 다크모드 토글, 조회수 — 필요해지면 나중에 추가
