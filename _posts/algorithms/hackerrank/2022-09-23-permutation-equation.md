---
title: "[HackerRank] Sequence Equation (Java)"
excerpt: "Sequence Equation"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-23
last_modified_at: 2022-09-23
---

<https://www.hackerrank.com/challenges/permutation-equation/problem?isFullScreen=true>

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
    static List<Integer> permutationEquation(List<Integer> p) {
        List<Integer> answer = new ArrayList<>();
        for (int i = 0; i < p.size(); i++) {
            answer.add(p.indexOf(p.indexOf(i + 1) + 1) + 1);
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        List<Integer> p = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            p.add(Integer.valueOf(st.nextToken()));
        }
        for (Integer x : Result.permutationEquation(p)) {
            System.out.println(x);
        }
        br.close();
    }
}
```