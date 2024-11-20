---
title: "[Programmers] 표 편집 (Python)"
excerpt: "algorithms, python, 2021 카카오 채용연계형 인턴십"

categories:
  - Programmers
tags:
  - [algorithms, python, 2021 카카오 채용연계형 인턴십]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-11-30
last_modified_at: 2023-11-30
---

- 빡구현 문제
- 최대한 이해하기 쉽게 주석에 적어놓았다.

<br>

## Solution

```python
from typing import List


# n: 처음 표의 행 개수, k: 처음 선택된 행 위치, cmd: 수행한 명령어들의 배열
def solution(n: int, k: int, cmd: List[str]) -> str:
    # 삭제되지 않은 상태: 'O', 삭제된 상태: 'X'
    answer = ['O'] * n

    # 각 행의 이전과 다음 행의 인덱스를 저장하는 딕셔너리
    # table[current] = [prev, next] < 이런 형식
    table = {i: [i - 1, i + 1] for i in range(n)}

    # 처음과 끝 행의 인덱스 설정
    table[0] = [None, 1]
    table[n - 1] = [n - 2, None]

    # 삭제된 행의 스택
    remove_stack = []

    # 현재 커서의 위치
    current_k = k

    for c in cmd:
        # 삭제
        if c == 'C':
            # 현재 행 삭제
            answer[current_k] = 'X'
            prev_k, next_k = table[current_k]

            # 삭제된 행 스택 추가
            remove_stack.append([prev_k, current_k, next_k])

            # 다음 행 위치로 이동
            # 다음 행이 없는 경우니 현재 행이 마지막 행 -> 이전으로 이동
            if next_k is None:
                current_k = table[current_k][0]
            # 다음 행이 존재하지 않는 경우니 현재 행이 마지막 행이 아님 -> 다음으로 이동
            else:
                current_k = table[current_k][1]

            # 삭제된 행의 이전과 다음 행의 인덱스 업데이트
            # 현재 행이 첫 번째 행인 경우니 다음 행의 이전 행(현재 행)을 None으로 설정
            if prev_k is None:
                table[next_k][0] = None
            # 현재 행이 마지막 행인 경우니 이전 행의 다음 행(현재 행)을 None으로 설정
            elif next_k is None:
                table[prev_k][1] = None
            # 현재 행의 이전과 다음 행이 모두 존재하는 경우니
            # 이전 행의 "다음 행"(현재 행)을 현재 행의 "다음 행"으로 설정
            # 다음 행의 "이전 행"(현재 행)을 현재 행의 "이전 행"으로 설정
            else:
                table[prev_k][1] = next_k
                table[next_k][0] = prev_k

            continue

        # 복구
        if c == 'Z':
            # 가장 최근에 삭제된 행 복구
            prev, current, next = remove_stack.pop()
            answer[current] = 'O'

            # 복구된 행의 이전과 다음 행의 인덱스 복구
            # 복구된 행이 첫 번째 행인 경우니 다음 행의 이전 행을 현재 행으로 설정
            if prev is None:
                table[next][0] = current
            # 복구된 행이 마지막 행인 경우니 이전 행의 다음 행을 현재 행으로 설정
            elif next is None:
                table[prev][1] = current
            # 복구된 행의 이전과 다음 행이 모두 존재하는 경우니
            # 다음 행의 이전 행을 현재 행으로 설정,
            # 이전 행의 다음 행을 현재 행으로 설정
            else:
                table[next][0] = current
                table[prev][1] = current

            continue

        # 위, 아래 이동
        up_down_command, tmp = c.split()
        X = int(tmp)
        if up_down_command == 'U':
            # 현재 행의 이전 행(Up)으로 X번 이동
            for _ in range(X):
                current_k = table[current_k][0]
        elif up_down_command == 'D':
            # 현재 행의 다음 행(Down)으로 X번 이동
            for _ in range(X):
                current_k = table[current_k][1]

    return ''.join(answer)


print(solution(8, 2, ["D 2", "C", "U 3", "C", "D 4", "C", "U 2", "Z", "Z"]))  # 결과: OOOOXOOO
print(solution(8, 2, ["D 2", "C", "U 3", "C", "D 4", "C", "U 2", "Z", "Z", "U 1", "C"]))  # 결과: OOXOXOOO
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/81303](https://school.programmers.co.kr/learn/courses/30/lessons/81303)
