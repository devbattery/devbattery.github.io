---
title: "[Programmers] 핸드폰 번호 가리기 (Java)"
excerpt: "핸드폰 번호 가리기"

categories:
  - Programmers
tags:
  - [java, algorithms]

toc: true
toc_sticky: true

date: 2022-04-25
last_modified_at: 2022-04-25
---

<https://programmers.co.kr/learn/courses/30/lessons/12948>

<br>


## Solution

```java
class Solution {
    public static String solution(String phone_number) {
        String answer = "";

        if (phone_number.length() < 4 || phone_number.length() > 20) { // limit
            return null;
        }

        answer = phone_number.substring(phone_number.length() - 4, phone_number.length());

        for (int i = 0; i < phone_number.length() - 4; i++) {
            answer = "*" + answer;
        }


        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution("01012345678"));
        System.out.println(solution("12345676"));
    }
}
```

<br>

## Another Solution

```java
class Solution {
  public String solution(String phone_number) {
     char[] ch = phone_number.toCharArray();
     for(int i = 0; i < ch.length - 4; i ++){
         ch[i] = '*';
     }
     return String.valueOf(ch);
  }
}
```
