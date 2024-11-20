---
title: "[Programmers] 전화번호 목록 (Python)"
excerpt: "algorithms, python, hash-table"

categories:
  - Programmers
tags:
  - [algorithms, python, hash-table]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-11
last_modified_at: 2023-10-11
---

- 이중 for문을 돌 생각을 못 하고 계속 `in`과의 싸움만 하다가 시간이 증발했다.
    - 이런 문제는 직접 `tmp` 기법으로 단어를 만들면서 비교해야 한다.

<br>

## Solution

```python
from typing import List


# 접두어가 "존재하면" False 리턴
def solution(phone_book: List[str]) -> bool:
    phone_map = {}
    for phone in phone_book:
        phone_map[phone] = 1

    for phone in phone_book:
        tmp = ''
        for p in phone:
            tmp += p
            if tmp in phone_map and tmp != phone:
                return False

    return True


print(solution(["119", "97674223", "1195524421"]))
print(solution(["123", "456", "789"]))
print(solution(["12", "123", "1235", "567", "88"]))
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/42577](https://school.programmers.co.kr/learn/courses/30/lessons/42577)
