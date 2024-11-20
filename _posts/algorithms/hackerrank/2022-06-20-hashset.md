---
title: "[HackerRank] Java HashSet"
excerpt: "Java HashSet"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-20
last_modified_at: 2022-06-20
---

<https://www.hackerrank.com/challenges/java-hashset/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.text.*;
import java.math.*;
import java.util.regex.*;

public class Solution {

    public static void main(String[] args) {
        try (Scanner s = new Scanner(System.in)) {
            int t = s.nextInt();
            String[] pair_left = new String[t];
            String[] pair_right = new String[t];

            for (int i = 0; i < t; i++) {
                pair_left[i] = s.next();
                pair_right[i] = s.next();
            }

            HashSet<String> pairs = new HashSet<>(t);

            for (int i = 0; i < t; i++) {
                pairs.add("(" + pair_left[i] + ", " + pair_right[i] + ")");
                System.out.println(pairs.size());
            }
        }
    }
}
```