---
title: '[NeetCode] 75. Sort Colors'
excerpt: 'Synced attempt history for LeetCode 75: Sort Colors.'

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

date: 2026-05-20T16:29:56+09:00
last_modified_at: 2026-05-20T16:29:56+09:00
neetcode_problem_slug: 'sort-colors'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/sort-colors/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:b77634a4052b299bd11d6d45c7c046626dd8a00e:Data Structures & Algorithms/sort-colors/submission-0.py -->
### Attempt 1 · 2026-05-20 · Python

- Commit: [`b77634a`](https://github.com/devbattery/neetcode-submissions/commit/b77634a4052b299bd11d6d45c7c046626dd8a00e)
- Source: [`Data Structures & Algorithms/sort-colors/submission-0.py`](https://github.com/devbattery/neetcode-submissions/blob/b77634a4052b299bd11d6d45c7c046626dd8a00e/Data%20Structures%20%26%20Algorithms/sort-colors/submission-0.py)

```python
class Solution:
    def sortColors(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """

        lt, mid, rt = 0, 0, len(nums) - 1

        while mid <= rt:
            if nums[mid] == 0:
                nums[lt], nums[mid] = nums[mid], nums[lt]
                lt += 1
                mid += 1
            elif nums[mid] == 1:
                mid += 1
            else:  # nums[mid] == 2:
                nums[mid], nums[rt] = nums[rt], nums[mid]
                rt -= 1
        
        
```

<!-- neetcode-attempts:end -->
