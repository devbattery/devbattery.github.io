---
title: "[HackerRank] Java Primality Test"
excerpt: "Java Primality Test"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-06
last_modified_at: 2022-06-06
---

<https://www.hackerrank.com/challenges/java-primality-test/problem?isFullScreen=true>

### isProbablePrime()

{: .box-note}
Returns true if this BigInteger is probably prime, false if it's definitely composite. If certainty is ≤ 0, true is returned.<br>
Parameters:<br>
certainty - a measure of the uncertainty that the caller is willing to tolerate: if the call returns true the probability that this BigInteger is prime exceeds (1 - 1/2certainty). The execution time of this method is proportional to the value of this parameter.<br>
Returns:<br>
true if this BigInteger is probably prime, false if it's definitely composite.<br>

[**Source**](https://docs.oracle.com/javase/7/docs/api/java/math/BigInteger.html#isProbablePrime%28int%29)

<br>

## Solution

```java
import java.util.*;

public class Solution {

    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            System.out.println(scanner.nextBigInteger().isProbablePrime(100)
                    ? "prime" : "not prime");
        }
    }
}
```