---
title: "[Codeforces] 158A - Next Round (Java)"
excerpt: "Next Round"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-11-19
last_modified_at: 2022-11-19
---

<https://codeforces.com/problemset/problem/158/A>

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
    public static int solution(int n, int k, List<Integer> input) {
        int count = 0;
        k = input.get(k - 1);
        for (int i = 0; i < n; i++) {
            if (input.get(i) > 0 && input.get(i) >= k) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine(), " ");
        int n = Integer.parseInt(st.nextToken());
        int k = Integer.parseInt(st.nextToken());
        List<Integer> input = new ArrayList<>();
        st = new StringTokenizer(br.readLine(), " ");
        for (int i = 0; i < n; i++) {
            input.add(Integer.parseInt(st.nextToken()));
        }
        System.out.print(solution(n, k, input));
        br.close();
    }
}
```