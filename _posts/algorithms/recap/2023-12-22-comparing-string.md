---
title: "[Algorithm] 문자열 정렬 방법 (Java, Python)"
excerpt: "Comparing 사용"

categories:
  - Recap
tags:
  - [java, python, string, sorting]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-12-22
last_modified_at: 2023-12-22
---

> 코딩 테스트 준비 중, 파이썬만 사용하다가 자바를 사용하려 하니 문자열 정렬에 막히는 부분이 꽤 있었습니다. <br> 그것을 간단하게 정리한 글입니다.

# Python

```python
input = 'it is a good bike'
```

```python
words = input.split()
```

```python
words = ['it', 'is', 'a', 'good', 'bike']
```

```python
words.sort(key=lambda x: (len(x), x))
```

```python
# 길이를 기준으로 정렬 (len(x))
['a', 'it', 'is', 'good', 'bike']

# 그 후 길이가 같으면 사전순으로 정렬 (x)
['a', 'is', 'it', 'bike', 'good']
```

```python
words = ['a', 'is', 'it', 'bike', 'good']
```

# Java

- 사실 파이썬은 설명 없이도 기본적인 문법만 알고 있다면 위 설명에 대해 누구든 수긍하고 넘어갈 수 있을 것이다.
-    하지만 자바의 경우는 파이썬처럼 한 줄의 람다로 처리하려면 `Comparator`의 메서드를 외우고 있어야 하기 때문에, 익숙하지 않다면 많이 헷갈릴 것이라고 생각한다.

```java
String input = "it is a good bike"
```

```java
String[] words = input.split()
```

```java
String[] words = {"it", "is", "a", "good", "bike"};
```

```java
Arrays.sort(words, Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder())
```

- `Comparator.comparingInt(String::length)`
    - 각 문자열의 길이를 기준으로 비교하는 `Comparator` 생성
    - `String::length`
        - 문자열의 길이를 반환하는 메서드 레퍼런스
- `thenComparing(Comparator.naturalOrder())`
    - 길이가 같을 경우에는 자연 순서(사전순)을 기준으로 비교하는 `Comparator` 추가
    - `Comparator.naturalOrder()`
        - 객체의 자연 순서를 기준으로 비교하는 `Comparator` 생성
- if) 내림차순의 경우
    - `thenComparing()` 후에 `reversed()`를 해주면 됨

```java
String[] words = {"a", "is", "it", "bike", "good"}
```
