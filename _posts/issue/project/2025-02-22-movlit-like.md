---
title: "[Project] Spring Boot로 좋아요 기능 구현과 낙관적 락으로 동시성 문제 해결"
excerpt: "movlit, spring"

categories:
  - Project
tags:
  - [movlit, spring]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-22
last_modified_at: 2025-02-22
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 1. 좋아요(Like)와 좋아요 카운트(LikeCount) 분리 배경

일반적으로 “좋아요” 기능을 구현할 때에는 단순히 `Like` 테이블에만 count를 저장하거나, “좋아요” 데이터 자체를 insert할 때 카운트를 함께 업데이트하기도 합니다.  
하지만 “좋아요”가 많이 눌리는 서비스일수록 **조회성**과 **쓰기**(update) 연산이 동시에 많아지게 되고, 이에 따른 **동시성 이슈**가 발생할 확률이 높아집니다.

- **좋아요 자체(Like) 엔티티**: 누가 어떤 대상(댓글, 포스트 등)에 좋아요를 눌렀는지 저장
- **좋아요 카운트(LikeCount) 엔티티**: 특정 대상(댓글)에 대해 몇 개의 좋아요가 있는지 집계

좋아요의 누적 개수를 별도 테이블에 저장(캐싱)함으로써 **조회 성능**을 높일 수 있고, 동시에 직접 카운트를 업데이트하므로써 **동시성에 대한 제어**도 유연하게 처리할 수 있습니다.

## 2. 프로젝트 구조

여기서는 `MovieCommentLike`와 `MovieCommentLikeCount` 두 가지 도메인으로 분리했습니다.

```
└── movie_comment_heart
    ├── domain
    │   ├── entity
    │   └── repository
    ├── application
    │   ├── service
    │   └── dto
    └── presentation
        ├── controller
        └── dto

└── movie_comment_heart_count
    ├── domain
    │   ├── entity
    │   └── repository
    ├── application
    │   ├── service
    └── infra
```

- `MovieCommentLikeEntity`: 어떤 멤버가 어떤 댓글에 좋아요를 눌렀는지 저장
- `MovieCommentLikeCountEntity`: 특정 댓글에 총 몇 개의 좋아요가 있는지 저장

이 분리를 통해 **읽기(조회) 부하**와 **쓰기(업데이트) 부하**를 나누어 처리할 수 있게 됩니다.

## 3. 코드 상세

### 3.1 MovieCommentLikeEntity (좋아요 엔티티)

```java
package movlit.be.movie_comment_heart.domain.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import movlit.be.common.util.ids.MemberId;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.common.util.ids.MovieCommentLikeId;

@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Entity
@Table(name = "movie_comment_like")
public class MovieCommentLikeEntity {

    @EmbeddedId
    private MovieCommentLikeId movieCommentLikeId;

    @AttributeOverride(name = "value", column = @Column(name = "movie_comment_id"))
    private MovieCommentId movieCommentId;

    @AttributeOverride(name = "value", column = @Column(name = "member_id"))
    private MemberId memberId;

    private boolean isLiked;

    @Builder
    public MovieCommentLikeEntity(MovieCommentLikeId movieCommentLikeId, MovieCommentId movieCommentId,
                                  MemberId memberId, boolean isLiked) {
        this.movieCommentLikeId = movieCommentLikeId;
        this.movieCommentId = movieCommentId;
        this.memberId = memberId;
        this.isLiked = isLiked;
    }

}
```

- `@EmbeddedId`를 사용하여 식별자를 관리합니다.
- `MovieCommentLikeId`는 커스텀 VO(Value Object)로, 단순히 Long 타입 ID 대신 wrapping하여 사용합니다.

### 3.2 MovieCommentLikeCountEntity (좋아요 카운트 엔티티)

