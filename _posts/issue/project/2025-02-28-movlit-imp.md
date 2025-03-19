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
last_modified_at: 2025-03-19
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 1. 그룹 채팅방 생성 동시성 제어 (Redis Queue & Worker Thread)

<img width="1210" alt="Worker Class Code Snippet" src="https://github.com/user-attachments/assets/d569a81d-b1e3-43f2-b296-551111229f1d">
*▲ Worker 클래스의 코드 일부: Redis 큐에서 작업을 가져와 처리하는 로직*

<img width="1416" alt="Queue Processing Logic" src="https://github.com/user-attachments/assets/507953fb-8d63-4a84-a6ef-5efe3373c2ac">
*▲ Redis List를 활용한 채팅방 생성 요청 처리 흐름도*

**문제점:** 특정 콘텐츠(영화/책)당 하나의 그룹 채팅방만 허용하는 정책에서, 인기 콘텐츠의 경우 다수 사용자가 동시에 채팅방 생성을 요청하면, 여러 스레드/프로세스가 거의 동시에 DB에서 "채팅방 없음"을 확인하고 각자 생성을 시도하여 결과적으로 여러 개의 채팅방이 생성될 수 있는 동시성 문제(Race Condition)가 발생합니다.

**해결 방안:** 위 그림들에서 볼 수 있듯이, Redis의 List 자료구조를 작업 큐(Queue)로 활용하고, 별도의 Worker Thread Pool을 사용하여 특정 콘텐츠에 대한 채팅방 생성 요청을 비동기적으로 순차 처리합니다. 이를 통해 특정 콘텐츠 ID에 대한 생성 로직은 한 번에 하나의 작업만 처리되도록 보장합니다.

### 주요 처리 과정

1.  **요청 큐잉:** 채팅방 생성 요청이 웹 서버에 들어오면, 요청 처리를 즉시 수행하지 않고, 해당 **콘텐츠 ID를 Key**로 하는 Redis List (예: `chatroom:create:queue:{contentId}`)에 요청 정보(예: 사용자 ID, 요청 시간 등 필요한 메타데이터)를 원자적 명령인 `leftPush` (또는 `rightPush`)를 사용하여 추가합니다. `LPUSH`를 사용하면 가장 최근 요청이 리스트의 왼쪽에 쌓입니다.
2.  **비동기 처리 (Worker):** 별도의 애플리케이션 또는 스레드(Worker)가 Redis Queue를 감시합니다. Worker는 주기적으로 또는 이벤트 기반으로 특정 콘텐츠 ID 큐에 대해 `rightPop` (또는 `leftPop`, `LPUSH`와 반대 방향) 연산을 실행합니다. **`brpop` (Blocking Right Pop)** 또는 `blpop`을 사용하면 큐에 새로운 아이템이 들어올 때까지 Worker 스레드가 효율적으로 대기(CPU 소모 없이)할 수 있으며, 큐에서 가장 오래된 요청(FIFO 순서 보장 시)을 하나씩 안전하게 가져옵니다. **콘텐츠 ID별 큐를 사용함으로써, 특정 콘텐츠에 대한 생성 요청은 해당 큐를 처리하는 Worker에 의해 순차적으로 처리됩니다.**
3.  **작업 위임 (실제 생성 로직):** Worker는 `brpop`으로 가져온 요청 정보를 바탕으로 실제 채팅방 생성 로직(DB에서 해당 콘텐츠 ID의 채팅방 존재 여부 확인 및 필요한 경우 생성)을 수행합니다. 이 로직은 잠재적으로 시간이 소요될 수 있으므로, Worker 내에서 `ThreadPoolExecutor`와 `Callable` 인터페이스를 사용하여 별도의 스레드에서 비동기적으로 실행하고, 그 결과를 `Future` 객체를 통해 관리할 수 있습니다. 이는 Worker 스레드가 DB 작업 완료를 기다리는 동안 다른 큐의 작업을 처리할 수 있게 합니다(만약 Worker가 여러 큐를 담당한다면). **핵심은, 특정 `contentId`에 대한 *DB 확인 및 생성* 로직은 이 Worker/Thread Pool 내에서 한 번에 하나씩만 실행되도록 보장하는 것입니다.**
4.  **타임아웃 및 예외 처리:** `Future.get()` 메소드에 타임아웃(예: 30초)을 설정하여, 만약 위임된 채팅방 생성 작업이 예상보다 오래 걸리거나 무한정 대기하는 상황을 방지합니다. `InterruptedException` (스레드 중단 시), `ExecutionException` (작업 실행 중 예외 발생 시), `TimeoutException` (지정된 시간 초과 시)이 발생하면, 이를 적절한 사용자 정의 예외(예: `GroupChatroomCreationWhenWorkingException`)로 변환하여 호출자 또는 모니터링 시스템에 문제를 명확히 알립니다. **채팅방 생성 로직 자체는 멱등성(Idempotent)을 가지도록 설계하는 것이 중요합니다.** 즉, Worker가 요청을 처리할 때 이미 채팅방이 존재하는 경우, 에러를 발생시키지 않고 성공으로 간주하거나 기존 채팅방 정보를 반환해야 합니다. (예: `INSERT IF NOT EXISTS` 또는 `SELECT 후 없으면 INSERT`를 트랜잭션으로 묶기)
5.  **(고려사항) 작업 실패 시:** 만약 Worker가 `brpop`으로 작업을 가져온 후, DB 처리 중 예기치 않게 실패(e.g., Worker 프로세스 다운)하면 해당 작업이 유실될 수 있습니다. 더 높은 신뢰성이 필요하다면, Redis의 `RPOPLPUSH` (또는 `BRPOPLPUSH`) 명령어를 사용하여 작업을 가져오는 동시에 백업 큐(Pending Queue)에 옮겨두고, 작업이 성공적으로 완료된 후에만 백업 큐에서 제거하는 패턴을 고려할 수 있습니다.

