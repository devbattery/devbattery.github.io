---
title: "[Project] Redis Pub/Sub으로 실시간 알림 구현 - SSE"
excerpt: "movlit, redis, chat, spring, web-socket, pubsub, realtime"

categories:
  - Project
tags:
  - [movlit, redis, chat, spring, web-socket, pubsub, realtime]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-04-09
last_modified_at: 2025-04-24
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## Redis Pub/Sub 사용 이유

"실시간 알림? 그거 그냥 클라이언트가 주기적으로 서버에 물어보면(Polling) 안 돼?" 라고 생각할 수도 있습니다. 하지만 사용자가 많아지면 서버에 부담이 엄청나게 될 겁니다.

이럴 때 **Pub/Sub (Publish/Subscribe)** 모델이 아주 유용합니다.

- **Publish (발행):** 알림을 보내야 하는 이벤트가 발생하면, 특정 '채널(토픽)'에 메시지를 던집니다. (예: "notification" 채널에 알림 메시지 발행)
- **Subscribe (구독):** 이 채널을 '구독'하고 있는 애들이 메시지를 받아서 처리합니다.

**Redis Pub/Sub**는 이 패턴을 정말 쉽고 빠르게 구현할 수 있게 도와줍니다. 메시지를 발행하는 쪽(Publisher)과 구독하는 쪽(Subscriber)이 서로를 몰라도 괜찮아요. 그냥 Redis라는 중간 우체통에 메시지를 넣고 빼기만 하면 됩니다.

## 전체 알림 흐름 

1.  **이벤트 발생:** 사용자가 채팅 메시지를 보내거나, 다른 사용자를 팔로우하는 등 알림을 발생시킬 이벤트가 생깁니다
2.  **알림 생성 및 발행 (`NotificationUseCase`, `RedisNotificationPublisher`):**
    - 서버는 이 이벤트를 감지하고, 누구에게 어떤 알림을 보낼지 결정합니다.(`NotificationDto` 생성)
    - 만들어진 알림 메시지를 Redis의 특정 채널(`"notification"`)에 발행(Publish)합니다.
3.  **Redis:** 발행된 메시지를 해당 채널을 구독 중인 모든 Subscriber에게 전달해요.
4.  **메시지 수신 및 처리 (`RedisNotificationSubscriber`):**
    - `"notification"` 채널을 구독하고 있던 `RedisNotificationSubscriber`가 메시지를 받습니다.
    - 받은 메시지(JSON 형태)를 `NotificationDto` 객체로 변환합니다.
5.  **클라이언트에게 전송 (`SseEmitterService`):**
    - `RedisNotificationSubscriber`는 `SseEmitterService`를 통해 해당 알림을 받아야 할 사용자에게 SSE 연결로 실시간 전송합니다.
6.  **클라이언트:** SSE 연결을 통해 받은 알림을 화면에 표시합니다.

## 1. 알림 메시지 발행하기 (Publisher)

어떤 이벤트가 발생했을 때, 알림을 만들어 Redis에 던져주는 역할이에요. `NotificationUseCase`와 `RedisNotificationPublisher`가 이 일을 담당합니다.

**`NotificationUseCase` (일부)**:

```java
// 예시: 일대일 채팅 메시지 알림 발행 로직
public void publishOneOnOneChatMessageNotification(ChatMessageDto chatMessageDto) {
    // ... (메시지 받을 사람, 보낸 사람 닉네임 등 정보 조회)

    // 알림 메시지 생성 (누구에게, 어떤 내용, 타입, 클릭 시 이동할 URL 등)
    NotificationDto notification = makeOneOnOneNotificationDto(
            chatMessageDto, roomInfo, senderNickname
    );

    // 실제 처리 로직 호출
    processForOneOnOne(notification);
}

private void processForOneOnOne(NotificationDto notification) {
    // 1. Redis에 알림 발행 (SSE 전송 트리거)
    redisNotificationPublisher.publishNotification(notification);

    // 2. MongoDB에 알림 저장 (나중에 목록 보기용)
    notificationService.saveNotification(notification);
}
```

`NotificationUseCase`는 어떤 이벤트(여기서는 채팅 메시지 수신)에 대해 누구에게(수신자 ID), 어떤 내용의(`NotificationMessage` 활용) 알림(`NotificationDto`)을 보낼지 결정하고 만들어요. 그리고 `processForOneOnOne` (또는 그룹 채팅의 경우 `processForGroup`) 메소드를 호출합니다.

여기서 중요한 두 가지!

1.  `redisNotificationPublisher.publishNotification(notification)`: 실제 Redis에 알림을 발생합니다.
2.  `notificationService.saveNotification(notification)`: 나중에 사용자가 알림 목록을 볼 수 있도록 MongoDB 같은 데이터베이스에 저장합니다.

