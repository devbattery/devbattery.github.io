---
title: "[Project] 낙관적 락과 단일 Update 쿼리를 이용한 좋아요 동시성 문제 해결 방법"
excerpt: "movlit, solution, concurrency"

categories:
  - Project
tags:
  - [movlit, solution, concurrency]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-01-12
last_modified_at: 2025-03-25
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 서론

현재 프로젝트에서는 좋아요 기능이 총 2가지가 존재합니다. 영화나 도서에 대한 "찜" 기능과, 그 상세 페이지의 코멘트에 대한 "좋아요" 기능입니다.

찜과 좋아요는 사실상 기능상으로는 거의 동일하며, 주로 비즈니스적 의미에서 차이가 있습니다. 따라서 이 포스트에서는 구현의 복잡성을 줄이기 위해 영화 코멘트의 "좋아요" 기능을 예시로 동시성 처리 방식을 살펴보겠습니다.

## Entity

```java
package movlit.be.movie_comment_heart_count.domain.entity;

import javax.persistence.*; // 기본 JPA 어노테이션 import 추가
import lombok.AccessLevel; // Lombok 관련 import 추가
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import movlit.be.movie_comment.domain.vo.MovieCommentId; // Value Object import 추가
import movlit.be.movie_comment_heart_count.domain.vo.MovieCommentLikeCountId; // Value Object import 추가

@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Getter
@Table(name = "movie_comment_like_count") // 명시적인 테이블 이름 지정 (선택 사항이지만 권장)
public class MovieCommentLikeCountEntity {

    @EmbeddedId
    private MovieCommentLikeCountId movieCommentLikeCountId; // 복합 키 역할을 하는 ID

    // movieCommentId는 사실상 movieCommentLikeCountId에 포함될 수 있지만,
    // 검색 조건 등으로 자주 사용될 경우 별도 컬럼으로 관리하면 인덱싱 등에 유리할 수 있습니다.
    // 여기서는 별도 컬럼으로 관리하는 것으로 보입니다.
    @AttributeOverride(name = "value", column = @Column(name = "movie_comment_id", nullable = false)) // null 불가능 제약 조건 추가
    private MovieCommentId movieCommentId;

    @Column(nullable = false) // null 불가능 제약 조건 추가
    private Long count; // 좋아요 개수

    @Version // 낙관적 락(Optimistic Lock)을 위한 버전 필드
    private Long version;

    @Builder
    public MovieCommentLikeCountEntity(MovieCommentLikeCountId movieCommentLikeCountId, MovieCommentId movieCommentId, Long count) {
        this.movieCommentLikeCountId = movieCommentLikeCountId;
        this.movieCommentId = movieCommentId;
        this.count = count;
        // 초기 count 값 설정 시 version 필드는 JPA가 관리하므로 명시적으로 초기화하지 않습니다.
    }

}
```

- **`@Entity`**: 이 클래스가 JPA에 의해 관리되는 엔티티임을 나타냅니다. 데이터베이스 테이블과 매핑됩니다.
- **`@EmbeddedId`**: 기본 키가 단일 필드가 아닌, 여러 필드로 구성된 복합 키(Composite Key)임을 나타냅니다. `MovieCommentLikeCountId` 클래스가 이 복합 키를 정의합니다.
- **`@AttributeOverride`**: `MovieCommentId`와 같은 Value Object나 `@Embeddable` 타입 내부의 필드를 특정 컬럼에 매핑할 때 사용합니다. 여기서는 `MovieCommentId`의 `value` 필드를 데이터베이스의 `movie_comment_id` 컬럼에 매핑합니다.
- **`@Version`**: 엔티티의 **낙관적 락(Optimistic Lock)**을 위한 필드입니다.
  - 낙관적 락은 여러 트랜잭션이 **동시에 같은 데이터를 수정하지 않을 것이라고 가정**하고 진행합니다.
  - 엔티티를 수정하고 커밋하는 시점에, 이전에 읽었던 `@Version` 값과 데이터베이스의 현재 `@Version` 값을 비교합니다.
  - 만약 값이 다르면, 다른 트랜잭션이 먼저 데이터를 수정했다는 의미이므로, JPA는 `OptimisticLockingFailureException` (또는 유사한 예외)를 발생시켜 업데이트를 실패시킵니다.
  - 이를 통해 데이터 정합성을 보장하려 합니다. 하지만 주의할 점은, 아래에서 설명할 `@Modifying`을 사용한 벌크 연산에서는 이 `@Version` 체크가 기본적으로 동작하지 않습니다. `@Version`은 주로 엔티티를 조회(`find`)하고, setter 등으로 수정한 후 `save` (merge)하는 과정에서 동작합니다.