**기대 효과:** Redis Queue를 통해 특정 콘텐츠에 대한 채팅방 생성 요청이 직렬화되어 처리되므로, 여러 요청이 동시에 DB에 접근하여 중복된 채팅방을 생성하는 동시성 문제를 근본적으로 해결합니다. 또한, 시간이 걸릴 수 있는 생성 로직을 웹 요청 처리 스레드에서 분리하여 비동기적으로 처리하므로, 웹 서버의 응답성을 개선하고 전반적인 부하를 줄입니다.

## 2. 실시간 메시지 전송 아키텍처 (WebSocket & Redis Pub/Sub)

<img width="1152" alt="Redis Pub/Sub Messaging Flow Diagram" src="https://github.com/user-attachments/assets/74068e47-3d14-404f-bee0-3e8b18454f67">
*▲ WebSocket과 Redis Pub/Sub을 이용한 실시간 메시지 전송 흐름*

**목표:** 사용자 간의 채팅 메시지를 여러 서버 인스턴스에 걸쳐 실시간으로 효율적으로 전달합니다.

**구현:** 위 다이어그램과 같이, 클라이언트와 서버 간에는 **WebSocket** 프로토콜을 사용하여 지속적인 양방향 통신 채널을 유지합니다. 서버 간의 메시지 브로드캐스팅 및 전파를 위해 **Redis의 Pub/Sub (Publish/Subscribe)** 기능을 메시지 브로커로 활용합니다.

### 메시지 흐름

1.  **클라이언트 연결:** 사용자가 채팅방에 입장하면, 클라이언트(웹 브라우저, 모바일 앱 등)는 서버의 WebSocket 엔드포인트와 연결을 수립합니다. 서버는 이 WebSocket 세션과 사용자 ID, 참여 중인 채팅방 ID 등의 정보를 매핑하여 관리합니다 (예: 서버 메모리 내의 `Map<String chatroomId, Set<WebSocketSession>>` 구조).
2.  **발행 (Publish):** 사용자가 WebSocket을 통해 메시지를 서버로 전송하면, 해당 메시지를 수신한 특정 서버 인스턴스(예: 그림의 서버 인스턴스 1)는 다음 작업을 수행합니다:
    *   메시지 가공: 발신자 정보, 타임스탬프 등 필요한 메타데이터를 추가합니다. (영구 저장은 후술할 Stream 방식 사용)
    *   Redis 발행: 가공된 메시지를 Redis의 특정 **토픽(채널)**으로 발행(`PUBLISH` 명령어)합니다. 토픽 이름은 일반적으로 채팅방 ID를 기반으로 합니다 (예: `chat:messages:{chatroomId}`). 이를 통해 해당 채팅방에 관련된 메시지임을 명시합니다. (사용 토픽 예: 채팅 메시지 전송(`chat:messages:{roomId}`), 채팅방 정보 업데이트(`chat:roomInfo:{roomId}`), 사용자 상태 변경(`chat:userStatus:{roomId}`) 등 다양한 이벤트에 별도 토픽 사용 가능)
3.  **구독 (Subscribe):** 애플리케이션의 **모든 활성 서버 인스턴스**(서버 인스턴스 1, 2, ...)는 시작 시점에 관련 Redis 토픽들을 구독(`SUBSCRIBE` 명령어)합니다. 각 서버는 Redis로부터 구독 중인 토픽에 메시지가 발행될 때마다 해당 메시지를 수신하는 리스너를 가지고 있습니다.
4.  **전파 (Broadcast):** 메시지가 특정 토픽으로 발행되면, Redis는 해당 토픽을 구독하고 있는 **모든 서버 인스턴스에게** 메시지를 즉시 전달합니다.
5.  **클라이언트 전송:** 각 서버 인스턴스(1, 2, ...)는 Redis로부터 메시지를 수신하면, 메시지에 포함된 채팅방 ID를 확인합니다. 그리고 자신이 관리하고 있는 WebSocket 연결 중에서 해당 채팅방 ID에 참여 중인 클라이언트 세션들을 찾아, 수신한 메시지를 해당 클라이언트들에게 WebSocket을 통해 전송합니다.

### 장점

- **디커플링(Decoupling):** 메시지를 보내는 서버 인스턴스와 메시지를 수신하여 클라이언트에게 전달하는 서버 인스턴스가 직접 통신할 필요 없이 Redis Pub/Sub을 통해 분리됩니다.
- **확장성(Scalability):** 서버 인스턴스가 여러 대로 수평 확장(Scale-out)되어도, 새로운 서버 인스턴스는 단순히 Redis의 관련 토픽을 구독하기만 하면 전체 메시징 시스템에 참여할 수 있습니다. Redis가 중앙 브로커 역할을 하므로 서버 수 증가에 따른 복잡도가 낮습니다.
- **신뢰성 있는 전파:** Redis는 구독 중인 모든 클라이언트(여기서는 서버 인스턴스)에게 메시지를 전달하는 역할을 안정적으로 수행합니다. (단, Pub/Sub 자체는 메시지 전달을 보장하지 않으므로, 네트워크 이슈 등으로 서버 인스턴스가 메시지를 놓칠 수는 있습니다. 실시간 UI 업데이트 목적에는 일반적으로 충분합니다.)

## 3. 채팅 메시지 영구 저장 및 처리 (Redis Stream & MongoDB)

<img width="1278" alt="Redis Stream Message Processing Flow Diagram" src="https://github.com/user-attachments/assets/2ce8800a-0103-4925-b980-9cef729352e2">
*▲ Redis Stream과 Consumer Group을 활용한 메시지 영구 저장 흐름*

<img width="1416" alt="Redis Stream Consumer Code Snippet" src="https://github.com/user-attachments/assets/844591d9-6366-466c-9e32-4ae4db3a5166">
*▲ Redis Stream에서 메시지를 읽어오는 Consumer 로직 일부*

<img width="1369" alt="Stream Listener Implementation Snippet" src="https://github.com/user-attachments/assets/75b70d01-740e-44d2-92ad-a8086af1454f">
*▲ Stream 메시지를 받아 처리하는 Listener 구현 예시*

