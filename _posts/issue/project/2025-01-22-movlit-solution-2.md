---
title: "[Project] Redis Queue로 생성 시의 동시성 문제 해결"
excerpt: "movlit, solution, redis, concurrency"

categories:
  - Project
tags:
  - [movlit, solution, redis, concurrency]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-08
last_modified_at: 2025-03-27
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 서론

Movlit 서비스에서는 **한 컨텐츠(예: 영화, 책)당 하나의 그룹 채팅방**만 생성되도록 구현하는 것을 목표로 합니다.

하지만 인기 컨텐츠가 공개되는 순간, 수많은 사용자가 동시에 “채팅방 만들기” 버튼을 누르는 시나리오를 생각해 봅시다. 이런 동시 다발적인 요청이 서버에 한꺼번에 도달하면, **경쟁 상태(Race Condition)**가 발생하여 서버가 요청을 제대로 처리하지 못하고 **의도치 않게 여러 개의 채팅방이 생성**될 수 있습니다. 이는 분산 환경에서 자주 발생하는 문제입니다.

이러한 문제를 해결하고 **요청 처리의 원자성(Atomicity)**을 보장하기 위해 **`GroupChatroomCreationWorker` 클래스**를 도입하였습니다.

Worker 클래스는 **Redis의 List 자료구조를 Queue처럼 활용**하고, **Java의 Thread Pool**을 결합하여 채팅방 생성 요청을 **순차적이고 비동기적으로 처리**합니다. 이를 통해 동시에 들어오는 여러 요청 중 **단 하나의 요청만이 실제 채팅방 생성 로직을 수행**하도록 보장합니다.

## 전체 코드

