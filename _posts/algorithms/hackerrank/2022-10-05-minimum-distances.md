---
title: "[HackerRank] Minimum Distances (Java)"
excerpt: "Minimum Distances"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-05
last_modified_at: 2022-10-05
---

<https://www.hackerrank.com/challenges/minimum-distances/problem?isFullScreen=true>

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
    static int minimumDistances(List<Integer> a) {
        int answer = a.size();
        for (int i = 0; i < a.size() - 1; i++) {
            for (int j = i + 1; j < a.size(); j++) {
                if (a.get(i).equals(a.get(j))) {
                    if (answer > j - i) {
                        answer = j - i;
                        break;
                    }
                }
            }
        }
        if (answer == a.size()) {
            answer = -1;
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> a = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            a.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(Result.minimumDistances(a));
        br.close();
    }
}
```