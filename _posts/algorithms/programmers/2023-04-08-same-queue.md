---
title: "[Programmers] 두 큐 합 같게 만들기 (Python)"
excerpt: "2022 KAKAO BLIND RECRUITMENT"
categories:
  - Programmers
tags:
  - [python]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-04-08
last_modified_at: 2023-04-08
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/118667)
- 문제 자체를 잘못 이해하고, 너무 어렵게 생각했다.
    - 그냥 각각 반대의 개념으로 생각하면 됐고, 정작 중요한 내용은 limit (시간 초과)에 대한 것이었다.
    - 원래의 풀이는 문제 예시의 내용을 가지고 그대로 구현했으니 될 리가 없지..
- `condition = len(queue1) * 3` 이 부분이 사실 아직도 이해가질 않는다.
    - 2를 곱한다면 테스트 케이스 1에서 오류가 발생한다.
    - 그래서 3을 곱해준 후 테스트를 통과할 수 있었다.


<br>

## Solution

```python
from collections import deque


def solution(queue1, queue2):  # len(queue1) == len(queue2)
    answer = 0
    queue1, queue2 = deque(queue1), deque(queue2)
    sum_q1, sum_q2 = sum(queue1), sum(queue2)
    # 2가 안 돼서 3으로.. ㅠ
    condition = len(queue1) * 3

    while True:
        if sum_q1 > sum_q2:
            target = queue1.popleft()
            queue2.append(target)

            sum_q1 -= target
            sum_q2 += target

            answer += 1
        elif sum_q1 < sum_q2:
            target = queue2.popleft()
            queue1.append(target)

            sum_q1 += target
            sum_q2 -= target

            answer += 1
        else:
            break

        if answer == condition:
            answer = -1
            break

    return answer


# 테스트 결론: popleft()후 변수에 저장하면 원본 값에도 결국 popleft가 됨
# # @Test
# d = deque()
# d.append(1)
# d.append(2)
# d.append(3)
#
# print(d)
# L = d.popleft()
# print(d)

print(solution([3, 2, 7, 2], [4, 6, 5, 1]))
```