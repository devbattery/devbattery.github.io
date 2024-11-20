---
title: "[Programmers] 실패율 (Java)"
excerpt: "2019 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-02-18
last_modified_at: 2023-02-18
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/42889)

<br>

## Solution

```java
package programmers.sully.week3;

import java.util.*;

class 실패율 {
    // (스테이지 도달했으나, 클리어 x) / (스테이지 도달한 플레이어 수)
    // N: 전체 스테이지 개수
    // stage: 사용자가 "멈춰있는" 스테이지 번호 배열 -> 각 배열은 사용자가 현재 도전 중인 스테이지 번호

    // 만약, 실패율 같은 스테이지 존재 -> 작은 번호의 스테이지가 먼저 오도록 (정렬할 때 예외처리 해줄 것.)
    // 스테이지에 도달한 유저가 없는 경우 -> 실패율 0으로 예외처리

    // 실패율이 높은 것부터 내림차순으로 스테이지 번호 담긴 배열 return
    public static int[] solution(int N, int[] stages) {
        Map<Integer, Double> map = new HashMap<>(N);

        // 분모는 stages의 길이로 초기화
        int denominator = stages.length;

        for (int i = 1; i <= N; i++) {
            int tmp = i;
            int numerator = (int) Arrays.stream(stages).filter(num -> num == tmp).count();

//            System.out.println(numerator + "/" + denominator);

            if (denominator == 0) {
                map.put(i, 0d);
            } else {
                map.put(i, (double) numerator / denominator);
            }

            // N이 증가할 때마다 분모는 분자값을 빼준 값이 됨
            denominator -= numerator;
        }



        List<Integer> list = new ArrayList<>(map.keySet());
        list.sort(((o1, o2) -> Double.compare(map.get(o2), map.get(o1))));

        return list.stream().mapToInt(Integer::intValue).toArray();
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(solution(5, new int[]{2, 1, 2, 6, 2, 4, 3, 3})));
    }
}
```