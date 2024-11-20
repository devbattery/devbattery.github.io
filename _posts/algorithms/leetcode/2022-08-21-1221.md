---
title: "[LeetCode] 1221. Split a String in Balanced Strings (Java)"
excerpt: "Split a String in Balanced Strings"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-21
last_modified_at: 2022-08-21
---

<https://leetcode.com/problems/split-a-string-in-balanced-strings/>

<br>

## Solution

```java
class Solution {
    static int balancedStringSplit(String s) {
        int answer = 0;
        int cntL = 0;
        int cntR = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == 'R') {
                cntR++;
            } else { // s.charAt(i) == 'L'
                cntL++;
            }

            if (cntL != 0 || cntR != 0) {
                if (cntR == cntL) {
                    answer++;
                }
            }
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(balancedStringSplit("RLRRLLRLRL"));
        System.out.println(balancedStringSplit("RLRRRLLRLL"));
        System.out.print(balancedStringSplit("LLLLRRRR"));
    }
}
```