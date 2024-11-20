---
title: "[HackerRank] Valid Username Regular Expression"
excerpt: "Valid Username Regular Expression"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-29
last_modified_at: 2022-06-29
---

<https://www.hackerrank.com/challenges/valid-username-checker/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

class UserNameValidator {
    public static final String regularExpression = "(^[a-zA-Z][0-9_|a-zA-Z]{7,29})";
}

public class Solution {

    public static void main(String[] args) throws IOException {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(System.in))) {
            int n = Integer.parseInt(br.readLine());

            while (n-- != 0) {
                String userName = br.readLine();

                if (userName.matches(UserNameValidator.regularExpression)) {
                    System.out.println("Valid");
                } else {
                    System.out.println("Invalid");
                }
            }
        }
    }
}

```