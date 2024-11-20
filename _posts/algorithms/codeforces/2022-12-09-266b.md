---
title: "[Codeforces] 266B - Queue at the School (Java)"
excerpt: "Queue at the School"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-09
last_modified_at: 2022-12-09
---

<https://codeforces.com/problemset/problem/266/B>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Solution {
    static char[] returnAfterTSeconds(int n, int t, String s) {
        char[] charArr = s.toCharArray();
        char tmp;
        for (int i = 0; i < t; i++) {
            for (int j = 0; j < n - 1; j++) {
                if (charArr[j] == 'B' && charArr[j + 1] != 'B') {
                    // algorithm to reverse
                    tmp = charArr[j];
                    charArr[j] = charArr[j + 1];
                    charArr[j + 1] = tmp;
                    // move
                    j++;
                }
            }
        }

        return charArr;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        int n = Integer.parseInt(st.nextToken());
        int t = Integer.parseInt(st.nextToken());
        String s = br.readLine();
        for (char c : returnAfterTSeconds(n, t, s)) {
            System.out.print(c);
        }
        br.close();
    }
}
```