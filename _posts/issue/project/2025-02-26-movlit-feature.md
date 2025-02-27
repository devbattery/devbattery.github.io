---
title: "[Project] 사용자 맞춤 추천 & 채팅 제공 서비스 - 핵심 기능"
excerpt: "movlit, recap"

categories:
  - Project
tags:
  - [movlit, recap]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-26
last_modified_at: 2025-02-27
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 🎥 핵심 기능

<h3>✅ API 문서화 (Spring REST Docs & Rest Assured)</h3>

- Rest Assured를 이용한 API 테스트 코드 작성을 기반으로 Spring REST Docs와 연동하여 API 문서를 자동화했습니다.

  <img src="https://github.com/user-attachments/assets/8577372b-633b-4e48-bda3-54d269e5a6cb" style="width: 600px" alt="API Documentation Example">

<h3>👤 회원 관리 (가입, 일반 로그인, OAuth2 로그인)</h3>

- **회원가입:** 이메일, 비밀번호, 닉네임 기반의 자체 회원가입 기능을 제공합니다.

  <img src="https://github.com/user-attachments/assets/82e9f940-3f51-43bb-bef0-bf4246dbbb7a" style="width: 600px" alt="Signup Form">

<hr/>

- **로그인:** 자체 계정 또는 소셜 계정(OAuth2)을 통한 로그인을 지원합니다.

  <img src="https://github.com/user-attachments/assets/4935e3f9-1f4f-40af-95a9-4fe5a8b272da" style="width: 600px" alt="Login Form">

<hr/>

- **OAuth2 로그인:** Google, Kakao 등 소셜 로그인을 지원하여 사용자 편의성을 높였습니다.

  <img src="https://github.com/user-attachments/assets/34d361fb-f748-4d2e-850f-7a76dc0a4153" style="width: 600px" alt="OAuth2 Login Example">

<h3>🏠 메인 화면 - 카테고리별 영화/도서 목록 제공</h3>

- 사용자의 선호도와 최신 트렌드를 반영하여 영화 및 도서 콘텐츠 목록을 카테고리별로 제공합니다.
- **메인 화면 (영화):**

  <img src="https://github.com/user-attachments/assets/c86c38e8-4812-427e-950f-42fdb85cdd11" style="width: 600px" alt="Main Screen - Movies">

<hr/>

- **메인 화면 (도서):**

  <img src="https://github.com/user-attachments/assets/99e01ff5-b105-4c0b-98cd-224ee0070b02" style="width: 600px" alt="Main Screen - Books">

<h3>ℹ️ 상세 화면 - 평점, 코멘트, 찜, 유사 콘텐츠 추천</h3>

- **콘텐츠 상세 정보:** 각 영화/도서의 상세 정보, 사용자 평점 및 코멘트, 관련 콘텐츠(다른 책/영화) 목록을 제공합니다.
- **도서 상세 정보:**

  <img src="https://github.com/user-attachments/assets/a9a6668b-0632-4445-b92f-703b880e30e1" style="width: 600px" alt="Book Detail Screen">

<hr/>

- **평점 및 코멘트:** 사용자는 콘텐츠에 대한 평점과 코멘트를 남기고 조회할 수 있습니다.

  <img src="https://github.com/user-attachments/assets/93140632-99de-4166-b4ef-384bfa25bb73" style="width: 600px" alt="Rating and Comments Form (Book)">

<hr/>

- **영화 상세 정보:**

  <img src="https://github.com/user-attachments/assets/9ac75e7f-9782-46cd-a63b-8cf710e015a1" style="width: 600px" alt="Movie Detail Screen">

<hr/>

- **평점 및 코멘트:**

  <img src="https://github.com/user-attachments/assets/79539d4b-16ed-473a-aeae-4dc15e737690" style="width: 600px" alt="Rating and Comments Form (Movie)">

<h3>🔍 통합 검색 - 다양한 조건 검색 및 유사 콘텐츠 제공</h3>

