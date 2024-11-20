---
title: "[HackerRank] Intro to Tutorial Challenges (Java)"
excerpt: "Intro to Tutorial Challenges"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-11
last_modified_at: 2022-10-11
---

<https://www.hackerrank.com/challenges/tutorial-intro/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.toList;

class Result {
    static int introTutorial(int V, List<Integer> arr) {
        int answer = 0;
        for (int i = 0; i < arr.size(); i++) {
            if (V == arr.get(i)) {
                answer = i;
                break;
            }
        }
        return answer;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int V = Integer.parseInt(bufferedReader.readLine().trim());

        int n = Integer.parseInt(bufferedReader.readLine().trim());

        List<Integer> arr = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        int result = Result.introTutorial(V, arr);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```