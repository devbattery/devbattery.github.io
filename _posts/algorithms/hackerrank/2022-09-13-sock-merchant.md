---
title: "[HackerRank] Sales by Match (Java)"
excerpt: "Sales by Match"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-13
last_modified_at: 2022-09-13
---

<https://www.hackerrank.com/challenges/sock-merchant/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.toList;

class Result {
    public static int sockMerchant(int n, List<Integer> ar) {
        int answer = 0;
        Set<Integer> colors = new HashSet<>();
        for (int i = 0; i < n; i++) {
            if (!colors.contains(ar.get(i))) {
                colors.add(ar.get(i));
            } else {
                answer++;
                colors.remove(ar.get(i));
            }
        }
        return answer;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int n = Integer.parseInt(bufferedReader.readLine().trim());

        List<Integer> ar = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        int result = Result.sockMerchant(n, ar);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```