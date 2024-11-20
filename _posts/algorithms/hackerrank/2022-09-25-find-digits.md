---
title: "[HackerRank] Find Digits (Java)"
excerpt: "Find Digits"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-25
last_modified_at: 2022-09-25
---

<https://www.hackerrank.com/challenges/find-digits/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.math.*;
import java.security.*;
import java.text.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.stream.*;

import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toList;

class Result {
    static int findDigits(int nX) {
        String nString = nX + "";
        int answer = 0;
        for (int i = 0; i < nString.length(); i++) {
            int nStringArray = nString.charAt(i) - '0'; // int -> int array
            if (nStringArray != 0) {
                if (nX % nStringArray == 0) {
                    answer++;
                }
            }
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
                int n = Integer.parseInt(bufferedReader.readLine().trim());

                int result = Result.findDigits(n);

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