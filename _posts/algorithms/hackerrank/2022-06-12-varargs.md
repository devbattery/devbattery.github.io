---
title: "[HackerRank] Java Varargs - Simple Addition"
excerpt: "Java Varargs - Simple Addition"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-12
last_modified_at: 2022-06-12
---

<https://www.hackerrank.com/challenges/simple-addition-varargs/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.lang.reflect.Method;
import java.util.*;

public class Solution {

    public static void main(String[] args) throws IOException {
        try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in))) {
            int n1 = Integer.parseInt(bufferedReader.readLine());
            int n2 = Integer.parseInt(bufferedReader.readLine());
            int n3 = Integer.parseInt(bufferedReader.readLine());
            int n4 = Integer.parseInt(bufferedReader.readLine());
            int n5 = Integer.parseInt(bufferedReader.readLine());
            int n6 = Integer.parseInt(bufferedReader.readLine());

            Add ad = new Add();
            ad.add(n1, n2);
            ad.add(n1, n2, n3);
            ad.add(n1, n2, n3, n4, n5);
            ad.add(n1, n2, n3, n4, n5, n6);

            Method[] methods = Add.class.getDeclaredMethods();
            Set<String> set = new HashSet<>();
            boolean overload = false;
            for (Method method : methods) {
                if (set.contains(method.getName())) {
                    overload = true;
                    break;
                }
                set.add(method.getName());

            }
            if (overload) {
                throw new Exception("Overloading not allowed");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

class Add {
    public void add(int... intArgs) {
        int sum = 0;
        String plus = "";

        for (int i : intArgs) {
            sum += i;
            System.out.print(plus + i);
            plus = "+";
        }

        System.out.println("=" + sum);
    }
}
```