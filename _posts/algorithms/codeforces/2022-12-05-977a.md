---
title: "[Codeforces] 977A - Wrong Subtraction (Java)"
excerpt: "Wrong Subtraction"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-05
last_modified_at: 2022-12-05
---

<https://codeforces.com/problemset/problem/977/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Solution {
    public static int wrongSubtraction(int n, int k) {
        for (int i = 0; i < k; i++) { 
            if (n % 10 != 0) {
                n--;
            } else { // n % 10 == 0
                n /= 10;
            }
        }
        return n;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        int n = Integer.parseInt(st.nextToken());
        int k = Integer.parseInt(st.nextToken());
        System.out.print(wrongSubtraction(n, k));
        br.close();
    }
}
```