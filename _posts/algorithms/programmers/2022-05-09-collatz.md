---
title: "[Programmers] 콜라츠 추측 (Java)"
excerpt: "콜라츠 추측"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-09
last_modified_at: 2022-05-09
---

<https://programmers.co.kr/learn/courses/30/lessons/12943>

<br>

## Solution

```java
class Solution {
    public static int solution(int num) {
        long number = num;
        int answer = 0;
        int count = 0;

            while (number != 1) {
                if (number % 2 == 0) { // Even
                    number = number / 2;
                    count++;
                } else if (number % 2 != 0) { // Odd
                    number = number * 3 + 1;
                    count++;
                }

                if (count == 500) {
                    answer = -1;
                    break;
                }
                
                answer = count;

            }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(6));
        System.out.println(solution(16));
        System.out.println(solution(626331));

    }
}

// failed code
/*
class Solution {
    public static int solution(long num) {
        long number = num;
        int answer = 0;
        int count = 0;

            while (true) {
                if (number % 2 == 0) { // Even
                    number = number / 2;
                    count++;
                } else if (number % 2 != 0) { // Odd
                    number = number * 3 + 1;
                    count++;
                }

                if (number == 1) {
                    answer = count;
                    break;
                }

                if (count == 500) {
                    answer = -1;
                    break;
                }

            }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution(6));
        System.out.println(solution(16));
        System.out.println(solution(626331));

    }
}
*/
```
<br>

## Another Solution

```java
class Collatz {
    public int collatz(int num) {
    long n = (long)num;
    for(int i =0; i<500; i++){      
      if(n==1) return i;
      n = (n%2==0) ? n/2 : n*3+1;            
    }
    return -1;
  }

    public static void main(String[] args) {
        Collatz c = new Collatz();
        int ex = 6;
        System.out.println(c.collatz(ex));
    }
}
```
