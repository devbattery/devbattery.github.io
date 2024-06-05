---
title: "[Java] Reflection 개요"
excerpt: "reflection"

categories:
  - Java
tags:
  - [reflection]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-03-26
last_modified_at: 2024-03-26
---

# Java Reflection이란

- **언어이자 JVM 기능**
- 실행하는 동안 클래스와 오브젝트 정보를 추출할 수 있음
- Reflection API는 JDK에 달린 클래스 집합과 메서드
  - 유연한 코드를 작성할 수 있음
  - 프로그램을 실행하면서 이 코드로 다양한 소프트웨어 컴포넌트를 연결하고, 소스 코드를 수정하지 않고 새로운 프로그램 flow를 만들 수 있음
- 다목적 알고리즘을 작성할 수 있음
  - 실행하고 있는 클래스와 객체에 따라 이 알고리즘을 쉽게 조정하거나 변경할 수 있음

# Reflection의 차이

<img width="1421" alt="스크린샷 2024-03-26 오후 3 18 15" src="https://github.com/won4885/won4885.github.io/assets/62871026/b71d8344-c49f-4bd7-8e2b-d34c6b24393c">

- 우리가 보통 작성하고 프로그램으로 실행하는 코드는 데이터를 입력 값으로 넣고, 데이터를 분석해서 작업을 실행하고 Output 값을 냄

<br>

<img width="1469" alt="스크린샷 2024-03-26 오후 3 18 41" src="https://github.com/won4885/won4885.github.io/assets/62871026/173dcff6-4c65-44ca-bc6b-1fbde92243a0">

- 반대로 Reflection으로 프로그램을 작성하면 데이터와 앱 코드를 모두 Input 값으로 보고 그 Input 값을 분석하고 작업을 수행함
  - 그리고 마지막으로 Output 값을 냄

# Reflection의 사용

<img width="1470" alt="스크린샷 2024-03-26 오후 3 29 19" src="https://github.com/won4885/won4885.github.io/assets/62871026/a038c640-1fb4-4bd2-bbbe-a7e141a6f77b">

- 프로그램을 실행하면서 애플리케이션 오브젝트와 클래스를 Input 값으로 사용할 수 있어서, 훌륭한 라이브러리와 프레임워크를 만들고 소프트웨어를 설계할 수 있게 됨
  - ex) JUnit에서 `@Before`나 `@Test`와 같은 애노테이션 사용

<br>

<img width="1737" alt="스크린샷 2024-03-26 오후 3 28 40" src="https://github.com/won4885/won4885.github.io/assets/62871026/7cab8002-ac32-40ab-8f52-a22f41b0714d">

- Reflection을 깊게 사용하는 사용자들은 의존성 주입(DI)과 구성 프레임워크를 사용함
  - ex) Spring에서 `@Autowired`나 `@Configuration`과 같은 애노테이션 사용

<br>

- 라이브러리에 사용해서 프로토콜 간에 변환을 실행할 수 있음
  - ex) Jackson, GSON

<img width="1657" alt="스크린샷 2024-03-26 오후 3 30 44" src="https://github.com/won4885/won4885.github.io/assets/62871026/6a7aad19-9fcb-4b1c-9ff9-95d3457816a3">

- Reflectoin을 사용해서 Java의 클래스를 확인하고 필드를 전부 분석함
  - 그리고 필드명에 다라 JSON 문자열에서 가져온 값만 입력

<br>

- 아래와 같은 경우에도 많이 사용됨
  - Logging 프레임워크
  - ORM
  - 웹 프레임 워크
  - 개발자 툴
  - 등등등
- 그런데 Java Reflection은 외부 라이브러리에만 사용하는 건 아님
  - 앱과 라이브러리를 설계할 때도 사용하고, 고유한 기능을 더할 수도 있음

<br>

- 위처럼 많이 사용되니 이제 문제점을 쉽게 알 수 있음

# Reflection의 문제점

- Java Reflection의 역할이 매우 중요하고, 보이지 않는 구조에 접근할 수도 있어서 어려움이 발생함
- 목적에 맞지 않게 사용되면 코드를 변경해야 하고, 코드가 늦게 실행되거나 어떤 경우에는 실행하면 위험할 수 있음
- 이 모든 건 Reflection 코드가 앱을 망가뜨리면 **복구할 수 없기 때문**
- Java 언어를 완전한 이해하는 경험 많은 개발자만 Reflection을 사용하는 이유임

# Reference

- [Udemy](https://www.udemy.com/course/java-reflection-master/?couponCode=GENAISALE24)
