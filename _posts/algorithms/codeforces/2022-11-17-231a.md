---
title: "[Codeforces] 231A - Team (Java)"
excerpt: "Team"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-17
last_modified_at: 2022-11-17
---

<https://codeforces.com/problemset/problem/231/A>

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
    static int solution(List<List<Integer>> listList) {
        int answer = 0;
        for (List<Integer> integerList : listList) {
            int count = 0;
            for (Integer integer : integerList) {
                if (integer == 1) {
                    count++;
                }
            }
            if (count >= 2) {
                answer++;
            }
        }
        return answer;
    }

    public static void main(String[] args) throws IOException {
        List<List<Integer>> listList = new ArrayList<>();
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        for (int i = 0; i < n; i++) {
            List<Integer> list = new ArrayList<>();
            StringTokenizer st = new StringTokenizer(br.readLine(), " ");
            while (st.hasMoreTokens()) {
                list.add(Integer.parseInt(st.nextToken()));
            }
            listList.add(list);
        }
        System.out.print(solution(listList));
        br.close();
    }
}
```