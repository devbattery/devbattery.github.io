---
title: "[HackerRank] Happy Ladybugs (Java)"
excerpt: "Happy Ladybugs"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-05
last_modified_at: 2022-11-05
---

<https://www.hackerrank.com/challenges/happy-ladybugs/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.stream.*;

class Result {
    static String happyLadybugs(String b) {
        int count[] = new int[26];
        for (int i = 0; i < b.length(); i++) {
            if (b.charAt(i) != '_') {
                count[b.charAt(i) - 'A']++;
            }
        }
        for (int i : count) {
            if (i == 1) {
                return "NO";
            }
        }
        if (!b.contains("_")) {
            for (int i = 1; i < b.length() - 1; i++) {
                if (b.charAt(i) != b.charAt(i - 1) && b.charAt(i) != b.charAt(i + 1)) {
                    return "NO";
                }
            }
        }
        return "YES";
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int g = Integer.parseInt(bufferedReader.readLine().trim());

        IntStream.range(0, g).forEach(gItr -> {
            try {
                int n = Integer.parseInt(bufferedReader.readLine().trim());

                String b = bufferedReader.readLine();

                String result = Result.happyLadybugs(b);

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