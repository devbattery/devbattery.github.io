---
title: "[Programmers] 약수의 개수와 덧셈 (Java)"
excerpt: "약수의 개수와 덧셈"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-01-13
last_modified_at: 2023-01-13
---
- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/77884)

<br>

## Solution

```java
class Solution {
    static int cnt = 0;

    static void countNumOfDiv(int i) {
        for (int j = 1; j <= i; j++) {
            if (i % j == 0) {
                cnt++;
            }
        }
    }

    // Even: plus
    // Odd: minus
    public static int solution(int left, int right) {
        int answer = 0;
        for (int i = left; i <= right; i++) {
            countNumOfDiv(i);
            if (cnt % 2 == 0) {
                answer += i;
            } else { // cnt % 2 == 1
                answer -= i;
            }
            cnt = 0;
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(13, 17));
        System.out.print(solution(24, 27));
    }
}
```