---
title: "[HackerRank] Picking Numbers (Java)"
excerpt: "Picking Numbers"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-16
last_modified_at: 2022-09-16
---

<https://www.hackerrank.com/challenges/picking-numbers/problem?isFullScreen=true>

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
    static int pickingNumbers(List<Integer> a) {
        int answer = 0, count = 0;
        Collections.sort(a);
        for (int i = 0; i < a.size(); i++) {
            for (int j = i; j < a.size(); j++) {
                if (a.get(j) - a.get(i) <= 1) {
                    count++;
                }
            }
            if (count > answer) {
                answer = count;
            }
            count = 0;
        }
        return answer;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> a = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            a.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(Result.pickingNumbers(a));
        br.close();
    }
}
```