## 단일 Update 쿼리 (벌크 연산 활용)

```java
package movlit.be.movie_comment_heart_count.infra.persistence.jpa;

import movlit.be.movie_comment.domain.vo.MovieCommentId; // Value Object import
import movlit.be.movie_comment_heart_count.domain.entity.MovieCommentLikeCountEntity; // Entity import
import movlit.be.movie_comment_heart_count.domain.vo.MovieCommentLikeCountId; // Value Object import (ID 타입 일치 필요)
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param; // @Param import 추가

// Repository의 ID 타입을 Entity의 @EmbeddedId 타입과 일치시켜야 합니다.
public interface MovieCommentLikeCountJpaRepository extends JpaRepository<MovieCommentLikeCountEntity, MovieCommentLikeCountId> { // ID 타입 수정

    @Modifying(clearAutomatically = true) // 영속성 컨텍스트 자동 클리어 옵션 추가
    @Query("UPDATE MovieCommentLikeCountEntity mclc "
            + "SET mclc.count = mclc.count + 1 "
            + "WHERE mclc.movieCommentId = :movieCommentId")
    // 파라미터에 @Param 어노테이션 추가 (명시성 및 가독성 향상)
    void incrementMovieHeartCount(@Param("movieCommentId") MovieCommentId movieCommentId);

    @Modifying(clearAutomatically = true) // 영속성 컨텍스트 자동 클리어 옵션 추가
    @Query("UPDATE MovieCommentLikeCountEntity mclc "
            + "SET mclc.count = mclc.count - 1 "
            + "WHERE mclc.movieCommentId = :movieCommentId AND mclc.count > 0") // 음수 방지 조건 추가 (선택 사항)
    void decrementMovieHeartCount(@Param("movieCommentId") MovieCommentId movieCommentId);

    // movieCommentId로 엔티티를 찾는 메서드 (테스트 코드에서 사용됨)
    Optional<MovieCommentLikeCountEntity> findByMovieCommentId(MovieCommentId movieCommentId);

    /* 생략 */

}
```

- `JpaRepository`에서 좋아요 증감을 담당하는 두 메서드를 JPQL을 사용하여 직접 구현했습니다.
- **`@Modifying`**: 이 어노테이션은 해당 쿼리가 데이터를 변경하는 DML(INSERT, UPDATE, DELETE)임을 나타냅니다. `@Query` 어노테이션과 함께 사용됩니다.
  - **주의**: `@Modifying` 쿼리는 JPA의 영속성 컨텍스트를 거치지 않고 바로 데이터베이스로 실행됩니다 (벌크 연산). 따라서 영속성 컨텍스트에 있는 엔티티와 실제 DB 데이터 간의 불일치가 발생할 수 있습니다.
  - `clearAutomatically = true` 옵션을 사용하면, 해당 쿼리 실행 후 영속성 컨텍스트를 자동으로 클리어하여 데이터 불일치 문제를 방지할 수 있습니다. (하지만 성능 저하가 있을 수 있으니 상황에 맞게 사용해야 합니다.)
