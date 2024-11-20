---
title: "[Programmers] 신고 결과 받기 (Java)"
excerpt: "2022 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [java, algorithms]

toc: true
toc_sticky: true

date: 2023-03-01
last_modified_at: 2023-03-01
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/92334)
- 진짜 파이썬으로 빨리 갈아타자 ㅋㅋㅋㅋ
  - 특히 Map 쓰는 파트에서는 더 지옥이다 자바는 🙃

<br>

## Solution

```java
package programmers.sully.week5;

import java.util.*;

public class 신고_결과_받기_Sully {
    public static int[] solution(String[] id_list, String[] report, int k) {
        int[] answer = new int[id_list.length];

        Map<String, Integer> reportCntMap = new HashMap<>();
        Map<String, Set<String>> reportMap = new HashMap<>();

        int index = 0;
        for (String id : id_list) {
            reportCntMap.put(id, index++);
            reportMap.put(id, new LinkedHashSet<>());
        }

        for (String rp : report) {
            String userID = rp.split(" ")[0];
            String reportID = rp.split(" ")[1];
            reportMap.get(reportID).add(userID);

//            if (!reportMap.get(userID).contains(rp)) {
//                int beforeCnt = reportCntMap.get(reportID);
//                reportCntMap.put(reportID, beforeCnt + 1);
//
//                reportMap.get(userID).add(reportID); // 중복되지 않게 집합 넣어줌
//            }
        }

//        // k 이상 신고 당하면 정지 -> reportCntMap(Value) >= k
//        Set<String> reportSet = new LinkedHashSet<>();
//        for (Map.Entry<String, Integer> entry : reportCntMap.entrySet()) {
//            if (entry.getValue() >= k) {
//                reportSet.add(entry.getKey());
//            }
//        }
//        System.out.println("reportSet = " + reportSet);
//
//        // reportMap(Value)를 id_list 순서에 따라 answer 배열에 저장
//        // reportSet -> reportMap 존재 여부
//        for (String rps : reportSet) { // 2번 이상 신고당한 ID 집합
//            for (int i = 0; i < id_list.length; i++) { // 유저 ID 집합
//                if (reportMap.get(id_list[i]).contains(rps)) {
//                    answer[i] += 1;
//                }
//            }
//        }

        for (String id : id_list) {
            Set<String> set = reportMap.get(id);
            if (set.size() >= k) {
                for (String s : set) {
                    answer[reportCntMap.get(s)] += 1;
                }
            }
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(
                solution(
                        new String[]{"muzi", "frodo", "apeach", "neo"},
                        new String[]{"muzi frodo", "apeach frodo", "frodo neo", "muzi neo", "apeach muzi"},
                        2
                )));
    }
}
```
