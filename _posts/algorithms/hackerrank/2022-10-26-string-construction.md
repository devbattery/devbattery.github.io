---
title: "[HackerRank] String Construction (Java)"
excerpt: "String Construction"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-26
last_modified_at: 2022-10-26
---

<https://www.hackerrank.com/challenges/c/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.stream.*;

class Result {
    static int stringConstruction(String s) {
        String p = "";
        int answer = 0;
        for (int i = 0; i < s.length(); i++) {
            if (!p.contains(s.substring(i, i+1))) {
                p = p.concat(s.substring(i, i + 1));
            }
        }
        answer = p.length();
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

                int result = Result.stringConstruction(s);

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