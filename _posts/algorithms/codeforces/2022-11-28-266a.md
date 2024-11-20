---
title: "[Codeforces] 266A - Stones on the Table (Java)"
excerpt: "Stones on the Table"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-28
last_modified_at: 2022-11-28
---

<https://codeforces.com/problemset/problem/266/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    public static int NoSequenceRGB(int n, String s) {
        int answer = 0;
        char[] charArray = s.toCharArray();
        for (int i = 0; i < charArray.length - 1; i++) {
            if (charArray[i] == charArray[i + 1]) {
                answer++;
            }
        }
        return answer;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        String s = br.readLine();
        System.out.print(NoSequenceRGB(n, s));
        br.close();
    }
}
```