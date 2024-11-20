---
title: "[Programmers] [3차] 파일명 정렬 (Python)"
excerpt: "2018 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [python]

toc: true
toc_sticky: true

date: 2023-04-01
last_modified_at: 2023-04-01
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/17686)
- 이 문제는 어려웠지만 그대로 대부분은 나 스스로 혼자 풀 수 있었다.
- 테스트 케이스 몇 개에서 런타임 에러가 나서 왜지.. 했는데 그냥 조건 하나 땜에 그랬던 거였다.
  - TAIL 구하는 메서드에서 아래의 예외처리를 내 멋대로 해서 에러 발생했던 거였다.
  - 그냥 제거해줬더니 정상적으로 잘 통과됐다.

```python
        # TAIL에 빈 문자열이 담기는 예외 처리
        if len(head_list[i]) + len(number_list[i]) == len(files[i]):
            break
```


<br>

## Solution

```python
def solution(files):
    tmp_answer = []

    # HEAD 구하자
    head_list = []
    for file in files:
        HEAD = ''
        for f in file:
            if f.isdigit():
                break
            else:
                HEAD += f

        # 아래처럼 한번에 하려 했는데 실패 그냥 따로따로 하기로 함
        # HEAD = ''
        # NUMBER = ''
        # HEAD_checked = False
        # NUMBER_checked = False
        # for f in file:
        #     if HEAD_checked is False:
        #         if f.isdigit():
        #             HEAD_checked = True
        #         else:
        #             HEAD += f
        #
        #     if NUMBER_checked is False:
        #         if f.isdigit() is False:
        #             NUMBER_checked = True
        #         else:
        #             NUMBER += f

        head_list.append(HEAD)

    # NUMBER 구하자
    number_list = []
    for i in range(len(files)):
        NUMBER = ''
        # 위에서 구해준 그 head_list의 마지막 문자 다음부터 해야지
        for j in range(len(head_list[i]), len(files[i])):
            if files[i][j].isdigit() is False:
                break
            else:
                NUMBER += files[i][j]

        number_list.append(NUMBER)

    # TAIL 구하자
    tail_list = []
    for i in range(len(files)):
        TAIL = ''

        # 위에서 구해준 head_list와 number_list의 size를 다 더한 것부터 시작해야지
        for j in range(len(head_list[i]) + len(number_list[i]), len(files[i])):
            TAIL += files[i][j]

        tail_list.append(TAIL)

    # (HEAD, NUMBER, TAIL)을 갖고 있는 튜플 2차원 리스트를 생성하자
    tuple_list = []
    for i in range(len(head_list)):
        my_tuple = (head_list[i], number_list[i], tail_list[i])
        tuple_list.append(my_tuple)

    # 각 HEAD를 기준으로 정렬하고 싶은데
    tmp_answer = sorted(tuple_list, key=lambda x: (x[0].upper(), int(x[1])))

    answer = []
    for i in range(len(tmp_answer)):
        answer.append(tmp_answer[i][0] + tmp_answer[i][1] + tmp_answer[i][2])

    return answer


# 출력: ["img1.png", "IMG01.GIF", "img02.png", "img2.JPG", "img10.png", "img12.png"]
print(solution(["img12.png", "img10.png", "img02.png", "img1.png", "IMG01.GIF", "img2.JPG"]))
```