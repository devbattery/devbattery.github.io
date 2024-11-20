---
title: "[HackerRank] Mars Exploration (Java)"
excerpt: "Mars Exploration"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-15
last_modified_at: 2022-10-15
---

<https://www.hackerrank.com/challenges/mars-exploration/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

class Result {
    static int marsExploration(String s) {
        int answer = 0;
        String sos = "SOS";
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) != sos.charAt(i % 3)) {
                answer++;
            }
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        System.out.print(Result.marsExploration(s));
        br.close();
    }
}
```