**목표:** 실시간 메시지 전송(Pub/Sub을 통한 UI 업데이트)과는 별개로, 모든 채팅 메시지를 **안정적으로 영구 저장**하고, 필요한 후처리(예: 분석, 검색 인덱싱 등)를 수행하기 위한 기반을 마련합니다.

**구현:** 위 그림과 코드 스니펫처럼, Redis의 **Stream** 자료구조를 메시지 큐(Message Queue) 또는 로그(Append-only Log)처럼 사용하고, 별도의 **Consumer Group**이 이 Stream에서 메시지를 비동기적으로 읽어 처리하여 최종적으로 MongoDB (또는 다른 영구 데이터베이스)에 저장합니다.

### 처리 과정

1.  **메시지 전송 (Pub/Sub):** 사용자가 메시지를 보내면, 우선 **섹션 2**에서 설명한 대로 Redis Pub/Sub을 통해 다른 참여자들에게 실시간으로 전달되어 UI가 즉시 업데이트됩니다. 이는 빠른 응답성을 위함입니다.
2.  **스트림 추가 (XADD):** **동시에**, 메시지를 수신한 서버 인스턴스는 해당 메시지 데이터(발신자 ID, 채팅방 ID, 메시지 내용, 타임스탬프 등)를 Redis Stream에 추가합니다. 이때 **`XADD`** 명령어를 사용하며, 스트림의 Key (예: `chat:stream:{chatroomId}` 또는 통합 스트림 `chat:stream:all`), 메시지 ID (`*` 사용 시 자동 생성), 그리고 메시지 필드-값 쌍들을 지정합니다. `XADD`는 원자적으로 수행되며, 추가된 메시지에 고유한 ID(타임스탬프 기반 + 시퀀스 번호)를 부여합니다.
3.  **비동기 처리 (Consumer Group):** 메시지 저장 및 후처리를 담당하는 별도의 애플리케이션 또는 스레드 그룹(Consumer Group)이 Redis Stream을 감시합니다. 이 Consumer들은 **`XREADGROUP`** 명령어를 사용하여 특정 Consumer Group(예: `mongo-persisters`)의 멤버로서 Stream에서 아직 처리되지 않은 메시지들을 읽어옵니다.
    *   **Consumer Group:** 동일한 그룹 이름을 사용하는 여러 Consumer 인스턴스가 Stream의 메시지들을 분산하여 처리할 수 있습니다. 즉, 메시지 `M1`은 Consumer `C1`이, 메시지 `M2`는 Consumer `C2`가 처리하는 식으로 로드 밸런싱이 가능합니다. 각 Consumer Group은 Stream에서 어디까지 읽었는지 독립적인 포인터를 유지합니다.
    *   **`XREADGROUP`:** 이 명령은 특정 Consumer에게 아직 처리되지 않은(ACK되지 않은) 메시지들을 반환하며, 동시에 이 메시지들을 해당 Consumer가 처리 중인 상태로 표시합니다 (Pending Entries List - PEL에 추가됨). `BLOCK` 옵션을 사용하여 새 메시지가 도착할 때까지 대기할 수 있습니다.
4.  **영구 저장 (MongoDB):** 각 Consumer는 `XREADGROUP`으로 읽어온 메시지 데이터를 사용하여 MongoDB의 해당 채팅 메시지 컬렉션에 문서를 저장(`insert`)합니다.
5.  **처리 확인 (XACK):** 메시지가 성공적으로 MongoDB에 저장되고 필요한 모든 처리가 완료되면, Consumer는 **`XACK`** 명령어를 사용하여 Redis Stream에 해당 메시지 ID가 성공적으로 처리되었음을 알립니다. `XACK`는 해당 메시지를 Consumer의 PEL(Pending Entries List)에서 제거합니다.

### Redis Stream 사용 이유

- **메시지 신뢰성 (Persistence & At-Least-Once Delivery):** Stream 데이터는 Redis 메모리 및 디스크(AOF/RDB 설정 시)에 저장되어 서버 재시작에도 유지됩니다. Consumer Group과 `XACK` 메커니즘은 각 메시지가 최소 한 번 이상 처리됨을 보장하려 시도합니다. Consumer가 메시지를 가져간 후 처리 중 실패(Crash)하면, 해당 메시지는 PEL에 남아있어 다른 Consumer가 재처리(Claim)하거나, 장애 복구 후 동일 Consumer가 다시 처리할 수 있습니다.
- **Consumer Group (Scalability & Fault Tolerance):** 여러 Consumer 인스턴스가 병렬로 메시지를 처리하여 전체 처리량(Throughput)을 높일 수 있습니다. 그룹 내 특정 Consumer가 실패하더라도, 다른 Consumer들이 계속해서 메시지를 처리하거나 실패한 Consumer가 처리 중이던 메시지를 이어받아 처리할 수 있어 시스템의 가용성과 내결함성을 향상시킵니다.
- **비동기 처리 (Decoupling & Performance):** 메시지 영구 저장 로직을 실시간 메시지 전송 경로와 분리하여 별도의 Consumer Thread/Process에서 비동기적으로 처리합니다. 이로 인해 실시간 메시지 전송(Pub/Sub)의 응답 시간에 영향을 주지 않고, DB 저장 로직의 부하가 웹 서버나 실시간 처리 서버에 직접적인 영향을 미치지 않습니다. 또한, 저장 로직과 실시간 전송 로직을 독립적으로 확장할 수 있습니다.
- **관심사 분리 (Separation of Concerns):** 실시간 UI 업데이트를 위한 빠른 전송(Pub/Sub)과 데이터의 안정적인 영구 저장 및 후처리(Stream)라는 두 가지 다른 요구사항을 명확히 분리하여 시스템 구조를 더 깔끔하고 관리하기 쉽게 만듭니다.

## 4. 그룹 채팅방 멤버 정보 캐싱 (Redis Cache)

<img width="1245" alt="Group Chat Member Caching Flow Diagram" src="https://github.com/user-attachments/assets/9224e9c3-6ddc-4601-ba88-5ba781928a63">
*▲ Cache-Aside 패턴을 이용한 그룹 채팅방 멤버 정보 캐싱 흐름*

