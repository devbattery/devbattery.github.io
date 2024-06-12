---
title: "[Spring] IoC 컨테이너 공식문서 번역 (Dependency Injection)"
excerpt: "의존성 주입"

categories:
  - Spring
tags:
  - [ioc]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-05-13
last_modified_at: 2023-05-13
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

# Dependency Injection

Dependency injection (DI) is a process whereby objects define their dependencies (that is, the other objects with which
they work) only through constructor arguments, arguments to a factory method, or properties that are set on the object
instance after it is constructed or returned from a factory method. The container then injects those dependencies when
it creates the bean. This process is fundamentally the inverse (hence the name, Inversion of Control) of the bean itself
controlling the instantiation or location of its dependencies on its own by using direct construction of classes or the
Service Locator pattern.

> 종속성 주입(DI)은 객체가 생성자 인수와 팩토리 메서드에 대한 인수 또는 객체 인스턴스가 생성되거나, 팩토리 메서드에서 반환된 후 객체 인스턴스에 설정된 속성을 통해서만 의존성(즉, 함께 작동하는 다른 객체)을
> 정의하는 프로세스입니다. 그런 다음 컨테이너는 빈을 생성할 때 이러한 의존성을 주입합니다. 이 프로세스는 기본적으로 클래스의 직접 구성 또는 서비스 로케이터 패턴을 사용하여 빈 자체가 종속성의 인스턴스화 또는
> 위치를
> 자체적으로 제어하는 역방향(따라서 이름이 제어의 역전인 거임)입니다.

<br>

Code is cleaner with the DI principle, and decoupling is more effective when objects are provided with their
dependencies. The object does not look up its dependencies and does not know the location or class of the dependencies.
As a result, your classes become easier to test, particularly when the dependencies are on interfaces or abstract base
classes, which allow for stub or mock implementations to be used in unit tests.

> DI 원칙을 사용하면 코드가 더 깔끔해지며, 객체에 의존성이 제공될 때 디커플링이 더욱 효과적입니다. 객체는 의존성을 조회하지 않으며 의존성의 위치나 클래스를 알지 못합니다. 결과적으로 클래스를 테스트하기가 더
> 쉬워지며, 특히 의존성이 인터페이스나 추상 기본 클래스에 있는 경우, 단위 테스트에서 `stuc` 또는 `mock` 구현들을 할 수 있습니다.

<br>

DI exists in two major variants: Constructor-based dependency injection and Setter-based dependency injection.

> DI는 크게 두 가지 변형이 있습니다: 생성자 기반 의존성 주입과 세터 기반 의존성 주입입니다.

<br>

## Constructor-based Dependency Injection

Constructor-based DI is accomplished by the container invoking a constructor with a number of arguments, each
representing a dependency. Calling a static factory method with specific arguments to construct the bean is nearly
equivalent, and this discussion treats arguments to a constructor and to a static factory method similarly. The
following example shows a class that can only be dependency-injected with constructor injection:

> 생성자 기반 DI는 컨테이너가 각각 의존성을 나타내는 여러 개의 인자를 사용하여 생성자를 호출함으로써 수행됩니다. 특정 인수를 사용하여 `static` 팩토리 메서드를 호출하여 빈을 생성하는 것은 거의 동일하며,
> 이 설명에서는 생성자와 `static` 팩토리 메서드에 대한 인수를 유사하게 취급합니다. 아래의 예제에서는 생성자 주입으로만 의존성을 주입할 수 있는 클래스를 보여줍니다.

```java
public class SimpleMovieLister {

    // the SimpleMovieLister has a dependency on a MovieFinder
    // SimpleMovieListner는 MovieFinder에 대한 의존성이 있습니다
    private final MovieFinder movieFinder;

    // a constructor so that the Spring container can inject a MovieFinder
    // 생성자를 생성하여 스프링 컨테이너가 MovieFinder를 주입할 수 있도록 합니다.
    public SimpleMovieLister(MovieFinder movieFinder) {
        this.movieFinder = movieFinder;
    }

    // business logic that actually uses the injected MovieFinder is omitted...
    // 실제로 삽입된 MovieFinder를 사용하는 비즈니스 로직은 생략쓰
}
```

