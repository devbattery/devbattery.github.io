---
title: "[Codeforces] 110A - Nearly Lucky Number (Java)"
excerpt: "Nearly Lucky Number"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-06
last_modified_at: 2022-12-06
---

<https://codeforces.com/problemset/problem/110/A>

<br>

## Solution

```java
import java.io.BufferedReader; 
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    public static String isOnlyFourAndSeven(String input) {
        int count = 0;
        for (int i = 0; i < input.length(); i++) {
            if (input.charAt(i) == '4' || input.charAt(i) == '7') {
                count++;
            }
        }
        return (count == 4 || count == 7) ? "YES" : "NO";
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine();
        System.out.print(isOnlyFourAndSeven(input));
        br.close();
    }
}
```