---
title: "[HackerRank] Maximizing XOR (Java)"
excerpt: "Maximizing XOR"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-30
last_modified_at: 2022-10-30
---

<https://www.hackerrank.com/challenges/maximizing-xor/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;

class Result {
    static int maximizingXor(int l, int r) {
        int mx = 0;
        for (int i = l; i < r; i++) {
            for (int j = i + 1; j <= r; j++) {
                mx = Math.max(mx, i ^ j);
            }
        }
        return mx;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int l = Integer.parseInt(bufferedReader.readLine().trim());

        int r = Integer.parseInt(bufferedReader.readLine().trim());

        int result = Result.maximizingXor(l, r);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```