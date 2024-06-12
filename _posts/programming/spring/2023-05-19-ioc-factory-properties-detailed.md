---
title: "[Spring] IoC 컨테이너 공식문서 번역 (Dependencies and Configuration in Detail)"
excerpt: "의존성 및 구성 상세 정보"

categories:
  - Spring
tags:
  - [ioc]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-05-19
last_modified_at: 2023-05-26
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

# Dependencies and Configuration in Detail

As mentioned in the previous section, you can define bean properties and constructor arguments as references to other
managed beans (collaborators) or as values defined inline. Spring’s XML-based configuration metadata supports
sub-element types within its <property/> and <constructor-arg/> elements for this purpose.

> 이전 섹션에서 언급했듯이, 빈 프로퍼티와 생성자 인자를 다른 관리되는 빈(콜라보레이터)에 대한 참조로 정의하거나 인라인으로 정의된 값을 정의할 수 있습니다. 스프링의 XML 기반 구성 메타데이터는 이러한 목적을
> 위해 `<property/>` 및 `<constructor-arg/>` 요소 내에서 하위 요소 유형을 지원합니다.

<br>

## Straight Values (Primitives, Strings, and so on)

The value attribute of the <property/> element specifies a property or constructor argument as a human-readable string
representation. Spring’s conversion service is used to convert these values from a String to the actual type of the
property or argument. The following example shows various values being set:

> `<property/>` 요소의 값 속성은 프로퍼티 또는 생성자 인자를 사람이 읽을 수 있는 문자열 표현으로 지정합니다. 스프링의 변환 서비스는 이러한 값을 `String`에서 프로퍼티 또는 인자의 실제 유형으로
> 반환되는 데 사용됩니다. 아래의 예제는 다양한 값이 설정되는 것을 보여줍니다:

```xml
<bean id="myDataSource" class="org.apache.commons.dbcp.BasicDataSource" destroy-method="close">
	<!-- results in a setDriverClassName(String) call -->
	<property name="driverClassName" value="com.mysql.jdbc.Driver"/>
	<property name="url" value="jdbc:mysql://localhost:3306/mydb"/>
	<property name="username" value="root"/>
	<property name="password" value="misterkaoli"/>
</bean>
```

<br>

The following example uses the p-namespace for even more succinct XML configuration:

> 아래의 예제에서는 더욱 간결한 XML 구성을 위해 `p-namesapce`를 사용합니다:

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:p="http://www.springframework.org/schema/p"
	xsi:schemaLocation="http://www.springframework.org/schema/beans
	https://www.springframework.org/schema/beans/spring-beans.xsd">

	<bean id="myDataSource" class="org.apache.commons.dbcp.BasicDataSource"
		destroy-method="close"
		p:driverClassName="com.mysql.jdbc.Driver"
		p:url="jdbc:mysql://localhost:3306/mydb"
		p:username="root"
		p:password="misterkaoli"/>

</beans>
```

The preceding XML is more succinct. However, typos are discovered at runtime rather than design time, unless you use an
IDE (such as IntelliJ IDEA or the Spring Tools for Eclipse) that supports automatic property completion when you create
bean definitions. Such IDE assistance is highly recommended.

> 앞의 XML이 더 간결합니다. 그러나 빈 정의를 생성할 때 자동 속성 완성을 지원하는 IDE를 사용하지 않는 한 오타가 설계 시점이 아닌, 런타임에 발견됩니다. 이러한 IDE 지원을 적극 권장합니다. 알겠습니다!

<br>

You can also configure a java.util.Properties instance, as follows:

> 다음과 같이 `java.util.Preperties` 인스턴스를 구성할 수도 있습니다:

```xml
<bean id="mappings"
	class="org.springframework.context.support.PropertySourcesPlaceholderConfigurer">

	<!-- typed as a java.util.Properties -->
	<property name="properties">
		<value>
			jdbc.driver.className=com.mysql.jdbc.Driver
			jdbc.url=jdbc:mysql://localhost:3306/mydb
		</value>
	</property>
