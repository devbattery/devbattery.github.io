---
title: "[LeetCode] 1773. Count Items Matching a Rule (Java)"
excerpt: "Count Items Matching a Rule"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-23
last_modified_at: 2022-08-23
---

<https://leetcode.com/problems/count-items-matching-a-rule/>

<br>

## Solution

```java
import java.util.List;

class Solution {
    static int countMatches(List<List<String>> items, String ruleKey, String ruleValue) {
        int answer = 0;
        for (List<String> item : items) {
            if (ruleKey.equals("type") && item.get(0).equals(ruleValue)) {
                answer++;
            } else if (ruleKey.equals("color") && item.get(1).equals(ruleValue)) {
                answer++;
            } else if (ruleKey.equals("name") && item.get(2).equals(ruleValue)) {
                answer++;
            }
        }
        return answer;
    }
}
```