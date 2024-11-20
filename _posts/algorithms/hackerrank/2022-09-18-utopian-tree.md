---
title: "[HackerRank] Utopian Tree (Java)"
excerpt: "Utopian Tree"

categories:
  - HackerRank
tags:
  - [java, algorithms]

toc: true
toc_sticky: true

date: 2022-09-18
last_modified_at: 2022-09-18
---

<https://www.hackerrank.com/challenges/utopian-tree/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.stream.*;

class Result {
    public static int utopianTree(int n) {
        int answer = 1;
        if (n != 0) {
            for (int i = 1; i <= n; i++) {
                if (answer % 2 == 1) {
                    answer *= 2;
                } else {
                    answer++;
                }
            }
        }
        return answer;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int t = Integer.parseInt(bufferedReader.readLine().trim());

        IntStream.range(0, t).forEach(tItr -> {
            try {
                int n = Integer.parseInt(bufferedReader.readLine().trim());

                int result = Result.utopianTree(n);

                bufferedWriter.write(String.valueOf(result));
                bufferedWriter.newLine();
            } catch (IOException ex) {
                throw new RuntimeException(ex);
            }
        });

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```