---
title: "[Codeforces] 200B - Drinks (Java)"
excerpt: "Drinks"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-20
last_modified_at: 2022-12-20
---

<https://codeforces.com/problemset/problem/200/B>

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
    static double printVolume(int n, List<Integer> input) {
        double answer = 0;
        for (int i = 0; i < n; i++) {
            answer += input.get(i);
        }
        return answer / n;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> input = new ArrayList<>(n);
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            input.add(Integer.valueOf(st.nextToken()));
        }
        System.out.print(printVolume(n, input));
        br.close();
    }
}
```