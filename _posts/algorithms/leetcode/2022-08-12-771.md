---
title: "[LeetCode] 771. Jewels and Stones (Java)"
excerpt: "Jewels and Stones"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-12
last_modified_at: 2022-08-12
---

<https://leetcode.com/problems/jewels-and-stones/>

<br>

## Solution

```java
class Solution {
    static int numJewelsInStones(String jewels, String stones) {
        int answer = 0;
        for (int i = 0; i < stones.length(); i++) {
            for (int j = 0; j < jewels.length(); j++) {
                if (jewels.charAt(j) == stones.charAt(i)) {
                    answer++;
                }
            }
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(numJewelsInStones("aA", "aAAbbbb"));
        System.out.print(numJewelsInStones("z", "ZZ"));
    }
}
```