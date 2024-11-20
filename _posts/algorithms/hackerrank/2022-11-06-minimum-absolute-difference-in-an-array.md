---
title: "[HackerRank] Minimum Absolute Difference in an Array (Java)"
excerpt: "Minimum Absolute Difference in an Array"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-06
last_modified_at: 2022-11-06
---

<https://www.hackerrank.com/challenges/minimum-absolute-difference-in-an-array/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.toList;

class Result {
    static int minimumAbsoluteDifference(List<Integer> arr) {
        Collections.sort(arr);
        int min = Math.abs(arr.get(0) - arr.get(1));
        for (int i = 0; i < arr.size() - 1; i++) {
            min = Math.min(min, Math.abs(arr.get(i + 1) - arr.get(i)));
            if (min == 0) {
                return 0;
            }
        }
        return min;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int n = Integer.parseInt(bufferedReader.readLine().trim());

        List<Integer> arr = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        int result = Result.minimumAbsoluteDifference(arr);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```