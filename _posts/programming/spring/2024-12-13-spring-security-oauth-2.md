---
title: "[Spring Security] OAuth2 공식 문서 번역 (2)"
excerpt: "spring-security, oauth"

categories:
  - Spring
tags:
  - [spring-security, oauth]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-12-13
last_modified_at: 2024-12-13
---

> [해당 공식 문서 원본 링크](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/index.html)

# OAuth 2.0 로그인

OAuth 2.0 로그인 기능을 사용하면 애플리케이션에서 사용자가 OAuth 2.0 제공업체(예: GitHub) 또는 OpenID Connect 1.0 제공업체(예: Google)의 기존 계정을 사용하여 애플리케이션에 로그인하도록 할 수 있습니다. OAuth 2.0 로그인은 "Google로 로그인" 또는 "GitHub로 로그인"이라는 두 가지 사용 사례를 구현합니다.

OAuth 2.0 로그인은 OAuth 2.0 인증 프레임워크 및 OpenID Connect Core 1.0에 지정된 대로 **인증 코드 부여(Authorization Code Grant)** 를 사용하여 구현됩니다.

**섹션 요약**

- [핵심 구성 (Core Configuration)](#핵심-구성)
- [고급 구성 (Advanced Configuration)](#고급-구성)
- [OIDC 로그아웃 (OIDC Logout)](#oidc-로그아웃)
