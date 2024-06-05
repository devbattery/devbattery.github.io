---
title: "[Java] Collection / Annotation / Generic 정리"
excerpt: "cs 공부"

categories:
  - Java
tags:
  - [java]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-03-27
last_modified_at: 2023-03-27
---

> JaeYeopHan님의 자료를 바탕으로 정리한 글입니다

- [출처](https://github.com/JaeYeopHan/Interview_Question_for_Beginner/tree/master/Java#collection)
- [시간 복잡도 출처](https://www.grepiu.com/post/9)

<br>

# Collection

- `List`, `Map`, `Set` 인터페이스를 기준으로 여러 구현체 존재
- `Stack`과 `Queue` 인터페이스도 존재
- 이러한 Collection을 사용하는 이유
  - 다수의 Data를 다루는 데 표준화된 클래스들을 제공해주기 때문에
    - Data Structure를 **직접 구현하지 않고 편하게 사용할 수 있기 때문**
  - 배열과 다르게 객체를 보관하기 위한 공간을 미리 정하지 않아도 되므로
    - 상황에 따라 객체의 수를 동적으로 정할 수 있음
      - 이는 프로그램의 공간적인 효율성 또한 높여줌

## List

- `List` 인터페이스를 직접 `@Override`를 통해 사용자가 정의하여 사용할 수 있음
  - 대표적인 구현체: `ArrayList`
    - 이는 기존에 있었던 `Vector`를 개선한 것
      - 오브젝트에서 `Vector`와 `Stack`과의 관계에 대해서 읽은 적이 있는데
      - 막상 쓰지 않는 이유는 `ArrayList`였구나 👀
  - 이외에도 `LinkedList` 등의 구현체 존재

### ArrayList 시간 복잡도

- `add()`: $O(1)$
- `remove()`: $O(N)$
- `get()`: $O(1)$
- `contains()`: $O(N)$
- `iterator.remove()`: $O(N)$

### ArrayList 특징

- 데이터 추가, 삭제를 위해 임시 배열을 생성해 데이터를 복사
  - 대량의 자료를 추가/삭제시 복사가 일어나게 되어 성능 저하를 일으킴
  - 데이터의 인덱스를 가지고 있어 데이터 검색시 빠름

### LinkedList 시간 복잡도

- `add()`: $O(1)$
- `remove()`: $O(1)$
- `get()`: $O(N)$
- `contains()`: $O(N)$
- `iterator.remove()`: $O(1)$

### LinkedList 특징

- 데이터를 저장하는 각 노드가 이전 노드와 다음 노드의 상태만 알고 있음
  - 데이터 추가/삭제시 빠름
  - 데이터 검색시 처음부터 노드를 순회해야 되기 때문에 느림

### CopyOnWriteArrayList 시간 복잡도

- `add()`: $O(N)$
- `remove()`: $O(N)$
- `get()`: $O(1)$
- `contains()`: $O(N)$
- `iterator.remove()`: $O(N)$

### CopyOnWriteArrayList 특징

- 처리에 여분의 오버로드를 가져오지만 순회 작업 수에 비해, 수정 횟수가 최소일 때 효과적
  - `add()`는 ArrayList, LinkedList보다 느리지만
  - `get()`은 LinkedList보단 빠르고 ArrayList보단 살짝 느림

## Map

- 대표적인 구현체: `HashMap`
- key-value의 구조로 이루어져 있음
  - Map에 대한 구체적인 내용은 Data Structure 부분의 Hash Table과 일치
- key를 기준으로 중복된 값을 저장하지 않으며 순서를 보장하지 않음
  - 순서를 보장해주기 위해 `LinkedHashMap` 사용
    - 이건 파이썬에만 있는 줄 알았는데 아니었구나

> List에서는 CopyOnWriteArray까지 정리했지만 List를 제외하고는 너무 지엽적인 것들이 많기 때문에 대표적인 것들만 정리

### HashMap 시간 복잡도

- `get()`: $O(1)$
- `containsKey()`: $O(1)$
- `next()`: $O(h/n)$
  - h는 테이블 용량

### HashMap 특징

- 순서에 상관없이 저장됨
- Null을 허용함
- thread-safe가 보장되지 않음

### LinkedHashMap 시간 복잡도

- `get()`: $O(1)$
- `containsKey()`: $O(1)$
- `next()`: $O(1)$

### LinkedHashMap 특징

- 순서대로 저장됨
- Null을 허용함
- thread-safe 보장되지 않음

### ConcurrentHashMap 시간 복잡도

> 김영한님 강의에서 알게 되었다.

- `get()`: $O(1)$
- `containsKey()`: $O(1)$
- `next()`: $O(h/n)$
  - h는 테이블 용량

### ConcurrentHashMap 특징

- thread-safe 보장
- SynchronizedMap보다 속도가 빠름
- Null을 허용하지 않음

## Set

- 대표적인 구현체: `HashSet`
- value에 대해 중복된 값을 저장하지 않음
- Set 자료구조는 Map의 key-value 구조에서
  - key 대신 value가 들어가 value를 key로 하는 자료구조일 뿐임
    - 마찬가지로 순서를 보장해주기 위해 `LinkedHashSet` 사용
      - 이건 예전에 프로그래머스 문제 풀면서 사용해본 적 있음!

### HashSet 시간 복잡도

- `add()`: $O(1)$
- `contains()`: $O(1)$
- `next()`: $O(h/n)$
  - h는 테이블 용량

### HashSet 특징

- 객체들을 순서없이 저장하고 동일한 객체를 중복 저장하지 않음
- 중복되지 않는 값을 등록할 때 용의
- 순서없이 저장되는 것을 주의
- Null을 허용함

### LinkedHashSet 시간 복잡도

- `add()`: $O(1)$
- `contains()`: $O(1)$
- `next()`: $O(1)$

### LinkedHashSet 특징

- 속도는 `HashSet`에 비해 느리지만 좋은 성능을 보장함
- 등록한 순으로 정렬
- Null을 허용함

### TreeSet 시간 복잡도

- `add()`: $O(log n)$
- `contains()`: $O(log n)$
- `next()`: $O(log n)$

### TreeSet 특징

- 객체기준으로 정렬
- 느림
- Null을 허용하지 않음

## Stack과 Queue

- `Stack` 객체는 직접 `new` 키워드로 사용할 수 있음
- `Queue` 인터페이스는 JDK 1.5부터 `Linkedlist`에 `new` 키워드를 적용하여 사용할 수 있음

### PriorityQueue 시간 복잡도

- `offer()` (입력): $O(log n)$
- `peek()` (get): $O(1)$
- `poll()` (반환): $O(log n)$
- `size()`: $O(1)$

### PriorityQueue 특징

- JVM에서 제공하는 것과 순서가 다를 수 있음
  - 문자는 ASCII 순서로 정렬
- 일반적은 Queue는 FIFO의 구조를 가지지만 `natural-order`에 따라 정렬
- Null을 허용하지 않음

# Annotation

- 어노테이션: 본래 주석이란 뜻으로, 인터페이스를 기반으로한 문법
- Java 5부터 등장한 기능
- AOP(Aspect Oriented Programming: 관점 지향 프로그래밍)을 편리하게 구성할 수 있음
  - 관점 지향은 어떤 로직을 기준으로 **핵심적인 관점, 부가적인 관점**으로 나누어서 보고
    - 그 관점을 기준으로 모듈화하겠다는 것
- 주석과는 그 역할이 다르지만
  - 주석처럼 코드에 달아서 클래스에 특별한 의미를 부여하거나 기능을 주입할 수 있음
  - 해석되는 시점을 정할 수도 있음

## Annotaiton의 3가지 종류

### Built-In Annotation

- JDK에 내장되어 있음
- 상속을 받아서 메서드를 오버라이딩 할 때 나타나는 `@Override` 어노테이션이 그 예
- 이외에도
  - `@Deprecated`
    - 메서드를 사용하지 않도록 유도, 사용한다면 컴파일 에러
  - `@SuppressWarnings`
    - 컴파일 경고를 무시하도록 함
  - `@SafeVarargs`
    - 제네릭 같은 가변 인자 매개변수를 사용할 때 경고를 무시함 (Java 7 이상)
  - `@FuncationallInterface`
    - 람다 함수 등을 위한 인터페이스를 지정
      - 메서드가 없거나 두 개 이상 되면 컴파일 에러 (Java 8 이상)

### Meta Annotation

- 정보를 나타내기 위함
- 어노테이션의 동작 대상을 결정하고, 여러 가지가 존재함
- 다른 Annotation에서도 사용되는 Annotation의 경우
  - [Custom Annotation](#custom-annotation)을 생성할 때 주로 사용됨
- 종류
  - `@Target`
    - 어노테이션을 어느 요소에 적용할지 지정
  - `@Retention`
    - 어노테이션이 얼마나 유지될지 범위를 지정
  - `@Inherited`
    - 해당 어노테이션이 상속됨을 나타냄

### Custom Annotation

- 개발자가 직접 정의하여 사용하는 Annotation
- 프레임워크나 API 등을 만들어 사용할 때 주로 이용
- Custom Annotation을 사용하기 위해 `@interface`를 이용할 수 있음
- Annotation은 내부에 값을 가질 수 있으며, 값을 설정할 수 있음
  - 값을 설정하기 위해서는 default 값 형태로 저장
- Custom Annotation을 선언할 때 [Meta Annotation](#meta-annotation)을 함께 사용할 수 있음

# Generic

- 제네릭은 자바에서 **안정성**을 맡고 있음
- 다양한 타입의 객체들을 다루는 메서드나 컬렉션 클래스에서 사용하는 것으로
  - 컴파일 과정에서 타입 체크를 해주는 기능
- 객체의 타입을 **컴파일 시에 체크**하기 때문에
  - 객체의 타입 안정성을 높이고 형변환은 번거로움을 줄여줌 -> 자연스럽게 코드도 더 간결해짐
    - 예를 들어
      - Collection에 특정 객체만 추가될 수 있도록
      - 특정한 클래스의 특징을 갖고 있는 경우에만 추가할 수 있도록 함
    - 이로 인한 장점
      - Collection 내부에서 들어온 값이 내가 원하는 값인지 별도의 로직 처리를 구현할 필요가 없어짐
      - API를 설계하는 데 있어서, 보다 명확한 의사 전달이 가능해짐
