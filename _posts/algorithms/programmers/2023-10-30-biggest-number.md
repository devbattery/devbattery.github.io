---
title: "[Programmers] 가장 큰 수 (Python)"
excerpt: "algorithms, python, sorting"

categories:
  - Programmers
tags:
  - [algorithms, python, sorting]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-30
last_modified_at: 2023-10-30
---

- 주석에 다 적어놓았긴 하지만 이 아이디어를 떠올리는 것 자체가 많이 힘들었다.
    - 문자열 곱셈에 대한 아이디어
    - 숫자의 최대 크기가 1000이므로 3자리수까지 늘려서 확인해야 한다는 아이디어

<br>

## Solution

```python
from typing import List


def solution(numbers: List[int]) -> str:
    # 숫자의 최대 크기가 1000이므로 숫자의 최대 길이는 3글자일 것이기 때문에 3으로 비교
    MAX_LENGTH = 3

    # 숫자들을 숫자 문자열들로 변환
    number_strings = list(map(str, numbers))

    # 두 숫자 x, y가 있을 때 xy와 yx를 비교하여 정렬
    # "30"과 "3"이 있을 때, '30''3'과 '3''30'을 비교하여
    # 결국 "303"보다는 "330"이 더 크니, '3', '30'의 순서로 오름차순 정렬.
    # 이걸 숫자로 접근하면 안 되고, 문자열 곱셈으로 접근해야 함
    # 만약 3이라는 숫자가 있으면 이것은 300이 아니라 333이 되는 거임!
    number_strings.sort(key=lambda x: x * MAX_LENGTH, reverse=True)

    return str(int(''.join(number_strings)))


print(solution([6, 10, 2]))
print(solution([3, 30, 34, 5, 9]))
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/42746](https://school.programmers.co.kr/learn/courses/30/lessons/42746)