```java
package movlit.be.chat_room.application.service;

@Component
@RequiredArgsConstructor
@Slf4j
public class GroupChatroomCreationWorker {

    // Redis와 상호작용하기 위한 Template
    private final RedisTemplate<String, Object> redisTemplate;
    // 비동기 작업을 처리할 스레드 풀
    private final ThreadPoolExecutor threadPoolExecutor;

    // Redis에서 사용할 Queue Key의 Prefix
    private static final String GROUP_CHATROOM_QUEUE_KEY_PREFIX = "groupChatroomQueue:";

    /**
     * 특정 contentId에 대한 채팅방 생성을 요청하고,
     * 성공적으로 처리될 "대표" 요청자(memberId) 정보를 반환합니다.
     * 이 메서드는 Redis Queue에서 처리 대상을 꺼내오는 역할을 수행합니다.
     *
     * @param contentId 채팅방을 생성할 컨텐츠의 ID
     * @return 채팅방 생성을 담당할 memberId를 포함한 Optional<Map<String, String>>, 처리할 요청이 없거나 실패 시 Optional.empty()
     */
    public Optional<Map<String, String>> requestChatroomCreation(String contentId) {
        // 비동기 작업을 정의하는 Callable 객체 생성
        Callable<Optional<Map<String, String>>> task = () -> {
            // contentId별로 고유한 Redis Queue Key 생성
            String queueKey = GROUP_CHATROOM_QUEUE_KEY_PREFIX + contentId;

            // Redis List에서 데이터를 꺼내는 작업 (BRPOP과 유사한 블로킹 동작)
            // 지정된 시간(10초) 동안 Queue에 데이터가 들어올 때까지 대기합니다.
            // rightPop은 원자적(atomic) 연산이므로, 여러 스레드가 동시에 접근해도 단 하나의 스레드만 데이터를 가져갈 수 있습니다.
            Object memberIdObject = redisTemplate.opsForList()
                    .rightPop(queueKey, 10, TimeUnit.SECONDS); // timeout: 10 seconds

            // Redis에서 가져온 데이터가 유효한 String(memberId)인지 확인
            if (memberIdObject instanceof String memberId) {
                // 성공 시, contentId와 "선택된" memberId를 Map으로 감싸 반환
                // 이 memberId가 채팅방 생성 로직을 수행할 자격을 얻습니다.
                log.info("Successfully retrieved memberId [{}] for contentId [{}] from queue.", memberId, contentId);
                return makeResultMap(contentId, memberId);
            }

            // 10초 타임아웃 동안 Queue에 데이터가 없거나, 데이터 형식이 잘못된 경우
            log.warn("No memberId retrieved from queue for contentId [{}] within timeout or invalid data type.", contentId);
            return Optional.empty();
        };

        try {
            // 정의된 Callable 작업을 스레드 풀에 제출하여 비동기 실행
            // submit()은 작업의 결과를 추적할 수 있는 Future 객체를 반환합니다.
            Future<Optional<Map<String, String>>> future = threadPoolExecutor.submit(task);

            // 비동기 작업의 결과를 최대 30초 동안 기다립니다.
            // 이 시간은 Redis 대기 시간(10초)을 포함한 전체 작업 완료 시간입니다.
            // future.get()은 결과가 준비될 때까지 현재 스레드를 블로킹(blocking)합니다.
            return future.get(30, TimeUnit.SECONDS); // timeout: 30 seconds

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            // 예외 발생 시 로그 기록 및 사용자 정의 예외 발생
            log.error("Error occurred while processing chatroom creation request for contentId [{}]: {}", contentId, e.getMessage(), e);

            if (e instanceof InterruptedException) {
                // InterruptedException 발생 시, 현재 스레드의 인터럽트 상태를 다시 설정하여
                // 상위 호출자나 스레드 풀이 인터럽트 사실을 인지하도록 합니다.
                Thread.currentThread().interrupt();
            } else if (e instanceof TimeoutException) {
                // 30초 타임아웃 발생 시: 작업이 너무 오래 걸림 (Redis 연결 문제, 과도한 부하 등)
                log.error("Chatroom creation task timed out for contentId [{}].", contentId);
            } else if (e instanceof ExecutionException) {
                // Callable 내부에서 예외 발생 시 (e.g., Redis 작업 중 네트워크 오류)
                log.error("Exception occurred during task execution for contentId [{}]: {}", contentId, e.getCause() != null ? e.getCause().getMessage() : e.getMessage(), e.getCause());
            }

            // 통합된 예외를 던져서 호출 측에서 일관되게 처리하도록 함
            throw new GroupChatroomCreationWhenWorkingException("Failed to process chatroom creation request for contentId: " + contentId, e);
        }
    }

    // 결과를 Optional<Map> 형태로 포장하는 헬퍼 메서드
    private Optional<Map<String, String>> makeResultMap(String contentId, String memberId) {
        Map<String, String> resultMap = new HashMap<>();
        resultMap.put("contentId", contentId); // Key를 contentId 문자열로 변경 (가독성 향상)
        resultMap.put("memberId", memberId);   // Key를 memberId 문자열로 변경 (가독성 향상)
        return Optional.of(resultMap);
    }

    // 사용자 정의 예외 클래스 (내부 클래스 또는 별도 파일로 정의 가능)
    public static class GroupChatroomCreationWhenWorkingException extends RuntimeException {
        public GroupChatroomCreationWhenWorkingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
```

## 아키텍처 및 동작 원리

이 Worker의 핵심 아이디어는 **Redis List를 분산 큐(Distributed Queue)로 사용하여 동시성 문제를 해결**하는 것입니다. 전체적인 흐름은 다음과 같습니다.

1.  **요청 접수 (Worker 외부)**: 사용자가 특정 `contentId`에 대해 "채팅방 만들기"를 요청합니다.
2.  **Queue에 요청 추가 (Worker 외부)**: 실제 채팅방 생성 로직을 바로 실행하는 대신, 해당 사용자의 `memberId`를 `contentId`에 해당하는 Redis List (Queue)에 `LPUSH` 또는 `RPUSH` 명령어로 추가합니다. (이 코드는 Worker 외부에 구현되어 있다고 가정합니다.)
    *   `LPUSH` 사용 시: 가장 나중에 들어온 요청이 먼저 처리될 수 있습니다 (LIFO - Stack).
    *   `RPUSH` 사용 시: 가장 먼저 들어온 요청이 먼저 처리됩니다 (FIFO - Queue). 코드에서는 `rightPop`을 사용하므로, `LPUSH`로 넣어야 FIFO 동작이 됩니다. (먼저 넣은게 오른쪽 끝으로 감)