- 콘텐츠의 제목, 장르, 카테고리, 배우/작가, 감독/출판사 등 다양한 기준으로 통합 검색 기능을 제공하며, 검색 결과와 함께 유사한 콘텐츠를 추천합니다.

  <img src="https://github.com/user-attachments/assets/2e66d8b0-9f04-4ecb-bdb7-ffe42a01bcfa" style="width:600px" alt="Integrated Search Results">

<h3>👤 프로필 페이지 - 팔로우, 정보 수정, 맞춤 콘텐츠</h3>

- 사용자는 다른 사용자를 팔로우/언팔로우하고, 자신의 프로필 정보(닉네임, 프로필 사진 등)를 수정할 수 있습니다.
- 사용자의 활동(찜 목록, 평점 등)을 기반으로 맞춤형 콘텐츠를 추천받을 수 있습니다.

  <img src="https://github.com/user-attachments/assets/8f440bfd-d64c-4e43-8329-5502c0b0b062" style="width:600px" alt="User Profile Page">

<h3>💬 1:1 채팅 (DM) - 사용자 간 실시간 다이렉트 메시지</h3>

- **채팅방 생성:** 다른 사용자의 프로필 페이지에서 DM 보내기 버튼을 통해 1:1 채팅방을 생성하고 메시지를 전송할 수 있습니다.

  <img src="https://github.com/user-attachments/assets/b3c1e0c9-b985-4b24-af52-5c1cde01ae55" style="width:600px" alt="Starting a 1:1 Chat">

<hr/>

- **실시간 프로필 업데이트:** 채팅 중 상대방의 프로필 사진이 변경되면 실시간으로 채팅방에 반영됩니다.

  <img src="https://github.com/user-attachments/assets/7cd08d50-8ec1-4f38-88dc-35eb4c67bdf7" style="width:600px" alt="Real-time Profile Update in Chat">

<hr/>

- **새 메시지 알림:** 1:1 채팅 메시지를 받으면 실시간 알림(SSE)을 통해 사용자에게 알려줍니다.

  <img src="https://github.com/user-attachments/assets/505fea8c-7cbd-4eac-b7e1-a35a73763797" style="width:600px" alt="1:1 Chat Notification">

<h3>👥 그룹 채팅 - 콘텐츠 기반 그룹 채팅 및 실시간 교류</h3>

- **채팅방 검색 및 생성/참여:** 특정 영화나 책에 대한 그룹 채팅방을 검색하여 참여하거나, 없는 경우 직접 생성할 수 있습니다.

  <img src="https://github.com/user-attachments/assets/f24799ba-e133-4824-9858-7fa50ed64abd" style="width:600px" alt="Group Chat Search and Creation">

<hr/>

- **실시간 그룹 채팅:** WebSocket을 통해 그룹 채팅방 내 사용자들과 실시간으로 의견을 교환할 수 있습니다.

  <img src="https://github.com/user-attachments/assets/48cbec83-32e2-480d-88d7-71ef0cf99c47" style="width:600px" alt="Real-time Group Chat">

<hr/>

- **실시간 프로필 업데이트:** 그룹 채팅 중 사용자의 프로필 정보(사진, 닉네임)가 변경되면 실시간으로 반영됩니다.

  <img src="https://github.com/user-attachments/assets/65d61216-23da-4f51-952e-437f7cbf5adb" style="width:600px" alt="Real-time Profile Update in Group Chat">

<hr/>

- **채팅방 나가기:** 참여 중인 그룹 채팅방에서 나갈 수 있습니다.

  <img src="https://github.com/user-attachments/assets/62f28b53-feb7-4f45-81fa-6bbc37848107" style="width:600px" alt="Leaving Group Chat">

<h3>🔔 사용자 알림 (SSE) - 주요 이벤트 실시간 알림</h3>

- SSE(Server-Sent Events)를 활용하여 팔로우, 찜한 콘텐츠의 그룹챗 생성, 새 메시지(1:1, 그룹) 수신 등 주요 이벤트 발생 시 사용자에게 실시간 알림을 제공합니다 (브라우저 알림 및 페이지
  내 알림 목록).

  <img src="https://github.com/user-attachments/assets/cb18199a-8ed0-49eb-8515-8cda7d2e0503" style="width:600px" alt="Real-time Notifications List">