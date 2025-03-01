---
title: "[Project] 사용자 맞춤 추천 & 채팅 제공 서비스 - 핵심 구현"
excerpt: "movlit, recap"

categories:
  - Project
tags:
  - [movlit, recap]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-28
last_modified_at: 2025-03-01
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

<h3> 1. 그룹 채팅방 생성 동시성 제어 (Redis Queue & Worker Thread)</h3>

**문제점:** 특정 콘텐츠(영화/책)당 하나의 그룹 채팅방만 허용하는 정책에서, 인기 콘텐츠의 경우 다수 사용자가 동시에 채팅방 생성을 요청하면 여러 개의 채팅방이 생성될 수 있는 동시성 문제가 발생합니다.

**해결 방안:** Redis의 List를 Queue로 활용하고 별도의 Worker Thread Pool을 사용하여 채팅방 생성 요청을 비동기적으로 순차 처리합니다.

**주요 처리 과정:**

1.  **요청 큐잉:** 채팅방 생성 요청이 들어오면, 해당 콘텐츠 ID를 Key로 하는 Redis List에 요청 정보(사용자 ID 등)를 `leftPush`합니다.
2.  **비동기 처리 (Worker):** 별도의 Worker 스레드가 주기적으로 `rightPop` (Blocking 방식: `brpop`)을 호출하여 Redis Queue에서 가장 오래된 요청을 하나씩 가져옵니다.
3.  **작업 위임:** 가져온 요청 정보를 바탕으로 실제 채팅방 생성 로직(DB 확인 및 생성)을 수행합니다. `ThreadPoolExecutor`와 `Callable`을 사용하여 비동기 실행 및 결과(Future) 관리를 합니다.
4.  **타임아웃 및 예외 처리:** `Future.get()`에 타임아웃(예: 30초)을 설정하여 작업 지연을 방지하고, `InterruptedException`, `ExecutionException`, `TimeoutException` 발생 시 적절한 예외(`GroupChatroomCreationWhenWorkingException`)를 던져 문제를 인지시킵니다.

**기대 효과:** 한 번에 하나의 스레드만 특정 콘텐츠의 채팅방 생성 로직에 접근하게 하여 동시성 문제를 해결하고, 요청 처리를 비동기화하여 웹 서버의 부하를 줄입니다.

**관련 이미지:**

<img width="1210" alt="Worker Class Code Snippet" src="https://github.com/user-attachments/assets/d569a81d-b1e3-43f2-b296-551111229f1d">

<img width="1416" alt="Queue Processing Logic" src="https://github.com/user-attachments/assets/507953fb-8d63-4a84-a6ef-5efe3373c2ac">

<h3> 2. 실시간 메시지 전송 아키텍처 (WebSocket & Redis Pub/Sub)</h3>

**목표:** 사용자 간의 채팅 메시지를 실시간으로 전달합니다.

**구현:** WebSocket 연결을 통해 클라이언트와 서버 간의 양방향 통신 채널을 유지하고, Redis의 Pub/Sub 기능을 메시지 브로커로 활용합니다.

**메시지 흐름:**

1.  **발행 (Publish):** 클라이언트가 WebSocket을 통해 메시지를 보내면, 해당 메시지를 수신한 서버 인스턴스는 메시지를 가공 후 특정 Redis 토픽(채팅방 ID 기반)으로 발행합니다. (사용 토픽 예: 채팅 메시지, 채팅방 정보 업데이트, 사용자 상태 변경 등)
2.  **구독 (Subscribe):** 모든 서버 인스턴스는 관련 Redis 토픽들을 구독(Subscribe)하고 있습니다.
3.  **전파 (Broadcast):** 메시지가 발행되면, Redis는 이를 구독 중인 모든 서버 인스턴스에게 전달합니다. 각 서버 인스턴스는 전달받은 메시지를 자신이 관리하는 WebSocket 클라이언트 중 해당 채팅방에 참여 중인 클라이언트에게 전송합니다.

**장점:** 서버 인스턴스가 여러 대로 확장(Scale-out)되어도 Redis Pub/Sub을 통해 모든 클라이언트에게 메시지를 안정적으로 전파할 수 있습니다.

**관련 이미지:**

<img width="1152" alt="Redis Pub/Sub Messaging Flow Diagram" src="https://github.com/user-attachments/assets/74068e47-3d14-404f-bee0-3e8b18454f67">

<h3> 3. 채팅 메시지 영구 저장 및 처리 (Redis Stream & MongoDB)</h3>

**목표:** 실시간 메시지 전송(Pub/Sub)과 별개로, 모든 채팅 메시지를 안정적으로 영구 저장하고 후처리(DB 저장)합니다.

