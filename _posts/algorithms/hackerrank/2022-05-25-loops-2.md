---
title: "[HackerRank] Java Loops II"
excerpt: "Java Loops II"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-25
last_modified_at: 2022-05-25
---

<https://www.hackerrank.com/challenges/java-loops/problem?isFullScreen=true>

<br>

## Solution

```java
import java.util.*;
import java.io.*;

class Solution {
    public static void main(String[] argh) {
        Scanner in = new Scanner(System.in);
        int t = in.nextInt();
        for (int i = 0; i < t; i++) {
            int a = in.nextInt();
            int b = in.nextInt();
            int n = in.nextInt();

            for (int j = 0; j < n; j++) {
                a += Math.pow(2, j) * b;
                System.out.print(a + " ");
            }

            System.out.println();
        }
        in.close();
    }
}
```

<br>

## Another Solution

```java
import java.util.*;
import java.io.*;

class Solution {
    public static void main(String[] argh) {
        Scanner in = new Scanner(System.in);
        int t = in.nextInt();
        for (int i = 0; i < t; i++) {
            int a = in.nextInt();
            int b = in.nextInt();
            int n = in.nextInt();
            int c = a;
            for (int j = 0; j < n; j++) {
                c += Math.pow(2, j) * b;
                System.out.printf("%s ", c);
            }
            System.out.println();
        }
        in.close();
    }
}
    

```