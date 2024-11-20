---
title: "[Codeforces] 734A - Anton and Danik (Java)"
excerpt: "Anton and Danik"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-08
last_modified_at: 2022-12-08
---

<https://codeforces.com/problemset/problem/734/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    static String returnWhoIsWin(int n, String input) {
        int countA = 0, countD = 0;
        for (int i = 0; i < n; i++) {
            if(input.charAt(i) == 'A') {
                countA++;
            } else {
                countD++;
            }
        }
        if (countA == countD) {
            return "Friendship";
        }
        return (countA > countD) ? "Anton" : "Danik";
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        String input = br.readLine();
        System.out.print(returnWhoIsWin(n, input));
        br.close();
    }
}
```