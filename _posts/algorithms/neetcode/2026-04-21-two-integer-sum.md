---
title: '[NeetCode] Two Integer Sum'
excerpt: 'NeetCode synced attempts for Two Integer Sum.'

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

date: 2026-04-21
last_modified_at: 2026-04-21
neetcode_problem_slug: 'two-integer-sum'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/two-integer-sum/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:4e2a6a086c7ca48532bfc7a4d477d7670cb08040:Data Structures & Algorithms/two-integer-sum/submission-1.py -->
### Attempt 1 · 2026-04-21 · Python

- Commit: [`4e2a6a0`](https://github.com/devbattery/neetcode-submissions/commit/4e2a6a086c7ca48532bfc7a4d477d7670cb08040)
- Source: [`Data Structures & Algorithms/two-integer-sum/submission-1.py`](https://github.com/devbattery/neetcode-submissions/blob/4e2a6a086c7ca48532bfc7a4d477d7670cb08040/Data%20Structures%20%26%20Algorithms/two-integer-sum/submission-1.py)

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        answer_dict = {}  # {v: i} for index

        for i, v in enumerate(nums):
            diff = target - v

            if diff in answer_dict:
                return [answer_dict[diff], i]

            answer_dict[v] = i
```

<!-- neetcode-attempts:end -->