</bean>
```

The Spring container converts the text inside the <value/> element into a java.util.Properties instance by using the
JavaBeans PropertyEditor mechanism. This is a nice shortcut, and is one of a few places where the Spring team do favor
the use of the nested <value/> element over the value attribute style.

> 스프링 컨테이너는 JavaBeans `PrepertiyEditor` 메커니즘을 사용하여 `<values>` 요소 내부의 텍스트를 `java.util.Properties` 인스턴스로 변환합니다. 이것은 좋은
> 지름길이며, 스프링 팀에서 값 속성 스타일보다 중첩된 `<value/>` 요소의 사용을 선호하는 몇 안 되는 곳 중 하나입니다.

<br>

### The idref element

The idref element is simply an error-proof way to pass the id (a string value - not a reference) of another bean in the
container to a <constructor-arg/> or <property/> element. The following example shows how to use it:

> `idref` 요소는 컨테이너에 있는 다른 빈의 `id`(참조가 아닌 문자열 값)를 `<constructor-arg/>` 또는 `<property/>` 요소로 전달하는 오류 방지 방식입니다. 아래의 예제는 그
> 사용 방법을 보여줍니다:

```xml
<bean id="theTargetBean" class="..."/>

<bean id="theClientBean" class="...">
	<property name="targetName">
		<idref bean="theTargetBean"/>
	</property>
</bean>
```

The preceding bean definition snippet is exactly equivalent (at runtime) to the following snippet:

> 위의 빈 정의 코드는 (실행 시) 아래의 코드와 정확히 동일합니다:

```xml
<bean id="theTargetBean" class="..." />

<bean id="client" class="...">
	<property name="targetName" value="theTargetBean"/>
</bean>
```

The first form is preferable to the second, because using the idref tag lets the container validate at deployment time
that the referenced, named bean actually exists. In the second variation, no validation is performed on the value that
is passed to the targetName property of the client bean. Typos are only discovered (with most likely fatal results) when
the client bean is actually instantiated. If the client bean is a prototype bean, this typo and the resulting exception
may only be discovered long after the container is deployed.

> 첫 번째 형태가 두 번째 형태보다 더 선호되는데, 이는 `idref` 태그를 사용하면 컨테이너가 배포 시점에 참조된 빈이 실제로 존재하는지 확인할 수 있기 때문입니다. 두 번째 변형에서는 `client`
> 빈의 `targetName` 속성에 전달되는 값에 대한 유효성 검사가 수행되지 않습니다. 오타는 `client` 빈이 실제로 인스턴스화될 때만 발견됩니다(대부분 치명적인 결과를 초래할 수 있음). 클라이언트 빈이
> 프로토타입 빈일 경우, 이 오타와 그에 따른 예외는 컨테이너가 배포된 후 한참 후에야 발견될 수 있습니다.

<br>

The local attribute on the idref element is no longer supported in the 4.0 beans XSD, since it does not provide value
over a regular bean reference any more. Change your existing idref local references to idref bean when upgrading to the
4.0 schema.
{: .notice--primary}

> `idref` 요소의 `local` 속성은 더 이상 일반 빈 참조에 대한 값을 제공하지 않으므로, 4.0 빈 XSD에서 더 이상 지원되지 않습니다. 4.0 스키마로 업그레이드할 때, 기존 `idref local`
> 참조를 `idref bean` 빈으로 변경하세요.

<br>

A common place (at least in versions earlier than Spring 2.0) where the <idref/> element brings value is in the
configuration of AOP interceptors in a ProxyFactoryBean bean definition. Using <idref/> elements when you specify the
interceptor names prevents you from misspelling an interceptor ID.

> `<idref/>` 요소가 가치를 제공하는 일반적인 위치(적어도 스프링 2.0 이전 버전)는 `ProxyFactoryBean` 빈 정의의 AOP 인터셉터 구성입니다. 인터셉터 이름을 지정할
> 때, `<idref/>` 요소를 사용하면 인터셉터 ID의 철자를 잘못 입력하는 것을 방지할 수 있습니다.

<br>

## References to Other Beans (Collaborators)

The ref element is the final element inside a <constructor-arg/> or <property/> definition element. Here, you set the
value of the specified property of a bean to be a reference to another bean (a collaborator) managed by the container.
The referenced bean is a dependency of the bean whose property is to be set, and it is initialized on demand as needed
before the property is set. (If the collaborator is a singleton bean, it may already be initialized by the container.)
All references are ultimately a reference to another object. Scoping and validation depend on whether you specify the ID
or name of the other object through the bean or parent attribute.

> `ref` 요소는 `<constructor-arg/>` 또는 `<property/>` 정의 요소 내부의 마지막 요소입니다. 여기에서는, 빈의 지정된 속성 값을 컨테이너에서 관리하는 다른 빈(콜라보레이터)에 대한
> 참조로 설정합니다. 참조된 빈은 속성을 설정하려는 빈의 의존성이며, 속성이 설정되기 전에 필요에 따라 초기화됩니다. (콜라보레이터가 싱글톤 빈인 경우, 컨테이너에 의해 이미 초기화되었을 수 있습니다.) 모든
> 참조는
> 궁극적으로 다른 객체에 대한 참조입니다. 범위 지정 및 유효성 검사는 `bean` 또는 `parent` 속성을 통해 다른 객체의 ID 또는 이름을 지정하는지의 여부에 따라 달라집니다.

Specifying the target bean through the bean attribute of the <ref/> tag is the most general form and allows creation of
a reference to any bean in the same container or parent container, regardless of whether it is in the same XML file. The
value of the bean attribute may be the same as the id attribute of the target bean or be the same as one of the values
in the name attribute of the target bean. The following example shows how to use a ref element:

> `<ref/>` 태그의 빈 속성을 통해 대상 빈을 지정하는 것이 가장 일반적인 형식이며, 동일한 XML 파일에 있는지의 여부에 관계없이 동일한 컨테이너 또는 상위 컨테이너에 있는 모든 빈에 대한 참조를 생성할 수
> 있습니다. 빈 속성의 값은 대상 빈의 `id` 속성과 동일하거나 대상 빈의 `name` 속성에 있는 값 중 하나와 동일할 수 있습니다. 아래의 예는 `ref` 요소를 사용하는 방법을 보여줍니다:

```xml
<ref bean="someBean"/>
```

<br>

Specifying the target bean through the parent attribute creates a reference to a bean that is in a parent container of
the current container. The value of the parent attribute may be the same as either the id attribute of the target bean
or one of the values in the name attribute of the target bean. The target bean must be in a parent container of the
current one. You should use this bean reference variant mainly when you have a hierarchy of containers and you want to
wrap an existing bean in a parent container with a proxy that has the same name as the parent bean. The following pair
of listings shows how to use the parent attribute:

> `parent` 속성을 통해 대상 빈을 지정하면, 현재 컨테이너의 상위 컨테이너에 있는 빈에 대한 참조가 생성됩니다. `parent` 속성의 값은 대상 빈의 id 속성 또는 대상 빈의 `name` 속성에 있는 값
> 중 하나와 동일할 수 있습니다. 대상 빈은 현재 컨테이너의 상위 컨테이너에 있어야 합니다. 이 빈의 참조 변형은 주로 컨테이너 계층 구조가 있고 부모 빈과 이름이 같은 프록시를 사용하여 기존 빈을 부모 컨테이너에
> 래핑하려는 경우에 사용해야 합니다. 아래의 목록은 `parent` 속성을 사용하는 방법을 보여줍니다:

```xml
<!-- in the parent context -->
<bean id="accountService" class="com.something.SimpleAccountService">
	<!-- insert dependencies as required here -->
