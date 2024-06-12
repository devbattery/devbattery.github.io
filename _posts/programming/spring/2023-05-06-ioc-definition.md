---
title: "[Spring] IoC 컨테이너 공식문서 번역 (Bean Overview)"
excerpt: "Bean 개요"

categories:
  - Spring
tags:
  - [ioc]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-05-06
last_modified_at: 2023-05-06
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

# Bean OverView

A Spring IoC container manages one or more beans. These beans are created with the configuration metadata that you
supply to the container (for example, in the form of XML <bean/> definitions).

> 스프링 IoC 컨테이너는 하나 이상의 빈을 관리합니다. 이러한 빈은 컨테이너에 제공하는 구성 메타데이터(예: XML `<bean/>` 정의 형식)로 생성됩니다.

<br>

Within the container itself, these bean definitions are represented as BeanDefinition objects, which contain (among
other information) the following metadata:

> 컨테이너 자체 내에서, 이러한 빈 정의는 아래와 같은 메타데이터를 포함하는 `BeanDefinition` 객체로 표현됩니다.

- A package-qualified class name: typically, the actual implementation class of the bean being defined.
- Bean behavioral configuration elements, which state how the bean should behave in the container (scope, lifecycle
  callbacks, and so forth).
- References to other beans that are needed for the bean to do its work. These references are also called collaborators
  or dependencies.
- Other configuration settings to set in the newly created object — for example, the size limit of the pool or the
  number of connections to use in a bean that manages a connection pool.

> - 패키지-정규화 된 클래스 이름: 일반적으로 정의되는 빈의 실제 구현 클래스
> - 빈 동작 구성 요소: 컨테이너에서 빈이 어떻게 동작해야 하는지를 설명하는 요소(범위, 라이프사이클 콜백 등)
> - 빈이 작업을 수행하는 데 필요한 다른 빈에 대한 참조를 공동 작업자 또는 의존성
> - 새로 만든 객체에서 설정할 기타 구성 설정(예: 풀의 크기 제한 또는 연결 풀을 관리하는 빈에서 사용할 연결 수)

This metadata translates to a set of properties that make up each bean definition. The following table describes these
properties:

> 이 메타데이터는 각 빈 정의를 구성하는 일렬의 속성으로 변환됩니다. 아래의 표에서는 이러한 속성에 대해 설명합니다.

<img width="497" alt="스크린샷 2023-04-18 오후 9 54 48" src="https://user-images.githubusercontent.com/62871026/232783887-03bcd159-7090-40b9-9e4b-2f634d86806d.png">

<br>

In addition to bean definitions that contain information on how to create a specific bean, the ApplicationContext
implementations also permit the registration of existing objects that are created outside the container (by users). This
is done by accessing the ApplicationContext’s BeanFactory through the getBeanFactory() method, which returns the
DefaultListableBeanFactory implementation. DefaultListableBeanFactory supports this registration through the
registerSingleton(..) and registerBeanDefinition(..) methods. However, typical applications work solely with beans
defined through regular bean definition metadata.

> 특정 빈을 생성하는 방법에 대한 정보가 포함된 빈 정의 외에도, `ApplicationContext` 구현은 컨테이너 외부에서 (사용자가) 생성한 기존 객체의 등록도 허용합니다. 이
> 작업은 `getBeanFactory()` 메서드를 통해 애플리케이션 컨텍스트의 `BeanFactory`에 액세스하여 수행되며, 이 메서드는 `DefaultListableBeanFactory` 구현을
> 반환합니다. `DefaultListableBeanFactory`는 `registerSingleton(..)` 및 `registerBeanDefinition(..)` 메서드를 통해 이 등록을 지원합니다. 그러나
> 일반적인 애플리케이션은 오로지 일반 빈 정의 메타데이터를 통해 정의된 빈으로만 작동합니다.

<br>

Bean metadata and manually supplied singleton instances need to be registered as early as possible, in order for the
container to properly reason about them during autowiring and other introspection steps. While overriding existing
metadata and existing singleton instances is supported to some degree, the registration of new beans at runtime (
concurrently with live access to the factory) is not officially supported and may lead to concurrent access exceptions,
inconsistent state in the bean container, or both.