**문제점:** 사용자가 그룹 채팅방에 입장할 때마다, 또는 채팅 중 멤버 목록을 확인하는 기능(예: 참여자 수 표시, 멘션 기능 위한 목록 조회)이 호출될 때마다 관계형 데이터베이스(RDB)에서 멤버 목록을 조회하면, 특히 멤버 수가 많거나 조회가 빈번한 채팅방의 경우 RDB에 상당한 읽기 부하를 유발하고 응답 속도 저하를 초래할 수 있습니다.

**해결 방안:** 위 그림과 같이, 응답 속도 개선 및 DB 부하 감소를 위해 **Redis를 캐시 저장소로 사용**하여 그룹 채팅방의 멤버 정보를 임시 저장합니다. **Cache-Aside 패턴**을 주로 사용합니다.

### 처리 과정

1.  **캐시 조회 시도:** 애플리케이션에서 특정 채팅방의 멤버 정보가 필요한 요청(예: API 호출)이 들어오면, 가장 먼저 Redis 캐시에 해당 채팅방의 멤버 목록 데이터가 있는지 확인합니다. 이때 사용할 Redis Key는 예측 가능하고 고유해야 합니다 (예: `groupchatroom:members:{chatroomId}`).
2.  **Cache Hit:** Redis 조회 결과, 해당 Key에 대한 데이터가 존재하면 (Cache Hit), Redis에서 데이터를 읽어와 즉시 클라이언트에게 반환합니다. 이 경우 RDB 접근은 발생하지 않습니다.
3.  **Cache Miss:** Redis 조회 결과, 해당 Key에 대한 데이터가 없거나 만료되었다면 (Cache Miss), 애플리케이션은 RDB(원본 데이터 소스)에 멤버 목록을 조회하는 쿼리를 실행합니다.
4.  **캐시 저장:** RDB로부터 성공적으로 멤버 목록 데이터를 조회한 후, 애플리케이션은 이 데이터를 적절한 형식(예: 직렬화된 객체 리스트, JSON 문자열, Redis Set/List 등)으로 변환하여 Redis 캐시에 저장합니다. 이때 적절한 **TTL(Time-To-Live)**을 설정하여 데이터가 너무 오래 캐시에 남아있지 않도록 관리할 수 있습니다 (예: 1시간). 저장 후, RDB에서 조회한 데이터를 클라이언트에게 반환합니다. 이후 동일한 채팅방 멤버 정보 요청은 설정된 TTL 동안 Cache Hit가 발생하게 됩니다.
5.  **캐시 데이터 구조:** Redis에 멤버 목록을 저장하는 방식은 다양합니다.
    *   **Serialized Object/JSON:** 멤버 객체 리스트 전체를 직렬화하여 하나의 String 값으로 저장. 간단하지만, 일부 멤버 정보만 업데이트하기 어렵습니다.
    *   **Redis Set:** 멤버 ID들만 Set에 저장. 멤버 여부 확인(`SISMEMBER`)에 빠릅니다. 멤버 상세 정보는 별도 캐시(예: `user:profile:{userId}`) 또는 DB 조회가 필요할 수 있습니다.
    *   **Redis Hash:** 채팅방 Key 아래에 멤버 ID를 필드로, 멤버 정보를 값(직렬화된 객체)으로 저장. 멤버 개별 조회/수정이 용이합니다.
    *   **Redis List:** 순서가 중요한 경우 사용될 수 있습니다.

**기대 효과:** 반복적인 멤버 목록 조회 요청의 대부분을 빠른 인메모리 저장소인 Redis에서 처리함으로써, RDB의 읽기 부하를 크게 줄일 수 있습니다. 또한, 디스크 기반의 RDB보다 훨씬 빠른 Redis의 응답 속도 덕분에 사용자에게 더 빠른 멤버 목록 조회 경험을 제공할 수 있습니다.

## 5. 캐싱을 통한 성능 개선 확인

<img width="517" alt="Performance Comparison: DB vs Cache" src="https://github.com/user-attachments/assets/92afb98c-d425-4f75-a63a-bd2c924df450">
*▲ RDB 직접 조회와 Redis 캐시 사용 시 성능 비교 결과 (예시)*

- **측정 결과:** 위 그래프는 멤버 정보 조회 기능을 대상으로 성능 테스트를 수행했을 때 나타날 수 있는 결과의 예시입니다. RDB에서 직접 조회하는 경우 평균 응답 시간이 수십 밀리초(ms) 범위에서 측정되었으나, Redis 캐시를 적용한 후 동일한 조회 기능은 평균적으로 한 자릿수 밀리초(ms) 내에 응답하여, 응답 속도가 현저히 단축되었음을 정량적으로 확인할 수 있었습니다.
- **성능 개선 이유:** 이러한 성능 차이는 주로 데이터 저장 매체의 속도 차이에서 기인합니다. Redis는 **인메모리(In-memory)** 데이터 저장소로, 모든 데이터를 RAM에 저장하여 디스크 I/O가 필요한 RDB에 비해 데이터 접근 속도가 월등히 빠릅니다. 또한, 캐싱을 통해 RDB로의 네트워크 왕복 및 쿼리 처리 비용을 절약할 수 있습니다.

## 6. 1:1 채팅방 목록 캐싱 (Redis Cache)

<img width="1283" alt="1:1 Chat List Caching Flow Diagram" src="https://github.com/user-attachments/assets/57862678-d57d-410b-ba94-8de8d910d513">
*▲ 1:1 채팅방 목록 조회 시 캐싱 처리 흐름도*

**배경:** 사용자가 참여하고 있는 1:1 채팅방 목록은 일반적으로 자주 조회되지만, 목록 자체가 급격하게 변경되는 경우는 상대적으로 적습니다(주로 새로운 채팅방이 추가되는 형태). 이러한 **읽기 중심적(Read-heavy)** 특성 때문에 1:1 채팅방 목록 역시 캐싱을 적용하기에 매우 적합한 대상입니다.

