---
title: "[Project] 하나만 생성되어야 하는 채팅방의 동시성 문제 해결 - 비동기, Redis Queue"
excerpt: "movlit, redis, queue"

categories:
  - Project
tags:
  - [movlit, redis, queue]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-04-06
last_modified_at: 2025-04-06
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

사용자들이 동시에 특정 영화나 책에 대한 그룹 채팅방 생성을 요청할 때 어떤 문제가 발생할 수 있을까요? 바로 **경쟁 상태(Race Condition)**입니다. 여러 요청이 동시에 "어? 이 콘텐츠에 대한 채팅방이 없네? 내가 만들어야지!"라고 판단하고 중복된 채팅방을 생성하려 시도할 수 있습니다.

`Redis`의 `Queue` 자료구조와 비동기 `Worker` 패턴을 활용하여 이 그룹 채팅방 동시 생성 문제를 어떻게 해결했는지 공유하고자 합니다.

## 문제 상황: 동시에 채팅방을 만들려는 사용자들

1.  **사용자 A**가 영화 '인셉션' 채팅방 생성을 요청합니다.
2.  **동시에 사용자 B**도 영화 '인셉션' 채팅방 생성을 요청합니다.
3.  두 요청은 거의 동시에 DB를 조회하여 '인셉션' 채팅방이 없는 것을 확인합니다. (`validateExistByContentId`)
4.  두 요청 모두 채팅방 생성 로직(`createGroupChatroom`)을 실행하려고 시도합니다.
5.  결과: 운이 나쁘면 '인셉션' 채팅방이 두 개 생기거나, DB의 Unique 제약 조건 등으로 인해 오류가 발생합니다.

이 문제를 해결하기 위해선, **특정 콘텐츠에 대한 채팅방 생성 작업은 오직 하나의 요청만 성공적으로 수행**하도록 보장해야 합니다.

## ✨ 해결 전략: Redis Queue와 비동기 Worker의 조화

저희는 다음과 같은 전략을 사용했습니다.

1.  **선착순 대기열 (Redis List):** 특정 콘텐츠(`contentId`)별로 Redis List를 생성하여 채팅방 생성 요청을 등록하는 대기열로 사용합니다. `LPUSH` 명령어를 사용하여 요청한 사용자의 `memberId`를 이 리스트에 넣습니다. Redis의 List 연산은 원자적(Atomic)이므로 여러 요청이 동시에 `LPUSH`를 실행해도 안전합니다.
2.  **단일 생성 실행자 (Worker):** 별도의 스레드 풀에서 동작하는 `GroupChatroomCreationWorker`를 둡니다. 이 워커는 Redis List에서 `RIGHTPOP` (또는 `BRPOP`) 명령어를 사용하여 대기열의 첫 번째 요청(`memberId`)을 **단 하나만** 가져옵니다. `RIGHTPOP` 역시 원자적이므로, 여러 워커 스레드나 요청 처리 스레드가 동시에 시도하더라도 오직 하나만 성공적으로 `memberId`를 가져갈 수 있습니다.
3.  **결과 반환 및 처리:** 워커는 성공적으로 가져온 `memberId`와 `contentId` 정보를 반환합니다. 이 정보를 받은 최초 요청 처리 로직만이 실제 채팅방 생성(`createGroupChatroom`)을 진행합니다. 만약 워커가 `memberId`를 가져오지 못했다면 (다른 요청이 이미 가져갔거나, 타임아웃 등), 해당 요청은 채팅방 생성을 시도하지 않고 이미 존재하거나 생성 중임을 알립니다.

## 🛠️ 코드 레벨에서의 구현 살펴보기

### 1. 채팅방 생성 요청 처리 (`GroupChatroomUseCase`)

