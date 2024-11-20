---
title: "[Programmers] 숫자 문자열과 영단어"
excerpt: "2021 카카오 채용연계형 인턴십"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-02-08
last_modified_at: 2023-02-08
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/81301)

<br>

## Solution

```java
package programmers.sully.week2;

public class 숫자_문자열과_영단어 {
    public static boolean isInteger(String strValue) {
        try {
            Integer.parseInt(strValue);
            return true;
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    // "one4seveneight"	-> 1478
    // contains를 써볼까? -> 쓴다 해도 안 될 듯
    // 아 그럼 indexOf를 써보자
    public int solution(String s) {
        StringBuilder answerSb = new StringBuilder();
        StringBuilder tmpSb = new StringBuilder();
//        char[] sToCharArr = s.toCharArray();

        // sToCharArr[i]가 문자열이면 one부터 nine까지의 case(숫자)와 동일한지 알아보기

        // 만약 문자열이 아닌 숫자형 String("1", "2"...)이라면 더해주고,
        // 문자형 String이면 StringBuilder로 append를 해주면서 case(숫자)에 적합한지 확인해주기

        // String이 문자인지 아닌지 확인 -> isInteger 메서드로 판별

        for (int i = 0; i < s.length(); i++) {
            // String.valueOf 그만 좀 쓰자
            if (isInteger(String.valueOf(s.charAt(i)))) { // 숫자형
                answerSb.append(Integer.parseInt(String.valueOf(s.charAt(i))));
            } else { // 문자형 -> StringBuilder로 append를 해주면서 case(숫자)에 적합한지 확인
                tmpSb.append(s.charAt(i));

                switch (tmpSb.toString()) {
                    case "zero" -> {
                        answerSb.append("0");
                        tmpSb = new StringBuilder();
                    }
                    case "one" -> {
                        answerSb.append("1");
                        tmpSb = new StringBuilder();
                    }
                    case "two" -> {
                        answerSb.append("2");
                        tmpSb = new StringBuilder();
                    }
                    case "three" -> {
                        answerSb.append("3");
                        tmpSb = new StringBuilder();
                    }
                    case "four" -> {
                        answerSb.append("4");
                        tmpSb = new StringBuilder();
                    }
                    case "five" -> {
                        answerSb.append("5");
                        tmpSb = new StringBuilder();
                    }
                    case "six" -> {
                        answerSb.append("6");
                        tmpSb = new StringBuilder();
                    }
                    case "seven" -> {
                        answerSb.append("7");
                        tmpSb = new StringBuilder();
                    }
                    case "eight" -> {
                        answerSb.append("8");
                        tmpSb = new StringBuilder();
                    }
                    case "nine" -> {
                        answerSb.append("9");
                        tmpSb = new StringBuilder();
                    }
                }
            }
        }

        return Integer.parseInt(answerSb.toString());
    }

    public static void main(String[] args) {
        System.out.println(new 숫자_문자열과_영단어().solution("one4seveneight"));
    }
}
```