```java
package movlit.be.movie_comment_heart_count.domain.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.common.util.ids.MovieCommentLikeCountId;

@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Getter
@Table(name = "movie_comment_like_count")
public class MovieCommentLikeCountEntity {

    @EmbeddedId
    private MovieCommentLikeCountId movieCommentLikeCountId;

    @AttributeOverride(name = "value", column = @Column(name = "movie_comment_id"))
    private MovieCommentId movieCommentId;

    private Long count;

    @Version
    private Long version; // Optimistic Lock을 위한 버전 필드

    @Builder
    public MovieCommentLikeCountEntity(MovieCommentLikeCountId movieCommentLikeCountId,
                                       MovieCommentId movieCommentId,
                                       Long count) {
        this.movieCommentLikeCountId = movieCommentLikeCountId;
        this.movieCommentId = movieCommentId;
        this.count = count;
    }

}
```

- `count` 컬럼에 댓글의 총 좋아요 갯수를 저장합니다.
- `@Version`을 통해 **Optimistic Lock**을 적용할 수도 있습니다. (직접 JPQL `update`를 사용하는 경우에는 주의가 필요합니다.)

### 3.3 Repository (좋아요)

```java
package movlit.be.movie_comment_heart.domain.repository;

import movlit.be.common.util.ids.MemberId;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.movie_comment_heart.application.service.dto.response.MovieCommentLikeSavedResponse;
import movlit.be.movie_comment_heart.domain.entity.MovieCommentLikeEntity;

public interface MovieCommentLikeRepository {

    MovieCommentLikeSavedResponse like(MovieCommentLikeEntity movieCommentLikeEntity);

    void deleteByMovieCommentId(MovieCommentId movieCommentId);

    boolean existsByMovieCommentIdAndMemberId(MovieCommentId movieCommentId, MemberId memberId);

}
```

```java
package movlit.be.movie_comment_heart.infra.persistence;

import movlit.be.common.util.ids.MemberId;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.common.util.ids.MovieHeartId;
import movlit.be.movie_comment_heart.domain.entity.MovieCommentLikeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieCommentLikeJpaRepository extends JpaRepository<MovieCommentLikeEntity, MovieHeartId> {

    boolean existsByMovieCommentIdAndMemberId(MovieCommentId movieCommentId, MemberId memberId);

    void deleteByMovieCommentId(MovieCommentId movieCommentId);

}
```

```java
package movlit.be.movie_comment_heart.infra;

import lombok.RequiredArgsConstructor;
import movlit.be.common.util.ids.MemberId;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.movie_comment_heart.application.service.dto.response.MovieCommentLikeSavedResponse;
import movlit.be.movie_comment_heart.domain.entity.MovieCommentLikeEntity;
import movlit.be.movie_comment_heart.domain.repository.MovieCommentLikeRepository;
import movlit.be.movie_comment_heart.infra.persistence.MovieCommentLikeJpaRepository;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class MovieCommentLikeRepositoryImpl implements MovieCommentLikeRepository {

    private final MovieCommentLikeJpaRepository movieCommentLikeJpaRepository;

    @Override
    public MovieCommentLikeSavedResponse like(MovieCommentLikeEntity movieCommentLikeEntity) {
        MovieCommentLikeEntity savedEntity = movieCommentLikeJpaRepository.save(movieCommentLikeEntity);
        return MovieCommentLikeSavedResponse.from(savedEntity.getMovieCommentId(), savedEntity.getMovieCommentLikeId());
    }

    @Override
    public void deleteByMovieCommentId(MovieCommentId movieCommentId) {
        movieCommentLikeJpaRepository.deleteByMovieCommentId(movieCommentId);
    }

    @Override
    public boolean existsByMovieCommentIdAndMemberId(MovieCommentId movieCommentId, MemberId memberId) {
        return movieCommentLikeJpaRepository.existsByMovieCommentIdAndMemberId(movieCommentId, memberId);
    }

}
```

### 3.4 Repository (좋아요 카운트)

```java
package movlit.be.movie_comment_heart_count.domain;

import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.common.util.ids.MovieCommentLikeId;
import movlit.be.movie_comment_heart.presentation.dto.response.MovieCommentLikeResponse;
import movlit.be.movie_comment_heart_count.domain.entity.MovieCommentLikeCountEntity;

public interface MovieCommentLikeCountRepository {

    MovieCommentLikeCountEntity save(MovieCommentLikeCountEntity movieHeartCountEntity);

    void incrementMovieCommentLikeCount(MovieCommentId movieCommentId);

    void decrementMovieCommentLikeCount(MovieCommentId movieCommentId);

    MovieCommentLikeResponse fetchMovieCommentLikeResponse(MovieCommentLikeId movieCommentLikeId);

}
```

