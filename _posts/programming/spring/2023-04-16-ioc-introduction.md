---
title: "[Spring] IoC 컨테이너 공식문서 번역 (Introduction to the Spring IoC Container and Beans)"
excerpt: "Spring IoC 컨테이너 및 Beans 소개"

categories:
  - Spring
tags:
  - [ioc]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-04-16
last_modified_at: 2023-04-16
---

> 현재 [매일 공식 문서를 읽고 해석하는 챌린지](https://github.com/yeonise/daily-code-snippets)를 진행 중이며, 일주일 단위로 정리해 나가고 있습니다.

<br>

# 기록

- [Introduction to the Spring IoC Container and Beans](https://sully-tech.dev/spring/ioc-introduction/)
- [Container Overview](https://sully-tech.dev/spring/ioc-basics/)
- [Bean OverView](https://sully-tech.dev/spring/ioc-definition/)
- [Dependencies](https://sully-tech.dev/spring/ioc-dependencies/)
    - [Dependency Injection](https://sully-tech.dev/spring/ioc-factory-collaborators/)
    - [Dependencies and Configuration in Detail](https://sully-tech.dev/spring/ioc-factory-properties-detailed/)
    - [Using depends-on](https://sully-tech.dev/spring/ioc-factory-dependson/)
    - [Lazy-initialized Beans](https://sully-tech.dev/spring/ioc-factory-lazy-init/)
    - [Autowiring Collaborators](https://sully-tech.dev/spring/ioc-factory-autowire/)
    - [Method Injection](https://sully-tech.dev/spring/ioc-factory-method-injection/)

<br>

# Introduction to the Spring IoC Container and Beans

This chapter covers the Spring Framework implementation of the Inversion of Control (IoC) principle. IoC is also known
as dependency injection (DI). It is a process whereby objects define their dependencies (that is, the other objects they
work with) only through constructor arguments, arguments to a factory method, or properties that are set on the object
instance after it is constructed or returned from a factory method. The container then injects those dependencies when
it creates the bean. This process is fundamentally the inverse (hence the name, Inversion of Control) of the bean itself
controlling the instantiation or location of its dependencies by using direct construction of classes or a mechanism
such as the Service Locator pattern.

> 이 장에서는 `제어의 역전(IoC)` 원리의 스프링 프레임워크 구현에 대해서 설명합니다. `IoC`는 `의존성 주입(DI)`라고도 합니다. 이는 객체가 생성자 인수, 팩토리 메서드에 대한 인수 또는 객체
> 인스턴스가
> 생성되거나 팩토리 메서드에서 반환된 후 객체 인스턴스에 설정된 속성을 통해서만 의존성(함께 작업하는 다른 객체)을 정의하는 프로세스입니다. 그 후 컨테이너는 `Bean`을 생성할 때 이러한 의존성을 주입합니다. 이
> 과정은 기본적으로 클래스의 직접 구성 또는 서비스 로케이터 패턴(디자인 패턴의 종류인 듯?)과 같은 매커니즘을 이용하여 의존성의 인스턴스화 또는 위치를 제어하는 `Bean` 자체의 역방향(말
> 그대로 `제어의 역전(IoC)`)을 의미합니다.

<br>

The org.springframework.beans and org.springframework.context packages are the basis for Spring Framework’s IoC
container. The BeanFactory interface provides an advanced configuration mechanism capable of managing any type of
object. ApplicationContext is a sub-interface of BeanFactory. It adds:

- Easier integration with Spring’s AOP features
- Message resource handling (for use in internationalization)
- Event publication
- Application-layer specific contexts such as the WebApplicationContext for use in web applications.

> org.springframework.beans 및 org.springframework.context 패키지는 스프링 프레임워크의 `IoC 컨테이너`의 기반입니다. `BeanFactory` 인터페이스는 모든 유형의
> 객체를 관리할 수 있는 고급 구성 매커니즘을 제공합니다. `ApplicationContext`는 `BeanFactory`의 하위 인터페이스입니다. 아래와 같이 추가됩니다. <br>
> - 스프링 `AOP(관점 지향 프로그래밍)`와의 쉬운 통합
> - 메시지 리소스 처리 (국제화에 사용)
> - 이벤트 게시
> - 웹 애플리케이션에서 사용하기 위한 `WebApplicationContext`와 같은 애플리케이션 계층별 컨텍스트

<br>

In short, the BeanFactory provides the configuration framework and basic functionality, and the ApplicationContext adds
more enterprise-specific functionality. The ApplicationContext is a complete superset of the BeanFactory and is used
exclusively in this chapter in descriptions of Spring’s IoC container. For more information on using the BeanFactory
instead of the ApplicationContext, see the section covering the BeanFactory API.

> 즉, `BeanFactory`는 구성 프레임워크와 기본 기능을 제공하고, `ApplicationConext`는 보다 엔터프라이즈에 특화된 기능을 추가합니다. `ApplicationContext`
> 는 `BeanFactory`의 완전한 상위 집합이며, 이 장에서는 스프링의 IoC 컨테이너에 대한 설명에서 홀로 사용됩니다. `ApplicationConext` 대신 `BeanFactory`를 사용하는 방법에
> 대한 자세한 내용은 `BeanFactory API`를 다루는 섹션을 참고할 수 있습니다.

<br>

In Spring, the objects that form the backbone of your application and that are managed by the Spring IoC container are
called beans. A bean is an object that is instantiated, assembled, and managed by a Spring IoC container. Otherwise, a
bean is simply one of many objects in your application. Beans, and the dependencies among them, are reflected in the
configuration metadata used by a container.

> 스프링에서는 애플리케이션의 근간을 만들고, 스프링 `IoC 컨테이너`에 의해 관리되는 객체를 `Bean`이라고 합니다. `Bean`은 스프링 `IoC 컨테이너`에 의해 인스턴스화되고, 결합되고, 관리되는
> 객체입니다. 그렇지 않으면 `Bean`은 애플리케이션의 많은 객체 중 하나에 불과합니다. `Bean`과 `Bean` 간의 의존성은 컨테이너에서 사용하는 구성 메타데이터에 반영됩니다. 

<br>

# Reference

- [Spring 공식 문서](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#spring-core)