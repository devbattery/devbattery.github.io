---
title: "[Programmers] 같은 숫자는 싫어 (Python)"
excerpt: "algorithms, python, stack, queue"

categories:
  - Programmers
tags:
  - [algorithms, python, stack, queue]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-16
last_modified_at: 2023-10-16
---

- [Java 풀이](https://coded1ary.com/programmers/no-sequence-number/)
    - Java로도 풀었었는데 벌써 5개월 전이다.
- 나름 잘 생각해서 푼 거 같다.

<br>

## Solution

```python
from typing import List


def solution(arr: List[int]):
    answer = [arr[0]]

    for i in range(1, len(arr)):
        if answer[-1] != arr[i]:
            answer.append(arr[i])

    return answer


print(solution([1, 1, 3, 3, 0, 1, 1]))
print(solution([4, 4, 4, 3, 3]))
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/12906?language=python3](https://school.programmers.co.kr/learn/courses/30/lessons/12906?language=python3)
