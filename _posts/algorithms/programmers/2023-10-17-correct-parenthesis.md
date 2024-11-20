---
title: "[Programmers] 올바른 괄호 (Python)"
excerpt: "algorithms, python, stack, queue"

categories:
  - Programmers
tags:
  - [algorithms, python, stack, queue]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-17
last_modified_at: 2023-10-17
---

- 정말 많이 풀어본 문제인데 볼 때마다 조금씩은 헷갈리는 거 같다.

<br>

## Solution

```python
def solution(s: str):
    if s[0] == ')':
        return False

    stack = []

    for c in s:
        if c == '(':
            stack.append('(')
            continue

        # 사실상 stack이 비어있으면 올바르지 않은 괄호라는 뜻이니
        if stack:
            stack.pop()

    if stack:
        return False

    return True


print(solution("()()"))
print(solution("(())()"))
print(solution(")()("))
print(solution("(()("))
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/12909](https://school.programmers.co.kr/learn/courses/30/lessons/12909)
