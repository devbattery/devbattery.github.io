---
title: "[Programmers] 문자열 다루기 기본 (Java)"
excerpt: "문자열 다루기 기본"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-03
last_modified_at: 2022-05-03
---

<https://programmers.co.kr/learn/courses/30/lessons/12918>

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
    public static boolean solution(String s) {
        boolean answer = true;

        if (s.length() >= 1 && s.length() <= 8) {
            if (s.length() == 4 || s.length() == 6) {
                for (int i = 0; i < s.length(); i++) {
                    if (!Character.isDigit(s.charAt(i))) { // is not a number
                        answer = false;
                    }
                }
            } else { // **
                return false;
            }
        } else { // **
            return false;
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution("a234"));
        System.out.println(solution("1234"));
    }
}
```
<br>

## Another Solution

```java
class Solution {
  public boolean solution(String s) {
      if(s.length() == 4 || s.length() == 6){
          try{
              int x = Integer.parseInt(s);
              return true;
          } catch(NumberFormatException e){
              return false;
          }
      }
      else return false;
  }
}
```
