---
title: "[Programmers] 개인정보 수집 유효기간 (Java)"
excerpt: "2023 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [java, algorithms]

toc: true
toc_sticky: true

date: 2023-02-28
last_modified_at: 2023-02-28
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/150370)

<br>

## Solution

```java
package programmers.sully.week5;

import java.util.*;

public class 개인정보_수집_유효기간_Sully {
    // today: 오늘
    // terms[]: 약관의 유효기간
    // privacies[]: 수집된 개인정보
    public static int[] solution(String today, String[] terms, String[] privacies) {
        List<Integer> answerList = new ArrayList<>();

        // today 뽑아내기 (.으로 분리) -> 일 합 구하기
        int todayYear = Integer.parseInt(today.split("\\.")[0]);
        int todayMonth = Integer.parseInt(today.split("\\.")[1]);
        int todayDay = Integer.parseInt(today.split("\\.")[2]);
        int todayTotal = todayDay + todayMonth * 28 + todayYear * 28 * 12;

        // terms 뽑아내기 (알파벳 분리)
        Map<String, Integer> termsMap = new HashMap<>();
        for (String term : terms) {
            termsMap.put(term.split(" ")[0], Integer.valueOf(term.split(" ")[1]));
        }

        // privacy 뽑아내기 (1차: 알파벳 분리, 2차: .으로 분리)
        String privacyType;

        String privacyTmpDate;
        int[] privacyYear = new int[privacies.length]; // 2000 ~ 2022 년
        int[] privacyMonth = new int[privacies.length]; // 1 ~ 12 달
        int[] privacyDay = new int[privacies.length]; // 1 ~ 28 일
        int[] privacyTotal = new int[privacies.length]; // 합

        for (int i = 0; i < privacies.length; i++) {
            privacyType = privacies[i].split(" ")[1];

            privacyTmpDate = privacies[i].split(" ")[0];
            privacyYear[i] = Integer.parseInt(privacyTmpDate.split("\\.")[0]);
            privacyMonth[i] = Integer.parseInt(privacyTmpDate.split("\\.")[1]);
            privacyDay[i] = Integer.parseInt(privacyTmpDate.split("\\.")[2]);
            privacyTotal[i] = privacyDay[i] + privacyMonth[i] * 28 + privacyYear[i] * 28 * 12;

            // 유효기간이 지났을 경우 파기
            if (todayTotal >= 28 * termsMap.get(privacyType) + privacyTotal[i]) {
                answerList.add(i + 1);
            }
        }

        int[] answer = new int[answerList.size()];
        for (int i = 0; i < answerList.size(); i++) {
            answer[i] = answerList.get(i);
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(solution(
                "2022.05.19",
                new String[]{"A 6", "B 12", "C 3"},
                new String[]{"2021.05.02 A", "2021.07.01 B", "2022.02.19 C", "2022.02.20 C"}
        )));
    }
}
```
