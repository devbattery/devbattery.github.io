---
title: "[Codeforces] 318A - Even Odds (Java)"
excerpt: "Even Odds"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-19
last_modified_at: 2022-12-19
---

<>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Solution {
    static void printPositionNumber(long n, long k) {
        long mid = n / 2;
        if (n % 2 == 1) {
            mid++;
        }
        if (k <= mid) {
            System.out.print((k * 2) - 1);
        } else {
            System.out.print((k - mid) * 2);
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        long n = Long.parseLong(st.nextToken());
        long k = Long.parseLong(st.nextToken());
        printPositionNumber(n, k);
        br.close();
    }
}
```