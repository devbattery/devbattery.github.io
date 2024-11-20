---
title: "[LeetCode] 1470. Shuffle the Array (Java)"
excerpt: "Shuffle the Array"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-08
last_modified_at: 2022-08-08
---

<https://leetcode.com/problems/shuffle-the-array/>

<br>

## Solution

```java
import java.util.Arrays;

class Solution {
    static int[] shuffle(int[] nums, int n) {
        int[] answer = new int[n * 2];
        int tmp = 0;
        for (int i = 0; i < n * 2; i += 2) {
            answer[i] = nums[tmp++];
        }

        for (int i = 1; i < n * 2; i += 2) {
            answer[i] = nums[tmp++];
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(shuffle(new int[]{2, 5, 1, 3, 4, 7}, 3)));
    }
}

/*
    public int[] shuffle(int[] nums, int n) {
        int[] res = new int[2 * n];
        for (int i = 0, j = n, idx = 0; idx < res.length; i++, j++) {
            res[idx++] = nums[i];
            res[idx++] = nums[j];
        } 
        return res;
    }
*/
```
