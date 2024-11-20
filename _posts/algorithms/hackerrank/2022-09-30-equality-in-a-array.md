---
title: "[HackerRank] Equalize the Array (Java)"
excerpt: "Equalize the Array"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-30
last_modified_at: 2022-09-30
---

<https://www.hackerrank.com/challenges/equality-in-a-array/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

class Result {
    static int equalizeArray(List<Integer> arr) {
        int answer = 0;
        int max = 1;
        Map<Integer, Integer> nums = new HashMap<>();
        for (Integer i : arr) {
            if (!nums.containsKey(i)) {
                nums.put(i, 1);
            } else {
                nums.put(i, nums.get(i) + 1);
                if (max < nums.get(i)) {
                    max = nums.get(i);
                }
            }
        }
        answer = arr.size() - max;
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
            arr.add(Integer.valueOf(st.nextToken()));
        }
        System.out.print(Result.equalizeArray(arr));
        br.close();
    }
}
```