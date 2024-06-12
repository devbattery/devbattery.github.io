---
title: "[Spring] IoC 컨테이너 공식문서 번역 (Using depends-on)"
excerpt: "의존성 사용"

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

# Using depends-on

If a bean is a dependency of another bean, that usually means that one bean is set as a property of another. Typically
you accomplish this with the <ref/> element in XML-based configuration metadata. However, sometimes dependencies between
beans are less direct. An example is when a static initializer in a class needs to be triggered, such as for database
driver registration. The depends-on attribute can explicitly force one or more beans to be initialized before the bean
using this element is initialized. The following example uses the depends-on attribute to express a dependency on a
single bean:

> 한 빈이 다른 빈의 의존성을 갖고 있다는 것은, 일반적으로 한 빈이 다른 빈의 속성으로 설정되어 있다는 것을 의미합니다. 일반적으로 XML 기반 구성 메타데이터의 `<ref/>` 요소를 사용하여 이를 수행합니다.
> 그러나 때로는 빈 간의 의존성이 직접적이지
> 않을 [4-2-dependencies-and-configuration-in-detail.md](4-2-dependencies-and-configuration-in-detail.md)수 있습니다. 예를 들어,
> 데이터베이스 드라이버 등록과 같이 클래스의 정적 이니셜라이저를 트리거해야 하는 경우를 들 수 있습니다. `depends-on` 속성을
> 사용하면 이 요소를 사용하는 빈이 초기화되기 전에, 하나 이상의 빈이 초기화되도록 명시적으로 강제할 수 있습니다. 아래의 예제에서는 `depends-on` 속성을 사용하여 단일 빈에 대한 의존성을 표현합니다:

```xml
<bean id="beanOne" class="ExampleBean" depends-on="manager"/>
<bean id="manager" class="ManagerBean" />
```

<br>

To express a dependency on multiple beans, supply a list of bean names as the value of the depends-on attribute (commas,
whitespace, and semicolons are valid delimiters):

> 여러 빈에 대한 의[4-2-dependencies-and-configuration-in-detail.md](4-2-dependencies-and-configuration-in-detail.md)존성을
> 표현하려면, `depends-on` 속성의 값으로 빈 이름 목록을 제공합니다(쉼표, 공백 및 세미클론이 유효한 구분 기호합니다):

```xml
<bean id="beanOne" class="ExampleBean" depends-on="manager,accountDao">
	<property name="manager" ref="manager" />
</bean>

<bean id="manager" class="ManagerBean" />
<bean id="accountDao" class="x.y.jdbc.JdbcAccountDao" />
```

<br>

The depends-on attribute can specify both an initialization-time dependency and, in the case of singleton beans only, a
corresponding destruction-time dependency. Dependent beans that define a depends-on relationship with a given bean are
destroyed first, prior to the given bean itself being destroyed. Thus, depends-on can also control shutdown order.
{: .notice--primary}

> `deponds-on` 속성은 초기화-시간 의존성과, 싱글톤 빈의 경우에만 해당되는 소멸-시간 의존성을 모두 지정할 수 있습니다. 지정된 빈과의 `depends-on` 관계를 정의하는 의존적인 빈은 지정된 빈
> 자체가 소멸되기 전에 먼저 소멸됩니다. 따라서 `depends-on`은 종료 순서도 제어할 수 있습니다. 

<br>

# Reference

- [Spring 공식 문서](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#spring-core)