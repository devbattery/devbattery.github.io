---
title: "[HackerRank] Subarray Division (Java)"
excerpt: "Subarray Division"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-07
last_modified_at: 2022-09-07
---

<https://www.hackerrank.com/challenges/the-birthday-bar/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.toList;

class Result {
    static int birthday(List<Integer> s, int d, int m) {
        int answer = 0;
        for (int i = 0; i < s.size(); i++) {
            int limit = i + m;
            if (limit > s.size()) {
                break;
            }

            int sum = 0;
            for (int j = i; j < limit; j++) {
                sum += s.get(j);
            }

            if (sum == d) {
                answer++;
            }
        }
        return answer;
    }

}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int n = Integer.parseInt(bufferedReader.readLine().trim());

        List<Integer> s = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        String[] firstMultipleInput = bufferedReader.readLine().replaceAll("\\s+$", "").split(" ");

        int d = Integer.parseInt(firstMultipleInput[0]);

        int m = Integer.parseInt(firstMultipleInput[1]);

        int result = Result.birthday(s, d, m);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```