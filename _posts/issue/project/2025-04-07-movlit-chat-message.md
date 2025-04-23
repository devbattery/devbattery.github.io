---
title: "[Project] Redis Pub/Sub으로 실시간 채팅 구현 - Spring Boot, WebSocket"
excerpt: "movlit, redis, chat, spring, web-socket, pubsub, realtime"

categories:
  - Project
tags:
  - [movlit, redis, chat, spring, web-socket, pubsub, realtime]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-04-07
last_modified_at: 2025-04-23
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

채팅 메시지가 보내지는 즉시, 정말 "실시간"처럼 다른 사용자들에게 지연을 최소화하여 날아가야 합니다.  
서비스가 흥해서 사용자가 늘어나면 서버도 여러 대로 늘려야 하는데, WebSocket 연결은 특정 서버 인스턴스에 묶여있으니 A 서버에 접속한 사용자와 B 서버에 접속한 사용자 간에 어떻게 메시지를 주고받게 할 수 있을지 고민이 생길 수밖에 없습니다. A 서버에서 받은 메시지가 B 서버 사용자에게도 가야 하니까요.  
메시지를 보내는 녀석(Publisher)과 받아서 처리하는 녀석(Subscriber)이 서로 너무 끈끈하게 엮여있으면 나중에 기능을 추가하거나 변경하기 어려워지니, 좀 더 느슨하게 연결하고 싶었습니다.

## 해결책

이 고민들을 해결하기 위해 **WebSocket**과 **Redis Pub/Sub**을 같이 도입하였습니다.

1.  **WebSocket (with STOMP)**

    - 클라이언트(웹/앱)와 서버 간의 **실시간 양방향 통신** 길을 열어줍니다. 한 번 연결되면 계속 유지되면서 데이터를 주고받을 수 있습니다.
    - **STOMP** 프로토콜을 함께 사용하면, 특정 "주소"(/topic/...)를 구독(Subscribe)하고, 그 주소로 메시지를 발행(Publish)하는 모델을 WebSocket 위에서 쉽게 구현할 수 있습니다.

2.  **Redis Pub/Sub**

    - Redis는 빠른 In-memory 데이터 저장소로 유명하지만, **메시징 브로커** 기능(Pub/Sub)도 가지고 있습니다.
    - 마치 라디오 방송국처럼, 특정 채널(Topic)에 메시지를 발행(Publish)하면, 그 채널을 구독(Subscribe)하고 있는 모든 청취자(애플리케이션 서버 인스턴스)에게 메시지가 **동시에 쫙 뿌려집니다(Broadcast)**.
      - 즉, A 서버든 B 서버든 이 채널만 구독하고 있으면, 누가 메시지를 발행하든 모든 서버가 받아서 각자 연결된 클라이언트에게 전달해줄 수 있게 됩니다.

3.  **애플리케이션 서버**
    - **수신:** 클라이언트로부터 WebSocket(STOMP) 메시지를 받습니다 (`ChatMessageWriteController`).
    - **발행:** 받은 메시지를 Redis의 특정 Pub/Sub 채널로 발행(Publish)합니다 (`ChatMessageService` -> `RedisMessagePublisher`).
    - **구독:** Redis의 Pub/Sub 채널을 구독(Subscribe)하고 있다가 메시지가 도착하면 받아옵니다 (`RedisListenerConfig` -> `RedisMessageSubscriber`).
    - **전달:** Redis로부터 받은 메시지를, 해당 채팅방을 구독 중인 WebSocket 클라이언트들에게 최종적으로 전달합니다 (`RedisMessageSubscriber` -> `SimpMessageSendingOperations`).

## 구현 코드

### 1. WebSocket 길 열기 (`WebSocketConfig`)

클라이언트가 채팅 서버에 접속할 문(Endpoint)을 열고, 메시지를 주고받을 규칙(STOMP)을 정하는 설정입니다.

