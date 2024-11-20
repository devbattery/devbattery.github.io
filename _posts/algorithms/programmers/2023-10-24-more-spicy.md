---
title: "[Programmers] 더 맵게 (Python)"
excerpt: "algorithms, python, heap"

categories:
  - Programmers
tags:
  - [algorithms, python, heap]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-24
last_modified_at: 2023-10-24
---

- 아래는 GPT-4가 알려준 heap 문제를 판별하는 방법이다.

> 문제를 효율적으로 힙(Heap)을 사용하여 해결할 수 있는지 판단하는 것은 문제의 요구사항을 이해하고 힙의 특성과 일치하는 패턴을 인식하는 데서 기인합니다. 힙을 사용할지 여부를 판단하는 방법은 다음과 같습니다: <br>
> 최소 또는 최대 요소의 필요성: 문제가 자주 최소 또는 최대 요소에 접근하는 것을 요구하는 경우, 힙(특히 최소 힙 또는 최대 힙)은 매우 효율적일 수 있습니다. 제공된 문제에서는 자주 최소 요소가 필요했는데, 이것은 힙이 유용할 수 있다는 명확한 지표입니다. <br>
> 우선순위 정렬: 요소에 우선순위 순서로(반드시 정렬된 순서는 아님) 접근해야 하는 경우, 힙은 좋은 선택입니다. 예를 들어, 작업이 시간 순서가 아닌 우선순위에 따라 선택되는 스케줄링 알고리즘에서 힙은 매우 유용할 수 있습니다. <br>
> 동적 데이터: 데이터 세트가 동적(즉, 요소를 삽입하고 제거해야 함)이며, 여전히 최소 또는 최대 요소에 빠르게 접근하려는 경우, 힙은 효율적입니다. 균형 이진 검색 트리도 이 목적을 제공할 수 있지만, 힙은 보통 더 간단한 구현을 가집니다. <br>
> 효율성 문제: 균형 이진 검색 트리(AVL 또는 Red-Black 트리 같은)도 O(log n) 시간 내에 최소 또는 최대 요소를 제공할 수 있습니다. 그러나 힙에서의 삽입은 이러한 작업에 대해 실제로 더 간단하고 효율적입니다. O(log n) 접근, 삽입, 삭제가 자주 필요한 경우 힙을 고려하세요. <br>
> 문제의 언어 & 연산: 문제의 언어는 힌트를 줄 수 있습니다. "반복적으로 최소 추출", "정렬된 순서로 병합", "실행 중 중앙값", "k번째 최소/최대"와 같은 용어는 힙이 적절한 데이터 구조일 수 있음을 종종 나타냅니다. <br>
> 경험 & 연습: 문제 해결의 많은 측면과 마찬가지로 문제를 많이 풀면 패턴을 파악하는 데 능숙해집니다. 시간이 지남에 따라 특정 연산이 필요한 문제를 보게 되면 힙이 올바른 도구일 수 있다는 느낌을 강하게 받게 될 것입니다. <br>
> 당신이 공유한 문제에 대해서, 두 개의 가장 작은 값에 지속적으로 접근하고 제거한 다음 (그 두 가장 작은 값으로부터 유도된) 새로운 값을 삽입하는 것은 힙이 빛나는 전형적인 연산입니다. 이러한 연산은 O(log n) 시간에 제공되어 이러한 문제에 대해 효율적입니다.

<br>

## Solution

```python
import heapq
from typing import List


def solution(scoville: List[int], K: int):
    answer = 0
    heap = []

    for s in scoville:
        # 최소힙으로 가장 작은 값이 상단(heap[0])에 위치하도록 함
        heapq.heappush(heap, s)

    # 2개의 음식이 필요
    while heap[0] < K and len(heap) > 1:
        # 힙에 요소가 2개만 남았을 경우
        if len(heap) == 2:
            # 그 두 요소를 합하고, 합쳐진 값이 K보다 여전히 작다면 만족 X
            if heapq.heappop(heap) + heapq.heappop(heap) * 2 < K:
                return -1

            # if문에 걸리지 않는다면 이번 연산을 더해서 반환
            return answer + 1

        # 2개 이상의 요소가 있는 경우, 가장 작은 두 값을 똑같이 pop하고 다시 넣어줌
        new = heapq.heappop(heap) + heapq.heappop(heap) * 2
        heapq.heappush(heap, new)

        # 연산 다 끝나고 answer를 1씩 증가
        answer += 1

    # while문이 종료되었다는 것은 힙의 모든 요소가 K 이상이라는 의미
    return answer


print(solution([1, 2, 3, 9, 10, 12], 7))
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/42626](https://school.programmers.co.kr/learn/courses/30/lessons/42626)
