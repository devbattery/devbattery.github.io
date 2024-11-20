---
title: "[Programmers] 제일 작은 수 제거하기 (Java)"
excerpt: "제일 작은 수 제거하기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-12
last_modified_at: 2022-05-12
---

<https://programmers.co.kr/learn/courses/30/lessons/12935>

<br>

## Solution

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public static int[] solution(int[] arr) {
        int[] answer = {};
        Integer[] arrInteger = Arrays.stream(arr).boxed().toArray(Integer[]::new); // int[] -> Integer[]
        List<Integer> list = new ArrayList<>(Arrays.asList(arrInteger));
        int min = list.get(0);

        for (int num : arr) {
            if (num < min) {
                min = num;
            }
        }

        if (min == list.get(0)) {
            answer = new int[]{-1};
        } else {
            list.remove(Integer.valueOf(min)); // delete min
            answer = list.stream().mapToInt(i -> i).toArray(); // List<Integer> -> int[]
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(solution(new int[]{4, 3, 2, 1})));
        System.out.println(Arrays.toString(solution(new int[]{10})));
    }
}
```
<br>

## Another Solution

```java
import java.util.Arrays;
import java.util.stream.Stream;
import java.util.List;
import java.util.ArrayList;

class Solution {
  public int[] solution(int[] arr) {
      if (arr.length <= 1) return new int[]{ -1 };
      int min = Arrays.stream(arr).min().getAsInt();
      return Arrays.stream(arr).filter(i -> i != min).toArray();
  }
}
```
