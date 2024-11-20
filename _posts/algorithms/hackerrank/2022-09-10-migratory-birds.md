---
title: "[HackerRank] Migratory Birds (Java)"
excerpt: "Migratory Birds"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-10
last_modified_at: 2022-09-10
---

<https://www.hackerrank.com/challenges/migratory-birds/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;

class Result {
    static int migratoryBirds(List<Integer> arr) {
        int[] count = new int[arr.size() + 1];
        for (Integer integer : arr) {
            count[integer]++;
        }

        int answer = 1;
        for (int i = 0; i < count.length; i++) {
            if (count[i] > count[answer]) {
                answer = i;
            }
        }

        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> arr = new ArrayList<>();
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            arr.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(Result.migratoryBirds(arr));
        br.close();
    }
}
```