**구현:** 그룹 채팅방 멤버 캐싱과 동일한 **Cache-Aside 패턴**을 적용합니다(위 그림 참조). 특정 사용자의 1:1 채팅방 목록을 Redis에 캐싱하여, RDB 조회 빈도를 줄이고 응답 성능을 향상시킵니다.

### 처리 과정 (조회 시)

1.  사용자의 1:1 채팅방 목록 요청 시, 먼저 Redis 캐시에서 해당 사용자 ID를 Key로 하는 캐시 데이터(예: `user:privatechats:{userId}`)를 조회합니다.
2.  **Cache Hit:** 캐시 데이터가 존재하면, Redis에서 목록을 읽어 즉시 반환합니다.
3.  **Cache Miss:** 캐시 데이터가 없거나 만료되었다면, RDB에서 해당 사용자가 참여 중인 1:1 채팅방 목록(채팅방 ID, 상대방 정보, 마지막 메시지 요약 등)을 조회합니다.
4.  **캐시 저장:** RDB에서 조회한 목록 데이터를 Redis에 적절한 TTL과 함께 캐싱하고, 클라이언트에게 반환합니다. 캐시 데이터는 주로 채팅방 ID 리스트, 또는 각 채팅방의 요약 정보를 포함한 객체 리스트를 직렬화한 형태로 저장될 수 있습니다.

## 7. 1:1 채팅방 생성 시 캐시 업데이트

<img width="1106" alt="1:1 Chat Cache Update on Creation Flow Diagram" src="https://github.com/user-attachments/assets/0ba0f62c-e8ec-4d0c-bf4b-613c4ba35df0">
*▲ 1:1 채팅방 생성 시 RDB 저장 및 캐시 업데이트/무효화, 이벤트 전파 흐름*

**시나리오:** 사용자 A가 사용자 B에게 생애 첫 1:1 메시지를 보내는 경우, 시스템은 두 사용자 간의 새로운 1:1 채팅방을 생성해야 합니다. 이 과정에서 RDB뿐만 아니라 관련 캐시도 일관성 있게 관리해야 합니다(위 그림 참조).

### 처리 과정

1.  **채팅방 생성 및 저장:** 최초 메시지 전송 요청을 받은 서버는, 사용자 A와 B 간의 1:1 채팅방이 RDB에 이미 존재하는지 확인합니다. 존재하지 않는다면, 새로운 채팅방 정보를 RDB에 저장(INSERT)합니다.
2.  **캐시 업데이트/무효화:** 채팅방이 성공적으로 RDB에 생성되면, 이 변경 사항을 Redis 캐시에도 반영해야 합니다. 캐싱 전략에 따라 다음 중 하나의 방식으로 처리합니다:
    *   **캐시 무효화 (Invalidation):** 가장 간단한 방법은 사용자 A와 사용자 B 각각의 1:1 채팅방 목록 캐시(예: `user:privatechats:{userIdA}`, `user:privatechats:{userIdB}`)를 Redis에서 삭제(`DEL` 명령어)하는 것입니다. 다음번 목록 조회 시 Cache Miss가 발생하여 RDB에서 최신 목록을 다시 읽어와 캐시에 저장하게 됩니다. (Write-Through 또는 Write-Around 방식)
    *   **캐시 추가/갱신 (Update):** 더 적극적인 방법은, 새로 생성된 채팅방 정보를 기존 캐시 목록 데이터에 직접 추가하거나, RDB에서 최신 목록 전체를 다시 읽어와 캐시를 갱신하는 것입니다. 이는 다음번 조회 시 Cache Hit를 유도할 수 있지만, 로직이 더 복잡해지고 동시성 문제를 고려해야 할 수 있습니다. (Write-Through 방식) **일반적으로는 무효화가 구현하기 쉽고 안전합니다.**
3.  **실시간 이벤트 전파 (Pub/Sub):** 새로운 채팅방 생성 및 첫 메시지 도착 사실을 관련 사용자들에게 실시간으로 알려 UI 업데이트를 유도하기 위해, Redis Pub/Sub을 사용합니다.
    *   채팅방 생성 이벤트: `chat:roomCreated` 같은 토픽으로 새 채팅방 ID와 참여자 정보를 발행하여, 클라이언트가 채팅 목록을 갱신하도록 할 수 있습니다.
    *   새 메시지 도착 이벤트: `chat:messages:{newRoomId}` 토픽으로 첫 메시지를 발행하여, 상대방(사용자 B)의 클라이언트에 새 메시지 알림 및 채팅방 UI가 나타나도록 합니다 (섹션 2의 메시지 전송 플로우 활용).

## 8. 실시간 멤버 정보 변경과 캐시 동기화 (Event-Driven)

<img width="1154" alt="Real-time Member Info Update and Cache Sync Flow Diagram" src="https://github.com/user-attachments/assets/b15a3b4a-3ef3-41d6-855b-4dd7e36b2c86">
*▲ 멤버 정보 변경 시 이벤트 발행, 캐시 업데이트 및 실시간 전파 흐름*

**문제점:** 사용자가 자신의 프로필 정보(예: 닉네임 변경, 프로필 사진 URL 업데이트)를 수정했을 때, 이 변경 사항이 해당 사용자가 참여하고 있는 모든 채팅방(1:1 및 그룹)의 멤버 목록에 실시간으로 반영되어야 합니다. 또한, 이 변경 사항은 **섹션 4**와 **섹션 6**에서 설명한 Redis 캐시 데이터와 RDB 데이터 간의 정합성(Consistency)을 유지해야 합니다. 단순 TTL 기반 캐시는 정보 변경 즉시 반영이 어렵습니다.

**해결 방안:** 위 다이어그램처럼, **이벤트 기반(Event-Driven) 아키텍처**를 도입하여 정보 변경 이벤트를 발행(Publish)하고, 이를 구독(Subscribe)하는 리스너(Listener) 또는 별도의 서비스가 캐시 업데이트 및 실시간 전파 로직을 수행하도록 합니다. 이벤트 전달 메커니즘으로는 Spring Application Event, 메시지 큐(Kafka, RabbitMQ 등), 또는 여기서는 이미 사용 중인 **Redis Pub/Sub**을 활용할 수 있습니다.

