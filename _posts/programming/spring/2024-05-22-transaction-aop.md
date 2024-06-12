---
title: "[Spring] 트랜잭션 AOP"
excerpt: "spring boot, transaction, aop"

categories:
  - Spring
tags:
  - [spring-boot, transaction, aop]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-05-22
last_modified_at: 2024-05-22
---

# 트랜잭션 AOP

- 트랜잭션을 편리하게 처리하기 위해서 트랜잭션 추상화(`PlatformTransactionManager`)를 도입하고, 반복적인 트랜잭션 로직을 해결하기 위해서 트랜잭션 템플릿(`TransactionTemplate`)을 도입했음
- 트랜잭션 템플릿 덕분에 트랜잭션을 처리하는 반복 코드는 해결할 수 있었지만, 서비스 계층에 순수한 비즈니스 로직만 남긴다는 목표는 아직 달성하지 못함
    - 이럴 때 스프링 AOP를 통해 프록시를 도입하면 문제가 깔끔하게 해결되었음

## 프록시 도입 전

<img width="1081" alt="Screenshot 2024-05-23 at 9 32 12 PM" src="https://github.com/won4885/won4885.github.io/assets/62871026/a874d6cc-e9a0-4d82-aa7b-983bff0d4342">

- 프록시를 사용하지 않을 때, 기존처럼 서비스의 로직에서 트랜잭션을 "직접" 시작함
- 서비스에 비즈니스 로직과 트랜잭션 처리 로직이 함께 섞여있음

## 프록시 도입 후

<img width="1079" alt="Screenshot 2024-05-23 at 9 32 33 PM" src="https://github.com/won4885/won4885.github.io/assets/62871026/36767e48-e5af-4549-823f-2dbc5ca4ff2a">

- 프록시를 사용할 때, 트랜잭션을 처리하는 객체와 비즈니스 로직을 처리하는 서비스 객체를 명확하게 분리할 수 있게 되었음
- 트랜잭션 프록시가 트랜잭션 처리 로직을 모두 가져가고, 트랜잭션을 시작한 후에 실제 서비스를 대신 호출함
    - 트랜잭션 프록시 덕분에 서비스 계층에는 순수한 비즈니스 로직만 남길 수 있게 됨

<br>

# 트랜잭션 AOP 적용 전체 흐름

<img width="1098" alt="Screenshot 2024-05-23 at 9 42 33 PM" src="https://github.com/won4885/won4885.github.io/assets/62871026/19516f8d-4d3a-4a14-af1c-c2b5a40e39ad">

- 트랜잭션 매니저
    - `PlatformTransactionManager` 인터페이스와 구현체 (트랜잭션 추상화)
- 트랜잭션 동기화 매니저
    - 트랜잭션을 유지하려면 트랜잭션의 시작부터 끝까지 같은 데이터베이스 커넥션을 유지해야 함 -> 트랜잭션 동기화 매니저 사용
    - `ThreadLocal`을 사용해서 커넥션을 동기화해줌
    - 트랜잭션 매니저는 내부에서 이 트랜잭션 동기화 매니저를 사용함
    - 쓰레드 로컬을 사용하기 때문에 멀티쓰레드 상황에 안전하게 커넥션을 동기화할 수 있음
        - 커넥션이 필요하면 트랜잭션 동기화 매니저를 통해 획득하면 됨

<br>

# 선언적 트랜잭션 관리 vs 프로그래밍 방식 트랜잭션 관리

- 선언전 트랜잭션 관리 (Declarative Transaction Management)
    - `@Transactional` 애노테이션 하나만 선언해서 매우 편리하게 트랜잭션을 적용하는 것
    - 과거 XML에 설정하기도 했고, 이름 그대로 해당 로직에 트랜잭션을 적용하겠다고 어딘가에 선언만 하면 트랜잭션이 적용되는 방식
- 프로그래밍 방식의 트랜잭션 관리 (Programmatic Tranaction Management)
    - 트랜잭션 매니저 또는 트랜잭션 템플릿 등을 사용해서 트랜잭션 관련 코드를 직접 작성하는 것

<br>

- 선언적 트랜잭션 관리가 프로그래밍 방식에 비해서 훨씬 간편하고 실용적이기 때문에 실무에서는 대부분 선언적 트랜잭션 관리를 사용함
- 프로그래밍 방식의 트랜잭션 관리는 스프링 컨테이너나 스프링 AOP 기술 없이 간단히 사용할 수 있지만, 실무에서는 대부분 스프링 컨테이너와 스프링 AOP를 사용하기 때문에 거의 사용되지 않음
- 스프링이 제공하는 선언적 트랜잭션 관리 덕분에 트랜잭션 관련 코드를 순수한 비즈니스 로직에서 제거할 수 있게 됨
    - 개발자는 트랜잭션이 필요한 곳에 `@Transactional` 애노테이션 하나만 추가하면, 나머지는 스프링 트랜잭션 AOP가 자동으로 처리해줌

<br>

# Reference

- [스프링 DB 1편 - 데이터 접근 핵심 원리](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-db-1/dashboard)
