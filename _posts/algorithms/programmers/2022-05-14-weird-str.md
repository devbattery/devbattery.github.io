---
title: "[Programmers] 이상한 문자 만들기 (Java)"
excerpt: "이상한 문자 만들기"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-05-14
last_modified_at: 2022-05-14
---

<https://programmers.co.kr/learn/courses/30/lessons/12930>

<br>

## Solution

```java
import java.util.Locale;

class Solution {
    public static String solution(String s) {
        String answer = "";
        String[] str = s.split("");

        int count = 0;
        for (int i = 0; i < str.length; i++) {
            if (str[i].equals(" ")) { // reset count
                count = 0;
            } else if (count % 2 == 0) {
                str[i] = str[i].toUpperCase(Locale.ROOT);
                count++;
            } else if (count % 2 == 1) {
                str[i] = str[i].toLowerCase(Locale.ROOT);
                count++;
            }
        }

        for (String v : str) {
            answer += v;
        }

        return answer;
    }

    public static void main(String[] args) {
        System.out.println(solution("try hello world"));
    }
}

// failed code
/*
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public static String solution(String s) {
        StringBuilder answer = new StringBuilder();
        StringBuilder string = new StringBuilder();
        List<String> sArr = new ArrayList<>(Arrays.asList(s.split(" ")));
        List<String> strArr = new ArrayList<>();

        for (String value : sArr) {
            for (int i = 0; i < value.length(); i++) {
                if (i % 2 == 0) { // Even
                    string.append(String.valueOf(value.charAt(i)).toUpperCase());
                } else { // Odd
                    string.append(String.valueOf(value.charAt(i)).toLowerCase());
                }
            }
            strArr.add(string.toString());
            string = new StringBuilder();
        }

        for (int i = 0; i < strArr.size(); i++) {
            answer.append(strArr.get(i));

            if (i == strArr.size() -1) {
                break;
            }

            if (strArr.size() % 2 == 1) { // blank
                answer.append(" ");
            }

        }

        return answer.toString();
    }

    public static void main(String[] args) {
        System.out.println(solution("try hello world"));
    }
}
*/
```

<br>

## Another Solution

```java
class Solution {
  public String solution(String s) {

        String answer = "";
        int cnt = 0;
        String[] array = s.split("");

        for(String ss : array) {
            cnt = ss.contains(" ") ? 0 : cnt + 1;
            answer += cnt%2 == 0 ? ss.toLowerCase() : ss.toUpperCase(); 
        }
      return answer;
  }
}
```
