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
