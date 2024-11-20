---
title: "[Programmers] 내적 (Java)"
excerpt: "내적"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-01-12
last_modified_at: 2023-01-12
---
- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/70128)

<br>

## Solution

```java
class Solution {
    public static int solution(int[] a, int[] b) {
        int answer = 0;
        for (int i = 0; i < a.length; i++) {
            answer += a[i] * b[i];
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(new int[]{1, 2, 3, 4}, new int[]{-3, -1, 0, 2}));
        System.out.print(solution(new int[]{-1, 0, 1}, new int[]{1, 0, -1}));
    }
}
```