</bean>
```

```xml
<!-- in the child (descendant) context -->
<bean id="accountService" <!-- bean name is the same as the parent bean -->
	class="org.springframework.aop.framework.ProxyFactoryBean">
	<property name="target">
		<ref parent="accountService"/> <!-- notice how we refer to the parent bean -->
	</property>
	<!-- insert other configuration and dependencies as required here -->
</bean>
```

<br>

The local attribute on the ref element is no longer supported in the 4.0 beans XSD, since it does not provide value over
a regular bean reference any more. Change your existing ref local references to ref bean when upgrading to the 4.0
schema.
{: .notice--primary}

> `ref` 요소의 `local` 속성은 더 이상 일반 `bean` 참조에 대한 값을 제공하지 않으므로, 4.0 bean XSD에서 더 이상 지원되지 않습니다. 4.0 스키마로 업그레이드할 때,
> 기존 `ref local` 참조를 `ref bean`으로 변경하세요. 

<br>

## Inner Beans

A <bean/> element inside the <property/> or <constructor-arg/> elements defines an inner bean, as the following example
shows:

> 아래의 예제에서 볼 수 있듯이, `<property/>` 또는 `<constructor-arg/>` 요소 내부의 `<bean/>` 요소는 내부 빈을 정의합니다:

```xml
<bean id="outer" class="...">
	<!-- instead of using a reference to a target bean, simply define the target bean inline -->
	<!-- 대상 빈에 대한 참조를 사용하는 대신, 대상 빈을 한줄로 정의하기만 하면 됨 -->
	<property name="target">
		<bean class="com.example.Person"> <!-- this is the inner bean -->
			<property name="name" value="Fiona Apple"/>
			<property name="age" value="25"/>
		</bean>
	</property>
