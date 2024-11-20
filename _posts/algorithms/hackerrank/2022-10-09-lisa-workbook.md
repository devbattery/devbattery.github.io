---
title: "[HackerRank] Lisa's Workbook (Java)"
excerpt: "Lisa's Workbook"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-09
last_modified_at: 2022-10-09
---

<https://www.hackerrank.com/challenges/lisa-workbook/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;

class Result {
    static int workbook(int n, int k, List<Integer> arr) {
        int answer = 0, page = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 1; j <= arr.get(i); j++) {
                if (k == 1 || j % k == 1) {
                    page++;
                }
                if (j == page) {
                    answer++;
                }
            }
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        int n = Integer.parseInt(st.nextToken());
        int k = Integer.parseInt(st.nextToken());
        st = new StringTokenizer(br.readLine(), " ");
        List<Integer> arr = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            arr.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(Result.workbook(n, k, arr));
        br.close();
    }
}
```