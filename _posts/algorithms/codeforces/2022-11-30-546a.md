---
title: "[Codeforces] 546A - Soldier and Bananas (Java)"
excerpt: "Soldier and Bananas"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-30
last_modified_at: 2022-11-30
---

<https://codeforces.com/problemset/problem/546/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Solution {
    public static int returnSpotMoney(int k, int n, int w) {
        int money = 0;
        for (int i = 1; i <= w; i++) {
            money += i * k;
        }
        if (n > money) {
            return 0;
        } else {
            return money - n;
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        int k = Integer.parseInt(st.nextToken());
        int n = Integer.parseInt(st.nextToken());
        int w = Integer.parseInt(st.nextToken());
        System.out.print(returnSpotMoney(k, n, w));
        br.close();
    }
}
```