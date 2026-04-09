---
title: "[Database] Docker Compose로 Elastic Search 설치 방법 - MacOS M4"
excerpt: "database, docker, docker-compose, elastic-search"

categories:
    - Database
tags:
    - [database, docker, docker-compose, elastic-search]

toc: true
toc_sticky: true

sidebar:
    nav: "categories"

date: 2025-02-13
last_modified_at: 2025-02-13
---

## 서론

MacOS의 M1 Pro 환경에서 M4 환경으로 기기 변경 후 다른 부분들은 전혀 문제가 없었지만, Elastic Search 설치 과정에서만 문제가 발생했다.

분명 기기 변경 전까지는 잘 작동했던 docker compose 파일이 어떠한 이유로 작동하지 않았다.

이걸 해결하느라 20시간은 넘게 이것과 씨름을 했다..

공식 문서에 있는 것을 그대로 실행해 봐도 되지 않아서 정말 막막했다.

## 문제 발생 부분

elasticsearch 컨테이너가 생성은 되지만, 그걸 실행할 때 `exit 1`이 발생하여 중단되고 있었다.  
이걸로 여러가지 호환 옵션을 주면, 컨테이너 생성조차 안 될 때도 많았다.

Elastic Search 공식 커뮤니티에서 아무리 뒤져봐도 나와 같은 사람은 나오지 않았다.

Stack Overflow에는 있었지만, 그렇게 해결이 되지 않았기도 하고 그 사람들은 M2 칩 이하를 사용하고 있었다.

## 씨름 과정

정말 수많은 시도를 했다. 지금은 기억도 잘 나질 않는다.

하지만 공통 원인은 전부 **arm64 아키텍처와의 호환성 문제**였다.

해결한 지금도 잘 모르겠는 부분은 M1 Pro와 M4는 같은 애플 실리콘 환경이라는 것이다.  
인텔과 애플 실리콘의 차이였다면 이렇게까지 의문을 갖지는 않았겠지만 어떤 옵션들을 다 넣어봐도 호환성 문제가 해결되지 않았다.

## 문제 해결

결론은 Elastic Search의 버전이 문제였다. 아니, 정확히는 버전과 그 무언가가 혼합되어 문제가 발생하고 있었다.

원래는 `8.16.1`을 사용하고 있었는데, `8.7.1`로 변경하였더니 작동이 됐다. `8.6.2`는 또 되지 않는다.

지금도 이유는 모르겠지만, 여러가지 해결 과정들의 코드들을 혼합하여 해결이 어떻게든 되었다.

Elastic Search는 버전에 따른 오류가 너무 심한 편인 거 같다..

## 설치 방법

### docker-compose.yml

```yml
version: '3.7'

services:
  es:
    build:
      context: .
      dockerfile: ./Dockerfile.es
    image: docker.elastic.co/elasticsearch/elasticsearch:8.7.1
    container_name: es
    platform: linux/amd64  # 추가: Rosetta 2를 통한 x86-64 에뮬레이션
    environment:
      - node.name=es-node
      - cluster.name=search-cluster
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
      - xpack.security.enabled=true
      - xpack.license.self_generated.type=basic
      - xpack.security.transport.ssl.enabled=false
      - xpack.security.http.ssl.enabled=false
      - xpack.security.enrollment.enabled=false
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es-data:/usr/share/elasticsearch/data
    ports:
      - 9200:9200 # https
      - 9300:9300 #tcp
    networks:
      - es-bridge

  kibana:
    image: docker.elastic.co/kibana/kibana:8.7.1
    container_name: kibana
    environment:
      SERVER_NAME: kibana
      ELASTICSEARCH_HOSTS: http://es:9200
    ports:
      - 5601:5601
    depends_on:
      - es
    networks:
      - es-bridge

volumes:
  es-data:
    driver: local

networks:
  es-bridge:
    driver: bridge
```

### Dockerfile.es

```yml
FROM docker.elastic.co/elasticsearch/elasticsearch:8.7.1

RUN elasticsearch-plugin install --batch analysis-nori
```

- nori 플러그인은 우리 팀이 구현한 프로젝트에서 nori 토크나이저를 사용하기 때문에 넣어주었다.

### Elastic Search Container 생성 및 실행

```bash
docker-compose down --rmi all 
docker-compose build
docker-compose up -d
```

- 기존 컨테이너와 이미지를 완전히 삭제하고 실행시킨다.
  - 왜냐하면 이 글까지 들어온 사람들은 분명 삽집을 하느라 많은 이미지가 쌓여있을 것이다.
- 위와 같이 실행하면 그동안 안 되던 게 드디어 될 것이다.

### Elastic Search 비밀번호 설정

```bash
/usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic -i
```

- 위 명령어를 실행하면, elastic search의 비밀번호를 설정할 수 있다.
  - Spring Boot에 연결하기 위해서는 비밀번호 설정이 필수다.

## 결론

어떻게든 해결이 되었는데, 다른 사이드 프로젝트를 또 진행한다면 Elastic Search는 적용 안 하고 그냥 MySQL을 적용하여 검색 엔진을 만들어볼 것 같다.

비용도 많이 나가고, 상업적인 부분이 없는 사이트라면 손해를 많이 볼 것 같다.

아니면 로컬에서만 사용해도 된다.
