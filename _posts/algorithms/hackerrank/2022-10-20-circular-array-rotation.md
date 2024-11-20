---
title: "[HackerRank] Circular Array Rotation (Java)"
excerpt: "Circular Array Rotation"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-20
last_modified_at: 2022-10-20
---

<https://www.hackerrank.com/challenges/circular-array-rotation/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toList;

class Result {
    static List<Integer> circularArrayRotation(List<Integer> a, int k, List<Integer> queries) {
        k %= a.size();
        for (int i = 0; i < queries.size(); i++) {
            int index = queries.get(i);
            int rem = index - k;
            if (rem < 0) {
                rem += a.size();
            }
            queries.set(i, a.get(rem));
        }
        return queries;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        String[] firstMultipleInput = bufferedReader.readLine().replaceAll("\\s+$", "").split(" ");

        int n = Integer.parseInt(firstMultipleInput[0]);

        int k = Integer.parseInt(firstMultipleInput[1]);

        int q = Integer.parseInt(firstMultipleInput[2]);

        List<Integer> a = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        List<Integer> queries = IntStream.range(0, q).mapToObj(i -> {
                    try {
                        return bufferedReader.readLine().replaceAll("\\s+$", "");
                    } catch (IOException ex) {
                        throw new RuntimeException(ex);
                    }
                })
                .map(String::trim)
                .map(Integer::parseInt)
                .collect(toList());

        List<Integer> result = Result.circularArrayRotation(a, k, queries);

        bufferedWriter.write(
                result.stream()
                        .map(Object::toString)
                        .collect(joining("\n"))
                        + "\n"
        );

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```