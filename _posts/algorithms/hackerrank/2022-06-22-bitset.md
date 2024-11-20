---
title: "[HackerRank] Java BitSet"
excerpt: "Java BitSet"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-22
last_modified_at: 2022-06-22
---

<https://www.hackerrank.com/challenges/java-bitset/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

public class Solution {

    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            int n = scanner.nextInt();
            int m = scanner.nextInt();

            BitSet b1 = new BitSet(n);
            BitSet b2 = new BitSet(n);
            BitSet[] bitSets = new BitSet[3];

            bitSets[1] = b1;
            bitSets[2] = b2;

            while (m > 0) {
                String forms = scanner.next();
                int x = scanner.nextInt();
                int y = scanner.nextInt();

                switch (forms) {
                    case "AND":
                        bitSets[x].and(bitSets[y]);
                        break;
                    case "OR":
                        bitSets[x].or(bitSets[y]);
                        break;
                    case "XOR":
                        bitSets[x].xor(bitSets[y]);
                        break;
                    case "FLIP":
                        bitSets[x].flip(y);
                        break;
                    case "SET":
                        bitSets[x].set(y);
                }

                System.out.println(b1.cardinality() + " " + b2.cardinality());

                m--;
            }
        }
    }
}
```