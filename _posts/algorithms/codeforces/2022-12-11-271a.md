---
title: "[Codeforces] 271A - Beautiful Year (Java)"
excerpt: "Beautiful Year"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-11
last_modified_at: 2022-12-11
---

<https://codeforces.com/problemset/problem/271/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    static String returnBeautifulYear(String y) {
        for (int i = 1000; i <= 9000; i++) {
            y = String.valueOf(Integer.parseInt(y) + 1);
            if (y.charAt(0) != y.charAt(1) && y.charAt(0) != y.charAt(2)
            && y.charAt(0) != y.charAt(3) && y.charAt(1) != y.charAt(2)
            && y.charAt(1) != y.charAt(3) && y.charAt(2) != y.charAt(3)) {
                break;
            }
        }
        return y;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String y = br.readLine();
        System.out.print(returnBeautifulYear(y));
        br.close();
    }
}
```