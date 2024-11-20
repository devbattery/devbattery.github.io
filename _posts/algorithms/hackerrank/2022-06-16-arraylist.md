---
title: "[HackerRank] Java ArrayList"
excerpt: "Java ArrayList"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-16
last_modified_at: 2022-06-16
---

<https://www.hackerrank.com/challenges/java-arraylist/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

public class Solution {

    public static void main(String[] args) {
        try (Scanner in = new Scanner(System.in)) {
            int n = in.nextInt();
            ArrayList<ArrayList<Integer>> rows = new ArrayList<>();

            for (int i = 0; i < n; i++) {
                int d = in.nextInt();
                ArrayList<Integer> row = new ArrayList<>();

                for (int j = 0; j < d; j++) {
                    row.add(in.nextInt());
                }

                rows.add(row);
            }

            int q = in.nextInt();

            for (int i = 0; i < q; i++) {
                int x = in.nextInt();
                int y = in.nextInt();

                try {
                    System.out.println(rows.get(x - 1).get(y - 1));
                } catch (IndexOutOfBoundsException e) {
                    System.out.println("ERROR!");
                }
            }
        }
    }
}
```