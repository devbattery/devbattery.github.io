---
title: "[HackerRank] Counting Sort 1 (Java)"
excerpt: "Counting Sort 1"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-24
last_modified_at: 2022-10-24
---

<https://www.hackerrank.com/challenges/countingsort1/problem?isFullScreen=true>

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
        List<Integer> answer = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            answer.add(0);
        }
        for (int i = 0; i < arr.size(); i++) {
            int index = arr.get(i);
            answer.set(index, answer.get(arr.get(i)) + 1);
        }
        return answer;
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