</bean>
```

An inner bean definition does not require a defined ID or name. If specified, the container does not use such a value as
an identifier. The container also ignores the scope flag on creation, because inner beans are always anonymous and are
always created with the outer bean. It is not possible to access inner beans independently or to inject them into
collaborating beans other than into the enclosing bean.

> 내부 빈 정의에는 정의된 ID나 이름이 필요하지 않습니다. 지정된 경우, 컨테이너는 이러한 값을 식별자로 사용하지 않습니다. 또한 내부 빈은 항상 익명이며, 항상 외부 빈과 함께 생성되므로 컨테이너는 생성
> 시 `scope` 플래그를 무시합니다. 내부 빈에 독립적으로 접근하거나 둘러싸는 빈이 아닌, 다른 협업 빈에 내부 빈을 삽입할 수 없습니다.

<br>

As a corner case, it is possible to receive destruction callbacks from a custom scope — for example, for a
request-scoped inner bean contained within a singleton bean. The creation of the inner bean instance is tied to its
containing bean, but destruction callbacks let it participate in the request scope’s lifecycle. This is not a common
scenario. Inner beans typically simply share their containing bean’s scope.

> 코너 케이스로서, 예를 들어 싱글톤 빈 내에 포함된 요청 범위 내부 빈에 대해 사용자 정의 범위에서 소멸 콜백을 수신할 수 있습니다. 내부 빈 인스턴스의 생성은 포함된 빈에 연결되지만, 소멸 콜백을 통해 요청
> 범위의 라이프사이클에 참여할 수 있습니다. 이것은 일반적인 시나리오는 아닙니다. 내부 빈은 일반적으로 단순하게 포함하는 빈의 범위를 공유합니다.

<br>

# Collections

The <list/>, <set/>, <map/>, and <props/> elements set the properties and arguments of the Java Collection types List,
Set, Map, and Properties, respectively. The following example shows how to use them:

> `<list/>`, `<set/>`, `<map/>` 및 `<props/>` 요소는 각각 자바 `Collection` 유형 `List`, `Set`, `Map` 및 `Preperties`의 속성과 인수를
> 설정합니다. 아래의 예제는 이 요소들의 사용 방법을 보여 줍니다:

```xml
<bean id="moreComplexObject" class="example.ComplexObject">
    <!-- OO의 호출 결과 -->
    
	<!-- results in a setAdminEmails(java.util.Properties) call -->
	<property name="adminEmails">
		<props>
			<prop key="administrator">administrator@example.org</prop>
			<prop key="support">support@example.org</prop>
			<prop key="development">development@example.org</prop>
		</props>
	</property>
	<!-- results in a setSomeList(java.util.List) call -->
	<property name="someList">
		<list>
			<value>a list element followed by a reference</value>
			<ref bean="myDataSource" />
		</list>
	</property>
	<!-- results in a setSomeMap(java.util.Map) call -->
	<property name="someMap">
		<map>
			<entry key="an entry" value="just some string"/>
			<entry key="a ref" value-ref="myDataSource"/>
		</map>
	</property>
	<!-- results in a setSomeSet(java.util.Set) call -->
	<property name="someSet">
		<set>
			<value>just some string</value>
			<ref bean="myDataSource" />
		</set>
	</property>
</bean>
```

<br>

The value of a map key or value, or a set value, can also be any of the following elements:

> 맵의 `key` 또는 `value`의 값 또는 `set`의 값은 아래의 요소 중 하나라도 될 수 있습니다:

```xml
bean | ref | idref | list | set | map | props | value | null
```

## Collection Merging

The Spring container also supports merging collections. An application developer can define a
parent <list/>, <map/>, <set/> or <props/> element and have child <list/>, <map/>, <set/> or <props/> elements inherit
and override values from the parent collection. That is, the child collection’s values are the result of merging the
elements of the parent and child collections, with the child’s collection elements overriding values specified in the
parent collection.

> 스프링 컨테이너는 컬렉션 병합도 지원합니다. 애플리케이션 개발자는 부모 `<list/>`, `<map/>`, `<set/>` 또는 `<props/>` 요소를 정의하고
> 자식 `<list/>`, `<map/>`, `<set/>` 또는 `<props/>` 요소가 부모 컬렉션의 값을 상속 및 재정의하도록 할 수 있습니다. 즉, 자식 컬렉션의 값은 부모 컬렉션과 자식 컬렉션의 요소를
> 병합한 결과이며, 자식 컬렉션의 컬렉션 요소가 부모 컬렉션에 지정된 값을 재정의합니다.

<br>

This section on merging discusses the parent-child bean mechanism. Readers unfamiliar with parent and child bean
definitions may wish to read the relevant section before continuing.

> 병합에 대한 이 섹션에서는 부모-자식 빈 메커니즘에 대해 설명합니다. 부모 및 자식 빈 정의에 익숙하지 않은 우리는 계속하기 전에 관련 섹션을 읽어 보란다.

<br>

The following example demonstrates collection merging:

> 아래의 예는 컬렉션 병합을 보여줍니다:

```xml
<beans>
	<bean id="parent" abstract="true" class="example.ComplexObject">
		<property name="adminEmails">
			<props>
				<prop key="administrator">administrator@example.com</prop>
				<prop key="support">support@example.com</prop>
			</props>
		</property>
	</bean>
	<bean id="child" parent="parent">
		<property name="adminEmails">
			<!-- the merge is specified on the child collection definition -->
			<!-- 병합은 자식 컬렉션 정의에 지정됩니다 -->
			<props merge="true">
				<prop key="sales">sales@example.com</prop>
				<prop key="support">support@example.co.uk</prop>
			</props>
		</property>
	</bean>
