---
title: "[Database] 데이터베이스와 아키텍처 구성 1 - 데이터베이스 첫걸음"
excerpt: "database, architecture"

categories:
  - data-structure
tags:
  - [database, architecture]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-06-28
last_modified_at: 2024-06-28
---

# 아키텍처란

## 아키텍처 설계의 필요성

- 아키텍처
  - "어떤 기능을 가진 서버를 준비하고 어떠한 저장소나 네트워크 기기와 조합해서 시스템 전체를 만들 것인가"
  - 즉, 하드웨어와 미들웨어의 구성을 가리킨다.
- 이 구성을 시스템이 완수해야 할 목적과 비교하면서 결정해 가는 것을 **아키텍처 설계**라고 한다.

## 아키텍처 설계의 중요성

- "시스템에 요구되는 조건을 충족하기 위해 어떤 아키텍처가 적당할까"라는 것을 생각하지 않고, 시스템 구축에 걸리는 비용을 산출하는 것은 불가능하다.
  - 이런 의미해서 아키텍처와 설계라는 것은 시스템 개발의 초반에 시행하는 일 중에서도 매우 중요한 일이다.
- 아키텍처는 시스템 개발 후반이 되면 변경하기가 어려우므로 프로젝트의 성패는 초반에 결정되는 것이 일반적이다.

<br>

# 아키텍처의 역사

- 데이터베이스에 관한 아키텍처의 역사는 구체적으로 아래의 3단계로 나누어서 파악할 수 있다.
  - 1. Stand-alone (~1980년대)
  - 2. 클라이언트/서버 (1990년대~2000년)
  - 3. Web 3계층 (2000년~현대)

## Stand-alone

- 문자 그대로 데이터베이스가 동작하는 머신(DB 서버)이 LAN이나 인터넷 등의 네트워크에 접속하지 않고 **독립되어** 동작하는 구성이다.
- 이 구성에서, 데이터베이스의 미들웨어(DBMS)와 애플리케이션의 소프트웨어는 같은 서버에서 동작한다.
  - 즉, 데이터베이스를 사용하고 싶은 사용자는 DB 서버가 설치된 장소까지 물리적으로 접근하여, 서버 앞에 앉아 데이터베이스를 사용하지 않으면 안 된다.
  - 서버가 네트워크에 접속되어 있지 않기 때문에 물리적으로 떨어진 장소에서 액세스하는 것이 불가능하게 된다.

<img width="512" alt="Screenshot 2024-07-04 at 4 24 57 PM" src="https://github.com/devbattery/devbattery.github.io/assets/62871026/f5952500-4af1-4299-9883-8befd1148125">

### Stand-alone의 단점

- 1.  물리적으로 떨어진 장소에서 접근할 수 있다.
  - 네트워크에 연결되어 있지 않다는 것은 데이터베이스를 이용하려면 데이터베이스 서버 앞에까지 가서 이용하는 방법밖에 없다는 의미이다.
  - 서버를 편히 이용할 수 있는 사람은 도보 10분 내에서 일하고 있는 사람으로 한정된다.
- 2.  복수 사용자가 동시에 작업할 수 없다.
  - "네트워크에 연결되어 있지 않다"는 것은 동시에 서버를 이용할 수 있는 사람의 수가 1명으로 한정된다는 의미이다.
  - 이용 희망 시간대가 붐비는 경우, 콘솔 앞 대기열이 늘어나게 된다.
- 3.  가용성이 낮다.
  - 서버가 1대밖에 없으므로 이 1대에 장애가 발생하면 서비스가 정지한다는 것도 큰 단점이다.
  - 시스템이 서비스 제공 시간에 장애 없이 서비스를 계속 지속할 수 있는 비율이 어느 정도인가를 나타내는 개념을 **가용성(Availability)**라고 한다.
  - Stand-alone 구성에서는 서버가 1대밖에 없기 때문에 이 서버에서 어떤 장애가 발생한다면 그 시점부터 서비스는 정지하고 만다.