### 처리 과정

1.  **이벤트 발행:** 사용자가 프로필 정보 업데이트 요청을 보내고, 해당 요청을 처리하는 서비스 로직(예: `UserService`)에서 정보가 성공적으로 RDB에 업데이트되면, '멤버 정보 변경 이벤트(MemberInfoUpdatedEvent)'를 발행합니다. 이 이벤트 객체 또는 메시지에는 최소한 변경된 사용자의 ID와 변경된 필드 정보(예: 새 닉네임, 새 프로필 사진 URL)가 포함되어야 합니다.
2.  **이벤트 수신 및 캐시 탐색/업데이트:** 해당 이벤트를 구독하는 리스너(예: `MemberCacheUpdateListener`) 또는 메시지 컨슈머가 이벤트를 수신합니다. 리스너는 이벤트에 포함된 사용자 ID를 기반으로, **해당 사용자가 참여 중인 모든 채팅방(1:1 및 그룹)의 목록을 알아내야 합니다.** 이는 RDB 쿼리(예: `SELECT chatroomId FROM chat_members WHERE userId = ?`)를 통해 수행하거나, 별도의 멤버십 관리 캐시가 있다면 그것을 활용할 수 있습니다.
    *   찾아낸 각 채팅방 ID에 대해, 해당 채팅방의 멤버 정보 캐시(예: `groupchatroom:members:{chatroomId}`)를 Redis에서 조회합니다.
    *   조회된 캐시 데이터 내에서 변경된 사용자의 정보를 찾아 업데이트합니다 (상세 로직은 섹션 9 참고).
    *   업데이트된 캐시 데이터를 다시 Redis에 저장합니다.
3.  **실시간 전파 (Redis Pub/Sub for WebSocket):** 캐시 업데이트가 완료된 후, 변경된 멤버 정보를 해당 채팅방에 참여 중인 다른 사용자들에게 실시간으로 알리기 위해 Redis Pub/Sub을 다시 사용합니다.
    *   리스너는 변경이 발생한 각 채팅방 ID를 토픽으로 (예: `chat:memberUpdate:{chatroomId}`) 변경된 멤버 정보(사용자 ID, 새 닉네임, 새 프로필 사진 등)를 포함한 메시지를 발행합니다.
4.  **클라이언트 UI 업데이트:** 각 서버 인스턴스에 있는 Redis Pub/Sub 구독자(WebSocket 관리 로직)가 `chat:memberUpdate` 메시지를 수신합니다. 구독자는 메시지 내 채팅방 ID를 확인하고, 해당 채팅방에 연결된 WebSocket 클라이언트들에게 변경된 멤버 정보를 전송합니다. 클라이언트는 이 정보를 받아 화면의 멤버 목록, 채팅 메시지 옆의 프로필 사진/닉네임 등을 실시간으로 업데이트합니다.

### 장점

- **디커플링:** 프로필 업데이트 로직과 캐시/알림 로직이 분리되어 시스템 변경 및 확장이 용이합니다.
- **실시간 동기화:** 정보 변경 즉시 관련 캐시와 클라이언트 UI가 업데이트되어 데이터 정합성을 높입니다.
- **중앙 집중 처리:** 이벤트 리스너에서 캐시 업데이트 로직을 중앙 집중적으로 관리할 수 있습니다.

## 9. Redis 캐시 업데이트 로직 상세

<img width="1416" alt="Cache Update Event Listener Code" src="https://github.com/user-attachments/assets/1c9f88ae-4be0-4898-99cb-d12959f51093">
*▲ 멤버 정보 변경 이벤트를 수신하여 처리하는 Listener 코드 예시*

<img width="1420" alt="Modify Cached Member Logic" src="https://github.com/user-attachments/assets/9f63be9f-2f14-47c8-97ff-460507c42320">
*▲ 캐시된 멤버 목록 내 특정 멤버 정보를 수정하는 로직*

<img width="1289" alt="Update Cached Members and Publish Logic" src="https://github.com/user-attachments/assets/488efecd-da65-4d64-8ffd-43d9bd2167bd">
*▲ 수정된 캐시 데이터를 Redis에 저장하고, 변경 사실을 Pub/Sub으로 전파하는 로직*

- **컨텍스트:** **섹션 8**의 이벤트 리스너가 '멤버 정보 변경 이벤트'를 수신했을 때, 특정 그룹 채팅방의 Redis 멤버 목록 캐시를 업데이트하는 구체적인 로직 예시를 위 코드 스니펫들에서 볼 수 있습니다. 이 예시는 캐시에 멤버 객체 리스트가 직렬화되어 저장되어 있다고 가정합니다.

### 처리 순서 (이벤트 리스너 내부)

1.  **기존 캐시 데이터 로드:** 업데이트해야 할 대상 채팅방 ID (`chatroomId`)를 사용하여 Redis에서 해당 멤버 목록 캐시 데이터(예: Key `groupchatroom:members:{chatroomId}`)를 조회합니다 (`GET` 명령어).
    *   **Cache Hit:** 데이터가 존재하면, 직렬화된 데이터를 역직렬화하여 메모리 상의 멤버 객체 리스트로 변환합니다.
    *   **Cache Miss:** 데이터가 없다면, RDB에서 최신 멤버 목록을 조회하여 메모리 상의 리스트로 만듭니다. (이 경우는 캐시가 만료되었거나 이전에 채워지지 않은 상황)
