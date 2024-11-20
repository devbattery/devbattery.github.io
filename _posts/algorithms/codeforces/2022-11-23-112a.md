---
title: "[Codeforces] 112A - Petya and Strings (Java)"
excerpt: "Petya and Strings"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-23
last_modified_at: 2022-11-23
---

<https://codeforces.com/problemset/problem/112/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    public static int solution(String input1, String input2) {
        return Integer.compare(input1.toLowerCase().compareTo(input2.toLowerCase()), 0);
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input1 = br.readLine();
        String input2 = br.readLine();
        System.out.print(solution(input1, input2));
        br.close();
    }
}
```