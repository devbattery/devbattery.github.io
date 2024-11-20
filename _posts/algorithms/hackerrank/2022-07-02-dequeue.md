---
title: "[HackerRank] Java Dequeue"
excerpt: "Java Dequeue"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-07-02
last_modified_at: 2022-07-02
---

<https://www.hackerrank.com/challenges/java-dequeue/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

public class Solution {

    public static void main(String[] args) {
        try (Scanner sc = new Scanner(System.in)) {
            Deque<Integer> deque = new ArrayDeque<>();
            Set<Integer> set = new HashSet<>();

            int n = sc.nextInt();
            int m = sc.nextInt();
            int max = Integer.MIN_VALUE;

            for (int i = 0; i < n; i++) {
                int input = sc.nextInt();

                deque.add(input);
                set.add(input);

                if (deque.size() == m) {
                    if (set.size() > max) {
                        max = set.size();
                    }

                    int first = deque.remove();
                    if (!deque.contains(first)) {
                        set.remove(first);
                    }
                }
            }

            System.out.println(max);
        }
    }
}
```