**구현:** Redis Stream을 메시지 큐로 사용하고, 별도의 Consumer Group이 메시지를 비동기적으로 처리하여 MongoDB에 저장합니다.

**처리 과정:**

1.  **메시지 전송 (Pub/Sub):** 사용자가 메시지를 보내면, 우선 Redis Pub/Sub을 통해 다른 사용자들에게 실시간으로 전달됩니다 (UI 업데이트 목적).
2.  **스트림 추가 (XADD):** 동시에, 해당 메시지 데이터를 Redis Stream에 추가합니다 (`XADD` 명령어).
3.  **비동기 처리 (Consumer Group):** 별도의 Consumer Group에 속한 Consumer(Listener)들이 Stream에서 메시지를 읽어옵니다 (`XREADGROUP`). Consumer Group을 사용하면 여러 Consumer가 메시지를 중복 없이 분산 처리할 수 있습니다.
4.  **영구 저장 (MongoDB):** Consumer는 읽어온 메시지를 MongoDB에 저장합니다.
5.  **처리 확인 (XACK):** 메시지 처리가 성공적으로 완료되면 `XACK` 명령어를 통해 Redis Stream에 해당 메시지가 처리되었음을 알립니다. 이를 통해 메시지 유실 방지 및 장애 발생 시 재처리 기반을 마련합니다.

**Redis Stream 사용 이유:**

- **메시지 신뢰성:** `ACK` 메커니즘을 통해 메시지 처리 보장을 지원합니다.
- **Consumer Group:** 여러 Consumer가 병렬로 메시지를 처리하여 처리량을 높이고, 특정 Consumer 장애 시 다른 Consumer가 이어서 처리할 수 있습니다.
- **비동기 처리:** 메시지 저장 로직을 별도의 Consumer Thread/Process에서 비동기적으로 처리하여, 실시간 메시지 전송 경로의 성능 영향을 최소화하고 시스템 확장을 용이하게 합니다.
- **관심사 분리:** 실시간 전송(Pub/Sub)과 영구 저장(Stream) 파이프라인을 분리하여 시스템 복잡도를 관리합니다.

**관련 이미지:**

<img width="1278" alt="Redis Stream Message Processing Flow Diagram" src="https://github.com/user-attachments/assets/2ce8800a-0103-4925-b980-9cef729352e2">

<img width="1416" alt="Redis Stream Consumer Code Snippet" src="https://github.com/user-attachments/assets/844591d9-6366-466c-9e32-4ae4db3a5166">

<img width="1369" alt="Stream Listener Implementation Snippet" src="https://github.com/user-attachments/assets/75b70d01-740e-44d2-92ad-a8086af1454f">

<h3> 4. 그룹 채팅방 멤버 정보 캐싱 (Redis Cache)</h3>

**문제점:** 그룹 채팅방 입장 시 또는 채팅 중 멤버 목록 조회가 빈번하게 발생하여 RDB에 부하를 줄 수 있습니다.

**해결 방안:** Redis를 캐시 저장소로 사용하여 그룹 채팅방의 멤버 정보를 캐싱합니다.

**처리 과정:**

1.  **캐시 조회:** 멤버 정보 요청 시, 먼저 Redis에서 해당 채팅방의 멤버 목록 캐시 데이터를 조회합니다.
2.  **Cache Hit:** 캐시 데이터가 존재하면 즉시 반환합니다.
3.  **Cache Miss:** 캐시 데이터가 없으면 RDB에서 멤버 목록을 조회합니다.
4.  **캐시 저장:** RDB에서 조회한 데이터를 Redis에 저장(캐싱)한 후, 클라이언트에게 반환합니다. 이후 동일한 요청은 캐시에서 처리됩니다.

**기대 효과:** DB 조회 빈도를 줄여 RDB 부하를 감소시키고, 멤버 목록 조회 응답 속도를 향상시킵니다.

**관련 이미지:**

<img width="1245" alt="Group Chat Member Caching Flow Diagram" src="https://github.com/user-attachments/assets/9224e9c3-6ddc-4601-ba88-5ba781928a63">

<h3> 5. 캐싱을 통한 성능 개선 확인</h3>

- 멤버 정보 조회 시 RDB 직접 조회는 평균 수십 밀리초(ms)가 소요되었으나, Redis 캐시를 적용한 후 평균 한 자릿수 밀리초로 응답 시간이 단축되어 성능 개선 효과를 확인했습니다.

**관련 이미지:**

<img width="517" alt="Performance Comparison: DB vs Cache" src="https://github.com/user-attachments/assets/92afb98c-d425-4f75-a63a-bd2c924df450">

<h3> 6. 1:1 채팅방 목록 캐싱 (Redis Cache)</h3>

