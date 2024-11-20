---
title: "[HackerRank] Funny String (Java)"
excerpt: "Funny String"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-17
last_modified_at: 2022-10-17
---

<https://www.hackerrank.com/challenges/funny-string/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.stream.*;

class Result {
    static String funnyString(String s) {
        String answer = "Funny";
        for (int i = 0; i < s.length() - 1; i++) {
            if (Math.abs(s.charAt(i) - s.charAt(i + 1)) !=
                    (Math.abs(s.charAt(s.length() - 1 - i) - s.charAt(s.length() - 2 - i)))) {
                answer = "Not Funny";
                break;
            }
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

                String result = Result.funnyString(s);

                bufferedWriter.write(result);
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