```java
// GroupChatroomUseCase.java

// ... (다른 의존성 주입)
private final RedisTemplate<String, Object> redisTemplate;
private final GroupChatroomCreationWorker worker;
private static final String GROUP_CHATROOM_QUEUE_KEY_PREFIX = "groupChatroomQueue:";

@Transactional
public GroupChatroomResponse requestCreateGroupChatroom(GroupChatroomRequest request, MemberId memberId) {
    // contentId 생성 (예: MV_12345)
    String contentId = ChatroomConvertor.generateContentId(request.getContentType(), request.getContentId());

    // 1. 이미 생성된 채팅방이 있는지 빠르게 확인 (최적화)
    validateExistByContentId(contentId);

    // 2. Redis Queue에 생성 요청 등록 (LPUSH, Atomic)
    String queueKey = GROUP_CHATROOM_QUEUE_KEY_PREFIX + contentId;
    redisTemplate.opsForList().leftPush(queueKey, memberId.getValue());

    // 3. Worker에게 실제 생성 권한 획득 요청
    // Worker는 Queue에서 오직 하나의 memberId만 꺼내옴 (RIGHTPOP, Atomic)
    Optional<Map<String, String>> responseOpt = worker.requestChatroomCreation(contentId);
    Map<String, String> response = getPureResponse(responseOpt); // 결과 없으면 예외 발생 (이미 다른 요청이 처리 중)

    // 4. Worker로부터 받은 정보로 실제 채팅방 생성
    String workerContentId = response.keySet().iterator().next();
    MemberId workerMemberId = IdFactory.createMemberId(response.get(workerContentId)); // Worker가 꺼내온 memberId

    GroupChatroomResponse createdChatroom = createGroupChatroom(
            RequestDataForCreationWorker.from(request.getRoomName(), workerContentId, workerMemberId));

    log.info("::GroupChatroomService_requestCreateGroupChatroom::");

    // ... (알림 발송 로직)

    return createdChatroom;
}

// Worker로부터 응답이 없거나 비어있으면 -> 다른 요청이 이미 처리했거나 처리 중
private Map<String, String> getPureResponse(Optional<Map<String, String>> responseOpt) {
    if (responseOpt.isEmpty()) {
        // 이미 다른 요청에 의해 생성되었거나 생성 중인 경우
        throw new GroupChatroomAlreadyExistsException();
    }
    return responseOpt.get();
}

// DB에 이미 존재하는지 확인
private void validateExistByContentId(String contentId) {
    if (groupChatRepository.existsByContentId(contentId)) {
        throw new GroupChatroomAlreadyExistsException();
    }
}

// 실제 DB에 채팅방을 생성하는 로직
@Transactional
public GroupChatroomResponse createGroupChatroom(RequestDataForCreationWorker data) {
    // ... (채팅방 및 관계 생성 로직)
    return groupChatRepository.create(groupChatroom);
}

// ... (나머지 코드)
```

**흐름 요약:**

1.  `validateExistByContentId`: DB에 이미 채팅방이 있는지 1차 확인. (하지만 이것만으론 경쟁 상태 해결 불가)
2.  `redisTemplate.opsForList().leftPush`: Redis List에 요청자 `memberId`를 PUSH하여 대기열에 등록. (원자적)
3.  `worker.requestChatroomCreation`: 비동기 워커에게 작업 요청. 워커 내부에서 `RIGHTPOP`을 사용하여 대기열에서 `memberId`를 꺼내옴. (원자적, 오직 하나만 성공)
4.  `getPureResponse`: 워커가 성공적으로 `memberId`를 가져왔는지 확인. 실패 시 (다른 요청이 이미 처리 중) 예외 발생.
5.  `createGroupChatroom`: 워커로부터 받은 `memberId`를 이용하여 실제 채팅방 생성 로직 실행.

### 2. 단일 생성 실행자 (`GroupChatroomCreationWorker`)

