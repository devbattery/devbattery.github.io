---
title: "정원준 - 기술 부채를 좋아하는 신입 개발자"
permalink: /about/
layout: single
comments: true
author_profile: true
mathjax: true

# sidebar:
#   nav: "categories"
---

---

안녕하세요! 신입 개발자 정원준입니다.  
기술 부채가 쌓이는 것을 두려워하지 않으며, 기록하고 시대의 흐름에 맞춰 따라가는 것을 좋아합니다.

## Contact & Channels

**Email** | [devbattery@outlook.com](mailto:devbattery@outlook.com)  
**GitHub** | <https://github.com/devbattery>
**Blog** | [https://devbattery.com](https://devbattery.com/)

## Education

> [**코드스쿼드 마스터즈**](https://codesquad.kr/masters/) (2023.01 - 2023.11)
>
> - [CS16와 Java 백엔드 및 팀 프로젝트 과정](http://devbattery.com/til/recap/)

> **동양미래대학교** (2020.03 - 2022.01)
>
> - 컴퓨터정보공학과: 웹/앱 어플리케이션, IoT 기술, 네트워크 관리 등의 경험

## Project

### [Foody Moody](https://github.com/foody-moody/foodymoody)

(2023.10 - 2024.03)

> “맛집 공유 SNS 플랫폼”

[**GitHub Actions 기반 자동화 배포**](http://devbattery.com/project/foodymoody-release/)

- GitHub Actions를 활용한 CI/CD 파이프라인 구축으로 프론트엔드(React)와 백엔드(Spring Boot) 자동화 배포 구현
- Docker 컨테이너화 및 Docker Hub를 통한 이미지 관리로 일관된 배포 환경 구성
- EC2 인스턴스에 Nginx 리버스 프록시를 활용한 트래픽 관리 및 HTTPS 보안 설정

**게시물 피드 API 설계 및 구현**

- 프론트와 회의 후 결정난 피그마를 표본으로 하여, 전반적인 게시물 피드 CRUD와 관련된 API 구현

**좋아요 기능 구현**

- 유저가 게시물 피드에 좋아요 기능을 중복 문제 없이 사용할 수 있도록 구현

**좋아요 동시성 문제 해결**

- 낙관적 락을 구현하여 좋아요와 저장 작업이 하나의 트랜잭션 내에서 실행되도록 구현
- 단일 UPDATE 쿼리로 처리하여 Race Condition 방지

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

- Java
- Spring Boot
- Python

**데이터베이스**

- MySQL
- JPA

**테스트 및 버전 관리**

- JUnit, REST Assured, REST Docs, Git

**배포**

- GitHub Actions
- AWS (EC2 / S3 / CodeDeploy)

**협업 및 기타 도구**

- Slack
- IntelliJ
- GitHub
