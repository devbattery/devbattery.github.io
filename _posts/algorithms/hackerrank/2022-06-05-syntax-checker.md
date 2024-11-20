---
title: "[HackerRank] Java Syntax Checker"
excerpt: "Java Syntax Checker"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-05
last_modified_at: 2022-06-05
---

<https://www.hackerrank.com/challenges/pattern-syntax-checker/problem?isFullScreen=true>

### compile()

{: .box-note}
Compiles the given regular expression into a pattern.<br>
Parameters:<br>
regex - The expression to be compiled<br>
Throws:<br>
PatternSyntaxException - If the expression's syntax is invalid


[**Source**](https://docs.oracle.com/javase/6/docs/api/java/util/regex/Pattern.html#compile%28java.lang.String%29)

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

public class Solution {

    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        int testCases = Integer.parseInt(bufferedReader.readLine());

        while (testCases > 0) {
            String pattern = bufferedReader.readLine();
            try {
                Pattern.compile(pattern);
                System.out.println("Valid");
            } catch (PatternSyntaxException e) {
                System.out.println("Invalid");
            }

            testCases--;
        }
    }
}
```