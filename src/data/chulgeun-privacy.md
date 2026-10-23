# 출근연습 개인정보처리방침

**최종 업데이트: 2026-10-24**

출근연습은 신입 공무원이 업무 대화를 연습하는 크롬 확장 프로그램입니다. 사이드패널에서 AI가 맡은 상대와 대화하고, 코치 피드백과 다시 말하기, 실전 카드를 받습니다. 오픈소스이며 무료입니다.

## 수집하지 않습니다

출근연습 개발자는 **서버를 운영하지 않습니다.** 사용자의 대화, 계정 정보, 브라우징 기록을 받거나 저장하거나 판매하지 않습니다. 분석·추적 도구도 쓰지 않습니다. 출근연습은 사용자가 보고 있는 웹페이지의 내용을 읽지 않습니다.

## ChatGPT로 로그인

- 로그인은 OpenAI의 공개 로그인 방식(Sign in with ChatGPT)을 씁니다. 로그인이 끝나면 OpenAI가 내 컴퓨터 주소(`127.0.0.1`)로 돌려보내는데, 내 컴퓨터에서 기다리는 프로그램은 없습니다. 출근연습이 그 이동 한 번을 브라우저 안에서 확장의 로그인 완료 페이지로 돌립니다. 이 규칙은 로그인하는 동안에만 걸리고 다른 요청은 바꾸지 않습니다.
- 액세스·갱신·ID 토큰은 **이 기기의 크롬 확장 저장소(`chrome.storage.local`)에만** 저장되고 OpenAI에만 전송됩니다. 동기화 저장소에는 넣지 않으며, 화면이나 로그, 주소창에 노출하지 않습니다.
- 계정 화면에 보여 주기 위해 ChatGPT 계정의 표시 이름만 기기에 저장합니다. 이메일은 저장하지 않습니다.
- 로그아웃하면 기기의 인증 정보를 지우고 OpenAI에 연결 해제를 요청합니다.
- AI 사용 요청은 내 ChatGPT 구독 사용량에 포함됩니다.

## AI로 보내는 내용

연습을 할 때만, 그 기능에 필요한 내용이 **내 브라우저에서 OpenAI Responses API로 바로** 전송됩니다. 요청은 `store: false`로 보냅니다.

- 역할 대화: 고른 상황의 설정과 지금까지의 대화
- 코치 피드백: 상황 설정과 대화 전문
- 다시 말하기: 상황 설정, 고른 원래 문장, 고친 문장
- 실전 카드: 상황 설정, 내가 한 발언, 코치 피드백 결과

이 내용은 [OpenAI 개인정보처리방침](https://openai.com/policies/privacy-policy)에 따라 처리됩니다. 연습 화면에는 실제 이름, 연락처, 기관 내부 정보 같은 개인정보를 쓰지 말라는 안내가 있습니다.

## 데모와 개발용 연결

- 데모 모드는 기기 안의 예시 응답만 씁니다. 아무것도 전송하지 않으며 화면에 "데모 · 실제 인증 아님"이 항상 보입니다.
- 스토어에 올린 빌드에는 개발용 API 연결 기능이 없습니다. 소스에서 직접 개발용으로 빌드한 경우에만 데모 모드에 "개발용 API 연결"이 나타나며, 그때는 사용자가 입력한 주소로 연습 내용이 전송됩니다.

## 기기에 저장하는 것

- 연습 기록은 이 기기에만 저장됩니다. 저장하지 않은 연습은 마지막 활동 후 24시간까지, "이 기기에 30일 저장"을 고른 연습은 30일까지 보관한 뒤 지웁니다.
- 기본 설정에서는 로그아웃할 때 저장한 연습도 함께 지웁니다. "이력·설정"에서 전체 삭제할 수 있습니다.
- 설정값(화면 안내 확인 여부 등)도 이 기기에만 저장합니다.

## 브라우저 에이전트 도구

"이력·설정"에서 브라우저 에이전트 도구를 켜면, 사이드패널 안에서 브라우저 에이전트가 화면 이동이나 상황 선택 같은 기능을 부를 수 있습니다. 기본값은 꺼짐입니다. 연습 발언, 로그인, 동의, 삭제처럼 사람만 해야 하는 일은 에이전트에게 열지 않습니다. 에이전트에게는 토큰이나 계정 식별자를 주지 않습니다.

## 변경

이 방침이 바뀌면 위의 최종 업데이트 날짜를 고칩니다.

## 문의

저장소의 이슈 게시판으로 문의해 주세요.

---

# Chulgeun Yeonseup (출근연습) Privacy Policy

**Last updated: 2026-10-24**

Chulgeun Yeonseup is an open-source Chrome extension where new Korean public officials practice workplace conversations with an AI counterpart in the side panel, then get coach feedback, a one-sentence retry, and a practice card.

**No collection.** The developer runs no server and does not receive, store, or sell your conversations, account data, or browsing activity. There is no analytics or tracking. The extension does not read the content of web pages you visit.

**Sign in with ChatGPT.** Sign-in uses OpenAI's public Sign in with ChatGPT flow. OpenAI returns to a loopback address (`127.0.0.1`); nothing listens on your computer. While sign-in is in progress, a session rule sends that one navigation to the extension's own callback page; no other requests are changed. Access, refresh, and ID tokens are stored only in this device's local extension storage (`chrome.storage.local`, never sync) and are sent only to OpenAI. Only the account's display name is kept on this device, to show in the account screen; the email is not stored. Signing out deletes them and asks OpenAI to revoke access. Requests count toward your ChatGPT plan.

**Content sent to OpenAI.** Only when you practice, the content the feature needs (scenario setup, the conversation, the sentence you revise) goes directly from your browser to OpenAI's Responses API with `store: false`, under [OpenAI's privacy policy](https://openai.com/policies/privacy-policy).

**Demo and developer endpoint.** Demo mode uses on-device sample replies and sends nothing; it is always labeled. The store build has no developer endpoint. Only a build made from source with the developer flag shows "개발용 API 연결" in demo mode, and then practice content goes to the endpoint you enter.

**Stored on this device.** Unsaved practices are deleted 24 hours after last activity; practices you save are kept for 30 days. By default, signing out deletes saved practices too. You can delete everything in Settings.

**Browser agent tools.** Off by default. When you turn them on, a browser agent can call navigation-type actions in the side panel. Practice input, sign-in, consent, and deletion stay human-only. Agents never receive tokens or account identifiers.

**Contact.** Please open an issue in the repository.
