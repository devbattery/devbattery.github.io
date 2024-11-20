---
title: "[Codeforces] 236A - Boy or Girl (Java)"
excerpt: "Boy or Girl"

categories:
  - Codeforces
tags:
  - [java, algorithms]

toc: true
toc_sticky: true

date: 2022-11-27
last_modified_at: 2022-11-27
---

<https://codeforces.com/problemset/problem/236/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    public static String isOddOrEven(String input) {
        // Odd: IGNORE HIM!
        // Even: CHAT WITH HER!
        String tmp = "";
        for (int i = 0; i < input.length(); i++) {
            if (input.indexOf(input.charAt(i)) == i) {
                tmp += input.charAt(i);
            } 
        } 
        return (tmp.length() % 2 == 0) ? "CHAT WITH HER!" : "IGNORE HIM!";
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine();
        System.out.print(isOddOrEven(input));
        br.close();
    }
}
```