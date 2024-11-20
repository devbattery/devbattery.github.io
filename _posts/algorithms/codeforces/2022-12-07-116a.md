---
title: "[Codeforces] 116A - Tram (Java)"
excerpt: "Tram"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-07
last_modified_at: 2022-12-07
---

<https://codeforces.com/problemset/problem/116/A>

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
    public static int Tram(List<List<Integer>> inputs) {
        int enter, exit;
        int current = 0, min = 0;
        for (List<Integer> input : inputs) {
            exit = input.get(0);
            enter = input.get(1);

            current -= exit;
            current += enter;

            if (current > min) {
                min = current;
            }
        }
        return min;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<List<Integer>> inputs = new ArrayList<>();
        int n = Integer.parseInt(br.readLine());
        for (int i = 0; i < n; i++) {
            List<Integer> input = new ArrayList<>();
            StringTokenizer st = new StringTokenizer(br.readLine(), " ");
            input.add(Integer.parseInt(st.nextToken()));
            input.add(Integer.parseInt(st.nextToken()));
            inputs.add(input);
        }
        System.out.print(Tram(inputs));
        br.close();
    }
}
```