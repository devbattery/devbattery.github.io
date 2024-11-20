---
title: "[Codeforces] 41A - Translation (Java)"
excerpt: "Translation"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-10
last_modified_at: 2022-12-10
---

<https://codeforces.com/problemset/problem/41/A>

<br>

## Solution

```java
import javax.management.loading.MLet;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    static String isReverseString(String s, String t) {
        char[] sToChar = s.toCharArray();
        int lt = 0, rt = s.length() - 1;
        while (lt < rt) {
            char tmp = sToChar[lt];
            sToChar[lt] = sToChar[rt];
            sToChar[rt] = tmp;
            lt++; rt--;
        }

        String charToString = "";
        for (char c : sToChar) {
            charToString += String.valueOf(c);
        }
        return charToString.equals(t) ? "YES" : "NO";
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        String t = br.readLine();
        System.out.print(isReverseString(s, t));
        br.close();
    }
}
```