---
title: "[Codeforces] 486A - Calculating Function (Java)"
excerpt: "Calculating Function"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-17
last_modified_at: 2022-12-17
---

<https://codeforces.com/problemset/problem/486/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    static long f(long n) {
        long answer = 0;
        if (n % 2 == 0) {
            answer = n / 2;
        } else { // sigma
            answer = (-1) * (n / 2 + 1);
        }
        return answer;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        long n = Long.parseLong(br.readLine());
        System.out.print(f(n));
        br.close();
    }
}
```