---
title: '[NeetCode] 705. Design HashSet'
excerpt: 'Synced attempt history for LeetCode 705: Design HashSet.'

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

date: 2026-05-11T17:30:55+09:00
last_modified_at: 2026-05-11T17:30:55+09:00
neetcode_problem_slug: 'design-hashset'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/design-hashset/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:e3a874605d5cccadcd219391c1bbc26e4a8b01ec:Data Structures & Algorithms/design-hashset/submission-0.py -->
### Attempt 1 · 2026-05-11 · Python

- Commit: [`e3a8746`](https://github.com/devbattery/neetcode-submissions/commit/e3a874605d5cccadcd219391c1bbc26e4a8b01ec)
- Source: [`Data Structures & Algorithms/design-hashset/submission-0.py`](https://github.com/devbattery/neetcode-submissions/blob/e3a874605d5cccadcd219391c1bbc26e4a8b01ec/Data%20Structures%20%26%20Algorithms/design-hashset/submission-0.py)

```python
class ListNode:

    def __init__(self, key):
        self.key = key
        self.next = None

class MyHashSet:

    def __init__(self):
        self.size = 10000
        # ex. [15] -> [10015] -> [20015]: remainder 15 with chaining
        self.buckets = [ListNode(0) for _ in range(self.size)]

    def hash(self, key: int) -> int:
        # remainder
        return key % self.size
        
    def add(self, key: int) -> None:
        current = self.buckets[self.hash(key)]

        while current.next:
            if current.next.key == key:
                return
            
            current = current.next
        
        current.next = ListNode(key)

    def remove(self, key: int) -> None:
        current = self.buckets[self.hash(key)]

        while current.next:
            if current.next.key == key:
                # from A -> B -> C to A -> C
                current.next = current.next.next
                return
            
            current = current.next
        
    def contains(self, key: int) -> bool:
        current = self.buckets[self.hash(key)]

        while current.next:
            if current.next.key == key:
                return True
            
            current = current.next
        
        return False
        


# Your MyHashSet object will be instantiated and called as such:
# obj = MyHashSet()
# obj.add(key)
# obj.remove(key)
# param_3 = obj.contains(key)
```

<!-- neetcode-attempts:end -->
