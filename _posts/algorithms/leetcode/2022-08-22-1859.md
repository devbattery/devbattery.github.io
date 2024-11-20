---
title: "[LeetCode] 1859. Sorting the Sentence (Java)"
excerpt: "Sorting the Sentence"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-22
last_modified_at: 2022-08-22
---

<https://leetcode.com/problems/sorting-the-sentence/>

<br>

## Solution

```java
class Solution {
    static String sortSentence(String s) {
        String[] tmp = s.split(" ");
        String[] answer = new String[tmp.length];
        for (int i = 0; i < tmp.length; i++) {
            for (int j = 0; j < tmp[i].length(); j++) {
                char[] tmpChar = tmp[i].toCharArray();
                int tmpCnt;
                if (j == tmp[i].length() - 1) {
                    tmpCnt = Integer.parseInt(String.valueOf(tmpChar[j])); // tmpChar -> String -> Integer
                    tmp[i] = tmp[i].replaceAll(String.valueOf(tmpCnt), "");
                    answer[tmpCnt - 1] = tmp[i];
                }
            }
        }
        StringBuilder returnAnswer = new StringBuilder();
        for (String value : answer) {
            returnAnswer.append(value).append(" ");
        }
        return returnAnswer.substring(0, returnAnswer.length() - 1);
    }

    public static void main(String[] args) {
        System.out.println(sortSentence("is2 sentence4 This1 a3"));
        System.out.print(sortSentence("Myself2 Me1 I4 and3"));
    }
}
```