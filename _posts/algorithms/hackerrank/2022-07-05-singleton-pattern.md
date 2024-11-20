---
title: "[HackerRank] Java Singleton Pattern?"
excerpt: "Java Singleton Pattern?"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-07-04
last_modified_at: 2022-07-04
---

<https://www.hackerrank.com/challenges/java-singleton/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;
import java.text.*;
import java.math.*;
import java.util.regex.*;
import java.lang.reflect.*;


class Singleton {
    private volatile static Singleton instance;
    public static String str;
    private Singleton() {}
    
    static Singleton getSingleInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```