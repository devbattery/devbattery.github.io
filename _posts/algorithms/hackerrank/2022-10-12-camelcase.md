---
title: "[HackerRank] CamelCase (Java)"
excerpt: "CamelCase"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-12
last_modified_at: 2022-10-12
---

<https://www.hackerrank.com/challenges/camelcase/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

class Result {
    static int camelcase(String s) {
        int answer = 1;
        for (int i = 0; i < s.length(); i++) {
            String letter = Character.toString(s.charAt(i));
            if (letter.equals(letter.toUpperCase())) {
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
        System.out.print(Result.camelcase(s));
        br.close();
    }
}
```