---
title: "[Spring] IoC 컨테이너 공식문서 번역 (Autowiring Collaborators)"
excerpt: "Autowiring 협력자"

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

# Autowiring Collaborators

The Spring container can autowire relationships between collaborating beans. You can let Spring resolve collaborators (
other beans) automatically for your bean by inspecting the contents of the ApplicationContext. Autowiring has the
following advantages:

> 스프링 컨테이너는 협업하는 빈 간의 관계를 `autowire` 할 수 있습니다. `ApplicationContext`의 내용을 검사하여 스프링이 사용자의 빈에 대해 `collaborators`(다른 빈)를
> 자동으로 해결하도록 할 수 있습니다. `autowiring`에는 아래와 같은 이점이 있습니다:

- Autowiring can significantly reduce the need to specify properties or constructor arguments. (Other mechanisms such as
  a bean template discussed elsewhere in this chapter are also valuable in this regard.)
- Autowiring can update a configuration as your objects evolve. For example, if you need to add a dependency to a class,
  that dependency can be satisfied automatically without you needing to modify the configuration. Thus autowiring can be
  especially useful during development, without negating the option of switching to explicit wiring when the code base
  becomes more stable.

> - `autowiring`을 사용하여 속성이나 생성자 인수를 지정할 필요성을 크게 줄일 수 있습니다. (이 섹션의 다른 곳에서 설명하는 bean 템플릿과 같은 다른 메커니즘도 이와 관련하여 유용합니다.)
> - `autowiring`은 객체가 발달함에 따라 구성을 업데이트할 수 있습니다. 예를 들어 클래스에 의존성을 추가해야 하는 경우, 구성을 수정할 필요 없이 해당 의존성을 자동으로 충족할 수 있습니다.
    따라서 `autowiring`은 코드 기반이 안정화되면 분명한 `wiring`을 스위칭하는 옵션을 무효화하지 않고, 특히 개발 중에 유용할 수 있습니다.

<br>

When using XML-based configuration metadata (see Dependency Injection), you can specify the autowire mode for a bean
definition with the autowire attribute of the <bean/> element. The autowiring functionality has four modes. You specify
autowiring per bean and can thus choose which ones to autowire. The following table describes the four autowiring modes:

> XML-기반 구성 메타데이터를 사용하는 경우(의존성 주입 참조), `<bean/>` 요소의 `autowire` 속성을 사용하여 bean 정의에 대한 `autowire` 모드를 지정할 수
> 있습니다. `autowiring` 기능에는 네 가지 모드가 있습니다. `bean`별로 `autowiring`를 지정하여 어떤 `bean`을 `autowire`할지 선택할 수 있습니다. 아래의 표에서는 네
> 가지 `autowiring` 모드에 대해 설명합니다.

<br>

| Mode          | Explanation                                                                                                                                                                                                                                                                                                                                   |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `no`          | (Default) No autowiring. Bean references must be defined by ref elements. Changing the default setting is not recommended for larger deployments, because specifying collaborators explicitly gives greater control and clarity. To some extent, it documents the structure of a system.                                                      |
| `byName`      | Autowiring by property name. Spring looks for a bean with the same name as the property that needs to be autowired. For example, if a bean definition is set to autowire by name and it contains a master property (that is, it has a setMaster(..) method), Spring looks for a bean definition named master and uses it to set the property. |
| `byType`      | Lets a property be autowired if exactly one bean of the property type exists in the container. If more than one exists, a fatal exception is thrown, which indicates that you may not use byType autowiring for that bean. If there are no matching beans, nothing happens (the property is not set).                                         |
| `constructor` | Analogous to byType but applies to constructor arguments. If there is not exactly one bean of the constructor argument type in the container, a fatal error is raised.                                                                                                                                                                        |

<br>

| Mode          | Explanation                                                                                                                                                                                                        |
|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `no`          | (기본값) `autowiring` 없음. bean 참조는 `ref` 요소로 정의해야 합니다. `collaborators`를 명시적으로 지정하면 제어 및 명확성이 향상되므로, 대규머 배포의 경우 기본 설정을 변경하는 것은 권장되지 않습니다. 어느 정도는 시스템의 구조를 문서화합니다.                                                      |
| `byName`      | 프로퍼티 이름으로 `autowiring` 함. 스프링은 `autowire`해야 하는 프로퍼티와 이름이 같은 bean을 찾습니다. 예를 들어, bean 정의가 이름으로 `autowire` 되도록 설정되어 있고, `master` 프로퍼티가 포함된 경우(즉, `setMaster(..)` 메서드) 스프링은 `master`라는 bean 정의를 찾아서 프로퍼티를 설정하는 데 사용합니다. |
| `byType`      | 컨테이너에 프로퍼티 유형의 bean이 정확히 하나만 존재하는 경우, 프로퍼티를 `autowire`할 수 있습니다. 두 개 이상 존재하면, 치명적인 예외가 발생하며, 이는 해당 bean에 대해 `byType` `autowiring`을 사용할 수 없음을 나타냅니다. 일치하는 bean이 없으면 아무 일도 일어나지 않습니다(프로퍼티가 설정되지 않음).                  |
| `constructor` | `byType`과 유사하지만, 생성자 인자에 적용됩니다. 컨테이너에 생성자 인자 유형의 bean이 정확히 하나도 없으면 치명적인 에러가 발생합니다.                                                                                                                                 |

