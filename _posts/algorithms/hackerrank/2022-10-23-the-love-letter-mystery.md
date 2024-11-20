---
title: "[HackerRank] The Love-Letter Mystery (Java)"
excerpt: "The Love-Letter Mystery"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-23
last_modified_at: 2022-10-23
---

<https://www.hackerrank.com/challenges/the-love-letter-mystery/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.stream.*;

class Result {
    static int theLoveLetterMystery(String s) {
        int answer = 0;
        for (int i = 0, j = s.length() - 1; i < s.length() / 2; i++, j--) {
            answer += Math.abs(s.charAt(i) - s.charAt(j));
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
                String s = bufferedReader.readLine();

                int result = Result.theLoveLetterMystery(s);

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