---
title: "[HackerRank] Can You Access?"
excerpt: "Can You Access?"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-07-04
last_modified_at: 2022-07-04
---

<https://www.hackerrank.com/challenges/can-you-access/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.security.Permission;
import java.util.*;

public class Solution {

    public static void main(String[] args) throws Exception {
        DoNotTerminate.forbidExit();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(System.in))) {
            int num = Integer.parseInt(br.readLine().trim());
            Inner.Private o = new Inner.Private();
            System.out.println(num + " is" + o.powerOfTwo(num));
            System.out.println("An instance of class: " + o.getClass().getCanonicalName() + " has been created");
        } catch (DoNotTerminate.ExitTrappedException e) {
            System.out.println("Unsuccessful Termination!!");
        }
    }

    static class Inner {
        private static class Private {
            private String powerOfTwo(int num) {
                return ((num & num - 1) == 0) ? " power of 2" : " not a power of 2";
            }
        }
    }
}

class DoNotTerminate {
    public static class ExitTrappedException extends SecurityException {
        private static final long serialVersionID = 1L;
    }

    public static void forbidExit() {
        final SecurityManager securityManager = new SecurityManager() {
            @Override
            public void checkPermission(Permission perm) {
                if (perm.getName().contains("exitVM")) {
                    throw new ExitTrappedException();
                }
            }
        };

        System.setSecurityManager(securityManager);
    }
}
```