- 4.  확장성이 부족하다.
  - Stand-alone은 성능 문제도 존재한다.
    - 이것은 "성능이 나쁘다"는 것 이상으로, 성능이 나쁠 때 **개선 수단**이 매우 부족하다는 것을 의미한다.
    - 실제 머신이 1대밖에 없다는 것은 머신 그 자체의 성능을 올리는 것 이외에 개선 수단이 없다는 것을 의미힌다.
      - 이런 구성을 "**확장성(Scalability)**이 부족하다"고 표현한다.
  - 게다가 교환하기 위해 시스템을 정지해야 해서 가용성을 점점 낮추는 결과로 이어진다.

### Stand-alone의 장점

- 1.  구축이 매우 간단해서 소규모 작업이나 테스트를 빨리할 수 있다.
  - 성능이나 가용성을 무시하면 노트북 환경에서도 만들 수 있다.
- 2.  보안이 매우 높다.
  - 네트워크를 매개로 침입할 위험이 없기 때문에 사용자가 외부에 물리적으로 들고 가지 않는 한 서버가 바이러스에 감염되거나 공격 받는 일은 일어나지 않는다.
- 3.  데이터 유출 위험 또한 매우 낮다.
  - 사용자가 DB 서버로부터 데이터를 DVD나 USB 메모리 같은 매체에 복사하려고 할 경우, 하드디스크를 직접 가지고 나가지 않는 한 네트워크를 경유한 외부 해키으로 데이터를 도둑맞을 걱정은 없다.
  - 다른 사람이나 동물과 접속하지 않고 집에만 머물고 있다면 전염병의 위험을 낮출 수 있는 것과 같은 이치이다.

<br>

- 하지만 이런 장점들은 단점들에 비교하면 사소한 것이다.
  - 과거 엔지니어나 프로그래머도 이 점을 똑같이 느꼈기 때문에 데이터베이스 구성은 단점을 극복하기 위해 극적인 진화를 했다.

<br>

## 클라이언트/서버

### 클라이언트/서버의 특징

- 시스템 초창기에 모든 머신은 Stand-alone이었다.
- "물리적으로 떨어진 장소에서 접속 할 수 없다"는 것과 "복수 사용자가 동시 작업할 수 없다"는 Stand-alone의 두 가지 단점을 극복하는 하는 방법을 생각해 보자.
  - 이는 데이터베이스를 네트워크에 연결하면 해결된다.
  - 네트워크에 연결하면 복수 사용자가 물리적으로 떨어진 장소에서 데이터베이스에 접속할 수 있게 된다.

<img width="681" alt="Screenshot 2024-07-04 at 5 08 23 PM" src="https://github.com/devbattery/devbattery.github.io/assets/62871026/c59f434b-8324-4734-9fe8-379122963ce8">

- 이처럼 데이터베이스 서버 1대에 복수 사용자의 단말이 접속하는 구성을 **클라이언트/서버** 구성이라고 한다.
  - 이 구성은 시스템이 클라이언트와 서버의 2개의 레이어로 구성되기 때문에 **2계층 구성**이라고 부르는 경우도 있다.
- DB 서버에서는 DBMS가 동작하고, 클라이언트에서는 업무 애플리케이션이 동작하는 분업 체제로 볼 수 있다.
  - 이 계층을 의식한 구분은 아래에서 설명할 **Web 3계층** 구성과 대비해서 중요하다.

### 클라이언트/서버의 확장

- 클라이언트/서버 구성은 클라이언트 PC와 네트워크 기술의 발전으로 1990년대 수많은 비즈니스 시스템에 채용되었다.
  - 그 주된 요인으로는 Windows 시리즈가 비즈니스 환경에서 살아남아 클라이언트 머신으로서의 지위를 확립한 것과 대규모 데이터를 통신할 수 있는 네트워크 회선의 진화를 들 수 있다.
- 이 구성은 주로 기업이나 조직 내에 닫힌 네트워크(LAN)에서 이용되었다.
  - 역으로 말하면 인터넷 등 외부 네트워크를 거쳐 데이터베이스 서버에 사용자가 접속하는 일은 없었다.
  - 그 이유는 데이터베이스가 매우 중요한 정보를 많이 축적하고 있는 서버이기 때문에 외부로부터의 접속을 허가해 버리면 보안상의 위험이 증가하기 때문이다.