```java
@Configuration
@EnableWebSocketMessageBroker // WebSocket 메시지 브로커 활성화
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    // ... (Interceptor 주입 등 필요한 의존성)

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // ✅ 메시지 브로커 설정: SimpleBroker 사용
        // "/topic"으로 시작하는 주소(destination)를 구독하는 클라이언트에게 메시지를 전달합니다.
        // 클라이언트가 메시지를 구독할 때 사용할 prefix입니다. (예: /topic/chat/room/1)
        config.enableSimpleBroker("/topic");

        // ✅ 클라이언트 -> 서버 메시지 라우팅 설정
        // 클라이언트가 서버로 메시지를 보낼 때 사용할 prefix입니다.
        // @MessageMapping 어노테이션이 붙은 메서드로 메시지가 라우팅됩니다. (예: /app/chat/message)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // ✅ WebSocket (or SockJS) 연결 엔드포인트 설정
        // 클라이언트가 WebSocket 연결을 생성할 때 사용할 경로입니다. (예: new SockJS("/ws-stomp"))
        registry.addEndpoint("/ws-stomp") // 이 경로로 SockJS 연결 시도
                .setAllowedOriginPatterns("*") // CORS 설정 (실제 운영 시에는 더 제한적으로!)
                .withSockJS(); // SockJS 지원 활성화 (WebSocket 미지원 브라우저 호환)
    }
    // ... (WebSocket 연결 전/후 처리를 위한 Interceptor 설정 부분)
}
```

### 2. 메시지 도착 (`ChatMessageWriteController`)

클라이언트가 `/app/chat/message/...` 경로로 메시지를 보내면, `@MessageMapping` 어노테이션이 붙은 이 컨트롤러 메서드가 딱 잡아서 처리합니다. 받은 메시지는 `ChatMessageService`에게 넘겨주게 됩니다.

```java
@RestController
@RequiredArgsConstructor
@Slf4j // 로그 추가
public class ChatMessageWriteController {

    private final ChatMessageService chatMessageService;

    // 1:1 채팅 메시지 처리 엔드포인트
    // 클라이언트가 "/app/chat/message/one-on-one"으로 메시지 발행 시 호출됨
    @MessageMapping("/chat/message/one-on-one")
    public void sendOneOnOneMessage(@RequestBody ChatMessageDto message) {
        log.info("Received one on one chat message: {}", message);
        // 실제 메시지 처리 로직은 Service 계층에 위임
        chatMessageService.sendMessageForOneOnOne(message);
    }

    // 그룹 채팅 메시지 처리 엔드포인트
    // 클라이언트가 "/app/chat/message/group"으로 메시지 발행 시 호출됨
    @MessageMapping("/chat/message/group")
    public void sendGroupMessage(@RequestBody ChatMessageDto message) {
        log.info("Received group chat message: {}", message);
        chatMessageService.sendMessageForGroup(message);
    }
}
```

### 3. 메시지 처리와 발행 (`ChatMessageService`, `RedisMessagePublisher`)

`ChatMessageService`는 메시지 종류(1:1인지 그룹인지)를 설정하고, 중요한 두 가지 일을 합니다.

1. `produceChatMessage`: 메시지를 **Redis Stream**에 저장해서 **영구 보관**합니다
2. `messagePublisher.sendMessage`: 메시지를 **Redis Pub/Sub 채널**(`sendMessageTopic`)에 발행해서 **실시간으로 전파**합니다.

```java
// ChatMessageService.java
@Service
@RequiredArgsConstructor
public class ChatMessageService {
    // ... (Repository, Publisher, RedisTemplate, NotificationUseCase 등 주입)
    private final RedisMessagePublisher messagePublisher; // Redis Pub/Sub 발행 담당
    private final RedisTemplate<String, Object> redisTemplate; // Redis Stream 저장 등에 사용
    private static final String MESSAGE_QUEUE = "chat_message_queue"; // Stream Key

    @Transactional // 여러 작업을 묶어서 처리
    public void sendMessageForOneOnOne(ChatMessageDto chatMessageDto) {
        chatMessageDto.setMessageType(MessageType.ONE_ON_ONE);
        // 1️⃣ Redis Stream에 메시지 저장 (영속화 & 안정적 처리)
        produceChatMessage(chatMessageDto);
        // 2️⃣ Redis Pub/Sub으로 메시지 발행 (실시간 전파!)
        messagePublisher.sendMessage(chatMessageDto);
        // 3️⃣ (부가 기능) 관련 사용자에게 알림 보내기
        notificationUsecase.publishOneOnOneChatMessageNotification(chatMessageDto);
    }
    // ... (sendMessageForGroup 메서드도 유사하게 구현)

    // 메시지를 Redis Stream에 추가 (Produce)
    private void produceChatMessage(ChatMessageDto chatMessageDto) {
        // ChatMessageDto를 Map으로 변환 (Stream에 저장하기 위해)
        Map<String, String> messageMap = convertToMap(chatMessageDto);
        // redisTemplate을 사용하여 Stream에 데이터 추가 (XADD 명령어 실행)
        redisTemplate.opsForStream().add(MESSAGE_QUEUE, messageMap);
        log.info("Message produced to Redis Stream: {}", chatMessageDto);
    }

    // DTO -> Map 변환 로직 (예시)
    private Map<String, String> convertToMap(ChatMessageDto dto) {
        Map<String, String> map = new HashMap<>();
        map.put("roomId", dto.getRoomId());
        map.put("senderId", String.valueOf(dto.getSenderId()));
        map.put("content", dto.getContent());
        map.put("messageType", dto.getMessageType().name());
        // ... 필요한 필드 추가 ...
        return map;
    }
}

// RedisMessagePublisher.java
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisMessagePublisher {
    private final RedisTemplate<String, Object> redisTemplate;
    // 미리 설정된 ChannelTopic Bean들을 주입받음 (RedisListenerConfig 에서 정의)
    private final ChannelTopic sendMessageTopic;
    // ... (다른 용도의 토픽들도 있을 수 있음)

    // 채팅 메시지를 "sendMessage" 토픽으로 발행하는 메서드
    public void sendMessage(ChatMessageDto chatMessageDto) {
        log.info("Publishing send message to topic {}: {}", sendMessageTopic.getTopic(), chatMessageDto);
        // redisTemplate.convertAndSend:
        // 내부적으로 chatMessageDto 객체를 직렬화 (기본은 JdkSerializationRedisSerializer, 설정 필요)
        // 해서 지정된 토픽(채널)으로 PUBLISH 명령어를 실행합니다.
        redisTemplate.convertAndSend(sendMessageTopic.getTopic(), chatMessageDto);
    }
    // ... (다른 종류의 메시지를 다른 토픽으로 발행하는 메서드들)
}
```

