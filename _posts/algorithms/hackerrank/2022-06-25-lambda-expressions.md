---
title: "[HackerRank] Java Lambda Expressions"
excerpt: "Java Lambda Expressions"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-25
last_modified_at: 2022-06-25
---

<https://www.hackerrank.com/challenges/java-lambda-expressions/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.math.BigInteger;
import java.util.*;

interface PerformOperation {
    boolean check(int a);
}

class MyMath {
    public boolean checker(PerformOperation p, int num) {
        return p.check(num);
    }

    public PerformOperation isOdd() {
        return (int a) -> a % 2 != 0;
    }

    public PerformOperation isPrime() {
        return (int a) -> BigInteger.valueOf(a).isProbablePrime(1);
    }

    public PerformOperation isPalindrome() {
        return (int a) -> Integer.toString(a).equals(new StringBuilder(Integer.toString(a)).reverse().toString());
    }
}

public class Solution {

    public static void main(String[] args) throws IOException {
        MyMath ob = new MyMath();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(System.in))) {
            int T = Integer.parseInt(br.readLine());
            PerformOperation op;
            boolean ret;
            String ans = null;

            while (T > 0) {
                String s = br.readLine().trim();
                StringTokenizer st = new StringTokenizer(s);
                int ch = Integer.parseInt(st.nextToken());
                int num = Integer.parseInt(st.nextToken());

                switch (ch) {
                    case 1:
                        op = ob.isOdd();
                        ret = ob.checker(op, num);
                        ans = ret ? "ODD" : "EVEN";
                        break;
                    case 2:
                        op = ob.isPrime();
                        ret = ob.checker(op, num);
                        ans = ret ? "PRIME" : "COMPOSITE";
                        break;
                    case 3:
                        op = ob.isPalindrome();
                        ret = ob.checker(op, num);
                        ans = ret ? "PALINDROME" : "NOT PALINDROME";
                        break;
                }

                System.out.println(ans);
                T--;
            }
        }
    }
}
```