<beans>
```

<br>

Notice the use of the merge=true attribute on the <props/> element of the adminEmails property of the child bean
definition. When the child bean is resolved and instantiated by the container, the resulting instance has an adminEmails
Properties collection that contains the result of merging the child’s adminEmails collection with the parent’s
adminEmails collection. The following listing shows the result:

> 자식 빈 정의의 `adminEmails` 속성의 `<props/>` 요소에 `merge=true` 속성이 사용된 것을 주목하세요. `child` 빈이 컨테이너에 의해 확인되고 인스턴스화되면, 결과
> 인스턴스에는 `child`의 `adminEmails` 컬렉션을 부모의 `adminEmails` 컬렉션과 병합한 결과가 포함된 `adminEmails` `Properties` 컬렉션을 가집니다. 아래의 목록은
> 결과를
> 보여줍니다:

<br>

```
administrator=administrator@example.com
sales=sales@example.com
support=support@example.co.uk
```

The child Properties collection’s value set inherits all property elements from the parent <props/>, and the child’s
value for the support value overrides the value in the parent collection.

> 자식 `Preperties` 컬렉션의 값 집합은 상위 `<preps/>`에서 모든 속성 요소를 상속하며, `support` 값에 대한 하위의 값은 부모 컬렉션의 값을 재정의합니다.

<br>

This merging behavior applies similarly to the <list/>, <map/>, and <set/> collection types. In the specific case of
the <list/> element, the semantics associated with the List collection type (that is, the notion of an ordered
collection of values) is maintained. The parent’s values precede all of the child list’s values. In the case of the Map,
Set, and Properties collection types, no ordering exists. Hence, no ordering semantics are in effect for the collection
types that underlie the associated Map, Set, and Properties implementation types that the container uses internally.

> 이 병합 동작은 `<list/>`, `<map/>`, `<set/>` 컬렉션 유형에도 유사하게 적용됩니다. `<list/>` 요소의 특정 케이스에는 `List` 컬렉션 유형과 관련된 의미론(즉,
> 값의 `orderd` 컬렉션 개념인 듯?)이 유지됩니다. 부모 목록의 값은 모든 자식 목록의 값보다 앞에 위치합니다. `Map`, `Set` 그리고 `Preperties` 컬렉션 유형의 경우 순서가 존재하지
> 않습니다. 따라서 컨테이너가 내부적으로 사용하는 관련 `Map`, `Set` 및 `Preperties` 구현 유형의 기반이 되는 컬렉션 유형에는 순서 지정 의미론(semantics)이 적용되지 않습니다.

<br>

## Limitations of Collection Merging

You cannot merge different collection types (such as a Map and a List). If you do attempt to do so, an appropriate
Exception is thrown. The merge attribute must be specified on the lower, inherited, child definition. Specifying the
merge attribute on a parent collection definition is redundant and does not result in the desired merging.

> 서로 다른 컬렉션 유형(예: `Map`과 `List`)은 병합할 수 없습니다. 병합을 시도하면, 적절한 `Exception`이 발생합니다. `merge` 속성은 상속된 자식 정의에 지정해야 합니다. 부모 컬렉션
> 정의에 병합 속성을 지정하는 것은 중복되며, 원하는 병합이 이루어지지 않습니다.

<br>

## Strongly-typed collection

Thanks to Java’s support for generic types, you can use strongly typed collections. That is, it is possible to declare a
Collection type such that it can only contain (for example) String elements. If you use Spring to dependency-inject a
strongly-typed Collection into a bean, you can take advantage of Spring’s type-conversion support such that the elements
of your strongly-typed Collection instances are converted to the appropriate type prior to being added to the
Collection. The following Java class and bean definition show how to do so:

> 자바의 일반 유형의 지원 덕분에, 강력하게 유형화된 컬렉션을 사용할 수 있습니다. 즉, (예를 들어) `String` 요소만 포함할 수 있도록 `Collection` 유형을 선언할 수 있습니다. 스프링을 사용하여
> 강력하게 유형화된 `Collection`을 빈에 의존적으로 주입하는 경우, 강력하게 유형화된 `Collection` 인스턴스 요소가 `Collection`에 추가되기 전에 적절한 유형으로 반환되도록 스프링의 유형
> 변환 지원을 활용할 수 있습니다. 아래의 자바 클래스와 빈 정의는 이를 수행하는 방법을 보여줍니다:

```java
public class SomeClass {

