---
title: "[LeetCode] 1512. Number of Good Pairs (Java)"
excerpt: "Number of Good Pairs"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-11
last_modified_at: 2022-08-11
---

<https://leetcode.com/problems/number-of-good-pairs/submissions/>

<br>

## Solution

```java
class Solution {
    static int numIdenticalPairs(int[] nums) {
        int cnt = 0;
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] == nums[j]) {
                    cnt++;
                }
            }
        }

        return cnt;
    }

    public static void main(String[] args) {
        System.out.println(numIdenticalPairs(new int[]{1, 2, 3, 1, 1, 3}));
        System.out.println(numIdenticalPairs(new int[]{1, 1, 1, 1}));
        System.out.print(numIdenticalPairs(new int[]{1, 2, 3}));
    }
}

/*
    public int numIdenticalPairs(int[] A) {
        int res = 0, count[] = new int[101];
        for (int a: A) {
            res += count[a]++;
        }
        return res;
    }
*/
```