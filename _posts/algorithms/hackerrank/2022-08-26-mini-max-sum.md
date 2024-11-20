---
title: "[HackerRank] Mini-Max Sum (Java)"
excerpt: "Mini-Max Sum"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-26
last_modified_at: 2022-08-26
---

<https://www.hackerrank.com/challenges/mini-max-sum/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.StringTokenizer;

class Result {
    public static void miniMaxSum(List<Integer> arr) {
        long sum1 = 0, sum2 = 0; // no int, only long
        Collections.sort(arr); // *_*
        for (int i = 0; i < arr.size() - 1; i++) {
            sum1 += arr.get(i);
        }
        for (int i = 1; i < arr.size(); i++) {
            sum2 += arr.get(i);
        }
        System.out.print(sum1 + " " + sum2);
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        List<Integer> arr = new ArrayList<>();
        while (st.hasMoreTokens()) {
            arr.add(Integer.parseInt(st.nextToken()));
        }
        Result.miniMaxSum(arr);
        br.close();
    }
}
```