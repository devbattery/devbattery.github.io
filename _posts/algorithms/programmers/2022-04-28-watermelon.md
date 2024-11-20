---
title: "[Programmers] 수박수박수박수박수박수? (Java)"
excerpt: "수박수박수박수박수박수?"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-04-28
last_modified_at: 2022-04-28
---

<https://programmers.co.kr/learn/courses/30/lessons/12922>

<br>


## Solution

```java
class Solution {
    public static String solution(int n) {
        String answer = "";

        for (int i = 1; i <= n; i++) {
            if (i % 2 == 0) { // Even
                answer += "박";
            } else { // Odd
                answer += "수";
            }
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(3));
        System.out.println(solution(7));
        System.out.println();
        System.out.println(solution(2));
        System.out.println(solution(4));
    }
}
```
