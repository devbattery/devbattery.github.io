---
title: "[Project] Redis Pub/Sub으로 실시간 채팅 구현 - Spring Boot, WebSocket"
excerpt: "movlit, redis, chat, spring, web-socket"

categories:
  - Project
tags:
  - [movlit, redis, chat, spring, web-socket]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-04-07
last_modified_at: 2025-04-07
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 🤔 도전 과제: 확장 가능한 실시간 메시지 전달

1.  **실시간성:** 사용자가 보낸 메시지는 가능한 한 지연 없이 다른 참여자들에게 전달되어야 합니다.
2.  **확장성:** 서비스 사용자가 늘어나 서버 인스턴스를 여러 개로 늘렸을 때도, 모든 인스턴스가 메시지를 공유하고 올바르게 전달해야 합니다. 특정 서버에 접속한 사용자에게만 메시지가 가는 문제를 해결해야 합니다.
3.  **디커플링:** 메시지를 보내는 로직(Publisher)과 메시지를 받아 처리하는 로직(Subscriber)이 서로 직접적으로 의존하지 않아야 유연한 구조를 유지할 수 있습니다.

## ✨ 해결책: WebSocket + Redis Pub/Sub 아키텍처

1.  **WebSocket (STOMP):** 클라이언트와 서버 간의 실시간 양방향 통신 채널을 제공합니다. STOMP 프로토콜을 사용하면 메시지 구독/발행 모델을 WebSocket 위에서 쉽게 구현할 수 있습니다. (`WebSocketConfig`)
2.  **Redis Pub/Sub:** Redis는 In-memory 데이터 저장소일 뿐만 아니라 강력한 메시징 브로커 기능(Pub/Sub)을 제공합니다. 특정 채널(Topic)에 메시지를 발행(Publish)하면, 해당 채널을 구독(Subscribe)하는 모든 클라이언트(여기서는 우리 애플리케이션 서버 인스턴스들)에게 메시지를 브로드캐스팅합니다. 이를 통해 여러 서버 인스턴스 간의 메시지 공유 문제를 해결합니다.
3.  **애플리케이션 서버:**
    - 클라이언트로부터 WebSocket 메시지를 수신합니다 (`ChatMessageWriteController`).
    - 수신된 메시지를 Redis Pub/Sub 채널에 발행합니다 (`ChatMessageService` -> `RedisMessagePublisher`).
    - Redis Pub/Sub 채널로부터 메시지를 구독합니다 (`RedisListenerConfig` -> `RedisMessageSubscriber`).
    - 구독한 메시지를 해당 채팅방을 구독 중인 WebSocket 클라이언트들에게 전달합니다 (`RedisMessageSubscriber` -> `SimpMessageSendingOperations`).

## 🛠️ 코드 레벨 탐험: Pub/Sub 채팅 구현

### 1. WebSocket 설정 (`WebSocketConfig`)

클라이언트가 접속할 STOMP 엔드포인트(`/ws-stomp`)와 메시지 브로커(`SimpleBroker`, `/topic`)를 설정합니다. 클라이언트가 서버로 메시지를 보낼 때 사용할 prefix (`/app`)도 정의합니다.

```java
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    // ... (Interceptor 주입)

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 메시지 브로커가 /topic 프리픽스를 처리하도록 설정 (구독 경로)
        config.enableSimpleBroker("/topic");
        // 클라이언트 -> 서버 메시지 매핑을 위한 프리픽스 설정
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket (or SockJS) 연결 엔드포인트 설정
        registry.addEndpoint("/ws-stomp")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
    // ... (Inbound Channel Interceptor 설정)
}
```

### 2. 메시지 수신: Controller (`ChatMessageWriteController`)

클라이언트가 `/app/chat/message/one-on-one` 또는 `/app/chat/message/group` 경로로 메시지를 보내면, 이 컨트롤러의 메서드가 호출됩니다. 받은 메시지(`ChatMessageDto`)는 `ChatMessageService`로 전달됩니다.

```java
@RestController
@RequiredArgsConstructor
public class ChatMessageWriteController {

    private final ChatMessageService chatMessageService;

    // 1:1 채팅 메시지 처리 엔드포인트
    @MessageMapping("/chat/message/one-on-one")
    public void sendOneOnOneMessage(@RequestBody ChatMessageDto message) {
        log.info("Received one on one chat message: {}", message);
        chatMessageService.sendMessageForOneOnOne(message);
    }

    // 그룹 채팅 메시지 처리 엔드포인트
    @MessageMapping("/chat/message/group")
    public void sendGroupMessage(@RequestBody ChatMessageDto message) {
        log.info("Received group chat message: {}", message);
        chatMessageService.sendMessageForGroup(message);
    }
}
```

### 3. 메시지 처리 및 발행: Service & Publisher (`ChatMessageService`, `RedisMessagePublisher`)

