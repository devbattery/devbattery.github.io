---
title: "[Programmers] 주차 요금 계산 (Python)"
excerpt: "2022 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [python]

toc: true
toc_sticky: true

date: 2023-04-01
last_modified_at: 2023-04-01
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/92341)
- 확실히 작년 코테라 그런지 오늘 푼 3문제 중에서 가장 어려웠다.

<br>

## Solution

```python
# math.ceil() -> 파이썬에서의 올림 함수
import math


# 누적 주차 시간(분) -> parking_m을 넣으면 주차 요금 리턴하는 함수
def calculate_fee(parking_m, basic_t, basic_fee, unit_t, unit_fee):
    return basic_fee + math.ceil(max(0, parking_m - basic_t) / unit_t) * unit_fee


def solution(fees, records):
    answer = []
    car_in = {}
    car_out = {}

    # 이 문제에서 시간은 모두 (분)으로 바꿀 거임
    # 00:00부터 23:59까지의 시간(분)
    max_m = 24 * 60 - 1
    basic_t, basic_fee, unit_t, unit_fee = int(fees[0]), int(fees[1]), int(fees[2]), int(fees[3])

    for record in records:
        tmp_t, car_num, in_out = record.split()
        # 차량이 입차되거나 출차된 시각 -> (분)으로 저장
        tmp_h, tmp_m = tmp_t.split(':')
        m = int(tmp_h) * 60 + int(tmp_m)
        # OUT일 경우에는 그 차량의 주차 시각 차이를 계산
        if in_out == 'OUT':
            try:
                car_out[car_num] += m - car_in[car_num]
            except:
                car_out[car_num] = m - car_in[car_num]

            del car_in[car_num]
        else:
            # out 되면 삭제해주기
            car_in[car_num] = m

    # 만약, value 값이 OUT인 차량이 있으면 그 key값을 찾고
    # max_m을 이용하여 23:59분까지 출차된 걸로 계산하면 됨
    for car_num, m in car_in.items():
        try:
            car_out[car_num] += max_m - m
        except:
            car_out[car_num] = max_m - m

    answer = [calculate_fee(m, basic_t, basic_fee, unit_t, unit_fee) for car_num, m in
              sorted(list(car_out.items()), key=lambda x: x[0])]
    return answer


# result: [14600, 34400, 5000]
print(solution([180, 5000, 10, 600],
               ["05:34 5961 IN", "06:00 0000 IN", "06:34 0000 OUT", "07:59 5961 OUT", "07:59 0148 IN", "18:59 0000 IN",
                "19:09 0148 OUT", "22:59 5961 IN", "23:00 5961 OUT"]))
```