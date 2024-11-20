---
title: "[Programmers] 다리를 지나는 트럭 (Python)"
excerpt: "algorithms, python, stack, queue"

categories:
  - Programmers
tags:
  - [algorithms, python, stack, queue]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-20
last_modified_at: 2023-10-20
---

- 주석 참고

<br>

## Solution

```python
import collections
from typing import List


def solution(bridge_length: int, weight: int, truck_weights: List[int]) -> int:
    answer = 0
    dq = collections.deque([0] * bridge_length)

    # 다리 위의 현재의 무게
    current_weight = 0

    # 모든 트럭이 다리를 건너가고, 다리가 비어 있을 때까지 반복
    while dq:
        # 매시간(answer)마다
        # 다리의 맨 앞에 있는 트럭(트럭이 없다면 0)이 다리를 빠져 나옴
        answer += 1
        current_weight -= dq.popleft()

        # 만약 대기 중인 트럭이 있다면
        if truck_weights:
            # 다음 트럭이 다리에 진입할 수 있는지 확인
            # 다음 트럭을 추가해도 다리 무게 한도를 초과하지 않으면 진입 가능
            if current_weight + truck_weights[0] <= weight:
                # 대기열에서 맨 앞 트럭을 제거 후, 다리에 추가
                next_truck = truck_weights.pop(0)
                dq.append(next_truck)
                current_weight += next_truck
                continue

            # 트럭이 다리에 진입할 수 없다면
            # dq 안에 0이라는 것은 트럭이 없다는 것을 의미를 추가
            dq.append(0)

    return answer


print(solution(2, 10, [7, 4, 5, 6]))
print(solution(100, 100, [10]))
print(solution(100, 100, [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]))
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/42583](https://school.programmers.co.kr/learn/courses/30/lessons/42583)