3.  **Worker의 처리 (코드)**: `GroupChatroomCreationWorker`의 `requestChatroomCreation` 메서드가 호출됩니다. 이 메서드는 특정 `contentId`의 Queue를 주시합니다.
4.  **Queue에서 요청 꺼내기 (코드 - `rightPop`)**: Worker는 **Redis의 `BRPOP` (Blocking Right Pop)과 유사하게 동작**하는 `redisTemplate.opsForList().rightPop(key, timeout)`을 사용합니다.
    *   이 연산은 **원자적(Atomic)**입니다. 즉, 여러 스레드나 여러 서버 인스턴스가 동시에 같은 Queue에 접근하더라도, **오직 하나의 스레드/프로세스만이 성공적으로 데이터를 꺼내갈 수 있습니다.** 이것이 바로 여러 채팅방 생성을 방지하는 핵심 메커니즘입니다.
    *   Queue가 비어있으면, 지정된 시간(여기서는 10초) 동안 데이터가 들어올 때까지 **현재 스레드를 블로킹(Blocking)**합니다.
5.  **"선택된" 요청자 반환 (코드)**: `rightPop`으로 성공적으로 `memberId`를 꺼내온 Worker 스레드는, 이 `memberId`가 해당 `contentId`의 채팅방 생성을 책임질 "대표" 요청자임을 나타내는 결과를 반환합니다.
6.  **실제 생성 로직 수행 (Worker 외부)**: `requestChatroomCreation`을 호출한 쪽에서는 반환된 `memberId`를 사용하여 **실제 채팅방 생성 로직**(예: 데이터베이스에 채팅방 정보 저장)을 수행합니다. 이 시점에는 이미 경쟁 상태가 해소되었으므로 안전하게 생성 로직을 진행할 수 있습니다. (이 로직 또한 Worker 외부에 구현되어 있다고 가정합니다.)

## 주요 처리 과정 상세 설명

-   **`Callable<Optional<Map<String, String>>>` 인터페이스 활용**
    *   `Callable`은 결과를 반환할 수 있는 비동기 작업을 정의하는 데 사용됩니다. 여기서는 Redis Queue에서 데이터를 가져오는 작업을 비동기적으로 처리하고, 그 결과를 `Optional<Map<String, String>>` 형태로 반환하기 위해 사용합니다. `Runnable`과 달리 결과를 반환하고 체크 예외(Checked Exception)를 던질 수 있다는 장점이 있습니다.

-   **Redis Queue Key 생성 (`GROUP_CHATROOM_QUEUE_KEY_PREFIX + contentId`)**
    *   `GROUP_CHATROOM_QUEUE_KEY_PREFIX`("groupChatroomQueue:")라는 고정된 접두사와 동적인 `contentId`를 조합하여 각 컨텐츠별로 독립적인 Redis Queue를 식별하는 Key를 생성합니다. 이를 통해 특정 컨텐츠에 대한 요청들이 다른 컨텐츠의 요청 처리와 격리되어 관리됩니다.

-   **데이터 조회 (`rightPop(queueKey, 10, TimeUnit.SECONDS)`)**
    *   Redis List의 `rightPop` 메서드를 **블로킹 모드(timeout 지정)**로 사용합니다. 이는 Redis의 `BRPOP` 명령어와 유사하게 동작합니다.
    *   **동작 방식**:
        1.  `queueKey`에 해당하는 List의 오른쪽 끝(꼬리)에서 요소를 꺼내려고 시도합니다.
        2.  만약 List가 비어있다면, **최대 10초 동안** 요소가 추가되기를 기다립니다 (블로킹).
        3.  10초 안에 요소가 추가되면 해당 요소를 꺼내 반환하고, 10초가 지나도 요소가 없으면 `null`을 반환합니다.
    *   **원자성 보장**: Redis의 List 연산은 원자적(Atomic)이므로, 여러 스레드나 서버 인스턴스에서 동시에 `rightPop`을 호출해도 **단 하나의 호출만이 성공적으로 요소를 가져갈 수 있습니다.** 이것이 중복 생성을 방지하는 핵심 원리입니다.
    *   **반환값 처리**:
        *   성공적으로 `String` 타입의 `memberId`를 가져오면, `makeResultMap`을 통해 `contentId`와 `memberId`를 담은 Map을 `Optional`로 감싸 반환합니다. 이 `memberId`가 채팅방 생성 권한을 획득한 것입니다.
        *   10초 타임아웃이 발생하거나, 가져온 데이터가 예상한 `String` 타입이 아닐 경우 (`null` 포함), `Optional.empty()`를 반환하여 처리할 요청이 없거나 실패했음을 알립니다.

