---
title: "[HackerRank] Counting Sort 2 (Java)"
excerpt: "Counting Sort 2"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-25
last_modified_at: 2022-10-25
---

<https://www.hackerrank.com/challenges/countingsort2/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toList;

class Result {
    static List<Integer> countingSort(List<Integer> arr) {
        int[] counter = new int[100];
        int count = 0;
        for (Integer i : arr) {
            counter[i]++;
        }
        for (int i = 0; i < counter.length; i++) {
            for (int j = 0; j < counter[i]; j++) {
                arr.set(count, i);
                count++;
            }
        }
        return arr; 
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

        List<Integer> result = Result.countingSort(arr);

        bufferedWriter.write(
                result.stream()
                        .map(Object::toString)
                        .collect(joining(" "))
                        + "\n"
        );

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```