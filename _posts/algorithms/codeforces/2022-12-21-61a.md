---
title: "[Codeforces] 61A - Ultra-Fast Mathematician (Java)"
excerpt: "Ultra-Fast Mathematician"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-21
last_modified_at: 2022-12-21
---

<https://codeforces.com/problemset/problem/61/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    static void printZeroOne(String input1, String input2) {
        StringBuilder answer = new StringBuilder();
        for (int i = 0; i < input1.length(); i++) {
            if (input1.charAt(i) == '0') {
                if (input2.charAt(i) == '1') {
                    answer.append('1');
                } else { // input2.charAt(i) == '0'
                    answer.append('0');
                }
            } else { // input1.charAt(i) == '1'
                if (input2.charAt(i) == '0') {
                    answer.append('1');
                } else { // input2.charAt(i) == '1'
                    answer.append('0');
                }
            }
        }
        System.out.print(answer);
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input1 = br.readLine();
        String input2 = br.readLine();
        printZeroOne(input1, input2);
        br.close();
    }
}
```