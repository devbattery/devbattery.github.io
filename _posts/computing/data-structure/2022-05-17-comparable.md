---
title: "[자료구조] Comparable 인터페이스"
excerpt: "객체지향 정리"

categories:
  - data-structure
tags:
  - [comparable]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2022-05-17
last_modified_at: 2022-05-17
---

# 오버라이드

```java
String one = "hello world";
String two = "hello world";
// 문자열 비교
if(one.equals(two))
	System.out.println("they are the same");
```
one의 hello world와 two의 hello world를 비교하는 Java 코드입니다. 두 개의 문자열을 비교하기 때문에 equals 메소드는 두 변수가 같다고 할 것입니다.

 <br>

```java
Object one = "hello world";
Object two = "hello world";
// 객체 비교
if(one.equals(two))
	System.out.println("they are the same");
```

이번에는 hello world를 저장한 두 개의 객체가 있다고 해 봅시다. 이 때 equals 메소드는 두 개의 메모리 주소를 비교하게 될 겁니다. 따라서 두 개의 객체는 일치하지 않습니다.

이처럼, 객체 클래스의 equals는 메모리 주소를 비교하지만, 문자열 클래스의 equals를 오버라이드하면 메모리 주소 대신 문자열을 비교하게 만들 수 있습니다.

<br>

# Comparable 인터페이스

객체에서 원하는 자료형으로 비교하기 위해, Comparable 인터페이스를 활용합니다. 그리고 Comparable 인터페이스는 같은 자료형의 다른 객체 하나를 인자로 받아와 비교하는 compareTo 함수를 사용합니다. a.compareTo(b)는  a가 b보다 작을 때는 0보다 작은 수, a와 b가 같으면 0, a가 b보다 크면 0보다 큰 수를 반환합니다.

```java
if(((Comparable<T>) data).compareTo(obj)==0)
```

위와 같이 Comparable 인터페이스를 만들면 자료형에 알맞은 데이터가 들어와 compareTo 함수를 통해 같은 자료형의 데이터를 비교할 수 있습니다.

<br>

# Source

- [BoostCourse](https://www.boostcourse.org/cs204/joinLectures/145114)
