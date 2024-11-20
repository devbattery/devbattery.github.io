---
title: "[Codeforces] 263A - Beautiful Matrix (Java)"
excerpt: "Beautiful Matrix"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-22
last_modified_at: 2022-11-22
---

<https://codeforces.com/problemset/problem/263/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Solution {
    public static int solution(int[][] input) {
        int min = 0;
        for (int i = 0; i < 5; i++) {
            for (int j = 0; j < 5; j++) {
                if (input[i][j] == 1) {
                    min = Math.abs(i - 2) + Math.abs(j - 2);
                } 
            }
        }
        return min;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int[][] input = new int[5][5];
        for (int i = 0; i < 5; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine(), " ");
            for (int j = 0; j < 5; j++) {
                input[i][j] = Integer.parseInt(st.nextToken());
            }
        }
        System.out.print(solution(input));
        br.close();
    }
}
```