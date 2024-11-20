---
title: "[Programmers] [3차] 방금그곡 (Python)"
excerpt: "2018 KAKAO BLIND RECRUITMENT"
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

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/17683)
- 이 문제에만 어제와 오늘 총 8시간은 썼다.. 하하
    - 계속 테스트 케이스 3개가 틀려서 점수가 90점에서 멈춰있었다.
    - 그냥 `title_time`을 아래 코드처럼 for문 바깥으로 빼주면 해결되는 문제였다.
        - 다 풀었을 때 너무 허무하고 온몸에 힘이 쫙 빠졌다..

<br>

## Solution

```python
def solution(m, musicinfos):
    answer = '(None)'
    m = m.replace('C#', 'c').replace('D#', 'd').replace('F#', 'f').replace('G#', 'g').replace('A#', 'a')
    title_time = {}
    for mus in musicinfos:
        start, end, title, music = mus.split(',')
        # 위에서 했던 것처럼 리플레이스
        music = music.replace('C#', 'c').replace('D#', 'd').replace('F#', 'f').replace('G#', 'g').replace('A#', 'a')
        # start, end 미닛으로 변환 + 음은 1분에 1개씩 재생됨 (즉, time이 재생되는 횟수이기도 함)
        time = (int(end.split(':')[0]) * 60 + int(end.split(':')[1])) - (
                int(start.split(':')[0]) * 60 + int(start.split(':')[1]))

        # music을 계속해서 time번 tmp_music에 더해주기
        tmp_music = ''
        is_time, i = 0, 0
        while is_time != time:
            # i가 music의 길이보다 더 길면 0으로 다시 초기화해줘서 계속계속 돌아주는 로직
            if i == len(music):
                i = 0

            tmp_music += music[i]

            is_time += 1
            i += 1

        # tmp_music 전체가 m에 포함이 되면 (find, in 쓰면 안 됨)
        # 더 긴 거?
        maxTime = 0
        for i in range(len(tmp_music)):
            if tmp_music[i:len(m) + i] == m:
                # 조건이 일치하는 음악이 여러 개일 때에는 라디오에서 재생된 시간이 제일 긴 음악 제목을 반환한다.
                # 재생된 시간도 같을 경우 먼저 입력된 음악 제목을 반환한다.
                # 현재 시간이 더 길 경우
                if maxTime < time:
                    maxTime = time
                    title_time[title] = time

                answer = max(title_time, key=title_time.get)

    return answer


# HELLO
print(solution("ABCDEFG", ["12:00,12:14,HELLO,CDEFGAB", "13:00,13:05,WORLD,ABCDEF"]))
print(solution("CC#BCC#BCC#BCC#B", ["03:00,03:30,FOO,CC#B", "04:00,04:08,BAR,CC#BCC#BCC#B"]))
print(solution("ABC", ["12:00,12:14,HELLO,C#DEFGAB", "13:00,13:05,WORLD,ABCDEF"]))
```