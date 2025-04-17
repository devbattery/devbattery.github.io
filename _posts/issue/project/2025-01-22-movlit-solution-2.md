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
last_modified_at: 2025-04-17
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 서론

Movlit 서비스에서는 **한 컨텐츠(예: 영화, 책)당 하나의 그룹 채팅방**만 생성되도록 구현하는 것을 목표로 합니다. 하지만 범죄도시와 같은 인기 컨텐츠가 공개되는 순간, 수많은 사용자가 동시에 “채팅방 만들기” 버튼을 누르는 시나리오를 생각해 봅시다. 이런 동시 다발적인 요청이 서버에 한꺼번에 도달하면, **Race Condition**이 발생하여 서버가 요청을 제대로 처리하지 못하고 **의도치 않게 여러 개의 채팅방이 생성**될 수 있습니다.

이러한 문제를 해결하고 **원자성(Atomicity)**을 보장하기 위해 **`GroupChatroomCreationWorker` 클래스**를 도입하고, 이를 사용하는 **`GroupChatroomUseCase`**를 설계했습니다. Worker 클래스는 **Redis의 List 자료구조를 Queue처럼 활용**하고, **Java의 Thread Pool**을 결합하여 채팅방 생성 요청을 **순차적이고 비동기적으로 처리**합니다. 이를 통해 동시에 들어오는 여러 요청 중 **단 하나의 요청만이 실제 채팅방 생성 로직을 수행**하도록 보장합니다.

## `GroupChatroomUseCase`: 요청의 시작과 끝을 총괄하는 서비스

`GroupChatroomUseCase`는 채팅방 생성 요청의 전체 흐름을 관리하는 역할을 합니다. 사용자 요청을 받아 기본적인 유효성 검사를 수행하고, 실제 생성 권한을 얻는 작업은 `GroupChatroomCreationWorker`에게 위임한 뒤, 그 결과를 받아 최종적으로 채팅방을 생성하거나 실패 처리를 합니다.

### 주요 역할

1.  사용자 요청 접수 및 `contentId` 생성
2.  (최적화) DB에 이미 채팅방이 있는지 사전 확인
3.  Redis Queue에 생성 요청 등록
4.  `GroupChatroomCreationWorker`에게 실제 생성 권한 획득 작업 위임
5.  Worker의 결과에 따라 실제 채팅방 생성 로직 호출 또는 예외 처리

### 세부 코드

1.  **요청 접수 및 `contentId` 생성, 사전 DB 체크하여 최적화**
    사용자의 요청(`GroupChatroomRequest`, `memberId`)을 받아, `contentId` (예: `MV_12345`)를 생성합니다. 그리고 가장 먼저 DB에 해당 `contentId`로 생성된 채팅방이 이미 있는지 확인합니다. 있다면, 더 이상 진행하지 않고 바로 예외를 발생시켜 불필요한 리소스 낭비를 막습니다.

    ```java
    // GroupChatroomUseCase.java
    @Transactional
    public GroupChatroomResponse requestCreateGroupChatroom(GroupChatroomRequest request, MemberId memberId) {
        // 1. 고유 Content ID 생성
        String contentId = ChatroomConvertor.generateContentId(request.getContentType(), request.getContentId());

        // 2. (Optimization) 이미 해당 컨텐츠의 채팅방이 DB에 존재하는지 확인
        validateExistByContentId(contentId); // 존재하면 GroupChatroomAlreadyExistsException 발생
        // ... 이하 로직 진행 ...
    }
    ```

2.  **Redis Queue에 요청 등록 (`LPUSH`):**
    DB에 채팅방이 없음을 확인했다면, 이제 생성 경쟁에 참여할 준비를 합니다. `contentId`를 기반으로 한 Redis List Key(MV_12345)에 현재 요청자의 `memberId`를 `LPUSH`하여 "나도 이 컨텐츠 채팅방 만들고 싶어요!"라고 요청 대기열에 등록합니다.

    ```java
    // GroupChatroomUseCase.java
    // ... 이전 코드 ...
    // 3. Redis Queue에 요청자(memberId)를 저장 (LPUSH)
    String queueKey = GROUP_CHATROOM_QUEUE_KEY_PREFIX + contentId;
    redisTemplate.opsForList().leftPush(queueKey, memberId.getValue());
    // ... 이하 로직 진행 ...
    ```

