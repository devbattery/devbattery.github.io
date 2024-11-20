---
title: "[Programmers] 정수 제곱근 판별 (Java)"
excerpt: "정수 제곱근 판별"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-11
last_modified_at: 2022-05-11
---

<https://programmers.co.kr/learn/courses/30/lessons/12934>

<br>

## Solution

```java
class Solution {
    public static long solution(long n) {
        long answer = 0;
        long i = 1;

        while (true) {
            if (Math.sqrt(n) == i) {
                answer = (i + 1) * (i + 1);
                break;
            }

            if (Math.sqrt(n) < i) {
                answer = -1;
                break;
            }

            i++;
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(121));
        System.out.println(solution(3));
    }
}
```
<br>

## Another Solution

```java
class Solution {
  public long solution(long n) {
      if (Math.pow((long)Math.sqrt(n), 2) == n) {
            return (long) Math.pow(Math.sqrt(n) + 1, 2);
        }

        return -1;
  }
}
```
