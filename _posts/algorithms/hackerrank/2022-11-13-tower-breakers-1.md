---
title: "[HackerRank] Tower Breakers (Java)"
excerpt: "Tower Breakers"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2022-11-13
last_modified_at: 2022-11-13
---
<https://www.hackerrank.com/challenges/tower-breakers-1/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.stream.*; 

class Result {
    public static int towerBreakers(int n, int m) {
        if (m == 1) { 
            return 2;
        }
        return (n % 2 == 1) ? 1 : 2;
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

                int n = Integer.parseInt(firstMultipleInput[0]);

                int m = Integer.parseInt(firstMultipleInput[1]);

                int result = Result.towerBreakers(n, m);

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