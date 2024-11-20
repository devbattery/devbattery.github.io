---
title: "[Codeforces] 50A - Domino piling (Java)"
excerpt: "Domino piling"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-20
last_modified_at: 2022-11-20
---

<https://codeforces.com/problemset/problem/50/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Solution {
    public static int solution(int m, int n) {
        return (m * n) / 2;
    } 

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        int m = Integer.parseInt(st.nextToken());
        int n = Integer.parseInt(st.nextToken());
        System.out.print(solution(m, n));
        br.close();
    }
}
```