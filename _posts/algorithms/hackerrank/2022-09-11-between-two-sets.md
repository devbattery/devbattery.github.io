---
title: "[HackerRank] Between Two Sets (Java)"
excerpt: "Between Two Sets"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-11
last_modified_at: 2022-09-11
---

<https://www.hackerrank.com/challenges/between-two-sets/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.toList;

class Result {
    static int getTotalX(List<Integer> a, List<Integer> b) {
        int answer = 0;
        for (int i = a.get(a.size() - 1); i <= b.get(0); i++) {
            boolean flag1 = true, flag2 = true;
            for (Integer integer : a) {
                if (i % integer != 0) {
                    flag1 = false;
                    break;
                }
            }
            for (Integer integer : b) {
                if (integer % i != 0) {
                    flag2 = false;
                    break;
                }
            }
            if (flag1 && flag2) {
                answer++;
            }
        }
        return answer;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        String[] firstMultipleInput = bufferedReader.readLine().replaceAll("\\s+$", "").split(" ");

        int n = Integer.parseInt(firstMultipleInput[0]);

        int m = Integer.parseInt(firstMultipleInput[1]);

        List<Integer> arr = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        List<Integer> brr = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        int total = Result.getTotalX(arr, brr);

        bufferedWriter.write(String.valueOf(total));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```