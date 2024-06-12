---
title: "[Spring] IoC 컨테이너 공식문서 번역 (Dependencies)"
excerpt: "의존성"

categories:
  - Spring
tags:
  - [ioc]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-05-12
last_modified_at: 2023-05-12
---

> 현재 [매일 공식 문서를 읽고 해석하는 챌린지](https://github.com/yeonise/daily-code-snippets)를 진행 중이며, 일주일 단위로 정리해 나가고 있습니다.

<br>

# 기록

- [Introduction to the Spring IoC Container and Beans](https://sully-tech.dev/spring/ioc-introduction/)
- [Container Overview](https://sully-tech.dev/spring/ioc-basics/)
- [Bean OverView](https://sully-tech.dev/spring/ioc-definition/)
- [Dependencies](https://sully-tech.dev/spring/ioc-dependencies/)
    - [Dependency Injection](https://sully-tech.dev/spring/ioc-factory-collaborators/)
    - [Dependencies and Configuration in Detail](https://sully-tech.dev/spring/ioc-factory-properties-detailed/)
    - [Using depends-on](https://sully-tech.dev/spring/ioc-factory-dependson/)
    - [Lazy-initialized Beans](https://sully-tech.dev/spring/ioc-factory-lazy-init/)
    - [Autowiring Collaborators](https://sully-tech.dev/spring/ioc-factory-autowire/)
    - [Method Injection](https://sully-tech.dev/spring/ioc-factory-method-injection/)

<br>

# Dependencies

A typical enterprise application does not consist of a single object (or bean in the Spring parlance). Even the simplest
application has a few objects that work together to present what the end-user sees as a coherent application. This next
section explains how you go from defining a number of bean definitions that stand alone to a fully realized application
where objects collaborate to achieve a goal.

> 일반적인 엔터프라이즈 애플리케이션은 단일 객체(또는 스프링 용어로 빈)로 구성되지 않습니다. 가장 단순한 애플리케이션조차도 최종 사용자에게 일관된 애플리케이션으로 보이기 위해 함께 작동하는 몇 가지 객체가
> 있습니다. 다음 섹션에서는 독립적으로 존재하는 여러 개의 빈 정의를 정의하는 것부터 객체들이 협업하여 목표를 달성하는 완전히 실현된 애플리케이션으로 전환하는 방법에 대해 설명합니다.

<br>

# Section Summary

> [기록](#기록)에 링크 정리해 두었습니다.

- Dependency Injection
- Dependencies and Configuration in Detail
- Using depends-on
- Lazy-initialized Beans
- Autowiring Collaborators
- Method Injection

<br>

# Reference

- [Spring 공식 문서](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#spring-core)