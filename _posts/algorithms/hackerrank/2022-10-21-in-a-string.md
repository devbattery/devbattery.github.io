---
title: "[HackerRank] in a String! (Java)"
excerpt: "in a String!"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-21
last_modified_at: 2022-10-21
---

<https://www.hackerrank.com/challenges/hackerrank-in-a-string/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.stream.*;

class Result {
    static String hackerrankInString(String s) {
        String answer;
        String str = "hackerrank";
        int j = 0;
        for (int i = 0; i < s.length(); i++) {
            if (j < str.length() && s.charAt(i) == str.charAt(j)) {
                j++;
            }
        }

        if (j == str.length()) {
            answer = "YES";
        } else {
            answer = "NO";
        }

        if (s.length() < str.length()) {
            answer =  "NO";
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

                String result = Result.hackerrankInString(s);

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