---
title: "[Programmers] 하샤드 수 (Java)"
excerpt: "하샤드 수"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-07
last_modified_at: 2022-05-07
---

<https://programmers.co.kr/learn/courses/30/lessons/12947>

<br>

## Solution

```java
class Solution {
    public static boolean solution(int x) {
        boolean answer = false;
        int sum = 0;
        int xReal = x;

        while (true) {
            sum += x % 10;
            x /= 10;

            if (x == 0) {
                break;
            }
        }

        if (xReal % sum == 0) {
            answer = true;
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(18));
        System.out.println(solution(10));
        System.out.println(solution(11));
        System.out.println(solution(12));
        System.out.println(solution(13));
    }
}
```
