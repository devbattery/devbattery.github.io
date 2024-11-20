---
title: "[Programmers] 문자열 내 마음대로 정렬하기 (Java)"
excerpt: "문자열 내 마음대로 정렬하기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-18
last_modified_at: 2022-05-18
---

<https://programmers.co.kr/learn/courses/30/lessons/12915>

<br>

## Solution

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

class Solution {
    public static String[] solution(String[] strings, int n) {
        String[] answer = {};

        List<String> exactedArr = new ArrayList<>();

        for (int i = 0; i < strings.length; i++) {
            exactedArr.add(strings[i].charAt(n) + strings[i]);
        }

        Collections.sort(exactedArr); // ascending

        answer = new String[exactedArr.size()];
        for (int i = 0; i < exactedArr.size(); i++) {
            answer[i] = exactedArr.get(i).substring(1);
        }

        return answer;
    }


    public static void main(String[] args) {
        System.out.println(Arrays.toString(solution(new String[]{"sun", "bed", "car"}, 1)));
        System.out.println(Arrays.toString(solution(new String[]{"abce", "abcd", "cdx"}, 2)));
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
