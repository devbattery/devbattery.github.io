---
title: "[이코테] 코딩 테스트를 위한 파이썬 문법"
excerpt: "파이썬 재밌다"

categories:
  - Recap
tags:
  - [python]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-02-25
last_modified_at: 2023-02-25
---

# 배열 복사

- 배열을 복사한다는 개념 (2차원 배열 생성)

```python
n = 3
m = 4
array = [[3] * m for _ in range(n)]
print(array)
```

```
[[3, 3, 3, 3], [3, 3, 3, 3], [3, 3, 3, 3]]
```

# 조건에 따른 배열 형태로 저장

- remove 집합에 없는 것들만 for문 돌면서 배열 형태로 저장

```python
a = [1, 2, 3, 4, 5, 5, 5]
remove_set = {3, 5}
result = [i for i in a if i not in remove_set]
print(result)
```

```
[1, 2, 4]
```

# 공백 기준으로 자르고 매핑 후 배열 형태로 저장

- 입력을 공백 단위로 split 후 list로만 저장한다면 String 형태로 저장됨
- int 형태로 저장하기 위해 map을 씀
- reverse에 True값을 줘서 배열 거꾸로 저장

```python
input1 = int(input())
data = list(map(int, input().split()))
data.sort(reverse=True)
print(data)
```

```
123 312 312 312312 132 312 312 132 312 312
[312312, 312, 312, 312, 312, 312, 312, 132, 132, 123]
```

# 매핑 후 변수 여러개로 저장

- 배열이 아닌 직접 여러 변수에 저장해줄 수 있음

```python
a1, a2, a3 = map(int, input().split())
print(a1, a2, a3)
```

```
312 321 321
312 321 321
```

# dict() -> Map

- Map

```python
data = dict()
data['사과'] = 'Apple'
data['바나나'] = 'Banana'
data['코코넛'] = 'Coconut'

# 키 데이터만 담은 리스트
key_list = data.keys()
# 값 데이터만 담은 리스트
value_list = data.values()

print(key_list)
print(value_list)

# 각 키에 따른 값을 하나씩 출력
for key in key_list:
    print(data[key])
```

```
dict_keys(['사과', '바나나', '코코넛'])
dict_values(['Apple', 'Banana', 'Coconut'])
Apple
Banana
Coconut
```

# Set

- 집합 (Set)

```python
data = {1, 2, 3}
print(data)

# 새로운 원소 추가
data.add(4)
print(data)

# 새로원 원소 여러개 추가
data.update([5, 6])
print(data)

# 특정한 값을 갖는 원소 삭제
data.remove(3)
print(data)
```

```
{1, 2, 3}
{1, 2, 3, 4}
{1, 2, 3, 4, 5, 6}
{1, 2, 4, 5, 6}
```

# If 한줄

- if 한줄로 빡!

```python
score = 85
result = "Success" if score >= 80 else 'Fail'

print(result)
```

```
Success
```

# 입력은 이걸로

- Java에서 `BufferedReader` 쓰는 거랑 똑같은 이유

```python
import sys

data = sys.stdin.readline().rstrip()
print(data)
```

```
hi
hi
```

# 내장 함수

## sum()

- 더해줌

```python
result = sum([1, 2, 3, 4, 5])
print(result)
```

```
15
```

## min()

- 제일 작은 거 찾기

```python
result = min(7, 3, 5, 2)
print(result)
```

```
2
```

## max()

- 제일 큰 거 찾기

```python
result = max(7, 3, 5, 2)
print(result)
```

```
7
```

## eval()

- 문자열을 수식으로 계산

```python
result = eval("(3 + 5) * 7")
print(result)
```

```
56
```

## sorted()

- 리스트 정렬

```python
result = sorted([9, 1, 8, 5, 4]) # 오른차순 정렬
print(result)
result = sorted([9, 1, 8, 5, 4], reverse=True) # 내림차순 정렬
print(result)
```

```
[1,4,5,8,9]
[9,8,5,4,1]
```

### 튜플

- 튜플의 두 번째 원소를 기준으로 내림차순 정렬

```python
result = sorted([('홍길동', 35), ('이순신', 75), ('아무개', 50)], key = lambda x: x[1], reverse=True)
print(result)
```

```
[('이순신', 75), ('아무개', 50), ('홍길동', 35)]
```