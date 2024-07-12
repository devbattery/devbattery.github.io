---
title: "[파이썬 알고리즘 인터뷰] 알고리즘 문자열 풀이 기법 정리"
excerpt: "6장. 문자열 조작, LeetCode 문제 기반"

categories:
  - Recap
tags:
  - [python, interview, string]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-05-21
last_modified_at: 2023-05-21
---

> 파이썬 알고리즘 인터뷰 책으로 배운 기법 중 중요하다고 생각하는 기법만 정리

<br>

# 문자열 뒤집기 (125번)

```python
s = re.sub('[^a-z0-9]', '', s)
```

- 소문자와 숫자를 제외한 모든 문자들을 전부 없애주는 정규식
    - 원래는 정규식 사용을 꺼려했지만 이런 간단한 정규식은 체화할 것

<br>

```python
s == s[::-1]
```

- 원래는 투 포인터를 즐겨썼지만, 슬라이싱으로 뒤집는 게 더 빠르고 간편함

<br>

# 배열 뒤집기 (344번)

```python
s.reverse()
```

- 이것도 투 포인터로 할 수 있지만, 파이썬은 배열에서만 `reverse()` 함수를 제공함

<br>

```python
s[:] = s[::-1]
```

- `s = s[::-1]`로 하면 오류가 나는 플랫폼이 있으므로, 위 식을 기억해 둘 것

<br>

# 람다 정렬 (937번)

```python
letters.sort(key=lambda x: (x.split()[1:], x.split()[0]))
```

- 평범한 람다 정렬 식이라고 생각할 수 있지만, `x.split()[1:]` 이 부분이 처음엔 많이 헷갈림
    - 배열의 각 원소 x를 공백을 기준으로 스플릿한 후, 그 원소의 두번째 문자부터 끝까지를 기준으로 둠
- 처음에는 `[2:-1]`의 문자열 때문에 제대로 정렬이 안 될 거라고 생각했었음
    - 하지만 어차피 그 첫번째 문자를 기준으로 먼저 정렬을 해주기 때문에 상관이 없을 거라 이해함
    - 만약 스플릿한 배열의 길이가 서로 맞지 않았을 때는 위 방법이 유용하게 쓰일 것으로 예상

<br>

# `r` prefix와 Counter (819번)

```python
re.sub(r'[^/w]', ' ', paragraph)
```

- `r'[^\w]'` = `'[^0-9a-zA-z]'`
    - 모든 대소문자 알파벳, 숫자를 제외한 문자들을 다 거르겠다는 의미
    - `[\w]`를 사용할 때는 무조건 prefix `r`을 붙여줘야 함

<br>

```python
counts = collections.Counter(words)
```

- `Counter`
    - words 배열에서 개수를 처리하는 딕셔너리로 반환

<br>

```python
counts.most_common(1)[0][0]
```

- `most_common(1)`
    - 가장 흔하게 등장하는 단어의 첫 번째 값(1)을 기준으로 추출
- `[0][0]`
    - 첫번째로 흔한 단어를 기준으로 정렬된 배열이니 그 중 가장 첫번째[0] 원소를 고르고,
    - 그 가장 첫번째 원소의 처음 문자[0]를 고름

<br>

# list형 딕셔너리 (49번)

```python
anagrams = collections.defaultdict(list)
```

- `defaultdict` 타입을 지정하는 것이 필수인데
    - `list`형으로 지정이 가능함

<br>

```python
for word in strs:
    anagrams[''.join(sorted(word))].append(word)
return list(anagrams.values())
```

- 위와 같이 `list`형 딕셔너리를 사용하여 편리하게 구현할 수 있음
- 애너그램을 판단하는 가장 간단한 방법은 "정렬하게 비교하는 것"
    1. 뒤집었을 때 같은 값인지를 판단하기 위해 `sorted`로 정렬해 줌
    2. 그러면 리스트 형태로 리턴하게 되는데, 이를 다시 키로 사용해야 되니 다시 `join`으로 문자열로 만들어 줌
    3. 이제 원래의 `words` 배열 원소인 `word`를 딕셔너리 배열에 `append` 해주면 됨
    4. anagrams은 `list`형 딕셔너리기 때문에 그 원래의 배열 원소를 얻기 위해 `values()` 함수 사용
- 그냥 TMI인데 `sort`보다 `sorted`가 메모리 사용량이 더 많음

<br>

# 투 포인터 확장 기법 (5번)

> 사실상 이게 제일 중요하고 어려움

<br>

<img width="360" alt="그림 출처: 파이썬 알고리즘 인터뷰" src="https://github.com/won4885/won4885.github.io/assets/62871026/7cc5de02-7638-441f-8251-d403fd923d61">

- 2칸, 3칸으로 구성된 투 포인터가 각각 계속 앞으로 전진
    - 이때 그 문자열이 팰린드롬인 경우, 그 자리에 멈춘 후 투 포인터가 점점 확장하는 식임
- 팰린드롬은 bb처럼 짝수일 때도 있고, bab처럼 홀수일 때도 있음
    - 즉, 짝수와 홀수 모든 경우에 대해 판별해야 됨

<br>

<img width="647" alt="그림 출처: 파이썬 알고리즘 인터뷰" src="https://github.com/won4885/won4885.github.io/assets/62871026/144e6bd9-02f0-4581-8f93-97aa0b02e5cf">

- `홀수`와 `짝수`의 투 포인터가 계속 우측으로 이동하다가
    - 5에서 `홀수` 투 포인터가 `454`로 확장되면서 매칭이 됨
    - 이때부터 "확장"이 시작되면서 가장 긴 값으로 저장되게 됨
- 이 그림에서 짝수 투 포인터는 팰린드림이 아니므로 무시됨

<br>

```python
# 팰린드롬 판별 및 투 포인터 확장
def expand(left: int, right: int) -> str:
    while left >= 0 and right < len(s)
        and s[left] == s[right]:
        left -= 1
        right += 1
    return s[left + 1:right]
```

- 홀수, 짝수 2개의 투 포인터가 팰린드롬 여부를 판별하면서 계속 우측으로 이동함
    - `left >= 0 and right < len(s)`: 범위 관련 식
    - `s[left] == s[right]`: 만약 같은 걸 발견한다면 그때부터 확장한다는 의미
    - `return s[left + 1:right]`: `left`의 바로 오른쪽부터, `right`의 바로 왼쪽까지 슬라이싱 후 리턴
- 이렇게 판별한 최댓값이 최종 결과가 됨

<br>

```python
result = ''
# 슬라이싱 윈도우 우측으로 이동
for i in range(len(s) - 1):
    result = max(expand(i, i + 1), expand(i, i + 2), result, key=len)
return result
```

- `expand(i, i + 1)`: 홀수 투 포인터 판별
- `expand(i, i + 2)`: 짝수 투 포인터 판별
- `key=len`: 문자열의 "길이"를 중심으로 max 값을 찾겠다는 의미
