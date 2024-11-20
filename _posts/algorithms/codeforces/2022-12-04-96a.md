---
title: "[Codeforces] 96A - Football (Java)"
excerpt: "Football"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-04
last_modified_at: 2022-12-04
---

<https://codeforces.com/problemset/problem/96/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    public static String isMoreSeven(String input) {
        int count = 1;
        for (int i = 0; i < input.length() - 1; i++) {
            if (input.charAt(i) == input.charAt(i + 1)) {
                count++;
            } else {
                count = 1;
            }

            if (count == 7) {
                return "YES";
            }
        }
        return "NO";
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine();
        System.out.print(isMoreSeven(input));
        br.close();
    }
}
```