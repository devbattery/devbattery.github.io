---
title: "[Programmers] 음양 더하기 (Java)"
excerpt: "음앙 더하기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-01-08
last_modified_at: 2023-01-08
---
- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/76501)

<br>

## Solution

```java
class Solution {
    public static int solution(int[] absolutes, boolean[] signs) {
        int answer = 0;
        for (int i = 0; i < absolutes.length; i++) {
            if (signs[i]) { // true
                answer += absolutes[i];
            } else { // false
                answer -= absolutes[i];
            }
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(new int[]{4, 7, 12}, new boolean[]{true, false, true}));
        System.out.println(solution(new int[]{1, 2, 3}, new boolean[]{false, false, true}));
        System.out.print(solution(new int[]{3, 3, 3, 3}, new boolean[]{false, true, false, true}));
    }
}
```
