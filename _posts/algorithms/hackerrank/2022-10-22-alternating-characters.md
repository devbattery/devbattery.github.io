---
title: "[HackerRank] Alternating Characters (Java)"
excerpt: "Alternating Characters"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-22
last_modified_at: 2022-10-22
---

<https://www.hackerrank.com/challenges/alternating-characters/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.stream.*;

class Result {
    static int alternatingCharacters(String s) {
        int answer = 0;
        char last = s.charAt(0);
        for (int i = 1; i < s.length(); i++) {
            if (s.charAt(i) == last) {
                answer++;
            }
            last = s.charAt(i);
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

                int result = Result.alternatingCharacters(s);

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