Notice that there is nothing special about this class. It is a POJO that has no dependencies on container specific
interfaces, base classes, or annotations.

> 위 클래스에는 특별한 것이 없습니다. 컨테이너 특정 인터페이스, 기본 클래스 또는 어노테이션에 대한 의존성이 없는 POJO입니다.

<br>

### Constructor Argument Resolution

Constructor argument resolution matching occurs by using the argument’s type. If no potential ambiguity exists in the
constructor arguments of a bean definition, the order in which the constructor arguments are defined in a bean
definition is the order in which those arguments are supplied to the appropriate constructor when the bean is being
instantiated. Consider the following class:

> 생성자 인자 해결 매칭은 인자의 유형을 사용하여 발생합니다. 빈 정의의 생성자 인자에 잠재적인 모호성이 존재하지 않는 경우, 빈 정의에서 생성자 인자가 정의되는 순선느 빈이 인스턴스화 될 때 해당 인자가 적절한
> 생성자에게 제공되는 순서입니다. 아래의 클래스를 고려하세요:

```java
package x.y;

public class ThingOne {

    public ThingOne(ThingTwo thingTwo, ThingThree thingThree) {
        // ...
    }
}
```

Assuming that the ThingTwo and ThingThree classes are not related by inheritance, no potential ambiguity exists. Thus,
the following configuration works fine, and you do not need to specify the constructor argument indexes or types
explicitly in the <constructor-arg/> element.

> `ThingTwo`와 `ThingThree` 클래스가 상속으로 관련되지 않는다고 가정하면, 잠재적인 모호성은 존재하지 않습니다. 따라서 아래의 구성은 정상적으로 작동하며, `<constructor-arg/>`
> 요소에 생성자 인수 인덱스나 유형을 명시적으로 지정할 필요가 없습니다.

```xml

<beans>
    <bean id="beanOne" class="x.y.ThingOne">
        <constructor-arg ref="beanTwo"/>
        <constructor-arg ref="beanThree"/>
    </bean>

    <bean id="beanTwo" class="x.y.ThingTwo"/>

    <bean id="beanThree" class="x.y.ThingThree"/>
</beans>
```

When another bean is referenced, the type is known, and matching can occur (as was the case with the preceding example).
When a simple type is used, such as <value>true</value>, Spring cannot determine the type of the value, and so cannot
match by type without help. Consider the following class:

> 아래의 빈을 참조하면, 유형을 알 수 있으므로 위의 예제에서와 같이 일치시킬 수 있습니다.`<value>true</value>`와 같은 단순한 타입이 사용되는 경우, 스프링은 값의 타입을 확인할 수 없으므로 도움
> 없이는 타입별로 일치시킬 수 없습니다. 아래 클래스를 고려해 보세요:

```java
package examples;

public class ExampleBean {

    // Number of years to calculate the Ultimate Answer
    // 최종 정답을 계산하는 데 걸리는 연도 수
    private final int years;

    // The Answer to Life, the Universe, and Everything
    // 생명, 우주 그리고 모든 것에 대한 해답
    private final String ultimateAnswer;

    public ExampleBean(int years, String ultimateAnswer) {
        this.years = years;
        this.ultimateAnswer = ultimateAnswer;
    }
}
```

In the preceding scenario, the container can use type matching with simple types if you explicitly specify the type of
the constructor argument by using the type attribute, as the following example shows:

> 앞의 시나리오에서 컨테이너는 아래의 예제와 같이 유형 `type`을 사용하여 생성자 인수의 유형을 명시적으로 지정하는 경우, 단순 유형과 유형 일치를 사용할 수 있습니다.

```xml

<bean id="exampleBean" class="examples.ExampleBean">
    <constructor-arg type="int" value="7500000"/>
    <constructor-arg type="java.lang.String" value="42"/>
</bean>
```

