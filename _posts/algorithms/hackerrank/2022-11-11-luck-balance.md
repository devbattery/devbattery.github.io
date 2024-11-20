---
title: "[HackerRank] Luck Balance (Java)"
excerpt: "Luck Balance"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-11
last_modified_at: 2022-11-11
---

<https://www.hackerrank.com/challenges/luck-balance/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.toList;

class Result { 
    static int luckBalance(int k, List<List<Integer>> contests) {
        int answer = 0;
        List<Integer> list = new ArrayList<>();
        for (List<Integer> integers : contests) {
            if (integers.get(1) == 1) {
                list.add(integers.get(0));
            } else {
                answer += integers.get(0);
            }
        }
        list.sort(Collections.reverseOrder());
        for (int i = 0; i < list.size(); i++) {
            answer += ((i < k) ? 1 : -1) * (list.get(i));
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

        int k = Integer.parseInt(firstMultipleInput[1]);

        List<List<Integer>> contests = new ArrayList<>();

        IntStream.range(0, n).forEach(i -> {
            try {
                contests.add(
                        Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                                .map(Integer::parseInt)
                                .collect(toList())
                );
            } catch (IOException ex) {
                throw new RuntimeException(ex);
            }
        });

        int result = Result.luckBalance(k, contests);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```