2.  **업데이트 대상 멤버 정보 준비:** 이벤트로부터 전달받은 변경된 사용자 정보(예: `userId`, `newNickname`, `newProfileImageUrl`)를 바탕으로 업데이트에 사용할 데이터 객체(예: `UpdatedMemberDto`)를 생성합니다.
3.  **캐시 내 멤버 정보 수정 (`modifyCachedMember` 로직):** 로드한 멤버 객체 리스트(List 또는 Set 형태)를 순회하면서, 이벤트에서 전달된 `userId`와 동일한 ID를 가진 멤버 객체를 찾습니다. 찾았다면, 해당 객체의 필드(닉네임, 프로필 사진 등)를 `UpdatedMemberDto`의 새로운 정보로 업데이트(수정)합니다.
    *   **주의:** 이 과정(로드-수정-저장)은 원자적이지 않습니다. 만약 매우 짧은 시간 안에 동일 채팅방 캐시에 대한 두 개의 다른 업데이트 이벤트가 동시에 처리된다면, 한쪽의 업데이트가 다른 쪽에 의해 덮어쓰여 유실될 수 있는 **경쟁 상태(Race Condition)**가 발생할 가능성이 있습니다. 엄격한 정합성이 필요하다면, Redis의 Lua Script나 트랜잭션(WATCH/MULTI/EXEC), 또는 분산 락(Distributed Lock) 등을 사용하여 업데이트 과정을 원자적으로 만들거나 직렬화해야 합니다. 하지만 많은 경우, 이벤트 처리 순서에 따른 약간의 지연이나 최후의 업데이트만 반영되는(Last-Write-Wins) 결과로도 충분할 수 있습니다.
4.  **수정된 캐시 저장 및 변경 전파 (`updateCachedMembers` 로직):**
    *   수정된 전체 멤버 목록 리스트를 다시 직렬화하여 Redis에 저장(`SET` 명령어)합니다. 이때 기존과 동일한 TTL을 설정하거나, 필요에 따라 TTL을 갱신합니다.
    *   캐시 업데이트가 완료되었음을 알리고 클라이언트 UI 업데이트를 유발하기 위해, **섹션 8**에서 설명한 대로 Redis Pub/Sub을 통해 해당 채팅방 토픽(`chat:memberUpdate:{chatroomId}`)으로 변경된 멤버 정보를 포함한 메시지를 발행(`PUBLISH`)합니다.

## 10. 실시간 알림 구현 (Server-Sent Events - SSE)

<img width="562" alt="Browser Notification Example" src="https://github.com/user-attachments/assets/8b3dd225-1ffb-44f8-a83a-c0717f56697c">
*▲ 브라우저(OS) 수준의 푸시 알림 예시*

<img width="460" alt="In-Page Notification List Example" src="https://github.com/user-attachments/assets/f6fda653-4981-4b9e-a4ae-df8331111b3b">
*▲ 웹 페이지 내부에 표시되는 알림 목록 예시*

**목표:** 사용자에게 특정 이벤트(예: 새로운 팔로워, 채팅방 생성, 새 메시지 도착 등) 발생 시, 사용자가 현재 보고 있는 브라우저 페이지를 새로고침하지 않고도 위 예시들과 같은 즉각적인 피드백(알림)을 제공합니다.

**구현:** **Server-Sent Events (SSE)** 기술을 사용합니다. SSE는 HTTP 프로토콜 기반으로 서버에서 클라이언트로 **단방향** 데이터 푸시(Push)를 가능하게 하는 표준 기술입니다. WebSocket과 달리 클라이언트에서 서버로 데이터를 보내는 기능은 내장되어 있지 않으며, 주로 서버 발송 알림에 사용됩니다.

**알림 대상 이벤트 예시:**

-   **소셜 활동:** 새로운 팔로워가 생겼을 때
-   **콘텐츠 관련:** 내가 찜(구독)한 콘텐츠에 대한 그룹 채팅방이 개설되었을 때
-   **채팅 관련:**
    -   새로운 1:1 채팅 메시지가 도착했을 때 (채팅 화면이 아닌 다른 페이지에 있을 경우)
    -   내가 참여 중인 그룹 채팅방에 새로운 메시지가 도착했을 때 (채팅 화면이 아닌 다른 페이지에 있을 경우)

### 처리 과정

1.  **연결 수립 및 관리:**
    *   클라이언트(JavaScript)는 서버의 특정 SSE 엔드포인트 URL로 `EventSource` 객체를 생성하여 연결을 요청합니다. HTTP 요청 헤더에는 `Accept: text/event-stream` 이 포함됩니다.
    *   서버는 이 요청을 받으면, 해당 클라이언트와의 연결을 유지하기 위한 **`SseEmitter` 객체** (Spring Framework 사용 시 예시)를 생성합니다. 이 Emitter 객체는 서버가 나중에 이 클라이언트에게 데이터를 보낼 수 있는 통로 역할을 합니다.
    *   서버는 생성된 `SseEmitter` 객체를 해당 **사용자 ID**와 매핑하여 관리하는 컬렉션(예: `Map<String userId, SseEmitter emitter>`)에 저장합니다. (`addEmitter` 로직) 이는 특정 사용자에게 알림을 보내야 할 때 해당 Emitter를 찾기 위함입니다.
    *   연결 수립 직후, 초기 데이터나 연결 성공 메시지를 보낼 수 있습니다.
2.  **연결 유지 (Heartbeat):** SSE 연결은 오래 지속되는 HTTP 연결입니다. 중간의 프록시 서버나 로드 밸런서 등이 유휴(idle) 연결로 간주하여 임의로 끊는 것을 방지하기 위해, 서버는 주기적으로 (예: 30초 또는 1분마다) 아무 의미 없는 더미 데이터(주석 또는 간단한 데이터)를 클라이언트로 전송합니다. 이를 **Heartbeat** 라고 합니다. 클라이언트 측 `EventSource`는 이를 자동으로 무시하거나, 필요시 연결 상태 확인용으로 사용할 수 있습니다.
3.  **이벤트 발생 및 데이터 전송:**
    *   서버 내부에서 위에서 정의한 알림 대상 이벤트 중 하나가 발생하면, 해당 알림을 받아야 할 사용자 ID를 식별합니다.
    *   서버는 관리 중인 Emitter 맵에서 해당 사용자 ID에 매핑된 `SseEmitter` 객체를 조회합니다.
    *   찾아낸 `SseEmitter` 객체의 **`send()`** 메소드를 호출하여 알림 데이터를 클라이언트로 전송합니다. 데이터는 특정 **이벤트 이름(event)**, **데이터(data)**, 선택적으로 **ID(id)**, **재시도 간격(retry)** 필드를 포함하는 `text/event-stream` 형식에 맞춰 전송됩니다.
        *   예: `event: newFollower\ndata: {"followerId": "user123", "followerNickname": "Alice"}\n\n`
    *   클라이언트 측 JavaScript의 `EventSource` 객체는 특정 `event` 이름에 대한 리스너(`addEventListener('newFollower', ...)`)를 등록하여 해당 타입의 알림 데이터를 수신하고 처리(예: 브라우저 알림 표시, 페이지 내 알림 목록 업데이트)합니다.
