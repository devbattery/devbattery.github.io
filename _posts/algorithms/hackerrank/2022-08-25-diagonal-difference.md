---
title: "[HackerRank] Diagonal Difference (Java)"
excerpt: "Diagonal Difference"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-25
last_modified_at: 2022-08-25
---

<https://www.hackerrank.com/challenges/diagonal-difference/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

class Result {
    static int diagonalDifference(int[][] arr, int n) {
        int answer, tmp1 = 0, tmp2 = 0;
        for (int i = 0; i < n; i++) {
            tmp1 += arr[i][i];
            tmp2 += arr[i][n - i - 1];
        }
        if (tmp1 < tmp2) {
            answer = tmp2 - tmp1;
        } else {
            answer = tmp1 - tmp2;
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        int[][] input = new int[n][n];
        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine(), " ");
            for (int j = 0; j < n; j++) {
                input[i][j] = Integer.parseInt(st.nextToken());
            }
        }
        System.out.print(Result.diagonalDifference(input, n));
        br.close();
    }
}
```