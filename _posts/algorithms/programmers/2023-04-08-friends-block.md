---
title: "[Programmers] [1차] 프렌즈4블록 (Python)"
excerpt: "2018 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [python]

toc: true
toc_sticky: true

date: 2023-04-08
last_modified_at: 2023-04-08
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/17679)
- 어렵다.. 그리고 앞으로 set에 add를 해주는 방식이 덧 헷갈리고 좋은 것 같다.

<br>

## Solution

```python
# m: 폭, n: 높이, board(list): 배치 정보
def solution(m, n, board):
    answer = 0
    remove_set = set()

    # 그냥 리스트로 바꿔주자..
    for i in range(m):
        board[i] = list(board[i])

    while True:
        # 4개 블록 찾기 -> 추출해줬다가 remove_set 떔에 걍 안 해줌
        for i in range(m - 1):
            for j in range(n - 1):
                # 일단 현재 위치가 빈 배열이 아니어야 이 로직이 작동되도록 해야 함
                if not board[i][j]:
                    continue

                # 인접하는 4칸이 같으면
                if board[i][j] == board[i][j + 1] and board[i][j] == board[i + 1][j] \
                        and board[i][j] == board[i + 1][j + 1]:
                    remove_set.add((i, j))
                    remove_set.add((i, j + 1))
                    remove_set.add((i + 1, j))
                    remove_set.add((i + 1, j + 1))

                    # 뭐임 이거 땜에 계속 오류 났던 거임???
                    # 아 여기서 초기화를 해주면 안 되고 계속 가져가야지..
                    # remove_set = {(i, j), (i, j + 1), (i + 1, j), (i + 1, j + 1)}

        # remove_set이 존재한다면(지워줬다면)
        if remove_set:
            # 몇 개인지 세주고 저장
            answer += len(remove_set)

            # 위에서 저장해줬으니, 이제 remove_set에 있는 건 다시 초기화
            for i, j in remove_set:
                board[i][j] = []

            # remove_set 초기화
            remove_set = set()
        # 존재하지 않는다면
        else:
            return answer

        # 블록 아래로 땡기기
        while True:
            moved = False
            for i in range(m - 1):
                for j in range(n):
                    if board[i][j] and not board[i + 1][j]:
                        board[i + 1][j] = board[i][j]
                        board[i][j] = []
                        moved = True

            if moved is False:
                break


# answer: 14
print(solution(4, 5, ["CCBDE", "AAADE", "AAABF", "CCBBF"]))
# answer: 15
print(solution(6, 6, ["TTTANT", "RRFACC", "RRRFCC", "TRRRAA", "TTMMMF", "TMMTTJ"]))
```