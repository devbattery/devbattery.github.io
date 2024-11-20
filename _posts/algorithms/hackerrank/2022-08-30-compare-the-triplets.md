---
title: "[HackerRank] Compare the Triplets (Java)"
excerpt: "Compare the Triplets"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-30
last_modified_at: 2022-08-30
---

<https://www.hackerrank.com/challenges/compare-the-triplets/problem?isFullScreen=true>

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
    static List<Integer> compareTriplets(List<Integer> a, List<Integer> b) {
        int alice = 0, bob = 0;
        List<Integer> answer = new ArrayList<>();
        for (int i = 0; i < a.size(); i++) {
            if (a.get(i) > b.get(i)) {
                alice++;
            } else if (a.get(i) < b.get(i)) {
                bob++;
            }
        }
        answer.add(alice);
        answer.add(bob);
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<Integer> a = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        while (st.hasMoreTokens()) {
            a.add(Integer.parseInt(st.nextToken()));
        }
        st = new StringTokenizer(br.readLine(), " ");
        List<Integer> b = new ArrayList<>();
        while (st.hasMoreTokens()) {
            b.add(Integer.parseInt(st.nextToken()));
        }
        for (int x : Result.compareTriplets(a, b)) {
            System.out.print(x + " ");
        }
        br.close();
    }
}
```