You can use the index attribute to specify explicitly the index of constructor arguments, as the following example
shows:

> 아래의 예제에서 볼 수 있듯이, `index` 속성을 사용하여 생성자 인수의 인덱스를 명시적으로 지정할 수 있습니다.

```xml

<bean id="exampleBean" class="examples.ExampleBean">
    <constructor-arg index="0" value="7500000"/>
    <constructor-arg index="1" value="42"/>
</bean>
```

In addition to resolving the ambiguity of multiple simple values, specifying an index resolves ambiguity where a
constructor has two arguments of the same type.

> 인덱스를 지정하면 여러 단순 값의 모호성을 해결하는 것 외에도, 생성자에 동일한 유형의 인수가 두 개 있는 경우 모호성을 해결할 수 있습니다.

<br>

The index is 0-based.
{: .notice}

<br>

You can also use the constructor parameter name for value disambiguation, as the following example shows:

> 아래의 예제에서 볼 수 있듯이, 생성자 매개변수 이름을 사용하여 값의 모호성을 없앨 수도 있습니다.

```xml

<bean id="exampleBean" class="examples.ExampleBean">
    <constructor-arg name="years" value="7500000"/>
    <constructor-arg name="ultimateAnswer" value="42"/>
</bean>
```

Keep in mind that, to make this work out of the box, your code must be compiled with the debug flag enabled so that
Spring can look up the parameter name from the constructor. If you cannot or do not want to compile your code with the
debug flag, you can use the @ConstructorProperties JDK annotation to explicitly name your constructor arguments. The
sample class would then have to look as follows:

> 이 기능을 바로 사용하려면, 스프링이 생성자에서 매개변수 이름을 조회할 수 있도록 디버그 플래그를 활성화한 상태로 코드를 컴파일해야 합니다. 디버그 플래그를 사용하여 코드를 컴파일할 수 없거나 원하지 않는
> 경우, `@ConstructorPreperties` JDK 어노테이션을 사용하여 생성자 인수의 이름을 명시적으로 지정할 수 있습니다. 그러면 샘플 클래스는 아래와 같이 보일 것입니다.

```java
package examples;

public class ExampleBean {

    // Fields omitted
    // 필드는 생략쓰

    @ConstructorProperties({"years", "ultimateAnswer"})
    public ExampleBean(int years, String ultimateAnswer) {
        this.years = years;
        this.ultimateAnswer = ultimateAnswer;
    }
}
```

<br>

## Setter-based Dependency Injection

Setter-based DI is accomplished by the container calling setter methods on your beans after invoking a no-argument
constructor or a no-argument static factory method to instantiate your bean.

> 세터 기반 DI는 컨테이너가 인수가 없는 생성자 또는 인수가 없는 `static` 팩토리 메서드를 호출하여 빈을 인스턴스화한 후 빈의 세터 메서드를 호출하여 수행됩니다.

<br>

The following example shows a class that can only be dependency-injected by using pure setter injection. This class is
conventional Java. It is a POJO that has no dependencies on container specific interfaces, base classes, or annotations.

> 아래의 예제는 순수 세터 주입을 사용해야만 의존성 주입이 가능한 클래스를 보여줍니다. 이 클래스는 기본 자바입니다. 컨테이너 특정 인터페이스 또는 어노테이션에 대한 의존성이 없는 POJO입니다.

```java
public class SimpleMovieLister {

    // the SimpleMovieLister has a dependency on the MovieFinder
    // SimpleMoiveLister는 MovieFinder에 대한 종속성이 있습니다.
    private MovieFinder movieFinder;

    // a setter method so that the Spring container can inject a MovieFinder
    // 세터 메서드를 추가하여 스프링 컨테이너가 MoiveFinder를 주입할 수 있도록 합니다.
    public void setMovieFinder(MovieFinder movieFinder) {
        this.movieFinder = movieFinder;
    }

    // business logic that actually uses the injected MovieFinder is omitted...
    // 삽입된 MovieFinder를 실제로 사용하는 비즈니스 로직은 생략쓰
}
```

