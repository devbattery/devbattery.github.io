---
title: "[Codeforces] 136A - Presents (Java)"
excerpt: "Presents"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-15
last_modified_at: 2022-12-15
---

<https://codeforces.com/problemset/problem/136/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;

public class Solution {
    static int[] returnEqualNumber(List<Integer> input) {
        int[] answer = new int[input.size()];
        for (int i = 0; i < input.size(); i++) {
            int tmpNo = input.get(i);
            answer[tmpNo - 1] = i;
        }
        return answer;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> input = new ArrayList<>(n);
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            input.add(Integer.parseInt(st.nextToken()));
        }
        for (Integer i : returnEqualNumber(input)) {
            System.out.print(i + 1 + " ");
        }
        br.close();
    }
}
```