---
title: "[HackerRank] Grading Students (Java)"
excerpt: "Grading Students"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-28
last_modified_at: 2022-08-28
---

<https://www.hackerrank.com/challenges/grading/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

class Result {
    static List<Integer> gradingStudents(List<Integer> grades) {
        List<Integer> answer = new ArrayList<>();
        for (int grade : grades) {
            if (grade < 38 || grade % 5 <= 2) {
                answer.add(grade);
            } else {
                int add = 5 - grade % 5;
                answer.add(grade + add);
            }
        }
        return answer;
    }
}

class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());
        List<Integer> grades = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            grades.add(Integer.parseInt(br.readLine()));
        }

        for (int x : Result.gradingStudents(grades)) {
            System.out.println(x);
        }
        br.close();
    }
}
```