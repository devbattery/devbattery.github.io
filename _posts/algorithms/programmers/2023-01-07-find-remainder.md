---
title: "[Programmers] 나머지가 1이 되는 수 찾기 (Java)"
excerpt: "나머지가 1이 되는 수 찾기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-01-07
last_modified_at: 2023-01-07
---
- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/87389?language=java)

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

class Solution {
    public static int solution(int n) {
        for (int x = 1; ; x++) {
            if (n % x == 1) {
                return x;
            }
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        System.out.print(solution(n));
        br.close();
    }
}
```
