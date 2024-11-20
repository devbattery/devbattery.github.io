---
title: "[HackerRank] Java Map"
excerpt: "Java Map"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-19
last_modified_at: 2022-06-19
---

<https://www.hackerrank.com/challenges/phone-book/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

public class Solution {

    public static void main(String[] args) throws IOException {
        try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in))) {
            int n = Integer.parseInt(bufferedReader.readLine());
            Map<String, Integer> map = new HashMap<>();

            while (n > 0) {
                String name = bufferedReader.readLine();
                int phone = Integer.parseInt(bufferedReader.readLine());
                map.put(name, phone);
                n--;
            }

            String s = "";
            while ((s = bufferedReader.readLine()) != null) {
                if (map.containsKey(s)) {
                    System.out.println(s + "=" + map.get(s));
                } else {
                    System.out.println("Not found");
                }
            }
        }
    }
}
```