`ChatMessageService`는 컨트롤러로부터 메시지를 받아 메시지 타입을 설정하고, 중요한 두 가지 작업을 수행합니다.
(1) `produceChatMessage`: 메시지를 Redis *Stream*에 저장하여 영속화합니다 (뒤에서 설명).
(2) `messagePublisher.sendMessage`: 메시지를 Redis _Pub/Sub_ 채널(`sendMessageTopic`)에 발행합니다.

```java
// ChatMessageService.java
@Service
@RequiredArgsConstructor
public class ChatMessageService {
    // ... (Repository, Publisher, RedisTemplate, NotificationUseCase 주입)
    private static final String MESSAGE_QUEUE = "chat_message_queue"; // Stream Key

    @Transactional
    public void sendMessageForOneOnOne(ChatMessageDto chatMessageDto) {
        chatMessageDto.setMessageType(MessageType.ONE_ON_ONE);
        produceChatMessage(chatMessageDto); // 1. Redis Stream에 저장 (영속화)
        messagePublisher.sendMessage(chatMessageDto); // 2. Redis Pub/Sub에 발행 (실시간 전파)
        notificationUsecase.publishOneOnOneChatMessageNotification(chatMessageDto); // 3. 알림 처리
    }
    // ... (sendMessageForGroup 유사)

    // 메시지를 Redis Stream에 추가 (Produce)
    private void produceChatMessage(ChatMessageDto chatMessageDto) {
        // ... redisTemplate.opsForStream().add(...) ...
    }
    // ... (convertToMap)
}

// RedisMessagePublisher.java
@Service
@RequiredArgsConstructor
public class RedisMessagePublisher {
    private final RedisTemplate<String, Object> redisTemplate;
    private final ChannelTopic sendMessageTopic; // "sendMessage" 토픽 주입
    // ... (다른 토픽들)

    public void sendMessage(ChatMessageDto chatMessageDto) {
        log.info("Publishing send message {}", chatMessageDto);
        // 지정된 토픽으로 메시지 발행 (RedisTemplate이 직렬화 처리)
        redisTemplate.convertAndSend(sendMessageTopic.getTopic(), chatMessageDto);
    }
    // ... (다른 발행 메서드들)
}
```

### 4. Redis Pub/Sub 리스너 설정 (`RedisListenerConfig`)

어떤 Redis 채널(Topic)을 구독하고, 메시지가 도착했을 때 어떤 Subscriber의 어떤 메서드를 호출할지 설정합니다. `RedisMessageListenerContainer`가 이 연결을 관리합니다.

```java
@Configuration
@RequiredArgsConstructor
public class RedisListenerConfig {
    private final RedisMessageSubscriber subscriber; // 메시지 처리 Subscriber
    // ... (다른 Subscriber, Topic Bean 정의)

    @Bean
    public ChannelTopic sendMessageTopic() {
        return new ChannelTopic("sendMessage"); // "sendMessage" 채널 정의
    }

    // "sendMessage" 토픽 메시지를 처리할 어댑터 설정
    @Bean
    public MessageListenerAdapter listenerAdapterSendMessage() {
        // subscriber 객체의 "sendMessage" 메서드를 호출하도록 설정
        return new MessageListenerAdapter(subscriber, "sendMessage");
    }

    // Redis 리스너 컨테이너 설정
    @Bean
    public RedisMessageListenerContainer redisMessageListener(
            RedisConnectionFactory redisConnectionFactory,
            MessageListenerAdapter listenerAdapterSendMessage, // 위에서 정의한 어댑터
            ChannelTopic sendMessageTopic // 위에서 정의한 토픽
            // ... (다른 어댑터 및 토픽들)
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(redisConnectionFactory);
        // "sendMessage" 토픽에 대한 리스너 등록
        container.addMessageListener(listenerAdapterSendMessage, sendMessageTopic);
        // ... (다른 토픽 리스너 등록)
        return container;
    }
}
```

### 5. 메시지 수신 및 WebSocket 전송: Subscriber (`RedisMessageSubscriber`)

