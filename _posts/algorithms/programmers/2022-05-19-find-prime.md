---
title: "[Programmers] 소수 찾기 (Java)"
excerpt: "소수 찾기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-19
last_modified_at: 2022-05-19
---

<https://programmers.co.kr/learn/courses/30/lessons/12921>

<br>

## Solution

```java
class Solution {
    public static int solution(int n) {
        int answer = 0;
        boolean flag = true;

        for (int i = 2; i <= n; i++) {
            for (int j = 2; j <= Math.sqrt(i); j++) {
                if (i % j == 0) { // not a prime
                    flag = false;
                    break;
                }
            }

            if (flag) {
                answer++;
            } else {
                flag = true;
            }
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(10));
        System.out.println(solution(5));
    }
}
```

<br>

## Another Solution

```java
class NumOfPrime {
    int numberOfPrime(int n) {
        int result = 0;
        for (int i = 2; i <= n; i++) {
            for (int j = 2; j <= i; j++) {
                if (j == i) {
                    result++;
                } else if (i % j == 0) {
                    break;
                }
            }
        }

        return result;
    }

    public static void main(String[] args) {
        NumOfPrime prime = new NumOfPrime();
        System.out.println(prime.numberOfPrime(10));
        System.out.println(prime.numberOfPrime(5));

    }

}
```
