---
title: "[HackerRank] Simple Array Sum (Java)"
excerpt: "Simple Array Sum"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-09
last_modified_at: 2022-09-09
---

<https://www.hackerrank.com/challenges/simple-array-sum/problem?isFullScreen=true>

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
    static int simpleArraySum(List<Integer> ar) {
        int answer = 0;
        for (Integer integer : ar) {
            answer += integer;
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> ar = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            ar.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(Result.simpleArraySum(ar));
        br.close();
    }
}
```