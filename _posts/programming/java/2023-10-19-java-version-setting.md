---
title: "[Java] M1 Mac OS 환경 - Java JDK 17 설정"
excerpt: "M1 Pro 환경"

categories:
  - Java
tags:
  - [setting]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-10-19
last_modified_at: 2023-10-19
---

> Java 19 버전에서 Java 17 버전으로 변경하는 내용입니다. <br>
> 이미 Java 17 버전이 설치되어 있기에 다운로드는 포함되어 있지 않습니다.

<br>

# 1. Java 버전 확인

```zsh
java -version
```

<img width="961" alt="스크린샷 2023-10-19 오후 3 42 30" src="https://github.com/won4885/won4885.github.io/assets/62871026/d61be9fb-d156-4f30-8065-eedc2602aa45">

<br>

# 2. 현재 설치되어 있는 Java 버전 목록 확인

```zsh
/usr/libexec/java_home -V
```

<img width="1502" alt="스크린샷 2023-10-19 오후 3 40 52" src="https://github.com/won4885/won4885.github.io/assets/62871026/4a799806-0bbb-4aca-bd06-9c5e3c777c69">

- 바꾸고자 하는 Java 17 버전이 설치되어 있으므로 그대로 진행

<br>

# 3. zsh 환경 변수 설정

```zsh
vim ~/.zshrc
```

<img width="703" alt="스크린샷 2023-10-19 오후 3 41 09" src="https://github.com/won4885/won4885.github.io/assets/62871026/a39d426c-912b-488d-843e-0e6316180dcc">

- 나는 현재 bash가 아닌, zsh를 사용하고 있기 때문에 `zshrc`에서 설정

<br>

```zsh
# JAVA JDK
export JAVA_HOME_17=$(/usr/libexec/java_home -v17)
export JAVA_HOME=$JAVA_HOME_17
```

<img width="719" alt="스크린샷 2023-10-19 오후 3 49 35" src="https://github.com/won4885/won4885.github.io/assets/62871026/dc5fd5eb-7669-410e-a2ab-c4e94b08e032">

- Java 17 버전의 환경 변수를 설정해야 하기 때문에 `JAVA_HOME` 추가

<br>

# 4. zsh 환경 변수 설정 저장

```zsh
source ~/.zshrc
```

<img width="735" alt="스크린샷 2023-10-19 오후 3 41 13" src="https://github.com/won4885/won4885.github.io/assets/62871026/bdde4890-6efb-42a5-861f-5d36ec5189d3">

<br>

# 5. 변경된 Java 버전 확인

```zsh
java -version
```

<img width="1161" alt="스크린샷 2023-10-19 오후 3 41 20" src="https://github.com/won4885/won4885.github.io/assets/62871026/b230cc2a-7d1c-42d5-8a4b-c6fd0cb6745f">