<br>

The ApplicationContext supports constructor-based and setter-based DI for the beans it manages. It also supports
setter-based DI after some dependencies have already been injected through the constructor approach. You configure the
dependencies in the form of a BeanDefinition, which you use in conjunction with PropertyEditor instances to convert
properties from one format to another. However, most Spring users do not work with these classes directly (that is,
programmatically) but rather with XML bean definitions, annotated components (that is, classes annotated with
@Component, @Controller, and so forth), or @Bean methods in Java-based @Configuration classes. These sources are then
converted internally into instances of BeanDefinition and used to load an entire Spring IoC container instance.

> `ApplicationContext`는 관리하는 빈에 대해 생성자 기반 및 세터 기반 DI를 지원합니다. 또한 생성자 접근 방식을 통해 일부 의존성이 이미 주입된 후에도 세터 기반 DI를 지원합니다.
> 의존성을 `BeanDefiniton`의 형태로 구성하고, 이를 `PropertyEditor` 인스턴스와 함께 사용하여 속성을 한 형식에서 다른 형식으로 변환합니다. 그러나 대부분의 스프링 사용자는 이러한 클래스를
> 직접(즉, 프로그래밍 방식으로) 사용하는 것이 아니라 XMl 빈 정의, 주석이 달린 컴포넌트(즉, `@Component`, `@Controller` 등으로 주석이 달린 클래스) 또는 자바
> 기반 `@Configuration` 클래스의 `@Bean` 메서드를 사용하여 작업합니다. 그런 다음 이러한 소스는 내부적으로 `BeanDefinition`의 인스턴스로 변환되어 전체 스프링 IoC 컨테이너
> 인스턴스를
> 로드하는 데 사용됩니다.

<br>

### Constructor-based or setter-based DI?

Since you can mix constructor-based and setter-based DI, it is a good rule of thumb to use constructors for mandatory
dependencies and setter methods or configuration methods for optional dependencies. Note that use of the @Autowired
annotation on a setter method can be used to make the property be a required dependency; however, constructor injection
with programmatic validation of arguments is preferable.

> 생성자 기반과 세터 기반 DI를 혼합할 수 있으므로 필수 의존성에는 생성자를 사용하고, 선택적 의존성에는 세터 메서드 또는 구성 메서드를 사용하는 것이 좋습니다. 세터 메서드에 `@Autowired` 어노테이션을
> 사용하여 프로퍼티를 필수 의존성으로 만들 수 있지만, 인자의 프로그래밍 방식 유효성 검사가 포함된 생성자 주입을 사용하는 것이 좋습니다.

<br>

The Spring team generally advocates constructor injection, as it lets you implement application components as immutable
objects and ensures that required dependencies are not null. Furthermore, constructor-injected components are always
returned to the client (calling) code in a fully initialized state. As a side note, a large number of constructor
arguments is a bad code smell, implying that the class likely has too many responsibilities and should be refactored to
better address proper separation of concerns.

> 스프링 팀은 일반적으로 생성자 주입을 지지하는데, 이는 애플리케이션 컴포넌트를 불변 객체로 구현하고, 필요한 의존성이 `null`이 되지 않도록 보장하기 때문입니다. 또한 생성자 주입 컴포넌트는 항상 완전히
> 초기화된 상태로 클라이언트(호출) 코드에 반환됩니다. 참고로, 생성자 인수가 많다는 것은 코드 냄새가 좋지 않다는 의미이며, 클래스에 너무 많은 책임이 있을 수 있으므로 적절한 분리를 위해 리팩토링해야 한다는
> 것을
> 의미합니다. 이럴 때 빌더 패턴 쓰면 되려나?

<br>

Setter injection should primarily only be used for optional dependencies that can be assigned reasonable default values
within the class. Otherwise, not-null checks must be performed everywhere the code uses the dependency. One benefit of
setter injection is that setter methods make objects of that class amenable to reconfiguration or re-injection later.
Management through JMX MBeans is therefore a compelling use case for setter injection.

