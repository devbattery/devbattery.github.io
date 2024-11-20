---
title: "[LeetCode] 7. Reverse Integer (Java)"
excerpt: "Reverse Integer"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-01-18
last_modified_at: 2023-01-18
---

- [Reference](https://leetcode.com/problems/reverse-integer/)

<br>

## Solution

```java
public class ReverseInteger {
    public static int reverse(int x) {
        long answer = 0;

        // 123 -> 12 (3)
        // 12 -> 1 (2)
        // 1 -> 0 (1)
        // x % 10 -> x / 10
        while (x != 0) {
            answer = answer * 10 + x % 10;
            x /= 10;
        }

        if (answer > Integer.MAX_VALUE || answer < Integer.MIN_VALUE ) {
            return 0;
        }

        return (int) answer;
    }

    public static void main(String[] args) {
        System.out.println(reverse(123));
        System.out.println(reverse(-123));
        System.out.println(reverse(120));
        System.out.println(reverse(1000000999));
    }
}
```