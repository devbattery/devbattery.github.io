---
title: "[LeetCode] 1920. Build Array from Permutation (Java)"
excerpt: "Build Array from Permutation"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-21
last_modified_at: 2022-05-21
---

<https://leetcode.com/problems/build-array-from-permutation/>

<br>

## Solution

```java
import java.util.Arrays;

class Solution {
    public static int[] buildArray(int[] nums) {
        int[] answer = new int[nums.length];
        for (int i = 0; i < nums.length; i++) {
            answer[i] = nums[nums[i]];
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(buildArray(new int[]{0, 2, 1, 5, 3, 4})));
        System.out.println(Arrays.toString(buildArray(new int[]{5, 0, 1, 2, 3, 4})));
    }
}
```

<br>

## Another Solution

```java
import java.util.Arrays;

class Solution {
    public int[] buildArray(int[] nums) {
        int n = nums.length;

        for (int i = 0; i < n; i++) {
            // this is done to keep both old and new value together. 
            // going by the example of [5,0,1,2,3,4]
            // after this nums[0] will be 5 + 6 * (4 % 6) = 5 + 24 = 29;
            // now for next index calulation we might need the original value of num[0] which can be obtain by num[0] % 6 = 29 % 6 = 5;
            // if we want to get just he new value of num[0], we can get it by num[0] / 6 = 29 / 6 = 4
            nums[i] = nums[i] + n * (nums[nums[i]] % n);
        }

        for (int i = 0; i < n; i++) {
            nums[i] = nums[i] / n;
        }

        return nums;
    }
}
```
