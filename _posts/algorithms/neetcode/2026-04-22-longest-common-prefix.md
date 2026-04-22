---
title: '[NeetCode] 14. Longest Common Prefix'
excerpt: 'NeetCode synced attempts for 14. Longest Common Prefix.'

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

date: 2026-04-22
last_modified_at: 2026-04-22
neetcode_problem_slug: 'longest-common-prefix'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/longest-common-prefix/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:ae7f1d6232297e05260bace50c3f371d57f5073e:Data Structures & Algorithms/longest-common-prefix/submission-1.py -->
### Attempt 1 · 2026-04-22 · Python

- Commit: [`ae7f1d6`](https://github.com/devbattery/neetcode-submissions/commit/ae7f1d6232297e05260bace50c3f371d57f5073e)
- Source: [`Data Structures & Algorithms/longest-common-prefix/submission-1.py`](https://github.com/devbattery/neetcode-submissions/blob/ae7f1d6232297e05260bace50c3f371d57f5073e/Data%20Structures%20%26%20Algorithms/longest-common-prefix/submission-1.py)

```python
class Solution:
    def longestCommonPrefix(self, strs: List[str]) -> str:
        answer = ''

        for i in range(len(strs[0])):
            judg = strs[0][i]

            for s in strs:
                if i == len(s) or judg != s[i]:
                    return answer
            
            answer += judg
        
        return answer
```

<!-- neetcode-attempts:end -->
