---
title: "[Codeforces] 617A - Elephant (Java)"
excerpt: "Elephant"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-01
last_modified_at: 2022-12-01
---

<https://codeforces.com/problemset/problem/617/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    public static int returnMinStep(int x) {
        int minStep = 0;
        while (true) {
            if (x - 5 >= 0) {
                x -= 5;
                minStep++;
            } else if (x - 4 >= 0) {
                x -= 4;
                minStep++;
            } else if (x - 3 >= 0) {
                x -= 3;
                minStep++;
            } else if (x - 2 >= 0) {
                x -= 2;
                minStep++;
            } else if (x - 1 >= 0) {
                x--;
                minStep++;
            }

            if (x == 0) {
                return minStep;
            }
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int x = Integer.parseInt(br.readLine());
        System.out.print(returnMinStep(x));
        br.close();
    }
}
```