- **`@Query`**: JPQL(Java Persistence Query Language)이나 Native SQL을 직접 작성할 수 있게 해줍니다.
- **동시성 해결 방식**:
  - 엔티티를 조회하고 (`find`) → count 값을 자바 코드에서 변경하고 (`setCount(getCount() + 1)`) → 다시 저장하는 (`save`) 방식은 **Read-Modify-Write** 패턴입니다. 이 방식은 여러 스레드가 동시에 접근할 경우 **경쟁 상태(Race Condition)** 및 **갱신 손실(Lost Update)** 문제가 발생할 수 있습니다. `@Version`을 사용한 낙관적 락은 이 문제를 *감지*하고 예외를 발생시키는 방식입니다.
  - 하지만 위 코드처럼 `UPDATE ... SET count = count + 1 WHERE ...` 형태의 **단일 Update 쿼리**를 사용하면, 읽기(Read)와 쓰기(Write)가 데이터베이스 레벨에서 **원자적(Atomic)**으로 처리됩니다. 즉, 데이터베이스 시스템이 해당 로우(Row)에 대한 락(Row-level Lock)을 잠깐 획득하고 `count` 값을 증가시킨 후 락을 해제하는 방식으로 동작하여, 여러 요청이 동시에 들어와도 순차적으로 처리되어 데이터 정합성을 보장합니다.
  - 따라서, 이 `@Modifying` 쿼리 방식은 `@Version`을 사용한 낙관적 락의 *예외 처리 방식*과는 다르게, 데이터베이스의 원자적 연산을 활용하여 **애초에 동시성 문제 발생 자체를 회피**하는 전략입니다. 이 특정 UPDATE 연산에는 `@Version` 필드가 직접적으로 관여하지 않습니다.

## 단위 테스트 (동시성 테스트)

```java
package movlit.be.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
public class AppConfig {

    // CPU 코어 수는 Runtime.getRuntime().availableProcessors() 로 동적으로 가져올 수 있습니다.
    // 여기서는 예시로 8로 고정합니다. 실제 환경에서는 적절한 값을 설정해야 합니다.
    public static final int CORE_POOL_SIZE = 8;

    // ScheduledExecutorService 빈 설정 (필요시 사용)
    @Bean
    public ScheduledExecutorService scheduledExecutorService() {
        return Executors.newScheduledThreadPool(CORE_POOL_SIZE);
    }

    // 테스트에 사용할 ThreadPoolExecutor 빈 설정
    @Bean
    public ThreadPoolExecutor threadPoolExecutor() {
        // 고정된 스레드 개수를 가진 스레드 풀 생성
        return (ThreadPoolExecutor) Executors.newFixedThreadPool(CORE_POOL_SIZE);
    }

}
```

- `AppConfig` 클래스에 `ThreadPoolExecutor` 빈을 설정하여 테스트에서 멀티 스레드 환경을 구성할 수 있도록 준비합니다. 이는 동시에 여러 요청이 발생하는 상황을 시뮬레이션하기 위함입니다.

