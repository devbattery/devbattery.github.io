---
title: "[Codeforces] 1A - Theatre Square (Java)"
excerpt: "Theatre Square"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-18
last_modified_at: 2022-11-18
---

<https://codeforces.com/problemset/problem/1/A>

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
    static long solution(List<Integer> input) {
        long n = input.get(0);
        long m = input.get(1);
        long a = input.get(2);
        long nCounting = n / a;
        long mCounting = m / a;
        if (n % a != 0) {
            nCounting++;
        }
        if (m % a != 0) {
            mCounting++;
        }
        return nCounting * mCounting;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<Integer> input = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        while (st.hasMoreTokens()) {
            input.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(solution(input));
        br.close();
    }
}
```