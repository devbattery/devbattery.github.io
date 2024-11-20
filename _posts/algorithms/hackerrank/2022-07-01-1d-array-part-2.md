---
title: "[HackerRank] Java 1D Array (Part 2)"
excerpt: "Java 1D Array (Part 2)"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-07-01
last_modified_at: 2022-07-01
---

<https://www.hackerrank.com/challenges/java-1d-array/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Solution {
    public static boolean canWin(int leap, int[] game) {
        return isSolvable(leap, game, 0);
    }

    public static boolean isSolvable(int leap, int[] game, int i) {
        if (i >= game.length) {
            return true;
        } else if (i < 0 || game[i] == 1) {
            return false;
        }

        game[i] = 1; // marks as visited

        return isSolvable(leap, game, i + leap) ||
                isSolvable(leap, game, i + 1) ||
                isSolvable(leap, game, i - 1);
    }

    public static void main(String[] args) {
        try (Scanner sc = new Scanner(System.in)) {
            int q = sc.nextInt();

            while (q-- > 0) {
                int n = sc.nextInt();
                int leap = sc.nextInt();

                int[] game = new int[n];

                for (int i = 0; i < n; i++) {
                    game[i] = sc.nextInt();
                }

                System.out.println((canWin(leap, game)) ? "YES" : "NO");
            }
        }
    }
}
```