```java
// GroupChatroomCreationWorker.java

@Component
@RequiredArgsConstructor
@Slf4j
public class GroupChatroomCreationWorker {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ThreadPoolExecutor threadPoolExecutor; // 비동기 작업을 위한 스레드 풀

    private static final String GROUP_CHATROOM_QUEUE_KEY_PREFIX = "groupChatroomQueue:";

    public Optional<Map<String, String>> requestChatroomCreation(String contentId) {
        // Callable: 비동기 작업 정의
        Callable<Optional<Map<String, String>>> task = () -> {
            String queueKey = GROUP_CHATROOM_QUEUE_KEY_PREFIX + contentId;

            // 1. Redis List에서 RIGHTPOP 시도 (Atomic, Blocking 가능)
            // 지정된 시간(10초) 동안 Queue에 아이템이 들어오길 기다림
            Object memberIdObject = redisTemplate.opsForList()
                    .rightPop(queueKey, 10, TimeUnit.SECONDS); // BRPOP 사용도 고려 가능

            // 2. 성공적으로 memberId를 가져왔다면 결과 Map 생성
            if (memberIdObject instanceof String memberId) {
                return makeResultMap(contentId, memberId);
            }

            // 3. 가져오지 못했다면 (Timeout 또는 다른 스레드가 먼저 가져감) Optional.empty() 반환
            return Optional.empty();
        };

        try {
            // 4. 스레드 풀에 작업 제출 및 결과 대기 (Timeout 설정)
            Future<Optional<Map<String, String>>> future = threadPoolExecutor.submit(task);
            return future.get(30, TimeUnit.SECONDS); // 작업 완료를 최대 30초 대기

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            // 예외 처리 (로그 기록 등)
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.error("채팅방 생성 작업 중 오류 발생 (contentId: {}): {}", contentId, e.getMessage());
            // 실제 서비스에서는 좀 더 정교한 예외 처리가 필요할 수 있음
            throw new GroupChatroomCreationWhenWorkingException();
        }
    }

    // 결과 Map 생성 Helper
    private Optional<Map<String, String>> makeResultMap(String contentId, String memberId) {
        Map<String, String> resultMap = new HashMap<>();
        resultMap.put(contentId, memberId);
        return Optional.of(resultMap);
    }
}
```

**핵심:**

- `redisTemplate.opsForList().rightPop(queueKey, timeout)`: 이 부분이 동시성 제어의 핵심입니다. 해당 `queueKey` (콘텐츠 ID 기반)에 대해 **오직 하나의 스레드**만이 `memberId`를 성공적으로 꺼내갈 수 있습니다. 다른 스레드들은 `null`을 반환받거나 타임아웃될 때까지 대기합니다. `timeout`을 설정하여 무한정 기다리는 것을 방지합니다. (네트워크 지연 등을 고려하여 `BRPOP` 사용도 좋은 대안입니다.)
- `ThreadPoolExecutor`: 실제 Redis POP 작업은 별도의 스레드 풀에서 비동기적으로 실행되어 요청 처리 스레드가 Redis 응답을 무작정 기다리는 것을 방지합니다.
- `Future.get(timeout)`: 비동기 작업의 결과를 기다리되, 최대 대기 시간을 설정하여 응답 지연을 막습니다.

## 👍 이점 및 효과

1.  **동시성 제어:** Redis List의 원자적 연산(`LPUSH`, `RIGHTPOP`)을 통해 특정 콘텐츠에 대한 채팅방 생성은 오직 한 번만 실행됨을 보장합니다.
2.  **중복 생성 방지:** 경쟁 상태로 인한 중복 채팅방 생성을 원천적으로 차단합니다.
3.  **비동기 처리:** Redis 연동 및 실제 생성 로직 일부를 비동기 워커 스레드로 위임하여 요청 처리 스레드의 블로킹 시간을 줄이고 시스템 응답성을 개선할 수 있습니다. (현재 코드에서는 `Future.get`으로 결과를 기다리지만, 로직을 더 분리하면 완전 비동기 처리가 가능)
4.  **분산 환경 확장성:** Redis는 분산 환경에서 사용하기 용이하며, 여러 애플리케이션 인스턴스가 동일한 Redis Queue를 바라보게 하여 동시성 제어를 수행할 수 있습니다.

## 🤔 고려할 점

- **Redis 의존성:** Redis 서버가 장애 시 채팅방 생성이 불가능해집니다. (Redis 고가용성 구성 필요)
- **Worker 스레드 풀 관리:** 적절한 스레드 풀 크기 설정 및 모니터링이 필요합니다.
- **Timeout 설정:** `rightPop`과 `Future.get`의 타임아웃 값은 시스템 환경과 예상 부하에 맞게 신중하게 설정해야 합니다. 너무 짧으면 정상적인 처리도 실패할 수 있고, 너무 길면 응답 지연이 발생할 수 있습니다.
- **오류 처리:** 네트워크 오류, Redis 오류, 워커 스레드 오류 등 다양한 예외 상황에 대한 견고한 처리 로직이 필요합니다.
