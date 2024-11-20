---
title: "[LeetCode] 1672. Richest Customer Wealth (Java)"
excerpt: "Richest Customer Wealth"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-07
last_modified_at: 2022-08-07
---

<https://leetcode.com/problems/richest-customer-wealth/>

<br>

## Solution

```java
class Solution {
    static int maximumWealth(int[][] accounts) {
        int max = Integer.MIN_VALUE;
        for (int i = 0; i < accounts.length; i++) {
            int tmp = 0;
            for (int j = 0; j < accounts[i].length; j++) {
                tmp += accounts[i][j];
            }

            if (tmp > max) {
                max = tmp;
            }
        }

        return max;
    }
}
```
