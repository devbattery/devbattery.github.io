---
title: "[HackerRank] Beautiful Binary String (Java)"
excerpt: "Beautiful Binary String"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-10-31
last_modified_at: 2022-10-31
---

<https://www.hackerrank.com/challenges/beautiful-binary-string/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;

class Result {
    static int beautifulBinaryString(String b) { 
        int answer = 0;
        char[] chars = b.toCharArray();
        for (int i = 0; i < chars.length - 2; i++) {
            if (chars[i] == '0' && chars[i + 1] == '1' && chars[i + 2] == '0') {
                chars[i + 2] = '1';
                answer++;
            }
        }
        return answer;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        int n = Integer.parseInt(bufferedReader.readLine().trim());

        String b = bufferedReader.readLine();

        int result = Result.beautifulBinaryString(b);

        bufferedWriter.write(String.valueOf(result));
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```