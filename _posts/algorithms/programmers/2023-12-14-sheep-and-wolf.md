---
title: "[Programmers] 양과 늑대 (Python, Java)"
excerpt: "algorithms, python, 2022 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [algorithms, python, 2022 KAKAO BLIND RECRUITMENT]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-12-14
last_modified_at: 2023-12-19
---

- 재귀 dfs 탐색 능력을 키우는 게 먼저인 거 같음

<br>

## Solution

### Python

```python
from typing import List


def solution(info: List[int], edges: List[List[int]]) -> int:
    ROOT_INDEX = 0
    SHEEP_NUMBER = 0
    WOLF_NUMBER = 1
    NOT_VISITED_NUMBER = 0
    VISITED_NUMBER = 1

    answer = []
    visited = [NOT_VISITED_NUMBER] * len(info)

    def dfs(sheep, wolf):
        if sheep <= wolf:
            return

        answer.append(sheep)

        # edges의 각 행은 [부모 노드 번호, 자식 노드 번호] 형태
        for parent_node, child_node in edges:
            # 부모 노드가 방문된 상태, 자식 노드가 방문되지 않은 상태 -> 이래야 중복 방문을 피할 수 있음
            if visited[parent_node] and not visited[child_node]:
                visited[child_node] = VISITED_NUMBER

                if info[child_node] == SHEEP_NUMBER:
                    dfs(sheep + 1, wolf)
                elif info[child_node] == WOLF_NUMBER:
                    dfs(sheep, wolf + 1)

                visited[child_node] = NOT_VISITED_NUMBER

    visited[ROOT_INDEX] = VISITED_NUMBER

    # 0번 노드(루트 노드)에는 항상 양이 있음 (늑대는 없음)
    dfs(1, 0)

    return max(answer)
```

<br>

- answer가 `List<Integer>`였다면 answer에 계속 add를 해가면서 마지막에 max 값을 구하면 됐지만, `int[]` 형일 경우는 무한대로 배열을 못 늘리니, 하나짜리로 생성 후 max의 값을 계속 갱신해주는 방식으로 해줄 수 있음

### Java

```java
package programmers.sully.week39;

public class SheepAndWolf {

    private static final int ROOT_INDEX = 0;
    private static final int SHEEP_NUMBER = 0;
    private static final int WOLF_NUMBER = 1;
    private static final int NOT_VISITED_NUMBER = 0;
    private static final int VISITED_NUMBER = 1;

    public int solution(int[] info, int[][] edges) {
        int[] answer = new int[1];
        int[] visited = new int[info.length];

        dfs(1, 0, info, edges, answer, visited);

        return answer[0];
    }

    private void dfs(int sheep, int wolf, int[] info, int[][] edges, int[] answer, int[] visited) {
        if (sheep <= wolf) {
            return;
        }

        answer[0] = Math.max(answer[0], sheep);

        visited[ROOT_INDEX] = VISITED_NUMBER;

        for (int[] edge : edges) {
            int parent_node = edge[0];
            int child_node = edge[1];

            if (visited[parent_node] == VISITED_NUMBER && visited[child_node] == NOT_VISITED_NUMBER) {
                visited[child_node] = VISITED_NUMBER;

                if (info[child_node] == SHEEP_NUMBER) {
                    dfs(sheep + 1, wolf, info, edges, answer, visited);
                } else if (info[child_node] == WOLF_NUMBER) {
                    dfs(sheep, wolf + 1, info, edges, answer, visited);
                }

                visited[child_node] = NOT_VISITED_NUMBER;
            }
        }
    }
}
```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/92343](https://school.programmers.co.kr/learn/courses/30/lessons/92343)