<br>

With byType or constructor autowiring mode, you can wire arrays and typed collections. In such cases, all autowire
candidates within the container that match the expected type are provided to satisfy the dependency. You can autowire
strongly-typed Map instances if the expected key type is String. An autowired Map instance’s values consist of all bean
instances that match the expected type, and the Map instance’s keys contain the corresponding bean names.

> `byType` 또는 `constructor` `autowiring` 모드를 사용하면, 배열과 타입이 지정된 컬렉션을 `wire`할 수 있습니다. 이러한 경우, 컨테이너 내에서 예상 유형과 일치하는
> 모든 `autowire` 후보가 의존성을 충족하기 위해 제공됩니다. 예상 키 타입이 `String`이 ㄴ경우, 강력하게 유형화된 `Map` 인스턴스를 `autowire`할 수 있습니다. `autowire`
> 된 `Map` 인스턴스의 값은 예상 타입과 일치하는 모든 빈 인스턴스로 구성되며, `Map` 인스턴스의 키에는 해당 bean 이름이 포함됩니다.

<br>

# Limitations and Disadvantages of Autowiring

Autowiring works best when it is used consistently across a project. If autowiring is not used in general, it might be
confusing to developers to use it to wire only one or two bean definitions.

> `autowiring`은 프로젝트 전체에서 일관되게 사용할 때 가장 효과적입니다. 일반적으로 `autowiring`을 사용하지 않는 경우, 개발자가 한두 개의 bean 정의만 묶는 데 `autowiring`을
> 사용하면 혼란스러울 수 있습니다.

<br>

Consider the limitations and disadvantages of autowiring:

> `autowiring`의 한계와 단점을 고려하세요:

<br>

- Explicit dependencies in property and constructor-arg settings always override autowiring. You cannot autowire simple
  properties such as primitives, Strings, and Classes (and arrays of such simple properties). This limitation is
  by-design.
- Autowiring is less exact than explicit wiring. Although, as noted in the earlier table, Spring is careful to avoid
  guessing in case of ambiguity that might have unexpected results. The relationships between your Spring-managed
  objects are no longer documented explicitly.
- Wiring information may not be available to tools that may generate documentation from a Spring container.
- Multiple bean definitions within the container may match the type specified by the setter method or constructor
  argument to be autowired. For arrays, collections, or Map instances, this is not necessarily a problem. However, for
  dependencies that expect a single value, this ambiguity is not arbitrarily resolved. If no unique bean definition is
  available, an exception is thrown.

> - `property` 및 `constructor-arg` 설정의 명시적 의존성은 항상 `autowiring`을 `override`
    합니다. `Primitives(그니까 int, float 같은 거)`, `String`, `Classes(및 이러한 단순 프로퍼티의 배열)`와 같은 단순 프로퍼티는 `autowire`할 수 없습니다. 이
    제한은 설계에 의한 것입니다.
> - `autowiring`은 명시적 `wiring`보다 정확도가 떨어집니다. 하지만 앞의 표에서 언급했듯이, 스프링은 모호한 경우 예상치 못한 결과를 초래할 수 있는 결과를 피하기 위해 주의를 기울입니다.
    스프링으로 관리되는 객체 간의 관계는 더 이상 명시적으로 문서화되지 않습니다.
> - 스프링 컨테이너에서 문서를 생성할 수 있는 툴에서는 `wiring` 정보를 사용할 수 없을 수 있습니다.
> - 컨테이너 내의 여러 bean 정의가 `setter` 메서드 또는 생성자 인수에 지정된 타입과 일치하여 `autowire`될 수 있습니다. 배열, 컬렉션 또는 `Map` 인스턴스의 경우, 이것이 반드시 문제가
    되는 것은 아닙니다. 그러나 단일 값을 기대하는 의존성의 경우, 이러한 모호성이 임의로 해결되지 않습니다. 고유한 bean 정의를 사용할 수 없는 경우, 예외가 발생합니다.

