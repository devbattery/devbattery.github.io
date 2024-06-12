---
title: "[Spring] 파일 업로드"
excerpt: "spring boot, servlet, upload"

categories:
  - Spring
tags:
  - [spring-boot, servlet, upload]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-05-09
last_modified_at: 2024-05-09
---

# 파일 업로드 소개

- *HTML 폼 전송 방식*
    - `application/x-www-form-urlencoded`
    - `multipart/form-data`

## `application/x-www-form-urlencoded` 방식

<img width="1075" alt="Screenshot 2024-05-09 at 4 17 30 PM" src="https://github.com/won4885/won4885.github.io/assets/62871026/a4501c11-591d-4746-845d-42ea5246cbbb">

- HTML 폼 데이터를 서버로 전송하는 가장 기본적인 방법
- 파일을 업로드하려면 문자가 아니라 binary 데이터를 전송해야 함
- 위 그림처럼 `username=kim&age=20`와 같이 `&`로 구분해서 전송하는 방법으로는 파일을 전송하기 어려움
    - 보통 폼을 전송할 때 파일만 전송하지 않기 때문

```
- 이름
- 나이
- 첨부파일
```

- 위 예시처럼 이름과 나이도 전송해야 하고, 첨부파일도 함께 전송해야 함
    - 이는 **문자와 binary 데이터를 동시에 전송**해야 하는 상황이 됨
    - 이 문제를 해결하기 위해 HTTP는 `multipart/form-data`라는 전송 방식을 제공

## `multipart/form-data` 방식

<img width="1078" alt="Screenshot 2024-05-09 at 4 17 41 PM" src="https://github.com/won4885/won4885.github.io/assets/62871026/fa715327-7864-4db0-a014-f875a77e8e82">

- 다른 종류의 여러 파일과 폼의 내용을 함께 전송할 수 있는 방법
- HTTP 메시지에 각각의 전송 항목이 구분되어 있음
    - `username`, `age`, `file1`
    - 폼의 일반 데이터는 각 항목별로 문자가 전송되고, 파일의 경우 `Content-Type` 추가 후 binary 데이터가 전송됨
- 즉, 각각의 항목을 구분해서, 한번에 전송하게 됨

<br>

# 서블릿 방식의 파일 업로드

<img width="1144" alt="Screenshot 2024-05-09 at 5 55 33 PM" src="https://github.com/won4885/won4885.github.io/assets/62871026/a71f9acb-12b6-4b08-8e1a-e9cc6dbef9db">

- `request.getParts()`: `multipart/form-data` 전송 방식에서 각각 나누어진 부분을 받을 수 있음
- 기본이 `true` 값인 `spring.servlet.multipart.enabled` 옵션으로 `DispatcherServlet`에서 `MultipartResolver`를 실행시킴
    - `MultipartResolver`는 멀티 파트 요청일 경우, `HttpServletRequest`를 `MultipartHttpServletRequest`로 변환해서 반환함
    - 이것을 스프링에서는 `MultipartFile`로 처리

<br>

# 스프링 방식의 파일 업로드

<img width="1072" alt="Screenshot 2024-05-09 at 6 11 31 PM" src="https://github.com/won4885/won4885.github.io/assets/62871026/c0b21141-f513-4b8a-ae47-7db43943ab9f">

- 스프링이 제공하는 기본 `MultipartResolver`는 `MultipartHttpServletRequest` 인터페이스를 구현한 `StandardMultipartHttpServletRequest`를 반환함
- 아래의 실행 로그를 보면 `MultipartFile`로 `StandardMultipartHttpServletRequest`를 반환하는 것을 알 수 있음

```
request=org.springframework.web.multipart.support.StandardMultipartHttpServletRe quest@5c022dc6
itemName=상품A
multipartFile=org.springframework.web.multipart.support.StandardMultipartHttpSer vletRequest$StandardMultipartFile@274ba730
파일 저장 fullPath=/Users/kimyounghan/study/file/스크린샷.png
```

<br>

# Reference

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-mvc-2)
