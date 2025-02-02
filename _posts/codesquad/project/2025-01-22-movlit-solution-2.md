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

date: 2025-01-22
last_modified_at: 2025-01-27
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 서론

Movlit 프로젝트는 채팅방 기능을 제공합니다. 그 중 그룹 채팅 방을 생성하는 기능이 있습니다.  
그룹 채팅 방은 하나의 컨텐츠당 하나의 방만 존재해야 하기 때문에, 동시성 해결이 꼭 필요했습니다.

## 동시성 문제 해결 전략

`GroupChatroomCreationWorker`는 여러 사용자가 동시에 그룹 채팅방 생성을 요청할 때 발생할 수 있는 동시성 문제를 효과적으로 해결합니다. 이 클래스는 Redis의 리스트 자료구조와 Java의 `ThreadPoolExecutor`를 활용하여 비동기적으로 작업을 처리하고, 이를 통해 동시성 문제를 해결합니다.

### 전체 코드

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class GroupChatroomCreationWorker {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ThreadPoolExecutor threadPoolExecutor;

    private static final String GROUP_CHATROOM_QUEUE_KEY_PREFIX = "groupChatroomQueue:";

    public Optional<Map<String, String>> requestChatroomCreation(String contentId) {
        // 스레드 풀을 사용하여 비동기 작업 실행
        Future<Optional<Map<String, String>>> future = threadPoolExecutor.submit(() -> {
            String queueKey = GROUP_CHATROOM_QUEUE_KEY_PREFIX + contentId;

            while (true) {
                // Redis Queue에서 memberId를 value로 꺼내옴 (RPOP)
                Object memberIdObject = redisTemplate.opsForList().rightPop(queueKey);

                if (memberIdObject == null) {
                    // 큐가 비어있으면 빈 Optional 반환
                    return Optional.empty();
                }

                if (!(memberIdObject instanceof String memberId)) {
                    log.error("Invalid memberId type for contentId: {}. Expected String, but got: {}", contentId,
                            memberIdObject.getClass().getName());
                    continue;
                }

                // contentId와 memberId를 Map에 담아서 Optional로 감싸서 반환
                Map<String, String> resultMap = new HashMap<>();
                resultMap.put(contentId, memberId);
                return Optional.of(resultMap);
            }
        });

        try {
            // 비동기 작업 결과 가져오기
            return future.get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error while getting result from worker thread", e);
            throw new GroupChatroomCreationWhenWorkingException();
        }
    }
}
```

```java
// Worker 스레드에게 작업 요청 및 결과 수신
// 만약, 늦게 요청한 멤버들이라면 response는 null 데이터를 담고 있게 되는 거임
Optional<Map<String, String>> responseOpt = worker.requestChatroomCreation(contentId);
Map<String, String> response = getPureResponse(responseOpt);
```

### 1. Redis Queue를 활용한 요청 관리

`GroupChatroomCreationWorker`는 Redis의 리스트를 큐(Queue)로 사용하여 그룹 채팅방 생성 요청을 관리합니다.

- **요청 저장**: 사용자가 그룹 채팅방 생성을 요청하면, `GroupChatroomService`는 해당 사용자의 `memberId`를 Redis 큐에 `leftPush`합니다. 이 큐의 키는 `GROUP_CHATROOM_QUEUE_KEY_PREFIX`와 `contentId`를 조합하여 생성됩니다.

  ```java
  // GroupChatroomService.java

  String queueKey = GROUP_CHATROOM_QUEUE_KEY_PREFIX + contentId;
  redisTemplate.opsForList().leftPush(queueKey, memberId.getValue());
  ```

- **요청 처리**: `GroupChatroomCreationWorker`는 별도의 스레드에서 Redis 큐를 지속적으로 모니터링하며, 새로운 요청이 들어오면 `rightPop`을 통해 `memberId`를 가져와 처리합니다.

  ```java
  // GroupChatroomCreationWorker.java

  Object memberIdObject = redisTemplate.opsForList().rightPop(queueKey);
  ```

### 2. ThreadPoolExecutor를 사용한 비동기 처리

`GroupChatroomCreationWorker`는 `ThreadPoolExecutor`를 사용하여 그룹 채팅방 생성 요청을 비동기적으로 처리합니다.

- **비동기 작업 실행**: `requestChatroomCreation` 메서드는 `threadPoolExecutor.submit()`을 통해 채팅방 생성 로직을 비동기적으로 실행합니다. 이 로직은 Redis 큐에서 `memberId`를 가져와 그룹 채팅방을 생성하는 작업을 포함합니다.

  ```java
  // GroupChatroomCreationWorker.java

  Future<Optional<Map<String, String>>> future = threadPoolExecutor.submit(() -> {
      // ... 채팅방 생성 로직 ...
  });
  ```

- **결과 반환**: `future.get()`을 통해 비동기 작업의 결과를 가져옵니다. 이 결과는 `contentId`와 `memberId`를 포함하는 `Map` 객체입니다.

  ```java
  // GroupChatroomCreationWorker.java

  try {
      return future.get();
  } catch (InterruptedException | ExecutionException e) {
      // ... 예외 처리 ...
  }
  ```

### 3. 동시성 문제 해결 전략

`GroupChatroomCreationWorker`의 동시성 문제 해결 전략은 다음과 같습니다.

- **Redis 큐를 통한 순차 처리**: Redis의 리스트는 FIFO(First-In, First-Out) 큐로 동작합니다. 이를 통해 여러 사용자의 요청이 순차적으로 처리되도록 보장합니다. `leftPush`로 요청을 큐에 추가하고, `rightPop`으로 큐에서 요청을 가져와 처리함으로써, 요청이 들어온 순서대로 처리됩니다.
- **비동기 처리를 통한 응답성 향상**: `ThreadPoolExecutor`를 사용하여 채팅방 생성 요청을 비동기적으로 처리함으로써, 사용자는 요청 후 즉시 응답을 받을 수 있습니다. 이는 사용자 경험을 향상시키고, 시스템의 전반적인 응답성을 높입니다.
- **스레드 안전성**: Redis는 싱글 스레드로 동작하기 때문에, Redis 큐에 대한 연산은 원자적(atomic)입니다. 따라서 여러 스레드가 동시에 Redis 큐에 접근하더라도 데이터의 일관성이 보장됩니다. 또한, `ThreadPoolExecutor`는 내부적으로 스레드 안전성을 보장하므로, 여러 스레드가 동시에 작업을 수행하더라도 동시성 문제가 발생하지 않습니다.

## 결론

`GroupChatroomCreationWorker`는 Redis 큐와 `ThreadPoolExecutor`를 활용하여 그룹 채팅방 생성 요청을 효율적으로 처리하고, 동시성 문제를 해결합니다. 이를 통해 여러 사용자가 동시에 채팅방 생성을 요청하더라도 시스템의 안정성과 응답성을 유지할 수 있습니다.
