---
title: "[Programmers] [3차] 압축 (Python)"
excerpt: "2018 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [python]

toc: true
toc_sticky: true

date: 2023-03-25
last_modified_at: 2023-03-25
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/17684)
- 너무 어려웠다.. 카카오 코테에서 90퍼대의 정답률이었다고 하는데 슬프다

<br>

## Solution

```python
def solution(msg):
    # (출력 -> 사전 등록) 이 순서를 잘 기억하자
    # "사전 색인 번호"를 배열로 출력하자
    answer = []

    my_dict = {chr(ord('A') + i): i + 1 for i in range(26)}

    # 압축 알고리즘은 대문자만 처리
    msg = msg.upper()

    index = 0
    while index < len(msg):
        tmp_word = ''
        is_in = False

        for index in range(index, len(msg)):
            tmp_word += msg[index]

            if tmp_word not in my_dict:
                is_in = True
                break

        if is_in:
            my_dict[tmp_word] = len(my_dict) + 1
            answer.append(my_dict[tmp_word[:-1]])
        else:
            answer.append(my_dict[tmp_word])
            break

    # # 이제 계속 색인 번호를 answer에 저장해주면서 my_dict에 사전 추가해주자
    # # my_dict에 추가해 줄 때 이미 26인 my_dict_index를 가지고 하나씩 추가해주면서 key에 넣어주자!
    # tmp_word = ''
    # for word in msg:
    #     tmp_word += word
    #
    #     # 만약 tmp_word가 사전에 없다면 무조건 tmp_word가 2글자임
    #     # 그 tmp_word를 사전에 value로 추가해주면 됨
    #     # 근데 dict에서 'in'의 기준이 key일까 value일까?
    #     # 여기서 원하는 건 단어인 key를 기준으로 뽑아내는 거 -> 상황에 따라 key와 value 자리 바꿔도 됨
    #     if tmp_word not in my_dict:
    #         my_dict_index += 1
    #         my_dict[tmp_word] = my_dict_index
    #
    #         # 초기화 해주기 전에 전 index의 word 출력
    #         answer.append(my_dict[tmp_word[0]])
    #
    #         # tmp_word를 완전 초기화해주는 게 아니라 다음 배열을 위해 현재 word를 저장해줘야지
    #         tmp_word = word
    #
    #     # 만약 사전에 이미 존재하는 경우 3,4,5..글자 가능
    #     else:  # tmp_word in my_dict:
    #         my_dict_index += 1
    #         my_dict[tmp_word] = my_dict_index
    #
    #         # 초기화 해주기 전에 전 index의 word 출력
    #         tmp_len = len(tmp_word)
    #         answer.append(my_dict[tmp_word[:tmp_len]])
    #
    #         # 얘도 똑같이 현재 word 저장
    #         tmp_word = word

    return answer
```