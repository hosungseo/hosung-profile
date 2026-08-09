---
title: "행정안전부 F, 12점 — 정부 사이트는 AI 에이전트에게 읽히는가"
date: "2026-08-09"
description: "19개 표준 143점 만점 스캐너로 정부 사이트 30곳을 매주 자동 채점한 결과"
draft: true
---

<!-- 예비글감 — 발행 전 draft: false로 변경 -->

**요지**: 직접 만든 agent-ready 스캐너(19개 표준·143점 만점)로 중앙부처 20 + 공공포털 4 + 광역 3 + 해외정부 3을 매주 자동 채점. 진단(스캐너)→처방(만점 데모 사이트)까지 혼자 완성한 before/after 구조.

**뼈대**
- 행안부 F(12/143) — 디지털정부 주무부처가 꼴찌권이라는 아이러니
- usa.gov(43)·gov.uk(42)·digital.gov(36)는 국내 상위권(기재부 89, 대통령실 84, 중기부 79)보다 오히려 낮다는 반전
- 전체 최고점: 서울특별시 C(90/143)
- GitHub Actions 주 1회 자동 랭킹 갱신 — 살아있는 리더보드
- 처방편: kgov-ready-demo — 19개 부처 사이트를 23개 에이전트 표준(llms.txt, mcp.json, JSON-LD, 마크다운 협상 등) 만점으로 "다시 지은" 시안

**근거**: `~/agent-ready-check/README.md` (2026-04-25 벤치마크), `~/kgov-ready-demo`, 라이브: agent-ready-check.vercel.app / kgov-ready-demo.vercel.app

**메모**: 공개OK (전부 공개 웹 스캔, 이미 라이브). AX 이론 시리즈의 실측편.
