---
title: "[HackerRank] Marc's Cakewalk (Java)"
excerpt: "Marc's Cakewalk"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-07
last_modified_at: 2022-11-07
---

<https://www.hackerrank.com/challenges/marcs-cakewalk/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*; 
import static java.util.stream.Collectors.toList;

class Result {
    static long marcsCakewalk(List<Integer> calorie) {
        calorie.sort(Collections.reverseOrder());
        long result = 0;
        for (int i = 0; i < calorie.size(); i++) {
            result += Math.pow(2, i) * calorie.get(i);
        }
        return result;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int n = Integer.parseInt(bufferedReader.readLine().trim());

        List<Integer> calorie = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        long result = Result.marcsCakewalk(calorie);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}

```