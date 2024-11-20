---
title: "[HackerRank] Java Exception Handling (Try-catch)"
excerpt: "Java Exception Handling (Try-catch)"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-17
last_modified_at: 2022-06-17
---

<https://www.hackerrank.com/challenges/java-exception-handling-try-catch/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

public class Solution {

    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            System.out.println(scanner.nextInt() / scanner.nextInt());
        } catch (ArithmeticException e) {
            System.out.println(e);
        } catch (InputMismatchException e) {
            System.out.println(e.getClass().getName());
        }
    }
}
```