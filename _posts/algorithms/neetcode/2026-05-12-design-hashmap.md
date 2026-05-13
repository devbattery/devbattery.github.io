---
title: '[NeetCode] 706. Design HashMap'
excerpt: 'Synced attempt history for LeetCode 706: Design HashMap.'

categories:
  - NeetCode
tags:
  - algorithms
  - neetcode
  - 'python'

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2026-05-12T18:09:36+09:00
last_modified_at: 2026-05-12T18:09:36+09:00
neetcode_problem_slug: 'design-hashmap'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/design-hashmap/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:9d85ff69de4c4253783af22dd915e3d32ff5c0d3:Data Structures & Algorithms/design-hashmap/submission-3.py -->
### Attempt 1 · 2026-05-12 · Python

- Commit: [`9d85ff6`](https://github.com/devbattery/neetcode-submissions/commit/9d85ff69de4c4253783af22dd915e3d32ff5c0d3)
- Source: [`Data Structures & Algorithms/design-hashmap/submission-3.py`](https://github.com/devbattery/neetcode-submissions/blob/9d85ff69de4c4253783af22dd915e3d32ff5c0d3/Data%20Structures%20%26%20Algorithms/design-hashmap/submission-3.py)

```python
class ListNode:
    
    def __init__(self, key=-1, value=-1, next=None):
        self.key = key
        self.value = value
        self.next = next

class MyHashMap:

    def __init__(self):
        self.size = 10000
        self.map = [ListNode() for _ in range(self.size)]

    def hash(self, key: int) -> int:
        return key % self.size

    def put(self, key: int, value: int) -> None:
        current = self.map[self.hash(key)]

        while current.next:
            if current.next.key == key:
                current.next.value = value
                return
            
            current = current.next
            
        current.next = ListNode(key, value)

    def get(self, key: int) -> int:
        current = self.map[self.hash(key)].next  # next: excluding dummy(ListNode)

        while current:
            if current.key == key:
                return current.value
            
            current = current.next
        
        return -1

    def remove(self, key: int) -> None:
        current = self.map[self.hash(key)]

        while current and current.next:
            if current.next.key == key:
                current.next = current.next.next
                return
            
            current = current.next



# Your MyHashMap object will be instantiated and called as such:
# obj = MyHashMap()
# obj.put(key,value)
# param_2 = obj.get(key)
# obj.remove(key)
```

<!-- neetcode-attempts:end -->