	private Map<String, Float> accounts;

	public void setAccounts(Map<String, Float> accounts) {
		this.accounts = accounts;
	}
}
```

```xml
<beans>
	<bean id="something" class="x.y.SomeClass">
		<property name="accounts">
			<map>
				<entry key="one" value="9.99"/>
				<entry key="two" value="2.75"/>
				<entry key="six" value="3.99"/>
			</map>
		</property>
	</bean>
</beans>
```

When the accounts property of the something bean is prepared for injection, the generics information about the element
type of the strongly-typed Map<String, Float> is available by reflection. Thus, Spring’s type conversion infrastructure
recognizes the various value elements as being of type Float, and the string values (9.99, 2.75, and 3.99) are converted
into an actual Float type.

> `something` 빈의 `accounts` 속성이 주입을 위해 준비되면, 강력하게 유형화된 `Map<String, Float>`의 요소 유형에 대한 제네릭 정보를 반영하여 사용할 수 있습니다. 따라서 스프링의
> 유형 변환 인프라는 다양한 값 요소를 `Float` 유형으로 인식하고, 문자열 값(9.99, 2.75 및 3.99)을 실제 `Float` 유형으로 반환합니다.

<br>

# Null and Empty String Values

Spring treats empty arguments for properties and the like as empty Strings. The following XML-based configuration
metadata snippet sets the email property to the empty String value ("").

> 스프링은 속성 등에 대한 빈 인수를 빈 `String`으로 취급합니다. 아래의 XML 기반 구성 메타데이터 스니펫은 `email` 속성을 빈 `String` 값("")으로 설정합니다.

```xml
<bean class="ExampleBean">
	<property name="email" value=""/>
</bean>
```

The preceding example is equivalent to the following Java code:

> 위의 예는 아래의 자바 코드와 동일합니다.

```java
exampleBean.setEmail("");
```

<br>

The <null/> element handles null values. The following listing shows an example:

> `<null/>` 요소는 `null` 값을 처리합니다. 아래의 목록은 그 예시를 보여줍니다:

```xml
<bean class="ExampleBean">
	<property name="email">
		<null/>
	</property>
</bean>
```

The preceding configuration is equivalent to the following Java code:

> 위의 구성은 아래의 자바 코드와 동일합니다.

```java
exampleBean.setEmail(null);
```

<br>

# XML Shortcut with the p-namespace

The p-namespace lets you use the bean element’s attributes (instead of nested <property/> elements) to describe your
property values collaborating beans, or both.

> p-네임스페이스를 사용하면 중첩된 `<property/>` 요소 대신 `bean` 요소의 속성을 사용하여 속성 값을 공동 작업(콜라보)하는 빈 또는 둘 다를 설명할 수 있습니다.

<br>

Spring supports extensible configuration formats with namespaces, which are based on an XML Schema definition. The beans
configuration format discussed in this chapter is defined in an XML Schema document. However, the p-namespace is not
defined in an XSD file and exists only in the core of Spring.

> 스프링은 XML 스키마 정의를 기반으로 하는 네임스페이스가 있는 확장 가능한 구성 형식을 지원합니다. 이 챕터에서 설명하는 `beans` 구성 형식은 XML 스키마 문서에 정의되어 있습니다. 그러나
> p-네임스페이스는 XSD 파일에 정의되어 있지 않으며, 스프링의 코어에만 존재합니다.

<br>

The following example shows two XML snippets (the first uses standard XML format and the second uses the p-namespace)
that resolve to the same result:

> 아래의 예는 동일한 결과로 해석되는 두 개의 XML 스니펫(첫 번째는 표준 XML 형식을 사용하고, 두 번째는 p-네임스페이스를 사용함)을 보여줍니다:

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:p="http://www.springframework.org/schema/p"
	xsi:schemaLocation="http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd">

	<bean name="classic" class="com.example.ExampleBean">
		<property name="email" value="someone@somewhere.com"/>
	</bean>

	<bean name="p-namespace" class="com.example.ExampleBean"
		p:email="someone@somewhere.com"/>
</beans>
```

