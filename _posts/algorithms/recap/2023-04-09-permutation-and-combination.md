---
title: "[알고리즘 구현] 순열과 조합 구현 (Python)"
excerpt: "Permutation, Combination, 재귀, 백트래킹, 그리디"

categories:
  - Recap
tags:
  - [python, permutation, combinaiton]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-04-09
last_modified_at: 2023-04-09
---


# 개요

- 어제 알고리즘 스터디에서 프로그래머스의 [메뉴 리뉴얼](https://school.programmers.co.kr/learn/courses/30/lessons/72411) 문제를 풀던 도중 `combinations` 함수에 대한 고민을 하게 됐다.
    - 이 함수를 사용하면 조합 기능을 import 하나로 걱정 없이 사용할 수 있지만, 정확한 이유를 모르고 사용한다면 분명 나중에 코딩 테스트 때 독이 될 것이라 생각했다.
- 스터디에서 이 궁금증으로 서로 찾아보고 질문하는 등의 활동으로 대략적으로 구현 방법에 대한 이해는 할 수 있었다. 하지만 나에게 아무것도 없이 처음부터 설명해 보라고 한다면 절대 불가능한 상태기 때문에 블로그에 정리하면서 체화시키는 시간이 꼭 필요했다. 조합에 대해 공부하는 김에 순열도 같이 정리하려 한다.
- 완전 탐색보다는 백트래킹과 그리디 방법으로 구현하는 방법이 훨씬 더 빠르고 좋다는 것을 어제 실험으로 직접 깨달았다.
    - [파이썬 공식 문서](https://docs.python.org/3/library/itertools.html#itertools.combinations)에서도 백트래킹 방식으로 구현되어 있었다.

> 한 코드씩 설명하는 것보다 주석으로 남기는 것이 나중에 기억하기 더 좋을 것 같아 주석에 집중하여 정리했다.

<br>

# 순열 (재귀 + 백트래킹)

- 순열
    - 서로 다른 $n$개의 대상해서 $r$개를 뽑아 일렬로 배열한 것
    - 경우의 수는 $nPr(n >= r)$로 표현
    - $nPr = \frac{n!}{(n-r)!}$
- 그리디로 하려면 거꾸로 구현해야 하기 때문에 백트래킹 방식이 편하다고 느꼈다.

## 구현

```python
def permutation(arr, r):
    # 정렬된 출력을 위해 오름차순 정렬
    arr = sorted(arr)
    # 그 index에 값을 썼는지 저장하는 배열
    # 모든 순열을 하나씩 만들고 출력해야 함 -> 즉, 중복값이 저장되면 안 됨
    used = [0 for _ in range(len(arr))]

    # 실제 순열을 만들 함수
    def generate(chosen, used):
        # chosen: 순열의 원소를 저장하는 배열
        # 이 배열에 값을 하나씩 추가 -> 그 원소 개수가 r이 되는 순간 하나의 순열이 만들어졌다는 의미
        if len(chosen) == r:
            print(chosen)
            return

        # 핵심 로직
        # 모든 순열은 arr index의 0부터 i - 1번째 값으로 시작 -> 반복문 필요
        for i in range(len(arr)):
            # 해당 변수가 쓰이지 않았으면 (중복값이 저장되지 안 되기 때문)
            if not used[i]:
                # 순열의 원소를 추가
                chosen.append(arr[i])
                # 사용됐다는 표시인 1로 저장
                used[i] = 1

                # 재귀 반복
                generate(chosen, used)
                # 0으로 다시 초기화
                used[i] = 0

                # 하나가 만들어졌으니 없애주기
                chosen.pop()

    # generate 함수 호출
    generate([], used)


print(permutation('PER', 3))
print(permutation([1, 2, 3, 4], 3))
```

<br>

## 실행 결과

```
['E', 'P']
['E', 'R']
['P', 'E']
['P', 'R']
['R', 'E']
['R', 'P']
```

```
[1, 2, 3]
[1, 2, 4]
[1, 3, 2]
[1, 3, 4]
[1, 4, 2]
[1, 4, 3]
[2, 1, 3]
[2, 1, 4]
[2, 3, 1]
[2, 3, 4]
[2, 4, 1]
[2, 4, 3]
[3, 1, 2]
[3, 1, 4]
[3, 2, 1]
[3, 2, 4]
[3, 4, 1]
[3, 4, 2]
[4, 1, 2]
[4, 1, 3]
[4, 2, 1]
[4, 2, 3]
[4, 3, 1]
[4, 3, 2]
```

<br>

# 조합 (재귀 + 백트래킹)

- 마찬가지로 백트래킹 방식이 더 편하다고 느꼈다.
- 조합
    - 같은 $n$개 중 $r$개를 뽑되, 순서를 고려하지 않음
    - 경우의 수는 $nCr(0 <= r <= n)$로 표현
    - $nCr = \frac{n!}{(n-r)!r!}$

## 구현

```python
def combination(arr, r):
    # 정렬된 출력을 위해 오름차순 정렬
    arr = sorted(arr)

    # 실제 조합을 만들 함수
    def generate(chosen):
        # chosen: 조합의 원소를 저장하는 배열
        # 이 배열에 값을 하나씩 추가 -> 그 원소 개수가 r개가 되는 순간 하나의 조합이 만들어졌다는 의미
        if len(chosen) == r:
            print(chosen)
            return

        # 반복문의 시작(start)을 chosen의 "마지막 값 그 다음"으로 함
        if chosen:
            start = arr.index(chosen[-1]) + 1
        # chosen이 비어있으면 start가 0 즉, 0부터 시작
        else:
            start = 0

        # 핵심 로직
        # 조합은 순열과 달리 순서를 고려하지 않음 -> 즉, "제한"이 꼭 필요
        for i in range(start, len(arr)):
            # 조합의 원소 추가
            chosen.append(arr[i])

            # 재귀 반복
            generate(chosen)

            # 하나가 만들어졌으니 없애주기
            chosen.pop()

    # generate 함수 호출
    generate([])


print(combination('QWERT', 3))
print(combination([1, 2, 3, 4, 5], 3))
```

<br>

## 실행 결과

```
['E', 'Q', 'R']
['E', 'Q', 'T']
['E', 'Q', 'W']
['E', 'R', 'T']
['E', 'R', 'W']
['E', 'T', 'W']
['Q', 'R', 'T']
['Q', 'R', 'W']
['Q', 'T', 'W']
['R', 'T', 'W']
```

```
[1, 2, 3]
[1, 2, 4]
[1, 2, 5]
[1, 3, 4]
[1, 3, 5]
[1, 4, 5]
[2, 3, 4]
[2, 3, 5]
[2, 4, 5]
[3, 4, 5]
```

<br>

# Reference

- https://www.youtube.com/watch?v=uSZTBBgDAiM&t=773s
- https://aerocode.net/376
- https://shoark7.github.io/programming/algorithm/Permutations-and-Combinations
- https://velog.io/@yeseolee/python%EC%9C%BC%EB%A1%9C-%EC%88%9C%EC%97%B4%EA%B3%BC-%EC%A1%B0%ED%95%A9-%EC%A7%81%EC%A0%91-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0
- https://yangnyang.tistory.com/14
- https://ninefloor-design.tistory.com/174