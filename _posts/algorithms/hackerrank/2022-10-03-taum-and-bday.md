---
title: "[HackerRank] Taum and B'day (Java)"
excerpt: "Taum and B'day"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-03
last_modified_at: 2022-10-03
---

<https://www.hackerrank.com/challenges/taum-and-bday/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.stream.*;

class Result {
    static long taumBday(long b, long w, long bc, long wc, long z) {
        long answer = 0;
        long bTotal = b * bc;
        long wTotal = w * wc;
        bTotal = Math.min(b * (wc + z), bTotal);
        wTotal = Math.min(w * (bc + z), wTotal);
        answer = bTotal + wTotal;
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

                int b = Integer.parseInt(firstMultipleInput[0]);

                int w = Integer.parseInt(firstMultipleInput[1]);

                String[] secondMultipleInput = bufferedReader.readLine().replaceAll("\\s+$", "").split(" ");

                int bc = Integer.parseInt(secondMultipleInput[0]);

                int wc = Integer.parseInt(secondMultipleInput[1]);

                int z = Integer.parseInt(secondMultipleInput[2]);

                long result = Result.taumBday(b, w, bc, wc, z);

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