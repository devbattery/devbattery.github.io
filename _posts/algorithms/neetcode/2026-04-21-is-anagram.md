---
title: '[NeetCode] Is Anagram'
excerpt: 'NeetCode synced attempts for Is Anagram.'

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
neetcode_problem_slug: 'is-anagram'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/is-anagram/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:dc206aedb5da817ffe6dcdadabdca92e62365e79:Data Structures & Algorithms/is-anagram/submission-0.py -->
### Attempt 1 · 2026-04-21 · Python

- Commit: [`dc206ae`](https://github.com/devbattery/neetcode-submissions/commit/dc206aedb5da817ffe6dcdadabdca92e62365e79)
- Source: [`Data Structures & Algorithms/is-anagram/submission-0.py`](https://github.com/devbattery/neetcode-submissions/blob/dc206aedb5da817ffe6dcdadabdca92e62365e79/Data%20Structures%20%26%20Algorithms/is-anagram/submission-0.py)

```python
class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        return sorted(s) == sorted(t)
```

<!-- neetcode-attempts:end -->