> Redis에 객체(`ChatMessageDto`)를 그대로 저장하거나 Pub/Sub으로 보내려면 **직렬화**가 필요합니다. Java 기본 직렬화는 비효율적이고 다른 언어와 호환도 안 되니, 보통 **Jackson(JSON)**을 많이 씁니다. `RedisConfig` 같은 설정 파일에서 `RedisTemplate`의 Serializer를 `Jackson2JsonRedisSerializer`로 설정해주어야 `ChatMessageDto`가 JSON 형태로 Redis에 저장/전송되고, 나중에 꺼내 쓸 때도(`RedisMessageSubscriber`에서) JSON을 다시 객체로 변환할 수 있습니다.

### Redis 리스너 설정 (`RedisListenerConfig`)

"Redis야, `sendMessage` 채널에 메시지가 왔을 때 나한테 알려줘" 라고 설정하는 부분입니다. `RedisMessageListenerContainer`가 이 연결을 관리하고, 메시지가 오면 지정된 메서드를 호출해줍니다.

```java
@Configuration
@RequiredArgsConstructor
public class RedisListenerConfig {

    // 실제 메시지 처리를 담당할 Subscriber Bean 주입
    private final RedisMessageSubscriber subscriber;
    // ... (다른 Subscriber들도 주입 가능)

    // Pub/Sub 채널(토픽) 정의: "sendMessage"라는 이름의 채널 Bean 생성
    @Bean
    public ChannelTopic sendMessageTopic() {
        return new ChannelTopic("sendMessage");
    }
    // ... (다른 토픽들도 Bean으로 정의)

    // "sendMessage" 토픽에 메시지가 도착했을 때,
    // 어떤 객체의 어떤 메서드를 호출할지 정의하는 어댑터 설정
    @Bean
    public MessageListenerAdapter listenerAdapterSendMessage(RedisMessageSubscriber subscriber) { // 명시적으로 Subscriber 주입
        // subscriber 객체의 "sendMessage" 라는 이름의 메서드를 호출하도록 설정
        // (메서드 이름이 달라도 여기서 지정 가능)
        return new MessageListenerAdapter(subscriber, "sendMessage");
    }
    // ... (다른 토픽/메서드에 대한 어댑터 설정)

    // Redis 메시지 리스너 컨테이너 설정: 실제 구독 로직 수행
    @Bean
    public RedisMessageListenerContainer redisMessageListener(
            RedisConnectionFactory redisConnectionFactory, // Redis 연결 정보
            MessageListenerAdapter listenerAdapterSendMessage, // 위에서 만든 어댑터
            ChannelTopic sendMessageTopic, // 위에서 만든 토픽
            // ... (다른 어댑터와 토픽들도 인자로 받아서 등록)
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(redisConnectionFactory);

        // "sendMessage" 토픽(채널)과 해당 메시지를 처리할 리스너(어댑터)를 연결 (구독!)
        container.addMessageListener(listenerAdapterSendMessage, sendMessageTopic);
        // ... (다른 토픽과 리스너 연결 추가)

        // 에러 핸들러 설정 등 추가 설정 가능
        // container.setErrorHandler(e -> log.error("Redis Listener Error", e));

        return container;
    }
}
```

