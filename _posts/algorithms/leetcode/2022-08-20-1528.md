---
title: "[LeetCode] 1528. Shuffle String (Java)"
excerpt: "Shuffle String"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-20
last_modified_at: 2022-08-20
---

<https://leetcode.com/problems/shuffle-string/>

<br>

## Solution

```java
import java.util.Arrays;

class Solution {
    static String restoreString(String s, int[] indices) {
        String[] answer = new String[s.length()];
        for (int i = 0; i < s.length(); i++) {
            answer[indices[i]] = String.valueOf(s.charAt(i));
        }
        return String.join("", answer);
    }

    public static void main(String[] args) {
        System.out.println(restoreString("codeleet", new int[]{4, 5, 6, 7, 0, 2, 1, 3}));
        System.out.print(restoreString("abc", new int[]{0, 1, 2}));
    }
}
```