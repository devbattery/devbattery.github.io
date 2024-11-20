---
title: "[HackerRank] Chocolate Feast (Java)"
excerpt: "Chocolate Feast"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-07
last_modified_at: 2022-10-07
---

<https://www.hackerrank.com/challenges/chocolate-feast/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.stream.*;

class Result {
    static int chocolateFeast(int n, int c, int m) {
        int answer = n / c;
        int num = n / c;
        while (num >= m) {
            answer += num / m;
            num = num / m + num % m;
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
                String[] firstMultipleInput = bufferedReader.readLine().replaceAll("\\s+$", "").split(" ");

                int n = Integer.parseInt(firstMultipleInput[0]);

                int c = Integer.parseInt(firstMultipleInput[1]);

                int m = Integer.parseInt(firstMultipleInput[2]);

                int result = Result.chocolateFeast(n, c, m);

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