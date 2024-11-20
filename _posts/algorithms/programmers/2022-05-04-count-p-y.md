---
title: "[Programmers] 문자열 내 p와 y의 개수 (Java)"
excerpt: "문자열 내 p와 y의 개수"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-04
last_modified_at: 2022-05-04
---

<https://programmers.co.kr/learn/courses/30/lessons/12916>

## charAt()
```java
public char charAt​(int index)
```
Returns the char value at the specified index.<br>
An index ranges from 0 to length() - 1.<br>
The first char value of the sequence is at index 0, the next at index 1, and so on, as for array indexing.<br>
If the char value specified by the index is a surrogate, the surrogate value is returned.<br>
<br>
Specified by:<br>
charAt in interface CharSequence<br>
Parameters:<br>
index - the index of the char value.<br>
Returns:<br>
the char value at the specified index of this string. The first char value is at index 0.<br>
Throws:<br>
IndexOutOfBoundsException - if the index argument is negative or not less than the length of this string.<br>

[**Source**](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/String.html)

<br>

## Solution

```java
class Solution {
    static boolean solution(String s) {
        boolean answer = true;

        String lowerStr = s.toLowerCase();

        int countP = 0;
        int countY = 0;

        for (int i = 0; i < lowerStr.length(); i++) {
            if (lowerStr.charAt(i) == 'p') {
                countP++;
            } else if (lowerStr.charAt(i) == 'y') {
                countY++;
            }
        }

        if (countP != countY) { // only if count is different -> return true
            answer = false;
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution("pPoooyY"));
        System.out.println(solution("Pyy"));
    }
}
```
<br>

## Another Solution

```java
class Solution {
    boolean solution(String s) {
        s = s.toLowerCase();
        int count = 0;

        for (int i = 0; i < s.length(); i++) {

            if (s.charAt(i) == 'p')
                count++;
            else if (s.charAt(i) == 'y')
                count--;
        }

        if (count == 0)
            return true;
        else
            return false;
    }
}
```
