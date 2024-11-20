---
title: "[LeetCode] 2114. Maximum Number of Words Found in Sentences (Java)"
excerpt: "Maximum Number of Words Found in Sentences"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-09
last_modified_at: 2022-08-09
---

<https://leetcode.com/problems/maximum-number-of-words-found-in-sentences/>

<br>

## Solution

```java
class Solution {
    static int mostWordsFound(String[] sentences) {
        int max = Integer.MIN_VALUE;
        int cnt = 1;
        for (int i = 0; i < sentences.length; i++) {
            for (int j = 0; j < sentences[i].length(); j++) {
                char[] arrSentences = sentences[i].toCharArray();
                if (arrSentences[j] == ' ') {
                    cnt++;
                }

                if (cnt > max) {
                    max = cnt;
                }
            }

            cnt = 1;
        }

        return max;
    }

    public static void main(String[] args) {
        System.out.print(mostWordsFound(new String[]{"alice and bob love leetcode", "i think so too", "this is great thanks very much"}));
    }
}
```
