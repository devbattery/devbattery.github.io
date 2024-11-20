---
title: "[HackerRank] Number Line Jumps (Java)"
excerpt: "Number Line Jumps, implementation"

categories:
  - HackerRank
tags:
  - [algorithms, implementation]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-02-04
last_modified_at: 2023-02-04
---

- [Reference](https://www.hackerrank.com/challenges/kangaroo/problem?isFullScreen=true)

<br>

## Solution

```java
import java.io.*;

class Result {

    /*
     * Complete the 'kangaroo' function below.
     *
     * The function is expected to return a STRING.
     * The function accepts following parameters:
     *  1. INTEGER x1
     *  2. INTEGER v1
     *  3. INTEGER x2
     *  4. INTEGER v2
     */

    public static String kangaroo(int x1, int v1, int x2, int v2) {
        // Write your code here
        for (int i = 0; i <= 10000; i++) {
            if (x1 == x2) {
                return "YES";
            }
            
            x1 += v1;
            x2 += v2;
        }
        return "NO";
    }

}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        String[] firstMultipleInput = bufferedReader.readLine().replaceAll("\\s+$", "").split(" ");

        int x1 = Integer.parseInt(firstMultipleInput[0]);

        int v1 = Integer.parseInt(firstMultipleInput[1]);

        int x2 = Integer.parseInt(firstMultipleInput[2]);

        int v2 = Integer.parseInt(firstMultipleInput[3]);

        String result = Result.kangaroo(x1, v1, x2, v2);

        bufferedWriter.write(result);
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```