---
title: "[HackerRank] Cats and a Mouse (Java)"
excerpt: "Cats and a Mouse"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-04
last_modified_at: 2022-09-04
---

<https://www.hackerrank.com/challenges/cats-and-a-mouse/problem?isFullScreen=true>

<br>

## Solution

```java
class Solution {
    static String catAndMouse(int x, int y, int z) {
        String answer;
        int a = Math.abs(x - z); // Math.abs(): absolute value
        int b = Math.abs(y - z);
        if (a > b) {
            answer = "Cat B";
        } else {
            if (a < b) {
                answer = "Cat A";
            } else {
                answer = "Mouse C";
            }
        }
        return answer;
    }
}
```