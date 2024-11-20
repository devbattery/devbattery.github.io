---
title: "[Programmers] 없는 숫자 더하기 (Java)"
excerpt: "없는 숫자 더하기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-01-11
last_modified_at: 2023-01-11
---
- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/86051)

<br>

## Solution

```java
class Solution {
    static int returnSum(int n) {
        int sum = 0;
        for (int i = 1; i <= n; i++) {
            sum += i;
        }
        return sum;
    }

    public static int solution(int[] numbers) {
        int answer = returnSum(9);
        for (int number : numbers) {
            answer -= number;
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(new int[]{1, 2, 3, 4, 6, 7, 8, 0}));
        System.out.print(solution(new int[]{5, 8, 4, 0, 6, 7, 9}));
    }
}
```
