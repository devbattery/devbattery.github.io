---
title: "[DataBase] Docker로 Redis 설치 방법 - MacOS M4"
excerpt: "database, docker, redis"

categories:
    - Database
tags:
    - [database, docker, redis]

toc: true
toc_sticky: true

sidebar:
    nav: "categories"

date: 2025-02-08
last_modified_at: 2025-02-08
---

## Redis 이미지 pull

```bash
docker pull redis
```

- 나는 버전 신경 안 써서 적어주진 않았지만, 혹시 필요하다면 `docker pull redis:7.0`과 같이 태그를 지정하면 된다.

## redis.conf 생성

```redis.conf
# 연결 가능한 네트위크 (0.0.0.0=Anywhere)
bind 0.0.0.0

# 연결 포트
port 6379

# Master 노드의 기본 사용자 비밀번호
requirepass password
```

- password 부분만 바꿔서 생성하면 된다.

## Docker Conatiner 실행

```bash
docker run --name redis-name -d -p 6379:6379 -v /Users/ibm-5100/docker-container/redis/redis.conf:/usr/local/etc/redis/redis.conf -v redis-data:/data redis redis-server /usr/local/etc/redis/redis.conf
```

- 위 경로에서 `/Users/ibm-5100/docker-container/redis/redis.conf`만 자신의 `redis.conf` 위치에 따라 변경하면 된다.
