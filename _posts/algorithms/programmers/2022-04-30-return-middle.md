---
title: "[Programmers] 가운데 글자 가져오기 (Java)"
excerpt: "가운데 글자 가져오기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-04-30
last_modified_at: 2022-04-30
---

<https://programmers.co.kr/learn/courses/30/lessons/12903>

<br>


## Solution

```java
class Solution {
    public static String solution(String s) {
        String answer = "";

        if (s.length() % 2 == 0) { // s.length(): Even
            answer = s.substring(s.length() / 2 - 1 , s.length() / 2 + 1);
        } else { // s.length(): Odd
            answer = s.substring(s.length() / 2, s.length() / 2 + 1);
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution("abcde"));
        System.out.println(solution("abcdefg"));

        System.out.println(solution("qwer"));
        System.out.println(solution("qwerty"));
    }
}
```
<br>

## Another Solution

```java
class StringExercise{
    String getMiddle(String word){

        return word.substring((word.length()-1) / 2, word.length()/2 + 1);    
    }
    
    public static void  main(String[] args){
        StringExercise se = new StringExercise();
        System.out.println(se.getMiddle("power"));
    }
}
``` 
