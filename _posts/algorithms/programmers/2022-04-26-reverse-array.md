---
title: "[Programmers] 자연수 뒤집어 배열로 만들기 (Java)"
excerpt: "자연수 뒤집어 배열로 만들기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-04-26
last_modified_at: 2022-04-26
---

<https://programmers.co.kr/learn/courses/30/lessons/12932>

<br>


## Solution

```java
import java.util.Arrays;

class Solution {
    public static int[] solution(long n) {
        int[] answer = new int[countDigits(n)];

        for (int i = 0; i < countDigits(n); i++) {
            answer[i] = returnNumber(n, i);
        }

        reverseArray(answer);
        return answer;
    }

    public static void reverseArray(int[] array) {
        int maxIndex = array.length - 1; // out of index
        int halfLength = array.length / 2;

        for (int i = 0; i < halfLength; i++) {
            int temp = array[i];
            array[i] = array[maxIndex - i]; // i++ -> get closer
            array[maxIndex - i] = temp;
        }
    }

    public static int returnNumber(long number, int index) {
        int num = 0;

        String numStr = Long.toString(number);
        String extractedStr = numStr.substring(index, index + 1);

        return num = Integer.parseInt(extractedStr);
    }

    public static int countDigits(long n) {
        int count = 0;

        String numStr = Long.toString(n);
        return count = numStr.length();
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(solution(12345)));
    }
}
```

<br>

## Another Solution

```java
class Solution {
  public int[] solution(long n) {
      String a = "" + n;
        int[] answer = new int[a.length()];
        int cnt=0;

        while(n>0) {
            answer[cnt]=(int)(n%10);
            n/=10;
            System.out.println(n);
            cnt++;
        }
      return answer;
  }
}
```
