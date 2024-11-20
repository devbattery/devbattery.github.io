---
title: "[Programmers] 시저 암호"
excerpt: "시저 암호"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-16
last_modified_at: 2022-05-16
---

<https://programmers.co.kr/learn/courses/30/lessons/12926>

<br>

## Solution

```java
import java.util.Arrays;

class Solution {
    public static String solution(String s, int n) {
        String answer = "";
        char[] arr = s.toCharArray();

        for (int i = 0; i < s.length(); i++) {
            if (arr[i] == ' ') {
                continue;
            } else if (arr[i] >= 'a' && arr[i] <= 'z') {
                if (arr[i] + n > 'z') {
                    arr[i] = (char) (arr[i] - 26 + n);
                    continue;
                }
                arr[i] += n;
            } else if (arr[i] >= 'A' && arr[i] <= 'Z') {
                if (arr[i] + n > 'Z') {
                    arr[i] = (char) (arr[i] - 26 + n);
                    continue;
                }
                arr[i] += n;
            }
        }

        answer = String.valueOf(arr);
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution("AB", 1));
        System.out.println(solution("z", 1));
        System.out.println(solution("a B z", 4));
    }
}
```

<br>

## Another Solution

```java
class Caesar {
    String caesar(String s, int n) {
        String result = "";
    n = n % 26;
    for (int i = 0; i < s.length(); i++) {
      char ch = s.charAt(i);
      if (Character.isLowerCase(ch)) {
        ch = (char) ((ch - 'a' + n) % 26 + 'a');
      } else if (Character.isUpperCase(ch)) {
        ch = (char) ((ch - 'A' + n) % 26 + 'A');
      }
      result += ch;
    }
        return result;
    }

    public static void main(String[] args) {
        Caesar c = new Caesar();
        System.out.println("s는 'a B z', n은 4인 경우: " + c.caesar("a B z", 4));
    }
}
```
