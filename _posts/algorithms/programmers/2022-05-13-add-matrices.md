---
title: "[Programmers] 행렬의 덧셈 (Java)"
excerpt: "행렬의 덧셈"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-13
last_modified_at: 2022-05-13
---

<https://programmers.co.kr/learn/courses/30/lessons/12950>

<br>

## Solution

```java
import java.util.Arrays;

class Solution {
    public static int[][] solution(int[][] arr1, int[][] arr2) {
        int[][] answer = new int[arr1.length][arr1[0].length];
        // int[][] answer = {};
        // answer = arr1;

        for (int i = 0; i < arr1.length; i++) {
            for (int j = 0; j < arr1[0].length; j++) {
                answer[i][j] = arr1[i][j] + arr2[i][j];
            }
        }

        return answer;
    }
}
```