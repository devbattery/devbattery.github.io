---
title: "[HackerRank] Plus Minus (Java)"
excerpt: "Plus Minus"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-29
last_modified_at: 2022-08-29
---

<https://www.hackerrank.com/challenges/plus-minus/problem?isFullScreen=true>

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
    static void plusMinus(List<Integer> arr) {
        double pos = 0;
        double neg = 0;
        double zeros = 0;
        for (Integer integer : arr) {
            if (integer > 0) {
                pos++;
            } else if (integer < 0) {
                neg++;
            } else {
                zeros++;
            }
        }

        System.out.printf("%.6f %n", pos / arr.size());
        System.out.printf("%.6f %n", neg / arr.size());
        System.out.printf("%.6f %n", zeros / arr.size());
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> arr = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            arr.add(Integer.valueOf(st.nextToken()));
        }
        Result.plusMinus(arr);
        br.close();
    }
}
```