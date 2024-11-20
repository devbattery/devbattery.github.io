---
title: "[Programmers] 평균 구하기 (Java)"
excerpt: "평균 구하기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-04-22
last_modified_at: 2022-04-22
---

<https://programmers.co.kr/learn/courses/30/lessons/12944>

<br>

## Solution

```java
class Solution {
    public static double solution(int[] arr) {
        double answer = 0;
        return answer = returnAvg(arr);

    }

    public static double returnAvg(int[] arr) {
        int sum = 0;
        for (int i = 0; i < arr.length; i++) {
            sum += arr[i];
        }

        return (double) sum / (double) arr.length;
    }

    public static void main(String[] args) {
        int[] ar1 = {1, 2, 3, 4};
        System.out.println(solution(ar1));
    }
}
```

<br>

## Another Solution

```java
import java.util.Arrays;

public class GetMean {
    public int getMean(int[] array) {
        return (int) Arrays.stream(array).average().orElse(0);
    }

    public static void main(String[] args) {
        int x[] = {5, 4, 3};
        GetMean getMean = new GetMean();
        System.out.println("평균값 : " + getMean.getMean(x));
    }
}
```
