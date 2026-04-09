---
title: "[Database] Docker로 MongoDB 설치 방법 - MacOS M4"
excerpt: "database, docker, mongodb"

categories:
    - Database
tags:
    - [database, docker, mongodb]

toc: true
toc_sticky: true

sidebar:
    nav: "categories"

date: 2025-02-09
last_modified_at: 2025-02-09
---

## MongoDB 이미지 pull

```bash
docker pull mongo:5.0
```

- 내가 진행하던 프로젝트가 스프링부트 3.4.1을 사용했기 때문에 그에 맞는 버전을 사용하였다.

## MongoDB Container 실행

```bash
docker run -d --name mongodb-container -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password -v mongodb-data:/data/db mongo:5.0
```

- `MONGO_INITDB_ROOT_USERNAME` 부분과 `MONGO_INITDB_ROOT_PASSWORD` 부분을 변경하면 된다.
- 버전을 다르게 했으면 `mongo:5.0`도 변경해 주자.
