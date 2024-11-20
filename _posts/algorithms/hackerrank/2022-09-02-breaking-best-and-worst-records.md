---
title: "[HackerRank] Breaking the Records (Java)"
excerpt: "Breaking the Records"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-02
last_modified_at: 2022-09-02
---

<https://www.hackerrank.com/challenges/breaking-best-and-worst-records/problem?isFullScreen=true>

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
    static List<Integer> breakingRecords(List<Integer> scores) {
        List<Integer> answer = new ArrayList<>();
        int countMax = 0, countMin = 0, max = scores.get(0), min = scores.get(0);
        for (int i = 1; i < scores.size(); i++) {
            if (scores.get(i) > max) {
                max = scores.get(i);
                countMax++;
            }
            if (scores.get(i) < min) {
                min = scores.get(i);
                countMin++;
            }
        }
        answer.add(countMax);
        answer.add(countMin);
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> scores = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            scores.add(Integer.parseInt(st.nextToken()));
        }
        for (int x : Result.breakingRecords(scores)) {
            System.out.print(x + " ");
        }
        br.close();
    }
}
```