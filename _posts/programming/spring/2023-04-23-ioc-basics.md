---
title: "[Spring] IoC 컨테이너 공식문서 번역 (Container Overview)"
excerpt: "컨테이너 개요"

categories:
  - Spring
tags:
  - [ioc]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-04-23
last_modified_at: 2023-04-23
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

# Container Overview

The org.springframework.context.ApplicationContext interface represents the Spring IoC container and is responsible for
instantiating, configuring, and assembling the beans. The container gets its instructions on what objects to
instantiate, configure, and assemble by reading configuration metadata. The configuration metadata is represented in
XML, Java annotations, or Java code. It lets you express the objects that compose your application and the rich
interdependencies between those objects.

> `org.springframework.context.ApplicationContext` 인터페이스는 스프링 `IoC 컨테이너`를 나타내며 `Bean`을 인스턴스화, 구성 및 결합하는 일을 담당합니다. 컨테이너는
> 구성 메타데이터를 읽음으로써 인스턴스화, 구성 및 결합할 객체에 대한 지침을 얻습니다. 구성 메타데이터는 XML, Java 어노테이션 또는 Java 코드로 표현됩니다. 이를 통해 애플리케이션을 구성하는 객체와
> 이러한
> 객체 간의 풍부한 상호 의존성을 표현할 수 있습니다.

<br>

Several implementations of the ApplicationContext interface are supplied with Spring. In stand-alone applications, it is
common to create an instance of ClassPathXmlApplicationContext or FileSystemXmlApplicationContext. While XML has been
the traditional format for defining configuration metadata, you can instruct the container to use Java annotations or
code as the metadata format by providing a small amount of XML configuration to declaratively enable support for these
additional metadata formats.

> `ApplicationContext` 인터페이스의 여러 구현이 스프링과 함께 제공됩니다. 독립형 애플리케이션에서는 ` ClassPathXmlApplicationContext`
> 또는 `FileSystemXmlApplicationContext`의 인스턴스를 생성하는 것이 일반적입니다. XML은 구성 메타데이터를 정의하는 전통적인 형식이었지만, 이러한 추가 메타데이터 형식에 대한 지원을
> 선언하기 위해 소량의 XML 구성을 제공하여 컨테이너에 Java 주석 또는 코드를 메타데이터 형식으로 사용하도록 지시할 수 있습니다.

- 메타데이터가 뭔지 따로 찾아봄
    - 스프링에서 메타데이터는 스프링 설정에서 컨테이너가 관리해야하는 하나 이상의 `bean` 정의로 구성됩니다.
    - XML 기반의 설정 메타데이터는 상위 계층인 `<beans/>` 요소의 안에서 `<bean/>`이라는 요소를 통해 이러한 `bean`들을 설정합니다.
    - 또한 스프링 배치에서는 메타데이터 스키마를 구성하여 작업 중에 사용되는 모든 메타정보들 (작업 시간, 파라미터, 정상수행 여부 등)을 기록하여 작업 중에 사용하거나 모니터링 용도로 사용 할 수 있게
      해줍니다.

<br>

In most application scenarios, explicit user code is not required to instantiate one or more instances of a Spring IoC
container. For example, in a web application scenario, a simple eight (or so) lines of boilerplate web descriptor XML in
the web.xml file of the application typically suffices (see Convenient ApplicationContext Instantiation for Web
Applications). If you use the Spring Tools for Eclipse (an Eclipse-powered development environment), you can easily
create this boilerplate configuration with a few mouse clicks or keystrokes.

> 대부분의 애플리케이션 시나리오에서, 명시적인 사용자 코드는 하나 이상의 스프링 `IoC 컨테이너` 인스턴스를 인스턴스화하는 데 필요하지 않습니다. 예를 들어, 웹 애플리케이션 시나리오에서는 일반적으로
> 애플리케이션의 `web.xml` 파일에 8줄 정도의 간단한 XML로 충분합니다.

<br>

The following diagram shows a high-level view of how Spring works. Your application classes are combined with
configuration metadata so that, after the ApplicationContext is created and initialized, you have a fully configured and
executable system or application.

