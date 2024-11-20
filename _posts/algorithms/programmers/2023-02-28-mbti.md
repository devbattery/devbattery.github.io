---
title: "[Programmers] 성격 유형 검사하기 (Java)"
excerpt: "2022 KAKAO TECH INTERNSHIP"

categories:
  - Programmers
tags:
  - [java, algorithms]

toc: true
toc_sticky: true

date: 2023-02-28
last_modified_at: 2023-02-28
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/118666)
- `case 4`에 `continue` 꼭..

<br>

## Solution

```java
package programmers.sully.week5;

import java.util.HashMap;
import java.util.Map;

public class 성격_유형_검사하기_Sully {
    public static String solution(String[] survey, int[] choices) { // 동일한 길이
        StringBuilder answer = new StringBuilder();
        Map<String, Integer> indicatorMap = new HashMap<>();
        indicatorMap.put("R", 0);
        indicatorMap.put("T", 0);
        indicatorMap.put("C", 0);
        indicatorMap.put("F", 0);
        indicatorMap.put("J", 0);
        indicatorMap.put("M", 0);
        indicatorMap.put("A", 0);
        indicatorMap.put("N", 0);

        // 맵으로 표 정리
        for (int i = 0; i < survey.length; i++) {
            String first = survey[i].split("")[0]; // i+1번 질문의 "비동의" 관련 선택지
            String second = survey[i].split("")[1]; // i+1 질문의 "동의" 관련 선택지

            String type = "";
            int score = 0;

            switch (choices[i]) {
                case 1 -> {
                    // 매우 비동의
                    type = first;
                    score = 3;
                }
                case 2 -> {
                    // 비동의
                    type = first;
                    score = 2;
                }
                case 3 -> {
                    // 약간 비동의
                    type = first;
                    score = 1;
                }
                case 4 -> {
                    continue;
                }
                case 5 -> {
                    // 약간 동의
                    type = second;
                    score = 1;
                }
                case 6 -> {
                    // 동의
                    type = second;
                    score = 2;
                }
                case 7 -> {
                    // 매우 동의
                    type = second;
                    score = 3;
                }
            }

            // type 같은 거에다가 value 값에 score 계속 더해줌
            indicatorMap.put(type, score + indicatorMap.get(type));
        }

        // 1~4 지표 비교하여 점수 누가 더 높은지 판별
        if (indicatorMap.get("R") >= indicatorMap.get("T")) {
            answer.append("R");
        } else if (indicatorMap.get("R") < indicatorMap.get("T")) {
            answer.append("T");
        }

        if (indicatorMap.get("C") >= indicatorMap.get("F")) {
            answer.append("C");
        } else if (indicatorMap.get("C") < indicatorMap.get("F")) {
            answer.append("F");
        }

        if (indicatorMap.get("J") >= indicatorMap.get("M")) {
            answer.append("J");
        } else if (indicatorMap.get("J") < indicatorMap.get("M")) {
            answer.append("M");
        }

        if (indicatorMap.get("A") >= indicatorMap.get("N")) {
            answer.append("A");
        } else if (indicatorMap.get("A") < indicatorMap.get("N")) {
            answer.append("N");
        }

        return answer.toString();
    }

    public static void main(String[] args) {
        System.out.println(solution(new String[]{"AN", "CF", "MJ", "RT", "NA", "AN"}, new int[]{5, 3, 2, 7, 5, 4}));
        System.out.println(solution(new String[]{"TR", "RT", "TR"}, new int[]{7, 1, 3}));
    }
}
```
