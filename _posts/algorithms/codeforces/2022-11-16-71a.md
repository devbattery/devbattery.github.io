---
title: "[Codeforces] 71A - Way Too Long Words (Java)"
excerpt: "Way Too Long Words"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-16
last_modified_at: 2022-11-16
---

<https://codeforces.com/problemset/problem/71/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class Solution {
    static List<String> solution(List<String> input) { 
        List<String> answer = new ArrayList<>();
        for (String s : input) {
            if (s.length() <= 10) {
                answer.add(s);
                continue;
            }

            int count = 0;
            for (int i = 1; i < s.length() - 1; i++) {
                count++;
            }
            answer.add(s.charAt(0) + String.valueOf(count) + s.charAt(s.length() - 1));
        }
        return answer;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<String> list = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            list.add(br.readLine());
        }
        for (String s : solution(list)) {
            System.out.println(s);
        }
        br.close();
    }
}
```