---
title: "[HackerRank] Fair Rations (Java)"
excerpt: "Fair Rations"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-10
last_modified_at: 2022-10-10
---

<https://www.hackerrank.com/challenges/fair-rations/problem?isFullScreen=true>

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
    static String fairRations(List<Integer> B) {
        int answer = 0;
        for (int i = 0; i < B.size() - 1; i++) {
            if (B.get(i) % 2 != 0) { // odd
                B.set(i, B.get(i) + 1);
                B.set(i + 1, B.get(i + 1) + 1);
                answer += 2;
            }
        }
        if (B.get(B.size() - 1) % 2 != 0) {
            return "NO";
        }
        return String.valueOf(answer);
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> B = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            B.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(Result.fairRations(B));
        br.close();
    }
}
```