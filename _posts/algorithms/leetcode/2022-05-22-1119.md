---
title: "[LeetCode] 1119. Remove Vowels from a String (Java)"
excerpt: "Remove Vowels from a String"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-22
last_modified_at: 2022-05-22
---

<https://leetcode.com/problems/remove-vowels-from-a-string/>

<br>

## Solution

```java
class Solution {
    public static String removeVowels(String str) {
        String answer = "";

        answer = str.toLowerCase().replaceAll("a", "")
                .replaceAll("e", "")
                .replaceAll("i", "")
                .replaceAll("o", "")
                .replaceAll("u", "");

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(removeVowels("leetcodeisacommunityforcoders"));
        System.out.println(removeVowels("aeiou"));
    }
}
```

<br>

## Another Solution

```java
import java.io.*;
import java.util.*;

public class Solution {
    public String removeVowels(String S) {
        StringBuilder resultString = new StringBuilder();
        Set<Character> vowels = new HashSet<Character>();
        //add all the vowels to a hashset
        vowels.add('a');
        vowels.add('e');
        vowels.add('i');
        vowels.add('o');
        vowels.add('u');
        //iterate through the string,character by character
        for (char c : S.toCharArray()) {
            //if the current character is not a vowel, then append it to the stringbuilder
            if (!vowels.contains(c)) {
                resultString.append(c);
            }
        }
        //convert the stringbuilder to string and return
        return resultString.toString();
    }
}
```
