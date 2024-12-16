---
title: "[Project] 회원 탈퇴 시, 글 목록 불러오는 과정에서의 문제 발생과 그 해결 과정"
excerpt: "foodymoody, solution"

categories:
  - Project
tags:
  - [foodymoody, solution]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-12-16
last_modified_at: 2024-12-16
---

> [FoodyMoody 프로젝트](https://github.com/foody-moody/foodymoody)에 대한 설명입니다.

## 문제 발생

이전에 팀원들과 같이 프로젝트를 진행할 때는, 회원 탈퇴를 직접 해보지 않아 문제의 심각성을 알지 못했던 시기였다.

보통 이런 문제에 직면하지 않은 신입 개발자들이라면 대부분 Member를 soft delete 처리하지 않고, hard delete 처리를 할 것이다.

하지만, 대부분의 기업들이 soft delete 방식으로 유저 데이터를 관리하고 있기도 하고, 앞으로 서술한 문제를 방지하기에도 도움이 된다.

보통 CRUD 기능을 구현하면 그걸 시행한 유저가 있을 것인데, 만약 그 유저가 회원 탈퇴를 해서 `memberId`가 싹 날아갔다고 가정해 보자. 어떻게 되겠는가? 그렇다, 다시 그 멤버가 작성한 게시물을 불러올 때 `memberId`가 없으니 말도 안 되는 버그가 발생하고 만다.

## 해결 방안

그래서 결국 내가 할 일은 `Member` Entity의 구조를 바꾸는 것이다. 사실 구조라고 해봤자 `deleted` 필드 하나를 추가하는 것뿐이지만, 그렇게 간단한 것만은 아니다. `Member`와 관련된 Entity들이 무수하게 많기 때문에, `deleted`가 `true`냐 `false`냐에 따라 쿼리와 로직을 수정해야 한다.

이것을 해결하던 중, 플러스 알파로 계속 Github Actions에서 인수 인가쪽 테스트 코드가 터지는 문제가 발생했다. 로컬에서는 문제 없이 작동되었지만, Github Actions에서만 되지 않았다. 이걸로 몇 시간을 삽질을 했는데 결론은 `RedisRefreshTokenStorage`를 Rollback했기 때문이었다. 이와 관련해서는 다음 포스트 때 서술하겠다. 일단 Redis를 사용하지 않고 ConcurrentHashMap을 사용하도록 변경하였다.

```java
@Service
@RequiredArgsConstructor
public class RedisRefreshTokenStorage implements RefreshTokenStorage {

    private final ConcurrentHashMap<String, String> refreshTokens = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();

    @Override
    public void saveRefreshToken(MemberId memberId, String refreshToken) {
        refreshTokens.put(memberId.getValue(), refreshToken);
    }

    @Override
    public String findByMemberId(String memberId) {
        return refreshTokens.get(memberId);
    }

    @Override
    public void addBlacklist(String token, long exp) {
        blacklist.put(token, exp);
    }

    @Override
    public boolean isBlacklist(String token) {
        return blacklist.containsKey(token);
    }

}
```

## 해결 과정

```java
@Test
void when_deleteMember_then_success() {
    // docs
    api_문서_타이틀("deleteMember_success", spec);

    // given
    String 아티_아이디 = jwtUtil.parseAccessToken(회원아티_액세스토큰).get("id");
    팔로우한다(회원아티_액세스토큰, 푸반_아이디, new RequestSpecBuilder().build());
    팔로우한다(회원푸반_액세스토큰, 아티_아이디, new RequestSpecBuilder().build());

    // 피드 등록하는 부분 추가 (푸반이 탈퇴를 하니, 푸반 토큰으로 등록 안 하면 오류 안 생김)
    피드를_등록한다(회원아티_액세스토큰, 피드_이미지_업로드_후_id_리스트를_반환한다(회원아티_액세스토큰, spec));
    피드를_등록한다(회원푸반_액세스토큰, 피드_이미지_업로드_후_id_리스트를_반환한다(회원푸반_액세스토큰, spec));

    // when
    var response = 회원탈퇴한다(회원푸반_액세스토큰, spec);

    // then
    ExtractableResponse<Response> 탈퇴한_푸반_로그인_응답 = 로그인한다(AuthFixture.푸반_로그인_요청(),
            new RequestSpecBuilder().build());
    ExtractableResponse<Response> 아티_팔로잉목록조회_응답 = 팔로잉_목록을_조회한다(아티_아이디, new RequestSpecBuilder().build());
    ExtractableResponse<Response> 아티_팔로워목록조회_응답 = 팔로워_목록을_조회한다(아티_아이디, new RequestSpecBuilder().build());
    Assertions.assertAll(
            () -> 상태코드를_검증한다(response, HttpStatus.NO_CONTENT),
            () -> 상태코드를_검증한다(탈퇴한_푸반_로그인_응답, HttpStatus.NOT_FOUND),
            () -> assertThat(아티_팔로잉목록조회_응답.jsonPath().getList("content"))
                    .extracting("id")
                    .doesNotContain(푸반_아이디),
            () -> assertThat(아티_팔로워목록조회_응답.jsonPath().getList("content"))
                    .extracting("id")
                    .doesNotContain(푸반_아이디)
    );
}
```

- 회원 탈퇴할 회원이 피드를 등록하지 않은 상태라면 오류는 일어나지 않았기 때문에 그동안 팀원들과 나 모두 몰랐던 문제였다.
- 그렇기 때문에 회원 탈퇴하기 전, 꼭 피드를 등록해주게끔 즉 테스트 실패가 발생하도록 tdd 형식으로 작성했다.

```java
public class Member {

    @EmbeddedId
    @EqualsAndHashCode.Include
    private MemberId id;
    private String email;
    private String nickname;
    private String password;
    private boolean deleted;

    // ...

}
```

- Member 엔티티에 deleted를 추가해주었다.

```java
public interface MemberJpaRepository extends JpaRepository<Member, MemberId>, MemberQueryDslRepository {

    @Modifying
    @Query("UPDATE Member m SET m.deleted = true WHERE m.id = :id")
    void softDeleteById(MemberId id);

    // ...

}
```

- 회원 탈퇴를 할 때, 데이터를 날리지 않고 `deleted`를 `true`로 바꿔주었다.
  - 사실 `false`로 변경했다가 잘못 쓴 걸 뒤늦게 깨닫고 수정했다

```java
public interface NotificationJpaRepository extends JpaRepository<Notification, NotificationId> {

    @Query("SELECT _notification.id as id " +
            ", _fromMember.id as fromMemberId " +
            ", _fromMember.nickname as fromNickname " +
            ", _memberImage.url as fromProfileImageUrl " +
            ", _notification.details as details " +
            ", _notification.isRead as read " +
            ", _notification.type as type " +
            ", _notification.createdAt as createdAt " +
            ", _notification.updatedAt as updatedAt " +
            "FROM Notification _notification " +
            "JOIN Member _fromMember ON _notification.fromMemberId = _fromMember.id " +
            "JOIN Image _memberImage ON _fromMember.profileImage.id = _memberImage.id " +
            "WHERE _notification.toMemberId = :memberId AND _notification.isDeleted = false AND _fromMember.deleted = false " +
            "ORDER BY _notification.createdAt DESC")
    Slice<NotificationSummary> findAllSummaryByMemberId(MemberId memberId, Pageable pageable);


  // ...

}
```

- notification에서 memberId에 따라 알림을 불러올 때도, `deleted`가 false인 경우에만 불러와주도록 하였다.

```java
public interface FollowJpaRepository extends JpaRepository<Follow, Long> {

    @Query("SELECT new com.foodymoody.be.member.application.dto.FollowMemberSummary(following.id, following.nickname, i.url) "
            + "FROM Follow f "
            + "INNER JOIN Member following ON f.followed = following "
            + "INNER JOIN Image i ON i.id = following.profileImage.id "
            + "WHERE following.deleted = false AND f.follower = :member "
            + "ORDER BY f.createdAt DESC ")
    Slice<FollowMemberSummary> fetchMyFollowingSummariesByMember(Member member, Pageable pageable);

    @Query("SELECT new com.foodymoody.be.member.application.dto.FollowMemberSummary(follower.id, follower.nickname, i.url) "
            + "FROM Follow f "
            + "INNER JOIN Member follower ON f.follower = follower "
            + "INNER JOIN Image i ON i.id = follower.profileImage.id "
            + "WHERE follower.deleted = false AND f.followed = :member "
            + "ORDER BY f.createdAt DESC ")
    Slice<FollowMemberSummary> fetchMyFollowerSummariesByMember(Member member, Pageable pageable);

}
```

- 팔로잉과 팔로워 같은 경우도 `deleted` 관련으로 쿼리를 수정해 주었다.

```java
public class MemberWriteController {

    private final MemberWriteService memberWriteService;
    private final FollowWriteService followWriteService;
    private final LocalSignUpUseCase localMemberSignUpUseCase;
    private final UpdateMemberProfileUseCase updateMemberProfileUseCase;

    @DeleteMapping("/me")
    public ResponseEntity<Void> delete(
            @CurrentMemberId MemberId currentMemberId,
            @RequestHeader("Authorization") String authorizationHeader) {
        String accessToken = HttpHeaderParser.parse(authorizationHeader, HttpHeaderType.AUTHORIZATION);
        memberWriteService.delete(currentMemberId, accessToken);
        return ResponseEntity.noContent().build();
    }

    // ..

}
```

```java
public void delete(MemberId id, String accessToken) {
    logoutUseCase.logout(accessToken);
    Member member = findById(id);
    memberRepository.softDelete(member);
}
```

- `authorizationHeader`를 가져오는 부분은 사실 logout 기능을 쓸 때 사용됐었다. 하지만 회원 탈퇴는 결국 `deleted` 처리와 동시에 logout 기능이 이루어져야 하므로, 이런 식으로 `accessToken`을 가져와서 넘겨준 후 처리하도록 했다.
- 원래는 이렇게 수정하지 않고, `logout()`의 매개변수에 accessToken이 아닌 `memberId`를 넘겨줘서 오버로딩 처리를 해준 후 재구현을 했었는데, 괜히 기능만 많아지는 것 같아서 헤더에서 엑세스 토큰을 받아온 후 처리하는 더 깔끔한 방식을 선택했다.

## 결론

일단 급한 문제는 해결되었지만, 앞으로 또 `deleted`로 바꾼 나비 효과가 언제 일어날지 모른다.

그렇기에 초반에 프로젝트 뼈대를 만들 때가 제일 중요한 것 같다. 앞으로는 hard delete 방식은 최대한 지양하고, soft delete 방식을 최우선으로 고려하려 한다.

> [해당 문제 이슈 링크](https://github.com/foody-moody/foodymoody/issues/640)
