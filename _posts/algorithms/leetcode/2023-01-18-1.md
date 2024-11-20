---
title: "[LeetCode] 1. Two Sum (Java)"
excerpt: "Two Sum"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-01-18
last_modified_at: 2023-01-18
---

- [Reference](https://leetcode.com/problems/two-sum)

<br>

## Solution

```java
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class TwoSum {
    // Follow-up: Can you come up with an algorithm that is less than O(n2) time complexity?
    // O(n)
    public static int[] twoSum(int[] nums, int target) {
        int[] answer = new int[]{};
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            // nums[n] + nums[m] = target
            // nums[m] = target - nums[n]
            // key 값이 target - nums[i]에 해당되는 index 저장 후 break
            if (map.containsKey(target - nums[i])) {
                answer = new int[]{map.get(target - nums[i]), i};
                break;
            }

            map.put(nums[i], i); // if 조건에 맞지 않다면 key에 index 저장
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9)));
        System.out.println(Arrays.toString(twoSum(new int[]{3, 2, 4}, 6)));
        System.out.println(Arrays.toString(twoSum(new int[]{3, 3}, 6)));
    }
}

```