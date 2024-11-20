---
title: "[HackerRank] Viral Advertising (Java)"
excerpt: "Viral Advertising"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-21
last_modified_at: 2022-09-21
---

<https://www.hackerrank.com/challenges/strange-advertising/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;

class Result {
    static int viralAdvertising(int n) {
        int answer = 0, person = 5;
        while (n-- > 0) {
            int interested = person / 2;
            person = interested * 3;
            answer += interested;
        }
        return answer;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int n = Integer.parseInt(bufferedReader.readLine().trim());

        int result = Result.viralAdvertising(n);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```