> 세터 주입은 주로 클래스 내에서 합리적인 기본값을 할당할 수 있는 선택적 의존성에만 사용해야 합니다. 그렇지 않으면 코드가 의존성을 사용하는 모든 곳에서 `null`이 아닌지 검사를 수행해야 합니다. 세터 주입의
> 한 가지 이점은 세터 메서드를 사용하여 해당 클래스의 객체를 나중에 재구성하거나 다시 주입할 수 있다는 점입니다. 따라서 `JMX MBeans`를 통한 관리는 세터 주입의 강력한 사용 사례입니다. 이게 뭔디

<br>

Use the DI style that makes the most sense for a particular class. Sometimes, when dealing with third-party classes for
which you do not have the source, the choice is made for you. For example, if a third-party class does not expose any
setter methods, then constructor injection may be the only available form of DI.

> 특정 클래스에 가장 적합한 DI 스타일을 사용하세요. 소스가 없는 타사 클래스를 다룰 때는 어떤 스타일을 선택해야 할지 고민하는 경우가 있습니다. 예를 들어, 서드파티 클래스에 세터 메서드가 노출되지 않는 경우,
> 생성자 주입이 가능한 유일한 DI 형태일 수 있습니다.

<br>

## Dependency Resolution Process

The container performs bean dependency resolution as follows:

- The ApplicationContext is created and initialized with configuration metadata that describes all the beans.
  Configuration metadata can be specified by XML, Java code, or annotations.
- For each bean, its dependencies are expressed in the form of properties, constructor arguments, or arguments to the
  static-factory method (if you use that instead of a normal constructor). These dependencies are provided to the bean,
  when the bean is actually created.
- Each property or constructor argument is an actual definition of the value to set, or a reference to another bean in
  the container.
- Each property or constructor argument that is a value is converted from its specified format to the actual type of
  that property or constructor argument. By default, Spring can convert a value supplied in string format to all
  built-in types, such as int, long, String, boolean, and so forth.

> 컨테이너는 다음과 같이 빈 의존성 해결확인을 수행합니다:
> - 모든 빈을 설명하는 구성 메타데이터로, `ApplicationContext`가 생성되고 초기화됩니다. 구성 메타데이터는 XML, Java 코드 또는 어노테이션으로 지정할 수 있습니다.
> - 각 빈의 종속성은 속성, 생성자 인자 또는 정적 팩토리 메서드에 대한 인자의 형태로 표현됩니다(일반 생성자 대신 정적 팩토리 메서드를 사용하는 경우). 이러한 의존성은 빈이 실제로 생성될 때 빈에 제공됩니다.
> - 각 속성 또는 생성자 인자는 설정할 값의 실제 정의이거나 컨테이너의 다른 빙에 대한 참조입니다.
> - 값인 각 속성 또는 생성자 인자는 지정된 형식에서 해당 속성 또는 생성자 인자의 실제 유형으로 변환됩니다. 기본적으로 스프링은 문자열 형식으로 제공된
    값을 `int`, `long`, `String`, `boolean` 등과 같은 모든 기본 제공 유형으로 변환할 수 있습니다.

<br>

The Spring container validates the configuration of each bean as the container is created. However, the bean properties
themselves are not set until the bean is actually created. Beans that are singleton-scoped and set to be
pre-instantiated (the default) are created when the container is created. Scopes are defined in Bean Scopes. Otherwise,
the bean is created only when it is requested. Creation of a bean potentially causes a graph of beans to be created, as
the bean’s dependencies and its dependencies' dependencies (and so on) are created and assigned. Note that resolution
mismatches among those dependencies may show up late — that is, on first creation of the affected bean.