```java
package movlit.be.movie_comment_heart_count.application.service;

import movlit.be.movie_comment.domain.vo.MovieCommentId; // Value Object import
import movlit.be.movie_comment_heart_count.domain.entity.MovieCommentLikeCountEntity; // Entity import
import movlit.be.movie_comment_heart_count.domain.vo.MovieCommentLikeCountId; // Value Object import
import movlit.be.movie_comment_heart_count.infra.persistence.jpa.MovieCommentLikeCountJpaRepository; // Repository import
// import movlit.be.movie_comment_heart_count.infra.factory.IdFactory; // ID 생성 팩토리 (가정)
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.OptimisticLockingFailureException; // 예외 import (필요시)

import java.util.Optional;
import java.util.UUID; // 간단한 ID 생성을 위해 UUID 사용 (예시)
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ThreadPoolExecutor;

import static org.assertj.core.api.Assertions.assertThat;


// `@SpringBootTest`는 전체 Spring 컨텍스트를 로드하므로 통합 테스트에 적합합니다.
// 서비스 레이어만 테스트한다면 `@ExtendWith(MockitoExtension.class)` 등을 사용할 수도 있습니다.
@SpringBootTest
class MovieCommentLikeCountWriteServiceTest {

    @Autowired
    private MovieCommentLikeCountWriteService movieCommentLikeCountWriteService; // 테스트 대상 서비스

    @Autowired
    private ThreadPoolExecutor threadPoolExecutor; // 동시성 테스트를 위한 스레드 풀

    @Autowired
    private MovieCommentLikeCountJpaRepository movieCommentLikeCountJpaRepository; // 데이터 검증을 위한 리포지토리

    // 테스트 실행 전 초기 데이터 설정 (테스트 간 독립성 보장)
    @BeforeEach
    void setUp() {
        movieCommentLikeCountJpaRepository.deleteAllInBatch(); // deleteAll보다 효율적일 수 있음
    }

    // 테스트 실행 후 데이터 정리 (테스트 간 독립성 보장)
    @AfterEach
    void tearDown() {
        movieCommentLikeCountJpaRepository.deleteAllInBatch();
    }

    // 간단한 ID 생성 메서드 (예시)
    private MovieCommentLikeCountId createMovieCommentLikeCountId() {
        return new MovieCommentLikeCountId(UUID.randomUUID().toString());
    }

    @DisplayName("코멘트 좋아요 카운트를 1000번 비동기로 증가시키면 count가 1000 증가한다.")
    @Test
    void increment() throws InterruptedException { // InterruptedException 처리
        // given: 테스트 데이터 준비
        MovieCommentId movieCommentId = new MovieCommentId("1");
        MovieCommentLikeCountId movieCommentLikeCountId = createMovieCommentLikeCountId();
        // 초기 count 값 1로 저장
        movieCommentLikeCountJpaRepository.save(
                MovieCommentLikeCountEntity.builder()
                        .movieCommentLikeCountId(movieCommentLikeCountId)
                        .movieCommentId(movieCommentId)
                        .count(1L)
                        .build());

        int numberOfThreads = 1000;
        // CountDownLatch: 모든 스레드의 작업 완료를 기다리기 위한 동기화 도구
        CountDownLatch latch = new CountDownLatch(numberOfThreads);

        // when: 1000개의 스레드가 동시에 increment 메서드 호출
        for (int i = 0; i < numberOfThreads; i++) {
            threadPoolExecutor.execute(() -> {
                try {
                    // 실제 서비스 메서드를 호출합니다. (MovieCommentLikeCountWriteService 내부에서 incrementMovieHeartCount 호출 가정)
                    movieCommentLikeCountWriteService.incrementMovieCommentLikeCount(movieCommentId);
                } finally {
                    // 각 스레드의 작업이 끝나면 latch 카운트 감소
                    latch.countDown();
                }
            });
        }

        // latch.await(): 모든 스레드의 작업이 완료될 때까지 (latch 카운트가 0이 될 때까지) 대기
        latch.await();

        // then: 최종 결과 검증
        Optional<MovieCommentLikeCountEntity> response = movieCommentLikeCountJpaRepository.findByMovieCommentId(movieCommentId);
        assertThat(response).isPresent();
        // 초기값 1 + 1000번 증가 = 1001
        assertThat(response.get().getCount()).isEqualTo(1001L);
        // assertThat(response.get()).hasFieldOrPropertyWithValue("count", 1001L); // 이것도 가능
    }

    @DisplayName("코멘트 좋아요 카운트를 1000번 비동기로 감소시키면 count가 1000 감소한다.")
    @Test
    void decrement() throws InterruptedException { // InterruptedException 처리
        // given: 테스트 데이터 준비
        MovieCommentId movieCommentId = new MovieCommentId("1");
        MovieCommentLikeCountId movieCommentLikeCountId = createMovieCommentLikeCountId();
        // 초기 count 값 1000으로 저장
        movieCommentLikeCountJpaRepository.save(
                MovieCommentLikeCountEntity.builder()
                        .movieCommentLikeCountId(movieCommentLikeCountId)
                        .movieCommentId(movieCommentId)
                        .count(1000L)
                        .build());

        int numberOfThreads = 1000;
        CountDownLatch latch = new CountDownLatch(numberOfThreads);

        // when: 1000개의 스레드가 동시에 decrement 메서드 호출
        for (int i = 0; i < numberOfThreads; i++) {
            threadPoolExecutor.execute(() -> {
                try {
                    // 실제 서비스 메서드를 호출합니다. (MovieCommentLikeCountWriteService 내부에서 decrementMovieHeartCount 호출 가정)
                    movieCommentLikeCountWriteService.decrementMovieCommentLikeCount(movieCommentId);
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();

        // then: 최종 결과 검증
        Optional<MovieCommentLikeCountEntity> response = movieCommentLikeCountJpaRepository.findByMovieCommentId(movieCommentId);
        assertThat(response).isPresent();
        // 초기값 1000 - 1000번 감소 = 0
        assertThat(response.get().getCount()).isEqualTo(0L);
        // assertThat(response.get()).hasFieldOrPropertyWithValue("count", 0L); // 이것도 가능
    }
}
```

