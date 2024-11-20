---
title: "[HackerRank] Java If-Else"
excerpt: "Java If-Else"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-14
last_modified_at: 2022-06-14
---

<https://www.hackerrank.com/challenges/java-if-else/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

public class Solution {

    public static void main(String[] args) throws IOException {
        try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in))) {
            int n = Integer.parseInt(bufferedReader.readLine());

            if (n % 2 == 1 || (n >= 6 && n <= 20)) {
                System.out.println("Weird");
            } else {
                System.out.println("Not Weird");
            }
        }
    }
}
```