---
title: "[HackerRank] Super Reduced String (Java)"
excerpt: "Super Reduced String, implementation"

categories:
  - HackerRank
tags:
  - [algorithms, implementation]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-02-05
last_modified_at: 2023-02-05
---

- [Reference](https://www.hackerrank.com/challenges/reduced-string/problem?isFullScreen=true)

<br>

## Solution

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
     * Complete the 'superReducedString' function below.
     *
     * The function is expected to return a STRING.
     * The function accepts STRING s as parameter.
     */

    public static String superReducedString(String s) {
    // Write your code here
    for (int i=1; i<s.length(); i++) {
        if(s.charAt(i-1)==s.charAt(i)){
            s = s.substring(0, i-1) + s.substring(i+1);
            i = 0;
        }
    }
    
    if(s.length()==0){
        return "Empty String";
    }
    return s;
    }

}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(System.getenv("OUTPUT_PATH")));

        String s = bufferedReader.readLine();

        String result = Result.superReducedString(s);

        bufferedWriter.write(result);
        bufferedWriter.newLine();

        bufferedReader.close();
        bufferedWriter.close();
    }
}
```