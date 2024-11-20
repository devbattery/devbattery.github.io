---
title: "[Codeforces] 133A - HQ9+ (Java)"
excerpt: "HQ9+"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-18
last_modified_at: 2022-12-18
---

<https://codeforces.com/problemset/problem/133/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    static String isHQ9Plus(String input) {
        if (input.contains("H") || input.contains("Q") || input.contains("9")) {
            return "YES";
        }
        return "NO";
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine();
        System.out.print(isHQ9Plus(input));
        br.close();
    }
}
```