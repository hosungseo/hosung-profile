# DESIGN.md — 서호성 개인 인덱스

## Visual thesis

**Geist 기반의 개인 인덱스** — 첫 화면은 명함이나 대시보드가 아니라 저자 아카이브의 표지다.
`SEO HOSUNG` 워드마크와 정밀한 1px 가이드를 하나의 강한 시각 앵커로 쓰고, 이후 콘텐츠는
카드 없이 번호·제목·날짜가 정렬된 편집 목록으로 보여준다.

Vercel의 [Geist 소개](https://vercel.com/geist/introduction),
[타이포그래피](https://vercel.com/geist/typography),
[색상](https://vercel.com/geist/colors), [그리드](https://vercel.com/geist/grid)를 참고해
독립적으로 구현했다. Vercel의 컴포넌트나 화면을 복제한 것은 아니다.

## Content plan

- 홈 첫 화면: `SEO HOSUNG` 워드마크, 한 줄 정체성, 최근 글 진입점
- 최근 글: 최신 글 1편을 크게, 나머지 4편은 번호가 붙은 행으로 표시
- 주제: 지금 쓰는 질문 세 가지를 검은 반전 구역에 배치
- 단상: 날짜와 짧은 본문을 2열 기록 형태로 표시
- 하위 페이지: `01–05` 인덱스를 공유하되 글·단상·쓰레드·작업·소개 성격은 유지
- 긴 글: 44rem 읽기 폭, 큰 제목, 상단 2px 읽기 진행 표시

## Type

| 역할 | 서체 | 규칙 |
|---|---|---|
| Latin / 제목·UI | **Geist Sans Variable 1.7.2** | 100–900, 큰 제목은 -0.035~-0.085em |
| Korean / 본문·제목 | **Pretendard Variable** | 한글 폴백, 본문 1.05rem / 1.92 |
| 메타데이터 | **Geist Mono Variable 1.7.2** | 0.60–0.72rem, 날짜·번호에만 사용 |

Geist 폰트는 SIL Open Font License를 따르는 공식 `geist` 패키지의 고정 버전을 사용한다.

## Color

| 토큰 | 값 | 용도 |
|---|---|---|
| `--background` | `#ffffff` | 기본 배경 |
| `--surface` | `#fafafa` | 행 hover와 보조 표면 |
| `--foreground` | `#1d1d1f` | 본문 |
| `--foreground-strong` | `#000000` | 큰 제목·반전 구역·주 행동 |
| `--muted` | `#666666` | 설명과 보조 정보 |
| `--line` | `#eaeaea` | 1px 구조선 |
| `--accent` | `#0068d6` | 현재 위치·링크·진행 상태 |

파란색은 상태와 이동 가능성을 알리는 곳에만 쓰며 장식용 색면은 만들지 않는다.

## Layout and interaction

- 긴 글 44rem, 글 제목 영역 54rem, 목록·홈 80rem
- 홈 표지는 4열 가이드, 섹션은 소개 열 + 콘텐츠 열
- 페이지 제목은 큰 단어 하나와 우측 하단 엔트리 수로 구성
- 모든 아카이브는 카드가 아니라 헤어라인 행
- 모션은 워드마크 등장, 링크 화살표, 긴 글 진행 표시 세 가지로 제한
- `prefers-reduced-motion`, 키보드 포커스, 320px 최소 폭을 지원

## Reject

- 카드 안 카드, 대시보드형 첫 화면
- 그림자, 글로우, 유리 효과, 장식적 그라데이션
- 파란색의 장식적 남용
- 한국어 본문 폭 확대나 행간 축소
- 안내 없이 움직이는 반복 애니메이션