```java
package movlit.be.movie_comment_heart_count.infra.persistence.jpa;

import java.util.Optional;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.common.util.ids.MovieCommentLikeId;
import movlit.be.common.util.ids.MovieHeartCountId;
import movlit.be.movie_comment_heart.presentation.dto.response.MovieCommentLikeResponse;
import movlit.be.movie_comment_heart_count.domain.entity.MovieCommentLikeCountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MovieCommentLikeCountJpaRepository extends JpaRepository<MovieCommentLikeCountEntity, MovieHeartCountId> {

    @Modifying
    @Query("UPDATE MovieCommentLikeCountEntity mclc "
            + "SET mclc.count = mclc.count + 1 "
            + "WHERE mclc.movieCommentId = :movieCommentId")
    void incrementMovieCommentLikeCount(@Param("movieCommentId") MovieCommentId movieCommentId);

    @Modifying
    @Query("UPDATE MovieCommentLikeCountEntity mclc "
            + "SET mclc.count = mclc.count - 1 "
            + "WHERE mclc.movieCommentId = :movieCommentId")
    void decrementMovieCommentLikeCount(@Param("movieCommentId") MovieCommentId movieCommentId);

    @Query("SELECT NEW movlit.be.movie_comment_heart.presentation.dto.response.MovieCommentLikeResponse("
            + "mcl.movieCommentLikeId, mcl.movieCommentId, mcl.memberId, mcl.isLiked, mclc.count) "
            + "FROM MovieCommentLikeEntity mcl "
            + "LEFT JOIN MovieCommentLikeCountEntity mclc ON mclc.movieCommentId = mcl.movieCommentId "
            + "WHERE mcl.movieCommentLikeId = :movieCommentLikeId")
    Optional<MovieCommentLikeResponse> findMovieCommentLikeResponse(
            @Param("movieCommentLikeId") MovieCommentLikeId movieCommentLikeId);

    Optional<MovieCommentLikeCountEntity> findByMovieCommentId(MovieCommentId movieCommentId);
}
```

```java
package movlit.be.movie_comment_heart_count.infra.persistence;

import lombok.RequiredArgsConstructor;
import movlit.be.common.exception.MovieCommentLikeNotFoundException;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.common.util.ids.MovieCommentLikeId;
import movlit.be.movie_comment_heart.presentation.dto.response.MovieCommentLikeResponse;
import movlit.be.movie_comment_heart_count.domain.MovieCommentLikeCountRepository;
import movlit.be.movie_comment_heart_count.domain.entity.MovieCommentLikeCountEntity;
import movlit.be.movie_comment_heart_count.infra.persistence.jpa.MovieCommentLikeCountJpaRepository;
import org.springframework.stereotype.Repository;

@RequiredArgsConstructor
@Repository
public class MovieCommentLikeCountRepositoryImpl implements MovieCommentLikeCountRepository {

    private final MovieCommentLikeCountJpaRepository movieCommentLikeCountJpaRepository;

    @Override
    public MovieCommentLikeCountEntity save(MovieCommentLikeCountEntity movieHeartCountEntity) {
        return movieCommentLikeCountJpaRepository.save(movieHeartCountEntity);
    }

    @Override
    public void incrementMovieCommentLikeCount(MovieCommentId movieCommentId) {
        movieCommentLikeCountJpaRepository.incrementMovieCommentLikeCount(movieCommentId);
    }

    @Override
    public void decrementMovieCommentLikeCount(MovieCommentId movieCommentId) {
        movieCommentLikeCountJpaRepository.decrementMovieCommentLikeCount(movieCommentId);
    }

    @Override
    public MovieCommentLikeResponse fetchMovieCommentLikeResponse(MovieCommentLikeId movieCommentLikeId) {
        return movieCommentLikeCountJpaRepository.findMovieCommentLikeResponse(movieCommentLikeId)
                .orElseThrow(MovieCommentLikeNotFoundException::new);
    }
}
```

