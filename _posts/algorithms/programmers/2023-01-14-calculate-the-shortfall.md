---
title: "[Programmers] 부족한 금액 계산하기 (Java)"
excerpt: "부족한 금액 계산하기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-01-14
last_modified_at: 2023-01-14
---
- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/82612)

<br>

## Solution

```java
class Solution {
    public static long solution(int price, int money, int count) {
        long sumPrice = 0;
        for (int i = 1; i <= count; i++) {
            sumPrice += (long) price * i;
        }
        if (money - sumPrice >= 0) {
            return 0;
        } else {
            return sumPrice - money;
        }
    }
}
```