---
title: "[HackerRank] Java Output Formatting"
excerpt: "Java Output Formatting"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-23
last_modified_at: 2022-05-23
---

<https://www.hackerrank.com/challenges/java-output-formatting/problem?isFullScreen=true>

<br>

## Solution

```java
import java.util.Scanner;

public class Solution {

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("================================");
        for (int i = 0; i < 3; i++) {
            String s1 = sc.next();
            int x = sc.nextInt();
            System.out.printf("%-15s", s1);
            System.out.printf("%03d\n", x);
        }
        System.out.println("================================");

    }
}
```
