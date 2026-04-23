---
title: '[NeetCode] 27. Remove Element'
excerpt: 'NeetCode synced attempts for 27. Remove Element.'

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

date: 2026-04-23T09:47:43+09:00
last_modified_at: 2026-04-23T09:47:43+09:00
neetcode_problem_slug: 'remove-element'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/remove-element/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:fb0df7a0ac0bb03ee335f866b9f0c165633443c6:Data Structures & Algorithms/remove-element/submission-0.py -->
### Attempt 1 · 2026-04-23 · Python

- Commit: [`fb0df7a`](https://github.com/devbattery/neetcode-submissions/commit/fb0df7a0ac0bb03ee335f866b9f0c165633443c6)
- Source: [`Data Structures & Algorithms/remove-element/submission-0.py`](https://github.com/devbattery/neetcode-submissions/blob/fb0df7a0ac0bb03ee335f866b9f0c165633443c6/Data%20Structures%20%26%20Algorithms/remove-element/submission-0.py)

```python
class Solution:
    def removeElement(self, nums: List[int], val: int) -> int:
        k = 0

        for i in range(len(nums)):
            if nums[i] != val:
                nums[k] = nums[i]
                k += 1
            else:
                nums[i] = nums[k]
                
        return k
```

<!-- neetcode-attempts:end -->
