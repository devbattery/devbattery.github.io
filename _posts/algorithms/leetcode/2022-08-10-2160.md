---
title: "[LeetCode] 2160. Minimum Sum of Four Digit Number After Splitting Digits (Java)"
excerpt: "Minimum Sum of Four Digit Number After Splitting Digits"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-10
last_modified_at: 2022-08-10
---

<https://leetcode.com/problems/minimum-sum-of-four-digit-number-after-splitting-digits/>

<br>

## Solution

```java
import java.util.Arrays;

class Solution {
    static int minimumSum(int num) {
        char[] arrCharNum = String.valueOf(num).toCharArray();
        Arrays.sort(arrCharNum);
        return Integer.parseInt("" + arrCharNum[0] + arrCharNum[2]) + Integer.parseInt("" + arrCharNum[1] + arrCharNum[3]);
    }

    public static void main(String[] args) {
        System.out.println(minimumSum(2932)); // Ascending order -> 2239
        System.out.print(minimumSum(4009)); // Ascending order -> 0049
    }
}
```
