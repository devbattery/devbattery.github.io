---
title: "[HackerRank] Lonely Integer (Java)"
excerpt: "Lonely Integer"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-28
last_modified_at: 2022-10-28
---

<https://www.hackerrank.com/challenges/lonely-integer/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*; 
import java.util.*; 
import java.util.stream.*;
import static java.util.stream.Collectors.toList;

class Result {
    static int lonelyinteger(List<Integer> a) {
        int[] arr = new int[100];
        int res = 0;
        for (Integer integer : a) {
            arr[integer]++;
        } 
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] % 2 != 0) {
                res = i;
                break;
            }
        }
        return res;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int n = Integer.parseInt(bufferedReader.readLine().trim());

        List<Integer> a = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        int result = Result.lonelyinteger(a);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```