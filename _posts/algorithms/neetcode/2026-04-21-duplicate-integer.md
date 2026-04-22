---
title: '[NeetCode] Duplicate Integer'
excerpt: 'NeetCode synced attempts for Duplicate Integer.'

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

date: 2026-04-21T13:39:50+09:00
last_modified_at: 2026-04-21T13:39:50+09:00
neetcode_problem_slug: 'duplicate-integer'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/duplicate-integer/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:11961aaf135df25999b05154085d2bbf3b98782c:Data Structures & Algorithms/duplicate-integer/submission-0.py -->
### Attempt 1 · 2026-04-21 · Python

- Commit: [`11961aa`](https://github.com/devbattery/neetcode-submissions/commit/11961aaf135df25999b05154085d2bbf3b98782c)
- Source: [`Data Structures & Algorithms/duplicate-integer/submission-0.py`](https://github.com/devbattery/neetcode-submissions/blob/11961aaf135df25999b05154085d2bbf3b98782c/Data%20Structures%20%26%20Algorithms/duplicate-integer/submission-0.py)

```python
class Solution:
    def hasDuplicate(self, nums: List[int]) -> bool:
        return len(set(nums)) != len(nums)
```

<!-- neetcode-attempts:end -->
