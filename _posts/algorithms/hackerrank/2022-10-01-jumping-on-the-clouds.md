---
title: "[HackerRank] Jumping on the Clouds (Java)"
excerpt: "Jumping on the Clouds"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-01
last_modified_at: 2022-10-01
---

<https://www.hackerrank.com/challenges/jumping-on-the-clouds/problem?isFullScreen=true>

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
    static int jumpingOnClouds(List<Integer> c) {
        int answer = -1;
        for (int i = 0; i < c.size(); i++, answer++) {
            if (i < c.size() - 2 && c.get(i + 2) == 0) {
                i++;
            }
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> c = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            c.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(Result.jumpingOnClouds(c));
        br.close();
    }
}
```