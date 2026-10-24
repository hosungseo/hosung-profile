# 출근연습 개인정보처리방침

**최종 업데이트: 2026-10-24 (5판)**

출근연습은 신입 공무원이 업무 대화를 연습하는 크롬 확장 프로그램입니다. 사이드패널에서 AI가 맡은 상대와 대화하고, 코치 피드백과 다시 말하기, 실전 카드를 받습니다. 오픈소스이며 무료입니다.

## 수집하지 않습니다

출근연습 개발자는 **서버를 운영하지 않습니다.** 사용자의 대화, 계정 정보, 브라우징 기록을 받거나 저장하거나 판매하지 않습니다. 분석·추적 도구도 쓰지 않습니다. 출근연습은 사용자가 보고 있는 웹페이지의 내용을 읽지 않습니다.

## ChatGPT로 로그인

- 로그인은 OpenAI의 공개 로그인 방식(Sign in with ChatGPT)을 씁니다. 로그인이 끝나면 OpenAI가 내 컴퓨터 주소(`127.0.0.1`)로 돌려보내는데, 내 컴퓨터에서 기다리는 프로그램은 없습니다. 출근연습이 그 이동 한 번을 브라우저 안에서 확장의 로그인 완료 페이지로 돌립니다. 이 규칙은 로그인하는 동안에만 걸리고 다른 요청은 바꾸지 않습니다.
- 액세스 토큰과 갱신 토큰은 **이 기기의 크롬 확장 저장소(`chrome.storage.local`)에만** 저장되고 OpenAI에만 전송됩니다. 동기화 저장소에는 넣지 않으며, 화면이나 로그, 주소창에 노출하지 않습니다. ID 토큰은 로그인할 때 검증만 하고 저장하지 않습니다.
- 함께 저장하는 계정 정보는 OpenAI가 발급한 앱 등록 번호, 발급자 주소, 계정 고유번호(sub)와 그 해시값(기기 안에서 연습 기록을 계정별로 나누는 데 씀)입니다. 이름과 이메일은 저장하지 않습니다.
- 로그인 진행 중 정보(state, PKCE 값, 콜백 주소)는 브라우저를 닫으면 사라지는 세션 저장소에 두고, 10분이 지나면 폐기합니다.
- 로그아웃하면 토큰과 계정 고유번호를 지우고 OpenAI에 연결 해제를 요청합니다. 요청이 실패해도 기기의 토큰은 지웁니다. 앱 등록 번호는 다음 로그인을 위해 남습니다.
- AI 사용 요청은 내 ChatGPT 구독 사용량에 포함됩니다.

## AI로 보내는 내용

연습을 할 때만, 그 기능에 필요한 내용이 **내 브라우저에서 OpenAI Responses API로 바로** 전송됩니다. 요청은 `store: false`로 보냅니다.

- 말 한 줄 읽어 보기: 붙여넣은 말, 상대 종류, 선택 입력한 상황 한 줄(결과와 함께 저장하지 않음)
- 내 상황으로 연습: 쓴 상황 설명, 상대 역할, 선택 입력한 내가 하고 싶은 것
- 역할 대화: 고른 상황의 설정과 지금까지의 대화
- 코치 피드백: 상황 설정과 대화 전문
- 다시 말하기: 상황 설정, 고른 원래 문장, 고친 문장, 그리고 앞서 받은 코치 피드백(그 안의 내 발언 인용 포함)
- 실전 카드: 상황 설정, 내가 한 발언, 코치 피드백 결과

