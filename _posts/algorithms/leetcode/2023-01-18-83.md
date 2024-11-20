---
title: "[LeetCode] 83. Remove Duplicates from Sorted List (Java)"
excerpt: "Remove Duplicates from Sorted List"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-01-18
last_modified_at: 2023-01-18
---

- [Reference](https://leetcode.com/problems/remove-duplicates-from-sorted-list/)

<br>

## Solution

```java
class ListNode {
    int val;
    ListNode next;

    public ListNode() {
    }

    public ListNode(int val) {
        this.val = val;
    }

    public ListNode(int val, ListNode next) {
        this.val = val;
        this.next = next;
    }
}

public class RemoveDuplicatesFromSortedList {
    // The list is guaranteed to be sorted in ascending order.
    public static ListNode deleteDuplicates(ListNode head) {
        ListNode currentNode = head;
        // 현재 노드와 다음 노드가 null이 아닐 때
        while (currentNode != null && currentNode.next != null) {
            if (currentNode.val == currentNode.next.val) { // 같을 경우
                currentNode.next = currentNode.next.next; // 현재 노드가 다다음 노드를 가리키게 함
            } else { // 같지 않을 경우
                currentNode = currentNode.next; // 다음 노드로 이동
            }
        }
        return head; // pointer
    }
}
```