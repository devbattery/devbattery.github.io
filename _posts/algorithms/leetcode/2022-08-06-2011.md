---
title: "[LeetCode] 2011. Final Value of Variable After Performing Operations (Java)"
excerpt: "Final Value of Variable After Performing Operations"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-06
last_modified_at: 2022-08-06
---

<https://leetcode.com/problems/final-value-of-variable-after-performing-operations/submissions/>

<br>

## Solution

```java
import java.util.Objects;

class Solution {
    static int finalValueAfterOperations(String[] input) {
        int answer = 0;
        for (String s : input) {
            if (s.equals("X--") || s.equals("--X")) {
                answer--;
            } else if (s.equals("X++") || s.equals("++X")) {
                answer++;
            }
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.print(finalValueAfterOperations(new String[]{"--X", "X++", "X++"}));
    }
}

/*
    public int finalValueAfterOperations(String[] op) {
        int res = 0;
        
        for(int i = 0;i< op.length;i++)
            if(op[i].charAt(1) == '+')res++;
            else res--;
        
        return res;
    }
*/
```
