---
title: "[HackerRank] Halloween Sale (Java)"
excerpt: "Halloween Sale"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-06
last_modified_at: 2022-10-06
---

<https://www.hackerrank.com/challenges/halloween-sale/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

class Result {
    static int howManyGames(int p, int d, int m, int s) {
        int answer = 0;
        while (s >= p) {
            s -= p;
            p = Math.max(p - d, m);
            answer++;
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        int p = Integer.parseInt(st.nextToken());
        int d = Integer.parseInt(st.nextToken());
        int m = Integer.parseInt(st.nextToken());
        int s = Integer.parseInt(st.nextToken());
        System.out.print(Result.howManyGames(p, d, m, s));
        br.close();
    }
}
```