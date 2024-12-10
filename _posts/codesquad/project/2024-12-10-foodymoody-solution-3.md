---
title: "[Project] Spring Data Redis - Could not safely identify store assignment for repository candidate interface 에러 해결"
excerpt: "foodymoody, solution"

categories:
  - Project
tags:
  - [foodymoody, solution]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-12-10
last_modified_at: 2024-12-10
---

> [FoodyMoody 프로젝트](https://github.com/foody-moody/foodymoody)에 대한 설명입니다.

## 문제 발생

```
2024-12-10 03:22:16.004  INFO 1 --- [           main] .RepositoryConfigurationExtensionSupport : Spring Data Redis - Could not safely identify store assignment for repository candidate interface com.foodymoody.be.feed_collection_comment.infra.persistence.jpa.FeedCollectionCommentJpaRepository; If you want this repository to be a Redis repository, consider annotating your entities with one of these annotations: org.springframework.data.redis.core.RedisHash (preferred), or consider extending one of the following types with your repository: org.springframework.data.keyvalue.repository.KeyValueRepository
```

지금 처음 발견한 에러는 아니지만, 운영 초반부터 계속 눈에 거슬리는 로그가 있었다. 그 당시에는 프로그램은 잘 돌아가니 후순위에 두었는데, 진짜 에러가 발생했을 떄 이 로그 때문에 여간 힘든 게 아니었다.

하지만 이 문제가 심각하다는 것을 테스트 코드를 다시 돌려보고 깨닫게 되었다. 대부분의 테스트 코드는 통과가 되는 상태였지만, **좋아요 동시성 테스트**만 유일하게 계속 실패가 발생했었다. 그 당시에는 뭔가 로컬에 문제가 있나보다 생각을 했었는데, 자세한 건 곧 풀어보도록 하겠다.

## 문제 해결 원인

```java
package com.foodymoody.be.feed_collection_reply_like.infra.persistence.jpa;

import com.foodymoody.be.common.util.ids.FeedCollectionReplyId;
import com.foodymoody.be.common.util.ids.FeedCollectionReplyLikeId;
import com.foodymoody.be.common.util.ids.MemberId;
import com.foodymoody.be.feed_collection_reply_like.domain.FeedCollectionReplyLike;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedCollectionReplyLikeJpaRepository extends
        JpaRepository<FeedCollectionReplyLike, FeedCollectionReplyLikeId> {

    void deleteByFeedCollectionReplyIdAndMemberId(FeedCollectionReplyId id, MemberId memberId);

}
```

- FeedCollectionReplyLikeJpaRepository는 Spring Data JPA를 사용하고 있다.
- 이 코드만 보면 이게 대체 왜?라는 반응이겠지만, 이 프로젝트의 JWT 토큰 부분에 Redis를 사용하고 있기 때문에 여기서 문제가 발생한다.
- 결론만 말하자면, 현재 basePackages가 겹치기 때문에 동스캔 대상이 되어서이다.

### 문제 해결 (1차)

```java
package com.foodymoody.be;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
@EnableJpaRepositories(
        basePackages = "com.foodymoody.be",
        excludeFilters = @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com.foodymoody.be.auth.*")
)
public class BeApplication {

    public static void main(String[] args) {
        SpringApplication.run(BeApplication.class, args);
    }

}
```

- 이 애노테이션을 사용해 보지 않았다고 해도, 어떤 코드인지 느낌이 올 것이다.
- "com.foodymoody.be"의 전체 경로를 스캔하지만, "com.foodymoody.be.auth"의 하위 패키지를 전부 제외하는 필터를 걸어주었다.
  - 이것으로 테스트 코드도 완벽하게 돌아가고, 거슬리던 로그도 사라진 것을 알 수 있다.

### 문제 해결 (2차)

위처럼 생각했었지만, 막상 서버를 운영해 보니 결과는 달랐다.

JpaRepository 측면에서 auth 부분을 제외해 버리니 문제가 발생할 수밖에 없었다. 내가 접근해야 했던 방식은 JpaRepository 측면이 아니라 Redis 측면이었다.

```java
package com.foodymoody.be.common.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;

@Configuration
@EnableRedisRepositories(excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = com.foodymoody.be.feed_collection_comment.infra.persistence.jpa.FeedCollectionCommentJpaRepository.class)
)
public class RedisConfig {

    public RedisTemplate<?, ?> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<?, ?> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        return template;
    }

}
```

- `@EnableRedisRepositories` 애노테이션을 추가하여 필터링으로 문제가 됐던 클래스를 제외시켰다.
- 이렇게 하면 운영 서버에서도 안 되던 부분이 깔끔하게 작동하고, 1차 때처럼 로그도 나오지 않는 상태가 됐다.