**배경:** 사용자의 1:1 채팅방 목록은 자주 변경되지 않는 데이터(주로 추가만 발생)이므로 캐싱에 적합합니다.

**구현:** 그룹 채팅방 멤버 캐싱과 유사하게, 사용자의 1:1 채팅방 목록을 Redis에 캐싱하여 조회 성능을 향상시킵니다.

**처리 과정 (조회 시):**

1.  Redis 캐시에서 해당 사용자의 채팅방 목록 조회 시도.
2.  Cache Hit 시 즉시 반환.
3.  Cache Miss 시 RDB에서 조회 후 Redis에 캐싱하고 반환.

**관련 이미지:**

<img width="1283" alt="1:1 Chat List Caching Flow Diagram" src="https://github.com/user-attachments/assets/57862678-d57d-410b-ba94-8de8d910d513">

<h3> 7. 1:1 채팅방 생성 시 캐시 업데이트</h3>

**시나리오:** 사용자가 상대방에게 처음으로 1:1 메시지를 보낼 때 채팅방이 생성됩니다.

**처리 과정:**

1.  최초 메시지 전송 요청 시, 1:1 채팅방 정보를 RDB에 저장합니다.
2.  동시에, 해당 사용자의 채팅방 목록 Redis 캐시를 갱신(무효화 또는 추가)합니다.
3.  Redis Pub/Sub을 통해 채팅방 생성 및 새 메시지 도착 이벤트를 발행하여, 관련 클라이언트(본인 및 상대방)의 UI가 업데이트되도록 합니다.

**관련 이미지:**

<img width="1106" alt="1:1 Chat Cache Update on Creation Flow Diagram" src="https://github.com/user-attachments/assets/0ba0f62c-e8ec-4d0c-bf4b-613c4ba35df0">

<h3> 8. 실시간 멤버 정보 변경과 캐시 동기화 (Event-Driven)</h3>

**문제점:** 사용자가 프로필 정보(예: 닉네임, 프로필 사진)를 변경했을 때, 참여 중인 채팅방(1:1, 그룹)에 실시간으로 반영되어야 하며, 캐시 데이터와의 정합성도 유지해야 합니다.

**해결 방안:** Spring Application Event 또는 메시지 큐(Kafka, RabbitMQ 등, 여기서는 Redis Pub/Sub 활용 가능)를 사용하여 정보 변경 이벤트를 발행하고, 이를 구독하여 캐시 업데이트 및 실시간 전파를 수행합니다.

**처리 과정:**

1.  **이벤트 발행:** 사용자가 프로필 정보를 업데이트하면, 관련 서비스 로직에서 '멤버 정보 변경 이벤트'를 발행합니다. 이 이벤트에는 변경된 사용자 ID와 정보가 포함됩니다.
2.  **캐시 업데이트:** 이벤트 리스너(또는 메시지 구독자)가 이벤트를 수신하여, 해당 사용자가 속한 모든 채팅방의 멤버 정보 캐시(그룹 채팅방 멤버 목록, 1:1 채팅방 정보 등)를 찾아 업데이트합니다.
3.  **실시간 전파 (Pub/Sub):** 캐시 업데이트 후, Redis Pub/Sub을 통해 '멤버 정보 변경' 토픽으로 메시지를 발행합니다.
4.  **클라이언트 업데이트:** 각 서버 인스턴스의 Redis 구독자는 이 메시지를 받아, WebSocket을 통해 해당 채팅방에 접속 중인 클라이언트들에게 변경된 멤버 정보를 전송하여 UI를 실시간으로 업데이트합니다.

**관련 이미지:**

<img width="1154" alt="Real-time Member Info Update and Cache Sync Flow Diagram" src="https://github.com/user-attachments/assets/b15a3b4a-3ef3-41d6-855b-4dd7e36b2c86">

<h3> 9. Redis 캐시 업데이트 로직 상세</h3>

- 멤버 정보 변경 이벤트를 처리하여 Redis 캐시를 업데이트하는 구체적인 로직 예시입니다.

**처리 순서:**

1.  **기존 캐시 로드:** 업데이트해야 할 채팅방의 멤버 목록 캐시를 Redis에서 조회합니다. (Cache Miss 시 DB 조회 후 캐싱)
2.  **업데이트 대상 식별:** 이벤트로부터 전달받은 변경된 멤버 정보(예: `UpdatedMemberDto`)를 생성합니다.
3.  **캐시 내 멤버 정보 수정:** 로드한 캐시된 멤버 목록(List 또는 Set 형태)에서 변경된 멤버와 동일한 ID를 가진 항목을 찾아 새로운 정보로 교체(또는 업데이트)합니다. (`modifyCachedMember` 함수 예시)
4.  **캐시 저장 및 전파:** 수정된 전체 멤버 목록을 다시 Redis에 저장(`updateCachedMembers` 함수 예시)하고, 변경 사실을 Pub/Sub을 통해 전파합니다.

