---
title: "[Codeforces] 467A - George and Accommodation (Java)"
excerpt: "George and Accommodation"

categories:
  - Codeforces
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-12-14
last_modified_at: 2022-12-14
---

<https://codeforces.com/problemset/problem/467/A>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Solution {
    static int returnRooms(int[][] input) {
        int count = 0;
        for (int[] ints : input) {
            // input[i][0]: p
            // input[i][1]: q
            if (ints[1] - ints[0] >= 2) {
                count++;
            }
        }
        return count;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        int[][] input = new int[n][2];
        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine(), " ");
            input[i][0] = Integer.parseInt(st.nextToken());
            input[i][1] = Integer.parseInt(st.nextToken());
        }
        System.out.print(returnRooms(input));
        br.close();
    }
}
```