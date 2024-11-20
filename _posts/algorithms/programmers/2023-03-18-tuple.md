---
title: "[Programmers] 튜플 (Python)"
excerpt: "2019 카카오 개발자 겨울 인턴십"

categories:
  - Programmers
tags:
  - [python]

toc: true
toc_sticky: true

date: 2023-03-18
last_modified_at: 2023-03-18
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/64065)
- 문자열 가지고 하나하나 처리해보려 했는데 그냥 이런 문제는 어떤 것을 기준으로 나눌지를 제일 먼저 생각해야 됨

<br>

## Solution

```python
# "|" -> 합집합
# "-" -> 차집합


def solution(s):
    s = s.replace('{', '').replace('}', '')
    s_list = list(map(int, s.split(',')))
    s_dict = {}

    # count dict
    for i in s_list:
        if i in s_dict:
            s_dict[i] += 1
        else:
            s_dict[i] = 1

    # sort the dict by key
    return sorted(s_dict, key=lambda x: s_dict[x], reverse=True)

    # 폐기물 처리
    # s_array = s.split(r'},{')
    # s_array[0] = re.sub('[^,0-9]', '', s_array[0])
    # s_array[len(s_array) - 1] = re.sub('[^,0-9]', '', s_array[len(s_array) - 1])
```