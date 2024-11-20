---
title: "[Programmers] 문자열 내림차순으로 배치하기 (Java)"
excerpt: "문자열 내림차순으로 배치하기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-08
last_modified_at: 2022-05-08
---

<https://programmers.co.kr/learn/courses/30/lessons/12917>

### reverseOrder()

{: .box-note}
Returns a comparator that imposes the reverse of the natural ordering on a collection of objects that implement the Comparable interface.

[**Source**](https://docs.oracle.com/javase/8/docs/api/java/util/Collections.html)

<br>

### join(CharSequence delimiter, CharSequence... elements)

{: .box-note}
Returns a new String composed of copies of the CharSequence elements joined together with a copy of the specified delimiter.

[**Source**](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html)

<br>

## Solution

```java
import java.util.Arrays;
import java.util.Collections;

class Solution {
    public static String solution(String s) {
        String answer = "";

        String[] array = s.split("");
        Arrays.sort(array, Collections.reverseOrder());
        answer = String.join("", array);

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution("Zbcdefg"));
    }
}
```
<br>

## Another Solution

```java
import java.util.Arrays;

public class ReverseStr {
    public String reverseStr(String str){
    char[] sol = str.toCharArray();
    Arrays.sort(sol);
    return new StringBuilder(new String(sol)).reverse().toString();
    }

    public static void main(String[] args) {
        ReverseStr rs = new ReverseStr();
        System.out.println( rs.reverseStr("Zbcdefg") );
    }
}
```
