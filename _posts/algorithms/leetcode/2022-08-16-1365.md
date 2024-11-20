---
title: "[LeetCode] 1365. How Many Numbers Are Smaller Than the Current Number (Java)"
excerpt: "How Many Numbers Are Smaller Than the Current Number"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-16
last_modified_at: 2022-08-16
---

<https://leetcode.com/problems/how-many-numbers-are-smaller-than-the-current-number/>

<br>

## Solution

```java
import java.util.Arrays;

class Solution {
    static int[] smallerNumbersThanCurrent(int[] nums) {
        int[] answer = new int[nums.length];
        int cnt = 0;
        for (int i = 0; i < nums.length; i++) {
            for (int j = 0; j < nums.length; j++) {
                if (i == j) {
                    continue;
                }

                if (nums[i] > nums[j]) {
                    cnt++;
                }
            }
            answer[i] = cnt;
            cnt = 0;
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(smallerNumbersThanCurrent(new int[]{6, 5, 4, 8})));
        System.out.print(Arrays.toString(smallerNumbersThanCurrent(new int[]{7, 7, 7, 7})));
    }
}
```