The example shows an attribute in the p-namespace called email in the bean definition. This tells Spring to include a
property declaration. As previously mentioned, the p-namespace does not have a schema definition, so you can set the
name of the attribute to the property name.

> 이 예는 빈 정의에서 `email`이라는 p-네임스페이스의 속성을 보여줍니다. 이것은 스프링이 속성 선언을 포함하도록 지시합니다. 앞에서 언급했듯이, p-네임스페이스에는 스키마 정의가 없으므로, 프로퍼티 이름을
> 속성 이름으로 설정할 수 있습니다. (preperty나 attribute나..)

<br>

This next example includes two more bean definitions that both have a reference to another bean:

> 아래의 예제에는 다른 빈에 대한 참조가 있는 두 개의 빈 정의가 더 포함되어 있습니다:

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:p="http://www.springframework.org/schema/p"
	xsi:schemaLocation="http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd">

	<bean name="john-classic" class="com.example.Person">
		<property name="name" value="John Doe"/>
		<property name="spouse" ref="jane"/>
	</bean>

	<bean name="john-modern"
		class="com.example.Person"
		p:name="John Doe"
		p:spouse-ref="jane"/>

	<bean name="jane" class="com.example.Person">
		<property name="name" value="Jane Doe"/>
	</bean>
</beans>
```

This example includes not only a property value using the p-namespace but also uses a special format to declare property
references. Whereas the first bean definition uses <property name="spouse" ref="jane"/> to create a reference from bean
john to bean jane, the second bean definition uses p:spouse-ref="jane" as an attribute to do the exact same thing. In
this case, spouse is the property name, whereas the -ref part indicates that this is not a straight value but rather a
reference to another bean.

> 이 예제에는 p-네임스페이스를 사용하는 속성 값뿐만 아니라 특수 형식을 사용하여 속성 참조를 선언하는 것도 포함됩니다. 첫 번째 빈 정의에서는 `<property name="spouse" ref="jane"/>`
> 을 사용하여 bean `john`에서 bean `jane`으로 참조를 생성하는 반면, 두 번째 빈 정의에서는 `p:spouse-ref="jane"`을 속성으로 사용하여 정확히 동일한 작업을 수행합니다. 이
> 경우 `spouse`는 속성 이름이고, `-ref` 부분은 이것이 직선 값이 아니라 다른 빈에 대한 참조임을 나타냅니다.

<br>

The p-namespace is not as flexible as the standard XML format. For example, the format for declaring property references
clashes with properties that end in Ref, whereas the standard XML format does not. We recommend that you choose your
approach carefully and communicate this to your team members to avoid producing XML documents that use all three
approaches at the same time.
{: .notice--primary}

> p-네임스페이스는 표준 XML 형식만큼 유연하지 않습니다. 예를 들어, 속성 참조를 선언하는 형식은 `Ref`로 끝나는 속성과 충돌하지만 표준 XML 형식은 충돌하지 않습니다. 세 가지 접근 방식을 동시에
> 사용하는 XML 문서를 생성하지 않도록 접근 방식을 신중하게 선택하고, 이를 팀원에게 전달하는 것이 좋습니다.

<br>

# XML Shortcut with the c-namespace

Similar to the XML Shortcut with the p-namespace, the c-namespace, introduced in Spring 3.1, allows inlined attributes
for configuring the constructor arguments rather then nested constructor-arg elements.

> 스프링 3.1에 도입된 c-네임스페이스는 p-네임스페이스의 XML 지름길과 유사하게 중첩된 `constructor-arg` 요소가 아닌 생성자 인수를 구성하기 위한 인라인 속성을 허용합니다. 뭔 말이야

<br>

The following example uses the c: namespace to do the same thing as the from Constructor-based Dependency Injection:

> 아래의 예제에서는 `c:` 네임스페이스를 사용하여 생성자 기반 의존성 주입에서와 동일한 작업을 수행합니다:

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:c="http://www.springframework.org/schema/c"
	xsi:schemaLocation="http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd">

	<bean id="beanTwo" class="x.y.ThingTwo"/>
	<bean id="beanThree" class="x.y.ThingThree"/>

	<!-- traditional declaration with optional argument names -->
	<bean id="beanOne" class="x.y.ThingOne">
		<constructor-arg name="thingTwo" ref="beanTwo"/>
		<constructor-arg name="thingThree" ref="beanThree"/>
		<constructor-arg name="email" value="something@somewhere.com"/>
	</bean>

	<!-- c-namespace declaration with argument names -->
	<bean id="beanOne" class="x.y.ThingOne" c:thingTwo-ref="beanTwo"
		c:thingThree-ref="beanThree" c:email="something@somewhere.com"/>

</beans>
```

