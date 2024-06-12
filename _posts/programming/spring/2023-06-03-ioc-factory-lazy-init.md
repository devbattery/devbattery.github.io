---
title: "[Spring] IoC 컨테이너 공식문서 번역 (Lazy-initialized Beans)"
excerpt: "지연 초기화 빈"

categories:
  - Spring
tags:
  - [ioc]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-06-03
last_modified_at: 2023-06-03
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

# Lazy-initialized Beans

By default, ApplicationContext implementations eagerly create and configure all singleton beans as part of the
initialization process. Generally, this pre-instantiation is desirable, because errors in the configuration or
surrounding environment are discovered immediately, as opposed to hours or even days later. When this behavior is not
desirable, you can prevent pre-instantiation of a singleton bean by marking the bean definition as being
lazy-initialized. A lazy-initialized bean tells the IoC container to create a bean instance when it is first requested,
rather than at startup.

> 기본적으로, `ApplicationContext` 구현은 초기화 프로세스의 일부로 모든 싱글톤 빈을 열심히 생성하고 구성합니다. 일반적으로 이러한 사전 인스턴스화는 구성 또는 주변 환경의 오류가 몇 시간 또는
> 며칠 후에 발견되는 것이 아니라, 즉시 발견되므로 바람직합니다. 이러한 동작이 바람직하지 않은 경우, 빈 정의에 지연-초기화된 것으로 표시하여 싱글톤 빈의 사전 인스턴스화를 방지할 수 있습니다. 지연-초기화된
> 빈은 시작 지점이 아닌, 처음 요청될 때 빈 인스턴스를 생성하도록 IoC 컨테이너에 지시합니다.

<br>

In XML, this behavior is controlled by the lazy-init attribute on the <bean/> element, as the following example shows:

> XML에서 이 동작은 아래의 예제에서 볼 수 있듯이, `<bean/>` 요소의 `lazy-init` 속성에 의해 제어됩니다:

```xml
<bean id="lazy" class="com.something.ExpensiveToCreateBean" lazy-init="true"/>
<bean name="not.lazy" class="com.something.AnotherBean"/>
```

When the preceding configuration is consumed by an ApplicationContext, the lazy bean is not eagerly pre-instantiated
when the ApplicationContext starts, whereas the not.lazy bean is eagerly pre-instantiated.

> 앞의 구성이 `ApplicationContext`에 의해 소비되는 경우, `ApplicationContext`가 시작될 때 `lazy` 빈은 열심히 사전-인스턴스화되지 않는 반면, `not.laxy` 빈은 열심히
> 사전-인스턴스화됩니다.

<br>

However, when a lazy-initialized bean is a dependency of a singleton bean that is not lazy-initialized, the
ApplicationContext creates the lazy-initialized bean at startup, because it must satisfy the singleton’s dependencies.
The lazy-initialized bean is injected into a singleton bean elsewhere that is not lazy-initialized.

> 그러나, 지연-초기화된 빈이 지연-초기화되지 않는 싱글톤 빈의 의존성인 경우, 싱글톤의 의존성을 충족해야 하기 때문에 `ApplicationContext`는 시작 시 지연-초기화된 빈을 생성합니다. 지연-초기화된
> 빈은 지연 초기화되지 않은 다른 곳의 싱글톤 빈에 주입됩니다.

<br>

You can also control lazy-initialization at the container level by using the default-lazy-init attribute on the <beans/>
element, as the following example shows:

> 아래의 예제에서 볼 수 있듯이, `<beans/>` 요소의 `default-lazy-init` 속성을 사용하여 컨테이너 수준에서 지연-초기화를 제어할 수도 있습니다:

```xml
<beans default-lazy-init="true">
	<!-- no beans will be pre-instantiated... -->
	<!-- 빈이 사전-인스턴스화되지 않습니다... -->
</beans>
```

<br>

# Reference

- [Spring 공식 문서](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#spring-core)