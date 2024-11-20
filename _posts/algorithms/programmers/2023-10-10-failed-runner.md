---
title: "[Programmers] 완주하지 못한 선수 (Python)"
excerpt: "algorithms, python, hash-table"

categories:
  - Programmers
tags:
  - [algorithms, python, hash-table]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-10
last_modified_at: 2023-10-10
---

- IDE 지원이 되지 않을 때는 Counter를 쓰면 더 헷갈릴 거 같아서 최대한 안 쓰는 방향으로 했다.
- 딕셔너리를 반복문 돌 때는 꼭 key, value를 뽑을 때 `items()`를 붙여주자.

<br>

## Solution

```python
import collections
from typing import List


def solution(participant: List[str], completion: List[str]) -> str:
    # 카운터 사용 불가능할 수도 있으니 최대한 직접 구현
    participant_dict = collections.defaultdict(int)
    for p in participant:
        participant_dict[p] += 1

    completion_dict = collections.defaultdict(int)
    for c in completion:
        completion_dict[c] += 1

    # key, value 뽑을 때도 items() 꼭 붙여주기
    for key, value in participant_dict.items():
        if value != completion_dict[key]:
            return key

    return ''


print(solution(["leo", "kiki", "eden"], ["eden", "kiki"]))
print(solution(["marina", "josipa", "nikola", "vinko", "filipa"], ["josipa", "filipa", "marina", "nikola"]))
print(solution(["mislav", "stanko", "mislav", "ana"], ["stanko", "ana", "mislav"]))
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/42576](https://school.programmers.co.kr/learn/courses/30/lessons/42576)