### 3.5 서비스 레이어

#### 3.5.1 좋아요 Read Service

```java
package movlit.be.movie_comment_heart.application.service;

import lombok.RequiredArgsConstructor;
import movlit.be.common.util.ids.MemberId;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.movie_comment_heart.domain.repository.MovieCommentLikeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MovieCommentLikeReadService {

    private final MovieCommentLikeRepository movieCommentLikeRepository;

    public boolean existsByMovieCommentIdAndMemberId(MovieCommentId movieCommentId, MemberId memberId) {
        return movieCommentLikeRepository.existsByMovieCommentIdAndMemberId(movieCommentId, memberId);
    }

}
```

좋아요가 이미 눌려있는지(존재하는지) 확인하는 로직만 담당합니다.

#### 3.5.2 좋아요 Write Service

```java
package movlit.be.movie_comment_heart.application.service;

import lombok.RequiredArgsConstructor;
import movlit.be.common.exception.MovieCommentLikeAlreadyExistsException;
import movlit.be.common.util.ids.MemberId;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.member.application.service.MemberReadService;
import movlit.be.movie.application.converter.detail.MovieConvertor;
import movlit.be.movie_comment_heart.application.service.dto.response.MovieCommentLikeSavedResponse;
import movlit.be.movie_comment_heart.domain.repository.MovieCommentLikeRepository;
import movlit.be.movie_comment_heart.presentation.dto.response.MovieCommentLikeResponse;
import movlit.be.movie_comment_heart_count.application.service.MovieCommentLikeCountReadService;
import movlit.be.movie_comment_heart_count.application.service.MovieCommentLikeCountWriteService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class MovieCommentLikeWriteService {

    private final MovieCommentLikeRepository movieCommentLikeRepository;
    private final MovieCommentLikeReadService movieCommentLikeReadService;
    private final MovieCommentLikeCountWriteService movieCommentLikeCountWriteService;
    private final MovieCommentLikeCountReadService movieCommentLikeCountReadService;
    private final MemberReadService memberReadService;

    public MovieCommentLikeResponse like(MemberId memberId, MovieCommentId movieCommentId) {
        // 1) 회원 유효성 검사
        memberReadService.validateMemberIdExists(memberId);
        // 2) 이미 좋아요 눌렀는지 확인
        validateMovieCommentLikeExists(movieCommentId, memberId);
        // 3) 좋아요 엔티티 저장
        MovieCommentLikeSavedResponse likedData = movieCommentLikeRepository.like(
                MovieConvertor.makeMovieCommentLikeEntity(memberId, movieCommentId));
        // 4) 좋아요 카운트 증가
        movieCommentLikeCountWriteService.incrementMovieCommentLikeCount(likedData.getMovieCommentId());
        // 5) 최종 응답(좋아요 정보 + 좋아요 카운트)
        return movieCommentLikeCountReadService.fetchMovieCommentLikeResponse(
                likedData.getMovieCommentLikeId());
    }

    public void unlike(MemberId memberId, MovieCommentId commentId) {
        // 1) 회원 유효성 검사
        memberReadService.validateMemberIdExists(memberId);
        // 2) 좋아요 존재 여부 확인
        validateMovieCommentLikeNotExist(commentId, memberId);
        // 3) 좋아요 삭제
        movieCommentLikeRepository.deleteByMovieCommentId(commentId);
        // 4) 좋아요 카운트 감소
        movieCommentLikeCountWriteService.decrementMovieCommentLikeCount(commentId);
    }

    public void validateMovieCommentLikeExists(MovieCommentId movieCommentId, MemberId memberId) {
        if (movieCommentLikeReadService.existsByMovieCommentIdAndMemberId(movieCommentId, memberId)) {
            throw new MovieCommentLikeAlreadyExistsException();
        }
    }

    public void validateMovieCommentLikeNotExist(MovieCommentId movieCommentId, MemberId memberId) {
        if (!movieCommentLikeReadService.existsByMovieCommentIdAndMemberId(movieCommentId, memberId)) {
            throw new MovieCommentLikeAlreadyExistsException();
        }
    }

}
```

