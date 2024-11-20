---
title: "[HackerRank] Java Subarray"
excerpt: "Java Subarray"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-10
last_modified_at: 2022-06-10
---

<https://www.hackerrank.com/challenges/java-negative-subarray/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

public class Solution {

    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            int n = scanner.nextInt();
            int[] arr = new int[n];
            int count = 0;

            for (int i = 0; i < n; i++) {
                arr[i] = scanner.nextInt();
            }

            for (int i = 0; i < n; i++) {
                int sum = 0;

                for (int j = i; j < n; j++) {
                    sum += arr[j];

                    if (sum < 0) {
                        count++;
                    }
                }
            }

            System.out.println(count);
        }
    }
}
```