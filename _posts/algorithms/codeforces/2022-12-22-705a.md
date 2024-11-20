---
title: "[Codeforces] 705A - Hulk (Java)"
excerpt: "Hulk"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-22
last_modified_at: 2022-12-22
---

<https://codeforces.com/problemset/problem/705/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    static void printFeeling(int n) {
        // n == 1 : I hate it
        // n == 2 Even : I hate (that I love) it
        // n == 3 Odd : I hate (that I love) (that I hate) it
        for (int i = 1; i <= n; i++) {
            if (i % 2 == 1) { // Odd
                System.out.print("I hate ");
            } else { // Even
                System.out.print("I love ");
            }

            if (i != n) {
                System.out.print("that ");
            } else {
                System.out.print("it ");
            }
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        printFeeling(n);
        br.close();
    }
}
```