---
title: "[HackerRank] Java Substring Comparisons"
excerpt: "Java Substring Comparisons"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-01
last_modified_at: 2022-06-01
---

<https://www.hackerrank.com/challenges/java-string-compare/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Solution {
    public static String getSmallestAndLargest(String s, int k) {
        String smallest = "";
        String largest = "";

        String tmp = s.substring(0, k);
        smallest = tmp;
        largest = tmp;

        for (int i = 1; i <= s.length() - k; i++) {
            tmp = s.substring(i, (i + k));

            if (tmp.compareTo(smallest) < 0) {
                smallest = tmp;
            }

            if (tmp.compareTo(largest) > 0) {
                largest = tmp;
            }
        }

        return smallest + "\n" + largest;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        String s = bufferedReader.readLine();
        int k = Integer.parseInt(bufferedReader.readLine().trim());

        System.out.println(getSmallestAndLargest(s, k));

        bufferedReader.close();
    }
}
```

<br>

## Another Solution

```java
import java.util.Scanner;
import java.util.SortedSet;
import java.util.TreeSet;

public class Solution {
    public static void main(String[] args) {
        Scanner scan = new Scanner(System.in);
        String str = scan.next();
        int k = scan.nextInt();
        SortedSet<String> sets = new TreeSet<>();
        for (int i = 0; i <= str.length() - k; i++) {
            sets.add(str.substring(i, i + k));
        }
        System.out.println(sets.first());
        System.out.println(sets.last());
    }
}
```