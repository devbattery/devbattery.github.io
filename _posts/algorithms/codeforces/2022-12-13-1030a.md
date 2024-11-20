---
title: "[Codeforces] 1030A - In Search of an Easy Problem (Java)"
excerpt: "In Search of an Easy Problem"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-13
last_modified_at: 2022-12-13
---

<https://codeforces.com/problemset/problem/1030/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;

public class Solution {
    static String printEasyOrHard(List<Integer> list) {
        for (Integer integer : list) {
            if (integer == 1) {
                return "HARD";
            }
        }
        return "EASY";
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> list = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            list.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(printEasyOrHard(list));
        br.close();
    }
}
```