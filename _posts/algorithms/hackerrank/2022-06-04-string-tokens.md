---
title: "[HackerRank] Java String Tokens"
excerpt: "Java String Tokens"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-04
last_modified_at: 2022-06-04
---

<https://www.hackerrank.com/challenges/java-string-tokens/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

public class Solution {

    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        String str = bufferedReader.readLine();

        if (str.trim().length() < 1 || str.trim().length() > 4 * Math.pow(10, 5)) {
            return;
        }

        String[] strArr = str.trim().split("[ !,?._'@]+");
        int count = strArr.length;
        System.out.println(count);
        for (String value : strArr) {
            System.out.println(value);
        }
    }
}
```