3.  **`GroupChatroomCreationWorker`에게 작업 떠넘기기**
    이제 실제 "생성 권한 획득"이라는 핵심 작업을 `GroupChatroomCreationWorker`에게 위임합니다. `contentId`를 전달하며 `requestChatroomCreation` 메서드를 호출하고, 그 결과를 `Optional<Map<String, String>>` 형태로 받기 위해 기다립니다. 이 작업은 Worker 내부에서 비동기적으로 처리됩니다.

    ```java
    // GroupChatroomUseCase.java
    // ... 이전 코드 ...
    // 4. Worker 스레드에게 비동기 작업 요청 및 결과 대기
    Optional<Map<String, String>> responseOpt = worker.requestChatroomCreation(contentId);
    // ... 이하 결과 처리 ...
    ```

4.  **Worker 결과 처리 및 최종 생성:**

    - **성공:** `Optional`이 값을 가지고 있다면, Worker가 반환한 `contentId`와 생성자 `memberId`를 이용해 실제 DB에 채팅방을 생성하는 `createGroupChatroom` 메서드를 호출합니다.
    - **실패:** `Optional`이 비어 있다면(경쟁 패배 또는 Timeout), `getPureResponse` 메서드 등에서 예외(`GroupChatroomAlreadyExistsException`)를 발생시켜 중복 생성을 막습니다.

    ```java
    // GroupChatroomUseCase.java
    // ... 이전 코드 ...
    Map<String, String> response = getPureResponse(responseOpt); // 결과 없으면(Optional.empty()) 예외 발생

    // 5. Worker로부터 받은 정보로 실제 채팅방 생성 로직 호출 (단 한 번만 실행됨)
    String workerContentId = response.keySet().iterator().next();
    MemberId workerMemberId = IdFactory.createMemberId(response.get(workerContentId));
    GroupChatroomResponse createdChatroom = createGroupChatroom(
            RequestDataForCreationWorker.from(request.getRoomName(), workerContentId, workerMemberId));

    log.info("::GroupChatroomService_requestCreateGroupChatroom:: Chatroom created by Member {}", workerMemberId.getValue());

    // 6. (Optional) 생성 완료 후 알림 등 후처리
    publishNewGroupChatroomNoti(contentId, request.getRoomName(), createdChatroom);

    return createdChatroom; // 최종 생성 결과 반환
    }
    ```

## `GroupChatroomCreationWorker`: 원자성을 보장하는 Worker 클래스

`GroupChatroomCreationWorker`는 `GroupChatroomUseCase`로부터 위임받은 핵심 작업을 수행합니다. 바로 **특정 `contentId`에 대한 여러 생성 요청 중 단 하나의 요청만이 성공하도록 보장**하는 것입니다. 마치 좁은 문을 지키는 문지기처럼, 오직 하나의 요청만 통과시키는 역할을 합니다. 이를 위해 Redis `RPOP`의 원자성과 스레드 풀을 활용합니다.

**주요 역할:**

1.  특정 `contentId`의 Redis Queue에서 `memberId`를 원자적으로 꺼내기 시도 (`RPOP`)
2.  성공 시, 해당 `memberId`와 `contentId` 정보를 `Optional`에 담아 반환 (경쟁 승리)
3.  실패 시 (Timeout 또는 이미 다른 요청이 처리), 빈 `Optional` 반환 (경쟁 패배)
4.  이 모든 과정을 비동기적으로 처리 (`ThreadPoolExecutor`)

**코드 흐름 살펴보기:**

1.  **비동기 작업 정의 (`Callable`):**
    `requestChatroomCreation` 메서드는 `Callable`을 사용하여 Redis 접근 로직을 정의합니다. 이 `Callable` 객체는 스레드 풀의 별도 스레드에서 실행됩니다.

    ```java
    // GroupChatroomCreationWorker.java
    public Optional<Map<String, String>> requestChatroomCreation(String contentId) {
        // 1. 비동기 작업을 정의 (Callable)
        Callable<Optional<Map<String, String>>> task = () -> {
            String queueKey = GROUP_CHATROOM_QUEUE_KEY_PREFIX + contentId;
            // ... RPOP 로직 ...
        };
        // ... 스레드 풀 실행 로직 ...
    }
    ```

