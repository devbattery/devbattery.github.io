---
title: "[Codeforces] 69A - Young Physicist (Java)"
excerpt: "Young Physicist"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-02
last_modified_at: 2022-12-02
---

<https://codeforces.com/problemset/problem/69/A>

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
    public static String isInEquilibrium(List<List<Integer>> input) {
        int xSum = 0, ySum = 0, zSum = 0;
        for (List<Integer> integers : input) {
            xSum += integers.get(0);
            ySum += integers.get(1);
            zSum += integers.get(2);
        }
        return (xSum == 0 && ySum == 0 && zSum == 0) ? "YES" : "NO";
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<List<Integer>> twoArray = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            List<Integer> oneArray = new ArrayList<>();
            StringTokenizer st = new StringTokenizer(br.readLine(), " ");
            for (int j = 0; j < 3; j++) {
                oneArray.add(Integer.parseInt(st.nextToken()));
            }
            twoArray.add(oneArray);
        }
        System.out.print(isInEquilibrium(twoArray));
        br.close();
    }
}
```