-   **`Future`를 통한 비동기 결과 처리**
    *   `threadPoolExecutor.submit(task)`: 정의된 `Callable` 작업을 스레드 풀에 제출하여 **별도의 스레드에서 비동기적으로 실행**합니다. `submit()` 메서드는 작업의 상태와 결과를 추적할 수 있는 `Future` 객체를 즉시 반환합니다.
    *   `future.get(30, TimeUnit.SECONDS)`: 비동기 작업(`Callable` 실행)이 완료될 때까지 **최대 30초 동안 기다립니다(블로킹)**.
        *   이 30초는 `Callable` 내부의 모든 로직(Redis `rightPop` 대기 시간 10초 포함)을 포괄하는 전체 작업 시간 제한입니다.
        *   작업이 30초 내에 성공적으로 완료되면, `Callable`이 반환한 `Optional<Map<String, String>>` 결과를 얻습니다.
        *   30초를 초과하면 `TimeoutException`이 발생합니다.

-   **예외 처리 상세**:
    *   **`InterruptedException`**: `future.get()` 대기 중에 현재 스레드가 다른 스레드에 의해 인터럽트(interrupt)될 경우 발생합니다. 이 경우, `Thread.currentThread().interrupt()`를 호출하여 **인터럽트 상태를 다시 설정**하는 것이 중요합니다. 이는 상위 호출 스택이나 스레드 풀이 스레드가 인터럽트되었다는 사실을 인지하고 적절히 처리(예: 스레드 풀 종료)할 수 있도록 합니다.
    *   **`ExecutionException`**: `Callable` 작업 실행 중에 내부에서 예외가 발생했을 경우 (예: Redis 연결 실패, 데이터 처리 오류 등) 발생합니다. `e.getCause()`를 통해 `Callable` 내부에서 발생한 실제 예외를 확인할 수 있습니다.
    *   **`TimeoutException`**: `future.get()`에서 설정한 대기 시간(30초) 내에 작업이 완료되지 않으면 발생합니다. 이는 Redis 응답 지연, 스레드 풀의 과부하, `Callable` 내부 로직의 지연 등 다양한 원인으로 발생할 수 있습니다.
    *   **`GroupChatroomCreationWhenWorkingException`**: 위 세 가지 주요 예외 중 하나라도 발생하면, 이를 포착하여 로그를 남기고, 원인 예외(cause)를 포함한 사용자 정의 `RuntimeException`인 `GroupChatroomCreationWhenWorkingException`을 발생시킵니다. 이는 호출자(이 메서드를 사용하는 서비스 로직)에게 작업 처리 중 예외가 발생했음을 일관된 방식으로 알리고, 호출자가 트랜잭션 롤백 등의 후속 조치를 취할 수 있도록 합니다.

## 결론

`GroupChatroomCreationWorker`는 Redis Queue의 **원자적 연산(Atomic Operation)**과 Thread Pool을 활용하여 동시 다발적인 채팅방 생성 요청을 **안전하고 효율적으로 처리**하는 방법을 보여줍니다. Redis Queue는 분산 환경에서 **락(Lock) 또는 세마포어(Semaphore)와 유사한 역할**을 수행하여, 오직 하나의 요청만이 임계 영역(Critical Section, 여기서는 채팅방 생성 로직)에 진입하도록 보장합니다. 이를 통해 **데이터 정합성(Consistency)**을 유지하고 중복 채팅방 생성을 효과적으로 방지할 수 있습니다.

다만, 이 코드는 Queue에서 "대표" 요청자를 **선정하는 역할**까지만 수행합니다. 선정된 요청자 정보를 받은 **호출 측**에서는 실제 데이터베이스에 채팅방을 생성하기 전에 **다시 한번 채팅방이 이미 존재하는지 확인**하는 로직(Check-Then-Act)을 추가하는 것이 더욱 안전한 설계가 될 수 있습니다 (Idempotency, 멱등성 고려). 또한, Redis 장애나 네트워크 문제 발생 시의 처리 전략도 고려해야 합니다.
```
