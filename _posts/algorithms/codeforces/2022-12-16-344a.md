---
title: "[Codeforces] 344A - Magnets (Java)"
excerpt: "Magnets"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-16
last_modified_at: 2022-12-16
---

<https://codeforces.com/problemset/problem/344/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class Solution {
    static int returnNumberOfGroups(List<String> input) {
        int count = 1;
        for (int i = 0; i < input.size() - 1; i++) {
            if (input.get(i).charAt(1) == input.get(i + 1).charAt(0)) {
                count++;
            }
        }
        return count;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<String> input = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            input.add(br.readLine()); // 10 or 01
        }
        System.out.print(returnNumberOfGroups(input));
        br.close();
    }
}
```