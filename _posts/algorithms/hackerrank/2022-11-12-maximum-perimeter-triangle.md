---
title: "[HackerRank] Maximum Perimeter Triangle (Java)"
excerpt: "Maximum Perimeter Triangle"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2022-11-12
last_modified_at: 2022-11-12
---

<https://www.hackerrank.com/challenges/maximum-perimeter-triangle/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toList;

class Result {
    static List<Integer> maximumPerimeterTriangle(List<Integer> sticks) {
        Collections.sort(sticks);
        List<Integer> answer = new ArrayList<>();
        for (int i = sticks.size() - 1; i >= 2; i--) {
            int a = sticks.get(i);
            int b = sticks.get(i - 1);
            int c = sticks.get(i - 2);
            if (a + b > c && a + c > b && b + c > a) {
                answer.add(c);
                answer.add(b);
                answer.add(a);
                break;
            }
        }
        if (answer.size() != 0) {
            return answer;
        } else {
            answer.add(-1);
        }
        return answer;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int n = Integer.parseInt(bufferedReader.readLine().trim());

        List<Integer> sticks = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        List<Integer> result = Result.maximumPerimeterTriangle(sticks);

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