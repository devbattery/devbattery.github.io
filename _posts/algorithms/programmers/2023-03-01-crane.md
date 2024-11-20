---
title: "[Programmers] 크레인 인형뽑기 게임 (Java)"
excerpt: "2019 카카오 개발자 겨울 인턴십"

categories:
  - Programmers
tags:
  - [java, algorithms]

toc: true
toc_sticky: true

date: 2023-03-01
last_modified_at: 2023-03-01
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/64061)

<br>

## Solution

```java
package programmers.sully.week5;

import java.util.Stack;

public class 크레인_인형뽑기_Sully {
    public static int solution(int[][] board, int[] moves) {
        int answer = 0;
        Stack<Integer> basket = new Stack<>();
        basket.push(0);

        // 가장 아래 칸부터 쌓이고, 크레인은 가장 위 칸부터 뽑으니까
        for (int move : moves) {
            for (int j = 0; j < board.length; j++) {
                int tmp = board[j][move - 1];

                if (tmp == 0) {
                    continue;
                }

                if (basket.peek() == tmp) {
                    basket.pop();
                    answer += 2;
                } else {
                    basket.push(tmp);
                }

                board[j][move - 1] = 0;
                break;
            }
        }

        return answer;
    }
}
```
