---
title: "[Programmers] 주식가격 (Python)"
excerpt: "algorithms, python, stack, queue"

categories:
  - Programmers
tags:
  - [algorithms, python, stack, queue]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-23
last_modified_at: 2023-10-23
---

- 2중 반복문 돌기 싫다고 생각하면 이런 방법을 떠올리는 데 오래 걸리니 주의하자.

<br>

## Solution

```python
import collections
from typing import List


def solution(prices: List[int]):
    answer = []

    dq = collections.deque(prices)
    while dq:
        # 가격이 떨어지지 않은 기간
        period = 0
        # 주식 가격
        price = dq.popleft()

        for current_price in dq:
            period += 1
            # 현재 가격이 위의 가격보다 낮으면 가격이 떨어졌다는 것을 의미
            if current_price < price:
                break

        answer.append(period)

    return answer


print(solution([1, 2, 3, 2, 3]))
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/42584](https://school.programmers.co.kr/learn/courses/30/lessons/42584)