**관련 이미지 (코드 스니펫):**

<img width="1416" alt="Cache Update Event Listener Code" src="https://github.com/user-attachments/assets/1c9f88ae-4be0-4898-99cb-d12959f51093">

<img width="1420" alt="Modify Cached Member Logic" src="https://github.com/user-attachments/assets/9f63be9f-2f14-47c8-97ff-460507c42320">

<img width="1289" alt="Update Cached Members and Publish Logic" src="https://github.com/user-attachments/assets/488efecd-da65-4d64-8ffd-43d9bd2167bd">

<h3> 10. 실시간 알림 구현 (Server-Sent Events - SSE)</h3>

**목표:** 사용자에게 특정 이벤트 발생 시 브라우저 또는 페이지 내에서 즉각적인 피드백을 제공합니다.

**구현:** SSE 기술을 사용하여 서버에서 클라이언트로 단방향 데이터 푸시를 구현합니다.

**알림 대상 이벤트:**

- 새로운 팔로워 발생
- 내가 찜한 콘텐츠의 그룹 채팅방 생성
- 새로운 1:1 채팅 메시지 수신
- 참여 중인 그룹 채팅방에 새 메시지 수신

**처리 과정:**

1.  **연결 수립:** 클라이언트가 서버의 SSE 엔드포인트로 연결을 요청하면, 서버는 해당 클라이언트를 위한 `SseEmitter` 객체를 생성하고 관리 목록에 추가합니다 (`addEmitter` 로직).
2.  **연결 유지 (Heartbeat):** 연결 유실을 방지하기 위해 주기적으로 (예: 30초마다) 더미 데이터(heartbeat)를 클라이언트로 전송합니다.
3.  **이벤트 발생 및 전송:** 알림 대상 이벤트가 발생하면, 해당 이벤트를 수신해야 할 사용자의 `SseEmitter`를 찾아 알림 데이터를 전송(`emitter.send()`)합니다. 데이터는 특정 이벤트 이름과 함께 전송될 수 있습니다.

**관련 이미지:**

- **브라우저 알림 예시:**

  <img width="562" alt="Browser Notification Example" src="https://github.com/user-attachments/assets/8b3dd225-1ffb-44f8-a83a-c0717f56697c">

- **페이지 내 알림 목록 예시:**

  <img width="460" alt="In-Page Notification List Example" src="https://github.com/user-attachments/assets/f6fda653-4981-4b9e-a4ae-df8331111b3b">

<h3> 11. 다중 서버 환경에서의 SSE 알림 전파 (Redis Pub/Sub 활용)</h3>

**문제점:** SSE는 클라이언트가 연결된 특정 서버 인스턴스와의 1:1 관계입니다. 로드밸런서를 사용하는 다중 서버 환경에서는, 이벤트가 발생한 서버 인스턴스에 해당 알림을 받아야 할 사용자의 SSE 연결이 없을 수 있습니다.

**해결 방안:** Redis Pub/Sub을 브로드캐스팅 메커니즘으로 활용하여, 어떤 서버 인스턴스에서 이벤트가 발생하든 모든 서버 인스턴스가 알림을 인지하고 자신이 관리하는 클라이언트에게 전달할 수 있도록 합니다.

**처리 과정:**

1.  **이벤트 발생 및 발행:** 알림 이벤트가 특정 서버 인스턴스(A)에서 발생하면, 해당 서버는 알림 내용을 Redis의 특정 알림 토픽(예: `notification-channel`)으로 발행(Publish) 합니다. 이 메시지에는 대상 사용자 ID와 알림 내용이 포함됩니다.
2.  **구독 및 수신:** 모든 서버 인스턴스(A, B, C...)는 해당 알림 토픽을 구독(Subscribe)하고 있습니다. Redis는 발행된 메시지를 모든 구독자(모든 서버 인스턴스)에게 전달합니다.
3.  **대상자 확인 및 전송:** 각 서버 인스턴스는 수신한 알림 메시지의 대상 사용자 ID를 확인합니다. 만약 해당 사용자의 `SseEmitter` 객체를 자신이 관리하고 있다면, 그 Emitter를 통해 클라이언트에게 알림 데이터를 전송합니다.

**기대 효과:** 서버 확장성에 관계없이 모든 사용자에게 안정적으로 실시간 SSE 알림을 전달할 수 있습니다.

**관련 이미지:**

<img width="1055" alt="SSE Notification Broadcast using Redis Pub/Sub Diagram" src="https://github.com/user-attachments/assets/e4e1fecc-992e-4842-801d-c502e7572ef2">
