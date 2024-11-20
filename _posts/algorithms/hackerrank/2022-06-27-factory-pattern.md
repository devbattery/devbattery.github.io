---
title: "[HackerRank] Java Factory Pattern"
excerpt: "Java Factory Pattern"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-27
last_modified_at: 2022-06-27
---

<https://www.hackerrank.com/challenges/java-factory/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.security.Permission;
import java.util.*;

interface Food {
    public String getType();
}

class Pizza implements Food {
    @Override
    public String getType() {
        return "Someone ordered a Fast Food!";
    }
}

class Cake implements Food {
    @Override
    public String getType() {
        return "Someone ordered a Dessert!";
    }
}

class FoodFactory {
    public Food getFood(String order) {
        switch (order) {
            case "pizza":
                return new Pizza();
            case "cake":
                return new Cake();
            default:
                return null;
        }
    }
}

public class Solution {
    static class DoNotTerminate {
        public static class ExitTrappedException extends SecurityException {
            private static final long serialVersionID = 1L;
        }

        public void forbidExit() {
            final SecurityManager securityManager = new SecurityManager() {
                @Override
                public void checkPermission(Permission perm) {
                    if (perm.getName().contains("exitVM")) {
                        throw new ExitTrappedException();
                    }
                }
            };
        }
    }

    public static void main(String[] args) {
        DoNotTerminate doNotTerminate = new DoNotTerminate();
        doNotTerminate.forbidExit();

        try (Scanner sc = new Scanner(System.in)) {
            FoodFactory foodFactory = new FoodFactory();
            Food food = foodFactory.getFood(sc.nextLine());

            System.out.println("The factory returned " + food.getClass());
            System.out.println(food.getType());
        } catch (DoNotTerminate.ExitTrappedException e) {
            System.out.println("Unsuccessful Termination!!");
        }
    }
}
```