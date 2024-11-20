---
title: "[Programmers] 다트 게임 (Java)"
excerpt: "2018 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2023-02-19
last_modified_at: 2023-02-19
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/17682)

<br>

## Solution

```java
package programmers.sully.week3;

class 다트_게임 {
    /*
     * 로직
     * 게임은 총 3번의 기회
     * 점수: 0점 ~ 10점
     * 점수 -> Single(S), Double(D), Triple(T) 영역 존재 -> 당첨 시, 점수에 각각 1, 2, 3 제곱
     * "*" -> 해당 점수와 바로 전에 얻은 정수를 2배로
     * "#" -> 해당 정수 마이너스
     * "*" -> 첫번째 가능 -> 이 경우 첫번째 "*"의 점수만 2배
     * "*"의 효과 -> 다른 "*"와 중첩 가능 -> 이 경우 중첩된 "*" 점수는 4배
     * "*"의 효과 -> "#"의 효과와 중첩 가능 -> 이 경우 중첩된 "#" 점수는 -2배
     * Single(S), Double(D), Triple(T)은 점수마다 하나씩 존재
     * "*", "#"은 점수마다 둘 중 하나만 존재 or 존재 X
     */

    /*
     * 정수는 0 ~ 10 사이의 정수
     * 보너스는 S, D, T 중 하나
     * 옵션은 "*" 혹은 "#" 하나 -> 없을 수도 있음
     */

    // 0 ~ 10의 정수와 문자 S, D, T, *, #로 구성된 문자열이 입력될 시 총점수를 반환하는 메서드 작성
    public int solution(String dartResult) {
        StringBuilder tmpAnswer = new StringBuilder(); // 0부터 10까지의 정수니 String 형태로 생성
        int answer = 0;
//        char[] chars = dartResult.toCharArray();
        int[] chances = new int[3]; // 다트 게임은 총 3번의 기회
        int index = 0;
        for (int i = 0; i < dartResult.length(); i++) {
            char c = dartResult.charAt(i);
            switch (c) {
                case 'S' -> {
                    chances[index] = Integer.parseInt(tmpAnswer.toString()); // Integer 형태로 배열에 저장
                    index++;
                    tmpAnswer = new StringBuilder(); // 이때 tmpAnswer 초기화
                }
                case 'D' -> {
                    chances[index] = Integer.parseInt(tmpAnswer.toString()); // Integer 형태로 배열에 저장
                    chances[index] = (int) Math.pow(chances[index], 2);
                    index++;
                    tmpAnswer = new StringBuilder(); // 이때 tmpAnswer 초기화
                }
                case 'T' -> {
                    chances[index] = Integer.parseInt(tmpAnswer.toString()); // Integer 형태로 배열에 저장
                    chances[index] = (int) Math.pow(chances[index], 3);
                    index++;
                    tmpAnswer = new StringBuilder(); // 이때 tmpAnswer 초기화
                }
                case '*' -> {
                    if (index > 1) {
                        chances[index - 2] *= 2;
                    }
                    chances[index - 1] *= 2;
                }
                case '#' -> chances[index - 1] *= -1;
                default -> tmpAnswer.append(c);
            }

//            if (isInteger(chars[i])) { // 이때 tmpAnswer 초기화
//                answer += tmpAnswer; // 그동안 했던 연산을 더해주고
//                tmpAnswerList.add(tmpAnswer); // *과 #을 위해 List 배열에 담아준다 (그 전의 tmpAnswer 값을 알아야 하니)
//                tmpAnswer = Integer.parseInt(String.valueOf(chars[i])); // 초기화
//            }
//
//            if (chars[i] == 'S') { // 여기부터는 문자가 들어올 때 tmpAnswer를 가지고 계속 조립해주면 됨
//                Math.pow(tmpAnswer, 1);
//            } else if (chars[i] == 'D') {
//                Math.pow(tmpAnswer, 2);
//            } else if (chars[i] == 'T') {
//                Math.pow(tmpAnswer, 3);
//            }
//
//            // i-1에서의 tmpAnswer도 2배를 해줘야 함 -> tmpAnswerList를 만들어서 i-1번째 거를 찾아보자
//            if (chars[i] == '*') {
//            } else if (chars[i] == '#') {
//
//            }
        }

        for (int chance : chances) {
            answer += chance;
        }

        return answer;
    }

    /*
    예제	/ dartResult / answer / 설명
    1 / 1S2D*3T	/ 37 / 1^1 * 2 + 2^2 * 2 + 3^3
    2 / 1D2S#10S / 9 / 1^2 + 2^1 * (-1) + 10^1
    3 / 1D2S0T / 3 / 1^2 + 2^1 + 0^3
    4 / 1S*2T*3S / 23 / 1^1 * 2 * 2 + 2^3 * 2 + 3^1
    5 / 1D#2S*3S / 5 / 1^2 * (-1) * 2 + 2^1 * 2 + 3^1
    6 / 1T2D3D# / -4 / 1^3 + 2^2 + 3^2 * (-1)
    7 / 1D2S3T* / 59 / 1^2 + 2^1 * 2 + 3^3 * 2
    */

//    private boolean isInteger(char c) {
//        try {
//            Integer.parseInt(String.valueOf(c));
//            return true;
//        } catch (NumberFormatException e) {
//            return false;
//        }
//    }
}
```