> 컨테이너가 오토와이어 및 다른 `introspection` 단계에서 적절하게 추론할 수 있도록 빈 메타데이터와 수동으로 제공된 싱글톤 인스턴스를 가능한 한 빨리 등록해야 합니다. 기존 메타데이터와 기존 싱글톤
> 인스턴스를 재정의하는 것은 어느 정도 지원되지만, 런타임에(팩토리에 대한 실시간 접근와 동시에) 새 빈을 등록하는 것은 공식적으로 지원되지 않으며 동시 접근 예외, 빈 컨테이너의 일관되지 않은 상태 또는 둘 다로
> 이어질 수 있습니다.

<br>

## Naming Beans

Every bean has one or more identifiers. These identifiers must be unique within the container that hosts the bean. A
bean usually has only one identifier. However, if it requires more than one, the extra ones can be considered aliases.

> 모든 빈에는 하나 이상의 식별자가 있습니다. 이러한 식별자들은 빈을 호스팅하는 컨테이너 내에서만 존재(고유)해야 합니다. 빈에는 일반적으로 하나의 식별자만 존재합니다. 그러나 두 개 이상의 식별자가 필요한 경우,
> 추가의 식별자는 가명으로 여겨질 수 있습니다.

<br>

In XML-based configuration metadata, you use the id attribute, the name attribute, or both to specify bean identifiers.
The id attribute lets you specify exactly one id. Conventionally, these names are alphanumeric ('myBean', 'someService',
etc.), but they can contain special characters as well. If you want to introduce other aliases for the bean, you can
also specify them in the name attribute, separated by a comma (,), semicolon (;), or white space. Although the id
attribute is defined as an xsd:string type, bean id uniqueness is enforced by the container, though not by XML parsers.

> XML 기반 구성 메타디에터에는 `id` 속성, `name` 속성, 또는 둘 다를 사용하여 빈 식별자를 지정합니다. `id` 속성을 사용하면 정확히 하나의 `id`를 지정할 수 있습니다. 일반적으로 이러한
> 이름들은 영숫자('myBean', 'someService' 등)이지만, 특수 문자도 포함할 수 있습니다. 빈의 다른 별칭을 도입하려는 경우, 쉼표(,), 세미콜론(;) 또는 공백으로 구분하여 `name` 속성에
> 지정할 수도 있습니다. `id` 속성은 `xsd:string` 유형으로 정의될지라도, 빈 `id` 고유성은 XML 파서가 아니라 컨테이너에 의해 정의됩니다.

<br>

You are not required to supply a name or an id for a bean. If you do not supply a name or id explicitly, the container
generates a unique name for that bean. However, if you want to refer to that bean by name, through the use of the ref
element or a Service Locator style lookup, you must provide a name. Motivations for not supplying a name are related to
using inner beans and autowiring collaborators.

> 빈의 `name`이나 `id`를 제공할 필요는 없습니다. `name`이나 `id`를 명시적으로 제공하지 않으면, 컨테이너가 해당 빈의 고유 이름을 생성합니다. 그러나 `ref` 요소 또는 서비스 로케이터 스타일
> 조회를 사용하여 해당 빈을 이름으로 참조하는 경우, 이름을 제공해야 합니다. 이름을 제공하지 않는 동기는 내부 빈 및 오토와이어 협력자 사용과 관련이 있습니다.

<br>

### Bean Naming Conventions

The convention is to use the standard Java convention for instance field names when naming beans. That is, bean names
start with a lowercase letter and are camel-cased from there. Examples of such names include accountManager,
accountService, userDao, loginController, and so forth.

> 규칙은 빈 이름을 지정할 때, 인스턴스 필드 이름에 표준 자바 규칙을 적용하는 것입니다. 즉, 빈 이름은 소문자로 시작하고, 카멜케이스를 구분합니다. 이러한 이름의
> 예로는 `accountManager`, `accountService`, `userDao`, `loginController` 등이 있습니다.

<br>