> 아래의 다이어그램은 스프링의 작동 방식을 보여줍니다. 애플리케이션 클래스는 구성 메타데이터와 결합되어 `ApplicationContext`가 생성 후 초기화되면 완전히 구성되고, 실행 가능한 시스템 또는
> 애플리케이션을 갖게 됩니다.


![](https://docs.spring.io/spring-framework/docs/current/reference/html/images/container-magic.png)

<br>

## Configuration Metadata

As the preceding diagram shows, the Spring IoC container consumes a form of configuration metadata. This configuration
metadata represents how you, as an application developer, tell the Spring container to instantiate, configure, and
assemble the objects in your application.

> "1.2"의 다이어그램처럼, 스프링 `IoC 컨테이너`는 일종의 구성 메타데이터를 사용합니다. 이 구성 메타데이터는 개발자가 애플리케이션의 객체를 인스턴스화, 구성 및 결합하도록 스프링 컨테이너에 지시합니다.

<br>

Configuration metadata is traditionally supplied in a simple and intuitive XML format, which is what most of this
chapter uses to convey key concepts and features of the Spring IoC container.

> 구성 메타데이터는 전통적으로 간단하고 직관적인 XML 형식으로 제공되며, 이 챕터에서는 대부분 이 형식을 사용하여 스프링 `IoC 컨테이너`의 주요 개념과 기능을 전달합니다.

<br>

XML-based metadata is not the only allowed form of configuration metadata. The Spring IoC container itself is totally
decoupled from the format in which this configuration metadata is actually written. These days, many developers choose
Java-based configuration for their Spring applications.

> XML 기반 메타데이터만이 허용되는 구성 메타데이터의 유일한 형식은 아닙니다. 스프링 `IoC 컨테이너` 자체는 이 구성 메타데이터가 실제로 작성되는 형식과 완전히 분리되어 있습니다. 요즘엔, 많은 개발자들이
> 스프링 애플리케이션을 위해 `자바 기반 구성`을 선택합니다.

<br>

For information about using other forms of metadata with the Spring container, see:

- Annotation-based configuration: define beans using annotation-based configuration metadata.
- Java-based configuration: define beans external to your application classes by using Java rather than XML files. To
  use these features, see the @Configuration, @Bean, @Import, and @DependsOn annotations.

> 스프링 컨테이너와 함께 다른 형태의 메타데이터를 사용하는 방법은 아래와 같습니다.
> - 어노테이션 기반 구성: 어노테이션 기반 구성 메타데이터를 사용하여 빈을 정의합니다.
> - 자바 기반 구성: XML 파일이 아닌, 자바를 사용하여 애플리케이셔냐 클래스 외부에 빈을 정의합니다. 이런 기능은 `@Configuration`, `@Bean`, `@Import` 및 `@DependsOn`
    어노테이션이 있습니다.

<br>

Spring configuration consists of at least one and typically more than one bean definition that the container must
manage. XML-based configuration metadata configures these beans as <bean/> elements inside a top-level <beans/> element.
Java configuration typically uses @Bean-annotated methods within a @Configuration class.

> 스프링 구성은 컨테이너가 관리해야 되는 하나 이상의 빈 정의로 구성되며, 일반적으로 하나 이상으로 구성됩니다. XML 기반 구성 메타데이터는 이런 빈을 최상위 `<beans/>` 요소 내부의 `<bean/>`
> 요소로 구성합니다. 자바 구성은 일반적으로 `@Configuration` 클래스 내에서 `@Bean` 주석이 달린 메서드를 사용합니다.

<br>

These bean definitions correspond to the actual objects that make up your application. Typically, you define service
layer objects, persistence layer objects such as repositories or data access objects (DAOs), presentation objects such
as Web controllers, infrastructure objects such as a JPA EntityManagerFactory, JMS queues, and so forth. Typically, one
does not configure fine-grained domain objects in the container, because it is usually the responsibility of
repositories and business logic to create and load domain objects.

> 이러한 빈 정의는 애플리케이션을 구성하는 실제 객체에 해당합니다. 일반적으로 서비스 계층 객체, 레포지토리 또는 DAO(데이터 엑세스 객체) 와 같은 지속성 계층 객체, 웹 컨트롤러와 같은 프레젠테이션 객체,
> JAP EntityManagerFactory, JMS 큐 등과 같은 인프라 객체 등을 정의합니다. 일반적으로 도메인 객체를 만들고 로드하는 것은 레포지토리 및 비즈니스 로직의 책임이므로 일반적으로 컨테이너에서
> 세분화된 도메인 오브젝트를 구성하지 않습니다.

<br>

The following example shows the basic structure of XML-based configuration metadata:

> XML 기반 구성 메타데이터의 기본 구조는 아래와 같습니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="..." class="...">
        <!-- collaborators and configuration for this bean go here -->
        <!-- 이 빈에 대한 공동 작업자 및 구성은 일로 이동 -->
    </bean>

    <bean id="..." class="...">
        <!-- collaborators and configuration for this bean go here -->
        <!-- 이 빈에 대한 공동 작업자 및 구성은 일로 이동 -->
    </bean>

    <!-- more bean definitions go here -->
    <!-- 더 많은 빈 정의는 일로 이동 -->
</beans>
```

1. The id attribute is a string that identifies the individual bean definition.
2. The class attribute defines the type of the bean and uses the fully qualified class name.

> 1. id 속성은 개별 빈 정의를 식별하는 문자열입니다.
> 2. class 속성은 빈의 유형을 정의하여 정규화된 클래스 이름을 사용합니다.

The value of the id attribute can be used to refer to collaborating objects. The XML for referring to collaborating
objects is not shown in this example. See Dependencies for more information.

> id 속성 값은 공동 작업 객체를 참조하는 데 사용할 수 있습니다. 이 예시에서는 공동 작업 객체를 참조하기 위한 XML이 표시되지 않습니다. 자세한 내용은 의존성에 대한 파트를 참고하면 좋을 듯?

<br>

## Instantiating a Container

The location path or paths supplied to an ApplicationContext constructor are resource strings that let the container
load configuration metadata from a variety of external resources, such as the local file system, the Java CLASSPATH, and
so on.

> `ApplicationConext` 생성자에 제공된 위치 경로는 컨테이너가 로컬 파일 시스템, 자바 경로 등와 같은 다양한 외부 리소스에서 구성 메타데이터를 로드할 수 있도록 하는 리소스 문자열입니다.

```java
ApplicationContext context=new ClassPathXmlApplicationContext("services.xml","daos.xml");
```

After you learn about Spring’s IoC container, you may want to know more about Spring’s Resource abstraction (as
described in Resources), which provides a convenient mechanism for reading an InputStream from locations defined in a
URI syntax. In particular, Resource paths are used to construct applications contexts, as described in Application
Contexts and Resource Paths.

> 스프링의 `IoC 컨테이너`에 대해 배운 후에는 URI 구문에 정의된 위치에서 `InputStream`을 읽기 위한 편리한 메커니즘을 제공하는 스프링의 리소스 추상화에 대해 자세히 알고 싶을 수 있습니다. 특히
> 리소스 경로는 애플리케이션 컨텍스트와 리소스 경로에 설명되어 있는 대로 애플리케이션 컨텍스트를 구성하는 데 사용됩니다.

<br>

The following example shows the service layer objects (services.xml) configuration file:

> 아래의 예는 서비스 계층 개체(services.xml) 구성 파일을 보여줍니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

    <!-- services -->

    <bean id="petStore" class="org.springframework.samples.jpetstore.services.PetStoreServiceImpl">
        <property name="accountDao" ref="accountDao"/>
        <property name="itemDao" ref="itemDao"/>
        <!-- additional collaborators and configuration for this bean go here -->
        <!-- 이 빈에 대한 추가 공동 작업자 및 구성은 일로 이동 -->
    </bean>

    <!-- more bean definitions for services go here -->
    <!-- 서비스에 대한 더 많은 빈 정의는 일로 이동 -->

</beans>
```

<br>

The following example shows the data access objects daos.xml file:

> 다음 예는 데이터 액세스 개체인 `daos.xml` 파일을 보여줍니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="accountDao"
          class="org.springframework.samples.jpetstore.dao.jpa.JpaAccountDao">
        <!-- additional collaborators and configuration for this bean go here -->
        <!-- 이 빈에 대한 추가 공동 작업자 및 구성은 일로 이동 -->
    </bean>

    <bean id="itemDao" class="org.springframework.samples.jpetstore.dao.jpa.JpaItemDao">
        <!-- additional collaborators and configuration for this bean go here -->
    </bean>

    <!-- more bean definitions for data access objects go here -->
    <!-- 서비스에 대한 더 많은 빈 정의는 일로 이동 -->

</beans>
```

In the preceding example, the service layer consists of the PetStoreServiceImpl class and two data access objects of the
types JpaAccountDao and JpaItemDao (based on the JPA Object-Relational Mapping standard). The property name element
refers to the name of the JavaBean property, and the ref element refers to the name of another bean definition. This
linkage between id and ref elements expresses the dependency between collaborating objects. For details of configuring
an object’s dependencies, see Dependencies.

> 앞의 예제에서, 서비스 계층은 `PetStoreServiceImple` 클래스와 JPA 객체-관계형 매핑 표준에 기반한 `JpaAccountDao`와 `JpaItemDao` 유형의 데이터 액세스 객체 두 개로
> 구성됩니다. 속성 이름 요소는 자바 빈 속성의 이름을 참조하고, 참조 요소는 다른 빈 정의의 이름을 참조합니다. id 요소와 ref 요소 간의 이러한 연결은 공동 작업 객체 간의 의존성을 나타냅니다.

<br>

### Composing XML-based Configuration Metadata

It can be useful to have bean definitions span multiple XML files. Often, each individual XML configuration file
represents a logical layer or module in your architecture.

> 빈의 정의가 여러 XML 파일에 있으면 유용할 수 있습니다. 종종 각각의 XML 구성 파일은 아키텍처에서 논리적 계층 또는 모듈을 나타냅니다.

<br>

You can use the application context constructor to load bean definitions from all these XML fragments. This constructor
takes multiple Resource locations, as was shown in the previous section. Alternatively, use one or more occurrences of
the <import/> element to load bean definitions from another file or files. The following example shows how to do so:

> 애플리케이션 컨텍스트 생성자를 이용하여 이러한 모든 XML 조각들에서 빈의 정의를 불러올 수 있습니다. 이 생성자는 이전 섹션에서 설명한 것처럼 여러 리소스 위치를 사용합니다. 또는 하나
> 이상의 `</import/>` 요소를 사용하여 다른 파일에서 빈 정의를 불러올 수 있습니다. 아래의 예제에서는 이를 수행하는 방법을 나타냅니다.

```xml

<beans>
    <import resource="services.xml"/>
    <import resource="resources/messageSource.xml"/>
    <import resource="/resources/themeSource.xml"/>

    <bean id="bean1" class="..."/>
    <bean id="bean2" class="..."/>
</beans>
```

> 앞의 예제에서, 외부 빈 정의는 `services.xml`, `messageSource.xml` 및 `themeSource.xml`의 세 파일에서 불러옵니다. 모든 위치 경로는 임포트를 수행하는 정의 파일에
> 상대적이므로, `services.xml`은 임포트를 수행하는 파일과 동일한 디렉토리 또는 클래스 경로 위치에 있어야 하며, `messageSource.xml`과 `themeSource.xml`은 임포트하는 파일
> 아래의 리소스 위치에 있어야 합니다. 위처럼 먼저 나오는 슬래시는 무시됩니다. 그러나 이러한 경로들은 상대 경로이므로 슬래시를 아예 사용하지 않는 것이 좋습니다. 최상의 레벨인 `<beans/>` 요소를 포함하여
> 가져오는 파일의 내용은 스프링 스키마에 따라 "꼭(must)" 유효한 XML 빈 정의여야 합니다.

<br>

It is possible, but not recommended, to reference files in parent directories using a relative "../" path. Doing so
creates a dependency on a file that is outside the current application. In particular, this reference is not recommended
for classpath: URLs (for example, classpath:../services.xml), where the runtime resolution process chooses the “nearest”
classpath root and then looks into its parent directory. Classpath configuration changes may lead to the choice of a
different, incorrect directory.

> "../" 상대 경로를 사용하여 상위 디렉토리의 파일을 참조하는 것은 가능하지만 권장되지는 않습니다. (근데 나는 이거 많이 썼었네..) 이렇게 하면 현재 애플리케이션 외부에 있는 파일에 대한 의존성이
> 생성됩니다. 특히, `클래스 경로`에는 이 참조를 사용하지 않는 것이 좋습니다. (`classpath:` URLs (예를 들어, `classpath:../services.xml`)), 그리고 런타임 확인
> 프로세스에서 "가장 가까운" 클래스 경로 루트를 선택한 다음, 해당 상위 디렉토리를 조사하므로 이 참조는 권장되지 않습니다. 클래스 경로 구성을 변경한다면 아마도 다른 잘못된 디렉터리가 선택될 가능성이
> 있습니다. (
> 이것도 카페 미션에서 똑같이 겪어봄)

<br>

You can always use fully qualified resource locations instead of relative paths: for example, file:C:
/config/services.xml or classpath:/config/services.xml. However, be aware that you are coupling your application’s
configuration to specific absolute locations. It is generally preferable to keep an indirection for such absolute
locations — for example, through "${…​}" placeholders that are resolved against JVM system properties at runtime.

> 상대 경로 대신에 정규화된 리소스 위치를 사용할 수 있습니다. (예를 들어, `file:C:/config/services.xml` 또는 `classpath:/config/services.xml`). 그러나,
> 애플리케이션의 구성을 특정 절대 위치에 연결한다는 점에 유의하세요. 일반적으로 이러한 절대 위치는 런타임 JVM 시스템 속성에 확인되는 "${...}" 플레이스홀더를 통해 방향성을 유지하는 것이 바람직합니다.

<br>

The namespace itself provides the import directive feature. Further configuration features beyond plain bean definitions
are available in a selection of XML namespaces provided by Spring — for example, the context and util namespaces.

> 네임스페이스 자체는 `import` 지시어 기능을 제공합니다. 일반 빈 정의 이외의 추가 구성 기능은 스프링에서 제공하는 다양한 XML 네임스페이스(예를 들어, `context`와 `util` 네임스페이스에서
> 사용할 수 있습니다.)

<br>

### 1.2.2. The Groovy Bean Definition DSL

As a further example for externalized configuration metadata, bean definitions can also be expressed in Spring’s Groovy
Bean Definition DSL, as known from the Grails framework. Typically, such configuration live in a ".groovy" file with the
structure shown in the following example:

> 외부화된 구성 메타데이터에 대한 또 다른 예로, 빈 정의는 `Grails` 프레임워크에서 알려진 것처럼 스프링의 `Groovy Bean Definition DSL`로 표현할 수도 있습니다. 일반적으로 이런 구성은
> 아래와 같은 구조의 `.groovy` 파일에 저장됩니다.

```groovy
beans {
    dataSource(BasicDataSource) {
        driverClassName = "org.hsqldb.jdbcDriver"
        url = "jdbc:hsqldb:mem:grailsDB"
        username = "sa"
        password = ""
        settings = [mynew: "setting"]
    }
    sessionFactory(SessionFactory) {
        dataSource = dataSource
    }
    myService(MyService) {
        nestedBean = { AnotherBean bean ->
            dataSource = dataSource
        }
    }
}
```

This configuration style is largely equivalent to XML bean definitions and even supports Spring’s XML configuration
namespaces. It also allows for importing XML bean definition files through an importBeans directive.

> 이 구성 스타일은 XML 빈 정의와 거의 동일하고 스프링의 XML 구성 네임스페이스도 지원합니다. 또한 `importBeans` 지시문을 통해 XML 빈 정의 파일을 가져올 수 있습니다.

<br>

## 1.2.3. Using the Container

The ApplicationContext is the interface for an advanced factory capable of maintaining a registry of different beans and
their dependencies. By using the method T getBean(String name, Class<T> requiredType), you can retrieve instances of
your beans.

> `ApplicationContext`는 다양한 빈과 그 의존성의 레지스트리를 유지할 수 있는 고급 팩토리를 위한 인터페이스입니다. 메서드 `T getBean(String name, Class<T>
> requiredType)을 이용하여 빈의 인스턴스를 검색할 수 있습니다.

<br>

The ApplicationContext lets you read bean definitions and access them, as the following example shows:

> 아래의 예제에서 볼 수 있듯이, `ApplicationContext`를 사용하면 빈 정의를 읽고 액세스할 수 있습니다.

```java
// create and configure beans
// 빈을 생성하고 구성합니다
ApplicationContext context = new ClassPathXmlApplicationContext("services.xml", "daos.xml");

// retrieve configured instance
// 구성된 인스턴스를 검색합니다
PetStoreService service = context.getBean("petStore", PetStoreService.class);

// use configured instance
// 구성된 인스턴스를 사용합니다
List<String> userList = service.getUsernameList();
```

With Groovy configuration, bootstrapping looks very similar. It has a different context implementation class which is
Groovy-aware (but also understands XML bean definitions). The following example shows Groovy configuration:

> `Groovy` 구성을 사용하면, 부트스트랩이 매우 비슷해 보입니다. 여기에는 다른 컨텍스트 구현 클래스가 있는데, 이 클래스는 `Groovy`를 인식하지만, XML 빈 정의도 이해합니다. 아래의
> 예제는 `Groovy` 구성을 보여줍니다.

```java
ApplicationContext context = new GenericGroovyApplicationContext("services.groovy", "daos.groovy");
```

The most flexible variant is GenericApplicationContext in combination with reader delegates — for example, with
XmlBeanDefinitionReader for XML files, as the following example shows:


> 가장 유연한 변형은 아래의 예제에서 볼 수 있듯이, XML 파일을 위한 `XmlBeanDefinitionReader`와 같이 독자의 대표(reader delegates)와 함께
> 사용하는 `GenericApplicationContext`
> 입니다.

```java
GenericApplicationContext context = new GenericApplicationContext();
new XmlBeanDefinitionReader(context).loadBeanDefinitions("services.xml", "daos.xml");
context.refresh();
```

You can also use the GroovyBeanDefinitionReader for Groovy files, as the following example shows:

> 또한 아래 예제에서 볼 수 있듯이, `Groovy` 파일에 `GroovyBeanDefinitionReader`를 사용할 수 있습니다.

```java
GenericApplicationContext context = new GenericApplicationContext();
new GroovyBeanDefinitionReader(context).loadBeanDefinitions("services.groovy", "daos.groovy");
context.refresh();
```

You can mix and match such reader delegates on the same ApplicationContext, reading bean definitions from diverse
configuration sources.

> 이러한 독자의 대표(reader delegates)를 동일한 애플리케이션 컨텍스트에서 섞고 매치하여 다양한 구성 소스의 빈 정의를 읽을 수 있습니다.

<br>

You can then use getBean to retrieve instances of your beans. The ApplicationContext interface has a few other methods
for retrieving beans, but, ideally, your application code should never use them. Indeed, your application code should
have no calls to the getBean() method at all and thus have no dependency on Spring APIs at all. For example, Spring’s
integration with web frameworks provides dependency injection for various web framework components such as controllers
and JSF-managed beans, letting you declare a dependency on a specific bean through metadata (such as an autowiring
annotation).

> 그런 다음 `getBean`을 이용하여 빈의 인스턴스를 검색할 수 있습니다. `ApplicationContext` 인터페이스에는 빈을 검색하는 몇 가지 다른 메서드가 있지만, 이상적으로는 애플리케이션 코드에서
> 이러한 메서드를 사용하지 말아야 합니다. 실제로 애플리케이션 코드에는 `getBean()` 메서드에 대한 호출이 전혀 없어야 합니다. 즉, 스프링 API에 대한 의존성이 전혀 없어야 합니다. 예를 들어, 스프링과
> 웹 프레임워크의 통합은 컨트롤러 및 JSF 관리 빈과 같은 다양한 웹 프레임워크 구성 요소에 대한 의존성 주입을 제공하므로 메타데이터(예: 오토와이어 주석)를 통해 특정 빈에 대한 의존성을 선언할 수 있습니다.

<br>

# Reference

- [Spring 공식 문서](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#spring-core)