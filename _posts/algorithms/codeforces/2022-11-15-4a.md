---
title: "[Codeforces] 4A - Watermelon (Java)"
excerpt: "Watermelon"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-15
last_modified_at: 2022-11-15
---

<https://codeforces.com/contest/4/problem/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    static String solution(int input) {
        if (input == 2) {
            return "NO";
        }
        return (input % 2 == 0) ? "YES" : "NO";
    }
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        System.out.print(solution(Integer.parseInt(br.readLine())));
        br.close();
    }
}
```