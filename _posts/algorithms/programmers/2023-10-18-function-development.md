---
title: "[Programmers] 기능개발 (Python)"
excerpt: "algorithms, python, stack, queue"

categories:
  - Programmers
tags:
  - [algorithms, python, stack, queue]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-18
last_modified_at: 2023-10-18
---

- 뭔가 나만의 방법으로 생각해 내서 풀었다 보니까 너무 뿌듯한 문제였다.
    - 파이썬의 Counter 기법 사용하면 for문 2개를 사용할 필요가 없지만, 실전에서 헷갈릴 수도 있기에 정통적인 방법으로 갔다.

<br>

## Solution

```python
import collections
import math
from typing import List


def solution(progresses: List[int], speeds: List[int]) -> List[int]:
    MAX = 100
    answer = []

    judge = [math.ceil((MAX - progresses[0]) / speeds[0])]
    for i in range(1, len(progresses)):
        remain = MAX - progresses[i]
        current_ceil = math.ceil(remain / speeds[i])
        if judge[-1] < current_ceil:
            judge.append(current_ceil)
            continue

        judge.append(judge[-1])

    # 카운터 사용하면 편할 거 같긴 한데 그냥 직접 하자
    tmp_dict = collections.defaultdict(int)
    for num in judge:
        tmp_dict[num] += 1

    for v in tmp_dict.values():
        answer.append(v)

    return answer


# [7, 70, 45]
print(solution([93, 30, 55], [1, 30, 5]))
# [5, 10, 1, 1, 20, 1]
print(solution([95, 90, 99, 99, 80, 99], [1, 1, 1, 1, 1, 1]))
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/42586](https://school.programmers.co.kr/learn/courses/30/lessons/42586)
