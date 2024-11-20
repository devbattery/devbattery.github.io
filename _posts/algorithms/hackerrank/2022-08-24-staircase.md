---
title: "[HackerRank] Staircase (Java)"
excerpt: "Staircase"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-24
last_modified_at: 2022-08-24
---

<https://www.hackerrank.com/challenges/staircase/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

class Result {
    public static void staircase(int n) {
        for (int i = 0; i < n; i++) {
            for (int j = 1; j < n - i; j++) {
                System.out.print(" ");
            }
            for (int j = 0; j <= i; j++) {
                System.out.print("#");
            }
            System.out.println();
        }
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        Result.staircase(n);
        br.close();
    }
}
```