Naming beans consistently makes your configuration easier to read and understand. Also, if you use Spring AOP, it helps
a lot when applying advice to a set of beans related by name.

> 일관되게 빈 이름을 지정하면 구성을 더 쉽게 읽고 이해할 수 있습니다. 또한, 스프링 `AOP`를 사용하는 경우, 이름별로 관련된 일련의 빈에 조언을 적용할 때 많은 도움이 됩니다.

<br>

With component scanning in the classpath, Spring generates bean names for unnamed components, following the rules
described earlier: essentially, taking the simple class name and turning its initial character to lower-case. However,
in the (unusual) special case when there is more than one character and both the first and second characters are upper
case, the original casing gets preserved. These are the same rules as defined by java.beans.Introspector.decapitalize (
which Spring uses here).

> 클래스 경로에서 컴포넌트 검색을 사용하면, 스프링은 앞에서 설명한 규칙에 따라 이름 없는 컴포넌트에 대한 빈 이름을 생성합니다. 기본적으로 간단한 클래스 이름을 가져와 첫 글자를 소문자로 바꿉니다. 그러나 문자가
> 두 개 이상이고, 첫 번째 문자와 두 번쨰 문자가 모두 대문자인 (비정상적인) 특수한 경우에는 원래의 대소문자가 유지됩니다. 이는 `java.beans.Introspector.decapitalize`에 정의된
> 것과
> 동일한 규칙입니다.

<br>

### Aliasing a Bean outside the Bean Definition

In a bean definition itself, you can supply more than one name for the bean, by using a combination of up to one name
specified by the id attribute and any number of other names in the name attribute. These names can be equivalent aliases
to the same bean and are useful for some situations, such as letting each component in an application refer to a common
dependency by using a bean name that is specific to that component itself.

> 빈 정의 자체에서, `id` 속성에 지정된 최대 하나의 이름과 `name` 속성의 다른 이름을 조합하여 빈에 대해 둘 이상의 이름을 제공할 수 있습니다. 이러한 이름들은 동일한 빈에 대한 동등한 별칭이 될 수
> 있으며, 애플리케이션의 각 구성 요소가 해당 요소 자체에 특정한 빈 이름을 사용하여 공통 의존성을 참조하도록 하는 등의 일부 상황에 유용합니다.

<br>

Specifying all aliases where the bean is actually defined is not always adequate, however. It is sometimes desirable to
introduce an alias for a bean that is defined elsewhere. This is commonly the case in large systems where configuration
is split amongst each subsystem, with each subsystem having its own set of object definitions. In XML-based
configuration metadata, you can use the <alias/> element to accomplish this. The following example shows how to do so:

> 그러나 빈이 실제로 정의된 곳에 모든 별칭을 지정하는 것이 항상 적절한 것은 아닙니다. 그러나, 때로는 다른 곳에 정의된 빈에 대한 별칭을 도입하는 것이 바람직할 수 있습니다. 이는 일반적으로 구성이 각 하위
> 시스템으로 분할되어 있고, 각 하위 시스템에 고유한 객체 정의 집합이 있는 대규모 시스템에서 발생합니다. XML 기반 구성 메타데이터에서는 `<alias/>` 요소를 사용하여 이 작업을 수행할 수 있습니다.
> 아래의
> 예제에서 알 수 있습니다.

```xml

<alias name="fromName" alias="toName"/>
```

In this case, a bean (in the same container) named fromName may also, after the use of this alias definition, be
referred to as toName.

> 이 경우, 이 별칭 정의를 사용한 후, `fromName`이라는 이름의 빈 (동일한 컨테이너에 있는)도 `toName`으로 참조될 수 있습니다.

<br>

For example, the configuration metadata for subsystem A may refer to a DataSource by the name of subsystemA-dataSource.
The configuration metadata for subsystem B may refer to a DataSource by the name of subsystemB-dataSource. When
composing the main application that uses both these subsystems, the main application refers to the DataSource by the
name of myApp-dataSource. To have all three names refer to the same object, you can add the following alias definitions
to the configuration metadata:

