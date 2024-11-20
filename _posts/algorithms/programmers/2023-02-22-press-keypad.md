---
title: "[Programmers] 키패드 누르기 (Java)"
excerpt: "2020 카카오 인턴십"

categories:
  - Programmers
tags:
  - [java, algorithms]

toc: true
toc_sticky: true

date: 2023-02-22
last_modified_at: 2023-02-22
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/67256)

<br>

## Solution

```java
package programmers.sully.week4;

import java.util.HashMap;
import java.util.Map;

public class 키패드_누르기_Sully {
    // 1 2 3
    // 4 5 6
    // 7 8 9
    // * 0 #

    public static String solution(int[] numbers, String hand) {
        StringBuilder answer = new StringBuilder();

        Map<Integer, int[]> leftMap = new HashMap<>(
                Map.of(7, new int[]{0, 1}, 4, new int[]{0, 2}, 1, new int[]{0, 3}));
        Map<Integer, int[]> middleMap = new HashMap<>(
                Map.of(0, new int[]{1, 0}, 8, new int[]{1, 1}, 5, new int[]{1, 2}, 2, new int[]{1, 3})
        );
        Map<Integer, int[]> rightMap = new HashMap<>(
                Map.of(9, new int[]{2, 1}, 6, new int[]{2, 2}, 3, new int[]{2, 3})
        );

        int[] leftTmp = new int[]{0, 0};
        int[] rightTmp = new int[]{2, 0};

        for (int number : numbers) {
            if (leftMap.containsKey(number)) {
                answer.append("L");
                leftTmp = leftMap.get(number);
            } else if (rightMap.containsKey(number)) {
                answer.append("R");
                rightTmp = rightMap.get(number);
            } else { // middleMap
                int leftDis = Math.abs(middleMap.get(number)[0] - leftTmp[0]) +
                        Math.abs(middleMap.get(number)[1] - leftTmp[1]);
                int rightDis = Math.abs(middleMap.get(number)[0] - rightTmp[0]) +
                        Math.abs(middleMap.get(number)[1] - rightTmp[1]);

                if (leftDis < rightDis) {
                    answer.append("L");
                    leftTmp = middleMap.get(number);
                } else if (rightDis < leftDis) {
                    answer.append("R");
                    rightTmp = middleMap.get(number);
                } else {
                    if (hand.equals("left")) {
                        answer.append("L");
                        leftTmp = middleMap.get(number);
                    } else { // right
                        answer.append("R");
                        rightTmp = middleMap.get(number);
                    }
                }
            }
        }

//        StringBuilder answer = new StringBuilder();
//        String leftTmp = "*";
//        String rightTmp = "#";
//
//        for (int i = 0; i < numbers.length; i++) {
//            if (numbers[i] == 1 || numbers[i] == 4 || numbers[i] == 7) {
//                answer.append("L");
//                System.out.println(numbers[i] + ": answer.append(\"L\")");
//                leftTmp = String.valueOf(numbers[i]);
//                continue;
//            } else if (numbers[i] == 3 || numbers[i] == 6 || numbers[i] == 9) {
//                answer.append("R");
//                System.out.println(numbers[i] + ": answer.append(\"R\")");
//                rightTmp = String.valueOf(numbers[i]);
//                continue;
//            }
//
//            // numbers[i] -> 2, 5, 8, 0 경우로만 구현 (위에 continue 있으니, if 쓸 필요 x)
//
//            if (numbers[i] == 2) {
//
//            } else if (numbers[i] == 5) {
//
//            } else if (numbers[i] == 8) {
//
//            } else if (numbers[i] == 0)
//
//            // 거리가 동일할 때
//            if (leftTmp.equals("1") && rightTmp.equals("3")
//                    || leftTmp.equals("4") && rightTmp.equals("6")
//                    || leftTmp.equals("7") && rightTmp.equals("9")
//                    || leftTmp.equals("*") && rightTmp.equals("#")) {
//                if (hand.equals("left")) { // 왼손잡이냐
//                    answer.append("L");
//                    System.out.println(numbers[i] + ": answer.append(\"L\")");
//                } else { // hand.equals("right") // 오른손잡이냐
//                    answer.append("R");
//                    System.out.println(numbers[i] + ": answer.append(\"R\")");
//                }
//            }
//
//            // 거리가 다를 때 -> 위치 비교 로직
//
//        }

        return answer.toString();
    }

    public static void main(String[] args) {
        System.out.println(solution(new int[]{1, 3, 4, 5, 8, 2, 1, 4, 5, 9, 5}, "right"));
    }
}
```