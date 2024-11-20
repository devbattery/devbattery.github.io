---
title: "[HackerRank] Cut the sticks (Java)"
excerpt: "Cut the sticks"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-27
last_modified_at: 2022-09-27
---

<https://www.hackerrank.com/challenges/cut-the-sticks/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

class Result {
    static List<Integer> cutTheSticks(List<Integer> arr) {
        List<Integer> answer = new ArrayList<>();
        Collections.sort(arr);
        for (int i = 1; i < arr.size(); i++) {
            if (!arr.get(i).equals(arr.get(i - 1))) {
                answer.add(arr.size() - i);
            }
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        List<Integer> arr = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            arr.add(Integer.parseInt(st.nextToken()));
        }
        System.out.println(n);
        for (Integer x : Result.cutTheSticks(arr)) {
            System.out.println(x);
        }
        br.close();
    }
}
```