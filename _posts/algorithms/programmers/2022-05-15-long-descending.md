---
title: "[Programmers] 정수 내림차순으로 배치하기 (Java)"
excerpt: "정수 내림차순으로 배치하기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-15
last_modified_at: 2022-05-15
---

<https://programmers.co.kr/learn/courses/30/lessons/12933>

<br>

## Solution

```java
import java.util.Arrays;
import java.util.Collections;
import java.util.stream.Stream;

class Solution {
    public static long solution(long n) {
        long answer = 0;

        // long -> long array
        long[] list = Stream.of(String.valueOf(n).split("")).mapToLong(Integer::parseInt).toArray();
        Long[] listLong = Arrays.stream(list).boxed().toArray(Long[]::new); // long[] -> Long list
        Arrays.sort(listLong, Collections.reverseOrder()); // descending

        // arr -> string -> delete [ , ]
        String strLong = Arrays.toString(listLong).replace(", ", "").replace("[", "").replace("]", "");

        answer = Long.parseLong(strLong);
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(118372));
    }
}
```

<br>

## Another Solution

```java
import java.util.*;

class Solution {
    public long solution(long n) {
        return Long.parseLong(String.valueOf(n).chars().mapToObj(ch -> (char) ch)
                .sorted(Comparator.reverseOrder())
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString());
    }
}
```
