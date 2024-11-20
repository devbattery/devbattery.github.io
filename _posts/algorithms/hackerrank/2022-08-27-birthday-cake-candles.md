---
title: "[HackerRank] Birthday Cake Candles (Java)"
excerpt: "Birthday Cake Candles"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-27
last_modified_at: 2022-08-27
---

<https://www.hackerrank.com/challenges/birthday-cake-candles/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;

class Result {
    static int birthdayCakeCandles(List<Integer> candles) {
        int answer = 0;
        int max = Integer.MIN_VALUE;
        for (Integer candle : candles) {
            if (max <= candle) {
                max = candle;
            }
        }
        for (Integer candle : candles) {
            if (max == candle) {
                answer++;
            }
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        List<Integer> candles = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            candles.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(Result.birthdayCakeCandles(candles));
        br.close();
    }
}
```