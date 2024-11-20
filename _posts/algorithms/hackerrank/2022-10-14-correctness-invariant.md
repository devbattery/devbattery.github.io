---
title: "[HackerRank] Correctness and the Loop Invariant (Java)"
excerpt: "Correctness and the Loop Invariant"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-14
last_modified_at: 2022-10-14
---

<https://www.hackerrank.com/challenges/correctness-invariant/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.StringTokenizer;

public class Solution {

    static void insertionSort(int[] A) {
        for (int i = 0; i < A.length; i++) {
            for (int j = i; j < A.length; j++) {
                if (A[i] > A[j]) {
                    int tmp = A[i];
                    A[i] = A[j];
                    A[j] = tmp;
                }
            }
        }
        printArray(A);
    }

    static void printArray(int[] ar) {
        for (int n : ar) {
            System.out.print(n + " ");
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        int[] A = new int[n];
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            A[i] = Integer.parseInt(st.nextToken());
        }
        insertionSort(A);
        br.close();
    }
}
```