**`RedisNotificationPublisher`**:

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisNotificationPublisher {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ChannelTopic notificationTopic; // "notification" 토픽

    /**
     * 알림 보내기(notification) 토픽 발행하는 메서드
     */
    public void publishNotification(NotificationDto notificationDto) {
        log.info("Publishing notification {}", notificationDto);
        // redisTemplate을 사용해 지정된 토픽에 메시지를 발행!
        redisTemplate.convertAndSend(notificationTopic.getTopic(), notificationDto);
    }
}
```

`RedisNotificationPublisher`는 정말 간단해요! `RedisTemplate`을 이용해서 `notificationTopic` (이름이 "notification"인 채널)에 `NotificationDto` 객체를 슝~ 하고 던져줍니다. `RedisTemplate`이 내부적으로 객체를 직렬화해서 보내줘요.

## 2. 리스너 설정하기 (`RedisListenerConfig`)

자, 이제 누군가가 "notification" 채널에 메시지를 던졌을 때, 그걸 받아서 처리할 준비를 해야겠죠? `RedisListenerConfig`에서 이 설정을 담당해요.

```java
@Configuration
@RequiredArgsConstructor
public class RedisListenerConfig {

    // 알림 메시지를 처리할 Subscriber 주입
    private final RedisNotificationSubscriber notificationSubscriber;
    // (채팅 관련 Subscriber도 있지만 여기서는 생략)

    /**
     * 알림용 Topic 빈 설정
     */
    @Bean
    public ChannelTopic notificationTopic() {
        return new ChannelTopic("notification"); // "notification" 이라는 이름의 채널 토픽
    }

    // (다른 채팅 관련 토픽 빈 설정 생략)

    /**
     * 알림 메시지를 처리하는 subscriber 설정 추가
     */
    @Bean
    public MessageListenerAdapter listenerAdapterNotification() {
        // notificationSubscriber 객체의 "onNotification" 메소드를 호출하도록 설정
        return new MessageListenerAdapter(notificationSubscriber, "onNotification");
    }

    // (다른 리스너 어댑터 설정 생략)

    /**
     * redis 에 발행(publish)된 메시지 처리를 위한 리스너 컨테이너 설정
     */
    @Bean
    public RedisMessageListenerContainer redisMessageListener(
            RedisConnectionFactory redisConnectionFactory,
            MessageListenerAdapter listenerAdapterNotification, // 알림 리스너 어댑터
            ChannelTopic notificationTopic // 알림 토픽
            // (다른 어댑터와 토픽들도 주입받지만 생략)
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(redisConnectionFactory);

        // "notificationTopic"에 메시지가 오면 "listenerAdapterNotification"을 실행!
        container.addMessageListener(listenerAdapterNotification, notificationTopic);

        // (다른 토픽-어댑터 연결 설정 생략)
        return container;
    }
}
```

- `ChannelTopic("notification")`: "notification"이라는 이름의 Redis 채널을 사용할 거라고 스프링에 알려줍니다.
- `MessageListenerAdapter(notificationSubscriber, "onNotification")`: "notification" 채널에 메시지가 오면, `notificationSubscriber`라는 빈(Bean)의 `onNotification` 메소드를 실행하라고 알려줍니다.
- `RedisMessageListenerContainer`: 이 컨테이너가 실제로 Redis에 연결해서 특정 채널(`notificationTopic`)을 계속 지켜보고 있다가, 메시지가 오면 연결된 어댑터(`listenerAdapterNotification`)를 실행시켜주는 역할을 합니다.

## 3. 메시지 수신 및 처리하기 (Subscriber)

이제 "notification" 채널을 구독하고 있다가 메시지가 오면 실제로 무언가를 하는 `RedisNotificationSubscriber`를 볼 차례입니다.

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class RedisNotificationSubscriber {

    private final ObjectMapper objectMapper; // JSON <-> 객체 변환기
    private final SseEmitterService sseEmitterService; // SSE 전송 서비스

    /**
     * Redis에서 알림 메시지가 발행(publish)되면 실행되는 메소드
     */
    public void onNotification(String publishMessage) { // Redis로부터 받은 메시지 (JSON 문자열)
        try {
            // 1. 받은 JSON 문자열을 NotificationDto 객체로 변환
            NotificationDto notificationDto = objectMapper.readValue(publishMessage, NotificationDto.class);
            log.info("Received notificationDto: {}", notificationDto);

            // 2. SseEmitterService를 통해 해당 사용자에게 알림 전송 요청
            // notificationDto.getId()는 알림을 받을 사용자의 ID
            sseEmitterService.sendNotification(notificationDto.getId(), notificationDto);

        } catch (Exception e) {
            log.error("Exception in onNotification {}", e);
        }
    }
}
```

`RedisListenerConfig`에서 설정한 대로, "notification" 채널에 메시지가 발행되면 이 `onNotification` 메소드가 호출됩니다.

1.  Redis는 메시지를 보통 문자열(여기서는 JSON 형태)로 전달해 줍니다. `ObjectMapper`를 사용해서 이 JSON 문자열을 우리가 다루기 쉬운 `NotificationDto` 객체로 다시 변환합니다.
2.  가장 중요한 부분! 변환된 `notificationDto`를 `SseEmitterService`에게 넘겨주면서, "이 알림(`notificationDto`)을 이 사용자(`notificationDto.getId()`)에게 SSE로 보내줘!" 라고 요청합니다.

