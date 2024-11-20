---
title: "[HackerRank] Java Exception Handling"
excerpt: "Java Exception Handling"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-11
last_modified_at: 2022-06-11
---

<https://www.hackerrank.com/challenges/java-exception-handling/problem?isFullScreen=true>

<br>

## Solution

```java
import java.util.Scanner;

class MyCalculator {
    public long power(int n, int p) throws Exception {
        if (n == 0 && p == 0) {
            throw new Exception("n and p should not be zero.");
        } else if (n < 0 || p < 0) {
            throw new Exception("n or p should not be negative.");
        } else {
            return (long) Math.pow(n, p);
        }
    }

}

public class Solution {
    public static final MyCalculator myCalculator = new MyCalculator();
    public static final Scanner scanner = new Scanner(System.in);

    public static void main(String[] args) {
        while (scanner.hasNextInt()) {
            int n = scanner.nextInt();
            int p = scanner.nextInt();

            try {
                System.out.println(myCalculator.power(n, p));
            } catch (Exception e) {
                System.out.println(e);
            }
        }
    }
}
```