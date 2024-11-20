---
title: "[HackerRank] The Hurdle Race (Java)"
excerpt: "The Hurdle Race"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-17
last_modified_at: 2022-09-17
---

<https://www.hackerrank.com/challenges/the-hurdle-race/problem?isFullScreen=true>

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
    static int hurdleRace(int k, List<Integer> height) {
        int answer, max = Integer.MIN_VALUE;
        for (int i = 0; i < height.size(); i++) {
            if (max < height.get(i)) {
                max = height.get(i);
            }
        }
        answer = max - k;
        if (answer < 0) {
            answer = 0;
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
        st = new StringTokenizer(br.readLine(), " ");
        List<Integer> height = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            height.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(Result.hurdleRace(k, height));
        br.close();
    }
}
```