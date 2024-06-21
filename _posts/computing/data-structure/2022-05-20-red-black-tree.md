---
title: "[Data Structure] Red Black Tree (레드 블랙 트리)"
excerpt: "레드 블랙 트리 정리"

categories:
  - data-structure
tags:
  - [red-black-tree]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2022-05-20
last_modified_at: 2023-12-04
---

# Red Black Tree

레드 블랙 트리는 자가 균형 이진 탐색 트리로서, AVL 트리처럼 스스로 균형을 잡는 트리입니다. 레드 블랙 트리에서는 다음의 규칙에 따라 정렬하여 균형을 맞춥니다.

 <br>

## 규칙

1. 모든 노드는 빨간색이나 검은색입니다.
2. 루트는 항상 검은색입니다.
3. 새로 추가되는 노드는 항상 빨간색입니다.
4. 루트에서 잎 노드로 가는 모든 경로에는 같은 수의 검은색 노드가 있어야 합니다.
5. 어떤 경로에서도 빨간색 노드 2개가 연속으로 있어서는 안 됩니다.
6. 모든 빈 노드는 검은색이라고 가정합니다.

 <br>

## 균형을 맞추는 방법

1. 이모 노드가 검은색일 경우
   회전을 합니다. 회전을 하고 나면 부모 노드는 검은색, 두 자식 노드는 빨간색이 되어야 합니다.

2. 이모 노드가 빨간색일 경우
   색상 전환을 합니다. 색상 전환을 하고 나면 부모 노드는 빨간색, 두 자식 노드는 검은색이 되어야 합니다.

<br>

## 레드 블랙 트리

<br>

