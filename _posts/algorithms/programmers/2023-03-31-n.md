---
title: "[Programmers] [3차] n진수 게임 (Python)"
excerpt: "2018 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [python]

toc: true
toc_sticky: true

date: 2023-03-31
last_modified_at: 2023-03-31
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/17687)
- 슬슬 한계가 보이죠잉

<br>

## Solution

```python
def solution(n, t, m, p):
    # 숫자를 하나씩 차례대로 말하는 게임
    # 자신이 말해야 하는 숫자를 스마트폰에 미리 출력해주는 프로그램
    # 숫자 전체를 출력하는 게 아니라, 튜브의 차례만 생각하면 되는 문제

    answer = ''
    convert_num = ''

    current = p - 1
    for num in range(t * m):
        convert_num += convert2n(num, n)
    
    while True:
        if len(answer) == t:
            break
        
        answer += convert_num[current]
        current += m

    return answer


def convert2n(num, n):
    if num == 0:
        return '0'

    numbers = '0123456789ABCDEF'
    tmp = ''
    while num > 0:
        # 몫: num, 나머지: mod -> 튜플로 변환
        num, mod = divmod(num, n)
        tmp += numbers[mod]

    return tmp[::-1]


print(solution(2, 4, 2, 1))
print(solution(16, 16, 2, 1))
print(solution(16, 16, 2, 2))
```