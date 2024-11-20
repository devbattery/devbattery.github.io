---
title: "[Programmers] 서울에서 김서방 찾기"
excerpt: "서울에서 김서방 찾기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-02
last_modified_at: 2022-05-02
---

<https://programmers.co.kr/learn/courses/30/lessons/12919>

<br>


## Solution

```java
import java.util.Objects;

class Solution {
    public static String solution(String[] seoul) {
        String answer = "";

        int num = 0;
        for (int i = 0; i < seoul.length; i++) {
            if (Objects.equals(seoul[i], "Kim")) {
                num = i;
            }
        }

        answer = "김서방은 " + num + "에 있다";

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(new String[]{"Kim", "Jane"}));
        System.out.println(solution(new String[]{"Jane", "Kim"}));
        System.out.println(solution(new String[]{"Jeong", "Jang", "Kim", "Jane"}));
    }
}
```
<br>

## Another Solution

```java
import java.util.Arrays;

public class FindKim {
    public String findKim(String[] seoul){
        int x = Arrays.asList(seoul).indexOf("Kim");
        return "김서방은 "+ x + "에 있다";
    }

    public static void main(String[] args) {
        FindKim kim = new FindKim();
        String[] names = {"Queen", "Tod","Kim"};
        System.out.println(kim.findKim(names));
    }
}
```
