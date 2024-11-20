---
title: "[HackerRank] Bill Division (Java)"
excerpt: "Bill Division"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-09-05
last_modified_at: 2022-09-05
---

<https://www.hackerrank.com/challenges/bon-appetit/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;
import java.util.stream.Stream;

import static java.util.stream.Collectors.toList;

class Result {
    static void bonAppetit(List<Integer> bill, int k, int b) {
        int totalBill = 0;
        for (int i = 0; i < bill.size(); i++) {
            if (i == k) {
                continue;
            }
            totalBill += bill.get(i);
        }
        if (totalBill / 2 == b) {
            System.out.print("Bon Appetit");
        } else {
            System.out.print(b - totalBill / 2);
        }
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));

        String[] firstMultipleInput = bufferedReader.readLine().replaceAll("\\s+$", "").split(" ");

        int n = Integer.parseInt(firstMultipleInput[0]);

        int k = Integer.parseInt(firstMultipleInput[1]);

        List<Integer> bill = Stream.of(bufferedReader.readLine().replaceAll("\\s+$", "").split(" "))
                .map(Integer::parseInt)
                .collect(toList());

        int b = Integer.parseInt(bufferedReader.readLine().trim());

        Result.bonAppetit(bill, k, b);

        bufferedReader.close();
    }
}
```