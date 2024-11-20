---
title: "[HackerRank] Service Lane (Java)"
excerpt: "Service Lane"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-08
last_modified_at: 2022-10-08
---

<https://www.hackerrank.com/challenges/jumping-on-the-clouds/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toList;

class Result {
    static List<Integer> serviceLane(int n, List<List<Integer>> cases, List<Integer> width) {
        List<Integer> answer = new ArrayList<>();
        for (int i = 0; i < cases.size(); i++) {
            int entry = cases.get(i).get(0);
            int exit = cases.get(i).get(1);
            int min = Integer.MAX_VALUE;
            for (int j = entry; j <= exit; j++) {
                if (width.get(j) < min) {
                    min = width.get(j);
                }
            }
            answer.add(min);
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

        int t = Integer.parseInt(firstMultipleInput[1]);

        List<Integer> width = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        List<List<Integer>> cases = new ArrayList<>();

        IntStream.range(0, t).forEach(i -> {
            try {
                cases.add(
                        Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                                .map(Integer::parseInt)
                                .collect(toList())
                );
            } catch (IOException ex) {
                throw new RuntimeException(ex);
            }
        });

        List<Integer> result = Result.serviceLane(n, cases, width);

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