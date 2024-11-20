---
title: "[HackerRank] Java Regex 2 - Duplicate Words"
excerpt: "Java Regex 2 - Duplicate Words"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-28
last_modified_at: 2022-06-28
---

<https://www.hackerrank.com/challenges/duplicate-word/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Solution {

    public static void main(String[] args) throws IOException {
        String regex = "\\b(\\w+)(?:\\W+\\1\\b)+";

        Pattern p = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
        try (BufferedReader br = new BufferedReader(new InputStreamReader(System.in))) {
            int numSentences = Integer.parseInt(br.readLine());

            while (numSentences > 0) {
                String input = br.readLine();
                Matcher m = p.matcher(input);

                while (m.find()) {
                    input = input.replaceAll(m.group(), m.group(1));
                }

                System.out.println(input);

                numSentences--;
            }
        }
    }
}
```