> 예를 들어, 하위 시스템 A에 대한 구성 메타데이터는 `subsystemA-dataSource`라는 이름으로 데이터소스를 참조할 수 있습니다. 하위 시스템 B에 대한 구성
> 메타데이터는 `subsystemB-dataSource`라는 이름으로 데이터소스를 참조할 수 있습니다. 이 두 하위 시스템을 모두 사용하는 메인 애플리케이션을 구성할 때, 메인
> 애플리케이션은 `myApp-dataSource`라는 이름으로 데이터소스를 참조합니다. 세 가지 이름이 모두 동일한 객체를 참조하도록 하려면, 구성 메타데이터에 아래의 별칭 정의를 추가하면 됩니다.

```xml

<alias name="myApp-dataSource" alias="subsystemA-dataSource"/>
<alias name="myApp-dataSource" alias="subsystemB-dataSource"/>
```

<br>

Now each component and the main application can refer to the dataSource through a name that is unique and guaranteed not
to clash with any other definition (effectively creating a namespace), yet they refer to the same bean.

> 이제 각 컴포넌트와 메인 애플맄에시녀은 고유하고 다른 정의와 충돌하지 않도록 보장된 이름을 통해 데이터소스를 참조할 수 있지만 (효과적으로 네임스페이스를 생성), 동일한 빈을 참조합니다.

<br>

### Java-configuration

If you use Java Configuration, the @Bean annotation can be used to provide aliases. See Using the @Bean Annotation for
details.

> 자바 구성을 사용하는 경우, `@Bean` 어노테이션을 사용하고 별칭을 제공할 수 있습니다. 자세한 내용은 `@Bean` 어노테이션에서 나온대.

<br>

## Instantiating Beans

A bean definition is essentially a recipe for creating one or more objects. The container looks at the recipe for a
named bean when asked and uses the configuration metadata encapsulated by that bean definition to create (or acquire)
an actual object.

> 빈의 정의는 본질적으로 하나 이상의 객체를 생성하기 위한 레시피입니다. 컨테이너는 요청시 지정된 빈의 레시피를 확인하고, 해당 빈의 정의로 구성 메타데이터를 사용하여 실제 객체를 생성(또는 획득)합니다.

<br>

If you use XML-based configuration metadata, you specify the type (or class) of object that is to be instantiated in
the class attribute of the <bean/> element. This class attribute (which, internally, is a Class property on a
BeanDefinition instance) is usually mandatory. (For exceptions, see Instantiation by Using an Instance Factory Method
and Bean Definition Inheritance.) You can use the Class property in one of two ways:

> XML 기반 구성 메타데이터를 사용하는 경우, 인스턴스화할 객체의 유형(또는 클래스)을 `<bean/>` 요소의 `class` 속성에 지정합니다. 이 `class` 속성(내부적으로 `BeanDefinition`
> 인스턴스의 `Class` 속성)은 일반적으로 필수입니다. (예외에 대해서는 인스턴스 팩토리 메서드를 사용한 인스턴스화 및 빈 정의 상속을 참조하자!) `Class` 속성은 두 가지 방법 중 하나로 사용할 수
> 있습니다:

- Typically, to specify the bean class to be constructed in the case where the container itself directly creates the
  bean by calling its constructor reflectively, somewhat equivalent to Java code with the new operator.
- To specify the actual class containing the static factory method that is invoked to create the object, in the less
  common case where the container invokes a static factory method on a class to create the bean. The object type
  returned from the invocation of the static factory method may be the same class or another class entirely.

> - 일반적으로 컨테이너 자체가 생성자를 반사적으로 호출하여 빈을 직접 생성하는 경우, 생성할 빈 클래스를 지정하는 것은 `new` 연산자를 사용하는 자바 코드와 어느 정도 동일합니다.
> - 컨테이너가 클래스에서 `static` 팩토리 메서드를 호출하여 빈을 생성하는 덜 일반적인 경우, 객체를 생성하기 위해 호출되는 `static` 팩토리 메서드가 포함된 실제 클래스를 지정합니다. `static`
    팩토리 메서드 호출에서 반환되는 객체 유형은 동일한 클래스이거나 완전히 다른 클래스일 수 있습니다

<br>

### Nested class names

