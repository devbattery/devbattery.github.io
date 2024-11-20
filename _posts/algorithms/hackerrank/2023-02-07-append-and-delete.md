---
title: "[HackerRank] Append and Delete (failed) (Java)"
excerpt: "Append and Delete, implementation"

categories:
  - HackerRank
tags:
  - [algorithms, implementation]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-02-07
last_modified_at: 2023-02-07
---

- [Reference](https://www.hackerrank.com/challenges/append-and-delete/problem?isFullScreen=true)
- 5/14 test cases failed :(

<br>

## Failed
```java
import java.io.*;
import java.math.*;
import java.security.*;
import java.text.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.stream.*;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toList;

class Result {

    /*
     * Complete the 'appendAndDelete' function below.
     *
     * The function is expected to return a STRING.
     * The function accepts following parameters:
     *  1. STRING s
     *  2. STRING t
     *  3. INTEGER k
     */

    public static String appendAndDelete(String s, String t, int k) {
    // tocharArray <- trash code
    
    int cnt=Math.abs(s.length()-t.length());
    int min=Math.min(s.length(), t.length());
    
    if (cnt == 0) {
        return "Yes";
    }
    
    System.out.println("before cnt: " + cnt);
    for(int i=0; i<min; i++){
        if(s.charAt(i)!=t.charAt(i)){
            cnt += (min - i) * 2;
            break;
        }
    }
    System.out.println("next cnt: " + cnt);
    return cnt == k ? "Yes" : "No";
    }

}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        String s = bufferedReader.readLine();

        String t = bufferedReader.readLine();

        int k = Integer.parseInt(bufferedReader.readLine().trim());

        String result = Result.appendAndDelete(s, t, k);

        bufferedWriter.write(result);
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```

## Solution

```java

```