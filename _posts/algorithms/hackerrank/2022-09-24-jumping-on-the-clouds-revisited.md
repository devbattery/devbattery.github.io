---
title: "[HackerRank] Jumping on the Clouds: Revisited (Java)"
excerpt: "Jumping on the Clouds: Revisited"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-24
last_modified_at: 2022-09-24
---

<https://www.hackerrank.com/challenges/jumping-on-the-clouds-revisited/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

public class Solution {
    static int jumpingOnClouds(int[] c, int k) {
        int answer = 100, jump = 0;
        do {
            answer--;
            if (c[jump] == 1) {
                answer -= 2;
            }
            jump = (jump + k) % c.length;
        } while (jump != 0);
        return answer;
    }

    private static final Scanner scanner = new Scanner(System.in);

    public static void main(String[] args) throws IOException {
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        String[] nk = scanner.nextLine().split(" ");

        int n = Integer.parseInt(nk[0]);

        int k = Integer.parseInt(nk[1]);

        int[] c = new int[n];

        String[] cItems = scanner.nextLine().split(" ");
        scanner.skip("(\r\n|[\n\r\u2028\u2029\u0085])?");

        for (int i = 0; i < n; i++) {
            int cItem = Integer.parseInt(cItems[i]);
            c[i] = cItem;
        }

        int result = jumpingOnClouds(c, k);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedWriter.close();

        scanner.close();
    }
}
```