If you want to configure a bean definition for a nested class, you may use either the binary name or the source name of
the nested class.

> 중첩 클래스에 대한 빈의 정의를 구성하려는 경우, 중첩 클래스의 이진 이름 또는 소스 이름을 사용할 수 있습니다.

<br>

For example, if you have a class called SomeThing in the com.example package, and this SomeThing class has a static
nested class called OtherThing, they can be separated by a dollar sign ($) or a dot (.). So the value of the class
attribute in a bean definition would be com.example.SomeThing$OtherThing or com.example.SomeThing.OtherThing.

> 예를 들어, `com.example` 패키지에 `SomeThing`이라는 클래스가 있고, 이 클래스에 `OtherThing`이라는 `static` 중첩 클래스가 있는 경우, `$` 또는 `.`으로 구분할 수
> 있습니다. 따라서 빈의 정의에서 클래스 속성의 값은 `com.example.SomeThing$OtherThing` 또는 `com.example.SomeThing.OtherThing`이 될 수 있습니다. 

<br>

### Instantiation with a Constructor

When you create a bean by the constructor approach, all normal classes are usable by and compatible with Spring. That
is, the class being developed does not need to implement any specific interfaces or to be coded in a specific fashion.
Simply specifying the bean class should suffice. However, depending on what type of IoC you use for that specific bean,
you may need a default (empty) constructor.

> 생성자 접근 방식으로 빈을 생성하면, 모든 일반 클래스가 스프링에서 사용될 수 있고 호환도 됩니다. 즉, 개발 중인 클래스는 특정 인터페이스를 구현하거나 특정 방식으로 코딩할 필요가 없습니다. 단순히 빈 클래스를
> 지정하는 것만으로도 충분합니다. 그러나 특정 빈에 사용하는 IoC의 유형에 따라 기본(비어 있는) 생성자가 필요할 수 있습니다.

<br>

The Spring IoC container can manage virtually any class you want it to manage. It is not limited to managing true
JavaBeans. Most Spring users prefer actual JavaBeans with only a default (no-argument) constructor and appropriate
setters and getters modeled after the properties in the container. You can also have more exotic non-bean-style classes
in your container. If, for example, you need to use a legacy connection pool that absolutely does not adhere to the
JavaBean specification, Spring can manage it as well.

> 스프링 IoC 컨에티어는 관리하고자 하는 거의 모든 클래스를 관리할 수 있습니다. 이는 실제 `JavaBeans` 관리에만 국한되지 않습니다. 대부분의 스프링 사용자는 기본(인자가 없는) 생성자와 컨테이너의
> 프로퍼티를 모델로 한 적절한 세터와 게터만 있는 실제 `JavaBeans`를 선호합니다. 컨테이너에 더 이국적인 `non-bean-style` 클래스를 포함할 수도 있습니다. 예를 들어, `JavaBean`
> 사양을 전혀 준수하지 않는 레거시 연결 풀을 사용해야 하는 경우, 스프링에서 이를 관리할 수 있습니다.

<br>

With XML-based configuration metadata you can specify your bean class as follows:

> XML 기반 구성 메타데이터를 사용하면 다음과 같이 빈 클래스를 지정할 수 있습니다.

```xml

<bean id="exampleBean" class="examples.ExampleBean"/>

<bean name="anotherExample" class="examples.ExampleBeanTwo"/>
```

For details about the mechanism for supplying arguments to the constructor (if required) and setting object instance
properties after the object is constructed, see Injecting Dependencies.

> 생성자에 인수를 제공하고 (필요한 경우) 객체가 생성된 후 객체 인스턴스 속성을 설정하는 매커니즘에 대한 자세한 내용은 의존성 주입을 참고합시다!

<br>

### Instantiation with a Static Factory Method

When defining a bean that you create with a static factory method, use the class attribute to specify the class that
contains the static factory method and an attribute named factory-method to specify the name of the factory method
itself. You should be able to call this method (with optional arguments, as described later) and return a live object,
which subsequently is treated as if it had been created through a constructor. One use for such a bean definition is to
call static factories in legacy code.

