# DESIGN.md — 서호성 프로필 사이트

Guided by [Impeccable](https://impeccable.style): distinctive type, tinted neutrals, no SaaS slop, hierarchy over decoration. (같은 원칙을 쓰는 저장소: gonpunclaw-population-decline-realestate)

## Direction

**저자 아카이브** — 종이 위의 큰 문장, 절제된 메타데이터, 홈에 한 번만 쓰는 짙은 명암 대비. 긴 한국어 산문 가독성이 항상 우선.

## Type

| Role | Family | Notes |
|------|--------|-------|
| Display / 제목 | **Fraunces** (+Pretendard 한글 폴백) | weight 540–560, tracking -0.02em |
| Body / UI | **Pretendard** | 본문 1.06rem, 행간 1.9 |
| Meta / 날짜·라벨 | **IBM Plex Mono** | 0.72rem, letter-spacing 0.04–0.08em |

## Color (always tinted — no pure black/gray)

| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#efe8db` | Page field |
| `--paper` | `#fbf6ec` | Surfaces (필요 시) |
| `--ink` | `#18231c` | Text (green-black) |
| `--muted` | `#5a635c` | Secondary text |
| `--line` | `rgba(24,35,28,.12)` | Hairlines |
| `--accent` | `#1b5c48` | Links, current nav, forest |
| `--accent-2` | `#a66b2b` | Blockquote rule, hover, copper |
| `--dark-bg` | `#18231c` | 홈 다크 밴드 (한 번만) |
| `--dark-cream` | `#f0e2c4` | 다크 밴드 라벨 |

## Layout

- 본문 40rem 읽기 폭, 홈·목록은 70rem
- 섹션 라벨: 모노 소문자 + 잉크색 2px 괘선
- 글 목록: 카드가 아니라 헤어라인 행 (제목 왼쪽 / 날짜 오른쪽)
- 작업 목록: 잉크 2px 괘선의 ruled columns

## Anti-patterns (reject)

- Inter / system-ui as brand face
- 카드 안 카드, 그림자, 글로우, 글래스모피즘
- Pure `#000` / `#666` / `#999`
- 다크 섹션 남발 (홈에 한 번)
- 본문 폭 확대·본문 글자 축소
