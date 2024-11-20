---
title: "[LeetCode] 1342. Number of Steps to Reduce a Number to Zero (Java)"
excerpt: "Number of Steps to Reduce a Number to Zero"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-19
last_modified_at: 2022-08-19
---

<https://leetcode.com/problems/number-of-steps-to-reduce-a-number-to-zero/>

<br>

## Solution

```java
class Solution {
    static int numberOfSteps(int num) {
        if (num == 0) {
            return 0;
        }

        int answer = 0;
        do {
            if (num % 2 == 0) { // Even
                num = num / 2;
            } else { // Odd
                num = num - 1;
            }
            answer++;
        } while (num != 0);

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(numberOfSteps(14));
        System.out.println(numberOfSteps(8));
        System.out.println(numberOfSteps(123));
        System.out.print(numberOfSteps(0));
    }
}
```