---
title: '[NeetCode] Anagram Groups'
excerpt: 'Synced attempt history for Anagram Groups.'

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

date: 2026-04-22T13:30:01+09:00
last_modified_at: 2026-04-22T14:13:51+09:00
neetcode_problem_slug: 'anagram-groups'
neetcode_source_repo: 'devbattery/neetcode-submissions'
---

- [Problem](https://neetcode.io/problems/anagram-groups/question)
- Synced automatically from `devbattery/neetcode-submissions`

## Notes

Write your own notes here. This section is preserved across syncs.

## Attempts

<!-- neetcode-attempts:start -->
<!-- neetcode-attempt:d98d18098fcf3a109a5f351aa54af252a15caa36:Data Structures & Algorithms/anagram-groups/submission-0.py -->
### Attempt 1 · 2026-04-22 · Python

- Commit: [`d98d180`](https://github.com/devbattery/neetcode-submissions/commit/d98d18098fcf3a109a5f351aa54af252a15caa36)
- Source: [`Data Structures & Algorithms/anagram-groups/submission-0.py`](https://github.com/devbattery/neetcode-submissions/blob/d98d18098fcf3a109a5f351aa54af252a15caa36/Data%20Structures%20%26%20Algorithms/anagram-groups/submission-0.py)

```python
class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        answer = defaultdict(list)

        for s in strs:
            answer["".join(sorted(s))].append(s)
        
        print(answer)
        return list(answer.values())
```

<!-- neetcode-attempt:b1d69f0cb02a7978acc0f076b89f039b68980de2:Data Structures & Algorithms/anagram-groups/submission-2.py -->
### Attempt 2 · 2026-04-22 · Python

- Commit: [`b1d69f0`](https://github.com/devbattery/neetcode-submissions/commit/b1d69f0cb02a7978acc0f076b89f039b68980de2)
- Source: [`Data Structures & Algorithms/anagram-groups/submission-2.py`](https://github.com/devbattery/neetcode-submissions/blob/b1d69f0cb02a7978acc0f076b89f039b68980de2/Data%20Structures%20%26%20Algorithms/anagram-groups/submission-2.py)

```python
class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        answer = defaultdict(list)

        for s in strs:
            cnt = [0] * 26  # a to z

            for c in s:
                cnt[ord(c) - ord('a')] += 1  # a: 0, b: 1, ...
            
            answer[tuple(cnt)].append(s)  # key of defaultdict(list) can't be list
        
        return list(answer.values())
```
<!-- neetcode-attempts:end -->