> 스프링 컨테이너는 컨테이너가 생성될 때 각 빈의 구성에 대한 유효성을 검사합니다. 그러나 빈 속성 자체는 빈이 실제로 생성될 때까지 설정되지 않습니다. 싱글톤 범위로 설정되고 사전 인스턴스화(기본값) 되도록
> 설정된 빈은 컨테이너가 생성될 때 생성됩니다. 범위는 `Bean Scope`에서 정의됩니다. 그렇지 않으면 요청이 있을 때만 빈이 생성됩니다. 빈을 생성하면 빈의 의존성과 그 의존성의 의존성 등이 줄줄이
> 소세지처럼
> 생성되고 할당되므로 빈의 그래프가 생성될 수 있습니다. 이러한 의존성 간의 해결 불일치는 나중에 - 즉, 영향을 받는 빈을 처음 생성할 때 나타날 수 있습니다.

<br>

### Circular dependencies

If you use predominantly constructor injection, it is possible to create an unresolvable circular dependency scenario.

> 생성자 주입을 사용하는 경우, 해결할 수 없는 순환 의존성 시나리오가 발생할 수 있습니다.

<br>

For example: Class A requires an instance of class B through constructor injection, and class B requires an instance of
class A through constructor injection. If you configure beans for classes A and B to be injected into each other, the
Spring IoC container detects this circular reference at runtime, and throws a BeanCurrentlyInCreationException.

> 예를 들어, 클래스 A는 생성자 주입을 통해 클래스 B의 인스턴스를 필요로 하고, 클래스 B는 생성자 주입을 통해 클래스 A의 인스턴스를 필요로 합니다. 클래스 A와 B에 대한 빈이 서로 주입되도록 구성한 경우,
> 스프링 IoC 컨테이너는 실행 시간에 이 순환 참조를 감지하고 `BeanCurrentlyCreationException`을 던집니다.

<br>

One possible solution is to edit the source code of some classes to be configured by setters rather than constructors.
Alternatively, avoid constructor injection and use setter injection only. In other words, although it is not
recommended, you can configure circular dependencies with setter injection.

> 한 가지 가능한 해결책은 일부 클래스의 소스 코드를 편집하여 생성자 대신 세터로 구성하는 것입니다. 또는 생성자 주입을 피하고 세터 주입만 사용하는 방법도 있습니다. 즉, 권장되지만 않지만 세터 주입으로 순환
> 의존성을 구성할 수 있습니다.

<br>

Unlike the typical case (with no circular dependencies), a circular dependency between bean A and bean B forces one of
the beans to be injected into the other prior to being fully initialized itself (a classic chicken-and-egg scenario).

> 일반적인 경우(순환 의존성이 없는 경우)와 달리, 빈 A와 빈 B 사이의 순환 종속성은 빈 중 하나가 완전히 초기화되기 전에 다른 빈에 주입되도록 강제합니다(고전적인 닭과 달걀 시나리오 -> 닭이 먼저냐 달걀이
> 먼저냐 이걸 말하는 듯?)

<br>

<hr>

<br>

You can generally trust Spring to do the right thing. It detects configuration problems, such as references to
non-existent beans and circular dependencies, at container load-time. Spring sets properties and resolves dependencies
as late as possible, when the bean is actually created. This means that a Spring container that has loaded correctly can
later generate an exception when you request an object if there is a problem creating that object or one of its
dependencies — for example, the bean throws an exception as a result of a missing or invalid property. This potentially
delayed visibility of some configuration issues is why ApplicationContext implementations by default pre-instantiate
singleton beans. At the cost of some upfront time and memory to create these beans before they are actually needed, you
discover configuration issues when the ApplicationContext is created, not later. You can still override this default
behavior so that singleton beans initialize lazily, rather than being eagerly pre-instantiated.

