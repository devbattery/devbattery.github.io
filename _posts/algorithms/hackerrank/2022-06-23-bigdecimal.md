---
title: "[HackerRank] Java BigDecimal"
excerpt: "Java BigDecimal"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-23
last_modified_at: 2022-06-23
---

<https://www.hackerrank.com/challenges/java-bigdecimal/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.*;

public class Solution {

    public static void main(String[] args) throws IOException {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(System.in))) {
            int n = Integer.parseInt(br.readLine());
            String[] s = new String[n];

            for (int i = 0; i < n; i++) {
                s[i] = br.readLine();
            }

            Arrays.sort(s, Collections.reverseOrder(new Comparator<String>() {
                @Override
                public int compare(String o1, String o2) {
                    BigDecimal a = new BigDecimal(o1);
                    BigDecimal b = new BigDecimal(o2);
                    return a.compareTo(b);
                }
            }));

            for (int i = 0; i < n; i++) {
                System.out.println(s[i]);
            }
        }
    }
}
```