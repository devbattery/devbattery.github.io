---
title: "[HackerRank] Java BigInteger"
excerpt: "Java BigInteger"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-07
last_modified_at: 2022-06-07
---

<https://www.hackerrank.com/challenges/java-biginteger/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.math.BigInteger;
import java.util.*;

public class Solution {

    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BigInteger b1 = new BigInteger(bufferedReader.readLine());
        BigInteger b2 = new BigInteger(bufferedReader.readLine());

        System.out.println(b1.add(b2));
        System.out.println(b1.multiply(b2));
        bufferedReader.close();
    }
}
```