> 일반적으로 스프링이 올바른 작업을 수행한다고 믿을 수 있습니다. 존재하지 않는 빈에 대한 참조 및 순환 의존성과 같은 구성 문제를 컨테이너 로드 시점에 감지합니다. 스프링은 빈이 실제로 생성될 때 가능한 한 늦게
> 속성을 설정하고 의존성을 해결합니다. 즉, 올바르게 로드된 스프링 컨테이너는 나중에 객체를 요청할 때, 해당 객체 또는 해당 의존성 중 하나를 생성하는 데 문제가 있는 경우(예: 빈이 누락되거나 잘못된 속성으로
> 인해
> 예외를 던지는 경우) 예외를 생성할 수 있습니다. 일부 구성 문제에 대한 가시성이 지연될 수 있기 때문에 기본적으로 `ApplicaitonContext` 구현은 싱글톤 빈을 미리 인스턴스화합니다. 이러한 빈이
> 실제로
> 필요하기 전에 미리 생성하는 데 약간의 시간과 메모리가 소요되지만, 나중에가 아니라 `ApplicationContext`가 생성될 때 구성 문제를 발견할 수 있습니다. 이 기본 동작을 재정의하여 싱글톤 빈이
> 급하게
> 사전 인스턴스화 되지 않고 느리게 초기화되도록 할 수 있습니다.

<br>

If no circular dependencies exist, when one or more collaborating beans are being injected into a dependent bean, each
collaborating bean is totally configured prior to being injected into the dependent bean. This means that, if bean A has
a dependency on bean B, the Spring IoC container completely configures bean B prior to invoking the setter method on
bean A. In other words, the bean is instantiated (if it is not a pre-instantiated singleton), its dependencies are set,
and the relevant lifecycle methods (such as a configured init method or the InitializingBean callback method) are
invoked.

> 순환 의존성이 존재하지 않는 경우, 하나 인상의 협업 빈이 의존 빈에 주입될 때, 각 협업 빈은 종속 빈에 주입되기 전에 완전히 구성됩니다. 즉, 빈 A가 빈 B에 대한 의존성이 있는 경우 스프링 IoC
> 컨테이너는 빈 A에서 세터 메서드를 호출하기 전에 빈 B를 완전히 구성합니다. 즉, 빈이 인스턴스화 되고(미리 인스턴스화된 싱글톤이 아닌 경우), 의존성이 설정되고, 관련된 라이프사이클 메서드(예: 구성된 초기화
> 메서드 또는 `InitializingBean` 콜백 메서드)가 호출됩니다.

<br>

## Examples of Dependency Injection

The following example uses XML-based configuration metadata for setter-based DI. A small part of a Spring XML
configuration file specifies some bean definitions as follows:

> 다음 예제는 세터 기반 DI에 XML 기반 구성 메타데이터를 사용합니다. 스프링 XML 구성 파일의 일부에는 다음과 같이 몇 가지 빈 정의가 지정되어 있습니다.

```xml
<bean id="exampleBean" class="examples.ExampleBean">
	<!-- setter injection using the nested ref element -->
	<property name="beanOne">
		<ref bean="anotherExampleBean"/>
	</property>

	<!-- setter injection using the neater ref attribute -->
	<property name="beanTwo" ref="yetAnotherBean"/>
	<property name="integerProperty" value="1"/>
</bean>

<bean id="anotherExampleBean" class="examples.AnotherBean"/>
<bean id="yetAnotherBean" class="examples.YetAnotherBean"/>
```

<br>

The following example shows the corresponding ExampleBean class:

> 다음 예제는 해당 `ExampleBean` 클래스를 보여줍니다.

```java
public class ExampleBean {

	private AnotherBean beanOne;

	private YetAnotherBean beanTwo;

	private int i;

	public void setBeanOne(AnotherBean beanOne) {
		this.beanOne = beanOne;
	}

	public void setBeanTwo(YetAnotherBean beanTwo) {
		this.beanTwo = beanTwo;
	}

	public void setIntegerProperty(int i) {
		this.i = i;
	}
}
```

In the preceding example, setters are declared to match against the properties specified in the XML file. The following
example uses constructor-based DI:

> 위의 예제에서는 XML 파일에 지정된 프로퍼티와 일치하도록 생성자를 선언했습니다. 다음 예제에서는 생성자 기반 DI를 사용합니다.

