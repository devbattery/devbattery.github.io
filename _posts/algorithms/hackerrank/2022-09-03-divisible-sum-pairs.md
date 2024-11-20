---
title: "[HackerRank] Divisible Sum Pairs (Java)"
excerpt: "Divisible Sum Pairs"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-03
last_modified_at: 2022-09-03
---

<https://www.hackerrank.com/challenges/divisible-sum-pairs/problem?isFullScreen=true>

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
    static int divisibleSumPairs(int n, int k, List<Integer> ar) {
        int answer = 0;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if ((ar.get(i) + ar.get(j)) % k == 0) {
                    answer++;
                }
            }
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        int n = Integer.parseInt(st.nextToken());
        int k = Integer.parseInt(st.nextToken());
        List<Integer> ar = new ArrayList<>();
        st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            ar.add(Integer.valueOf(st.nextToken()));
        }
        System.out.print(Result.divisibleSumPairs(n, k, ar));
        br.close();
    }
}
```