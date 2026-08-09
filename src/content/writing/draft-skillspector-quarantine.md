---
title: "내 에이전트의 스킬을 보안 스캔했더니, 내가 만든 스킬이 격리됐다"
date: "2026-08-09"
description: "스킬 공급망 보안을 이론이 아니라 내 머신에서 직접 겪은 사건으로"
draft: true
---

<!-- 예비글감 — 발행 전 draft: false로 변경 -->

**요지**: 에이전트 스킬 52개를 SkillSpector로 전수 스캔했더니 자체 제작 스킬이 위험점수 75/100 HIGH "DO_NOT_INSTALL" 판정을 받아 실제로 격리됐다.

**뼈대**
- 배경 통계: AI 에이전트 스킬의 26.1%가 취약, 5.2%는 악성 의심 (64개 취약패턴·16개 카테고리)
- 52건 스캔 결과 45 OK / 7 FAIL — 그중 내가 만든 autoreview 스킬이 격리 대상
- 걸린 이유: `subprocess.Popen(shell=True)` (confidence 0.8), 테스트 하네스의 `rm -rf` (confidence 0.85)
- 사실상 오탐 경계 — 그래서 질문이 생긴다: 보안 스캐너를 어디까지 믿을 것인가, 그래도 격리부터 하는 게 맞는가
- 공무원의 '사전검사·격리·승인' 감각과의 자연스러운 연결

**근거**: `~/SkillSpector/README.md`, `~/skillspector-reports/all/` (스캔 결과), `~/skillspector-quarantine/` (격리 스냅샷)

**메모**: 공개OK (오픈소스·자작 스킬, 비밀정보 없음).