4.  **연결 종료 및 오류 처리:** 클라이언트가 브라우저를 닫거나 네트워크 연결이 끊어지면 SSE 연결도 종료됩니다. 서버는 `SseEmitter`의 `onCompletion` 콜백, `onTimeout` 콜백, `onError` 콜백 등을 사용하여 연결 종료 또는 오류 상황을 감지하고, 관리 맵에서 해당 Emitter를 제거하는 등의 정리 작업을 수행해야 합니다.

## 11. 다중 서버 환경에서의 SSE 알림 전파 (Redis Pub/Sub 활용)

<img width="1055" alt="SSE Notification Broadcast using Redis Pub/Sub Diagram" src="https://github.com/user-attachments/assets/e4e1fecc-992e-4842-801d-c502e7572ef2">
*▲ 다중 서버 환경에서 Redis Pub/Sub을 이용한 SSE 알림 전파 방식*

**문제점:** **SSE 연결은 본질적으로 클라이언트와 특정 서버 인스턴스 간의 1:1 장기 HTTP 연결입니다.** 위 그림과 같이 로드 밸런서 뒤에 여러 대의 애플리케이션 서버 인스턴스가 운영되는 환경에서는 다음과 같은 문제가 발생합니다:
- 사용자 A의 SSE 연결은 서버 인스턴스 1에 맺어져 있을 수 있습니다.
- 사용자 A에게 보내야 할 알림 이벤트(예: 새로운 팔로워 발생)는 비즈니스 로직 처리에 따라 서버 인스턴스 2에서 발생할 수 있습니다.
- 서버 인스턴스 2는 사용자 A의 `SseEmitter` 객체를 가지고 있지 않으므로, 직접 알림을 보낼 수 없습니다.

**해결 방안:** 이러한 문제를 해결하기 위해, **Redis의 Pub/Sub 기능을 서버 인스턴스 간의 알림 메시지 브로드캐스팅 메커니즘으로 활용**합니다(그림 참조). 어떤 서버 인스턴스에서 알림 이벤트가 발생하든, 해당 알림을 받아야 할 사용자가 **어느 서버 인스턴스에 연결되어 있더라도** 알림을 받을 수 있게 합니다.

### 처리 과정

1.  **이벤트 발생 및 Redis 발행:** 특정 서버 인스턴스(예: 그림의 서버 인스턴스 2)에서 사용자 `X`에게 보내야 할 알림 이벤트가 발생하면, 서버 2는 알림 생성 로직을 수행한 후, 단순히 로컬 메모리의 `SseEmitter`를 찾는 대신, **Redis의 특정 알림 토픽(채널)** (예: `sse:notifications`)으로 알림 메시지를 발행(`PUBLISH`)합니다. 이 메시지에는 최소한 **대상 사용자 ID (`userId`)**와 **알림 내용(`payload`)**, 그리고 **이벤트 타입(`eventType`)**이 포함되어야 합니다.
    *   예: `PUBLISH sse:notifications '{"userId": "userX", "eventType": "newFollower", "payload": {"followerId": "user123", ...}}'`
2.  **모든 서버의 구독 및 수신:** **모든 애플리케이션 서버 인스턴스**(서버 1, 2, ...)는 시작 시점에 동일한 Redis 알림 토픽 (`sse:notifications`)을 구독(`SUBSCRIBE`)하고 메시지 리스너를 등록해 둡니다. Redis는 발행된 알림 메시지를 구독 중인 **모든 서버 인스턴스에게** 전달합니다.
3.  **대상자 확인 및 로컬 전송:** 각 서버 인스턴스(1, 2, ...)는 Redis로부터 알림 메시지를 수신하면, 메시지에 포함된 `userId`를 확인합니다.
    *   해당 서버 인스턴스가 자신의 로컬 `SseEmitter` 관리 맵(예: `Map<String userId, SseEmitter emitter>`)을 확인하여, 수신된 메시지의 `userId`와 일치하는 사용자의 `SseEmitter` 객체를 **자신이 현재 관리하고 있는지** 검사합니다.
    *   만약 해당 사용자의 `SseEmitter` 객체를 **자신이 가지고 있다면**(그림에서는 서버 1이 사용자 X의 Emitter를 가지고 있음), 그 Emitter의 `send()` 메소드를 호출하여 수신한 알림 데이터(`payload`와 `eventType`)를 해당 클라이언트에게 SSE를 통해 전송합니다.
    *   만약 해당 사용자의 Emitter를 자신이 가지고 있지 않다면(그림에서 서버 2는 사용자 X의 Emitter가 없음), 수신한 메시지를 무시하고 아무 작업도 하지 않습니다.

**기대 효과:** 이 방식을 통해, 알림 이벤트가 어느 서버 인스턴스에서 발생하든 상관없이, Redis Pub/Sub을 통해 모든 서버 인스턴스에게 알림 정보가 전파됩니다. 그리고 최종적으로 해당 사용자의 SSE 연결을 실제로 담당하고 있는 서버 인스턴스가 알림을 클라이언트에게 전달하게 됩니다. 따라서 서버가 수평적으로 확장(Scale-out)되어도 사용자는 끊김 없이 안정적으로 실시간 SSE 알림을 수신할 수 있습니다.