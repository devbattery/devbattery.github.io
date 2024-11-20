---
title: "[Programmers] 디스크 컨트롤러 (Python)"
excerpt: "algorithms, python, heap"

categories:
  - Programmers
tags:
  - [algorithms, python, heap]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-25
last_modified_at: 2023-10-25
---

- 정말 어려웠다. 다시 꼭 풀어봐야 하는 문제

<br>

## Solution

```python
import heapq
from typing import List


def solution(jobs: List[List[int]]):
    jobs_length = len(jobs)
    # [작업 기간, 그 후 요청 시간]
    heap = []
    # 요청 시간부터 완료 시간까지 얼마나 걸렸는지
    durations = []
    current_time = 0  # 현재 시각

    # 작업을 요청 시간 기준으로 정렬
    jobs.sort()

    # 작업의 개수가 durations의 개수랑 같다면 모든 작업이 종료됨을 의미
    while len(durations) != jobs_length:
        # jobs는 오름차순으로 정렬되어 있으므로
        # 가장 앞에 있는 작업이 현재 시간 이전에 요청된 것이라면 힙에 추가
        while jobs and current_time >= jobs[0][0]:
            next_job = jobs.pop(0)
            heapq.heappush(heap, (next_job[1], next_job[0]))

        # 위에서 걸리지 않았다면 요청 시간이 현재보다 늦는 작업뿐이라는 것
        if jobs and heap == []:
            # 즉, jobs에서 하나를 꺼내서 현재 시간을 이 작업의 요청 시간으로 변경
            next_job = jobs.pop(0)
            current_time = next_job[0]
            # 작업에 소요되는 시간을 (소요, 요청)으로 push
            heapq.heappush(heap, (next_job[1], next_job[0]))

        # 소요, 요청 (최소 힙이니 가장 위에 있는 작업이 소요 시간 제일 적게 걸리는 작업이라는 뜻)
        processing, request = heapq.heappop(heap)
        current_time += processing
        durations.append(current_time - request)

    return sum(durations) // jobs_length


print(solution([[0, 3], [1, 9], [2, 6]]))
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/42627](https://school.programmers.co.kr/learn/courses/30/lessons/42627)
