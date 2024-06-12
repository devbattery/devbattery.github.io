---
title: "[Spring] 스프링 컨테이너와 스프링 빈 정리"
excerpt: "IOC, Bean"

categories:
  - Spring
tags:
  - [java]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-03-26
last_modified_at: 2023-03-26
---

> 영한님의 스프링 핵심 원리를 보고 정리한 글입니다.

- [출처](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8/dashboard)
- [저작권](https://www.inflearn.com/questions/261475/%EA%B0%9C%EC%9D%B8-%EA%B0%9C%EB%B0%9C-%EB%B8%94%EB%A1%9C%EA%B7%B8%EC%97%90-%EA%B0%95%EC%9D%98-%EB%82%B4%EC%9A%A9%EC%9D%84-%EC%A0%95%EB%A6%AC%ED%95%98%EB%8A%94-%EA%B2%83%EA%B3%BC-%EA%B4%80%EB%A0%A8%EB%90%9C-%EB%AC%B8%EC%9D%98%EA%B0%80-%EC%9E%88%EC%8A%B5%EB%8B%88%EB%8B%A4)

## 스프링 컨테이너

- 스프링 컨테이너: 스프링 프레임워크의 핵심 컴포넌트
- 스프링 컨테이너는 자바 객체의 생명 주기를 관리하며
  - 생성된 자바 객체들에게 추가적인 기능을 제공
- 스프링에서는 자바 객체는 `Bean`이라고 함
- 즉, 스프링 컨테이너는 내부에 존재하는 빈의 생명 주기를 관리하며
  - 생성된 빈에게 추가적인 기능을 제공

## 스프링 컨테이너 생성

```java
ApplicaitonContext applicationContext = new AnnotationConfigApplicationContext(AppConfig.class);
```

- `ApplicationContext`를 스프링 컨테이너라고 하고, 이는 인터페이스이다.
- [AppConfig](#appconfig) 방식 -> 스프링 컨테이너
- `AnnotationConfigApplicationContext`
  - 이 클래스는 `Applicationcontext` 인터페이스의 구현체이다.

## AppConfig

- AppConfig 방식 적용 전

```java
public class OrderServiceImpl implements OrderService {
    private final MemberRepository memberRepository = new MemoryMemberRepository();
    private final DiscountPolicy discountPolicy = new FixDiscountPolicy();
}
```

- 인터페이스도 참조, 구현체도 참조하는 코드
  - DIP 위반
- `DiscountPolicy`의 구현체를 변경하면 단순하게 코드만 변경하게 됨
  - 이는 OCP 위반

<br>

- 적용 후

```java
public class AppConfig {
    public MemberService memberService(){
        return new MemberServiceImpl(new MemoryMemberRepository());
    }

    public OrderService orderService(){
        return new OrderServiceImpl(new MemoryMemberRepository(), new FixDiscountPolicy());
    }
}
```

- DIP, OCP를 위반하지 않게 하는 것이 AppConfig 방식
  - 이는 애플리케이션의 전체 구성을 책임지며, 생성자 주입을 하게 됨
- 이 방식을 사용하면 Impl 클래스에서 참조가 필요 없어짐
- 오직 "추상적"으로만 의존
- AppConfig는 어떤 구현 객체를 주입할지 설정을 해주고
  - Impl은 "추상적"으로 참조하면서 의존관계에 대한 고민은 외부에 맡기고 실행해만 집중하면 됨

## 스프링 컨테이너의 생성 과정

1. 스프링 컨테이너 생성

- 스프링 빈 구성 정보 지정

2. 스프링 빈 등록

- 스프링 컨테이너 내부의 진 저장소는 일종의 key, value로 이루어져 있음
- 설정파일의 메서드 이름과 반환 객체를 가지고 각각 key, value로 객체를 저장소에 저장

3. 스프링 빈 의존관계 설정 (준비, 완료)

- 원래, 스프링 빈들을 다 생성 후 의존 관계를 주입하고 단계가 나누어져 있음
- 하지만 자바 설정 파일로 한 경우
  - 빈 등록 시 생성자가 호출되며 해당 생성자 인자를 가지고 의존 관계 주입도 같이 이루어짐
- (주의!) 빈 이름은 항상 다른 이름으로 설정
  - 빈의 이름이 중복되면 다른 빈이 무시되거나 덮어 씌울 수 있음

> 아래는 제공된 pdf의 그림입니다.

<img width="1016" alt="스크린샷 2023-03-26 오후 9 32 48" src="https://user-images.githubusercontent.com/62871026/227775883-2d757249-1243-46f8-b953-aa641a5aeff4.png">

<img width="1020" alt="스크린샷 2023-03-26 오후 9 33 27" src="https://user-images.githubusercontent.com/62871026/227775911-78ae5550-cd40-4d07-8ebe-daf8872f6fad.png">

<img width="1018" alt="스크린샷 2023-03-26 오후 9 33 45" src="https://user-images.githubusercontent.com/62871026/227775928-411ebeab-71cb-4637-96ac-51a953efa6c4.png">

<img width="1027" alt="스크린샷 2023-03-26 오후 9 34 02" src="https://user-images.githubusercontent.com/62871026/227775949-449577fb-bf0a-4af9-8a93-ab42ffdd67aa.png">

## 컨테이너에 등록된 모든 빈 조회

```java
// AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(AppConfig.class);

ac.getBeanDefinitionNames();
```

- 위의 명령어로 스프링 컨테이너에 등록된 모든 빈 조회 가능
  등록된 모든 빈들의 이름 목록을 가져올 수 있음

<br>

- 스프링 빈 이름으로 빈 객체를 조회할 수 있음
  - 스프링에 등록된 모든 빈들으 이름과 인스턴스를 한꺼번에 확인할 수 있음
- 스프링에 등록된 모든 빈들 중 AppConfig를 가지고 직접 설정한 것뿐만이 아닌
  - 스프링 내부적으로 사용하기 위해 등록된 빈도 있음
  - 이를 구분하여 조회 가능
    - `ROLE_APPLICATION`: 일반적으로 사용자가 정의한 빈
      - 직접 등록한 스프링 빈만 확인하고 싶을 때 이걸 사용하여 조회하면 됨
    - `ROLE_INFRASTRUCTURE`: 스프링이 내부에서 확인하는 빈

## 스프링 빈 조회 - 기본

- 스프링 컨테이너에서 스프링 빈을 찾는 가장 기본적인 조회 방법
  - `ac.getBean(빈이름, 타입)
  - `ac.getBean(타입)
    - 여기서 ac는 [이 주석](#컨테이너에-등록된-모든-빈-조회) 참고
  - 조회 대상 스프링 빈이 없으면 예외 발생
    - `NoSuchBeanDefinitionException: No bean named 'xxxxx' available`

<br>

- 스프링 빈 없이 타입만으로도 스프링 빈을 조회 가능
  - 하지만 구현체 타입으로 조회하는 것은 바람직 X
  - 객체 지향적으로 설계를 했다 할지라도
    - 구체 타입으로 조회한다면 유연성이 떨어지고, 확장하는 데 많은 변경 지점이 발생 (OCP 위반)

## 스프링 빈 조회 - 동일한 타입이 둘 이상

- 타입으로 조회시 같은 타입의 스프링 빈이 둘 이상이면 오류 발생
  - 단, 이때는 빈 이름 지정할 것!
- `ac.getBeansOfType()`을 사용하면
  - 특정 타입으로 등록된 모든 빈 조회 가능
  - `cmd + shift + v`를 하면 이것이 Map 형식으로 반환된다는 것을 알 수 있음
  - 이때의 key는 빈 이름, value는 해당 빈 인스턴스임

## 스프링 빈 조회 - 상속 관계

- 부모 타입으로 조회하면, 그에 해당하는 모든 자식 타입들도 함께 조회
  - 즉, 모든 자바 객체의 최고 부모인 `Object` 타입으로 조회하면, 모든 스프링 빈들을 조회

> 아래는 제공된 pdf의 그림입니다.

<img width="1023" alt="스크린샷 2023-03-26 오후 9 49 36" src="https://user-images.githubusercontent.com/62871026/227776825-eed4137c-a6cf-4f5e-83ca-ddf1539a11eb.png">

<br>

- `ac.getBeansOfType()`을 통해 부모 타입으로 모든 자식 타입들을 함께 조회할 수 있음
  - 여기서 `Object` 타입으로 조회하면 위에서 말한 대로 모든 스프링 빈들을 조회하게 됨

## BeanFactory와 ApplicationConext

> 아래는 제공된 pdf의 그림입니다.

<img width="984" alt="스크린샷 2023-03-26 오후 9 53 05" src="https://user-images.githubusercontent.com/62871026/227777005-2bbc5bcc-9715-4e5b-a43b-a3dbf3e1b64f.png">

- 스프링 컨테이너로 사용되는 `ApplicationConext`는 `BeanFactory`를 상속받고 있음
  - 즉, 스프링 컨테이너의 최상위 인터페이스 -> `BeanFactory`

<br>

- **BeanFactory**
  - 스프링 컨테이너의 최상위 인터페이스
  - 스프링 빈을 관리하고 조회하는 역할 담당
  - `getBean()` 제공
  - 지금까지 사용했던 대부분의 기능은 `BeanFactory`가 제공하는 기능

<br>

- **ApplicationConext**
  - `BeanFactory` 기능을 모두 상속받아서 제공하면서 이외 추가 기능들도 제공

> 아래는 제공된 pdf의 그림입니다.

<img width="1017" alt="스크린샷 2023-03-26 오후 9 55 54" src="https://user-images.githubusercontent.com/62871026/227777138-45eda9ae-db74-4d49-8fd8-9dc68ad214b3.png">

- `MessageSource` (메시지 소스를 활용한 국제화 기능)
  - 국제화(i18n) 기능을 제공하는 인터페이스
  - 예를 들어 한국에서 들어오면 한국어로, 영어권에서 들어오면 영어로 출력
- `EnvironmentCapable` (환경 변수)
  - 프로파일과 프로퍼티를 다루는 인터페이스
  - 로컬, 개발, 운영 등을 구분해서 처리
- `ApplicationEventPublisher` (애플리케이션 이벤트)
  - 이벤트를 발생하고 구독하는 모델을 편리하게 지원
  - 이벤트 프로그래밍에 필요한 인터페이스
- `ResourceLoader` (편리한 리소스 조회)
  - 파일, 클래스패스, 외부 등에서 리소스를 편리하게 조회
  - 리소스를 읽어오는 기능을 제공하는 인터페이스

<br>

- 정리
  - `ApplicationConext`는 `BeanFactory`의 기능을 상속받음
  - `ApplicationConext`는 빈 관리 기능 + 편리한 부가 기능을 제공
  - `BeanFactory`를 직접 사용할 일은 거의 없음
    - 부가 기능이 포함된 `ApplicationConext`를 사용
  - `BeanFactory`나 `ApplicationContext`를 스프링 컨테이너라 함

## 다양한 설정 형식 지원 - 자바 코드, XML

- 스프링 컨테이너는 다양한 형식의 설정 정보를 받아들일 수 있게 유연하게 설계되어 있음
  - 자바 코드, XML, Groovy 등

<img width="1012" alt="스크린샷 2023-03-26 오후 10 01 21" src="https://user-images.githubusercontent.com/62871026/227777381-425f0bf4-fa63-4c62-be57-f740e1868d99.png">

- 위 `Annotation` 기반의 `AppConfig` 방식은 `AnnotationConfigApplicationContext`를 통해 사용 가능
  - 이 클래스를 사용하면서 자바 코드로 된 설정 정보를 넘김
- `Annotation` 기반뿐만 아니라, XML 설정 방식도 지원
  - 이때 `GenericXmlApplicationContext` 사용

<br>

- XML 설정 방식은 `<bean>` 태그 안에 지정하고자 하는 주입 받을 빈 내용 지정하는 방식
  - 하지만 스프링 부트를 많이 사용하면서 XML 기반의 설정은 잘 사용하지 않음
  - 그래도 아직 많은 레거시 프로젝트들이 XML로 되어 있고,
    - 컴파일 없이 빈 설정 정보를 변경할 수 있다는 장점도 있으니 무시는 하면 안 됨
  - `GenericXmlApplicatonConext`를 사용하면서 XML 설정 파일을 넘기면 됨
- XML 기반의 `appConfig.xml` 스프링 설정 정보와 `AppConfig.java` 설정 정보를 비교하면 거의 비슷쓰

## 스프링 빈 설정 메타 정보 - BeanDefinition

- 스프링은 다양한 스프링 빈 설정 방식을 유연성 있게 지원
  - 추상화(`BeanDefinition`)를 통해 유연성을 가질 수 있었음
- 쉽게 말해서 **역할과 구현을 개념적으로 나눈 것**
  - XML을 읽어서 만들면 됨
  - 자바 코드를 읽어서 만들면 됨
  - 스프링 컨테이너는 XML인지, 자바 코드인지 몰라도 됨
    - 그저 `BeanDefinition`만 알면 됨
- `BeanDefinition`을 **빈 설정 메타정보**라고 함
  - `@Bean`, `<bean>`당 각각 하나씩 메타 정보가 생성됨
- 스프링 컨테이너는 아래의 메타 정보를 기반으로 스프링 빈을 생성

> 아래는 제공된 pdf의 그림입니다.

<img width="1049" alt="스크린샷 2023-03-26 오후 10 13 40" src="https://user-images.githubusercontent.com/62871026/227778071-b2abc4a2-2fe8-4a93-9582-978376f52d8a.png">

- 이렇게 엄청 복잡하게 되어 있는데
  - 사실, `BeanDefinition`은 스프링이 다양한 형태의 설정 정보를 **추상화**하여 사용하는 것 정도만 이해하면 됨
- `ac.getBeanDefinition`을 통해 설정된 `BeanDefinition` 정보들을 전부 조회할 수 있음
