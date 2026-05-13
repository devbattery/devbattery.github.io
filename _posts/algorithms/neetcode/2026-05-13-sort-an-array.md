---
title: '[NeetCode] 912. Sort an Array'
excerpt: 'NeetCode synced attempts for 912. Sort an Array.'

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

date: 2026-05-13T16:34:05+09:00
last_modified_at: 2026-05-13T16:34:05+09:00
neetcode_problem_slug: 'sort-an-array'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/sort-an-array/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:3d91819fc5dced604093350185b8f93a1fe3c14a:Data Structures & Algorithms/sort-an-array/submission-0.py -->
### Attempt 1 · 2026-05-13 · Python

- Commit: [`3d91819`](https://github.com/devbattery/neetcode-submissions/commit/3d91819fc5dced604093350185b8f93a1fe3c14a)
- Source: [`Data Structures & Algorithms/sort-an-array/submission-0.py`](https://github.com/devbattery/neetcode-submissions/blob/3d91819fc5dced604093350185b8f93a1fe3c14a/Data%20Structures%20%26%20Algorithms/sort-an-array/submission-0.py)

```python
class Solution:
    def sortArray(self, nums: List[int]) -> List[int]:

        def mergeSort(l: int, mid: int, r: int):
            lt = nums[l : mid+1]
            rt = nums[mid+1 : r+1]

            lp = 0
            rp = 0
            p = l

            while lp < len(lt) and rp < len(rt):
                if lt[lp] <= rt[rp]:
                    nums[p] = lt[lp]
                    lp += 1
                else:
                    nums[p] = rt[rp]
                    rp += 1
                
                p += 1
            
            # add all to lt
            while lp < len(lt):
                nums[p] = lt[lp]
                lp += 1
                p += 1

            # add all to rt
            while rp < len(rt):
                nums[p] = rt[rp]
                rp += 1
                p += 1

        
        def divideSort(lp: int, rp: int):
            if lp >= rp:
                return
            
            mid = (lp + rp) // 2

            divideSort(lp, mid)  # left half sort
            divideSort(mid + 1, rp)  # right half sort

            mergeSort(lp, mid, rp)
        
        divideSort(0, len(nums) - 1)
        
        return nums
```

<!-- neetcode-attempts:end -->