> 정적 팩토리 메서드를 사용하여 생성하는 빈을 정의할 때, `class` 속성을 사용하여 `static` 팩토리 메서드가 포함된 클래스를 지정하고 `factory-method`라는 속성을 사용하여 팩토리 메서드
> 자체의 이름을 지정합니다. 이 메서드를 호출하면 (나중에 설명하는 대로, 선택적 인수를 사용하여) 생성자를 통해 생성된 것처럼 처리되는 라이브 객체를 반환할 수 있어야 합니다. 이러한 빈의 정의의 한 가지 용도는
> 레거시 코드에서 `static` 팩토리를 호출하는 것입니다.

<br>

The following bean definition specifies that the bean will be created by calling a factory method. The definition does
not specify the type (class) of the returned object, but rather the class containing the factory method. In this
example, the createInstance() method must be a static method. The following example shows how to specify a factory
method:

> 다음 빈의 정의는 팩토리 메서드를 호출하여 빈을 생성하도록 지정합니다. 이 정의는 반환되는 객체의 유형(클래스)을 지정하지 않고, 팩토리 메서드가 포함된 클래스를 지정합니다. 이
> 예제에서 `createInstance()` 메서드는 `static` 메서드여야 합니다. 다음 예제는 팩토리 메서드를 지정하는 방법을 보여줍니다.

```xml

<bean id="clientService"
      class="examples.ClientService"
      factory-method="createInstance"/>
```

<br>

The following example shows a class that would work with the preceding bean definition:

> 다음 예제는 앞의 빈 정의와 함께 작동하는 클래스를 보여줍니다.

```java
public class ClientService {
    private static ClientService clientService = new ClientService();

    private ClientService() {
    }

    public static ClientService createInstance() {
        return clientService;
    }
}
```

For details about the mechanism for supplying (optional) arguments to the factory method and setting object instance
properties after the object is returned from the factory, see Dependencies and Configuration in Detail.

> 팩토리 메서드에 (optional) 인수를 제공하고, 객체가 팩토리에서 반환된 후 객체 인스턴스 속성을 설정하는 매커니즘에 대한 자세한 내용은 의존성과 구성 상세 정보 참고하세유.

<br>

### Instantiation by Using an Instance Factory Method

Similar to instantiation through a static factory method, instantiation with an instance factory method invokes a
non-static method of an existing bean from the container to create a new bean. To use this mechanism, leave the class
attribute empty and, in the factory-bean attribute, specify the name of a bean in the current (or parent or ancestor)
container that contains the instance method that is to be invoked to create the object. Set the name of the factory
method itself with the factory-method attribute. The following example shows how to configure such a bean:

> 정적 팩토리 메서드를 통한 인스턴스화와 유사하게 인스턴스 팩토리 메서드를 사용한 인스턴스화는 컨에티너에서 기존 빈의 비정적 메서드를 호출하여 새 빈을 생성합니다. 이 메커니즘을 사용하려면, `class` 속성을
> 비워두고, `factory-bean` 속성에 객체를 생성하기 위해 호출할 인스턴스 메서드가 포함된 현재(또는 부모 또는 조상) 컨테이너의 빈 이름을 지정합니다. `factory-method` 속성을 사용하여
> 팩토리 메서드 자체의 이름을 설정합니다. 아래의 예제는 이러한 빈을 구성하는 방법을 보여줍니다.

```xml
<!-- the factory bean, which contains a method called createInstance() -->
<!-- createdInstance()라는 메서드를 포함하는 팩토리 빈입니다. -->
<bean id="serviceLocator" class="examples.DefaultServiceLocator">
    <!-- inject any dependencies required by this locator bean -->
    <!-- 이 로케이터 빈에 필요한 의존성 주입 -->
</bean>

        <!-- the bean to be created via the factory bean -->
        <!-- 팩토리 빈을 통해 생성할 빈 -->
<bean id="clientService"
      factory-bean="serviceLocator"
      factory-method="createClientServiceInstance"/>
```

<br>

The following example shows the corresponding class:

> 아래의 예는 해당하는 클래스를 보여줍니다.

