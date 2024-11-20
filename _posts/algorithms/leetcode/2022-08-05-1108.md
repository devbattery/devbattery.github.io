---
title: "[LeetCode] 1108. Defanging an IP Address (Java)"
excerpt: "Defanging an IP Address"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-05
last_modified_at: 2022-08-05
---

<https://leetcode.com/problems/defanging-an-ip-address/submissions/>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    static String defangIPaddr(String input) {
        return input.replaceAll("\\.", "[.]");
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine();
        System.out.print(defangIPaddr(input));
        br.close();
    }
}
/*
    public String defangIPaddr(String address) {
        return address.replace(".", "[.]");
    }

    public String defangIPaddr(String address) {
        return String.join("[.]", address.split("\\."));
    }

    public String defangIPaddr(String address) {
        return address.replaceAll("\\.", "[.]");
    }

    public String defangIPaddr(String address) {
        StringBuilder sb = new StringBuilder();
        for (char c : address.toCharArray()) {
            sb.append(c == '.' ? "[.]" : c);
        }
        return sb.toString();
    }
*/

```