- `like()` 메서드가 호출되면,
  1. 유효성 검사 -> 2) 중복 좋아요 확인 -> 3) 좋아요 엔티티 저장 -> 4) 카운트 증가 -> 5) 최종 응답 리턴
- `unlike()` 메서드는 반대로 좋아요를 제거하고 카운트를 감소시킵니다.

#### 3.5.3 좋아요 카운트 Read / Write Service

```java
package movlit.be.movie_comment_heart_count.application.service;

import lombok.RequiredArgsConstructor;
import movlit.be.common.util.ids.MovieCommentLikeId;
import movlit.be.movie_comment_heart.presentation.dto.response.MovieCommentLikeResponse;
import movlit.be.movie_comment_heart_count.domain.MovieCommentLikeCountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Transactional(readOnly = true)
@RequiredArgsConstructor
@Service
public class MovieCommentLikeCountReadService {

    private final MovieCommentLikeCountRepository movieCommentLikeCountRepository;

    public MovieCommentLikeResponse fetchMovieCommentLikeResponse(MovieCommentLikeId movieCommentLikeId) {
        return movieCommentLikeCountRepository.fetchMovieCommentLikeResponse(movieCommentLikeId);
    }

}
```

```java
package movlit.be.movie_comment_heart_count.application.service;

import lombok.RequiredArgsConstructor;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.movie_comment_heart_count.domain.MovieCommentLikeCountRepository;
import movlit.be.movie_comment_heart_count.domain.entity.MovieCommentLikeCountEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@RequiredArgsConstructor
@Service
public class MovieCommentLikeCountWriteService {

    private final MovieCommentLikeCountRepository movieCommentLikeCountRepository;

    public void save(MovieCommentLikeCountEntity movieCommentLikeCountEntity) {
        movieCommentLikeCountRepository.save(movieCommentLikeCountEntity);
    }

    public void incrementMovieCommentLikeCount(MovieCommentId movieCommentId) {
        movieCommentLikeCountRepository.incrementMovieCommentLikeCount(movieCommentId);
    }

    public void decrementMovieCommentLikeCount(MovieCommentId movieCommentId) {
        movieCommentLikeCountRepository.decrementMovieCommentLikeCount(movieCommentId);
    }

}
```

> `incrementMovieCommentLikeCount()` / `decrementMovieCommentLikeCount()` 에서는 JPQL `update`문을 사용하여 카운트를 1씩 증가/감소시킵니다.  
> 별도의 **동시성 제어**가 필요한 경우, `@Version` 필드를 활용하거나, 더 세밀한 락(Optimistic/Pessimistic Lock)을 사용할 수도 있습니다.

### 3.6 Controller

```java
package movlit.be.movie_comment_heart.presentation;

import lombok.RequiredArgsConstructor;
import movlit.be.auth.application.service.MyMemberDetails;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.movie_comment_heart.application.service.MovieCommentLikeWriteService;
import movlit.be.movie_comment_heart.presentation.dto.response.MovieCommentLikeResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
public class MovieCommentLikeController {

    private final MovieCommentLikeWriteService movieCommentLikeWriteService;

    @PostMapping("/api/movies/comments/{commentId}/likes")
    public ResponseEntity<MovieCommentLikeResponse> like(@PathVariable MovieCommentId commentId,
                                                         @AuthenticationPrincipal MyMemberDetails details) {
        var response = movieCommentLikeWriteService.like(details.getMemberId(), commentId);
        return ResponseEntity.ok().body(response);
    }

    @DeleteMapping("/api/movies/comments/{commentId}/likes")
    public ResponseEntity<Void> unlike(@PathVariable MovieCommentId commentId,
                                       @AuthenticationPrincipal MyMemberDetails details) {
        movieCommentLikeWriteService.unlike(details.getMemberId(), commentId);
        return ResponseEntity.ok().build();
    }

}
```

- `/api/movies/comments/{commentId}/likes`
  - `POST`는 **좋아요 누르기**
  - `DELETE`는 **좋아요 취소**

### 3.7 DTO