```java
public class DefaultServiceLocator {

    private static ClientService clientService = new ClientServiceImpl();

    public ClientService createClientServiceInstance() {
        return clientService;
    }
}
```

<br>

One factory class can also hold more than one factory method, as the following example shows:

> 아래의 예제에서 볼 수 있듯이 하나의 팩토리 클래스는 둘 이상의 팩토리 메서드를 보유할 수 있습니다.

```xml

<bean id="serviceLocator" class="examples.DefaultServiceLocator">
    <!-- inject any dependencies required by this locator bean -->
    <!-- 이 로케이터 빈에 필요한 의존성 주입 -->
</bean>

<bean id="clientService"
      factory-bean="serviceLocator"
      factory-method="createClientServiceInstance"/>

<bean id="accountService"
      factory-bean="serviceLocator"
      factory-method="createAccountServiceInstance"/>
```

<br>

The following example shows the corresponding class:

> 아래의 예는 해당하는 클래스를 보여줍니다.

```java
public class DefaultServiceLocator {

    private static ClientService clientService = new ClientServiceImpl();

    private static AccountService accountService = new AccountServiceImpl();

    public ClientService createClientServiceInstance() {
        return clientService;
    }

    public AccountService createAccountServiceInstance() {
        return accountService;
    }
}
```

This approach shows that the factory bean itself can be managed and configured through dependency injection (DI). See
Dependencies and Configuration in Detail.

> 이 접근 방식은 의존성 주입(DI)를 통해 팩토리 빈 자체를 관리하고 구성할 수 있음을 보여줍니다. 자세한 내용은 의존성과 구성을 참고하세욧!

<br>

In Spring documentation, "factory bean" refers to a bean that is configured in the Spring container and that creates
objects through an instance or static factory method. By contrast, FactoryBean (notice the capitalization) refers to a
Spring-specific FactoryBean implementation class.

> 스프링 문서에서, "팩토리 빈"은 스프링 컨테이너에 구성되고 인스턴스 또는 정적 메서드를 통해 객체를 생성하는 빈을 의미합니다. 이와 대조적으로 `FactoryBean`(대문자로 표기된 것을 주목)은 스프링에
> 특화된 `FactoryBean` 구현 클래스를 의미합니다.

<br>

### Determining a Bean’s Runtime Type

The runtime type of a specific bean is non-trivial to determine. A specified class in the bean metadata definition is
just an initial class reference, potentially combined with a declared factory method or being a FactoryBean class which
may lead to a different runtime type of the bean, or not being set at all in case of an instance-level factory method (
which is resolved via the specified factory-bean name instead). Additionally, AOP proxying may wrap a bean instance with
an interface-based proxy with limited exposure of the target bean’s actual type (just its implemented interfaces).

> 특정 빈의 런타임 유형은 결정하기 쉽지 않습니다. 빈 메타데이터 정의에 지정된 클래스는 초기 클래스 참조일 뿐이며, 선언된 팩토리 메서드와 결합되거나 `FactoryBean` 클래스가 되어 빈의 런타임 유형이
> 달라지거나 인스턴스-레벨 팩토리 메서드의 경우 전혀 설정되지 않을 수 있습니다 (대신 지정된 `factory-bean` 이름을 통해 해결됨).또한 AOP 프록시는 대상 빈의 실제 유형 (구현된 인터페이스만)이
> 제한적으로 노출되는 인터페이스 기반 프록시로 빈 인스턴스를 래핑할 수 있습니다.

<br>

The recommended way to find out about the actual runtime type of a particular bean is a BeanFactory.getType call for the
specified bean name. This takes all of the above cases into account and returns the type of object that a
BeanFactory.getBean call is going to return for the same bean name.

> 특정 빈의 실제 런타임 유형을 알아내는 권장 방법은 지정된 빈 이름에 대한 `BeanFactory.getType`을 호출하는 것입니다. 이 함수는 위의 든 경우를 고려하여 동일한 빈 이름에
> 대해 `BeanFactory.getType` 호출이 반환할 객체의 유형을 리턴합니다.

<br>

# Reference

- [Spring 공식 문서](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#spring-core)