---
title: "[HackerRank] A Very Big Sum (Java)"
excerpt: "A Very Big Sum"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-01
last_modified_at: 2022-09-01
---

<https://www.hackerrank.com/challenges/a-very-big-sum/problem?isFullScreen=true>

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
    static long aVeryBigSum(List<Long> ar) {
        long answer = 0;
        for (Long aLong : ar) {
            answer += aLong;
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Long> ar = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            ar.add(Long.parseLong(st.nextToken()));
        }
        System.out.print(Result.aVeryBigSum(ar));
        br.close();
    }
}
```