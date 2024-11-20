---
title: "[Codeforces] 677A - Vanya and Fence (Java)"
excerpt: "Vanya and Fence"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-12
last_modified_at: 2022-12-12
---

<https://codeforces.com/problemset/problem/677/A>

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
    static int returnMinPossible(int h, List<Integer> input) {
        int count = 0;
        for (Integer i : input) {
            if (i > h) {
                count += 2;
            } else {
                count++;
            }
        }
        return count;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        int n = Integer.parseInt(st.nextToken());
        int h = Integer.parseInt(st.nextToken());
        st = new StringTokenizer(br.readLine(), " ");
        List<Integer> input = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            input.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(returnMinPossible(h, input));
        br.close();
    }
}
```