2.  **Redis Queue에서 원자적으로 데이터 꺼내기 (`RPOP` with Timeout)**
    이 부분이 Worker의 심장입니다. `redisTemplate.opsForList().rightPop(queueKey, 10, TimeUnit.SECONDS)`를 호출하여 `contentId`에 해당하는 Redis List의 **오른쪽 끝**에서 요소를 꺼내려고 시도합니다.

    - **원자성:** Redis의 `RPOP` 명령어는 원자적으로 실행됩니다. 즉, 여러 스레드가 동시에 이 코드를 실행하더라도 **오직 하나의 스레드**만이 성공적으로 `memberId`를 가져갈 수 있습니다. 이것이 바로 Race Condition을 막는 핵심입니다.
    - **Blocking & Timeout:** 만약 List가 비어있다면, 스레드는 최대 10초 동안 새로운 `memberId`가 `LPUSH`되기를 기다립니다(`Blocking`). 10초가 지나도 꺼낼 요소가 없으면 `null`을 반환합니다.

    ```java
    // GroupChatroomCreationWorker.java (Callable 내부)
            // 2. Redis Queue에서 데이터 꺼내기 시도 (RPOP, Timeout 설정)
            Object memberIdObject = redisTemplate.opsForList()
                    .rightPop(queueKey, 10, TimeUnit.SECONDS); // <- 원자적 연산 + Blocking
    ```

3.  **결과 처리 (경쟁 승패 결정):**
    `RPOP`의 결과를 바탕으로 경쟁의 승패를 결정합니다.

    - **승리:** `memberIdObject`가 유효한 `String`이라면, 이 스레드가 경쟁에서 이긴 것입니다. `contentId`와 `memberId`를 담은 `Optional<Map>`을 반환 준비합니다.
    - **패배:** `memberIdObject`가 `null`이거나 다른 타입이라면, 경쟁에서 진 것입니다. 빈 `Optional`을 반환 준비합니다.

    ```java
    // GroupChatroomCreationWorker.java (Callable 내부)
            // 3. 성공적으로 memberId를 가져온 경우 (경쟁에서 승리)
            if (memberIdObject instanceof String memberId) {
                log.info("Worker thread successfully popped memberId {} for contentId {}", memberId, contentId);
                return makeResultMap(contentId, memberId); // Optional<Map> 반환
            }

            // 4. memberId를 가져오지 못한 경우 (Timeout 또는 다른 스레드가 이미 가져감)
            log.warn("Worker thread failed to pop memberId for contentId {} (Timeout or already processed)", contentId);
            return Optional.empty(); // 빈 Optional 반환
    ```

4.  **스레드 풀 실행 및 결과 대기:**
    정의된 `Callable` 작업을 `ThreadPoolExecutor`에 제출하고, `Future.get()`을 사용하여 비동기 작업의 결과를 기다립니다 (최대 30초). 이 결과를 `GroupChatroomUseCase`로 반환합니다.

    ```java
    // GroupChatroomCreationWorker.java
    // ... Callable 정의 이후 ...
    try {
        // 5. 스레드 풀에 작업 제출 및 Future 객체 받기
        Future<Optional<Map<String, String>>> future = threadPoolExecutor.submit(task);

        // 6. 작업 완료 대기 (최대 30초) 및 결과 반환
        return future.get(30, TimeUnit.SECONDS); // UseCase로 결과 전달

    } catch (InterruptedException | ExecutionException | TimeoutException e) {
        // ... 예외 처리 ...
        throw new GroupChatroomCreationWhenWorkingException();
    }
    ```

## 전체 코드

### GroupChatroomUseCase

