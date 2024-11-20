---
title: "[HackerRank] Modified Kaprekar Numbers (Java)"
excerpt: "Modified Kaprekar Numbers"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-04
last_modified_at: 2022-11-04
---

<https://www.hackerrank.com/challenges/kaprekar-numbers/problem?isFullScreen=true>

<br>

## Solution

```java
import com.sun.security.jgss.GSSUtil; 

import java.io.*;

class Result {
    static void kaprekarNumbers(int p, int q) {
        int count = 0;
        for (int i = p; i <= q; i++) {
            long sqrt = (long) i * i;

            if (i == 1) {
                System.out.print(1 + " ");
                count++;
            }

            String str = String.valueOf(sqrt);
            if (str.length() > 1) {
                String s1 = str.substring(0, str.length() / 2);
                String s2 = str.substring(str.length() / 2);

                if (Integer.parseInt(s1) + Integer.parseInt(s2) == i) {
                    System.out.print(i + " ");
                    count++;
                }
            }
        }

        if (count == 0) {
            System.out.println("INVALID RANGE");
        }
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));

        int p = Integer.parseInt(bufferedReader.readLine().trim());

        int q = Integer.parseInt(bufferedReader.readLine().trim());

        Result.kaprekarNumbers(p, q);

        bufferedReader.close();
    }
}
```