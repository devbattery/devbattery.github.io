---
title: '[NeetCode] Top K Elements In List'
excerpt: 'Synced attempt history for Top K Elements In List.'

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

date: 2026-05-20T18:10:00+09:00
last_modified_at: 2026-05-20T18:10:00+09:00
neetcode_problem_slug: 'top-k-elements-in-list'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/top-k-elements-in-list/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:7ab5757efecb6190f209f16c79d5cbaf2bba4f9d:Data Structures & Algorithms/top-k-elements-in-list/submission-1.py -->
### Attempt 1 · 2026-05-20 · Python

- Commit: [`7ab5757`](https://github.com/devbattery/neetcode-submissions/commit/7ab5757efecb6190f209f16c79d5cbaf2bba4f9d)
- Source: [`Data Structures & Algorithms/top-k-elements-in-list/submission-1.py`](https://github.com/devbattery/neetcode-submissions/blob/7ab5757efecb6190f209f16c79d5cbaf2bba4f9d/Data%20Structures%20%26%20Algorithms/top-k-elements-in-list/submission-1.py)

```python
class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        cnt_dict = collections.Counter(nums)
        buckets = [[] for _ in range(len(nums) + 1)]  # 0 to len(nums)

        for num, freq in cnt_dict.items():
            buckets[freq].append(num)
        
        answer = []
        for i in range(len(buckets) - 1, 0, -1):
            for num in buckets[i]:
                answer.append(num)

                if k == len(answer):
                    return answer
```

<!-- neetcode-attempts:end -->