![](https://cphinf.pstatic.net/mooc/20210430_97/16197213821273KHVs_PNG/mceclip0.png)

<br>

1~10까지의 숫자들을 레드 블랙 트리 규칙에 따라 배열하면 위 사진과 같이 나타납니다. 1부터 숫자들을 하나씩 추가하면서 규칙에 적합한지 확인해주면 됩니다. 규칙을 위반하면 회전과 색상 전환으로 규칙에 맞게 바꾸어 줍니다.

<br>
<HR>

## 클래스

레드 블랙 트리 클래스는 다음과 같습니다. 불리언 값을 가진 black로 참이면 검은색, 거짓이면 빨간색을 표시합니다. 그리고 이모 노드를 알아내기 위해 left, right, parent 노드를 가리키는 포인터뿐만 아니라 불리언 값을 가진 isLeftChild를 사용합니다.

```java
public class RedBlackTree<K,V> implements RedBlackI<K,V> {
	Node<K,V> root;
	int size;
	class Node<K,V> {
		K key;
		V value;
		Node<K,V> left, right, parent;
		boolean isLeftChild, black;
		public Node (K key, V value) {
			this.key = key;
			this.value = value;
			left = right = parent = null;
			black = false;
			isLeftChild = false;
		}
	}
}
```

<br>

## add 메소드

add 메소드의 동작 방식은 AVL 트리와 동일합니다. 단, isLeftChild가 추가되기 때문에 이를 고려해주어야 합니다.

<br>

add 메소드에 대한 코드는 다음과 같습니다. 트리가 비어있으면 노드를 추가하고 비어있지 않다면 재귀 add 메소드를 호출합니다.

```java
public void add(K key, V value){
	Node<K,V> node = new Node<K,V>(key, value);
	// 트리가 비어있을 경우
	if (root == null) {
		root = node;
		root.black = true;
		size++;
		return;
	}
	// 트리에 노드가 있을 경우 재귀 메소드 사용
	add(root, node);
	size++;
}
// add 재귀함수, 내부클래스
private void add (Node<K,V> parent, Node<K,V> newNode){
	// newNode의 data가 parent의 data보다 크면 트리의 오른쪽에 추가하면 됩니다.
	if (((Comparable<K>) newNode.key).compareTo(parent.key) > 0){
		if(parent.right == null){
			parent.right = newNode;
			newNode.parent = parent;
			newNode.isLeftChild=false;
			return;
		}
		return add(parent.right, newNode);
	// newNode의 data가 parent의 data보다 작거나 같으면 트리의 왼쪽에 추가하면 됩니다.
	if (parent.left == null){
		parent.left = newNode;
		newNode.parent = parent;
		newNode.isLeftChild=true;
		return;
	}
	return add(parent.left, newNode);
	// 레드 블랙 트리가 규칙에 맞게 잘 되어있는지 확인합니다.
	checkColor(newNode);
}
```

<br>

## 색상 확인 메소드

노드를 트리의 규칙에 맞게 추가한 후, 2-1강에서 배운 레드 블랙 트리의 6가지 규칙을 만족하는지 확인해주어야 합니다.

```java
public void checkColor(Node<K,V> node){
	//  루트는 항상 검은색이므로 색을 확인할 필요가 없습니다.
	if (node == root)
		return;
	// 빨간 노드 2개가 연속으로 나오는 경우 (레드 블랙 트리 규칙 위반)
	if (!node.black && !node.parent.black){
		correctTree(node);
	// 부모 노드를 계속 확인합니다.
	checkColor(node.parent);
}

public void correctTree(Node<K,V> node){
	// node의 부모 노드가 왼쪽 자식이면 이모 노드는 조부모 노드의 오른쪽 자식입니다.
	if (node.parent.isLeftChild) {
		// 이모 노드가 검은색 (이모 노드가 비어있는 경우 포함)
		if(node.parent.parent.right == null || node.parent.parent.right.black)
			// 회전
			return rotate(node);
		//  이모 노드가 빨간색
		if (node.parent.parent.right != null)
			// 색상 변환
			node.parent.parent.right.black = true;
		node.parent.parent.black = false;
		node.parent.black = true;
		return;
	}
	// node의 부모 노드가 오른쪽 자식이면 이모 노드는 조부모 노드의 왼쪽 자식입니다.
	// 위 코드와 동일하게 하되, 이모 노드를 node.parent.parent.left로 바꿉니다.
	else {
		// 이모 노드가 검은색 (이모 노드가 비어있는 경우 포함)
		if(node.parent.parent.left == null || node.parent.parent.left.black)
			// 회전
			return rotate(node);
		//  이모 노드가 빨간색
		if (node.parent.parent.left != null)
			// 색상 변환
			node.parent.parent.left.black = true;
		node.parent.parent.black = false;
		node.parent.black = true;
		return;
	}
```

<br>

## Rotate 메소드

현재 노드와 부모 노드가 각각 오른쪽 자식인지 왼쪽 자식인지에 따라 필요한 회전이 달라집니다. 각각의 경우에 대해 코딩하면 다음과 같습니다.

```java
public void rotate(Node<K,V> node){
	// 현재 노드가 왼쪽 자식
	if (node.isLeftChild) {
		// 부모 노드가 왼쪽 자식
		if (node.parent.isLeftChild)
			// 조부모 노드를 우측회전
			rightRotate(node.parent.parent);
			node.black = false;
			node.parent.black = true;
			if(node.parent.right != null)
				node.parent.right.black = false;
			return;
		}
		// 부모 노드가 오른쪽 자식
		// 조부모 노드를 우측-좌측 회전
		rightleftRotate(node.parent.parent);
		node.black = true;
		node.right.black = false;
		node.left.black = false;
		return;
	}
	// 현재 노드가 오른쪽 자식일 경우에도 부모 노드의 위치에 따라 좌측 회전, 좌측-우측 회전을 합니다.
	else {
		...
	}
}
```

<br>

## 좌측 회전

레드 블랙 트리에서 좌측 회전을 하는 코드는 다음과 같습니다. 힙 & 트리 기본 1-16강에서 배운 좌측 회전 코드와 유사합니다. 다만, parent 노드를 가리키는 포인터와 isLeftChild 변수를 추가로 사용하기 때문에 이들을 고려해주어야 합니다.

```java
// 좌측 회전: 조부모 노드를 부모 노드의 왼쪽 자식 노드 위치로 옮깁니다.
public void leftRotate (Node<K,V> node){
	Node<K,V> temp = node.right;
	node.right = temp.left;
	// 부모 노드 node.right가 temp가 되면서 조부모 노드가 없어집니다.
	if(node.right != null) {
		node.right.parent = node;
		node.right.isLeftChild = false;
	}
	// node가 루트인 경우
	if(node.parent == null) {
		root = temp;
		temp.parent = null;
	}
	// node가 루트가 아닌 경우
	else {
		temp.parent = node.parent;
		if(node.isLeftChild) {
			temp.isLeftChild = true;
			temp.parent.left = temp;
		} else {
			temp.isLeftChild = false;
			temp.parent.right = temp;
		}
		temp.left = node;
		node.isLeftChild = true;
		node.parent = temp;
	}
}
```

<br>

## 좌측-우측 회전

레드 블랙 트리에서 좌측-우측 회전을 하는 코드는 다음과 같습니다. 힙 & 트리 기본 1-16강에서 배운 내용과 동일합니다.

```java
// 좌측 회전 후 우측 회전
public void leftRightRotate(Node<K,V> node){
	leftRotate(node.left);
	rightRotate(node);
}
```

<br>

## 높이

간단한 재귀 메소드를 이용해 트리의 높이를 구할 수 있습니다.

```java
public int height() {
	if(root == null)
		return 0;
	return height(root) - 1;
}
// 트리의 어느 지점에서나 높이는 왼쪽과 오른쪽 중 가장 긴 경로의 길이입니다.
public int height(Node<K,V> node) {
	if (node == null)
		return 0;
	int leftheight = height(node.left) + 1
	int rightheight = height(node.right) + 1
	if (leftheight > rightheight)
		return leftheight;
	return rightheight;
}
```

<br>

## 검은색 노드 개수

재귀 메소드를 이용해 레드 블랙 트리의 검은색 노드의 개수를 구할 수 있습니다. 대략적으로 코드를 작성하면 다음과 같습니다.

```java
public int blackNodes(Node<K,V> node) {
	if (node == null)
		return 1;
	int rightBlackNodes = blackNodes(node.right)
	int leftBlackNodes = blackNodes(node.left)
	// 오른쪽과 왼쪽의 검은색 노드 개수가 다르면 에러를 내거나 고쳐줍니다.
	if (rightBlackNodes != leftBlackNodes)
		// throw an error
		// or fix the tree
	// 검은색 노드이면 해당 노드의 수를 늘려줍니다.
	if (node.black)
		leftBlackNodes++;
	return leftBlackNodes;
}
```

<br>

## Reference

- [BoostCourse](https://www.boostcourse.org/cs204/joinLectures/145114)
