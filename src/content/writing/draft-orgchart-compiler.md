---
title: "법령 문장은 사실상 프로그래밍 언어다 — 직제 컴파일러 제작기"
date: "2026-08-09"
description: "'장관 소속으로 A를 둔다'를 파싱해 조직도로 컴파일하기"
draft: true
---

<!-- 예비글감 — 발행 전 draft: false로 변경 -->

**요지**: 직제 설치 문형을 파싱해 편집 가능한 PPTX/SVG/JSON 조직도로 컴파일하는 도구 제작기. "행정의 언어가 이미 기계가독적 DSL이었다"는 발견.

**뼈대**
- "장관 소속으로 A를 둔다"류 설치 문형 파싱 → 조직도 자동 생성
- 법정 설치계선 vs 운영상 소관의 2층 분리 모델 — "발표용 그림을 만들면서 근거관계가 사라지지 않는다"
- 8개 레이아웃을 실제 배치해 채점하는 `--layout best`
- 개정 전후 자동 비교: 신설/폐지/이체/명칭변경 추정
- 중앙행정기관 취합본 66개 파일 195면과 대조 검증
- 별도 갈래: 개인 GitHub 오픈소스를 공공 GitLab(온AI, gitlab.aigov.go.kr)에 등록한 과정 — '공무원 개인 오픈소스의 제도권 진입기'

**근거**: `~/orgchart-generator/README.md`, `docs/drafting-rulebook.md`, `docs/ONAI-LAB-GITLAB.md`, 데모: hosungseo.github.io/korean-government-orgchart

**메모**: 공개OK. AX 이론(packet)의 구체 사례로 연결.
