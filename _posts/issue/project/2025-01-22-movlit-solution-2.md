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
last_modified_at: 2025-02-08
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 서론

Movlit 서비스에서는 **한 컨텐츠당 하나의 그룹 채팅방**만 생성되도록 구현되어 있습니다.

인기 영화나 책이 공개되자마자 수많은 사용자가 동시에 “채팅방 만들기” 버튼을 누를 경우, 서버가 요청을 감당하지 못해 여러 채팅방이 생성될 수 있습니다.

이를 해결하기 위해 **Worker 클래스**를 도입하였습니다.

Worker 클래스는 **Redis Queue**와 **Thread Pool**을 활용하여 채팅방 생성 요청을 **비동기적으로 처리**합니다.

## 전체 코드

```java
package movlit.be.chat_room.application.service;

@Component
@RequiredArgsConstructor
@Slf4j
public class GroupChatroomCreationWorker {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ThreadPoolExecutor threadPoolExecutor;

    private static final String GROUP_CHATROOM_QUEUE_KEY_PREFIX = "groupChatroomQueue:";

    public Optional<Map<String, String>> requestChatroomCreation(String contentId) {
        Callable<Optional<Map<String, String>>> task = () -> {
            String queueKey = GROUP_CHATROOM_QUEUE_KEY_PREFIX + contentId;

            Object memberIdObject = redisTemplate.opsForList()
                    .rightPop(queueKey, 10, TimeUnit.SECONDS);

            if (memberIdObject instanceof String memberId) {
                return makeResultMap(contentId, memberId);
            }

            return Optional.empty();
        };

        try {
            Future<Optional<Map<String, String>>> future = threadPoolExecutor.submit(task);
            return future.get(30, TimeUnit.SECONDS);

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }

            throw new GroupChatroomCreationWhenWorkingException();
        }
    }

    private Optional<Map<String, String>> makeResultMap(String contentId, String memberId) {
        Map<String, String> resultMap = new HashMap<>();
        resultMap.put(contentId, memberId);
        return Optional.of(resultMap);
    }

}
```

### 주요 처리 과정

- **Callable 인터페이스 활용**
    - 비동기 작업을 정의하여 Redis에서 데이터를 가져오는 작업을 처리합니다.
- **Redis Queue Key 생성**
    - Key Prefix와 contentId를 조합하여 Redis Queue의 Key를 생성합니다.
- **데이터 조회**
    - `rightPop()`메서드를 사용하여 가장 오래된 생성 요청을 최대 10초 동안 대기하며 가져옵니다.
    - 만약 데이터가 없거나 의도한 String 형태가 아니라면 empty를 반환합니다.
    - 정상적인 String 데이터라면 contentId와 memberId를 Map 형태로 반환합니다.
- **Future를 통한 결과 처리**
    - ThreadPoolExecutor의`submit()`메서드를 통해 Callable task를 비동기 실행하고, Future 객체로 결과를 관리합니다.
    - `future.get(30초)`를 호출하여 작업 완료를 기다리며, 30초 내에 완료되지 않으면 TimeoutException이 발생합니다.
    - **예외 처리:**
        - **InterruptedException:** 스레드가 인터럽트될 경우 현재 스레드의 인터럽트 상태를 재설정합니다.
        - **ExecutionException:** Callable 실행 중 예외 발생 시 처리합니다.
        - **TimeoutException:** 작업이 30초 안에 완료되지 않으면 발생합니다.
        - 위 세 가지 예외 발생 시,`GroupChatroomCreationWhenWorkingException`을 발생시켜 채팅방 생성 요청 처리 중 문제가 있음을 알립니다.
