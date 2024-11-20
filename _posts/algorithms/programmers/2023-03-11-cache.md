---
title: "[Programmers] [1차] 캐시 (Python)"
excerpt: "2018 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [python, algorithms, lru]

toc: true
toc_sticky: true

date: 2023-03-11
last_modified_at: 2023-03-11
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/17680)
- `in`은 신이다

<br>

## Solution

```python
# DB 캐시를 적용할 때 캐시 크기에 따른 실행시간 측정 프로그램을 작성
# LRU: 가장 오랫동안 참조되지 않은 페이지를 교체
# 단점: 프로세스가 주기억장치에 접근할 때마다 참조된 페이지에 대한 시간을 기록해야 함 -> 큰 오버헤드가 발생
from collections import deque


def solution(cacheSize, cities):
    time_answer = 0

    # 캐시가 0인 경우
    if cacheSize == 0:
        return len(cities) * 5

    # 대소문자 구분되지 않도록 소문자로 변경
    cities = [city.lower() for city in cities]

    # 실행시간 상수 선언
    CACHE_HIT = 1  # 캐시가 이미 존재할 경우
    CACHE_MISS = 5  # 캐시가 없을 경우

    # (list의 크기 == 캐시 크기) -> 제한은 deque로 가능
    deq = deque(maxlen=cacheSize)

    # 캐시 크기(cacheSize)에 따른 실행 시간 계산
    for city in cities:
        if city in deq:
            time_answer += CACHE_HIT
            deq.remove(city)
        else:
            time_answer += CACHE_MISS

        deq.append(city)

    return time_answer


print(solution(3, ["Jeju", "Pangyo", "Seoul", "NewYork", "LA", "Jeju", "Pangyo", "Seoul", "NewYork", "LA"]))
print(solution(3, ["Jeju", "Pangyo", "Seoul", "Jeju", "Pangyo", "Seoul", "Jeju", "Pangyo", "Seoul"]))
print(solution(2,
               ["Jeju", "Pangyo", "Seoul", "NewYork", "LA", "SanFrancisco", "Seoul", "Rome", "Paris", "Jeju", "NewYork",
                "Rome"]
               ))
print(solution(5,
               ["Jeju", "Pangyo", "Seoul", "NewYork", "LA", "SanFrancisco", "Seoul", "Rome", "Paris", "Jeju", "NewYork",
                "Rome"]))
print(solution(2, ["Jeju", "Pangyo", "NewYork", "newyork"]))
print(solution(0, ["Jeju", "Pangyo", "Seoul", "NewYork", "LA"]))
```