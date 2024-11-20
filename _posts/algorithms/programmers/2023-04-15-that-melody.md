---
title: "[Programmers] 괄호 변환 (Python)"
excerpt: "2020 KAKAO BLIND RECRUITMENT"
categories:
  - Programmers
tags:
  - [python]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-04-15
last_modified_at: 2023-04-15
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/60058)
- 문제 풀 때 당시 이해를 못 해서 좀 애를 먹었다.
    - 이건 그냥 더 많은 문제를 풀면서 많이 접해봐야 할 것 같다.

<br>

## Solution

```python
def divide(p):
    if p == '':
        return ''

    left, right = 0, 0
    u, v = 0, 0
    for i in range(len(p)):
        if p[i] == '(':
            left += 1
        else:
            right += 1

        if left == right:
            u, v = p[:i + 1], p[i + 1:]
            break

    if is_right(u):
        return u + divide(v)
    else:
        tmp = '('
        tmp += divide(v)
        tmp += ')'

        u = u[1:-1]
        for w in u:
            if w == '(':
                tmp += ')'
            else:
                tmp += '('

        return tmp


def is_right(p):
    cnt = 0

    for w in p:
        if w == '(':
            cnt += 1
        else:
            cnt -= 1

        if cnt < 0:
            return False

    if cnt == 0:
        return True
    else:
        return False


def solution(p):
    answer = divide(p)
    return answer
```