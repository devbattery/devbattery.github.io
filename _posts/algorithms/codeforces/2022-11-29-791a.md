---
title: "[Codeforces] 791A - Bear and Big Brother (Java)"
excerpt: "Bear and Big Brother"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-29
last_modified_at: 2022-11-29
---

<https://codeforces.com/problemset/problem/791/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Solution {
    public static int LimakIsMoreThanBob(int a, int b) {
        int year = 0;
        if (a > b) {
            return -1;
        }
        while (a <= b) {
            a *= 3;
            b *= 2;
            year++;

        }
        return year;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        int a = Integer.parseInt(st.nextToken());
        int b = Integer.parseInt(st.nextToken());
        System.out.print(LimakIsMoreThanBob(a, b));
        br.close();
    }
}
```