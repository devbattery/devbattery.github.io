---
title: "[Programmers] 3진법 뒤집기 (Java)"
excerpt: "3진법 뒤집기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-01-15
last_modified_at: 2023-01-15
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/68935)

<br>

## Solution

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class Solution {
    public static int solution(int n) {
        int answer = 0;
        List<Integer> list = new ArrayList<>();
        while (n != 0) { // 2진법과 같이 3진법은 3으로 떨어진다
            list.add(n % 3);
            n /= 3;
        }
        Collections.reverse(list); // 컬렉션 클래스로 배열 뒤집기
        for (int i = 0; i < list.size(); i++) {
            answer += list.get(i) * Math.pow(3, i); // 3의 i승 (2진법 변환을 떠올려라)
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(45));
        System.out.print(solution(125));
    }
}
```