---
title: "[LeetCode] 1720. Decode XORed Array (Java)"
excerpt: "Decode XORed Array"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-18
last_modified_at: 2022-08-18
---

<https://leetcode.com/problems/decode-xored-array/>

<br>

![](https://whal.eu/i/zpr3NdL7)

<br>

## Solution

```java
import java.util.Arrays;

class Solution {
    static int[] decode(int[] encoded, int first) {
        int[] answer = new int[encoded.length + 1];
        answer[0] = first;
        for (int i = 0; i < encoded.length; i++) {
            answer[i + 1] = answer[i] ^ encoded[i]; // ^: XOR,
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(decode(new int[]{1, 2, 3}, 1)));
        System.out.print(Arrays.toString(decode(new int[]{6, 2, 7, 3}, 4)));
    }
}
```