---
title: "[Programmers] 약수의 합 (Java)"
excerpt: "약수의 합"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-04-27
last_modified_at: 2022-04-27
---

<https://programmers.co.kr/learn/courses/30/lessons/12928>

<br>


## Solution

```java
class Solution {
    public static int solution(int n) {
        int answer = 0;

        for (int i = 1; i <= n; i++) {
            if (n % i == 0) {
                answer += i;
            }
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(12));
        System.out.println(solution(5));
    }
}
```

<br>

## Another Solution

```java
class SumDivisor {
    public int sumDivisor(int num) {
        int answer = 0;
        for(int i = 1; i <= num/2; i++){
            if(num%i == 0) answer += i;
        }
        return answer+num;
    }

    public static void main(String[] args) {
        SumDivisor c = new SumDivisor();
        System.out.println(c.sumDivisor(12));
    }
}
```
