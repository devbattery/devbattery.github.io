---
title: "[Programmers] 직사각형 별찍기 (Java)"
excerpt: "직사각형 별찍기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-04-20
last_modified_at: 2022-04-20
---

<https://programmers.co.kr/learn/courses/30/lessons/12969>

<br>

## Solution

```java
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt(); // width n
        int b = sc.nextInt(); // height m

        if (a > 1000 && b > 1000) { // exception
            return;
        }

        for (int i = 0; i < b; i++) {
            for (int j = 0; j < a; j++) {
                System.out.print("*");
            }
            System.out.println();
        }

    }
}
```

<br>

## Another Solution

```java
import java.util.Scanner;
import java.util.stream.IntStream;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();

        StringBuilder sb = new StringBuilder();
        IntStream.range(0, a).forEach(s -> sb.append("*"));
        IntStream.range(0, b).forEach(s -> System.out.println(sb.toString()));
    }
}
```
