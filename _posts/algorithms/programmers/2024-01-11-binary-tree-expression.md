---
title: "[Programmers] 표현 가능한 이진트리 (Python)"
excerpt: "algorithms, python, 2023 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [algorithms, python, 2023 KAKAO BLIND RECRUITMENT]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-01-11
last_modified_at: 2024-01-11
---

- 재귀를 돈다고 가정했을 때는 root도 계속 바뀌고, 깊이도 계속 바뀐다는 점을 주의해야 함

<br>

# Solution

```python
from typing import List


def solution(numbers: List[int]) -> List[int]:
    # 0과 1에 int()를 씌워주면 bool 값으로 변환됨
    return [int(is_tree(number)) for number in numbers]


def is_tree(number: int) -> bool:
    return check(convert_to_perfect_binary_number(number), False)


# height 0, 노드 개수 1
# height 1, 노드 개수 1 + 2
# height 2, 노드 개수 1 + 2 + 4
# height 3, 노드 개수 1 + 2 + 4 + 8
# .
# .
# .
def convert_to_perfect_binary_number(number: int) -> str:
    # bin(2) -> "0b10"니까 "0b"를 제거해주기 위함
    binary_number = bin(number)[2:]

    # n: 2의 제곱수
    # s: 노드 수
    n, s = 0, 1

    while len(binary_number) > s:
        n += 1
        s += 2 ** n

    return "0" * (s - len(binary_number)) + binary_number


def check(perfect_binary_number: str, is_parent_dummy: bool) -> bool:
    if len(perfect_binary_number) == 1:
        return not is_parent_dummy or perfect_binary_number == "0"

    current_root_index = len(perfect_binary_number) // 2
    # 재귀적으로 도니까 root가 계속 바뀜 (완전 최상위라고 생각하면 안 됨)
    current_root = perfect_binary_number[current_root_index]

    # 부모 더미가 존재하면, 그 자식 노드가 "1"이면 당연히 포화 트리가 성립되지 않음
    if is_parent_dummy and current_root == "1":
        return False

    # 왼쪽과 오른쪽 자식 트리를 확인하기 위해 부모 더미 업데이트
    # dummy가 이미 True면 그냥 넘어가고, True가 아니면 current_root가 "0"인지를 확인
    is_parent_dummy = is_parent_dummy or current_root == "0"

    return (check(perfect_binary_number[:current_root_index], is_parent_dummy)
            and check(perfect_binary_number[current_root_index + 1:], is_parent_dummy))
```

<br>

# Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/92343](https://school.programmers.co.kr/learn/courses/30/lessons/92343)
