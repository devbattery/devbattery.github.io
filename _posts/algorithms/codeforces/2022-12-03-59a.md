---
title: "[Codeforces] 59A - Word (Java)"
excerpt: "Word"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-03
last_modified_at: 2022-12-03
---

<https://codeforces.com/problemset/problem/59/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    public static String returnUpperOrLower(String input) {
        // upper num == lower num -> to lower
        // upper num != lower num -> to upper
        int countIsUpper = 0;
        for (int i = 0; i < input.length(); i++) {
            if (Character.isUpperCase(input.charAt(i))) {
                countIsUpper++;
            }
        }
        // Final
        if (countIsUpper <= input.length() - countIsUpper) { // countIsLower == input.length() - countIsUpper
            return input.toLowerCase();
        } else {
            return input.toUpperCase();
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine();
        System.out.print(returnUpperOrLower(input));
        br.close();
    }
}
```