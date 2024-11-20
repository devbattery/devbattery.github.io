---
title: "[HackerRank] Libary Fine (Java)"
excerpt: "Libary Fine"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-29
last_modified_at: 2022-09-29
---

<https://www.hackerrank.com/challenges/library-fine/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;

class Result {
    static int libraryFine(int d1, int m1, int y1, int d2, int m2, int y2) {
        int answer = 0;
        if (y1 > y2) {
            answer = 10000;
        } else if (y1 == y2 && m1 > m2) {
            answer = 500 * (m1 - m2);
        } else if (y1 == y2 && m2 == m1 && d1 > d2) {
            answer = 15 * (d1 - d2);
        }
        return answer;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        String[] firstMultipleInput = bufferedReader.readLine().replaceAll("\\s+$", "").split(" ");

        int d1 = Integer.parseInt(firstMultipleInput[0]);

        int m1 = Integer.parseInt(firstMultipleInput[1]);

        int y1 = Integer.parseInt(firstMultipleInput[2]);

        String[] secondMultipleInput = bufferedReader.readLine().replaceAll("\\s+$", "").split(" ");

        int d2 = Integer.parseInt(secondMultipleInput[0]);

        int m2 = Integer.parseInt(secondMultipleInput[1]);

        int y2 = Integer.parseInt(secondMultipleInput[2]);

        int result = Result.libraryFine(d1, m1, y1, d2, m2, y2);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```