---
title: "[Codeforces] 282A - Bit++ (Java)"
excerpt: "Bit++"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-21
last_modified_at: 2022-11-21
---

<https://codeforces.com/problemset/problem/282/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException; 
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class Solution {
    public static int solution(List<String> stringList) {
        int answer = 0;
        for (String s : stringList) {
            if (s.equals("X++") || s.equals("++X")) {
                answer++;
            } else { // s.equals("X--") || s.equals("--X")
                answer--;
            }
        }
        return answer;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<String> stringList = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            stringList.add(br.readLine());
        }
        System.out.print(solution(stringList));
        br.close();
    }
}
```