- **`@SpringBootTest`**: 스프링 부트 애플리케이션 테스트를 위한 어노테이션으로, 전체 애플리케이션 컨텍스트를 로드하여 통합 테스트를 수행할 수 있게 합니다. `@Autowired`를 통해 빈(Bean)들을 주입받아 사용할 수 있습니다.
- **`ThreadPoolExecutor`**: 설정된 스레드 풀을 사용하여 `increment/decrement` 메서드를 동시에 여러 번(여기서는 1000번) 호출합니다. 이는 실제 서비스 환경에서 여러 사용자가 거의 동시에 좋아요/취소 요청을 보내는 상황을 시뮬레이션합니다.
- **`CountDownLatch`**: 여러 스레드에서 수행되는 작업이 모두 완료될 때까지 메인 스레드(테스트 스레드)가 대기하도록 만드는 동기화 보조 도구입니다. `new CountDownLatch(1000)`으로 생성하고, 각 스레드가 작업을 완료할 때마다 `latch.countDown()`을 호출합니다. 메인 스레드는 `latch.await()`에서 대기하다가 카운트가 0이 되면 다음 코드(결과 검증)를 실행합니다.
- **테스트 결과**: 테스트가 성공적으로 통과하는 것은 `@Modifying`과 단일 `UPDATE` 쿼리를 사용한 방식이 동시성 환경에서도 예상대로 동작함을 보여줍니다. 즉, 데이터베이스의 원자적 연산 덕분에 1000번의 동시 증가/감소 요청이 정확히 반영되어 최종 `count` 값이 기대한 대로 나옵니다. 만약 Read-Modify-Write 방식을 사용하고 별도의 락 메커니즘이 없었다면, 이 테스트는 높은 확률로 실패했을 것입니다 (갱신 손실 발생).

## 결론

좋아요 수와 같이 동시 업데이트가 빈번하게 발생할 수 있는 데이터의 경우, JPA 엔티티를 조회하여 애플리케이션 레벨에서 값을 변경하고 저장하는 방식(Read-Modify-Write)은 동시성 문제에 취약할 수 있습니다. `@Version`을 이용한 낙관적 락은 이러한 문제를 감지하고 예외를 통해 처리할 수 있지만, 충돌이 잦다면 예외 처리 로직이 복잡해지거나 성능에 영향을 줄 수 있습니다.

대안으로, 이 포스트에서 살펴본 것처럼 `@Modifying` 어노테이션과 함께 JPQL/SQL을 사용하여 데이터베이스 레벨에서 직접 `UPDATE ... SET count = count + 1`과 같은 원자적 연산을 수행하는 것이 효과적인 해결책이 될 수 있습니다. 이 방식은 데이터베이스의 동시성 제어 메커니즘을 활용하여 애플리케이션 코드의 복잡성을 줄이면서 데이터 정합성을 보장하는 데 도움이 됩니다.