- 클라이언트/서버 구성 덕분에 복수 사용자가 동시에 어느 정도 물리적으로 떨어진 장소에서도 접속할 수 있게 되었다.
  - 현재 아키텍처의 주류는 아니지만, 조직 내에서 **제한된 용도**의 시스템으로 이용되고 있다.

### 클라이언트/서버의 단점

- 1. 인터넷에서 직접 데이터베이스에 접속하는 것에 대한 보안 위험이 있다.
- 2. 불특정 다수의 사용자가 사용하는 클라이언트의 애플리케이션 관리 비용이 많이 든다.

#### 관리 비용 문제

- 클라이언트/서버 시대에는 개인이 이용하는 PC에 애플리케이션을 설치해 동작하게 했다.    
  - 이런 애플리케이션을 Native Application이라고 부른다.
- 사용자가 특정 기업이나 조직 구성원에 한정되어 있고 관리대상 PC도 적다면 문제는 없다.
  - 하지만 인터넷을 통해 전 세계 불특정 다수의 사용자가 이용하는 애플리케이션은 각종 환경에 대응하여 애플리케이션을 작성해야 하고, 각각에 대해 버전 관리나 버그 수정 버전을 배포하는 데 비현실적인 비용이 필요하게 된다.
    - 이 때문에 비즈니스 로직을 실행하는 애플리케이션을 서버에서 관리하여 비용을 절감하자는 요구가 나오게 됐다.
    - 이에 대응하기 위해 제시된 것이 **Web 3계층**이라는 구성이다.

<img width="709" alt="Screenshot 2024-07-04 at 7 27 11 PM" src="https://github.com/devbattery/devbattery.github.io/assets/62871026/0362ed63-9832-4d9e-9657-212f9a56f257">

<br>

- **Web 3계층**은 시스템을 다음 3가지 계층의 조합으로 생각하는 모델이다.
  - 웹 서버 계층
  - 애플리케이션 계층
  - 데이터베이스 계층

<img width="745" alt="Screenshot 2024-07-04 at 7 29 16 PM" src="https://github.com/devbattery/devbattery.github.io/assets/62871026/f3c79c11-170d-43a7-b2c0-4cae86492fdc">

<br>

## 웹 서버 계층과 애플리케이션 계층

- Web 3계층 구성이 클라이언트/서버 구성과 다른 점은 쉽게 알 수 있다.
  - 클라이언트와 데이터베이스 계층 사이에 **웹 서버 계층**과 **애플리케이션 계층**이 추가되어 있다.
- 웹 서버는 클라이언트로부터 접속 요청(Http 요청)을 직접 받아서 그 처리를 뒷단의 애플리케이션 계층(애플리케이션 서버)에 넘기고, 그 결과를 클라이언트에 반환한다.
  - 즉, 애플리케이션 서버와 클라이언트 웹 브라우저가 소통할 수 있게 해주는 역할이다.
  - 자주 이용되는 웹 서버로는 아파치나 IIS(Internet Information Servies)가 유명하다.
- 애플리케이션 계층은 비즈니스 로직을 구현한 애플리케이션이 동작하는 층이다.
  - 웹 서버로부터 연계된 요청을 처리하고, 필요하면 데이터베이스 계층(DB 서버)에 접속해서 데이터를 추출하고, 이를 가공한 결과를 웹 서버로 반환한다.
    - 톰캣, 웹로직, 웹스피어 등이 유명하다.
- 이처럼 사용자로부터 직접적인 접속 요청을 받는 역할을 **웹 서버 계층에 한정하여** 애플리케이션 계층과 데이터베이스 계층의 보안을 높일 수 있다.
- 물리적으로 떨어진 장소에서 접속할 수 없고, 복수 사용자의 동시 작업이 불가능한 Stand-alone 구성의 2가지 단점을 극복한 이 구성은 현재 웹 시스템에서 거의 표준이 되었다.

<br>

# Reference

- [데이터베이스 첫걸음](https://www.aladin.co.kr/m/mproduct.aspx?ItemId=95055027)