The c: namespace uses the same conventions as the p: one (a trailing -ref for bean references) for setting the
constructor arguments by their names. Similarly, it needs to be declared in the XML file even though it is not defined
in an XSD schema (it exists inside the Spring core).

> `c:` 네임스페이스는 생성자 인수를 이름으로 설정하기 위해 `p:` 하나(bean 참조의 경우 후행 `-ref`)와 동일한 규칙을 사용합니다. 마찬가지로, XSD 스키마에 정의되어 있지 않더라도 XML 파일에
> 선언해야 합니다(스프링 코어 내부에 존재).

<br>

For the rare cases where the constructor argument names are not available (usually if the bytecode was compiled without
debugging information), you can use fallback to the argument indexes, as follows:

> 생성자 인수 이름을 사용할 수 없는 드문 경우(일반적으로 디버깅 정보 없이 바이트코드를 컴파일한 경우)에는 아래와 같이 인자 인덱스에 대한 `fallback`을 사용할 수 있습니다:

```xml
<!-- c-namespace index declaration -->
<bean id="beanOne" class="x.y.ThingOne" c:_0-ref="beanTwo" c:_1-ref="beanThree"
	c:_2="something@somewhere.com"/>
```

<br>

Due to the XML grammar, the index notation requires the presence of the leading _, as XML attribute names cannot start
with a number (even though some IDEs allow it). A corresponding index notation is also available for <constructor-arg>
elements but not commonly used since the plain order of declaration is usually sufficient there.
{: .notice--primary}

> XML 문법으로 인해 인덱스 표기법에는 선행 `_`가 있어야 하는데, 이는 XML 속성 이름이 숫자로 시작할 수 없기 때문입니다(일부 IDE에는 허용하긴 함~). `<constructor-arg>` 요소에도 해당
> 인덱스 표기법을 사용할 수 있지만, 일반적으로 일반 선언 순서로 충분하기 때문에 일반적으로 사용되지는 않습니다.

<br>

In practice, the constructor resolution mechanism is quite efficient in matching arguments, so unless you really need
to, we recommend using the name notation throughout your configuration.

> 실제로 생성자 확인 메커니즘은 인수를 일치시키는 데 매우 효율적이므로 꼭 필요한 경우가 아니라면, 구성 전체에서 이름 표기법을 사용하는 것이 좋습니다.

<br>

# Compound Property Names

You can use compound or nested property names when you set bean properties, as long as all components of the path except
the final property name are not null. Consider the following bean definition:

> 최종 속성 이름을 제외한 경로의 모든 구성 요소가 `null`이 아닌 한, bean 프로퍼티를 설정할 때 복합 또는 중첩 속성 이름을 사용할 수 있습니다. 아래의 빈 정의를 살펴보겠습니다:

```xml
<bean id="something" class="things.ThingOne">
	<property name="fred.bob.sammy" value="123" />
</bean>
```

The something bean has a fred property, which has a bob property, which has a sammy property, and that final sammy
property is being set to a value of 123. In order for this to work, the fred property of something and the bob property
of fred must not be null after the bean is constructed. Otherwise, a NullPointerException is thrown.

> `something` bean에는 `fred` 프로퍼티가 있고, `fred` 프로퍼티에는 `bob` 프로터티가 있으며, `bob` 프로퍼티에는 `sammy` 프로퍼티가 있고, 최종 `sammy`
> 프로퍼티는 `123`의 값으로 설정되어 있습니다. 이것이 작동하려면 bean이 생성된 후, `something`의 `fred` 프로퍼티와 `fred`의 `bob` 프로퍼티가 `null`이 아니어야 합니다. 그렇지
> 않으면 `NullPointerException`이 발생합니다.

<br>

# Reference

- [Spring 공식 문서](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#spring-core)