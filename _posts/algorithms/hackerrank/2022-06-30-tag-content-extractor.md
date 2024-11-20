---
title: "[HackerRank] Tag Content Extractor"
excerpt: "Tag Content Extractor"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-30
last_modified_at: 2022-06-30
---

<https://www.hackerrank.com/challenges/tag-content-extractor/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Solution {

    public static void main(String[] args) {
       try (Scanner sc = new Scanner(System.in)) {
           int testCases = Integer.parseInt(sc.nextLine());

           while (testCases-- > 0) {
               String line = sc.nextLine();
               boolean matchFound = false;
               Pattern r = Pattern.compile("<(.+)>([^<]+)</\\1>");
               Matcher m = r.matcher(line);

               while (m.find()) {
                   System.out.println(m.group(2));
                   matchFound = true;
               }

               if (!matchFound) {
                   System.out.println("None");
               }
           }
       }
    }
}
```