### Redis에서 메시지 수신 후 WebSocket으로 전송 (`RedisMessageSubscriber`)

Redis Pub/Sub 채널로부터 메시지를 받습니다.  
`RedisListenerConfig` 설정에 따라 "sendMessage" 채널에 메시지가 오면, 이 `RedisMessageSubscriber`의 `sendMessage` 메서드가 호출됩니다.  

Redis로부터 받은 메시지(직렬화된 상태, 보통 JSON 문자열)를 다시 `ChatMessageDto` 객체로 **역직렬화**하고, `SimpMessageSendingOperations`을 이용해서 해당 채팅방(`/topic/chat/message/...`)을 구독하고 있는 **WebSocket 클라이언트들에게** 최종적으로 메시지를 뿌립니다.

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class RedisMessageSubscriber {

    private final ObjectMapper objectMapper; // JSON <-> 객체 변환기
    private final SimpMessageSendingOperations messagingTemplate; // WebSocket 클라이언트에게 메시지 보낼 때 사용
    // ... (RedisTemplate 등 다른 의존성)

    /**
     * Redis "sendMessage" 토픽으로부터 메시지를 수신했을 때 호출될 메서드
     * (MessageListenerAdapter에 의해 호출됨)
     * @param publishMessage Redis로부터 받은 메시지 (직렬화된 상태, 보통 JSON 문자열)
     */
    public void sendMessage(String publishMessage) {
        try {
            // 1️⃣ 수신된 JSON 문자열을 ChatMessageDto 객체로 변환 (역직렬화)
            ChatMessageDto chatMessageDto = objectMapper.readValue(publishMessage, ChatMessageDto.class);
            log.info("Message received from Redis Pub/Sub: {}", chatMessageDto);

            String destination;
            // 2️⃣ 메시지 타입에 따라 클라이언트가 구독할 WebSocket 목적지 주소 결정
            if (chatMessageDto.getMessageType() == MessageType.ONE_ON_ONE) {
                // 예: /topic/chat/message/one-on-one/room_uuid_123
                destination = "/topic/chat/message/one-on-one/" + chatMessageDto.getRoomId();
            } else if (chatMessageDto.getMessageType() == MessageType.GROUP) {
                // 예: /topic/chat/message/group/group_room_456
                destination = "/topic/chat/message/group/" + chatMessageDto.getRoomId();
            } else {
                log.warn("Unknown message type received: {}", chatMessageDto.getMessageType());
                // 혹은 적절한 예외 처리
                throw new IllegalArgumentException("Unknown message type");
            }

            log.info("Sending message to WebSocket clients -> Destination: {}, Payload: {}", destination, chatMessageDto);
            // 3️⃣ 해당 목적지(destination)를 구독 중인 모든 WebSocket 클라이언트에게 메시지 전송!
            // messagingTemplate.convertAndSend(destination, payload):
            // 내부적으로 payload 객체를 메시지 형식(보통 JSON)으로 변환하여
            // STOMP 브로커를 통해 해당 destination을 구독하는 클라이언트들에게 전달합니다.
            messagingTemplate.convertAndSend(destination, chatMessageDto);

        } catch (Exception e) {
            // JSON 파싱 실패, 메시지 타입 오류 등 다양한 예외 처리
            log.error("Error processing message from Redis Pub/Sub: {}", e.getMessage(), e);
        }
    }
    // ... (updateRoom, createOneononeChatroom 등 다른 토픽을 구독하는 메서드들)
}
```

### Redis Stream (`ChatMessageStreamListener`, `ChatMessageConsumer`)

Redis Pub/Sub은  메시지를 따로 보관하지 않고, 메시지를 발행하면 구독자에게 **전달하고 끝**입니다. 만약 구독하는 서버(Subscriber)가 잠깐 다운되었거나 네트워크가 불안정해서 메시지를 놓치면 영영 못 받게 될 수도 있습니다. 그리고 채팅 내역을 보려면 메시지를 어딘가에 **영구적으로 저장**해야 합니다.

이 문제를 해결하기 위해 저희는 **Redis Stream**을 함께 사용했습니다. 이것은 아래와 같이 Pub/Sub의 단점을 보완해줍니다.

1.  **저장 (Produce):** `ChatMessageService`에서 Pub/Sub으로 메시지를 발행하는 것과 **동시에**, 같은 메시지를 Redis **Stream**(`chat_message_queue`)에도 추가합니다 (`produceChatMessage` 메서드). Redis Stream은 Pub/Sub과 달리 메시지를 **로그처럼 차곡차곡 쌓아두고 보관**합니다.
2.  **처리 (Consume):** 별도의 **Stream 리스너**(`ChatMessageStreamListener`, `ChatMessageConsumer`)가 이 Stream을 계속 지켜보고 있다가 새 메시지가 들어오면 가져갑니다.
3.  **영속화 & 확인 (Acknowledge):** 리스너는 가져온 메시지를 **MongoDB 같은 DB에 안전하게 저장**하고 (`saveMessageToMongoDB`), 처리가 성공적으로 끝나면 Redis에게 메시지 잘 처리했다는 확인 신호를 보냅니다 (`acknowledgeMessage`). 이 확인 신호가 있어야 Redis는 "아, 이 메시지는 이미 처리가 완료됐구나" 하고 관리할 수 있습니다. 만약 처리 중 문제가 생겨 확인 신호를 못 보내면, 나중에 다른 Consumer가 해당 메시지를 다시 가져가서 처리할 기회를 가질 수 있습니다.

이렇게 하면 **실시간 메시지 전달은 빠른 Pub/Sub**에게 맡기고, **메시지 영속화와 안정적인 처리는 Stream**이 책임지는, 각자의 장점을 살린 구조가 완성됩니다.

```java
// ChatMessageStreamListener.java (StreamListener 인터페이스 구현)
// Spring Data Redis는 StreamListener 인터페이스와 관련 설정을 통해
// Redis Stream의 특정 Consumer Group을 구독하는 리스너를 쉽게 만들 수 있게 지원합니다.
@Component
@Slf4j
@RequiredArgsConstructor
public class ChatMessageStreamListener implements StreamListener<String, MapRecord<String, String, String>> {

