---
title: "[HackerRank] Flipping bits (Java)"
excerpt: "Flipping bits"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-01
last_modified_at: 2022-11-01
---

<https://www.hackerrank.com/challenges/flipping-bits/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.ArrayList; 
import java.util.List;
import java.util.stream.*;

class Result {
    static long flippingBits(long n) {
        long answer = 0;
        List<Integer> list = new ArrayList<>();
        for (int i = 0; i < 32; i++) {
            list.add(1);
        }
        int tmp = 1;
        while (n > 0) {
            if (n % 2 == 1) {
                list.set(list.size() - tmp, 0);
            } else {
                list.set(list.size() - tmp, 1);
            }
            n /= 2;
            tmp++;
        }
        while (list.size() > 0) {
            answer += Math.pow(2, list.size() - 1) * list.remove(0);
        }
        return answer;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int q = Integer.parseInt(bufferedReader.readLine().trim());

        IntStream.range(0, q).forEach(qItr -> {
            try {
                long n = Long.parseLong(bufferedReader.readLine().trim());

                long result = Result.flippingBits(n);

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