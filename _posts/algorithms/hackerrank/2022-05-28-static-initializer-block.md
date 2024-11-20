---
title: "[HackerRank] Java Static Initializer Block"
excerpt: "Java Static Initializer Block"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-28
last_modified_at: 2022-05-28
---

<https://www.hackerrank.com/challenges/java-static-initializer-block/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.text.*;
import java.math.*;
import java.util.regex.*;

public class Solution {

    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        int B = Integer.parseInt(bufferedReader.readLine().trim());
        int H = Integer.parseInt(bufferedReader.readLine().trim());

        if (B <= 0 || H <= 0) {
            System.out.println("java.lang.Exception: Breadth and height must be positive\n");
        } else {
            System.out.println(B * H);
        }

        bufferedReader.close();
    }//end of main

}//end of class
```

<br>

## Another Solution

```java
import java.io.*;
import java.util.*;
import java.text.*;
import java.math.*;
import java.util.regex.*;

public class Solution {

    static Scanner scan = new Scanner(System.in);
    static int B = scan.nextInt();
    static int H = scan.nextInt();
    static boolean flag = true;

    static {
        try {
            if (B <= 0 || H <= 0) {
                flag = false;
                throw new Exception("Breadth and height must be positive");
            }
        } catch (Exception e) {
            System.out.println(e);
        }

    }

    public static void main(String[] args) {
        if (flag) {
            int area = B * H;
            System.out.print(area);
        }

    }//end of main

}//end of class
```