```java
package movlit.be.movie_comment_heart.presentation.dto.response;

import movlit.be.common.util.ids.MemberId;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.common.util.ids.MovieCommentLikeId;

public record MovieCommentLikeResponse(
    MovieCommentLikeId movieCommentLikeId,
    MovieCommentId movieCommentId,
    MemberId memberId,
    boolean isLiked,
    Long movieCommentLikeCount
) { }
```

```java
package movlit.be.movie_comment_heart.application.service.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import movlit.be.common.util.ids.MovieCommentId;
import movlit.be.common.util.ids.MovieCommentLikeId;

@NoArgsConstructor
@Getter
public class MovieCommentLikeSavedResponse {

    private MovieCommentId movieCommentId;
    private MovieCommentLikeId movieCommentLikeId;

    private MovieCommentLikeSavedResponse(MovieCommentId movieCommentId, MovieCommentLikeId movieCommentLikeId) {
        this.movieCommentId = movieCommentId;
        this.movieCommentLikeId = movieCommentLikeId;
    }

    public static MovieCommentLikeSavedResponse from(MovieCommentId movieCommentId,
                                                     MovieCommentLikeId movieCommentLikeId) {
        return new MovieCommentLikeSavedResponse(movieCommentId, movieCommentLikeId);
    }

}
```

- `MovieCommentLikeResponse`는 최종적으로 Controller에서 응답하기 위한 DTO입니다.
- `MovieCommentLikeSavedResponse`는 Repository를 통해 **Like 엔티티가 저장된 후** 필요한 정보를 담아 반환합니다.

## 4. 동시성 문제 해결 전략

### 4.1 Optimistic Lock 활용 (`@Version`)

- `MovieCommentLikeCountEntity`에 `@Version` 필드를 두어 **낙관적 락**을 사용할 수 있습니다.
- 하지만 현재 예시에서는 JPQL `update`(`incrementMovieCommentLikeCount()`, `decrementMovieCommentLikeCount()`)를 직접 사용 중이므로, 낙관적 락이 적용되려면 **update 전에 엔티티를 조회**해야 합니다.
- 대규모 트래픽 상황에서 **동시성**이 더욱 중요한 경우, **Pessimistic Lock** 또는 **별도의 Redis 카운팅** 같은 확장 방안을 고려할 수 있습니다.

### 4.2 분산 락 / Redis 카운팅

- 단일 서버가 아닌 여러 서버(분산 환경)에서 동시 요청이 몰릴 경우, DB 레벨에서의 트랜잭션만으로는 부족할 수 있습니다.
- 이 경우 **Redis**를 사용해 **카운트 증가/감소 연산**을 원자적으로 수행하거나, **분산 락**(예: Redis나 Zookeeper 기반)을 활용하여 동시성 이슈를 줄일 수 있습니다.

## 5. 정리

- **좋아요**(Like)와 **좋아요 카운트**(LikeCount)를 분리하여,
  - 좋아요 데이터의 CRUD는 `MovieCommentLikeEntity`
  - 좋아요 카운트 누적 관리는 `MovieCommentLikeCountEntity`  
    로 나누어 구현했습니다.
- 이로써 조회 시에는 단순히 `MovieCommentLikeCountEntity`만 조회하여 퍼포먼스를 높일 수 있고,  
  좋아요 누르기/취소 시에도 **트랜잭션** 안에서 각각의 로직을 깔끔하게 분리할 수 있습니다.
- **동시성**에 대해서는 현재 JPA의 `@Version`(낙관적 락) 필드를 활용 가능하지만,  
  **JPQL 업데이트** 시에는 엔티티를 다시 읽는 로직이 들어가야 실제 락이 걸릴 수 있다는 점을 유의해야 합니다.
- 규모가 커질수록 Redis 등 별도 캐시에 카운팅 로직을 위임하거나, 더 정교한 분산 락 방식을 적용하는 확장이 가능합니다.

> **정리하자면**, “좋아요” 테이블과 “좋아요 카운트” 테이블을 분리해두면, 조회 로직과 쓰기 로직을 나누어 부담을 줄이고, 확장성 있는 구조를 만들 수 있습니다. 또한 트랜잭션 레벨에서 낙관적/비관적 락을 적용해 동시성 문제를 완화할 수 있습니다.
