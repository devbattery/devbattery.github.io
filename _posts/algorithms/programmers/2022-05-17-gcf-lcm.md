---
title: "[Programmers] 최대공약수와 최소공배수 (Java)"
excerpt: "최대공약수와 최소공배수"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-17
last_modified_at: 2022-05-17
---

<https://programmers.co.kr/learn/courses/30/lessons/12940>

<br>

![](https://www.chilimath.com/wp-content/uploads/2019/07/formula-product-gcf-and-lcm.png)

<br>

[**Source**](https://www.chilimath.com/lessons/introductory-algebra/product-of-gcf-and-lcm/)

<br>

## Solution

```java
import java.util.Arrays;

class Solution {
    public static int[] solution(int n, int m) {
        int[] answer = {};
        int greatest = 0;
        int least = 0;

        for (int i = 1; i <= n && i <= m; i++) {
            if (n % i == 0 && m % i == 0) {
                greatest = i;
            }
        }

        least = n * m / greatest;

        answer = new int[]{greatest, least};

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(solution(3, 12)));
        System.out.println(Arrays.toString(solution(1, 10)));
    }
}
```
