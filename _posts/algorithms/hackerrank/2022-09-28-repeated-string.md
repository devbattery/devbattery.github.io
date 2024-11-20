---
title: "[HackerRank] Repeated String (Java)"
excerpt: "Repeated String"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-28
last_modified_at: 2022-09-28
---

<https://www.hackerrank.com/challenges/repeated-string/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

class Result {
    static long repeatedString(String s, long n) {
        long answer = n / s.length();
        long left = n - (s.length() * answer);
        int extra = 0;
        int count = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == 'a') {
                count++;
            }
        }
        for (int i = 0; i < left; i++) {
            if (s.charAt(i) == 'a') {
                extra++;
            }
        }
        answer = extra + (answer * count);
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        long n = Long.parseLong(br.readLine());
        System.out.print(Result.repeatedString(s, n));
        br.close();
    }
}
```