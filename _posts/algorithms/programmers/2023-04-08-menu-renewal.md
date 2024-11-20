---
title: "[Programmers] 메뉴 리뉴얼 (Python)"
excerpt: "2021 KAKAO BLIND RECRUITMENT"
categories:
  - Programmers
tags:
  - [python]

toc: true
toc_sticky: true

date: 2023-04-08
last_modified_at: 2023-04-08
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/72411)

<br>

## Solution

```python
# 조합 개념을 이용하는 거니 한번 내장함수 써보자
# 그럼 자동으로 조합이 저장되니까
from itertools import combinations


def solution(orders, course):
    answer = []

    # 1. 각 order 정렬
    orders = [''.join(sorted(order)) for order in orders]

    # 2. course_len 마다 조합 생성
    for c in course:
        hash_map = {}
        max_count = 0

        # 모든 주문에 대해 c개의 메뉴로 가능한 조합 생성
        for order in orders:
            if len(order) < c:  # 주문한 메뉴 개수보다 코스요리 개수가 더 많으면 불가능한 조합이므로 continue
                continue

            for comb in combinations(order, c):
                comb_str = ''.join(comb)  # 조합을 문자열로 변환
                
                if comb_str in hash_map:
                    hash_map[comb_str] += 1  # 이미 존재하는 조합이면 count를 증가
                else:
                    hash_map[comb_str] = 1  # 존재하지 않는 조합이면 count를 1로 설정

                max_count = max(max_count, hash_map[comb_str])  # 최대 주문 수 업데이트

        # 3. 주문 수가 최대인 조합들을 answer에 추가
        if max_count < 2:  # 최대 주문 수가 2보다 작으면 answer에 추가할 필요가 없음
            continue

        for comb in hash_map:
            if hash_map[comb] == max_count:
                answer.append(comb)

    answer.sort()  # answer를 사전순으로 정렬
    return answer

print(solution(["ABCFG", "AC", "CDE", "ACDE", "BCFG", "ACDEH"], [2, 3, 4]))
```