<br>

In the latter scenario, you have several options:

> 후자의 시나리오에서는, 몇 가지 옵션이 있습니다:

<br>

- Abandon autowiring in favor of explicit wiring.
- Avoid autowiring for a bean definition by setting its autowire-candidate attributes to false, as described in the next
  section.
- Designate a single bean definition as the primary candidate by setting the primary attribute of its <bean/> element to
  true.
- Implement the more fine-grained control available with annotation-based configuration, as described in
  Annotation-based Container Configuration.

> - `autowiring`을 포기하고 명시적 `wiring`을 사용하세요.
> - 다음 섹션에 설명된 대로 `autowire-candidate` 속성을 `false`로 설정하여 bean 정의에 대한 `autowiring`을 방지합니다.
> - `<bean/>` 요소의 `primary` 속성을 `true`로 설정하여 단일 bean 정의를 `primary` 후보로 지정합니다.
> - 주석-기반 컨테이너 구성에 설명된 대로 주석-기반 구성에서 사용할 수 있는 보다 세분화된 제어 기능을 구현하세요. (세분화된 제어 기능이 아직은 뭔지 모르겠음. 아래아래아래아래 섹션에 있으니 그때까지
    기다리자.)

<br>

# Excluding a Bean from Autowiring

On a per-bean basis, you can exclude a bean from autowiring. In Spring’s XML format, set the autowire-candidate
attribute of the <bean/> element to false. The container makes that specific bean definition unavailable to the
autowiring infrastructure (including annotation style configurations such as @Autowired ).

> bean 단위로 `autowiring`에서 bean을 제외할 수 있습니다. 스프링의 XML 형식에서, `<bean/>` 요소의 `autowire-candiate` 속성을 `false`로 설정합니다. 컨테이너는
> 해당 특정 bean 정의를 `autowiring` 인프라 구조에서 사용할 수 없게 만듭니다(`@Autowired`와 같은 어노테이션 스타일 구성 포함).

<br>

The autowire-candidate attribute is designed to only affect type-based autowiring. It does not affect explicit
references by name, which get resolved even if the specified bean is not marked as an autowire candidate. As a
consequence, autowiring by name nevertheless injects a bean if the name matches.
{: .notice--primary}

> `autowire-candiate` 속성은 타입-기반 `autowiring`에만 영향을 미치도록 설계되었습니다. 지정된 bean이 `autowire` 후보로 표시되지 않은 경우에도 해결되는 이름에 의한 명시적
> 참조에는 영향을 미치지 않습니다. 따라서, 이름에 의한 `autowiring`은 이름이 일치하는 경우 bean을 삽입합니다.

<br>

You can also limit autowire candidates based on pattern-matching against bean names. The top-level <beans/> element
accepts one or more patterns within its default-autowire-candidates attribute. For example, to limit autowire candidate
status to any bean whose name ends with Repository, provide a value of *Repository. To provide multiple patterns, define
them in a comma-separated list. An explicit value of true or false for a bean definition’s autowire-candidate attribute
always takes precedence. For such beans, the pattern matching rules do not apply.

> bean 이름에 대한 패턴 매칭을 기반으로 `autowiring` 후보를 제한할 수도 있습니다. 최상위 `<beans/>` 요소는 `default-autowire-candidates` 속성 내에서 하나 이상의
> 패턴을 허용합니다. 예를 들어, `autowire` 후보 상태를 이름이 `Repository`로 끝나는 모든 bean으로 제한하려면 `*Repsository` 값을 제공합니다. 여러 패턴을 제공하려면, 쉼표로
> 구분된
> 목록으로 정의합니다. bean 정의의 `autowire-candidate` 속성에 대해 `true` 또는 `false`의 명시적 값이 항상 우선시됩니다. 이러한 bean의 경우, 패턴 매칭 규칙이 적용되지
> 않습니다.

<br>

These techniques are useful for beans that you never want to be injected into other beans by autowiring. It does not
mean that an excluded bean cannot itself be configured by using autowiring. Rather, the bean itself is not a candidate
for autowiring other beans.

> 이러한 기술은 `autowiring`을 통해 다른 bean에 주입하지 않으려는 bean에 유용합니다. 그렇다고 `autowiring`을 사용하여 제외된 bean 자체를 구성할 수 없다는 의미는 아닙니다. 오히려
> 해당 bean 자체는 다른 bean을 `autowiring`할 수 있는 후보가 아닙니다.

<br>

# Reference

- [Spring 공식 문서](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#spring-core)