이 내용은 [OpenAI 개인정보처리방침](https://openai.com/policies/privacy-policy)에 따라 처리됩니다. 연습 화면에는 실제 이름, 연락처, 기관 내부 정보 같은 개인정보를 쓰지 말라는 안내가 있습니다.

## 데모와 개발용 연결

- 데모 모드는 기기 안의 예시 응답만 씁니다. 아무것도 전송하지 않으며 화면에 "데모 · 실제 인증 아님"이 항상 보입니다.
- 스토어에 올린 빌드에는 개발용 API 연결 기능이 없습니다. 소스에서 직접 개발용으로 빌드한 경우에만 데모 모드에 "개발용 API 연결"이 나타나며, 그때는 사용자가 입력한 주소로 연습 내용이 전송됩니다.

## 기기에 저장하는 것

내 상황으로 연습의 설명 원문과 선택 입력은 저장소·로그에 남기지 않습니다. 생성 전 입력과 시작 전 미리보기는 패널 메모리에만 있습니다. 연습을 시작하면 생성된 가상 상황만 세션과 함께 임시 보관되며, 아래의 24시간·30일 만료 및 삭제 규칙을 따릅니다.

- 연습 기록은 이 기기에만 저장됩니다. 저장하지 않은 연습은 마지막 활동 후 24시간, "이 기기에 30일 저장"을 고른 연습은 저장일부터 30일에 만료되며, 만료 후 다음 접근 시 기기에서 삭제됩니다.
- 기본 설정에서는 로그아웃할 때 저장한 연습도 함께 지웁니다. "이력·설정"의 전체 삭제는 이 기기에 저장된 현재 계정의 연습 기록을 모두 지웁니다.
- 오류가 나면 오류 종류와 걸린 시간만 브라우저 콘솔에 남깁니다. 대화 내용이나 토큰은 남기지 않으며, 어디에도 전송하지 않습니다.
- 설정값(화면 안내 확인 여부 등)도 이 기기에만 저장합니다.

## 브라우저 에이전트 도구

"이력·설정"에서 브라우저 에이전트 도구를 켜면(기본 꺼짐), 사이드패널 안에서 브라우저 에이전트가 현재 연습의 대화·코치 피드백·카드를 읽을 수 있고, 상황 선택·연습 시작·피드백 요청·카드 만들기·저장을 대신할 수 있습니다. 연습 발언, 로그인, 동의, 삭제는 에이전트에게 열지 않습니다. 에이전트에게는 토큰이나 계정 식별자를 주지 않습니다. 에이전트가 읽은 내용을 어떻게 다루는지는 그 에이전트의 정책을 따릅니다.

## Chrome 웹 스토어 사용자 데이터 정책 준수

출근연습이 다루는 정보의 사용은 [Chrome 웹 스토어 사용자 데이터 정책](https://developer.chrome.com/docs/webstore/program-policies/policies)과 그 제한적 사용(Limited Use) 요건을 따릅니다.

- 정보는 이 확장의 단일 목적(업무 대화 연습)을 제공하는 데에만 씁니다.
- 기능에 필요한 경우(OpenAI로 보내는 연습 내용)를 빼고는 제3자에게 넘기지 않습니다.
- 사람이 사용자 정보를 읽지 않습니다. 개발자는 정보를 받지 않습니다.
- 광고, 판매, 신용 평가나 대출 목적으로 쓰지 않습니다.

AI로 내용을 보내기 전에 확장 안에서 따로 묻습니다. "계정/AI 연결"의 마지막 단계인 "AI 사용 동의"에서 무엇이 어디로 가는지 보여 주고, 동의해야 연습이 시작됩니다. 이후 데이터 처리 방식이 바뀌면 확장 안에서 다시 알리고 동의를 받습니다.

## 생성형 AI 결과물 표시

대화 상대의 대사, 코치 피드백, 다시 말하기 비교, 실전 카드는 생성형 AI(OpenAI 모델)가 만든 내용입니다. 확장 화면과 복사한 카드에 그 사실을 표시합니다. 사실과 다를 수 있으니 참고용으로만 쓰세요.

## 상표

출근연습은 개인이 만든 오픈소스 프로젝트이며 OpenAI와 제휴하거나 그 승인을 받지 않았습니다. ChatGPT와 OpenAI는 OpenAI의 상표입니다. 로그인 버튼의 ChatGPT 로고는 OpenAI가 Sign in with ChatGPT용으로 제공한 자산입니다.

## 변경

이 방침이 바뀌면 위의 최종 업데이트 날짜를 고칩니다.

## 문의

hosung.seo2026@gmail.com 로 보내 주세요. 문의 메일에 담긴 이메일 주소와 내용은 답변에만 쓰고, 답변이 끝나면 지웁니다. 연습 대화나 계정 정보는 보내지 마세요.

---

# Chulgeun Yeonseup (출근연습) Privacy Policy

**Last updated: 2026-10-24**

Chulgeun Yeonseup is an open-source Chrome extension where new Korean public officials practice workplace conversations with an AI counterpart in the side panel, then get coach feedback, a one-sentence retry, and a practice card.

**No collection.** The developer runs no server and does not receive, store, or sell your conversations, account data, or browsing activity. There is no analytics or tracking. The extension does not read the content of web pages you visit.

**Sign in with ChatGPT.** Sign-in uses OpenAI's public Sign in with ChatGPT flow. OpenAI returns to a loopback address (`127.0.0.1`); nothing listens on your computer. While sign-in is in progress, a session rule sends that one navigation (that exact callback URL, main frame only) to the extension's own callback page and is removed when the attempt ends or times out after 10 minutes; no other requests are changed. The access and refresh tokens are stored only in this device's local extension storage (`chrome.storage.local`, never sync) and are sent only to OpenAI; the ID token is verified at sign-in and not stored. Alongside them the extension keeps the app registration id OpenAI issued, the issuer, the account subject and a hash of it (used to keep practice records per account on this device). Name and email are not stored. Signing out deletes the tokens and the account identity, asks OpenAI to revoke access, and keeps only the app registration id. Requests count toward your ChatGPT plan.

**Content sent to OpenAI.** Only when you practice, the content the feature needs (scenario setup, the conversation, the sentence you revise together with the earlier coach feedback) goes directly from your browser to OpenAI's Responses API with `store: false`, under [OpenAI's privacy policy](https://openai.com/policies/privacy-policy). The line reader sends the pasted remark, the speaker type and an optional one-line context; custom scenario practice sends the situation you describe, the speaker role and your optional desired action. Neither input is stored.

**Demo and developer endpoint.** Demo mode uses on-device sample replies and sends nothing; it is always labeled. The store build has no developer endpoint. Only a build made from source with the developer flag shows "개발용 API 연결" in demo mode, and then practice content goes to the endpoint you enter.

**Stored on this device.** The original custom scenario description and optional input are never written to storage or logs. Input and the preview before practice stay in panel memory only. Once practice starts, only the generated fictional scenario is kept with the session and follows the same expiration and deletion rules.  Unsaved practices expire 24 hours after last activity and saved ones 30 days after saving; expired records are deleted the next time they are accessed. By default, signing out deletes saved practices too. Settings can delete all of the current account's practice records on this device. Errors leave only an error code and duration in the browser console.

**Browser agent tools.** Off by default. When you turn them on, a browser agent can read the current practice's conversation, coach feedback and card inside the side panel, and can select scenarios, start practice, request feedback, create cards and save. Practice input, sign-in, consent and deletion stay human-only. Agents never receive tokens or account identifiers; what an agent does with what it reads is governed by that agent's own policy.

**Chrome Web Store User Data Policy.** The use of information received through this extension adheres to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/policies), including the Limited Use requirements: data is used only to provide the extension's single purpose (workplace conversation practice), is not transferred to third parties except OpenAI as needed for that purpose, is not read by humans, and is never used or sold for advertising, credit-worthiness or lending. Before anything is sent to OpenAI, the extension asks for consent inside its own interface (the "AI 사용 동의" step); changes to data practices will be disclosed and consented to again.

**Generative AI output.** Counterpart lines, coach feedback, retry comparisons and practice cards are generated by an OpenAI model and are labeled as such in the extension and in copied card text.

**Trademarks.** This is an independent open-source project, not affiliated with or endorsed by OpenAI. ChatGPT and OpenAI are trademarks of OpenAI. The ChatGPT logo on the sign-in button is OpenAI's Sign in with ChatGPT asset.

**Contact.** hosung.seo2026@gmail.com. The address and message of a support email are used only to reply and are deleted afterwards. Please do not send practice conversations or account details.
