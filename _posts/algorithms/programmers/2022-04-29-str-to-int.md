---
title: "[Programmers] 문자열을 정수로 바꾸기 (Java)"
excerpt: "문자열을 정수로 바꾸기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-04-29
last_modified_at: 2022-04-29
---

<https://programmers.co.kr/learn/courses/30/lessons/12925>

<br>


## Solution

```java
class Solution {
    public static int solution(String s) {
        int answer = 0;

        if (s.length() < 1 || s.length() > 5) {
            return -1;
        }

        answer = Integer.parseInt(s);


        return answer;

    }

    public static void main(String[] args) {
        System.out.println(solution("-1234"));
    }
}
```
<!-- 
<br>

## Another Solution

```java

``` 
-->
