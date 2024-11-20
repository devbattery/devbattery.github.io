---
title: "[HackerRank] Java Instanceof keyword"
excerpt: "Java Instanceof keyword"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-24
last_modified_at: 2022-06-24
---

<https://www.hackerrank.com/challenges/java-instanceof-keyword/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

class Student {
}

class RockStar {
}

class Hacker {
}

public class Solution {

    static String count(ArrayList list) {
        String ret = "";
        int a = 0, b = 0, c = 0;

        for (Object element : list) {
            if (element instanceof Student) {
                a++;
            } else if (element instanceof RockStar) {
                b++;
            } else if (element instanceof Hacker) {
                c++;
            }
        }

        return a + " " + b + " " + c;
    }

    public static void main(String[] args) {
        ArrayList list = new ArrayList();

        try (Scanner sc = new Scanner(System.in)) {
            int t = sc.nextInt();

            for (int i = 0; i < t; i++) {
                String s = sc.next();

                switch (s) {
                    case "Student":
                        list.add(new Student());
                        break;
                    case "Rockstar":
                        list.add(new RockStar());
                        break;
                    case "Hacker":
                        list.add(new Hacker());
                        break;
                }
            }

            System.out.print(count(list));
        }
    }
}
```