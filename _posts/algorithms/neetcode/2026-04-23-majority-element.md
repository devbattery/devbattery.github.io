---
title: '[NeetCode] 169. Majority Element'
excerpt: 'NeetCode synced attempts for 169. Majority Element.'

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

date: 2026-04-23T09:59:46+09:00
last_modified_at: 2026-04-23T09:59:46+09:00
neetcode_problem_slug: 'majority-element'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/majority-element/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:77b24dbca1b87e49b163d7da5334dc1166bfff87:Data Structures & Algorithms/majority-element/submission-0.py -->
### Attempt 1 · 2026-04-23 · Python

- Commit: [`77b24db`](https://github.com/devbattery/neetcode-submissions/commit/77b24dbca1b87e49b163d7da5334dc1166bfff87)
- Source: [`Data Structures & Algorithms/majority-element/submission-0.py`](https://github.com/devbattery/neetcode-submissions/blob/77b24dbca1b87e49b163d7da5334dc1166bfff87/Data%20Structures%20%26%20Algorithms/majority-element/submission-0.py)

```python
class Solution:
    def majorityElement(self, nums: List[int]) -> int:
        answer_dict = defaultdict(int)

        for num in nums:
            answer_dict[num] += 1
        
        return max(answer_dict, key=answer_dict.get)
```

<!-- neetcode-attempts:end -->
