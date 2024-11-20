---
title: "[HackerRank] Sherlock and Squares (Java)"
excerpt: "Sherlock and Squares"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-02
last_modified_at: 2022-10-02
---

<https://www.hackerrank.com/challenges/sherlock-and-squares/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.stream.*;

class Result {
    static int squares(int a, int b) {
        int answer = 0;
        int x = 1;
        while (x * x < a) {
            x++;
        }
        while (x * x <= b) {
            answer++;
            x++;
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
                String[] firstMultipleInput = bufferedReader.readLine().replaceAll("\\s+$", "").split(" ");

                int a = Integer.parseInt(firstMultipleInput[0]);

                int b = Integer.parseInt(firstMultipleInput[1]);

                int result = Result.squares(a, b);

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