    private final ChatMessageRepository chatMessageRepository; // MongoDB 저장용 Repository
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String STREAM_KEY = "chat_message_queue"; // 구독할 Stream Key

    /**
     * Redis Stream (chat_message_queue)에 새 메시지가 도착하면 호출됨
     * @param message Stream에서 읽어온 메시지 (ID와 데이터 포함)
     */
    @Override
    public void onMessage(MapRecord<String, String, String> message) {
        log.info("Message received from Redis Stream: ID={}, Value={}", message.getId(), message.getValue());
        try {
            // 1️⃣ Stream 데이터(Map)를 다시 ChatMessageDto 객체로 변환
            ChatMessageDto chatMessageDto = convertFromMap(message.getValue());

            // 2️⃣ MongoDB에 메시지 저장 (영속화)
            saveMessageToMongoDB(chatMessageDto);

            // 3️⃣ Redis Stream에 처리 완료 확인(Acknowledge) 신호 전송
            acknowledgeMessage(message);

        } catch (DuplicateKeyException e) {
            // MongoDB에 이미 같은 메시지 ID가 저장된 경우 (재처리 시 발생 가능)
            log.warn("Duplicate message processed, acknowledging anyway: ID={}", message.getId());
            acknowledgeMessage(message); // 중복이어도 처리는 된 것이므로 Ack
        } catch (Exception e) {
            // DB 저장 실패 등 예기치 못한 오류 발생 시
            log.error("Error processing message from Redis Stream: ID={}, Error={}", message.getId(), e.getMessage(), e);
            // 여기서 Ack를 보내지 않으면, 나중에 다른 Consumer가 이 메시지를 다시 처리 시도 가능
        }
    }

    // 메시지 처리 완료 확인 (XACK)
    private void acknowledgeMessage(MapRecord<String, String, String> message) {
        redisTemplate.opsForStream().acknowledge(STREAM_KEY, "your_consumer_group_name", message.getId());
        log.info("Message acknowledged in Redis Stream: ID={}", message.getId());
    }

    // MongoDB에 저장
    private void saveMessageToMongoDB(ChatMessageDto chatMessageDto) {
        // DTO -> Entity 변환 후 저장
        ChatMessage chatMessage = convertToEntity(chatMessageDto);
        chatMessageRepository.save(chatMessage);
        log.info("Message saved to MongoDB: {}", chatMessage.getId());
    }

    // Map -> DTO 변환 로직 (예시)
    private ChatMessageDto convertFromMap(Map<String, String> map) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setRoomId(map.get("roomId"));
        dto.setSenderId(Long.parseLong(map.get("senderId")));
        dto.setContent(map.get("content"));
        dto.setMessageType(MessageType.valueOf(map.get("messageType")));
        return dto;
    }

}
```
