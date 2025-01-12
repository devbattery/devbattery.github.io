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
last_modified_at: 2025-01-12
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 서론

현재 프로젝트에서는 좋아요 기능이 총 2가지가 존재한다. 영화나 도서에 대한 "찜" 기능과, 그 상세 페이지의 코멘트에 대한 "좋아요" 기능이다.

찜과 좋아요는 사실상 기능상으로는 같은 의미이고, 비즈니스적 의미만 다르기 때문에 이 포스트에서는 영화 코멘트에 대하여 살펴보겠다.

## Entity

```java
package movlit.be.movie_comment_heart_count.domain.entity;

@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Getter
public class MovieCommentLikeCountEntity {

    @EmbeddedId
    private MovieCommentLikeCountId movieCommentLikeCountId;

    @AttributeOverride(name = "value", column = @Column(name = "movie_comment_id"))
    private MovieCommentId movieCommentId;

    private Long count;

    @Version
    private Long version;

    @Builder
    public MovieCommentLikeCountEntity(MovieCommentLikeCountId movieCommentLikeCountId, MovieCommentId movieCommentId, Long count) {
        this.movieCommentLikeCountId = movieCommentLikeCountId;
        this.movieCommentId = movieCommentId;
        this.count = count;
    }

}
```

- `version` 필드를 보면, `@Version` 어노테이션으로 **동시에 같은 데이터를 수정하지 않을 것이라고 가정**하는 낙관적 락을 건 것을 확인할 수 있다.
  - 이는, JPA가 낙관적 락을 관리하는 데 사용된다.

## 단일 Update 쿼리

```java
package movlit.be.movie_comment_heart_count.infra.persistence.jpa;

public interface MovieCommentLikeCountJpaRepository extends JpaRepository<MovieCommentLikeCountEntity, MovieHeartCountId> {

    @Modifying
    @Query("UPDATE MovieCommentLikeCountEntity mclc "
            + "SET mclc.count = mclc.count + 1 "
            + "WHERE mclc.movieCommentId = :movieCommentId")
    void incrementMovieHeartCount(MovieCommentId movieCommentId);

    @Modifying
    @Query("UPDATE MovieCommentLikeCountEntity mclc "
            + "SET mclc.count = mclc.count - 1 "
            + "WHERE mclc.movieCommentId = :movieCommentId")
    void decrementMovieHeartCount(MovieCommentId movieCommentId);

    /* 생략 */

}
```

- `JpaRepository`에서 좋아요 증감을 담당하는 두 메서드를 구현했다.
- 낙관적 락을 적용한 상태에서, 이렇게 단일 Update 쿼리문으로 직접 count를 1씩 증가시켜주면 동시성 문제는 해결된다.

## 단위 테스트

```java
package movlit.be.common.config;

@Configuration
public class AppConfig {

    // cpu 코어 수에 따라 적절한 값을 설정한다.
    public static final int CORE_POOL_SIZE = 8;

    @Bean
    public ScheduledExecutorService scheduledExecutorService() {
        return Executors.newScheduledThreadPool(CORE_POOL_SIZE);
    }

    @Bean
    public ThreadPoolExecutor threadPoolExecutor() {
        return (ThreadPoolExecutor) Executors.newFixedThreadPool(CORE_POOL_SIZE);
    }

}
```

```java
package movlit.be.movie_comment_heart_count.application.service;

@SpringBootTest
class MovieCommentLikeCountWriteServiceTest {

    @Autowired
    private MovieCommentLikeCountWriteService movieCommentLikeCountWriteService;

    @Autowired
    private ThreadPoolExecutor threadPoolExecutor;

    @Autowired
    private MovieCommentLikeCountJpaRepository movieCommentLikeCountJpaRepository;

    @BeforeEach
    void setUp() {
        movieCommentLikeCountJpaRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        movieCommentLikeCountJpaRepository.deleteAll();
    }

    @DisplayName("코멘트 좋아요 카운트를 1000번 비동기로 증가시키면 1000번 증가한다.")
    @Test
    void increment() {
        // given
        MovieCommentId movieCommentId = new MovieCommentId("1");
        MovieCommentLikeCountId movieCommentLikeCountId = IdFactory.createMovieCommentLikeCountId();
        movieCommentLikeCountJpaRepository.save(
                new MovieCommentLikeCountEntity(movieCommentLikeCountId, movieCommentId, 1L));
        CountDownLatch latch = new CountDownLatch(1000);

        // when
        for (int i = 0; i < 1000; i++) {
            threadPoolExecutor.execute(() -> {
                movieCommentLikeCountWriteService.incrementMovieCommentLikeCount(movieCommentId);
                latch.countDown();
            });
        }
        try {
            latch.await();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        // then
        Optional<MovieCommentLikeCountEntity> response = movieCommentLikeCountJpaRepository.findByMovieCommentId(
                movieCommentId);
        assertThat(response).isPresent();
        assertThat(response.get()).hasFieldOrPropertyWithValue("count", 1001L);
    }

    @DisplayName("코멘트 좋아요 카운트를 1000번 비동기로 감소시키면 1000번 감소한다.")
    @Test
    void decrement() {
        // given
        MovieCommentId movieCommentId = new MovieCommentId("1");
        MovieCommentLikeCountId movieCommentLikeCountId = IdFactory.createMovieCommentLikeCountId();
        movieCommentLikeCountJpaRepository.save(
                new MovieCommentLikeCountEntity(movieCommentLikeCountId, movieCommentId, 1000L));
        CountDownLatch latch = new CountDownLatch(1000);

        // when
        for (int i = 0; i < 1000; i++) {
            threadPoolExecutor.execute(() -> {
                movieCommentLikeCountWriteService.decrementMovieCommentLikeCount(movieCommentId);
                latch.countDown();
            });
        }
        try {
            latch.await();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        // then
        Optional<MovieCommentLikeCountEntity> response = movieCommentLikeCountJpaRepository.findByMovieCommentId(
                movieCommentId);
        assertThat(response).isPresent();
        assertThat(response.get()).hasFieldOrPropertyWithValue("count", 0L);
    }


}
```

- `ThreadPoolExecutor`를 사용하기 위해 `AppConfig`에 그에 필요한 세팅을 했다.
- 각각 좋아요 증감을 1000번 비동기로 돌려 테스트를 진행하면 문제 없이 작동하는 것을 확인할 수 있다.
