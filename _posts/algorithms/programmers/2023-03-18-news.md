---
title: "[Programmers] [1차] 뉴스 클러스터링 (Python)"
excerpt: "2018 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [python]

toc: true
toc_sticky: true

date: 2023-03-18
last_modified_at: 2023-03-18
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/17677)
- 괜히 문제 푸는 중에 다중집합이란 걸 찾아보다가 오히려 더 헷갈림.. Counter로 다중집합의 합집합, 교집합 바로 처리 가능

<br>

## Solution

```python
# 자카드 유사도: 집합의 교집합 크기를 두 집합의 합집합 크기로 나눈 값으로 정의
import math
from collections import Counter


def solution(str1, str2):
    answer = 0
    # 1. 2글자씩 끊어서 다중 집합 만들기 -> 사실상 리스트
    # FRANCE -> {FR, RA, AN, NC, CE}
    # 단! 기타 공백이나 숫자, 특수 문자가 들어있는 경우 -> 그 쌍을 버리기
    # 둘 다 소문자로 바꿔주자
    str1_list = make(str1)
    print(str1_list)
    str2_list = make(str2)
    print(str2_list)

    # 다중집합의 교집합 만들기
    # !!!!!!!!! "집합의 원소가 서로 같을 때도 세줘야 함"
    # gyo = []
    # for s in str1_list:
    #     if s in str2_list:
    #         str2_list.remove(s)
    #         gyo.append(s)
    # Counter 메서드는 각각의 리스트는 해당 원소값을 key값으로 하고
    # 원소의 개수를 value값으로 하는 dictionary 형태의 구조를 반환
    gyo = list((Counter(str1_list) & Counter(str2_list)).elements())

    # 다중집합의 합집합 만들기
    # !!!!!!!!! "집합의 원소가 서로 같을 때도 세줘야 함"
    # tmp_str1_list = str1_list.copy()
    # hap = str1_list.copy()
    # for s in str2_list:
    #     if s not in tmp_str1_list:
    #         hap.append(s)
    #     else:
    #         tmp_str1_list.remove(s)
    hap = list((Counter(str1_list) | Counter(str2_list)).elements())

    # 교집합 크기 / 합집합 크기 -> 소수점 아래 버리기 (round 메서드였나 -> round는 반올림이고 trunc임)
    if len(hap) == 0:
        answer = 65536
    else:
        answer = math.trunc((len(gyo) / len(hap)) * 65536)
    return answer


def make(str_tmp):
    str_list = []
    for i in range(len(str_tmp) - 1):
        if str_tmp[i].isalpha() and str_tmp[i + 1].isalpha():  # 둘 다 알파벳일 경우만 추가해주기
            str_list.append(str_tmp[i].lower() + str_tmp[i + 1].lower())
    return str_list


# print(solution("FRANCE", "french"))
# print(solution("handshake", "shake hands"))
print(solution("aa1+aa2", "AAAA12"))
# print(solution("E=M*C^2", "e=m*c^2"))
```