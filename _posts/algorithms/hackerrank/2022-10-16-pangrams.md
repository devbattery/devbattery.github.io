---
title: "[HackerRank] Pangrams (Java)"
excerpt: "Pangrams"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-16
last_modified_at: 2022-10-16
---

<https://www.hackerrank.com/challenges/pangrams/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;

class Result {
    static String pangrams(String s) {
        char[] alp = "abcdefghijklmnopqrstuvwxyz".toCharArray();
        String answer = "pangram";
        for (int i = 0; i < alp.length; i++) {
            if (!s.toLowerCase().contains(alp[i] + "")) {
                answer = "not pangram";
            }
        }
        return answer;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        String s = bufferedReader.readLine();

        String result = Result.pangrams(s);

        bufferedWriter.write(result);
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```