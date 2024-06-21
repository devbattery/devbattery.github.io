---
title: "[자료구조] Stack and Queue (스택과 큐)"
excerpt: "스택과 큐 정리"

categories:
  - data-structure
tags:
  - [stack, queue]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2022-05-19
last_modified_at: 2022-05-19
---

**배열**

 <br>

![](https://cphinf.pstatic.net/mooc/20210430_116/1619710888106cD9Y6_PNG/mceclip2.png)

 <br>

배열에는 순서가 있습니다. 그래서 첫 부분을 제거하거나 추가하려면, 요소들을 하나씩 뒤로 옮겨야 하고 시간 복잡도는 $O(n)$ 입니다. 스택과 큐의 과정이 비효율적이기 때문에 스택과 큐에서 기본적인 배열을 사용하지 않습니다.

 <br>

![](https://cphinf.pstatic.net/mooc/20210430_171/1619710615606kqDy2_PNG/mceclip1.png)

<br>

연결 리스트에서는 배열 맨 앞을 가리키는 head 포인터를 사용합니다. 그래서 리스트의 첫 부분을 제거하거나 추가하는 과정의 시간 복잡도가 상수입니다. 더 효율적인 알고리즘인 연결 리스트는 스택과 큐를 하는 데 사용합니다.


배열은 연결 리스트보다 전형적으로 빠르고 메모리도 덜 차지합니다. 그러나 배열은 크기가 정해져 있습니다.

<br>
<HR>
<br>

1. 배열로 스택 구현하기

addLast, removeLast -> $O(1)$의 시간복잡도

addFirst, removeFirst -> 배열의 원소들은 메모리 상에서 순차적으로 저장되기 때문에 맨 앞에서 삽입/삭제 연산이 일어나면 뒤로 한칸씩 미루거나 앞으로 한칸씩 당겨야 하므로 $O(n)$의 시간복잡도

Stack (무더기, 쌓다)

- Last In First Out (LIFO, 후입선출, 나중에 들어온 원소가 제일 먼저 나간다.)

- top에서만 삽입/삭제가 일어나며, 배열로 구현하면 $O(1)$의 시간복잡도 (addLast, addFirst)

 <br>

2. 배열로 큐 구현하기

addLast, removeLast -> $O(1)$의 시간복잡도

addFirst, removeFirst -> $O(n)$의 시간복잡도

Queue (줄, 대기열, 줄을 서서 기다리다)

- First In First Out (FIFO, 선입선출, 먼저 들어온 원소가 먼저 나간다.)

- 삽입은 rear에서 삭제는 front에서 일어나므로 삽입은 $O(1)$, 삭제는 $O(n)$의 시간복잡도

- front에서 배열 원소를 삭제할 때도 상수 시간을 보장하려면? 원형 배열 (head와 tail의 위치가 고정적이지 않고, 배열의 시작과 끝이 연결되어 있는 구조)


<br>

[**Source**](https://www.boostcourse.org/cs204/joinLectures/145114)
