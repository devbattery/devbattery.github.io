---
title: "정원준 - 최신 트렌드에 뒤쳐지지 않으려 노력하는 개발자"
permalink: /about/
layout: single
comments: true
author_profile: true
mathjax: true

sidebar:
  nav: "categories"
---

---

안녕하세요! 신입 개발자 정원준입니다.  
유행하는 기술을 무작정 사용하는 것이 아닌, 자주 사용되는 이유를 먼저 알고 사용하려 노력합니다.

## Contact & Channels

**Email** | [devbattery@outlook.com](mailto:devbattery@outlook.com)  
**GitHub** | <https://github.com/devbattery>  
**Blog** | [https://devbattery.com](https://devbattery.com/)

## Project

### [Foody Moody](https://github.com/foody-moody/foodymoody)

`2023.10 - 2024.03`의 기간 동안 팀 프로그래밍 후, 혼자 유지 보수를 진행 중입니다.

> “맛집 공유 SNS 플랫폼”

- [레포지토리](https://github.com/foody-moody/foodymoody)
- [DNS](https://foodymoody.store)
- [API 문서](https://foodymoody.store/api/docs)

[**GitHub Actions 기반 자동화 배포**](http://devbattery.com/project/foodymoody-release/)

- GitHub Actions를 활용한 CI/CD 파이프라인 구축으로 React 프론트엔드와 Spring Boot 백엔드 자동화 배포 구현
- Docker 컨테이너와 Docker Hub를 활용한 일관된 배포 환경 구성
- AWS EC2와 ELB를 통해 HTTPS 보안을 적용하고 무중단 배포 구현

**게시물 피드 API 설계 및 구현**

- 프론트와 회의 후 결정난 [피그마](https://www.figma.com/design/b3hQCZhASDYHL80SloR0cx/FoodyMoody)를 표본으로 하여, 전반적인 게시물 피드 CRUD와 관련된 API 구현

**좋아요 기능 구현**

- 유저가 게시물 피드에 좋아요 기능을 중복 문제 없이 사용할 수 있도록 구현

**좋아요 동시성 문제 해결**

- 낙관적 락을 구현하여 좋아요와 저장 작업이 하나의 트랜잭션 내에서 실행되도록 구현
- 단일 UPDATE 쿼리로 처리하여, 여러 스레드가 동시에 좋아요를 누를 때 발생하는 Race Condition 방지

**N+1 문제 해결**

- 피드를 조회할 때, FETCH JOIN을 사용하여 각각의 엔티티를 한 번의 쿼리로 조인하는 것으로 N+1 문제 해결

**테스트**

- REST Assured를 이용하여 구현 부분 인수 테스트 진행
- REST Assured와 REST Docs를 같이 활용

**협업**

- 백엔드 3명과 프론트 2명의 인원으로 진행
- 프론트와의 협업을 위해 REST Docs를 사용하여 HTTP API 명세서 제작
- 백엔드 팀원들과의 꾸준한 협업 프로그래밍

## Skills

**언어 및 프레임워크**

- Java, Python
- Spring Boot, Spring Data JPA

**실시간 통신**

- WebSocket + Redis Pub/Sub
- SSE + Redis Pub/Sub

**데이터베이스**

- MySQL
- MongoDB, Redis
- Elastic Search

**테스트**

- JUnit, REST Assured, REST Docs

**배포**

- GitHub Actions
- AWS (EC2, S3, CodeDeploy ELB)
