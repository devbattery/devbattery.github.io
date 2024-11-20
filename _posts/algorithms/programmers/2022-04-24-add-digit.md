---
title: "[Programmers] 자릿수 더하기 (Java)"
excerpt: "자릿수 더하기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-04-24
last_modified_at: 2022-04-24
---

<https://programmers.co.kr/learn/courses/30/lessons/12931>

<br>


## Solution

```java
import java.util.*;

public class Solution {
    public static int solution(int n) {
        int answer = 0;

        while (true) {
            answer += n % 10;
            n /= 10;

            if (n == 0) {
                break;
            }
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(123));
    }
}
```