```java
package movlit.be.chat_room.application.service;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupChatroomUseCase {

    private final GroupChatRepository groupChatRepository;
    private final MemberReadService memberReadService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final GroupChatroomCreationWorker worker;
    private final ApplicationEventPublisher eventPublisher;
    private final MovieReadService movieReadService;
    private final MovieHeartService movieHeartService;
    private final BookDetailReadService bookDetailReadService;
    private final BookHeartReadService bookHeartReadService;

    private final RedisNotificationPublisher redisNotificationPublisher;
    private final NotificationService notificationService;

    // TODO: Const 분리
    private static final String CHATROOM_MEMBERS_KEY_PREFIX = "chatroom:";
    private static final String CHATROOM_MEMBERS_KEY_SUFFIX = ":members";
    private static final String GROUP_CHATROOM_QUEUE_KEY_PREFIX = "groupChatroomQueue:";
    private static final long CHATROOM_MEMBERS_CACHE_TTL = 60 * 60; // 1시간

    @Value("${share.url}")
    private String basicUrl;

    /**
     * 비동기적으로 최초 그룹 채팅 생성 로직을 요청한다.
     */
    @Transactional
    public GroupChatroomResponse requestCreateGroupChatroom(GroupChatroomRequest request, MemberId memberId) {
        String contentId = ChatroomConvertor.generateContentId(request.getContentType(),
                request.getContentId()); // MV_LongContentId 형태
        validateExistByContentId(contentId);

        // Redis Queue에 memberId를 value로 저장 (LPUSH)
        String queueKey = GROUP_CHATROOM_QUEUE_KEY_PREFIX + contentId;
        redisTemplate.opsForList().leftPush(queueKey, memberId.getValue());

        // Worker 스레드에게 작업 요청 및 결과 수신
        // 만약, 늦게 요청한 멤버들이라면 response는 null 데이터를 담고 있게 되는 거임
        Optional<Map<String, String>> responseOpt = worker.requestChatroomCreation(contentId);
        Map<String, String> response = getPureResponse(responseOpt);

        // Worker 스레드로부터 받은 contentId와 memberId로 채팅방 생성
        String workerContentId = response.keySet().iterator().next();
        MemberId workerMemberId = IdFactory.createMemberId(response.get(workerContentId));

        // 그룹 채팅방 생성
        GroupChatroomResponse createdChatroom = createGroupChatroom(
                RequestDataForCreationWorker.from(request.getRoomName(), workerContentId, workerMemberId));

        log.info("::GroupChatroomService_requestCreateGroupChatroom::");

//        // 트랜잭션 완료 후 알림 발송
//        TransactionSynchronizationManager.registerSynchronization(new CustomTransactionSynchronization() {
//            @Override
//            public void afterCommit() {
//                publishNewGroupChatroomNoti(contentId, request.getRoomName(), createdChatroom);
//            }
//        });

        publishNewGroupChatroomNoti(contentId, request.getRoomName(), createdChatroom);

        return createdChatroom;
    }

    /**
     * 찜한 콘텐츠에 대해 새로운 채팅방 생성됨을 알림
     */
    private void publishNewGroupChatroomNoti(String contentId, String roomName,
                                             GroupChatroomResponse createdChatroom) {
        log.info("::GroupChatroomService_publishNewGroupChatroomNoti::");

        // ContentId : MV_pureContentId 또는 BK_pureContentId -> 책과 영화 구분 필요
        String contentType = contentId.substring(0, 2);
        String pureContentId = contentId.substring(3);

        // 찜한 멤버 리스트
        List<MemberId> heartingMemberIds = new ArrayList<>();
        // 콘텐츠명 (영화 이름, 책 이름)
        String contentName = "";
        // 해당 콘텐츠의 상세페이지 url (채팅방 가입 유도)
        String url = basicUrl;

        if (contentType.equals("MV")) {
            Long movieId = Long.parseLong(pureContentId);
            contentName = movieReadService.fetchByMovieId(movieId).getTitle();
            heartingMemberIds = movieHeartService.fetchHeartingMemberIdsByMovieId(movieId);
            url += "/movie/" + pureContentId;
        } else if (contentType.equals("BK")) {
            BookId bookId = new BookId(pureContentId);
            String bookName = bookDetailReadService.fetchByBookId(bookId).getTitle();
            int index = bookName.indexOf(" -");
            if (index != -1) {
                contentName = bookName.substring(0, index); // "-"가 있으면 앞부분만 사용
            } else {
                contentName = bookName; // "-"가 없으면 전체 문자열 사용
            }
            heartingMemberIds =
                    bookHeartReadService.fetchHeartingMemberIdsByBookId(bookId);
            url += "/book/" + pureContentId;
        }

        // 멤버들에게 알림 발송
        if (!heartingMemberIds.isEmpty()) {
            for (MemberId heartigMemberId : heartingMemberIds) {
                log.info(">> 알림발송할 멤버 " + heartigMemberId.getValue());
                NotificationDto notification = new NotificationDto(
                        heartigMemberId.getValue(),
                        NotificationMessage.generateNewGroupChatroomNotiMessage(contentType, contentName, roomName),
                        NotificationType.CONTENT_HEART_CHATROOM,
                        url);
                // Notification Redis Publish (SSE 알림)
                redisNotificationPublisher.publishNotification(notification);
                // Notification MongoDB에 저장
                notificationService.saveNotification(notification);
            }
        }
    }

    private Map<String, String> getPureResponse(Optional<Map<String, String>> responseOpt) {
        if (responseOpt.isEmpty()) {
            throw new GroupChatroomAlreadyExistsException();
        }

        return responseOpt.get();
    }

    private void validateExistByContentId(String contentId) {
        if (groupChatRepository.existsByContentId(contentId)) {
            throw new GroupChatroomAlreadyExistsException();
        }
    }

    /**
     * 최초 그룹 채팅 생성 후 참여한다
     */
    @Transactional
    public GroupChatroomResponse createGroupChatroom(RequestDataForCreationWorker data) {
        GroupChatroom groupChatroom = ChatroomConvertor.makeNonReGroupChatroom(data);
        MemberRChatroom memberRChatroom = ChatroomConvertor.makeNonReMemberRChatroom();

        MemberEntity member = memberReadService.fetchEntityByMemberId(data.getWorkerMemberId());

        memberRChatroom.updateGroupChatRoom(groupChatroom);
        memberRChatroom.updateMember(member);
        groupChatroom.updateMemberRChatroom(memberRChatroom); // 그룹 채팅방에 멤버를 참여시킨다

        return groupChatRepository.create(groupChatroom);
    }

    // 존재하는 그룹채팅방 가입
    @Transactional
    public GroupChatroomResponse joinGroupChatroom(GroupChatroomId groupChatroomId, MemberId memberId)
            throws ChatroomAccessDenied {
        GroupChatroom existingGroupChatroom = groupChatRepository.findByChatroomId(groupChatroomId);
        validateAlreadyJoined(memberId, existingGroupChatroom);
        MemberEntity member = memberReadService.fetchEntityByMemberId(memberId);

        log.info("::GroupChatroomService_joinGroupChatroom::");
        log.info(">> member : " + member.toString());
        log.info(">> groupChat to join : " + existingGroupChatroom.toString());

        if (existingGroupChatroom != null && member != null) {
            // 관계테이블 row 생성 (row id 및 regDt생성)
            MemberRChatroom newMemberRChatroom = ChatroomConvertor.makeNonReMemberRChatroom();

            // 만든 관계 row에 member 정보 update
            newMemberRChatroom.updateMember(member);
            // 만든 관계 row에 chatroom 정보 update
            newMemberRChatroom.updateGroupChatRoom(existingGroupChatroom);
            log.info(">> newMemberRChatroom : " + newMemberRChatroom.toString());

            // 기존 채팅방에 새롭게 생성된 관계정보(memberRChatroom : 멤버-채팅방 관계) update
            existingGroupChatroom.updateMemberRChatroom(newMemberRChatroom);
            log.info(">> updated groupChat : " + existingGroupChatroom.toString());

        } else if (existingGroupChatroom == null && member != null) {
            throw new ChatroomNotFoundException();

        } else {
            throw new ChatroomAccessDenied();
        }

        // 바뀐 정보 업데이트
        GroupChatroomResponse response = groupChatRepository.create(existingGroupChatroom);

        // 그룹채팅방 가입 이벤트 발행
        log.info("GroupChatroomService :: GroupChatroomJoinedEvent 발행...");
        eventPublisher.publishEvent(new GroupChatroomJoinedEvent(groupChatroomId, memberId));

        return response;
    }

    private void validateAlreadyJoined(MemberId memberId, GroupChatroom existingGroupChatroom) {
        if (existingGroupChatroom.getMemberRChatroom().stream()
                .anyMatch(rChatroom -> rChatroom.getMember().getMemberId().equals(memberId))) {
            throw new GroupChatroomAlreadyJoinedException();
        }
    }

    // 특정 그룹채팅 안 멤버 정보 update (멤버 정보 redis 1차 캐시)
    @ExecutionTime
    public List<GroupChatroomMemberResponse> fetchMembersInGroupChatroom(GroupChatroomId groupChatroomId,
                                                                         boolean useCache) {
        // 파라미터 추가 (캐싱 on/off)
        String cacheKey = CHATROOM_MEMBERS_KEY_PREFIX + groupChatroomId + CHATROOM_MEMBERS_KEY_SUFFIX;

        try {
            if (useCache) { // 캐시 사용
                // Redis에서 캐시된 데이터 조회 (JSON 문자열)
                String cachedJson = (String) redisTemplate.opsForValue().get(cacheKey);
                List<GroupChatroomMemberResponse> response;

                if (cachedJson != null) {
                    log.info("Cache hit for chatroom: {}", groupChatroomId);

                    // JSON 문자열을 List<GroupChatroomMemberResponse>로 역직렬화
                    response = objectMapper.readValue(cachedJson, new TypeReference<>() {
                    });
                    return response;
                }
            }

            log.info("Cache miss for chatroom: {}", groupChatroomId);

            // 캐시에 데이터가 없으면 DB에서 조회
            // 채팅방 존재 여부 확인
            groupChatRepository.findByChatroomId(groupChatroomId);

            // 멤버 정보 조회
            List<GroupChatroomMemberResponse> response = groupChatRepository.findMembersByChatroomId(groupChatroomId);

            // 조회 결과를 JSON 문자열로 변환하여 Redis에 캐싱
            updateCachedMembers(groupChatroomId, response);

            return response;
        } catch (Exception e) {
            log.error("Error while fetching members from chatroom: {}", groupChatroomId, e);
            // 예외 처리 로직 추가 (예: 빈 리스트 반환 또는 예외 다시 던지기)
            return new ArrayList<>();
        }
    }

    // 캐시 업데이트 메서드 추가
    public void updateCachedMembers(GroupChatroomId groupChatroomId, List<GroupChatroomMemberResponse> members) {
        String cacheKey = CHATROOM_MEMBERS_KEY_PREFIX + groupChatroomId + CHATROOM_MEMBERS_KEY_SUFFIX;

        try {
            String json = objectMapper.writeValueAsString(members);
            redisTemplate.opsForValue().set(cacheKey, json, CHATROOM_MEMBERS_CACHE_TTL, TimeUnit.SECONDS);
            log.info("Cache updated for chatroom: {}", groupChatroomId);
        } catch (JsonProcessingException e) {
            log.error("Error while updating cache for chatroom: {}", groupChatroomId, e);
        }
    }

    // 그룹채팅방 나가기
    @Transactional
    public void leaveGroupChatroom(GroupChatroomId groupchatroomId, MemberId memberId) {
        GroupChatroom groupChatroom = groupChatRepository.findByChatroomId(groupchatroomId);
        //  MemberEntity member = memberReadService.findEntityById(memberId);

        // 그룹채팅방에 참여중인 멤버목록에서 해당 멤버를 찾아 제거하기
        // memberRChatroom에서 memberId와 groupChatroomId가 모두 일치하는 row를 찾아 제거
        groupChatroom.getMemberRChatroom().removeIf(memberRChatroom ->
                memberRChatroom.getMember().getMemberId().equals(memberId) &&
                        memberRChatroom.getGroupChatroom().getGroupChatroomId().equals(groupchatroomId)
        );

        // 변경사항을 저장할 것
        groupChatRepository.create(groupChatroom); // 변경 사항 저장

        // 그룹채팅방 나가기 이벤트 발행
        log.info("GrouopChatroomService >>> GroupChatroomLeftEvent 발행 ...");
        eventPublisher.publishEvent(new GroupChatroomLeftEvent(groupchatroomId, memberId));

    }

}
```

### GroupChatroomCreationWorker

```java
package movlit.be.chat_room.application.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.common.exception.GroupChatroomCreationWhenWorkingException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

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