```xml
<bean id="exampleBean" class="examples.ExampleBean">
	<!-- constructor injection using the nested ref element -->
	<constructor-arg>
		<ref bean="anotherExampleBean"/>
	</constructor-arg>

	<!-- constructor injection using the neater ref attribute -->
	<constructor-arg ref="yetAnotherBean"/>

	<constructor-arg type="int" value="1"/>
</bean>

<bean id="anotherExampleBean" class="examples.AnotherBean"/>
<bean id="yetAnotherBean" class="examples.YetAnotherBean"/>
```

<br>

The following example shows the corresponding ExampleBean class:

> 다음 예제는 해당 `ExampleBean` 클래스를 보여줍니다.

<br>

```java
public class ExampleBean {

	private AnotherBean beanOne;

	private YetAnotherBean beanTwo;

	private int i;

	public ExampleBean(
		AnotherBean anotherBean, YetAnotherBean yetAnotherBean, int i) {
		this.beanOne = anotherBean;
		this.beanTwo = yetAnotherBean;
		this.i = i;
	}
}
```

The constructor arguments specified in the bean definition are used as arguments to the constructor of the ExampleBean.

> 빈 정의에 지정된 생성자 인수는 `ExampleBean`의 생성자에 대한 인수로 사용됩니다.

<br>

Now consider a variant of this example, where, instead of using a constructor, Spring is told to call a static factory
method to return an instance of the object:

> 이제 위 예제의 변형으로, 생성자를 사용하는 대신 스프링이 `static` 팩토리 메서드를 호출하여 객체의 인스턴스를 반환하도록 지시하는 경우를 생각해 보겠습니다:

```xml
<bean id="exampleBean" class="examples.ExampleBean" factory-method="createInstance">
	<constructor-arg ref="anotherExampleBean"/>
	<constructor-arg ref="yetAnotherBean"/>
	<constructor-arg value="1"/>
</bean>

<bean id="anotherExampleBean" class="examples.AnotherBean"/>
<bean id="yetAnotherBean" class="examples.YetAnotherBean"/>
```

<br>

The following example shows the corresponding ExampleBean class:

> 다음 예제는 해당 `ExampleBean` 클래스를 보여줍니다.

```java
public class ExampleBean {

	// a private constructor
	// private 생성자
	private ExampleBean(...) {
		...
	}
    
	// a static factory method; the arguments to this method can be
	// 정적 팩토리 메서드; 이 메서드의 인수는 다음과 같을 수 있음
	// considered the dependencies of the bean that is returned,
	// 반환되는 빈의 의존성을 고려
	// regardless of how those arguments are actually used.
	// 해당 인수가 실제로 어떻게 사용되는지와는 상관 없이
	public static ExampleBean createInstance (
		AnotherBean anotherBean, YetAnotherBean yetAnotherBean, int i) {

		ExampleBean eb = new ExampleBean (...);
		// some other operations...
		//
		return eb;
	}
}
```

Arguments to the static factory method are supplied by <constructor-arg/> elements, exactly the same as if a constructor
had actually been used. The type of the class being returned by the factory method does not have to be of the same type
as the class that contains the static factory method (although, in this example, it is). An instance (non-static)
factory method can be used in an essentially identical fashion (aside from the use of the factory-bean attribute instead
of the class attribute), so we do not discuss those details here.

> `static` 팩토리 메서드에 대한 인수는 생성자가 실제로 사용된 것과 같이 `<constructor-args/>` 요소로 제공됩니다. 팩토리 메서드가 반환하는 클래스의 유형은 `static` 팩토리 메서드가
> 포함된 클래스와 동일한 유형일 필요는 없습니다(이 예제에서는 동일하지만). 인스턴스(비 정적) 팩토리 메서드는 본질적으로 동일한 방식으로 사용될 수 있으므로(클래스 속성 대신 `factory-bean` 속성을
> 사용하는 것 외에는), 여기서는 이러한 세부 사항에 대해 설명하지 않습니다. 

<br>

# Reference

- [Spring 공식 문서](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#spring-core)