---
title: '[React] WebStorm에서 VSCode처럼 Prettier 적용'
excerpt: 'webstorm, prettier'

categories:
  - React
tags:
  - [webstorm, prettier]

toc: true
toc_sticky: true

sidebar:
  nav: 'categories'

date: 2025-09-19
last_modified_at: 2025-09-19
---

## WebStorm에 Prettier를 적용하는 이유

VS Code를 사용하는 개발자라면 전역 설정 한 번으로 더 이상 고민할 필요는 없겠지만, WebStorm으로 개발하고자 했을 때 formatting 부분에서 문제를 겪게 된다.

하지만 이는 간단하게 해결할 수 있다. 새로운 프로젝트마다 매번 설정해줘야 하는 건 귀찮지만 말이다.

## WebStorm 설정

처음에는 이것저것 Code Style 항목도 건드려 보고, EditorConfig 문제도 건드려 봤지만 그냥 최종적으로 이렇게만 설정해두자.

### Code Style

<img width="1343" height="996" alt="Screenshot 2025-09-19 at 7 53 26 PM" src="https://github.com/user-attachments/assets/3bca5e87-819b-4593-93e6-af33e3bd7c54" />

- Enable EnableConfig support 옵션 켜기

### Prettier

설정하기 전에, 아래의 명령어로 prettier를 이 프로젝트에 설치해주자.

- `npm install prettier`

<img width="1343" height="996" alt="Screenshot 2025-09-19 at 7 54 34 PM" src="https://github.com/user-attachments/assets/173574a7-5b09-4332-96f0-3f6e1156d01c" />

- Manual Prettier configuration 선택
  - Prettier package 선택 (방금 npm으로 설치한 prettier 패키지가 보일 것이다)
  - Run on 'Reformat Code' action 선택
- Run for files:
  - `**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts,vue,astro,css,scss,less,html,json,md,yml,yaml,graphql}` 붙여넣기
  - React 서비스에서 생성될 만한 확장자들 다 넣어버렸다.
