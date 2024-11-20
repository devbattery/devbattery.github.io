---
title: "[HackerRank] Insertion Sort - Part 2 (Java)"
excerpt: "Insertion Sort - Part 2"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-13
last_modified_at: 2022-10-13
---

<https://www.hackerrank.com/challenges/insertionsort2/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.stream.*;

import static java.util.stream.Collectors.toList;

class Result {
    static void insertionSort2(int n, List<Integer> arr) {
        for (int i = 1; i < n; i++) {
            if (arr.get(i) < arr.get(i - 1)) {
                int tmp = arr.get(i);
                for (int j = i - 1; j >= 0; j--) {
                    if (tmp < arr.get(j)) {
                        arr.set(j + 1, arr.get(j));
                        arr.set(j, tmp);
                    }
                }
            }
            for (Integer integer : arr) {
                System.out.print(integer + " ");
            }
            System.out.println();
        }
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));

        int n = Integer.parseInt(bufferedReader.readLine().trim());

        List<Integer> arr = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        Result.insertionSort2(n, arr);

        bufferedReader.close();
    }
}
```