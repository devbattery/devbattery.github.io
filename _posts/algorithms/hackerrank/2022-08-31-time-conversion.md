---
title: "[HackerRank] Time Conversion (Java)"
excerpt: "Time Conversion"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-31
last_modified_at: 2022-08-31
---

<https://www.hackerrank.com/challenges/time-conversion/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

class Result {
    static String timeConversion(String s) {
        String answer = "";
        int hour = Integer.parseInt(s.substring(0, 2)) % 12;
        if (s.contains("PM")) {
            hour += 12;
        }
        if (hour < 10) {
            answer = "0" + hour + s.substring(2, 8);
        } else {
            answer = hour + s.substring(2, 8);
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        System.out.print(Result.timeConversion(s));
        br.close();
    }
}
```