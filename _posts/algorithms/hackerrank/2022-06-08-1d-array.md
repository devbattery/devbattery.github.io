---
title: "[HackerRank] Java 1D Array"
excerpt: "Java 1D Array"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-08
last_modified_at: 2022-06-08
---

<https://www.hackerrank.com/challenges/java-1d-array-introduction/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.math.BigInteger;
import java.util.*;

public class Solution {

    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(bufferedReader.readLine());
        int[] nArr = new int[n];

        for (int i = 0; i < nArr.length; i++) {
            nArr[i] = Integer.parseInt(bufferedReader.readLine());
        }

        for (int v : nArr) {
            System.out.println(v);
        }
        bufferedReader.close();
    }
}
```