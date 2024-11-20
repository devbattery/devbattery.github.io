---
title: "[HackerRank] Making Anagrams (Java)"
excerpt: "Making Anagrams"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-01
last_modified_at: 2022-11-01
---

<https://www.hackerrank.com/challenges/making-anagrams/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;

class Result {
    static int makingAnagrams(String s1, String s2) {
        int count = 0; 
        int[] alpha = new int[26];
        for (int i = 0; i < s1.length(); i++) {
            alpha[s1.charAt(i) - 'a']++;
        }
        for (int i = 0; i < s2.length(); i++) {
            alpha[s2.charAt(i) - 'a']--;
        }
        for (int i = 0; i < 26; i++) {
            count += Math.abs(alpha[i]);
        }
        return count;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        String s1 = bufferedReader.readLine();

        String s2 = bufferedReader.readLine();

        int result = Result.makingAnagrams(s1, s2);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```