---
title: "[Programmers] 길 찾기 게임 (Python, Java)"
excerpt: "algorithms, python, java, 2019 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [algorithms, python, java, 2019 KAKAO BLIND RECRUITMENT]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-12-07
last_modified_at: 2023-12-09
---

- TODO: Java로 다시 풀어보자

<br>

## Solution

### Python

```python
import sys

sys.setrecursionlimit(10000)


class Node:

    def __init__(self, x, y, index):
        self.x = x
        self.y = y
        self.index = index
        self.left = None
        self.right = None


class BinaryTree:

    def __init__(self):
        self.root = None
        self.pre_answer = []
        self.post_answer = []

    def insert(self, parent_node, current_node):
        if parent_node is None:
            parent_node = current_node

        # 단순하게 x 좌표 비교니까 당연한 거임
        if current_node.x < parent_node.x:
            parent_node.left = self.insert(parent_node.left, current_node)
        elif current_node.x > parent_node.x:
            parent_node.right = self.insert(parent_node.right, current_node)

        return parent_node

    def create(self, node_list):
        for node in node_list:
            self.root = self.insert(self.root, node)

    def preorder(self, current_node):
        self.pre_answer.append(current_node.index)

        if current_node.left:
            self.preorder(current_node.left)

        if current_node.right:
            self.preorder(current_node.right)

    def postorder(self, current_node):
        if current_node.left:
            self.postorder(current_node.left)

        if current_node.right:
            self.postorder(current_node.right)

        self.post_answer.append(current_node.index)


def solution(nodeinfo):
    new_nodeinfo = []
    for i, node in enumerate(nodeinfo):
        current_x, current_y = node[0], node[1]
        new_nodeinfo.append([current_x, current_y, i + 1])

    # -x[1]: y좌표(깊이)를 내림차순
    new_nodeinfo.sort(key=lambda x: -x[1])

    node_list = []
    for x, y, index in new_nodeinfo:
        node_list.append(Node(x, y, index))

    tree = BinaryTree()
    tree.create(node_list)
    tree.preorder(tree.root)
    tree.postorder(tree.root)

    return [tree.pre_answer, tree.post_answer]


print(solution([[5, 3], [11, 5], [13, 3], [3, 5], [6, 1], [1, 3], [8, 6], [7, 2], [2, 2]]))
```

### Java

```java
package programmers.sully.week38;

import java.util.*;

class Node {

    int x;
    int y;
    int index;
    Node left;
    Node right;

    public Node(int x, int y, int index) {
        this.x = x;
        this.y = y;
        this.index = index;
        this.left = null;
        this.right = null;
    }

}

class BinaryTree {

    Node root;
    List<Integer> preAnswer;
    List<Integer> postAnswer;

    public BinaryTree() {
        this.root = null;
        this.preAnswer = new ArrayList<>();
        this.postAnswer = new ArrayList<>();
    }

    public Node insert(Node parent, Node current) {
        // 처음을 위해서만 해주는 것 (위에 아무것도 없으니)
        if (parent == null) {
            parent = current;
        }

        // 현재 노드가 부모 노드보다 왼쪽에 존재한다면, 현재 노드는 당연히 부모 노드보다 왼쪽에 위치함
        if (current.x < parent.x) {
            parent.left = insert(parent.left, current);
        } else if (current.x > parent.x) {
            parent.right = insert(parent.right, current);
        }

        return parent;
    }

    public void create(List<Node> nodeList) {
        for (Node node : nodeList) {
            root = insert(root, node);
        }
    }

    public void preorder(Node current) {
        preAnswer.add(current.index);

        if (current.left != null) {
            preorder(current.left);
        }

        if (current.right != null) {
            preorder(current.right);
        }
    }

    public void postorder(Node current) {
        if (current.left != null) {
            postorder(current.left);
        }

        if (current.right != null) {
            postorder(current.right);
        }

        postAnswer.add(current.index);
    }

}

class Solution {

    public int[][] solution(int[][] nodeinfo) {
        int[][] answer = new int[2][nodeinfo.length];
        List<int[]> newNodeinfo = new ArrayList<>();

        for (int i = 0; i < nodeinfo.length; i++) {
            int currentX = nodeinfo[i][0];
            int currentY = nodeinfo[i][1];
            newNodeinfo.add(new int[]{currentX, currentY, i + 1});
        }

        newNodeinfo.sort((a, b) -> Integer.compare(b[1], a[1]));

        List<Node> nodeList = new ArrayList<>();
        for (int[] newNode : newNodeinfo) {
            nodeList.add(new Node(newNode[0], newNode[1], newNode[2]));
        }

        BinaryTree binaryTree = new BinaryTree();
        binaryTree.create(nodeList);
        binaryTree.preorder(binaryTree.root);
        binaryTree.postorder(binaryTree.root);

        for (int i = 0; i < binaryTree.preAnswer.size(); i++) {
            answer[0][i] = binaryTree.preAnswer.get(i);
            answer[1][i] = binaryTree.postAnswer.get(i);
        }

        return answer;
    }

}

```

<br>

## Reference

- [https://school.programmers.co.kr/learn/courses/30/lessons/42892](https://school.programmers.co.kr/learn/courses/30/lessons/42892)