`RedisListenerConfig`에 의해 "sendMessage" 채널에 메시지가 도착하면 `RedisMessageSubscriber`의 `sendMessage` 메서드가 호출됩니다.
이 메서드는 Redis로부터 받은 메시지(직렬화된 문자열)를 다시 `ChatMessageDto` 객체로 변환하고, `SimpMessageSendingOperations`를 사용하여 해당 채팅방을 구독하고 있는 WebSocket 클라이언트들에게 메시지를 전송합니다. `/topic/chat/message/...` 경로로 전송된 메시지는 클라이언트의 STOMP 구독 로직에 의해 수신됩니다.

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class RedisMessageSubscriber {

    private final ObjectMapper objectMapper; // JSON 직렬화/역직렬화
    private final SimpMessageSendingOperations messagingTemplate; // WebSocket 메시지 전송용
    // ... (RedisTemplate 등)

    /**
     * Redis에서 "sendMessage" 토픽으로 메시지가 발행되면 호출됨
     */
    public void sendMessage(String publishMessage) {
        try {
            // 1. 수신된 JSON 문자열을 DTO로 역직렬화
            ChatMessageDto chatMessageDto = objectMapper.readValue(publishMessage, ChatMessageDto.class);

            String destination;
            // 2. 메시지 타입에 따라 WebSocket 전송 목적지 설정
            if (chatMessageDto.getMessageType() == MessageType.ONE_ON_ONE) {
                destination = "/topic/chat/message/one-on-one/" + chatMessageDto.getRoomId();
            } else if (chatMessageDto.getMessageType() == MessageType.GROUP) {
                destination = "/topic/chat/message/group/" + chatMessageDto.getRoomId();
            } else {
                throw new ContentTypeNotExistException();
            }

            log.info("메시지 전송 -> Destination: {}, Payload: {}", destination, chatMessageDto);
            // 3. 해당 목적지를 구독 중인 WebSocket 클라이언트에게 메시지 전송
            messagingTemplate.convertAndSend(destination, chatMessageDto);

        } catch (Exception e) {
            log.error("Exception {}", e);
        }
    }
    // ... (updateRoom, createOneononeChatroom 등 다른 구독 메서드)
}
```

### 6. 메시지 영속화: Redis Stream 활용 (`ChatMessageStreamListener`, `ChatMessageConsumer`)

Redis Pub/Sub은 메시지를 구독자에게 전달하면 해당 메시지를 보관하지 않습니다. 만약 메시지를 받는 Subscriber 서버가 다운되어 있거나, 네트워크 문제로 메시지를 유실하면 복구할 방법이 없습니다. 또한, 채팅 내역 조회를 위해서는 메시지를 영구적으로 저장해야 합니다.

이를 위해 저희는 Redis **Stream**을 병행하여 사용합니다.

1.  `ChatMessageService`에서 Pub/Sub 발행과 **동시에** 메시지를 Redis Stream (`chat_message_queue`)에 `XADD` 명령어로 추가합니다 (`produceChatMessage`). Redis Stream은 추가된 메시지를 영구적으로 보관합니다.
2.  별도의 Consumer (`ChatMessageConsumer`, `ChatMessageStreamListener`)가 이 Stream을 구독합니다.
3.  Stream Listener는 메시지를 받아 MongoDB에 저장 (`saveMessageToMongoDB`)하고, 처리가 완료되면 `XACK` 명령어로 Redis에게 메시지를 성공적으로 처리했음을 알립니다 (`acknowledgeMessage`).

이렇게 함으로써 실시간 메시지 전달은 Pub/Sub으로 빠르게 처리하고, 메시지 영속화 및 안정적인 처리는 Stream을 통해 보장합니다.

```java
// ChatMessageStreamListener.java (implements StreamListener)
@Component
@Slf4j
@RequiredArgsConstructor
public class ChatMessageStreamListener implements StreamListener<String, MapRecord<String, String, String>> {

    private final ChatMessageRepository chatMessageRepository; // MongoDB Repository
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void onMessage(MapRecord<String, String, String> message) {
        try {
            ChatMessageDto chatMessageDto = convertFromMap(message.getValue()); // Stream 데이터 변환
            saveMessageToMongoDB(chatMessageDto); // MongoDB에 저장
            acknowledgeMessage(message); // Redis Stream에 Ack 전송
        } catch (Exception e) {
            log.error("메시지 처리 중 예외 발생: {}", e);
        }
    }
    // ... (acknowledgeMessage, saveMessageToMongoDB, convertFromMap)
}
```

## 👍 얻게 된 효과

1.  **실시간 통신:** WebSocket과 Redis Pub/Sub의 조합으로 지연 시간이 짧은 메시지 전달이 가능해졌습니다.
2.  **수평 확장:** 애플리케이션 서버 인스턴스가 여러 개로 늘어나도 Redis Pub/Sub이 중앙 메시지 브로커 역할을 하여 모든 인스턴스가 메시지를 공유하고 클라이언트에게 전달할 수 있습니다.
3.  **느슨한 결합:** 메시지 발행 로직과 구독 로직이 Redis를 통해 분리되어 시스템의 유연성과 유지보수성이 향상되었습니다.
4.  **메시지 영속성 및 안정성:** Redis Stream을 병행 사용하여 메시지를 안정적으로 MongoDB에 저장하고 유실 가능성을 줄였습니다.

## 🤔 추가 고려사항

- **Redis 의존성:** Redis 서버의 안정성이 중요해집니다. (고가용성 구성 필요)
- **메시지 순서:** Redis Pub/Sub은 엄격한 메시지 순서를 보장하지 않습니다. 대부분의 채팅 시나리오에서는 큰 문제가 되지 않지만, 순서 보장이 중요하다면 Kafka나 Redis Stream의 Consumer Group 기능 등을 더 깊게 고려해야 할 수 있습니다.
- **직렬화:** Redis에 객체를 저장하고 Pub/Sub으로 전달하기 위해 효율적이고 안정적인 직렬화 방식(여기서는 Jackson JSON)을 선택하고 일관되게 사용해야 합니다. `RedisConfig`에서 `ObjectMapper` 설정을 통해 Java 8 날짜/시간 타입 등을 올바르게 처리하도록 설정했습니다.
