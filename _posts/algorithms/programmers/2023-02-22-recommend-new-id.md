---
title: "[Programmers] 신규 아이디 추천 (Java)"
excerpt: "2021 KAKAO BLIND RECRUITMENT"

categories:
  - Programmers
tags:
  - [java, algorithms]

toc: true
toc_sticky: true

date: 2023-02-22
last_modified_at: 2023-02-22
---

- [Reference](https://school.programmers.co.kr/learn/courses/30/lessons/72410)

<br>

## Solution

```java
package programmers.sully.week4;

public class 신규_아이디_추천_Sully {
    public static String solution(String new_id) {
        String answer = ""; // 길이: 3자 이상 ~ 15자 이하

        // 1단계
        // (모든 대문자를 대응되는 소문자로 치환)
        new_id = new_id.toLowerCase();

        // 2단계
        // (알파벳 소문자, 숫자, 빼기(-), 밑줄(_), 마침표(.)를 제외한 모든 문자를 제거)
        new_id = new_id.replaceAll("[^0-9a-z._-]", "");

        // 3단계
        // (마침표(.)가 2번 "이상" 연속된 부분을 하나의 마침표(.)로 치환)
        new_id = new_id.replaceAll("[.]{2,}", "."); // 점의 개수가 홀수일 때

        // 4단계
        // (마침표(.)가 처음이나 끝에 위치한다면 제거)
        if (new_id.charAt(0) == '.') { // 처음
            new_id = new_id.substring(1);
        }
        // new_id.length() > 0: 이 조건은 5단계 때문에 넣어줌
        if (new_id.length() > 0 && new_id.charAt(new_id.length() - 1) == '.') {
            new_id = new_id.substring(0, new_id.length() - 1);
        }

        // 5단계
        // (빈 문자열이라면, new_id에 "a"를 대입)
        if (new_id.equals("")) {
            new_id = "a";
        }

        // 6, 7단계 (new_id 길이 조건) if 문으로

        // 6단계
        // (new_id의 길이가 16자 이상이면, new_id의 첫 15개의 문자를 제외한 나머지 문자들을 모두 제거
        // 만약 제거 후 마침표(.)가 new_id의 끝에 위치한다면 끝에 위치한 마침표(.) 문자를 제거)
        if (new_id.length() >= 16) {
            new_id = new_id.substring(0, 15);
        }
        // new_id.length() > 0: 이 조건 넣어줄지 말지는 나중에 결정 *****************
        if (new_id.charAt(new_id.length() - 1) == '.') {
            new_id = new_id.substring(0, new_id.length() - 1);
        }

        // 7단계
        // (7단계 new_id의 길이가 2자 이하라면,
        // new_id의 마지막 문자를 new_id의 길이가 3이 될 때까지 반복해서 끝에 붙임)
            StringBuilder new_idBuilder = new StringBuilder(new_id);
            while (new_idBuilder.length() <= 2) {
                new_idBuilder.append(new_idBuilder.charAt(new_idBuilder.length() - 1));
            }
            new_id = new_idBuilder.toString();

        answer = new_id;
        return answer;
    }

    public static void main(String[] args) {
//        String tmp = "aaaaaaaaaaaaaaaa";
//        if (tmp.length() >= 16) {
//            tmp = tmp.substring(0, 15);
//        }
//        System.out.println(tmp);

//        System.out.println(solution("....!@BaT#*.....y.abcdefghijklm."));
        System.out.println(solution("....!@BaT#*....y.abcdefghijklm."));
//        System.out.println(solution("...!@BaT#*..y.abcdefghijklm."));
//        System.out.println(solution("."));
//        System.out.println(solution("z-_+.^."));

        System.out.println(solution("...!@BaT#*..y.abcdefghijklm"));
        System.out.println(solution("z-+.^."));
        System.out.println(solution("=.="));
        System.out.println(solution("123_.def"));
        System.out.println(solution("abcdefghijklmn.p"));
    }
}
```