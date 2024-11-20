---
title: "[Programmers] K번째수 (Python)"
excerpt: "algorithms, python, sorting"

categories:
  - Programmers
tags:
  - [algorithms, python, sorting]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-27
last_modified_at: 2023-10-27
---

- 레벨 1이라 그런지 생각 없이도 풀 수 있는 문제다.

<br>

## Solution

```python
from typing import List


def solution(array: List[int], commands: List[List[int]]) -> List[int]:
    answer = []

    for command in commands:
        i, j, k = command[0], command[1], command[2]
        cut = array[i - 1:j]
        cut.sort()
        answer.append(cut[k - 1])

    return answer


print(solution([1, 5, 2, 6, 3, 7, 4], [[2, 5, 3], [4, 4, 1], [1, 7, 3]]))
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/42748](https://school.programmers.co.kr/learn/courses/30/lessons/42748)