## 4. 클라이언트에게 실시간 전송하기 (SSE)

마지막 퍼즐 조각은 `SseEmitterService`와 `NotificationController`입니다. 클라이언트와 서버 간의 실시간 연결을 관리하고, 실제로 알림 데이터를 보내는 역할을 합니다.

**`NotificationController` (SSE 구독 엔드포인트)**:

```java
@RestController
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final SseEmitterService sseEmitterService;
    // ... (NotificationService 주입 등)

    // 클라이언트가 SSE 연결을 요청하는 엔드포인트
    @GetMapping(value = "/api/subscribe/{id}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> subscribe(@PathVariable String id) {
        // 사용자의 ID (id)를 기반으로 SseEmitter 객체를 생성하고 관리 시작
        SseEmitter emitter = sseEmitterService.addEmitter(id);
        // 생성된 emitter를 클라이언트에게 반환 (이걸 통해 서버가 데이터를 보냄)
        return ResponseEntity.ok().body(emitter);
    }

    // ... (알림 목록 조회, 삭제 등 다른 API 생략)
}
```

클라이언트(브라우저)는 로그인 후 자신의 ID를 포함하여 `/api/subscribe/{id}` 경로로 GET 요청을 보내요. 그러면 서버는 `SseEmitterService`를 통해 해당 사용자를 위한 `SseEmitter` 객체를 생성하고, 이 객체를 응답으로 돌려줘요. 이 `SseEmitter`가 바로 서버와 클라이언트 간의 실시간 통신 채널이 되는 거죠!

**`SseEmitterService` (주요 로직)**:

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class SseEmitterService {

    // 사용자 ID별 SseEmitter 객체를 저장하는 맵
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    // ... (하트비트, 타임아웃, 스레드풀 관련 설정 생략)

    // 새로운 SSE 연결 추가
    public SseEmitter addEmitter(String id) {
        // SseEmitter 객체 생성 (타임아웃 설정 등)
        SseEmitter emitter = createSseEmitter(id);

        try {
            // 연결 성공 초기 메시지 전송
            emitter.send(SseEmitter.event().name("connect").data("connected!"));
            emitters.put(id, emitter); // 맵에 사용자 ID와 emitter 저장
            // ... (하트비트 스케줄링 등)
        } catch (IOException e) {
            // ... (에러 처리)
        }
        return emitter;
    }

    // RedisSubscriber로부터 호출되어 실제 알림을 보내는 메소드
    public void sendNotification(String id, NotificationDto notification) {
        // 비동기 실행 (응답을 기다리지 않음)
        threadPoolTaskExecutor.submit(() -> {
            // 해당 ID의 사용자에 대한 SseEmitter를 맵에서 찾음
            SseEmitter emitter = emitters.get(id);
            if (emitter != null) {
                try {
                    // 찾은 emitter를 통해 notification 데이터를 클라이언트로 전송!
                    emitter.send(SseEmitter.event()
                            .name("notification") // 이벤트 이름 (클라이언트에서 구분용)
                            .data(notification)); // 실제 알림 데이터
                } catch (IOException e) {
                    log.error("알림 전송 실패: {}", id, e);
                    // 실패 시 emitter 제거 등 후처리
                    completeEmitter(id, e);
                }
            }
        });
    }

    // ... (createSseEmitter, scheduleHeartbeat, completeEmitter 등 연결 관리 메소드들)
}
```

`SseEmitterService`는 조금 복잡해 보이지만 핵심은 이겁니다.

- `addEmitter(id)`: 클라이언트가 구독 요청을 하면, 해당 사 용자 ID(`id`)에 대한 `SseEmitter` 객체를 만들고 내부 `emitters` 맵에 저장하고, 이 객체가 클라이언트와의 연결 통로입니다.
- `sendNotification(id, notification)`: `RedisNotificationSubscriber`가 이 메소드를 호출하면, `emitters` 맵에서 알림을 받을 사용자 ID(`id`)에 해당하는 `SseEmitter`를 찾습니다. 그리고 찾은 `emitter`의 `send()` 메소드를 사용해서 `NotificationDto` 데이터를 클라이언트에게 실시간으로 보내줍니다. 이때 이벤트 이름으로 `"notification"`을 지정해서, 클라이언트가 어떤 종류의 데이터인지 알 수 있게 해주었습니다.

## 정리

- **Redis Pub/Sub:** 메시지를 발행(Publish)하고 구독(Subscribe)하는 간단한 방식으로 Publisher와 Subscriber를 분리(Decoupling)해서 시스템을 유연하게 만들었습니다.
- **SSE (Server-Sent Events):** 서버가 클라이언트에게 단방향으로 데이터를 쉽게 Push하고, WebSocket보다 가볍고 구현이 간편하다는 장점도 있습니다.
