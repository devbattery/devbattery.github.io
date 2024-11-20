---
title: "[Programmers] 오픈채팅방 (Python)"
excerpt: "2019 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [python]

toc: true
toc_sticky: true

date: 2023-04-01
last_modified_at: 2023-04-01
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/42888)
- 튜플을 항상 이럴 때 사용하는 것을 염두해 두자!
  - 파일명 정렬 문제에서도 튜플 쓰면 훨씬 편리해지니까 앞으로 튜플 자주 쓰자

<br>

## Solution

```python
def solution(record):
    answer = []
    db = {}
    enter_leave = []

    for r in record:
        # command, user_id, nickname 순서
        rr = r.split()

        if rr[0] == 'Enter':
            # user_id = nickname
            db[rr[1]] = rr[2]
            # user_id, "Enter" 표시
            enter_leave.append((rr[1], 'Enter'))
        elif rr[0] == 'Leave':
            # user_id, "Leave" 표시
            enter_leave.append((rr[1], 'Leave'))
        elif rr[0] == 'Change':
            # user_id = nickname
            db[rr[1]] = rr[2]

    for e_l in enter_leave:
        if e_l[1] == 'Enter':
            answer.append(db[e_l[0]] + '님이 들어왔습니다.')
        elif e_l[1] == 'Leave':
            answer.append(db[e_l[0]] + '님이 나갔습니다.')

    return answer


print(solution(
    ["Enter uid1234 Muzi", "Enter uid4567 Prodo", "Leave uid1234", "Enter uid1234 Prodo", "Change uid4567 Ryan"]))
```